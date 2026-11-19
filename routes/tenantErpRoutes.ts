import type { Express, Request, Response } from "express";
import crypto from "crypto";
import {
  loadTenantErpState,
  saveTenantErpState,
  getTenantPasswordRecord,
  setTenantPasswordRecord,
  verifyPasswordHash,
  normalizeSlugKey,
} from "../services/tenantErpStoreService";

const getTenantAuthSecret = () => {
  const s = process.env.TENANT_AUTH_SECRET || process.env.ADMIN_API_SECRET || process.env.T2_REMOTE_API_KEY;
  if (!s) {
    if (!(globalThis as any).__t2TenantSecretWarned) {
      (globalThis as any).__t2TenantSecretWarned = true;
      console.warn("[Security] TENANT_AUTH_SECRET / ADMIN_API_SECRET is not set; using development fallback secret.");
    }
    return "t2os-sovereign-tenant-secret-2026";
  }
  return s;
};

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
      "/api/tenant-auth/login",
      "/api/tenant-auth/verify",
      "/api/tenant-auth/change-password",
      "/api/tenant-erp/:slug/state",
      "/api/tenant-erp/:slug/sync",
      "/api/tenant-erp/:slug/orders",
    ],
    (_req: Request, res: Response) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
      res.status(204).end();
    }
  );

  app.post("/api/tenant-auth/login", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const { brandSlug, email, password } = req.body || {};
      const slug = String(brandSlug || "").trim();
      const emailInput = String(email || "").trim().toLowerCase();
      const passInput = String(password || "");
      if (!slug || !emailInput || !passInput) {
        return res.status(400).json({ ok: false, error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" });
      }

      const slugNorm = slug.toLowerCase().replace(/[-_]+/g, "-");
      const unified = getUnifiedGrowthBrands();
      let brand: any =
        unified.find(
          (b) => b.id === slug || String(b.slug || "").toLowerCase().replace(/[-_]+/g, "-") === slugNorm
        ) || getClonedBrandByIdOrSlug(slug);

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

      if (!brand) {
        return res.status(404).json({ ok: false, error: "البراند غير مسجل" });
      }

      const asciiSlug =
        String(brand.slug || brand.englishName || brand.id || "brand")
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, "") || slugNorm;
      const expectedEmail = String(brand.adminEmail || `owner@${asciiSlug}.t2.app`).trim().toLowerCase();
      const phoneDigits = String(brand.phone || brand.whatsapp || "").replace(/\D/g, "");
      const adminPin = String(brand.adminPin || phoneDigits.slice(-6) || "");
      const expectedPass = adminPin ? `T2@${adminPin}` : "";

      const hashSha = (v: string) => crypto.createHash("sha256").update(v).digest();
      const emailMatch = crypto.timingSafeEqual(hashSha(emailInput), hashSha(expectedEmail));

      const customPassRec = await getTenantPasswordRecord(asciiSlug);
      const passMatch = customPassRec
        ? verifyPasswordHash(passInput, customPassRec.hash, customPassRec.salt)
        : expectedPass.length > 0 && crypto.timingSafeEqual(hashSha(passInput), hashSha(expectedPass));

      if (!emailMatch || !passMatch) {
        return res.status(401).json({ ok: false, error: "بيانات الدخول غير صحيحة لهذا البراند" });
      }

      const userObj = {
        id: `admin_${asciiSlug}`,
        username: expectedEmail,
        email: expectedEmail,
        name: `مدير ${brand.name}`,
        role: "admin",
        branch: "main",
        brandSlug: asciiSlug,
        permissions: [
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
        ],
      };

      const token = signTenantToken({ ...userObj, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      res.json({ ok: true, token, user: userObj });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Tenant auth error" });
    }
  });

  app.get("/api/tenant-auth/verify", (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : String(req.query.token || "");
    const decoded = verifyTenantToken(token);
    if (!decoded) return res.status(401).json({ ok: false, error: "Invalid or expired session" });
    const brandSlug = String(req.query.brandSlug || "").toLowerCase().replace(/[-_]+/g, "-");
    if (brandSlug && String(decoded.brandSlug || "").toLowerCase().replace(/[-_]+/g, "-") !== brandSlug) {
      return res.status(403).json({ ok: false, error: "Token not scoped to this brand" });
    }
    res.json({ ok: true, user: decoded });
  });

  app.post("/api/tenant-auth/change-password", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
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

      const customRec = await getTenantPasswordRecord(decoded.brandSlug);
      if (customRec) {
        if (!verifyPasswordHash(oldPass, customRec.hash, customRec.salt)) {
          return res.status(403).json({ ok: false, error: "كلمة المرور الحالية غير صحيحة" });
        }
      } else {
        const unified = getUnifiedGrowthBrands();
        const slugNorm = String(decoded.brandSlug).toLowerCase().replace(/[-_]+/g, "-");
        const brand =
          unified.find((b) => String(b.slug || "").toLowerCase().replace(/[-_]+/g, "-") === slugNorm) ||
          getClonedBrandByIdOrSlug(slugNorm);
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

      await setTenantPasswordRecord(decoded.brandSlug, newPass);
      res.json({ ok: true, message: "تم تحديث كلمة المرور وتشفيرها بنجاح" });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to update password" });
    }
  });

  app.get("/api/tenant-erp/:slug/state", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const slugNorm = normalizeSlugKey(String(req.params.slug || "").trim());
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
            settings: fullState.settings || null,
            appCustomization: fullState.appCustomization || null,
          },
        });
      }

      const { __auth: _stripAuth, ...safeAdminState } = fullState;
      res.json({ ok: true, scope: "admin", state: safeAdminState });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to load ERP state" });
    }
  });

  app.post("/api/tenant-erp/:slug/sync", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const slugNorm = normalizeSlugKey(String(req.params.slug || "").trim());
      const authHeader = String(req.headers.authorization || "");
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      const decoded = verifyTenantToken(token);
      if (!decoded || normalizeSlugKey(decoded.brandSlug || "") !== slugNorm) {
        return res.status(403).json({ ok: false, error: "غير مصرح بالتعديل على بيانات هذا البراند" });
      }

      const incoming = req.body?.state && typeof req.body.state === "object" ? req.body.state : req.body || {};
      const { __auth: _dropAuth, updatedAt: _dropTs, ...cleanPartial } = incoming;
      const saved = await saveTenantErpState(slugNorm, cleanPartial);
      const { __auth: _stripAuth, ...safeState } = saved;
      res.json({ ok: true, state: safeState });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to sync ERP state" });
    }
  });

  app.post("/api/tenant-erp/:slug/orders", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const slugNorm = normalizeSlugKey(String(req.params.slug || "").trim());
      const order = req.body?.order || req.body;
      if (!order || typeof order !== "object") {
        return res.status(400).json({ ok: false, error: "Invalid order payload" });
      }
      const current = await loadTenantErpState(slugNorm);
      const existingOrders = Array.isArray(current.orders) ? current.orders : [];
      const newOrder = {
        ...order,
        id: order.id || Date.now(),
        createdAt: order.createdAt || new Date().toISOString(),
      };
      await saveTenantErpState(slugNorm, {
        orders: [newOrder, ...existingOrders].slice(0, 500),
      });
      res.json({ ok: true, order: newOrder });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to save order" });
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
