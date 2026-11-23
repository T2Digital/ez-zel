import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { generateContentWithRouter } from "../services/aiModelRouter";
import { verifyAdminRequest } from "../services/serverAdminAuth";
import { getLiveTelemetrySummary, recordLiveEvent, type LiveEventType } from "../services/liveTelemetryService";
import { getTitoStudioBaseUrl } from "../services/titoStudioApiClient";
import { t2AgentApi } from "../services/t2AgentApiClient";
import { getUnifiedGrowthBrands, persistBrandUpdateAcrossEcosystem } from "../services/obsidianVaultService";

function safeKeyEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

async function authorizeStudioOrAdmin(req: Request): Promise<boolean> {
  const adminCheck = await verifyAdminRequest(req).catch(() => ({ ok: false }));
  if (adminCheck.ok) return true;

  const provided = String(req.headers["x-api-key"] || req.headers["x-t2-api-key"] || "").trim();
  if (!provided) return false;
  const candidates = [
    process.env.T2_REMOTE_API_KEY,
    process.env.TITO_STUDIO_API_KEY,
    process.env.ADMIN_API_SECRET,
    process.env.ADMIN_SECRET_KEY,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  return candidates.some((expected) => safeKeyEqual(provided, expected));
}

export interface MarketResearchStrategyOutput {
  marketResearch: string;
  marketingStrategy: {
    targetAudience: string;
    positioning: string;
    coreOffer: string;
    conversionFunnel: string;
  };
  painPoints: string[];
  strategicPillars: string[];
  contentPlan: Array<{
    title: string;
    type: "image" | "reel" | "video" | "carousel" | "story";
    caption: string;
    visualPrompt: string;
    pillarLabel: string;
    painPoint: string;
    scheduledPlatforms: string[];
  }>;
  source: "gemini_ai" | "domain_fallback";
}

export async function conductAIMarketResearchAndStrategy(params: {
  brandName: string;
  industry: string;
  city?: string;
  productsSample?: string[];
  dialect?: string;
}): Promise<MarketResearchStrategyOutput> {
  const { brandName, industry, city = "مصر", productsSample = [], dialect = "اللهجة المصرية الاحترافية" } = params;
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();

  if (apiKey && !apiKey.includes("MY_GEMINI")) {
    try {
      const productsText = productsSample.length ? productsSample.slice(0, 8).join("، ") : "خدمات ومنتجات البراند الرئيسية";
      const prompt = `أنت خبير أبحاث سوق واستراتيجيات نمو رقمي في السوق المصري والعربي.
المطلوب إجراء بحث سوق عملي وبناء استراتيجية تسويق وخطة محتوى من 8 قطع (تشمل صور + ريلز فيديو + كاروسيل) للبراند التالي:
- اسم البراند: ${brandName}
- المجال: ${industry}
- الموقع/السوق: ${city}
- أبرز المنتجات/الخدمات: ${productsText}
- اللهجة: ${dialect}

أخرج JSON فقط بدون أي نص إضافي بالبنية التالية بالضبط:
{
  "marketResearch": "ملخص بحث السوق والمنافسين والفجوات المتاحة للتميز في مجال ${industry} (4-6 جمل عملية)",
  "marketingStrategy": {
    "targetAudience": "وصف دقيق للعميل المثالي ودوافعه الشرائية",
    "positioning": "التموضع التنافسي الفريد للبراند",
    "coreOffer": "العرض الرئيسي الجاذب لأول تحويل",
    "conversionFunnel": "رحلة تحويل العميل من الإعلان للمتجر أو واتساب"
  },
  "painPoints": ["ألم عميل حقيقي 1", "ألم 2", "ألم 3", "ألم 4", "ألم 5"],
  "strategicPillars": ["محور التوعية والثقة", "محور إثبات الجودة والمقارنة", "محور العروض والتحويل المباشر", "محور الريلز والانتشار"],
  "contentPlan": [
    {
      "title": "عنوان جذاب يحتوي على ${brandName}",
      "type": "image | reel | video | carousel | story",
      "caption": "كابشن احترافي (100-220 حرف) يذكر ${brandName} ويعالج ألم محدد وينتهي بـ CTA واضح بدون وعود 100%",
      "visualPrompt": "وصف بصري دقيق لتصميم أو مشهد فيديو إعلاني فاخر",
      "pillarLabel": "اسم المحور",
      "painPoint": "الألم المستهدف من القائمة",
      "scheduledPlatforms": ["facebook", "instagram"]
    }
  ]
}
اجعل contentPlan يحتوي على 8 عناصر متنوعة (منها على الأقل 2 نوع reel و 1 نوع video و 5 صور/كاروسيل).`;

      const routed = await generateContentWithRouter({
        apiKey,
        role: "text",
        contents: prompt,
        config: { responseMimeType: "application/json" },
        serviceTag: "t2os-ez-zel:market-research",
      });
      const parsed: any = routed.text ? JSON.parse(routed.text) : null;
      if (
        parsed?.marketResearch &&
        Array.isArray(parsed?.painPoints) &&
        parsed.painPoints.length >= 3 &&
        Array.isArray(parsed?.contentPlan) &&
        parsed.contentPlan.length >= 4
      ) {
        return {
          marketResearch: String(parsed.marketResearch),
          marketingStrategy: {
            targetAudience: String(parsed.marketingStrategy?.targetAudience || `عملاء ${industry} الباحثين عن جودة وسرعة في ${city}`),
            positioning: String(parsed.marketingStrategy?.positioning || `${brandName} — الخيار الأسرع والأكثر موثوقية في ${industry}`),
            coreOffer: String(parsed.marketingStrategy?.coreOffer || `استشارة/طلب مباشر مع متابعة فورية عبر واتساب`),
            conversionFunnel: String(parsed.marketingStrategy?.conversionFunnel || `إعلان وعي وريلز → تفاعل ورسائل واتساب/متجر → إتمام الطلب والمتابعة`),
          },
          painPoints: parsed.painPoints.map(String).slice(0, 6),
          strategicPillars: Array.isArray(parsed.strategicPillars)
            ? parsed.strategicPillars.map(String).slice(0, 5)
            : ["التوعية والثقة", "إثبات الجودة", "العروض والتحويل", "الريلز والانتشار"],
          contentPlan: parsed.contentPlan.slice(0, 8).map((item: any, idx: number) => ({
            title: String(item.title || `${brandName} — محتوى استراتيجي #${idx + 1}`),
            type: (["image", "reel", "video", "carousel", "story"].includes(item.type) ? item.type : idx % 3 === 1 ? "reel" : "image") as any,
            caption: String(item.caption || `مع ${brandName} بنقدملك أفضل تجربة في ${industry}. تواصل معنا الآن عبر واتساب أو اطلب من المتجر!`),
            visualPrompt: String(item.visualPrompt || `تصميم إعلاني عصري لبراند ${brandName} في مجال ${industry}`),
            pillarLabel: String(item.pillarLabel || "استراتيجية علاج آلام البيزنس"),
            painPoint: String(item.painPoint || parsed.painPoints[idx % parsed.painPoints.length]),
            scheduledPlatforms: Array.isArray(item.scheduledPlatforms) && item.scheduledPlatforms.length
              ? item.scheduledPlatforms.map(String)
              : ["facebook", "instagram"],
          })),
          source: "gemini_ai",
        };
      }
    } catch {}
  }

  // Domain-tailored deterministic fallback when AI key is unavailable
  const painPoints = [
    `صعوبة التأكد من الجودة الأصلية قبل الشراء في مجال ${industry}`,
    `بطء الرد على استفسارات الأسعار والتفاصيل وضياع وقت العميل`,
    `غياب الشفافية في السعر النهائي وتكلفة الشحن أو الخدمة`,
    `تخوّف العميل من خدمة ما بعد البيع والاستبدال أو المتابعة`,
    `تشتت العميل بين منافسين بدون عرض واضح ومباشر`,
  ];
  const strategicPillars = [
    "التوعية وبناء الثقة",
    "إثبات الجودة والنتائج",
    "العروض والتحويل المباشر",
    "ريلز قصيرة سريعة الانتشار",
  ];
  const types: Array<"image" | "reel" | "video" | "carousel" | "story"> = [
    "image",
    "reel",
    "carousel",
    "image",
    "reel",
    "video",
    "image",
    "story",
  ];
  const contentPlan = types.map((type, idx) => {
    const pain = painPoints[idx % painPoints.length];
    const pillar = strategicPillars[idx % strategicPillars.length];
    return {
      title: `${brandName} — حل عملي لـ ${pain.slice(0, 42)}`,
      type,
      caption: `في ${brandName} عارفين إن "${pain}" أكبر تحدي في مجال ${industry}. علشان كده جهزنا لك تجربة واضحة وسريعة بجودة معتمدة. تواصل معنا الآن عبر واتساب أو اطلب مباشرة من المتجر!`,
      visualPrompt: `تصميم ${type === "reel" || type === "video" ? "فيديو إعلاني سينمائي" : "جرافيك سوشيال ميديا احترافي"} لبراند ${brandName} في مجال ${industry} يعرض حل "${pain}" بإضاءة استوديو فاخرة`,
      pillarLabel: pillar,
      painPoint: pain,
      scheduledPlatforms: type === "reel" ? ["instagram", "facebook", "tiktok"] : ["facebook", "instagram"],
    };
  });

  return {
    marketResearch: `تحليل سوق ${industry} في ${city} يُظهر فجوة واضحة في سرعة الاستجابة وشفافية الأسعار وإثبات الجودة البصري؛ مما يمنح ${brandName} فرصة قوية للاستحواذ عبر محتوى يعالج آلام العميل وربط مباشر مع المتجر وواتساب.`,
    marketingStrategy: {
      targetAudience: `العملاء الباحثون عن جودة موثوقة وسرعة تنفيذ في مجال ${industry} داخل ${city}`,
      positioning: `${brandName} — الحل الأوضح والأسرع في ${industry} بتجربة طلب فورية ومتابعة ذكية`,
      coreOffer: `طلب مباشر عبر المتجر أو واتساب مع تأكيد فوري ومتابعة حتى الاستلام`,
      conversionFunnel: `ريلز وتوعية (Awareness) ← عروض وتحويل مباشر للمتجر وواتساب (Sales) ← إعادة استهداف`,
    },
    painPoints,
    strategicPillars,
    contentPlan,
    source: "domain_fallback",
  };
}

/**
 * Post-subscription automated growth engine:
 * 1) Runs AI Market Research & builds full Marketing Strategy + 8-item Content Plan (images + Veo reels/videos)
 * 2) Initializes 50% Smart Ad Budget Allocation Plan
 * 3) Saves Strategy & Idea Bank into Studio's Strategic Lab (/api/strategy/save)
 * 4) Enqueues full content plan into Studio's background execution (Copy + Image + Veo Video + QA Gate)
 */
export async function triggerPostSubscriptionGrowthCycle(input: {
  brandId: string;
  planPriceEgp: number;
  planName?: string;
}): Promise<{
  ok: boolean;
  brandId: string;
  adBudgetEgp: number;
  studioEnqueued: boolean;
  studioJobId?: string;
  strategySavedToStudio: boolean;
  researchSource: "gemini_ai" | "domain_fallback";
  painPoints: string[];
}> {
  const brands = getUnifiedGrowthBrands();
  const brand: any = brands.find(
    (b: any) => b.id === input.brandId || b.slug === input.brandId
  );
  const brandName = String(brand?.name || input.brandId);
  const industry = String(brand?.businessType || brand?.industry || "تجارة وخدمات");
  const city = String(brand?.city || brand?.location || "مصر");
  const productsSample: string[] = Array.isArray(brand?.productsCatalog)
    ? brand.productsCatalog.map((p: any) => String(p?.name || p || "")).filter(Boolean)
    : [];
  const adBudgetEgp = Math.round(Math.max(0, Number(input.planPriceEgp) || 0) * 0.5);

  const strategyPack = await conductAIMarketResearchAndStrategy({
    brandName,
    industry,
    city,
    productsSample,
  });

  const studioBase = getTitoStudioBaseUrl().replace(/\/+$/, "");
  const studioKey = String(process.env.T2_REMOTE_API_KEY || process.env.TITO_STUDIO_API_KEY || "").trim();
  const clinicId = String(brand?.titoStudioClinicId || brand?.id || input.brandId);

  let adPlan: any = null;
  let strategySavedToStudio = false;
  let studioEnqueued = false;
  let studioJobId: string | undefined;

  if (studioKey) {
    // 1) Smart 50% Ad Budget Allocation Plan
    try {
      const budgetRes = await fetch(`${studioBase}/api/meta/ads/budget-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": studioKey },
        body: JSON.stringify({
          monthlyPlanPriceEgp: input.planPriceEgp,
          adBudgetRatio: 0.5,
          brandStage: brand?.onboardingMode === "connect_existing" ? "established" : "new",
          businessModel: brand?.appTemplate === "products_erp" ? "ecommerce_store" : "hybrid",
          hasWhatsappBusiness: Boolean(brand?.whatsapp || brand?.phone),
          hasPixel: Boolean(brand?.metaPixelId),
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (budgetRes.ok) {
        const bJson: any = await budgetRes.json();
        adPlan = bJson?.plan || null;
      }
    } catch {}

    // 2) Persist Market Research + Marketing Strategy + Idea Bank into Studio's Strategic Lab
    try {
      const stratRes = await fetch(`${studioBase}/api/strategy/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": studioKey },
        body: JSON.stringify({
          clinicId,
          brandName,
          marketResearch: strategyPack.marketResearch,
          marketingStrategy: strategyPack.marketingStrategy,
          painPoints: strategyPack.painPoints,
          strategicPillars: strategyPack.strategicPillars,
          contentPlan: strategyPack.contentPlan,
          adBudgetPlan: adPlan,
        }),
        signal: AbortSignal.timeout(10000),
      });
      strategySavedToStudio = stratRes.ok;
    } catch {}

    // 3) Enqueue full 8-item plan (images + Veo reels/videos) into Background Execution + QA Gate
    try {
      const execRes = await fetch(`${studioBase}/api/execution/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": studioKey },
        body: JSON.stringify({
          clinicId,
          brandName,
          items: strategyPack.contentPlan,
          triggerSource: "post_subscription_growth_cycle",
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (execRes.ok) {
        const eJson: any = await execRes.json();
        studioEnqueued = Boolean(eJson?.success);
        studioJobId = eJson?.jobId;
      }
    } catch {}
  }

  if (brand?.id) {
    persistBrandUpdateAcrossEcosystem(brand.id, {
      postSubscriptionStrategyActivatedAt: new Date().toISOString(),
      marketResearchReport: strategyPack.marketResearch,
      marketingStrategy: strategyPack.marketingStrategy,
      strategicPainPoints: strategyPack.painPoints,
      strategicPillars: strategyPack.strategicPillars,
      adBudgetEgp,
      smartAdBudgetPlan: adPlan,
    } as any);
  }

  return {
    ok: true,
    brandId: input.brandId,
    adBudgetEgp,
    studioEnqueued,
    studioJobId,
    strategySavedToStudio,
    researchSource: strategyPack.source,
    painPoints: strategyPack.painPoints,
  };
}

const ALLOWED_STOREFRONT_BEACON_EVENTS = new Set<LiveEventType>([
  "store_visit",
  "product_view",
  "cart_add",
]);

export function registerEcosystemOrchestrationRoutes(app: Express): void {
  // 1) Webhook from Tito Studio when QA-approved content enters the client's Showroom
  app.post("/api/studio/showroom-ready", async (req: Request, res: Response) => {
    if (!(await authorizeStudioOrAdmin(req))) {
      return res.status(401).json({ ok: false, error: "Unauthorized: valid studio API key or admin token required." });
    }
    try {
      const { clinicId, brandName, clientPhone, jobId, approvedCount, humanReviewCount, showroomUrl } = req.body || {};
      const safeBrandId = String(clinicId || "").trim();
      const count = Math.max(1, Number(approvedCount) || 1);
      if (!safeBrandId) {
        return res.status(400).json({ ok: false, error: "clinicId is required" });
      }

      const ev = recordLiveEvent({
        source: "t2_studio",
        eventType: "showroom_ready",
        brandId: safeBrandId,
        customerPhone: clientPhone ? String(clientPhone) : undefined,
        summary: `تم اعتماد ${count} منشورات بجودة QA وإرسالها إلى شو روم ${brandName || safeBrandId}`,
        raw: { jobId, approvedCount: count, humanReviewCount: Number(humanReviewCount) || 0, showroomUrl },
      });

      let whatsappNotified = false;
      let phone = String(clientPhone || "").trim();
      if (!phone) {
        const matchedBrand: any = getUnifiedGrowthBrands().find(
          (b: any) =>
            b.id === safeBrandId ||
            b.slug === safeBrandId ||
            String((b as any).titoStudioClinicId || "") === safeBrandId
        );
        phone = String(matchedBrand?.whatsapp || matchedBrand?.phone || "").trim();
      }
      if (phone) {
        const portalLink =
          showroomUrl || `https://studio.t2os.app/?view=clientPortal&brandId=${encodeURIComponent(safeBrandId)}`;
        const msg =
          `أهلاً بك يا فندم 👋✨\n` +
          `ظلك الذكي انتهى للتو من تجهيز وفحص جودة ${count} منشورات جديدة لبراند (${brandName || safeBrandId})، وهي الآن جاهزة في الشو روم بانتظار موافقتك أو تعديلك:\n` +
          `${portalLink}`;
        try {
          await t2AgentApi.sendManualReply(safeBrandId, phone, msg);
          whatsappNotified = true;
        } catch {}
      }

      return res.json({
        ok: true,
        eventId: ev.id,
        whatsappNotified,
        approvedCount: count,
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed recording showroom-ready notification" });
    }
  });

  // 2) Public Storefront Pixel Beacon (store_visit, product_view, cart_add)
  app.post("/api/telemetry/storefront-event", (req: Request, res: Response) => {
    try {
      const b = req.body || {};
      const eventType = String(b.eventType || "").trim() as LiveEventType;
      const brandId = String(b.brandId || b.slug || "").trim().slice(0, 100);
      if (!brandId || !ALLOWED_STOREFRONT_BEACON_EVENTS.has(eventType)) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed: brandId and eventType (store_visit | product_view | cart_add) required.",
        });
      }
      const productName = b.productName ? String(b.productName).slice(0, 140) : "";
      const amountEgp = Number(b.amountEgp) > 0 ? Number(b.amountEgp) : undefined;
      const summaryMap: Record<string, string> = {
        store_visit: `زيارة جديدة لمتجر ${brandId}`,
        product_view: `مشاهدة منتج ${productName || ""} في متجر ${brandId}`.trim(),
        cart_add: `إضافة للسلة: ${productName || "منتج"} في متجر ${brandId}`,
      };
      const ev = recordLiveEvent({
        source: "storefront_pixel",
        eventType,
        brandId,
        amountEgp,
        summary: summaryMap[eventType],
        raw: { productName, pagePath: b.pagePath ? String(b.pagePath).slice(0, 200) : undefined },
      });
      return res.status(201).json({ ok: true, eventId: ev.id });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Telemetry ingest failed" });
    }
  });

  // 3) Unified Live Pulse for Jarvis / Shadow
  app.get("/api/telemetry/pulse", (req: Request, res: Response) => {
    const brandId = req.query.brandId ? String(req.query.brandId).trim() : undefined;
    return res.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      pulse: getLiveTelemetrySummary(brandId),
    });
  });

  // 4) Admin Trigger for Post-Subscription Market Strategy + 50% Ad Budget + Studio Execution
  app.post("/api/admin/brands/:brandId/activate-growth-cycle", async (req: Request, res: Response) => {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(401).json({ ok: false, error: "Unauthorized: admin access required." });
    }
    try {
      const brandId = String(req.params.brandId || "").trim();
      const planPriceEgp = Math.max(0, Number(req.body?.planPriceEgp) || 5000);
      const result = await triggerPostSubscriptionGrowthCycle({
        brandId,
        planPriceEgp,
        planName: req.body?.planName ? String(req.body.planName) : undefined,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Growth cycle activation failed" });
    }
  });
}
