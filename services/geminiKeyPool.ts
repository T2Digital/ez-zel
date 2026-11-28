import { GoogleGenAI } from '@google/genai';

export const ACTIVE_GEMINI_TEXT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
] as const;

export function sanitizeGeminiTextModel(model?: string): string {
  const m = String(model || '').trim();
  if (!m) return 'gemini-2.5-flash';
  if (/tts|image|nano-banana|veo|embedding|live/i.test(m)) {
    return m;
  }
  if (/gemini-1\.|gemini-2\.0|gemini-3\.0|gemini-3\.1|gemini-3\.5|gemini-3\.7|gemini-3\.8|gemini-omni/i.test(m)) {
    return 'gemini-2.5-flash';
  }
  return m;
}

interface KeyHealth {
  key: string;
  masked: string;
  invalidPermanent: boolean;
  successCount: number;
  failureCount: number;
  lastError?: string;
}

const keyPool = new Map<string, KeyHealth>();
// Cooldowns are isolated per (key::model) so a 429/503 on one model never poisons healthy models
const modelCooldowns = new Map<string, number>();
let roundRobinIdx = 0;

function maskKey(k: string): string {
  if (k.length <= 10) return '***';
  return `${k.slice(0, 6)}...${k.slice(-4)}`;
}

export function loadGeminiKeysFromEnv(): string[] {
  const rawSources = [
    process.env.GEMINI_API_KEYS,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
    process.env.GEMINI_API_KEY_9,
    process.env.GEMINI_API_KEY_10,
    process.env.VITE_GEMINI_API_KEY,
    process.env.API_KEY
  ].filter(Boolean);

  const keys: string[] = [];
  for (const raw of rawSources) {
    if (!raw) continue;
    const parts = String(raw)
      .split(/[,;\n\r]+/)
      .map((s) => s.replace(/^["']|["']$/g, '').trim())
      .filter(Boolean);
    for (const p of parts) {
      if (
        p &&
        !keys.includes(p) &&
        p !== 'dummy' &&
        p !== 'AIzaSyDummy' &&
        p !== 'undefined' &&
        p !== 'null' &&
        p.length > 20
      ) {
        keys.push(p);
        if (!keyPool.has(p)) {
          keyPool.set(p, {
            key: p,
            masked: maskKey(p),
            invalidPermanent: false,
            successCount: 0,
            failureCount: 0
          });
        }
      }
    }
  }
  return keys;
}

export function getNextHealthyGeminiKey(model = 'gemini-2.5-flash'): string {
  const keys = loadGeminiKeysFromEnv();
  if (keys.length === 0) return '';

  const targetModel = sanitizeGeminiTextModel(model);
  const now = Date.now();
  const healthy = keys.filter((k) => {
    const info = keyPool.get(k);
    const cd = modelCooldowns.get(`${k}::${targetModel}`) || 0;
    return info && !info.invalidPermanent && cd <= now;
  });

  if (healthy.length > 0) {
    const chosen = healthy[roundRobinIdx % healthy.length];
    roundRobinIdx = (roundRobinIdx + 1) % Math.max(1, healthy.length);
    return chosen;
  }

  const nonPermanent = keys.filter((k) => !keyPool.get(k)?.invalidPermanent);
  if (nonPermanent.length > 0) {
    nonPermanent.sort(
      (a, b) => (modelCooldowns.get(`${a}::${targetModel}`) || 0) - (modelCooldowns.get(`${b}::${targetModel}`) || 0)
    );
    return nonPermanent[0];
  }

  return keys[0];
}

export function markGeminiKeySuccess(key: string, model = 'gemini-3.5-flash-lite') {
  const info = keyPool.get(key);
  if (info) {
    info.successCount += 1;
  }
  modelCooldowns.delete(`${key}::${sanitizeGeminiTextModel(model)}`);
}

export function markGeminiKeyFailure(key: string, err: any, model = 'gemini-3.5-flash-lite') {
  const info = keyPool.get(key);
  if (!info) return;

  const msg = String(err?.message || err || '');
  info.failureCount += 1;
  info.lastError = msg.slice(0, 140);

  // Never poison key cooldown on 404 NOT_FOUND (model deprecation)
  if (/404|NOT_FOUND|no longer available/i.test(msg)) {
    return;
  }

  if (/API_KEY_INVALID|API key not valid|expired/i.test(msg)) {
    info.invalidPermanent = true;
    console.warn(`[GeminiKeyPool] Key ${info.masked} marked invalid permanently.`);
  } else {
    const cdKey = `${key}::${model}`;
    modelCooldowns.set(cdKey, Date.now() + 45_000);
    console.warn(`[GeminiKeyPool] Key ${info.masked} (${model}) rotated to 45s cooldown (${info.lastError}).`);
  }
}

export function getGeminiKeyPoolStatus() {
  const keys = loadGeminiKeysFromEnv();
  const now = Date.now();
  const primaryModel = ACTIVE_GEMINI_TEXT_MODELS[0];
  return {
    totalKeys: keys.length,
    healthyCount: keys.filter((k) => {
      const info = keyPool.get(k);
      const cd = modelCooldowns.get(`${k}::${primaryModel}`) || 0;
      return info && !info.invalidPermanent && cd <= now;
    }).length,
    activeModels: [...ACTIVE_GEMINI_TEXT_MODELS],
    keys: keys.map((k) => {
      const info = keyPool.get(k)!;
      const cd = modelCooldowns.get(`${k}::${primaryModel}`) || 0;
      return {
        masked: info.masked,
        status: info.invalidPermanent ? 'INVALID' : cd > now ? 'COOLDOWN' : 'HEALTHY',
        successCount: info.successCount,
        failureCount: info.failureCount,
        lastError: info.lastError
      };
    })
  };
}

/**
 * Returns a GoogleGenAI-compatible client whose models.generateContent()
 * sanitizes deprecated models and rotates across all configured Gemini keys.
 */
export function createRotatingServerAI(): GoogleGenAI {
  const keys = loadGeminiKeysFromEnv();
  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const primaryKey = getNextHealthyGeminiKey();
  const baseClient = new GoogleGenAI({
    apiKey: primaryKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const originalGenerateContent = baseClient.models.generateContent.bind(baseClient.models);
  const originalGenerateImages = (baseClient.models as any).generateImages?.bind(baseClient.models);

  const shouldRotateError = (err: any) => {
    const msg = String(err?.message || err || '');
    return /429|403|quota|RESOURCE_EXHAUSTED|PERMISSION_DENIED|billing|suspended|rate|limit|API_KEY_INVALID|API key not valid|expired|500|503|UNAVAILABLE|overloaded/i.test(msg);
  };

  const rotatingGenerateContent = async (params: any) => {
    const safeModel = sanitizeGeminiTextModel(params?.model);
    const safeParams = params?.model !== safeModel ? { ...params, model: safeModel } : params;
    const candidateKeys = loadGeminiKeysFromEnv();
    const maxAttempts = Math.max(1, candidateKeys.length);
    let lastErr: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = getNextHealthyGeminiKey(safeModel);
      try {
        const client =
          key === primaryKey
            ? baseClient
            : new GoogleGenAI({
                apiKey: key,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
              });
        const res = await (key === primaryKey
          ? originalGenerateContent(safeParams)
          : client.models.generateContent(safeParams));
        markGeminiKeySuccess(key, safeModel);
        return res;
      } catch (err: any) {
        lastErr = err;
        markGeminiKeyFailure(key, err, safeModel);
        if (!shouldRotateError(err) || attempt === maxAttempts - 1) {
          throw err;
        }
      }
    }
    throw lastErr;
  };

  (baseClient.models as any).generateContent = rotatingGenerateContent;

  if (originalGenerateImages) {
    (baseClient.models as any).generateImages = async (params: any) => {
      const candidateKeys = loadGeminiKeysFromEnv();
      const maxAttempts = Math.max(1, candidateKeys.length);
      let lastErr: any = null;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const key = getNextHealthyGeminiKey('image');
        try {
          const client = key === primaryKey ? baseClient : new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
          const res = await (key === primaryKey ? originalGenerateImages(params) : (client.models as any).generateImages(params));
          markGeminiKeySuccess(key, 'image');
          return res;
        } catch (err: any) {
          lastErr = err;
          markGeminiKeyFailure(key, err, 'image');
          if (!shouldRotateError(err) || attempt === maxAttempts - 1) throw err;
        }
      }
      throw lastErr;
    };
  }

  return baseClient;
}
