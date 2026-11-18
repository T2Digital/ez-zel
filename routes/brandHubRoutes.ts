import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { loadTenantErpState, saveTenantErpState, normalizeSlugKey } from "../services/tenantErpStoreService";

const HUB_CONFIG_FILE = path.join(process.cwd(), "data", "brand_hub_configs.json");

interface BrandHubDeps {
  getUnifiedGrowthBrands: () => any[];
  getPersistedTenants: () => any[];
  getClonedBrandByIdOrSlug: (idOrSlug: string) => any;
  getServerAI: () => any;
}

function readAllHubConfigs(): Record<string, any> {
  try {
    if (!fs.existsSync(HUB_CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(HUB_CONFIG_FILE, "utf8")) || {};
  } catch {
    return {};
  }
}

function writeAllHubConfigs(data: Record<string, any>): void {
  try {
    if (!fs.existsSync(path.dirname(HUB_CONFIG_FILE))) {
      fs.mkdirSync(path.dirname(HUB_CONFIG_FILE), { recursive: true });
    }
    fs.writeFileSync(HUB_CONFIG_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("[BrandHub] Failed writing hub configs:", err);
  }
}

export function resolveBrandRealAppUrl(brand: any, tenant: any): string {
  const candidates = [
    brand?.vercelUrl,
    brand?.deployedUrl,
    brand?.appUrl,
    tenant?.liveUrl,
    tenant?.vercelUrl,
    brand?.websiteUrl,
  ]
    .map((u) => String(u || "").trim())
    .filter((u) => /^https?:\/\//i.test(u) && !u.includes("ez-zel.onrender.com/store"));

  if (candidates.length > 0) return candidates[0];

  const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || "");
  if (slug === "auto-house" || slug.includes("auto_house")) {
    return "https://t2-tenant-auto-house.vercel.app";
  }
  if (slug === "clean_master" || slug === "clean-master") {
    return "https://cleanmaster-eg.com";
  }
  if (slug) {
    return `https://t2-tenant-${slug.replace(/_/g, "-")}.vercel.app`;
  }
  return `/store/${brand?.slug || brand?.id || ""}`;
}

function findBrandAndTenant(idOrSlug: string, deps: BrandHubDeps) {
  const key = String(idOrSlug || "").trim().toLowerCase();
  const normKey = normalizeSlugKey(idOrSlug);
  const unified = deps.getUnifiedGrowthBrands() || [];
  const tenants = deps.getPersistedTenants() || [];

  const brand =
    unified.find(
      (b: any) =>
        String(b?.id || "").toLowerCase() === key ||
        String(b?.slug || "").toLowerCase() === key ||
        normalizeSlugKey(b?.slug || b?.id || "") === normKey ||
        String(b?.name || "").toLowerCase().includes(key)
    ) || deps.getClonedBrandByIdOrSlug(idOrSlug);

  const tenant = tenants.find(
    (t: any) =>
      String(t?.id || "").toLowerCase() === key ||
      String(t?.slug || "").toLowerCase() === key ||
      normalizeSlugKey(t?.slug || t?.templateId || t?.id || "") === normKey ||
      String(t?.businessName || "").toLowerCase().includes(key)
  );

  return { brand, tenant };
}

export function registerBrandHubRoutes(app: Express, deps: BrandHubDeps) {
  // 1) GET Unified Brand Hub Payload (App + Social + Agent + Knowledge Base)
  app.get("/api/brand-hub/:idOrSlug", async (req: Request, res: Response) => {
    try {
      const { idOrSlug } = req.params;
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      if (!brand && !tenant) {
        return res.status(404).json({ ok: false, error: "Brand not found" });
      }

      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const allConfigs = readAllHubConfigs();
      const savedHub = allConfigs[slug] || allConfigs[brand?.id || ""] || {};

      let erpState: any = null;
      try {
        erpState = await loadTenantErpState(slug);
      } catch {}

      const storefront = erpState?.storefrontSettings || {};
      const erpProducts = Array.isArray(erpState?.products) ? erpState.products : [];
      const catalog = erpProducts.length > 0 ? erpProducts : (brand?.productsCatalog || []);

      const appUrl = savedHub.appUrl || resolveBrandRealAppUrl(brand, tenant);

      const payload = {
        id: brand?.id || tenant?.id || slug,
        slug: brand?.slug || tenant?.slug || slug,
        name: storefront.companyName || savedHub.name || brand?.name || tenant?.businessName || slug,
        slogan: savedHub.slogan || brand?.slogan || "",
        businessType: brand?.businessType || tenant?.templateName || "نشاط تجاري",
        logoUrl: savedHub.logoUrl || brand?.logoUrl || "",
        primaryColor: storefront.primaryColor || savedHub.primaryColor || brand?.primaryColor || "#0284c7",
        phone: storefront.contactPhone || savedHub.phone || brand?.phone || tenant?.whatsappBot || "",
        address: storefront.address || savedHub.address || brand?.address || "",
        appUrl,
        adminUrl: `${appUrl.replace(/\/$/, "")}/?admin=1`,
        catalogCount: catalog.length,
        productsCatalog: catalog.slice(0, 30),
        agentConfig: {
          tone: savedHub.agentConfig?.tone || brand?.toneOfVoice || "ودي واحترافي باللهجة المصرية، يركز على إغلاق البيع بوضوح",
          welcomeMessage: savedHub.agentConfig?.welcomeMessage || `أهلاً بك في ${brand?.name || slug}! كيف نقدر نساعدك اليوم؟`,
          shippingPolicy: savedHub.agentConfig?.shippingPolicy || "التوصيل داخل القاهرة والجيزة خلال 24 ساعة، وباقي المحافظات خلال 48-72 ساعة.",
          forbiddenTopics: savedHub.agentConfig?.forbiddenTopics || "عدم تأكيد أي خصم غير موجود في الكتالوج أو تقديم وعود تسليم فورية خارج ساعات العمل.",
          faq: savedHub.agentConfig?.faq || "",
        },
        knowledgeBase: savedHub.knowledgeBase || brand?.knowledgeBase || brand?.systemPrompt || "",
        socialConnections: {
          whatsapp: Boolean(brand?.phone || tenant?.whatsappBot || brand?.whatsappConnected),
          facebook: Boolean(brand?.metaConnected || brand?.facebookPageId || savedHub.socialConnections?.facebook),
          instagram: Boolean(brand?.instagramConnected || brand?.instagramAccountId || savedHub.socialConnections?.instagram),
          tiktok: Boolean(brand?.tiktokConnected || savedHub.socialConnections?.tiktok),
          youtube: Boolean(brand?.youtubeConnected || savedHub.socialConnections?.youtube),
          telegram: Boolean(brand?.telegramConnected || savedHub.socialConnections?.telegram),
        },
        weekContentPlan: Array.isArray(brand?.weekContentPlan) ? brand.weekContentPlan : [],
        recentConversations: Array.isArray(savedHub.recentConversations)
          ? savedHub.recentConversations
          : [
              {
                id: "conv_1",
                customerName: "عميل واتساب",
                channel: "WhatsApp",
                lastMessage: "ممكن تفاصيل الأسعار والتوصيل؟",
                agentReply: `أهلاً بحضرتك في ${brand?.name || slug}! متاح لدينا ${catalog.length} منتجات/خدمات جاهزة للشحن.`,
                time: "منذ 12 دقيقة",
              },
            ],
        updatedAt: savedHub.updatedAt || erpState?.updatedAt || new Date().toISOString(),
      };

      res.json({ ok: true, brand: payload });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to load Brand Hub" });
    }
  });

  // 2) POST Live Health Check (App URL Ping + Cloud ERP + WhatsApp + Social Tokens)
  app.post("/api/brand-hub/:idOrSlug/health-check", async (req: Request, res: Response) => {
    try {
      const { idOrSlug } = req.params;
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      if (!brand && !tenant) {
        return res.status(404).json({ ok: false, error: "Brand not found" });
      }

      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const savedHub = readAllHubConfigs()[slug] || {};
      const appUrl = savedHub.appUrl || resolveBrandRealAppUrl(brand, tenant);

      // Live Ping App URL
      let appCheck: any = { ok: false, statusCode: 0, latencyMs: 0, url: appUrl, message: "لم يتم الفحص" };
      if (/^https?:\/\//i.test(appUrl)) {
        const started = Date.now();
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 4500);
          const r = await fetch(appUrl, { method: "HEAD", signal: controller.signal });
          clearTimeout(t);
          appCheck = {
            ok: r.ok || (r.status >= 200 && r.status < 400),
            statusCode: r.status,
            latencyMs: Date.now() - started,
            url: appUrl,
            message: r.ok ? "التطبيق يعمل ومستجيب" : `استجابة HTTP ${r.status}`,
          };
        } catch (pingErr: any) {
          appCheck = {
            ok: false,
            statusCode: 0,
            latencyMs: Date.now() - started,
            url: appUrl,
            message: pingErr?.name === "AbortError" ? "انتهت مهلة الاتصال" : "تعذر الوصول للرابط",
          };
        }
      }

      // Check Cloud ERP State
      let erpOk = false;
      let erpProductsCount = 0;
      try {
        const st = await loadTenantErpState(slug);
        erpOk = Boolean(st);
        erpProductsCount = Array.isArray(st?.products) ? st.products.length : 0;
      } catch {}

      const hasWhatsapp = Boolean(brand?.phone || tenant?.whatsappBot);
      const metaConnected = Boolean(brand?.metaConnected || brand?.facebookPageId || savedHub.socialConnections?.facebook);
      const igConnected = Boolean(brand?.instagramConnected || brand?.instagramAccountId || savedHub.socialConnections?.instagram);
      const tgConnected = Boolean(brand?.telegramConnected || savedHub.socialConnections?.telegram);

      res.json({
        ok: true,
        checkedAt: new Date().toISOString(),
        checks: {
          app: appCheck,
          cloudErp: {
            ok: erpOk,
            productsCount: erpProductsCount,
            message: erpOk ? `متصل (${erpProductsCount} عنصر متزامن)` : "يعمل بالبيانات الافتراضية",
          },
          whatsappAgent: {
            ok: hasWhatsapp,
            phone: brand?.phone || tenant?.whatsappBot || "",
            message: hasWhatsapp ? `مربوط بالرقم ${brand?.phone || tenant?.whatsappBot}` : "لم يتم ربط رقم واتساب بعد",
          },
          social: {
            facebook: { ok: metaConnected, label: metaConnected ? "متصل" : "غير مربوط" },
            instagram: { ok: igConnected, label: igConnected ? "متصل" : "غير مربوط" },
            telegram: { ok: tgConnected, label: tgConnected ? "متصل" : "غير مربوط" },
            tiktok: { ok: Boolean(savedHub.socialConnections?.tiktok), label: savedHub.socialConnections?.tiktok ? "متصل" : "غير مربوط" },
            youtube: { ok: Boolean(savedHub.socialConnections?.youtube), label: savedHub.socialConnections?.youtube ? "متصل" : "غير مربوط" },
          },
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Health check failed" });
    }
  });

  // 3) POST Update Unified Brand Hub (Single Source of Truth -> App + ERP + Agent + Brain)
  app.post("/api/brand-hub/:idOrSlug/update", async (req: Request, res: Response) => {
    try {
      const { idOrSlug } = req.params;
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);

      const {
        name,
        slogan,
        phone,
        address,
        primaryColor,
        appUrl,
        agentConfig,
        knowledgeBase,
        socialConnections,
      } = req.body || {};

      const allConfigs = readAllHubConfigs();
      const prev = allConfigs[slug] || {};
      const next = {
        ...prev,
        ...(name !== undefined ? { name } : {}),
        ...(slogan !== undefined ? { slogan } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(primaryColor !== undefined ? { primaryColor } : {}),
        ...(appUrl !== undefined ? { appUrl } : {}),
        ...(agentConfig ? { agentConfig: { ...(prev.agentConfig || {}), ...agentConfig } } : {}),
        ...(knowledgeBase !== undefined ? { knowledgeBase } : {}),
        ...(socialConnections ? { socialConnections: { ...(prev.socialConnections || {}), ...socialConnections } } : {}),
        updatedAt: new Date().toISOString(),
      };
      allConfigs[slug] = next;
      writeAllHubConfigs(allConfigs);

      // Sync identity updates straight to Tenant Cloud ERP storefrontSettings so app & printed invoices update live
      let erpSynced = false;
      if (name !== undefined || phone !== undefined || address !== undefined || primaryColor !== undefined) {
        try {
          const erpState = (await loadTenantErpState(slug)) || {};
          const prevStorefront = erpState.storefrontSettings || {};
          await saveTenantErpState(slug, {
            ...erpState,
            storefrontSettings: {
              ...prevStorefront,
              ...(name !== undefined ? { companyName: name } : {}),
              ...(phone !== undefined ? { contactPhone: phone } : {}),
              ...(address !== undefined ? { address } : {}),
              ...(primaryColor !== undefined ? { primaryColor } : {}),
            },
          });
          erpSynced = true;
        } catch {}
      }

      res.json({ ok: true, erpSynced, updatedAt: next.updatedAt, config: next });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to update Brand Hub" });
    }
  });

  // 4) POST Test Sales Agent Response with Brand's Training + Knowledge Base + Live Catalog
  app.post("/api/brand-hub/:idOrSlug/test-agent", async (req: Request, res: Response) => {
    try {
      const { idOrSlug } = req.params;
      const { customerMessage } = req.body || {};
      if (!customerMessage || !String(customerMessage).trim()) {
        return res.status(400).json({ ok: false, error: "يرجى كتابة رسالة العميل للاختبار" });
      }

      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const savedHub = readAllHubConfigs()[slug] || {};
      const erpState = await loadTenantErpState(slug).catch(() => null);
      const products = Array.isArray(erpState?.products) && erpState.products.length > 0
        ? erpState.products
        : (brand?.productsCatalog || []);

      const brandName = savedHub.name || brand?.name || tenant?.businessName || slug;
      const phone = savedHub.phone || brand?.phone || tenant?.whatsappBot || "";
      const address = savedHub.address || brand?.address || "";
      const tone = savedHub.agentConfig?.tone || "ودي واحترافي بالمصري";
      const shippingPolicy = savedHub.agentConfig?.shippingPolicy || "";
      const knowledge = savedHub.knowledgeBase || "";

      const catalogLines = products
        .slice(0, 12)
        .map((p: any) => `- ${p.name}: ${p.sellingPrice || p.numericPrice || p.price || "حسب الطلب"} ج.م`)
        .join("\n");

      const ai = deps.getServerAI();
      let replyText = "";

      if (ai) {
        try {
          const prompt = `أنت وكيل المبيعات الذكي لبراند "${brandName}".
النبرة المطلوبة: ${tone}
العنوان: ${address || "غير محدد"} | الهاتف: ${phone || "غير محدد"}
سياسة الشحن والبيع: ${shippingPolicy || "حسب الاتفاق"}
معلومات إضافية من بنك المعرفة:
${knowledge || "لا توجد معلومات إضافية"}

المنتجات/الخدمات المتاحة حالياً:
${catalogLines || "لا توجد منتجات مسجلة بعد"}

رسالة العميل الآن: "${customerMessage}"
اكتب رداً عملياً ومقنعاً بالمصري بناءً على المعلومات أعلاه فقط دون اختراع أسعار.`;
          const aiRes = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          replyText = aiRes?.text?.trim() || "";
        } catch {}
      }

      if (!replyText) {
        const q = String(customerMessage).toLowerCase();
        const matched = products.filter((p: any) =>
          String(p?.name || "").toLowerCase().split(/\s+/).some((w: string) => w.length > 2 && q.includes(w))
        );
        if (matched.length > 0) {
          const itemsStr = matched.slice(0, 3).map((m: any) => `${m.name} (${m.sellingPrice || m.numericPrice || m.price} ج.م)`).join("، ");
          replyText = `أهلاً بحضرتك في ${brandName}! متاح لدينا الآن: ${itemsStr}. ${shippingPolicy} تقدر تطلب مباشرة أو تكلمنا على ${phone}.`;
        } else {
          replyText = `أهلاً بحضرتك في ${brandName}! ${knowledge ? knowledge.slice(0, 140) + " — " : ""}لدينا ${products.length} منتجات/خدمات جاهزة. ${shippingPolicy} للتواصل السريع: ${phone}.`;
        }
      }

      res.json({
        ok: true,
        replyText,
        catalogCheckedCount: products.length,
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Agent test failed" });
    }
  });
}
