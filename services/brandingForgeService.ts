import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export interface BrandingForgeInput {
    brandName: string;
    category?: string;
    targetAudience?: string;
    phone?: string;
    isNewBusiness?: boolean;
    currentAssets?: {
        hasWebsite?: boolean;
        hasSocialPages?: boolean;
        hasLogo?: boolean;
        socialUrls?: string;
    };
}

export interface SocialPageKit {
    platform: 'facebook' | 'instagram' | 'tiktok';
    title: string;
    category: string;
    bio: string;
    callToAction: string;
    visualDirection: string;
    hashtags: string[];
}

export interface TrialPlanPost {
    day: string;
    type: 'image_feed' | 'video_reels' | 'conversion_offer';
    formatName: string;
    hook: string;
    caption: string;
    visualPrompt: string;
    bestTime: string;
    callToAction: string;
}

export interface BrandingKitResult {
    brandId: string;
    brandName: string;
    englishName: string;
    category: string;
    slogan: string;
    essence: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
    logoPrompt: string;
    socialKits: {
        facebook: SocialPageKit;
        instagram: SocialPageKit;
        tiktok: SocialPageKit;
    };
    trialContentPlan: TrialPlanPost[];
    recommendedNextStep: string;
}

function getGeminiClient(): GoogleGenAI {
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!key) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }
    return new GoogleGenAI({
        apiKey: key,
        httpOptions: {
            headers: {
                'User-Agent': 'aistudio-build'
            }
        }
    });
}

