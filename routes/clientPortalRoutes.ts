import type { Express, Request, Response } from "express";
import { verifyAdminRequest } from "../services/serverAdminAuth";
import { signClientPortalToken, verifyClientPortalToken, issueOwnerSsoToken } from "./tenantErpRoutes";
import { findMatchingBrandRecord } from "../services/brandIdentityNormalizer";
import {
  getUnifiedGrowthBrands,
  getEzZelPersonalClients,
  persistBrandUpdateAcrossEcosystem,
} from "../services/obsidianVaultService";
import { readPaymobSubscriptions, isSubscriptionActiveNow } from "../services/paymobService";
import {
  resolveBrandPlanSpec,
  resolveBrandAppAccessMode,
  getBrandMonthlyQuotaStatus,
} from "../services/saasPlansService";
import { getTitoStudioBaseUrl, titoStudioApi } from "../services/titoStudioApiClient";
import { t2AgentApi } from "../services/t2AgentApiClient";
import { buildFlagshipTenantUrl } from "../services/tenantAppRenderer";
import { runJarvisBrainConversation } from "../services/jarvisBrainEngine";

export function resolveBrandSubscriptionWindow(brand: any): {
  subscriptionStatus: "active" | "trial" | "expired";
  trialEndsAt: string;
  expiresAt: string;
  trialDaysLeft: number | null;
  paidSub: any;
  linkedClient: any;
} {
  const clients = getEzZelPersonalClients();
  const brandCandidates = [brand?.id, brand?.slug].filter(Boolean);
  const linkedClient = clients.find((c: any) =>
    brandCandidates.some((bc) => String(c.linkedBrandId || "") === String(bc))
  );
  const subs = readPaymobSubscriptions();
  const anyPaidSub = subs.find(
    (s: any) =>
      brandCandidates.some((bc) => String(s.brandId || "") === String(bc)) &&
      String(s.status || "").toLowerCase() === "paid"
  );
  const activePaidSub = anyPaidSub && isSubscriptionActiveNow(anyPaidSub) ? anyPaidSub : null;

  let subscriptionStatus: "active" | "trial" | "expired" = "active";
  let trialEndsAt = String(linkedClient?.trialEndsAt || brand?.trialEndsAt || "");
  const expiresAt = String(activePaidSub?.expiresAt || anyPaidSub?.expiresAt || brand?.paidExpiresAt || brand?.expiresAt || "");
  let trialDaysLeft: number | null = null;

  if (activePaidSub) {
    subscriptionStatus = "active";
  } else if (anyPaidSub && !activePaidSub) {
    subscriptionStatus = "expired";
  } else if (brand?.paidExpiresAt && new Date(brand.paidExpiresAt).getTime() > Date.now()) {
    subscriptionStatus = "active";
  } else if (brand?.subscriptionStatus === "expired" || brand?.subscriptionStatus === "revoked") {
    subscriptionStatus = "expired";
  } else if (
    (linkedClient?.status === "trial" || brand?.subscriptionStatus === "trial" || brand?.planId === "trial_7d") &&
    trialEndsAt
  ) {
    const diffMs = new Date(trialEndsAt).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(diffMs / 86400000));
    subscriptionStatus = diffMs <= 0 ? "expired" : "trial";
  }

  return {
    subscriptionStatus,
    trialEndsAt,
    expiresAt,
    trialDaysLeft,
    paidSub: activePaidSub || anyPaidSub || null,
    linkedClient,
  };
}

async function verifyClientPortalWriteAccess(
  req: Request,
  slug: string,
  brand?: any
): Promise<{ ok: boolean; actor: "admin" | "client" }> {
  const explicitPortalToken = String(
    req.headers["x-portal-token"] || req.query.token || req.body?.portalToken || ""
  ).trim();
  const candidates = [slug, brand?.slug, brand?.id, brand?.canonicalId]
    .filter(Boolean)
    .map((s: any) => String(s));

  if (explicitPortalToken) {
    const matched = candidates.some((c: string) => verifyClientPortalToken(explicitPortalToken, c));
    if (matched) return { ok: true, actor: "client" };
  }

  const adminAuth = await verifyAdminRequest(req);
  if (adminAuth.ok) return { ok: true, actor: "admin" };

  const authHeader = String(req.headers.authorization || "");
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!bearer) return { ok: false, actor: "client" };
  const matched = candidates.some((c: string) => verifyClientPortalToken(bearer, c));
  return { ok: matched, actor: "client" };
}

