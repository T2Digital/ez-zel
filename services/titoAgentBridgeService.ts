import { BRAND_VAULT } from './brandVault';
import { broadcastGatewayEvent } from './microservicesGateway';
import { t2AgentApi } from './t2AgentApiClient';

/**
 * Unified Live-First Bridge for T2 AI Agent Enterprise (Render Cloud + Local Vault Fallback)
 * Replaces legacy localhost-only file reads and removes all mock/simulated CRM data.
 */

export async function getT2AgentBrands() {
    try {
        const live = await t2AgentApi.getAllBrandsHealth();
        const rawList = Array.isArray(live?.brands) ? live.brands : Array.isArray(live) ? live : null;
        if (rawList) {
            return {
                success: true,
                source: 'live',
                totalBrands: rawList.length,
                brands: rawList.map((b: any) => ({
                    id: b.id || b.brandId,
                    name: b.name || b.brandName || b.id,
                    category: b.category || 'خدمات وأعمال',
                    phone: b.phone || b.whatsapp || '',
                    status: b.status || (b.connected ? 'متصل' : 'غير متصل'),
                    isAiActive: b.isAiActive !== false,
                    conversationsCount: b.conversationsCount || 0,
                    metaPageId: b.metaPageId,
                    metaPageName: b.metaPageName,
                })),
            };
        }
    } catch (err: any) {
        console.warn('[T2 Agent Bridge] Live getAllBrandsHealth fallback to BRAND_VAULT:', err?.message);
    }

    const brandsList = Object.values(BRAND_VAULT).map((b: any) => ({
        id: b.id,
        name: b.name || b.brandName || 'براند',
        category: b.category || 'خدمات وأعمال',
        phone: b.phone || b.whatsapp || '',
        status: b.status || 'احتياطي',
        isAiActive: b.isAiActive !== false,
        conversationsCount: b.conversationsCount || 0,
        metaPageId: b.metaPageId,
        metaPageName: b.metaPageName,
    }));

    return {
        success: true,
        source: 'vault_fallback',
        totalBrands: brandsList.length,
        brands: brandsList,
    };
}

export async function getT2AgentBrandStatus(brandId: string) {
    try {
        const live = await t2AgentApi.getBrandStatus(brandId);
        if (live && !live.error) {
            return {
                success: true,
                source: 'live',
                brandId,
                brandName: live.brandName || live.name || brandId,
                phone: live.phone || '',
                connectionStatus: live.connectionStatus || (live.connected ? 'CONNECTED' : 'DISCONNECTED'),
                isAiActive: live.isAiActive !== false,
                qrCodeAvailable: Boolean(live.qrCode || live.qr),
                totalConversations: live.totalConversations || 0,
                metaConnected: Boolean(live.metaConnected || live.metaPageId),
                raw: live,
            };
        }
    } catch (err: any) {
        console.warn(`[T2 Agent Bridge] Live status fallback for ${brandId}:`, err?.message);
    }

    const brand = (BRAND_VAULT as Record<string, any>)[brandId];
    if (!brand) {
        return { success: false, error: 'تعذر الوصول لحالة البراند في تيتو أجنت حالياً' };
    }

    return {
        success: true,
        source: 'vault_fallback',
        brandId: brand.id,
        brandName: brand.name,
        phone: brand.phone || '',
        connectionStatus: brand.connectionStatus || 'UNKNOWN',
        isAiActive: brand.isAiActive !== false,
        qrCodeAvailable: false,
        totalConversations: brand.conversationsCount || 0,
        metaConnected: Boolean(brand.metaPageId),
    };
}

export async function getT2AgentPairingQr(brandId: string) {
    try {
        const live = await t2AgentApi.getBrandStatus(brandId);
        if (live?.qrCode || live?.qr) {
            return {
                success: true,
                source: 'live',
                brandId,
                qrCode: live.qrCode || live.qr,
                message: 'امسح رمز الاستجابة السريعة (QR) من تطبيق واتساب لربط الوكيل الذكي فوراً',
            };
        }
    } catch {}

    return {
        success: false,
        brandId,
        error: 'لا يوجد QR Code نشط حالياً — تحقق من حالة الاتصال في T2 Agent',
    };
}

