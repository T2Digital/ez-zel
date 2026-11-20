import fs from 'fs';
import path from 'path';
import { broadcastGatewayEvent } from './microservicesGateway';
import { BRAND_VAULT } from './brandVault';
import { writeJsonAtomic, savePersistentJson, readPersistentJson } from './persistentStorage';

export interface CampaignRequest {
    brandId: string;
    budgetEgp: number;
    platform: 'meta' | 'tiktok' | 'all';
    objective: 'click_to_whatsapp' | 'lead_form' | 'store_traffic';
    customHook?: string;
}

export interface ScheduledPost {
    id: string;
    brandId: string;
    brandName: string;
    day: string;
    contentType: string;
    hook: string;
    caption: string;
    bestTime: string;
    status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
    publishedAt?: string;
    metaPostId?: string;
}

function getBrandsMap(): Record<string, any> {
    const brands: Record<string, any> = { ...BRAND_VAULT };
    try {
        const filePath = path.join(process.cwd(), 'data', 'brands.json');
        if (fs.existsSync(filePath)) {
            const diskBrands = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            Object.assign(brands, diskBrands);
        }
    } catch {}
    return brands;
}

function getPublishedLogsPath(): string {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
    }
    return path.join(dataDir, 'published_logs.json');
}

export function getPublishedLogs(): any[] {
    try {
        const p = getPublishedLogsPath();
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
    } catch {}
    return [];
}

export function logPublishedPost(entry: any) {
    try {
        const p = getPublishedLogsPath();
        const logs = getPublishedLogs();
        logs.unshift(entry);
        writeJsonAtomic(p, logs.slice(0, 150));
    } catch (e: any) {
        console.warn('[Growth Engine] Error saving published log:', e?.message);
    }
}

/**
 * BRIDGE 2: Autonomous Content Publisher (Meta Graph & TikTok Bridge)
 */