export function registerClientPortalRoutes(
  app: Express,
  deps: {
    getServerAI: () => any;
    getRealEcosystemStats: () => any;
    synthesizeSovereignSpeech: any;
  }
): void {
  app.get("/api/admin/brands/:slug/portal-link", async (req: Request, res: Response) => {
    try {
      const auth = await verifyAdminRequest(req);
      if (!auth.ok) return res.status(401).json({ ok: false, error: "Admin authorization required" });
      const slug = String(req.params.slug || "").trim();
      const token = signClientPortalToken(slug);
      const publicBase = (process.env.PUBLIC_BASE_URL || "https://t2os.app").replace(/\/+$/, "");
      res.json({
        ok: true,
        slug,
        token,
        portalUrl: `${publicBase}/client/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`,
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message });
    }
  });

  app.get("/api/client-portal/:slug", async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase();
      const brands = getUnifiedGrowthBrands();
      const brand: any = findMatchingBrandRecord(brands, slug);
      if (!brand) return res.status(404).json({ ok: false, error: "Brand not found" });

      const subWindow = resolveBrandSubscriptionWindow(brand);
      const effectiveBrand = {
        ...brand,
        planId: (subWindow.paidSub as any)?.planId || brand.planId || (subWindow.subscriptionStatus === "trial" ? "trial_7d" : undefined),
        planAmount: (subWindow.paidSub as any)?.amountEgp || brand.planAmount || (subWindow.linkedClient as any)?.monthlySubscriptionEgp,
      };
      const planSpec = resolveBrandPlanSpec(effectiveBrand);
      const appAccessMode = resolveBrandAppAccessMode(effectiveBrand);
      const quota = getBrandMonthlyQuotaStatus(effectiveBrand);
      const accessCheck = await verifyClientPortalWriteAccess(req, slug, brand);

      const studioBase = getTitoStudioBaseUrl().replace(/\/+$/, "");
      const brandKey = String(brand.slug || brand.id);
      const studioClinicKey = String(brand.titoStudioClinicId || brand.studioBrandId || brandKey);
      const agentBrandKey = String(brand.agentBrandId || brandKey);
      const studioShowroomUrl = titoStudioApi.buildStudioEmbedUrl("clientPortal", studioClinicKey);

      let agentDashboardUrl: string | null = null;
      if (accessCheck.ok) {
        let agentApiKey = "";
        try {
          const keysRes: any = await t2AgentApi.getBrandKeys(agentBrandKey);
          agentApiKey = String(keysRes?.apiKey || keysRes?.keys?.apiKey || keysRes?.data?.apiKey || "");
        } catch {}
        agentDashboardUrl = t2AgentApi.buildAgentEmbedUrl("crm", agentBrandKey, agentApiKey || undefined);
      }

      const publicBase = (process.env.PUBLIC_BASE_URL || "https://t2os.app").replace(/\/+$/, "");
      const studioLandingPageUrl =
        brand.studioLandingPageUrl || brand.landingPageUrl || `${studioBase}/landing/${encodeURIComponent(brandKey)}`;
      const storefrontUrl =
        appAccessMode === "landing_page"
          ? studioLandingPageUrl
          : brandKey === "al_genedy" || brandKey === "al-genedy"
            ? String(process.env.AL_GENEDY_STANDALONE_URL || "https://elgenedy.com")
            : brand.vercelUrl ||
              brand.deployedUrl ||
              brand.dedicatedLiveUrl ||
              buildFlagshipTenantUrl(brandKey, brand.appTemplate || "products_erp");

      let ssoStoreAdminUrl: string | null = null;
      let ownerCredentials: { email: string; password: string | null; pin: string | null } | null = null;
      if (accessCheck.ok && appAccessMode !== "landing_page") {
        const ownerToken = issueOwnerSsoToken(brand, brandKey);
        const sep = storefrontUrl.includes("?") ? "&" : "?";
        ssoStoreAdminUrl = `${storefrontUrl}${sep}ssoToken=${encodeURIComponent(ownerToken)}#dashboard`;
      }
      if (accessCheck.ok) {
        const pin = brand.adminPin ? String(brand.adminPin).trim() : null;
        ownerCredentials = {
          email: String(brand.adminEmail || `owner@${brandKey}.t2.app`),
          password: pin ? `T2@${pin}` : null,
          pin,
        };
      }

      const isTrial = subWindow.subscriptionStatus === "trial" || planSpec.id === "trial_7d";
      const rawPlan = Array.isArray((brand as any).weekContentPlan) ? (brand as any).weekContentPlan : [];
      const normalizedPlan = rawPlan.map((p: any) => {
        const statusStr = String(p?.status || "").trim();
        const isSchedOrPub = ["scheduled", "published", "PUBLISHED"].includes(statusStr);
        const alreadyApproved =
          p?.clientApproval === "approved" ||
          Boolean(p?.approved) ||
          (isSchedOrPub && p?.clientApproval !== "revision_requested");
        if (alreadyApproved && p?.clientApproval !== "revision_requested") {
          return {
            ...p,
            clientApproval: "approved",
            approved: true,
          };
        }
        return p;
      });
      const {
        metaToken: _mt,
        adminPin: _ap,
        apiKey: _ak,
        webhookSecret: _ws,
        whatsappSession: _wses,
        fbPageAccessToken: _fbp,
        ...safeBrandFields
      } = brand as any;

      res.json({
        ok: true,
        brand: {
          ...safeBrandFields,
          weekContentPlan: normalizedPlan,
          metaConnected: Boolean(brand.metaPageId || brand.metaToken),
        },
        planSpec,
        appAccessMode,
        quota,
        subscriptionStatus: subWindow.subscriptionStatus,
        trialEndsAt: subWindow.trialEndsAt,
        trialDaysLeft: subWindow.trialDaysLeft,
        expiresAt: subWindow.expiresAt,
        portalAuthValid: accessCheck.ok,
        ssoStoreAdminUrl,
        ownerCredentials,
        trialPolicy: {
          isTrial,
          includedPostsCount: isTrial ? 2 : planSpec.monthlyDesignsQuota,
          includedReelsCount: isTrial ? 1 : planSpec.monthlyVideosQuota,
          maxRevisionsPerPost: isTrial ? 1 : 2,
          minUpgradeEgp: 5000,
        },
        upgradeUrl: `${publicBase}/pricing?brandId=${encodeURIComponent(brandKey)}`,
        portals: {
          studioShowroomUrl,
          agentDashboardUrl,
          agentFullDashboardUrl: agentDashboardUrl,
          storefrontUrl,
          ssoStoreAdminUrl,
          studioLandingPageUrl,
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Portal error" });
    }
  });

  app.post("/api/client-portal/:slug/account-manager", async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase();
      const userMsg = String(req.body?.message || "").trim();
      if (!userMsg) return res.status(400).json({ ok: false, error: "Message is required" });
      const brand: any = findMatchingBrandRecord(getUnifiedGrowthBrands(), slug);
      if (!brand) return res.status(404).json({ ok: false, error: "Brand not found" });

      const access = await verifyClientPortalWriteAccess(req, slug, brand);
      if (!access.ok) {
        return res.status(401).json({
          ok: false,
          error: "غير مصرح — يرجى فتح بوابة العميل عبر الرابط الموثق (?token=...) للتحدث مع مدير الحساب.",
        });
      }
      const subWindow = resolveBrandSubscriptionWindow(brand);
      const publicBase = (process.env.PUBLIC_BASE_URL || "https://t2os.app").replace(/\/+$/, "");
      if (access.actor !== "admin" && subWindow.subscriptionStatus === "expired") {
        return res.status(402).json({
          ok: false,
          expired: true,
          upgradeUrl: `${publicBase}/pricing?brandId=${encodeURIComponent(brand.slug || brand.id)}`,
          error: "انتهت صلاحية الاشتراك/التجربة — يرجى الترقية إلى باقة 5,000 ج.م أو أعلى لتفعيل مدير الحساب الذكي.",
        });
      }

      const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
      const normalizedHistory = rawHistory
        .map((m: any) => ({
          role: (m?.role === "assistant" || m?.role === "model" ? "model" : "user") as "user" | "model",
          text: String(m?.text || m?.content || ""),
        }))
        .filter((m: any) => m.text);
      const planItems = Array.isArray(brand.weekContentPlan) ? brand.weekContentPlan : [];
      const approvedCount = planItems.filter((p: any) => p?.clientApproval === "approved").length;
      const revisionCount = planItems.filter((p: any) => p?.clientApproval === "revision_requested").length;
      const quotaNow = getBrandMonthlyQuotaStatus(brand);
      const maxRevPerPost = subWindow.subscriptionStatus === "trial" ? 1 : 2;
      const liveAccountFacts = `[حقائق البراند الدقيقة الآن — التزم بها حرفياً ولا تذكر أي أرقام غيرها: المنشورات الجاهزة في صالة العرض (${planItems.length})، معتمد للنشر (${approvedCount})، مطلوب تعديل (${revisionCount})، الرصيد المتبقي (${quotaNow.designsRemaining} تصميم / ${quotaNow.videosRemaining} فيديو)، حد التعديل (${maxRevPerPost} لكل منشور)، حالة الواتساب (${brand.whatsappConnected ? "متصل" : "جاهز للربط بالكود"})، حالة فيسبوك (${brand.metaConnected || brand.metaPageId ? "مربوط" : "غير مربوط"})]. ممنوع ذكر أسماء داخلية مثل تيتو استوديو أو تيتو أجنت.`;
      const scopedPrompt = `[توجيه مدير الحساب المخصص للبراند "${brand.name}" (${brand.slug || brand.id}) فقط — ركز على هذا البراند بالكامل وممنوع ذكر أي براند آخر]:\n${liveAccountFacts}\nرسالة العميل: ${userMsg}`;
      const result = await runJarvisBrainConversation({
        message: scopedPrompt,
        history: normalizedHistory,
        persona: "client",
        selectedBrandId: brand.slug || brand.id,
        skipTts: true,
        ai: deps.getServerAI(),
        stats: deps.getRealEcosystemStats(),
        synthesizeSpeech: deps.synthesizeSovereignSpeech,
      });
      res.json({ ok: true, replyText: result?.replyText || "تم استلام طلبك وجاري المتابعة على حساب براندك." });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Account Manager error" });
    }
  });

  app.post("/api/client-portal/:slug/approve-post", async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase();
      const { postIndex, decision = "approved", feedback = "" } = req.body || {};
      const brand: any = findMatchingBrandRecord(getUnifiedGrowthBrands(), slug);
      if (!brand) return res.status(404).json({ ok: false, error: "Brand not found" });

      const access = await verifyClientPortalWriteAccess(req, slug, brand);
      if (!access.ok) {
        return res.status(401).json({
          ok: false,
          error: "غير مصرح — يرجى فتح بوابة العميل عبر الرابط الموثق (?token=...) لاعتماد المنشورات.",
        });
      }
      const subWindow = resolveBrandSubscriptionWindow(brand);
      const publicBase = (process.env.PUBLIC_BASE_URL || "https://t2os.app").replace(/\/+$/, "");
      if (access.actor !== "admin" && subWindow.subscriptionStatus === "expired") {
        return res.status(402).json({
          ok: false,
          expired: true,
          upgradeUrl: `${publicBase}/pricing?brandId=${encodeURIComponent(brand.slug || brand.id)}`,
          error: "انتهت صلاحية الاشتراك/التجربة — يرجى الترقية إلى باقة 5,000 ج.م أو أعلى لاعتماد المنشورات.",
        });
      }

      const plan = Array.isArray(brand.weekContentPlan) ? [...brand.weekContentPlan] : [];
      const idx = Number(postIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= plan.length) {
        return res.status(400).json({ ok: false, error: "Invalid postIndex" });
      }

      const isRevision = decision !== "approved";
      const planSpec = resolveBrandPlanSpec(brand);
      const isTrial = subWindow.subscriptionStatus === "trial" || planSpec.id === "trial_7d";
      const maxRevisions = isTrial ? 1 : Math.max(1, Number(planSpec.maxRevisionsPerPost || 2));
      const currentRevisions = Number(plan[idx]?.revisionCount || 0);

      if (isRevision && access.actor !== "admin" && currentRevisions >= maxRevisions) {
        return res.status(429).json({
          ok: false,
          limitReached: true,
          maxRevisions,
          upgradeUrl: `${publicBase}/pricing?brandId=${encodeURIComponent(brand.slug || brand.id)}`,
          error: isTrial
            ? "مسموح بطلب تعديل واحد (1) فقط لكل منشور خلال أسبوع التجربة المجانية لضمان استقرار الإنتاج. يمكنك الترقية لباقة النمو للحصول على تعديلات إضافية."
            : `تم استنفاد الحد الأقصى للتعديلات (${maxRevisions} تعديلات) لهذا المنشور في باقتك الحالية.`,
        });
      }

      const prevStatus = String(plan[idx]?.status || "");
      plan[idx] = {
        ...plan[idx],
        clientApproval: decision,
        approved: !isRevision,
        approvedAt: !isRevision ? (plan[idx]?.approvedAt || new Date().toISOString()) : plan[idx]?.approvedAt,
        clientFeedback: feedback,
        revisionCount: isRevision ? currentRevisions + 1 : currentRevisions,
        status: isRevision ? "revision_requested" : (prevStatus === "published" || prevStatus === "PUBLISHED" ? prevStatus : "scheduled"),
        updatedAt: new Date().toISOString(),
      };
      const updatedBrand =
        persistBrandUpdateAcrossEcosystem(brand.id || brand.slug, { weekContentPlan: plan }) ||
        { ...brand, weekContentPlan: plan };

      // Trigger non-blocking Studio regeneration when client requests a revision
      if (isRevision && feedback) {
        const studioBase = (process.env.TITO_STUDIO_URL || "https://studio.t2os.app").replace(/\/+$/, "");
        const studioKey = String(process.env.T2_REMOTE_API_KEY || process.env.TITO_STUDIO_API_KEY || "").trim();
        if (studioKey) {
          const item = plan[idx];
          fetch(`${studioBase}/api/execution/enqueue`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": studioKey },
            body: JSON.stringify({
              clinicId: String((brand as any).titoStudioClinicId || brand.id || brand.slug),
              brandName: brand.name || brand.slug,
              triggerSource: "client_portal_revision",
              notifyEzZelUrl: `${publicBase}/api/webhooks/studio-revision-complete`,
              items: [
                {
                  id: String(item?.firestoreDocId || `jarvis_${brand.id || brand.slug}_day_${idx + 1}`),
                  title: String(item?.hook || item?.title || `تعديل منشور ${idx + 1}`),
                  type: item?.mediaFormat === "video" ? "video" : "image",
                  caption: String(item?.caption || ""),
                  visualPrompt: `${String(item?.omniPrompt || item?.visualPrompt || item?.hook || "")}\n\n[تعديل العميل المطلوب]: ${feedback}`,
                  pillarLabel: String(item?.pillarLabel || "تعديل عميل"),
                  scheduledPlatforms: ["facebook", "instagram"],
                },
              ],
            }),
            signal: AbortSignal.timeout(6000),
          }).catch(() => {});
        }
      }

      res.json({ ok: true, post: plan[idx], brand: updatedBrand, maxRevisions });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Approval failed" });
    }
  });

  app.post("/api/client-portal/:slug/whatsapp-pair", async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase();
      const rawPhone = String(req.body?.phone || "").replace(/[^0-9]/g, "");
      if (rawPhone.length < 10) {
        return res.status(400).json({ ok: false, error: "يرجى إدخال رقم واتساب صحيح (10 أرقام على الأقل)." });
      }
      const brand: any = findMatchingBrandRecord(getUnifiedGrowthBrands(), slug);
      if (!brand) return res.status(404).json({ ok: false, error: "Brand not found" });

      const access = await verifyClientPortalWriteAccess(req, slug, brand);
      if (!access.ok) {
        return res.status(401).json({
          ok: false,
          error: "غير مصرح — يرجى فتح بوابة العميل عبر الرابط الموثق (?token=...) لربط الواتساب.",
        });
      }
      const subWindow = resolveBrandSubscriptionWindow(brand);
      if (access.actor !== "admin" && subWindow.subscriptionStatus === "expired") {
        return res.status(402).json({
          ok: false,
          expired: true,
          error: "انتهت فترة التجربة — يرجى الترقية إلى باقة 5,000 ج.م أو أعلى لإعادة ربط واتساب.",
        });
      }

      const { executeRealJarvisEcosystemAction } = await import("../services/obsidianVaultService");
      const result = await executeRealJarvisEcosystemAction({
        actionType: "CONNECT_WHATSAPP_PAIRING",
        brandId: brand.id || brand.slug || slug,
        data: { phone: rawPhone },
      });
      res.json({
        ok: Boolean(result?.success),
        pairingCode: result?.pairingCode || "",
        qrDataUrl: result?.qrDataUrl || "",
        liveBaileysConnected: Boolean(result?.liveBaileysConnected),
        message: result?.message || "تعذر توليد كود الربط حالياً",
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "WhatsApp pairing failed" });
    }
  });

  // Callback invoked by Tito Studio once a requested post revision finishes regenerating
  app.post("/api/webhooks/studio-revision-complete", async (req: Request, res: Response) => {
    try {
      const providedKey = String(req.headers["x-api-key"] || req.headers["x-t2-api-key"] || "").trim();
      const expectedKeys = [
        process.env.T2_REMOTE_API_KEY,
        process.env.TITO_STUDIO_API_KEY,
        process.env.ADMIN_API_SECRET,
        process.env.ADMIN_SECRET_KEY,
      ]
        .map((k) => String(k || "").trim())
        .filter(Boolean);
      const auth = await verifyAdminRequest(req);
      if (!auth.ok && (!providedKey || !expectedKeys.includes(providedKey))) {
        return res.status(401).json({ ok: false, error: "Unauthorized studio callback" });
      }

      const { clinicId, brandId, itemId, visualUrl, videoUrl, caption, hook } = req.body || {};
      const lookupId = String(brandId || clinicId || "").trim();
      if (!lookupId) return res.status(400).json({ ok: false, error: "brandId or clinicId is required" });

      const brands = getUnifiedGrowthBrands();
      const brand: any = findMatchingBrandRecord(brands, lookupId);
      if (!brand) return res.status(404).json({ ok: false, error: "Brand not found" });

      const plan = Array.isArray(brand.weekContentPlan) ? [...brand.weekContentPlan] : [];
      const targetIdx = plan.findIndex(
        (p: any) =>
          (itemId && String(p?.firestoreDocId || p?.id || "") === String(itemId)) ||
          p?.status === "revision_requested"
      );
      if (targetIdx >= 0) {
        plan[targetIdx] = {
          ...plan[targetIdx],
          ...(visualUrl ? { visualUrl: String(visualUrl) } : {}),
          ...(videoUrl ? { videoUrl: String(videoUrl) } : {}),
          ...(caption ? { caption: String(caption) } : {}),
          ...(hook ? { hook: String(hook) } : {}),
          status: "draft",
          clientApproval: "pending",
          updatedAt: new Date().toISOString(),
        };
        persistBrandUpdateAcrossEcosystem(brand.id || brand.slug, { weekContentPlan: plan });
      }

      // Notify brand owner on WhatsApp that the revised asset is ready in Showroom
      const waPhone = String(brand.whatsapp || brand.phone || "").replace(/\D/g, "");
      if (waPhone.length >= 10 && process.env.NODE_ENV !== "test") {
        const publicBase = (process.env.PUBLIC_BASE_URL || "https://t2os.app").replace(/\/+$/, "");
        const slug = String(brand.slug || brand.id);
        const portalLink = `${publicBase}/client/${encodeURIComponent(slug)}?token=${encodeURIComponent(signClientPortalToken(slug))}`;
        const agentBase = (process.env.T2_AGENT_API_URL || "https://agent.t2os.app").replace(/\/+$/, "");
        const agentKey = process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY || "";
        fetch(`${agentBase}/api/whatsapp/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(agentKey ? { "x-admin-key": agentKey } : {}),
          },
          body: JSON.stringify({
            brandId: slug,
            to: waPhone,
            message: `تم تحديث وتجهيز النسخة المعدلة من منشور "${brand.name || slug}" 🎨✅\nراجعها واعتمدها الآن من بوابة العميل:\n${portalLink}`,
          }),
          signal: AbortSignal.timeout(4000),
        }).catch(() => {});
      }

      return res.json({ ok: true, updatedIndex: targetIdx });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Revision callback failed" });
    }
  });
}