export async function updateT2AgentInstructions(brandId: string, systemInstruction: string) {
    let liveSynced = false;
    try {
        await t2AgentApi.executeExternalAction(brandId, 'brands', 'update', {
            systemPrompt: systemInstruction,
            knowledgeText: systemInstruction,
        });
        liveSynced = true;
    } catch {
        try {
            const b = (BRAND_VAULT as Record<string, any>)[brandId];
            await t2AgentApi.executeExternalAction(brandId, 'brands', 'create', {
                brandId,
                name: b?.name || brandId,
                businessType: b?.category || 'خدمات وأعمال',
                systemPrompt: systemInstruction,
                knowledgeText: systemInstruction,
            });
            liveSynced = true;
        } catch (err: any) {
            console.warn(`[T2 Agent Bridge] Live instruction push skipped for ${brandId}:`, err?.message);
        }
    }
    broadcastGatewayEvent('AGENT_PROMPT_MUTATED', { brandId, systemInstruction, liveSynced });
    return {
        success: true,
        liveSynced,
        brandId,
        message: liveSynced
            ? 'تم تحديث وتفعيل توجيهات الوكيل الذكي لحظياً على السيرفر الحي.'
            : 'تم بث تحديث التوجيهات للوكيل الذكي محلياً (سيُزامن عند عودة اتصال السيرفر).',
    };
}

export async function sendT2AgentWhatsAppMessage(brandId: string, payload: { phone: string; message: string }) {
    const res = await t2AgentApi.sendManualReply(brandId, payload.phone, payload.message);
    broadcastGatewayEvent('WHATSAPP_MESSAGE_SENT', {
        brandId,
        recipient: payload.phone,
        text: payload.message,
        timestamp: new Date().toISOString(),
    });
    return {
        success: true,
        source: 'live',
        result: res,
        message: `تم إرسال الرسالة إلى الرقم (${payload.phone}) عبر T2 Agent اللايف بنجاح!`,
    };
}

export async function getT2AgentBookings(brandId: string) {
    try {
        const live = await t2AgentApi.getBookings(brandId);
        const bookings = Array.isArray(live?.bookings) ? live.bookings : Array.isArray(live) ? live : [];
        return {
            success: true,
            source: 'live',
            brandId,
            totalBookings: bookings.length,
            bookings,
        };
    } catch (err: any) {
        console.warn(`[T2 Agent Bridge] Live bookings error for ${brandId}:`, err?.message);
        return {
            success: false,
            source: 'live_error',
            brandId,
            totalBookings: 0,
            bookings: [],
            error: err?.message || 'تعذر جلب الحجوزات الحية من T2 Agent',
        };
    }
}

export async function getT2AgentConversations(brandId: string) {
    try {
        const live = await t2AgentApi.getConversations(brandId);
        const conversations = Array.isArray(live?.conversations) ? live.conversations : Array.isArray(live) ? live : [];
        return {
            success: true,
            source: 'live',
            brandId,
            conversations,
        };
    } catch (err: any) {
        console.warn(`[T2 Agent Bridge] Live conversations error for ${brandId}:`, err?.message);
        return {
            success: false,
            source: 'live_error',
            brandId,
            conversations: [],
            error: err?.message || 'تعذر جلب المحادثات الحية من T2 Agent',
        };
    }
}

export async function toggleT2AgentBotStatus(brandId: string, _status?: 'active' | 'paused') {
    const res = await t2AgentApi.togglePauseBot(brandId);
    const isAiActive = res?.isAiActive !== undefined ? Boolean(res.isAiActive) : !Boolean(res?.paused);
    broadcastGatewayEvent('BOT_STATUS_CHANGED', { brandId, isAiActive });
    return {
        success: true,
        source: 'live',
        brandId,
        isAiActive,
        message: isAiActive ? 'تم استئناف الرد الآلي للوكيل الذكي بنجاح' : 'تم إيقاف الرد الآلي للوكيل مؤقتاً',
    };
}
