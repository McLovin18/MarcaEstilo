import { NextRequest, NextResponse } from "next/server";
import admin, { db } from "../../../lib/firebase-admin";
import {
  buildOrderProductLine,
  CheckoutRequestItem,
  cleanUndefined,
} from "../../../lib/order-checkout-utils";

export const runtime = "nodejs";

function getDatafastConfig() {
  const baseUrl = (process.env.DATAFAST_BASE_URL || "https://test.oppwa.com").replace(/\/+$/, "");
  const entityId = process.env.DATAFAST_ENTITY_ID;
  const authToken = process.env.DATAFAST_AUTH_TOKEN;
  const currency = process.env.DATAFAST_CURRENCY || "USD";
  const isTestMode = baseUrl.includes("test.oppwa.com") || process.env.DATAFAST_TEST_MODE === "1";

  console.log("[iniciar-pago getDatafastConfig]", {
    baseUrl,
    entityId: entityId ? entityId.substring(0, 20) + "..." : "MISSING",
    authToken: authToken ? authToken.substring(0, 20) + "..." : "MISSING",
    currency,
    isTestMode,
  });

  if (!entityId || !authToken) {
    throw new Error("Faltan DATAFAST_ENTITY_ID o DATAFAST_AUTH_TOKEN en el servidor.");
  }

  return { baseUrl, entityId, authToken, currency, isTestMode };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cliente = body?.cliente || {};
    const direccion = body?.direccion || {};
    const productos = Array.isArray(body?.productos) ? body.productos : [];
    const userId = body?.userId || null;
    const totalCliente = Number(body?.total || 0);

    if (!productos.length) {
      return NextResponse.json({ error: "No hay productos para pagar." }, { status: 400 });
    }
    if (!cliente?.nombre || !cliente?.email || !cliente?.telefono) {
      return NextResponse.json(
        { error: "Faltan datos del cliente para iniciar el pago." },
        { status: 400 }
      );
    }
    if (!direccion?.provincia || !direccion?.ciudad || !direccion?.direccion) {
      return NextResponse.json(
        { error: "Faltan datos de dirección para iniciar el pago." },
        { status: 400 }
      );
    }
    if (totalCliente <= 0) {
      return NextResponse.json({ error: "El total debe ser mayor a 0." }, { status: 400 });
    }

    const { baseUrl, entityId, authToken, currency, isTestMode } = getDatafastConfig();
    const orderRef = db.collection("ordenes").doc();
    const merchantTransactionId = orderRef.id;

    const checkoutPayload = new URLSearchParams();
    checkoutPayload.set("entityId", entityId);
    checkoutPayload.set("amount", totalCliente.toFixed(2));
    checkoutPayload.set("currency", currency);
    checkoutPayload.set("paymentType", "DB");

    console.log("📤 Sending to Datafast:", {
      url: `${baseUrl}/v1/checkouts`,
      payload: Object.fromEntries(checkoutPayload.entries()),
    });
    const datafastRes = await fetch(`${baseUrl}/v1/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: checkoutPayload.toString(),
      cache: "no-store",
    });

    const datafastJson = await datafastRes.json().catch(() => null);
    console.log("📥 Datafast response:", datafastRes.status, JSON.stringify(datafastJson, null, 2));

    if (!datafastRes.ok || !datafastJson?.id) {
      const message =
        datafastJson?.result?.description ||
        datafastJson?.message ||
        "No fue posible iniciar el checkout con Datafast.";
      return NextResponse.json({ error: message, details: datafastJson }, { status: 502 });
    }

    const checkoutId = String(datafastJson.id);

    const transactionResult = await db.runTransaction(async (transaction) => {
      const metaRef = db.collection("ordenes_meta").doc("counter");
      const metaSnap = await transaction.get(metaRef);

      const productRefs = productos
        .filter((item: CheckoutRequestItem) => item?.id)
        .map((item: CheckoutRequestItem) => db.collection("productos").doc(item.id));

      const productSnaps = productRefs.length > 0
        ? await transaction.getAll(...productRefs)
        : [];

      const productDataMap = new Map<string, any>();
      for (const snap of productSnaps) {
        if (snap.exists) {
          productDataMap.set(snap.id, snap.data());
        }
      }

      const lineItems = productos.map((item: CheckoutRequestItem) => {
        const productData = productDataMap.get(item.id);
        if (!productData) {
          throw new Error(`El producto ${item.id} ya no está disponible.`);
        }
        const lineItem = buildOrderProductLine(item, productData);
        console.log("[iniciar-pago] Line item:", lineItem);
        return lineItem;
      });

      const subtotal = lineItems.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0
      );
      const totalCalculado = Math.round(subtotal * 100) / 100;
      const difference = Math.abs(totalCalculado - totalCliente);

      if (difference > 0.01) {
        throw new Error("El total cambió. Revisa tu carrito antes de volver a pagar.");
      }

      const last = metaSnap.exists ? Number(metaSnap.data()?.lastNumber || 0) : 0;
      const next = last + 1;
      const orderId = `ord-${String(next).padStart(5, "0")}`;
      const now = admin.firestore.Timestamp.now();

      const orderData = {
        orderId,
        userId: userId || null,
        userName: String(cliente.nombre).trim(),
        userEmail: userId ? String(cliente.email).trim() : null,
        guestEmail: userId ? null : String(cliente.email).trim(),
        clientPhone: String(cliente.telefono).trim(),
        clientAddress: `${direccion.direccion}, ${direccion.ciudad}, ${direccion.provincia}`,
        cliente: {
          nombre: String(cliente.nombre).trim(),
          email: String(cliente.email).trim(),
          telefono: String(cliente.telefono).trim(),
        },
        direccion: {
          provincia: String(direccion.provincia).trim(),
          ciudad: String(direccion.ciudad).trim(),
          direccion: String(direccion.direccion).trim(),
        },
        productos: lineItems,
        subtotal: totalCalculado,
        total: totalCalculado,
        estado: "pendiente_pago",
        estadoPedido: "Pendiente de pago",
        estadoPago: "Pendiente",
        paymentStatus: "pending",
        metodoPago: "datafast",
        stockDiscounted: false,
        createdAt: now,
        updatedAt: now,
        datafast: {
          checkoutId,
          merchantTransactionId,
          amount: totalCalculado,
          currency,
          resultCode: datafastJson?.result?.code || null,
          resultDescription: datafastJson?.result?.description || null,
          integrity: datafastJson?.integrity || null,
          testMode: isTestMode || null,
          status: "initialized",
          initializedAt: now,
        },
      };

      transaction.set(metaRef, { lastNumber: next }, { merge: true });
      transaction.set(orderRef, cleanUndefined(orderData));

      return {
        pedidoId: orderRef.id,
        orderId,
        total: totalCalculado,
      };
    });

    return NextResponse.json({
      checkoutId,
      pedidoId: transactionResult.pedidoId,
      orderId: transactionResult.orderId,
      total: transactionResult.total,
    });
  } catch (error: any) {
    console.error("[api/datafast/iniciar-pago] ❌", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo iniciar el pago." },
      { status: 500 }
    );
  }
}
