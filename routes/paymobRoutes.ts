import type { Express, Request, Response } from "express";
import {
  PAYMOB_PLANS,
  PAYMOB_TIERS,
  createPaymobCheckoutSession,
  verifyPaymobWebhookHmac,
  readPaymobSubscriptions,
  savePaymobSubscriptionRecord,
} from "../services/paymobService";
import { verifyAdminRequest } from "../services/serverAdminAuth";

export interface PaymobRoutesDeps {
  getUnifiedGrowthBrands: () => any[];
  getEzZelPersonalClients: () => any[];
  executeRealJarvisEcosystemAction: (payload: any) => Promise<any>;
}

/**
 * Registers all Paymob subscription plans, checkout session creation,
 * HMAC-verified webhooks (with affiliate auto-credit & refund revocation),
 * and admin verification helpers.
 */
export function registerPaymobRoutes(app: Express, deps: PaymobRoutesDeps): void {
  const { getUnifiedGrowthBrands, getEzZelPersonalClients, executeRealJarvisEcosystemAction } = deps;

  app.get("/api/payments/paymob/plans", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      plans: PAYMOB_TIERS,
    });
  });

  app.get("/api/payments/paymob/subscriptions", async (req: Request, res: Response) => {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return res.status(403).json({ ok: false, error: auth.error || "Forbidden: Admin access required" });
    }
    res.json({
      ok: true,
      subscriptions: readPaymobSubscriptions(),
    });
  });

  app.get("/api/admin/verify", async (req: Request, res: Response) => {
    const auth = await verifyAdminRequest(req);
    res.status(auth.ok ? 200 : 403).json({ ok: auth.ok, email: auth.email || null });
  });

  app.post("/api/payments/paymob/create-checkout", async (req: Request, res: Response) => {
    try {
      const { brandId, brandName, planId, amountEgp, customerName, customerEmail, customerPhone } = req.body || {};
      const rawPlan = String(planId || "growth_5000").toLowerCase();
      const requestedAmount = amountEgp !== undefined && amountEgp !== null && amountEgp !== "" ? Number(amountEgp) : 5000;
      if (
        rawPlan.includes("2500") ||
        rawPlan.includes("starter") ||
        !Number.isFinite(requestedAmount) ||
        requestedAmount < 5000
      ) {
        return res.status(400).json({
          ok: false,
          minUpgradeEgp: 5000,
          error:
            "الحد الأدنى للاستكمال والترقية بعد أسبوع التجربة المجانية هو باقة النمو 5,000 ج.م (2,500 ج.م إعلانات ممولة + تطبيق الويب الكامل + الأجنت).",
        });
      }
      const checkout = await createPaymobCheckoutSession({
        brandId: brandId || "el_baraka",
        brandName: brandName || "براند تيتو",
        planId: planId || "growth_5000",
        amountEgp: requestedAmount,
        customerName: customerName || brandName || "عميل منظومة النمو",
        customerEmail: customerEmail || "client@t2-studio.app",
        customerPhone: customerPhone || "01013373634",
      });
      res.json(checkout);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message });
    }
  });

  app.post("/api/payments/paymob/webhook", async (req: Request, res: Response) => {
    try {
      const obj = req.body?.obj || req.body || {};
      const hmac = req.query.hmac as string | undefined;
      if (!verifyPaymobWebhookHmac(obj, hmac)) {
        return res.status(403).json({ ok: false, error: "Invalid Paymob HMAC signature" });
      }
      const brandId = String(obj.extras?.brandId || obj.payment_key_claims?.extra?.brandId || req.body?.brandId || "el_baraka").trim();
      const rawPlanId = String(obj.extras?.planId || req.body?.planId || "growth_5000").trim();
      const orderId = String(obj.order?.id || obj.special_reference || req.body?.orderId || `PM_${Date.now()}`);

      const isRefundOrVoid =
        obj.is_refunded === true ||
        obj.is_refunded === "true" ||
        obj.is_voided === true ||
        obj.is_voided === "true";

      if (isRefundOrVoid) {
        const { markPaymobSubscriptionRefundedOrRevoked } = await import("../services/paymobService");
        markPaymobSubscriptionRefundedOrRevoked(orderId, brandId, "paymob_refund_or_void");
        try {
          const { upsertBrandRegistryEntry } = await import("../services/brandRegistryService");
          upsertBrandRegistryEntry(brandId, { lifecycleStage: "paused_archive" });
        } catch {}
        try {
          const { persistBrandUpdateAcrossEcosystem } = await import("../services/obsidianVaultService");
          persistBrandUpdateAcrossEcosystem(brandId, { subscriptionStatus: "revoked", botPaused: true });
        } catch {}
        try {
          const { t2AgentApi } = await import("../services/t2AgentApiClient");
          await t2AgentApi.togglePauseBot(brandId).catch(() => {});
        } catch {}
        return res.json({ ok: true, refunded: true, brandId, orderId });
      }

      const isSuccess = obj.success === true || obj.success === "true" || req.body?.status === "paid";
      const rawAmountEgp = Number(obj.amount_cents ? Number(obj.amount_cents) / 100 : obj.amountEgp || req.body?.amountEgp || 0);

      const { resolveBrandPlanSpec, resolveBrandAppAccessMode } = await import("../services/saasPlansService");
      const planSpec = resolveBrandPlanSpec({ planId: rawPlanId, planAmount: rawAmountEgp });
      const appAccessMode = resolveBrandAppAccessMode({ planId: planSpec.id, planAmount: rawAmountEgp || planSpec.priceEgp });
      const amountEgp = rawAmountEgp > 0 ? rawAmountEgp : planSpec.priceEgp;

      const { signClientPortalToken } = await import("./tenantErpRoutes");
      const portalToken = signClientPortalToken(brandId);
      const signedPortalUrl = `/client/${encodeURIComponent(brandId)}?token=${encodeURIComponent(portalToken)}`;

      if (isSuccess) {
        const { isPaymobOrderAlreadyProcessed } = await import("../services/paymobService");
        if (isPaymobOrderAlreadyProcessed(orderId)) {
          return res.json({
            ok: true,
            activated: true,
            idempotentDuplicate: true,
            brandId,
            orderId,
            planId: planSpec.id,
            appAccessMode,
            amountEgp,
            clientPortalUrl: signedPortalUrl,
          });
        }

        const nowIso = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        savePaymobSubscriptionRecord({
          orderId,
          brandId,
          planId: planSpec.id,
          amountEgp,
          appAccessMode,
          activationSource: "paymob_verified",
          status: "paid",
          paidAt: nowIso,
          expiresAt,
        });

        // Idempotent 10% Affiliate Commission Auto-Credit on verified Paymob payment
        try {
          const matchedBrandForAff = getUnifiedGrowthBrands().find((b: any) => b.id === brandId || b.slug === brandId);
          const matchedClientForAff = getEzZelPersonalClients().find((c: any) => c.linkedBrandId === brandId || c.id === brandId);
          const referredBy = String(
            obj.extras?.referredBy ||
              obj.payment_key_claims?.extra?.referredBy ||
              req.body?.referredBy ||
              (matchedBrandForAff as any)?.referredBy ||
              (matchedClientForAff as any)?.referredBy ||
              ""
          ).trim();
          if (referredBy) {
            const { readPersistentJson, savePersistentJson } = await import("../services/persistentStorage");
            const commissions = readPersistentJson<any[]>("t2_affiliate_commissions.json", []);
            if (!commissions.some((c: any) => String(c?.orderId) === String(orderId))) {
              const commissionEgp = Math.round(amountEgp * 0.1);
              commissions.push({
                orderId,
                brandId,
                referredBy,
                amountEgp,
                commissionEgp,
                status: "earned",
                createdAt: nowIso,
              });
              savePersistentJson("t2_affiliate_commissions", "t2_affiliate_commissions.json", commissions);
            }
          }
        } catch {}

        try {
          const { upsertBrandRegistryEntry } = await import("../services/brandRegistryService");
          upsertBrandRegistryEntry(brandId, {
            slug: brandId,
            lifecycleStage: "active_client",
            accountOrigin: "public_signup",
            subscriptionStatus: "active",
            paidExpiresAt: expiresAt,
          });
        } catch {}

        try {
          const { triggerPostSubscriptionGrowthCycle } = await import("./ecosystemOrchestrationRoutes");
          void triggerPostSubscriptionGrowthCycle({
            brandId,
            planPriceEgp: amountEgp,
            planName: planSpec.nameAr,
          }).catch(() => {});
        } catch {}

        try {
          const { persistBrandUpdateAcrossEcosystem } = await import("../services/obsidianVaultService");
          const { buildFlagshipTenantUrl } = await import("../services/tenantAppRenderer");
          const existingBrand = getUnifiedGrowthBrands().find((b: any) => b.id === brandId || b.slug === brandId);
          const fallbackLiveUrl = buildFlagshipTenantUrl(existingBrand?.slug || brandId, (existingBrand as any)?.appTemplate || "products_erp");
          persistBrandUpdateAcrossEcosystem(brandId, {
            planId: planSpec.id,
            planAmount: amountEgp,
            appAccessMode,
            subscriptionStatus: "active",
            paymobOrderId: orderId,
            activationSource: "paymob_verified",
            expiresAt,
            paidExpiresAt: expiresAt,
            botPaused: false,
            ...(existingBrand?.vercelUrl ? {} : { vercelUrl: fallbackLiveUrl }),
          } as any);
        } catch {}

        try {
          const { t2AgentApi } = await import("../services/t2AgentApiClient");
          const st: any = await t2AgentApi.getBrandStatus(brandId).catch(() => null);
          if (st?.isPaused) {
            await t2AgentApi.togglePauseBot(brandId).catch(() => {});
          }
        } catch {}

        try {
          const { recordAttributionEvent } = await import("../services/growthAttributionService");
          recordAttributionEvent({
            leadId: brandId,
            brandId,
            stage: "paid_converted",
            utmCampaign: String(obj.extras?.utmCampaign || req.body?.utmCampaign || "direct"),
            revenueEgp: amountEgp,
          });
        } catch {}

        await executeRealJarvisEcosystemAction({
          actionType: "ACTIVATE_PAYMOB_SUBSCRIPTION",
          brandId,
          payload: { planId: planSpec.id, orderId, amountEgp, appAccessMode, expiresAt },
        });

        if (appAccessMode === "full_app" && (amountEgp >= 20000 || planSpec.id === "enterprise_20000" || planSpec.id === "sovereign_50000")) {
          import("../services/dedicatedDeployService")
            .then(({ provisionDedicatedRepoAndVercel }) => provisionDedicatedRepoAndVercel({ brandId }))
            .catch(() => {});
        }
      }
      res.json({
        ok: true,
        activated: isSuccess,
        brandId,
        orderId,
        planId: planSpec.id,
        appAccessMode,
        amountEgp,
        clientPortalUrl: signedPortalUrl,
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message });
    }
  });

  app.get("/api/payments/paymob/checkout-gateway", (req: Request, res: Response) => {
    const orderId = String(req.query.orderId || `PM_${Date.now()}`);
    const brandId = String(req.query.brandId || "el_baraka");
    const planId = String(req.query.planId || "growth_pro");
    const amountEgp = Number(req.query.amountEgp || 5000);
    const plan = PAYMOB_PLANS[planId] || PAYMOB_PLANS.growth_pro;

    res.send(
      `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>بوابة الدفع والاشتراك — Paymob</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800&display=swap" rel="stylesheet"/></head><body style="background:#020617;color:#fff;font-family:'Cairo',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;"><div style="background:#0f172a;border:1px solid #06b6d4;border-radius:24px;padding:32px;max-width:520px;text-align:center;box-shadow:0 20px 60px rgba(6,182,212,0.2);"><div style="font-size:44px;margin-bottom:10px;">💳</div><h2 style="margin:0 0 10px;color:#38bdf8;">طلب اشتراك قيد التحقق من الدفع</h2><p style="color:#cbd5e1;font-size:14px;line-height:1.8;">الباقة: <b>${plan.name}</b><br/>البراند: <code>${brandId}</code> • القيمة: <b>${amountEgp} ج.م</b><br/>رقم الطلب: <code>${orderId}</code></p><div style="background:#020617;border:1px solid #334155;border-radius:14px;padding:14px;margin:16px 0;font-size:12.5px;color:#94a3b8;text-align:right;">🔒 <b>حماية التفعيل الآلي:</b> لا يتم تفعيل الاشتراك مجاناً عبر الرابط؛ يتم التفعيل تلقائياً فور وصول إشعار الدفع الموقّع (HMAC-SHA512) من بوابة <b>Paymob</b> إلى <code>/api/payments/paymob/webhook</code>، أو باعتماد الأدمن الموثق.</div><button onclick="window.close()" style="margin-top:10px;background:#06b6d4;color:#020617;border:none;padding:11px 28px;border-radius:12px;font-family:'Cairo',sans-serif;font-weight:800;cursor:pointer;">العودة إلى المنظومة</button></div></body></html>`
    );
  });
}
