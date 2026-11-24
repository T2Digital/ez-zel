import type { Express, Request, Response } from "express";
import crypto from "crypto";
import {
  loadTenantErpState,
  saveTenantErpState,
  getTenantPasswordRecord,
  setTenantPasswordRecord,
  hashPassword,
  verifyPasswordHash,
  normalizeSlugKey,
} from "../services/tenantErpStoreService";
import { verifyAdminRequest } from "../services/serverAdminAuth";
import {
  buildCarrierTrackingUrl,
  loadDropshippingFunnels,
  type CarrierProvider,
} from "../services/dropshippingEngineService";
import { t2AgentApi } from "../services/t2AgentApiClient";
import { recordLiveEvent } from "../services/liveTelemetryService";

const EPHEMERAL_TENANT_SECRET = crypto.randomBytes(32).toString("hex");
const getTenantAuthSecret = () => {
  const s =
    process.env.TENANT_AUTH_SECRET ||
    process.env.ADMIN_API_SECRET ||
    process.env.ADMIN_SECRET_KEY ||
    process.env.T2_AGENT_ADMIN_KEY ||
    process.env.T2_REMOTE_API_KEY;
  if (!s) {
    if (!(globalThis as any).__t2TenantSecretWarned) {
      (globalThis as any).__t2TenantSecretWarned = true;
      console.warn("[Security] TENANT_AUTH_SECRET / ADMIN_API_SECRET is not set; using ephemeral per-process secret.");
    }
    return EPHEMERAL_TENANT_SECRET;
  }
  return s;
};

const FULL_TENANT_ADMIN_PERMISSIONS = [
  "daily-sales",
  "store-management",
  "treasury",
  "expenses",
  "employees",
  "payroll",
  "advances",
  "attendance",
  "suppliers",
  "purchasing",
  "daily-review",
  "orders",
  "customers",
  "promotions",
  "dropshipping",
  "reports",
  "notifications",
  "users",
  "settings",
];

function sanitizeUserRecord(u: any) {
  if (!u || typeof u !== "object") return u;
  const { password, passwordHash, passwordSalt, ...rest } = u;
  const normalizedUsername = String(rest.username || rest.email || "").trim().toLowerCase();
  return {
    ...rest,
    ...(normalizedUsername ? { username: normalizedUsername } : {}),
    hasPassword: Boolean(passwordHash || password || rest.hasPassword),
  };
}

function sanitizeAdminErpState(state: Record<string, any>): Record<string, any> {
  const { __auth: _stripAuth, ...safeState } = state || {};
  if (Array.isArray(safeState.users)) {
    safeState.users = safeState.users.map(sanitizeUserRecord);
  }
  return safeState;
}

export function signTenantToken(payloadObj: Record<string, any>): string {
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getTenantAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyTenantToken(token: string): Record<string, any> | null {
  try {
    const [payload, sig] = String(token || "").split(".");
    if (!payload || !sig) return null;
    const expectedSig = crypto.createHmac("sha256", getTenantAuthSecret()).update(payload).digest("base64url");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.exp || Date.now() > Number(data.exp)) return null;
    return data;
  } catch {
    return null;
  }
}

export function signClientPortalToken(slug: string, ttlDays = 30): string {
  return signTenantToken({
    scope: "client_portal",
    slug: normalizeSlugKey(slug),
    exp: Date.now() + ttlDays * 86400000,
  });
}

export function verifyClientPortalToken(token: string, expectedSlug: string): boolean {
  const data = verifyTenantToken(token);
  if (!data || data.scope !== "client_portal" || !data.slug) return false;
  return normalizeSlugKey(String(data.slug)) === normalizeSlugKey(String(expectedSlug || ""));
}

