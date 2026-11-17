import { GoogleGenAI } from '@google/genai';

interface KeyHealth {
  key: string;
  masked: string;
  cooldownUntil: number;
  invalidPermanent: boolean;
  successCount: number;
  failureCount: number;
  lastError?: string;
}

const keyPool = new Map<string, KeyHealth>();
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
            cooldownUntil: 0,
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

export function getNextHealthyGeminiKey(): string {
  const keys = loadGeminiKeysFromEnv();
  if (keys.length === 0) return '';

  const now = Date.now();
  const healthy = keys.filter((k) => {
    const info = keyPool.get(k);
    return info && !info.invalidPermanent && info.cooldownUntil <= now;
  });

  if (healthy.length > 0) {
    const chosen = healthy[roundRobinIdx % healthy.length];
    roundRobinIdx = (roundRobinIdx + 1) % Math.max(1, healthy.length);
    return chosen;
  }

  // All non-permanent keys are in temporary cooldown; pick the one whose cooldown expires earliest
  const nonPermanent = keys.filter((k) => !keyPool.get(k)?.invalidPermanent);
  if (nonPermanent.length > 0) {
    nonPermanent.sort((a, b) => (keyPool.get(a)?.cooldownUntil || 0) - (keyPool.get(b)?.cooldownUntil || 0));
    return nonPermanent[0];
  }

  return keys[0];
}

export function markGeminiKeySuccess(key: string) {
  const info = keyPool.get(key);
  if (info) {
    info.successCount += 1;
    info.cooldownUntil = 0;
  }
}

export function markGeminiKeyFailure(key: string, err: any) {
  const info = keyPool.get(key);
  if (!info) return;

  const msg = String(err?.message || err || '');
  info.failureCount += 1;
  info.lastError = msg.slice(0, 140);

  if (/API_KEY_INVALID|API key not valid|expired|PERMISSION_DENIED/i.test(msg)) {
    info.invalidPermanent = true;
    console.warn(`[GeminiKeyPool] Key ${info.masked} marked invalid permanently.`);
  } else {
    // 429 / RESOURCE_EXHAUSTED / transient quota -> 60s cooldown
    info.cooldownUntil = Date.now() + 60_000;
    console.warn(`[GeminiKeyPool] Key ${info.masked} rotated to 60s cooldown (${info.lastError}).`);
  }
}

export function getGeminiKeyPoolStatus() {
  const keys = loadGeminiKeysFromEnv();
  const now = Date.now();
  return {
    totalKeys: keys.length,
    healthyCount: keys.filter((k) => {
      const info = keyPool.get(k);
      return info && !info.invalidPermanent && info.cooldownUntil <= now;
    }).length,
    keys: keys.map((k) => {
      const info = keyPool.get(k)!;
      return {
        masked: info.masked,
        status: info.invalidPermanent ? 'INVALID' : info.cooldownUntil > now ? 'COOLDOWN' : 'HEALTHY',
        successCount: info.successCount,
        failureCount: info.failureCount,
        lastError: info.lastError
      };
    })
  };
}

/**
 * Returns a GoogleGenAI-compatible client whose models.generateContent()
 * automatically rotates across all configured Gemini keys on quota/429/invalid-key errors.
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
    const candidateKeys = loadGeminiKeysFromEnv();
    const maxAttempts = Math.max(1, candidateKeys.length);
    let lastErr: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = attempt === 0 ? primaryKey : getNextHealthyGeminiKey();
      try {
        const client =
          attempt === 0
            ? baseClient
            : new GoogleGenAI({
                apiKey: key,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
              });
        const res = await (attempt === 0
          ? originalGenerateContent(params)
          : client.models.generateContent(params));
        markGeminiKeySuccess(key);
        return res;
      } catch (err: any) {
        lastErr = err;
        markGeminiKeyFailure(key, err);
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
        const key = attempt === 0 ? primaryKey : getNextHealthyGeminiKey();
        try {
          const client = attempt === 0 ? baseClient : new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
          const res = await (attempt === 0 ? originalGenerateImages(params) : (client.models as any).generateImages(params));
          markGeminiKeySuccess(key);
          return res;
        } catch (err: any) {
          lastErr = err;
          markGeminiKeyFailure(key, err);
          if (!shouldRotateError(err) || attempt === maxAttempts - 1) throw err;
        }
      }
      throw lastErr;
    };
  }

  return baseClient;
}
