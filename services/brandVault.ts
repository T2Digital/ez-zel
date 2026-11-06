/**
 * Sovereign Brand Vault for The Shadow (D:\ez-zel-)
 * Single Source of Truth unifying Tito Studio visual identities & Tito Agent operational bot data.
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
  source: 'studio' | 'agent' | 'unified';
  metaPageId?: string;
  metaPageToken?: string;
  phone: string;
  whatsapp: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  address?: string;
  botStatus?: 'CONNECTED' | 'DISCONNECTED' | 'READY';
  catalog: Record<string, any>;
  pricingRules?: Record<string, any>;
  servicesList?: ServiceItem[];
  systemPrompt?: string;
}

export const BRAND_VAULT: Record<string, BrandConfig> = {
  clean_master: {
    id: 'clean_master',
    name: 'كلين ماستر لخدمات النظافة والتعقيم',
    category: 'خدمات عامة وحجوزات',
    source: 'unified',
    metaPageId: '355285914324865',
    metaPageToken: 'EAAaEIxaL5OsBSZCSwZA9n1qkPw0UoQZCRqepPbpApFyRzwYcnJp8iHNVuoQSdDnqInAC8jolZAm2pDhH6K0wVc7ggfwKu8lFPt0qpvrHDzZAauB56WA7XCmPZBvQZBsryIu8bpftzT0mTAg4DjE5ZB9QiIvfnuuDZA9uZC2T0iv5noJc0bvAWaGoHsUEBxH2vAupflgSWJQiMwR7Ms4pOJHaQtcAY0mymrhnAZBBiGkSZBaUuwZDZD',
    phone: '01013373634',
    whatsapp: '01013373634',
    primaryColor: '#13343B',
    accentColor: '#21808D',
    logoUrl: 'https://i.ibb.co/f52dPHc/1000049048.jpg',
    address: 'المهندسين، الجيزة - تغطية القاهرة الكبرى',
    botStatus: 'CONNECTED',
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
        name: 'غسيل وتطهير أطقم الكنب والإنتريهات والمفروشات بالرغوة الجافة',
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

  alkhedr_car_rental: {
    id: 'alkhedr_car_rental',
    name: 'شركة الخضر لتأجير السيارات',
    category: 'تأجير سيارات ونقل سياحي',
    source: 'unified',
    phone: '+966112973666',
    whatsapp: '+966112973666',
    primaryColor: '#1E3A8A',
    accentColor: '#3B82F6',
    logoUrl: 'https://i.ibb.co/4p4Fqgq/khedr.jpg',
    address: 'الرياض، المملكة العربية السعودية / فروع القاهرة',
    botStatus: 'READY',
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

  battah_system: {
    id: 'battah_system',
    name: 'متجر بطاح لقطع غيار السيارات والكماليات',
    category: 'متجر إلكتروني وتجارة رقمية',
    source: 'unified',
    phone: '01013373634',
    whatsapp: '01013373634',
    primaryColor: '#B91C1C',
    accentColor: '#EF4444',
    logoUrl: 'https://i.ibb.co/L5kHjXz/battah.jpg',
    address: 'القاهرة، مصر - شحن فوري لكافة المحافظات',
    botStatus: 'READY',
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

  crystal_teeth: {
    id: 'crystal_teeth',
    name: 'عيادة كريستال لطب وزراعة الأسنان (فيصل)',
    category: 'رعاية صحية وطب أسنان',
    source: 'studio',
    phone: '01152751755',
    whatsapp: '01152751755',
    primaryColor: '#0D9488',
    accentColor: '#14B8A6',
    logoUrl: 'https://i.ibb.co/crystal-logo.jpg',
    address: 'شارع فيصل الرئيسي، الجيزة',
    catalog: {
      implant: { name: 'زراعة الأسنان الفورية الألمانية' },
      hollywoodSmile: { name: 'ابتسامة هوليود وفينير إيماكس سويسري' },
      whitening: { name: 'تبييض الأسنان بالليزر وجلسة تنظيف الجير' }
    }
  },

  almeshwar_rent_car: {
    id: 'almeshwar_rent_car',
    name: 'المشوار لتأجير السيارات',
    category: 'تأجير سيارات ونقل سياحي',
    source: 'studio',
    phone: '0112716060',
    whatsapp: '0112716060',
    primaryColor: '#D97706',
    accentColor: '#F59E0B',
    logoUrl: 'https://i.ibb.co/meshwar-logo.jpg',
    address: 'المملكة العربية السعودية',
    catalog: {
      luxuryFleet: { name: 'سيارات فارهة VIP مع سائق خاص' },
      monthlyRentals: { name: 'عقود تأجير شهرية وسنوية للشركات' }
    }
  },

  albaraka_motors: {
    id: 'albaraka_motors',
    name: 'البركة موتورز لتجارة السيارات',
    category: 'تجارة سيارات ومعارض',
    source: 'studio',
    phone: '01147418358',
    whatsapp: '01147418358',
    primaryColor: '#1F2937',
    accentColor: '#4B5563',
    logoUrl: '',
    address: 'القاهرة، مصر',
    catalog: {
      installmentCars: { name: 'برامج تقسيط السيارات المباشر بأقل مقدم' }
    }
  },

  kyan_store: {
    id: 'kyan_store',
    name: 'كيان للتجارة والتسوق الإلكتروني',
    category: 'متجر إلكتروني وتجارة رقمية',
    source: 'studio',
    phone: '01038690400',
    whatsapp: '01038690400',
    primaryColor: '#7C3AED',
    accentColor: '#8B5CF6',
    logoUrl: '',
    address: 'القاهرة، مصر',
    catalog: {
      products: { name: 'منتجات وأدوات منزلية وشخصية' }
    }
  },

  tito_media: {
    id: 'tito_media',
    name: 'T2 Media & Production Agency',
    category: 'إعلام وإنتاج رقمي وأتمتة',
    source: 'unified',
    phone: '01030956097',
    whatsapp: '01030956097',
    primaryColor: '#0F172A',
    accentColor: '#38BDF8',
    logoUrl: '',
    address: 'القاهرة، مصر',
    botStatus: 'READY',
    catalog: {
      saasBots: { name: 'بناء وإطلاق وكلاء الذكاء الاصطناعي للمؤسسات والشركات' },
      digitalMarketing: { name: 'حملات إعلانية ممولة وإدارة منصات السوشيال ميديا' }
    }
  }
};

export const getBrandConfig = (brandId: string): BrandConfig | undefined => {
  return BRAND_VAULT[brandId];
};

export const getAllBrands = (): BrandConfig[] => {
  return Object.values(BRAND_VAULT);
};
