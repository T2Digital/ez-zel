import fs from "fs";
import { getPersistentFilePath, writeJsonAtomic } from "./persistentStorage";
import { loadTenantErpState, normalizeSlugKey, saveTenantErpState } from "./tenantErpStoreService";

export type SupplierProvider =
  | "cj"
  | "knawat"
  | "makhazen"
  | "taager"
  | "local_wholesale"
  | "workshop";

export type CarrierProvider = "bosta" | "oto" | "aramex" | "cj_auto" | "manual_whatsapp";

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

export interface DropshippingStoreProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  subCategory?: string;
  mainCategory?: string;
  brand?: string;
  description: string;
  imageUrl: string;
  images?: string[];
  sellingPriceEgp: number;
  originalPriceEgp?: number;
  discount?: number;
  isNew?: boolean;
  rating?: number;
  supplierCostEgp: number;
  fulfillmentType: "dropshipping" | "own_stock";
  supplierProvider: SupplierProvider;
  supplierId: string;
  supplierName: string;
  supplierWhatsapp: string;
  supplierSku?: string;
  warehouseRegion: string;
  estimatedDeliveryDays: string;
  variants?: { name: string; options: string[] }[];
  expressCodTiers?: DropshippingBundleTier[];
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
  storeTheme?: {
    primaryColor: string;
    accentColor: string;
    slogan: string;
    phone?: string;
    whatsapp?: string;
  };
  shippingZones?: Array<{ name: string; fee: number }>;
  products?: DropshippingStoreProduct[];
  createdAt: string;
}

export type DropshippingOrderStatus =
  | "pending_whatsapp_confirm"
  | "confirmed"
  | "dispatched_to_supplier"
  | "delivered"
  | "returned";

export interface SplitSubOrderItem {
  productId: number | string;
  sku: string;
  productName: string;
  qty: number;
  unitPriceEgp: number;
  supplierCostEgp: number;
}

export interface SplitSubOrder {
  subOrderId: string;
  supplierProvider: SupplierProvider;
  supplierId: string;
  supplierName: string;
  supplierWhatsapp: string;
  warehouseRegion: string;
  items: SplitSubOrderItem[];
  supplierCostTotalEgp: number;
  codCollectionEgp: number;
  carrierProvider: CarrierProvider;
  trackingNumber: string | null;
  trackingUrl?: string | null;
  dispatchMode?: string;
  status: DropshippingOrderStatus;
  dispatchedAt?: string;
}

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
  dispatchMode?: "bosta_live" | "oto_live" | "aramex_live" | "cj_live" | "whatsapp_supplier_ready";
  carrierProvider?: CarrierProvider;
  trackingUrl?: string | null;
  subOrders?: SplitSubOrder[];
  dispatchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DropshippingProvidersConfig {
  usdToEgp: number;
  sarToEgp: number;
  defaultMarkupMultiplier: number;
  defaultShippingEgp: number;
  defaultCpaEgp: number;
  cjAccessToken?: string;
  knawatApiKey?: string;
  makhazenApiKey?: string;
  taagerApiKey?: string;
  bostaApiKey?: string;
  otoApiKey?: string;
  aramexAccountNumber?: string;
  updatedAt: string;
}

const FUNNELS_FILE = getPersistentFilePath("dropshipping_funnels.json");
const ORDERS_FILE = getPersistentFilePath("dropshipping_orders.json");
const PROVIDERS_FILE = getPersistentFilePath("dropshipping_providers.json");

const SUPPLIER_PROVIDER_LABELS: Record<SupplierProvider, string> = {
  cj: "CJ Dropshipping Global",
  knawat: "Knawat GCC / MENA",
  makhazen: "مخازن (Makhazen GCC)",
  taager: "تاجر (Taager Egypt)",
  local_wholesale: "مورد جملة محلي",
  workshop: "ورشة تصنيع عند الطلب",
};

export function getSupplierProviderLabel(provider?: SupplierProvider): string {
  return (provider && SUPPLIER_PROVIDER_LABELS[provider]) || "مورد دروبشيبنج معتمد";
}

export function getDefaultCarrierForProvider(provider?: SupplierProvider): CarrierProvider {
  if (provider === "cj") return "cj_auto";
  if (provider === "knawat" || provider === "makhazen") return "oto";
  return "bosta";
}

export function buildCarrierTrackingUrl(carrier: CarrierProvider | string, trackingNumber?: string | null): string {
  const tracking = String(trackingNumber || "").trim();
  if (!tracking) return "";
  switch (String(carrier || "").toLowerCase()) {
    case "bosta":
      return `https://bosta.co/tracking-shipment/?shipment-num=${encodeURIComponent(tracking)}`;
    case "oto":
      return `https://track.tryoto.com/${encodeURIComponent(tracking)}`;
    case "aramex":
      return `https://www.aramex.com/track/results?ShipmentNumber=${encodeURIComponent(tracking)}`;
    case "cj_auto":
    case "cj":
      return `https://cjpacket.com/?trackingNumber=${encodeURIComponent(tracking)}`;
    default:
      return "";
  }
}

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

export function buildZeroPriceSubOrderDispatchText(
  order: Pick<DropshippingOrder, "refCode" | "customerName" | "customerPhone" | "governorate" | "address">,
  subOrder: Pick<SplitSubOrder, "subOrderId" | "supplierName" | "carrierProvider" | "trackingNumber" | "items">
): string {
  const itemLines = (subOrder.items || []).map(
    (it, idx) => `  ${idx + 1}. ${it.productName} [${it.sku}] — الكمية: ${it.qty}`
  );
  const lines = [
    `📦 أمر توريد مجمّع بدون أسعار (${order.refCode} / ${subOrder.subOrderId})`,
    `• المورد المستهدف: ${subOrder.supplierName}`,
    `• شركة الشحن المعتمدة: ${subOrder.carrierProvider.toUpperCase()}`,
    `• الأصناف المطلوب تجهيزها:`,
    ...itemLines,
    `• المستلم: ${order.customerName}`,
    `• الهاتف: ${order.customerPhone}`,
    `• المحافظة: ${order.governorate}`,
    `• العنوان: ${order.address}`,
  ];
  if (subOrder.trackingNumber) {
    lines.push(`• رقم البوليصة والتتبع: ${subOrder.trackingNumber}`);
  }
  lines.push(`⚠️ تعليمات سرية التجارة: ممنوع وضع أي فاتورة سعر بيع أو قيمة تحصيل داخل الطرد نهائياً.`);
  return lines.join("\n");
}

export function formatEgyptWhatsappIntl(phone?: string): string {
  const digits = String(phone || "01013372674").replace(/\D/g, "");
  if (!digits) return "201013372674";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `2${digits}`;
  return digits;
}

function defaultTiersForPrice(unitPrice: number): DropshippingBundleTier[] {
  const p = Math.max(150, Math.round(unitPrice));
  return [
    { qty: 1, label: "قطعة واحدة", sellingPriceEgp: p, freeShipping: false },
    {
      qty: 2,
      label: "عرض القطعتين + شحن مجاني",
      badge: "الأكثر مبيعاً",
      sellingPriceEgp: Math.round(p * 1.78),
      freeShipping: true,
    },
    {
      qty: 3,
      label: "باقة التوفير (3 قطع + شحن مجاني)",
      badge: "أعلى توفير",
      sellingPriceEgp: Math.round(p * 2.45),
      freeShipping: true,
    },
  ];
}