export async function publishBrandPost(brandId: string, postIndex = 0): Promise<{ success: boolean; post: any; message: string }> {
    const brands = getBrandsMap();
    let brand = brands[brandId];
    if (!brand) {
        const match = Object.values(brands).find((b: any) => b.id === brandId || b.slug === brandId || b.name?.includes(brandId));
        if (match) brand = match;
    }
    if (!brand) {
        brand = brands['tito_media'] || Object.values(brands)[0];
    }

    const plan = brand.weekContentPlan || [];
    const targetPost = plan[postIndex] || plan[0] || {
        day: 'اليوم',
        contentType: 'بوست تفاعلي',
        hook: `أفضل خدمات ${brand.name} في مصر بأعلى معايير الاحترافية!`,
        caption: `خصم 10% فوري عند حجز موعدك اليوم وسداد 25% عربون جدية. تواصل معنا على ${brand.phone} فوراً!`,
        bestTime: '8:00 مساءً'
    };

    const postId = `meta_post_${Date.now()}`;
    const metaToken = brand.metaToken || brand.selectedMetaPage?.access_token || process.env.META_ACCESS_TOKEN;
    const pageId = brand.metaPageId || brand.selectedMetaPage?.id || process.env.META_PAGE_ID;

    let liveMetaDispatched = false;
    let realMetaPostId: string | undefined = undefined;
    let metaErrorDetail = '';

    if (metaToken && pageId) {
        try {
            const postImageUrl = targetPost.visualUrl || targetPost.imageUrl || targetPost.mediaUrl || brand.logoUrl;
            const fullCaption = `${targetPost.hook}\n\n${targetPost.caption}\n\n🛒 للتواصل والحجز الفوري عبر واتساب:\nhttps://wa.me/2${(brand.phone || brand.whatsapp || '01030956097').replace(/^0/, '')}`;

            let endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
            let reqBody: any = {
                message: fullCaption,
                access_token: metaToken
            };

            if (postImageUrl && typeof postImageUrl === 'string' && postImageUrl.startsWith('http')) {
                endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
                reqBody = {
                    caption: fullCaption,
                    url: postImageUrl,
                    access_token: metaToken
                };
            }

            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });
            const d: any = await resp.json();
            if (d.id) {
                realMetaPostId = String(d.id);
                liveMetaDispatched = true;
            } else if (d.error?.message) {
                metaErrorDetail = d.error.message;
            }

            // Dual-publish to Instagram Business Account if connected & image URL is available
            const igUserId = brand.igUserId || brand.selectedMetaPage?.instagram_business_account?.id;
            if (liveMetaDispatched && igUserId && postImageUrl && String(postImageUrl).startsWith('http')) {
                try {
                    const igMediaRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image_url: postImageUrl,
                            caption: fullCaption,
                            access_token: metaToken
                        })
                    });
                    const igMedia: any = await igMediaRes.json();
                    if (igMedia?.id) {
                        await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ creation_id: igMedia.id, access_token: metaToken })
                        });
                    }
                } catch (igErr: any) {
                    console.warn('[Growth Engine] Instagram dual-publish skipped:', igErr?.message);
                }
            }
        } catch (err: any) {
            metaErrorDetail = err?.message || 'تعذر الاتصال بـ Meta Graph API';
            console.warn('[Growth Engine] Meta Graph API direct post failed:', metaErrorDetail);
        }
    }

    if (liveMetaDispatched && Array.isArray(brand.weekContentPlan) && brand.weekContentPlan[postIndex]) {
        try {
            const { persistBrandUpdateAcrossEcosystem } = await import('./obsidianVaultService');
            const updatedPlan = brand.weekContentPlan.map((item: any, idx: number) =>
                idx === postIndex
                    ? { ...item, status: 'PUBLISHED', publishedAt: new Date().toISOString(), metaPostId: realMetaPostId }
                    : item
            );
            persistBrandUpdateAcrossEcosystem(brand.id, { weekContentPlan: updatedPlan });
        } catch {}
    }

    const publishedEntry: ScheduledPost = {
        id: postId,
        brandId,
        brandName: brand.name,
        day: targetPost.day,
        contentType: targetPost.contentType,
        hook: targetPost.hook,
        caption: targetPost.caption,
        bestTime: targetPost.bestTime,
        status: liveMetaDispatched ? 'PUBLISHED' : 'SCHEDULED',
        publishedAt: liveMetaDispatched ? new Date().toISOString() : undefined,
        metaPostId: realMetaPostId
    };

    logPublishedPost(publishedEntry);

    // Broadcast live event to open Jarvis & dashboards
    broadcastGatewayEvent('CONTENT_PUBLISHED', {
        ...publishedEntry,
        liveMetaDispatched,
        requiresMetaAuth: !liveMetaDispatched
    });

    return {
        success: true,
        post: {
            ...publishedEntry,
            liveMetaDispatched,
            requiresMetaAuth: !liveMetaDispatched
        },
        message: liveMetaDispatched
            ? `✅ تم نشر المنشور والتصميم فعلياً على صفحة فيسبوك الرسمية لـ ${brand.name} (معرف منشور ميتا: ${realMetaPostId})!`
            : `تم تجهيز وتصميم ونقل المنشور لـ تيتو ستوديو بنجاح لـ صفحة ${brand.name}! للنشر المباشر التلقائي على فيسبوك، يرجى تحديث توكن صفحة ميتا (Meta Token)${metaErrorDetail ? ` - تنبيه ميتا: ${metaErrorDetail}` : ''}.`
    };
}

/**
 * BRIDGE 3: Autonomous Ad Campaign Launcher (Meta Marketing API + Studio Mirror + Persistent Storage)
 */
