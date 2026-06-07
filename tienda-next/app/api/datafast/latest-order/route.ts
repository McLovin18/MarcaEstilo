import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("=== [LATEST ORDER INICIO] ===");
  
  let orderId = req.nextUrl.searchParams.get("orderId");
  
  try {
    let orderDoc;
    
    if (orderId) {
      orderDoc = await db.collection("ordenes").doc(orderId).get();
      console.log("[latest-order] orderId from param:", orderId);
    } else {
      // Buscar la ÚLTIMA orden creada automáticamente
      const querySnapshot = await db
        .collection("ordenes")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        console.log("[latest-order] No hay órdenes en Firebase");
        return NextResponse.json({ error: "No hay órdenes encontradas" }, { status: 404 });
      }
      
      orderDoc = querySnapshot.docs[0];
      orderId = orderDoc.id;
      console.log("[latest-order] Found latest orderId:", orderId);
    }

    if (!orderDoc.exists) {
      console.log("[latest-order] Orden no encontrada en Firebase");
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const orderData = orderDoc.data();
    console.log("[latest-order] orderData keys:", Object.keys(orderData || {}));
    console.log("[latest-order] orderData.datafast exists:", !!orderData?.datafast);
    console.log("[latest-order] orderData.datafast keys:", Object.keys(orderData?.datafast || {}));
    console.log("[latest-order] orderData.datafast.fullCheckoutResponse:", !!orderData?.datafast?.fullCheckoutResponse);

    const secondStepJson = orderData?.datafast?.lastStatusPayload;
    // Usar el JSON completo si existe, o el resumen anterior
    const checkoutStepJson = orderData?.datafast?.fullCheckoutResponse || {
      checkoutId: orderData?.datafast?.checkoutId,
      result: {
        code: orderData?.datafast?.resultCode,
        description: orderData?.datafast?.resultDescription,
      },
      amount: orderData?.datafast?.amount,
      currency: orderData?.datafast?.currency,
    };

    return NextResponse.json({
      message: "Respuestas de Datafast para la orden " + orderId,
      orderId: orderId,
      fechaCreacion: orderData?.createdAt,
      paso1_checkout_creation: checkoutStepJson,
      paso2_payment_status: secondStepJson,
    });
  } catch (error) {
    console.error("[latest-order] Error:", error);
    return NextResponse.json({ error: "Error interno", details: String(error) }, { status: 500 });
  }
}