const DEFAULT_SHIPPING_ZONES = [
  { name: "القاهرة والجيزة", fee: 55 },
  { name: "الإسكندرية والدلتا", fee: 65 },
  { name: "الصعيد ومدن القناة", fee: 85 },
];

const DEFAULT_SEED_FUNNELS: DropshippingFunnel[] = [
  {
    slug: "captaincar-eg",
    brandName: "كابتن كار ستور (CaptainCar EG)",
    agentBrandId: "tito_media",
    productName: "طقم النانو السيراميك والعناية الكاملة بالسيارة 5×1",
    tagline: "أقوى إكسسوارات العناية بالسيارات وتجهيزات القيادة الحديثة — توصيل سريع والدفع عند الاستلام",
    heroImageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop",
    supplierName: "مخازن تاجر — العناية بالسيارات",
    supplierWhatsapp: "01013372674",
    supplierCostPerUnitEgp: 240,
    shippingCostEgp: 60,
    cpaAdCostEgp: 85,
    expectedReturnRatePct: 16,
    storeTheme: {
      primaryColor: "#0284c7",
      accentColor: "#0f172a",
      slogan: "إكسسوارات سيارتك الذكية — شحن محلي وعالمي والدفع عند الاستلام",
      phone: "01013372674",
      whatsapp: "01013372674",
    },
    shippingZones: DEFAULT_SHIPPING_ZONES,
    highlights: [
      "حماية نانو سيراميك ضد الخدوش والأتربة تدوم حتى 6 شهور",
      "فوط مايكروفايبر عالية الكثافة + سبراي زجاج هدية",
      "توصيل سريع بوسطة وأرامكس من 24 إلى 72 ساعة",
      "دفع عند الاستلام + معاينة كاملة قبل الدفع",
    ],
    tiers: defaultTiersForPrice(590),
    products: [
      {
        id: 1001,
        sku: "CC-NANO-5X1",
        name: "طقم النانو السيراميك والعناية الكاملة بالسيارة 5×1",
        category: "العناية بالسيارات",
        mainCategory: "العناية بالسيارات",
        subCategory: "تلميع وحماية",
        brand: "CaptainCar Pro",
        description: "مجموعة احترافية متكاملة لحماية طلاء السيارة ومنحها لمعة مرآة وعزل ضد الماء والأتربة لمدة 6 أشهر.",
        imageUrl: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=900&auto=format&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=900&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=900&auto=format&fit=crop",
        ],
        sellingPriceEgp: 590,
        originalPriceEgp: 790,
        discount: 25,
        isNew: true,
        rating: 4.9,
        supplierCostEgp: 240,
        fulfillmentType: "dropshipping",
        supplierProvider: "taager",
        supplierId: "taager-auto-cairo",
        supplierName: "تاجر (Taager) — مستودع القاهرة",
        supplierWhatsapp: "01013372674",
        supplierSku: "TG-88412",
        warehouseRegion: "القاهرة — مصر",
        estimatedDeliveryDays: "1-2 يوم عمل",
        variants: [{ name: "الحجم", options: ["باقة سيارة كاملة", "عبوة مضاعفة SUV"] }],
        expressCodTiers: defaultTiersForPrice(590),
      },
      {
        id: 1002,
        sku: "CC-VAC-MINI",
        name: "مكنسة السيارة اللاسلكية تربو 2×1 (شفط + نفخ الهواء)",
        category: "إلكترونيات السيارة",
        mainCategory: "إلكترونيات السيارة",
        subCategory: "نظافة داخلية",
        brand: "CJ AutoTech",
        description: "مكنسة سيارة محمولة بقوة شفط 12000Pa شحن Type-C مع 4 فوهات لتنظيف أضيق الأماكن ولوحة القيادة.",
        imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=900&auto=format&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=900&auto=format&fit=crop",
        ],
        sellingPriceEgp: 890,
        originalPriceEgp: 1150,
        discount: 23,
        isNew: true,
        rating: 4.8,
        supplierCostEgp: 365,
        fulfillmentType: "dropshipping",
        supplierProvider: "cj",
        supplierId: "cj-cn-sz",
        supplierName: "CJ Dropshipping Global Warehouse",
        supplierWhatsapp: "01013372674",
        supplierSku: "CJJT1849201",
        warehouseRegion: "شحن دولي مباشر (CN/AE)",
        estimatedDeliveryDays: "4-7 أيام عمل",
        variants: [{ name: "اللون", options: ["أسود ميتاليك", "رمادي تيتانيوم"] }],
        expressCodTiers: defaultTiersForPrice(890),
      },
      {
        id: 1003,
        sku: "CC-DASH-4K",
        name: "داش كام مراقبة مزدوجة HD بتصوير ليلي وتنبيه حركة",
        category: "إلكترونيات السيارة",
        mainCategory: "إلكترونيات السيارة",
        subCategory: "كاميرات وأمان",
        brand: "Makhazen Auto",
        description: "كاميرا سيارة أمامية وخلفية بزاوية 170 درجة وتسجيل مستمر Loop Recording وحماية كاملة أثناء الركن.",
        imageUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=900&auto=format&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=900&auto=format&fit=crop",
        ],
        sellingPriceEgp: 1450,
        originalPriceEgp: 1850,
        discount: 22,
        isNew: false,
        rating: 4.9,
        supplierCostEgp: 690,
        fulfillmentType: "dropshipping",
        supplierProvider: "knawat",
        supplierId: "knawat-dxb-01",
        supplierName: "Knawat GCC Express",
        supplierWhatsapp: "01013372674",
        supplierSku: "KN-DC4K-99",
        warehouseRegion: "دبي — مستودع الشرق الأوسط",
        estimatedDeliveryDays: "3-5 أيام عمل",
        variants: [{ name: "الذاكرة", options: ["بدون كارت", "مع كارت 64GB أصلية"] }],
        expressCodTiers: defaultTiersForPrice(1450),
      },
      {
        id: 1004,
        sku: "CC-PUMP-DIGITAL",
        name: "كومبريسور نفخ الإطارات الديجيتال اللاسلكي مع باوربانك",
        category: "طوارئ الطرق",
        mainCategory: "طوارئ الطرق",
        subCategory: "منفاخ وطوارئ",
        brand: "Al-Gamal Wholesale",
        description: "منفاخ هواء ذكي يضبط الضغط تلقائياً ويفصل عند الامتلاء، مزود بكشاف طوارئ SOS ومخرج USB لشحن الموبايل.",
        imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=900&auto=format&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=900&auto=format&fit=crop",
        ],
        sellingPriceEgp: 1120,
        originalPriceEgp: 1380,
        discount: 19,
        isNew: true,
        rating: 4.7,
        supplierCostEgp: 510,
        fulfillmentType: "dropshipping",
        supplierProvider: "local_wholesale",
        supplierId: "giza-tawfikia-01",
        supplierName: "توريدات التوفيقية والجيزة المباشرة",
        supplierWhatsapp: "01013372674",
        supplierSku: "LOC-PUMP-77",
        warehouseRegion: "الجيزة — مصر",
        estimatedDeliveryDays: "24-48 ساعة",
        expressCodTiers: defaultTiersForPrice(1120),
      },
    ],
    createdAt: "2026-11-22T00:00:00.000Z",
  },
  {
    slug: "smart-home-eg",
    brandName: "سمارت هوم ستور (SmartHome EG)",
    agentBrandId: "tito_media",
    productName: "أجهزة المنزل الذكي ومنتجات اللايف ستايل الحديثة",
    tagline: "حول منزلك ومكتبك لبيئة ذكية متطورة — استيراد CJ ومخازن الخليج وموردين محليين في شحنة واحدة",
    heroImageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1400&auto=format&fit=crop",
    supplierName: "مركز توريدات المنازل الذكية",
    supplierWhatsapp: "01013372674",
    supplierCostPerUnitEgp: 310,
    shippingCostEgp: 65,
    cpaAdCostEgp: 90,
    expectedReturnRatePct: 15,
    storeTheme: {
      primaryColor: "#0f766e",
      accentColor: "#0f172a",
      slogan: "منازل ومكاتب ذكية بتكلفة اقتصادية وضمان استبدال فوري",
      phone: "01013372674",
      whatsapp: "01013372674",
    },
    shippingZones: DEFAULT_SHIPPING_ZONES,
    highlights: [
      "شحن مقسم تلقائياً لأسرع وقت توصيل حسب موقع المستودع",
      "إشعارات تتبع تلقائية عبر Bosta و OTO و CJ Express",
      "ضمان استبدال فوري خلال 14 يوم على جميع الأجهزة",
      "الدفع عند الاستلام متاح لجميع المحافظات",
    ],
    tiers: defaultTiersForPrice(780),
    products: [
      {
        id: 2001,
        sku: "SH-LOCK-WIFI",
        name: "كالون باب ذكي بالبصمة وكلمة المرور وتطبيق الواي فاي",
        category: "أمان ذكي",
        mainCategory: "أمان ذكي",
        subCategory: "أقفال إلكترونية",
        brand: "Makhazen Smart",
        description: "تحكم كامل بفتح الباب بالبصمة أو الكارت أو عن بُعد من الموبايل مع سجل دخول لحظي.",
        imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=900&auto=format&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=900&auto=format&fit=crop",
        ],
        sellingPriceEgp: 2450,
        originalPriceEgp: 2990,
        discount: 18,
        isNew: true,
        rating: 4.9,
        supplierCostEgp: 1180,
        fulfillmentType: "dropshipping",
        supplierProvider: "makhazen",
        supplierId: "makhazen-riyadh-01",
        supplierName: "مخازن الخليج (Makhazen MENA)",
        supplierWhatsapp: "01013372674",
        supplierSku: "MK-SL-302",
        warehouseRegion: "الرياض / دبي",
        estimatedDeliveryDays: "3-5 أيام عمل",
        expressCodTiers: defaultTiersForPrice(2450),
      },
      {
        id: 2002,
        sku: "SH-STRIP-RGB",
        name: "شريط إضاءة RGB ذكي يتفاعل مع الموسيقى والتحكم الصوتي",
        category: "إضاءة وديكور",
        mainCategory: "إضاءة وديكور",
        subCategory: "إضاءة ذكية",
        brand: "CJ SmartLife",
        description: "إضاءة محيطية 5 متر بالتحكم عبر التطبيق والريموت و16 مليون لون مناسبة للغرف والمكاتب.",
        imageUrl: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=900&auto=format&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=900&auto=format&fit=crop",
        ],
        sellingPriceEgp: 540,
        originalPriceEgp: 720,
        discount: 25,
        isNew: true,
        rating: 4.8,
        supplierCostEgp: 195,
        fulfillmentType: "dropshipping",
        supplierProvider: "cj",
        supplierId: "cj-cn-sz",
        supplierName: "CJ Dropshipping Global Warehouse",
        supplierWhatsapp: "01013372674",
        supplierSku: "CJLED-5050-RGB",
        warehouseRegion: "شحن دولي مباشر (CN)",
        estimatedDeliveryDays: "5-8 أيام عمل",
        expressCodTiers: defaultTiersForPrice(540),
      },
      {
        id: 2003,
        sku: "SH-DESK-LASER",
        name: "منظم مكتب خشب وأكليرك محفور حسب الاسم — تنفيذ ورشة خاصة",
        category: "مكاتب وإنتاجية",
        mainCategory: "مكاتب وإنتاجية",
        subCategory: "منظمات مخصصة",
        brand: "Craft On-Demand",
        description: "منظم مكتبي متعدد الأرفف لحمل اللاب توب والموبايل والأقلام — يُصنع بالطلب خلال 24 ساعة في ورش التجهيز المعتمدة.",
        imageUrl: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=900&auto=format&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=900&auto=format&fit=crop",
        ],
        sellingPriceEgp: 680,
        originalPriceEgp: 850,
        discount: 20,
        isNew: false,
        rating: 4.9,
        supplierCostEgp: 260,
        fulfillmentType: "dropshipping",
        supplierProvider: "workshop",
        supplierId: "workshop-woodcraft-01",
        supplierName: "ورشة التصميم المكتبي والخشبيات (عند الطلب)",
        supplierWhatsapp: "01013372674",
        supplierSku: "WS-DESK-09",
        warehouseRegion: "القاهرة — تصنيع عند الطلب",
        estimatedDeliveryDays: "2-3 أيام عمل",
        expressCodTiers: defaultTiersForPrice(680),
      },
      {
        id: 2004,
        sku: "SH-PLUG-ENERGY",
        name: "مقبس واي فاي ذكي لقياس استهلاك الكهرباء وجدولة التشغيل",
        category: "أتمتة المنزل",
        mainCategory: "أتمتة المنزل",
        subCategory: "مقابس ومفاتيح",
        brand: "Taager Home",
        description: "تحكم بالتكييف والسخان عن بُعد بضغطة واحدة وحافظ على فاتورة الكهرباء بضبط مؤقت ذكي.",
        imageUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=900&auto=format&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=900&auto=format&fit=crop",
        ],
        sellingPriceEgp: 460,
        originalPriceEgp: 580,
        discount: 21,
        isNew: true,
        rating: 4.7,
        supplierCostEgp: 205,
        fulfillmentType: "dropshipping",
        supplierProvider: "taager",
        supplierId: "taager-smart-01",
        supplierName: "تاجر (Taager) — أدوات منزلية",
        supplierWhatsapp: "01013372674",
        supplierSku: "TG-PLUG-16A",
        warehouseRegion: "القاهرة — مصر",
        estimatedDeliveryDays: "1-2 يوم عمل",
        expressCodTiers: defaultTiersForPrice(460),
      },
    ],
    createdAt: "2026-11-22T00:00:00.000Z",
  },
];

