import { runLiveEcosystemHealthProbe } from "./ecosystemConfigService";

export interface WatchdogSnapshot {
  checkedAt: string;
  ezZelOk: boolean;
  titoStudioStatus: string;
  t2AgentStatus: string;
  rssMb: number;
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
  lastAlertAt: Record<string, number>;
  lastAlerts: WatchdogAlertEntry[];
} = {
  started: false,
  snapshots: [],
  prevStudioStatus: "UNKNOWN",
  prevAgentStatus: "UNKNOWN",
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
    const probe = await runLiveEcosystemHealthProbe(getStudioUrl(), getAgentUrl());
    const rssMb = Math.round(process.memoryUsage().rss / 1048576);
    const snap: WatchdogSnapshot = {
      checkedAt: probe.checkedAt,
      ezZelOk: probe.ezZel.status === "CONNECTED",
      titoStudioStatus: probe.titoStudio.status,
      t2AgentStatus: probe.t2Agent.status,
      rssMb,
      titoStudioUptimeSec: probe.titoStudio.uptimeSeconds,
      t2AgentUptimeSec: probe.t2Agent.uptimeSeconds,
    };

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

export function startEcosystemWatchdog(getStudioUrl: () => string, getAgentUrl: () => string): void {
  if (watchdogState.started) return;
  watchdogState.started = true;

  setTimeout(() => {
    runWatchdogTick(getStudioUrl, getAgentUrl);
  }, 15_000).unref();

  setInterval(() => {
    runWatchdogTick(getStudioUrl, getAgentUrl);
  }, 10 * 60 * 1000).unref();
}

export function getWatchdogStatus() {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
  return {
    active: watchdogState.started,
    telegramConfigured: Boolean(botToken && chatId && !botToken.includes("ShadowBotOfficial")),
    rssMb: Math.round(process.memoryUsage().rss / 1048576),
    latest: watchdogState.snapshots[0] || null,
    historyCount: watchdogState.snapshots.length,
    history: watchdogState.snapshots,
    lastAlerts: watchdogState.lastAlerts,
  };
}
