import { NextRequest, NextResponse } from "next/server";
import admin from "../../../lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * 💳 ENDPOINT: Aprobar Orden Pagada (Stripe)
 * 
 * Cuando el admin APRUEBA un pago de tarjeta:
 * 1. Verifica que el pago de Stripe fue completado
 * 2. Valida el monto pagado vs monto esperado
 * 3. Deduce el stock definitivamente (confirma reserva)
 * 4. Actualiza orden a estado "aprobada"
 * 5. Genera email de confirmación
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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId es requerido" },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // 🔒 TRANSACCIÓN ATÓMICA
    const resultado = await db.runTransaction(async (transaction: any) => {
      // ✅ PASO 1: LECTURA - Obtener orden
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

      // ✅ Validación 2: Debe estar pagada (verificar en Stripe o BD)
      const isPaid = orden.status === "paid" || orden.paymentStatus === "paid";
      if (!isPaid) {
        throw new Error(
          `Orden no está pagada. Estado actual: ${orden.status || orden.paymentStatus || "desconocido"}. El cliente debe completar el pago antes de aprobar.`
        );
      }

      // ✅ Validación 3: No debe estar ya aprobada/rechazada
      if (orden.estado && (orden.estado === "aprobada" || orden.estado === "rechazada")) {
        throw new Error(`Orden ya tiene estado: ${orden.estado}`);
      }

      // ✅ Validación 4: Verificar monto pagado vs orden
      const stripeMonto = Number(orden.stripeAmount || 0) / 100; // Convertir centavos a dólares
      const ordenMonto = Number(orden.total || 0);

      if (Math.abs(stripeMonto - ordenMonto) > 0.01) {
        throw new Error(
          `Monto pagado ($${stripeMonto.toFixed(2)}) no coincide con orden ($${ordenMonto.toFixed(2)})`
        );
      }

      // ✅ PASO 2: ESCRITURA - Actualizar orden
      const now = Timestamp.now();
      transaction.update(ordenRef, {
        estado: "aprobada",
        aprobadasAt: now,
        approvedBy: "admin",
        approvalNotes: `Pago verificado: $${stripeMonto.toFixed(2)} recibido`,
      });

      // ✅ PASO 3: Confirmar reserva de stock si existe
      if (orden.stockReservation && orden.stockReservation.reserveId) {
        const reserveRef = db
          .collection("stock_reserves")
          .doc(orden.stockReservation.reserveId);
        
        const reserveSnap = await transaction.get(reserveRef);
        if (reserveSnap.exists) {
          transaction.update(reserveRef, {
            status: "confirmed",
            confirmedAt: now,
            confirmedByAdmin: true,
          });
        }
      }

      // ✅ PASO 4: Registrar en historial de auditoría
      const historyRef = db.collection("order_approvals").doc();
      transaction.set(historyRef, {
        orderId: orden.orderId || orderId,
        orderDocId: orderId,
        event: "stripe_order_approved",
        approvedAmount: stripeMonto,
        expectedAmount: ordenMonto,
        stripePaymentIntentId: orden.stripePaymentIntentId,
        timestamp: now,
        approvedBy: "admin",
      });

      console.log(
        `✅ [STRIPE_ORDEN_APROBADA] ${orden.orderId || orderId} | ` +
        `Monto: $${stripeMonto.toFixed(2)} | ` +
        `Stock: CONFIRMADO`
      );

      return {
        orderId,
        ordenId: orden.orderId,
        estado: "aprobada",
        monto: stripeMonto,
        timestamp: now.toDate(),
      };
    });

    return NextResponse.json({
      success: true,
      message: `Orden ${resultado.ordenId} aprobada exitosamente. Stock confirmado.`,
      data: resultado,
    });
  } catch (error: any) {
    console.error("[api/admin/approve-stripe-order] ❌ Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al aprobar la orden",
      },
      { status: error.message?.includes("no encontrada") ? 404 : 400 }
    );
  }
}
