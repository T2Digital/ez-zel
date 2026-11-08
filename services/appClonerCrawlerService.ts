import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { broadcastGatewayEvent } from './microservicesGateway';

export interface CloneBrandInput {
    name?: string;
    businessName?: string;
    industry?: string;
    category?: string;
    websiteUrl?: string;
    phone?: string;
    ownerEmail?: string;
}

export interface ClonedBrandOutput {
    id: string;
    slug: string;
    name: string;
    businessType: string;
    dialect: string;
    websiteUrl: string;
    appUrl: string;
    phone: string;
    ownerEmail: string;
    directKnowledge: string;
    knowledgeText: string;
    systemPrompt: string;
    productsCatalog: Array<{
        id: string;
        name: string;
        price: string;
        unitPrice: number;
        category: string;
        description: string;
        imageUrl: string;
    }>;
    marketAnalysis?: {
        competitorGaps: string[];
        topObjections: string[];
        irresistibleHooks: string[];
    };
    weekContentPlan?: Array<{
        day: string;
        contentType: string;
        hook: string;
        caption: string;
        bestTime: string;
    }>;
    createdAt: string;
}

function getGeminiClient(): GoogleGenAI {
    // Attempt lazy loading of .env if running outside server context
    if (!process.env.GEMINI_API_KEY && fs.existsSync(path.join(process.cwd(), '.env'))) {
        try {
            const dotenvContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
            dotenvContent.split('\n').forEach(line => {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let val = (match[2] || '').trim();
                    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
                    if (!process.env[key]) process.env[key] = val;
                }
            });
        } catch {}
    }

    const rawKeys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEYS,
        process.env.VITE_GEMINI_API_KEY
    ].filter(Boolean);

    let apiKey = '';
    for (const raw of rawKeys) {
        if (!raw) continue;
        const parts = raw.split(/[,;\n]/).map(k => k.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
        for (const p of parts) {
            if (p && p !== "dummy" && p !== "AIzaSyDummy" && p.length > 20) {
                apiKey = p;
                break;
            }
        }
        if (apiKey) break;
    }

    if (!apiKey) {
        throw new Error("No valid Gemini API key found on server");
    }

    return new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
}

