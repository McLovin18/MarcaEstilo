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
    if (!cliente?.nombre || !cliente?.email || !cliente?.telefono || !cliente?.identificacion) {
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

    // Obtener IP del cliente
    const clientIp = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "127.0.0.1";

    // Dividir nombre (ej: "Juan Carlos" → givenName="Juan", middleName="Carlos")
    const nombreParts = cliente.nombreSolo?.split(" ") || cliente.nombre?.split(" ") || [];
    const givenName = nombreParts[0] || "";
    const middleName = nombreParts.slice(1).join(" ") || ".";

    // Formatear identificación (solo primeros 10 dígitos)
    const identificacion = cliente.identificacion.replace(/\D/g, "").slice(0, 10).padStart(10, "0");

    // Calcular impuestos (ejemplo simple: 0% base 0, 12% IVA)
    const base0 = 0; // Por ahora 0, ajusta según tu lógica
    const baseImp = totalCliente;
    const iva = 0; // Por ahora 0, ajusta según tu lógica

    const checkoutPayload = new URLSearchParams();
    checkoutPayload.set("entityId", entityId);
    checkoutPayload.set("amount", totalCliente.toFixed(2));
    checkoutPayload.set("currency", currency);
    checkoutPayload.set("paymentType", "DB");
    checkoutPayload.set("testMode", "EXTERNAL");

    // Datos del cliente
    checkoutPayload.set("customer.givenName", givenName);
    checkoutPayload.set("customer.middleName", middleName);
    checkoutPayload.set("customer.surname", cliente.apellido || "");
    checkoutPayload.set("customer.ip", clientIp);
    checkoutPayload.set("customer.merchantCustomerId", userId || "guest");
    checkoutPayload.set("merchantTransactionId", merchantTransactionId);
    checkoutPayload.set("customer.email", cliente.email);
    checkoutPayload.set("customer.identificationDocType", "IDCARD");
    checkoutPayload.set("customer.identificationDocId", identificacion);
    checkoutPayload.set("customer.phone", cliente.telefono);

    // Direcciones
    checkoutPayload.set("billing.street1", `${direccion.direccion}, ${direccion.ciudad}, ${direccion.provincia}`);
    checkoutPayload.set("billing.country", "EC");
    checkoutPayload.set("shipping.street1", `${direccion.direccion}, ${direccion.ciudad}, ${direccion.provincia}`);
    checkoutPayload.set("shipping.country", "EC");

    // Datos de los productos
    productos.forEach((item: any, index: number) => {
      const precio = Number(item.precio || item.precioUnitario || item.precioBase || 0);
      checkoutPayload.set(`cart.items[${index}].name`, item.nombre?.slice(0, 255) || `Producto ${index + 1}`);
      checkoutPayload.set(`cart.items[${index}].description`, item.nombre?.slice(0, 255) || `Producto ${index + 1}`);
      checkoutPayload.set(`cart.items[${index}].price`, precio.toFixed(2));
      checkoutPayload.set(`cart.items[${index}].quantity`, String(item.cantidad || 1));
    });

    // Parámetros personalizados Datafast (MID, TID, impuestos, etc.)
    checkoutPayload.set("customParameters[SHOPPER_VAL_BASE0]", base0.toFixed(2));
    checkoutPayload.set("customParameters[SHOPPER_VAL_BASEIMP]", baseImp.toFixed(2));
    checkoutPayload.set("customParameters[SHOPPER_VAL_IVA]", iva.toFixed(2));
    checkoutPayload.set("customParameters[SHOPPER_MID]", process.env.DATAFAST_MID || "1000000406");
    checkoutPayload.set("customParameters[SHOPPER_TID]", process.env.DATAFAST_TID || "PD100406");
    checkoutPayload.set("customParameters[SHOPPER_ECI]", "0103910");
    checkoutPayload.set("customParameters[SHOPPER_PSERV]", "17913101");
    checkoutPayload.set("customParameters[SHOPPER_VERSIONDF]", "2");

    // Risk parameters
    checkoutPayload.set("risk.parameters[USER_DATA2]", "MARCAESTILO");

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
          // GUARDAR TODO EL JSON DE RESPUESTA DE DATAFAST
          fullCheckoutResponse: datafastJson,
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
