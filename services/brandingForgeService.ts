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
    platform: 'facebook' | 'instagram' | 'tiktok' | 'snapchat' | 'google_business';
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

export interface SuggestedBrandNameOption {
    arabic: string;
    english: string;
    rationale: string;
}

export interface BrandingKitResult {
    brandId: string;
    brandName: string;
    englishName: string;
    category: string;
    suggestedNames: SuggestedBrandNameOption[];
    suggestedSlogans: string[];
    slogan: string;
    essence: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
    logoPrompt: string;
    logoUrl: string;
    socialKits: {
        facebook: SocialPageKit;
        instagram: SocialPageKit;
        tiktok: SocialPageKit;
        snapchat?: SocialPageKit;
        google_business?: SocialPageKit;
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

async function generateLogoImageAsset(ai: GoogleGenAI | null, brandId: string, logoPrompt: string): Promise<string> {
    const cleanPrompt = `${logoPrompt}, flat minimalist vector emblem, clean centered icon on pure solid dark obsidian background, corporate luxury brand identity, no mockups, no watermarks`;

    if (ai) {
        for (const modelName of ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp-image-generation']) {
            try {
                const res: any = await ai.models.generateContent({
                    model: modelName,
                    contents: cleanPrompt,
                    config: { responseModalities: ['IMAGE', 'TEXT'] } as any,
                });
                const part = (res?.candidates?.[0]?.content?.parts || []).find((p: any) => p?.inlineData?.data);
                if (part?.inlineData?.data) {
                    const mime = part.inlineData.mimeType || 'image/png';
                    const ext = mime.includes('jpeg') ? 'jpg' : 'png';
                    const outDir = path.join(process.cwd(), 'public', 'generated-media');
                    fs.mkdirSync(outDir, { recursive: true });
                    const fileName = `logo_${brandId}_${Date.now()}.${ext}`;
                    fs.writeFileSync(path.join(outDir, fileName), Buffer.from(part.inlineData.data, 'base64'));
                    return `/generated-media/${fileName}`;
                }
            } catch {}
        }

        for (const imgModel of ['imagen-3.0-generate-002', 'imagen-4.0-generate-001']) {
            try {
                const res: any = await (ai.models as any).generateImages({
                    model: imgModel,
                    prompt: cleanPrompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
                });
                const bytes = res?.generatedImages?.[0]?.image?.imageBytes;
                if (bytes) {
                    const outDir = path.join(process.cwd(), 'public', 'generated-media');
                    fs.mkdirSync(outDir, { recursive: true });
                    const fileName = `logo_${brandId}_${Date.now()}.png`;
                    fs.writeFileSync(path.join(outDir, fileName), Buffer.from(bytes, 'base64'));
                    return `/generated-media/${fileName}`;
                }
            } catch {}
        }
    }

    const seed = Math.abs(brandId.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % 99999;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
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
المطلوب تأسيس "حقيبة براندينج وتجهيز صفحات فيسبوك وإنستجرام وتيك توك وسناب شات وجوجل بزنس وخرائط جوجل" كاملة وفائقة الاحترافية للمشروع التالي:
- اسم المشروع المبدئي/المطلوب: "${brandName}"
- تصنيف النشاط: "${category}"
- الجمهور المستهدف: "${targetAudience}"
- رقم التواصل والواتساب: "${phone}"
- حالة المشروع: ${isNew ? 'مشروع جديد ينطلق من الصفر (مطلوب اقتراح 3 أسماء براندات مميزة ليختار منها العميل + 3 سلوجانات رنانة)' : 'بيزنس قائم ويحتاج تطوير هوية (قدم 3 خيارات أسماء تطويرية/فرعية + 3 سلوجانات بيعية)'}

المطلوب إخراج النتيجة بتنسيق JSON نظيف وصارم بدون أي نصوص قبل أو بعد:
{
  "brandName": "${brandName}",
  "englishName": "الاسم بالإنجليزية بحروف أنيقة",
  "category": "${category}",
  "suggestedNames": [
    { "arabic": "الاسم المقترح الأول", "english": "First Name", "rationale": "سبب التسمية وقوتها التسويقية في المجال" },
    { "arabic": "الاسم المقترح الثاني", "english": "Second Name", "rationale": "سبب التسمية وقوتها التسويقية في المجال" },
    { "arabic": "الاسم المقترح الثالث", "english": "Third Name", "rationale": "سبب التسمية وقوتها التسويقية في المجال" }
  ],
  "suggestedSlogans": [
    "السلوجان الأول (جذاب ومختصر لا يتجاوز 6 كلمات)",
    "السلوجان الثاني (يركز على السرعة والثقة أو الضمان)",
    "السلوجان الثالث (يركز على النتيجة والقيمة للعميل)"
  ],
  "slogan": "أقوى سلوجان مختار من الثلاثة",
  "essence": "رسالة البراند والقيمة الفريدة في سطرين",
  "colors": {
    "primary": "#كود_لون_رئيسي_Hex",
    "secondary": "#كود_لون_ثانوي_Hex",
    "accent": "#كود_لون_تأكيدي_Hex",
    "background": "#020617"
  },
  "logoPrompt": "Detailed English prompt for a sleek luxury minimalist icon logo representing the brand name and industry on a clean background",
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
    },
    "snapchat": {
      "platform": "snapchat",
      "title": "اسم ملف سناب شات العام (Public Profile)",
      "category": "تصنيف سناب شات",
      "bio": "وصف قصير لملف سناب شات للقصص والأضواء (Spotlight & Stories)",
      "callToAction": "أضفنا وتواصل على واتساب",
      "visualDirection": "فيديوهات عمودية سريعة 9:16",
      "hashtags": ["#سناب_شات", "#أضواء"]
    },
    "google_business": {
      "platform": "google_business",
      "title": "اسم النشاط على خرائط جوجل (Google Business Profile)",
      "category": "الفئة الرئيسية على خرائط جوجل",
      "bio": "وصف احترافي غني بالكلمات المفتاحية للظهور في بحث خرائط جوجل + رقم الهاتف ${phone}",
      "callToAction": "حجز موعد / اتصال مباشر",
      "visualDirection": "صور عالية الدقة للمقر والخدمات + بوستات عروض أسبوعية",
      "hashtags": ["#خرائط_جوجل", "#تقييمات_العملاء"]
    }
  },
  "trialContentPlan": [
    {
      "day": "الأحد",
      "type": "image_feed",
      "formatName": "بوست تصميم Feed (1:1)",
      "hook": "عنوان إعلاني صاعق لجذب العميل وحثه على الشراء أو الحجز",
      "caption": "نص الكابشن الكامل مقنع وسلس وينتهي بدعوة واضحة للحجز عبر واتساب أو التطبيق",
      "visualPrompt": "برومبت إنجليزي لتوليد تصميم الصورة في تيتو ستوديو",
      "bestTime": "8:00 مساءً",
      "callToAction": "احجز الآن عبر واتساب واستفد من خصم التجربة"
    },
    {
      "day": "الثلاثاء",
      "type": "video_reels",
      "formatName": "فيديو ريلز وتيك توك (9:16)",
      "hook": "أول 3 ثواني تخطف الأنظار في الريلز",
      "caption": "كابشن الفيديو مع دعوة لمتابعة الحساب وزيارة الصفحة",
      "visualPrompt": "سيناريو الفيديو وأوامر التوليد لـ Google Flow عبر إضافة Turbo Flow",
      "bestTime": "9:00 مساءً",
      "callToAction": "شارك الفيديو مع أصحابك واطلب عبر رسائل الصفحة"
    },
    {
      "day": "الخميس",
      "type": "conversion_offer",
      "formatName": "بوست عرض خاص وحجز فوري (1:1)",
      "hook": "عرض استثنائي ومحدود لعملاء الأسبوع المجاني",
      "caption": "كابشن يوضح تفاصيل العرض والضمان مع رابط الدفع أو التأكيد",
      "visualPrompt": "برومبت إنجليزي لصورة العرض والخصم",
      "bestTime": "7:30 مساءً",
      "callToAction": "احجز مكانك اليوم قبل اكتمال المواعيد"
    }
  ],
  "recommendedNextStep": "اختيار الاسم والسلوجان المفضل من المقترحات الـ 3 وتصميم الشعار ثم ربط واتساب وباقي المنصات"
}`;

    let ai: GoogleGenAI | null = null;
    try {
        ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: aiPrompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);
        const logoPrompt = parsed.logoPrompt || `A modern minimalist luxury emblem logo for "${brandName}" (${category}), metallic cyan and gold vector design`;
        const logoUrl = await generateLogoImageAsset(ai, brandId, logoPrompt);
        return {
            brandId,
            suggestedNames: Array.isArray(parsed.suggestedNames) && parsed.suggestedNames.length > 0
                ? parsed.suggestedNames
                : [
                    { arabic: `${brandName} برو`, english: `${brandName} Pro`, rationale: 'اسم عصري يوحي بالاحترافية والسرعة' },
                    { arabic: `توب ${brandName}`, english: `Top ${brandName}`, rationale: 'يعزز الريادة والثقة لدى العملاء في مصر' },
                    { arabic: `${brandName} بلس`, english: `${brandName} Plus`, rationale: 'اسم مرن يناسب التوسع والفروع' }
                  ],
            suggestedSlogans: Array.isArray(parsed.suggestedSlogans) && parsed.suggestedSlogans.length > 0
                ? parsed.suggestedSlogans
                : [
                    parsed.slogan || `اختيارك الأول لخدمات ${category} في مصر`,
                    `جودة تليق بك.. وسرعة تسبق توقعاتك`,
                    `مع ${brandName}.. كل تفاصيل شغلك مضمونة 100%`
                  ],
            ...parsed,
            logoPrompt,
            logoUrl
        };
    } catch (err: any) {
        console.warn("[Branding Forge] Fallback to deterministic template due to:", err?.message);
        const defaultLogoPrompt = `A modern minimalist luxury emblem logo for "${brandName}" in ${category}, clean vector icon design, cyan and royal blue metallic accents on dark obsidian background, corporate identity`;
        const logoUrl = await generateLogoImageAsset(ai, brandId, defaultLogoPrompt);
        return {
            brandId,
            brandName,
            englishName: brandName,
            category,
            suggestedNames: [
                { arabic: `${brandName} برو`, english: `${brandName} Pro`, rationale: 'اسم احترافي يعكس الجودة الفائقة والسرعة في التنفيذ' },
                { arabic: `ماستر ${brandName}`, english: `Master ${brandName}`, rationale: 'يعطي ثقة وريادة قوية في السوق المصري والخليجي' },
                { arabic: `${brandName} هب`, english: `${brandName} Hub`, rationale: 'اسم حديث يجمع كل خدمات أو منتجات النشاط في منصة واحدة' }
            ],
            suggestedSlogans: [
                `اختيارك الأفضل لـ ${category} في مصر بأعلى ضمان`,
                `جودة احترافية.. وسرعة تنفيذ تسبق توقعاتك`,
                `ثقتك أمانة.. وخدمتك بأعلى معايير التميز 24/7`
            ],
            slogan: `اختيارك الأفضل لـ ${category} في مصر بأعلى ضمان`,
            essence: `${brandName} تقدم أعلى معايير الجودة والسرعة مع ضمان رضا العملاء ودعم فوري 24/7.`,
            colors: {
                primary: "#06b6d4",
                secondary: "#3b82f6",
                accent: "#f59e0b",
                background: "#020617"
            },
            logoPrompt: defaultLogoPrompt,
            logoUrl,
            socialKits: {
                facebook: {
                    platform: "facebook",
                    title: `${brandName} - الصفحة الرسمية`,
                    category,
                    bio: `الصفحة الرسمية لـ ${brandName}. نقدم أرقى حلول ${category} في مصر. للحجز والاستفسار تواصل معنا عبر واتساب: ${phone}`,
                    callToAction: "إرسال رسالة واتساب",
                    visualDirection: "صورة غلاف عصرية تعرض أهم المنتجات/الخدمات مع شعار البراند والألوان الرسمية.",
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
                },
                snapchat: {
                    platform: "snapchat",
                    title: `${brandName} Official`,
                    category,
                    bio: `تابع يوميات وعروض ${brandName} الحصرية في ${category} 👻 واتساب: ${phone}`,
                    callToAction: "أضف الحساب الآن",
                    visualDirection: "سنابات سريعة وعفوية 9:16 لأضواء Spotlight والقصص اليومية.",
                    hashtags: ["#سناب_شات", "#عروض_مصر"]
                },
                google_business: {
                    platform: "google_business",
                    title: `${brandName} - ${category}`,
                    category,
                    bio: `${brandName}: المركز والمنصة المعتمدة لـ ${category}. احجز موعدك أو اطلب فوراً على رقم ${phone} مع ضمان الجودة وسرعة الخدمة.`,
                    callToAction: "اتصل الآن / حجز فوري",
                    visualDirection: "تحديث أسبوعي للعروض والصور على خرائط جوجل والرد الذكي على تقييمات العملاء.",
                    hashtags: ["#GoogleMaps", "#خرائط_جوجل"]
                }
            },
            trialContentPlan: [
                {
                    day: "الأحد",
                    type: "image_feed",
                    formatName: "بوست تصميم Feed (1:1)",
                    hook: `أقوى انطلاقة لـ ${brandName} في عالم ${category}! خصم خاص للحجوزات المبكرة.`,
                    caption: `جاهزون لتقديم أفضل تجربة بأعلى جودة وضمان. احجز موعدك الآن عبر تطبيقنا أو واتساب: ${phone}`,
                    visualPrompt: `High quality advertising banner for ${brandName}, modern studio lighting, showcasing ${category}`,
                    bestTime: "8:00 مساءً",
                    callToAction: "احجز الآن عبر واتساب"
                },
                {
                    day: "الثلاثاء",
                    type: "video_reels",
                    formatName: "فيديو ريلز وتيك توك (9:16)",
                    hook: `ليه ${brandName} اختيارك الأول دائماً؟ شاهد النتيجة بنفسك!`,
                    caption: `سرعتنا واحترافيتنا سر ثقة عملائنا. تابعنا واطلب خدمتك في ثوانٍ.`,
                    visualPrompt: `Cinematic vertical video 9:16, showing behind the scenes and customer satisfaction for ${brandName}`,
                    bestTime: "9:00 مساءً",
                    callToAction: "تابع حسابنا لمعرفة جديدنا"
                },
                {
                    day: "الخميس",
                    type: "conversion_offer",
                    formatName: "بوست عرض خاص وحجز فوري (1:1)",
                    hook: `عرض نهاية الأسبوع الاستثنائي من ${brandName} — العدد محدود للحجز اليوم!`,
                    caption: `استمتع بخصم التجربة وضمان الجودة الكامل. تواصل معنا على ${phone} لتأكيد حجزك.`,
                    visualPrompt: `Promotional discount card with golden badge, high conversion, 1:1 format`,
                    bestTime: "7:30 مساءً",
                    callToAction: "اضغط وتواصل مع خدمة العملاء"
                }
            ],
            recommendedNextStep: "اختيار الاسم والسلوجان المفضل، اعتماد الشعار، وربط واتساب وباقي المنصات"
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
        suggestedNames: kit.suggestedNames || [],
        suggestedSlogans: kit.suggestedSlogans || [],
        slogan: kit.slogan,
        essence: kit.essence,
        primaryColor: kit.colors.primary,
        accentColor: kit.colors.accent,
        logoUrl: kit.logoUrl || '',
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