export async function launchAdCampaign(params: CampaignRequest): Promise<any> {
    const brands = getBrandsMap();
    const brand = brands[params.brandId];
    if (!brand) {
        throw new Error(`البراند (${params.brandId}) غير موجود لإطلاق الحملة`);
    }

    const budget = params.budgetEgp || 2500;
    const dailyBudget = Math.round(budget / 7);
    const targetHook = params.customHook || brand.marketAnalysis?.irresistibleHooks?.[0] || `عرض حصري من ${brand.name} - احجز الآن!`;
    const targeting = {
        country: 'EG',
        locations: ['القاهرة الجديدة', 'الشيخ زايد', 'المعادي', 'الإسكندرية', 'المنصورة'],
        ageRange: '24-55',
        gender: 'ALL',
        interests: [brand.businessType || 'خدمات وأعمال', 'تسوق إلكتروني']
    };
    const destination = `https://wa.me/2${(brand.phone || '01013373634').replace(/^0/, '')}?text=${encodeURIComponent(`أهلاً ${brand.name}، مهتم بالعرض الإعلاني وحابب أعرف التفاصيل`)}`;

    let metaRes: any = null;
    try {
        const { createMetaAdCampaign } = await import('./metaAndCloudSuiteService');
        metaRes = await createMetaAdCampaign({
            token: brand.metaToken || brand.selectedMetaPage?.access_token || process.env.META_ACCESS_TOKEN,
            adAccountId: brand.metaAdAccountId || process.env.META_AD_ACCOUNT_ID,
            campaignName: `${brand.name} - ${params.objective || 'click_to_whatsapp'}`,
            objective: params.objective === 'store_traffic' ? 'OUTCOME_TRAFFIC' : 'OUTCOME_LEADS',
            dailyBudget,
            currency: 'EGP',
            targeting,
            creative: { hook: targetHook, destination }
        });
    } catch (metaErr: any) {
        console.warn('[Growth Engine] Meta Marketing API dispatch note:', metaErr?.message);
    }

    // Mirror campaign generation request to Tito Studio when online
    let studioDispatched = false;
    try {
        const { titoStudioApi } = await import('./titoStudioApiClient');
        await titoStudioApi.createMetaAdCampaign({
            clinicId: brand.id,
            campaignName: `${brand.name} - ${params.objective || 'click_to_whatsapp'}`,
            dailyBudget,
            objective: params.objective || 'click_to_whatsapp',
            offerDetails: targetHook,
            accessToken: brand.metaToken || process.env.META_ACCESS_TOKEN,
        });
        studioDispatched = true;
    } catch {}

    const campaignId = metaRes?.campaignId || `camp_${Date.now()}`;
    const campaignData = {
        id: campaignId,
        brandId: brand.id,
        brandName: brand.name,
        platform: params.platform || 'meta',
        objective: params.objective || 'click_to_whatsapp',
        totalBudgetEgp: budget,
        dailySpendEgp: dailyBudget,
        durationDays: 7,
        status: metaRes?.liveMetaDispatched ? 'ACTIVE_LIVE' : 'PREPARED_PENDING_META_TOKEN',
        liveMetaDispatched: Boolean(metaRes?.liveMetaDispatched),
        studioDispatched,
        metaCampaignId: metaRes?.campaignId,
        hook: targetHook,
        targetAudience: targeting,
        destination,
        estimatedReach: `${Math.round(budget * 8)} - ${Math.round(budget * 14)} عميل مهتم`,
        estimatedLeads: `${Math.round(budget / 45)} - ${Math.round(budget / 25)} محادثة واتساب مؤكدة`,
        createdAt: new Date().toISOString()
    };

    try {
        const camps = readPersistentJson<any[]>('campaigns.json', []);
        const nextCamps = Array.isArray(camps) ? [campaignData, ...camps].slice(0, 100) : [campaignData];
        savePersistentJson('t2_campaigns', 'campaigns.json', nextCamps);
    } catch (e: any) {
        console.warn('[Growth Engine] Error saving campaign:', e?.message);
    }

    broadcastGatewayEvent('CAMPAIGN_LAUNCHED', campaignData);

    console.log(`🚀 [Growth Engine] Ad campaign dispatched for ${brand.name} (${campaignData.status}, ${budget} EGP)`);
    return campaignData;
}

/**
 * BRIDGE 4: Self-Optimizing Profit & Conversion Loop (Live Conversations + Gemini + Prompt Sync)
 */
