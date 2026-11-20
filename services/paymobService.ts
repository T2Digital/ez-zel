import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { writeJsonAtomic, savePersistentJson } from './persistentStorage';

export interface PaymobCheckoutRequest {
    brandId: string;
    brandName: string;
    planId: string;
    customTitle?: string;
    billingCycle?: 'monthly' | 'yearly';
    amountEgp?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}

export interface PaymobCheckoutResponse {
    ok: boolean;
    paymentUrl: string;
    orderId: string;
    intentionId?: string;
    planName: string;
    amountEgp: number;
    mode: 'live_paymob' | 'pending_gateway_verification';
}

const SUBSCRIPTIONS_LOG_PATH = path.join(process.cwd(), 'data', 'paymob_subscriptions.json');

export const PAYMOB_PLANS: Record<string, {
    id: string;
    name: string;
    amountEgp: number;
    originalAmountEgp: number;
    discountPercentage: number;
    adBudgetEgp: number;
    offerCondition: string;
    yearlyDiscountedTotal: number;
    videosPerMonth: number;
    designsPerMonth: number;
    platforms: string[];
    features: string[];
}> = {
    tier_2500: {
        id: 'tier_2500',
        name: 'باقة الانطلاق الفضي (2,500 ج.م / شهر)',
        amountEgp: 2500,
        originalAmountEgp: 5000,
        discountPercentage: 50,
        adBudgetEgp: 1250,
        offerCondition: 'خصم 50% حصري لأول 100 براند (3 شهور بالدفع الشهري أو سنة كاملة بالدفع السنوي)',
        yearlyDiscountedTotal: 30000,
        videosPerMonth: 2,
        designsPerMonth: 8,
        platforms: ['whatsapp', 'facebook', 'instagram', 'google_business'],
        features: [
            '🎯 1,250 ج.م ميزانية إعلانات ممولة مباشرة لنشاطك (نصف قيمة الباقة إعلانات!)',
            '🎬 2 فيديو ريلز ترويجي شهرياً (Omni Flash) + 8 تصميمات سوشيال احترافية عبر تيتو ستوديو',
            '📲 المنصات المشمولة: WhatsApp + Meta (Facebook & Instagram) + Google Business & Maps',
            '🌐 صفحة هبوط بيعية تحويلية (Landing Page) عالية التحويل مربوطة بواتساب والبيكسل',
            '🤖 وكيل واتساب وميتا وخرائط جوجل الذكي للرد الفوري على الرسائل والتقييمات 24/7'
        ]
    },
    tier_5000: {
        id: 'tier_5000',
        name: 'باقة النمو الذهبي (5,000 ج.م / شهر)',
        amountEgp: 5000,
        originalAmountEgp: 10000,
        discountPercentage: 50,
        adBudgetEgp: 2500,
        offerCondition: 'خصم 50% حصري لأول 100 براند (3 شهور بالدفع الشهري أو سنة كاملة بالدفع السنوي)',
        yearlyDiscountedTotal: 60000,
        videosPerMonth: 4,
        designsPerMonth: 16,
        platforms: ['whatsapp', 'facebook', 'instagram', 'tiktok', 'google_business'],
        features: [
            '🎯 2,500 ج.م ميزانية إعلانات ممولة مباشرة (Meta & TikTok) لنصف القيمة',
            '🎬 4 فيديوهات ريلز احترافية شهرياً (Veo & Turbo Flow) + 16 تصميم جرافيك عبر تيتو ستوديو',
            '📲 المنصات المشمولة: WhatsApp + Meta (Facebook & Instagram) + TikTok + Google Business & Maps',
            '📱 نسخة تطبيق وموقع PWA متكامل (Battah Store+ERP+POS أو Clean Master Bookings+Calendar)',
            '🤖 وكيل مبيعات واتساب تفاوضي لتأكيد وإغلاق الحجوزات آلياً + رد ذكي على تقييمات جوجل'
        ]
    },
    tier_10000: {
        id: 'tier_10000',
        name: 'باقة التوسع البلاتيني (10,000 ج.م / شهر)',
        amountEgp: 10000,
        originalAmountEgp: 20000,
        discountPercentage: 50,
        adBudgetEgp: 5000,
        offerCondition: 'خصم 50% حصري لأول 100 براند (3 شهور بالدفع الشهري أو سنة كاملة بالدفع السنوي)',
        yearlyDiscountedTotal: 120000,
        videosPerMonth: 8,
        designsPerMonth: 30,
        platforms: ['whatsapp', 'facebook', 'instagram', 'tiktok', 'youtube', 'google_business'],
        features: [
            '🎯 5,000 ج.م ميزانية إعلانات ممولة مستهدفة لحصد المبيعات (نصف القيمة إعلانات!)',
            '🎬 8 فيديوهات احترافية شهرياً (Veo & Flow) + 30 تصميم جرافيك يومي عبر تيتو ستوديو',
            '📲 جميع المنصات الأساسية: WhatsApp + Meta (FB & IG) + TikTok + YouTube + Google Business & Maps',
            '📱 تطبيق PWA متقدم (Battah ERP/CRM/POS أو Clean Master Calendar/Financials) مخصص لنشاطك',
            '💳 بوابة دفع إلكتروني Paymob لتأكيد الحجوزات والطلبات فوراً'
        ]
    },
    tier_25000: {
        id: 'tier_25000',
        name: 'باقة الهيمنة السوقية VIP (25,000 ج.م / شهر)',
        amountEgp: 25000,
        originalAmountEgp: 50000,
        discountPercentage: 50,
        adBudgetEgp: 12500,
        offerCondition: 'خصم 50% حصري لأول 100 براند (3 شهور بالدفع الشهري أو سنة كاملة بالدفع السنوي)',
        yearlyDiscountedTotal: 300000,
        videosPerMonth: 16,
        designsPerMonth: 45,
        platforms: ['whatsapp', 'facebook', 'instagram', 'tiktok', 'youtube', 'snapchat', 'google_business'],
        features: [
            '🎯 12,500 ج.م ميزانية إعلانات ممولة قوية للسيطرة على السوق (نصف القيمة إعلانات!)',
            '🎥 16 فيديو احترافي شهرياً + 45 تصميم جرافيك شهرياً وإدارة الحملات الإعلانية اليومية',
            '📲 كل المنصات + Snapchat & Google Maps: WhatsApp + Meta + TikTok + YouTube + Snapchat + Google Business',
            '🏢 تطبيق ومنظومة متكاملة متعددة الفروع ونقاط البيع + تخصيص كامل للذكاء الاصطناعي',
            '👑 دعم تنفيذي مباشر 24/7 مع مدير حساب ذكي وخبير نمو مخصص'
        ]
    },
    tier_50000: {
        id: 'tier_50000',
        name: 'باقة الشركات الكبرى والمؤسسات (50,000 ج.م / شهر)',
        amountEgp: 50000,
        originalAmountEgp: 100000,
        discountPercentage: 50,
        adBudgetEgp: 25000,
        offerCondition: 'خصم 50% حصري لأول 100 براند (3 شهور بالدفع الشهري أو سنة كاملة بالدفع السنوي)',
        yearlyDiscountedTotal: 600000,
        videosPerMonth: 32,
        designsPerMonth: 60,
        platforms: ['whatsapp', 'facebook', 'instagram', 'tiktok', 'youtube', 'snapchat', 'google_business', 'x'],
        features: [
            '🎯 25,000 ج.م ميزانية حملات إعلانية ضخمة عبر كافة المنصات (نصف القيمة إعلانات!)',
            '🎥 إنتاج محتوى وفيديو غير محدود حسب الطلب — أولوية قصوى 60+ تصميم و32+ فيديو شهرياً',
            '📲 تغطية شاملة لكل المنصات: WhatsApp + Meta + TikTok + YouTube + Snapchat + Google Business & Maps + X',
            '🌐 بناء وتخصيص أنظمة وتطبيقات متكاملة (Battah Enterprise ERP/POS & Clean Master Suite) وسيرفرات مخصصة',
            '📊 تحليل تنبؤي ومراقبة سلوك الزوار وتحسين معدلات التحويل 24/7'
        ]
    }
};

