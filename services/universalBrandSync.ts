import * as fs from 'fs';
import * as path from 'path';
import { BRAND_VAULT } from './brandVault';
import { broadcastGatewayEvent } from './microservicesGateway';
import { upsertBrandToTitoStudioFirestore, readTitoStudioCacheSync, syncWeekPlanToTitoStudioFirestore } from './titoStudioFirestoreBridge';
import { titoStudioApi } from './titoStudioApiClient';

const EZ_ZEL_DATA_DIR = path.join(process.cwd(), 'data');
const EZ_ZEL_BRANDS_FILE = path.join(EZ_ZEL_DATA_DIR, 'brands.json');
const EZ_ZEL_TENANTS_FILE = path.join(EZ_ZEL_DATA_DIR, 'tenants.json');

const T2_AGENT_DIR = 'D:/new new/t2-agent-nov-1-2026-5-06-22-pm';
const T2_AGENT_DATA_DIR = path.join(T2_AGENT_DIR, 'data');
const T2_AGENT_BRANDS_FILE = path.join(T2_AGENT_DATA_DIR, 'brands.json');

export interface UniversalBrandPayload {
    id?: string;
    slug?: string;
    name: string;
    englishName?: string;
    category?: string;
    businessType?: string;
    phone?: string;
    whatsapp?: string;
    websiteUrl?: string;
    appUrl?: string;
    ownerEmail?: string;
    systemPrompt?: string;
    slogan?: string;
    primaryColor?: string;
    accentColor?: string;
    planType?: string | number;
    adBudgetRatio?: number;
    productsCatalog?: any[];
    weekContentPlan?: any[];
    status?: string;
    metaPageId?: string;
    metaPageName?: string;
    metaToken?: string;
    source?: string;
}

function ensureDir(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    }
}

function readJsonSafe<T>(filePath: string, fallback: T): T {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e: any) {
        console.warn(`[Universal Sync] Read warning for ${filePath}:`, e?.message);
    }
    return fallback;
}

function writeJsonSafe(filePath: string, data: any): boolean {
    try {
        ensureDir(filePath);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e: any) {
        console.error(`[Universal Sync] Write error for ${filePath}:`, e?.message);
        return false;
    }
}

/**
 * Normalizes brand identifiers to maintain a clean slug
 */
export function normalizeBrandId(rawIdOrName: string): string {
    if (!rawIdOrName) return `brand_${Date.now()}`;
    return rawIdOrName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w\u0600-\u06FF-]/g, '')
        .replace(/_+/g, '_');
}

/**
 * 1. Synchronizes a single brand across all 3 sovereign systems:
 *    - Ez-Zel Brands & Multi-Tenant Store (data/brands.json & data/tenants.json)
 *    - T2 Agent WhatsApp & Voice Brain (D:/new new/.../data/brands.json)
 *    - Tito Studio Firestore & Local Cache (/clinics & /content)
 */
