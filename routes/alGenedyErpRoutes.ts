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

function isSameOriginBrowserRequest(req: Request): boolean {
  const fetchSite = String(req.headers["sec-fetch-site"] || "");
  if (fetchSite === "same-origin") return true;
  const host = String(req.headers.host || "");
  const origin = String(req.headers.origin || "");
  const referer = String(req.headers.referer || "");
  if (host && (origin.includes(host) || referer.includes(host))) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(origin || referer)) return true;
  return false;
}

export function registerAlGenedyErpRoutes(app: Express): void {
  app.get("/api/al-genedy/erp-state", (_req: Request, res: Response) => {
    const state = loadAlGenedyErpState();
    res.json({ ok: true, state });
  });

  app.post("/api/al-genedy/erp-state", async (req: Request, res: Response) => {
    try {
      const sameOrigin = isSameOriginBrowserRequest(req);
      if (!sameOrigin) {
        const auth = await verifyAdminRequest(req);
        if (!auth.ok) {
          return res.status(403).json({
            ok: false,
            error: "Forbidden: untrusted external origin requires admin authorization.",
          });
        }
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
}
