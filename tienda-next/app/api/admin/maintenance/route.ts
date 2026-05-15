/**
 * 🛠️ ENDPOINT DE ADMIN: MAINTENANCE & RECOVERY
 * 
 * POST /api/admin/maintenance?action=cleanup|recovery|stats
 * 
 * Acciones disponibles:
 * ✅ cleanup: Liberar reservas expiradas
 * ✅ recovery: Recuperar órdenes "pending" hace > 30 min (webhook recovery)
 * ✅ stats: Ver estado de salud del sistema
 */

import { NextRequest, NextResponse } from "next/server";
import admin from "../../../lib/firebase-admin";

// ⚠️ PROTECCIÓN: Verificar admin token
function verifyAdminToken(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_MAINTENANCE_TOKEN;

  if (!expected || token !== expected) {
    return false;
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    // ⚠️ SEGURIDAD: Verificar token de admin
    if (!verifyAdminToken(req)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "stats";

    switch (action) {
      case "cleanup": {
        // Limpiar reservas expiradas
        const { cleanupExpiredReserves } = await import("../../../lib/stock-cleanup-db");
        const result = await cleanupExpiredReserves();

        console.log(`🧹 [ADMIN] Cleanup executed:`, result);

        return NextResponse.json({
          success: true,
          action: "cleanup",
          result,
        });
      }

      case "recovery": {
        // Recuperar órdenes pendientes
        const { runWebhookRecovery } = await import("../../../lib/webhook-recovery-db");
        const result = await runWebhookRecovery();

        console.log(`🔄 [ADMIN] Webhook recovery executed:`, result);

        return NextResponse.json({
          success: true,
          action: "recovery",
          result,
        });
      }

      case "stats": {
        // Ver stats de salud
        const { getCleanupStats } = await import("../../../lib/stock-cleanup-db");
        const { getIdempotencyStats } = await import("../../../lib/idempotency-db");
        const { getEmailRateLimitStats } = await import("../../../lib/email-rate-limit-db");
        const { getWebhookRecoveryStats } = await import("../../../lib/webhook-recovery-db");

        const [cleanupStats, idempotencyStats, emailStats, webhookStats] =
          await Promise.all([
            getCleanupStats(),
            getIdempotencyStats(),
            getEmailRateLimitStats(),
            getWebhookRecoveryStats(),
          ]);

        console.log(`📊 [ADMIN] Health stats retrieved`);

        const health = {
          stock_reserves: cleanupStats,
          idempotency: idempotencyStats,
          email_rate_limits: emailStats,
          webhook_recovery: webhookStats,
          timestamp: new Date().toISOString(),
        };

        // ⚠️ ALERTAS: Si hay problemas
        const alerts: string[] = [];

        if (cleanupStats.stockBlockedArtificially > 0) {
          alerts.push(
            `⚠️ ${cleanupStats.stockBlockedArtificially} products with artificially blocked stock`
          );
        }

        if (webhookStats.pendingOrdersOlderThan30min > 0) {
          alerts.push(
            `⚠️ ${webhookStats.pendingOrdersOlderThan30min} orders pending payment > 30 min (possible webhook failures)`
          );
        }

        if (emailStats.activeThrottledEmails > 10) {
          alerts.push(
            `⚠️ ${emailStats.activeThrottledEmails} emails currently rate-limited`
          );
        }

        return NextResponse.json({
          success: true,
          action: "stats",
          health,
          alerts: alerts.length > 0 ? alerts : null,
        });
      }

      case "reserve-cleanup-idempotency": {
        // Limpiar records de idempotency expirados
        const { cleanupExpiredIdempotencyRecords } = await import(
          "../../../lib/idempotency-db"
        );
        const result = await cleanupExpiredIdempotencyRecords();

        console.log(`🧹 [ADMIN] Idempotency cleanup executed:`, result);

        return NextResponse.json({
          success: true,
          action: "reserve-cleanup-idempotency",
          result,
        });
      }

      case "reserve-cleanup-email-limits": {
        // Limpiar records de rate limit expirados
        const { cleanupExpiredEmailRateLimits } = await import(
          "../../../lib/email-rate-limit-db"
        );
        const result = await cleanupExpiredEmailRateLimits();

        console.log(`🧹 [ADMIN] Email rate limit cleanup executed:`, result);

        return NextResponse.json({
          success: true,
          action: "reserve-cleanup-email-limits",
          result,
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}`,
            availableActions: [
              "cleanup",
              "recovery",
              "stats",
              "reserve-cleanup-idempotency",
              "reserve-cleanup-email-limits",
            ],
          },
          { status: 400 }
        );
    }
  } catch (err: any) {
    console.error("[admin-maintenance] ❌ Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET: Ver stats sin token (para monitoreo público)
 * Devuelve solo los datos que están "bien para público"
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get("public_only") === "true";

    if (!publicOnly) {
      // Requiere token
      if (!verifyAdminToken(req)) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid admin token" },
          { status: 401 }
        );
      }
    }

    const { getWebhookRecoveryStats } = await import("../../../lib/webhook-recovery-db");
    const stats = await getWebhookRecoveryStats();

    // Si es public_only, solo devolver info no sensible
    if (publicOnly) {
      return NextResponse.json({
        pendingOrders: stats.pendingOrders,
      });
    }

    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[admin-maintenance] ❌ GET Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
