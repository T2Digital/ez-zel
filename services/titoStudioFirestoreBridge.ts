import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = process.env.TITO_STUDIO_PROJECT_ID || 't2-content-studio';
const TITO_STUDIO_FIREBASE_API_KEY = process.env.TITO_STUDIO_FIREBASE_API_KEY || process.env.VITE_TITO_STUDIO_FIREBASE_API_KEY || '';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const CACHE_PATH = path.join(process.cwd(), 'data', 'tito_studio_cache.json');
const STUDIO_AUTH_CACHE_PATH = path.join(process.cwd(), 'data', 'tito_studio_auth.json');
const TURBO_FLOW_QUEUE_PATH = path.join(process.cwd(), 'data', 'turbo_flow_queue.json');
const TURBO_FLOW_CSV_PATH = path.join(process.cwd(), 'data', 'turbo_flow_prompts.csv');

let cachedStudioIdToken: string | null = null;
let cachedStudioTokenExpiry = 0;

/**
 * Authenticates with `t2-content-studio` Firebase and reuses a persistent refreshToken
 * so the server maintains a single stable UID instead of creating a new anonymous account every 50 minutes.
 */
export async function getTitoStudioAuthToken(): Promise<string | null> {
    if (cachedStudioIdToken && Date.now() < cachedStudioTokenExpiry) {
        return cachedStudioIdToken;
    }
    if (!TITO_STUDIO_FIREBASE_API_KEY) {
        return null;
    }

    // 1. Try refreshing existing persistent refreshToken first
    try {
        if (fs.existsSync(STUDIO_AUTH_CACHE_PATH)) {
            const saved = JSON.parse(fs.readFileSync(STUDIO_AUTH_CACHE_PATH, 'utf8'));
            if (saved?.refreshToken) {
                const refreshRes = await fetch(
                    `https://securetoken.googleapis.com/v1/token?key=${TITO_STUDIO_FIREBASE_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(saved.refreshToken)}`,
                        signal: AbortSignal.timeout(6000)
                    }
                );
                if (refreshRes.ok) {
                    const refreshData: any = await refreshRes.json();
                    if (refreshData.id_token) {
                        cachedStudioIdToken = refreshData.id_token;
                        cachedStudioTokenExpiry = Date.now() + 50 * 60 * 1000;
                        if (refreshData.refresh_token && refreshData.refresh_token !== saved.refreshToken) {
                            fs.writeFileSync(
                                STUDIO_AUTH_CACHE_PATH,
                                JSON.stringify({ refreshToken: refreshData.refresh_token, uid: refreshData.user_id, updatedAt: new Date().toISOString() }, null, 2),
                                'utf8'
                            );
                        }
                        return cachedStudioIdToken;
                    }
                }
            }
        }
    } catch {}

    // 2. Otherwise sign up once and persist refreshToken for future reuse
    try {
        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${TITO_STUDIO_FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ returnSecureToken: true }),
                signal: AbortSignal.timeout(6000)
            }
        );
        if (res.ok) {
            const data: any = await res.json();
            if (data.idToken) {
                cachedStudioIdToken = data.idToken;
                cachedStudioTokenExpiry = Date.now() + 50 * 60 * 1000;
                if (data.refreshToken) {
                    const dir = path.dirname(STUDIO_AUTH_CACHE_PATH);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    fs.writeFileSync(
                        STUDIO_AUTH_CACHE_PATH,
                        JSON.stringify({ refreshToken: data.refreshToken, uid: data.localId, updatedAt: new Date().toISOString() }, null, 2),
                        'utf8'
                    );
                }
                return cachedStudioIdToken;
            }
        }
    } catch (e: any) {
        console.warn('[TitoStudioBridge] Auth token warning:', e?.message);
    }
    return null;
}

async function buildFirestoreHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = await getTitoStudioAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export type OmniCtaType = 'APP_CONVERSION' | 'WHATSAPP_VOICE_AGENT' | 'COMMENT_TO_MESSENGER';

export interface BrandMarketingStrategy {
    brandId: string;
    brandName: string;
    createdAt: string;
    positioning: string;
    targetAudience: string;
    toneOfVoice: string;
    visualIdentity: {
        primaryColor: string;
        secondaryColor: string;
        typographyStyle: string;
        artDirection: string;
    };
    pillars: Array<{
        id: 'product_marketing' | 'events_seasons' | 'educational_loyalty';
        title: string;
        percentage: number;
        objective: string;
        sampleAngles: string[];
    }>;
    weeklyMixSummary: string;
    keyHooks: string[];
}

export interface TurboFlowVideoJob {
    jobId: string;
    postId: string;
    brandId: string;
    brandName: string;
    day: string;
    hook: string;
    omniPrompt: string;
    aspectRatio: '9:16' | '16:9';
    model: 'veo-3.1-fast' | 'veo-3.1-quality';
    status: 'queued' | 'processing_in_flow' | 'completed' | 'failed';
    videoUrl?: string;
    createdAt: string;
    completedAt?: string;
}

export interface OmniWeekPostItem {
    id?: string;
    day: string;
    dateIso?: string;
    mediaFormat?: 'image' | 'video';
    contentType: string;
    pillar?: 'product_marketing' | 'events_seasons' | 'educational_loyalty';
    pillarLabel?: string;
    hook: string;
    caption: string;
    bestTime: string;
    ctaType: OmniCtaType;
    ctaBadge: string;
    ctaActionText: string;
    ctaTargetUrl: string;
    commentKeyword?: string;
    visualUrl: string;
    videoUrl?: string;
    omniPrompt?: string;
    turboFlowJobId?: string;
    turboFlowStatus?: 'not_required' | 'queued' | 'processing_in_flow' | 'completed';
    status?: 'draft' | 'scheduled' | 'published';
    firestoreDocId?: string;
}

export interface TitoStudioCache {
    lastSyncedAt: string;
    clinics: any[];
    content: any[];
    appointments: any[];
    strategies?: Record<string, BrandMarketingStrategy>;
}

/**
 * Helper to decode Firestore REST Value into plain JS value
 */
function fromFirestoreValue(val: any): any {
    if (!val || typeof val !== 'object') return val;
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return Number(val.doubleValue);
    if ('booleanValue' in val) return Boolean(val.booleanValue);
    if ('timestampValue' in val) return val.timestampValue;
    if ('nullValue' in val) return null;
    if ('arrayValue' in val) {
        return (val.arrayValue?.values || []).map(fromFirestoreValue);
    }
    if ('mapValue' in val) {
        const obj: Record<string, any> = {};
        const fields = val.mapValue?.fields || {};
        for (const [k, v] of Object.entries(fields)) {
            obj[k] = fromFirestoreValue(v);
        }
        return obj;
    }
    return null;
}

/**
 * Helper to decode a full Firestore REST Document
 */
function fromFirestoreDoc(doc: any): any {
    if (!doc || !doc.name) return null;
    const id = doc.name.split('/').pop();
    const obj: Record<string, any> = { id };
    const fields = doc.fields || {};
    for (const [k, v] of Object.entries(fields)) {
        obj[k] = fromFirestoreValue(v);
    }
    return obj;
}

/**
 * Helper to encode a plain JS value into Firestore REST Value
 */
