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
      '8 تصميمات جرافيك احترافية شهرياً من تيتو ستوديو',
      '2 فيديو إعلاني/ريلز شهرياً (Omni Flash / Veo)',
      'لاندنج بيدج تحويلية احترافية من تيتو ستوديو مربوطة بواتساب والبيكسل',
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
    nameAr: 'باقة المؤسسات (20,000 ج.م / شهر)',
    priceEgp: 20000,
    adsBudgetEgp: 10000,
    systemFeeEgp: 10000,
    monthlyDesignsQuota: 45,
    monthlyVideosQuota: 12,
    appAccessMode: 'full_app',
    featuresAr: [
      '50% ميزانية إعلانات ممولة مُدارة (10,000 ج.م) + 50% سيستم وأجنت (10,000 ج.م)',
      'تطبيق ويب متكامل + إدارة حملات متعددة المنصات',
      '45 تصميم جرافيك شهرياً + 12 فيديو إعلاني',
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
      'إنتاج محتوى وفيديو غير محدود حسب الطلب',
      'تطبيق ويب مستقل بالكامل + دومين مخصص',
      'مدير حساب وفريق تشغيل مخصص',
    ],
  },
};

export function resolveBrandPlanSpec(brand: any): SaasPlanSpec {
  const rawPlan = String(brand?.planId || brand?.subscriptionPlan || '').toLowerCase();
  const amount = Number(brand?.planAmount || brand?.monthlyRevenue || 0);

  if (rawPlan.includes('sovereign') || rawPlan.includes('50000') || amount >= 50000) {
    return SAAS_PLANS.sovereign_50000;
  }
  if (rawPlan.includes('enterprise') || rawPlan.includes('20000') || (amount >= 20000 && amount < 50000)) {
    return SAAS_PLANS.enterprise_20000;
  }
  if (rawPlan.includes('pro') || rawPlan.includes('10000') || (amount >= 10000 && amount < 20000)) {
    return SAAS_PLANS.pro_10000;
  }
  if (rawPlan.includes('growth') || rawPlan.includes('5000') || (amount >= 5000 && amount < 10000)) {
    return SAAS_PLANS.growth_5000;
  }
  if (rawPlan.includes('starter') || rawPlan.includes('2500') || (amount > 0 && amount < 5000)) {
    return SAAS_PLANS.starter_2500;
  }
  return SAAS_PLANS.trial_7d;
}

export function resolveBrandAppAccessMode(brand: any): 'full_app' | 'landing_page' {
  if (brand?.forceFullApp === true) return 'full_app';
  const plan = resolveBrandPlanSpec(brand);
  return plan.appAccessMode;
}