export function registerTenantErpRoutes(
  app: Express,
  deps: {
    getUnifiedGrowthBrands: () => any[];
    getClonedBrandByIdOrSlug: (slug: string) => any;
  }
) {
  const { getUnifiedGrowthBrands, getClonedBrandByIdOrSlug } = deps;

  app.options(
    [
      "/api/tenant-auth",
      "/api/tenant-auth/login",
      "/api/tenant-auth/verify",
      "/api/tenant-auth/change-password",
      "/api/tenant-erp",
      "/api/tenant-erp/:slug/state",
      "/api/tenant-erp/:slug/sync",
      "/api/tenant-erp/:slug/orders",
      "/api/tenant-shipping",
    ],
    (_req: Request, res: Response) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,x-admin-secret,x-api-key");
      res.status(204).end();
    }
  );

  async function resolveBrandForAuth(slug: string): Promise<any | null> {
    const slugNorm = slug.toLowerCase().replace(/[-_]+/g, "-");
    const unified = getUnifiedGrowthBrands();
    let brand: any =
      unified.find(
        (b) => b.id === slug || String(b.slug || "").toLowerCase().replace(/[-_]+/g, "-") === slugNorm
      ) || getClonedBrandByIdOrSlug(slug);

    if (!brand) {
      const dropshipStore = loadDropshippingFunnels().find(
        (f) => f.slug.toLowerCase() === slugNorm
      );
      if (dropshipStore) {
        brand = {
          id: dropshipStore.slug,
          slug: dropshipStore.slug,
          englishName: dropshipStore.slug,
          name: dropshipStore.brandName,
          phone: dropshipStore.storeTheme?.phone || "01013372674",
          whatsapp: dropshipStore.storeTheme?.whatsapp || "01013372674",
          adminEmail: `owner@${dropshipStore.slug}.t2.app`,
        };
      }
    }

    if (!brand) {
      try {
        const { titoStudioApi } = await import("../services/titoStudioApiClient");
        const liveRes: any = await titoStudioApi.listBrands();
        const list = Array.isArray(liveRes?.brands) ? liveRes.brands : Array.isArray(liveRes) ? liveRes : [];
        const sb = list.find((x: any) => {
          const enSlug = String(x.englishName || "")
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[-_\s]+/g, "-");
          const xSlug = String(x.slug || "").toLowerCase().replace(/[-_]+/g, "-");
          return String(x.id || "") === slug || xSlug === slugNorm || enSlug === slugNorm;
        });
        if (sb) {
          brand = {
            id: sb.id,
            slug: sb.slug || slugNorm,
            englishName: sb.englishName || "",
            name: sb.name || sb.englishName,
            phone: sb.phone || sb.whatsappNumber || "",
            adminEmail: sb.adminEmail || "",
            adminPin: sb.adminPin || "",
          };
        }
      } catch {}
    }

    return brand || null;
  }

  function buildAdminUserSession(brand: any, fallbackSlug: string) {
    const asciiSlug =
      String(brand.slug || brand.englishName || brand.id || fallbackSlug || "brand")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "") || fallbackSlug;
    const expectedEmail = String(brand.adminEmail || `owner@${asciiSlug}.t2.app`).trim().toLowerCase();
    const userObj = {
      id: `admin_${asciiSlug}`,
      username: expectedEmail,
      email: expectedEmail,
      name: `مدير ${brand.name}`,
      role: "admin",
      branch: "main",
      allowedBranches: ["main"],
      brandSlug: asciiSlug,
      permissions: FULL_TENANT_ADMIN_PERMISSIONS,
    };
    const token = signTenantToken({ ...userObj, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    return { asciiSlug, expectedEmail, userObj, token };
  }

  async function handleTenantLogin(req: Request, res: Response) {
    try {
      const { brandSlug, email, password } = req.body || {};
      const slug = String(brandSlug || "").trim();
      const emailInput = String(email || "").trim().toLowerCase();
      const passInput = String(password || "");
      if (!slug || !emailInput || !passInput) {
        return res.status(400).json({ ok: false, error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" });
      }

      const slugNorm = normalizeSlugKey(slug);
      const brand = (await resolveBrandForAuth(slug)) || { id: slugNorm, slug: slugNorm, name: slugNorm };

      const { asciiSlug, expectedEmail, userObj, token } = buildAdminUserSession(brand, slugNorm);
      const erpState = await loadTenantErpState(slugNorm);
      const hashSha = (v: string) => crypto.createHash("sha256").update(v).digest();
      const safeEqual = (a: string, b: string) => crypto.timingSafeEqual(hashSha(a), hashSha(b));

      // Path A: Primary Brand Owner Admin
      if (safeEqual(emailInput, expectedEmail)) {
        const phoneDigits = String(brand.phone || brand.whatsapp || "").replace(/\D/g, "");
        const adminPin = String(brand.adminPin || phoneDigits.slice(-6) || "");
        const expectedPass = adminPin ? `T2@${adminPin}` : "";

        const customPassRec = await getTenantPasswordRecord(asciiSlug);
        const passMatch = customPassRec
          ? verifyPasswordHash(passInput, customPassRec.hash, customPassRec.salt)
          : expectedPass.length > 0 && safeEqual(passInput, expectedPass);

        if (!passMatch) {
          return res.status(401).json({ ok: false, error: "بيانات الدخول غير صحيحة لهذا البراند" });
        }

        const activeBranches = Array.isArray(erpState?.appCustomization?.activeBranches)
          ? erpState.appCustomization.activeBranches
          : [];
        if (activeBranches.length > 0) {
          userObj.branch = String(activeBranches[0]?.key || userObj.branch);
          const keys = activeBranches.map((b: any) => String(b?.key || "")).filter(Boolean);
          if (keys.length > 0) userObj.allowedBranches = keys;
        }
        const finalToken = signTenantToken({ ...userObj, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
        return res.json({ ok: true, token: finalToken || token, user: userObj });
      }

      // Path B: Secondary Brand Owners & Staff created inside ERP Users management
      const usersList: any[] = Array.isArray(erpState?.users) ? erpState.users : [];
      const matchedUser = usersList.find(
        (u: any) => String(u?.username || u?.email || "").trim().toLowerCase() === emailInput
      );

      if (matchedUser) {
        const staffPassMatch =
          matchedUser.passwordHash && matchedUser.passwordSalt
            ? verifyPasswordHash(passInput, String(matchedUser.passwordHash), String(matchedUser.passwordSalt))
            : Boolean(matchedUser.password) && safeEqual(passInput, String(matchedUser.password));

        if (!staffPassMatch) {
          return res.status(401).json({ ok: false, error: "بيانات الدخول غير صحيحة لهذا البراند" });
        }

        const staffRole = String(matchedUser.role || "seller");
        const staffPerms =
          staffRole === "admin" && (!Array.isArray(matchedUser.permissions) || matchedUser.permissions.length === 0)
            ? FULL_TENANT_ADMIN_PERMISSIONS
            : Array.isArray(matchedUser.permissions)
              ? matchedUser.permissions
              : [];
        const staffBranch = String(matchedUser.branch || "main");
        const staffAllowedBranches =
          Array.isArray(matchedUser.allowedBranches) && matchedUser.allowedBranches.length > 0
            ? matchedUser.allowedBranches
            : [staffBranch];
        const staffUserObj = {
          id: String(matchedUser.id || `staff_${asciiSlug}`),
          username: emailInput,
          email: emailInput,
          name: String(matchedUser.name || emailInput),
          role: staffRole,
          branch: staffBranch,
          allowedBranches: staffAllowedBranches,
          brandSlug: asciiSlug,
          permissions: staffPerms,
        };
        const staffToken = signTenantToken({ ...staffUserObj, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
        return res.json({ ok: true, token: staffToken, user: staffUserObj });
      }

      return res.status(401).json({ ok: false, error: "بيانات الدخول غير صحيحة لهذا البراند" });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Tenant auth error" });
    }
  }

  function handleTenantVerify(req: Request, res: Response) {
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : String(req.query.token || "");
    const decoded = verifyTenantToken(token);
    if (!decoded) return res.status(401).json({ ok: false, error: "Invalid or expired session" });
    const brandSlug = String(req.query.brandSlug || "").toLowerCase().replace(/[-_]+/g, "-");
    if (brandSlug && String(decoded.brandSlug || "").toLowerCase().replace(/[-_]+/g, "-") !== brandSlug) {
      return res.status(403).json({ ok: false, error: "Token not scoped to this brand" });
    }
    return res.json({ ok: true, user: decoded });
  }

  async function handleTenantChangePassword(req: Request, res: Response) {
    try {
      const authHeader = String(req.headers.authorization || "");
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      const decoded = verifyTenantToken(token);
      if (!decoded?.brandSlug) {
        return res.status(401).json({ ok: false, error: "جلسة غير صالحة أو منتهية" });
      }
      const { oldPassword, newPassword } = req.body || {};
      const oldPass = String(oldPassword || "");
      const newPass = String(newPassword || "");
      if (newPass.length < 6) {
        return res.status(400).json({ ok: false, error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      }

      const slugNorm = normalizeSlugKey(decoded.brandSlug);
      const brand = await resolveBrandForAuth(slugNorm);
      const expectedPrimaryEmail = String(brand?.adminEmail || `owner@${slugNorm}.t2.app`).trim().toLowerCase();
      const decodedEmail = String(decoded.email || decoded.username || "").trim().toLowerCase();

      // Secondary owner / staff user password change
      if (decodedEmail && decodedEmail !== expectedPrimaryEmail) {
        const erpState = await loadTenantErpState(slugNorm);
        const usersList: any[] = Array.isArray(erpState?.users) ? [...erpState.users] : [];
        const userIdx = usersList.findIndex(
          (u: any) => String(u?.username || u?.email || "").trim().toLowerCase() === decodedEmail
        );
        if (userIdx >= 0) {
          const target = usersList[userIdx];
          const okOld =
            target.passwordHash && target.passwordSalt
              ? verifyPasswordHash(oldPass, String(target.passwordHash), String(target.passwordSalt))
              : Boolean(target.password) && oldPass === String(target.password);
          if (!okOld) {
            return res.status(403).json({ ok: false, error: "كلمة المرور الحالية غير صحيحة" });
          }
          const { password: _dropPlain, ...cleanUser } = target;
          const hashed = hashPassword(newPass);
          usersList[userIdx] = {
            ...cleanUser,
            passwordHash: hashed.hash,
            passwordSalt: hashed.salt,
            updatedAt: new Date().toISOString(),
          };
          await saveTenantErpState(slugNorm, { users: usersList });
          return res.json({ ok: true, message: "تم تحديث كلمة المرور وتشفيرها بنجاح" });
        }
      }

      const customRec = await getTenantPasswordRecord(slugNorm);
      if (customRec) {
        if (!verifyPasswordHash(oldPass, customRec.hash, customRec.salt)) {
          return res.status(403).json({ ok: false, error: "كلمة المرور الحالية غير صحيحة" });
        }
      } else {
        const phoneDigits = String(brand?.phone || "").replace(/\D/g, "");
        const expectedDefault = brand?.adminPin
          ? `T2@${brand.adminPin}`
          : phoneDigits.length >= 6
            ? `T2@${phoneDigits.slice(-6)}`
            : "";
        if (expectedDefault && oldPass !== expectedDefault) {
          return res.status(403).json({ ok: false, error: "كلمة المرور الحالية غير صحيحة" });
        }
      }

      await setTenantPasswordRecord(slugNorm, newPass);
      return res.json({ ok: true, message: "تم تحديث كلمة المرور وتشفيرها بنجاح" });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed to update password" });
    }
  }

  app.post("/api/tenant-auth/login", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return handleTenantLogin(req, res);
  });

  app.get("/api/tenant-auth/verify", (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return handleTenantVerify(req, res);
  });

  app.post("/api/tenant-auth/change-password", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return handleTenantChangePassword(req, res);
  });

  // Vercel-style query-param compatibility bridge for Battah frontend
  app.get("/api/tenant-auth", (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return handleTenantVerify(req, res);
  });

  app.post("/api/tenant-auth", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const action = String(req.query.action || req.body?.action || "login").trim();
    if (action === "change-password") {
      return handleTenantChangePassword(req, res);
    }
    if (action === "sso-master") {
      const adminAuth = await verifyAdminRequest(req);
      if (!adminAuth.ok) {
        return res.status(401).json({
          ok: false,
          error: "يجب تسجيل الدخول كـ Master Admin في T2OS أولاً لاستخدام الدخول التلقائي، أو أدخل بيانات مدير المتجر.",
        });
      }
      const slug = normalizeSlugKey(String(req.body?.brandSlug || req.query.brandSlug || "captaincar-eg"));
      const brand = (await resolveBrandForAuth(slug)) || { id: slug, slug, name: slug };
      const { userObj, token } = buildAdminUserSession(brand, slug);
      return res.json({ ok: true, token, user: userObj });
    }
    return handleTenantLogin(req, res);
  });

  async function handleTenantStateGet(slugParam: string, req: Request, res: Response) {
    try {
      const slugNorm = normalizeSlugKey(slugParam);
      const fullState = await loadTenantErpState(slugNorm);

      const authHeader = String(req.headers.authorization || "");
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      const decoded = token ? verifyTenantToken(token) : null;
      const isAuthorizedAdmin = Boolean(decoded && normalizeSlugKey(decoded.brandSlug || "") === slugNorm);

      if (!isAuthorizedAdmin) {
        return res.json({
          ok: true,
          scope: "public",
          state: {
            products: Array.isArray(fullState.products) ? fullState.products : null,
            broadcasts: Array.isArray(fullState.broadcasts) ? fullState.broadcasts : [],
            discountCodes: Array.isArray(fullState.discountCodes) ? fullState.discountCodes : [],
            storefrontSettings: fullState.storefrontSettings || null,
            settings: fullState.settings || null,
            appCustomization: fullState.appCustomization || null,
          },
        });
      }

      return res.json({ ok: true, scope: "admin", state: sanitizeAdminErpState(fullState) });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed to load ERP state" });
    }
  }

  async function handleTenantStateSync(slugParam: string, req: Request, res: Response) {
    try {
      const slugNorm = normalizeSlugKey(slugParam);
      const authHeader = String(req.headers.authorization || "");
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      const decoded = verifyTenantToken(token);
      if (!decoded || normalizeSlugKey(decoded.brandSlug || "") !== slugNorm) {
        return res.status(403).json({ ok: false, error: "غير مصرح بالتعديل على بيانات هذا البراند" });
      }

      const incoming = req.body?.state && typeof req.body.state === "object" ? req.body.state : req.body || {};
      const { __auth: _dropAuth, updatedAt: _dropTs, ...cleanPartial } = incoming;

      if (Array.isArray(cleanPartial.users)) {
        const existingState = await loadTenantErpState(slugNorm);
        const existingUsers: any[] = Array.isArray(existingState?.users) ? existingState.users : [];
        cleanPartial.users = cleanPartial.users.map((rawUser: any) => {
          if (!rawUser || typeof rawUser !== "object") return rawUser;
          const uEmail = String(rawUser.username || rawUser.email || "").trim().toLowerCase();
          const prevUser = existingUsers.find(
            (eu: any) =>
              (rawUser.id && String(eu?.id) === String(rawUser.id)) ||
              (uEmail && String(eu?.username || eu?.email || "").trim().toLowerCase() === uEmail)
          );
          const { password, hasPassword: _hp, ...restUser } = rawUser;
          const normalizedUser: Record<string, any> = {
            ...restUser,
            ...(uEmail ? { username: uEmail, email: uEmail } : {}),
          };
          if (typeof password === "string" && password.trim().length > 0) {
            const hashed = hashPassword(password);
            normalizedUser.passwordHash = hashed.hash;
            normalizedUser.passwordSalt = hashed.salt;
          } else if (prevUser?.passwordHash && prevUser?.passwordSalt) {
            normalizedUser.passwordHash = prevUser.passwordHash;
            normalizedUser.passwordSalt = prevUser.passwordSalt;
          }
          return normalizedUser;
        });
      }

      const saved = await saveTenantErpState(slugNorm, cleanPartial);
      return res.json({ ok: true, state: sanitizeAdminErpState(saved) });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed to sync ERP state" });
    }
  }

  async function handleTenantPublicOrder(slugParam: string, req: Request, res: Response) {
    try {
      const slugNorm = normalizeSlugKey(slugParam);
      const b = req.body || {};
      const customerDetails = b.customerDetails || {};
      const items = Array.isArray(b.items) ? b.items : [];
      if (b.order && typeof b.order === "object") {
        const current = await loadTenantErpState(slugNorm);
        const existingOrders = Array.isArray(current.orders) ? current.orders : [];
        const newOrder = {
          ...b.order,
          id: b.order.id || Date.now(),
          createdAt: b.order.createdAt || new Date().toISOString(),
        };
        await saveTenantErpState(slugNorm, { orders: [newOrder, ...existingOrders].slice(0, 500) });
        return res.json({ ok: true, order: newOrder });
      }

      if (!customerDetails?.name || !customerDetails?.phone || !customerDetails?.address || items.length === 0) {
        return res.status(400).json({ ok: false, error: "بيانات العميل والمنتجات مطلوبة لإتمام الطلب" });
      }

      const current = await loadTenantErpState(slugNorm);
      const existingOrders = Array.isArray(current.orders) ? current.orders : [];
      const existingNotifs = Array.isArray(current.notifications) ? current.notifications : [];
      const subtotal = Number(b.subtotal ?? b.totalAmount ?? 0);
      const shippingCfg = current.appCustomization?.shipping || {};
      const defaultFee = Math.max(0, Number(shippingCfg.defaultFee ?? 60) || 0);
      const freeThreshold = Math.max(0, Number(shippingCfg.freeShippingThreshold ?? 0) || 0);
      let deliveryFee = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : defaultFee;
      if (b.shippingZone && Array.isArray(shippingCfg.zones)) {
        const z = shippingCfg.zones.find((item: any) => String(item?.name || "").trim() === String(b.shippingZone).trim());
        if (z) deliveryFee = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : Math.max(0, Number(z.fee) || 0);
      }

      const orderId = String(existingOrders.length + 1).padStart(3, "0");
      const nowIso = new Date().toISOString();
      const newOrder = {
        id: orderId,
        date: nowIso.split("T")[0],
        timestamp: nowIso,
        createdAt: Date.now(),
        customerName: String(customerDetails.name).trim(),
        customerPhone: String(customerDetails.phone).trim(),
        customerAddress: String(customerDetails.address).trim(),
        items,
        deliveryFee,
        ...(b.shippingZone ? { shippingZone: b.shippingZone } : {}),
        totalAmount: Math.max(0, subtotal) + deliveryFee,
        status: "pending",
        paymentMethod: b.paymentMethod === "electronic" ? "electronic" : b.paymentMethod === "paymob" ? "paymob" : "cod",
        ...(b.paymentProofUrl ? { paymentProofUrl: b.paymentProofUrl } : {}),
        ...(b.locationLink ? { locationLink: b.locationLink } : {}),
        ...(b.discountCode ? { discountCode: b.discountCode } : {}),
      };
      const newNotification = {
        id: `notif_${Date.now()}_${orderId}`,
        date: newOrder.date,
        createdAt: Date.now(),
        message: `طلب جديد #${orderId} من ${newOrder.customerName} بقيمة ${newOrder.totalAmount} ج.م`,
        read: false,
        orderId,
        type: "order",
        targetGroup: "admin",
      };

      await saveTenantErpState(slugNorm, {
        orders: [newOrder, ...existingOrders].slice(0, 500),
        notifications: [newNotification, ...existingNotifs].slice(0, 300),
      });

      // Resolve brand metadata for instant WhatsApp alerts & Shadow Live Pulse telemetry
      const brandInfo = await resolveBrandForAuth(slugNorm).catch(() => null);
      const brandName = String(brandInfo?.name || slugNorm);
      const brandKey = String(brandInfo?.id || slugNorm);
      const adminPhone = String(brandInfo?.whatsapp || brandInfo?.phone || "").trim();
      const itemsSummary = items
        .map((it: any) => `• ${it.productName || it.name || "منتج"} × ${it.quantity || it.qty || 1}`)
        .join("\n");

      // 1) Record immediately in Shadow Live Pulse Telemetry (Jarvis live stats)
      let telemetryRecorded = false;
      try {
        recordLiveEvent({
          source: "battah",
          eventType: "order_created",
          brandId: brandKey,
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          amountEgp: newOrder.totalAmount,
          summary: `طلب متجر أونلاين #${orderId} (${brandName}) من ${newOrder.customerName} — ${newOrder.totalAmount} ج.م`,
          raw: { slug: slugNorm, orderId, paymentMethod: newOrder.paymentMethod, itemsCount: items.length },
        });
        telemetryRecorded = true;
      } catch {}

      // 2) Instant WhatsApp notification to Store Admin via T2 AI Agent
      let adminWhatsappQueued = false;
      if (adminPhone) {
        const publicBase = String(process.env.PUBLIC_BASE_URL || "https://t2os.app").replace(/\/+$/, "");
        const adminMsg =
          `🔔 *طلب أونلاين جديد — ${brandName}* (#${orderId})\n` +
          `👤 العميل: ${newOrder.customerName}\n` +
          `📱 الهاتف: ${newOrder.customerPhone}\n` +
          `📍 العنوان: ${newOrder.customerAddress}\n` +
          `🛒 الأصناف:\n${itemsSummary}\n` +
          `💰 الإجمالي: *${newOrder.totalAmount} ج.م* (${newOrder.paymentMethod === "cod" ? "دفع عند الاستلام" : newOrder.paymentMethod})\n` +
          `🔗 لوحة الإدارة: ${publicBase}/store/${encodeURIComponent(slugNorm)}`;
        adminWhatsappQueued = true;
        t2AgentApi.sendManualReply(brandKey, adminPhone, adminMsg).catch(() => {});
      }

      // 3) Automatic WhatsApp order confirmation to Customer via T2 AI Agent
      let customerWhatsappQueued = false;
      if (newOrder.customerPhone) {
        const customerMsg =
          `أهلاً بك يا ${newOrder.customerName} في *${brandName}* 🌟\n` +
          `تم استلام طلبك رقم *#${orderId}* بنجاح!\n` +
          `🛒 تفاصيل الطلب:\n${itemsSummary}\n` +
          `💰 الإجمالي شامل الشحن: *${newOrder.totalAmount} ج.م*\n` +
          `📍 العنوان: ${newOrder.customerAddress}\n` +
          `فريقنا هيراجع الطلب ويتواصل معاك لتأكيد التوصيل في أسرع وقت ✅`;
        customerWhatsappQueued = true;
        t2AgentApi.sendManualReply(brandKey, newOrder.customerPhone, customerMsg).catch(() => {});
      }

      return res.json({
        ok: true,
        order: newOrder,
        notification: newNotification,
        alerts: {
          adminWhatsappQueued,
          customerWhatsappQueued,
          telemetryRecorded,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed to create tenant order" });
    }
  }

  app.get("/api/tenant-erp/:slug/state", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return handleTenantStateGet(String(req.params.slug || "").trim(), req, res);
  });

  app.post("/api/tenant-erp/:slug/sync", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return handleTenantStateSync(String(req.params.slug || "").trim(), req, res);
  });

  app.post("/api/tenant-erp/:slug/orders", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return handleTenantPublicOrder(String(req.params.slug || "").trim(), req, res);
  });

  app.get("/api/tenant-erp", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const slug = String(req.query.slug || "default").trim();
    const action = String(req.query.action || "").trim();
    if (action === "my-orders") {
      const phoneDigits = String(req.query.phone || "").replace(/\D/g, "");
      if (!phoneDigits) return res.status(400).json({ ok: false, error: "رقم الهاتف مطلوب" });
      const tail = phoneDigits.slice(-9);
      const state = await loadTenantErpState(normalizeSlugKey(slug));
      const allOrders: any[] = Array.isArray(state.orders) ? state.orders : [];
      const matching = allOrders.filter((o) => {
        const p = String(o?.customerPhone || "").replace(/\D/g, "");
        return p && (p === phoneDigits || (tail.length >= 8 && p.endsWith(tail)));
      });
      return res.json({ ok: true, orders: matching });
    }
    return handleTenantStateGet(slug, req, res);
  });

  app.post("/api/tenant-erp", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const slug = String(req.query.slug || req.body?.slug || "default").trim();
    const action = String(req.query.action || req.body?.action || "").trim();
    if (action === "create-order") {
      return handleTenantPublicOrder(slug, req, res);
    }
    return handleTenantStateSync(slug, req, res);
  });

  app.post("/api/tenant-shipping", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const slugNorm = normalizeSlugKey(String(req.query.slug || req.body?.slug || "default"));
      const authHeader = String(req.headers.authorization || "");
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      const decoded = verifyTenantToken(token);
      if (!decoded || normalizeSlugKey(decoded.brandSlug || "") !== slugNorm) {
        return res.status(401).json({ ok: false, error: "جلسة غير مصرح بها لشحن الطلبات" });
      }

      const orderId = String(req.body?.orderId || "").trim();
      const provider = String(req.body?.provider || "bosta").trim().toLowerCase() as CarrierProvider;
      const state = await loadTenantErpState(slugNorm);
      const ordersList: any[] = Array.isArray(state.orders) ? [...state.orders] : [];
      const idx = ordersList.findIndex((o) => String(o?.id) === orderId);
      if (idx < 0) {
        return res.status(404).json({ ok: false, error: "الطلب غير موجود" });
      }

      const trackingNumber =
        String(req.body?.trackingNumber || "").trim() ||
        `${provider.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const trackingUrl = buildCarrierTrackingUrl(provider, trackingNumber);

      ordersList[idx] = {
        ...ordersList[idx],
        status: "shipped",
        carrierProvider: provider,
        shippingCompany: String(req.body?.shippingCompany || provider.toUpperCase()),
        trackingNumber,
        trackingUrl: trackingUrl || ordersList[idx].trackingUrl,
        shippingNotes: String(req.body?.notes || ordersList[idx].shippingNotes || ""),
      };

      await saveTenantErpState(slugNorm, { orders: ordersList });
      return res.json({ ok: true, order: ordersList[idx] });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Shipping gateway error" });
    }
  });

  app.get("/api/tenant-erp/:slug/invoice/:invoiceId/print", async (req: Request, res: Response) => {
    try {
      const slugNorm = normalizeSlugKey(String(req.params.slug || "").trim());
      const invoiceId = String(req.params.invoiceId || "").trim();
      const state = await loadTenantErpState(slugNorm);
      const sales: any[] = Array.isArray(state.dailySales) ? state.dailySales : [];
      const sale = sales.find(
        (s) => String(s.id) === invoiceId || String(s.invoiceNumber) === invoiceId
      );
      if (!sale) {
        return res.status(404).send("<html dir='rtl'><body style='font-family:sans-serif;padding:40px;text-align:center'><h2>الفاتورة غير موجودة</h2></body></html>");
      }

      const unified = getUnifiedGrowthBrands();
      const brand =
        unified.find(
          (b) => b.id === slugNorm || String(b.slug || "").toLowerCase().replace(/[-_]+/g, "-") === slugNorm
        ) || getClonedBrandByIdOrSlug(slugNorm);
      const brandName = String(state.storefrontSettings?.companyName || brand?.name || slugNorm).replace(/[<>]/g, "");
      const brandLogo = String(brand?.logoUrl || "");
      const brandPhone = String(state.storefrontSettings?.contactPhone || brand?.phone || "");

      const items: any[] = Array.isArray(sale.items) ? sale.items : [];
      const rowsHtml = items
        .map((it: any, i: number) => {
          const qty = Number(it.quantity || it.qty || 1);
          const unitPrice = Number(it.unitPrice || it.price || 0);
          const rowTotal = qty * unitPrice;
          return `<tr>
            <td>${i + 1}</td>
            <td>${String(it.productName || it.name || "صنف").replace(/[<>]/g, "")}</td>
            <td>${qty}</td>
            <td>${unitPrice.toLocaleString("ar-EG")} ج.م</td>
            <td><strong>${rowTotal.toLocaleString("ar-EG")} ج.م</strong></td>
          </tr>`;
        })
        .join("");

      const subtotal = Number(sale.subtotal || sale.total || 0);
      const discount = Number(sale.discount || 0);
      const taxAmount = Number(sale.taxAmount || 0);
      const total = Number(sale.total || sale.totalAmount || subtotal);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>فاتورة رقم ${sale.invoiceNumber || sale.id} - ${brandName}</title>
<style>
  body { font-family: 'Cairo', Tahoma, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
  .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 8px 30px rgba(15,23,42,0.06); }
  .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 58px; height: 58px; border-radius: 12px; object-fit: cover; border: 1px solid #cbd5e1; }
  .meta { text-align: left; font-size: 13px; color: #475569; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; background: #f1f5f9; padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: right; }
  th { background: #0f172a; color: #fff; font-weight: 700; }
  .totals { width: 280px; margin-right: auto; font-size: 14px; }
  .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
  .totals .grand { font-size: 18px; font-weight: 900; border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 8px; color: #0284c7; }
  .actions { text-align: center; margin-top: 22px; }
  .btn { background: #0284c7; color: #fff; border: 0; padding: 10px 26px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; }
  @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; border: 0; } .actions { display: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" />` : ""}
        <div>
          <h2 style="margin:0;font-size:20px;">${brandName}</h2>
          <div style="font-size:12px;color:#64748b;">${brandPhone ? `هاتف: ${brandPhone}` : "فاتورة مبيعات معتمدة"}</div>
        </div>
      </div>
      <div class="meta">
        <div><strong>رقم الفاتورة:</strong> ${sale.invoiceNumber || sale.id}</div>
        <div><strong>التاريخ:</strong> ${String(sale.date || "").slice(0, 10)}</div>
      </div>
    </div>
    <div class="grid">
      <div><strong>العميل:</strong> ${String(sale.customerName || "عميل نقدي").replace(/[<>]/g, "")}</div>
      <div><strong>الفرع:</strong> ${String(sale.branchSoldFrom || sale.branch || "الفرع الرئيسي")}</div>
      <div><strong>الكاشير:</strong> ${String(sale.cashierLocation || "الكاشير الرئيسي")}</div>
      <div><strong>الدفع:</strong> ${String(sale.paymentMethod || "نقدي")}</div>
    </div>
    <table>
      <thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
      <tbody>${rowsHtml || `<tr><td>1</td><td>مبيعات عامة</td><td>1</td><td>${total} ج.م</td><td><strong>${total} ج.م</strong></td></tr>`}</tbody>
    </table>
    <div class="totals">
      <div><span>المجموع الفرعي:</span><span>${subtotal.toLocaleString("ar-EG")} ج.م</span></div>
      ${discount > 0 ? `<div><span>الخصم:</span><span>-${discount.toLocaleString("ar-EG")} ج.م</span></div>` : ""}
      ${taxAmount > 0 ? `<div><span>ضريبة القيمة المضافة (14%):</span><span>${taxAmount.toLocaleString("ar-EG")} ج.م</span></div>` : ""}
      <div class="grand"><span>الإجمالي النهائي:</span><span>${total.toLocaleString("ar-EG")} ج.م</span></div>
    </div>
    <div class="actions">
      <button class="btn" onclick="window.print()">🖨️ طباعة الفاتورة الآن</button>
    </div>
  </div>
</body>
</html>`);
    } catch (err: any) {
      res.status(500).send("Error rendering invoice");
    }
  });
}
