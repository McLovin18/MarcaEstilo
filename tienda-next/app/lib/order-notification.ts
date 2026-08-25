import { Resend } from "resend";
import admin from "./firebase-admin";

/**
 * Sistema de notificaciones de pedidos para el dueño de la tienda
 * Envía correos automáticos cuando se completa un pago con tarjeta
 * Usa Resend para envío de emails (sistema unificado)
 */

interface OrderNotificationData {
  orderId: string;
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
  };
  direccion: {
    provincia: string;
    ciudad: string;
    direccion: string;
  };
  productos: any[];
  subtotal: number;
  costoEnvio: number;
  total: number;
  metodoPago: string;
  paidAt?: any;
}

function buildOrderNotificationHTML(data: OrderNotificationData): string {
  const rows = data.productos
    .map((p) => {
      const subtotal = (p.precioUnitario || p.precioFinal || 0) * (p.cantidad || 1);
      const variantInfo = p.variantSelectionSummary 
        ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">${p.variantSelectionSummary}</div>` 
        : '';
      const productImage = p.imagen || '';
      
      return `
        <tr>
          <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; width: 80px;">
            ${productImage ? `<img src="${productImage}" alt="${p.nombre}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />` : ''}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:500;">${p.nombre}</div>
            ${variantInfo}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; text-align:center;">${p.cantidad}</td>
          <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; text-align:right;">$${(p.precioUnitario || p.precioFinal || 0).toFixed(2)}</td>
          <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:bold;">$${subtotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);max-width:98vw;">
        <!-- Header -->
        <tr>
          <td style="background:#000000;padding:32px 36px;">
            <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:1px;">Marca Estilo</h1>
            <p style="margin:6px 0 0;color:#d4af37;font-size:14px;">Confirmacion de Pedido - $${Number(data.total).toFixed(2)}</p>
          </td>
        </tr>
        <!-- Order ID -->
        <tr>
          <td style="padding:24px 36px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;color:#6b7280;">Número de orden</p>
                  <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#3a1859;">${data.orderId}</p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:13px;color:#6b7280;">Método de pago</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#16a34a;">Tarjeta (Datafast)</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Divider -->
        <tr><td style="padding:20px 36px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>
        <!-- Customer Info -->
        <tr>
          <td style="padding:16px 36px;">
            <h3 style="margin:0 0 12px;font-size:16px;color:#374151;">Datos del Cliente</h3>
            <p style="margin:4px 0;font-size:14px;color:#6b7280;"><strong>Nombre:</strong> ${data.cliente.nombre}</p>
            <p style="margin:4px 0;font-size:14px;color:#6b7280;"><strong>Email:</strong> ${data.cliente.email}</p>
            <p style="margin:4px 0;font-size:14px;color:#6b7280;"><strong>Teléfono:</strong> ${data.cliente.telefono}</p>
            <p style="margin:4px 0;font-size:14px;color:#6b7280;"><strong>Dirección:</strong> ${data.direccion.direccion}, ${data.direccion.ciudad}, ${data.direccion.provincia}</p>
          </td>
        </tr>
        <!-- Divider -->
        <tr><td style="padding:20px 36px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>
        <!-- Products table -->
        <tr>
          <td style="padding:16px 36px;">
            <h3 style="margin:0 0 12px;font-size:16px;color:#374151;">Productos</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 8px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;width:80px;">Imagen</th>
                  <th style="padding:10px 8px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Producto</th>
                  <th style="padding:10px 8px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Cant.</th>
                  <th style="padding:10px 8px;text-align:right;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Precio unit.</th>
                  <th style="padding:10px 8px;text-align:right;font-size:13px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td>
        </tr>
        <!-- Total -->
        <tr>
          <td style="padding:0 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 8px;text-align:right;font-size:13px;color:#6b7280;">Subtotal</td>
                <td style="padding:8px 8px;text-align:right;font-size:13px;color:#374151;font-weight:600;width:110px;">$${Number(data.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:8px 8px;text-align:right;font-size:13px;color:#6b7280;">Envío</td>
                <td style="padding:8px 8px;text-align:right;font-size:13px;color:${data.costoEnvio > 0 ? '#374151' : '#16a34a'};font-weight:600;width:110px;">${data.costoEnvio > 0 ? `$${Number(data.costoEnvio).toFixed(2)}` : 'Gratis'}</td>
              </tr>
              <tr style="background:#f5f3ff;border-radius:8px;">
                <td style="padding:12px 8px;text-align:right;font-size:17px;font-weight:bold;color:#3a1859;">Total</td>
                <td style="padding:12px 8px;text-align:right;font-size:20px;font-weight:bold;color:#6d28d9;width:110px;">$${Number(data.total).toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Info box -->
        <tr>
          <td style="padding:0 36px 32px;">
            <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:16px 20px;">
              <p style="margin:0;font-size:14px;color:#166534;">
                <strong>✅ Pago completado exitosamente</strong> con tarjeta. El stock ya ha sido descontado automáticamente. Prepara el pedido para envío.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Este correo fue enviado automáticamente por Marca Estilo.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendOrderNotificationToOwner(data: OrderNotificationData): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que las variables de entorno estén configuradas
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("[sendOrderNotificationToOwner] ❌ Falta RESEND_API_KEY");
      return { success: false, error: "Resend no configurado" };
    }

    if (!process.env.STORE_OWNER_EMAIL) {
      console.error("[sendOrderNotificationToOwner] ❌ Falta STORE_OWNER_EMAIL");
      return { success: false, error: "Email del dueño no configurado" };
    }

    const resend = new Resend(resendApiKey);
    const html = buildOrderNotificationHTML(data);

    // Forzar uso del dominio verificado
    const fromEmail = process.env.RESEND_FROM_EMAIL || "pedidos@marcaestilo593.com";

    // Enviar email con Resend al dueño de la tienda
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: process.env.STORE_OWNER_EMAIL,
      subject: `Pedido ${data.orderId} recibido`,
      html,
      replyTo: data.cliente.email, // El dueño puede responder directamente al cliente
      tags: [
        { name: "category", value: "order" },
        { name: "order_id", value: data.orderId }
      ]
    });

    if (emailResponse.error) {
      console.error("[sendOrderNotificationToOwner] ❌ Error Resend:", emailResponse.error);
      return { success: false, error: emailResponse.error.message };
    }

    console.log(`✅ [ORDER_NOTIFICATION] Enviada notificación al dueño para orden ${data.orderId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[sendOrderNotificationToOwner] ❌ Error:", error);
    return { success: false, error: error.message };
  }
}