// Clean array of official 5 tiers
export const PAYMOB_TIERS = [
    PAYMOB_PLANS.tier_2500,
    PAYMOB_PLANS.tier_5000,
    PAYMOB_PLANS.tier_10000,
    PAYMOB_PLANS.tier_25000,
    PAYMOB_PLANS.tier_50000
];

// Aliases for legacy plan ids
(PAYMOB_PLANS as any).starter_monthly = PAYMOB_PLANS.tier_2500;
(PAYMOB_PLANS as any).growth_pro = PAYMOB_PLANS.tier_5000;
(PAYMOB_PLANS as any).agency_unlimited = PAYMOB_PLANS.tier_10000;

export function readPaymobSubscriptions(): any[] {
    try {
        if (fs.existsSync(SUBSCRIPTIONS_LOG_PATH)) {
            const parsed = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_LOG_PATH, 'utf8'));
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {}
    return [];
}

export function savePaymobSubscriptionRecord(record: any): void {
    try {
        const list = readPaymobSubscriptions();
        const idx = list.findIndex(r => r.orderId === record.orderId || (r.brandId === record.brandId && record.status === 'paid'));
        if (idx >= 0) {
            list[idx] = { ...list[idx], ...record };
        } else {
            list.unshift(record);
        }
        savePersistentJson('paymob_subscriptions', 'paymob_subscriptions.json', list);
    } catch {}
}

