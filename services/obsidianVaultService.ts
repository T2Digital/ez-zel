import fs from 'fs';
import path from 'path';
import { writeJsonAtomic, savePersistentJson, getPersistentFilePath } from './persistentStorage';
import { BRAND_VAULT } from './brandVault';
import { findMatchingBrandRecord, transliterateArabicToSlug } from './brandIdentityNormalizer';
import { applyRegistryToBrands } from './brandRegistryService';
import { readBookings, saveBooking, broadcastGatewayEvent } from './microservicesGateway';
import { publishBrandPost, launchAdCampaign, getPublishedLogs, validateAndBindBrandContent } from './growthAgencyEngine';
import { cloneOrSynthesizeBrand } from './appClonerCrawlerService';
import {
    readTitoStudioCacheSync,
    syncFromTitoStudioFirestore,
    buildOmniChannelWeekPlan,
    upsertBrandToTitoStudioFirestore,
    syncWeekPlanToTitoStudioFirestore,
    generateBrandMarketingStrategy,
    generateFullMonthOmniPlan,
    approveBrandScheduleInTitoStudio
} from './titoStudioFirestoreBridge';

export interface ObsidianNode {
    id: string;
    label: string;
    type: 'hub' | 'brand' | 'storefront' | 'studio_calendar' | 'whatsapp_agent' | 'meta_ads' | 'crm_booking' | 'ezzel_client';
    brandId?: string;
    status: 'online' | 'idle' | 'warning' | 'active';
    color: string;
    metrics?: Record<string, any>;
    markdownFile?: string;
    x?: number;
    y?: number;
}

export interface ObsidianEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    active: boolean;
}

export interface ObsidianVaultSnapshot {
    vaultPath: string;
    lastSyncedAt: string;
    nodes: ObsidianNode[];
    edges: ObsidianEdge[];
    ezZelPersonalClients: any[];
    growthAgencyBrands: any[];
    summary: {
        totalNodes: number;
        totalEdges: number;
        totalEzZelClients: number;
        totalGrowthBrands: number;
        totalMRR: number;
    };
}

const VAULT_ROOT = path.join(process.cwd(), 'obsidian_vault');
const BUNDLED_BRANDS_JSON_PATH = path.join(process.cwd(), 'data', 'brands.json');
const TENANTS_JSON_PATH = path.join(process.cwd(), 'data', 'tenants.json');
const EZZEL_CLIENTS_PATH = path.join(process.cwd(), 'data', 'ezzel_clients.json');
const T2_AGENT_BRANDS_PATH = process.env.T2_AGENT_BRANDS_PATH || '';

function getBrandsJsonPath(): string {
    return getPersistentFilePath('brands.json');
}

function readMergedBrandsJsonFile(): Record<string, any> {
    let merged: Record<string, any> = {};
    try {
        if (fs.existsSync(BUNDLED_BRANDS_JSON_PATH)) {
            const parsed = JSON.parse(fs.readFileSync(BUNDLED_BRANDS_JSON_PATH, 'utf8'));
            if (parsed && typeof parsed === 'object') merged = { ...parsed };
        }
    } catch {}
    try {
        const persistentPath = getBrandsJsonPath();
        if (persistentPath !== BUNDLED_BRANDS_JSON_PATH && fs.existsSync(persistentPath)) {
            const parsed = JSON.parse(fs.readFileSync(persistentPath, 'utf8'));
            if (parsed && typeof parsed === 'object') {
                for (const [k, v] of Object.entries(parsed)) {
                    merged[k] = { ...(merged[k] || {}), ...(v as any) };
                }
            }
        }
    } catch {}
    return merged;
}

export function resolveBrandExternalOrStoreUrl(slugOrKey: string, ...candidates: any[]): string {
    for (const c of candidates) {
        if (typeof c === 'string') {
            const trimmed = c.trim();
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
        }
    }
    if (slugOrKey === 'al_genedy') {
        return process.env.AL_GENEDY_STANDALONE_URL || 'https://al-genedy.vercel.app';
    }
    return `/store/${slugOrKey}`;
}

function ensureVaultDirectories() {
    const dirs = [
        VAULT_ROOT,
        path.join(VAULT_ROOT, '00_Master_Core'),
        path.join(VAULT_ROOT, '01_Growth_Agency_Brands'),
        path.join(VAULT_ROOT, '02_EzZel_Personal_Clients'),
        path.join(VAULT_ROOT, '03_Tito_Studio_Calendars'),
        path.join(VAULT_ROOT, '04_Tito_Agent_WhatsApp'),
        path.join(VAULT_ROOT, '05_CRM_Confirmed_Bookings')
    ];
    for (const d of dirs) {
        if (!fs.existsSync(d)) {
            try { fs.mkdirSync(d, { recursive: true }); } catch {}
        }
    }
}

const LEGACY_ADMIN_CLIENT_IDS = new Set([
    'ezzel_usr_01',
    'ezzel_usr_02',
    'ezzel_usr_03',
    'ezzel_usr_04',
    'ezzel_usr_05',
]);

export function getEzZelPersonalClients(): any[] {
    if (fs.existsSync(EZZEL_CLIENTS_PATH)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(EZZEL_CLIENTS_PATH, 'utf8'));
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((c: any) =>
                    LEGACY_ADMIN_CLIENT_IDS.has(String(c?.id || ''))
                        ? { ...c, accountOrigin: 'admin_managed', monthlySubscriptionEgp: 0 }
                        : c
                );
            }
        } catch {}
    }

    const defaultClients = [
        {
            id: 'ezzel_usr_01',
            name: 'أحمد عطية (الماستر تيتو)',
            role: 'Super Admin & Founder',
            plan: 'Sovereign Master Unlimited',
            voicePersona: 'Gemini Puck 24kHz (البشري الأصيل)',
            status: 'active',
            accountOrigin: 'admin_managed',
            activeTasksCount: 14,
            memoryNodesCount: 128,
            monthlySubscriptionEgp: 0,
            affiliateEarningsEgp: 0,
            joinedAt: '2026-01-01',
            devices: ['Windows Workstation (D:\\ez-zel-)', 'Android Sovereign Phone']
        },
        {
            id: 'ezzel_usr_02',
            name: 'د. نور الدين (عيادة كريستال)',
            role: 'عميل إدارة حالي (خارج حسابات الظل)',
            plan: 'Admin Managed',
            voicePersona: 'Gemini Puck 24kHz',
            status: 'active',
            accountOrigin: 'admin_managed',
            activeTasksCount: 8,
            memoryNodesCount: 42,
            monthlySubscriptionEgp: 0,
            affiliateEarningsEgp: 0,
            joinedAt: '2026-10-15',
            linkedBrandId: 'crystal_teeth'
        },
        {
            id: 'ezzel_usr_03',
            name: 'م. محمود خضر (شركة الخضر للسيارات)',
            role: 'عميل إدارة حالي (خارج حسابات الظل)',
            plan: 'Admin Managed',
            voicePersona: 'Gemini Puck 24kHz',
            status: 'active',
            accountOrigin: 'admin_managed',
            activeTasksCount: 11,
            memoryNodesCount: 64,
            monthlySubscriptionEgp: 0,
            affiliateEarningsEgp: 0,
            joinedAt: '2026-10-20',
            linkedBrandId: 'alkhedr_car_rental'
        },
        {
            id: 'ezzel_usr_04',
            name: 'أ. بيشوي (Sale Gates Egypt)',
            role: 'عميل إدارة حالي (خارج حسابات الظل)',
            plan: 'Admin Managed',
            voicePersona: 'Gemini Puck 24kHz',
            status: 'active',
            accountOrigin: 'admin_managed',
            activeTasksCount: 9,
            memoryNodesCount: 53,
            monthlySubscriptionEgp: 0,
            affiliateEarningsEgp: 0,
            joinedAt: '2026-10-25',
            linkedBrandId: 'besho'
        },
        {
            id: 'ezzel_usr_05',
            name: 'أ. محمد بطاح (بطاح لقطع الغيار)',
            role: 'عميل إدارة حالي (خارج حسابات الظل)',
            plan: 'Admin Managed',
            voicePersona: 'Gemini Kore 24kHz',
            status: 'trial',
            accountOrigin: 'admin_managed',
            activeTasksCount: 4,
            memoryNodesCount: 19,
            monthlySubscriptionEgp: 0,
            affiliateEarningsEgp: 0,
            joinedAt: '2026-11-08',
            linkedBrandId: 'battah_system'
        }
    ];

    try {
        if (!fs.existsSync(path.dirname(EZZEL_CLIENTS_PATH))) {
            fs.mkdirSync(path.dirname(EZZEL_CLIENTS_PATH), { recursive: true });
        }
        fs.writeFileSync(EZZEL_CLIENTS_PATH, JSON.stringify(defaultClients, null, 2), 'utf8');
    } catch {}

    return defaultClients;
}

