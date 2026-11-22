import { runLiveEcosystemHealthProbe } from "./ecosystemConfigService";

export interface WatchdogSnapshot {
  checkedAt: string;
  ezZelOk: boolean;
  titoStudioStatus: string;
  t2AgentStatus: string;
}

const HISTORY_LIMIT = 20;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

const watchdogState: {
  started: boolean;
  snapshots: WatchdogSnapshot[];
  prevStudioStatus: string;
  prevAgentStatus: string;
  lastAlertAt: Record<string, number>;
} = {
  started: false,
  snapshots: [],
  prevStudioStatus: "UNKNOWN",
  prevAgentStatus: "UNKNOWN",
  lastAlertAt: {},
};

async function notifyTelegramAlert(message: string): Promise<void> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
  if (!botToken || !chatId || botToken.includes("ShadowBotOfficial")) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}

async function runWatchdogTick(getStudioUrl: () => string, getAgentUrl: () => string) {
  try {
    const probe = await runLiveEcosystemHealthProbe(getStudioUrl(), getAgentUrl());
    const snap: WatchdogSnapshot = {
      checkedAt: probe.checkedAt,
      ezZelOk: probe.ezZel.status === "CONNECTED",
      titoStudioStatus: probe.titoStudio.status,
      t2AgentStatus: probe.t2Agent.status,
    };

    watchdogState.snapshots.unshift(snap);
    if (watchdogState.snapshots.length > HISTORY_LIMIT) {
      watchdogState.snapshots.length = HISTORY_LIMIT;
    }

    const now = Date.now();
    if (
      watchdogState.prevStudioStatus === "CONNECTED" &&
      snap.titoStudioStatus !== "CONNECTED" &&
      now - (watchdogState.lastAlertAt.studio || 0) > ALERT_COOLDOWN_MS
    ) {
      watchdogState.lastAlertAt.studio = now;
      await notifyTelegramAlert(
        `🚨 <b>[T2OS Watchdog]</b> تعذر الوصول إلى <b>Tito Studio</b> (${snap.titoStudioStatus}) عند ${snap.checkedAt}`
      );
    }

    if (
      watchdogState.prevAgentStatus === "CONNECTED" &&
      snap.t2AgentStatus !== "CONNECTED" &&
      now - (watchdogState.lastAlertAt.agent || 0) > ALERT_COOLDOWN_MS
    ) {
      watchdogState.lastAlertAt.agent = now;
      await notifyTelegramAlert(
        `🚨 <b>[T2OS Watchdog]</b> تعذر الوصول إلى <b>T2 AI Agent</b> (${snap.t2AgentStatus}) عند ${snap.checkedAt}`
      );
    }

    watchdogState.prevStudioStatus = snap.titoStudioStatus;
    watchdogState.prevAgentStatus = snap.t2AgentStatus;
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
  return {
    active: watchdogState.started,
    latest: watchdogState.snapshots[0] || null,
    historyCount: watchdogState.snapshots.length,
    history: watchdogState.snapshots,
  };
}