function generateSyntheticEgyptianBlueprint(name: string, industry: string, phone: string): any {
    return {
        summary: `${name} هي العلامة الرائدة في مصر لتقديم خدمات ${industry} بأعلى مقاييس الجودة والسرعة والضمان المعتمد.`,
        knowledgeText: `مرحباً بك في ${name}.\nنحن متخصصون في ${industry}.\nمواعيد العمل: يومياً من 10 صباحاً حتى 10 مساءً.\nطرق الدفع: كاش، إنستاباي، فودافون كاش، وفيزا.\nالعربون لتأكيد الحجز: 25% مع خصم فوري 10% عند الحجز الإلكتروني.\nرقم التواصل والواتساب: ${phone}.`,
        systemPrompt: `أنت وكيل المبيعات وخدمة العملاء الذكي لبراند "${name}" المتخصص في "${industry}".\nتتحدث بالعامية المصرية الودودة، الذكية والمحترفة جداً.\nهدفك الأساسي هو الرد الفوري، حل أي تردد، وعرض خصم 10% عند تأكيد الحجز بعربون 25% عبر إنستاباي أو فودافون كاش لتثبيت الموعد.`,
        productsCatalog: [
            {
                id: 'srv_1',
                name: `جلسة / خدمة ${name} الأساسية المميزة`,
                price: '650 ج.م',
                unitPrice: 650,
                category: 'خدمات أساسية',
                description: 'كشف وفحص شامل مع تقرير مفصل وخطة عمل دقيقة بأحدث التقنيات.',
                imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
            },
            {
                id: 'srv_2',
                name: `باقة VIP المتكاملة من ${name}`,
                price: '1,400 ج.م',
                unitPrice: 1400,
                category: 'باقات VIP',
                description: 'خدمة كاملة وشاملة المتابعة الدورية مجاناً لمدة 3 شهور وضمان معتمد.',
                imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80'
            },
            {
                id: 'srv_3',
                name: `العرض الأسبوعي الحصري`,
                price: '950 ج.م',
                unitPrice: 950,
                category: 'عروض حصرية',
                description: 'خصم 20% لفترة محدودة مع إمكانية التقسيط بدون فوائد.',
                imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80'
            }
        ],
        marketAnalysis: {
            competitorGaps: [
                'بطء الرد على الواتساب والمحادثات لدى المنافسين (نحن نرد في 3 ثوانٍ 24/7)',
                'عدم وضوح الأسعار والمصاريف المخفية (نحن نوضح الأسعار بالكامل بالجنيه المصري)',
                'غياب المتابعة بعد تقديم الخدمة (نحن نوفر متابعة وضمان معتمد)'
            ],
            topObjections: [
                'هل الأسعار شاملة كل شيء؟ -> نعم الأسعار شاملة ومحددة ولا توجد أي رسوم خفية.',
                'هل يوجد ضمان على الخدمة؟ -> نعم يوجد ضمان معتمد ومتابعة مجانية.',
                'كيف أضمن موعدي؟ -> دفع عربون 25% يثبت لك الموعد فوراً مع خصم 10% إضافي.'
            ],
            irresistibleHooks: [
                `عرض خاص من ${name}: احجز الآن واحصل على خصم 10% وكشف مجاني!`,
                `ليه تنتظر؟ مع ${name} حجزك مؤكد في 30 ثانية بدون أي تعقيد!`
            ]
        },
        weekContentPlan: [
            { day: 'السبت', contentType: 'Reel فيديو', hook: `سر التميز مع ${name} في 30 ثانية!`, caption: 'فيديو يوضح طريقة العمل والاحترافية.', bestTime: '14:00' },
            { day: 'الأحد', contentType: 'بوست كاروسيل', hook: '3 نصائح ذهبية قبل أن تختار خدمتك', caption: 'دليل شامل لاختيار الأنسب لك بجودة عالية.', bestTime: '20:00' },
            { day: 'الإثنين', contentType: 'شهادات عملاء', hook: 'رأي عملائنا بعد تجربة الخدمة', caption: 'قصص نجاح حقيقية وثقة عملائنا في مصر.', bestTime: '19:00' },
            { day: 'الثلاثاء', contentType: 'عرض تفاعلي', hook: 'جاوب واكسب خصم 20% فوري!', caption: 'سؤال سريع لكل متابعينا مع كود خصم حصري.', bestTime: '21:00' },
            { day: 'الأربعاء', contentType: 'إنفوجرافيك مقارنة', hook: 'الفرق بين الخدمة العادية وباقة الـ VIP', caption: 'تفاصيل ومقارنة واضحة توفر عليك الوقت والمال.', bestTime: '16:00' },
            { day: 'الخميس', contentType: 'عرض نهاية الأسبوع', hook: 'عرض الويك إند المحدود وصل!', caption: 'احجز قبل اكتمال المواعيد واستمتع بخصم الحجز المسبق.', bestTime: '20:00' },
            { day: 'الجمعة', contentType: 'ستوري لايف واستفسارات', hook: 'استفساراتكم نجاوب عليها مباشرة', caption: 'متابعة أسبوعية وتفاعل مباشر مع العملاء.', bestTime: '15:00' }
        ]
    };
}

function cleanHtmlToText(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function crawlUrlContent(targetUrl: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const resp = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!resp.ok) {
            throw new Error(`HTTP status ${resp.status}`);
        }

        const html = await resp.text();
        return cleanHtmlToText(html).slice(0, 25000);
    } catch (e: any) {
        console.warn(`[Crawler] Failed to fetch raw URL (${targetUrl}):`, e?.message);
        return '';
    }
}

