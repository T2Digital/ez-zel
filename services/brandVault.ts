/**
 * Sovereign Brand Vault for The Shadow (D:\ez-zel-)
 * Single Source of Truth matching live production brands from Tito Agent & Tito Studio.
 */

export interface ServiceItem {
  id: string;
  name: string;
  price: string;
  description?: string;
  imageUrl?: string;
}

export interface BrandConfig {
  id: string;
  name: string;
  category: string;
  source: 'agent' | 'studio' | 'unified';
  status: 'شغال' | 'متوقف';
  conversationsCount: number;
  phone: string;
  whatsapp: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  address?: string;
  subscriptionPlan: 'VIP غير محدود' | 'تجربة مجانية 7 أيام';
  catalog: Record<string, any>;
  pricingRules?: Record<string, any>;
  systemPrompt?: string;
  knowledgeText?: string;
}

export const BRAND_VAULT: Record<string, BrandConfig> = {
  // 1. كلين ماستر (شغال - 221 محادثة لايف)
  clean_master: {
    id: 'clean_master',
    name: 'كلين ماستر لخدمات النظافة والتعقيم',
    category: 'خدمات تنظيف ومنازل',
    source: 'unified',
    status: 'شغال',
    conversationsCount: 221,
    phone: '01013373634',
    whatsapp: '201013373634',
    primaryColor: '#13343B',
    accentColor: '#21808D',
    logoUrl: 'https://i.ibb.co/f52dPHc/1000049048.jpg',
    address: 'المهندسين، الجيزة - تغطية القاهرة الكبرى',
    subscriptionPlan: 'VIP غير محدود',
    catalog: {
      mosqueCarpets: {
        name: 'غسيل سجاد وموكيت المساجد ودور العبادة بالبخار الحار',
        pricePerMeter: 7,
        unit: 'ج.م / م²'
      },
      homeDeepCleaning: {
        name: 'تنظيف وتطهير المنازل والشقق بالمتر المربع',
        standardCleaning: 10,
        finishingCleaning: 13,
        deepCleaning: 14,
        unit: 'ج.م / م²'
      },
      sofaUpholstery: {
        name: 'غسيل وتطهير أطقم الكنب والإنتريهات بالرغوة الجافة',
        pricePerSet: 450,
        unit: 'ج.م / طقم'
      }
    },
    pricingRules: {
      minimumOrder: 300,
      inspectionFee: 0,
      currency: 'EGP',
      paymentMethods: ['InstaPay', 'Vodafone Cash', 'Cash on Delivery']
    }
  },

  // 2. Sale Gates Egypt (شغال - 59 محادثة لايف)
  besho: {
    id: 'besho',
    name: 'Sale Gates Egypt',
    category: 'منصة بيع وعقارات',
    source: 'agent',
    status: 'شغال',
    conversationsCount: 59,
    phone: '011111462944',
    whatsapp: '201111462944',
    primaryColor: '#059669',
    accentColor: '#10B981',
    address: 'القاهرة، مصر - مشروعات العاصمة والشيخ زايد والتجمع',
    subscriptionPlan: 'VIP غير محدود',
    catalog: {
      apartments: { name: 'شقق ووحدات سكنية بكمبوندات راقية مع أنظمة سداد' },
      commercial: { name: 'محلات ومكاتب تجارية وإدارية ذات عائد إيجاري' },
      villas: { name: 'فيلات وتاون هاوس تسليم فوري وتقسيط مباشر' }
    },
    systemPrompt: 'أنت المستشار العقاري الذكي لمنصة Sale Gates Egypt. تجيب على العملاء وتجمع متطلبات الوحدة والميزانية وترتب المعاينات.'
  },

  // 3. متجر بطاح (VIP غير محدود)
  battah_system: {
    id: 'battah_system',
    name: 'متجر بطاح لقطع غيار السيارات والكماليات',
    category: 'تجارة إلكترونية وقطع غيار',
    source: 'unified',
    status: 'متوقف',
    conversationsCount: 0,
    phone: '01013373634',
    whatsapp: '201013373634',
    primaryColor: '#B91C1C',
    accentColor: '#EF4444',
    logoUrl: 'https://i.ibb.co/L5kHjXz/battah.jpg',
    address: 'القاهرة، مصر - شحن فوري لكافة المحافظات',
    subscriptionPlan: 'VIP غير محدود',
    catalog: {
      brakePads: { name: 'تيل فرامل أصلي معتمد', discount: '10% دفع إلكتروني مسبق' },
      engineFilters: { name: 'فلاتر زيت وهواء وتكييف معتمدة', discount: '10% فوري' },
      sparkPlugs: { name: 'بوجيهات إيريديوم ليزر وسير كاتينة ألماني', discount: '10% فوري' }
    },
    pricingRules: {
      currency: 'EGP',
      prepayDiscountPercent: 10,
      deliveryTimeHours: '24-48 ساعة'
    }
  },

  // 4. شركة الخضر لتأجير السيارات (VIP غير محدود)
  alkhedr_car_rental: {
    id: 'alkhedr_car_rental',
    name: 'شركة الخضر لتأجير السيارات',
    category: 'تأجير سيارات وسياحة',
    source: 'unified',
    status: 'متوقف',
    conversationsCount: 0,
    phone: '+966112973666',
    whatsapp: '+966112973666',
    primaryColor: '#1E3A8A',
    accentColor: '#3B82F6',
    logoUrl: 'https://i.ibb.co/4p4Fqgq/khedr.jpg',
    address: 'الرياض، المملكة العربية السعودية / فروع القاهرة',
    subscriptionPlan: 'VIP غير محدود',
    catalog: {
      elantraCN7: {
        name: 'هيونداي إلنترا CN7 موديل 2024',
        dailyRate: 800,
        weeklyRate: 5000,
        features: 'أوتوماتيك، شاشة، كاميرا، فرش جلد، تسليم فوري'
      },
      kiaCerato: {
        name: 'كيا سيراتو 2024',
        dailyRate: 750,
        weeklyRate: 4800,
        features: 'اقتصادية بالبنزين، عائلية، عداد مفتوح للعقود الأسبوعية'
      },
      toyotaFortuner: {
        name: 'تويوتا فورتشنر 4x4',
        dailyRate: 1800,
        weeklyRate: 11500,
        features: 'دفع رباعي 7 ركاب، مثالية للسفر والمشاوير الصحراوية'
      }
    },
    pricingRules: {
      currency: 'SAR / EGP',
      insuranceDepositRequired: true
    }
  },

  // 5. بركة موتورز
  baraka_motors: {
    id: 'baraka_motors',
    name: 'بركة موتورز',
    category: 'تجارة سيارات ومعارض',
    source: 'unified',
    status: 'متوقف',
    conversationsCount: 0,
    phone: '01147418358',
    whatsapp: '01147418358',
    primaryColor: '#1F2937',
    accentColor: '#4B5563',
    address: 'القاهرة، مصر',
    subscriptionPlan: 'تجربة مجانية 7 أيام',
    catalog: {
      installmentCars: { name: 'برامج تقسيط السيارات المباشر بأقل مقدم' }
    },
    systemPrompt: 'أنت المساعد الذكي لشركة بركة موتورز لتجارة وتأجير السيارات.',
    knowledgeText: 'معرض بركة موتورز يقدم أفضل عروض التقسيط والتأجير للسيارات الحديثة.'
  },

  // 6. T2 Digital
  'T2-Digital': {
    id: 'T2-Digital',
    name: 'T2 Digital',
    category: 'إعلام وتسويق ونمو رقمي',
    source: 'unified',
    status: 'متوقف',
    conversationsCount: 0,
    phone: '01030956097',
    whatsapp: '01030956097',
    primaryColor: '#0F172A',
    accentColor: '#38BDF8',
    address: 'القاهرة، مصر',
    subscriptionPlan: 'تجربة مجانية 7 أيام',
    catalog: {
      saasBots: { name: 'بناء وإطلاق وكلاء الذكاء الاصطناعي للمؤسسات والشركات' },
      digitalMarketing: { name: 'حملات إعلانية ممولة وإدارة منصات السوشيال ميديا' }
    },
    systemPrompt: 'أنت اسمك تيتو، تعمل كمطور أعمال وخبير النمو والتسويق الرقمي.',
    knowledgeText: 'البراندنج وتأسيس الهوية التجارية بالكامل، التواجد الإلكتروني، وإدارة الحملات الإعلانية الممولة واستراتيجيات النمو.'
  }
};

export const getBrandConfig = (brandId: string): BrandConfig | undefined => {
  return BRAND_VAULT[brandId];
};

export const getAllBrands = (): BrandConfig[] => {
  return Object.values(BRAND_VAULT);
};
