import Redis from "ioredis";

/**
 * Shared Redis + In-Memory TTL cache layer for fast (<5ms) brand & telemetry reads.
 * Uses REDIS_URL when configured, and falls back gracefully to in-memory Map in dev/test.
 */

interface LocalCacheEntry {
  value: string;
  expiresAt: number;
}

const localMemoryCache = new Map<string, LocalCacheEntry>();
let redisClient: Redis | null = null;
let redisReady = false;

function initRedisOnce(): Redis | null {
  if (redisClient) return redisClient;
  const url = String(process.env.REDIS_URL || "").trim();
  if (!url || !url.startsWith("redis")) return null;
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 2500,
    });
    redisClient.on("ready", () => {
      redisReady = true;
    });
    redisClient.on("error", () => {
      redisReady = false;
    });
    redisClient.connect().catch(() => {
      redisReady = false;
    });
    return redisClient;
  } catch {
    return null;
  }
}

export async function getCachedJson<T = any>(key: string): Promise<T | null> {
  const client = initRedisOnce();
  if (client && redisReady) {
    try {
      const raw = await Promise.race([
        client.get(key),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 350)),
      ]);
      if (raw) return JSON.parse(raw) as T;
    } catch {}
  }
  const hit = localMemoryCache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    try {
      return JSON.parse(hit.value) as T;
    } catch {
      return null;
    }
  }
  if (hit) localMemoryCache.delete(key);
  return null;
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
  const serialized = JSON.stringify(value);
  localMemoryCache.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  // Keep in-memory cache bounded
  if (localMemoryCache.size > 500) {
    const oldestKey = localMemoryCache.keys().next().value;
    if (oldestKey) localMemoryCache.delete(oldestKey);
  }
  const client = initRedisOnce();
  if (client && redisReady) {
    try {
      await client.set(key, serialized, "EX", Math.max(1, ttlSeconds));
    } catch {}
  }
}

export async function invalidateCacheKeys(keys: string[]): Promise<void> {
  for (const k of keys) {
    localMemoryCache.delete(k);
  }
  const client = initRedisOnce();
  if (client && redisReady && keys.length > 0) {
    try {
      await client.del(...keys);
    } catch {}
  }
}

export function isRedisCacheActive(): boolean {
  return Boolean(redisClient && redisReady);
}