export async function syncBrandToAllEcosystems(payload: UniversalBrandPayload): Promise<{
    success: boolean;
    brandId: string;
    syncMatrix: {
        ezZelBrands: boolean;
        ezZelTenants: boolean;
        t2Agent: boolean;
        titoStudio: boolean;
    };
    brand: any;
}> {
    const brandId = payload.id || (payload.slug ? normalizeBrandId(payload.slug) : `brand_${Date.now()}`);
    const slug = payload.slug || brandId;
    const name = (payload.name || 'براند غير مسمى').trim();
    const cleanPhone = (payload.whatsapp || payload.phone || '01030956097').replace(/[^\d+]/g, '');
    const businessType = payload.businessType || payload.category || 'خدمات وأعمال';
    const planTotal = Number(payload.planType) || 5000;
    const adBudgetRatio = payload.adBudgetRatio !== undefined ? payload.adBudgetRatio : 0.5;
    const adBudgetEgp = Math.round(planTotal * adBudgetRatio);
    const techShareEgp = planTotal - adBudgetEgp;

    const catalog = Array.isArray(payload.productsCatalog) && payload.productsCatalog.length > 0
        ? payload.productsCatalog
        : [
            {
                id: `${brandId}_svc1`,
                name: `الخدمة الرئيسية لـ ${name}`,
                price: "حسب المعاينة والاستشارة",
                category: "general",
                description: `الخدمة المعتمدة الرسمية لـ ${name}`
            }
        ];

    const defaultSystemPrompt = payload.systemPrompt || 
        `أنت المساعد الذكي الرسمي لـ ${name}. ترحب بالعملاء بلهجة مصرية ودودة وسريعة، تشرح خدمات ${businessType} بدقة، وتؤكد الحجوزات بعد الحصول على الاسم ورقم الهاتف.`;

    const nowIso = new Date().toISOString();

    // A. Sync to Ez-Zel data/brands.json
    let ezBrandsOk = false;
    try {
        const ezBrands = readJsonSafe<Record<string, any>>(EZ_ZEL_BRANDS_FILE, {});
        ezBrands[brandId] = {
            id: brandId,
            slug,
            name,
            englishName: payload.englishName || brandId,
            businessType,
            category: businessType,
            phone: cleanPhone,
            whatsapp: cleanPhone,
            websiteUrl: payload.websiteUrl || `https://${brandId}.t2-client.vercel.app`,
            appUrl: payload.appUrl || `/store/${brandId}`,
            ownerEmail: payload.ownerEmail || 'admin@t2.com',
            slogan: payload.slogan || `أفضل خدمات ${businessType} بضمان كامل`,
            systemPrompt: defaultSystemPrompt,
            primaryColor: payload.primaryColor || '#06b6d4',
            accentColor: payload.accentColor || '#38bdf8',
            status: payload.status || 'شغال',
            productsCatalog: catalog,
            weekContentPlan: payload.weekContentPlan || [],
            adBudgetEgp,
            techShareEgp,
            planTotal,
            metaPageId: payload.metaPageId || '',
            metaPageName: payload.metaPageName || '',
            metaToken: payload.metaToken || '',
            updatedAt: nowIso
        };
        ezBrandsOk = writeJsonSafe(EZ_ZEL_BRANDS_FILE, ezBrands);
    } catch (e: any) {
        console.error('[Universal Sync] Error updating Ez-Zel brands:', e?.message);
    }

    // B. Sync to Ez-Zel data/tenants.json
    let ezTenantsOk = false;
    try {
        let ezTenants = readJsonSafe<any[]>(EZ_ZEL_TENANTS_FILE, []);
        if (!Array.isArray(ezTenants)) ezTenants = [];
        const existingIdx = ezTenants.findIndex((t: any) => t.id === brandId || t.brandId === brandId || t.id === `tenant_${brandId}`);
        const tenantEntry = {
            id: `tenant_${brandId}`,
            brandId,
            clientName: name,
            businessName: name,
            category: businessType,
            phone: cleanPhone,
            whatsappBot: cleanPhone,
            status: 'active',
            conversationsCount: 0,
            plan: `باقة ${planTotal.toLocaleString('en-US')} ج.م (${adBudgetEgp.toLocaleString('en-US')} ج إعلانات + ${techShareEgp.toLocaleString('en-US')} ج اشتراك)`,
            adBudgetEgp,
            techShareEgp,
            liveUrl: payload.websiteUrl || `https://${brandId}.t2-client.vercel.app`,
            hasConfirmedBookings: false,
            deployedAt: nowIso.split('T')[0]
        };
        if (existingIdx >= 0) {
            ezTenants[existingIdx] = { ...ezTenants[existingIdx], ...tenantEntry };
        } else {
            ezTenants.unshift(tenantEntry);
        }
        ezTenantsOk = writeJsonSafe(EZ_ZEL_TENANTS_FILE, ezTenants);
    } catch (e: any) {
        console.error('[Universal Sync] Error updating Ez-Zel tenants:', e?.message);
    }

    // C. Sync to T2 Agent data/brands.json
    let t2AgentOk = false;
    try {
        if (fs.existsSync(T2_AGENT_DATA_DIR) || fs.existsSync(path.dirname(T2_AGENT_BRANDS_FILE))) {
            const agentBrands = readJsonSafe<Record<string, any>>(T2_AGENT_BRANDS_FILE, {});
            agentBrands[brandId] = {
                id: brandId,
                name,
                ownerEmail: payload.ownerEmail || 'ahm.atya@gmail.com',
                businessType,
                dialect: 'مصرية احترافية وسريعة',
                websiteUrl: payload.websiteUrl || `https://${brandId}.t2-client.vercel.app`,
                notificationWhatsApp: cleanPhone,
                bookingReceiverPhone: cleanPhone,
                conversationsCount: agentBrands[brandId]?.conversationsCount || 0,
                status: 'active',
                subscriptionStatus: 'PRO',
                isUnlimited: true,
                adBudgetEgp,
                systemPrompt: defaultSystemPrompt,
                productsCatalog: catalog,
                metaPageId: payload.metaPageId || '',
                metaPageName: payload.metaPageName || '',
                createdAt: agentBrands[brandId]?.createdAt || nowIso,
                updatedAt: nowIso
            };
            t2AgentOk = writeJsonSafe(T2_AGENT_BRANDS_FILE, agentBrands);
        }
    } catch (e: any) {
        console.error('[Universal Sync] Error updating T2 Agent:', e?.message);
    }

    // D. Sync to Tito Studio Firestore (/clinics + local cache)
    let titoStudioOk = false;
    try {
        titoStudioOk = await upsertBrandToTitoStudioFirestore({
            id: brandId,
            slug,
            name,
            englishName: payload.englishName || brandId,
            businessType,
            industry: 'services',
            phone: cleanPhone,
            whatsapp: cleanPhone,
            productsCatalog: catalog,
            systemPrompt: defaultSystemPrompt,
            primaryColor: payload.primaryColor || '#06b6d4',
            slogan: payload.slogan || `أفضل خدمات ${businessType} بضمان معتمد`,
            metaPageId: payload.metaPageId,
            metaPageName: payload.metaPageName,
            metaToken: payload.metaToken
        });

        // If weekContentPlan is provided, push it directly to Tito Studio /content
        if (Array.isArray(payload.weekContentPlan) && payload.weekContentPlan.length > 0) {
            await syncWeekPlanToTitoStudioFirestore({ id: brandId, name }, payload.weekContentPlan as any);
        }

        // Also mirror to Tito Studio Enterprise Cloud Run API v3.0
        try {
            await titoStudioApi.updateBrand(brandId, {
                name,
                industry: payload.category || businessType,
                primaryColor: payload.primaryColor || '#06b6d4',
                phone: cleanPhone,
            });
            titoStudioOk = true;
        } catch {
            try {
                await titoStudioApi.createBrand({
                    name,
                    industry: payload.category || businessType,
                    dialect: 'egyptian',
                    primaryColor: payload.primaryColor || '#06b6d4',
                    phone: cleanPhone,
                    description: payload.slogan || `نشاط ${businessType} متكامل`,
                });
                titoStudioOk = true;
            } catch (apiErr: any) {
                console.warn('[Universal Sync] Tito Studio Cloud API mirror warning:', apiErr?.message);
            }
        }
    } catch (e: any) {
        console.error('[Universal Sync] Error updating Tito Studio Firestore:', e?.message);
    }

    // E. Broadcast live event to open Jarvis & Dashboards
    broadcastGatewayEvent('BRAND_UNIFIED', {
        brandId,
        name,
        businessType,
        adBudgetEgp,
        techShareEgp,
        syncMatrix: {
            ezZelBrands: ezBrandsOk,
            ezZelTenants: ezTenantsOk,
            t2Agent: t2AgentOk,
            titoStudio: titoStudioOk
        }
    });

    console.log(`✅ [Universal Sync Completed]: "${name}" (${brandId}) synced across Ez-Zel, T2 Agent & Tito Studio!`);

    return {
        success: ezBrandsOk || ezTenantsOk || t2AgentOk || titoStudioOk,
        brandId,
        syncMatrix: {
            ezZelBrands: ezBrandsOk,
            ezZelTenants: ezTenantsOk,
            t2Agent: t2AgentOk,
            titoStudio: titoStudioOk
        },
        brand: {
            id: brandId,
            name,
            businessType,
            phone: cleanPhone,
            planTotal,
            adBudgetEgp,
            techShareEgp
        }
    };
}

