import crypto from "crypto";
import type { Request, Response } from "express";
import firebaseAppletConfig from "../firebase-applet-config.json";
import { isMasterAdminEmail, MASTER_ADMIN_EMAILS } from "./adminIdentity";

const ADMIN_COOKIE_NAME = "t2os_admin_session";
const ADMIN_TOKEN_PREFIX = "t2adm_";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString("hex");
let warnedMissingSecret = false;

function getSigningSecret(): string {
  const configured =
    process.env.TENANT_AUTH_SECRET ||
    process.env.ADMIN_API_SECRET ||
    process.env.ADMIN_SECRET_KEY ||
    process.env.T2_AGENT_ADMIN_KEY;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }
  if (!warnedMissingSecret) {
    warnedMissingSecret = true;
    console.error(
      "[CRITICAL SECURITY] No TENANT_AUTH_SECRET / ADMIN_API_SECRET / ADMIN_SECRET_KEY configured — using ephemeral per-process secret."
    );
  }
  return EPHEMERAL_SESSION_SECRET;
}

export function getPrimaryFirebaseApiKey(): string {
  return String(
    (firebaseAppletConfig as any)?.apiKey ||
      process.env.VITE_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      ""
  ).trim();
}

export function parseCookies(req: Request): Record<string, string> {
  const raw = String(req.headers.cookie || "");
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

export function signAdminSessionToken(email: string): string {
  const cleanEmail = String(email || "ahm.atya@gmail.com").trim().toLowerCase();
  const payload = Buffer.from(
    JSON.stringify({
      email: cleanEmail,
      role: "MASTER_ADMIN",
      exp: Date.now() + SESSION_TTL_MS,
    }),
    "utf8"
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
  return `${ADMIN_TOKEN_PREFIX}${payload}.${sig}`;
}

export function verifyAdminSessionToken(token?: string | null): { ok: boolean; email?: string } {
  const raw = String(token || "").trim();
  if (!raw.startsWith(ADMIN_TOKEN_PREFIX)) return { ok: false };
  const body = raw.slice(ADMIN_TOKEN_PREFIX.length);
  const dotIdx = body.indexOf(".");
  if (dotIdx <= 0) return { ok: false };
  const payload = body.slice(0, dotIdx);
  const providedSig = body.slice(dotIdx + 1);
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
  try {
    const a = Buffer.from(providedSig, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false };
    }
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed?.exp || Date.now() > Number(parsed.exp)) {
      return { ok: false };
    }
    const email = String(parsed.email || "").toLowerCase();
    if (!isMasterAdminEmail(email) && email !== String(process.env.MASTER_ADMIN_EMAIL || "").toLowerCase()) {
      return { ok: false };
    }
    return { ok: true, email };
  } catch {
    return { ok: false };
  }
}

export function setAdminSessionCookie(req: Request, res: Response, token: string): void {
  const isHttps =
    req.secure ||
    String(req.headers["x-forwarded-proto"] || "").toLowerCase().includes("https");
  const parts = [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (isHttps) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearAdminSessionCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export async function verifyAdminRequest(
  req: Request
): Promise<{ ok: boolean; email?: string; error?: string }> {
  const adminSecret = process.env.ADMIN_API_SECRET || process.env.ADMIN_SECRET_KEY;
  const providedSecret = req.headers["x-admin-secret"] || req.headers["x-api-key"] || req.body?.adminSecret;
  if (adminSecret && providedSecret && String(providedSecret) === String(adminSecret)) {
    return { ok: true, email: process.env.MASTER_ADMIN_EMAIL || "ahm.atya@gmail.com" };
  }

  // 1. Check signed HttpOnly cookie
  const cookies = parseCookies(req);
  if (cookies[ADMIN_COOKIE_NAME]) {
    const cookieRes = verifyAdminSessionToken(cookies[ADMIN_COOKIE_NAME]);
    if (cookieRes.ok) return { ok: true, email: cookieRes.email };
  }

  // 2. Check Authorization Bearer (either signed t2adm_ token or Firebase ID Token)
  const authHeader = String(req.headers.authorization || "");
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : String(req.body?.idToken || "");

  if (bearer.startsWith(ADMIN_TOKEN_PREFIX)) {
    const tokRes = verifyAdminSessionToken(bearer);
    if (tokRes.ok) return { ok: true, email: tokRes.email };
  }

  const fbKey = getPrimaryFirebaseApiKey();
  const masterEnvEmail = String(process.env.MASTER_ADMIN_EMAIL || "").trim().toLowerCase();
  if (bearer && fbKey) {
    try {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${fbKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: bearer }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (resp.ok) {
        const data: any = await resp.json();
        const email = String(data?.users?.[0]?.email || "").toLowerCase().trim();
        if (
          isMasterAdminEmail(email) ||
          (masterEnvEmail && email === masterEnvEmail) ||
          (MASTER_ADMIN_EMAILS as readonly string[]).includes(email)
        ) {
          return { ok: true, email };
        }
        return { ok: false, error: `Unauthorized email: ${email}` };
      }
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  }

  return { ok: false, error: "Admin authorization required" };
}

export async function requireAdminMiddleware(
  req: Request,
  res: Response,
  next: (err?: any) => void
): Promise<void> {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    res.status(401).json({ ok: false, error: auth.error || "Admin authorization required" });
    return;
  }
  (req as any).adminEmail = auth.email;
  next();
}