export async function runSelfOptimizingLoop(brandId: string): Promise<any> {
    const brands = getBrandsMap();
    const brand = brands[brandId];
    if (!brand) throw new Error('البراند غير موجود');

    let brandConversations: any[] = [];
    let brandBookings: any[] = [];
    let dataSource: 't2_agent_live' | 'local_fallback' = 'local_fallback';

    try {
        const { t2AgentApi } = await import('./t2AgentApiClient');
        const [convRes, bookRes] = await Promise.all([
            t2AgentApi.getConversations(brandId).catch(() => null),
            t2AgentApi.getBookings(brandId).catch(() => null),
        ]);
        const convList = Array.isArray(convRes?.conversations) ? convRes.conversations : Array.isArray(convRes) ? convRes : null;
        const bookList = Array.isArray(bookRes?.bookings) ? bookRes.bookings : Array.isArray(bookRes) ? bookRes : null;
        if (convList || bookList) {
            brandConversations = convList || [];
            brandBookings = bookList || [];
            dataSource = 't2_agent_live';
        }
    } catch {}

    if (dataSource === 'local_fallback') {
        const localBookings = readPersistentJson<any[]>('bookings.json', []);
        const localMsgs = readPersistentJson<any[]>('messages.json', []);
        brandBookings = Array.isArray(localBookings) ? localBookings.filter((b: any) => b.brandId === brandId) : [];
        brandConversations = Array.isArray(localMsgs) ? localMsgs.filter((m: any) => m.brandId === brandId) : [];
    }

    const conversationsCount = brandConversations.length;
    const bookingsCount = brandBookings.length;
    const conversionPct = conversationsCount > 0 ? Number(((bookingsCount / conversationsCount) * 100).toFixed(1)) : 0;
    const sampleCustomerQueries = brandConversations
        .slice(0, 12)
        .map((c: any) => c.lastMessage || c.lastUserMessage || c.message || c.text || '')
        .filter(Boolean);

    let topDetectedObjection = brand.marketAnalysis?.topObjections?.[0] || 'الاستفسار عن الأسعار ومواعيد التوصيل أو الحجز';
    let newSuggestedHook = `اطلب الآن من ${brand.name} واستفد بسرعة التنفيذ والضمان المعتمد!`;
    let newPromptRule = `[تحسين التحويل التلقائي]: أجب باختصار ووضوح على أسئلة السعر والشحن ثم اطلب الاسم والهاتف لتأكيد الطلب فوراً.`;

    try {
        const { createRotatingServerAI, loadGeminiKeysFromEnv } = await import('./geminiKeyPool');
        if (loadGeminiKeysFromEnv().length > 0 && sampleCustomerQueries.length > 0) {
            const ai = createRotatingServerAI();
            const analysisPrompt = `حلل استفسارات عملاء "${brand.name}" (${brand.businessType || 'نشاط تجاري'}) التالية واقترح بصيغة JSON فقط بالحقول {topObjection, suggestedHook, promptRule}:\n${sampleCustomerQueries.join('\n- ')}`;
            const resp: any = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: analysisPrompt,
                config: { responseMimeType: 'application/json' }
            });
            const parsed = JSON.parse(resp?.text || '{}');
            if (parsed.topObjection) topDetectedObjection = String(parsed.topObjection);
            if (parsed.suggestedHook) newSuggestedHook = String(parsed.suggestedHook);
            if (parsed.promptRule) newPromptRule = String(parsed.promptRule);
        }
    } catch {}

    const basePrompt = String(brand.systemPrompt || `أنت المساعد الذكي الرسمي لـ ${brand.name}.`).trim();
    const updatedSystemPrompt = `${basePrompt}\n${newPromptRule}`;

    try {
        const { persistBrandUpdateAcrossEcosystem } = await import('./obsidianVaultService');
        persistBrandUpdateAcrossEcosystem(brand.id, {
            systemPrompt: updatedSystemPrompt,
            lastOptimizationHook: newSuggestedHook,
        } as any);
    } catch {}

    let agentSynced = false;
    try {
        const { updateT2AgentInstructions } = await import('./titoAgentBridgeService');
        const syncRes = await updateT2AgentInstructions(brand.id, updatedSystemPrompt);
        agentSynced = Boolean(syncRes?.liveSynced);
    } catch {}

    const optimizationResult = {
        brandId,
        brandName: brand.name,
        dataSource,
        analyzedConversationsCount: conversationsCount,
        analyzedBookingsCount: bookingsCount,
        currentConversionRate: conversationsCount > 0 ? `${conversionPct}%` : 'قيد جمع المحادثات الأولى',
        topDetectedObjection,
        actionTaken: newPromptRule,
        newSuggestedHook,
        agentSynced,
        optimizedAt: new Date().toISOString()
    };

    broadcastGatewayEvent('LOOP_OPTIMIZED', optimizationResult);
    return optimizationResult;
}

/**
 * Initialize Autonomous Agency Background Cron Engine
 */
export function setupAutonomousAgencyCron() {
    console.log('⏰ [Growth Engine] Autonomous Agency Background Scheduler initialized.');

    const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    // Run every hour: matches scheduled day & avoids duplicate publishing on the same day
    setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        if (hour !== 14 && hour !== 20) return;

        const todayDay = ARABIC_DAYS[now.getDay()];
        const todayDate = now.toISOString().split('T')[0];
        const logs = getPublishedLogs();
        const brands = Object.values(getBrandsMap()).filter((b: any) => b?.metaToken && b?.metaPageId);

        for (const targetBrand of brands) {
            if (!targetBrand?.id) continue;
            const alreadyToday = logs.some(
                (l: any) => l.brandId === targetBrand.id && l.status === 'PUBLISHED' && String(l.publishedAt || '').startsWith(todayDate)
            );
            if (alreadyToday) continue;

            const plan: any[] = Array.isArray(targetBrand.weekContentPlan) ? targetBrand.weekContentPlan : [];
            let nextIdx = plan.findIndex((p: any) => p.status !== 'PUBLISHED' && String(p.day || '').includes(todayDay));
            if (nextIdx === -1) {
                nextIdx = plan.findIndex((p: any) => p.status !== 'PUBLISHED');
            }
            if (nextIdx !== -1) {
                publishBrandPost(targetBrand.id, nextIdx).catch(() => {});
            }
        }
    }, 1000 * 60 * 60);
}
