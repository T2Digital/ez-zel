import crypto from "crypto";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { getPersistentDataDir, getPersistentFilePath, writeJsonAtomic } from "./persistentStorage";
import { sendTelegramOpsAlert } from "./ecosystemWatchdogService";
import { isPostgresConfigured, pgExportAllTablesForBackup } from "./postgresService";
import { getTitoStudioBaseUrl } from "./titoStudioApiClient";
import { getT2AgentBaseUrl } from "./t2AgentApiClient";

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
const BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // Every 6 hours
const GITHUB_CHUNK_CHARS = 15 * 1024 * 1024;
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

/** Collects ALL persistent JSON state files safely without arbitrary size drops (excluding auth secrets). */
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

  const collectDir = (baseDir: string, prefix = "") => {
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      const full = path.join(baseDir, entry.name);
      const relKey = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name === "tenant_erp_state") collectDir(full, "tenant_erp_state");
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".json") || SKIPPED_FILES.has(entry.name)) continue;
      try {
        const raw = fs.readFileSync(full, "utf8");
        files[relKey] = raw;
        totalBytes += Buffer.byteLength(raw, "utf8");
      } catch {}
    }
  };
  collectDir(dir);

  return { count: Object.keys(files).length, totalBytes, files };
}

async function fetchRemoteEcosystemSnapshots(): Promise<{
  studioSnapshot: Record<string, any> | null;
  agentSnapshot: Record<string, any> | null;
  postgresSnapshot: Record<string, any> | null;
}> {
  const studioKey = String(process.env.TITO_STUDIO_API_KEY || process.env.T2_REMOTE_API_KEY || "").trim();
  const agentKey = String(process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY || "").trim();

  const [studioSnapshot, agentSnapshot, postgresSnapshot] = await Promise.all([
    studioKey
      ? fetch(`${getTitoStudioBaseUrl().replace(/\/+$/, "")}/api/admin/backup-snapshot`, {
          headers: { "x-api-key": studioKey },
          signal: AbortSignal.timeout(12_000),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null),
    agentKey
      ? fetch(`${getT2AgentBaseUrl().replace(/\/+$/, "")}/api/admin/backup-snapshot`, {
          headers: { "x-admin-key": agentKey },
          signal: AbortSignal.timeout(12_000),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null),
    isPostgresConfigured() ? pgExportAllTablesForBackup().catch(() => null) : Promise.resolve(null),
  ]);

  return { studioSnapshot, agentSnapshot, postgresSnapshot };
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

/** Uploads an object to Cloudflare R2 / S3-compatible storage using AWS Signature V4 (zero external SDK needed). */
export async function uploadToCloudflareR2(
  objectKey: string,
  bodyStr: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const endpoint = String(process.env.R2_ENDPOINT || "").trim().replace(/\/+$/, "");
  const bucket = String(process.env.R2_BUCKET || "").trim();
  const accessKeyId = String(process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || "").trim();
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return { ok: false, skipped: true };
  }

  try {
    const cleanKey = objectKey.replace(/^\/+/, "");
    const targetUrl = new URL(`${endpoint}/${bucket}/${cleanKey}`);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const region = "auto";
    const service = "s3";
    const bodyBuf = Buffer.from(bodyStr, "utf8");
    const payloadHash = crypto.createHash("sha256").update(bodyBuf).digest("hex");

    const canonicalHeaders =
      `host:${targetUrl.host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [
      "PUT",
      targetUrl.pathname,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      crypto.createHash("sha256").update(canonicalRequest, "utf8").digest("hex"),
    ].join("\n");

    const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, service);
    const kSigning = hmacSha256(kService, "aws4_request");
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    const res = await fetch(targetUrl.toString(), {
      method: "PUT",
      headers: {
        Host: targetUrl.host,
        "Content-Type": "application/json",
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: authHeader,
      },
      body: bodyBuf,
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      const errTxt = await res.text().catch(() => "");
      return { ok: false, error: `R2 HTTP ${res.status}: ${errTxt.slice(0, 160)}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "R2 upload failed" };
  }
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

export async function buildFullEcosystemEncryptedSnapshot(secretOverride?: string): Promise<{
  envelope: EncryptedBackupEnvelope;
  fileCount: number;
  sourcePlaintextBytes: number;
  includes: { ezZelFiles: number; postgres: boolean; studio: boolean; agent: boolean };
}> {
  const secret = (secretOverride || resolveBackupEncryptionSecret()).trim();
  const collected = collectPersistentBackupFiles();
  const remote = await fetchRemoteEcosystemSnapshots();
  const bundleJson = JSON.stringify({
    createdAt: new Date().toISOString(),
    sourceService: "t2os-full-ecosystem",
    fileCount: collected.count,
    files: collected.files,
    postgres: remote.postgresSnapshot,
    t2Studio: remote.studioSnapshot,
    t2Agent: remote.agentSnapshot,
  });
  const compressed = zlib.gzipSync(Buffer.from(bundleJson, "utf8"));
  const envelope = encryptBackupPayload(compressed, secret);
  return {
    envelope,
    fileCount: collected.count,
    sourcePlaintextBytes: Buffer.byteLength(bundleJson, "utf8"),
    includes: {
      ezZelFiles: collected.count,
      postgres: Boolean(remote.postgresSnapshot),
      studio: Boolean(remote.studioSnapshot),
      agent: Boolean(remote.agentSnapshot),
    },
  };
}

/** Encrypts persistent ecosystem state (Ez-Zel + PostgreSQL + Studio + Agent) and pushes every 6h to R2 & private GitHub vault. */
export async function runOffServerBackup(reason = "scheduled"): Promise<BackupRunSummary> {
  const timestamp = new Date().toISOString();
  const repoFull = (process.env.BACKUP_GITHUB_REPO || "T2Digital/t2os-ops-backups").trim();
  const token = (process.env.GITHUB_TOKEN || "").trim();

  let snap: Awaited<ReturnType<typeof buildFullEcosystemEncryptedSnapshot>> | null = null;
  try {
    snap = await buildFullEcosystemEncryptedSnapshot();
    const payloadStr = JSON.stringify(snap.envelope, null, 2);
    const stampSafe = timestamp.slice(0, 16).replace(/[:T]/g, "-");
    const day = timestamp.slice(0, 10);

    // 1) Cloudflare R2 S3 upload (if configured)
    const r2Latest = await uploadToCloudflareR2("backups/latest.enc.json", payloadStr);
    if (r2Latest.ok) {
      await uploadToCloudflareR2(`backups/6h/${stampSafe}.enc.json`, payloadStr).catch(() => {});
    }

    // 2) Chunked Private GitHub Encrypted Vault backup (mirrors even large snapshots without size limits)
    let commitSha = "";
    if (token) {
      await ensurePrivateBackupRepo(repoFull, token);
      if (Buffer.byteLength(payloadStr, "utf8") <= GITHUB_CHUNK_CHARS) {
        commitSha = await putGitHubEncryptedFile(
          repoFull,
          "backups/latest.enc.json",
          payloadStr,
          `chore(backup): ecosystem snapshot (${snap.fileCount} files, pg=${snap.includes.postgres}) [${reason}]`,
          token
        );
        await putGitHubEncryptedFile(
          repoFull,
          `backups/daily/${day}.enc.json`,
          payloadStr,
          `chore(backup): daily snapshot ${day}`,
          token
        );
      } else {
        const parts: string[] = [];
        for (let i = 0; i < payloadStr.length; i += GITHUB_CHUNK_CHARS) {
          parts.push(payloadStr.slice(i, i + GITHUB_CHUNK_CHARS));
        }
        for (let idx = 0; idx < parts.length; idx++) {
          commitSha = await putGitHubEncryptedFile(
            repoFull,
            `backups/chunks/latest.part${idx + 1}of${parts.length}.enc`,
            parts[idx],
            `chore(backup): chunk ${idx + 1}/${parts.length} [${reason}]`,
            token
          );
        }
      }
    } else if (!r2Latest.ok) {
      throw new Error("Neither GITHUB_TOKEN nor Cloudflare R2 credentials are configured.");
    }

    const prevSuccessCount = loadBackupHistory().filter((h) => h.ok).length;
    const summary: BackupRunSummary = {
      timestamp,
      reason,
      ok: true,
      repo: r2Latest.ok ? `R2:${process.env.R2_BUCKET} + ${repoFull}` : repoFull,
      fileCount: snap.fileCount,
      totalBytes: snap.sourcePlaintextBytes,
      sha256Plaintext: snap.envelope.sha256Plaintext,
      commitSha: commitSha || (r2Latest.ok ? "r2_uploaded" : ""),
    };
    appendBackupHistory(summary);

    if (reason === "manual" || prevSuccessCount === 0) {
      await sendTelegramOpsAlert(
        `🛡️ <b>[T2OS 6h Ecosystem Backup]</b> نسخة احتياطية مشفرة كاملة (<code>AES-256-GCM</code>)\n• Postgres: ${snap.includes.postgres ? "✅" : "⚠️"} | Studio: ${snap.includes.studio ? "✅" : "⚠️"} | Agent: ${snap.includes.agent ? "✅" : "⚠️"}\n• الحجم: <b>${Math.round(snap.sourcePlaintextBytes / 1024)} KB</b> (${snap.fileCount} ملف)\n• الوجهة: <code>${summary.repo}</code>`
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
  const r2Configured = Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_BUCKET &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  );
  return {
    configured: Boolean((process.env.GITHUB_TOKEN || r2Configured) && resolveBackupEncryptionSecret()),
    r2Configured,
    repo: (process.env.BACKUP_GITHUB_REPO || "T2Digital/t2os-ops-backups").trim(),
    algorithm: "aes-256-gcm",
    schedulerActive: schedulerStarted,
    intervalHours: 6,
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
    void runOffServerBackup("scheduled_6h");
  }, BACKUP_INTERVAL_MS).unref();
}
