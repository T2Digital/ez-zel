import type { Express, Request, Response } from "express";
import { verifyAdminRequest } from "../services/serverAdminAuth";
import { recordAiCostEvent, getBrandAiCostMarginsSummary } from "../services/aiCostLedgerService";
import crypto from "crypto";

function safeKeyMatch(provided: string, expected: string): boolean {
  const ha = crypto.createHash("sha256").update(provided).digest();
  const hb = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function isServiceTelemetryAuthorized(req: Request): boolean {
  const key = String(req.headers["x-api-key"] || req.headers["x-admin-key"] || req.headers["x-t2-api-key"] || "").trim();
  if (!key) return false;
  const validKeys = [
    process.env.T2_REMOTE_API_KEY,
    process.env.TITO_STUDIO_API_KEY,
    process.env.T2_AGENT_ADMIN_KEY,
    process.env.ADMIN_API_SECRET,
    process.env.ADMIN_SECRET_KEY,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  return validKeys.some((k) => safeKeyMatch(key, k));
}

export function registerAiCostLedgerRoutes(
  app: Express,
  deps: { getUnifiedGrowthBrands: () => any[] }
): void {
  // Microservice telemetry ingestion endpoint (called by T2 Studio & T2 Agent)
  app.post("/api/telemetry/ai-usage", async (req: Request, res: Response) => {
    const adminCheck = await verifyAdminRequest(req).catch(() => ({ ok: false }));
    if (!adminCheck.ok && !isServiceTelemetryAuthorized(req)) {
      return res.status(401).json({ ok: false, error: "Unauthorized telemetry source" });
    }
    try {
      const b = req.body || {};
      const items = Array.isArray(b.events) ? b.events : [b];
      let recorded = 0;
      for (const it of items.slice(0, 100)) {
        if (!it || !it.operation) continue;
        await recordAiCostEvent({
          brandId: String(it.brandId || "system"),
          service: String(it.service || "external"),
          operation: String(it.operation || "text"),
          model: String(it.model || "gemini-flash"),
          inputUnits: Number(it.inputUnits || 0),
          outputUnits: Number(it.outputUnits || 0),
          explicitCostUsd: typeof it.explicitCostUsd === "number" ? it.explicitCostUsd : undefined,
        });
        recorded++;
      }
      return res.json({ ok: true, recorded });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed logging AI usage" });
    }
  });

  // Master Admin view: per-brand AI costs vs net revenue & profit margin
  app.get("/api/admin/ai-costs/summary", async (req: Request, res: Response) => {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(401).json({ ok: false, error: "Unauthorized: Admin access required" });
    }
    try {
      const days = Math.max(1, Math.min(365, Number(req.query.days || 30)));
      const brands = deps.getUnifiedGrowthBrands();
      const summary = await getBrandAiCostMarginsSummary(brands, days);
      return res.json({ ok: true, ...summary });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed computing AI cost summary" });
    }
  });
}
