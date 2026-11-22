import type { Express, Request, Response } from "express";
import fs from "fs";
import { getPersistentFilePath, writeJsonAtomic } from "../services/persistentStorage";
import { verifyAdminRequest } from "../services/serverAdminAuth";

export interface AlGenedyErpState {
  quotes?: any[];
  inventory?: any[];
  attendance?: any[];
  updatedAt?: string;
}

const STATE_FILE = getPersistentFilePath("al_genedy_erp_state.json");

export function loadAlGenedyErpState(): AlGenedyErpState {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return { quotes: [], inventory: [], attendance: [] };
    }
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return raw && typeof raw === "object"
      ? {
          quotes: Array.isArray(raw.quotes) ? raw.quotes : [],
          inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
          attendance: Array.isArray(raw.attendance) ? raw.attendance : [],
          updatedAt: raw.updatedAt,
        }
      : { quotes: [], inventory: [], attendance: [] };
  } catch {
    return { quotes: [], inventory: [], attendance: [] };
  }
}

export function saveAlGenedyErpState(partial: Partial<AlGenedyErpState>): AlGenedyErpState {
  const current = loadAlGenedyErpState();
  const next: AlGenedyErpState = {
    quotes: Array.isArray(partial.quotes) ? partial.quotes : current.quotes || [],
    inventory: Array.isArray(partial.inventory) ? partial.inventory : current.inventory || [],
    attendance: Array.isArray(partial.attendance) ? partial.attendance : current.attendance || [],
    updatedAt: new Date().toISOString(),
  };
  writeJsonAtomic(STATE_FILE, next);
  return next;
}

export function sanitizePublicAlGenedyState(state: AlGenedyErpState): AlGenedyErpState {
  return {
    inventory: Array.isArray(state?.inventory) ? state.inventory : [],
    quotes: [],
    attendance: [],
    updatedAt: state?.updatedAt,
  };
}

export function appendPublicQuoteRequest(body: Record<string, any>): AlGenedyErpState {
  const current = loadAlGenedyErpState();
  const quoteId = `pub_q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const record = {
    id: quoteId,
    refCode: `ALG-PUB-${String(Date.now()).slice(-5)}`,
    createdAt: new Date().toISOString().split("T")[0],
    stage: "quote_requested",
    customerName: String(body.customerName || "").trim().slice(0, 120),
    customerPhone: String(body.customerPhone || "").trim().slice(0, 40),
    projectTitle: String(body.projectTitle || "طلب عرض سعر واجهة / إعلان").trim().slice(0, 200),
    specsSummary: String(body.specsSummary || body.notes || "").trim().slice(0, 1000),
    estimatedTotal: Number(body.estimatedTotal) > 0 ? Number(body.estimatedTotal) : undefined,
    source: "public_storefront",
  };
  const nextQuotes = [record, ...(current.quotes || [])].slice(0, 500);
  return saveAlGenedyErpState({ quotes: nextQuotes });
}

export function registerAlGenedyErpRoutes(app: Express): void {
  app.get("/api/al-genedy/erp-state", async (req: Request, res: Response) => {
    try {
      const state = loadAlGenedyErpState();
      const auth = await verifyAdminRequest(req);
      if (auth.ok) {
        return res.json({ ok: true, scope: "admin", state });
      }
      return res.json({
        ok: true,
        scope: "public",
        state: sanitizePublicAlGenedyState(state),
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed to load ERP state" });
    }
  });

  app.post("/api/al-genedy/erp-state", async (req: Request, res: Response) => {
    try {
      const auth = await verifyAdminRequest(req);
      if (!auth.ok) {
        return res.status(401).json({
          ok: false,
          error: "Unauthorized: admin bearer token or x-api-key required to update Al-Genedy ERP state.",
        });
      }

      const body = req.body || {};
      const partial: Partial<AlGenedyErpState> = {};
      if (Array.isArray(body.quotes)) partial.quotes = body.quotes.slice(0, 500);
      if (Array.isArray(body.inventory)) partial.inventory = body.inventory.slice(0, 1000);
      if (Array.isArray(body.attendance)) partial.attendance = body.attendance.slice(0, 2000);

      const saved = saveAlGenedyErpState(partial);
      return res.json({ ok: true, updatedAt: saved.updatedAt });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed to save ERP state" });
    }
  });

  app.post("/api/al-genedy/public/quote-request", (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const customerName = String(body.customerName || "").trim();
      const customerPhone = String(body.customerPhone || "").trim();
      if (!customerName || !customerPhone) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed: customerName and customerPhone are required.",
        });
      }
      const saved = appendPublicQuoteRequest(body);
      const created = (saved.quotes || [])[0];
      return res.status(201).json({ ok: true, refCode: created?.refCode, quoteId: created?.id, updatedAt: saved.updatedAt });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed to submit quote request" });
    }
  });
}