export function getUnifiedGrowthBrands(): any[] {
    const mergedMap = new Map<string, any>();

    // 1. Seed from BRAND_VAULT
    Object.values(BRAND_VAULT).forEach((b: any) => {
        mergedMap.set(b.id, {
            id: b.id,
            slug: b.id,
            name: b.name,
            englishName: b.englishName || b.id,
            businessType: b.category || 'نشاط تجاري',
            phone: b.phone || b.whatsapp || '01013373634',
            whatsapp: b.whatsapp || b.phone || '01013373634',
            status: b.status || 'شغال',
            conversationsCount: b.conversationsCount || 0,
            metaConnected: !!(b.metaPageId || b.metaToken),
            metaPageName: b.metaPageName || b.name,
            metaPageId: b.metaPageId || '',
            subscriptionPlan: b.subscriptionPlan || 'VIP غير محدود',
            appUrl: resolveBrandExternalOrStoreUrl(b.id, b.dedicatedLiveUrl, b.appUrl),
            liveUrl: `https://${b.id.replace(/_/g, '-')}.vercel.app`,
            productsCatalog: Object.entries(b.catalog || {}).map(([k, v]: [string, any], idx) => ({
                id: k || `srv_${idx}`,
                name: v.name || k,
                price: String(v.price || '500 ج.م'),
                description: v.details || 'خدمة معتمدة بأعلى جودة وضمان'
            })),
            weekContentPlan: b.id === 't2_digital_os' ? [
                {
                    day: 'السبت',
                    contentType: 'بوست تصميم Feed (1:1)',
                    hook: 'إزاي ذكاء اصطناعي واحد وفر مرتب 3 موظفين وضاعف مبيعات الشركات؟',
                    caption: 'منظومة T2 ديجيتال والظل السيادي: بتعمل استراتيجية البراند، تصمم الصور في تيتو ستوديو، وتولد فيديوهات فلو، وترد على زباينك في الواتساب 24/7 وتقفل الحجز. احجز أسبوع التجربة المجانية الآن!',
                    bestTime: '8:00 مساءً'
                },
                {
                    day: 'الإثنين',
                    contentType: 'فيديو ريلز وتيك توك (9:16)',
                    hook: 'وداعاً لفواتير الإعلانات المحروقة.. جارفيس بيتفاوض بصوت بشري ويقفل الحجز في 3 ثواني!',
                    caption: 'شاهد بالفيديو كيف يدير جارفيس أسطول البراندات، يرد على استفسارات الأسعار والمواعيد، ويحصل العربون آلياً. جرب أسبوعك المجاني الآن.',
                    bestTime: '9:00 مساءً'
                },
                {
                    day: 'الأربعاء',
                    contentType: 'بوست عرض خاص وحجز فوري (1:1)',
                    hook: 'عرض أسبوع التجربة المجانية لرواد الأعمال وأصحاب الشركات في مصر!',
                    caption: 'بنجهز لك متجرك، وتطبيقك، وهوية صفحات السوشيال (فيسبوك، إنستا، تيك توك) مع 3 منشورات وبوت واتساب مجاناً بالكامل. اضغط وتواصل مع جارفيس فوراً.',
                    bestTime: '7:30 مساءً'
                }
            ] : [
                {
                    day: 'السبت',
                    contentType: 'بوست تصميم Feed (1:1)',
                    hook: `أقوى انطلاقة لـ ${b.name} لهذا الأسبوع بخصم خاص للحجز الفوري!`,
                    caption: `احجز الآن عبر تطبيقنا أو واتساب ${b.phone || ''} واستفد من أولوية المواعيد وضمان الجودة المعتمد.`,
                    bestTime: '8:00 مساءً'
                },
                {
                    day: 'الإثنين',
                    contentType: 'فيديو ريلز وتيك توك (9:16)',
                    hook: `ليه عملاء ${b.name} دايماً مطمنين؟ شوف النتيجة بنفسك!`,
                    caption: `فريقنا جاهز لخدمتك على مدار الساعة مع متابعة فورية عبر وكيلنا الذكي. اطلب خدمتك الآن.`,
                    bestTime: '9:00 مساءً'
                },
                {
                    day: 'الأربعاء',
                    contentType: 'بوست عرض خاص وحجز فوري (1:1)',
                    hook: `عرض منتصف الأسبوع الاستثنائي من ${b.name} — العدد محدود للحجز اليوم!`,
                    caption: `تواصل معنا على ${b.phone || ''} لتأكيد حجزك والاستفادة من خصم التجربة الحصري.`,
                    bestTime: '7:30 مساءً'
                }
            ]
        });
    });

    // 2. Overlay from data/brands.json (bundled + persistent /var/data)
    {
        const rawBrands = readMergedBrandsJsonFile();
        Object.values(rawBrands).forEach((cb: any) => {
            if (!cb || (!cb.id && !cb.slug)) return;
            const key = cb.id || cb.slug;
            const existing = mergedMap.get(key) || {};
            mergedMap.set(key, {
                ...existing,
                ...cb,
                id: key,
                slug: cb.slug || key,
                name: cb.name || existing.name || key,
                businessType: cb.businessType || existing.businessType || 'نشاط تجاري',
                phone: cb.phone || existing.phone || '01013373634',
                appUrl: resolveBrandExternalOrStoreUrl(
                    cb.slug || key,
                    cb.dedicatedLiveUrl,
                    cb.appUrl,
                    existing.dedicatedLiveUrl,
                    existing.appUrl
                ),
                productsCatalog: Array.isArray(cb.productsCatalog) && cb.productsCatalog.length > 0
                    ? cb.productsCatalog
                    : (existing.productsCatalog || []),
                weekContentPlan: Array.isArray(cb.weekContentPlan) && cb.weekContentPlan.length > 0
                    ? cb.weekContentPlan
                    : (existing.weekContentPlan || [])
            });
        });
    }

    // 3. Overlay from T2-Agent brands.json if configured via T2_AGENT_BRANDS_PATH
    if (T2_AGENT_BRANDS_PATH && fs.existsSync(T2_AGENT_BRANDS_PATH)) {
        try {
            const agentBrands = JSON.parse(fs.readFileSync(T2_AGENT_BRANDS_PATH, 'utf8'));
            Object.values(agentBrands).forEach((ab: any) => {
                if (!ab || !ab.id) return;
                const existing = mergedMap.get(ab.id) || {};
                mergedMap.set(ab.id, {
                    ...existing,
                    id: ab.id,
                    slug: existing.slug || ab.id,
                    name: ab.name || existing.name || ab.id,
                    businessType: ab.businessType || existing.businessType || 'نشاط تجاري',
                    phone: ab.notificationWhatsApp || ab.bookingReceiverPhone || existing.phone || '01013373634',
                    status: ab.status || existing.status || 'شغال',
                    appUrl: resolveBrandExternalOrStoreUrl(existing.slug || ab.id, existing.dedicatedLiveUrl, existing.appUrl),
                    productsCatalog: existing.productsCatalog || [],
                    weekContentPlan: existing.weekContentPlan || []
                });
            });
        } catch {}
    }

    // 4. Overlay from Tito Studio Firebase Firestore (`t2-content-studio` cache: /clinics + /content)
    const studioCache = readTitoStudioCacheSync();
    const studioNameMap: Record<string, string> = {
        '2': 'crystal_teeth',
        '3': 'socotra_dental',
        '4': 'alkhalig_dental',
        '5': 'dental_district',
        '6': 'mecca_dental',
        '7': 'dr_abdelaziz_moussa',
        'brand_1786261318926': 'al_shomoukh_dentistry',
        'brand_1788540631941': 'clean_master',
        'brand_1785774967683': 'alkhedr_car_rental',
        'brand_1783239457203': 'fazaa_express',
        'brand_1780593467882': 'sky_vip',
        'brand_1780863827841': 'baraka_motors',
        'brand_1779847291377': 'tito_media',
        'brand_1779846650608': 'crypto_arabi'
    };

    (studioCache.clinics || []).forEach((clinic: any) => {
        if (!clinic || !clinic.id) return;
        const mappedKey =
            studioNameMap[clinic.id] ||
            (clinic.slug && mergedMap.has(clinic.slug) ? clinic.slug : null) ||
            Array.from(mergedMap.values()).find(
                (b: any) => b.name && clinic.name && b.name.trim() === clinic.name.trim()
            )?.id ||
            (clinic.slug ? clinic.slug.replace(/-/g, '_') : `studio_${clinic.id}`);

        const existing = mergedMap.get(mappedKey) || {};
        const landingItems = clinic.landingPageConfig?.catalogItems || [];
        const studioCatalog = Array.isArray(landingItems)
            ? landingItems.map((item: any, idx: number) => ({
                  id: item.id || `studio_srv_${idx + 1}`,
                  name: item.name || 'خدمة معتمدة',
                  price: String(item.price || '600 ج.م'),
                  description: item.description || clinic.slogan || 'خدمة متكاملة بأعلى جودة',
                  imageUrl: item.image || clinic.logo || ''
              }))
            : [];

        // Match any live /content documents from Tito Studio for this clinic
        const clinicContentDocs = (studioCache.content || []).filter(
            (cnt: any) => cnt.clinicId === clinic.id || cnt.clinicId === mappedKey
        );

        const studioWeekPosts = clinicContentDocs.map((cnt: any, idx: number) => ({
            id: cnt.id,
            firestoreDocId: cnt.id,
            day: cnt.title?.split(':')[0] || ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'][idx % 7],
            mediaFormat: (cnt.type === 'video' || cnt.type === 'reel' || cnt.mediaFormat === 'video') ? 'video' : 'image',
            contentType: cnt.type === 'video' ? 'فيديو ريلز 9:16' : 'تصميم سوشيال 1:1',
            hook: cnt.hook || cnt.title || `عرض مميز من ${clinic.name}`,
            caption: cnt.caption || cnt.content || '',
            bestTime: '8:30 مساءً',
            ctaType: cnt.ctaType || (idx % 3 === 0 ? 'APP_CONVERSION' : idx % 3 === 1 ? 'WHATSAPP_VOICE_AGENT' : 'COMMENT_TO_MESSENGER'),
            ctaBadge: cnt.ctaBadge || '🛒 احجز الآن بخصم 10%',
            ctaTargetUrl: cnt.ctaTargetUrl || `/store/${existing.slug || mappedKey}`,
            visualUrl: cnt.visualUrl || '',
            videoUrl: cnt.videoUrl || '',
            status: cnt.status || 'scheduled'
        }));

        const existingPlanArr = Array.isArray(existing.weekContentPlan) ? existing.weekContentPlan : [];
        const isExistingTrial = existing.subscriptionStatus === 'trial' || existing.planId === 'trial_7d';
        const mergedStudioWeekPosts = studioWeekPosts.map((sp: any, idx: number) => {
            const matchedExisting =
                existingPlanArr.find(
                    (ep: any) =>
                        (ep?.firestoreDocId && ep.firestoreDocId === sp.id) ||
                        (ep?.id && ep.id === sp.id)
                ) || existingPlanArr[idx];
            if (!matchedExisting) return sp;
            return {
                ...sp,
                ...(matchedExisting.revisionCount !== undefined ? { revisionCount: Number(matchedExisting.revisionCount) } : {}),
                ...(matchedExisting.clientApproval !== undefined ? { clientApproval: matchedExisting.clientApproval } : {}),
                ...(matchedExisting.clientFeedback !== undefined ? { clientFeedback: matchedExisting.clientFeedback } : {}),
                ...(matchedExisting.updatedAt !== undefined ? { updatedAt: matchedExisting.updatedAt } : {}),
                ...(matchedExisting.mediaFormat ? { mediaFormat: matchedExisting.mediaFormat } : {}),
                ...(matchedExisting.videoUrl ? { videoUrl: matchedExisting.videoUrl } : {}),
                status: matchedExisting.clientApproval ? matchedExisting.status : sp.status,
            };
        });
        const resolvedStudioWeekPlan = isExistingTrial && existingPlanArr.length > 0
            ? existingPlanArr.slice(0, 3).map((ep: any, idx: number) => {
                const sp = mergedStudioWeekPosts.find(
                    (s: any) =>
                        (ep?.firestoreDocId && ep.firestoreDocId === s.id) ||
                        (ep?.id && ep.id === s.id)
                ) || mergedStudioWeekPosts[idx];
                if (!sp) return ep;
                return {
                    ...sp,
                    ...ep,
                    visualUrl: (sp.visualUrl && !String(sp.visualUrl).startsWith('data:image/svg')) ? sp.visualUrl : ep.visualUrl,
                    videoUrl: sp.videoUrl || ep.videoUrl,
                };
            })
            : (isExistingTrial ? mergedStudioWeekPosts.slice(0, 3) : mergedStudioWeekPosts);

        const existingPhoneClean =
            existing.phone && existing.phone !== '01013373634' ? String(existing.phone).trim() : '';
        const existingWaClean =
            existing.whatsapp && existing.whatsapp !== '01013373634' && existing.whatsapp !== '201013373634'
                ? String(existing.whatsapp).trim()
                : '';

        mergedMap.set(mappedKey, {
            ...existing,
            id: mappedKey,
            titoStudioClinicId: clinic.id,
            titoStudioSynced: true,
            slug: existing.slug || clinic.slug || mappedKey,
            name: existing.name || (clinic.name ? clinic.name.trim() : mappedKey),
            englishName: clinic.englishName || existing.englishName || mappedKey,
            businessType: existing.businessType || clinic.customIndustry || clinic.industry || 'خدمات وأعمال',
            phone: (existingPhoneClean || clinic.phone || clinic.whatsappNumber || existing.phone || '01013373634').trim(),
            whatsapp: (existingWaClean || clinic.whatsappNumber || clinic.phone || existing.whatsapp || '01013373634').trim(),
            primaryColor: clinic.primaryColor || existing.primaryColor || '#06b6d4',
            logo: clinic.logo || existing.logo || '',
            status: existing.status || 'شغال',
            metaConnected: Boolean(
                String(clinic.metaToken || existing.metaToken || '').trim() ||
                String(clinic.selectedMetaPage?.id || existing.metaPageId || '').trim()
            ),
            metaPageName: clinic.selectedMetaPage?.name || existing.metaPageName || clinic.name,
            metaPageId: clinic.selectedMetaPage?.id || existing.metaPageId || '',
            metaToken: clinic.metaToken || existing.metaToken || '',
            appUrl: resolveBrandExternalOrStoreUrl(
                existing.slug || clinic.slug || mappedKey,
                existing.dedicatedLiveUrl,
                existing.appUrl,
                clinic.appUrl,
                clinic.websiteUrl
            ),
            productsCatalog:
                existing.productsCatalog && existing.productsCatalog.length > 0
                    ? existing.productsCatalog
                    : studioCatalog,
            weekContentPlan:
                resolvedStudioWeekPlan.length > 0
                    ? resolvedStudioWeekPlan
                    : existing.weekContentPlan || []
        });
    });

    // 5. Enrich EVERY brand with the 7-Day Omni-Channel CTA Matrix & Visual Previews
    const finalBrands = Array.from(mergedMap.values()).map((brand: any) => {
        const isTrialBrand = brand.subscriptionStatus === 'trial' || brand.planId === 'trial_7d';
        const omniPlan = buildOmniChannelWeekPlan({
            id: brand.id,
            slug: brand.slug || brand.id,
            name: brand.name,
            businessType: brand.businessType,
            phone: brand.phone,
            primaryColor: brand.primaryColor,
            existingPlan: brand.weekContentPlan,
            isTrial: isTrialBrand
        });
        return {
            ...brand,
            titoStudioSynced: !!brand.titoStudioSynced || true,
            weekContentPlan: omniPlan
        };
    });

    const sanitizedBrands = finalBrands.filter((b: any) => {
        const nm = String(b?.name || '').trim();
        if (!nm || /^\?+(?:\s+\?+)*$/.test(nm) || nm.includes('????')) return false;
        return true;
    });

    return applyRegistryToBrands(sanitizedBrands);
}

/**
 * Generates physical Obsidian Markdown files (`[[WikiLinks]]`) and builds the live Knowledge Graph
 */
export function syncAndBuildObsidianVault(): ObsidianVaultSnapshot {
    ensureVaultDirectories();

    const brands = getUnifiedGrowthBrands();
    const ezzelClients = getEzZelPersonalClients();
    const bookings = readBookings();
    const publishedLogs = getPublishedLogs();

    const nodes: ObsidianNode[] = [];
    const edges: ObsidianEdge[] = [];

    // Central Sovereign Hub Node
    nodes.push({
        id: 'hub_jarvis_core',
        label: 'نواة الظل وجارفيس (Sovereign Core)',
        type: 'hub',
        status: 'online',
        color: '#06b6d4',
        x: 500,
        y: 300,
        metrics: {
            totalBrands: brands.length,
            totalClients: ezzelClients.length,
            totalBookings: bookings.length
        }
    });

    // Write Master Index Markdown
    const indexMd = `# 🧠 خزنة أوبسيديان السيادية — منظومة النمو الشامل (T2 Unified OS)
تاريخ المزامنة الحية: ${new Date().toISOString()}

## 1. قطاعات المنظومة المتصلة
- **عملاء تطبيق الظل (المساعد الشخصي):** ${ezzelClients.length} مشتركين
- **براندات منظومة النمو (Studio + Agent + Cloner):** ${brands.length} براند
- **الحجوزات الفعلية المؤكدة في CRM:** ${bookings.length} حجز

## 2. روابط البراندات النشطة (WikiLinks)
${brands.map(b => `- [[01_Growth_Agency_Brands/${b.id}|${b.name}]] — (${b.businessType}) — هاتف: \`${b.phone}\``).join('\n')}

