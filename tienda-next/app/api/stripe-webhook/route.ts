import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import admin from "../../lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

export const runtime = "nodejs";

/**
 * ✅ payment_intent.succeeded: Marcar como pagada and confirma reserva
 */
async function handlePaymentSucceeded(
  event: Stripe.Event,
  db: FirebaseFirestore.Firestore
) {
  const pi = event.data.object as Stripe.PaymentIntent;
  const { orderId, reserveId } = pi.metadata || {};

  if (!orderId) {
    console.warn("[stripe-webhook] ⚠️ No orderId in metadata");
    return;
  }

  try {
    // Usar transacción para atomicidad
    await db.runTransaction(async (transaction) => {
      // 1️⃣ Buscar orden por orderId
      const orderSnap = await db
        .collection("ordenes")
        .where("orderId", "==", orderId)
        .limit(1)
        .get();

      if (orderSnap.empty) {
        console.warn(`[stripe-webhook] ⚠️ Order ${orderId} not found`);
        return;
      }

      const orderDoc = orderSnap.docs[0];
      const orderData = orderDoc.data();

      // 2️⃣ Si ya está pagada, skip
      if (orderData.status === "paid" || orderData.paymentStatus === "paid") {
        console.log(`[stripe-webhook] ℹ️ Order ${orderId} already paid, skipping`);
        return;
      }

      // 3️⃣ Marcar como pagada
      transaction.update(orderDoc.ref, {
        status: "paid",
        paymentStatus: "paid",
        stripePaymentIntentId: pi.id,
        stripePaymentIntentStatus: pi.status,
        stripeAmount: pi.amount,
        paidAt: admin.firestore.Timestamp.now(),
        stripeEventId: event.id,
        webhookReceivedAt: admin.firestore.Timestamp.now(),
      });

      // 4️⃣ Confirmar reserva de stock
      // ✅ IMPORTANTE: Stock ya fue decrementado en crearReservaStock()
      // El webhook SOLO confirma la reserva, NO decrementa otra vez
      if (reserveId) {
        const reserveRef = db.collection("stock_reserves").doc(reserveId);
        transaction.update(reserveRef, {
          status: "confirmed",
          confirmedAt: admin.firestore.Timestamp.now(),
          stripePaymentIntentId: pi.id,
        });
      }

      // 5️⃣ NUNCA decrementar stock en webhook
      // El stock fue decrementado ATOMICAMENTE en crearReservaStock()
      // Confirmar mediante stockDecremented flag
      transaction.update(orderDoc.ref, {
        stockDecremented: true,
        webhookConfirmedPayment: true,
      });
    });

    console.log(
      `✅ [PAYMENT_SUCCEEDED] Order ${orderId} | Intent: ${pi.id} | ` +
      `Amount: $${(pi.amount / 100).toFixed(2)} | Reserve: ${reserveId || "N/A"}`
    );
  } catch (err: any) {
    console.error(
      `❌ [stripe-webhook] Error in payment.succeeded for ${orderId}:`,
      err
    );
    throw err; // Re-throw para que Stripe reintente
  }
}

/**
 * ❌ payment_intent.payment_failed: Liberar reserva
 */
async function handlePaymentFailed(
  event: Stripe.Event,
  db: FirebaseFirestore.Firestore
) {
  const pi = event.data.object as Stripe.PaymentIntent;
  const { orderId, reserveId } = pi.metadata || {};

  if (!orderId) {
    console.warn("[stripe-webhook] ⚠️ No orderId in metadata");
    return;
  }

  try {
    // 1️⃣ Actualizar orden
    const orderSnap = await db
      .collection("ordenes")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (!orderSnap.empty) {
      await orderSnap.docs[0].ref.update({
        status: "payment_failed",
        paymentStatus: "failed",
        stripePaymentIntentStatus: pi.status,
        failureReason: pi.last_payment_error?.message || "Unknown error",
        stripeEventId: event.id,
        webhookReceivedAt: admin.firestore.Timestamp.now(),
      });
    }

    // 2️⃣ Liberar reserva
    if (reserveId) {
      const reserveRef = db.collection("stock_reserves").doc(reserveId);
      await reserveRef.update({
        status: "released",
        releasedAt: admin.firestore.Timestamp.now(),
        releasedBy: "payment_failed",
        reason: "payment_intent.payment_failed",
      });

      // 3️⃣ Retornar stock
      const reserveDoc = await reserveRef.get();
      if (reserveDoc.exists) {
        const items = (reserveDoc.data()?.items || []) as Array<{
          productId: string;
          cantidad: number;
        }>;

        for (const item of items) {
          const productRef = db.collection("productos").doc(item.productId);
          await productRef.update({
            stock: admin.firestore.FieldValue.increment(item.cantidad),
            stockHistory: admin.firestore.FieldValue.arrayUnion({
              type: "payment_failed_release",
              cantidad: item.cantidad,
              reserveId,
              reason: "payment_intent.payment_failed",
              timestamp: admin.firestore.Timestamp.now(),
            }),
          });
        }
      }
    }

    console.log(
      `❌ [PAYMENT_FAILED] Order ${orderId} | Intent: ${pi.id} | ` +
      `Reason: ${pi.last_payment_error?.message} | Reserve released: ${reserveId || "N/A"}`
    );
  } catch (err: any) {
    console.error(
      `❌ [stripe-webhook] Error in payment.payment_failed for ${orderId}:`,
      err
    );
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Invalid signature:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Verificar livemode
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const expectLive = secretKey.startsWith("sk_live_");
  if (typeof event.livemode === "boolean" && event.livemode !== expectLive) {
    console.warn(
      `[stripe-webhook] Ignoring event ${event.id} (livemode=${event.livemode})`
    );
    return NextResponse.json({ received: true });
  }

  const db = admin.firestore();

  // 🔒 IDEMPOTENCY: Verificar que no procesamos este evento antes
  const eventDocRef = db.collection("stripe_webhook_events").doc(event.id);
  const eventDoc = await eventDocRef.get();

  if (eventDoc.exists) {
    console.log(
      `♻️ [STRIPE_WEBHOOK] Event ${event.id} already processed, returning cached`
    );
    return NextResponse.json({ success: true, cached: true });
  }

  try {
    console.log(`🪝 [STRIPE_WEBHOOK] Processing event: ${event.type} (${event.id})`);

    // Procesar evento
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event, db);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event, db);
        break;

      case "charge.refunded":
        // TODO: Puede refundar dinero + return stock
        console.log(`ℹ️ [STRIPE_WEBHOOK] charge.refunded - TODO`);
        break;

      default:
        console.log(`ℹ️ [STRIPE_WEBHOOK] Unhandled event: ${event.type}`);
    }

    // ✅ Marcar evento como procesado
    await eventDocRef.set({
      eventId: event.id,
      type: event.type,
      processedAt: admin.firestore.Timestamp.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`❌ [stripe-webhook] Error:`, err);

    // Guardar error para debugging
    await eventDocRef.set({
      eventId: event.id,
      type: event.type,
      error: err.message,
      failedAt: admin.firestore.Timestamp.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // IMPORTANTE: Still return 200 so Stripe retries later
    // Webhook recovery will handle it
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        info: "Will be recovered by webhook_recovery",
      },
      { status: 200 }
    );
  }
}
