import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { loadTenantErpState, saveTenantErpState, normalizeSlugKey } from "../services/tenantErpStoreService";
import { t2AgentApi, getT2AgentBaseUrl } from "../services/t2AgentApiClient";
import { getTitoStudioAuthToken } from "../services/titoStudioFirestoreBridge";

const HUB_CONFIG_FILE = path.join(process.cwd(), "data", "brand_hub_configs.json");
const PROJECT_ID = process.env.TITO_STUDIO_PROJECT_ID || "t2-content-studio";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const MASTER_EMAILS = new Set([
  "tito@shadow.com",
  "admin@shadow.com",
  "ahm.atya@gmail.com",
  "ahmed.atya.daif@gmail.com",
]);

interface BrandHubDeps {
  getUnifiedGrowthBrands: () => any[];
  getPersistedTenants: () => any[];
  getClonedBrandByIdOrSlug: (idOrSlug: string) => any;
  getServerAI: () => any;
}

function readLocalHubConfigs(): Record<string, any> {
  try {
    if (!fs.existsSync(HUB_CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(HUB_CONFIG_FILE, "utf8")) || {};
  } catch {
    return {};
  }
}

function writeLocalHubConfigs(data: Record<string, any>): void {
  try {
    if (!fs.existsSync(path.dirname(HUB_CONFIG_FILE))) {
      fs.mkdirSync(path.dirname(HUB_CONFIG_FILE), { recursive: true });
    }
    fs.writeFileSync(HUB_CONFIG_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("[BrandHub] Failed writing local cache:", err);
  }
}

async function loadHubConfigPersistent(slug: string): Promise<any> {
  const local = readLocalHubConfigs()[slug] || {};
  try {
    const token = await getTitoStudioAuthToken();
    if (!token) return local;
    const res = await fetch(`${FIRESTORE_BASE}/t2_brand_hub_configs/${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return local;
    const doc = await res.json();
    const rawJson = doc?.fields?.payloadJson?.stringValue;
    if (!rawJson) return local;
    const remote = JSON.parse(rawJson);
    // Keep local cache warm
    const all = readLocalHubConfigs();
    all[slug] = { ...local, ...remote };
    writeLocalHubConfigs(all);
    return { ...local, ...remote };
  } catch {
    return local;
  }
}

async function saveHubConfigPersistent(slug: string, payload: any): Promise<boolean> {
  const all = readLocalHubConfigs();
  all[slug] = payload;
  writeLocalHubConfigs(all);

  try {
    const token = await getTitoStudioAuthToken();
    if (!token) return false;
    const res = await fetch(`${FIRESTORE_BASE}/t2_brand_hub_configs/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          slug: { stringValue: slug },
          updatedAt: { stringValue: payload.updatedAt || new Date().toISOString() },
          payloadJson: { stringValue: JSON.stringify(payload) },
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function resolveRequesterContext(req: Request): { authenticated: boolean; isMaster: boolean; email: string } {
  const adminKeyHeader = String(req.headers["x-admin-key"] || "").trim();
  const expectedKey = String(process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY || "").trim();
  if (expectedKey && adminKeyHeader && adminKeyHeader === expectedKey) {
    return { authenticated: true, isMaster: true, email: "master@t2.local" };
  }

  const authHeader = String(req.headers.authorization || "");
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        const email = String(claims?.email || "").toLowerCase().trim();
        const isMaster = MASTER_EMAILS.has(email) || claims?.role === "admin" || claims?.role === "master";
        return { authenticated: true, isMaster, email };
      }
    } catch {}
  }

  return { authenticated: false, isMaster: false, email: "" };
}

function canMutateBrand(req: Request, brand: any, tenant: any): boolean {
  const ctx = resolveRequesterContext(req);
  if (ctx.isMaster) return true;
  if (!ctx.authenticated || !ctx.email) return false;
  const ownerCandidates = [
    brand?.ownerEmail,
    brand?.adminEmail,
    tenant?.ownerEmail,
    tenant?.adminEmail,
  ]
    .map((e) => String(e || "").toLowerCase().trim())
    .filter(Boolean);
  if (ownerCandidates.length === 0) return true;
  return ownerCandidates.includes(ctx.email);
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
  const publicBase = (process.env.PUBLIC_BASE_URL || "https://ez-zel.onrender.com").replace(/\/+$/, "");
  return `${publicBase}/app/${brand?.slug || brand?.id || slug}`;
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
  // 0) GET Live Fleet Overview from T2 AI Agent (khedr-bot-agent.onrender.com)
  app.get("/api/brand-hub/agent/fleet", async (_req: Request, res: Response) => {
    try {
      const [brandsHealth, financials] = await Promise.all([
        t2AgentApi.getAllBrandsHealth().catch(() => null),
        t2AgentApi.getFinancialsSummary().catch(() => null),
      ]);
      const unified = deps.getUnifiedGrowthBrands() || [];
      const tenants = deps.getPersistedTenants() || [];
      const liveList = Array.isArray(brandsHealth?.brands)
        ? brandsHealth.brands
        : Array.isArray(brandsHealth)
          ? brandsHealth
          : [];

      res.json({
        ok: true,
        source: liveList.length > 0 ? "t2_ai_agent_live" : "unified_fallback",
        agentPortalUrl: `${getT2AgentBaseUrl()}/embed/crm?embed=1`,
        financials: financials || null,
        brands: liveList.length > 0 ? liveList : unified.map((b: any) => ({
          id: b.id,
          slug: b.slug,
          name: b.name,
          businessType: b.businessType,
          phone: b.phone,
          status: b.botPaused ? "paused" : "active",
          conversationsCount: b.conversationsCount || 0,
          whatsappConnected: Boolean(b.phone),
          metaConnected: Boolean(b.metaConnected),
          appUrl: resolveBrandRealAppUrl(b, tenants.find((t: any) => t.id === b.id || t.slug === b.slug)),
        })),
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed loading agent fleet" });
    }
  });

  app.post("/api/brand-hub/:idOrSlug/toggle-bot", async (req: Request, res: Response) => {
    try {
      const idOrSlug = String(req.params.idOrSlug || "");
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      if (!canMutateBrand(req, brand, tenant)) {
        return res.status(403).json({ ok: false, error: "غير مصرح بتغيير حالة البوت لهذا البراند" });
      }
      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const agentBrandId = brand?.id || tenant?.templateId || slug;
      const result = await t2AgentApi.togglePauseBot(agentBrandId);
      res.json({ ok: true, result });
    } catch (err: any) {
      res.status(502).json({ ok: false, error: err?.message || "تعذر تغيير حالة البوت عبر T2 Agent" });
    }
  });

  // 1) GET Unified Brand Hub Payload (App + Social + REAL T2 AI Agent Status & Conversations + Firestore Config)
  app.get("/api/brand-hub/:idOrSlug", async (req: Request, res: Response) => {
    try {
      const idOrSlug = String(req.params.idOrSlug || "");
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      if (!brand && !tenant) {
        return res.status(404).json({ ok: false, error: "Brand not found" });
      }

      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const agentBrandId = brand?.id || tenant?.templateId || slug;
      const savedHub = await loadHubConfigPersistent(slug);

      const [erpState, liveConversationsRes, liveAgentStatusRes] = await Promise.all([
        loadTenantErpState(slug).catch(() => null),
        t2AgentApi.getConversations(agentBrandId).catch(() => null),
        t2AgentApi.getBrandStatus(agentBrandId).catch(() => null),
      ]);

      const storefront = erpState?.storefrontSettings || {};
      const erpProducts = Array.isArray(erpState?.products) ? erpState.products : [];
      const catalog = erpProducts.length > 0 ? erpProducts : (brand?.productsCatalog || []);
      const appUrl = savedHub.appUrl || resolveBrandRealAppUrl(brand, tenant);

      // Extract real conversations from T2 AI Agent
      const rawConvs = Array.isArray(liveConversationsRes?.conversations)
        ? liveConversationsRes.conversations
        : Array.isArray(liveConversationsRes)
          ? liveConversationsRes
          : [];
      const recentConversations = rawConvs.slice(0, 15).map((c: any, idx: number) => ({
        id: c.id || c.phone || `conv_${idx}`,
        customerName: c.customerName || c.name || c.phone || "عميل",
        phone: c.phone || c.customerPhone || "",
        channel: c.channel || c.platform || "WhatsApp",
        lastMessage: c.lastMessage || c.lastUserMessage || "",
        agentReply: c.lastBotReply || c.agentReply || "",
        isHandover: Boolean(c.isHandover),
        time: c.updatedAt || c.time || "",
      }));

      const agentConnected = Boolean(
        liveAgentStatusRes?.whatsappConnected ||
          liveAgentStatusRes?.connected ||
          brand?.phone ||
          tenant?.whatsappBot
      );

      const payload = {
        id: agentBrandId,
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
        agentPortalUrl: `${getT2AgentBaseUrl()}/embed/crm?brandId=${encodeURIComponent(brand?.slug || slug)}&embed=1`,
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
          whatsapp: agentConnected,
          facebook: Boolean(liveAgentStatusRes?.metaConnected || brand?.metaConnected || brand?.facebookPageId || savedHub.socialConnections?.facebook),
          instagram: Boolean(liveAgentStatusRes?.instagramConnected || brand?.instagramConnected || brand?.instagramAccountId || savedHub.socialConnections?.instagram),
          tiktok: Boolean(liveAgentStatusRes?.tiktokConnected || savedHub.socialConnections?.tiktok),
          youtube: Boolean(liveAgentStatusRes?.youtubeConnected || savedHub.socialConnections?.youtube),
          telegram: Boolean(liveAgentStatusRes?.telegramConnected || savedHub.socialConnections?.telegram),
        },
        liveAgentSource: liveConversationsRes ? "t2_ai_agent_live" : "cached",
        recentConversations,
        updatedAt: savedHub.updatedAt || erpState?.updatedAt || new Date().toISOString(),
      };

      res.json({ ok: true, brand: payload });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to load Brand Hub" });
    }
  });

  // 2) POST Live Health Check (App URL Ping + Cloud ERP + Real T2 AI Agent Status & Social Platforms)
  app.post("/api/brand-hub/:idOrSlug/health-check", async (req: Request, res: Response) => {
    try {
      const idOrSlug = String(req.params.idOrSlug || "");
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      if (!brand && !tenant) {
        return res.status(404).json({ ok: false, error: "Brand not found" });
      }

      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const agentBrandId = brand?.id || tenant?.templateId || slug;
      const savedHub = await loadHubConfigPersistent(slug);
      const appUrl = savedHub.appUrl || resolveBrandRealAppUrl(brand, tenant);

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

      const [erpState, liveAgentStatus] = await Promise.all([
        loadTenantErpState(slug).catch(() => null),
        t2AgentApi.getBrandStatus(agentBrandId).catch(() => null),
      ]);

      const erpOk = Boolean(erpState);
      const erpProductsCount = Array.isArray(erpState?.products) ? erpState.products.length : 0;
      const hasWhatsapp = Boolean(liveAgentStatus?.whatsappConnected || brand?.phone || tenant?.whatsappBot);
      const metaConnected = Boolean(liveAgentStatus?.metaConnected || brand?.metaConnected || brand?.facebookPageId || savedHub.socialConnections?.facebook);
      const igConnected = Boolean(liveAgentStatus?.instagramConnected || brand?.instagramConnected || brand?.instagramAccountId || savedHub.socialConnections?.instagram);
      const tgConnected = Boolean(liveAgentStatus?.telegramConnected || savedHub.socialConnections?.telegram);

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
            liveFromT2Agent: Boolean(liveAgentStatus),
            phone: brand?.phone || tenant?.whatsappBot || "",
            message: liveAgentStatus?.whatsappConnected
              ? `متصل فعلياً في T2 Agent (${brand?.phone || tenant?.whatsappBot || "نشط"})`
              : hasWhatsapp
                ? `مربوط بالرقم ${brand?.phone || tenant?.whatsappBot}`
                : "لم يتم ربط رقم واتساب بعد",
          },
          social: {
            facebook: { ok: metaConnected, label: metaConnected ? "متصل" : "غير مربوط" },
            instagram: { ok: igConnected, label: igConnected ? "متصل" : "غير مربوط" },
            telegram: { ok: tgConnected, label: tgConnected ? "متصل" : "غير مربوط" },
            tiktok: { ok: Boolean(liveAgentStatus?.tiktokConnected || savedHub.socialConnections?.tiktok), label: (liveAgentStatus?.tiktokConnected || savedHub.socialConnections?.tiktok) ? "متصل" : "غير مربوط" },
            youtube: { ok: Boolean(liveAgentStatus?.youtubeConnected || savedHub.socialConnections?.youtube), label: (liveAgentStatus?.youtubeConnected || savedHub.socialConnections?.youtube) ? "متصل" : "غير مربوط" },
          },
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Health check failed" });
    }
  });

  // 3) POST Update Unified Brand Hub (Firestore + Cloud ERP + Push Training Directly to T2 AI Agent)
  app.post("/api/brand-hub/:idOrSlug/update", async (req: Request, res: Response) => {
    try {
      const idOrSlug = String(req.params.idOrSlug || "");
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      if (!canMutateBrand(req, brand, tenant)) {
        return res.status(403).json({ ok: false, error: "غير مصرح بتعديل إعدادات هذا البراند — يلزم تسجيل الدخول كصاحب البراند أو الماستر." });
      }

      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const agentBrandId = brand?.id || tenant?.templateId || slug;

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

      const prev = await loadHubConfigPersistent(slug);
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

      const firestoreSaved = await saveHubConfigPersistent(slug, next);

      // Sync identity updates straight to Tenant Cloud ERP storefrontSettings
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

      // Push training / knowledge base straight to live T2 AI Agent so WhatsApp/Social replies use it immediately
      let agentSynced = false;
      if (agentConfig || knowledgeBase !== undefined) {
        try {
          await t2AgentApi.executeExternalAction(agentBrandId, "training", "update_brand_prompt", {
            systemPrompt: knowledgeBase ?? next.knowledgeBase ?? "",
            toneOfVoice: next.agentConfig?.tone || "",
            shippingPolicy: next.agentConfig?.shippingPolicy || "",
            forbiddenTopics: next.agentConfig?.forbiddenTopics || "",
          });
          agentSynced = true;
        } catch {}
      }

      res.json({ ok: true, firestoreSaved, erpSynced, agentSynced, updatedAt: next.updatedAt, config: next });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to update Brand Hub" });
    }
  });

  // 4) POST Send Manual Reply to a Real Customer Conversation via T2 AI Agent
  app.post("/api/brand-hub/:idOrSlug/reply", async (req: Request, res: Response) => {
    try {
      const idOrSlug = String(req.params.idOrSlug || "");
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      if (!canMutateBrand(req, brand, tenant)) {
        return res.status(403).json({ ok: false, error: "غير مصرح بإرسال ردود باسم هذا البراند." });
      }
      const { phone, message } = req.body || {};
      if (!phone || !message) {
        return res.status(400).json({ ok: false, error: "رقم العميل ونص الرسالة مطلوبان" });
      }
      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const agentBrandId = brand?.id || tenant?.templateId || slug;
      const result = await t2AgentApi.sendManualReply(agentBrandId, String(phone), String(message));
      res.json({ ok: true, result });
    } catch (err: any) {
      res.status(502).json({ ok: false, error: err?.message || "تعذر إرسال الرد عبر T2 AI Agent" });
    }
  });

  // 5) POST Save Playground Correction Directly to T2 AI Agent
  app.post("/api/brand-hub/:idOrSlug/playground-correct", async (req: Request, res: Response) => {
    try {
      const idOrSlug = String(req.params.idOrSlug || "");
      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      if (!canMutateBrand(req, brand, tenant)) {
        return res.status(403).json({ ok: false, error: "غير مصرح بتدريب هذا البراند." });
      }
      const { question, botReply, correctedAnswer } = req.body || {};
      if (!question || !correctedAnswer) {
        return res.status(400).json({ ok: false, error: "السؤال والإجابة المصححة مطلوبان" });
      }
      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const agentBrandId = brand?.id || tenant?.templateId || slug;
      const result = await t2AgentApi.correctPlaygroundReply(
        agentBrandId,
        String(question),
        String(botReply || ""),
        String(correctedAnswer)
      );
      res.json({ ok: true, result });
    } catch (err: any) {
      res.status(502).json({ ok: false, error: err?.message || "تعذر حفظ التصحيح في T2 AI Agent" });
    }
  });

  // 6) POST Test Sales Agent Response with Brand's Training + Knowledge Base + Live Catalog
  app.post("/api/brand-hub/:idOrSlug/test-agent", async (req: Request, res: Response) => {
    try {
      const idOrSlug = String(req.params.idOrSlug || "");
      const { customerMessage } = req.body || {};
      if (!customerMessage || !String(customerMessage).trim()) {
        return res.status(400).json({ ok: false, error: "يرجى كتابة رسالة العميل للاختبار" });
      }

      const { brand, tenant } = findBrandAndTenant(idOrSlug, deps);
      const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || idOrSlug);
      const savedHub = await loadHubConfigPersistent(slug);
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

  // 7) ADK Venture Architect (0 -> 1 Business Invention & Feasibility Blueprint)
  app.post("/api/adk/invent-business", async (req: Request, res: Response) => {
    try {
      const { niche, budgetEgp = 50000, city = "القاهرة والجيزة" } = req.body || {};
      if (!niche || !String(niche).trim()) {
        return res.status(400).json({ ok: false, error: "يرجى كتابة مجال أو فكرة المشروع" });
      }

      const ai = deps.getServerAI();
      let blueprint: any = null;
      let aiPowered = false;

      if (ai) {
        for (const modelName of ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.8-flash"]) {
          try {
            const prompt = `أنت مهندس مشاريع وخبير اقتصاديات أسواق (ADK Venture Architect) في منظومة T2OS.
المطلوب اختراع مشروع تجاري واقعي ومحكم بناءً على:
- المجال/الفكرة: "${niche}"
- رأس المال التقريبي: ${budgetEgp} ج.م
- السوق المستهدف: ${city}

أرجع JSON صالحاً فقط (بدون Markdown) بهذه البنية الدقيقة:
{
  "recommendedBrandName": "اسم عربي/عالمي قوي وجذاب للمشروع",
  "alternativeNames": ["اسم بديل 1", "اسم بديل 2"],
  "slogan": "سلوجان قصير بياع جداً",
  "businessModel": "products_erp أو services_booking",
  "marketStudy": {
    "opportunity": "تحليل مختصر للفجوة السوقية والطلب في ${city}",
    "targetAudience": "وصف دقيق للعميل المستهدف",
    "usp": "الميزة التنافسية التي تجعل العميل يشتري منك"
  },
  "unitEconomics": {
    "avgOrderValueEgp": 650,
    "estimatedMarginPct": 38,
    "breakEvenOrders": 28
  },
  "recommendedSaasPlan": "باقة 2,500 ج أو باقة 5,000 ج أو باقة 10,000 ج",
  "starterCatalog": [
    { "name": "منتج/خدمة 1", "numericPrice": 450, "description": "وصف مختصر مقنع" },
    { "name": "منتج/خدمة 2", "numericPrice": 850, "description": "وصف مختصر مقنع" },
    { "name": "منتج/خدمة 3", "numericPrice": 1200, "description": "وصف مختصر مقنع" },
    { "name": "باقة VIP 4", "numericPrice": 1950, "description": "وصف مختصر مقنع" }
  ],
  "launchRoadmap30Days": [
    { "week": "الأسبوع 1", "focus": "تأسيس الهوية والتطبيق وربط واتساب" },
    { "week": "الأسبوع 2", "focus": "إطلاق محتوى تيتو ستوديو وبداية الحملات" },
    { "week": "الأسبوع 3", "focus": "تحسين التحويل بالبكسل وإغلاق العملاء عبر الأجنت" },
    { "week": "الأسبوع 4", "focus": "مراجعة العائد وتوسيع المنتجات الأعلى ربحاً" }
  ]
}`;
            const aiRes = await Promise.race([
              ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: { responseMimeType: "application/json", temperature: 0.45 },
              }),
              new Promise<never>((_, rej) => setTimeout(() => rej(new Error("ADK_TIMEOUT")), 8000)),
            ]);
            const raw = String(aiRes?.text || "").replace(/```json|```/gi, "").trim();
            const parsed = JSON.parse(raw);
            if (parsed?.recommendedBrandName) {
              blueprint = parsed;
              aiPowered = true;
              break;
            }
          } catch {}
        }
      }

      if (!blueprint) {
        const cleanNiche = String(niche).trim();
        const isProduct = /متجر|بيع|منتج|قطع|ملابس|قهوة|عطور|أكل|سوبر/i.test(cleanNiche);
        const budget = Number(budgetEgp) || 50000;
        blueprint = {
          recommendedBrandName: `${cleanNiche} برو`,
          alternativeNames: [`نخبة ${cleanNiche}`, `${cleanNiche} هب`],
          slogan: `جودة مضمونة وسرعة تنفيذ في ${city}`,
          businessModel: isProduct ? "products_erp" : "services_booking",
          marketStudy: {
            opportunity: `طلب متنامٍ في ${city} على ${cleanNiche} مع سرعة رد عبر واتساب وطلب إلكتروني مباشر بدون تعقيد.`,
            targetAudience: `العملاء الباحثون عن جودة موثوقة وسرعة توصيل/حجز داخل ${city}.`,
            usp: `متجر وتطبيق فوري + متابعة واتساب 24/7 + ضمان جودة واضح.`,
          },
          unitEconomics: {
            avgOrderValueEgp: isProduct ? 750 : 950,
            estimatedMarginPct: isProduct ? 35 : 48,
            breakEvenOrders: Math.max(15, Math.round(budget / 2500)),
          },
          recommendedSaasPlan: budget >= 50000 ? "باقة النمو 5,000 ج (تطبيق ويب كامل + 50% إعلانات)" : "باقة الانطلاق 2,500 ج (لاندنج بيدج + 50% إعلانات)",
          starterCatalog: [
            { name: `باقة البداية — ${cleanNiche}`, numericPrice: 450, description: "أفضل خيار لتجربة الخدمة أو المنتج لأول مرة" },
            { name: `الباقة الأكثر طلباً — ${cleanNiche}`, numericPrice: 890, description: "توازن ممتاز بين السعر والقيمة المضافة" },
            { name: `باقة التوفير العائلية`, numericPrice: 1450, description: "خصم 15% مع أولوية تنفيذ وتوصيل" },
            { name: `إصدار VIP الشامل`, numericPrice: 2200, description: "تجربة متكاملة مع متابعة مستمرة وضمان ممتد" },
          ],
          launchRoadmap30Days: [
            { week: "الأسبوع 1", focus: "تأسيس الهوية والتطبيق وربط كود واتساب Baileys" },
            { week: "الأسبوع 2", focus: "نشر محتوى تيتو ستوديو وإطلاق أول حملة بـ 50% من الباقة" },
            { week: "الأسبوع 3", focus: "تتبع البيكسل وتحسين ردود وكيل المبيعات على الأسئلة المتكررة" },
            { week: "الأسبوع 4", focus: "مراجعة صافي الربح وتوسيع الكتالوج الأكثر مبيعاً" },
          ],
        };
      }

      res.json({ ok: true, aiPowered, blueprint });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "ADK venture invention failed" });
    }
  });
}
