import crypto from "crypto";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { getPersistentDataDir, getPersistentFilePath, writeJsonAtomic } from "./persistentStorage";
import { sendTelegramOpsAlert } from "./ecosystemWatchdogService";

export interface EncryptedBackupEnvelope {
  version: "t2os-backup-v1";
  alg: "aes-256-gcm";
  createdAt: string;
  ivB64: string;
  tagB64: string;
  ciphertextB64: string;
  sha256Plaintext: string;
  plaintextBytes: number;
}

export interface BackupRunSummary {
  timestamp: string;
  reason: string;
  ok: boolean;
  repo?: string;
  fileCount: number;
  totalBytes: number;
  sha256Plaintext?: string;
  commitSha?: string;
  error?: string;
}

const SKIPPED_FILES = new Set(["persistent_firestore_auth.json", "backup_history.json"]);
const MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024;
const BACKUP_INTERVAL_MS = 12 * 60 * 60 * 1000;
const HISTORY_LIMIT = 20;

let schedulerStarted = false;

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

export function resolveBackupEncryptionSecret(): string {
  return String(
    process.env.BACKUP_ENCRYPTION_KEY ||
      process.env.TENANT_AUTH_SECRET ||
      process.env.T2_REMOTE_API_KEY ||
      process.env.ADMIN_API_SECRET ||
      process.env.ADMIN_SECRET_KEY ||
      ""
  ).trim();
}

/** Encrypts raw backup bytes with AES-256-GCM + plaintext SHA-256 integrity tag. */
export function encryptBackupPayload(plaintext: Buffer, secret: string): EncryptedBackupEnvelope {
  if (!secret || secret.length < 8) {
    throw new Error("Backup encryption secret must be configured (>= 8 chars).");
  }
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const sha256Plaintext = crypto.createHash("sha256").update(plaintext).digest("hex");

  return {
    version: "t2os-backup-v1",
    alg: "aes-256-gcm",
    createdAt: new Date().toISOString(),
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64"),
    ciphertextB64: ciphertext.toString("base64"),
    sha256Plaintext,
    plaintextBytes: plaintext.length,
  };
}

/** Decrypts and authenticates an encrypted backup envelope using AES-256-GCM. */
export function decryptBackupPayload(envelope: EncryptedBackupEnvelope, secret: string): Buffer {
  if (!envelope || envelope.alg !== "aes-256-gcm" || envelope.version !== "t2os-backup-v1") {
    throw new Error("Unsupported backup envelope format.");
  }
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertextB64, "base64")),
    decipher.final(),
  ]);
  const actualSha = crypto.createHash("sha256").update(plaintext).digest("hex");
  if (actualSha !== envelope.sha256Plaintext) {
    throw new Error("Decrypted backup checksum mismatch.");
  }
  return plaintext;
}

/** Collects persistent JSON state files safely, excluding credentials and logs > 5 MB. */
export function collectPersistentBackupFiles(): {
  count: number;
  totalBytes: number;
  files: Record<string, string>;
} {
  const dir = getPersistentDataDir();
  const files: Record<string, string> = {};
  let totalBytes = 0;

  if (!fs.existsSync(dir)) {
    return { count: 0, totalBytes: 0, files };
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json") || SKIPPED_FILES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    try {
      const stat = fs.statSync(full);
      if (stat.size > MAX_SINGLE_FILE_BYTES) continue;
      const raw = fs.readFileSync(full, "utf8");
      files[entry.name] = raw;
      totalBytes += Buffer.byteLength(raw, "utf8");
    } catch {}
  }

  return { count: Object.keys(files).length, totalBytes, files };
}

/** Builds a gzipped + AES-256-GCM encrypted operational snapshot. */
export function buildEncryptedSnapshot(secretOverride?: string): {
  envelope: EncryptedBackupEnvelope;
  fileCount: number;
  sourcePlaintextBytes: number;
  fileNames: string[];
} {
  const secret = (secretOverride || resolveBackupEncryptionSecret()).trim();
  const collected = collectPersistentBackupFiles();
  const bundleJson = JSON.stringify({
    createdAt: new Date().toISOString(),
    sourceService: "t2os-ez-zel",
    fileCount: collected.count,
    files: collected.files,
  });
  const compressed = zlib.gzipSync(Buffer.from(bundleJson, "utf8"));
  const envelope = encryptBackupPayload(compressed, secret);

  return {
    envelope,
    fileCount: collected.count,
    sourcePlaintextBytes: collected.totalBytes,
    fileNames: Object.keys(collected.files).sort(),
  };
}

function loadBackupHistory(): BackupRunSummary[] {
  try {
    const file = getPersistentFilePath("backup_history.json");
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

function appendBackupHistory(entry: BackupRunSummary): BackupRunSummary[] {
  const history = [entry, ...loadBackupHistory()].slice(0, HISTORY_LIMIT);
  writeJsonAtomic(getPersistentFilePath("backup_history.json"), history);
  return history;
}

async function ghRequest(url: string, token: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "t2os-backup-service",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
}

async function ensurePrivateBackupRepo(repoFull: string, token: string): Promise<void> {
  const [owner, repo] = repoFull.split("/");
  if (!owner || !repo) throw new Error(`Invalid BACKUP_GITHUB_REPO format: ${repoFull}`);

  const check = await ghRequest(`https://api.github.com/repos/${owner}/${repo}`, token);
  if (check.ok) {
    const meta: any = await check.json();
    if (meta?.private !== true) {
      throw new Error(`Security abort: backup repo ${repoFull} exists and is NOT private.`);
    }
    return;
  }

  if (check.status !== 404) {
    const errText = await check.text();
    throw new Error(`GitHub repo check failed (${check.status}): ${errText.slice(0, 200)}`);
  }

  const created = await ghRequest("https://api.github.com/user/repos", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: repo,
      private: true,
      auto_init: true,
      description: "Encrypted T2OS off-server operational backups (AES-256-GCM)",
    }),
  });
  if (!created.ok) {
    const errText = await created.text();
    throw new Error(`Failed creating private backup repo ${repoFull} (${created.status}): ${errText.slice(0, 200)}`);
  }
  const createdMeta: any = await created.json();
  if (createdMeta?.private !== true) {
    throw new Error(`Security abort: newly created backup repo ${repoFull} is not private.`);
  }
  await new Promise((r) => setTimeout(r, 1200));
}

