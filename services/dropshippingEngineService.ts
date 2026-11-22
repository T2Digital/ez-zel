import fs from "fs";
import { getPersistentFilePath, writeJsonAtomic } from "./persistentStorage";

export interface CodProfitabilityInput {
  sellingPriceEgp: number;
  supplierCostEgp: number;
  shippingCostEgp?: number;
  cpaAdCostEgp?: number;
  expectedReturnRatePct?: number;
}

export interface CodProfitabilityResult {
  sellingPriceEgp: number;
  supplierCostEgp: number;
  shippingCostEgp: number;
  cpaAdCostEgp: number;
  expectedReturnRatePct: number;
  deliveredRatio: number;
  returnShippingLossPerDelivered: number;
  cpaPerDelivered: number;
  realNetProfitPerDeliveredEgp: number;
  realNetMarginPct: number;
  verdict: "WINNING_PRODUCT" | "REJECT_LOW_MARGIN";
}

export interface DropshippingBundleTier {
  qty: number;
  label: string;
  badge?: string;
  sellingPriceEgp: number;
  freeShipping: boolean;
}

export interface DropshippingFunnel {
  slug: string;
  brandName: string;
  agentBrandId: string;
  productName: string;
  tagline: string;
  heroImageUrl?: string;
  supplierName: string;
  supplierWhatsapp: string;
  supplierCostPerUnitEgp: number;
  shippingCostEgp: number;
  cpaAdCostEgp: number;
  expectedReturnRatePct: number;
  highlights: string[];
  tiers: DropshippingBundleTier[];
  createdAt: string;
}

export type DropshippingOrderStatus =
  | "pending_whatsapp_confirm"
  | "confirmed"
  | "dispatched_to_supplier"
  | "delivered"
  | "returned";

