import { GoogleGenAI } from "@google/genai";
import { sendTelegramOpsAlert } from "./ecosystemWatchdogService";

export type AiModelRole = "text" | "vision" | "image" | "video";

const DEFAULT_MODEL_POOLS: Record<AiModelRole, string[]> = {
  text: ["gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-3.8-flash"],
  vision: ["gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-3.8-flash"],
  image: ["gemini-3.1-flash-lite-image", "gemini-2.5-flash-image"],
  video: ["veo-3.1-generate-preview"],
};

const ENV_KEY_BY_ROLE: Record<AiModelRole, string> = {
  text: "AI_TEXT_MODELS",
  vision: "AI_VISION_MODELS",
  image: "AI_IMAGE_MODELS",
  video: "AI_VIDEO_MODELS",
};

const CIRCUIT_BREAKER_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for 404/deprecated models
const TRANSIENT_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes for 503/429 spikes

interface CircuitState {
  reason: "deprecated_404" | "transient_error";
  blockedUntil: number;
  lastError: string;
  alerted: boolean;
}

const modelCircuitBreaker = new Map<string, CircuitState>();

/**
 * Layer 1: Env-Driven Model Registry.
 * Reads comma-separated models from Coolify env vars (AI_TEXT_MODELS, AI_VISION_MODELS, etc.)
 * so models can be swapped in production without code changes or rebuilds.
 */
export function getModelPool(role: AiModelRole): string[] {
  const envName = ENV_KEY_BY_ROLE[role];
  const raw = String(process.env[envName] || "").trim();
  const list = raw
    ? raw.split(/[,;\n\r]+/).map((m) => m.trim()).filter(Boolean)
    : [...DEFAULT_MODEL_POOLS[role]];
  const now = Date.now();

  const healthy = list.filter((m) => {
    const st = modelCircuitBreaker.get(m);
    return !st || st.blockedUntil <= now;
  });

  // Always return at least the full list if everything is in cooldown so requests still attempt recovery
  return healthy.length > 0 ? healthy : list;
}

export function getRouterHealthSnapshot(): {
  pools: Record<AiModelRole, string[]>;
  trippedModels: Array<{ model: string; reason: string; blockedUntil: string; lastError: string }>;
} {
  const now = Date.now();
  const tripped: Array<{ model: string; reason: string; blockedUntil: string; lastError: string }> = [];
  for (const [model, st] of modelCircuitBreaker.entries()) {
    if (st.blockedUntil > now) {
      tripped.push({
        model,
        reason: st.reason,
        blockedUntil: new Date(st.blockedUntil).toISOString(),
        lastError: st.lastError.slice(0, 180),
      });
    }
  }
  return {
    pools: {
      text: getModelPool("text"),
      vision: getModelPool("vision"),
      image: getModelPool("image"),
      video: getModelPool("video"),
    },
    trippedModels: tripped,
  };
}

function classifyError(err: any): { is404: boolean; isTransient: boolean; message: string } {
  const msg = String(err?.message || err || "");
  const status = Number(err?.status || err?.code || 0);
  const is404 =
    status === 404 ||
    /404|not found|no longer available|deprecated|NOT_FOUND/i.test(msg);
  const isTransient =
    status === 429 ||
    status === 503 ||
    /429|503|high demand|quota|rate limit|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(msg);
  return { is404, isTransient, message: msg };
}

/**
 * Layers 2 & 3: Model Waterfall + Circuit Breaker + Telegram Deprecation Alert.
 * Automatically fails over across healthy models and alerts ops on Telegram if a model returns 404.
 */
export async function generateContentWithRouter(params: {
  apiKey: string;
  role: "text" | "vision";
  contents: any;
  config?: Record<string, any>;
  serviceTag?: string;
}): Promise<{ text: string; modelUsed: string }> {
  const models = getModelPool(params.role);
  const ai = new GoogleGenAI({ apiKey: params.apiKey });
  let lastErr: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const res = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config as any,
      });
      if (res?.text) {
        return { text: res.text, modelUsed: model };
      }
    } catch (err: any) {
      lastErr = err;
      const { is404, isTransient, message } = classifyError(err);
      if (is404) {
        const prev = modelCircuitBreaker.get(model);
        const alreadyAlerted = Boolean(prev?.alerted && prev.blockedUntil > Date.now());
        modelCircuitBreaker.set(model, {
          reason: "deprecated_404",
          blockedUntil: Date.now() + CIRCUIT_BREAKER_TTL_MS,
          lastError: message,
          alerted: true,
        });
        if (!alreadyAlerted) {
          const nextModel = models[i + 1] || "fallback";
          sendTelegramOpsAlert(
            `⚠️ *تنبيه توقف موديل AI (404)*\n` +
              `• الخدمة: \`${params.serviceTag || "t2os-ez-zel"}\`\n` +
              `• الموديل المتوقف: \`${model}\`\n` +
              `• تم التحويل تلقائياً إلى: \`${nextModel}\`\n` +
              `• تم عزله في Circuit Breaker لمدة 24 ساعة — حدّث \`${ENV_KEY_BY_ROLE[params.role]}\` في Coolify عند الحاجة.`
          ).catch(() => {});
        }
      } else if (isTransient) {
        modelCircuitBreaker.set(model, {
          reason: "transient_error",
          blockedUntil: Date.now() + TRANSIENT_COOLDOWN_MS,
          lastError: message,
          alerted: false,
        });
      }
    }
  }

  throw lastErr || new Error(`All AI models failed for role=${params.role}`);
}
