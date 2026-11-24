import fs from "fs";
import Redis from "ioredis";
import { runLiveEcosystemHealthProbe } from "./ecosystemConfigService";
import { t2AgentApi } from "./t2AgentApiClient";
import { getUnifiedGrowthBrands } from "./obsidianVaultService";
import { readBookings } from "./microservicesGateway";
import { getPersistentDataDir } from "./persistentStorage";
import { pingPostgres } from "./postgresService";

export interface DiskHealthStats {
  usedPct: number;
  freeGb: number;
  totalGb: number;
}

export function getDiskHealthStats(): DiskHealthStats | null {
  try {
    const statFn = (fs as any).statfsSync;
    if (typeof statFn !== "function") return null;
    const st = statFn(getPersistentDataDir());
    const bsize = Number(st.bsize || 4096);
    const totalBytes = Number(st.blocks || 0) * bsize;
    const freeBytes = Number(st.bavail || st.bfree || 0) * bsize;
    if (totalBytes <= 0) return null;
    const usedPct = Math.min(100, Math.round(((totalBytes - freeBytes) / totalBytes) * 100));
    return {
      usedPct,
      freeGb: Number((freeBytes / 1073741824).toFixed(2)),
      totalGb: Number((totalBytes / 1073741824).toFixed(2)),
    };
  } catch {
    return null;
  }
}

export async function pingRedisHealth(): Promise<{ configured: boolean; connected: boolean; latencyMs?: number }> {
  const url = String(process.env.REDIS_URL || "").trim();
  if (!url.startsWith("redis")) return { configured: false, connected: false };
  const t0 = Date.now();
  let client: Redis | null = null;
  try {
    client = new Redis(url, { connectTimeout: 4000, maxRetriesPerRequest: 1, lazyConnect: true });
    await client.connect();
    await client.ping();
    return { configured: true, connected: true, latencyMs: Date.now() - t0 };
  } catch {
    return { configured: true, connected: false };
  } finally {
    if (client) client.disconnect();
  }
}

export interface WatchdogSnapshot {
  checkedAt: string;
  ezZelOk: boolean;
  titoStudioStatus: string;
  t2AgentStatus: string;
  rssMb: number;
  diskUsedPct?: number;
  diskFreeGb?: number;
  postgresOk?: boolean;
  titoStudioUptimeSec?: number;
  t2AgentUptimeSec?: number;
}

export interface WatchdogAlertEntry {
  at: string;
  key: string;
  delivered: boolean;
  message: string;
}

const HISTORY_LIMIT = 20;
const ALERTS_LIMIT = 20;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const HIGH_RSS_THRESHOLD_MB = 1600;

const watchdogState: {
  started: boolean;
  snapshots: WatchdogSnapshot[];
  prevStudioStatus: string;
  prevAgentStatus: string;
  prevStudioUptime?: number;
  prevAgentUptime?: number;
  prevWhatsAppStatuses: Record<string, string>;
  lastBriefDateCairo?: string;
  lastAlertAt: Record<string, number>;
  lastAlerts: WatchdogAlertEntry[];
} = {
  started: false,
  snapshots: [],
  prevStudioStatus: "UNKNOWN",
  prevAgentStatus: "UNKNOWN",
  prevWhatsAppStatuses: {},
  lastAlertAt: {},
  lastAlerts: [],
};

/** Sends an operational HTML alert via Telegram when bot credentials are configured. */
export async function sendTelegramOpsAlert(
  message: string
): Promise<{ ok: boolean; reason?: string; status?: number }> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
  if (!botToken || !chatId || botToken.includes("ShadowBotOfficial")) {
    return { ok: false, reason: "missing_telegram_config" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(7000),
    });
    return { ok: res.ok, status: res.status, reason: res.ok ? undefined : `http_${res.status}` };
  } catch (err: any) {
    return { ok: false, reason: err?.message || "network_error" };
  }
}

