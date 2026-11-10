import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface PaymobCheckoutRequest {
    brandId: string;
    brandName: string;
    planId: 'starter_monthly' | 'growth_pro' | 'agency_unlimited';
    amountEgp: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
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

export const PAYMOB_PLANS: Record<string, { id: string; name: string; amountEgp: number; adBudgetEgp: number; features: string[] }> = {
    tier_2500: {
        id: 'tier_2500',
        name: 'باقة الانطلاق الفضي (2,500 ج.م)',
        amountEgp: 2500,
        adBudgetEgp: 1250,
        features: [
            '1,250 ج.م ميزانية إعلانات ممولة مباشرة لنشاطك (نصف قيمة الباقة)',
            'نسخة تطبيق ويب وموبايل PWA مخصصة لنشاطك مع كتالوج الحجوزات',
            'وكيل واتساب وميتا الذكي للرد الفوري 24/7 بصوت بشري نقي',
            'إدارة وجدولة محتوى تيتو ستوديو الشهري'
        ]
    },
    tier_5000: {
        id: 'tier_5000',
        name: 'باقة النمو الذهبي (5,000 ج.م)',
        amountEgp: 5000,
        adBudgetEgp: 2500,
        features: [
            '2,500 ج.م ميزانية إعلانات ممولة مباشرة (Meta & TikTok)',
            'نسخة تطبيق وموقع PWA مخصص حسب مجال نشاطك',
            'إنتاج فيديوهات ريلز وسيناريوهات فلو عبر Turbo Flow',
            'وكيل مبيعات واتساب تفاوضي وإغلاق الحجوزات آلياً',
            'تقارير يومية صباحية ومسائية عن الأداء والمبيعات'
        ]
    },
    tier_10000: {
        id: 'tier_10000',
        name: 'باقة التوسع البلاتيني (10,000 ج.م)',
        amountEgp: 10000,
        adBudgetEgp: 5000,
        features: [
            '5,000 ج.م ميزانية إعلانات ممولة مستهدفة لحصد المبيعات',
            'تطبيق PWA متقدم مع لوحة تحكم وإدارة مخزون وحجوزات',
            'أتمتة تسويقية كاملة عبر تيتو ستوديو + نشر ميتا وجوجل فلو',
            'وكيل مبيعات صوتي متعدد القنوات (واتساب + تليجرام + إنستا)',
            'بوابة دفع إلكتروني Paymob لتأكيد الحجوزات بالعربون فوراً'
        ]
    },
    tier_25000: {
        id: 'tier_25000',
        name: 'باقة الهيمنة السوقية VIP (25,000 ج.م)',
        amountEgp: 25000,
        adBudgetEgp: 12500,
        features: [
            '12,500 ج.م ميزانية إعلانات ممولة قوية للسيطرة على السوق',
            'تطبيق ومنظومة متكاملة متعددة الفروع ونقاط البيع',
            'إنتاج مكثف للفيديوهات والتصاميم وإدارة الحملات اليومية',
            'تخصيص كامل لعقل الذكاء الاصطناعي ونبرة الصوت والردود',
            'دعم تنفيذي مباشر 24/7 مع مدير حساب ذكي'
        ]
    },
    tier_50000: {
        id: 'tier_50000',
        name: 'باقة الشركات الكبرى والمؤسسات (50,000 ج.م)',
        amountEgp: 50000,
        adBudgetEgp: 25000,
        features: [
            '25,000 ج.م ميزانية حملات إعلانية ضخمة عبر كافة المنصات',
            'بناء وتخصيص أنظمة وتطبيقات متكاملة (Enterprise PWA Suite)',
            'أتمتة تسويقية وسيادية غير محدودة في تيتو ستوديو وتيتو أجنت',
            'تحليل تنبؤي ومراقبة سلوك الزوار وتحسين معدلات التحويل',
            'سيرفرات مخصصة وأولوية قصوى لكافة عمليات الأتمتة'
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
        const dir = path.dirname(SUBSCRIPTIONS_LOG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SUBSCRIPTIONS_LOG_PATH, JSON.stringify(list, null, 2), 'utf8');
    } catch {}
}

/**
 * Creates a Paymob payment session (supports both Paymob v1 Intention API and Classic Auth->Order->PaymentKey API).
 * Never auto-activates for free: if Paymob keys are not yet configured in .env, opens a Pending Verification Checkout Gateway
 * that requires either a signed Paymob Webhook or Sovereign Admin confirmation.
 */
export async function createPaymobCheckoutSession(req: PaymobCheckoutRequest): Promise<PaymobCheckoutResponse> {
    const plan = PAYMOB_PLANS[req.planId] || PAYMOB_PLANS.growth_pro;
    const amountEgp = req.amountEgp || plan.amountEgp;
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
                            name: `${plan.name} - ${req.brandName}`,
                            amount: amountCents,
                            description: `اشتراك منظومة تيتو للبراند ${req.brandName}`,
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
