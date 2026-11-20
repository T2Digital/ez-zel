import { readPersistentJson, savePersistentJson } from './persistentStorage';

export type SaasPlanId =
  | 'trial_7d'
  | 'starter_2500'
  | 'growth_5000'
  | 'pro_10000'
  | 'enterprise_20000'
  | 'sovereign_50000';

export interface SaasPlanSpec {
  id: SaasPlanId;
  nameAr: string;
  priceEgp: number;
  adsBudgetEgp: number; // 50% dedicated Meta/TikTok/Google ads budget
  systemFeeEgp: number; // 50% system, AI agent & studio production
  monthlyDesignsQuota: number; // -1 = unlimited
  monthlyVideosQuota: number;  // -1 = unlimited
  appAccessMode: 'full_app' | 'landing_page';
  featuresAr: string[];
}

export const SAAS_PLANS: Record<SaasPlanId, SaasPlanSpec> = {
  trial_7d: {
    id: 'trial_7d',
    nameAr: 'التجربة المجانية الكاملة (7 أيام)',
    priceEgp: 0,
    adsBudgetEgp: 0,
    systemFeeEgp: 0,
    monthlyDesignsQuota: 5,
    monthlyVideosQuota: 2,
    appAccessMode: 'full_app',
    featuresAr: [
      'تطبيق ويب كامل (PWA + متجر/حجوزات + فاتورة) مفتوح طوال فترة التجربة',
      'خطة محتوى أول أسبوع (5 تصميمات + 2 فيديو)',
      'تجربة وكيل المبيعات والواتساب 24/7',
    ],
  },
  starter_2500: {
    id: 'starter_2500',
    nameAr: 'باقة الانطلاق (2,500 ج.م / شهر)',
    priceEgp: 2500,
    adsBudgetEgp: 1250,
    systemFeeEgp: 1250,
    monthlyDesignsQuota: 8,
    monthlyVideosQuota: 2,
    appAccessMode: 'landing_page',
    featuresAr: [
      '50% ميزانية إعلانات ممولة مُدارة (1,250 ج.م) + 50% سيستم وأجنت (1,250 ج.م)',
      '8 تصميمات سوشيال احترافية شهرياً عبر تيتو ستوديو',
      '2 فيديو ريلز ترويجي شهرياً (Omni Flash)',
      'صفحة هبوط بيعية تحويلية (Landing Page) احترافية من تيتو ستوديو مربوطة بواتساب والبيكسل',
      'وكيل مبيعات ذكي 24/7 (واتساب + سوشيال)',
    ],
  },
  growth_5000: {
    id: 'growth_5000',
    nameAr: 'باقة النمو (5,000 ج.م / شهر)',
    priceEgp: 5000,
    adsBudgetEgp: 2500,
    systemFeeEgp: 2500,
    monthlyDesignsQuota: 16,
    monthlyVideosQuota: 4,
    appAccessMode: 'full_app',
    featuresAr: [
      '50% ميزانية إعلانات ممولة مُدارة (2,500 ج.م) + 50% سيستم وأجنت (2,500 ج.م)',
      'تطبيق ويب متكامل (PWA + ERP/POS + سلة + فواتير مطبوعة + SEO/GEO)',
      '16 تصميم جرافيك احترافي شهرياً',
      '4 فيديوهات إعلانية/ريلز شهرياً',
      'وكيل مبيعات ذكي 24/7 + ربط كامل للبكسلات والتحليلات',
    ],
  },
  pro_10000: {
    id: 'pro_10000',
    nameAr: 'باقة البرو (10,000 ج.م / شهر)',
    priceEgp: 10000,
    adsBudgetEgp: 5000,
    systemFeeEgp: 5000,
    monthlyDesignsQuota: 30,
    monthlyVideosQuota: 8,
    appAccessMode: 'full_app',
    featuresAr: [
      '50% ميزانية إعلانات ممولة مُدارة (5,000 ج.م) + 50% سيستم وأجنت (5,000 ج.م)',
      'تطبيق ويب متكامل متعدد الفروع والموظفين',
      '30 تصميم جرافيك شهرياً (محتوى يومي)',
      '8 فيديوهات إعلانية شهرياً',
    ],
  },
  enterprise_20000: {
    id: 'enterprise_20000',
    nameAr: 'باقة المؤسسات والهيمنة VIP (25,000 ج.م / شهر)',
    priceEgp: 25000,
    adsBudgetEgp: 12500,
    systemFeeEgp: 12500,
    monthlyDesignsQuota: 45,
    monthlyVideosQuota: 16,
    appAccessMode: 'full_app',
    featuresAr: [
      '50% ميزانية إعلانات ممولة مُدارة (12,500 ج.م) + 50% سيستم وأجنت (12,500 ج.م)',
      'تطبيق ويب متكامل + إدارة حملات متعددة المنصات',
      '45 تصميم جرافيك شهرياً + 16 فيديو إعلاني',
      'تقارير أداء أسبوعية وأولوية دعم',
    ],
  },
  sovereign_50000: {
    id: 'sovereign_50000',
    nameAr: 'الباقة السيادية (50,000 ج.م / شهر)',
    priceEgp: 50000,
    adsBudgetEgp: 25000,
    systemFeeEgp: 25000,
    monthlyDesignsQuota: -1,
    monthlyVideosQuota: -1,
    appAccessMode: 'full_app',
    featuresAr: [
      '50% ميزانية إعلانات ممولة مُدارة (25,000 ج.م) + 50% سيستم وأجنت (25,000 ج.م)',
      'إنتاج محتوى وفيديو غير محدود حسب الطلب — أولوية قصوى 60+ تصميم و32+ فيديو شهرياً',
      'تطبيق ويب مستقل بالكامل + دومين مخصص',
      'مدير حساب وفريق تشغيل مخصص',
    ],
  },
};

