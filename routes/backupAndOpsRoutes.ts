import type { Express, Request, Response } from "express";
import { verifyAdminRequest } from "../services/serverAdminAuth";
import {
  buildEncryptedSnapshot,
  getOffServerBackupStatus,
  runOffServerBackup,
} from "../services/offServerBackupService";
import { getWatchdogStatus, sendTelegramOpsAlert } from "../services/ecosystemWatchdogService";

export function registerBackupAndOpsRoutes(app: Express): void {
  app.get("/api/admin/backups/status", async (req: Request, res: Response) => {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(401).json({ ok: false, error: "Unauthorized: admin access required." });
    }
    return res.json({
      ok: true,
      backup: getOffServerBackupStatus(),
      watchdog: getWatchdogStatus(),
    });
  });

  app.post("/api/admin/backups/run", async (req: Request, res: Response) => {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(401).json({ ok: false, error: "Unauthorized: admin access required." });
    }
    const reason = String(req.body?.reason || "manual").slice(0, 40);
    const result = await runOffServerBackup(reason);
    return res.status(result.ok ? 200 : 500).json(result);
  });

  app.get("/api/admin/backups/download", async (req: Request, res: Response) => {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(401).json({ ok: false, error: "Unauthorized: admin access required." });
    }
    try {
      const snap = buildEncryptedSnapshot();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="t2os-backup-${stamp}.enc.json"`
      );
      return res.send(JSON.stringify(snap.envelope, null, 2));
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Snapshot failed" });
    }
  });

  app.post("/api/admin/watchdog/test-alert", async (req: Request, res: Response) => {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(401).json({ ok: false, error: "Unauthorized: admin access required." });
    }
    const customMsg = String(req.body?.message || "").trim();
    const message =
      customMsg ||
      `🟢 <b>[T2OS Watchdog]</b> اختبار تنبيه التشغيل والنسخ الاحتياطي الحي ناجح — ${new Date().toISOString()}`;
    const delivery = await sendTelegramOpsAlert(message);
    return res.status(delivery.ok ? 200 : 502).json({
      ok: delivery.ok,
      delivery,
      watchdog: getWatchdogStatus(),
    });
  });
}
