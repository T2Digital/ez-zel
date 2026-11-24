import type { Express, Request, Response, NextFunction } from "express";
import { pingPostgres } from "../services/postgresService";
import { getDiskHealthStats, pingRedisHealth } from "../services/ecosystemWatchdogService";
import { runLiveEcosystemHealthProbe } from "../services/ecosystemConfigService";
import { getOffServerBackupStatus } from "../services/offServerBackupService";
import { getTitoStudioBaseUrl } from "../services/titoStudioApiClient";
import { getT2AgentBaseUrl } from "../services/t2AgentApiClient";

async function probeUrl(url: string): Promise<{ up: boolean; status: number; latencyMs: number }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return { up: res.status < 500, status: res.status, latencyMs: Date.now() - t0 };
  } catch {
    return { up: false, status: 0, latencyMs: Date.now() - t0 };
  }
}

export async function buildPublicStatusReport() {
  const storeBase = String(process.env.BATTAH_MULTI_TENANT_URL || "https://store.t2os.app").replace(/\/+$/, "");
  const bookBase = String(process.env.CLEAN_MASTER_MULTI_TENANT_URL || "https://book.t2os.app").replace(/\/+$/, "");

  const [pg, redis, ecosystemProbe, storeCheck, bookCheck] = await Promise.all([
    pingPostgres(),
    pingRedisHealth(),
    runLiveEcosystemHealthProbe(getTitoStudioBaseUrl(), getT2AgentBaseUrl()).catch(() => null),
    probeUrl(`${storeBase}/`),
    probeUrl(`${bookBase}/`),
  ]);

  const disk = getDiskHealthStats();
  const backup = getOffServerBackupStatus();

  const components = [
    {
      id: "ez_zel",
      nameAr: "نواة المنظومة وواجهة التحكم (T2OS Core)",
      status: "operational",
      latencyMs: 1,
      uptimeSeconds: Math.round(process.uptime()),
    },
    {
      id: "postgres",
      nameAr: "قاعدة البيانات المركزية (PostgreSQL 16)",
      status: !pg.configured ? "not_configured" : pg.connected ? "operational" : "degraded",
      latencyMs: pg.latencyMs ?? null,
    },
    {
      id: "redis",
      nameAr: "طابور المهام والذاكرة اللحظية (Redis)",
      status: !redis.configured ? "not_configured" : redis.connected ? "operational" : "degraded",
      latencyMs: redis.latencyMs ?? null,
    },
    {
      id: "t2_studio",
      nameAr: "معمل الإبداع والمحتوى (T2 Studio)",
      status: ecosystemProbe?.titoStudio?.status === "CONNECTED" ? "operational" : "degraded",
      latencyMs: ecosystemProbe?.titoStudio?.latencyMs ?? null,
    },
    {
      id: "t2_agent",
      nameAr: "وكيل المبيعات والردود (WhatsApp & Meta Agent)",
      status: ecosystemProbe?.t2Agent?.status === "CONNECTED" ? "operational" : "degraded",
      latencyMs: ecosystemProbe?.t2Agent?.latencyMs ?? null,
    },
    {
      id: "storefront_multi_tenant",
      nameAr: "محرك المتاجر السريعة (store.t2os.app)",
      status: storeCheck.up ? "operational" : "degraded",
      latencyMs: storeCheck.latencyMs,
    },
    {
      id: "booking_multi_tenant",
      nameAr: "محرك الحجوزات والخدمات (book.t2os.app)",
      status: bookCheck.up ? "operational" : "degraded",
      latencyMs: bookCheck.latencyMs,
    },
  ];

  const allOperational = components.every((c) => c.status === "operational" || c.status === "not_configured");
  return {
    ok: true,
    overallStatus: allOperational ? "operational" : "partial_degradation",
    checkedAt: new Date().toISOString(),
    components,
    infrastructure: {
      disk,
      backup: {
        intervalHours: backup.intervalHours,
        lastRunAt: backup.lastRun?.timestamp || null,
        lastRunOk: backup.lastRun?.ok ?? null,
        r2Configured: backup.r2Configured,
      },
    },
  };
}