export function getDynamicSaasPlans(): Record<string, SaasPlanSpec> {
  const overrides = readPersistentJson<Record<string, Partial<SaasPlanSpec>>>('t2_saas_plans_override.json', {});
  const merged: Record<string, SaasPlanSpec> = { ...SAAS_PLANS };
  if (overrides && typeof overrides === 'object') {
    for (const [key, patch] of Object.entries(overrides)) {
      if (!patch || typeof patch !== 'object') continue;
      if (merged[key]) {
        merged[key] = { ...merged[key], ...patch };
      } else if (patch.id && patch.nameAr) {
        merged[key] = patch as SaasPlanSpec;
      }
    }
  }
  return merged;
}

export function saveDynamicSaasPlans(updates: Record<string, Partial<SaasPlanSpec>>): Record<string, SaasPlanSpec> {
  const currentOverrides = readPersistentJson<Record<string, Partial<SaasPlanSpec>>>('t2_saas_plans_override.json', {});
  const nextOverrides: Record<string, Partial<SaasPlanSpec>> = { ...currentOverrides };
  for (const [planId, patch] of Object.entries(updates || {})) {
    if (!patch || typeof patch !== 'object') continue;
    nextOverrides[planId] = { ...(nextOverrides[planId] || {}), ...patch };
  }
  savePersistentJson('t2_saas_plans_override', 't2_saas_plans_override.json', nextOverrides);
  return getDynamicSaasPlans();
}

export function resolveBrandPlanSpec(brand: any): SaasPlanSpec {
  const plans = getDynamicSaasPlans();
  const rawPlan = String(brand?.planId || brand?.subscriptionPlan || '').toLowerCase();
  const amount = Number(brand?.planAmount || brand?.monthlyRevenue || 0);

  if (rawPlan && plans[rawPlan]) return plans[rawPlan];
  if (rawPlan.includes('sovereign') || rawPlan.includes('50000') || amount >= (plans.sovereign_50000?.priceEgp || 50000)) {
    return plans.sovereign_50000 || SAAS_PLANS.sovereign_50000;
  }
  if (rawPlan.includes('enterprise') || rawPlan.includes('25000') || rawPlan.includes('20000') || (amount >= (plans.enterprise_20000?.priceEgp || 25000) && amount < (plans.sovereign_50000?.priceEgp || 50000))) {
    return plans.enterprise_20000 || SAAS_PLANS.enterprise_20000;
  }
  if (rawPlan.includes('pro') || rawPlan.includes('10000') || (amount >= (plans.pro_10000?.priceEgp || 10000) && amount < (plans.enterprise_20000?.priceEgp || 25000))) {
    return plans.pro_10000 || SAAS_PLANS.pro_10000;
  }
  if (rawPlan.includes('growth') || rawPlan.includes('5000') || (amount >= (plans.growth_5000?.priceEgp || 5000) && amount < (plans.pro_10000?.priceEgp || 10000))) {
    return plans.growth_5000 || SAAS_PLANS.growth_5000;
  }
  if (rawPlan.includes('starter') || rawPlan.includes('2500') || (amount > 0 && amount < (plans.growth_5000?.priceEgp || 5000))) {
    return plans.starter_2500 || SAAS_PLANS.starter_2500;
  }
  return plans.trial_7d || SAAS_PLANS.trial_7d;
}

export function resolveBrandAppAccessMode(brand: any): 'full_app' | 'landing_page' {
  if (brand?.forceFullApp === true) return 'full_app';
  const plan = resolveBrandPlanSpec(brand);
  return plan.appAccessMode;
}

export interface BrandQuotaUsageRecord {
  brandId: string;
  monthKey: string;
  designsUsed: number;
  videosUsed: number;
  updatedAt: string;
}

