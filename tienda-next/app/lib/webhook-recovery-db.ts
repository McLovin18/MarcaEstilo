/**
 * 🔄 WEBHOOK RECOVERY PARA STRIPE
 * 
 * Resuelve edge case crítico:
 * - Usuario paga con tarjeta
 * - PaymentIntent exitoso en Stripe
 * - Pero webhook no llega (timeout, crash, etc)
 * - Orden queda "pending payment" forever
 * - Dinero cobrado pero stock no actualizado
 * 
 * ✔ SOLUCIÓN:
 * - Verificar órdenes "pending" hace > 30 min
 * - Si Stripe confirma que pagó → marcar como confirmada
 * - Liberar/ajustar stock automáticamente
 */

import admin from "./firebase-admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const PENDING_THRESHOLD_MINUTES = 30; // Órdenes pending hace > 30 min

interface PendingOrder {
  id: string;
  stripePaymentIntentId: string;
  status: "pending_payment";
  createdAt: Date;
  total: number;
  userId: string;
  email: string;
}

/**
 * ✅ Buscar órdenes pendientes hace demasiado tiempo
 */
export async function findStalePendingOrders(): Promise<PendingOrder[]> {
  try {
    const db = admin.firestore();
    const now = new Date();
    const threshold = new Date(now.getTime() - PENDING_THRESHOLD_MINUTES * 60000);

    const snapshot = await db
      .collection("ordenes")
      .where("status", "==", "pending_payment")
      .where("createdAt", "<=", threshold)
      .limit(50)
      .get();

    const stale: PendingOrder[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      stale.push({
        id: doc.id,
        stripePaymentIntentId: data.stripePaymentIntentId,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        total: data.total || 0,
        userId: data.userId || "",
        email: data.email || "",
      });
    });

    return stale;
  } catch (err: any) {
    console.error("[webhook-recovery] Error finding stale orders:", err);
    throw err;
  }
}

/**
 * ✅ Verificar si Stripe confirma que pagó
 */
export async function verifyStripePayment(
  paymentIntentId: string
): Promise<{
  paid: boolean;
  status: string;
  amount: number;
  error?: string;
}> {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      paid: intent.status === "succeeded",
      status: intent.status,
      amount: intent.amount_received / 100, // Convertir de centavos a dólares
    };
  } catch (err: any) {
    console.error(`[webhook-recovery] Error verifying payment ${paymentIntentId}:`, err);
    return {
      paid: false,
      status: "error",
      amount: 0,
      error: err.message,
    };
  }
}

/**
 * ✅ Recuperar orden pendiente (marcar como pagada)
 */
export async function recoverStalePendingOrder(
  orderId: string,
  stripePaymentIntentId: string,
  items: Array<{ productId: string; cantidad: number }>,
  email: string
): Promise<{
  success: boolean;
  recovered: boolean; // true si se recuperó, false si fue un falso positivo
  error?: string;
}> {
  try {
    const db = admin.firestore();

    // 1️⃣ Verificar estado en Stripe
    const stripeVerification = await verifyStripePayment(stripePaymentIntentId);

    if (!stripeVerification.paid) {
      console.log(
        `ℹ️  [RECOVERY] Order ${orderId} not paid in Stripe (status: ${stripeVerification.status})`
      );
      // Falso positivo, no hacer nada más
      return { success: true, recovered: false };
    }

    // 2️⃣ Sí pagó en Stripe, actualizar orden a "paid"
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection("ordenes").doc(orderId);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error(`Order ${orderId} not found`);
      }

      const orderData = orderDoc.data();

      // Verificar que no se haya recuperado ya
      if (orderData.status !== "pending_payment") {
        console.log(`ℹ️  [RECOVERY] Order ${orderId} already has status: ${orderData.status}`);
        return; // Nada que hacer
      }

      // 3️⃣ Marcar orden como pagada
      transaction.update(orderRef, {
        status: "paid",
        recoveredBy: "webhook_recovery",
        recoveredAt: admin.firestore.Timestamp.now(),
      });

      // 4️⃣ Decrementar stock (si no estaba ya decrementado)
      if (!orderData.stockDecremented) {
        for (const item of items) {
          const productRef = db.collection("productos").doc(item.productId);
          const productDoc = await transaction.get(productRef);

          if (productDoc.exists) {
            const currentStock = Number(productDoc.data()?.stock || 0);
            const newStock = Math.max(0, currentStock - item.cantidad);

            transaction.update(productRef, {
              stock: newStock,
              stockHistory: admin.firestore.FieldValue.arrayUnion({
                type: "order_paid",
                cantidad: item.cantidad,
                orderId,
                reason: "webhook_recovery",
                timestamp: admin.firestore.Timestamp.now(),
              }),
            });
          }
        }

        // Marcar que se decrementó stock
        transaction.update(orderRef, {
          stockDecremented: true,
        });
      }
    });

    console.log(
      `✅ [RECOVERY] Order ${orderId} recovered! Status: pending → paid (via webhook recovery)`
    );

    return { success: true, recovered: true };
  } catch (err: any) {
    console.error(`❌ [webhook-recovery] Error recovering order ${orderId}:`, err);
    return { success: false, recovered: false, error: err.message };
  }
}