export async function generateBrandingAndSocialKit(input: BrandingForgeInput): Promise<BrandingKitResult> {
    const brandName = input.brandName?.trim() || 'براند جديد';
    const category = input.category || 'نشاط تجاري وخدمات';
    const targetAudience = input.targetAudience || 'العملاء المهتمين بالجودة والسرعة في مصر والشرق الأوسط';
    const phone = input.phone || '01013372674';
    const isNew = input.isNewBusiness !== false;

    const brandId = brandName
        .toLowerCase()
        .replace(/[^\w\u0621-\u064A]+/g, '_')
        .replace(/^_+|_+$/g, '') || `brand_${Date.now()}`;

    let aiPrompt = `أنت خبير بناء البراندات والاستراتيجيات التسويقية الأول في العالم العربي ومصر.
المطلوب تأسيس "حقيبة براندينج وتجهيز صفحات فيسبوك وإنستجرام وتيك توك" كاملة وفائقة الاحترافية للمشروع التالي:
- اسم المشروع: "${brandName}"
- تصنيف النشاط: "${category}"
- الجمهور المستهدف: "${targetAudience}"
- رقم التواصل والواتساب: "${phone}"
- حالة المشروع: ${isNew ? 'مشروع جديد ينطلق من الصفر' : 'بيزنس قائم ويحتاج تطوير هوية وزيادة مبيعات'}

المطلوب إخراج النتيجة بتنسيق JSON نظيف وصارم بدون أي نصوص قبل أو بعد:
{
  "brandName": "${brandName}",
  "englishName": "الاسم بالإنجليزية بحروف أنيقة",
  "category": "${category}",
  "slogan": "شعار لفظي بيعي رنان وجذاب لا يتجاوز 6 كلمات",
  "essence": "رسالة البراند والقيمة الفريدة في سطرين",
  "colors": {
    "primary": "#كود_لون_رئيسي_Hex",
    "secondary": "#كود_لون_ثانوي_Hex",
    "accent": "#كود_لون_تأكيدي_Hex",
    "background": "#020617"
  },
  "logoPrompt": "برومبت إنجليزي فائق الدقة لتوليد لوجو حديث ومينيمال على Flux / Gemini",
  "socialKits": {
    "facebook": {
      "platform": "facebook",
      "title": "اسم صفحة فيسبوك الرسمية",
      "category": "فئة الصفحة الرسمية بميتا",
      "bio": "وصف الـ About للصفحة جذاب ويشمل المزايا ورقم الواتساب ورابط الحجز",
      "callToAction": "إرسال رسالة واتساب",
      "visualDirection": "توجيه صورة الغلاف والبروفيل",
      "hashtags": ["هاشتاجات", "فيسبوك"]
    },
    "instagram": {
      "platform": "instagram",
      "title": "اسم الحساب المقترح",
      "category": "التصنيف المقترح",
      "bio": "بايو إنستجرام جذاب مقسم لأسطر مع إيموجيز واضحة لا يتجاوز 150 حرف ويختم برابط المتجر/الواتساب",
      "callToAction": "تواصل عبر الرابط في البايو",
      "visualDirection": "ستايل الـ Grid والهايلايت",
      "hashtags": ["#هاشتاج1", "#هاشتاج2"]
    },
    "tiktok": {
      "platform": "tiktok",
      "title": "اسم قناة تيك توك",
      "category": "تصنيف المحتوى",
      "bio": "بايو تيك توك سريع وجذاب يركز على الفائدة والتواصل الفوري",
      "callToAction": "رابط الواتساب بالبايو",
      "visualDirection": "ستايل الفيديوهات السريعة والـ Hook البصري أول 3 ثواني",
      "hashtags": ["#تيك_توك", "#تريند"]
    }
  },
  "trialContentPlan": [
    {
      "day": "السبت",
      "type": "image_feed",
      "formatName": "بوست تصميم Feed (1:1)",
      "hook": "عنوان إعلاني صاعق لجذب العميل وحثه على الشراء أو الحجز",
      "caption": "نص الكابشن الكامل مقنع وسلس وينتهي بدعوة واضحة للحجز عبر واتساب أو التطبيق",
      "visualPrompt": "برومبت إنجليزي لتوليد تصميم الصورة في تيتو ستوديو",
      "bestTime": "8:00 مساءً",
      "callToAction": "احجز الآن عبر واتساب واستفد من خصم التجربة"
    },
    {
      "day": "الإثنين",
      "type": "video_reels",
      "formatName": "فيديو ريلز وتيك توك (9:16)",
      "hook": "أول 3 ثواني تخطف الأنظار في الريلز",
      "caption": "كابشن الفيديو مع دعوة لمتابعة الحساب وزيارة الصفحة",
      "visualPrompt": "سيناريو الفيديو وأوامر التوليد لـ Google Flow عبر إضافة Turbo Flow",
      "bestTime": "9:00 مساءً",
      "callToAction": "شارك الفيديو مع أصحابك واطلب عبر رسائل الصفحة"
    },
    {
      "day": "الأربعاء",
      "type": "conversion_offer",
      "formatName": "بوست عرض خاص وحجز فوري (1:1)",
      "hook": "عرض استثنائي ومحدود لعملاء الأسبوع المجاني",
      "caption": "كابشن يوضح تفاصيل العرض والضمان مع رابط الدفع أو التأكيد",
      "visualPrompt": "برومبت إنجليزي لصورة العرض والخصم",
      "bestTime": "7:30 مساءً",
      "callToAction": "احجز مكانك اليوم قبل اكتمال المواعيد"
    }
  ],
  "recommendedNextStep": "خطوة واضحة للمستخدم: إما توليد اللوجو، أو اعتماد جدولة الـ 3 منشورات، أو ربط صفحات ميتا"
}`;

    try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);
        return {
            brandId,
            ...parsed
        };
    } catch (err: any) {
        console.warn("[Branding Forge] Fallback to deterministic template due to:", err?.message);
        // Fallback robust template if Gemini key is busy or offline
        return {
            brandId,
            brandName,
            englishName: brandName,
            category,
            slogan: `اختيارك الأفضل لخدمات ${category} في مصر`,
            essence: `${brandName} تقدم أعلى معايير الجودة والسرعة مع ضمان رضا العملاء ودعم فوري 24/7.`,
            colors: {
                primary: "#06b6d4",
                secondary: "#3b82f6",
                accent: "#f59e0b",
                background: "#020617"
            },
            logoPrompt: `A modern minimalist luxury logo for "${brandName}" in ${category}, clean vector design, cyan and royal blue colors, professional corporate identity.`,
            socialKits: {
                facebook: {
                    platform: "facebook",
                    title: `${brandName} - الصفحة الرسمية`,
                    category,
                    bio: `الصفحة الرسمية لـ ${brandName}. نقدم أرقى حلول ${category} في مصر. للحجز والاستفسار تواصل معنا عبر واتساب: ${phone}`,
                    callToAction: "إرسال رسالة واتساب",
                    visualDirection: "صورة غلاف عصرية تعرض أهم المنتجات مع شعار البراند والألوان الرسمية.",
                    hashtags: ["#مصر", `#${category.replace(/\s+/g, '_')}`]
                },
                instagram: {
                    platform: "instagram",
                    title: `@${brandId}`,
                    category,
                    bio: `✨ ${brandName}\n💎 خبراء ${category} في مصر\n⚡ حجز فوري ومتابعة 24/7\n👇 احجز الآن عبر الرابط:`,
                    callToAction: "تواصل عبر الرابط في البايو",
                    visualDirection: "تصاميم متناسقة بألوان الكيان مع هايلايت (خدماتنا، آراء العملاء، العروض).",
                    hashtags: ["#explore", "#business", `#${category.replace(/\s+/g, '_')}`]
                },
                tiktok: {
                    platform: "tiktok",
                    title: `@${brandId}.official`,
                    category,
                    bio: `🚀 كل يوم جديد في عالم ${category} مع ${brandName}!\n📲 واتساب: ${phone}`,
                    callToAction: "رابط الواتساب بالبايو",
                    visualDirection: "فيديوهات ريلز سريعة وعفوية تبرز النتيجة قبل وبعد والآراء الحقيقية.",
                    hashtags: ["#fyp", "#viral", "#foryou"]
                }
            },
            trialContentPlan: [
                {
                    day: "السبت",
                    type: "image_feed",
                    formatName: "بوست تصميم Feed (1:1)",
                    hook: `أقوى انطلاقة لـ ${brandName} في عالم ${category}! خصم خاص للحجوزات المبكرة.`,
                    caption: `جاهزون لتقديم أفضل تجربة بأعلى جودة وضمان. احجز موعدك الآن عبر تطبيقنا أو واتساب: ${phone}`,
                    visualPrompt: `High quality advertising banner for ${brandName}, modern studio lighting, showcasing ${category}`,
                    bestTime: "8:00 مساءً",
                    callToAction: "احجز الآن عبر واتساب"
                },
                {
                    day: "الإثنين",
                    type: "video_reels",
                    formatName: "فيديو ريلز وتيك توك (9:16)",
                    hook: `ليه ${brandName} اختيارك الأول دائماً؟ شاهد النتيجة بنفسك!`,
                    caption: `سرعتنا واحترافيتنا سر ثقة عملائنا. تابعنا واطلب خدمتك في ثوانٍ.`,
                    visualPrompt: `Cinematic vertical video 9:16, showing behind the scenes and customer satisfaction for ${brandName}`,
                    bestTime: "9:00 مساءً",
                    callToAction: "تابع حسابنا لمعرفة جديدنا"
                },
                {
                    day: "الأربعاء",
                    type: "conversion_offer",
                    formatName: "بوست عرض خاص وحجز فوري (1:1)",
                    hook: `عرض نهاية الأسبوع الاستثنائي من ${brandName} — العدد محدود للحجز اليوم!`,
                    caption: `استمتع بخصم التجربة وضمان الجودة الكامل. تواصل معنا على ${phone} لتأكيد حجزك.`,
                    visualPrompt: `Promotional discount card with golden badge, high conversion, 1:1 format`,
                    bestTime: "7:30 مساءً",
                    callToAction: "اضغط وتواصل مع خدمة العملاء"
                }
            ],
            recommendedNextStep: "توليد تصميمات الخطة واعتماد نشر منشور يوم السبت"
        };
    }
}