function toFirestoreValue(val: any): any {
    if (val === null || val === undefined) return { nullValue: null };
    if (val instanceof Date) return { timestampValue: val.toISOString() };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
        if (Number.isInteger(val)) return { integerValue: String(val) };
        return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
        return {
            arrayValue: {
                values: val.filter(v => v !== undefined).map(toFirestoreValue)
            }
        };
    }
    if (typeof val === 'object') {
        const fields: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
            if (v !== undefined) {
                fields[k] = toFirestoreValue(v);
            }
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) {
            fields[k] = toFirestoreValue(v);
        }
    }
    return fields;
}

function escapeXml(str: string): string {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Generates a crisp, branded SVG data URL social media poster for any calendar post
 * so every post in Tito Studio & Jarvis has a real visual creative preview.
 */
export function generateBrandedPostSvgDataUrl(params: {
    brandName: string;
    businessType?: string;
    primaryColor?: string;
    day: string;
    contentType: string;
    hook: string;
    ctaBadge: string;
    phone: string;
    storeUrl: string;
    ctaType?: OmniCtaType;
}): string {
    const primary = params.primaryColor || '#06b6d4';
    const accent =
        params.ctaType === 'APP_CONVERSION'
            ? '#38bdf8'
            : params.ctaType === 'WHATSAPP_VOICE_AGENT'
                ? '#10b981'
                : '#f59e0b';

    const brandName = escapeXml(params.brandName.slice(0, 38));
    const businessType = escapeXml((params.businessType || 'منظومة النمو الشامل').slice(0, 40));
    const hookText = escapeXml(params.hook || `أقوى العروض الحصرية من ${params.brandName}`);
    const hookLine1 = hookText.slice(0, 42);
    const hookLine2 = hookText.slice(42, 86);
    const ctaBadge = escapeXml(params.ctaBadge || 'احجز الآن بخصم 10% فوري');
    const phone = escapeXml(params.phone || '01013373634');
    const dayBadge = escapeXml(`${params.day} • ${params.contentType}`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="55%" stop-color="#091326"/>
      <stop offset="100%" stop-color="${primary}38"/>
    </linearGradient>
    <linearGradient id="pill" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${primary}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="940" cy="140" r="280" fill="${primary}" opacity="0.14"/>
  <circle cx="140" cy="940" r="320" fill="${accent}" opacity="0.12"/>
  <rect x="56" y="56" width="968" height="968" rx="44" fill="none" stroke="${primary}" stroke-opacity="0.4" stroke-width="2.5"/>
  
  <!-- Top Header -->
  <rect x="100" y="105" width="380" height="58" rx="29" fill="${primary}26" stroke="${primary}" stroke-width="1.8"/>
  <text x="290" y="142" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="23" font-weight="bold" fill="#e2e8f0" text-anchor="middle">${dayBadge}</text>

  <text x="975" y="140" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="38" font-weight="900" fill="#ffffff" text-anchor="end">${brandName}</text>
  <text x="975" y="180" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="22" font-weight="600" fill="${accent}" text-anchor="end">${businessType}</text>

  <!-- Center Hook Box -->
  <rect x="96" y="280" width="888" height="420" rx="36" fill="#0f172acc" stroke="#334155" stroke-width="2.5"/>
  <text x="540" y="435" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">${hookLine1}</text>
  <text x="540" y="510" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="40" font-weight="800" fill="#38bdf8" text-anchor="middle">${hookLine2}</text>
  <text x="540" y="615" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="26" font-weight="700" fill="#94a3b8" text-anchor="middle">متابعة فورية بالذكاء الاصطناعي • ضمان معتمد • خصم 10% للحجز المبكر</text>

  <!-- Omni-CTA Pill -->
  <rect x="170" y="765" width="740" height="96" rx="48" fill="url(#pill)"/>
  <text x="540" y="825" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="32" font-weight="900" fill="#020617" text-anchor="middle">${ctaBadge}</text>

  <!-- Footer -->
  <text x="970" y="965" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="26" font-weight="bold" fill="#cbd5e1" text-anchor="end">واتساب وخدمة العملاء: ${phone}</text>
  <text x="110" y="965" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="22" font-weight="bold" fill="${accent}" text-anchor="start">TITO STUDIO × TURBO FLOW ENGINE</text>
</svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Reads & writes the Turbo Flow Video Queue (`data/turbo_flow_queue.json` + `data/turbo_flow_prompts.csv`)
 */
export function readTurboFlowQueue(): TurboFlowVideoJob[] {
    try {
        if (fs.existsSync(TURBO_FLOW_QUEUE_PATH)) {
            const parsed = JSON.parse(fs.readFileSync(TURBO_FLOW_QUEUE_PATH, 'utf8'));
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {}
    return [];
}

export function saveTurboFlowQueue(jobs: TurboFlowVideoJob[]): void {
    try {
        const dir = path.dirname(TURBO_FLOW_QUEUE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TURBO_FLOW_QUEUE_PATH, JSON.stringify(jobs, null, 2), 'utf8');

        // Also write a ready-to-import CSV file for Turbo Flow Chrome Extension batch import
        const csvHeader = 'JobID,BrandName,Day,AspectRatio,Model,OmniPrompt\n';
        const csvRows = jobs
            .filter(j => j.status === 'queued' || j.status === 'processing_in_flow')
            .map(j => {
                const safePrompt = `"${String(j.omniPrompt || '').replace(/"/g, '""')}"`;
                return `${j.jobId},"${j.brandName}","${j.day}",${j.aspectRatio},${j.model},${safePrompt}`;
            })
            .join('\n');
        fs.writeFileSync(TURBO_FLOW_CSV_PATH, '\uFEFF' + csvHeader + csvRows, 'utf8');
    } catch (e: any) {
        console.warn('[TurboFlowBridge] Failed to save queue:', e?.message);
    }
}

export function enqueueTurboFlowVideoJob(job: Omit<TurboFlowVideoJob, 'jobId' | 'createdAt' | 'status'>): TurboFlowVideoJob {
    const queue = readTurboFlowQueue();
    const existingIdx = queue.findIndex(j => j.postId === job.postId && j.brandId === job.brandId);
    const fullJob: TurboFlowVideoJob = {
        ...job,
        jobId: existingIdx >= 0 ? queue[existingIdx].jobId : `tf_${job.brandId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        status: 'queued',
        createdAt: new Date().toISOString()
    };
    if (existingIdx >= 0) {
        queue[existingIdx] = fullJob;
    } else {
        queue.unshift(fullJob);
    }
    saveTurboFlowQueue(queue);
    return fullJob;
}

/**
 * Generates a complete, high-converting Marketing Strategy for a brand in Tito Studio
 * based on the 3 Pillars (`product_marketing`, `events_seasons`, `educational_loyalty`).
 */
export async function generateBrandMarketingStrategy(brand: {
    id: string;
    slug?: string;
    name: string;
    businessType?: string;
    phone?: string;
    primaryColor?: string;
    directKnowledge?: string;
    productsCatalog?: any[];
}): Promise<BrandMarketingStrategy> {
    const brandId = String(brand.id || brand.slug);
    const catalogSummary = (brand.productsCatalog || [])
        .map((p: any) => `${p.name} (${p.price})`)
        .join('، ');

    let strategy: BrandMarketingStrategy | null = null;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `أنت المدير الاستراتيجي لمنظومة تيتو ستوديو (Tito Studio).
قم ببناء استراتيجية تسويقية احترافية شاملة للبراند التالي:
- اسم البراند: ${brand.name}
- القطاع / التخصص: ${brand.businessType || 'خدمات وتجارة'}
- نبذة عن البراند: ${brand.directKnowledge || ''}
- قائمة الخدمات/المنتجات: ${catalogSummary || 'خدمات متكاملة'}

أرجع النتيجة بصيغة JSON فقط تطابق الهيكل التالي:
{
  "positioning": "جملة التموضع التسويقي القوية للبراند في السوق المصري والعربي",
  "targetAudience": "وصف دقيق لشريحة العملاء المستهدفة ودوافع الشراء لديهم",
  "toneOfVoice": "نبرة الصوت التسويقية (مثال: احترافية، ودودة، حاسمة، تركز على النتائج)",
  "visualIdentity": {
    "primaryColor": "${brand.primaryColor || '#06b6d4'}",
    "secondaryColor": "#020617",
    "typographyStyle": "خط Cairo العريض للعناوين الخاطفة مع تباين نيون",
    "artDirection": "تصميمات سوشيال ميديا سينمائية في تيتو ستوديو + فيديوهات ريلز واقعية عبر Google Flow (Veo 3.1)"
  },
  "pillars": [
    {
      "id": "product_marketing",
      "title": "تسويق الخدمات والعروض المباشرة (تحويل للتطبيق والمتجر)",
      "percentage": 45,
      "objective": "تحقيق حجوزات ومبيعات فورية من متجر البراند وتطبيقه بخصم 10%",
      "sampleAngles": ["زاوية 1", "زاوية 2", "زاوية 3"]
    },
    {
      "id": "events_seasons",
      "title": "فيديوهات ريلز التفاعل السريع والمحادثة الصوتية (Google Flow + واتساب)",
      "percentage": 30,
      "objective": "جذب العملاء للتحدث مع وكيل البراند الذكي على واتساب وحسم الحجوزات صوتياً",
      "sampleAngles": ["زاوية 1", "زاوية 2"]
    },
    {
      "id": "educational_loyalty",
      "title": "محتوى القيمة والولاء والرد التلقائي (Comment-to-Messenger)",
      "percentage": 25,
      "objective": "مضاعفة الوصول العضوي وإرسال الكتالوج تلقائياً في الرسائل لكل متفاعل",
      "sampleAngles": ["زاوية 1", "زاوية 2"]
    }
  ],
  "weeklyMixSummary": "4 تصميمات سوشيال احترافية من تيتو ستوديو + 3 فيديوهات ريلز سينمائية يتم توليدها عبر Turbo Flow في Google Flow",
  "keyHooks": ["هوك 1", "هوك 2", "هوك 3", "هوك 4", "هوك 5", "هوك 6", "هوك 7"]
}`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const parsed = JSON.parse(response.text || '{}');
            if (parsed && parsed.positioning) {
                strategy = {
                    brandId,
                    brandName: brand.name,
                    createdAt: new Date().toISOString(),
                    positioning: parsed.positioning,
                    targetAudience: parsed.targetAudience || `عملاء ${brand.businessType || brand.name} الباحثين عن الجودة والسرعة`,
                    toneOfVoice: parsed.toneOfVoice || 'احترافية، مقنعة، ومباشرة باللهجة المصرية الراقية',
                    visualIdentity: parsed.visualIdentity || {
                        primaryColor: brand.primaryColor || '#06b6d4',
                        secondaryColor: '#020617',
                        typographyStyle: 'خط Cairo العريض مع إضاءة Blue-Black Fiber',
                        artDirection: 'تصميمات تيتو ستوديو + فيديوهات Veo 3.1 عبر Turbo Flow'
                    },
                    pillars: Array.isArray(parsed.pillars) && parsed.pillars.length >= 3 ? parsed.pillars : [],
                    weeklyMixSummary: parsed.weeklyMixSummary || '4 تصميمات صور في تيتو ستوديو + 3 فيديوهات ريلز عبر Google Flow (Turbo Flow)',
                    keyHooks: Array.isArray(parsed.keyHooks) && parsed.keyHooks.length > 0 ? parsed.keyHooks : []
                };
            }
        } catch (e: any) {
            console.warn('[TitoStudioBridge] Gemini strategy generation fallback:', e?.message);
        }
    }

    if (!strategy) {
        strategy = {
            brandId,
            brandName: brand.name,
            createdAt: new Date().toISOString(),
            positioning: `الاختيار الأول في ${brand.businessType || 'الخدمات المتكاملة'} مع تجربة حجز ذكية في 30 ثانية وخدمة عملاء صوتية فورية.`,
            targetAudience: `العملاء المهتمون بـ ${brand.businessType || brand.name} والراغبون في جودة مضمونة وسرعة استجابة فورية.`,
            toneOfVoice: 'احترافية، موثوقة، وحاسمة تركز على القيمة والنتائج الملموسة.',
            visualIdentity: {
                primaryColor: brand.primaryColor || '#06b6d4',
                secondaryColor: '#020617',
                typographyStyle: 'خط Cairo الاحترافي بتباين واضح للهوك وزر الـ CTA',
                artDirection: 'تصميمات سوشيال في تيتو ستوديو + فيديوهات ريلز سينمائية عبر Google Flow (Turbo Flow)'
            },
            pillars: [
                {
                    id: 'product_marketing',
                    title: 'تسويق الخدمات والعروض المباشرة (تحويل لمتجر وتطبيق البراند)',
                    percentage: 45,
                    objective: 'تحويل المشاهدين إلى حجوزات مؤكدة داخل تطبيق البراند بخصم 10% فوري',
                    sampleAngles: [
                        `عرض الحجز المبكر من تطبيق ${brand.name} بخصم 10%`,
                        `مقارنة الباقات والأسعار الشفافة لـ ${brand.name}`,
                        `تجربة عميل حقيقية قبل وبعد مع ${brand.name}`
                    ]
                },
                {
                    id: 'events_seasons',
                    title: 'فيديوهات ريلز التفاعل والمحادثة الصوتية (Google Flow + واتساب)',
                    percentage: 30,
                    objective: 'تشغيل فيديوهات ريلز سينمائية عبر Turbo Flow تدفع العميل لمحادثة وكيل الواتساب الصوتي',
                    sampleAngles: [
                        `جولة بصرية سينمائية داخل ${brand.name} مع دعوة للتواصل عبر واتساب`,
                        `عرض نهاية الأسبوع الحصري لأول 10 حجوزات عبر واتساب`
                    ]
                },
                {
                    id: 'educational_loyalty',
                    title: 'محتوى القيمة والرد التلقائي (Comment-to-Messenger)',
                    percentage: 25,
                    objective: 'إطلاق منشورات تفاعلية تطلب كتابة كلمة مفتاحية في تعليق لإرسال الكتالوج في الرسائل فوراً',
                    sampleAngles: [
                        `اكتب كلمة "عرض" في تعليق لاستلام كتالوج أسعار ${brand.name} كاملاً`,
                        `3 نصائح ذهبية من خبراء ${brand.name} توفر عليك الوقت والتكلفة`
                    ]
                }
            ],
            weeklyMixSummary: '4 تصميمات صور في تيتو ستوديو + 3 فيديوهات ريلز سينمائية في Google Flow عبر إضافة Turbo Flow',
            keyHooks: [
                `احجز خدمتك الآن من تطبيق ${brand.name} الرسمي بخصم 10% فوري بدون انتظار!`,
                `عندك استفسار؟ وكيل ${brand.name} الذكي يرد عليك بصوت بشري في 3 ثوانٍ على واتساب!`,
                `اكتب كلمة "عرض" في تعليق وهيوصلك كتالوج أسعار ${brand.name} وكود الخصم في رسالة فوراً!`,
                `شوف النتيجة بنفسك مع ${brand.name} — ثبت موعدك الآن من التطبيق بعربون 25%!`,
                `3 أسرار ذهبية من خبراء ${brand.name} توفر عليك نص التكلفة والوقت!`,
                `اكتب "تفاصيل" في الكومنتات وهنبعتلك هدية نهاية الأسبوع من ${brand.name} حالاً!`,
                `عرض الجمعة الحصري من ${brand.name} — أول 10 حجوزات اليوم بخصم إضافي وأولوية تنفيذ!`
            ]
        };
    }

    // Save strategy into local cache and t2-content-studio Firestore clinic doc
    try {
        const cache = readTitoStudioCacheSync();
        if (!cache.strategies) cache.strategies = {};
        cache.strategies[brandId] = strategy;
        const clinicIdx = cache.clinics.findIndex((c: any) => c.id === brandId || c.slug === brand.slug);
        if (clinicIdx >= 0) {
            cache.clinics[clinicIdx].marketingStrategy = strategy;
        }
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    } catch {}

    try {
        const headers = await buildFirestoreHeaders();
        const fields = toFirestoreFields({ marketingStrategy: strategy });
        await fetch(`${FIRESTORE_BASE_URL}/clinics/${encodeURIComponent(brandId)}?updateMask.fieldPaths=marketingStrategy`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ fields }),
            signal: AbortSignal.timeout(5000)
        });
    } catch {}

    return strategy;
}

/**
 * Builds the 7-Day Omni-Channel Content Plan for any brand:
 * - Image posts ('image') -> Rendered immediately in Tito Studio engine.
 * - Video posts ('video') -> Generates a cinematic Veo 3.1 `omniPrompt` and queues it into Turbo Flow Bridge for Google Flow!
 */
export function buildOmniChannelWeekPlan(brand: {
    id: string;
    slug?: string;
    name: string;
    businessType?: string;
    phone?: string;
    primaryColor?: string;
    existingPlan?: any[];
    strategy?: BrandMarketingStrategy;
    isTrial?: boolean;
}): OmniWeekPostItem[] {
    const slug = brand.slug || brand.id;
    const rawPhone = String(brand.phone || '01013373634').replace(/[^0-9]/g, '');
    const intlPhone = rawPhone.startsWith('0') ? `2${rawPhone}` : rawPhone;
    const storePath = `/store/${slug}`;
    const fullStoreUrl = `https://t2-growth-os.vercel.app/store/${slug}?utm_source=tito_studio`;
    const waLink = `https://wa.me/${intlPhone}?text=${encodeURIComponent(`أهلاً ${brand.name}، شفت عرض السوشيال وعاوز أحجز وأستفيد بخصم 10% الفوري`)}`;
    const customHooks = brand.strategy?.keyHooks || [];

    const baseDays: Array<{
        day: string;
        mediaFormat: 'image' | 'video';
        pillar: 'product_marketing' | 'events_seasons' | 'educational_loyalty';
        pillarLabel: string;
        contentType: string;
        defaultHook: string;
        ctaType: OmniCtaType;
        ctaBadge: string;
        ctaActionText: string;
        ctaTargetUrl: string;
        commentKeyword?: string;
        bestTime: string;
        omniPrompt: string;
    }> = [
        {
            day: 'السبت',
            mediaFormat: 'image',
            pillar: 'product_marketing',
            pillarLabel: 'تسويق المنتجات والخدمات',
            contentType: 'تصميم تيتو ستوديو (Feed 1:1)',
            defaultHook: customHooks[0] || `احجز خدمتك الآن من تطبيق ${brand.name} الرسمي بخصم 10% فوري بدون انتظار!`,
            ctaType: 'APP_CONVERSION',
            ctaBadge: '🛒 احجز من التطبيق بخصم 10% فوري',
            ctaActionText: `افتح المتجر واحجز في 30 ثانية: ${storePath}`,
            ctaTargetUrl: storePath,
            bestTime: '8:00 مساءً',
            omniPrompt: `Ultra-luxury commercial photography for ${brand.name} (${brand.businessType || 'premium brand'}), dramatic studio lighting, cyan and deep navy accents, 8k photorealistic.`
        },
        {
            day: 'الأحد',
            mediaFormat: 'image',
            pillar: 'product_marketing',
            pillarLabel: 'تسويق المنتجات والخدمات (Feed 1:1)',
            contentType: 'تصميم تيتو ستوديو (Feed 1:1)',
            defaultHook: customHooks[0] || `احجز خدمتك الآن من تطبيق ${brand.name} الرسمي بخصم 10% فوري بدون انتظار!`,
            ctaType: 'APP_CONVERSION',
            ctaBadge: '🛒 احجز من التطبيق بخصم 10% فوري',
            ctaActionText: `افتح المتجر واحجز في 30 ثانية: ${storePath}`,
            ctaTargetUrl: storePath,
            bestTime: '8:00 مساءً',
            omniPrompt: `Ultra-luxury commercial photography for ${brand.name} (${brand.businessType || 'premium brand'}), dramatic studio lighting, cyan and deep navy accents, 8k photorealistic.`
        },
        {
            day: 'الإثنين',
            mediaFormat: 'image',
            pillar: 'educational_loyalty',
            pillarLabel: 'تفاعل وولاء (Auto-DM)',
            contentType: 'تصميم تفاعلي تيتو ستوديو (Auto-DM)',
            defaultHook: customHooks[1] || `اكتب كلمة "عرض" في تعليق وهيوصلك كتالوج أسعار ${brand.name} وكود الخصم في رسالة فوراً!`,
            ctaType: 'COMMENT_TO_MESSENGER',
            ctaBadge: '🤖 اكتب "عرض" في تعليق لاستلام الكتالوج',
            ctaActionText: 'رد تلقائي على التعليق + رسالة ماسنجر فورية بالكتالوج',
            ctaTargetUrl: storePath,
            commentKeyword: 'عرض',
            bestTime: '8:30 مساءً',
            omniPrompt: `High-impact social media showcase for ${brand.name}, spotlighting premium catalog items on a sleek dark podium, studio rim lighting.`
        },
        {
            day: 'الثلاثاء',
            mediaFormat: 'video',
            pillar: 'events_seasons',
            pillarLabel: 'ريلز سينمائي (Turbo Flow / Google Flow)',
            contentType: 'فيديو ريلز Google Flow (Reels 9:16)',
            defaultHook: customHooks[2] || `عندك استفسار؟ وكيل ${brand.name} الذكي يرد عليك بصوت بشري في 3 ثوانٍ على واتساب!`,
            ctaType: 'WHATSAPP_VOICE_AGENT',
            ctaBadge: '💬 تواصل واتساب فوري (رد صوتي ذكي)',
            ctaActionText: `اضغط لمحادثة واتساب المباشرة: ${brand.phone || '01013373634'}`,
            ctaTargetUrl: waLink,
            bestTime: '9:00 مساءً',
            omniPrompt: `Vertical 9:16 cinematic commercial reel for ${brand.name} (${brand.businessType || 'modern service business'}), smooth gimbal camera movement entering a high-end modern space, warm welcoming atmosphere with subtle cyan fiber-optic rim lighting, happy client experiencing top-tier service, photorealistic 4K Veo 3.1 commercial quality, no text overlay.`
        },
        {
            day: 'الأربعاء',
            mediaFormat: 'image',
            pillar: 'educational_loyalty',
            pillarLabel: 'محتوى تعليمي واستشارة صوتية',
            contentType: 'تصميم كاروسيل تيتو ستوديو + استشارة واتساب',
            defaultHook: customHooks[4] || `3 أسرار ذهبية من خبراء ${brand.name} توفر عليك نص التكلفة والوقت!`,
            ctaType: 'WHATSAPP_VOICE_AGENT',
            ctaBadge: '💬 اطلب استشارتك الصوتية عبر واتساب',
            ctaActionText: `تحدث مع المستشار الذكي على واتساب: ${brand.phone || '01013373634'}`,
            ctaTargetUrl: waLink,
            bestTime: '9:00 مساءً',
            omniPrompt: `Editorial portrait of expert team at ${brand.name}, modern studio backdrop, confident and trustworthy aura.`
        },
        {
            day: 'الخميس',
            mediaFormat: 'image',
            pillar: 'educational_loyalty',
            pillarLabel: 'مسابقة وعرض تفاعلي (Comment-to-DM)',
            contentType: 'تصميم تيتو ستوديو التفاعلي (Comment-to-DM)',
            defaultHook: customHooks[5] || `اكتب "تفاصيل" في الكومنتات وهنبعتلك هدية نهاية الأسبوع من ${brand.name} حالاً!`,
            ctaType: 'COMMENT_TO_MESSENGER',
            ctaBadge: '🤖 علق بكلمة "تفاصيل" لاستلام الهدية',
            ctaActionText: 'إرسال فوري عبر Messenger / Instagram DM',
            ctaTargetUrl: storePath,
            commentKeyword: 'تفاصيل',
            bestTime: '10:00 مساءً',
            omniPrompt: `Luxury gift box and VIP voucher presentation for ${brand.name}, glowing golden and cyan highlights, celebratory mood.`
        },
        {
            day: 'الجمعة',
            mediaFormat: 'video',
            pillar: 'events_seasons',
            pillarLabel: 'ريلز إغلاق مبيعات الجمعة (Turbo Flow)',
            contentType: 'فيديو ريلز VIP عبر Google Flow (Reels 9:16)',
            defaultHook: customHooks[6] || `عرض الجمعة الحصري من ${brand.name} — أول 10 حجوزات اليوم بخصم إضافي وأولوية تنفيذ!`,
            ctaType: 'WHATSAPP_VOICE_AGENT',
            ctaBadge: '🔥 اقفل حجزك الآن عبر واتساب أو التطبيق',
            ctaActionText: `حجز فوري عبر واتساب (${brand.phone || '01013373634'}) أو المتجر (${storePath})`,
            ctaTargetUrl: waLink,
            bestTime: '5:00 مساءً',
            omniPrompt: `Vertical 9:16 high-energy weekend VIP commercial for ${brand.name} (${brand.businessType || 'flagship service'}), dramatic cinematic lighting, fast-paced luxury b-roll cuts, inviting VIP atmosphere, shot on Arri Alexa Mini LF, Veo 3.1 photorealistic quality, no text.`
        }
    ];

    const activeSlots = brand.isTrial
        ? baseDays.filter(s => ['الأحد', 'الثلاثاء', 'الخميس'].includes(s.day))
        : baseDays;

    return activeSlots.map((slot, idx) => {
        const existingItem = Array.isArray(brand.existingPlan) ? brand.existingPlan[idx] : null;
        const hook = existingItem?.hook || slot.defaultHook;
        const ctaType: OmniCtaType = existingItem?.ctaType || slot.ctaType;
        const ctaBadge = existingItem?.ctaBadge || slot.ctaBadge;
        const ctaActionText = existingItem?.ctaActionText || slot.ctaActionText;
        const ctaTargetUrl = existingItem?.ctaTargetUrl || slot.ctaTargetUrl;
        const mediaFormat: 'image' | 'video' = existingItem?.mediaFormat || slot.mediaFormat;
        const omniPrompt = existingItem?.omniPrompt || slot.omniPrompt;
        const postId = existingItem?.id || `${brand.id}_day_${idx + 1}`;

        let strategicCaption = existingItem?.caption || '';
        if (!strategicCaption || strategicCaption.length < 40) {
            if (ctaType === 'APP_CONVERSION') {
                strategicCaption = `${hook}\n\n✅ تصفح الباقات والأسعار واحجز موعدك مباشرة من متجر وتطبيق البراند في 30 ثانية:\n${fullStoreUrl}\n🎁 خصم 10% فوري عند تأكيد الحجز بعربون 25% عبر إنستاباي أو فودافون كاش.\n📞 للتواصل السريع: ${brand.phone || '01013373634'}`;
            } else if (ctaType === 'WHATSAPP_VOICE_AGENT') {
                strategicCaption = `${hook}\n\n💬 اضغط على رابط واتساب للتحدث فوراً مع وكيلنا الذكي (رد صوتي بشري ونصي في 3 ثوانٍ على مدار الساعة):\n${waLink}\n🛒 أو احجز مباشرة من متجرنا الرسمي: ${fullStoreUrl}`;
            } else {
                const kw = slot.commentKeyword || 'عرض';
                strategicCaption = `${hook}\n\n👇 اكتب كلمة (${kw}) في التعليقات الآن، وسيقوم نظام ${brand.name} الذكي بالرد عليك وإرسال تفاصيل الباقات ورابط الحجز المباشر في رسائل الصفحة فوراً!\n📞 واتساب مباشر: ${brand.phone || '01013373634'}`;
            }
        }

        const visualUrl =
            existingItem?.visualUrl && !existingItem.visualUrl.startsWith('data:image/svg')
                ? existingItem.visualUrl
                : generateBrandedPostSvgDataUrl({
                      brandName: brand.name,
                      businessType: brand.businessType,
                      primaryColor: brand.primaryColor,
                      day: slot.day,
                      contentType: existingItem?.contentType || slot.contentType,
                      hook,
                      ctaBadge,
                      phone: brand.phone || '01013373634',
                      storeUrl: storePath,
                      ctaType
                  });

        let turboFlowJobId = existingItem?.turboFlowJobId;
        let turboFlowStatus: OmniWeekPostItem['turboFlowStatus'] = existingItem?.turboFlowStatus || (mediaFormat === 'video' ? 'queued' : 'not_required');
        if (mediaFormat === 'video') {
            const job = enqueueTurboFlowVideoJob({
                postId,
                brandId: brand.id,
                brandName: brand.name,
                day: slot.day,
                hook,
                omniPrompt,
                aspectRatio: '9:16',
                model: 'veo-3.1-fast'
            });
            turboFlowJobId = job.jobId;
            if (existingItem?.videoUrl) {
                turboFlowStatus = 'completed';
            }
        }

        const postDate = new Date(Date.now() + idx * 86400000);

        return {
            id: postId,
            day: slot.day,
            dateIso: existingItem?.dateIso || postDate.toISOString(),
            mediaFormat,
            pillar: slot.pillar,
            pillarLabel: slot.pillarLabel,
            contentType: existingItem?.contentType || slot.contentType,
            hook,
            caption: strategicCaption,
            bestTime: existingItem?.bestTime || slot.bestTime,
            ctaType,
            ctaBadge,
            ctaActionText,
            ctaTargetUrl,
            commentKeyword: slot.commentKeyword,
            visualUrl,
            videoUrl: existingItem?.videoUrl,
            omniPrompt,
            turboFlowJobId,
            turboFlowStatus,
            status: existingItem?.status || 'draft',
            firestoreDocId: existingItem?.firestoreDocId || `jarvis_${brand.id}_day_${idx + 1}`
        };
    });
}

/**
 * Generates an Enterprise 1-Month Omnichannel Marketing Plan (4 Weeks / 12 Posts: Sun, Tue, Thu)
 */
export function generateFullMonthOmniPlan(brand: {
    id: string;
    slug?: string;
    name: string;
    businessType?: string;
    phone?: string;
    primaryColor?: string;
    strategy?: any;
}): {
    monthPlan: OmniWeekPostItem[];
    firstPost: OmniWeekPostItem;
    scheduledCount: number;
    weeksCount: number;
} {
    const weekDays = ['الأحد', 'الثلاثاء', 'الخميس'];
    const monthPlan: OmniWeekPostItem[] = [];
    const baseSlug = brand.slug || brand.id;
    const storePath = `/store/${baseSlug}`;
    const fullStoreUrl = `https://t2-studio.vercel.app${storePath}`;
    const waLink = `https://wa.me/2${(brand.phone || '01013373634').replace(/^0/, '')}`;

    const themes = [
        {
            weekName: 'الأسبوع 1: إطلاق وجذب الاهتمام (Launch & Hook)',
            hooks: [
                `أقوى انطلاقة لـ ${brand.name} في عالم ${brand.businessType || 'الخدمات'}! احجز الآن بخصم 10% فوري.`,
                `ليه تضيع وقتك؟ شاهد كفاءة وسرعة تنفيذ ${brand.name} في 30 ثانية!`,
                `عرض الويك إند الاستثنائي من ${brand.name}: حجز مؤكد بعربون 25% فقط عبر إنستاباي.`
            ]
        },
        {
            weekName: 'الأسبوع 2: بناء الثقة وكسر الاعتراضات (Social Proof & Case Study)',
            hooks: [
                `قبل وبعد شغلنا مع ${brand.name} — الجودة اللي تستحقها بدون أي مغامرة!`,
                `3 أخطاء شائعة بيتجاهلها المنافسون وتضمنها لك ${brand.name} 100%!`,
                `ضمان شامل ومتابعة دورية مجانية مع كل حجز لـ ${brand.name} هذا الأسبوع.`
            ]
        },
        {
            weekName: 'الأسبوع 3: تسليط الضوء على باقات VIP والحلول المتكاملة',
            hooks: [
                `تعرف على باقة VIP الحصرية من ${brand.name} — حل متكامل لأصحاب الذوق الرفيع.`,
                `سر نجاح عملائنا مع ${brand.name}: دقة متناهية وسرعة رد صوتي في 3 ثوانٍ!`,
                `الحجز المسبق لباقات VIP من ${brand.name} متاح الآن بخصم 15% للدفع الإلكتروني.`
            ]
        },
        {
            weekName: 'الأسبوع 4: عروض الإغلاق والتوسيع ونهاية الشهر (Closing Deals)',
            hooks: [
                `الفرصة الأخيرة قبل انتهاء عروض هذا الشهر من ${brand.name}!`,
                `ليه عملاؤنا بيختاروا ${brand.name} دايماً؟ تقييمات حقيقية وتجارب فخر!`,
                `عرض نهاية الشهر الصاعق من ${brand.name} — الأولوية لأول 10 حجوزات مؤكدة اليوم!`
            ]
        }
    ];

    let postIndex = 0;
    for (let w = 0; w < 4; w++) {
        const theme = themes[w];
        for (let d = 0; d < 3; d++) {
            postIndex++;
            const dayName = weekDays[d];
            const isVideo = d === 1; // Tuesday is Video Reel
            const isOffer = d === 2; // Thursday is Offer
            const hook = theme.hooks[d];
            const ctaType: OmniCtaType = isOffer ? 'APP_CONVERSION' : isVideo ? 'WHATSAPP_VOICE_AGENT' : 'COMMENT_TO_MESSENGER';

            const postDate = new Date(Date.now() + (w * 7 + (d === 0 ? 0 : d === 1 ? 2 : 4)) * 86400000);

            const item: OmniWeekPostItem = {
                id: `${brand.id}_month_post_${postIndex}`,
                firestoreDocId: `jarvis_${brand.id}_m_${postIndex}`,
                day: `${theme.weekName} - ${dayName}`,
                dateIso: postDate.toISOString(),
                mediaFormat: isVideo ? 'video' : 'image',
                pillar: isOffer ? 'conversion_offer' : isVideo ? 'events_seasons' : 'product_marketing',
                pillarLabel: isOffer ? 'عرض نهاية الأسبوع المباشر' : isVideo ? 'ريلز سينمائي Turbo Flow' : 'تسويق المنتجات والخدمات (Feed 1:1)',
                contentType: isVideo ? 'فيديو ريلز Google Flow (9:16)' : 'تصميم تيتو ستوديو (Feed 1:1)',
                hook,
                caption: `${hook}\n\n${isOffer ? `🛒 احجز الآن مباشرة من المتجر الرسمي بخصم 10%:\n${fullStoreUrl}\n🎁 سداد 25% عربون عبر إنستاباي أو فودافون كاش.` : isVideo ? `💬 تواصل واتساب فوري مع وكيلنا الذكي:\n${waLink}\n📞 خط الدعم: ${brand.phone || '01013373634'}` : `👇 اكتب "عرض" في التعليقات وسنرسل لك تفاصيل الباقات وكود الخصم فوراً!`}`,
                ctaType,
                ctaBadge: isOffer ? '🛒 احجز من التطبيق بخصم 10%' : isVideo ? '💬 تواصل واتساب فوري' : '🤖 اكتب عرض في تعليق',
                ctaActionText: isOffer ? `افتح المتجر واحجز: ${storePath}` : `تواصل واتساب: ${brand.phone || '01013373634'}`,
                ctaTargetUrl: isOffer ? storePath : waLink,
                bestTime: '8:00 مساءً',
                status: postIndex === 1 ? 'draft' : 'scheduled',
                visualUrl: generateBrandedPostSvgDataUrl({
                    brandName: brand.name,
                    businessType: brand.businessType,
                    primaryColor: brand.primaryColor,
                    day: dayName,
                    contentType: isVideo ? 'فيديو ريلز (9:16)' : 'تصميم Feed (1:1)',
                    hook,
                    ctaBadge: isOffer ? '🛒 احجز من التطبيق' : '💬 تواصل واتساب',
                    phone: brand.phone || '01013373634',
                    storeUrl: storePath,
                    ctaType
                }),
                omniPrompt: isVideo
                    ? `Vertical 9:16 cinematic commercial reel for ${brand.name} (${brand.businessType || 'premium brand'}), smooth camera glide, photorealistic 4K Veo style, no text.`
                    : `Ultra-luxury commercial advertising photo for ${brand.name} (${brand.businessType || 'premium brand'}), dramatic studio lighting, 8k resolution, no text overlay.`
            };

            monthPlan.push(item);
        }
    }

    return {
        monthPlan,
        firstPost: monthPlan[0],
        scheduledCount: monthPlan.length - 1,
        weeksCount: 4
    };
}

/**
 * Reads cached Tito Studio Firestore data synchronously for fast graph rendering
 */
export function readTitoStudioCacheSync(): TitoStudioCache {
    try {
        if (fs.existsSync(CACHE_PATH)) {
            const parsed = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
            if (parsed && Array.isArray(parsed.clinics)) {
                return parsed;
            }
        }
    } catch {}
    return {
        lastSyncedAt: '',
        clinics: [],
        content: [],
        appointments: [],
        strategies: {}
    };
}

/**
 * Fetches live `/clinics`, `/content`, and `/appointments` from `t2-content-studio` Firestore
 * using authenticated Firebase token and updates `data/tito_studio_cache.json`.
 */
export async function syncFromTitoStudioFirestore(): Promise<TitoStudioCache> {
    const currentCache = readTitoStudioCacheSync();
    try {
        const headers = await buildFirestoreHeaders();
        const [clinicsResp, contentResp, appsResp] = await Promise.all([
            fetch(`${FIRESTORE_BASE_URL}/clinics?pageSize=100`, { headers, signal: AbortSignal.timeout(7000) }),
            fetch(`${FIRESTORE_BASE_URL}/content?pageSize=200`, { headers, signal: AbortSignal.timeout(7000) }),
            fetch(`${FIRESTORE_BASE_URL}/appointments?pageSize=100`, { headers, signal: AbortSignal.timeout(7000) })
        ]);

        const clinicsJson: any = clinicsResp.ok ? await clinicsResp.json() : {};
        const contentJson: any = contentResp.ok ? await contentResp.json() : {};
        const appsJson: any = appsResp.ok ? await appsResp.json() : {};

        const clinics = (clinicsJson.documents || []).map(fromFirestoreDoc).filter(Boolean);
        const content = (contentJson.documents || []).map(fromFirestoreDoc).filter(Boolean);
        const appointments = (appsJson.documents || []).map(fromFirestoreDoc).filter(Boolean);

        const updatedCache: TitoStudioCache = {
            lastSyncedAt: new Date().toISOString(),
            clinics: clinics.length > 0 ? clinics : currentCache.clinics,
            content: content.length > 0 ? content : currentCache.content,
            appointments: appointments.length > 0 ? appointments : currentCache.appointments,
            strategies: currentCache.strategies || {}
        };

        try {
            if (!fs.existsSync(path.dirname(CACHE_PATH))) {
                fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
            }
            fs.writeFileSync(CACHE_PATH, JSON.stringify(updatedCache, null, 2), 'utf8');
        } catch {}

        return updatedCache;
    } catch (err: any) {
        console.warn('[TitoStudioBridge] Using cached Firestore snapshot:', err?.message);
        return currentCache;
    }
}

/**
 * Upserts a brand document into `/clinics/{brandId}` in `t2-content-studio` Firestore (with authenticated token)
 * AND persists it immediately into the unified local Tito Studio cache (`data/tito_studio_cache.json`).
 */
export async function upsertBrandToTitoStudioFirestore(brand: any): Promise<boolean> {
    if (!brand || (!brand.id && !brand.slug)) return false;
    const docId = String(brand.titoStudioClinicId || brand.id || brand.slug);

    const catalogItems = (brand.productsCatalog || []).map((item: any, idx: number) => ({
        id: item.id || `srv_${idx + 1}`,
        name: item.name || 'خدمة معتمدة',
        price: String(item.price || '500 ج.م'),
        description: item.description || 'خدمة متميزة بضمان كامل',
        category: item.category || 'خدمات أساسية',
        image: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
    }));

    const priceListText = catalogItems.map((c: any) => `• ${c.name}: ${c.price}`).join('\n');

    const clinicDoc: Record<string, any> = {
        id: docId,
        name: brand.name || docId,
        englishName: brand.englishName || brand.slug || docId,
        slug: brand.slug || docId,
        industry: brand.industry || 'services',
        customIndustry: brand.businessType || 'خدمات وأعمال',
        phone: brand.phone || '01013373634',
        whatsappNumber: brand.whatsapp || brand.phone || '01013373634',
        whatsappEnabled: true,
        autopilotEnabled: true,
        salesRadarAutoReplyEnabled: true,
        primaryColor: brand.primaryColor || '#06b6d4',
        logo: brand.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&auto=format&fit=crop&q=80',
        address: brand.address || 'القاهرة، جمهورية مصر العربية',
        slogan: brand.directKnowledge || `أفضل خدمات ${brand.businessType || ''} في مصر بخصم 10% للحجز الفوري`,
        priceList: priceListText,
        servicesDetails: brand.knowledgeText || brand.systemPrompt || '',
        ownerUid: brand.ownerUid || 'system_jarvis_os',
        landingPageConfig: {
            enabled: true,
            pageType: 'services',
            brandSlug: brand.slug || docId,
            heroTitle: brand.name,
            heroSubtitle: brand.directKnowledge || `مرحباً بك في ${brand.name}`,
            ctaButtonText: 'احجز الآن بخصم 10%',
            whatsappCtaText: 'تحدث مع المستشار الذكي',
            catalogItems
        }
    };

    if (brand.marketingStrategy) {
        clinicDoc.marketingStrategy = brand.marketingStrategy;
    }
    if (brand.metaToken) clinicDoc.metaToken = brand.metaToken;
    if (brand.metaPageId || brand.metaPageName) {
        clinicDoc.selectedMetaPage = {
            id: brand.metaPageId || '',
            name: brand.metaPageName || brand.name
        };
    }

    // 1. Update local Tito Studio cache immediately
    try {
        const cache = readTitoStudioCacheSync();
        const existingIdx = cache.clinics.findIndex((c: any) => c.id === docId || c.slug === brand.slug);
        if (existingIdx >= 0) {
            cache.clinics[existingIdx] = { ...cache.clinics[existingIdx], ...clinicDoc };
        } else {
            cache.clinics.unshift(clinicDoc);
        }
        cache.lastSyncedAt = new Date().toISOString();
        if (!fs.existsSync(path.dirname(CACHE_PATH))) {
            fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
        }
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    } catch {}

    // 2. Authenticated Firestore REST PATCH to `t2-content-studio`
    try {
        const headers = await buildFirestoreHeaders();
        const fields = toFirestoreFields(clinicDoc);
        const url = `${FIRESTORE_BASE_URL}/clinics/${encodeURIComponent(docId)}`;
        await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ fields }),
            signal: AbortSignal.timeout(6000)
        });
    } catch {}

    return true;
}

/**
 * Pushes a brand's 7-Day Omni-Channel Content Plan into `/content` collection in `t2-content-studio`
 * (both local shared cache and authenticated Firestore REST endpoint) so the calendar in Tito Studio and Jarvis are 100% unified!
 */
export async function syncWeekPlanToTitoStudioFirestore(brand: any, weekPlan?: OmniWeekPostItem[]): Promise<number> {
    const clinicId = String(brand.titoStudioClinicId || brand.id || brand.slug);
    const plan = weekPlan || buildOmniChannelWeekPlan({
        id: brand.id || clinicId,
        slug: brand.slug || clinicId,
        name: brand.name || clinicId,
        businessType: brand.businessType,
        phone: brand.phone,
        primaryColor: brand.primaryColor,
        existingPlan: brand.weekContentPlan,
        strategy: brand.marketingStrategy
    });

    const cache = readTitoStudioCacheSync();
    const headers = await buildFirestoreHeaders();
    let syncedCount = 0;

    for (let i = 0; i < plan.length; i++) {
        const post = plan[i];
        const docId = post.firestoreDocId || `jarvis_${clinicId}_day_${i + 1}`;
        const postDate = post.dateIso ? new Date(post.dateIso) : new Date(Date.now() + i * 86400000);
        const isVideo = post.mediaFormat === 'video' || post.contentType.includes('فيديو') || post.contentType.includes('Reel');

        const contentDoc: Record<string, any> = {
            id: docId,
            clinicId,
            type: isVideo ? 'video' : 'image',
            mediaFormat: isVideo ? 'video' : 'image',
            title: `${post.day}: ${post.hook.slice(0, 60)}`,
            hook: post.hook,
            caption: post.caption,
            content: post.caption,
            visualUrl: post.videoUrl || post.visualUrl,
            videoUrl: post.videoUrl || '',
            omniPrompt: post.omniPrompt || '',
            turboFlowJobId: post.turboFlowJobId || '',
            turboFlowStatus: post.turboFlowStatus || (isVideo ? 'queued' : 'not_required'),
            hashtags: ['#T2_Studio', `#${(brand.name || '').replace(/\s+/g, '_')}`, '#خصم_الحجز_الفوري'],
            date: postDate.toISOString(),
            bestTime: post.bestTime || '8:00 مساءً',
            status: post.status || 'draft',
            scheduledPlatforms: ['facebook', 'instagram'],
            postFormat: isVideo ? 'reels' : 'post',
            ownerUid: brand.ownerUid || 'system_jarvis_os',
            isAutopilot: true,
            autopilotApproved: post.status === 'scheduled' || post.status === 'published',
            pillar: post.pillar || (post.ctaType === 'APP_CONVERSION' ? 'product_marketing' : post.ctaType === 'WHATSAPP_VOICE_AGENT' ? 'events_seasons' : 'educational_loyalty'),
            pillarLabel: post.pillarLabel || post.ctaBadge,
            ctaType: post.ctaType,
            ctaBadge: post.ctaBadge,
            ctaTargetUrl: post.ctaTargetUrl
        };

        const existingIdx = cache.content.findIndex((c: any) => c.id === docId);
        if (existingIdx >= 0) {
            cache.content[existingIdx] = contentDoc;
        } else {
            cache.content.push(contentDoc);
        }

        // Push to live `t2-content-studio` Firestore `/content/{docId}`
        try {
            const fields = toFirestoreFields(contentDoc);
            await fetch(`${FIRESTORE_BASE_URL}/content/${encodeURIComponent(docId)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ fields }),
                signal: AbortSignal.timeout(4500)
            });
        } catch {}

        syncedCount++;
    }

    try {
        cache.lastSyncedAt = new Date().toISOString();
        if (!fs.existsSync(path.dirname(CACHE_PATH))) {
            fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
        }
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    } catch {}

    return syncedCount;
}

/**
 * Approves and schedules all posts in a brand's 7-day plan (`status = 'scheduled'`, `autopilotApproved = true`)
 * both in `t2-content-studio` Firestore and in local cache.
 */
export async function approveBrandScheduleInTitoStudio(brandId: string): Promise<{ approvedCount: number; posts: any[] }> {
    const cache = readTitoStudioCacheSync();
    const headers = await buildFirestoreHeaders();
    const updatedPosts: any[] = [];

    for (let i = 0; i < cache.content.length; i++) {
        const item = cache.content[i];
        if (item.clinicId === brandId || String(item.id || '').includes(brandId)) {
            if (item.status !== 'published') {
                item.status = 'scheduled';
                item.autopilotApproved = true;
                item.approvedAt = new Date().toISOString();
            }
            updatedPosts.push(item);
            try {
                const fields = toFirestoreFields(item);
                await fetch(`${FIRESTORE_BASE_URL}/content/${encodeURIComponent(item.id)}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ fields }),
                    signal: AbortSignal.timeout(4000)
                });
            } catch {}
        }
    }

    try {
        cache.lastSyncedAt = new Date().toISOString();
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    } catch {}

    return { approvedCount: updatedPosts.length, posts: updatedPosts };
}