/**
 * Creates a Paymob payment session (supports both Paymob v1 Intention API and Classic Auth->Order->PaymentKey API).
 * Never auto-activates for free: if Paymob keys are not yet configured in .env, opens a Pending Verification Checkout Gateway
 * that requires either a signed Paymob Webhook or Sovereign Admin confirmation.
 */
export async function createPaymobCheckoutSession(req: PaymobCheckoutRequest): Promise<PaymobCheckoutResponse> {
    const plan = PAYMOB_PLANS[req.planId] || PAYMOB_PLANS.tier_5000;
    const isYearly = req.billingCycle === 'yearly';
    const amountEgp = req.amountEgp || (isYearly ? plan.yearlyDiscountedTotal : plan.amountEgp);
    const amountCents = Math.round(amountEgp * 100);

    const apiKey = process.env.PAYMOB_API_KEY || '';
    const secretKey = process.env.PAYMOB_SECRET_KEY || '';
    const publicKey = process.env.PAYMOB_PUBLIC_KEY || '';
    const integrationId = Number(process.env.PAYMOB_INTEGRATION_ID || 0);
    const iframeId = process.env.PAYMOB_IFRAME_ID || '';

    const nameParts = (req.customerName || req.brandName || 'عميل تيتو').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || 'T2';
    const phone = req.customerPhone || '01013373634';
    const email = req.customerEmail || `${req.brandId}@t2-studio.app`;
    const merchantOrderId = `T2_${req.brandId}_${Date.now()}`;

    // 1. Paymob Intention API (Unified Checkout)
    if (secretKey && publicKey && integrationId) {
        try {
            const intentionRes = await fetch('https://accept.paymob.com/v1/intention/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${secretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amountCents,
                    currency: 'EGP',
                    payment_methods: [integrationId],
                    items: [
                        {
                            name: `${req.customTitle || plan.name} - ${req.brandName}`,
                            amount: amountCents,
                            description: req.customTitle ? `${req.customTitle} (${req.brandName})` : `اشتراك منظومة تيتو للبراند ${req.brandName}`,
                            quantity: 1
                        }
                    ],
                    billing_data: {
                        apartment: 'NA',
                        first_name: firstName,
                        last_name: lastName,
                        street: 'Cairo',
                        building: 'NA',
                        phone_number: phone,
                        city: 'Cairo',
                        country: 'EG',
                        email,
                        floor: 'NA',
                        state: 'Cairo'
                    },
                    special_reference: merchantOrderId,
                    extras: {
                        brandId: req.brandId,
                        planId: req.planId
                    }
                }),
                signal: AbortSignal.timeout(8000)
            });

            if (intentionRes.ok) {
                const intentionData: any = await intentionRes.json();
                if (intentionData.client_secret) {
                    const paymentUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(intentionData.client_secret)}`;
                    savePaymobSubscriptionRecord({
                        orderId: merchantOrderId,
                        brandId: req.brandId,
                        brandName: req.brandName,
                        planId: req.planId,
                        planName: plan.name,
                        amountEgp,
                        status: 'pending',
                        paymentUrl,
                        createdAt: new Date().toISOString()
                    });
                    return {
                        ok: true,
                        paymentUrl,
                        orderId: merchantOrderId,
                        intentionId: intentionData.id,
                        planName: plan.name,
                        amountEgp,
                        mode: 'live_paymob'
                    };
                }
            }
        } catch (e: any) {
            console.warn('[Paymob] Unified checkout error:', e?.message);
        }
    }

    // 2. Classic Paymob API (Auth -> Order -> Payment Key -> Iframe)
    if (apiKey && integrationId && iframeId) {
        try {
            const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey }),
                signal: AbortSignal.timeout(7000)
            });
            const authData: any = authRes.ok ? await authRes.json() : {};
            if (authData.token) {
                const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auth_token: authData.token,
                        delivery_needed: 'false',
                        amount_cents: String(amountCents),
                        currency: 'EGP',
                        merchant_order_id: merchantOrderId,
                        items: []
                    }),
                    signal: AbortSignal.timeout(7000)
                });
                const orderData: any = orderRes.ok ? await orderRes.json() : {};
                if (orderData.id) {
                    const keyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            auth_token: authData.token,
                            amount_cents: String(amountCents),
                            expiration: 3600,
                            order_id: orderData.id,
                            billing_data: {
                                apartment: 'NA',
                                email,
                                floor: 'NA',
                                first_name: firstName,
                                street: 'Cairo',
                                building: 'NA',
                                phone_number: phone,
                                shipping_method: 'NA',
                                postal_code: 'NA',
                                city: 'Cairo',
                                country: 'EG',
                                last_name: lastName,
                                state: 'Cairo'
                            },
                            currency: 'EGP',
                            integration_id: integrationId
                        }),
                        signal: AbortSignal.timeout(7000)
                    });
                    const keyData: any = keyRes.ok ? await keyRes.json() : {};
                    if (keyData.token) {
                        const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${keyData.token}`;
                        savePaymobSubscriptionRecord({
                            orderId: String(orderData.id),
                            merchantOrderId,
                            brandId: req.brandId,
                            brandName: req.brandName,
                            planId: req.planId,
                            planName: plan.name,
                            amountEgp,
                            status: 'pending',
                            paymentUrl,
                            createdAt: new Date().toISOString()
                        });
                        return {
                            ok: true,
                            paymentUrl,
                            orderId: String(orderData.id),
                            planName: plan.name,
                            amountEgp,
                            mode: 'live_paymob'
                        };
                    }
                }
            }
        } catch (e: any) {
            console.warn('[Paymob] Classic API error:', e?.message);
        }
    }

    // 3. Pending Checkout Gateway (Never auto-activates without Paymob HMAC Webhook or Admin Secret)
    const gatewayUrl = `/api/payments/paymob/checkout-gateway?orderId=${encodeURIComponent(merchantOrderId)}&brandId=${encodeURIComponent(req.brandId)}&planId=${encodeURIComponent(req.planId)}&amountEgp=${amountEgp}`;
    savePaymobSubscriptionRecord({
        orderId: merchantOrderId,
        brandId: req.brandId,
        brandName: req.brandName,
        planId: req.planId,
        planName: plan.name,
        amountEgp,
        status: 'pending_verification',
        paymentUrl: gatewayUrl,
        createdAt: new Date().toISOString()
    });

    return {
        ok: true,
        paymentUrl: gatewayUrl,
        orderId: merchantOrderId,
        planName: plan.name,
        amountEgp,
        mode: 'pending_gateway_verification'
    };
}

