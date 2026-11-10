import fs from 'fs';
import path from 'path';

const PROJECT_ID = 't2-content-studio';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const CACHE_PATH = path.join(process.cwd(), 'data', 'tito_studio_cache.json');

export type OmniCtaType = 'APP_CONVERSION' | 'WHATSAPP_VOICE_AGENT' | 'COMMENT_TO_MESSENGER';

export interface OmniWeekPostItem {
    id?: string;
    day: string;
    dateIso?: string;
    contentType: string;
    hook: string;
    caption: string;
    bestTime: string;
    ctaType: OmniCtaType;
    ctaBadge: string;
    ctaActionText: string;
    ctaTargetUrl: string;
    commentKeyword?: string;
    visualUrl: string;
    status?: 'draft' | 'scheduled' | 'published';
    firestoreDocId?: string;
}

export interface TitoStudioCache {
    lastSyncedAt: string;
    clinics: any[];
    content: any[];
    appointments: any[];
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
 * so every post in Tito Studio & Jarvis Battle Station has a real visual creative preview.
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

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050b14"/>
      <stop offset="55%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="${primary}33"/>
    </linearGradient>
    <linearGradient id="pill" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${primary}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="700" cy="120" r="210" fill="${primary}" opacity="0.12"/>
  <circle cx="100" cy="700" r="240" fill="${accent}" opacity="0.10"/>
  <rect x="44" y="44" width="712" height="712" rx="34" fill="none" stroke="${primary}" stroke-opacity="0.35" stroke-width="2"/>
  
  <!-- Top Header -->
  <rect x="80" y="82" width="290" height="44" rx="22" fill="${primary}26" stroke="${primary}" stroke-width="1.5"/>
  <text x="225" y="110" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="18" font-weight="bold" fill="#e2e8f0" text-anchor="middle">${dayBadge}</text>

  <text x="720" y="108" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="end">${brandName}</text>
  <text x="720" y="138" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="16" font-weight="600" fill="${accent}" text-anchor="end">${businessType}</text>

  <!-- Center Hook Box -->
  <rect x="76" y="210" width="648" height="310" rx="28" fill="#0f172acc" stroke="#334155" stroke-width="2"/>
  <text x="400" y="325" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="33" font-weight="900" fill="#ffffff" text-anchor="middle">${hookLine1}</text>
  <text x="400" y="380" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="30" font-weight="800" fill="#38bdf8" text-anchor="middle">${hookLine2}</text>
  <text x="400" y="455" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="20" font-weight="700" fill="#94a3b8" text-anchor="middle">متابعة فورية بالذكاء الاصطناعي • ضمان معتمد • خصم 10% للحجز المبكر</text>

  <!-- Omni-CTA Pill -->
  <rect x="130" y="565" width="540" height="74" rx="37" fill="url(#pill)"/>
  <text x="400" y="611" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="24" font-weight="900" fill="#041019" text-anchor="middle">${ctaBadge}</text>

  <!-- Footer -->
  <text x="715" y="710" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="20" font-weight="bold" fill="#cbd5e1" text-anchor="end">واتساب وخدمة العملاء: ${phone}</text>
  <text x="85" y="710" font-family="Cairo, Tajawal, Arial, sans-serif" font-size="16" font-weight="bold" fill="${accent}" text-anchor="start">T2 STUDIO × JARVIS OMNI-ENGINE</text>
</svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Builds the 7-Day Omni-Channel CTA Matrix (The "Addiction Funnel") for any brand.
 *Alternates between:
 * 1) APP_CONVERSION -> Drives traffic to `/store/:slug` with 10% instant booking discount.
 * 2) WHATSAPP_VOICE_AGENT -> Drives traffic to `wa.me/201...` where T2 Agent replies with Gemini 24kHz voice.
 * 3) COMMENT_TO_MESSENGER -> Viral comment keyword trigger (`"عرض"` / `"تفاصيل"`) for auto-DM + reply.
 */