async function emitAlertWithCooldown(key: string, message: string, cooldownMs = ALERT_COOLDOWN_MS) {
  const now = Date.now();
  if (now - (watchdogState.lastAlertAt[key] || 0) < cooldownMs) return;
  watchdogState.lastAlertAt[key] = now;
  const result = await sendTelegramOpsAlert(message);
  watchdogState.lastAlerts.unshift({
    at: new Date(now).toISOString(),
    key,
    delivered: result.ok,
    message,
  });
  if (watchdogState.lastAlerts.length > ALERTS_LIMIT) {
    watchdogState.lastAlerts.length = ALERTS_LIMIT;
  }
}

async function checkServiceTransition(input: {
  key: string;
  label: string;
  prevStatus: string;
  curStatus: string;
  prevUptime?: number;
  curUptime?: number;
  checkedAt: string;
}) {
  if (input.prevStatus === "CONNECTED" && input.curStatus !== "CONNECTED") {
    await emitAlertWithCooldown(
      `${input.key}_down`,
      `🚨 <b>[T2OS Watchdog]</b> تعذر الوصول إلى <b>${input.label}</b> (<code>${input.curStatus}</code>) عند ${input.checkedAt}`
    );
  } else if (
    input.prevStatus !== "UNKNOWN" &&
    input.prevStatus !== "CONNECTED" &&
    input.curStatus === "CONNECTED"
  ) {
    await emitAlertWithCooldown(
      `${input.key}_recovered`,
      `✅ <b>[T2OS Watchdog]</b> استعاد <b>${input.label}</b> الاتصال ويعمل الآن بكفاءة عند ${input.checkedAt}`,
      60_000
    );
  }

  if (
    typeof input.prevUptime === "number" &&
    typeof input.curUptime === "number" &&
    input.prevUptime > 60 &&
    input.curUptime < input.prevUptime
  ) {
    await emitAlertWithCooldown(
      `${input.key}_restart`,
      `🔄 <b>[T2OS Watchdog]</b> تم رصد إعادة تشغيل حاوية <b>${input.label}</b> (uptime تراجع من ${input.prevUptime}s إلى ${input.curUptime}s)`
    );
  }
}

