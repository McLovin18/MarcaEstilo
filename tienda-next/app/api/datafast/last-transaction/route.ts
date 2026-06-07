import { NextRequest, NextResponse } from "next/server";
import admin from "../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  const db = admin.firestore();
  
  try {
    let orderDoc;
    if (orderId) {
      console.log("Buscando orden por ID:", orderId);
      orderDoc = await db.collection("ordenes").doc(orderId).get();
    } else {
      // Si no hay orderId, busca la última orden
      console.log("Buscando última orden...");
      const ordersSnapshot = await db
        .collection("ordenes")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      
      if (ordersSnapshot.empty) {
        return NextResponse.json({ error: "No hay órdenes" }, { status: 404 });
      }
      orderDoc = ordersSnapshot.docs[0];
      console.log("Última orden encontrada:", orderDoc.id);
    }

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const orderData = orderDoc.data();
    console.log("Datos de la orden:", orderData);
    const secondStepResponse = orderData?.datafast?.lastStatusPayload;

    if (!secondStepResponse) {
      return NextResponse.json({ 
        error: "No hay respuesta de Datafast en esta orden",
        orderId: orderDoc.id,
        orderData: orderData 
      }, { status: 404 });
    }

    return NextResponse.json(secondStepResponse);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno", details: String(error) }, { status: 500 });
  }
}
