import { NextRequest, NextResponse } from "next/server";
import admin, { db } from "../../../lib/firebase-admin";
import { applyStockDeltaToProduct, cleanUndefined } from "../../../lib/order-checkout-utils";
import { sendOrderNotificationToOwner } from "../../../lib/order-notification";
import { Resend } from "resend";

export const runtime = "nodejs";

function getDatafastConfig() {
  const baseUrl = (process.env.DATAFAST_BASE_URL || "https://eu-prod.oppwa.com").replace(/\/+$/, "");
  const entityId = process.env.DATAFAST_ENTITY_ID;
  const authToken = process.env.DATAFAST_AUTH_TOKEN;
  const testModeEnv = process.env.DATAFAST_TEST_MODE;
  const includesTest = baseUrl.includes("test.oppwa.com");
  const isTestMode = includesTest || testModeEnv === "1";

  console.log("[resultado getDatafastConfig]", {
    baseUrl,
    testModeEnv,
    includesTest,
    entityId: entityId ? entityId.substring(0, 20) + "..." : "MISSING",
    authToken: authToken ? authToken.substring(0, 20) + "..." : "MISSING",
    isTestMode,
  });

  if (!entityId || !authToken) {
    throw new Error("Faltan DATAFAST_ENTITY_ID o DATAFAST_AUTH_TOKEN en el servidor.");
  }

  return { baseUrl, entityId, authToken, isTestMode };
}

function buildRedirect(req: NextRequest, pedidoId: string, status: string) {
  const url = new URL(`/paymentSuccess?pedidoId=${encodeURIComponent(pedidoId)}&status=${encodeURIComponent(status)}`, req.url);
  return NextResponse.redirect(url);
}

function classifyResultCode(code?: string | null, isTestMode = false) {
  const resultCode = String(code || "");
  const successPattern = /^(000\.000\.|000\.100\.1|000\.[36]|000\.400\.[1][12]0)/;
  const pendingPattern = /^(000\.200)/;

  console.log("[classifyResultCode] input code:", code, ", isTestMode:", isTestMode);
  console.log("[classifyResultCode] successPattern.test(resultCode):", successPattern.test(resultCode));

  if (successPattern.test(resultCode)) {
    console.log("[classifyResultCode] returning success (successPattern matched)");
    return "success";
  }
  if (pendingPattern.test(resultCode)) {
    console.log("[classifyResultCode] returning pending");
    return "pending";
  }
  console.log("[classifyResultCode] returning failed");
  return "failed";
}

