import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { loadTenantErpState, saveTenantErpState, normalizeSlugKey } from "../services/tenantErpStoreService";
import { t2AgentApi, getT2AgentBaseUrl } from "../services/t2AgentApiClient";
import { getTitoStudioAuthToken } from "../services/titoStudioFirestoreBridge";
import { verifyAdminRequest } from "../services/serverAdminAuth";
import { ACTIVE_GEMINI_TEXT_MODELS } from "../services/geminiKeyPool";
import { calculateCodProfitability } from "../services/dropshippingEngineService";

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
  const adminKeyHeader = String(req.headers["x-admin-key"] || req.headers["x-admin-secret"] || "").trim();
  const validSecrets = [
    process.env.ADMIN_API_SECRET,
    process.env.ADMIN_SECRET_KEY,
    process.env.T2_AGENT_ADMIN_KEY,
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  if (adminKeyHeader && validSecrets.includes(adminKeyHeader)) {
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
    .filter((u) => /^https?:\/\//i.test(u) && !u.includes("ez-zel.onrender.com/store") && !u.includes("t2os.app/store"));

  if (candidates.length > 0) return candidates[0];

  const slug = normalizeSlugKey(brand?.slug || tenant?.slug || brand?.id || "");
  if (slug === "auto-house" || slug.includes("auto_house")) {
    return "https://t2-tenant-auto-house.vercel.app";
  }
  if (slug === "clean_master" || slug === "clean-master") {
    return "https://cleanmaster-eg.com";
  }
  if (slug === "al_genedy" || slug === "al-genedy" || slug.includes("genedy")) {
    return String(process.env.AL_GENEDY_STANDALONE_URL || "https://al-genedy.vercel.app").replace(/\/+$/, "");
  }
  const publicBase = (process.env.PUBLIC_BASE_URL || "https://t2os.app").replace(/\/+$/, "");
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
  // 0) GET Live Fleet Overview from T2 AI Agent (agent.t2os.app)
  app.get("/api/brand-hub/agent/fleet", async (req: Request, res: Response) => {
    try {
      const adminAuth = await verifyAdminRequest(req);
      const [brandsHealth, financials] = await Promise.all([
        t2AgentApi.getAllBrandsHealth().catch(() => null),
        adminAuth.ok ? t2AgentApi.getFinancialsSummary().catch(() => null) : Promise.resolve(null),
      ]);
      const unified = deps.getUnifiedGrowthBrands() || [];
      const tenants = deps.getPersistedTenants() || [];
      const liveList = Array.isArray(brandsHealth?.brands)
        ? brandsHealth.brands
        : Array.isArray(brandsHealth)
          ? brandsHealth
          : [];

      // Merge unified active brands with T2 Agent live list so none of the 9 active brands are missing
      const mergedMap = new Map<string, any>();
      for (const b of unified) {
        const key = normalizeSlugKey(b.slug || b.id || "");
        if (!key) continue;
        mergedMap.set(key, {
          id: b.id,
          slug: b.slug || b.id,
          name: b.name,
          businessType: b.businessType,
          phone: b.phone,
          lifecycleStage: b.lifecycleStage,
          planAmount: b.planAmount || (b.lifecycleStage === "active_client" ? 5000 : 0),
          status: b.botPaused ? "paused" : "active",
          conversationsCount: b.conversationsCount || 0,
          whatsappConnected: Boolean(b.phone),
          metaConnected: Boolean(b.metaConnected),
          appUrl: resolveBrandRealAppUrl(b, tenants.find((t: any) => t.id === b.id || t.slug === b.slug)),
        });
      }
      for (const lb of liveList) {
        const key = normalizeSlugKey(lb.slug || lb.id || "");
        if (!key) continue;
        const existing = mergedMap.get(key) || {};
        mergedMap.set(key, {
          ...existing,
          ...lb,
          name: existing.name || lb.name,
          businessType: existing.businessType || lb.businessType,
          lifecycleStage: existing.lifecycleStage || lb.lifecycleStage || "active_client",
          planAmount: existing.planAmount || lb.planAmount || 5000,
          appUrl: existing.appUrl || lb.appUrl,
        });
      }
      const mergedList = Array.from(mergedMap.values());

      if (!adminAuth.ok) {
        const activeCount = mergedList.filter((b: any) => b?.status !== "paused" && !b?.botPaused && !b?.isPaused).length;
        return res.json({
          ok: true,
          restricted: true,
          source: liveList.length > 0 ? "t2_ai_agent_live_merged" : "unified_fallback",
          brandsCount: mergedList.length,
          activeBotsCount: activeCount,
          brands: [],
        });
      }

      res.json({
        ok: true,
        source: liveList.length > 0 ? "t2_ai_agent_live_merged" : "unified_fallback",
        agentPortalUrl: `${getT2AgentBaseUrl()}/embed/crm?embed=1`,
        financials: financials || null,
        brands: mergedList,
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
        const composedSystemPrompt = [
          knowledgeBase ?? next.knowledgeBase ?? "",
          next.agentConfig?.tone ? `[نبرة الصوت]: ${next.agentConfig.tone}` : "",
          next.agentConfig?.welcomeMessage ? `[رسالة الترحيب]: ${next.agentConfig.welcomeMessage}` : "",
          next.agentConfig?.shippingPolicy ? `[سياسة الشحن]: ${next.agentConfig.shippingPolicy}` : "",
          next.agentConfig?.forbiddenTopics ? `[محظورات الرد]: ${next.agentConfig.forbiddenTopics}` : "",
          next.agentConfig?.faq ? `[الأسئلة الشائعة]: ${next.agentConfig.faq}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        try {
          await t2AgentApi.executeExternalAction(agentBrandId, "brands", "update", {
            name: next.name || brand?.name || agentBrandId,
            systemPrompt: composedSystemPrompt,
            knowledgeText: composedSystemPrompt,
            directKnowledge: knowledgeBase ?? next.knowledgeBase ?? "",
            bookingReceiverPhone: next.phone || brand?.phone || "",
          });
          agentSynced = true;
        } catch {
          try {
            await t2AgentApi.executeExternalAction(agentBrandId, "brands", "create", {
              brandId: agentBrandId,
              name: next.name || brand?.name || agentBrandId,
              businessType: brand?.businessType || tenant?.templateName || "نشاط تجاري",
              systemPrompt: composedSystemPrompt,
              knowledgeText: composedSystemPrompt,
              directKnowledge: knowledgeBase ?? next.knowledgeBase ?? "",
              bookingReceiverPhone: next.phone || brand?.phone || "",
            });
            agentSynced = true;
          } catch {}
        }
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
            model: "gemini-3.5-flash-lite",
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

  // 7) ADK Venture Architect (0 -> 1 Business Invention & Feasibility Blueprint + Dropshipping Engine)
  app.post("/api/adk/invent-business", async (req: Request, res: Response) => {
    try {
      const {
        niche,
        budgetEgp = 50000,
        city = "القاهرة والجيزة",
        fulfillmentMode = "dropshipping",
        supplierWhatsapp = "01013372674",
      } = req.body || {};
      if (!niche || !String(niche).trim()) {
        return res.status(400).json({ ok: false, error: "يرجى كتابة مجال أو فكرة المشروع" });
      }

      const isDropshipping = fulfillmentMode === "dropshipping";
      const ai = deps.getServerAI();
      let blueprint: any = null;
      let aiPowered = false;

      if (ai) {
        for (const modelName of ACTIVE_GEMINI_TEXT_MODELS) {
          try {
            const prompt = `أنت مهندس مشاريع وخبير اقتصاديات أسواق ودروبشيبنج (ADK Venture Architect) في منظومة T2OS.
المطلوب اختراع مشروع تجاري واقعي ومحكم بناءً على:
- المجال/الفكرة: "${niche}"
- رأس المال التقريبي: ${budgetEgp} ج.م
- السوق المستهدف: ${city}
- نموذج التوريد والتشغيل: ${isDropshipping ? "دروبشيبنج بدون مخزون مربوط بموردين جاهزين (Dropshipping)" : "منتجات/خدمات ومخزون خاص (Own Inventory)"}

أرجع JSON صالحاً فقط (بدون Markdown) بهذه البنية الدقيقة:
{
  "recommendedBrandName": "اسم عربي/عالمي قوي وجذاب للمشروع",
  "alternativeNames": ["اسم بديل 1", "اسم بديل 2"],
  "slogan": "سلوجان قصير بياع جداً",
  "businessModel": "${isDropshipping ? "products_erp" : "products_erp أو services_booking"}",
  "fulfillmentMode": "${isDropshipping ? "dropshipping" : "own_inventory"}",
  "marketStudy": {
    "opportunity": "تحليل مختصر للفجوة السوقية والطلب في ${city}",
    "targetAudience": "وصف دقيق للعميل المستهدف",
    "usp": "الميزة التنافسية التي تجعل العميل يشتري منك"
  },
  "unitEconomics": {
    "avgOrderValueEgp": 750,
    "estimatedMarginPct": 38,
    "breakEvenOrders": 22
  },
  "dropshippingConfig": {
    "enabled": ${isDropshipping},
    "supplierWhatsapp": "${supplierWhatsapp}",
    "autoForwardOrders": true,
    "hideRetailPriceFromSupplier": true,
    "supplierPartners": [
      { "name": "منصة تاجر (Taager Egypt/KSA)", "type": "دروبشيبنج محلي وشحن وتحصيل فوري", "avgDeliveryDays": "2-4 أيام" },
      { "name": "مورد جملة مباشر + شحن بوسطة (Bosta)", "type": "سحب من تاجر الجملة عند تأكيد الطلب", "avgDeliveryDays": "1-3 أيام" },
      { "name": "CJ Dropshipping / قنوات استيراد سريعة", "type": "منتجات تريند عالية الهامش", "avgDeliveryDays": "4-7 أيام" }
    ]
  },
  "recommendedSaasPlan": "باقة 5,000 ج (تطبيق + أجنت واتساب + 50% إعلانات)",
  "starterCatalog": [
    { "name": "منتج 1", "supplierCostEgp": 240, "numericPrice": 490, "netMarginEgp": 185, "supplierSource": "منصة تاجر / جملة محلي", "description": "وصف مختصر مقنع" },
    { "name": "منتج 2", "supplierCostEgp": 420, "numericPrice": 850, "netMarginEgp": 350, "supplierSource": "منصة تاجر / جملة محلي", "description": "وصف مختصر مقنع" },
    { "name": "منتج 3", "supplierCostEgp": 600, "numericPrice": 1200, "netMarginEgp": 500, "supplierSource": "مورد جملة معتمد", "description": "وصف مختصر مقنع" },
    { "name": "باقة التوفير VIP 4", "supplierCostEgp": 950, "numericPrice": 1950, "netMarginEgp": 850, "supplierSource": "تجميع موردين + شحن بوسطة", "description": "وصف مختصر مقنع" }
  ],
  "launchRoadmap30Days": [
    { "week": "الأسبوع 1", "focus": "تأسيس المتجر وربط كتالوج الدروبشيبنج وواتساب المورد" },
    { "week": "الأسبوع 2", "focus": "إطلاق محتوى تيتو ستوديو وإعلانات المنتج الرابح (Winning Product)" },
    { "week": "الأسبوع 3", "focus": "تأكيد الطلبات آلياً عبر الأجنت وتحويل أمر الشحن للمورد بدون إظهار هامش ربحك" },
    { "week": "الأسبوع 4", "focus": "تحصيل الأرباح الصافية وتوسيع المنتجات الأعلى هامشاً" }
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
        const isProduct = isDropshipping || /متجر|بيع|منتج|قطع|ملابس|قهوة|عطور|أكل|سوبر|دروب/i.test(cleanNiche);
        const budget = Number(budgetEgp) || 50000;
        blueprint = {
          recommendedBrandName: `${cleanNiche} برو`,
          alternativeNames: [`نخبة ${cleanNiche}`, `${cleanNiche} هب`],
          slogan: isDropshipping
            ? `أقوى منتجات ${cleanNiche} لحد باب بيتك في ${city} بدون وسيط`
            : `جودة مضمونة وسرعة تنفيذ في ${city}`,
          businessModel: isProduct ? "products_erp" : "services_booking",
          fulfillmentMode: isDropshipping ? "dropshipping" : "own_inventory",
          marketStudy: {
            opportunity: isDropshipping
              ? `فرصة دروبشيبنج ذهبية في ${city} بمجال ${cleanNiche}: بيع مباشر للعميل بدون تجميد رأس مال في مخزون، مع تحويل الطلب آلياً للمورد فور تأكيد الأجنت.`
              : `طلب متنامٍ في ${city} على ${cleanNiche} مع سرعة رد عبر واتساب وطلب إلكتروني مباشر بدون تعقيد.`,
            targetAudience: `العملاء الباحثون عن جودة موثوقة وسرعة توصيل/حجز داخل ${city}.`,
            usp: isDropshipping
              ? `صفر تكلفة مخزون + تأكيد طلبات بالذكاء الاصطناعي + تحويل أمر الشحن للمورد آلياً مع حفظ صافي ربحك.`
              : `متجر وتطبيق فوري + متابعة واتساب 24/7 + ضمان جودة واضح.`,
          },
          unitEconomics: {
            avgOrderValueEgp: isProduct ? 790 : 950,
            estimatedMarginPct: isDropshipping ? 42 : isProduct ? 35 : 48,
            breakEvenOrders: Math.max(12, Math.round(budget / 3000)),
          },
          dropshippingConfig: {
            enabled: isDropshipping,
            supplierWhatsapp,
            autoForwardOrders: true,
            hideRetailPriceFromSupplier: true,
            supplierPartners: [
              { name: "منصة تاجر (Taager Egypt/KSA)", type: "دروبشيبنج محلي وشحن وتحصيل فوري", avgDeliveryDays: "2-4 أيام" },
              { name: "مورد جملة مباشر + شحن بوسطة (Bosta)", type: "سحب من تاجر الجملة عند تأكيد الطلب", avgDeliveryDays: "1-3 أيام" },
              { name: "CJ Dropshipping / قنوات استيراد سريعة", type: "منتجات تريند عالية الهامش", avgDeliveryDays: "4-7 أيام" },
            ],
          },
          recommendedSaasPlan: budget >= 40000 ? "باقة النمو 5,000 ج (تطبيق ويب كامل + 50% إعلانات)" : "باقة الانطلاق 2,500 ج (لاندنج بيدج + 50% إعلانات)",
          starterCatalog: [
            {
              name: `المنتج الرابح الأول — ${cleanNiche}`,
              supplierCostEgp: 220,
              numericPrice: 490,
              netMarginEgp: 205,
              supplierSource: "منصة تاجر / مورد جملة",
              description: "أعلى معدل طلب وتحويل سريع مع الدفع عند الاستلام",
            },
            {
              name: `العرض الأكثر مبيعاً — ${cleanNiche}`,
              supplierCostEgp: 410,
              numericPrice: 890,
              netMarginEgp: 400,
              supplierSource: "منصة تاجر / شحن بوسطة",
              description: "توازن ممتاز بين تكلفة المورد وصافي الربح للقطعة",
            },
            {
              name: `باقة التوفير (قطعتين + شحن مجاني)`,
              supplierCostEgp: 680,
              numericPrice: 1450,
              netMarginEgp: 670,
              supplierSource: "مورد جملة مباشر",
              description: "يرفع متوسط سلة الشراء (AOV) ويضاعف صافي ربحك في الشحنة",
            },
            {
              name: `إصدار البريميوم VIP الشامل`,
              supplierCostEgp: 980,
              numericPrice: 2200,
              netMarginEgp: 1080,
              supplierSource: "مورد معتمد + تغليف باسم البراند",
              description: "أعلى هامش ربح صافي في الطلب الواحد مع ضمان استبدال",
            },
          ],
          launchRoadmap30Days: [
            { week: "الأسبوع 1", focus: "تأسيس المتجر وربط كتالوج الدروبشيبنج ورقم واتساب المورد للتوجيه الآلي" },
            { week: "الأسبوع 2", focus: "نشر محتوى تيتو ستوديو وإطلاق إعلان المنتج الرابح بـ 50% من الباقة" },
            { week: "الأسبوع 3", focus: "تأكيد الطلبات عبر الأجنت وإرسال بوليصة الشحن للمورد بدون كشف سعر البيع" },
            { week: "الأسبوع 4", focus: "مراجعة صافي الأرباح المحصلة وتوسيع المنتجات الأعلى هامشاً" },
          ],
        };
      }

      // Normalize starterCatalog with real COD unit economics (shipping, CPA, 20% returns)
      blueprint.fulfillmentMode = isDropshipping ? "dropshipping" : "own_inventory";
      blueprint.starterCatalog = (blueprint.starterCatalog || []).map((item: any) => {
        const retail = Number(item.numericPrice) || 500;
        const cost = Number(item.supplierCostEgp) || Math.round(retail * 0.48);
        const shipping = 65;
        const cpa = 95;
        const expectedReturnRatePct = 20;
        const codEconomics = calculateCodProfitability({
          sellingPriceEgp: retail,
          supplierCostEgp: cost,
          shippingCostEgp: shipping,
          cpaAdCostEgp: cpa,
          expectedReturnRatePct,
        });
        return {
          ...item,
          numericPrice: retail,
          supplierCostEgp: cost,
          netMarginEgp: codEconomics.realNetProfitPerDeliveredEgp,
          codEconomics,
          supplierSource: item.supplierSource || (isDropshipping ? "منصة تاجر / مورد جملة" : "مخزون البراند"),
        };
      });

      res.json({ ok: true, aiPowered, blueprint });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "ADK venture invention failed" });
    }
  });

  // 8) Al-Genedy 3D Facade & Neon AI Design Architect Endpoint
  app.post("/api/ai/design-architect", async (req: Request, res: Response) => {
    try {
      const { prompt = "", audioBase64, audioMimeType = "audio/webm", currentConfig = {} } = req.body || {};
      const cleanPrompt = String(prompt || "").trim();

      const buildFallbackDesign = (rawText: string) => {
        const text = rawText || String(currentConfig?.title || "الجنيدي للإعلان");
        const isNeon = /نيون|neon|سكريبت|توقيع|فوميكس|أكليرك|طباعة/i.test(text);
        const category = isNeon ? "neon" : "signboard";
        const nameMatch = text.match(/(?:باسم|اسمه|لـ|شركة|مطعم|كافيه|صيدلية|عيادة)\s+([^\d،,.]+?)(?:\s+عرض|\s+مقاس|\s+بحروف|\s+بخط|\s+خلفية|$)/i);
        const title = (nameMatch ? nameMatch[1].trim() : currentConfig?.title || "الجنيدي للإعلان").slice(0, 32);

        let widthCm = category === "signboard" ? 450 : 120;
        let heightCm = category === "signboard" ? 130 : 65;
        const dimMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:متر|م|سم|cm)?\s*(?:في|×|x|\*)\s*(\d+(?:\.\d+)?)/i);
        if (dimMatch) {
          const rw = Number(dimMatch[1]);
          const rh = Number(dimMatch[2]);
          widthCm = rw <= 15 ? Math.round(rw * 100) : Math.round(rw);
          heightCm = rh <= 6 ? Math.round(rh * 100) : Math.round(rh);
        }

        const backingColorHex = /فضي|رصاصي/i.test(text)
          ? "#94a3b8"
          : /أزرق|ازرق|كحلي/i.test(text)
          ? "#1e3a8a"
          : /أخضر|اخضر|زمردي/i.test(text)
          ? "#064e3b"
          : /نبيتي|برغندي|أحمر/i.test(text)
          ? "#7f1d1d"
          : /أبيض|ابيض/i.test(text)
          ? "#f5f5f4"
          : "#0f172a";

        const ledColorHex = /زمردي|أخضر|اخضر/i.test(text)
          ? "#34d399"
          : /وردي|ماجنتا|بينك|فوشيا/i.test(text)
          ? "#f472b6"
          : /أزرق|سماوي|لبني|سيان/i.test(text)
          ? "#38bdf8"
          : /أحمر/i.test(text)
          ? "#ef4444"
          : "#fbbf24";

        const neonBackingId = /خشب/i.test(text)
          ? "wood_walnut_12mm"
          : /فوميكس أسود/i.test(text)
          ? "forex_black_10mm"
          : /فوميكس/i.test(text)
          ? "forex_white_10mm"
          : /أكليرك أسود|اكريليك اسود/i.test(text)
          ? "black_acrylic_5mm"
          : /أكليرك أبيض|اكريليك ابيض/i.test(text)
          ? "white_acrylic_5mm"
          : "clear_acrylic_5mm";

        const environmentLighting = /نهار/i.test(text) ? "daylight" : /غروب|عصر/i.test(text) ? "dusk" : "night";
        const signLetterId = /أستانلس|استانلس/i.test(text) ? "stainless_halo" : "acrylic_3d";

        return {
          transcript: cleanPrompt || undefined,
          category,
          title,
          subtitle: category === "signboard" ? "واجهات كلادينج - حروف بارزة - شاشات - نيون" : "",
          widthCm,
          heightCm,
          signBackingId: "alucobond",
          signLetterId,
          depthCm: 8,
          backingColorHex,
          letterColorHex: /ذهبي/i.test(text) ? "#eab308" : "#ffffff",
          ledColorHex,
          neonBackingId,
          neonIpRating: "IP67",
          environmentLighting,
          includeInstallation: true,
          architectSummary: `تم تصميم ${category === "signboard" ? "واجهة كلادينج متكاملة 3D بدون إطار وبروز واقعي وعمودين يمين وشمال" : "لافتة نيون فليكس مخصصة"} بمقاس ${widthCm}×${heightCm} سم وإضاءة واقعية.`,
        };
      };

      const ai = deps.getServerAI();
      let design: any = null;
      let aiPowered = false;

      if (ai && (cleanPrompt || audioBase64)) {
        const architectPrompt = `أنت مهندس واجهات كلادينج ولافتات نيون وحروف بارزة 3D في شركة الجنيدي للإعلان.
حوّل طلب العميل التالي إلى JSON صالح فقط (بدون Markdown) يصف المواصفات التقنية للتصميم بدقة:
طلب العميل: "${cleanPrompt || "تصميم واجهة أو نيون من الرسالة الصوتية"}"
الإعداد الحالي: ${JSON.stringify({
          category: currentConfig?.category || "signboard",
          title: currentConfig?.title || "الجنيدي للإعلان",
          widthCm: currentConfig?.widthCm || 450,
          heightCm: currentConfig?.heightCm || 130,
        })}

الحقول المطلوبة في JSON:
{
  "transcript": "نص واضح للطلب بالعربية",
  "category": "signboard أو neon",
  "title": "الاسم التجاري على اللافتة (حد أقصى 32 حرف)",
  "subtitle": "وصف مختصر أسفل الاسم أو فارغ للنيون",
  "widthCm": 450,
  "heightCm": 130,
  "signBackingId": "alucobond",
  "signLetterId": "stainless_halo أو acrylic_3d",
  "depthCm": 8,
  "backingColorHex": "#0f172a",
  "letterColorHex": "#eab308",
  "ledColorHex": "#fbbf24",
  "neonBackingId": "clear_acrylic_5mm أو white_acrylic_5mm أو black_acrylic_5mm أو forex_white_10mm أو forex_black_10mm أو wood_walnut_12mm",
  "neonIpRating": "IP67",
  "environmentLighting": "daylight أو dusk أو night",
  "includeInstallation": true,
  "architectSummary": "ملخص هندسي عربي للخامات والأبعاد والإضاءة"
}`;

        for (const modelName of ACTIVE_GEMINI_TEXT_MODELS) {
          try {
            const parts: any[] = [{ text: architectPrompt }];
            if (audioBase64) {
              parts.push({
                inlineData: {
                  mimeType: String(audioMimeType || "audio/webm"),
                  data: String(audioBase64).replace(/^data:[^;]+;base64,/, ""),
                },
              });
            }
            const aiRes = await Promise.race([
              ai.models.generateContent({
                model: modelName,
                contents: parts,
                config: { responseMimeType: "application/json", temperature: 0.35 },
              }),
              new Promise<never>((_, rej) => setTimeout(() => rej(new Error("AI_DESIGN_TIMEOUT")), 6500)),
            ]);
            const raw = String(aiRes?.text || "").replace(/```json|```/gi, "").trim();
            const parsed = JSON.parse(raw);
            if (parsed && parsed.title) {
              design = parsed;
              aiPowered = true;
              break;
            }
          } catch {}
        }
      }

      if (!design) {
        design = buildFallbackDesign(cleanPrompt);
      }

      return res.json({ ok: true, aiPowered, design });
    } catch (err: any) {
      return res.status(200).json({
        ok: true,
        aiPowered: false,
        design: {
          category: "signboard",
          title: "الجنيدي للإعلان",
          subtitle: "واجهات كلادينج - حروف بارزة - شاشات - نيون",
          widthCm: 450,
          heightCm: 130,
          backingColorHex: "#0f172a",
          letterColorHex: "#eab308",
          ledColorHex: "#fbbf24",
          signLetterId: "stainless_halo",
          environmentLighting: "night",
          includeInstallation: true,
          architectSummary: "تم تجهيز واجهة كلادينج 3D احترافية بالمقاسات القياسية وإضاءة واقعية.",
        },
        note: err?.message || "fallback",
      });
    }
  });
}