export function saveBrandedClientToVault(kit: BrandingKitResult, clientData: { phone?: string; whatsapp?: string }): any {
    const brandsFilePath = path.join(process.cwd(), 'data', 'brands.json');
    let brandsMap: Record<string, any> = {};
    try {
        if (fs.existsSync(brandsFilePath)) {
            brandsMap = JSON.parse(fs.readFileSync(brandsFilePath, 'utf8'));
        }
    } catch {}

    const brandRecord = {
        id: kit.brandId,
        slug: kit.brandId,
        name: kit.brandName,
        englishName: kit.englishName,
        businessType: kit.category,
        slogan: kit.slogan,
        essence: kit.essence,
        primaryColor: kit.colors.primary,
        accentColor: kit.colors.accent,
        phone: clientData.phone || '01013372674',
        whatsapp: clientData.whatsapp || clientData.phone || '01013372674',
        status: 'شغال',
        source: 'unified',
        subscriptionPlan: 'أسبوع التجربة المجانية (3 منشورات)',
        appUrl: `/store/${kit.brandId}`,
        liveUrl: `https://${kit.brandId.replace(/_/g, '-')}.vercel.app`,
        logoPrompt: kit.logoPrompt,
        socialKits: kit.socialKits,
        weekContentPlan: kit.trialContentPlan.map(p => ({
            day: p.day,
            contentType: p.formatName,
            hook: p.hook,
            caption: p.caption,
            visualPrompt: p.visualPrompt,
            bestTime: p.bestTime,
            callToAction: p.callToAction,
            status: 'SCHEDULED'
        })),
        createdAt: new Date().toISOString()
    };

    brandsMap[kit.brandId] = brandRecord;

    try {
        const dataDir = path.dirname(brandsFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(brandsFilePath, JSON.stringify(brandsMap, null, 2), 'utf8');
    } catch (err) {
        console.warn("[Branding Forge] Could not persist brand to file:", err);
    }

    return brandRecord;
}