/**
 * Strictly verifies Paymob Webhook HMAC-SHA512 signature.
 * Returns false if PAYMOB_HMAC_SECRET is missing or if signature does not match.
 */
export function verifyPaymobWebhookHmac(obj: any, receivedHmac?: string): boolean {
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET || '';
    if (!hmacSecret || !receivedHmac) {
        return false;
    }
    try {
        const concatenated = [
            obj.amount_cents,
            obj.created_at,
            obj.currency,
            obj.error_occured,
            obj.has_parent_transaction,
            obj.id,
            obj.integration_id,
            obj.is_3d_secure,
            obj.is_auth,
            obj.is_capture,
            obj.is_refunded,
            obj.is_standalone_payment,
            obj.is_voided,
            obj.order?.id,
            obj.owner,
            obj.pending,
            obj.source_data?.pan,
            obj.source_data?.sub_type,
            obj.source_data?.type,
            obj.success
        ]
            .map(v => (v === undefined || v === null ? '' : String(v)))
            .join('');

        const calculated = crypto.createHmac('sha512', hmacSecret).update(concatenated).digest('hex');
        const calcBuf = Buffer.from(calculated, 'utf8');
        const recBuf = Buffer.from(String(receivedHmac), 'utf8');
        if (calcBuf.length !== recBuf.length) return false;
        return crypto.timingSafeEqual(calcBuf, recBuf);
    } catch {
        return false;
    }
}