/**
 * ✅ Ejecutar recuperación completa
 */
export async function runWebhookRecovery(): Promise<{
  totalStale: number;
  recovered: number;
  errors: number;
}> {
  try {
    console.log(`🔄 [RECOVERY] Starting webhook recovery...`);

    const staleOrders = await findStalePendingOrders();

    if (staleOrders.length === 0) {
      console.log(`✅ [RECOVERY] No stale orders found`);
      return { totalStale: 0, recovered: 0, errors: 0 };
    }

    let recovered = 0;
    let errors = 0;

    for (const order of staleOrders) {
      try {
        // Necesitamos los items de la orden para ajustar stock
        const db = admin.firestore();
        const orderDoc = await db.collection("ordenes").doc(order.id).get();

        if (!orderDoc.exists) continue;

        const orderData = orderDoc.data();
        const items = orderData.items || [];

        const result = await recoverStalePendingOrder(
          order.id,
          order.stripePaymentIntentId,
          items,
          order.email
        );

        if (result.success && result.recovered) {
          recovered++;
        } else if (!result.success) {
          errors++;
        }
      } catch (err: any) {
        console.error(`[recovery] Error processing order ${order.id}:`, err);
        errors++;
      }
    }

    console.log(
      `✅ [RECOVERY] Completed. Total stale: ${staleOrders.length}, Recovered: ${recovered}, Errors: ${errors}`
    );

    return { totalStale: staleOrders.length, recovered, errors };
  } catch (err: any) {
    console.error("[webhook-recovery] Fatal error:", err);
    return { totalStale: 0, recovered: 0, errors: 1 };
  }
}

/**
 * ✅ Health check para monitoreo
 */
export async function getWebhookRecoveryStats(): Promise<{
  pendingOrders: number;
  pendingOrdersOlderThan30min: number;
  lastRecoveryRun?: Date;
  lastRecoveryResult?: {
    recovered: number;
    errors: number;
  };
}> {
  try {
    const db = admin.firestore();
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);

    // Contar todas las órdenes pending
    const allPendingSnap = await db
      .collection("ordenes")
      .where("status", "==", "pending_payment")
      .count()
      .get();

    // Contar pending hace > 30 min (las que necesitan recovery)
    const stalePendingSnap = await db
      .collection("ordenes")
      .where("status", "==", "pending_payment")
      .where("createdAt", "<=", thirtyMinutesAgo)
      .count()
      .get();

    return {
      pendingOrders: allPendingSnap.data().count || 0,
      pendingOrdersOlderThan30min: stalePendingSnap.data().count || 0,
    };
  } catch (err: any) {
    console.error("[webhook-recovery] Error getting stats:", err);
    return {
      pendingOrders: 0,
      pendingOrdersOlderThan30min: 0,
    };
  }
}