export async function cloneOrSynthesizeBrand(input: CloneBrandInput): Promise<ClonedBrandOutput> {
    const name = (input.name || input.businessName || 'براند رائد').trim();
    const industry = (input.industry || input.category || 'خدمات وأعمال عامة').trim();
    const phone = input.phone?.trim() || '01013373634';
    const ownerEmail = input.ownerEmail?.trim() || 'client@t2digital.com';
    const websiteUrl = input.websiteUrl?.trim() || '';

    // Slug generator
    const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || `brand-${Date.now().toString(36)}`;
    const brandId = slug.replace(/-/g, '_');

    let crawledText = '';
    if (websiteUrl && websiteUrl.startsWith('http')) {
        console.log(`🕷️ [App Cloner] Crawling target website: ${websiteUrl}...`);
        crawledText = await crawlUrlContent(websiteUrl);
    }

    console.log(`🧠 [App Cloner] Synthesizing complete brand blueprint for: "${name}" (${industry})...`);

    const prompt = `أنت خبير واستشاري بناء وكالات النمو الرقمي (Digital Business Growth Agency) في مصر.
مهمتك: توليد حزمة بيزنس سيادية متكاملة لبراند عميل يحمل الاسم "${name}" في مجال "${industry}".
${crawledText ? `المحتوى الذي تم سحبه من موقعه:\n"""\n${crawledText}\n"""\nاستند عليه كأساس.` : `لا يوجد موقع مسحوب، قم بتوليد أفضل نموذج عمل مصري رائد في هذا المجال بأسعار السوق الواقعية بالجنيه المصري.`}

المطلوب إخراج كائن JSON فقط باللغة العربية مطابق تماماً للهيكل التالي:
{
  "summary": "نبذة تسويقية قوية عن البراند لزيادة الثقة",
  "knowledgeText": "نص معرفي شامل ومفصل بجميع خدمات وسياسات الحجز والدفع والضمانات يستخدمه الأيجنت للرد على العملاء بدقة",
  "systemPrompt": "تعليمات وتوجيهات وكيل الواتساب والسوشيال الذكي (System Prompt) بالعامية المصرية الراقية وسريعة الإقناع وحساب الخصم 10% عند دفع عربون 25% عبر إنستاباي أو فودافون كاش",
  "productsCatalog": [
    {
      "id": "service_1",
      "name": "اسم الخدمة أو المنتج",
      "price": "السعر المكتوب مع العملة ج.م",
      "unitPrice": 500,
      "category": "الفئة",
      "description": "شرح مميزات الخدمة",
      "imageUrl": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80"
    }
  ],
  "marketAnalysis": {
    "competitorGaps": ["فجوة 1 في السوق يتفوق فيها البراند", "فجوة 2", "فجوة 3"],
    "topObjections": ["أبرز اعتراض للعملاء في هذا المجال", "اعتراض 2", "اعتراض 3"],
    "irresistibleHooks": ["خطاف إعلاني قوي 1 يلمس ألم العميل", "خطاف 2", "خطاف 3"]
  },
  "weekContentPlan": [
    {
      "day": "السبت",
      "contentType": "فيديو ريلز حل مشكلة",
      "hook": "الخطاف الافتتاحي في أول 3 ثواني",
      "caption": "الكابشن التسويقي مع الدعوة لاتخاذ إجراء CTA",
      "bestTime": "8:30 مساءً"
    },
    {
      "day": "الاثنين",
      "contentType": "دراسة حالة Before & After",
      "hook": "شوف النتيجة دي قبل وبعد شغلنا",
      "caption": "تفاصيل إنجاز الشغل",
      "bestTime": "9:00 مساءً"
    },
    {
      "day": "الأربعاء",
      "contentType": "فيديو توعية وكشف أسرار",
      "hook": "ليه معظم الشركات بتغشك في النقطة دي؟",
      "caption": "نصيحة ذهبية للعميل",
      "bestTime": "7:30 مساءً"
    },
    {
      "day": "الجمعة",
      "contentType": "عرض نهاية الأسبوع المحدود",
      "hook": "خصم 10% فوري للحجز اليوم فقط",
      "caption": "طريقة الحجز والعربون السريع",
      "bestTime": "2:00 ظهراً"
    }
  ]
}
يجب أن تعيد كائن JSON صالح فقط دون كود ماركداون خارجي.`;

    let parsed: any = null;
    try {
        const ai = getGeminiClient();
        const res = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
                responseMimeType: 'application/json'
            }
        });

        const rawJson = res.text || '{}';
        try {
            parsed = JSON.parse(rawJson);
        } catch {
            const clean = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsed = JSON.parse(clean);
        }
    } catch (aiErr: any) {
        console.warn(`[App Cloner] Gemini blueprint fallback activated (${aiErr?.message})`);
        parsed = generateSyntheticEgyptianBlueprint(name, industry, phone);
    }

    const appUrl = `https://${slug}.t2-client.vercel.app`;

    const clonedBrand: ClonedBrandOutput = {
        id: brandId,
        slug,
        name,
        businessType: industry,
        dialect: 'مصرية احترافية وسريعة',
        websiteUrl: websiteUrl || appUrl,
        appUrl,
        phone,
        ownerEmail,
        directKnowledge: parsed.summary || `${name} لخدمات ${industry} بأعلى معايير الجودة في مصر.`,
        knowledgeText: parsed.knowledgeText || '',
        systemPrompt: parsed.systemPrompt || '',
        productsCatalog: Array.isArray(parsed.productsCatalog) && parsed.productsCatalog.length > 0
            ? parsed.productsCatalog
            : [
                {
                    id: 'srv_core',
                    name: `خدمة ${name} الأساسية`,
                    price: '500 ج.م',
                    unitPrice: 500,
                    category: 'core',
                    description: 'الخدمة الممتازة الشاملة بأعلى معايير الاحترافية والضمان',
                    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
                }
            ],
        marketAnalysis: parsed.marketAnalysis || {
            competitorGaps: ['سرعة الرد والمتابعة اللحظية', 'وضوح الأسعار بدون مفاجآت', 'ضمان معتمد على الخدمة'],
            topObjections: ['هل فيه ضمان؟', 'مواعيد الاستلام دقيقة؟', 'هل فيه خصم للدفع مقدماً؟'],
            irresistibleHooks: [`وفر فلوسك مع ${name} بجودة لا تقبل المنافسة!`, `خدمة معتمدة بخصم 10% على الحجز الإلكتروني!`]
        },
        weekContentPlan: parsed.weekContentPlan || [],
        createdAt: new Date().toISOString()
    };

    // Persist into data/brands.json
    saveBrandToDisk(clonedBrand);

    // Persist into data/tenants.json for ecosystem multi-tenancy
    saveTenantToDisk(clonedBrand);

    // Broadcast live event to open Jarvis and Dashboard instances
    broadcastGatewayEvent('BRAND_CLONED', {
        id: clonedBrand.id,
        name: clonedBrand.name,
        industry: clonedBrand.businessType,
        appUrl: clonedBrand.appUrl,
        productsCount: clonedBrand.productsCatalog.length,
        createdAt: clonedBrand.createdAt
    });

    console.log(`✅ [App Cloner] Brand "${name}" successfully provisioned with ${clonedBrand.productsCatalog.length} services & live PWA!`);
    return clonedBrand;
}

