/**
 * Universal Entity Schema (UES) for Products & Services
 * Single Source of Truth unifying:
 * 1. Tito AI Agent (Conversational WhatsApp/Meta Sales & Bookings)
 * 2. Tito Content Studio (Creative Campaigns, Hooks & Video Prompts)
 * 3. Client E-Commerce & PWA Web Apps (Direct Online Booking & Cart)
 */

export interface UniversalEntity {
  id: string;
  brandId: string;
  sku?: string;
  
  // 1. Unified Identity
  identity: {
    titleAr: string;
    titleEn?: string;
    category: 'dentistry' | 'car_rental' | 'cleaning' | 'ecommerce' | 'real_estate' | 'general';
    descriptionAr: string;
    descriptionEn?: string;
    badge?: string; // e.g. "الأكثر طلباً ⭐" | "خصم 10%" | "VIP"
    tags: string[];
    imageUrl?: string;
  };

  // 2. Strict Pricing & Economics
  economics: {
    basePrice: number;
    currency: 'EGP' | 'SAR' | 'AED' | 'USD';
    unit: string; // e.g. "جلسة", "يوم", "م²", "طقم", "قطعة"
    depositRequiredPct: number; // default 25%
    depositAmount: number;
    electronicDiscountPct: number; // default 10%
    discountedPrice: number;
    remainingAmount: number;
    isInstallmentAvailable?: boolean;
    installmentMonths?: number;
  };

  // 3. Tito Agent Execution Module (WhatsApp / Messenger / DMs)
  agentExecution: {
    salesPitchAr: string;
    requiredCustomerFields: string[]; // ["الاسم", "رقم الموبايل", "تاريخ الحجز", "طريقة السداد"]
    objectionHandlingAr?: string;
    closingQuestionAr: string;
    autoTriggerDepositRequest: boolean;
  };

  // 4. Tito Content Studio Marketing Module (Social Posts & Ads)
  studioMarketing: {
    hookHeadline: string;
    captionTemplate: string;
    visualFormat: '1:1_feed' | '9:16_story' | '9:16_reels' | 'carousel';
    targetKeywords: string[];
    suggestedHashtags: string[];
    callToActionType: 'WHATSAPP_MESSAGE' | 'MESSAGE_PAGE' | 'LEARN_MORE' | 'BOOK_NOW';
  };

  // 5. Client Web App & E-Commerce Module
  storeCommerce: {
    isAvailableOnline: boolean;
    inventoryCount?: number;
    bookingDurationMinutes?: number;
    directCheckoutUrl: string;
  };

  createdAt: string;
  updatedAt: string;
}

// --- UNIVERSAL SCHEMA CONVERTERS ---

/**
 * Converts a Universal Entity into the schema format required by Tito AI Agent
 */
export function toAgentProduct(entity: UniversalEntity) {
  return {
    id: entity.id,
    name: entity.identity.titleAr,
    price: `${entity.economics.basePrice} ${entity.economics.currency} / ${entity.economics.unit}`,
    unitPrice: entity.economics.basePrice,
    unit: entity.economics.unit,
    category: entity.identity.category,
    description: entity.agentExecution.salesPitchAr || entity.identity.descriptionAr,
    imageUrl: entity.identity.imageUrl,
    depositRequired: entity.economics.depositAmount,
    electronicDiscountPct: entity.economics.electronicDiscountPct,
    closingQuestion: entity.agentExecution.closingQuestionAr
  };
}

/**
 * Converts a Universal Entity into Tito Studio Service Catalog format
 */
export function toStudioService(entity: UniversalEntity) {
  return {
    id: entity.id,
    name: entity.identity.titleAr,
    category: entity.identity.category,
    price: `${entity.economics.basePrice} ${entity.economics.currency}`,
    hook: entity.studioMarketing.hookHeadline,
    caption: entity.studioMarketing.captionTemplate,
    format: entity.studioMarketing.visualFormat,
    cta: entity.studioMarketing.callToActionType,
    hashtags: entity.studioMarketing.suggestedHashtags
  };
}

