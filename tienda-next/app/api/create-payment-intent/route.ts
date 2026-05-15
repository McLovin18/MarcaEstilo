import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import admin from "../../lib/firebase-admin";
import {
  crearReservaStock,
  confirmarReserva,
  generarIdempotencyKey,
  guardarIdempotencyKey,
  existeIdempotencyKey,
} from "../../lib/stock-reserves-db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

export const runtime = "nodejs";

/**
 * 🔐 STRIPE CHECKOUT - ESCALABILIDAD Y SEGURIDAD
 * 
 * ⚠️  VALIDACIONES CRÍTICAS:
 * 1. ✅ Cantidad razonable (anti-ataque masivo)
 * 2. ✅ Price boundaries (defensa contra corrupción)
 * 3. ✅ Stock ATOMIC reservation (previene race condition)
 * 4. ✅ Snapshot de precios (protección contra disputas)
 * 5. ✅ Idempotency keys (anti-replay attacks)
 * 6. ✅ Batch reads (getAll para performance)
 */
const MAX_QUANTITY_PER_ITEM = 10;  // Límite máximo por producto
const MIN_PRICE = 0.01;             // Precio mínimo permitido
const MAX_PRICE = 10000;            // Precio máximo permitido (protección)

export async function POST(req: NextRequest) {
  try {
    const { carrito, email, visitDate, visitTime, userId } = await req.json();

    // ─────── VALIDACIÓN 1: Estructura básica ───────
    if (!Array.isArray(carrito) || carrito.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }
    
    if (!email || typeof email !== "string" || email.trim() === "" || 
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Correo electrónico inválido" }, { status: 400 });
    }

    // ─────── VALIDACIÓN 2: Cantidad por producto ───────
    for (const item of carrito) {
      const cantidad = Number(item.cantidad || 1);
      if (cantidad > MAX_QUANTITY_PER_ITEM) {
        return NextResponse.json(
          { error: `Cantidad máxima permitida por producto: ${MAX_QUANTITY_PER_ITEM}` },
          { status: 400 }
        );
      }
      if (cantidad < 1) {
        return NextResponse.json({ error: "Cantidad debe ser al menos 1" }, { status: 400 });
      }
    }

    // ─────── ANTI-REPLAY: Check Idempotency Key ───────
    const idempotencyKey = generarIdempotencyKey(
      userId || email,
      carrito.map((i: any) => ({ id: i.id, cantidad: i.cantidad }))
    );

    const yaProcesado = await existeIdempotencyKey(idempotencyKey);
    if (yaProcesado) {
      return NextResponse.json(
        { error: "Esta solicitud ya fue procesada. Evitando duplicado." },
        { status: 409 } // Conflict - para que cliente sepa reintentar
      );
    }

    const db = admin.firestore();
    let total = 0;
    const productosProcesados: any[] = [];
    const stockReserveItems: any[] = [];

    // ─────── BATCH READ: Obtener todos los productos ───────
    const productRefs: Map<string, FirebaseFirestore.DocumentReference> = new Map();
    for (const item of carrito) {
      if (item?.id && !productRefs.has(item.id)) {
        productRefs.set(item.id, db.collection("productos").doc(item.id));
      }
    }

    const productSnaps = await db.getAll(...Array.from(productRefs.values()));
    const productDataMap = new Map<string, any>();
    
    for (const snap of productSnaps) {
      if (snap.exists) {
        productDataMap.set(snap.id, snap.data());
      }
    }

    // ─────── PROCESAR CARRITO CON VALIDACIONES ───────
    for (const item of carrito) {
      if (!item?.id) continue;
      
      const data = productDataMap.get(item.id);
      if (!data) {
        return NextResponse.json(
          { error: `Producto ${item.id} no existe` },
          { status: 400 }
        );
      }

      const cantidad = Number(item.cantidad || 1);
      const basePrice = Number(data.precio || 0);
      const discount = Number(data.descuento || 0);

      // ⚠️ VALIDACIÓN 3: Price Boundaries (previene corrupción de datos)
      if (basePrice < MIN_PRICE || basePrice > MAX_PRICE) {
        console.warn(`⚠️  Precio fuera de rango para ${data.nombre}: $${basePrice}`);
        return NextResponse.json(
          { error: `Producto "${data.nombre}" tiene precio inválido. Contacta soporte.` },
          { status: 400 }
        );
      }

      const hasDiscount = discount > 0 && discount < 100;
      const unitPrice = hasDiscount ? basePrice * (1 - discount / 100) : basePrice;
      const lineTotal = unitPrice * cantidad;
      const stock = Number(data.stock || 0);

      // ⚠️ VALIDACIÓN 4: Stock disponible (se reservará atomically después)
      if (stock < cantidad) {
        return NextResponse.json(
          { 
            error: `Stock insuficiente para "${data.nombre}". Disponibles: ${stock}, Solicitados: ${cantidad}` 
          },
          { status: 400 }
        );
      }

      total += lineTotal;

      // 💾 Guardar para snapshot
      productosProcesados.push({
        id: item.id,
        nombre: data.nombre,
        cantidad,
        precioBase: basePrice,
        descuento: hasDiscount ? discount : 0,
        precioUnitario: unitPrice,
        subtotal: lineTotal,
        imagenes: data.imagenes || [],
        precioSnapshot: {
          base: basePrice,
          descuento: discount,
          final: unitPrice,
          timestamp: Date.now(),
        },
        stockSnapshot: stock,
      });

      // Para la reserva de stock
      stockReserveItems.push({
        productId: item.id,
        cantidad,
        snapshot: {
          precio: unitPrice,
          stock,
          nombre: data.nombre,
        },
      });
    }

    if (productosProcesados.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron productos válidos" },
        { status: 400 }
      );
    }

    // ─────── CREAR RESERVA DE STOCK (ATÓMICA) ───────
    // Esto usa runTransaction internamente para evitar race conditions
    const reservaResult = await crearReservaStock(
      userId || `guest-${email}`,
      email.trim(),
      stockReserveItems,
      { carrito: carrito.length, total }
    );

    if (!reservaResult.success) {
      console.error(`❌ Error creando reserva de stock:`, reservaResult.error);
      return NextResponse.json(
        { error: `No fue posible reservar el stock: ${reservaResult.error}` },
        { status: 400 }
      );
    }

    const reserveId = reservaResult.reserveId;

    // ─────── GENERAR ORDEN ID SECUENCIAL ───────
    const metaRef = db.collection("ordenes_meta").doc("counter");
    const orderId: string = await db.runTransaction(async (tx) => {
      const snap = await tx.get(metaRef);
      const last = snap.exists ? (snap.data()?.lastNumber || 0) : 0;
      const next = last + 1;
      tx.set(metaRef, { lastNumber: next }, { merge: true });
      return `ord-${String(next).padStart(5, "0")}`;
    });

    // ─────── CREAR STRIPE PAYMENT INTENT PRIMERO ───────
    // Se crea ANTES de guardar en Firestore para tener el ID de Stripe
    const currency = process.env.NEXT_PUBLIC_STRIPE_CURRENCY || "usd";
    const amountInCents = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency,
        payment_method_types: ["card"],
        receipt_email: email,
        metadata: {
          orderId,
          email,
          reserveId,
        },
        description: `TecnoThings – Orden ${orderId}`,
      },
      {
        // 🔒 Idempotency key como header HTTP (no en body)
        idempotencyKey: idempotencyKey,
      }
    );

    // ─────── CREAR ORDEN EN FIRESTORE (CON STRIPE ID) ───────
    const orderData = {
      orderId,
      userId: userId || null,
      ...(userId ? { userEmail: email.trim() } : { guestEmail: email.trim() }),
      productos: productosProcesados,
      total,
      status: "pending_payment", // ← Importante para webhook recovery
      metodoPago: "stripe",
      visitaFecha: visitDate || null,
      visitaHora: visitTime || null,
      // 🔒 Stock reservation tracking
      stockReservation: {
        reserveId,
        status: "pending", // Se volverá "confirmed" cuando pague en Stripe
        createdAt: admin.firestore.Timestamp.now(),
      },
      // 🔒 WEBHOOK RECOVERY: Guardar Stripe Intent ID
      stripePaymentIntentId: paymentIntent.id,
      stripePaymentIntentStatus: paymentIntent.status,
      stripeCreatedAt: admin.firestore.Timestamp.fromDate(
        new Date(paymentIntent.created * 1000)
      ),
      idempotencyKey,
      createdAt: admin.firestore.Timestamp.now(),
      // Para debugging de webhook recovery
      webhookReceivedAt: null, // Se actualiza cuando webhook llega
      stockDecremented: false, // Se marca true cuando stock se decrementa realmente
    };
    const docRef = await db.collection("ordenes").add(orderData);

    // ─────── GUARDAR IDEMPOTENCY KEY ───────
    await guardarIdempotencyKey(idempotencyKey, {
      orderId,
      firestoreId: docRef.id,
      email,
    });

    // ─────── LOGGING DE AUDITORÍA ───────
    console.log(
      `✅ [CHECKOUT_INICIADO] ${orderId} | Email: ${email} | Total: $${total.toFixed(2)} | ` +
      `Items: ${productosProcesados.length} | ReserveID: ${reserveId} | Intent: ${paymentIntent.id} | ` +
      `Status: ${paymentIntent.status}`
    );

    // ⚠️ NOTE: Stock cleanup is handled by /api/cleanup endpoint (called by Vercel Crons)
    // DO NOT initialize cleanup scheduler here

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId,
      firestoreId: docRef.id,
      reserveId,
      stripePaymentIntentId: paymentIntent.id,
      // Info para debugging
      _debug: {
        status: paymentIntent.status,
        amount: total,
        products: productosProcesados.length,
      }
    });

  } catch (err: any) {
    console.error("[create-payment-intent] ❌", err);
    return NextResponse.json(
      { error: err.message || "Error procesando el checkout" },
      { status: 500 }
    );
  }
}
