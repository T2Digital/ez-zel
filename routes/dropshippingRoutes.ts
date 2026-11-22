import type { Express, Request, Response } from "express";
import {
  applyCarrierWebhookUpdate,
  buildCarrierTrackingUrl,
  buildSplitSubOrders,
  buildZeroPriceSubOrderDispatchText,
  buildZeroPriceSupplierDispatchText,
  calculateCodProfitability,
  computeCodSettlementSummary,
  dispatchOrderToBosta,
  dispatchSubOrderShipment,
  formatEgyptWhatsappIntl,
  getMaskedProvidersConfig,
  getSupplierProviderLabel,
  importProductsIntoStore,
  loadDropshippingFunnels,
  loadDropshippingOrders,
  saveDropshippingOrders,
  saveDropshippingProvidersConfig,
  searchSupplierCatalog,
  upsertDropshippingFunnel,
  type CarrierProvider,
  type DropshippingFunnel,
  type DropshippingOrder,
  type DropshippingOrderStatus,
  type SupplierProvider,
} from "../services/dropshippingEngineService";
import { recordLiveEvent } from "../services/liveTelemetryService";
import { getT2AgentBaseUrl, t2AgentApi } from "../services/t2AgentApiClient";
import { verifyAdminRequest } from "../services/serverAdminAuth";
import { verifyTenantToken } from "./tenantErpRoutes";

function isLocalDevRequest(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const host = String(req.headers.host || "");
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}

async function authorizeDropshippingAdmin(req: Request): Promise<boolean> {
  const adminCheck = await verifyAdminRequest(req).catch(() => ({ ok: false }));
  if (adminCheck.ok) return true;
  const authHeader = String(req.headers.authorization || "");
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (bearer && verifyTenantToken(bearer)) return true;
  if (isLocalDevRequest(req)) return true;
  return false;
}