export function loadDropshippingProvidersConfig(): DropshippingProvidersConfig {
  const defaults: DropshippingProvidersConfig = {
    usdToEgp: 49.5,
    sarToEgp: 13.2,
    defaultMarkupMultiplier: 2.25,
    defaultShippingEgp: 65,
    defaultCpaEgp: 90,
    cjAccessToken: (process.env.CJ_ACCESS_TOKEN || process.env.CJ_API_KEY || "").trim() || undefined,
    knawatApiKey: (process.env.KNAWAT_API_KEY || "").trim() || undefined,
    makhazenApiKey: (process.env.MAKHAZEN_API_KEY || "").trim() || undefined,
    taagerApiKey: (process.env.TAAGER_API_KEY || "").trim() || undefined,
    bostaApiKey: (process.env.BOSTA_API_KEY || "").trim() || undefined,
    otoApiKey: (process.env.OTO_API_KEY || process.env.OTO_ACCESS_TOKEN || "").trim() || undefined,
    aramexAccountNumber: (process.env.ARAMEX_ACCOUNT_NUMBER || "").trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  try {
    if (fs.existsSync(PROVIDERS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(PROVIDERS_FILE, "utf8"));
      return { ...defaults, ...(saved || {}) };
    }
  } catch {}
  return defaults;
}

export function getMaskedProvidersConfig() {
  const cfg = loadDropshippingProvidersConfig();
  const mask = (v?: string) => (v ? `${v.slice(0, 4)}••••${v.slice(-3)}` : "");
  return {
    usdToEgp: cfg.usdToEgp,
    sarToEgp: cfg.sarToEgp,
    defaultMarkupMultiplier: cfg.defaultMarkupMultiplier,
    defaultShippingEgp: cfg.defaultShippingEgp,
    defaultCpaEgp: cfg.defaultCpaEgp,
    configured: {
      cj: Boolean(cfg.cjAccessToken),
      knawat: Boolean(cfg.knawatApiKey),
      makhazen: Boolean(cfg.makhazenApiKey),
      taager: Boolean(cfg.taagerApiKey),
      bosta: Boolean(cfg.bostaApiKey),
      oto: Boolean(cfg.otoApiKey),
      aramex: Boolean(cfg.aramexAccountNumber),
    },
    maskedKeys: {
      cjAccessToken: mask(cfg.cjAccessToken),
      knawatApiKey: mask(cfg.knawatApiKey),
      makhazenApiKey: mask(cfg.makhazenApiKey),
      taagerApiKey: mask(cfg.taagerApiKey),
      bostaApiKey: mask(cfg.bostaApiKey),
      otoApiKey: mask(cfg.otoApiKey),
      aramexAccountNumber: mask(cfg.aramexAccountNumber),
    },
    updatedAt: cfg.updatedAt,
  };
}

export function saveDropshippingProvidersConfig(patch: Partial<DropshippingProvidersConfig>) {
  const cur = loadDropshippingProvidersConfig();
  const next: DropshippingProvidersConfig = {
    ...cur,
    ...(patch.usdToEgp !== undefined ? { usdToEgp: Math.max(1, Number(patch.usdToEgp) || 49.5) } : {}),
    ...(patch.sarToEgp !== undefined ? { sarToEgp: Math.max(1, Number(patch.sarToEgp) || 13.2) } : {}),
    ...(patch.defaultMarkupMultiplier !== undefined
      ? { defaultMarkupMultiplier: Math.max(1.2, Number(patch.defaultMarkupMultiplier) || 2.2) }
      : {}),
    ...(patch.defaultShippingEgp !== undefined
      ? { defaultShippingEgp: Math.max(0, Number(patch.defaultShippingEgp) || 65) }
      : {}),
    ...(patch.defaultCpaEgp !== undefined ? { defaultCpaEgp: Math.max(0, Number(patch.defaultCpaEgp) || 90) } : {}),
    ...(patch.cjAccessToken ? { cjAccessToken: String(patch.cjAccessToken).trim() } : {}),
    ...(patch.knawatApiKey ? { knawatApiKey: String(patch.knawatApiKey).trim() } : {}),
    ...(patch.makhazenApiKey ? { makhazenApiKey: String(patch.makhazenApiKey).trim() } : {}),
    ...(patch.taagerApiKey ? { taagerApiKey: String(patch.taagerApiKey).trim() } : {}),
    ...(patch.bostaApiKey ? { bostaApiKey: String(patch.bostaApiKey).trim() } : {}),
    ...(patch.otoApiKey ? { otoApiKey: String(patch.otoApiKey).trim() } : {}),
    ...(patch.aramexAccountNumber ? { aramexAccountNumber: String(patch.aramexAccountNumber).trim() } : {}),
    updatedAt: new Date().toISOString(),
  };
  writeJsonAtomic(PROVIDERS_FILE, next);
  return getMaskedProvidersConfig();
}

export function loadDropshippingFunnels(): DropshippingFunnel[] {
  let list: DropshippingFunnel[] = [];
  let dirty = false;

  try {
    if (fs.existsSync(FUNNELS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FUNNELS_FILE, "utf8"));
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch {}

  // Strictly separate dropshipping from Al-Genedy Advertising (per user requirement)
  const filtered = list.filter((f) => {
    const slug = String(f?.slug || "").toLowerCase();
    const brandId = String(f?.agentBrandId || "").toLowerCase();
    const drop = slug === "algenedy-neon-drop" || slug.includes("algenedy") || brandId === "al_genedy";
    if (drop) dirty = true;
    return !drop;
  });

  // Backfill clean multi-product seed stores if missing or lacking products[]
  for (const seed of DEFAULT_SEED_FUNNELS) {
    const existingIdx = filtered.findIndex((f) => f.slug === seed.slug);
    if (existingIdx < 0) {
      filtered.push(seed);
      dirty = true;
    } else if (!Array.isArray(filtered[existingIdx].products) || filtered[existingIdx].products!.length === 0) {
      filtered[existingIdx] = {
        ...seed,
        ...filtered[existingIdx],
        heroImageUrl:
          filtered[existingIdx].heroImageUrl && !String(filtered[existingIdx].heroImageUrl).includes("/al-genedy/")
            ? filtered[existingIdx].heroImageUrl
            : seed.heroImageUrl,
        products: seed.products,
        storeTheme: filtered[existingIdx].storeTheme || seed.storeTheme,
        shippingZones: filtered[existingIdx].shippingZones || seed.shippingZones,
      };
      dirty = true;
    }
  }

  if (dirty || !fs.existsSync(FUNNELS_FILE)) {
    writeJsonAtomic(FUNNELS_FILE, filtered);
  }
  return filtered;
}

export function upsertDropshippingFunnel(funnel: DropshippingFunnel): DropshippingFunnel {
  if (String(funnel.slug).toLowerCase().includes("algenedy") || funnel.agentBrandId === "al_genedy") {
    throw new Error("تطبيق الجنيدي للإعلان مستقل ولا يرتبط بمحرك الدروبشيبنج");
  }
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
      if (Array.isArray(parsed)) {
        // Filter out any legacy algenedy-neon-drop order so reports stay clean
        return parsed.filter(
          (o) => String(o?.funnelSlug || "").toLowerCase() !== "algenedy-neon-drop" && o?.agentBrandId !== "al_genedy"
        );
      }
    }
  } catch {}
  return [];
}