export function isPaymobOrderAlreadyProcessed(orderId: string): boolean {
    const target = String(orderId || '').trim();
    if (!target) return false;
    const list = readPaymobSubscriptions();
    return list.some(
        (r: any) =>
            String(r?.orderId || '').trim() === target &&
            String(r?.status || '').toLowerCase() === 'paid'
    );
}

export function isSubscriptionActiveNow(sub: any): boolean {
    if (!sub || String(sub?.status || '').toLowerCase() !== 'paid') return false;
    if (sub.expiresAt) {
        const expMs = new Date(sub.expiresAt).getTime();
        if (!Number.isNaN(expMs) && expMs <= Date.now()) {
            return false;
        }
    }
    return true;
}

export function markPaymobSubscriptionRefundedOrRevoked(
    orderId: string,
    brandId: string,
    reason: string
): boolean {
    try {
        const list = readPaymobSubscriptions();
        const targetOrder = String(orderId || '').trim();
        const targetBrand = String(brandId || '').trim().toLowerCase();
        let changed = false;
        const next = list.map((r: any) => {
            const matchOrder = targetOrder && String(r?.orderId || '').trim() === targetOrder;
            const matchBrandPaid =
                !targetOrder &&
                targetBrand &&
                String(r?.brandId || '').trim().toLowerCase() === targetBrand &&
                String(r?.status || '').toLowerCase() === 'paid';
            if (matchOrder || matchBrandPaid) {
                changed = true;
                return {
                    ...r,
                    status: 'refunded',
                    revokedAt: new Date().toISOString(),
                    revokeReason: reason || 'paymob_refund_or_void',
                };
            }
            return r;
        });
        if (changed) {
            savePersistentJson('paymob_subscriptions', 'paymob_subscriptions.json', next);
        }
        return changed;
    } catch {
        return false;
    }
}
