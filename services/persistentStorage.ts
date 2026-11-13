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

    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          jsonPayload: { stringValue: JSON.stringify(payload) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
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

    const res = await fetch(url);
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
 * Saves JSON both to persistent local disk AND asynchronously to Firestore cloud backup.
 */
export function savePersistentJson(docKey: string, filename: string, payload: any): void {
  const filePath = getPersistentFilePath(filename);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
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

/**
 * Hydrates local disk files from Firestore on server boot if they are missing
 * (e.g., right after a Render deploy/restart).
 */
export async function hydrateCriticalStateOnBoot(): Promise<void> {
  const keys = [
    { docKey: "tenants_vault", filename: "tenants.json" },
    { docKey: "briefing_preferences", filename: "briefing_preferences.json" },
    { docKey: "dispatched_briefings", filename: "dispatched_briefings.json" },
  ];

  for (const item of keys) {
    const localPath = getPersistentFilePath(item.filename);
    if (!fs.existsSync(localPath)) {
      const cloudData = await restoreStateFromFirestore(item.docKey);
      if (cloudData) {
        fs.writeFileSync(localPath, JSON.stringify(cloudData, null, 2), "utf8");
        console.log(`[PersistentStorage] Hydrated ${item.filename} from Firestore cloud backup.`);
      }
    }
  }
}