export function registerDropshippingRoutes(app: Express): void {
  // 1) Public Battah Storefront Bootstrap API for Dropshipping Stores (sanitized — NO wholesale costs or private keys leaked)
  app.get("/api/dropshipping/public/:slug/storefront", (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const slug = String(req.params.slug || "").trim().toLowerCase();
    if (!slug || slug.includes("algenedy") || slug === "al_genedy" || slug === "al-genedy") {
      return res.status(404).json({ ok: false, error: "Dropshipping storefront not found" });
    }

    const funnels = loadDropshippingFunnels();
    const store = funnels.find((f) => f.slug.toLowerCase() === slug);
    if (!store) {
      return res.status(404).json({ ok: false, error: "Storefront not registered in dropshipping hub" });
    }

    const safeProducts = (Array.isArray(store.products) ? store.products : []).map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      mainCategory: p.mainCategory || p.category,
      subCategory: p.subCategory || p.category,
      brand: p.brand || store.brandName,
      description: p.description,
      imageUrl: p.imageUrl,
      images: p.images && p.images.length > 0 ? p.images : [p.imageUrl],
      numericPrice: p.sellingPriceEgp,
      sellingPrice: p.sellingPriceEgp,
      originalPrice: p.originalPriceEgp,
      discount: p.discount,
      isNew: p.isNew,
      rating: p.rating,
      variants: p.variants,
      fulfillmentType: p.fulfillmentType || "dropshipping",
      supplierProvider: p.supplierProvider,
      supplierId: p.supplierId,
      supplierName: p.supplierName || getSupplierProviderLabel(p.supplierProvider),
      warehouseRegion: p.warehouseRegion,
      estimatedDeliveryDays: p.estimatedDeliveryDays,
      expressCodTiers: p.expressCodTiers || store.tiers,
    }));

    const categories = Array.from(new Set(safeProducts.map((p) => p.mainCategory || p.category).filter(Boolean)));
    const safePhone = store.storeTheme?.phone || "01013372674";

    return res.json({
      ok: true,
      store: {
        slug: store.slug,
        brandName: store.brandName,
        agentBrandId: store.agentBrandId,
        tagline: store.tagline,
        heroImageUrl: store.heroImageUrl,
        shippingCostEgp: store.shippingCostEgp,
        highlights: store.highlights,
        tiers: store.tiers,
        shippingZones: store.shippingZones || [],
      },
      brand: {
        id: store.slug,
        slug: store.slug,
        name: store.brandName,
        slogan: store.storeTheme?.slogan || store.tagline,
        logoUrl: store.heroImageUrl,
        primaryColor: store.storeTheme?.primaryColor || "#0284c7",
        accentColor: store.storeTheme?.accentColor || "#0f172a",
        phone: safePhone,
        whatsapp: store.storeTheme?.whatsapp || safePhone,
        businessType: "تجارة إلكترونية ودروبشيبنج",
        appAccessMode: "full_app",
        productsCatalog: safeProducts,
        appCustomization: {
          mainCategories: categories,
          storefrontFilters: {
            showSearch: true,
            showCategoryFilter: true,
            showSubCategoryFilter: false,
            showBrandFilter: true,
            brandFilterLabel: "المورد / البراند",
            brandFilterOptions: Array.from(new Set(safeProducts.map((p) => String(p.brand || "")).filter(Boolean))),
          },
          heroSlides: [
            {
              id: 1,
              badge: "🚀 التوصيل السريع والدفع عند الاستلام",
              title: store.brandName,
              subtitle: store.tagline,
              description: store.highlights.join(" • "),
              image: store.heroImageUrl || safeProducts[0]?.imageUrl || "",
              category: "all",
            },
          ],
          shipping: {
            defaultFee: store.shippingCostEgp || 60,
            freeShippingThreshold: 1800,
            zones: store.shippingZones && store.shippingZones.length > 0
              ? store.shippingZones
              : [
                  { name: "القاهرة والجيزة", fee: 55 },
                  { name: "الإسكندرية والدلتا", fee: 65 },
                  { name: "الصعيد ومدن القناة", fee: 85 },
                ],
          },
        },
      },
      products: safeProducts,
    });
  });

  // 2) Public COD Multi-Supplier Order Intake (Supports Multi-Item Split-Order Cart OR Single-Product Express COD)
  app.post("/api/dropshipping/public/:slug/orders", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const slug = String(req.params.slug || "").trim().toLowerCase();
      if (slug.includes("algenedy") || slug === "al_genedy" || slug === "al-genedy") {
        return res.status(400).json({ ok: false, error: "Al-Genedy Advertising is excluded from dropshipping" });
      }
      const funnels = loadDropshippingFunnels();
      const funnel = funnels.find((f) => f.slug.toLowerCase() === slug);
      if (!funnel) {
        return res.status(404).json({ ok: false, error: "المتجر غير موجود" });
      }

      const {
        qty = 1,
        productId,
        items: rawCartItems,
        customerName,
        customerPhone,
        governorate = "القاهرة",
        address,
        notes,
        shippingFeeOverride,
      } = req.body || {};

      if (!String(customerName || "").trim() || !String(customerPhone || "").trim() || !String(address || "").trim()) {
        return res.status(400).json({ ok: false, error: "يرجى إدخال الاسم ورقم الموبايل والعنوان بالتفصيل" });
      }

      let orderItems: Array<{
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
      }> = [];

      let expressSellingOverride: number | null = null;
      let expressFreeShipping: boolean | null = null;
      let bundleLabel = "";

      if (Array.isArray(rawCartItems) && rawCartItems.length > 0) {
        orderItems = rawCartItems.map((it: any) => ({
          productId: it.productId ?? it.id ?? 0,
          sku: it.sku,
          productName: String(it.productName || it.name || funnel.productName),
          qty: Math.max(1, Number(it.qty ?? it.quantity) || 1),
          unitPriceEgp: Math.max(0, Number(it.unitPriceEgp ?? it.unitPrice ?? it.sellingPrice) || 0),
          supplierProvider: it.supplierProvider,
          supplierId: it.supplierId,
          supplierName: it.supplierName,
          warehouseRegion: it.warehouseRegion,
        }));
        bundleLabel = `${orderItems.reduce((s, i) => s + i.qty, 0)} منتج (سلة متعددة الموردين)`;
      } else {
        const numQty = Math.max(1, Number(qty) || 1);
        const matchedProd =
          (funnel.products || []).find((p) => productId !== undefined && String(p.id) === String(productId)) ||
          funnel.products?.[0];
        const tierList = matchedProd?.expressCodTiers || funnel.tiers || [];
        const matchedTier = tierList.find((t) => t.qty === numQty);
        const unitSell = matchedProd?.sellingPriceEgp || (funnel.tiers[0]?.sellingPriceEgp || 590);
        const unitCost = matchedProd?.supplierCostEgp || funnel.supplierCostPerUnitEgp || 240;

        expressSellingOverride = matchedTier ? Number(matchedTier.sellingPriceEgp) : unitSell * numQty;
        expressFreeShipping = matchedTier ? Boolean(matchedTier.freeShipping) : numQty >= 2;
        bundleLabel = matchedTier?.label || `${numQty} قطعة`;

        orderItems = [
          {
            productId: matchedProd?.id ?? 1,
            sku: matchedProd?.sku || `DROP-${funnel.slug}`,
            productName: matchedProd?.name || funnel.productName,
            qty: numQty,
            unitPriceEgp: Math.round(expressSellingOverride / numQty),
            supplierProvider: matchedProd?.supplierProvider || "local_wholesale",
            supplierId: matchedProd?.supplierId || "default-supplier",
            supplierName: matchedProd?.supplierName || funnel.supplierName,
            supplierWhatsapp: matchedProd?.supplierWhatsapp || funnel.supplierWhatsapp,
            supplierCostEgp: unitCost,
            warehouseRegion: matchedProd?.warehouseRegion || "القاهرة — مصر",
          },
        ];
      }

      const defaultShipFee = Number(funnel.shippingCostEgp || 60);
      const shippingFeeEgp =
        expressFreeShipping === true
          ? 0
          : shippingFeeOverride !== undefined
            ? Math.max(0, Number(shippingFeeOverride) || 0)
            : defaultShipFee;

      const refCode = `DRP-${Date.now().toString().slice(-6)}`;
      const split = buildSplitSubOrders({
        refCode,
        store: funnel,
        items: orderItems,
        shippingFeeEgp,
      });

      const sellingPriceEgp = expressSellingOverride ?? split.totalSellingEgp;
      const totalCodEgp = sellingPriceEgp + shippingFeeEgp;
      const supplierCostTotalEgp = split.totalSupplierCostEgp;
      const adSpendEgp = Number(funnel.cpaAdCostEgp || 85);
      const netProfitEgp = Math.round(
        totalCodEgp - supplierCostTotalEgp - defaultShipFee - adSpendEgp
      );
      const totalQty = orderItems.reduce((s, i) => s + i.qty, 0);
      const summaryProductName =
        orderItems.length === 1
          ? orderItems[0].productName
          : `${orderItems[0].productName} (+ ${orderItems.length - 1} أصناف أخرى)`;

      const nowIso = new Date().toISOString();
      const order: DropshippingOrder = {
        id: `drp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        refCode,
        funnelSlug: funnel.slug,
        brandName: funnel.brandName,
        agentBrandId: funnel.agentBrandId || "tito_media",
        productName: summaryProductName,
        qty: totalQty,
        bundleLabel,
        sellingPriceEgp,
        shippingFeeEgp,
        totalCodEgp,
        supplierCostTotalEgp,
        adSpendEgp,
        netProfitEgp,
        customerName: String(customerName).trim(),
        customerPhone: String(customerPhone).trim(),
        governorate: String(governorate).trim(),
        address: String(address).trim(),
        notes: notes ? String(notes).trim() : undefined,
        supplierWhatsapp: split.subOrders[0]?.supplierWhatsapp || funnel.supplierWhatsapp,
        status: "pending_whatsapp_confirm",
        whatsappConfirmed: false,
        bostaTrackingNumber: null,
        carrierProvider: split.subOrders[0]?.carrierProvider || "bosta",
        subOrders: split.subOrders,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const orders = loadDropshippingOrders();
      orders.unshift(order);
      saveDropshippingOrders(orders);

      try {
        recordLiveEvent({
          source: "battah",
          eventType: "order_created",
          brandId: order.agentBrandId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          amountEgp: order.totalCodEgp,
          summary: `طلب متجر (${order.refCode} | ${split.subOrders.length} شحنات): ${summaryProductName} — ${order.totalCodEgp} ج.م`,
        });
      } catch {}

      const confirmMsg =
        `أهلاً بك يا ${order.customerName} في ${funnel.brandName} 🌟\n` +
        `تم تسجيل طلبك (${order.refCode}) بنجاح (${split.subOrders.length} شحنة حسب مستودع التوريد).\n` +
        `الإجمالي عند الاستلام: ${order.totalCodEgp} ج.م — المحافظة: ${order.governorate}.\n` +
        `يرجى الرد بـ "تأكيد" لشحن الطلب فوراً وإرسال رقم التتبع!`;

      t2AgentApi
        .sendManualReply(order.agentBrandId, order.customerPhone, confirmMsg)
        .catch(() => {});

      const agentFallbackWa = `https://wa.me/${formatEgyptWhatsappIntl(funnel.storeTheme?.whatsapp || funnel.supplierWhatsapp)}?text=${encodeURIComponent(
        `أؤكد طلبي رقم ${order.refCode} - ${summaryProductName} (${totalQty} قطعة) - ${order.customerName} - ${order.governorate}`
      )}`;

      return res.json({
        ok: true,
        order,
        subOrders: order.subOrders,
        whatsappConfirmUrl: agentFallbackWa,
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Order intake failed" });
    }
  });

  // 3) Providers Config, Live Supplier Catalog Search & 1-Click/Bulk Product Import
  app.get("/api/dropshipping/providers", async (req: Request, res: Response) => {
    if (!(await authorizeDropshippingAdmin(req))) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    return res.json({ ok: true, config: getMaskedProvidersConfig() });
  });

  app.post("/api/dropshipping/providers", async (req: Request, res: Response) => {
    if (!(await authorizeDropshippingAdmin(req))) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const updated = saveDropshippingProvidersConfig(req.body || {});
    return res.json({ ok: true, config: updated });
  });

  app.post("/api/dropshipping/suppliers/search", async (req: Request, res: Response) => {
    if (!(await authorizeDropshippingAdmin(req))) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const provider = String(req.body?.provider || "all") as SupplierProvider | "all";
    const query = String(req.body?.query || "");
    const result = await searchSupplierCatalog(provider, query);
    return res.json(result);
  });

  app.post("/api/dropshipping/suppliers/import", async (req: Request, res: Response) => {
    if (!(await authorizeDropshippingAdmin(req))) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    try {
      const slug = String(req.body?.slug || "captaincar-eg").trim().toLowerCase();
      if (slug.includes("algenedy") || slug === "al_genedy" || slug === "al-genedy") {
        return res.status(400).json({ ok: false, error: "لا يمكن استيراد منتجات دروبشيبنج إلى تطبيق الجنيدي" });
      }
      const items = Array.isArray(req.body?.products)
        ? req.body.products
        : req.body?.product
          ? [req.body.product]
          : [];
      if (items.length === 0) {
        return res.status(400).json({ ok: false, error: "يرجى تحديد منتج واحد على الأقل للاستيراد" });
      }
      const result = await importProductsIntoStore(slug, items);
      return res.json({ ok: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Import failed" });
    }
  });

  // 4) COD Profitability Calculator + Settlement Board API
  app.get("/api/dropshipping/settlement", async (req: Request, res: Response) => {
    const authOk = await authorizeDropshippingAdmin(req);
    const funnels = loadDropshippingFunnels();
    const orders = loadDropshippingOrders();
    const summary = computeCodSettlementSummary();
    res.json({
      ok: true,
      summary,
      providers: authOk ? getMaskedProvidersConfig() : undefined,
      funnels: authOk
        ? funnels
        : funnels.map((f) => ({
            slug: f.slug,
            brandName: f.brandName,
            productName: f.productName,
            tagline: f.tagline,
            heroImageUrl: f.heroImageUrl,
            tiers: f.tiers,
          })),
      orders: authOk ? orders : [],
    });
  });

  app.post("/api/dropshipping/calculate-profit", (req: Request, res: Response) => {
    const calc = calculateCodProfitability(req.body || {});
    res.json({ ok: true, economics: calc });
  });

  app.post("/api/dropshipping/funnels", async (req: Request, res: Response) => {
    try {
      if (!(await authorizeDropshippingAdmin(req))) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const b = req.body || {};
      const rawSlug = String(b.slug || b.productName || `drop-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `drop-${Date.now().toString().slice(-5)}`;

      if (rawSlug.includes("algenedy") || b.agentBrandId === "al_genedy") {
        return res.status(400).json({ ok: false, error: "تطبيق الجنيدي للإعلان مستقل ولا يرتبط بالدروبشيبنج" });
      }

      const basePrice = Math.max(150, Number(b.sellingPriceEgp) || 690);
      const supplierUnit = Math.max(50, Number(b.supplierCostPerUnitEgp) || Math.round(basePrice * 0.42));
      const heroImg =
        b.heroImageUrl && !String(b.heroImageUrl).includes("/al-genedy/")
          ? b.heroImageUrl
          : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop";

      const funnel: DropshippingFunnel = {
        slug: rawSlug,
        brandName: String(b.brandName || "متجر T2OS الذكي").trim(),
        agentBrandId: String(b.agentBrandId || "tito_media").trim(),
        productName: String(b.productName || "المنتج الرابح").trim(),
        tagline: String(b.tagline || "شحن سريع 1–3 أيام والدفع عند الاستلام بعد المعاينة").trim(),
        heroImageUrl: heroImg,
        supplierName: String(b.supplierName || "مورد جملة مباشر + بوسطة").trim(),
        supplierWhatsapp: String(b.supplierWhatsapp || "01013372674").trim(),
        supplierCostPerUnitEgp: supplierUnit,
        shippingCostEgp: Number(b.shippingCostEgp ?? 65),
        cpaAdCostEgp: Number(b.cpaAdCostEgp ?? 85),
        expectedReturnRatePct: Number(b.expectedReturnRatePct ?? 18),
        highlights: Array.isArray(b.highlights) && b.highlights.length > 0
          ? b.highlights
          : [
              "تأكيد فوري عبر واتساب قبل الشحن لتقليل المرتجعات",
              "توصيل سريع خلال 1 إلى 3 أيام لجميع المحافظات",
              "الدفع عند الاستلام + ضمان استبدال حقيقي",
            ],
        tiers: Array.isArray(b.tiers) && b.tiers.length > 0
          ? b.tiers
          : [
              { qty: 1, label: "قطعة واحدة", sellingPriceEgp: basePrice, freeShipping: false },
              {
                qty: 2,
                label: "قطعتين + شحن مجاني",
                badge: "الأكثر مبيعاً",
                sellingPriceEgp: Math.round(basePrice * 1.72),
                freeShipping: true,
              },
              {
                qty: 3,
                label: "باقة التوفير (3 قطع + شحن مجاني)",
                badge: "أعلى ربح صافي",
                sellingPriceEgp: Math.round(basePrice * 2.38),
                freeShipping: true,
              },
            ],
        createdAt: new Date().toISOString(),
      };

      const saved = upsertDropshippingFunnel(funnel);
      return res.json({
        ok: true,
        funnel: saved,
        funnelUrl: `/shop/${encodeURIComponent(saved.slug)}`,
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed saving funnel" });
    }
  });

  // 5) Zero-Price Split-Order & Multi-Carrier Dispatch (Bosta / OTO / Aramex / CJ Auto-Fulfillment)
  const handleDispatchOrder = async (req: Request, res: Response) => {
    try {
      if (!(await authorizeDropshippingAdmin(req))) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const orderId = String(req.params.orderId || "").trim();
      const requestedSubId = String(req.body?.subOrderId || "").trim();
      const requestedCarrier = req.body?.carrier as CarrierProvider | undefined;

      const orders = loadDropshippingOrders();
      const idx = orders.findIndex((o) => o.id === orderId || o.refCode === orderId);
      if (idx < 0) return res.status(404).json({ ok: false, error: "Order not found" });

      const order = orders[idx];
      const nowIso = new Date().toISOString();

      if (Array.isArray(order.subOrders) && order.subOrders.length > 0) {
        const dispatches: any[] = [];
        for (let sIdx = 0; sIdx < order.subOrders.length; sIdx++) {
          const sub = order.subOrders[sIdx];
          if (requestedSubId && sub.subOrderId !== requestedSubId) continue;

          const result = await dispatchSubOrderShipment(order, sub, requestedCarrier);
          order.subOrders[sIdx] = {
            ...sub,
            carrierProvider: result.carrier,
            dispatchMode: result.mode,
            trackingNumber: result.trackingNumber || sub.trackingNumber,
            trackingUrl: result.trackingUrl || sub.trackingUrl,
            status: "dispatched_to_supplier",
            dispatchedAt: nowIso,
          };
          dispatches.push({
            subOrderId: sub.subOrderId,
            supplierName: sub.supplierName,
            ...result,
          });
        }

        const primary = dispatches[0];
        order.whatsappConfirmed = true;
        order.status = "dispatched_to_supplier";
        if (primary) {
          order.dispatchMode = primary.mode;
          order.carrierProvider = primary.carrier;
          order.bostaTrackingNumber = primary.trackingNumber || order.bostaTrackingNumber;
          order.trackingUrl = primary.trackingUrl || order.trackingUrl;
        }
        order.dispatchedAt = nowIso;
        order.updatedAt = nowIso;
        orders[idx] = order;
        saveDropshippingOrders(orders);

        return res.json({
          ok: true,
          order,
          dispatches,
          mode: primary?.mode || "whatsapp_supplier_ready",
          trackingNumber: primary?.trackingNumber || null,
          supplierDispatchText: primary?.supplierDispatchText || buildZeroPriceSubOrderDispatchText(order, order.subOrders[0]),
          supplierWhatsappUrl: primary?.supplierWhatsappUrl || "",
          summary: computeCodSettlementSummary(),
        });
      }

      // Legacy single-shipment dispatch fallback
      const dispatch = await dispatchOrderToBosta(order);
      order.whatsappConfirmed = true;
      order.status = "dispatched_to_supplier";
      order.dispatchMode = dispatch.mode;
      order.bostaTrackingNumber = dispatch.trackingNumber;
      order.trackingUrl = dispatch.trackingNumber ? buildCarrierTrackingUrl("bosta", dispatch.trackingNumber) : "";
      order.dispatchedAt = nowIso;
      order.updatedAt = nowIso;

      orders[idx] = order;
      saveDropshippingOrders(orders);

      const supplierDispatchText = buildZeroPriceSupplierDispatchText(order);
      return res.json({
        ok: true,
        order,
        mode: dispatch.mode,
        trackingNumber: dispatch.trackingNumber,
        supplierDispatchText,
        supplierWhatsappUrl: dispatch.supplierWhatsappUrl,
        summary: computeCodSettlementSummary(),
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Dispatch failed" });
    }
  };

  app.post("/api/dropshipping/orders/:orderId/confirm-and-dispatch", handleDispatchOrder);
  app.post("/api/dropshipping/orders/:orderId/dispatch", handleDispatchOrder);

  // 6) Settlement Status Transition (Confirmed / Delivered / Returned + Ad Spend Adjustment)
  app.post("/api/dropshipping/orders/:orderId/status", async (req: Request, res: Response) => {
    try {
      if (!(await authorizeDropshippingAdmin(req))) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const orderId = String(req.params.orderId || "").trim();
      const subOrderId = String(req.body?.subOrderId || "").trim();
      const orders = loadDropshippingOrders();
      const idx = orders.findIndex((o) => o.id === orderId || o.refCode === orderId);
      if (idx < 0) return res.status(404).json({ ok: false, error: "Order not found" });

      const allowed: DropshippingOrderStatus[] = [
        "pending_whatsapp_confirm",
        "confirmed",
        "dispatched_to_supplier",
        "delivered",
        "returned",
      ];
      const nextStatus = req.body?.status as DropshippingOrderStatus;
      if (nextStatus && allowed.includes(nextStatus)) {
        if (subOrderId && Array.isArray(orders[idx].subOrders)) {
          orders[idx].subOrders = orders[idx].subOrders!.map((s) =>
            s.subOrderId === subOrderId ? { ...s, status: nextStatus } : s
          );
          if (orders[idx].subOrders!.every((s) => s.status === "delivered")) {
            orders[idx].status = "delivered";
          } else if (orders[idx].subOrders!.every((s) => s.status === "returned")) {
            orders[idx].status = "returned";
          } else {
            orders[idx].status = nextStatus;
          }
        } else {
          orders[idx].status = nextStatus;
          if (Array.isArray(orders[idx].subOrders)) {
            orders[idx].subOrders = orders[idx].subOrders!.map((s) => ({ ...s, status: nextStatus }));
          }
        }
      }
      if (req.body?.adSpendEgp !== undefined) {
        orders[idx].adSpendEgp = Math.max(0, Number(req.body.adSpendEgp) || 0);
      }
      orders[idx].updatedAt = new Date().toISOString();
      saveDropshippingOrders(orders);

      return res.json({
        ok: true,
        order: orders[idx],
        summary: computeCodSettlementSummary(),
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed updating order status" });
    }
  });

  // 7) Automatic Multi-Carrier Tracking Webhooks (Bosta, OTO/Aramex, CJ Auto)
  app.post("/api/webhooks/bosta", (req: Request, res: Response) => {
    try {
      const secret = (process.env.BOSTA_WEBHOOK_SECRET || "").trim();
      if (secret && String(req.headers["x-bosta-secret"] || "") !== secret) {
        return res.status(403).json({ ok: false, error: "Invalid Bosta webhook secret" });
      }
      const b = req.body || {};
      const result = applyCarrierWebhookUpdate({
        carrier: "bosta",
        trackingNumber: b.trackingNumber || b._id,
        bizRef: b.businessReference || b.orderId,
        rawState: String(b.state || b.status || ""),
      });
      return res.json({ ok: true, carrier: "bosta", ...result });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  app.post("/api/webhooks/oto", (req: Request, res: Response) => {
    try {
      const secret = (process.env.OTO_WEBHOOK_SECRET || "").trim();
      if (secret && String(req.headers["x-oto-secret"] || "") !== secret) {
        return res.status(403).json({ ok: false, error: "Invalid OTO webhook secret" });
      }
      const b = req.body || {};
      const result = applyCarrierWebhookUpdate({
        carrier: "oto",
        trackingNumber: b.trackingNumber || b.awb || b.otoId,
        bizRef: b.orderId || b.businessReference,
        rawState: String(b.status || b.shipmentStatus || ""),
      });
      return res.json({ ok: true, carrier: "oto", ...result });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  app.post("/api/webhooks/cj", (req: Request, res: Response) => {
    try {
      const secret = (process.env.CJ_WEBHOOK_SECRET || "").trim();
      if (secret && String(req.headers["x-cj-secret"] || "") !== secret) {
        return res.status(403).json({ ok: false, error: "Invalid CJ webhook secret" });
      }
      const b = req.body || {};
      const params = b.params || b;
      const result = applyCarrierWebhookUpdate({
        carrier: "cj_auto",
        trackingNumber: params.trackNumber || params.trackingNumber || params.logisticName,
        bizRef: params.orderNumber || params.orderId,
        rawState: String(params.orderStatus || params.status || ""),
      });
      return res.json({ ok: true, carrier: "cj_auto", ...result });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  // 8) Live Readiness & Non-Destructive End-to-End Dropshipping Verification
  app.get("/api/dropshipping/readiness", async (req: Request, res: Response) => {
    if (!(await authorizeDropshippingAdmin(req))) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    try {
      const funnels = loadDropshippingFunnels();
      const providers = getMaskedProvidersConfig();
      const alGenedyExcluded = !funnels.some(
        (f) => String(f.slug).includes("algenedy") || f.agentBrandId === "al_genedy"
      );

      let whatsappEngineConnected = false;
      let agentStatus = 0;
      let agentLatencyMs = 0;
      const t0 = Date.now();
      try {
        const probe = await fetch(`${getT2AgentBaseUrl()}/api/system/health`, {
          signal: AbortSignal.timeout(4000),
        });
        agentStatus = probe.status;
        whatsappEngineConnected = probe.ok;
        agentLatencyMs = Date.now() - t0;
      } catch {
        agentLatencyMs = Date.now() - t0;
      }

      return res.json({
        ok: true,
        checkedAt: new Date().toISOString(),
        alGenedyIsolated: alGenedyExcluded,
        storesCount: funnels.length,
        stores: funnels.map((f) => ({
          slug: f.slug,
          brandName: f.brandName,
          productsCount: Array.isArray(f.products) ? f.products.length : 0,
        })),
        suppliers: {
          cj: providers.configured.cj ? "api_live" : "catalog_ready_whatsapp",
          knawat: providers.configured.knawat ? "api_live" : "catalog_ready_whatsapp",
          makhazen: providers.configured.makhazen ? "api_live" : "catalog_ready_whatsapp",
          taager: providers.configured.taager ? "api_live" : "catalog_ready_whatsapp",
          local_whatsapp: "whatsapp_ready",
          on_demand_workshop: "whatsapp_ready",
        },
        carriers: {
          bosta: providers.configured.bosta ? "api_live" : "manual_waybill_ready",
          oto: providers.configured.oto ? "api_live" : "manual_waybill_ready",
          aramex: providers.configured.aramex ? "api_live" : "manual_waybill_ready",
          cj_auto: providers.configured.cj ? "api_live" : "catalog_ready_whatsapp",
          whatsappEngine: {
            connected: whatsappEngineConnected,
            httpStatus: agentStatus,
            latencyMs: agentLatencyMs,
          },
          webhooksConfigured: {
            bostaSecret: Boolean((process.env.BOSTA_WEBHOOK_SECRET || "").trim()),
            otoSecret: Boolean((process.env.OTO_WEBHOOK_SECRET || "").trim()),
            cjSecret: Boolean((process.env.CJ_WEBHOOK_SECRET || "").trim()),
          },
        },
        settlement: computeCodSettlementSummary(),
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Readiness check failed" });
    }
  });

  app.post("/api/dropshipping/e2e-selftest", async (req: Request, res: Response) => {
    if (!(await authorizeDropshippingAdmin(req))) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const checks: Array<{ step: string; ok: boolean; detail: string }> = [];
    const ordersBackup = loadDropshippingOrders();
    try {
      const store = loadDropshippingFunnels().find((f) => f.slug === "captaincar-eg");
      if (!store) {
        return res.status(404).json({ ok: false, error: "Primary commercial store captaincar-eg not found" });
      }
      const taagerItem = store.products.find((p) => p.supplierProvider === "taager") || store.products[0];
      const cjItem = store.products.find((p) => p.supplierProvider === "cj") || store.products[1] || store.products[0];

      // Step 1: Multi-supplier split-order routing
      const refCode = `SELFTEST-${Date.now().toString().slice(-6)}`;
      const split = buildSplitSubOrders({
        refCode,
        store,
        shippingFeeEgp: 60,
        items: [
          { productId: taagerItem.id, productName: taagerItem.name, qty: 1, unitPriceEgp: taagerItem.sellingPriceEgp },
          { productId: cjItem.id, productName: cjItem.name, qty: 1, unitPriceEgp: cjItem.sellingPriceEgp },
        ],
      });
      const step1Ok = split.subOrders.length >= 1 && split.totalSellingEgp > 0;
      checks.push({
        step: "split_order_routing",
        ok: step1Ok,
        detail: `subOrders=${split.subOrders.length}, carriers=${split.subOrders.map((s) => s.carrierProvider).join(",")}`,
      });

      // Step 2: Zero selling price leakage check on supplier dispatch message
      const dispatchText = buildZeroPriceSubOrderDispatchText(
        {
          refCode,
          customerName: "SELFTEST عميل",
          customerPhone: "01000000000",
          governorate: "القاهرة",
          address: "مدينة نصر",
        },
        split.subOrders[0]
      );
      const step2Ok =
        dispatchText.includes(refCode) &&
        !dispatchText.includes(String(taagerItem.sellingPriceEgp)) &&
        !dispatchText.includes(String(split.subOrders[0].codCollectionEgp));
      checks.push({
        step: "zero_price_supplier_dispatch",
        ok: step2Ok,
        detail: step2Ok ? "Customer/SKU present, selling & COD prices redacted" : "Dispatch text validation failed",
      });

      // Step 3: Temporary COD order lifecycle + webhook settlement + full cleanup
      const testSubOrders = split.subOrders.map((s, idx) => ({
        ...s,
        trackingNumber: `TEST-TRK-${Date.now()}-${idx}`,
        status: "dispatched_to_supplier" as DropshippingOrderStatus,
      }));
      const tempOrder: DropshippingOrder = {
        id: `selftest_${Date.now()}`,
        refCode,
        funnelSlug: store.slug,
        brandName: store.brandName,
        agentBrandId: store.agentBrandId || "tito_media",
        productName: `[SELFTEST] ${taagerItem.name}`,
        qty: 2,
        bundleLabel: "E2E Selftest",
        sellingPriceEgp: split.totalSellingEgp,
        shippingFeeEgp: 60,
        totalCodEgp: split.totalSellingEgp + 60,
        supplierCostTotalEgp: split.totalSupplierCostEgp,
        adSpendEgp: 85,
        netProfitEgp: split.totalSellingEgp - split.totalSupplierCostEgp - 85,
        customerName: "SELFTEST",
        customerPhone: "01000000000",
        governorate: "القاهرة",
        address: "Selftest Address",
        supplierWhatsapp: testSubOrders[0]?.supplierWhatsapp || "01013372674",
        status: "dispatched_to_supplier",
        whatsappConfirmed: true,
        carrierProvider: testSubOrders[0]?.carrierProvider || "bosta",
        subOrders: testSubOrders,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveDropshippingOrders([tempOrder, ...ordersBackup]);

      for (const s of testSubOrders) {
        applyCarrierWebhookUpdate({
          carrier: s.carrierProvider,
          trackingNumber: s.trackingNumber,
          rawState: "delivered",
        });
      }
      const afterOrder = loadDropshippingOrders().find((o) => o.id === tempOrder.id);
      const step3Ok = Boolean(afterOrder && afterOrder.status === "delivered");
      const settlement = computeCodSettlementSummary();
      checks.push({
        step: "carrier_webhook_and_settlement",
        ok: step3Ok && typeof settlement.netRealizedProfitEgp === "number",
        detail: `orderStatus=${afterOrder?.status}, netRealizedProfitEgp=${settlement.netRealizedProfitEgp}`,
      });

      // Step 4: Live T2 Agent WhatsApp gateway reachability
      let step4Ok = false;
      let agentHttp = 0;
      try {
        const probe = await fetch(`${getT2AgentBaseUrl()}/api/system/health`, {
          signal: AbortSignal.timeout(4000),
        });
        agentHttp = probe.status;
        step4Ok = probe.ok;
      } catch {}
      checks.push({
        step: "whatsapp_agent_health",
        ok: step4Ok,
        detail: `agentHttp=${agentHttp}`,
      });

      const passedSteps = checks.filter((c) => c.ok).length;
      return res.json({
        ok: passedSteps === checks.length,
        passedSteps,
        totalSteps: checks.length,
        checks,
        cleanedUp: true,
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Selftest failed", checks });
    } finally {
      saveDropshippingOrders(ordersBackup);
    }
  });
}