export async function GET(req: NextRequest) {
  console.log("=== [DATAFAST RESULTADO INICIO] ===");
  const pedidoId = req.nextUrl.searchParams.get("pedidoId");
  const resourcePath = req.nextUrl.searchParams.get("resourcePath");
  const id = req.nextUrl.searchParams.get("id");

  console.log("[resultado] All search params:", Object.fromEntries(req.nextUrl.searchParams.entries()));
  console.log("[resultado] pedidoId:", pedidoId);
  console.log("[resultado] resourcePath:", resourcePath);
  console.log("[resultado] id:", id);

  if (!pedidoId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const config = getDatafastConfig();
    console.log("[Datafast Resultado] Config isTestMode:", config.isTestMode, "baseUrl:", config.baseUrl);
    const { baseUrl, entityId, authToken } = config;
    const orderRef = db.collection("ordenes").doc(pedidoId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return buildRedirect(req, pedidoId, "not_found");
    }

    const orderData = orderSnap.data() || {};
    if (orderData.paymentStatus === "paid") {
      return buildRedirect(req, pedidoId, "success");
    }

    if (!resourcePath) {
      return buildRedirect(req, pedidoId, "failed");
    }

    const statusUrl = new URL(resourcePath, `${baseUrl}/`);
    statusUrl.searchParams.set("entityId", entityId);
    console.log("[Datafast Resultado] Checking status at URL:", statusUrl.toString());
    console.log("[Datafast Resultado] Using auth token:", authToken.substring(0, 20) + "...");

    const statusRes = await fetch(statusUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    });

    console.log("[Datafast Resultado] Status response status:", statusRes.status, statusRes.statusText);
    console.log("[Datafast Resultado] Status response headers:", Object.fromEntries(statusRes.headers.entries()));

    const statusText = await statusRes.text();
    console.log("[Datafast Resultado] Raw status response text:", statusText);
    let statusJson;
    try {
      statusJson = JSON.parse(statusText);
    } catch (e) {
      console.log("[Datafast Resultado] Failed to parse response as JSON");
    }
    console.log("[Datafast Resultado] Datafast status response:", statusJson);
    
    // Log específico para certificación Datafast
    console.log("=== DATAFAST CERTIFICATION INFO ===");
    console.log("Transacción ID:", statusJson?.id);
    console.log("Merchant Transaction ID:", statusJson?.merchantTransactionId);
    console.log("Result Code:", statusJson?.result?.code);
    console.log("Result Description:", statusJson?.result?.description);
    console.log("Amount:", statusJson?.amount);
    console.log("Currency:", statusJson?.currency);
    console.log("Payment Brand:", statusJson?.paymentBrand);
    console.log("Card BIN:", statusJson?.card?.bin);
    console.log("Card Last 4 Digits:", statusJson?.card?.last4Digits);
    console.log("Card Holder:", statusJson?.card?.holder);
    console.log("==================================");

    const resultCode = statusJson?.result?.code || null;
    const resultDescription = statusJson?.result?.description || null;
    
    let resultStatus: string;
    if (statusRes.ok) {
      resultStatus = classifyResultCode(resultCode, config.isTestMode);
    } else {
      resultStatus = "failed";
    }
    
    console.log("[Datafast Resultado] Parsed result:", {
      resultCode,
      resultDescription,
      resultStatus,
    });

    if (resultStatus === "success") {
      console.log("[Datafast Resultado] Pago exitoso, actualizando orden y stock...");
      await db.runTransaction(async (transaction) => {
        const freshOrderSnap = await transaction.get(orderRef);
        if (!freshOrderSnap.exists) {
          throw new Error("La orden ya no existe.");
        }

        const freshOrder = freshOrderSnap.data() || {};
        if (freshOrder.paymentStatus === "paid") {
          console.log("[Datafast Resultado] Orden ya está pagada, saliendo...");
          return;
        }

        const productos = Array.isArray(freshOrder.productos) ? freshOrder.productos : [];
        console.log("[Datafast Resultado] Productos en la orden:", productos);
        
        const uniqueRefs = new Map<string, FirebaseFirestore.DocumentReference>();
        for (const item of productos) {
          if (item?.id && !uniqueRefs.has(item.id)) {
            uniqueRefs.set(item.id, db.collection("productos").doc(item.id));
          }
        }

        const productSnaps = uniqueRefs.size > 0
          ? await transaction.getAll(...Array.from(uniqueRefs.values()))
          : [];

        const productDataMap = new Map<string, any>();
        for (const snap of productSnaps) {
          if (snap.exists) {
            productDataMap.set(snap.id, snap.data());
          }
        }

        const productUpdates = new Map<string, any>();
        for (const item of productos) {
          if (!item?.id) continue;

          const currentProductData = productUpdates.has(item.id)
            ? productUpdates.get(item.id)
            : productDataMap.get(item.id);

          if (!currentProductData) {
            throw new Error(`No se encontró el producto ${item.id} para descontar stock.`);
          }

          const delta = -Number(item.cantidad || 1);
          console.log(`[Datafast Resultado] Aplicando delta ${delta} a producto ${item.id}`);
          
          const updatedProduct = {
            ...currentProductData,
            ...applyStockDeltaToProduct(currentProductData, item, delta),
            lastStockUpdateAt: admin.firestore.Timestamp.now(),
          };

          productUpdates.set(item.id, updatedProduct);
        }

        for (const [productId, productData] of productUpdates.entries()) {
          const productRef = uniqueRefs.get(productId);
          if (!productRef) continue;

          console.log(`[Datafast Resultado] Actualizando producto ${productId} con`, {
            stock: productData.stock,
            stockVariants: productData.stockVariants,
          });
          
          transaction.update(productRef, {
            stock: productData.stock,
            stockVariants: productData.stockVariants || [],
            lastStockUpdateAt: productData.lastStockUpdateAt,
          });
        }

        console.log("[Datafast Resultado] Actualizando orden...");
        transaction.update(orderRef, {
          estado: "pagada",
          estadoPedido: "Pagada",
          estadoPago: "Pagado",
          paymentStatus: "paid",
          stockDiscounted: true,
          paidAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          datafast: {
            ...(freshOrder.datafast || {}),
            paymentId: statusJson?.id || null,
            resourcePath,
            resultCode,
            resultDescription,
            status: "paid",
            lastStatusPayload: statusJson,
            verifiedAt: admin.firestore.Timestamp.now(),
          },
        });
      });

      // 📧 Enviar notificación por correo al dueño de la tienda
      try {
        const orderData = orderSnap.data() || {};
        const notificationData = {
          orderId: orderData.orderId || "N/A",
          cliente: {
            nombre: orderData.cliente?.nombre || orderData.userName || "N/A",
            email: orderData.cliente?.email || orderData.userEmail || orderData.guestEmail || "N/A",
            telefono: orderData.cliente?.telefono || orderData.clientPhone || "N/A",
          },
          direccion: {
            provincia: orderData.direccion?.provincia || "N/A",
            ciudad: orderData.direccion?.ciudad || "N/A",
            direccion: orderData.direccion?.direccion || orderData.clientAddress || "N/A",
          },
          productos: orderData.productos || [],
          subtotal: orderData.subtotal || 0,
          costoEnvio: orderData.costoEnvio || 1, // $1 temporalmente para prueba de Datafast
          total: orderData.total || 0,
          metodoPago: "Tarjeta (Datafast)",
          paidAt: admin.firestore.Timestamp.now(),
        };

        const notificationResult = await sendOrderNotificationToOwner(notificationData);
        if (notificationResult.success) {
          console.log("[Datafast Resultado] ✅ Notificación enviada al dueño");
        } else {
          console.error("[Datafast Resultado] ❌ Error enviando notificación:", notificationResult.error);
        }

        // 📧 Enviar confirmación al cliente
        try {
          const clientEmail = orderData.cliente?.email || orderData.userEmail || orderData.guestEmail;
          if (clientEmail && clientEmail !== "N/A") {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const fromEmail = process.env.RESEND_FROM_EMAIL || "pedidos@marcaestilo593.com"; // Forzar dominio verificado
            
            const clientEmailResult = await resend.emails.send({
              from: fromEmail,
              to: clientEmail,
              subject: `[MARCA ESTILO] Confirmación de Pedido #${orderData.orderId}`,
              html: `
                <!DOCTYPE html>
                <html lang="es">
                <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);max-width:98vw;">
                        <tr>
                          <td style="background:#000000;padding:32px 36px;">
                            <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:1px;">Marca Estilo</h1>
                            <p style="margin:6px 0 0;color:#d4af37;font-size:14px;">¡Pedido Confirmado!</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:24px 36px;">
                            <p style="margin:0;font-size:13px;color:#6b7280;">Número de orden</p>
                            <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#3a1859;">${orderData.orderId}</p>
                          </td>
                        </tr>
                        <tr><td style="padding:20px 36px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>
                        <tr>
                          <td style="padding:16px 36px;">
                            <h3 style="margin:0 0 12px;font-size:16px;color:#374151;">Datos de Envío</h3>
                            <p style="margin:4px 0;font-size:14px;color:#6b7280;"><strong>Dirección:</strong> ${orderData.direccion?.direccion || "N/A"}</p>
                            <p style="margin:4px 0;font-size:14px;color:#6b7280;"><strong>Ciudad:</strong> ${orderData.direccion?.ciudad || "N/A"}, ${orderData.direccion?.provincia || "N/A"}</p>
                          </td>
                        </tr>
                        <tr><td style="padding:20px 36px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>
                        <tr>
                          <td style="padding:16px 36px;">
                            <h3 style="margin:0 0 12px;font-size:16px;color:#374151;">Productos</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <thead>
                                <tr style="background:#f9fafb;">
                                  <th style="padding:10px 8px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;width:80px;">Imagen</th>
                                  <th style="padding:10px 8px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Producto</th>
                                  <th style="padding:10px 8px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Cant.</th>
                                  <th style="padding:10px 8px;text-align:right;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Precio</th>
                                  <th style="padding:10px 8px;text-align:right;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${(orderData.productos || []).map((p: any) => {
                                  const precio = Number(p.precioUnitario || p.precioFinal || 0);
                                  const cantidad = Number(p.cantidad || 1);
                                  const subtotal = precio * cantidad;
                                  const variantInfo = p.variantSelectionSummary 
                                    ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">${p.variantSelectionSummary}</div>` 
                                    : '';
                                  const productImage = p.imagen || '';
                                  return `
                                    <tr style="border-bottom:1px solid #e5e7eb;">
                                      <td style="padding:10px 8px;width:80px;">
                                        ${productImage ? `<img src="${productImage}" alt="${p.nombre}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />` : ''}
                                      </td>
                                      <td style="padding:10px 8px;font-size:13px;color:#374151;">
                                        <strong>${p.nombre || "Producto"}</strong>
                                        ${variantInfo}
                                      </td>
                                      <td style="padding:10px 8px;text-align:center;font-size:13px;color:#374151;">${cantidad}</td>
                                      <td style="padding:10px 8px;text-align:right;font-size:13px;color:#374151;">$${precio.toFixed(2)}</td>
                                      <td style="padding:10px 8px;text-align:right;font-size:13px;font-weight:bold;color:#6d28d9;">$${subtotal.toFixed(2)}</td>
                                    </tr>
                                  `;
                                }).join('')}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 36px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding:8px 8px;text-align:right;font-size:13px;color:#6b7280;">Subtotal</td>
                                <td style="padding:8px 8px;text-align:right;font-size:13px;color:#374151;font-weight:600;width:110px;">$${Number(orderData.subtotal || 0).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td style="padding:8px 8px;text-align:right;font-size:13px;color:#6b7280;">Envío</td>
                                <td style="padding:8px 8px;text-align:right;font-size:13px;color:#16a34a;font-weight:600;width:110px;">$${Number(orderData.costoEnvio || 5).toFixed(2)}</td>
                              </tr>
                              <tr style="background:#f5f3ff;border-radius:8px;">
                                <td style="padding:12px 8px;text-align:right;font-size:17px;font-weight:bold;color:#3a1859;">Total</td>
                                <td style="padding:12px 8px;text-align:right;font-size:20px;font-weight:bold;color:#6d28d9;width:110px;">$${Number(orderData.total || 0).toFixed(2)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr><td style="padding:20px 36px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>
                        <tr>
                          <td style="padding:16px 36px;">
                            <h3 style="margin:0 0 12px;font-size:16px;color:#374151;">Información de Pago</h3>
                            <p style="margin:4px 0;font-size:14px;color:#6b7280;">Método: <strong>Tarjeta (Datafast)</strong></p>
                            <p style="margin:4px 0;font-size:14px;color:#6b7280;">Estado: <strong>Pagado</strong></p>
                          </td>
                        </tr>
                        <tr><td style="padding:20px 36px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>
                        <tr>
                          <td style="padding:16px 36px;">
                            <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:16px 20px;">
                              <p style="margin:0;font-size:14px;color:#166534;">
                                <strong>✅ Pago completado exitosamente</strong>. Estamos procesando tu pedido para envío a: ${orderData.direccion?.direccion || "tu dirección"}.
                              </p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;">Este correo fue enviado automáticamente por Marca Estilo.</p>
                            <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">Para consultas: marcaestilo593@gmail.com</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
              `,
              replyTo: process.env.STORE_OWNER_EMAIL || "marcaestilo593@gmail.com",
            });
            
            if (clientEmailResult.error) {
              console.error("[Datafast Resultado] ❌ Error enviando email al cliente:", clientEmailResult.error);
            } else {
              console.log("[Datafast Resultado] ✅ Email enviado al cliente:", clientEmail);
            }
          }
        } catch (clientEmailError: any) {
          console.error("[Datafast Resultado] ❌ Error en email al cliente (no bloquea el proceso):", clientEmailError);
        }
      } catch (notificationError: any) {
        console.error("[Datafast Resultado] ❌ Error en notificación (no bloquea el proceso):", notificationError);
      }

      return buildRedirect(req, pedidoId, "success");
    }

    const nextState =
      resultStatus === "pending"
        ? {
            estado: "pendiente_pago",
            estadoPedido: "Pendiente de pago",
            estadoPago: "Pendiente",
            paymentStatus: "pending",
          }
        : {
            estado: "pago_fallido",
            estadoPedido: "Pago fallido",
            estadoPago: "Fallido",
            paymentStatus: "failed",
          };

    await orderRef.update({
      ...nextState,
      updatedAt: admin.firestore.Timestamp.now(),
      datafast: {
        ...(orderData.datafast || {}),
        paymentId: statusJson?.id || null,
        resourcePath,
        resultCode,
        resultDescription,
        status: resultStatus,
        lastStatusPayload: statusJson,
        verifiedAt: admin.firestore.Timestamp.now(),
      },
    });

    return buildRedirect(req, pedidoId, resultStatus);
  } catch (error: any) {
    console.error("[api/datafast/resultado] ❌", error);
    return buildRedirect(req, pedidoId, "failed");
  }
}