async function runWatchdogTick(getStudioUrl: () => string, getAgentUrl: () => string) {
  try {
    const [probe, pgHealth] = await Promise.all([
      runLiveEcosystemHealthProbe(getStudioUrl(), getAgentUrl()),
      pingPostgres().catch(() => ({ configured: false, connected: false })),
    ]);
    const rssMb = Math.round(process.memoryUsage().rss / 1048576);
    const disk = getDiskHealthStats();
    const snap: WatchdogSnapshot = {
      checkedAt: probe.checkedAt,
      ezZelOk: probe.ezZel.status === "CONNECTED",
      titoStudioStatus: probe.titoStudio.status,
      t2AgentStatus: probe.t2Agent.status,
      rssMb,
      ...(disk ? { diskUsedPct: disk.usedPct, diskFreeGb: disk.freeGb } : {}),
      postgresOk: pgHealth.configured ? pgHealth.connected : undefined,
      titoStudioUptimeSec: probe.titoStudio.uptimeSeconds,
      t2AgentUptimeSec: probe.t2Agent.uptimeSeconds,
    };

    if (disk && disk.usedPct >= 85) {
      await emitAlertWithCooldown(
        "vps_disk_high",
        `💾 <b>[T2OS Disk Alert]</b> امتلاء قرص السيرفر وصل إلى <b>${disk.usedPct}%</b> (المتاح <b>${disk.freeGb} GB</b> من ${disk.totalGb} GB)!`
      );
    }
    if (pgHealth.configured && !pgHealth.connected) {
      await emitAlertWithCooldown(
        "postgres_down",
        `🛢️ <b>[T2OS Database Alert]</b> تعذر الاتصال بقاعدة بيانات PostgreSQL عند ${snap.checkedAt}`
      );
    }

    watchdogState.snapshots.unshift(snap);
    if (watchdogState.snapshots.length > HISTORY_LIMIT) {
      watchdogState.snapshots.length = HISTORY_LIMIT;
    }

    await checkServiceTransition({
      key: "studio",
      label: "Tito Studio",
      prevStatus: watchdogState.prevStudioStatus,
      curStatus: snap.titoStudioStatus,
      prevUptime: watchdogState.prevStudioUptime,
      curUptime: snap.titoStudioUptimeSec,
      checkedAt: snap.checkedAt,
    });

    await checkServiceTransition({
      key: "agent",
      label: "T2 AI Agent",
      prevStatus: watchdogState.prevAgentStatus,
      curStatus: snap.t2AgentStatus,
      prevUptime: watchdogState.prevAgentUptime,
      curUptime: snap.t2AgentUptimeSec,
      checkedAt: snap.checkedAt,
    });

    if (rssMb > HIGH_RSS_THRESHOLD_MB) {
      await emitAlertWithCooldown(
        "ez_zel_high_rss",
        `⚠️ <b>[T2OS Watchdog]</b> استهلاك الذاكرة في <b>Ez-Zel</b> مرتفع: <b>${rssMb} MB</b> (الحد التحذيري ${HIGH_RSS_THRESHOLD_MB} MB)`
      );
    }

    // Poll WhatsApp fleet statuses from T2 Agent and alert if any connected brand disconnects
    try {
      const fleetRes: any = await Promise.race([
        t2AgentApi.getAllBrandsHealth(),
        new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      const fleet = Array.isArray(fleetRes?.brands) ? fleetRes.brands : (Array.isArray(fleetRes) ? fleetRes : []);
      for (const item of fleet) {
        const bId = String(item?.brandId || item?.id || "").trim();
        if (!bId) continue;
        const curWa = String(item?.status || (item?.connected ? "CONNECTED" : "DISCONNECTED")).toUpperCase();
        const isConnectedNow = item?.connected === true || curWa === "CONNECTED" || curWa === "OPEN" || curWa === "READY";
        const normalizedState = isConnectedNow ? "CONNECTED" : curWa;
        const prevWa = watchdogState.prevWhatsAppStatuses[bId];
        if (prevWa === "CONNECTED" && !isConnectedNow) {
          const qrUrl = `https://agent.t2os.app/dashboard?brandId=${encodeURIComponent(bId)}`;
          await emitAlertWithCooldown(
            `wa_disconnect_${bId}`,
            `📵 <b>[T2OS WhatsApp Alert]</b> فصل اتصال واتساب لبراند <b>${item?.name || bId}</b> (<code>${normalizedState}</code>)\n🔗 <a href="${qrUrl}">فتح لوحة الأيجنت وتجديد QR فوراً</a>`
          );
        }
        watchdogState.prevWhatsAppStatuses[bId] = normalizedState;
      }
    } catch {}

    watchdogState.prevStudioStatus = snap.titoStudioStatus;
    watchdogState.prevAgentStatus = snap.t2AgentStatus;
    if (typeof snap.titoStudioUptimeSec === "number") {
      watchdogState.prevStudioUptime = snap.titoStudioUptimeSec;
    }
    if (typeof snap.t2AgentUptimeSec === "number") {
      watchdogState.prevAgentUptime = snap.t2AgentUptimeSec;
    }
  } catch (err: any) {
    console.warn("[EcosystemWatchdog] Probe error:", err?.message);
  }
}

export async function handleAgentDisconnectEvent(payload: {
  brandId: string;
  brandName?: string;
  status?: string;
  statusCode?: number;
  dashboardUrl?: string;
}): Promise<{ ok: boolean; brandId: string; alerted: boolean }> {
  const brandId = String(payload?.brandId || "").trim();
  if (!brandId) return { ok: false, brandId: "", alerted: false };
  const label = payload.brandName || brandId;
  const reason = payload.status || "DISCONNECTED";
  const dashboardUrl = payload.dashboardUrl || `https://agent.t2os.app/dashboard?brandId=${encodeURIComponent(brandId)}`;
  watchdogState.prevWhatsAppStatuses[brandId] = String(reason).toUpperCase();
  await emitAlertWithCooldown(
    `wa_disconnect_${brandId}`,
    `📵 <b>[T2OS Instant Alert]</b> انقطع اتصال واتساب لبراند <b>${label}</b> (<code>${reason}</code>${payload.statusCode ? ` / ${payload.statusCode}` : ""})\n🔗 <a href="${dashboardUrl}">فتح لوحة الأيجنت وإعادة الربط</a>`
  );
  return { ok: true, brandId, alerted: true };
}

export async function buildAndSendDailyCeoBrief(force = false): Promise<{
  sent: boolean;
  reason?: string;
  summaryText: string;
}> {
  const cairoParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const getPart = (t: string) => cairoParts.find((p) => p.type === t)?.value || "00";
  const todayCairo = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
  const hourCairo = Number(getPart("hour"));

  if (!force) {
    if (hourCairo !== 9 || watchdogState.lastBriefDateCairo === todayCairo) {
      return { sent: false, reason: "outside_schedule_or_already_sent", summaryText: "" };
    }
  }

  const allBrands = getUnifiedGrowthBrands();
  const activeBrands = allBrands.filter((b: any) => b?.lifecycleStage !== "paused_archive");
  const bookings = readBookings();

  let waConnected = 0;
  let waDisconnected = 0;
  try {
    const fleetRes: any = await Promise.race([
      t2AgentApi.getAllBrandsHealth(),
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    const fleet = Array.isArray(fleetRes?.brands) ? fleetRes.brands : (Array.isArray(fleetRes) ? fleetRes : []);
    for (const item of fleet) {
      const s = String(item?.status || "").toUpperCase();
      if (item?.connected === true || s === "CONNECTED" || s === "OPEN" || s === "READY") waConnected++;
      else waDisconnected++;
    }
  } catch {}

  const latest = watchdogState.snapshots[0];
  const rssMb = Math.round(process.memoryUsage().rss / 1048576);
  const summaryText =
    `☀️ <b>تقرير الصباح التنفيذي — منظومة T2OS (${todayCairo})</b>\n` +
    `• البراندات النشطة والتجريبية: <b>${activeBrands.length}</b> (من إجمالي ${allBrands.length})\n` +
    `• جلسات الواتساب (Agent): <b>${waConnected}</b> متصل | <b>${waDisconnected}</b> غير متصل\n` +
    `• إجمالي الحجوزات المسجلة: <b>${bookings.length}</b>\n` +
    `• صحة المحركات: الظل ✅ (${rssMb} MB) | الاستوديو: <code>${latest?.titoStudioStatus || "CONNECTED"}</code> | الأيجنت: <code>${latest?.t2AgentStatus || "CONNECTED"}</code>`;

  watchdogState.lastBriefDateCairo = todayCairo;
  const tg = await sendTelegramOpsAlert(summaryText);
  return { sent: tg.ok, reason: tg.reason, summaryText };
}

export function startEcosystemWatchdog(getStudioUrl: () => string, getAgentUrl: () => string): void {
  if (watchdogState.started) return;
  watchdogState.started = true;

  setTimeout(() => {
    runWatchdogTick(getStudioUrl, getAgentUrl);
  }, 15_000).unref();

  setInterval(() => {
    runWatchdogTick(getStudioUrl, getAgentUrl);
  }, 10 * 60 * 1000).unref();

  setInterval(() => {
    void buildAndSendDailyCeoBrief(false);
  }, 60 * 60 * 1000).unref();
}

export function getWatchdogStatus() {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
  const disk = getDiskHealthStats();
  return {
    active: watchdogState.started,
    telegramConfigured: Boolean(botToken && chatId && !botToken.includes("ShadowBotOfficial")),
    rssMb: Math.round(process.memoryUsage().rss / 1048576),
    disk,
    latest: watchdogState.snapshots[0] || null,
    historyCount: watchdogState.snapshots.length,
    history: watchdogState.snapshots,
    lastAlerts: watchdogState.lastAlerts,
  };
}
