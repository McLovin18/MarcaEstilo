import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId") || "XdVue8MWRA6hg9FXTZru";
  
  try {
    const orderDoc = await db.collection("ordenes").doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const orderData = orderDoc.data();

    // Extract the second-step JSON (payment status response)
    const secondStepJson = orderData?.datafast?.lastStatusPayload;
    const checkoutStepJson = {
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
      paso1_checkout_creation: checkoutStepJson,
      paso2_payment_status: secondStepJson,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