/**
 * Converts a Universal Entity into Client Web App Store Item format
 */
export function toStoreItem(entity: UniversalEntity) {
  return {
    id: entity.id,
    title: entity.identity.titleAr,
    badge: entity.identity.badge,
    price: entity.economics.basePrice,
    discountedPrice: entity.economics.discountedPrice,
    currency: entity.economics.currency,
    unit: entity.economics.unit,
    description: entity.identity.descriptionAr,
    imageUrl: entity.identity.imageUrl,
    directCheckoutUrl: entity.storeCommerce.directCheckoutUrl,
    inStock: entity.storeCommerce.isAvailableOnline
  };
}

/**
 * Creates a Universal Entity with auto-calculated pricing rules (10% discount, 25% deposit)
 */
export function createUniversalEntity(params: {
  brandId: string;
  titleAr: string;
  category: UniversalEntity['identity']['category'];
  basePrice: number;
  currency?: 'EGP' | 'SAR' | 'AED' | 'USD';
  unit?: string;
  descriptionAr?: string;
  imageUrl?: string;
  salesPitch?: string;
  hookHeadline?: string;
  clientAppBaseUrl?: string;
}): UniversalEntity {
  const currency = params.currency || 'EGP';
  const unit = params.unit || 'جلسة / خدمة';
  const discountPct = 10;
  const depositPct = 25;
  const discountedPrice = Math.round(params.basePrice * (1 - discountPct / 100));
  const depositAmount = Math.round(discountedPrice * (depositPct / 100));
  const remainingAmount = discountedPrice - depositAmount;

  const entityId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const clientUrl = params.clientAppBaseUrl || `https://${params.brandId}.t2-client.vercel.app`;

  return {
    id: entityId,
    brandId: params.brandId,
    identity: {
      titleAr: params.titleAr,
      category: params.category,
      descriptionAr: params.descriptionAr || `أقوى عروض وخدمات ${params.titleAr} بأعلى جودة واحترافية.`,
      badge: 'خصم 10% إلكتروني ⭐',
      tags: [params.category, 'عرض_خاص', 'حجز_فوري'],
      imageUrl: params.imageUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80'
    },
    economics: {
      basePrice: params.basePrice,
      currency,
      unit,
      depositRequiredPct: depositPct,
      depositAmount,
      electronicDiscountPct: discountPct,
      discountedPrice,
      remainingAmount
    },
    agentExecution: {
      salesPitchAr: params.salesPitch || `عرض خاص لـ ${params.titleAr} بسعر ${params.basePrice} ${currency}، ومع السداد الإلكتروني ليك خصم فوري 10% وبتدفع عربون 25% فقط لتأكيد الموعد.`,
      requiredCustomerFields: ['الاسم بالكامل', 'رقم الموبايل', 'تاريخ ووقت الزيارة أو الاستلام'],
      closingQuestionAr: `تحب نثبت لحضرتك موعد الحجز ونبعت لك كود الإنستاباي للاستفادة من الخصم؟`,
      autoTriggerDepositRequest: true
    },
    studioMarketing: {
      hookHeadline: params.hookHeadline || `فخامة واحترافية لا مثيل لها - احجز ${params.titleAr} واستمتع بخصم فوري!`,
      captionTemplate: `استمتع بأعلى معايير الجودة مع ${params.titleAr}. فريق متخصص ومتابعة مستمرة 24 ساعة عبر الذكاء الاصطناعي. احجز الآن أونلاين.`,
      visualFormat: '1:1_feed',
      targetKeywords: [params.category, 'حجز_فوري', 'عروض_حصرية'],
      suggestedHashtags: [`#${params.titleAr.replace(/\s+/g, '_')}`, '#عروض_مصرية', '#حجز_فوري', '#ذكاء_اصطناعي'],
      callToActionType: 'WHATSAPP_MESSAGE'
    },
    storeCommerce: {
      isAvailableOnline: true,
      bookingDurationMinutes: 45,
      directCheckoutUrl: `${clientUrl}/book?id=${entityId}`
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