async function putGitHubEncryptedFile(
  repoFull: string,
  filePath: string,
  contentStr: string,
  commitMessage: string,
  token: string
): Promise<string> {
  let existingSha: string | undefined;
  const getRes = await ghRequest(`https://api.github.com/repos/${repoFull}/contents/${filePath}`, token);
  if (getRes.ok) {
    const meta: any = await getRes.json();
    existingSha = meta?.sha;
  }

  const putRes = await ghRequest(`https://api.github.com/repos/${repoFull}/contents/${filePath}`, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(contentStr, "utf8").toString("base64"),
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });
  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub upload ${filePath} failed (${putRes.status}): ${errText.slice(0, 200)}`);
  }
  const putJson: any = await putRes.json();
  return String(putJson?.commit?.sha || "");
}

/** Encrypts persistent state files and pushes them to the private off-server GitHub backup repository. */
export async function runOffServerBackup(reason = "scheduled"): Promise<BackupRunSummary> {
  const timestamp = new Date().toISOString();
  const repoFull = (process.env.BACKUP_GITHUB_REPO || "T2Digital/t2os-ops-backups").trim();
  const token = (process.env.GITHUB_TOKEN || "").trim();

  let snap: ReturnType<typeof buildEncryptedSnapshot> | null = null;
  try {
    if (!token) throw new Error("GITHUB_TOKEN is not configured.");
    snap = buildEncryptedSnapshot();
    await ensurePrivateBackupRepo(repoFull, token);

    const payloadStr = JSON.stringify(snap.envelope, null, 2);
    const day = timestamp.slice(0, 10);
    const commitSha = await putGitHubEncryptedFile(
      repoFull,
      "backups/latest.enc.json",
      payloadStr,
      `chore(backup): encrypted snapshot (${snap.fileCount} files) [${reason}]`,
      token
    );
    await putGitHubEncryptedFile(
      repoFull,
      `backups/daily/${day}.enc.json`,
      payloadStr,
      `chore(backup): daily encrypted snapshot ${day} (${snap.fileCount} files)`,
      token
    );

    const prevSuccessCount = loadBackupHistory().filter((h) => h.ok).length;
    const summary: BackupRunSummary = {
      timestamp,
      reason,
      ok: true,
      repo: repoFull,
      fileCount: snap.fileCount,
      totalBytes: snap.sourcePlaintextBytes,
      sha256Plaintext: snap.envelope.sha256Plaintext,
      commitSha,
    };
    appendBackupHistory(summary);

    if (reason === "manual" || prevSuccessCount === 0) {
      await sendTelegramOpsAlert(
        `🛡️ <b>[T2OS Off-Server Backup]</b> تم حفظ نسخة احتياطية مشفرة (<code>AES-256-GCM</code>)\n• المستودع الخاص: <code>${repoFull}</code>\n• عدد الملفات: <b>${snap.fileCount}</b> (${Math.round(snap.sourcePlaintextBytes / 1024)} KB)\n• Commit: <code>${commitSha.slice(0, 10)}</code>`
      );
    }
    return summary;
  } catch (err: any) {
    const summary: BackupRunSummary = {
      timestamp,
      reason,
      ok: false,
      repo: repoFull,
      fileCount: snap?.fileCount || 0,
      totalBytes: snap?.sourcePlaintextBytes || 0,
      error: err?.message || "Backup failed",
    };
    appendBackupHistory(summary);
    await sendTelegramOpsAlert(
      `🚨 <b>[T2OS Backup Alert]</b> فشل النسخ الاحتياطي المشفر (${reason}):\n<code>${summary.error}</code>`
    );
    return summary;
  }
}

export function getOffServerBackupStatus() {
  const history = loadBackupHistory();
  const collected = collectPersistentBackupFiles();
  return {
    configured: Boolean(process.env.GITHUB_TOKEN && resolveBackupEncryptionSecret()),
    repo: (process.env.BACKUP_GITHUB_REPO || "T2Digital/t2os-ops-backups").trim(),
    algorithm: "aes-256-gcm",
    schedulerActive: schedulerStarted,
    intervalHours: 12,
    pendingFilesCount: collected.count,
    pendingTotalBytes: collected.totalBytes,
    lastRun: history[0] || null,
    history,
  };
}

export function startOffServerBackupScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setTimeout(() => {
    const lastOk = loadBackupHistory().find((h) => h.ok);
    const ageMs = lastOk ? Date.now() - new Date(lastOk.timestamp).getTime() : Infinity;
    if (ageMs >= BACKUP_INTERVAL_MS) {
      void runOffServerBackup("boot_catchup");
    }
  }, 60_000).unref();

  setInterval(() => {
    void runOffServerBackup("scheduled_12h");
  }, BACKUP_INTERVAL_MS).unref();
}
