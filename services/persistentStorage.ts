import fs from "fs";
import path from "path";

let firebaseProjectId = "";
let firebaseApiKey = "";

try {
  const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    firebaseProjectId = cfg.projectId || "";
    firebaseApiKey = cfg.apiKey || "";
  }
} catch {}

/**
 * Resolves the active data directory.
 * On Render, set PERSISTENT_DATA_DIR=/var/data when a Persistent Disk is mounted.
 * Falls back to ./data locally.
 */
export function getPersistentDataDir(): string {
  const baseDir = process.env.PERSISTENT_DATA_DIR || path.join(process.cwd(), "data");
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
}

export function getPersistentFilePath(filename: string): string {
  return path.join(getPersistentDataDir(), filename);
}

let cachedIdToken: string | null = null;
let cachedTokenExp = 0;

async function getFirestoreAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!firebaseApiKey) return headers;
  if (cachedIdToken && Date.now() < cachedTokenExp) {
    headers.Authorization = `Bearer ${cachedIdToken}`;
    return headers;
  }

  const authFile = getPersistentFilePath("persistent_firestore_auth.json");
  try {
    if (fs.existsSync(authFile)) {
      const saved = JSON.parse(fs.readFileSync(authFile, "utf8"));
      if (saved?.refreshToken) {
        const res = await fetch(
          `https://securetoken.googleapis.com/v1/token?key=${firebaseApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(saved.refreshToken)}`,
            signal: AbortSignal.timeout(5000),
          }
        );
        if (res.ok) {
          const data: any = await res.json();
          if (data?.id_token) {
            cachedIdToken = data.id_token;
            cachedTokenExp = Date.now() + 50 * 60 * 1000;
            if (data.refresh_token && data.refresh_token !== saved.refreshToken) {
              writeJsonAtomic(authFile, { refreshToken: data.refresh_token, updatedAt: new Date().toISOString() });
            }
            headers.Authorization = `Bearer ${cachedIdToken}`;
            return headers;
          }
        }
      }
    }
  } catch {}

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnSecureToken: true }),
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok) {
      const data: any = await res.json();
      if (data?.idToken) {
        cachedIdToken = data.idToken;
        cachedTokenExp = Date.now() + 50 * 60 * 1000;
        if (data.refreshToken) {
          writeJsonAtomic(authFile, { refreshToken: data.refreshToken, updatedAt: new Date().toISOString() });
        }
        headers.Authorization = `Bearer ${cachedIdToken}`;
      }
    }
  } catch {}

  return headers;
}

/**
 * Mirrors a JSON payload to Firestore `system_state/{docKey}` via REST API
 * so critical state survives Render ephemeral container restarts even without a paid disk.
 */
export async function mirrorStateToFirestore(docKey: string, payload: any): Promise<void> {
  if (!firebaseProjectId || !firebaseApiKey) return;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/system_state/${encodeURIComponent(
      docKey
    )}?key=${firebaseApiKey}`;
    const headers = await getFirestoreAuthHeaders();

    await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        fields: {
          jsonPayload: { stringValue: JSON.stringify(payload) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
      signal: AbortSignal.timeout(6000),
    });
  } catch (e: any) {
    console.warn(`[PersistentStorage] Firestore mirror skipped (${docKey}):`, e?.message);
  }
}

/**
 * Restores a JSON payload from Firestore `system_state/{docKey}` if local disk was wiped.
 */
export async function restoreStateFromFirestore<T = any>(docKey: string): Promise<T | null> {
  if (!firebaseProjectId || !firebaseApiKey) return null;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/system_state/${encodeURIComponent(
      docKey
    )}?key=${firebaseApiKey}`;
    const headers = await getFirestoreAuthHeaders();

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const doc = await res.json();
    const raw = doc?.fields?.jsonPayload?.stringValue;
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Atomically writes JSON to disk via temp file + rename to prevent corruption under concurrent writes.
 */
export function writeJsonAtomic(filePath: string, payload: any): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), "utf8");
  fs.renameSync(tmpPath, filePath);
}

/**
 * Saves JSON both to persistent local disk AND asynchronously to Firestore cloud backup.
 */
export function savePersistentJson(docKey: string, filename: string, payload: any): void {
  const filePath = getPersistentFilePath(filename);
  writeJsonAtomic(filePath, payload);
  void mirrorStateToFirestore(docKey, payload);
}

/**
 * Reads JSON from local disk, or falls back to defaultValue.
 */
export function readPersistentJson<T = any>(filename: string, defaultValue: T): T {
  try {
    const filePath = getPersistentFilePath(filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
    }
  } catch {}
  return defaultValue;
}

export const CRITICAL_PERSISTENT_STATE_KEYS = [
  { docKey: "tenants_vault", filename: "tenants.json" },
  { docKey: "tenant_records", filename: "tenant_records.json" },
  { docKey: "paymob_subscriptions", filename: "paymob_subscriptions.json" },
  { docKey: "ezzel_clients", filename: "ezzel_clients.json" },
  { docKey: "briefing_preferences", filename: "briefing_preferences.json" },
  { docKey: "dispatched_briefings", filename: "dispatched_briefings.json" },
  { docKey: "t2_saas_plans_override", filename: "t2_saas_plans_override.json" },
  { docKey: "t2_dynamic_brain_config", filename: "t2_dynamic_brain_config.json" },
  { docKey: "t2_unified_brand_registry", filename: "t2_unified_brand_registry.json" },
  { docKey: "t2_brand_monthly_quotas", filename: "t2_brand_monthly_quotas.json" },
  { docKey: "t2_utm_attributions", filename: "t2_utm_attributions.json" },
  { docKey: "t2_social_publish_queue", filename: "t2_social_publish_queue.json" },
  { docKey: "t2_lifecycle_events", filename: "t2_lifecycle_events.json" },
  { docKey: "t2_brands_vault", filename: "brands.json" },
  { docKey: "t2_brand_hub_configs", filename: "brand_hub_configs.json" },
] as const;

/**
 * Hydrates local disk files from Firestore on server boot if they are missing
 * (e.g., right after a Render deploy/restart).
 */
export async function hydrateCriticalStateOnBoot(): Promise<void> {
  await Promise.allSettled(
    CRITICAL_PERSISTENT_STATE_KEYS.map(async (item) => {
      const localPath = getPersistentFilePath(item.filename);
      if (!fs.existsSync(localPath)) {
        const cloudData = await restoreStateFromFirestore(item.docKey);
        if (cloudData) {
          writeJsonAtomic(localPath, cloudData);
          console.log(`[PersistentStorage] Hydrated ${item.filename} from Firestore cloud backup.`);
        }
      }
    })
  );
}