/**
 * Attaches a completed video URL from Turbo Flow Bridge to the calendar post in `t2-content-studio`
 */
export async function completeTurboFlowVideoJob(params: {
    jobId?: string;
    postId?: string;
    brandId?: string;
    videoUrl: string;
}): Promise<{ updated: boolean; job?: TurboFlowVideoJob; post?: any }> {
    const queue = readTurboFlowQueue();
    const jobIdx = queue.findIndex(
        j => (params.jobId && j.jobId === params.jobId) || (params.postId && j.postId === params.postId)
    );

    let matchedJob: TurboFlowVideoJob | undefined;
    if (jobIdx >= 0) {
        queue[jobIdx].status = 'completed';
        queue[jobIdx].videoUrl = params.videoUrl;
        queue[jobIdx].completedAt = new Date().toISOString();
        matchedJob = queue[jobIdx];
        saveTurboFlowQueue(queue);
    }

    const cache = readTitoStudioCacheSync();
    const headers = await buildFirestoreHeaders();
    let matchedPost: any = null;

    for (let i = 0; i < cache.content.length; i++) {
        const c = cache.content[i];
        if (
            (matchedJob && (c.turboFlowJobId === matchedJob.jobId || c.id === matchedJob.postId || c.id === `jarvis_${matchedJob.brandId}_day_${matchedJob.postId.split('_').pop()}`)) ||
            (params.postId && c.id === params.postId)
        ) {
            c.videoUrl = params.videoUrl;
            c.visualUrl = params.videoUrl;
            c.turboFlowStatus = 'completed';
            matchedPost = c;

            try {
                const fields = toFirestoreFields(c);
                await fetch(`${FIRESTORE_BASE_URL}/content/${encodeURIComponent(c.id)}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ fields }),
                    signal: AbortSignal.timeout(4500)
                });
            } catch {}
            break;
        }
    }

    try {
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    } catch {}

    return { updated: Boolean(matchedJob || matchedPost), job: matchedJob, post: matchedPost };
}