export function buildOmniChannelWeekPlan(brand: {
    id: string;
    slug?: string;
    name: string;
    businessType?: string;
    phone?: string;
    primaryColor?: string;
    existingPlan?: any[];
}): OmniWeekPostItem[] {
    const slug = brand.slug || brand.id;
    const rawPhone = String(brand.phone || '01013373634').replace(/[^0-9]/g, '');
    const intlPhone = rawPhone.startsWith('0') ? `2${rawPhone}` : rawPhone;
    const storePath = `/store/${slug}`;
    const fullStoreUrl = `https://t2-growth-os.vercel.app/store/${slug}?utm_source=tito_studio`;
    const waLink = `https://wa.me/${intlPhone}?text=${encodeURIComponent(`أهلاً ${brand.name}، شفت عرض السوشيال وعاوز أحجز وأستفيد بخصم 10% الفوري`)}`;

    const baseDays: Array<{
        day: string;
        contentType: string;
        defaultHook: string;
        ctaType: OmniCtaType;
        ctaBadge: string;
        ctaActionText: string;
        ctaTargetUrl: string;
        commentKeyword?: string;
        bestTime: string;
    }> = [
        {
            day: 'السبت',
            contentType: 'بوست تحويل مباشر للتطبيق (Feed 1:1)',
            defaultHook: `احجز خدمتك الآن من تطبيق ${brand.name} الرسمي بخصم 10% فوري بدون انتظار!`,
            ctaType: 'APP_CONVERSION',
            ctaBadge: '🛒 احجز من التطبيق بخصم 10% فوري',
            ctaActionText: `افتح المتجر واحجز في 30 ثانية: ${storePath}`,
            ctaTargetUrl: storePath,
            bestTime: '8:00 مساءً'
        },
        {
            day: 'الأحد',
            contentType: 'فيديو ريلز محادثة واتساب (Reels 9:16)',
            defaultHook: `عندك استفسار؟ وكيل ${brand.name} الذكي يرد عليك بصوت بشري في 3 ثوانٍ على واتساب!`,
            ctaType: 'WHATSAPP_VOICE_AGENT',
            ctaBadge: '💬 تواصل واتساب فوري (رد صوتي ذكي)',
            ctaActionText: `اضغط لمحادثة واتساب المباشرة: ${ brand.phone || '01013373634' }`,
            ctaTargetUrl: waLink,
            bestTime: '9:00 مساءً'
        },
        {
            day: 'الإثنين',
            contentType: 'بوست تفاعلي فيروسي (Auto-DM Trigger)',
            defaultHook: `اكتب كلمة "عرض" في تعليق وهيوصلك كتالوج أسعار ${brand.name} وكود الخصم في رسالة فوراً!`,
            ctaType: 'COMMENT_TO_MESSENGER',
            ctaBadge: '🤖 اكتب "عرض" في تعليق لاستلام الكتالوج',
            ctaActionText: 'رد تلقائي على التعليق + رسالة ماسنجر فورية بالكتالوج',
            ctaTargetUrl: storePath,
            commentKeyword: 'عرض',
            bestTime: '8:30 مساءً'
        },
        {
            day: 'الثلاثاء',
            contentType: 'دراسة حالة قبل وبعد + تحويل للتطبيق',
            defaultHook: `شوف النتيجة بنفسك مع ${brand.name} — ثبت موعدك الآن من التطبيق بعربون 25%!`,
            ctaType: 'APP_CONVERSION',
            ctaBadge: '🛒 ثبت حجزك من التطبيق (خصم 10%)',
            ctaActionText: `احجز الباقة المناسبة من التطبيق: ${storePath}`,
            ctaTargetUrl: storePath,
            bestTime: '7:30 مساءً'
        },
        {
            day: 'الأربعاء',
            contentType: 'كاروسيل تعليمي + استشارة واتساب صوتية',
            defaultHook: `3 أسرار ذهبية من خبراء ${brand.name} توفر عليك نص التكلفة والوقت!`,
            ctaType: 'WHATSAPP_VOICE_AGENT',
            ctaBadge: '💬 اطلب استشارتك الصوتية عبر واتساب',
            ctaActionText: `تحدث مع المستشار الذكي على واتساب: ${brand.phone || '01013373634'}`,
            ctaTargetUrl: waLink,
            bestTime: '9:00 مساءً'
        },
        {
            day: 'الخميس',
            contentType: 'مسابقة وعرض تفاعلي (Comment-to-DM)',
            defaultHook: `اكتب "تفاصيل" في الكومنتات وهنبعتلك هدية نهاية الأسبوع من ${brand.name} حالاً!`,
            ctaType: 'COMMENT_TO_MESSENGER',
            ctaBadge: '🤖 علق بكلمة "تفاصيل" لاستلام الهدية',
            ctaActionText: 'إرسال فوري عبر Messenger / Instagram DM',
            ctaTargetUrl: storePath,
            commentKeyword: 'تفاصيل',
            bestTime: '10:00 مساءً'
        },
        {
            day: 'الجمعة',
            contentType: 'عرض نهاية الأسبوع VIP (إغلاق مبيعات)',
            defaultHook: `عرض الجمعة الحصري من ${brand.name} — أول 10 حجوزات اليوم بخصم إضافي وأولوية تنفيذ!`,
            ctaType: 'WHATSAPP_VOICE_AGENT',
            ctaBadge: '🔥 اقفل حجزك الآن عبر واتساب أو التطبيق',
            ctaActionText: `حجز فوري عبر واتساب (${brand.phone || '01013373634'}) أو المتجر (${storePath})`,
            ctaTargetUrl: waLink,
            bestTime: '5:00 مساءً'
        }
    ];

    return baseDays.map((slot, idx) => {
        const existingItem = Array.isArray(brand.existingPlan) ? brand.existingPlan[idx] : null;
        const hook = existingItem?.hook || slot.defaultHook;
        const ctaType: OmniCtaType = existingItem?.ctaType || slot.ctaType;
        const ctaBadge = existingItem?.ctaBadge || slot.ctaBadge;
        const ctaActionText = existingItem?.ctaActionText || slot.ctaActionText;
        const ctaTargetUrl = existingItem?.ctaTargetUrl || slot.ctaTargetUrl;

        let strategicCaption = existingItem?.caption || '';
        if (!strategicCaption || strategicCaption.length < 40) {
            if (ctaType === 'APP_CONVERSION') {
                strategicCaption = `${hook}\n\n✅ تصفح الباقات والأسعار واحجز موعدك مباشرة من تطبيقنا في 30 ثانية:\n${fullStoreUrl}\n🎁 خصم 10% فوري عند تأكيد الحجز بعربون 25% عبر إنستاباي أو فودافون كاش.\n📞 للتواصل السريع: ${brand.phone || '01013373634'}`;
            } else if (ctaType === 'WHATSAPP_VOICE_AGENT') {
                strategicCaption = `${hook}\n\n💬 اضغط على رابط واتساب للتحدث فوراً مع وكيلنا الذكي (رد صوتي ونصي في 3 ثوانٍ على مدار الساعة):\n${waLink}\n🛒 أو احجز مباشرة من متجرنا الرسمي: ${fullStoreUrl}`;
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

        const postDate = new Date(Date.now() + idx * 86400000);

        return {
            id: existingItem?.id || `${brand.id}_day_${idx + 1}`,
            day: slot.day,
            dateIso: existingItem?.dateIso || postDate.toISOString(),
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
            status: existingItem?.status || 'scheduled',
            firestoreDocId: existingItem?.firestoreDocId
        };
    });
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
        appointments: []
    };
}

/**
 * Fetches live `/clinics`, `/content`, and `/appointments` from `t2-content-studio` Firestore
 * and updates the local cache file (`data/tito_studio_cache.json`).
 */
export async function syncFromTitoStudioFirestore(): Promise<TitoStudioCache> {
    const currentCache = readTitoStudioCacheSync();
    try {
        const [clinicsResp, contentResp, appsResp] = await Promise.all([
            fetch(`${FIRESTORE_BASE_URL}/clinics?pageSize=100`, { signal: AbortSignal.timeout(7000) }),
            fetch(`${FIRESTORE_BASE_URL}/content?pageSize=200`, { signal: AbortSignal.timeout(7000) }),
            fetch(`${FIRESTORE_BASE_URL}/appointments?pageSize=100`, { signal: AbortSignal.timeout(7000) })
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
            appointments: appointments.length > 0 ? appointments : currentCache.appointments
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
 * Upserts a brand document into `/clinics/{brandId}` in `t2-content-studio` Firestore (if write rules allow)
 * AND persists it immediately into the unified local Tito Studio cache (`data/tito_studio_cache.json`)
 * so any brand created or edited in Jarvis / App Cloner immediately appears in Tito Studio & Jarvis!
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

    if (brand.metaToken) clinicDoc.metaToken = brand.metaToken;
    if (brand.metaPageId || brand.metaPageName) {
        clinicDoc.selectedMetaPage = {
            id: brand.metaPageId || '',
            name: brand.metaPageName || brand.name
        };
    }

    // 1. Update local Tito Studio cache immediately so both apps share instant state
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

    // 2. Attempt direct Firestore REST PATCH
    try {
        const fields = toFirestoreFields(clinicDoc);
        const url = `${FIRESTORE_BASE_URL}/clinics/${encodeURIComponent(docId)}`;
        await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields }),
            signal: AbortSignal.timeout(5000)
        });
    } catch {}

    return true;
}