function renderStatusHtml(report: Awaited<ReturnType<typeof buildPublicStatusReport>>): string {
  const isHealthy = report.overallStatus === "operational";
  const rows = report.components
    .map((c) => {
      const ok = c.status === "operational";
      const badgeColor = ok ? "#10b981" : c.status === "not_configured" ? "#94a3b8" : "#f59e0b";
      const badgeLabel = ok ? "يعمل بكفاءة" : c.status === "not_configured" ? "قيد التهيئة" : "تنبيه جزئي";
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-radius:14px;background:#0b1222;border:1px solid rgba(255,255,255,0.08);">
        <div style="font-weight:700;font-size:14px;color:#f8fafc;">${c.nameAr}</div>
        <div style="display:flex;align-items:center;gap:12px;">
          ${typeof c.latencyMs === "number" ? `<span style="font-size:12px;color:#94a3b8;font-family:monospace;">${c.latencyMs}ms</span>` : ""}
          <span style="padding:4px 12px;border-radius:999px;font-size:12px;font-weight:800;color:#020617;background:${badgeColor};">${badgeLabel}</span>
        </div>
      </div>`;
    })
    .join("");

  const disk = report.infrastructure.disk;
  const bkp = report.infrastructure.backup;
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>حالة منظومة T2OS الحية</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&display=swap" rel="stylesheet"/></head>
  <body style="margin:0;background:#030712;color:#fff;font-family:'Cairo',sans-serif;padding:32px 16px;">
  <div style="max-width:760px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:999px;background:${isHealthy ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)"};color:${isHealthy ? "#34d399" : "#fbbf24"};font-weight:800;font-size:13px;border:1px solid ${isHealthy ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"};">
        ● ${isHealthy ? "جميع الأنظمة تعمل بكفاءة 100%" : "رصد تباطؤ أو تنبيه في أحد الخدمات"}
      </div>
      <h1 style="margin:14px 0 6px;font-size:28px;font-weight:900;">حالة خوادم منظومة T2OS</h1>
      <p style="margin:0;color:#94a3b8;font-size:13px;">آخر فحص لحظي: ${report.checkedAt}</p>
    </div>
    <div style="display:grid;gap:10px;margin-bottom:22px;">${rows}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
      <div style="padding:16px;border-radius:16px;background:#0b1222;border:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px;color:#94a3b8;">مساحة القرص (Hetzner VPS)</div>
        <div style="font-size:20px;font-weight:900;margin-top:4px;">${disk ? `${disk.freeGb} GB متاح (${disk.usedPct}% مستخدم)` : "مراقب"}</div>
      </div>
      <div style="padding:16px;border-radius:16px;background:#0b1222;border:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px;color:#94a3b8;">النسخ الاحتياطي المشفر (كل ${bkp.intervalHours} ساعات)</div>
        <div style="font-size:15px;font-weight:800;margin-top:4px;color:${bkp.lastRunOk === false ? "#fb7185" : "#34d399"};">${bkp.lastRunAt ? `آخر نسخة: ${bkp.lastRunAt.slice(0, 16).replace("T", " ")}` : "مجدول ويعمل تلقائياً"}</div>
      </div>
    </div>
  </div>
  <script>setTimeout(()=>location.reload(),30000);</script>
  </body></html>`;
}

export function registerStatusPageRoutes(app: Express): void {
  app.get("/api/public/status", async (_req: Request, res: Response) => {
    try {
      const report = await buildPublicStatusReport();
      return res.json(report);
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Status probe failed" });
    }
  });

  app.get("/status", async (_req: Request, res: Response) => {
    const report = await buildPublicStatusReport();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(renderStatusHtml(report));
  });

  // Intercept requests arriving via https://status.t2os.app directly on "/"
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const host = String(req.headers.host || "").toLowerCase();
    if (host.startsWith("status.") && (req.path === "/" || req.path === "")) {
      const report = await buildPublicStatusReport();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(renderStatusHtml(report));
    }
    next();
  });
}