const QUOTA_STORE_FILE = 't2_brand_monthly_quotas.json';

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function normalizeQuotaBrandId(brandOrId: any): string {
  const raw = typeof brandOrId === 'string' ? brandOrId : (brandOrId?.id || brandOrId?.slug || 'default');
  return String(raw || 'default').trim().toLowerCase();
}

export function getBrandMonthlyQuotaStatus(brand: any): {
  brandId: string;
  monthKey: string;
  planId: SaasPlanId;
  planNameAr: string;
  appAccessMode: 'full_app' | 'landing_page';
  designsQuota: number;
  designsUsed: number;
  designsRemaining: number;
  videosQuota: number;
  videosUsed: number;
  videosRemaining: number;
} {
  const brandId = normalizeQuotaBrandId(brand);
  const monthKey = currentMonthKey();
  const plan = resolveBrandPlanSpec(brand);
  const store = readPersistentJson<Record<string, BrandQuotaUsageRecord>>(QUOTA_STORE_FILE, {});
  const key = `${brandId}:${monthKey}`;
  const rec = store[key] || { brandId, monthKey, designsUsed: 0, videosUsed: 0, updatedAt: '' };
  const designsRemaining = plan.monthlyDesignsQuota < 0 ? 9999 : Math.max(0, plan.monthlyDesignsQuota - rec.designsUsed);
  const videosRemaining = plan.monthlyVideosQuota < 0 ? 9999 : Math.max(0, plan.monthlyVideosQuota - rec.videosUsed);
  return {
    brandId,
    monthKey,
    planId: plan.id,
    planNameAr: plan.nameAr,
    appAccessMode: resolveBrandAppAccessMode(brand),
    designsQuota: plan.monthlyDesignsQuota,
    designsUsed: rec.designsUsed,
    designsRemaining,
    videosQuota: plan.monthlyVideosQuota,
    videosUsed: rec.videosUsed,
    videosRemaining,
  };
}

export function consumeBrandMonthlyQuota(
  brand: any,
  kind: 'design' | 'video',
  amount = 1
): { allowed: boolean; status: ReturnType<typeof getBrandMonthlyQuotaStatus>; reason?: string } {
  const status = getBrandMonthlyQuotaStatus(brand);
  const count = Math.max(1, Number(amount) || 1);

  if (kind === 'design' && status.designsQuota >= 0 && status.designsUsed + count > status.designsQuota) {
    return {
      allowed: false,
      status,
      reason: `تم استهلاك حصة التصميمات الشهرية لباقة ${status.planNameAr} (${status.designsUsed}/${status.designsQuota}). قم بالترقية لزيادة الحصة.`,
    };
  }
  if (kind === 'video' && status.videosQuota >= 0 && status.videosUsed + count > status.videosQuota) {
    return {
      allowed: false,
      status,
      reason: `تم استهلاك حصة الفيديوهات الشهرية لباقة ${status.planNameAr} (${status.videosUsed}/${status.videosQuota}). قم بالترقية لزيادة الحصة.`,
    };
  }

  const store = readPersistentJson<Record<string, BrandQuotaUsageRecord>>(QUOTA_STORE_FILE, {});
  const key = `${status.brandId}:${status.monthKey}`;
  const current = store[key] || {
    brandId: status.brandId,
    monthKey: status.monthKey,
    designsUsed: 0,
    videosUsed: 0,
    updatedAt: new Date().toISOString(),
  };
  if (kind === 'design') current.designsUsed += count;
  else current.videosUsed += count;
  current.updatedAt = new Date().toISOString();
  store[key] = current;
  savePersistentJson('t2_brand_monthly_quotas', QUOTA_STORE_FILE, store);

  return { allowed: true, status: getBrandMonthlyQuotaStatus(brand) };
}

/**
 * Rolls back consumed monthly quota if content/image/video generation fails or times out.
 */
export function refundBrandMonthlyQuota(
  brand: any,
  kind: 'design' | 'video',
  amount = 1
): ReturnType<typeof getBrandMonthlyQuotaStatus> {
  const status = getBrandMonthlyQuotaStatus(brand);
  const count = Math.max(1, Number(amount) || 1);
  const store = readPersistentJson<Record<string, BrandQuotaUsageRecord>>(QUOTA_STORE_FILE, {});
  const key = `${status.brandId}:${status.monthKey}`;
  const current = store[key];
  if (current) {
    if (kind === 'design') {
      current.designsUsed = Math.max(0, (Number(current.designsUsed) || 0) - count);
    } else {
      current.videosUsed = Math.max(0, (Number(current.videosUsed) || 0) - count);
    }
    current.updatedAt = new Date().toISOString();
    store[key] = current;
    savePersistentJson('t2_brand_monthly_quotas', QUOTA_STORE_FILE, store);
  }
  return getBrandMonthlyQuotaStatus(brand);
}