export function saveDropshippingOrders(orders: DropshippingOrder[]): void {
  writeJsonAtomic(ORDERS_FILE, orders.slice(0, 1000));
}

export interface SupplierCatalogSearchItem {
  sku: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  supplierProvider: SupplierProvider;
  supplierId: string;
  supplierName: string;
  supplierWhatsapp: string;
  warehouseRegion: string;
  estimatedDeliveryDays: string;
  wholesaleCurrency: "EGP" | "USD" | "SAR";
  wholesaleRawPrice: number;
  supplierCostEgp: number;
  suggestedSellingPriceEgp: number;
  codEconomics: CodProfitabilityResult;
  sourceMode: "live_api" | "curated_ready";
}

function enrichCatalogCandidate(
  raw: Omit<SupplierCatalogSearchItem, "supplierCostEgp" | "suggestedSellingPriceEgp" | "codEconomics">,
  cfg: DropshippingProvidersConfig
): SupplierCatalogSearchItem {
  const rate = raw.wholesaleCurrency === "USD" ? cfg.usdToEgp : raw.wholesaleCurrency === "SAR" ? cfg.sarToEgp : 1;
  const supplierCostEgp = Math.max(40, Math.round(raw.wholesaleRawPrice * rate));
  const rawSell = supplierCostEgp * cfg.defaultMarkupMultiplier + 110;
  const suggestedSellingPriceEgp = Math.max(supplierCostEgp + 220, Math.ceil(rawSell / 10) * 10);
  const codEconomics = calculateCodProfitability({
    sellingPriceEgp: suggestedSellingPriceEgp,
    supplierCostEgp,
    shippingCostEgp: cfg.defaultShippingEgp,
    cpaAdCostEgp: cfg.defaultCpaEgp,
    expectedReturnRatePct: 18,
  });
  return {
    ...raw,
    supplierCostEgp,
    suggestedSellingPriceEgp,
    codEconomics,
  };
}

