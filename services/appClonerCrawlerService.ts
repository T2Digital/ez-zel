import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { broadcastGatewayEvent } from './microservicesGateway';

export interface CloneBrandInput {
    name: string;
    industry?: string;
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
    const ai = getGeminiClient();
    const name = input.name.trim();
    const industry = input.industry?.trim() || 'خدمات وأعمال عامة';
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

    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.3,
            responseMimeType: 'application/json'
        }
    });

    const rawJson = res.text || '{}';
    let parsed: any = {};
    try {
        parsed = JSON.parse(rawJson);
    } catch {
        const clean = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean);
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
