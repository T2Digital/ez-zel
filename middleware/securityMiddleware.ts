import type { Request, Response, NextFunction } from "express";
import { parseCookies, verifyAdminSessionToken } from "../services/serverAdminAuth";
import { verifyTenantToken } from "../routes/tenantErpRoutes";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000).unref();

export function createRateLimiter(maxRequests: number, windowMs: number, label = "api") {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown")
      .split(",")[0]
      .trim();
    const key = `${label}:${ip}`;
    const now = Date.now();
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      return res.status(429).json({
        ok: false,
        error: "Too many requests. Please slow down.",
        retryAfterSec: Math.ceil((current.resetAt - now) / 1000),
      });
    }

    current.count += 1;
    return next();
  };
}

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
}

const PUBLIC_API_PREFIXES = [
  "/api/health",
  "/api/public/",
  "/api/auth/admin-",
  "/api/tenant-auth/",
  "/api/tenant-erp/",
  "/api/auth/meta/",
  "/api/auth/social/",
  "/api/system/ecosystem-health",
  "/api/system/watchdog-status",
  "/api/client-portal/",
  "/api/payments/paymob/plans",
  "/api/payments/paymob/webhook",
  "/api/payments/paymob/checkout-gateway",
  "/api/webhooks/",
  "/api/webhooks/bosta",
  "/api/gateway/health",
  "/api/ai/design-architect",
  "/api/dropshipping/public/",
  "/api/al-genedy/",
];

function isTrustedSameOrigin(req: Request): boolean {
  const origin = String(req.headers.origin || "");
  const referer = String(req.headers.referer || "");
  const host = String(req.headers.host || "");
  const fetchSite = String(req.headers["sec-fetch-site"] || "");

  if (fetchSite === "same-origin") return true;
  if (host && (origin.includes(host) || referer.includes(host))) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(origin || referer)) return true;
  return false;
}

export function requireSovereignApiAccess(req: Request, res: Response, next: NextFunction) {
  const fullPath = req.originalUrl || req.path;
  if (!fullPath.startsWith("/api/")) return next();
  if (PUBLIC_API_PREFIXES.some((prefix) => fullPath.startsWith(prefix))) return next();

  const adminSecret = process.env.ADMIN_API_SECRET || process.env.ADMIN_SECRET_KEY || process.env.T2_AGENT_ADMIN_KEY;
  const providedSecret = String(req.headers["x-admin-secret"] || req.headers["x-api-key"] || "");
  const authHeader = String(req.headers.authorization || "");
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (adminSecret && providedSecret === adminSecret) return next();

  const cookies = parseCookies(req);
  if (cookies.t2os_admin_session && verifyAdminSessionToken(cookies.t2os_admin_session).ok) {
    return next();
  }

  if (bearer && (verifyAdminSessionToken(bearer).ok || verifyTenantToken(bearer))) {
    return next();
  }

  if (isTrustedSameOrigin(req)) return next();

  return res.status(401).json({
    ok: false,
    error: "Unauthorized: valid admin secret, verified session token, or same-origin session required.",
  });
}