const CURATED_SUPPLIER_CATALOG: Array<
  Omit<SupplierCatalogSearchItem, "supplierCostEgp" | "suggestedSellingPriceEgp" | "codEconomics">
> = [
  // CJ Dropshipping Global API v2
  {
    sku: "CJJT-CARPLAY-01",
    name: "شاشة Apple CarPlay & Android Auto لاسلكية محمولة 7 بوصة للسيارات",
    category: "إلكترونيات السيارة",
    description: "تركيب مباشر بالولاعة دون فك التابلوه — تدعم الخرائط والرد الصوتي وبلوتوث السيارة.",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=900&auto=format&fit=crop",
    supplierProvider: "cj",
    supplierId: "cj-global-cn",
    supplierName: "CJ Dropshipping Global (CN/AE)",
    supplierWhatsapp: "01013372674",
    warehouseRegion: "CN / Dubai Warehouse",
    estimatedDeliveryDays: "4-7 أيام عمل",
    wholesaleCurrency: "USD",
    wholesaleRawPrice: 22.5,
    sourceMode: "curated_ready",
  },
  {
    sku: "CJJT-PROJECTOR-4K",
    name: "بروجكتور منزلي ذكي HD Mini مع نظام أندرويد وواي فاي مدمج",
    category: "أجهزة الترفيه المنزلي",
    description: "شاشة عرض سينمائية حتى 130 بوصة داخل الغرفة بتصحيح زاوية تلقائي وسماعة مدمجة.",
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=900&auto=format&fit=crop",
    supplierProvider: "cj",
    supplierId: "cj-global-cn",
    supplierName: "CJ Dropshipping Global (CN/AE)",
    supplierWhatsapp: "01013372674",
    warehouseRegion: "CN / US Warehouse",
    estimatedDeliveryDays: "5-8 أيام عمل",
    wholesaleCurrency: "USD",
    wholesaleRawPrice: 28,
    sourceMode: "curated_ready",
  },
  {
    sku: "CJJT-ESPRESSO-PORT",
    name: "ماكينة قهوة وإسبريسو محمولة للسيارة والمكتب شحن USB-C",
    category: "أدوات المكتب والرحلات",
    description: "تسخين فوري خلال 3 دقائق — تقبل الكبسولات والبن المطحون بضغط 20 بار.",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=900&auto=format&fit=crop",
    supplierProvider: "cj",
    supplierId: "cj-global-cn",
    supplierName: "CJ Dropshipping Global (CN/AE)",
    supplierWhatsapp: "01013372674",
    warehouseRegion: "CN / Dubai Warehouse",
    estimatedDeliveryDays: "4-7 أيام عمل",
    wholesaleCurrency: "USD",
    wholesaleRawPrice: 16.5,
    sourceMode: "curated_ready",
  },
  // Knawat / Makhazen (GCC Regional)
  {
    sku: "KNW-PERFUME-DIFF",
    name: "فواحة عطور ذكية بالموجات فوق الصوتية للسيارة والمنزل + 3 زيوت",
    category: "إكسسوارات فاخرة",
    description: "جسم ألمنيوم فاخر يعمل بمستشعر اهتزاز تلقائي وبطارية تدوم 30 يوم.",
    imageUrl: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=900&auto=format&fit=crop",
    supplierProvider: "knawat",
    supplierId: "knawat-dxb-01",
    supplierName: "Knawat GCC Express",
    supplierWhatsapp: "01013372674",
    warehouseRegion: "الإمارات — دبي",
    estimatedDeliveryDays: "3-5 أيام عمل",
    wholesaleCurrency: "SAR",
    wholesaleRawPrice: 44,
    sourceMode: "curated_ready",
  },
  {
    sku: "MKZ-AIRPUR-HEPA",
    name: "منقي هواء ذكي بفلتر HEPA 13 للمكتب والغرف + مستشعر غبار",
    category: "المنزل الذكي",
    description: "ينقي 99.97% من الغبار والروائح بدوران 360 درجة وصوت هادئ للغاية.",
    imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=900&auto=format&fit=crop",
    supplierProvider: "makhazen",
    supplierId: "makhazen-riyadh-01",
    supplierName: "مخازن (Makhazen GCC)",
    supplierWhatsapp: "01013372674",
    warehouseRegion: "السعودية — الرياض",
    estimatedDeliveryDays: "3-5 أيام عمل",
    wholesaleCurrency: "SAR",
    wholesaleRawPrice: 82,
    sourceMode: "curated_ready",
  },
  // Taager & Local Wholesalers
  {
    sku: "TGR-LED-KIT-12",
    name: "طقم لمبات LED سيارات فائق السطوع H7 / H4 12000 لومن مع ضمان عام",
    category: "إضاءة السيارات",
    description: "تبريد مروحة نحاسي ثنائي ومقاومة كاملة للماء IP68 — تركيب بلج أند بلاي.",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=900&auto=format&fit=crop",
    supplierProvider: "taager",
    supplierId: "taager-auto-cairo",
    supplierName: "تاجر (Taager Egypt)",
    supplierWhatsapp: "01013372674",
    warehouseRegion: "القاهرة — مصر",
    estimatedDeliveryDays: "1-2 يوم عمل",
    wholesaleCurrency: "EGP",
    wholesaleRawPrice: 390,
    sourceMode: "curated_ready",
  },
  {
    sku: "LOC-SEAT-PRO",
    name: "طقم كسوة مقاعد سيارات جلد مخرّم فاخرة 5 كراسي — تركيب سهل",
    category: "فرش وإكسسوارات",
    description: "خامة جلد صناعي معالج مقاوم للماء والحرارة بتطريز رياضي وتناسب جميع السيارات.",
    imageUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=900&auto=format&fit=crop",
    supplierProvider: "local_wholesale",
    supplierId: "giza-tawfikia-01",
    supplierName: "مجمع الجملة المباشر (العتبة / الجيزة)",
    supplierWhatsapp: "01013372674",
    warehouseRegion: "الجيزة — مصر",
    estimatedDeliveryDays: "24-48 ساعة",
    wholesaleCurrency: "EGP",
    wholesaleRawPrice: 880,
    sourceMode: "curated_ready",
  },
  // Independent On-Demand Workshops (Strictly separate from Al-Genedy!)
  {
    sku: "WSP-WALLET-ENG",
    name: "محفظة جلد طبيعي مع ميدالية معدنية محفورة بالليزر باسم العميل",
    category: "هدايا مخصصة",
    description: "تجهيز وحفر فوري خلال 24 ساعة في ورشة المشغولات الجلدية + علبة هدايا فاخرة.",
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=900&auto=format&fit=crop",
    supplierProvider: "workshop",
    supplierId: "workshop-gifts-cairo",
    supplierName: "ورشة الهدايا والليزر (عند الطلب)",
    supplierWhatsapp: "01013372674",
    warehouseRegion: "القاهرة — تصنيع عند الطلب",
    estimatedDeliveryDays: "2-3 أيام عمل",
    wholesaleCurrency: "EGP",
    wholesaleRawPrice: 215,
    sourceMode: "curated_ready",
  },
];