## 3. عملاء الظل المشتركين
${ezzelClients.map(c => `- [[02_EzZel_Personal_Clients/${c.id}|${c.name}]] — ${c.plan}`).join('\n')}
`;
    try {
        fs.writeFileSync(path.join(VAULT_ROOT, '00_Master_Core', 'Index.md'), indexMd, 'utf8');
    } catch {}

    // Create Brand Nodes + Satellite Nodes (Storefront, Studio Calendar, WhatsApp Agent, CRM Bookings)
    const totalBrands = Math.max(1, brands.length);
    brands.forEach((b, idx) => {
        const angle = (idx / totalBrands) * Math.PI * 2;
        const radius = 210;
        const bx = Math.round(500 + Math.cos(angle) * radius);
        const by = Math.round(300 + Math.sin(angle) * radius);

        const brandBookings = bookings.filter(bk => bk.brandId === b.id);
        const brandPublished = publishedLogs.filter(lg => lg.brandId === b.id);
        const isBotOnline = b.id === 'clean_master' || b.id === 'besho' || b.status === 'شغال' || b.status === 'نشط';
        const resolvedStoreUrl = resolveBrandExternalOrStoreUrl(b.slug || b.id, b.dedicatedLiveUrl, b.appUrl);

        const brandNodeId = `brand_${b.id}`;
        nodes.push({
            id: brandNodeId,
            label: b.name,
            type: 'brand',
            brandId: b.id,
            status: isBotOnline ? 'online' : 'idle',
            color: isBotOnline ? '#10b981' : '#f59e0b',
            x: bx,
            y: by,
            markdownFile: `01_Growth_Agency_Brands/${b.id}.md`,
            metrics: {
                phone: b.phone,
                businessType: b.businessType,
                catalogCount: (b.productsCatalog || []).length,
                calendarPostsCount: (b.weekContentPlan || []).length,
                publishedCount: brandPublished.length,
                bookingsCount: brandBookings.length,
                metaConnected: !!b.metaConnected,
                storeUrl: resolvedStoreUrl
            }
        });

        edges.push({
            id: `edge_hub_${b.id}`,
            source: 'hub_jarvis_core',
            target: brandNodeId,
            label: 'إدارة سيادية',
            active: true
        });

        // Satellite sub-nodes for top 8 brands so graph stays super crisp and readable
        if (idx < 8) {
            const outerRadius = 325;
            const sx = Math.round(500 + Math.cos(angle - 0.08) * outerRadius);
            const sy = Math.round(300 + Math.sin(angle - 0.08) * outerRadius);
            const wx = Math.round(500 + Math.cos(angle + 0.08) * outerRadius);
            const wy = Math.round(300 + Math.sin(angle + 0.08) * outerRadius);

            const storeNodeId = `store_${b.id}`;
            nodes.push({
                id: storeNodeId,
                label: `تطبيق ${b.name.split(' ')[0]}`,
                type: 'storefront',
                brandId: b.id,
                status: 'online',
                color: '#38bdf8',
                x: sx,
                y: sy,
                metrics: { url: resolvedStoreUrl, items: (b.productsCatalog || []).length }
            });
            edges.push({
                id: `edge_store_${b.id}`,
                source: brandNodeId,
                target: storeNodeId,
                label: 'PWA متجر',
                active: true
            });

            const agentNodeId = `agent_${b.id}`;
            nodes.push({
                id: agentNodeId,
                label: `بوت واتساب (${b.phone})`,
                type: 'whatsapp_agent',
                brandId: b.id,
                status: isBotOnline ? 'online' : 'idle',
                color: '#22c55e',
                x: wx,
                y: wy,
                metrics: { phone: b.phone, bookingsCount: brandBookings.length }
            });
            edges.push({
                id: `edge_agent_${b.id}`,
                source: brandNodeId,
                target: agentNodeId,
                label: 'T2 Agent',
                active: isBotOnline
            });
        }

        // Write Obsidian Markdown Note for each Brand
        const systemInstructionText = b.systemInstruction || b.systemPrompt || `أنت المدير التنفيذي وموظف المبيعات الذكي لبراند ${b.name} (${b.businessType}). رد بالعامية المصرية الودودة واقنع العميل بالحجز الفوري.`;
        const brandMd = `---
id: ${b.id}
name: "${b.name}"
category: "${b.businessType}"
phone: "${b.phone}"
status: "${isBotOnline ? 'شغال' : 'متوقف'}"
storefront: "${resolvedStoreUrl}"
meta_connected: ${!!b.metaConnected}
updated_at: "${new Date().toISOString()}"
---

# 🏢 [[${b.name}]]
- **التصنيف:** ${b.businessType}
- **رقم واتساب المبيعات:** \`${b.phone}\`
- **رابط متجر وتطبيق البراند (PWA):** [فتح المتجر التفاعلي](${resolvedStoreUrl})
- **حالة الربط مع Meta:** ${b.metaConnected ? `متصل (${b.metaPageName})` : 'جاهز للربط الفوري'}

## 🔗 العقد المتصلة في أوبسيديان
- [[03_Tito_Studio_Calendars/${b.id}_calendar|تقويم محتوى تيتو ستوديو (${(b.weekContentPlan || []).length} منشورات)]]
- [[04_Tito_Agent_WhatsApp/${b.id}_agent|وكيل مبيعات واتساب (${b.phone})]]
- [[05_CRM_Confirmed_Bookings/${b.id}_bookings|سجل الحجوزات المؤكدة (${brandBookings.length} حجز)]]

## 🤖 توجيهات وتعليمات الأيجنت (System Prompt)
${systemInstructionText}

## 📦 كتالوج الخدمات والمنتجات (${(b.productsCatalog || []).length})
${(b.productsCatalog || []).map((p: any) => `- **${p.name}**: \`${p.price}\` — ${p.description || ''}`).join('\n')}

## 📅 خطة محتوى تيتو ستوديو الأسبوعية
${(b.weekContentPlan || []).map((w: any) => `- **${w.day} (${w.contentType})**: ${w.hook} *(الموعد: ${w.bestTime})*`).join('\n')}
`;
        try {
            isProgrammaticVaultWrite = true;
            fs.writeFileSync(path.join(VAULT_ROOT, '01_Growth_Agency_Brands', `${b.id}.md`), brandMd, 'utf8');
            setTimeout(() => { isProgrammaticVaultWrite = false; }, 350);
        } catch {}
    });

    const totalMRR =
        ezzelClients.reduce((s, c) => s + (c.monthlySubscriptionEgp || 0), 0) +
        brands.length * 2500;

    return {
        vaultPath: VAULT_ROOT,
        lastSyncedAt: new Date().toISOString(),
        nodes,
        edges,
        ezZelPersonalClients: ezzelClients,
        growthAgencyBrands: brands,
        summary: {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            totalEzZelClients: ezzelClients.length,
            totalGrowthBrands: brands.length,
            totalMRR
        }
    };
}

let isProgrammaticVaultWrite = false;
let obsidianWatcherInitialized = false;

/**
 * Parses an Obsidian Brand Markdown file back into structured brand properties
 * (Catalog items, System Prompt, Phone, Category, Status) for Two-Way Sync.
 */
export function parseObsidianBrandMarkdown(mdContent: string): {
    name?: string;
    businessType?: string;
    phone?: string;
    status?: string;
    systemInstruction?: string;
    productsCatalog?: Array<{ id: string; name: string; price: string; description: string }>;
} {
    const result: any = {};

    const nameMatch = mdContent.match(/^name:\s*"?([^"\r\n]+)"?/m);
    if (nameMatch) result.name = nameMatch[1].trim();

    const catMatch = mdContent.match(/^category:\s*"?([^"\r\n]+)"?/m);
    if (catMatch) result.businessType = catMatch[1].trim();

    const phoneMatch = mdContent.match(/^phone:\s*"?([^"\r\n]+)"?/m);
    if (phoneMatch) result.phone = phoneMatch[1].trim();

    const statusMatch = mdContent.match(/^status:\s*"?([^"\r\n]+)"?/m);
    if (statusMatch) result.status = statusMatch[1].trim();

    // Extract System Prompt section
    const promptSectionMatch = mdContent.match(/## 🤖 توجيهات وتعليمات الأيجنت[^\r\n]*\r?\n([\s\S]*?)(?=\r?\n## |\s*$)/);
    if (promptSectionMatch && promptSectionMatch[1].trim()) {
        result.systemInstruction = promptSectionMatch[1].trim();
    }

    // Extract Catalog section
    const catalogSectionMatch = mdContent.match(/## 📦 كتالوج الخدمات والمنتجات[^\r\n]*\r?\n([\s\S]*?)(?=\r?\n## |\s*$)/);
    if (catalogSectionMatch) {
        const lines = catalogSectionMatch[1].split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('- '));
        const parsedCatalog: Array<{ id: string; name: string; price: string; description: string }> = [];
        lines.forEach((line, idx) => {
            const itemMatch = line.match(/^-\s*\*\*([^*]+)\*\*:\s*`([^`]+)`(?:\s*—\s*(.*))?$/);
            if (itemMatch) {
                parsedCatalog.push({
                    id: `srv_${idx + 1}`,
                    name: itemMatch[1].trim(),
                    price: itemMatch[2].trim(),
                    description: (itemMatch[3] || 'خدمة معتمدة بأعلى جودة').trim()
                });
            }
        });
        if (parsedCatalog.length > 0) {
            result.productsCatalog = parsedCatalog;
        }
    }

    return result;
}

/**
 * Applies updates to a brand across both Ez-Zel (data/brands.json) and T2-Agent (data/brands.json)
 */
export function persistBrandUpdateAcrossEcosystem(brandId: string, updates: Record<string, any>): any {
    const cleanId = brandId.replace(/^(brand_|store_|agent_)/, '');
    const allCurrent = getUnifiedGrowthBrands();
    const existingBrand = findMatchingBrandRecord(allCurrent, cleanId) || { id: cleanId, slug: cleanId, name: cleanId };
    const canonicalKey = String(existingBrand.id || cleanId);

    const mergedBrand = {
        ...existingBrand,
        ...updates,
        id: canonicalKey,
        slug: existingBrand.slug || canonicalKey,
        updatedAt: new Date().toISOString()
    };

    // 1. Save to persistent Ez-Zel brands.json (+ Firestore mirror) using canonicalKey and deduplicating hyphen/underscore variants
    try {
        const rawBrands = readMergedBrandsJsonFile();
        const normNeedle = canonicalKey.toLowerCase().replace(/[-_]+/g, '');
        let previousVariantData: Record<string, any> = {};
        for (const k of Object.keys(rawBrands)) {
            if (k !== canonicalKey && k.toLowerCase().replace(/[-_]+/g, '') === normNeedle) {
                previousVariantData = { ...previousVariantData, ...(rawBrands[k] || {}) };
                delete rawBrands[k];
            }
        }
        rawBrands[canonicalKey] = {
            ...previousVariantData,
            ...(rawBrands[canonicalKey] || {}),
            ...mergedBrand
        };
        savePersistentJson('t2_brands_vault', 'brands.json', rawBrands);
    } catch {}

    // 2. Save to T2-Agent brands.json if explicitly configured via T2_AGENT_BRANDS_PATH
    try {
        if (T2_AGENT_BRANDS_PATH && fs.existsSync(T2_AGENT_BRANDS_PATH)) {
            const agentBrands = JSON.parse(fs.readFileSync(T2_AGENT_BRANDS_PATH, 'utf8'));
            agentBrands[cleanId] = {
                ...(agentBrands[cleanId] || {}),
                id: cleanId,
                name: mergedBrand.name,
                businessType: mergedBrand.businessType,
                phone: mergedBrand.phone,
                notificationWhatsApp: mergedBrand.phone,
                status: mergedBrand.status || 'شغال',
                systemPrompt: mergedBrand.systemInstruction || mergedBrand.systemPrompt || agentBrands[cleanId]?.systemPrompt || '',
                productsCatalog: mergedBrand.productsCatalog || agentBrands[cleanId]?.productsCatalog || [],
                updatedAt: new Date().toISOString()
            };
            fs.writeFileSync(T2_AGENT_BRANDS_PATH, JSON.stringify(agentBrands, null, 2), 'utf8');
        }
    } catch {}

    // 3. Push live update to Tito Studio Firebase Firestore (`t2-content-studio` -> /clinics) asynchronously
    upsertBrandToTitoStudioFirestore(mergedBrand).catch(() => {});

    // 4. Invalidate read-through Redis / memory cache for unified brand consistency
    void import('./redisCacheService')
        .then(({ invalidateCacheKeys }) =>
            invalidateCacheKeys([
                `t2os:brand:${canonicalKey.toLowerCase()}:slim`,
                `t2os:brand:${canonicalKey.toLowerCase()}:full`,
                `t2os:brand:${String(mergedBrand.slug || canonicalKey).toLowerCase()}:slim`,
                `t2os:brand:${String(mergedBrand.slug || canonicalKey).toLowerCase()}:full`,
                't2os:brands:all:slim',
                't2os:brands:all:full',
            ])
        )
        .catch(() => {});

    return mergedBrand;
}

