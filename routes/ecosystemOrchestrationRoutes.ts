import crypto from "crypto";
import type { Express, Request, Response } from "express";
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

/**
 * Post-subscription automated growth engine:
 * 1) Synthesizes pain-point market strategy on the brand
 * 2) Initializes 50% Smart Ad Budget Allocation Plan
 * 3) Enqueues strategic content batch into Tito Studio's background execution + QA Gate
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
  painPoints: string[];
}> {
  const brands = getUnifiedGrowthBrands();
  const brand: any = brands.find(
    (b: any) => b.id === input.brandId || b.slug === input.brandId
  );
  const brandName = String(brand?.name || input.brandId);
  const industry = String(brand?.businessType || brand?.industry || "تجارة وخدمات");
  const adBudgetEgp = Math.round(Math.max(0, Number(input.planPriceEgp) || 0) * 0.5);

  const painPoints = [
    `صعوبة بناء الثقة السريعة للعملاء الجدد في مجال ${industry}`,
    `بطء الرد على استفسارات السعر والحجز وضياع العملاء المحتملين`,
    `تشتت الميزانية الإعلانية بدون ربط واضح بين المحتوى والمبيعات`,
  ];

  const studioBase = getTitoStudioBaseUrl().replace(/\/+$/, "");
  const studioKey = String(process.env.T2_REMOTE_API_KEY || process.env.TITO_STUDIO_API_KEY || "").trim();

  // Compute smart 50% budget plan & enqueue strategic batch in Studio
  let adPlan: any = null;
  let studioEnqueued = false;
  let studioJobId: string | undefined;

  if (studioKey) {
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

    try {
      const execItems = painPoints.map((pain, idx) => ({
        title: `${brandName} — حل عملي: ${pain.slice(0, 48)}`,
        type: idx === 1 ? "video" : "image",
        caption: `مع ${brandName} بنعالج مشكلة "${pain}" بخطوات عملية سريعة وجودة مضمونة. تواصل معنا الآن عبر واتساب أو اطلب مباشرة!`,
        visualPrompt: `تصميم إعلاني احترافي لبراند ${brandName} في مجال ${industry} يعرض حل مشكلة ${pain} بأسلوب عصري وواضح`,
        pillarLabel: "استراتيجية علاج آلام البيزنس",
        painPoint: pain,
        scheduledPlatforms: ["facebook", "instagram"],
      }));

      const execRes = await fetch(`${studioBase}/api/execution/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": studioKey },
        body: JSON.stringify({
          clinicId: String(brand?.titoStudioClinicId || brand?.id || input.brandId),
          brandName,
          items: execItems,
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
      strategicPainPoints: painPoints,
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
    painPoints,
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
      const phone = String(clientPhone || "").trim();
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