export async function searchSupplierCatalog(
  provider: SupplierProvider | "all",
  query = ""
): Promise<{ ok: boolean; mode: "live_api" | "curated_ready"; items: SupplierCatalogSearchItem[]; note?: string }> {
  const cfg = loadDropshippingProvidersConfig();
  const q = String(query || "").trim();

  // Live CJ Dropshipping API v2 when token is configured
  if (provider === "cj" && cfg.cjAccessToken && q) {
    try {
      const resp = await fetch(
        `https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=${encodeURIComponent(q)}&pageNum=1&pageSize=10`,
        {
          headers: { "CJ-Access-Token": cfg.cjAccessToken },
          signal: AbortSignal.timeout(8000),
        }
      );
      const data: any = await resp.json().catch(() => ({}));
      const rows: any[] = Array.isArray(data?.data?.list) ? data.data.list : [];
      if (resp.ok && rows.length > 0) {
        const mapped = rows.map((row) => {
          const usd = Number(String(row.sellPrice || "15").split("-")[0]) || 15;
          return enrichCatalogCandidate(
            {
              sku: String(row.productSku || row.pid || `CJ-${Date.now()}`),
              name: String(row.productNameEn || row.productName || "CJ Product"),
              category: String(row.categoryName || "استيراد CJ مباشر"),
              description: `مستورد من CJ Dropshipping — الوزن التقريبي ${row.productWeight || 350} جم`,
              imageUrl: String(row.productImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=900&auto=format&fit=crop"),
              supplierProvider: "cj",
              supplierId: "cj-api-v2",
              supplierName: "CJ Dropshipping API v2 (Live)",
              supplierWhatsapp: "01013372674",
              warehouseRegion: "CJ Global Warehouse",
              estimatedDeliveryDays: "5-9 أيام عمل",
              wholesaleCurrency: "USD",
              wholesaleRawPrice: usd,
              sourceMode: "live_api",
            },
            cfg
          );
        });
        return { ok: true, mode: "live_api", items: mapped };
      }
    } catch {}
  }

  const qLower = q.toLowerCase();
  const matches = CURATED_SUPPLIER_CATALOG.filter((item) => {
    const provOk = provider === "all" || item.supplierProvider === provider;
    if (!provOk) return false;
    if (!qLower) return true;
    return (
      item.name.toLowerCase().includes(qLower) ||
      item.category.toLowerCase().includes(qLower) ||
      item.description.toLowerCase().includes(qLower) ||
      item.sku.toLowerCase().includes(qLower)
    );
  });

  const finalList = (matches.length > 0 ? matches : CURATED_SUPPLIER_CATALOG.filter((i) => provider === "all" || i.supplierProvider === provider))
    .map((item) => enrichCatalogCandidate(item, cfg));

  return {
    ok: true,
    mode: "curated_ready",
    items: finalList,
    note:
      provider === "cj" && !cfg.cjAccessToken
        ? "أضف CJ-Access-Token في الإعدادات لتفعيل البحث المباشر في مخازن CJ العالمية، أو استورد فوراً من الكتالوج الجاهز."
        : undefined,
  };
}

export async function importProductsIntoStore(
  slug: string,
  incomingProducts: Array<Partial<DropshippingStoreProduct> & { name: string; sellingPriceEgp?: number; sellingPrice?: number }>
): Promise<{ store: DropshippingFunnel; importedCount: number }> {
  const funnels = loadDropshippingFunnels();
  const idx = funnels.findIndex((f) => f.slug.toLowerCase() === slug.toLowerCase());
  const baseStore = idx >= 0 ? funnels[idx] : { ...DEFAULT_SEED_FUNNELS[0], slug, brandName: `متجر ${slug}`, products: [] };
  const existingProducts: DropshippingStoreProduct[] = Array.isArray(baseStore.products) ? [...baseStore.products] : [];

  let nextId = Math.max(3000, ...existingProducts.map((p) => Number(p.id) || 0)) + 1;
  let importedCount = 0;

  for (const raw of incomingProducts) {
    if (!raw?.name || !String(raw.name).trim()) continue;
    const sku = String(raw.sku || `IMP-${nextId}`).trim();
    const sellPrice = Math.max(50, Math.round(Number(raw.sellingPriceEgp ?? raw.sellingPrice) || 550));
    const costPrice = Math.max(20, Math.round(Number(raw.supplierCostEgp) || Math.round(sellPrice * 0.45)));
    const prov = (raw.supplierProvider || "local_wholesale") as SupplierProvider;
    const item: DropshippingStoreProduct = {
      id: Number(raw.id) || nextId++,
      sku,
      name: String(raw.name).trim(),
      category: String(raw.category || "منتجات مميزة").trim(),
      mainCategory: String(raw.mainCategory || raw.category || "منتجات مميزة").trim(),
      subCategory: String(raw.subCategory || "مستورد").trim(),
      brand: String(raw.brand || raw.supplierName || getSupplierProviderLabel(prov)).trim(),
      description: String(raw.description || "منتج دروبشيبنج جاهز للشحن السريع والدفع عند الاستلام.").trim(),
      imageUrl: String(raw.imageUrl || baseStore.heroImageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=900&auto=format&fit=crop"),
      images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : [String(raw.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=900&auto=format&fit=crop")],
      sellingPriceEgp: sellPrice,
      originalPriceEgp: Math.round(sellPrice * 1.22),
      discount: Number(raw.discount ?? 18),
      isNew: raw.isNew !== false,
      rating: Number(raw.rating || 4.8),
      supplierCostEgp: costPrice,
      fulfillmentType: raw.fulfillmentType || "dropshipping",
      supplierProvider: prov,
      supplierId: String(raw.supplierId || `${prov}-default`),
      supplierName: String(raw.supplierName || getSupplierProviderLabel(prov)),
      supplierWhatsapp: String(raw.supplierWhatsapp || baseStore.supplierWhatsapp || "01013372674"),
      supplierSku: raw.supplierSku || sku,
      warehouseRegion: String(raw.warehouseRegion || (prov === "cj" ? "CN / Dubai Warehouse" : "مصر / الخليج")),
      estimatedDeliveryDays: String(raw.estimatedDeliveryDays || (prov === "cj" ? "4-7 أيام عمل" : "1-3 أيام عمل")),
      expressCodTiers: Array.isArray(raw.expressCodTiers) && raw.expressCodTiers.length > 0
        ? raw.expressCodTiers
        : defaultTiersForPrice(sellPrice),
    };

    const existingSkuIdx = existingProducts.findIndex((p) => p.sku.toLowerCase() === sku.toLowerCase());
    if (existingSkuIdx >= 0) {
      existingProducts[existingSkuIdx] = { ...existingProducts[existingSkuIdx], ...item, id: existingProducts[existingSkuIdx].id };
    } else {
      existingProducts.unshift(item);
    }
    importedCount++;
  }

  const updatedStore: DropshippingFunnel = {
    ...baseStore,
    products: existingProducts,
  };
  upsertDropshippingFunnel(updatedStore);

  // Also mirror into Tenant ERP Catalog shard so Battah Admin + Storefront stay synchronized
  try {
    const erpKey = normalizeSlugKey(slug);
    const curErp = await loadTenantErpState(erpKey);
    const curErpProds: any[] = Array.isArray(curErp?.products) ? curErp.products : [];
    const mappedErp = existingProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      mainCategory: p.mainCategory || p.category,
      category: p.category,
      subCategory: p.subCategory || p.category,
      brand: p.brand || updatedStore.brandName,
      description: p.description,
      purchasePrice: p.supplierCostEgp,
      sellingPrice: p.sellingPriceEgp,
      stock: { main: 40 },
      images: p.images || [p.imageUrl],
      imageUrl: p.imageUrl,
      discount: p.discount,
      isNew: p.isNew,
      rating: p.rating,
      variants: p.variants,
      fulfillmentType: p.fulfillmentType,
      supplierProvider: p.supplierProvider,
      supplierId: p.supplierId,
      supplierName: p.supplierName,
      supplierSku: p.supplierSku,
      supplierCostEgp: p.supplierCostEgp,
      warehouseRegion: p.warehouseRegion,
      estimatedDeliveryDays: p.estimatedDeliveryDays,
      expressCodTiers: p.expressCodTiers,
    }));
    const mergedMap = new Map<string, any>();
    [...curErpProds, ...mappedErp].forEach((p) => {
      if (p?.sku) mergedMap.set(String(p.sku).toLowerCase(), p);
    });
    await saveTenantErpState(erpKey, { products: Array.from(mergedMap.values()) });
  } catch {}

  return { store: updatedStore, importedCount };
}

export function buildSplitSubOrders(input: {
  refCode: string;
  store: DropshippingFunnel;
  items: Array<{
    productId: number | string;
    sku?: string;
    productName: string;
    qty: number;
    unitPriceEgp: number;
    supplierProvider?: SupplierProvider;
    supplierId?: string;
    supplierName?: string;
    supplierWhatsapp?: string;
    supplierCostEgp?: number;
    warehouseRegion?: string;
  }>;
  shippingFeeEgp?: number;
}): {
  subOrders: SplitSubOrder[];
  totalSupplierCostEgp: number;
  totalSellingEgp: number;
} {
  const catalog = Array.isArray(input.store.products) ? input.store.products : [];
  const groups = new Map<string, SplitSubOrder>();
  let totalSupplierCostEgp = 0;
  let totalSellingEgp = 0;

  for (const rawItem of input.items) {
    const qty = Math.max(1, Number(rawItem.qty) || 1);
    const catalogMatch =
      catalog.find((p) => String(p.id) === String(rawItem.productId)) ||
      catalog.find((p) => rawItem.sku && p.sku.toLowerCase() === String(rawItem.sku).toLowerCase());

    const provider: SupplierProvider =
      rawItem.supplierProvider || catalogMatch?.supplierProvider || "local_wholesale";
    const supplierId = String(rawItem.supplierId || catalogMatch?.supplierId || `${provider}-default`);
    const supplierName = String(
      rawItem.supplierName || catalogMatch?.supplierName || input.store.supplierName || getSupplierProviderLabel(provider)
    );
    const supplierWhatsapp = String(
      rawItem.supplierWhatsapp || catalogMatch?.supplierWhatsapp || input.store.supplierWhatsapp || "01013372674"
    );
    const warehouseRegion = String(rawItem.warehouseRegion || catalogMatch?.warehouseRegion || "القاهرة — مصر");

    const unitPriceEgp = Math.max(
      0,
      Number(rawItem.unitPriceEgp || catalogMatch?.sellingPriceEgp || 500)
    );
    const unitSupplierCost = Math.max(
      0,
      Number(
        rawItem.supplierCostEgp ??
          catalogMatch?.supplierCostEgp ??
          input.store.supplierCostPerUnitEgp ??
          Math.round(unitPriceEgp * 0.45)
      )
    );

    const lineSelling = unitPriceEgp * qty;
    const lineCost = unitSupplierCost * qty;
    totalSellingEgp += lineSelling;
    totalSupplierCostEgp += lineCost;

    const groupKey = `${provider}::${supplierId}`;
    let group = groups.get(groupKey);
    if (!group) {
      const subIdx = groups.size + 1;
      group = {
        subOrderId: `${input.refCode}-S${subIdx}`,
        supplierProvider: provider,
        supplierId,
        supplierName,
        supplierWhatsapp,
        warehouseRegion,
        items: [],
        supplierCostTotalEgp: 0,
        codCollectionEgp: 0,
        carrierProvider: getDefaultCarrierForProvider(provider),
        trackingNumber: null,
        trackingUrl: null,
        status: "pending_whatsapp_confirm",
      };
      groups.set(groupKey, group);
    }

    group.items.push({
      productId: rawItem.productId,
      sku: String(rawItem.sku || catalogMatch?.sku || `SKU-${rawItem.productId}`),
      productName: rawItem.productName || catalogMatch?.name || "منتج",
      qty,
      unitPriceEgp,
      supplierCostEgp: unitSupplierCost,
    });
    group.supplierCostTotalEgp += lineCost;
    group.codCollectionEgp += lineSelling;
  }

  const subOrders = Array.from(groups.values());
  if (subOrders.length > 0 && Number(input.shippingFeeEgp || 0) > 0) {
    subOrders[0].codCollectionEgp += Number(input.shippingFeeEgp || 0);
  }

  return { subOrders, totalSupplierCostEgp, totalSellingEgp };
}

export async function dispatchSubOrderShipment(
  order: DropshippingOrder,
  subOrder: SplitSubOrder,
  requestedCarrier?: CarrierProvider
): Promise<{
  ok: boolean;
  carrier: CarrierProvider;
  mode: "bosta_live" | "oto_live" | "aramex_live" | "cj_live" | "whatsapp_supplier_ready";
  trackingNumber: string | null;
  trackingUrl: string;
  supplierDispatchText: string;
  supplierWhatsappUrl: string;
  detail?: string;
}> {
  const carrier: CarrierProvider = requestedCarrier || subOrder.carrierProvider || getDefaultCarrierForProvider(subOrder.supplierProvider);
  const cfg = loadDropshippingProvidersConfig();
  const dispatchText = buildZeroPriceSubOrderDispatchText(order, {
    ...subOrder,
    carrierProvider: carrier,
  });
  const intlSupplier = formatEgyptWhatsappIntl(subOrder.supplierWhatsapp || order.supplierWhatsapp);
  const supplierWhatsappUrl = `https://wa.me/${intlSupplier}?text=${encodeURIComponent(dispatchText)}`;

  // 1) Bosta API v2
  if (carrier === "bosta") {
    const bostaKey = (cfg.bostaApiKey || process.env.BOSTA_API_KEY || "").trim();
    if (bostaKey) {
      try {
        const resp = await fetch("https://app.bosta.co/api/v2/deliveries", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: bostaKey },
          body: JSON.stringify({
            type: 10,
            cod: subOrder.codCollectionEgp,
            specs: {
              packageDetails: {
                itemsCount: subOrder.items.reduce((s, i) => s + i.qty, 0),
                description: subOrder.items.map((i) => `${i.productName} x${i.qty}`).join(", "),
              },
            },
            dropOffAddress: { firstLine: order.address, city: order.governorate || "Cairo" },
            receiver: { firstName: order.customerName, phone: order.customerPhone },
            businessReference: subOrder.subOrderId,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data: any = await resp.json().catch(() => ({}));
        if (resp.ok && (data?.trackingNumber || data?._id)) {
          const tn = String(data.trackingNumber || data._id);
          return {
            ok: true,
            carrier,
            mode: "bosta_live",
            trackingNumber: tn,
            trackingUrl: buildCarrierTrackingUrl("bosta", tn),
            supplierDispatchText: dispatchText,
            supplierWhatsappUrl,
          };
        }
      } catch {}
    }
  }

  // 2) OTO MENA Multi-Carrier Gateway (covers Aramex / SMSA / Zajil)
  if (carrier === "oto") {
    const otoKey = (cfg.otoApiKey || process.env.OTO_API_KEY || "").trim();
    if (otoKey) {
      try {
        const resp = await fetch("https://api.tryoto.com/rest/v2/createOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${otoKey}` },
          body: JSON.stringify({
            orderId: subOrder.subOrderId,
            payment_method: "cod",
            amount: subOrder.codCollectionEgp,
            amount_due: subOrder.codCollectionEgp,
            currency: "EGP",
            customer: {
              name: order.customerName,
              mobile: order.customerPhone,
              address: order.address,
              city: order.governorate || "Cairo",
              country: "EG",
            },
            items: subOrder.items.map((it) => ({
              sku: it.sku,
              name: it.productName,
              quantity: it.qty,
              price: it.unitPriceEgp,
            })),
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data: any = await resp.json().catch(() => ({}));
        if (resp.ok && (data?.trackingNumber || data?.otoId)) {
          const tn = String(data.trackingNumber || data.otoId);
          return {
            ok: true,
            carrier,
            mode: "oto_live",
            trackingNumber: tn,
            trackingUrl: buildCarrierTrackingUrl("oto", tn),
            supplierDispatchText: dispatchText,
            supplierWhatsappUrl,
          };
        }
      } catch {}
    }
  }

  // 3) CJ Dropshipping Auto-Fulfillment API v2
  if (carrier === "cj_auto" && cfg.cjAccessToken) {
    try {
      const resp = await fetch("https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CJ-Access-Token": cfg.cjAccessToken,
        },
        body: JSON.stringify({
          orderNumber: subOrder.subOrderId,
          shippingCountryCode: "EG",
          shippingProvince: order.governorate || "Cairo",
          shippingCity: order.governorate || "Cairo",
          shippingAddress: order.address,
          shippingCustomerName: order.customerName,
          shippingPhone: order.customerPhone,
          products: subOrder.items.map((it) => ({
            vid: it.sku,
            quantity: it.qty,
          })),
        }),
        signal: AbortSignal.timeout(8000),
      });
      const data: any = await resp.json().catch(() => ({}));
      if (resp.ok && data?.result && data?.data) {
        const tn = String(data.data?.orderId || data.data || subOrder.subOrderId);
        return {
          ok: true,
          carrier,
          mode: "cj_live",
          trackingNumber: tn,
          trackingUrl: buildCarrierTrackingUrl("cj_auto", tn),
          supplierDispatchText: dispatchText,
          supplierWhatsappUrl,
        };
      }
    } catch {}
  }

  return {
    ok: true,
    carrier,
    mode: "whatsapp_supplier_ready",
    trackingNumber: null,
    trackingUrl: "",
    supplierDispatchText: dispatchText,
    supplierWhatsappUrl,
    detail: `أمر التوريد جاهز بصيغة Zero-Price (${carrier.toUpperCase()}) عبر واتساب حتى تفعيل مفتاح الربط التلقائي.`,
  };
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
  const cfg = loadDropshippingProvidersConfig();
  const bostaKey = (cfg.bostaApiKey || process.env.BOSTA_API_KEY || "").trim();

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

export function applyCarrierWebhookUpdate(input: {
  carrier: CarrierProvider;
  trackingNumber?: string;
  bizRef?: string;
  rawState?: string;
}): { matched: boolean; orderId?: string; subOrderId?: string; status?: DropshippingOrderStatus } {
  const tracking = String(input.trackingNumber || "").trim();
  const bizRef = String(input.bizRef || "").trim();
  const rawState = String(input.rawState || "").toLowerCase();

  let mappedStatus: DropshippingOrderStatus | null = null;
  if (/deliver|45|completed|pod/i.test(rawState)) mappedStatus = "delivered";
  else if (/return|46|cancel|terminated|failed/i.test(rawState)) mappedStatus = "returned";
  else if (/transit|picked|shipped|out_for_delivery|in_progress|20|30/i.test(rawState)) mappedStatus = "dispatched_to_supplier";

  const orders = loadDropshippingOrders();
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const subIdx = Array.isArray(o.subOrders)
      ? o.subOrders.findIndex(
          (s) => (tracking && s.trackingNumber === tracking) || (bizRef && s.subOrderId === bizRef)
        )
      : -1;
    const parentMatch =
      (tracking && o.bostaTrackingNumber === tracking) ||
      (bizRef && (o.refCode === bizRef || o.id === bizRef));

    if (subIdx >= 0 || parentMatch) {
      if (subIdx >= 0 && Array.isArray(o.subOrders)) {
        if (mappedStatus) o.subOrders[subIdx].status = mappedStatus;
        if (tracking) {
          o.subOrders[subIdx].trackingNumber = tracking;
          o.subOrders[subIdx].trackingUrl = buildCarrierTrackingUrl(input.carrier, tracking);
        }
        // Recompute parent order status based on all subOrders
        const statuses = o.subOrders.map((s) => s.status);
        if (statuses.every((st) => st === "delivered")) {
          o.status = "delivered";
        } else if (statuses.every((st) => st === "returned")) {
          o.status = "returned";
        } else if (mappedStatus) {
          o.status = mappedStatus;
        }
      } else if (mappedStatus) {
        o.status = mappedStatus;
      }

      o.updatedAt = new Date().toISOString();
      orders[i] = o;
      saveDropshippingOrders(orders);
      return {
        matched: true,
        orderId: o.id,
        subOrderId: subIdx >= 0 ? o.subOrders?.[subIdx]?.subOrderId : undefined,
        status: o.status,
      };
    }
  }

  return { matched: false };
}

export function computeCodSettlementSummary() {
  const orders = loadDropshippingOrders();
  const funnels = loadDropshippingFunnels();
  const providersCfg = getMaskedProvidersConfig();

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
    bostaConfigured: providersCfg.configured.bosta,
    otoConfigured: providersCfg.configured.oto,
    cjConfigured: providersCfg.configured.cj,
  };
}