export interface DropshippingOrder {
  id: string;
  refCode: string;
  funnelSlug: string;
  brandName: string;
  agentBrandId: string;
  productName: string;
  qty: number;
  bundleLabel: string;
  sellingPriceEgp: number;
  shippingFeeEgp: number;
  totalCodEgp: number;
  supplierCostTotalEgp: number;
  adSpendEgp: number;
  netProfitEgp: number;
  customerName: string;
  customerPhone: string;
  governorate: string;
  address: string;
  notes?: string;
  supplierWhatsapp: string;
  status: DropshippingOrderStatus;
  whatsappConfirmed: boolean;
  upsellAccepted?: boolean;
  bostaTrackingNumber?: string | null;
  dispatchMode?: "bosta_live" | "whatsapp_supplier_ready";
  dispatchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const FUNNELS_FILE = getPersistentFilePath("dropshipping_funnels.json");
const ORDERS_FILE = getPersistentFilePath("dropshipping_orders.json");

export function calculateCodProfitability(input: CodProfitabilityInput): CodProfitabilityResult {
  const sellingPriceEgp = Math.max(0, Number(input.sellingPriceEgp) || 0);
  const supplierCostEgp = Math.max(0, Number(input.supplierCostEgp) || 0);
  const shippingCostEgp = Math.max(0, Number(input.shippingCostEgp ?? 65));
  const cpaAdCostEgp = Math.max(0, Number(input.cpaAdCostEgp ?? 95));
  const expectedReturnRatePct = Math.min(85, Math.max(0, Number(input.expectedReturnRatePct ?? 20)));

  const deliveredRatio = Math.max(0.1, (100 - expectedReturnRatePct) / 100);
  const returnShippingLossPerDelivered = Number(
    (((expectedReturnRatePct / 100) / deliveredRatio) * shippingCostEgp).toFixed(2)
  );
  const cpaPerDelivered = Number((cpaAdCostEgp / deliveredRatio).toFixed(2));
  const realNetProfitPerDeliveredEgp = Math.round(
    sellingPriceEgp - supplierCostEgp - shippingCostEgp - returnShippingLossPerDelivered - cpaPerDelivered
  );
  const realNetMarginPct =
    sellingPriceEgp > 0 ? Math.round((realNetProfitPerDeliveredEgp / sellingPriceEgp) * 100) : 0;

  return {
    sellingPriceEgp,
    supplierCostEgp,
    shippingCostEgp,
    cpaAdCostEgp,
    expectedReturnRatePct,
    deliveredRatio: Number(deliveredRatio.toFixed(2)),
    returnShippingLossPerDelivered,
    cpaPerDelivered,
    realNetProfitPerDeliveredEgp,
    realNetMarginPct,
    verdict: realNetMarginPct >= 20 ? "WINNING_PRODUCT" : "REJECT_LOW_MARGIN",
  };
}

export function buildZeroPriceSupplierDispatchText(order: Pick<
  DropshippingOrder,
  "refCode" | "productName" | "qty" | "bundleLabel" | "customerName" | "customerPhone" | "governorate" | "address" | "bostaTrackingNumber"
>): string {
  const cleanTitle = String(order.productName || "").trim();
  const cleanBundle = String(order.bundleLabel || `${order.qty} قطعة`)
    .replace(/\d+[\d,٬]*\s*(?:ج\.?م\.?|جنيه|EGP)/gi, "")
    .trim();

  const lines = [
    `📦 أمر تشغيل وتوريد شحنة دروبشيبنج (${order.refCode})`,
    `• الصنف: ${cleanTitle}`,
    `• الكمية / الباقة: ${order.qty} قطعة${cleanBundle ? ` (${cleanBundle})` : ""}`,
    `• اسم المستلم: ${order.customerName}`,
    `• رقم الموبايل: ${order.customerPhone}`,
    `• المحافظة: ${order.governorate}`,
    `• العنوان بالتفصيل: ${order.address}`,
  ];
  if (order.bostaTrackingNumber) {
    lines.push(`• رقم بوليصة بوسطة (Bosta): ${order.bostaTrackingNumber}`);
  }
  lines.push(`⚠️ تعليمات التوريد: يُرسل الشحن مباشرة باسم البراند وبدون أي فواتير أسعار بيع نهائياً.`);
  return lines.join("\n");
}

export function formatEgyptWhatsappIntl(phone?: string): string {
  const digits = String(phone || "01013372674").replace(/\D/g, "");
  if (!digits) return "201013372674";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `2${digits}`;
  return digits;
}

const DEFAULT_SEED_FUNNELS: DropshippingFunnel[] = [
  {
    slug: "algenedy-neon-drop",
    brandName: "الجنيدي نيون ستور (High-Ticket)",
    agentBrandId: "al_genedy",
    productName: "توقيعات ولوحات نيون فليكس LED جاهزة بإضاءة سيليكون",
    tagline: "إنتاج فوري عند الطلب من ورشة الجنيدي — صفر مخزون + هامش ربح حتى 1,350 ج.م",
    heroImageUrl: "/al-genedy/images/hero_neon_acrylic.jpg",
    supplierName: "ورشة الجنيدي للإعلان والتصنيع",
    supplierWhatsapp: "01080444447",
    supplierCostPerUnitEgp: 520,
    shippingCostEgp: 75,
    cpaAdCostEgp: 130,
    expectedReturnRatePct: 12,
    highlights: [
      "خامة سيليكون أصلي + قاعدة أكليرك شفاف أو أسود 5مم",
      "ترانس 12 فولت معزول وضمان تشغيل 12 شهراً",
      "تجهيز خلال 24 ساعة وشحن مؤمّن لجميع المحافظات",
      "الدفع عند الاستلام بعد المعاينة",
    ],
    tiers: [
      { qty: 1, label: "قطعة واحدة مقاس 70 سم", sellingPriceEgp: 1250, freeShipping: false },
      { qty: 2, label: "عرض الباقتين (قطعتين + شحن مجاني)", badge: "الأكثر مبيعاً", sellingPriceEgp: 2150, freeShipping: true },
      { qty: 3, label: "باقة الكافيهات والبراندات (3 لوحات + شحن مجاني)", badge: "أعلى توفير", sellingPriceEgp: 2950, freeShipping: true },
    ],
    createdAt: "2026-11-22T00:00:00.000Z",
  },
  {
    slug: "captaincar-eg",
    brandName: "كابتن كار (CaptainCar EG)",
    agentBrandId: "tito_media",
    productName: "طقم النانو السيراميك والعناية الكاملة بالسيارة 5×1",
    tagline: "تريند مبيعات COD محلي سريع عبر تاجر/بوسطة — توصيل 24–72 ساعة",
    heroImageUrl: "/al-genedy/images/hero_led_screen.jpg",
    supplierName: "مستودع جملة الجيزة + شحن بوسطة",
    supplierWhatsapp: "01013372674",
    supplierCostPerUnitEgp: 240,
    shippingCostEgp: 65,
    cpaAdCostEgp: 85,
    expectedReturnRatePct: 18,
    highlights: [
      "حماية ضد الخدوش والأتربة ولمعة مرآة تدوم 6 شهور",
      "فوط مايكروفايبر عالية الكثافة + سبراي زجاج مجاني",
      "توصيل سريع بوسطة 1–3 أيام في القاهرة والمحافظات",
      "الدفع عند الاستلام + ضمان استبدال فوري",
    ],
    tiers: [
      { qty: 1, label: "طقم واحد (يكفي سيارة كاملة)", sellingPriceEgp: 590, freeShipping: false },
      { qty: 2, label: "عرض السيارتين (قطعتين + شحن مجاني)", badge: "الأكثر مبيعاً", sellingPriceEgp: 990, freeShipping: true },
      { qty: 3, label: "باقة التوفير العائلية (3 أطقم + شحن مجاني)", badge: "خصم VIP", sellingPriceEgp: 1390, freeShipping: true },
    ],
    createdAt: "2026-11-22T00:00:00.000Z",
  },
];

export function loadDropshippingFunnels(): DropshippingFunnel[] {
  try {
    if (fs.existsSync(FUNNELS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FUNNELS_FILE, "utf8"));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  writeJsonAtomic(FUNNELS_FILE, DEFAULT_SEED_FUNNELS);
  return DEFAULT_SEED_FUNNELS;
}

export function upsertDropshippingFunnel(funnel: DropshippingFunnel): DropshippingFunnel {
  const funnels = loadDropshippingFunnels();
  const idx = funnels.findIndex((f) => f.slug === funnel.slug);
  if (idx >= 0) {
    funnels[idx] = { ...funnels[idx], ...funnel };
  } else {
    funnels.unshift(funnel);
  }
  writeJsonAtomic(FUNNELS_FILE, funnels);
  return funnel;
}

export function loadDropshippingOrders(): DropshippingOrder[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveDropshippingOrders(orders: DropshippingOrder[]): void {
  writeJsonAtomic(ORDERS_FILE, orders.slice(0, 1000));
}

export async function dispatchOrderToBosta(order: DropshippingOrder): Promise<{
  ok: boolean;
  mode: "bosta_live" | "whatsapp_supplier_ready";
  trackingNumber: string | null;
  supplierWhatsappUrl: string;
  detail?: string;
}> {
  const dispatchText = buildZeroPriceSupplierDispatchText(order);
  const intlSupplier = formatEgyptWhatsappIntl(order.supplierWhatsapp);
  const supplierWhatsappUrl = `https://wa.me/${intlSupplier}?text=${encodeURIComponent(dispatchText)}`;
  const bostaKey = (process.env.BOSTA_API_KEY || "").trim();

  if (!bostaKey) {
    return {
      ok: true,
      mode: "whatsapp_supplier_ready",
      trackingNumber: null,
      supplierWhatsappUrl,
      detail: "Bosta API key not configured — zero-price WhatsApp supplier dispatch ready.",
    };
  }

  try {
    const resp = await fetch("https://app.bosta.co/api/v2/deliveries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: bostaKey,
      },
      body: JSON.stringify({
        type: 10,
        cod: order.totalCodEgp,
        specs: {
          packageDetails: {
            itemsCount: order.qty,
            description: `${order.productName} (${order.refCode})`,
          },
        },
        dropOffAddress: {
          firstLine: order.address,
          city: order.governorate || "Cairo",
        },
        receiver: {
          firstName: order.customerName,
          phone: order.customerPhone,
        },
        businessReference: order.refCode,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data: any = await resp.json().catch(() => ({}));
    if (resp.ok && (data?.trackingNumber || data?._id)) {
      return {
        ok: true,
        mode: "bosta_live",
        trackingNumber: String(data.trackingNumber || data._id),
        supplierWhatsappUrl,
      };
    }
    return {
      ok: true,
      mode: "whatsapp_supplier_ready",
      trackingNumber: null,
      supplierWhatsappUrl,
      detail: data?.message || `Bosta returned HTTP ${resp.status}`,
    };
  } catch (err: any) {
    return {
      ok: true,
      mode: "whatsapp_supplier_ready",
      trackingNumber: null,
      supplierWhatsappUrl,
      detail: err?.message || "Bosta network fallback",
    };
  }
}

export function computeCodSettlementSummary() {
  const orders = loadDropshippingOrders();
  const funnels = loadDropshippingFunnels();

  let pendingConfirm = 0;
  let confirmed = 0;
  let dispatched = 0;
  let delivered = 0;
  let returned = 0;

  let grossCodRevenueEgp = 0;
  let supplierPayableEgp = 0;
  let shippingCostEgp = 0;
  let adSpendEgp = 0;

  for (const o of orders) {
    if (o.status === "pending_whatsapp_confirm") pendingConfirm++;
    else if (o.status === "confirmed") confirmed++;
    else if (o.status === "dispatched_to_supplier") dispatched++;
    else if (o.status === "delivered") delivered++;
    else if (o.status === "returned") returned++;

    adSpendEgp += Number(o.adSpendEgp || 0);
    if (o.status === "delivered") {
      grossCodRevenueEgp += Number(o.totalCodEgp || 0);
      supplierPayableEgp += Number(o.supplierCostTotalEgp || 0);
      shippingCostEgp += Number(o.shippingFeeEgp || 65);
    } else if (o.status === "returned") {
      shippingCostEgp += Number(o.shippingFeeEgp || 65);
    }
  }

  const finishedCount = delivered + returned;
  const returnRatePct = finishedCount > 0 ? Math.round((returned / finishedCount) * 100) : 0;
  const netRealizedProfitEgp = Math.round(
    grossCodRevenueEgp - supplierPayableEgp - shippingCostEgp - adSpendEgp
  );

  return {
    totalOrders: orders.length,
    activeFunnelsCount: funnels.length,
    pendingConfirm,
    confirmed,
    dispatched,
    delivered,
    returned,
    returnRatePct,
    grossCodRevenueEgp,
    supplierPayableEgp,
    shippingCostEgp,
    adSpendEgp,
    netRealizedProfitEgp,
    bostaConfigured: Boolean((process.env.BOSTA_API_KEY || "").trim()),
  };
}