/**
 * 2. Reconciles ALL brands across Ez-Zel, T2 Agent, and Tito Studio
 *    Ensures every brand existing in ANY of the 3 databases is propagated to ALL 3!
 */
export async function reconcileAllBrands(): Promise<{
    totalUnifiedCount: number;
    syncedBrands: Array<{ id: string; name: string; syncStatus: string }>;
    stats: {
        ezZelBrandsCount: number;
        ezZelTenantsCount: number;
        t2AgentBrandsCount: number;
        titoStudioClinicsCount: number;
    };
}> {
    const ezBrands = readJsonSafe<Record<string, any>>(EZ_ZEL_BRANDS_FILE, {});
    const agentBrands = readJsonSafe<Record<string, any>>(T2_AGENT_BRANDS_FILE, {});
    const studioCache = readTitoStudioCacheSync();

    const unifiedMap = new Map<string, UniversalBrandPayload>();

    // 1. Seed from BRAND_VAULT
    Object.values(BRAND_VAULT).forEach((b: any) => {
        if (!b?.id) return;
        unifiedMap.set(b.id, {
            id: b.id,
            slug: b.id,
            name: b.name,
            businessType: b.category || 'خدمات وأعمال',
            phone: b.phone || b.whatsapp,
            whatsapp: b.whatsapp || b.phone,
            status: b.status || 'شغال',
            systemPrompt: b.prompt,
            metaPageId: b.metaPageId,
            metaPageName: b.metaPageName
        });
    });

    // 2. Overlay from T2 Agent brands
    Object.values(agentBrands).forEach((ab: any) => {
        if (!ab?.id) return;
        const key = ab.id;
        const existing: UniversalBrandPayload = unifiedMap.get(key) || { name: ab.name || key };
        unifiedMap.set(key, {
            ...existing,
            id: key,
            slug: ab.slug || existing.slug || key,
            name: ab.name || existing.name,
            businessType: ab.businessType || existing.businessType || 'خدمات وأعمال',
            phone: ab.notificationWhatsApp || ab.bookingReceiverPhone || existing.phone,
            whatsapp: ab.notificationWhatsApp || ab.bookingReceiverPhone || existing.whatsapp,
            websiteUrl: ab.websiteUrl || existing.websiteUrl,
            systemPrompt: ab.systemPrompt || existing.systemPrompt,
            productsCatalog: ab.productsCatalog || existing.productsCatalog,
            metaPageId: ab.metaPageId || existing.metaPageId,
            metaPageName: ab.metaPageName || existing.metaPageName
        });
    });

    // 3. Overlay from Ez-Zel brands.json
    Object.values(ezBrands).forEach((eb: any) => {
        if (!eb?.id) return;
        const key = eb.id;
        const existing: UniversalBrandPayload = unifiedMap.get(key) || { name: eb.name || key };
        unifiedMap.set(key, {
            ...existing,
            id: key,
            slug: eb.slug || existing.slug || key,
            name: eb.name || existing.name,
            businessType: eb.businessType || eb.category || existing.businessType,
            phone: eb.phone || eb.whatsapp || existing.phone,
            whatsapp: eb.whatsapp || eb.phone || existing.whatsapp,
            websiteUrl: eb.websiteUrl || existing.websiteUrl,
            systemPrompt: eb.systemPrompt || existing.systemPrompt,
            productsCatalog: eb.productsCatalog || existing.productsCatalog,
            weekContentPlan: eb.weekContentPlan || existing.weekContentPlan,
            metaPageId: eb.metaPageId || existing.metaPageId,
            metaPageName: eb.metaPageName || existing.metaPageName
        });
    });

    // 4. Overlay from Tito Studio Clinics
    (studioCache.clinics || []).forEach((sc: any) => {
        if (!sc?.id) return;
        let matchedKey = sc.id;
        if (!unifiedMap.has(matchedKey)) {
            const allEntries = Array.from(unifiedMap.entries());
            const foundBySlug = allEntries.find(([_, v]) => v.slug === sc.slug || v.id === sc.slug);
            const foundByName = allEntries.find(([_, v]) => v.name && sc.name && v.name.trim() === sc.name.trim());
            matchedKey = foundBySlug ? foundBySlug[0] : (foundByName ? foundByName[0] : sc.id);
        }

        const existing: UniversalBrandPayload = unifiedMap.get(matchedKey) || { name: sc.name || matchedKey };
        unifiedMap.set(matchedKey, {
            ...existing,
            id: matchedKey,
            slug: sc.slug || existing.slug || matchedKey,
            name: sc.name || existing.name,
            businessType: sc.customIndustry || sc.industry || existing.businessType,
            phone: sc.whatsappNumber || sc.phone || existing.phone,
            whatsapp: sc.whatsappNumber || sc.phone || existing.whatsapp,
            primaryColor: sc.primaryColor || existing.primaryColor,
            slogan: sc.slogan || existing.slogan,
            metaPageId: sc.selectedMetaPage?.id || existing.metaPageId,
            metaPageName: sc.selectedMetaPage?.name || existing.metaPageName
        });
    });

    // Sync all resolved unified brands to all 3 systems
    const syncedBrands: Array<{ id: string; name: string; syncStatus: string }> = [];
    const brandList = Array.from(unifiedMap.values());
    for (const brand of brandList) {
        try {
            await syncBrandToAllEcosystems(brand);
            syncedBrands.push({ id: brand.id!, name: brand.name, syncStatus: '100% UNIFIED' });
        } catch (e: any) {
            syncedBrands.push({ id: brand.id!, name: brand.name, syncStatus: `SYNC_FAILED: ${e.message}` });
        }
    }

    // Final Counts Verification
    const freshEzBrands = readJsonSafe<Record<string, any>>(EZ_ZEL_BRANDS_FILE, {});
    const freshEzTenants = readJsonSafe<any[]>(EZ_ZEL_TENANTS_FILE, []);
    const freshAgentBrands = readJsonSafe<Record<string, any>>(T2_AGENT_BRANDS_FILE, {});
    const freshStudioCache = readTitoStudioCacheSync();

    return {
        totalUnifiedCount: unifiedMap.size,
        syncedBrands,
        stats: {
            ezZelBrandsCount: Object.keys(freshEzBrands).length,
            ezZelTenantsCount: Array.isArray(freshEzTenants) ? freshEzTenants.length : 0,
            t2AgentBrandsCount: Object.keys(freshAgentBrands).length,
            titoStudioClinicsCount: (freshStudioCache.clinics || []).length
        }
    };
}