/**
 * Pushes a brand's 7-Day Omni-Channel Content Plan into `/content` collection in `t2-content-studio`
 * (both local shared cache and Firestore REST endpoint) so the calendar in Tito Studio and Jarvis are 100% unified!
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
        existingPlan: brand.weekContentPlan
    });

    const cache = readTitoStudioCacheSync();
    let syncedCount = 0;

    for (let i = 0; i < plan.length; i++) {
        const post = plan[i];
        const docId = post.firestoreDocId || `jarvis_${clinicId}_day_${i + 1}`;
        const postDate = post.dateIso ? new Date(post.dateIso) : new Date(Date.now() + i * 86400000);

        const contentDoc: Record<string, any> = {
            id: docId,
            clinicId,
            type: post.contentType.includes('فيديو') || post.contentType.includes('Reel') ? 'video' : 'image',
            title: `${post.day}: ${post.hook.slice(0, 60)}`,
            hook: post.hook,
            caption: post.caption,
            content: post.caption,
            visualUrl: post.visualUrl,
            hashtags: ['#T2_Studio', `#${(brand.name || '').replace(/\s+/g, '_')}`, '#خصم_الحجز_الفوري'],
            date: postDate.toISOString(),
            status: post.status || 'scheduled',
            scheduledPlatforms: ['facebook', 'instagram'],
            postFormat: post.contentType.includes('9:16') || post.contentType.includes('Reel') ? 'reels' : 'post',
            ownerUid: brand.ownerUid || 'system_jarvis_os',
            isAutopilot: true,
            autopilotApproved: true,
            pillar: post.ctaType === 'APP_CONVERSION' ? 'product_marketing' : post.ctaType === 'WHATSAPP_VOICE_AGENT' ? 'events_seasons' : 'educational_loyalty',
            pillarLabel: post.ctaBadge,
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
