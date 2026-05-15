import { NextRequest, NextResponse } from "next/server";
import admin from "../../../lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * 💳 ENDPOINT: Rechazar Orden Pagada (Stripe)
 * 
 * Cuando el admin RECHAZA un pago de tarjeta:
 * 1. Verifica que sea una orden Stripe pagada
 * 2. Valida el monto pagado vs monto esperado
 * 3. LIBERA la reserva de stock (devoluciones)
 * 4. Marca orden como "rechazada"
 * 5. Genera email de rechazo (todo se revierte)
 * 
 * IMPORTANTE: El dinero NO se devuelve automáticamente (Stripe manual)
 * Solo se libera el stock ya que "es como si no se haya comprado"
 * 
 * SEGURIDAD: Requiere token de admin
 */

export async function POST(req: NextRequest) {
  try {
    // ✅ VERIFICAR TOKEN ADMIN
    const adminToken = req.headers.get("x-admin-token");
    const expectedToken = process.env.ADMIN_REJECT_TOKEN;
    
    if (!adminToken || !expectedToken || adminToken !== expectedToken) {
      return NextResponse.json(
        { error: "Token de admin inválido o no proporcionado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, reason = "Rechazo del administrador" } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId es requerido" },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // 🔒 TRANSACCIÓN ATÓMICA
    const resultado = await db.runTransaction(async (transaction: any) => {
      // 📖 FASE 1: TODAS LAS LECTURAS PRIMERO
      // ✅ LECTURA 1: Obtener orden
      const ordenRef = db.collection("ordenes").doc(orderId);
      const ordenSnap = await transaction.get(ordenRef);

      if (!ordenSnap.exists) {
        throw new Error(`Orden no encontrada: ${orderId}`);
      }

      const orden = ordenSnap.data() as any;

      // ✅ Validación 1: Debe ser orden Stripe
      if (orden.metodoPago !== "stripe") {
        throw new Error("Esta no es una orden de pago con tarjeta (Stripe)");
      }

      // ✅ Validación 2: No debe estar ya aprobada o rechazada
      if (orden.estado === "aprobada" || orden.estado === "rechazada") {
        throw new Error(`Orden ya tiene estado: ${orden.estado}`);
      }

      // ✅ LECTURA 2: Obtener todos los productos
      const productRefs = (orden.productos || [])
        .filter((p: any) => p?.id)
        .map((p: any) => db.collection("productos").doc(p.id));

      const productSnaps = productRefs.length > 0 
        ? await transaction.getAll(...productRefs)
        : [];

      // ✅ LECTURA 3: Obtener reserva de stock si existe
      let reserveSnap = null;
      if (orden.stockReservation && orden.stockReservation.reserveId) {
        const reserveRef = db
          .collection("stock_reserves")
          .doc(orden.stockReservation.reserveId);
        reserveSnap = await transaction.get(reserveRef);
      }

      // 📝 FASE 2: PREPARAR DATOS (sin transacción)
      const now = Timestamp.now();
      const orderAmount = Number(orden.total || 0);

      // ✏️ FASE 3: TODAS LAS ESCRITURAS DESPUÉS
      // ✅ ESCRITURA 1: Devolver stock de cada producto
      // ⚠️ IMPORTANTE: Stripe YA decrementó stock al crear checkout
      // Al rechazar, DEVOLVEMOS ese stock decrementado
      for (let i = 0; i < productSnaps.length; i++) {
        const productSnap = productSnaps[i];
        if (!productSnap.exists) continue;

        const item = orden.productos.find((p: any) => p.id === productSnap.id);
        if (!item) continue;

        const cantidad = Number(item.cantidad || 1);

        // 📈 DEVOLVER stock usando increment (atómico)
        transaction.update(productSnap.ref, {
          stock: admin.firestore.FieldValue.increment(cantidad),
          lastStockUpdateAt: now,
        });

        // 📝 Registrar en historial de producto
        const historyRef = productSnap.ref
          .collection("stock_history")
          .doc(`stripe_reject_${orderId}_${Date.now()}`);
        transaction.set(historyRef, {
          type: "stripe_order_rejected",
          cantidad: cantidad,
          orderId: orderId,
          orderIdHuman: orden.orderId || "N/A",
          reason: reason,
          timestamp: now,
        });
      }

      // ✅ ESCRITURA 2: Actualizar orden
      transaction.update(ordenRef, {
        estado: "rechazada",
        rechazadaAt: now,
        rejectedBy: "admin",
        motivoRechazo: reason,
        stockDevuelto: true,
      });

      // ✅ ESCRITURA 3: Liberar reserva de stock si existe
      if (reserveSnap && reserveSnap.exists) {
        transaction.update(reserveSnap.ref, {
          status: "rejected",
          rejectedAt: now,
          rejectedByAdmin: true,
          reason: reason,
        });
      }

      // ✅ ESCRITURA 4: Registrar en historial de auditoría
      const auditRef = db.collection("order_rejections").doc();
      transaction.set(auditRef, {
        orderId: orden.orderId || orderId,
        orderDocId: orderId,
        event: "stripe_order_rejected",
        rejectedAmount: orderAmount,
        stripePaymentIntentId: orden.stripePaymentIntentId,
        reason: reason,
        stockReturned: true,
        timestamp: now,
        rejectedBy: "admin",
      });

      console.log(
        `🚫 [STRIPE_ORDEN_RECHAZADA] ${orden.orderId || orderId} | ` +
        `Monto: $${orderAmount.toFixed(2)} | ` +
        `Stock: DEVUELTO | ` +
        `Razón: ${reason}`
      );

      return {
        orderId,
        ordenId: orden.orderId,
        estado: "rechazada",
        monto: Number(orden.total || 0),
        stockDevuelto: orden.productos?.length || 0,
        timestamp: now.toDate(),
      };
    });

    return NextResponse.json({
      success: true,
      message: `Orden ${resultado.ordenId} rechazada exitosamente. Stock devuelto.`,
      data: resultado,
    });
  } catch (error: any) {
    console.error("[api/admin/reject-stripe-order] ❌ Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al rechazar la orden",
      },
      { status: error.message?.includes("no encontrada") ? 404 : 400 }
    );
  }
}