export function deleteBrandVaultState(normSlug: string): void {
    const cleanNeedle = String(normSlug || '').trim().toLowerCase().replace(/[-_]+/g, '');
    if (!cleanNeedle) return;
    try {
        const rawBrands = readMergedBrandsJsonFile();
        let changed = false;
        for (const [k, v] of Object.entries(rawBrands)) {
            const keyNorm = String(k || '').toLowerCase().replace(/[-_]+/g, '');
            const idNorm = String((v as any)?.id || '').toLowerCase().replace(/[-_]+/g, '');
            const slugNorm = String((v as any)?.slug || '').toLowerCase().replace(/[-_]+/g, '');
            if (keyNorm === cleanNeedle || idNorm === cleanNeedle || slugNorm === cleanNeedle) {
                delete rawBrands[k];
                changed = true;
            }
        }
        if (changed) {
            savePersistentJson('t2_brands_vault', 'brands.json', rawBrands);
        }
    } catch {}
}

/**
 * Saves edited Obsidian Markdown from the HUD or external editor and syncs changes back to Storefront PWA & T2-Agent
 */
export function saveObsidianNodeMarkdown(brandOrNodeId: string, markdown: string): {
    success: boolean;
    brandId: string;
    updatedBrand: any;
    parsedChanges: any;
} {
    ensureVaultDirectories();
    const cleanId = brandOrNodeId.replace(/^(brand_|store_|agent_)/, '');
    const mdPath = path.join(VAULT_ROOT, '01_Growth_Agency_Brands', `${cleanId}.md`);

    isProgrammaticVaultWrite = true;
    fs.writeFileSync(mdPath, markdown, 'utf8');
    setTimeout(() => { isProgrammaticVaultWrite = false; }, 400);

    const parsedChanges = parseObsidianBrandMarkdown(markdown);
    const updatedBrand = persistBrandUpdateAcrossEcosystem(cleanId, parsedChanges);

    broadcastGatewayEvent('OBSIDIAN_VAULT_SYNCED', {
        brandId: cleanId,
        brandName: updatedBrand.name,
        source: 'two_way_markdown_sync',
        catalogCount: (updatedBrand.productsCatalog || []).length,
        timestamp: new Date().toISOString()
    });

    return {
        success: true,
        brandId: cleanId,
        updatedBrand,
        parsedChanges
    };
}

/**
 * Starts a real-time file watcher on obsidian_vault/01_Growth_Agency_Brands so any edit in the Obsidian app
 * immediately updates the live Storefront PWA, Tito Studio, Tito Agent, and Jarvis HUD.
 */
export function startObsidianTwoWayWatcher() {
    if (obsidianWatcherInitialized) return;
    ensureVaultDirectories();

    // Perform an immediate background sync from Tito Studio Firebase Firestore (`t2-content-studio`)
    // and refresh every 60 seconds so Jarvis & Obsidian stay 100% in sync with Tito Studio!
    syncFromTitoStudioFirestore().catch(() => {});
    setInterval(() => {
        syncFromTitoStudioFirestore().catch(() => {});
    }, 60000);

    const brandsVaultDir = path.join(VAULT_ROOT, '01_Growth_Agency_Brands');
    if (!fs.existsSync(brandsVaultDir)) return;

    obsidianWatcherInitialized = true;
    let debounceTimer: NodeJS.Timeout | null = null;

    try {
        fs.watch(brandsVaultDir, { persistent: false }, (_eventType, filename) => {
            if (isProgrammaticVaultWrite || !filename || !filename.endsWith('.md')) return;
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                try {
                    const brandId = filename.replace(/\.md$/i, '');
                    const fullPath = path.join(brandsVaultDir, filename);
                    if (!fs.existsSync(fullPath)) return;
                    const mdContent = fs.readFileSync(fullPath, 'utf8');
                    const parsed = parseObsidianBrandMarkdown(mdContent);
                    const updated = persistBrandUpdateAcrossEcosystem(brandId, parsed);
                    broadcastGatewayEvent('OBSIDIAN_VAULT_EXTERNAL_SYNC', {
                        brandId,
                        brandName: updated.name,
                        message: `تم رصد تعديل خارجي من تطبيق أوبسيديان على ملف (${filename}) ومزامنته حياً مع المتجر والأيجنت!`,
                        timestamp: new Date().toISOString()
                    });
                } catch {}
            }, 300);
        });
    } catch {}
}

export function getObsidianNodeMarkdown(brandOrNodeId: string): { title: string; markdown: string; brand?: any } {
    const cleanId = brandOrNodeId.replace(/^(brand_|store_|agent_)/, '');
    const snapshot = syncAndBuildObsidianVault();
    const brand = snapshot.growthAgencyBrands.find(b => b.id === cleanId || b.slug === cleanId);

    const mdPath = path.join(VAULT_ROOT, '01_Growth_Agency_Brands', `${cleanId}.md`);
    if (fs.existsSync(mdPath)) {
        return {
            title: brand?.name || cleanId,
            markdown: fs.readFileSync(mdPath, 'utf8'),
            brand
        };
    }

    const indexPath = path.join(VAULT_ROOT, '00_Master_Core', 'Index.md');
    return {
        title: 'Index.md — خزنة أوبسيديان السيادية',
        markdown: fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '# خزنة أوبسيديان السيادية جاهزة',
        brand: snapshot.growthAgencyBrands[0]
    };
}

/**
 * Executes real cross-app actions triggered from Jarvis HUD (Visitor, Subscriber/CEO, or Master Admin)
 */
export function saveCustomBrandOverride(brand: any) {
    try {
        const brandsOverridePath = path.join(VAULT_ROOT, '.brands_override.json');
        let overrides: any = {};
        if (fs.existsSync(brandsOverridePath)) {
            overrides = JSON.parse(fs.readFileSync(brandsOverridePath, 'utf8'));
        }
        overrides[brand.id] = brand;
        fs.writeFileSync(brandsOverridePath, JSON.stringify(overrides, null, 2), 'utf8');
    } catch {}
}
export const loadEzZelClients = getEzZelPersonalClients;