function saveBrandToDisk(brand: ClonedBrandOutput) {
    try {
        const filePath = path.join(process.cwd(), 'data', 'brands.json');
        let brandsMap: Record<string, any> = {};
        if (fs.existsSync(filePath)) {
            brandsMap = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        brandsMap[brand.id] = brand;
        fs.writeFileSync(filePath, JSON.stringify(brandsMap, null, 2), 'utf8');
    } catch (err: any) {
        console.error('[App Cloner] Failed to update brands.json:', err?.message);
    }
}

function saveTenantToDisk(brand: ClonedBrandOutput) {
    try {
        const filePath = path.join(process.cwd(), 'data', 'tenants.json');
        let tenantsList: any[] = [];
        if (fs.existsSync(filePath)) {
            tenantsList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        const existingIdx = tenantsList.findIndex((t: any) => t.id === brand.id || t.slug === brand.slug);
        const tenantEntry = {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            industry: brand.businessType,
            domain: brand.appUrl,
            phone: brand.phone,
            tier: 'vip_autonomous',
            mrrEgp: 5000,
            status: 'ACTIVE',
            agentConnected: true,
            createdAt: brand.createdAt
        };

        if (existingIdx >= 0) {
            tenantsList[existingIdx] = tenantEntry;
        } else {
            tenantsList.unshift(tenantEntry);
        }
        fs.writeFileSync(filePath, JSON.stringify(tenantsList, null, 2), 'utf8');
    } catch (err: any) {
        console.error('[App Cloner] Failed to update tenants.json:', err?.message);
    }
}

export function getClonedBrandByIdOrSlug(idOrSlug: string): ClonedBrandOutput | null {
    try {
        const filePath = path.join(process.cwd(), 'data', 'brands.json');
        if (fs.existsSync(filePath)) {
            const brandsMap = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (brandsMap[idOrSlug]) return brandsMap[idOrSlug];
            const found = Object.values(brandsMap).find((b: any) => b.slug === idOrSlug || b.id === idOrSlug);
            if (found) return found as ClonedBrandOutput;
        }
    } catch {}
    return null;
}