export async function executeRealJarvisEcosystemAction(input: {
    actionType: string;
    brandId?: string;
    data?: any;
    payload?: any;
}): Promise<any> {
    const { actionType, brandId = 'clean_master' } = input;
    const data = input.data ?? input.payload ?? {};

    switch (actionType) {
        case 'CONNECT_WHATSAPP_PAIRING': {
            const rawPhone = String(data.phone || '01013373634').replace(/[^0-9]/g, '');
            const intlPhone = rawPhone.startsWith('0') ? `2${rawPhone}` : rawPhone;

            // 1. Ensure the brand is registered in T2-Agent's database first
            persistBrandUpdateAcrossEcosystem(brandId, { phone: rawPhone });

            // 2. Attempt live Baileys Pairing Code & QR retrieval from T2-Agent server
            const { getT2AgentBaseUrl } = await import('./t2AgentApiClient');
            const candidateAgentUrls = [
                getT2AgentBaseUrl(),
                process.env.T2_AGENT_URL,
                'https://agent.t2os.app'
            ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

            let livePairingCode: string | null = null;
            let liveQrDataUrl: string | null = null;
            let liveBaileysConnected = false;

            const adminKey = process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY || '';
            const agentHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
            if (adminKey) agentHeaders['x-admin-key'] = adminKey;

            for (const baseUrl of candidateAgentUrls) {
                try {
                    const cleanBase = baseUrl.replace(/\/$/, '');
                    const pairResp = await fetch(`${cleanBase}/api/brands/${encodeURIComponent(brandId)}/pair-phone`, {
                        method: 'POST',
                        headers: agentHeaders,
                        body: JSON.stringify({ phoneNumber: intlPhone }),
                        signal: AbortSignal.timeout(7000)
                    });
                    if (pairResp.ok) {
                        const pairJson: any = await pairResp.json();
                        if (pairJson?.pairingCode) {
                            livePairingCode = pairJson.pairingCode;
                            liveBaileysConnected = true;
                        }
                    }
                    const qrResp = await fetch(`${cleanBase}/api/brands/${encodeURIComponent(brandId)}/qr`, {
                        method: 'GET',
                        headers: agentHeaders,
                        signal: AbortSignal.timeout(4000)
                    });
                    if (qrResp.ok) {
                        const qrJson: any = await qrResp.json();
                        if (qrJson?.pairingCode && !livePairingCode) {
                            livePairingCode = qrJson.pairingCode;
                            liveBaileysConnected = true;
                        }
                        if (qrJson?.qr) liveQrDataUrl = qrJson.qr;
                    }
                    if (livePairingCode || liveQrDataUrl) break;
                } catch {}
            }

            if (!livePairingCode && !liveQrDataUrl) {
                return {
                    success: false,
                    brandId,
                    phone: rawPhone,
                    pairingCode: '',
                    liveBaileysConnected: false,
                    qrDataUrl: '',
                    message: `تعذر استخراج كود اقتران واتساب الحي من خادم T2 Agent لرقم (${rawPhone}) حالياً. يرجى التأكد من صيغة الرقم أو المحاولة بعد ثوانٍ.`
                };
            }

            const pairingCode = livePairingCode || '';
            const qrDataUrl = liveQrDataUrl || '';

            broadcastGatewayEvent('WHATSAPP_PAIRING_READY', {
                brandId,
                phone: rawPhone,
                pairingCode,
                liveBaileysConnected,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                brandId,
                phone: rawPhone,
                pairingCode,
                liveBaileysConnected,
                qrDataUrl,
                message: pairingCode
                    ? `تم استخراج كود اقتران واتساب الرسمي الحي (${pairingCode}) من محرك Baileys لرقم (${rawPhone})! افتح واتساب > الأجهزة المرتبطة > الربط برقم الهاتف وأدخل الكود فوراً.`
                    : `تم تجهيز رمز QR الحي من محرك Baileys لرقم (${rawPhone})! امسحه من واتساب > الأجهزة المرتبطة.`
            };
        }

        case 'CONNECT_META_OAUTH': {
            let pageName = data.pageName || 'صفحة البراند الرسمية';
            let pageId = data.pageId || `meta_${Date.now().toString().slice(-8)}`;
            const pageAccessToken = data.pageAccessToken || data.pageToken || '';
            let verifiedWithGraphApi = false;
            let instagramUsername = '';

            // If user provided a real Meta Page Access Token, verify it live against Meta Graph API v21.0
            if (pageAccessToken && pageAccessToken.trim().length > 20) {
                try {
                    const targetNode = data.pageId ? String(data.pageId).trim() : 'me';
                    const graphUrl = `https://graph.facebook.com/v21.0/${targetNode}?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(pageAccessToken.trim())}`;
                    const graphResp = await fetch(graphUrl, { signal: AbortSignal.timeout(6000) });
                    if (graphResp.ok) {
                        const graphData: any = await graphResp.json();
                        if (graphData?.id) {
                            pageId = String(graphData.id);
                            pageName = graphData.name || pageName;
                            verifiedWithGraphApi = true;
                            instagramUsername = graphData?.instagram_business_account?.username || '';
                        }
                    }
                } catch {}
            }

            persistBrandUpdateAcrossEcosystem(brandId, {
                metaConnected: true,
                metaPageName: pageName,
                metaPageId: pageId,
                metaToken: pageAccessToken || undefined,
                instagramUsername: instagramUsername || undefined
            });
            syncAndBuildObsidianVault();

            broadcastGatewayEvent('META_PAGE_CONNECTED', {
                brandId,
                pageName,
                pageId,
                verifiedWithGraphApi,
                instagramUsername
            });

            return {
                success: true,
                brandId,
                pageName,
                pageId,
                verifiedWithGraphApi,
                instagramUsername,
                message: verifiedWithGraphApi
                    ? `تم التحقق الفعلي من توكن ميتا عبر Graph API v21.0 وربط صفحة (${pageName})${instagramUsername ? ` وحساب إنستجرام (@${instagramUsername})` : ''} بنجاح 100%!`
                    : `تم ربط صفحة فيسبوك وإنستجرام (${pageName}) بمحركي تيتو ستوديو وتيتو أجنت للرد التلقائي والنشر المجدول!`
            };
        }

        case 'UPDATE_STORE_CATALOG': {
            const allBrands = getUnifiedGrowthBrands();
            const qLower = String(brandId || '').trim().toLowerCase();
            const targetBrand = allBrands.find(
                (b) =>
                    String(b.id || '').toLowerCase() === qLower ||
                    String(b.slug || '').toLowerCase() === qLower ||
                    String(b.name || '').trim().toLowerCase() === qLower ||
                    String(b.name || '').toLowerCase().includes(qLower)
            );
            const resolvedBrandId = targetBrand?.id || brandId;
            const slugKey = String(targetBrand?.slug || transliterateArabicToSlug(targetBrand?.name || brandId || 'store'))
                .toLowerCase()
                .replace(/[^a-z0-9-]+/g, '-')
                .replace(/^-+|-+$/g, '') || 'store';
            const currentCatalog = Array.isArray(targetBrand?.productsCatalog) ? [...targetBrand.productsCatalog] : [];

            let addedNumericPrice = 500;
            if (data.addService && data.addService.name) {
                addedNumericPrice = Math.max(
                    1,
                    Number(data.addService.numericPrice || String(data.addService.price || '').replace(/[^\d.]/g, '')) || 500
                );
                const newSrv = {
                    id: `srv_${Date.now().toString().slice(-5)}`,
                    name: String(data.addService.name).trim(),
                    price: String(data.addService.price || `${addedNumericPrice} ج.م`).trim(),
                    numericPrice: addedNumericPrice,
                    category: String(data.addService.category || targetBrand?.businessType || 'المنتجات المميزة').trim(),
                    description: String(data.addService.description || 'متاح للطلب الفوري عبر المتجر والواتساب').trim(),
                    imageUrl: data.addService.imageUrl || undefined,
                };
                const existingIdx = currentCatalog.findIndex(
                    (item: any) => String(item.name || '').toLowerCase() === newSrv.name.toLowerCase()
                );
                if (existingIdx >= 0) {
                    currentCatalog[existingIdx] = { ...currentCatalog[existingIdx], ...newSrv };
                } else {
                    currentCatalog.unshift(newSrv);
                }
            } else if (Array.isArray(data.productsCatalog)) {
                currentCatalog.splice(0, currentCatalog.length, ...data.productsCatalog);
            }

            // 1. Synthesize product knowledge for Tito Agent (WhatsApp Bot Instructions)
            const catalogSummary = currentCatalog
                .slice(0, 10)
                .map((item: any) => `- ${item.name} (${item.price}): ${item.description || ''}`)
                .join('\n');
            const botInstruction = `أنت الوكيل الذكي لـ ${targetBrand?.name || brandId}. ترد على استفسارات العملاء على الواتساب بلباقة وسرعة، وتعرف قائمة الخدمات والأسعار الرسمية التالية وترشد العملاء لحجزها عبر الرابط أو الهاتف ${targetBrand?.phone || '01013373634'}:\n${catalogSummary}`;

            // 2. Synthesize product spotlight post in Tito Studio Content Calendar
            const existingPlan = Array.isArray(targetBrand?.weekContentPlan) ? [...targetBrand.weekContentPlan] : [];
            if (data.addService && data.addService.name) {
                const spotlightPost = {
                    day: 'الأحد',
                    contentType: `تسليط ضوء على منتج (${data.addService.name})`,
                    hook: `جديدنا في ${targetBrand?.name || brandId}: ${data.addService.name} بسعر ${data.addService.price || `${addedNumericPrice} ج.م`}!`,
                    caption: `${data.addService.description || ''} اطلب الآن وتواصل معنا عبر الواتساب على ${targetBrand?.phone || ''}.`,
                    bestTime: '10:00 صباحاً',
                    status: 'DRAFT_APPROVAL_REQUIRED'
                };
                existingPlan.unshift(spotlightPost);
            }

            const updatedBrand = persistBrandUpdateAcrossEcosystem(resolvedBrandId, {
                productsCatalog: currentCatalog,
                systemInstruction: botInstruction,
                weekContentPlan: existingPlan
            });
            syncAndBuildObsidianVault();
            syncWeekPlanToTitoStudioFirestore(updatedBrand, existingPlan).catch(() => {});

            // 3. CRITICAL: Persist directly to live Storefront Cloud ERP (Postgres + Firestore) & read-after-write verify
            let verifiedErpProductsCount = currentCatalog.length;
            let verifiedInStore = false;
            try {
                const { loadTenantErpState, saveTenantErpState } = await import('./tenantErpStoreService');
                const { getIndustryHeroImage } = await import('./industryHydrationService');
                const erpState = await loadTenantErpState(slugKey);
                let erpProducts = Array.isArray(erpState?.products) ? [...erpState.products] : [];

                if (data.addService && data.addService.name) {
                    const cleanName = String(data.addService.name).trim();
                    const img =
                        data.addService.imageUrl ||
                        getIndustryHeroImage(
                            `${targetBrand?.businessType || ''} ${cleanName}`,
                            targetBrand?.name || ''
                        );
                    const erpProd = {
                        id: Date.now(),
                        name: cleanName,
                        sku: `SKU-${Date.now().toString().slice(-5)}`,
                        category: String(data.addService.category || targetBrand?.businessType || 'المنتجات المميزة').trim(),
                        mainCategory: String(data.addService.category || targetBrand?.businessType || 'المنتجات المميزة').trim(),
                        description: String(data.addService.description || 'متاح للطلب الفوري عبر المتجر الإلكتروني').trim(),
                        purchasePrice: Math.round(addedNumericPrice * 0.65),
                        sellingPrice: addedNumericPrice,
                        stock: { main: 25, branch1: 10, branch2: 10, branch3: 10 },
                        imageUrl: img,
                        images: img ? [img] : [],
                    };
                    const idx = erpProducts.findIndex((p: any) => String(p?.name || '').trim().toLowerCase() === cleanName.toLowerCase());
                    if (idx >= 0) {
                        erpProducts[idx] = { ...erpProducts[idx], ...erpProd };
                    } else {
                        erpProducts = [erpProd, ...erpProducts];
                    }
                    await saveTenantErpState(slugKey, { products: erpProducts });
                    const readBack = await loadTenantErpState(slugKey);
                    const backProducts = Array.isArray(readBack?.products) ? readBack.products : [];
                    verifiedErpProductsCount = backProducts.length;
                    verifiedInStore = backProducts.some(
                        (p: any) =>
                            String(p?.name || '').trim().toLowerCase() === cleanName.toLowerCase() &&
                            Number(p?.sellingPrice) === addedNumericPrice
                    );
                } else if (Array.isArray(data.productsCatalog)) {
                    const { mapCatalogItemsToErpProducts } = await import('./industryHydrationService');
                    erpProducts = mapCatalogItemsToErpProducts(data.productsCatalog, targetBrand?.businessType || '', targetBrand?.name || '');
                    await saveTenantErpState(slugKey, { products: erpProducts });
                    const readBack = await loadTenantErpState(slugKey);
                    verifiedErpProductsCount = Array.isArray(readBack?.products) ? readBack.products.length : 0;
                    verifiedInStore = verifiedErpProductsCount > 0;
                }
            } catch (erpSyncErr: any) {
                console.warn('[UPDATE_STORE_CATALOG ERP Sync Error]:', erpSyncErr?.message || erpSyncErr);
            }

            broadcastGatewayEvent('STORE_CATALOG_UPDATED', {
                brandId: resolvedBrandId,
                brandName: updatedBrand.name,
                catalogCount: verifiedErpProductsCount
            });

            const liveStoreUrl = `https://store.t2os.app/s/${slugKey}`;
            if (data.addService?.name && !verifiedInStore) {
                return {
                    success: false,
                    brandId: resolvedBrandId,
                    liveStoreUrl,
                    verifiedErpProductsCount,
                    error: `تعذر تأكيد حفظ "${data.addService.name}" في قاعدة بيانات المتجر الحي (${liveStoreUrl}).`
                };
            }

            return {
                success: true,
                brandId: resolvedBrandId,
                brandName: updatedBrand.name,
                productsCatalog: currentCatalog,
                verifiedErpProductsCount,
                verifiedInStore,
                storeUrl: `/store/${slugKey}`,
                liveStoreUrl,
                message: `تمت إضافة وتحديث المنتج في الكتالوج والمتجر الحي (${liveStoreUrl}) وتأكيد وجود ${verifiedErpProductsCount} منتج في قاعدة البيانات.`
            };
        }

        case 'UPDATE_BOT_INSTRUCTIONS': {
            const newPrompt = String(data.systemInstruction || data.systemPrompt || '').trim();
            if (!newPrompt) {
                return { success: false, error: 'نص توجيهات الأيجنت مطلوب' };
            }
            const updatedBrand = persistBrandUpdateAcrossEcosystem(brandId, {
                systemInstruction: newPrompt,
                systemPrompt: newPrompt
            });
            syncAndBuildObsidianVault();

            broadcastGatewayEvent('BOT_INSTRUCTIONS_UPDATED', {
                brandId,
                brandName: updatedBrand.name
            });

            return {
                success: true,
                brandId,
                systemInstruction: newPrompt,
                message: `تم تحديث عقل وتوجيهات الأيجنت الذكي لبراند (${updatedBrand.name}) في تيتو أجنت وخزنة أوبسيديان فوراً!`
            };
        }

        case 'CONNECT_SOCIAL_CHANNEL': {
            const platform = String(data.platform || '').trim().toLowerCase();
            const handleOrUrl = String(data.handleOrUrl || data.url || '').trim();
            if (!platform || !handleOrUrl) {
                return { success: false, error: 'يرجى تحديد المنصة ورابط الحساب أو اسم المستخدم' };
            }
            const existing = getUnifiedGrowthBrands().find(b => b.id === brandId || b.slug === brandId);
            const mergedLinks = {
                ...((existing as any)?.socialLinks || {}),
                [platform]: handleOrUrl
            };
            const updatedBrand = persistBrandUpdateAcrossEcosystem(brandId, {
                socialLinks: mergedLinks
            } as any);
            await upsertBrandToTitoStudioFirestore(updatedBrand).catch(() => {});
            syncAndBuildObsidianVault();
            broadcastGatewayEvent('SOCIAL_CHANNEL_CONNECTED', {
                brandId,
                platform,
                handleOrUrl
            });
            return {
                success: true,
                platform,
                handleOrUrl,
                socialLinks: mergedLinks,
                message: `تم ربط حساب (${platform}: ${handleOrUrl}) بملف البراند وخطة النشر التلقائي بنجاح!`
            };
        }

        case 'PROVISION_VISITOR_TRIAL': {
            const name = data.businessName || data.name || 'براند جديد';
            const industry = data.industry || data.category || 'خدمات وتجارة';
            const phone = data.phone || '01013373634';
            const slogan = data.slogan || '';
            const logoUrl = data.logoUrl || '';
            const requestedTemplate = data.appTemplate;
            const appMode = data.appMode || 'auto';
            const hasExistingBusiness = Boolean(data.hasExistingBusiness);
            const existingAssets = data.existingAssets || undefined;
            const socialLinks = (data.socialLinks && typeof data.socialLinks === 'object') ? data.socialLinks : {};
            const normalizedPhone = String(phone).replace(/\D+/g, '');
            const websiteUrl = data.websiteUrl || '';

            // Server-side duplicate trial guard: reuse active non-expired trial for the same phone if present
            const existingClients = getEzZelPersonalClients();
            const todayIso = new Date().toISOString().split('T')[0];
            const existingActiveTrial = normalizedPhone
                ? existingClients.find((c: any) =>
                    c.status === 'trial' &&
                    String(c.phone || '').replace(/\D+/g, '') === normalizedPhone &&
                    (!c.trialEndsAt || String(c.trialEndsAt) >= todayIso)
                )
                : null;

            if (existingActiveTrial && existingActiveTrial.linkedBrandId) {
                const existingBrand = getUnifiedGrowthBrands().find((b: any) => b.id === existingActiveTrial.linkedBrandId);
                if (existingBrand) {
                    const reusedSlug = existingBrand.slug || existingBrand.id;
                    const reusedTpl = (existingBrand as any).appTemplate === 'products_erp' ? 'products_erp' : 'services_booking';
                    const { buildFlagshipTenantUrl } = await import('./tenantAppRenderer');
                    const { signClientPortalToken, issueOwnerSsoToken } = await import('../routes/tenantErpRoutes');
                    const publicBase = (process.env.PUBLIC_BASE_URL || 'https://t2os.app').replace(/\/+$/, '');
                    const reusedFlagship = (existingBrand as any).appMode === 'existing_site' && existingBrand.websiteUrl
                        ? existingBrand.websiteUrl
                        : buildFlagshipTenantUrl(reusedSlug, reusedTpl);
                    const portalTok = signClientPortalToken(reusedSlug);
                    const ssoTok = issueOwnerSsoToken(existingBrand, reusedSlug);
                    const ssoSep = reusedFlagship.includes('?') ? '&' : '?';
                    return {
                        success: true,
                        reusedTrial: true,
                        brand: existingBrand,
                        trialClient: existingActiveTrial,
                        storeUrl: `/store/${existingBrand.slug}`,
                        flagshipUrl: reusedFlagship,
                        clientPortalUrl: `${publicBase}/client/${encodeURIComponent(reusedSlug)}?token=${encodeURIComponent(portalTok)}`,
                        ssoStoreAdminUrl: `${reusedFlagship}${ssoSep}ssoToken=${encodeURIComponent(ssoTok)}#dashboard`,
                        studioPostsCount: Array.isArray(existingBrand.weekContentPlan) ? existingBrand.weekContentPlan.length : 0,
                        message: `يوجد اشتراك تجربة مجانية ساري بالفعل لهذا الرقم لبراند (${existingBrand.name}) حتى تاريخ ${existingActiveTrial.trialEndsAt}. تم استعادة نفس التجربة مباشرة!`
                    };
                }
            }

            const { resolveBrandTemplate } = await import('./tenantAppRenderer');
            const { transliterateArabicToSlug } = await import('./brandIdentityNormalizer');
            const { generateIndustryCatalogWithAI, getIndustryHeroImage, scrapeWebsiteMetadata } = await import('./industryHydrationService');
            const { createRotatingServerAI } = await import('./geminiKeyPool');
            let hydrationAi: any = null;
            try { hydrationAi = createRotatingServerAI(); } catch {}

            const preResolvedTemplate = resolveBrandTemplate({
                appTemplate: requestedTemplate,
                industry,
                name
            });

            // Run brand cloning, industry AI hydration & website metadata scrape in parallel
            const [cloned, hydratedCatalog, siteMeta] = await Promise.all([
                cloneOrSynthesizeBrand({
                    name,
                    industry,
                    phone,
                    websiteUrl,
                    appTemplate: preResolvedTemplate,
                    skipBlockingRemoteSync: true
                } as any),
                generateIndustryCatalogWithAI({
                    ai: hydrationAi,
                    brandName: name,
                    industry,
                    appTemplate: preResolvedTemplate
                }),
                websiteUrl ? scrapeWebsiteMetadata(websiteUrl) : Promise.resolve({} as any)
            ]);

            const resolvedTemplate = resolveBrandTemplate({
                appTemplate: requestedTemplate,
                businessType: cloned.businessType,
                industry,
                name: cloned.name
            });

            // Enrich with strictly 3 Trial Posts (2 image + 1 video reel)
            const omniPlan = buildOmniChannelWeekPlan({
                id: cloned.id,
                slug: cloned.slug,
                name: cloned.name,
                businessType: cloned.businessType,
                appTemplate: resolvedTemplate,
                phone,
                existingPlan: cloned.weekContentPlan,
                isTrial: true
            });

            const finalCatalog =
                Array.isArray(hydratedCatalog) && hydratedCatalog.length > 0
                    ? hydratedCatalog
                    : cloned.productsCatalog;
            const finalSlogan = slogan || (cloned as any).slogan || siteMeta?.description?.slice(0, 100) || (resolvedTemplate === 'products_erp' ? `تشكيلة ${cloned.name} المختارة في ${industry}` : `خدمات ${cloned.name} المعتمدة في ${industry}`);
            const finalLogoUrl = logoUrl || (cloned as any).logoUrl || siteMeta?.ogImage || '';
            const finalHeroImage = (cloned as any).heroImage || getIndustryHeroImage(industry, cloned.name);

            const adminPin = normalizedPhone.slice(-6) || String(Math.floor(100000 + Math.random() * 900000));
            const asciiSlug = transliterateArabicToSlug(cloned.slug || cloned.id || name, '') || `brand-${Date.now().toString().slice(-4)}`;
            const adminEmail = `owner@${asciiSlug}.t2.app`;
            const adminPassword = `T2@${adminPin}`;

            const industryPalette: Array<{ match: RegExp; primary: string; accent: string }> = [
                { match: /قطع غيار|سيار|أوتو|اوتو|auto|car/i, primary: '#dc2626', accent: '#111827' },
                { match: /عياد|أسنان|طب|دكتور|clinic|dental/i, primary: '#0284c7', accent: '#0f172a' },
                { match: /نظاف|تعقيم|صيان|clean/i, primary: '#0d9488', accent: '#134e4a' },
                { match: /أزياء|ملابس|موض|fashion/i, primary: '#db2777', accent: '#18181b' },
                { match: /عقار|مقاول|real/i, primary: '#b45309', accent: '#1c1917' }
            ];
            const matchedColors = industryPalette.find(p => p.match.test(`${industry} ${cloned.name}`));
            const finalPrimaryColor = (cloned as any).primaryColor || matchedColors?.primary || '#06b6d4';
            const finalAccentColor = (cloned as any).accentColor || matchedColors?.accent || '#0f172a';

            // Auto-provision Firebase Auth account on Battah / Clean-Master Firebase project if API key is configured
            const targetFbApiKey = resolvedTemplate === 'products_erp'
                ? (process.env.BATTAH_FIREBASE_API_KEY || '')
                : (process.env.CLEAN_MASTER_FIREBASE_API_KEY || '');
            if (targetFbApiKey) {
                fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(targetFbApiKey)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: adminEmail, password: adminPassword, returnSecureToken: false })
                }).catch(() => {});
            }

            const storeSlug = cloned.slug || asciiSlug || cloned.id;
            const { buildFlagshipTenantUrl } = await import('./tenantAppRenderer');
            const generatedFlagshipUrl = buildFlagshipTenantUrl(storeSlug, resolvedTemplate);
            const trialStartedAt = new Date().toISOString();
            const trialEndsAt = new Date(Date.now() + 7 * 86400000).toISOString();

            const enrichedBrand = persistBrandUpdateAcrossEcosystem(cloned.id, {
                ...cloned,
                slug: storeSlug,
                phone,
                whatsapp: normalizedPhone.startsWith('0') ? `2${normalizedPhone}` : normalizedPhone,
                slogan: finalSlogan,
                logoUrl: finalLogoUrl,
                heroImage: finalHeroImage,
                primaryColor: finalPrimaryColor,
                accentColor: finalAccentColor,
                storeType: (data as any).storeType || ((data as any).enableDropshipping ? 'dropshipping' : 'standard_ecommerce'),
                enableDropshipping: Boolean((data as any).enableDropshipping || (data as any).storeType === 'dropshipping'),
                productsCatalog: finalCatalog,
                appTemplate: resolvedTemplate,
                appMode,
                hasExistingBusiness,
                onboardingMode: hasExistingBusiness ? 'connect_existing' : 'create_new',
                existingAssets,
                socialLinks: {
                    ...((cloned as any).socialLinks || {}),
                    ...socialLinks
                },
                adminPin,
                adminEmail,
                weekContentPlan: omniPlan,
                vercelUrl: (appMode === 'existing_site' && websiteUrl) ? websiteUrl : generatedFlagshipUrl,
                liveUrl: (appMode === 'existing_site' && websiteUrl) ? websiteUrl : generatedFlagshipUrl,
                subscriptionStatus: 'trial',
                planId: 'trial_7d',
                trialStartedAt,
                trialEndsAt,
            } as any);

            // Immediately register canonical brand & seed Cloud ERP state for multi-tenant store.t2os.app / book.t2os.app
            try {
                const { upsertBrandRegistryEntry } = await import('./brandRegistryService');
                upsertBrandRegistryEntry(cloned.id, {
                    slug: storeSlug,
                    name: cloned.name,
                    businessType: industry,
                    primaryColor: finalPrimaryColor,
                    appTemplate: resolvedTemplate,
                    planId: 'trial_7d',
                    planAmount: 5000,
                    titoStudioClinicId: cloned.id,
                    agentBrandId: storeSlug,
                    appUrl: generatedFlagshipUrl,
                    lifecycleStage: 'trial',
                    accountOrigin: 'public_signup',
                    subscriptionStatus: 'trial',
                });
            } catch {}

            try {
                const { loadTenantErpState, saveTenantErpState } = await import('./tenantErpStoreService');
                const existingErp = await loadTenantErpState(storeSlug).catch(() => ({} as any));
                const seededProducts = (Array.isArray(finalCatalog) ? finalCatalog : []).map((p: any, idx: number) => {
                    const img = p?.image || p?.imageUrl || finalHeroImage;
                    const num = Math.max(50, Number(p?.numericPrice ?? p?.unitPrice ?? parseInt(String(p?.price || '500').replace(/[^\d]/g, ''), 10)) || 500);
                    return {
                        id: idx + 1,
                        name: String(p?.name || `منتج ${idx + 1}`),
                        sku: `SKU-${idx + 1}`,
                        mainCategory: String(p?.category || industry || 'عام'),
                        category: String(p?.category || industry || 'عام'),
                        brand: cloned.name,
                        sellingPrice: num,
                        purchasePrice: Math.round(num * 0.65),
                        stock: { main: 25 },
                        reorderPoint: 5,
                        description: String(p?.description || ''),
                        images: [img],
                    };
                });
                const uniqueCats = Array.from(new Set(seededProducts.map((p: any) => p.mainCategory).filter(Boolean))).slice(0, 6);
                const enableDropshipping = Boolean((data as any).enableDropshipping || (data as any).storeType === 'dropshipping');
                const slide1Title = resolvedTemplate === 'products_erp'
                    ? (uniqueCats[0] ? `تشكيلة ${uniqueCats[0]} الأصلية` : `عروض ${cloned.name} المختارة`)
                    : `خدمات ${cloned.name} المعتمدة`;
                await saveTenantErpState(storeSlug, {
                    ...existingErp,
                    products: seededProducts,
                    appCustomization: {
                        ...(existingErp?.appCustomization || {}),
                        companyName: cloned.name,
                        enableDropshipping,
                        ...(uniqueCats.length > 0 ? { mainCategories: uniqueCats.map((c, i) => ({ id: `cat_${i + 1}`, name: String(c) })) } : {}),
                        heroSlides: [
                            {
                                id: 1,
                                badge: industry || uniqueCats[0] || 'المتجر الإلكتروني المعتمد',
                                title: slide1Title,
                                subtitle: finalSlogan,
                                description: `تصفح تشكيلة المنتجات المتاحة للطلب الفوري مع شحن سريع لجميع المحافظات.`,
                                image: finalHeroImage,
                                category: uniqueCats[0] || 'all',
                            },
                            {
                                id: 2,
                                badge: 'طلب أونلاين وتوصيل سريع',
                                title: uniqueCats[1] || uniqueCats[0] || 'عروض وتشكيلة الموسم',
                                subtitle: 'اطلب أونلاين والدفع عند الاستلام أو إلكترونياً',
                                description: 'منتجات أصلية مضمونة بتغليف فاخر وخدمة عملاء سريعة عبر واتساب.',
                                image: seededProducts[1]?.images?.[0] || finalHeroImage,
                                category: uniqueCats[1] || uniqueCats[0] || 'all',
                            },
                        ],
                    },
                    storefrontSettings: {
                        ...(existingErp?.storefrontSettings || {}),
                        companyName: cloned.name,
                        slogan: finalSlogan,
                        phone,
                        whatsappNumber: normalizedPhone.startsWith('0') ? `2${normalizedPhone}` : normalizedPhone,
                        address: 'القاهرة، مصر',
                        primaryColor: finalPrimaryColor,
                        logoUrl: finalLogoUrl,
                    },
                });
            } catch {}

            // Also add to Ez-Zel Clients as a 7-Day Free Trial subscriber (min upgrade tier 5,000 EGP)
            const clients = getEzZelPersonalClients();
            const newClient = {
                id: `ezzel_trial_${Date.now()}`,
                name: data.clientName || `المدير التنفيذي - ${cloned.name}`,
                role: 'مشترك تجربة مجانية 7 أيام (Brand CEO)',
                plan: '7-Day Free Trial (Full Ecosystem)',
                voicePersona: 'Gemini Puck 24kHz',
                status: 'trial',
                activeTasksCount: 3,
                memoryNodesCount: 15,
                monthlySubscriptionEgp: 5000,
                affiliateEarningsEgp: 0,
                joinedAt: new Date().toISOString().split('T')[0],
                phone,
                linkedBrandId: cloned.id,
                trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
            };
            clients.unshift(newClient);
            try {
                savePersistentJson('ezzel_clients', 'ezzel_clients.json', clients);
            } catch {}

            syncAndBuildObsidianVault();

            // Non-blocking background sync to Tito Studio (strictly 3 trial posts) + Execution Engine
            const studioPostsCount = Math.min(3, Array.isArray(omniPlan) ? omniPlan.length : 3);
            void (async () => {
                try {
                    await upsertBrandToTitoStudioFirestore(enrichedBrand);
                    await syncWeekPlanToTitoStudioFirestore(enrichedBrand, omniPlan.slice(0, 3));
                    await syncFromTitoStudioFirestore();

                    const { getTitoStudioBaseUrl } = await import('./titoStudioApiClient');
                    const studioBase = getTitoStudioBaseUrl().replace(/\/+$/, '');
                    const studioKey = String(process.env.T2_REMOTE_API_KEY || process.env.TITO_STUDIO_API_KEY || '').trim();
                    const rawPlan = Array.isArray(omniPlan) ? omniPlan.slice(0, 3) : [];
                    const mapPlanItem = (p: any, idx: number) => ({
                        id: String(p?.firestoreDocId || `jarvis_${enrichedBrand.id}_day_${idx + 1}`),
                        title: String(p?.hook || p?.title || p?.topic || `خطة الأسبوع التجريبي — منشور ${idx + 1}`),
                        type: (p?.mediaFormat === 'video' || p?.type === 'video' || p?.format === 'reel') ? 'video' : 'image',
                        caption: String(p?.caption || p?.script || p?.hook || p?.title || ''),
                        visualPrompt: String(p?.omniPrompt || p?.visualPrompt || p?.designBrief || ''),
                        pillarLabel: String(p?.pillarLabel || p?.pillar || 'خطة الأسبوع التجريبي'),
                        scheduledPlatforms: Array.isArray(p?.platforms) ? p.platforms : ['facebook', 'instagram'],
                    });
                    const execItems = rawPlan.map((p: any, idx: number) => mapPlanItem(p, idx));
                    if (studioKey && execItems.length > 0) {
                        await fetch(`${studioBase}/api/execution/enqueue`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-api-key': studioKey },
                            body: JSON.stringify({
                                clinicId: String((enrichedBrand as any).titoStudioClinicId || enrichedBrand.id),
                                brandName: enrichedBrand.name,
                                items: execItems,
                                triggerSource: 'trial_7d_auto_provision',
                            }),
                            signal: AbortSignal.timeout(8000),
                        }).catch(() => {});
                    }
                } catch {}
            })();

            const wantsDedicatedRepo = Boolean(
                (data as any)?.dedicatedRepo === true ||
                (data as any)?.planId === 'enterprise_20000' ||
                (data as any)?.planId === 'sovereign_50000'
            );

            let dedicatedResult: any = null;
            if (appMode !== 'existing_site' && wantsDedicatedRepo && process.env.GITHUB_TOKEN && process.env.VERCEL_TOKEN) {
                try {
                    const { provisionDedicatedRepoAndVercel } = await import('./dedicatedDeployService');
                    dedicatedResult = await provisionDedicatedRepoAndVercel({
                        brandId: cloned.id,
                        appTemplate: resolvedTemplate
                    });
                    if (dedicatedResult?.ok && dedicatedResult?.dedicatedLiveUrl) {
                        persistBrandUpdateAcrossEcosystem(cloned.id, {
                            dedicatedRepoUrl: dedicatedResult.dedicatedRepoUrl,
                            dedicatedLiveUrl: dedicatedResult.dedicatedLiveUrl,
                            vercelUrl: dedicatedResult.dedicatedLiveUrl,
                        } as any);
                    }
                } catch {}
            }

            const finalLiveAppUrl = (dedicatedResult?.ok && dedicatedResult?.dedicatedLiveUrl)
                ? dedicatedResult.dedicatedLiveUrl
                : generatedFlagshipUrl;
            const flagshipUrl = (appMode === 'existing_site' && websiteUrl) ? websiteUrl : finalLiveAppUrl;

            const { signClientPortalToken, issueOwnerSsoToken } = await import('../routes/tenantErpRoutes');
            const publicBase = (process.env.PUBLIC_BASE_URL || 'https://t2os.app').replace(/\/+$/, '');
            const clientPortalUrl = `${publicBase}/client/${encodeURIComponent(storeSlug)}?token=${encodeURIComponent(signClientPortalToken(storeSlug))}`;
            const ownerSsoToken = issueOwnerSsoToken(enrichedBrand, storeSlug);
            const ssoSep = flagshipUrl.includes('?') ? '&' : '?';
            const ssoStoreAdminUrl = `${flagshipUrl}${ssoSep}ssoToken=${encodeURIComponent(ownerSsoToken)}#dashboard`;

            // Non-blocking WhatsApp welcome + Magic Link so visitor never loses access across devices
            const cleanWaPhone = String(phone || '').replace(/\D/g, '');
            if (cleanWaPhone.length >= 10 && process.env.NODE_ENV !== 'test') {
                const agentBase = (process.env.T2_AGENT_API_URL || 'https://agent.t2os.app').replace(/\/+$/, '');
                const agentKey = process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY || '';
                const magicMsg = [
                    `أهلاً بك في منظومة T2OS! 🚀`,
                    `تم تجهيز تطبيق براند "${cloned.name}" وتفعيل أسبوع التجربة المجانية.`,
                    `🌐 تطبيقك الحي: ${flagshipUrl}`,
                    `🎯 بوابة العميل والمحتوى (احفظ هذا الرابط للدخول من أي جهاز): ${clientPortalUrl}`,
                    `🔐 بيانات لوحة متجرك: ${adminEmail} / ${adminPassword}`,
                ].join('\n');
                fetch(`${agentBase}/api/whatsapp/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(agentKey ? { 'x-admin-key': agentKey } : {}),
                    },
                    body: JSON.stringify({
                        brandId: storeSlug,
                        to: cleanWaPhone,
                        message: magicMsg,
                    }),
                    signal: AbortSignal.timeout(4000),
                }).catch(() => {});
            }

            return {
                success: true,
                brand: {
                    ...enrichedBrand,
                    vercelUrl: flagshipUrl,
                    liveUrl: flagshipUrl,
                    subscriptionStatus: 'trial',
                    planId: 'trial_7d',
                    trialStartedAt,
                    trialEndsAt,
                    ...(dedicatedResult?.dedicatedLiveUrl ? { dedicatedLiveUrl: dedicatedResult.dedicatedLiveUrl } : {}),
                    ...(dedicatedResult?.dedicatedRepoUrl ? { dedicatedRepoUrl: dedicatedResult.dedicatedRepoUrl } : {})
                },
                trialClient: newClient,
                storeUrl: flagshipUrl,
                flagshipUrl,
                clientPortalUrl,
                ssoStoreAdminUrl,
                optionalFlagshipUrl: finalLiveAppUrl,
                ...(dedicatedResult?.dedicatedLiveUrl ? { dedicatedLiveUrl: dedicatedResult.dedicatedLiveUrl } : {}),
                ...(dedicatedResult?.dedicatedRepoUrl ? { dedicatedRepoUrl: dedicatedResult.dedicatedRepoUrl } : {}),
                ownerCredentials: {
                    email: adminEmail,
                    password: adminPassword,
                    pin: adminPin
                },
                appTemplate: resolvedTemplate,
                appMode,
                studioPostsCount,
                message: `تم بناء وتجهيز متجر وتطبيق (${cloned.name}) في لحظات وجدولة (${studioPostsCount}) منشورات للأسبوع المجاني!`
            };
        }

        case 'GENERATE_STUDIO_STRATEGY': {
            const brands = getUnifiedGrowthBrands();
            const targetBrand = brands.find(b => b.id === brandId || b.slug === brandId || b.name.includes(brandId)) || brands[0];
            if (!targetBrand) {
                return { success: false, error: 'لم يتم العثور على البراند المطلوب' };
            }
            const strategy = await generateBrandMarketingStrategy(targetBrand);
            const nowIso = strategy?.createdAt || new Date().toISOString();
            targetBrand.marketingStrategy = strategy;
            (targetBrand as any).lastStrategyAt = nowIso;
            saveCustomBrandOverride(targetBrand);
            await upsertBrandToTitoStudioFirestore(targetBrand);
            syncAndBuildObsidianVault();
            return {
                success: true,
                brand: targetBrand,
                strategy,
                lastStrategyAt: nowIso,
                message: `تم بناء وحفظ الاستراتيجية التسويقية الكاملة لبراند (${targetBrand.name}) في تيتو ستوديو وأوبسيديان بنجاح!`
            };
        }

        case 'GENERATE_WEEK_CONTENT_PLAN': {
            const brands = getUnifiedGrowthBrands();
            const targetBrand = brands.find(b => b.id === brandId || b.slug === brandId || b.name.includes(brandId)) || brands[0];
            if (!targetBrand) {
                return { success: false, error: 'لم يتم العثور على البراند المطلوب' };
            }
            if (!targetBrand.marketingStrategy) {
                targetBrand.marketingStrategy = await generateBrandMarketingStrategy(targetBrand);
            }
            const rawPlan = buildOmniChannelWeekPlan({
                id: targetBrand.id,
                slug: targetBrand.slug || targetBrand.id,
                name: targetBrand.name,
                businessType: targetBrand.businessType,
                appTemplate: (targetBrand as any).appTemplate,
                phone: targetBrand.phone,
                primaryColor: targetBrand.primaryColor,
                strategy: targetBrand.marketingStrategy
            });
            const freshPlan = rawPlan.map((item) => validateAndBindBrandContent(targetBrand, item));
            const nowIso = new Date().toISOString();
            targetBrand.weekContentPlan = freshPlan;
            (targetBrand as any).lastPlanAt = nowIso;
            saveCustomBrandOverride(targetBrand);
            const syncedCount = await syncWeekPlanToTitoStudioFirestore(targetBrand, freshPlan);
            syncAndBuildObsidianVault();
            const imagePostsCount = freshPlan.filter(p => p.mediaFormat === 'image').length;
            const videoPostsCount = freshPlan.filter(p => p.mediaFormat === 'video').length;
            return {
                success: true,
                brand: targetBrand,
                weekPlan: freshPlan,
                lastPlanAt: nowIso,
                syncedCount,
                imagePostsCount,
                videoPostsCount,
                message: `تم توليد خطة محتوى أول أسبوع لبراند (${targetBrand.name}) بإجمالي 7 منشورات: (${imagePostsCount}) تصميمات صور جاهزة في تيتو ستوديو، و(${videoPostsCount}) فيديوهات ريلز تم إرسال أوامرها لجسر Turbo Flow × Google Flow وحفظها في التقويم!`
            };
        }

        case 'APPROVE_STUDIO_SCHEDULE': {
            const brands = getUnifiedGrowthBrands();
            const targetBrand = brands.find(b => b.id === brandId || b.slug === brandId || b.name.includes(brandId)) || brands[0];
            if (!targetBrand) {
                return { success: false, error: 'لم يتم العثور على البراند المطلوب' };
            }
            if (Array.isArray(targetBrand.weekContentPlan)) {
                targetBrand.weekContentPlan = targetBrand.weekContentPlan.map((p: any) => ({
                    ...p,
                    status: p.status === 'published' ? 'published' : 'scheduled'
                }));
                saveCustomBrandOverride(targetBrand);
                await syncWeekPlanToTitoStudioFirestore(targetBrand, targetBrand.weekContentPlan);
            }
            const approval = await approveBrandScheduleInTitoStudio(targetBrand.id);
            syncAndBuildObsidianVault();
            return {
                success: true,
                brand: targetBrand,
                approvedCount: approval.approvedCount,
                message: `تم اعتماد جدولة خطة المحتوى الأسبوعية لبراند (${targetBrand.name}) في تيتو ستوديو (${approval.approvedCount} منشورات مجدولة للنشر التلقائي حسب المواعيد المثالية)!`
            };
        }

        case 'ACTIVATE_PAYMOB_SUBSCRIPTION': {
            const brands = getUnifiedGrowthBrands();
            const targetBrand = brands.find(b => b.id === brandId || b.slug === brandId) || brands[0];
            if (targetBrand) {
                targetBrand.subscriptionStatus = 'active';
                targetBrand.subscriptionPlan = data.planId || 'growth_pro';
                targetBrand.subscriptionActivatedAt = new Date().toISOString();
                saveCustomBrandOverride(targetBrand);
                await upsertBrandToTitoStudioFirestore(targetBrand);
            }
            const clients = loadEzZelClients();
            const cIdx = clients.findIndex((c: any) => c.linkedBrandId === brandId || c.id === brandId);
            if (cIdx >= 0) {
                clients[cIdx].status = 'active';
                clients[cIdx].plan = data.planName || 'باقة النمو الشامل (Paymob)';
                try {
                    fs.writeFileSync(EZZEL_CLIENTS_PATH, JSON.stringify(clients, null, 2), 'utf8');
                } catch {}
            }
            syncAndBuildObsidianVault();
            return {
                success: true,
                brand: targetBrand,
                message: `تم تفعيل اشتراك براند (${targetBrand?.name || brandId}) آلياً عبر موب باي (Paymob) بنجاح!`
            };
        }

        case 'CREATE_CUSTOM_STUDIO_POST': {
            const allBrands = getUnifiedGrowthBrands();
            const targetBrand = allBrands.find(b => b.id === brandId || b.slug === brandId || b.name.includes(brandId)) || allBrands[0];
            if (!targetBrand) {
                return { success: false, error: 'لم يتم العثور على البراند المطلوب' };
            }

            const topic = data.topic || 'عرض خاص وحصري';
            const scheduleTime = data.scheduleTime || '8:00 مساءً';
            const mediaFormat = data.mediaFormat || 'image';
            const publishNow = !!data.publishNow;

            const isVideo = mediaFormat === 'video';
            const hook = data.customHook || `🔥 جديد وحصري من ${targetBrand.name}: ${topic}`;
            const caption = data.customCaption || `${hook}\n\nاكتشف التفاصيل والباقات المخصصة لك مع ${targetBrand.name}. تواصل واتساب مباشرة: ${targetBrand.phone || '01013372674'}`;

            const docId = `custom_post_${Date.now()}`;
            const rawPostItem: any = {
                id: docId,
                brandId: targetBrand.id,
                brandName: targetBrand.name,
                brandPhone: targetBrand.phone || '01013372674',
                day: 'مخصص',
                mediaFormat,
                contentType: isVideo ? 'فيديو ريلز وتيك توك (9:16)' : 'تصميم Feed (1:1)',
                hook,
                caption,
                visualUrl: data.visualUrl || undefined,
                bestTime: scheduleTime,
                status: publishNow ? 'published' : 'scheduled',
                ctaType: 'WHATSAPP_VOICE_AGENT',
                ctaBadge: '💬 تواصل واتساب فوري (رد صوتي ذكي)',
                ctaTargetUrl: `https://wa.me/2${(targetBrand.phone || '01013372674').replace(/^0/, '')}`
            };
            const postItem = validateAndBindBrandContent(targetBrand, rawPostItem);

            if (!Array.isArray(targetBrand.weekContentPlan)) {
                targetBrand.weekContentPlan = [];
            }
            targetBrand.weekContentPlan.unshift(postItem);
            saveCustomBrandOverride(targetBrand);

            // Sync to Tito Studio Firestore
            await syncWeekPlanToTitoStudioFirestore(targetBrand, [postItem]);

            let publishResult: any = null;
            if (publishNow) {
                publishResult = await publishBrandPost(targetBrand.id, 0);
            }

            syncAndBuildObsidianVault();

            return {
                success: true,
                brand: targetBrand,
                post: postItem,
                publishedNow: publishNow,
                publishResult,
                message: publishNow
                    ? `🚀 تم فتح براند (${targetBrand.name}) وتوليد منشور عن (${topic}) ونشره فوراً عبر تيتو ستوديو وميتا جراف!`
                    : `📅 تم فتح براند (${targetBrand.name}) وتوليد منشور عن (${topic}) وجدولته في تيتو ستوديو لموعد (${scheduleTime}) بنجاح!`
            };
        }

        case 'EXECUTE_AUTONOMOUS_AGENCY_CYCLE': {
            const allBrands = getUnifiedGrowthBrands();
            const targetBrand = allBrands.find(b => b.id === brandId || b.slug === brandId || b.name.includes(brandId)) || allBrands[0];
            if (!targetBrand) {
                return { success: false, error: 'لم يتم العثور على البراند المطلوب' };
            }

            // 1. Build Deep Marketing Strategy
            const strategy = await generateBrandMarketingStrategy(targetBrand);
            targetBrand.marketingStrategy = strategy;

            // 2. Build Full 1-Month Plan (4 Weeks / 12 Posts)
            const monthResult = generateFullMonthOmniPlan({
                id: targetBrand.id,
                slug: targetBrand.slug || targetBrand.id,
                name: targetBrand.name,
                businessType: targetBrand.businessType,
                phone: targetBrand.phone,
                primaryColor: targetBrand.primaryColor,
                strategy
            });

            targetBrand.weekContentPlan = monthResult.monthPlan;
            saveCustomBrandOverride(targetBrand);

            // 3. Sync all 12 posts to Tito Studio Firestore (First is draft for review, 11 are scheduled)
            const syncedCount = await syncWeekPlanToTitoStudioFirestore(targetBrand, monthResult.monthPlan);

            // 4. Optionally publish first post immediately if requested
            let firstPostPublished = false;
            let publishResult: any = null;
            if (data?.autoPublishFirst) {
                publishResult = await publishBrandPost(targetBrand.id, 0);
                firstPostPublished = publishResult?.success || false;
            }

            syncAndBuildObsidianVault();

            broadcastGatewayEvent('AGENCY_CYCLE_COMPLETED', {
                brandId: targetBrand.id,
                brandName: targetBrand.name,
                totalPosts: monthResult.monthPlan.length,
                scheduledCount: monthResult.scheduledCount,
                firstPost: monthResult.firstPost,
                firstPostPublished
            });

            return {
                success: true,
                brand: targetBrand,
                strategy,
                monthPlan: monthResult.monthPlan,
                firstPost: monthResult.firstPost,
                scheduledCount: monthResult.scheduledCount,
                firstPostPublished,
                publishResult,
                message: `🎯 تم إكمال دورة مشغل وكالة التسويق الآلي لـ (${targetBrand.name}) بنجاح! تم بناء استراتيجية متكاملة، وخطة شهر كامل (4 أسابيع / 12 منشوراً)، واعتماد جدولة (${monthResult.scheduledCount}) منشوراً في تيتو ستوديو، وتجهيز البوست الأول للمعاينة والاعتماد الفوري!`
            };
        }

        case 'PUBLISH_STUDIO_POST': {
            const res = await publishBrandPost(brandId, data.postIndex || 0);
            const allBrands = getUnifiedGrowthBrands();
            const targetBrand = allBrands.find(b => b.id === brandId || b.slug === brandId);
            if (targetBrand) {
                syncWeekPlanToTitoStudioFirestore(targetBrand).catch(() => {});
            }
            syncAndBuildObsidianVault();
            return res;
        }

        case 'SYNC_TITO_STUDIO_FIRESTORE': {
            const cache = await syncFromTitoStudioFirestore();
            const allBrands = getUnifiedGrowthBrands();
            const targetBrand = allBrands.find(b => b.id === brandId || b.slug === brandId);
            let pushedPosts = 0;
            if (targetBrand) {
                await upsertBrandToTitoStudioFirestore(targetBrand);
                pushedPosts = await syncWeekPlanToTitoStudioFirestore(targetBrand);
            }
            const snapshot = syncAndBuildObsidianVault();
            return {
                success: true,
                clinicsCount: cache.clinics.length,
                contentCount: cache.content.length + pushedPosts,
                totalUnifiedBrands: snapshot.growthAgencyBrands.length,
                message: `تمت المزامنة الحية ثنائية الاتجاه مع قاعدة بيانات تيتو ستوديو السحابية (t2-content-studio)! إجمالي البراندات الموحدة الآن: ${snapshot.growthAgencyBrands.length} براند، وتم مزامنة (${pushedPosts}) منشورات في تقويم تيتو ستوديو.`
            };
        }

        case 'LAUNCH_META_AD': {
            const campaign = await launchAdCampaign({
                brandId,
                budgetEgp: Number(data.budgetEgp) || 2000,
                platform: 'meta',
                objective: 'click_to_whatsapp',
                customHook: data.customHook
            });
            syncAndBuildObsidianVault();
            return {
                success: true,
                campaign,
                message: `تم إطلاق حملة Click-to-WhatsApp الممولة للبراند بميزانية ${campaign.budgetEgp} ج.م وربطها بالـ Webhook!`
            };
        }

        case 'CREATE_LIVE_BOOKING': {
            const saved = saveBooking({
                brandId,
                customerName: data.customerName || 'عميل تطبيق البراند',
                customerPhone: data.customerPhone || '01099887766',
                service: data.service || 'خدمة VIP متكاملة',
                price: data.price || '950 ج.م',
                address: data.address || 'القاهرة - مدينة نصر',
                status: 'CONFIRMED',
                source: 'brand_pwa_storefront'
            });
            syncAndBuildObsidianVault();
            return {
                success: true,
                booking: saved,
                message: `تم تسجيل وتأكيد الحجز في CRM وإرسال تنبيه فوري لجارفيس وواتساب!`
            };
        }

        case 'TOGGLE_AGENT_BOT': {
            const targetId = String(data.agentBrandId || brandId || '').trim();
            if (!targetId) return { success: false, error: 'brandId is required' };
            const { t2AgentApi } = await import('./t2AgentApiClient');
            const agentRes = await t2AgentApi.togglePauseBot(targetId).catch((e: any) => ({ ok: false, error: e?.message }));
            const nextPaused = typeof data.paused === 'boolean' ? data.paused : Boolean((agentRes as any)?.paused ?? (agentRes as any)?.botPaused);
            const updatedBrand = persistBrandUpdateAcrossEcosystem(brandId || targetId, { botPaused: nextPaused });
            syncAndBuildObsidianVault();
            return {
                success: true,
                botPaused: nextPaused,
                agentRes,
                brand: updatedBrand,
                message: nextPaused
                    ? `تم إيقاف وكيل الواتساب مؤقتاً لبراند (${updatedBrand?.name || targetId})`
                    : `تم تشغيل وكيل الواتساب لبراند (${updatedBrand?.name || targetId})`
            };
        }

        case 'SEND_AGENT_WHATSAPP_MESSAGE': {
            const targetId = String(data.agentBrandId || brandId || '').trim();
            const phone = String(data.phone || data.to || '').replace(/[^\d+]/g, '');
            const msgText = String(data.message || '').trim();
            if (!phone || !msgText) return { success: false, error: 'phone and message are required' };
            const agentBase = (process.env.T2_AGENT_API_URL || 'https://agent.t2os.app').replace(/\/+$/, '');
            const agentKey = process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY || '';
            const resp = await fetch(`${agentBase}/api/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(agentKey ? { 'x-admin-key': agentKey } : {}),
                },
                body: JSON.stringify({ brandId: targetId, to: phone, message: msgText }),
                signal: AbortSignal.timeout(8000),
            }).then((r) => r.json().catch(() => ({ ok: r.ok }))).catch((e: any) => ({ ok: false, error: e?.message }));
            return {
                success: Boolean((resp as any)?.ok ?? (resp as any)?.success ?? true),
                result: resp,
                message: `تم إرسال رسالة الواتساب عبر T2 Agent إلى ${phone}`
            };
        }

        case 'TRIGGER_STUDIO_GENERATION': {
            const brands = getUnifiedGrowthBrands();
            const targetBrand = brands.find((b) => b.id === brandId || b.slug === brandId) || brands[0];
            if (!targetBrand) return { success: false, error: 'Brand not found' };
            const studioBase = (process.env.TITO_STUDIO_URL || 'https://studio.t2os.app').replace(/\/+$/, '');
            const studioKey = String(process.env.T2_REMOTE_API_KEY || process.env.TITO_STUDIO_API_KEY || '').trim();
            if (!studioKey) return { success: false, error: 'Studio API key not configured' };
            const batchItems = Array.isArray(data.items) && data.items.length > 0
                ? data.items
                : [{
                    id: `jarvis_${targetBrand.id}_${Date.now()}`,
                    title: String(data.topic || data.title || `محتوى إبداعي لـ ${targetBrand.name}`),
                    type: data.mediaFormat === 'video' ? 'video' : 'image',
                    caption: String(data.caption || data.topic || `عرض خاص من ${targetBrand.name}`),
                    visualPrompt: String(data.prompt || data.visualPrompt || data.topic || `Professional commercial ad for ${targetBrand.name}`),
                    pillarLabel: String(data.pillarLabel || 'أمر مباشر من جارفس'),
                    scheduledPlatforms: Array.isArray(data.platforms) ? data.platforms : ['facebook', 'instagram'],
                }];
            const { consumeBrandMonthlyQuota, refundBrandMonthlyQuota } = await import('./saasPlansService');
            const videoCount = batchItems.filter((it: any) => it?.type === 'video' || it?.mediaFormat === 'video').length;
            const designCount = batchItems.length - videoCount;
            if (videoCount > 0) {
                const qVid = consumeBrandMonthlyQuota(targetBrand, 'video', videoCount);
                if (!qVid.allowed) return { success: false, error: qVid.reason, quota: qVid.status };
            }
            if (designCount > 0) {
                const qDes = consumeBrandMonthlyQuota(targetBrand, 'design', designCount);
                if (!qDes.allowed) {
                    if (videoCount > 0) refundBrandMonthlyQuota(targetBrand, 'video', videoCount);
                    return { success: false, error: qDes.reason, quota: qDes.status };
                }
            }
            const studioRes = await fetch(`${studioBase}/api/execution/enqueue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': studioKey },
                body: JSON.stringify({
                    clinicId: String((targetBrand as any).titoStudioClinicId || targetBrand.id),
                    brandName: targetBrand.name,
                    triggerSource: 'jarvis_command_direct',
                    items: batchItems,
                }),
                signal: AbortSignal.timeout(10000),
            }).then((r) => r.json().catch(() => ({ ok: r.ok }))).catch((e: any) => ({ ok: false, error: e?.message }));
            const ok = Boolean((studioRes as any)?.ok ?? (studioRes as any)?.success ?? false);
            if (!ok) {
                if (videoCount > 0) refundBrandMonthlyQuota(targetBrand, 'video', videoCount);
                if (designCount > 0) refundBrandMonthlyQuota(targetBrand, 'design', designCount);
            }
            return {
                success: ok,
                studioRes,
                message: ok
                    ? `تم إرسال مهمة الإنتاج (${batchItems.length}) إلى محرك تيتو ستوديو لبراند (${targetBrand.name})`
                    : `تعذر بدء الإنتاج في تيتو ستوديو: ${(studioRes as any)?.error || 'خطأ في الاتصال'}`
            };
        }

        case 'UPDATE_BRAND_LIFECYCLE_AND_PLAN': {
            const { upsertBrandRegistryEntry } = await import('./brandRegistryService');
            const targetKey = String(data.canonicalId || brandId || '').trim();
            if (!targetKey) return { success: false, error: 'brandId is required' };
            const entry = upsertBrandRegistryEntry(targetKey, {
                ...(data.slug ? { slug: String(data.slug) } : {}),
                ...(data.name ? { name: String(data.name) } : {}),
                ...(data.lifecycleStage ? { lifecycleStage: data.lifecycleStage } : {}),
                ...(data.accountOrigin ? { accountOrigin: data.accountOrigin } : {}),
                ...(data.planId ? { planId: String(data.planId) } : {}),
                ...(data.planAmount !== undefined ? { planAmount: Number(data.planAmount) } : {}),
                ...(data.titoStudioClinicId ? { titoStudioClinicId: String(data.titoStudioClinicId) } : {}),
                ...(data.agentBrandId ? { agentBrandId: String(data.agentBrandId) } : {}),
                ...(data.appUrl ? { appUrl: String(data.appUrl) } : {}),
            });
            const updatedBrand = persistBrandUpdateAcrossEcosystem(entry.canonicalId, {
                slug: entry.slug,
                name: entry.name || entry.canonicalId,
                lifecycleStage: entry.lifecycleStage,
                accountOrigin: entry.accountOrigin,
                planId: entry.planId,
                planAmount: entry.planAmount,
                titoStudioClinicId: entry.titoStudioClinicId,
                agentBrandId: entry.agentBrandId,
                appUrl: entry.appUrl,
                botPaused: entry.lifecycleStage === 'paused_archive',
            });
            syncAndBuildObsidianVault();
            return {
                success: true,
                entry,
                brand: updatedBrand,
                message: `تم تحديث وإعداد ربط وخطة براند (${entry.name || entry.canonicalId}) عبر المنظومة بنجاح!`
            };
        }

        case 'CHECK_ECOSYSTEM_HEALTH': {
            const { runLiveEcosystemHealthProbe } = await import('./ecosystemConfigService');
            const { getTitoStudioBaseUrl } = await import('./titoStudioApiClient');
            const { getT2AgentBaseUrl } = await import('./t2AgentApiClient');
            const report = await runLiveEcosystemHealthProbe(getTitoStudioBaseUrl(), getT2AgentBaseUrl());
            return {
                success: true,
                report,
                message: `تم فحص الاتصال الحي بجميع منصات المنظومة (Ez-Zel + Tito Studio + T2 Agent)`
            };
        }

        default:
            return {
                success: false,
                error: `Unknown actionType: ${actionType}`
            };
    }
}
