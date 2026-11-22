import type { Express, Request, Response } from "express";
import {
  buildZeroPriceSupplierDispatchText,
  calculateCodProfitability,
  computeCodSettlementSummary,
  dispatchOrderToBosta,
  formatEgyptWhatsappIntl,
  loadDropshippingFunnels,
  loadDropshippingOrders,
  saveDropshippingOrders,
  upsertDropshippingFunnel,
  type DropshippingFunnel,
  type DropshippingOrder,
  type DropshippingOrderStatus,
} from "../services/dropshippingEngineService";
import { recordLiveEvent } from "../services/liveTelemetryService";
import { t2AgentApi } from "../services/t2AgentApiClient";
import { verifyAdminRequest } from "../services/serverAdminAuth";

function escapeHtml(s: any): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSameOriginOrLocal(req: Request): boolean {
  const fetchSite = String(req.headers["sec-fetch-site"] || "");
  if (fetchSite === "same-origin") return true;
  const host = String(req.headers.host || "");
  const origin = String(req.headers.origin || "");
  const referer = String(req.headers.referer || "");
  if (host && (origin.includes(host) || referer.includes(host))) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(origin || referer)) return true;
  return false;
}

const EGYPT_GOVS = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الدقهلية",
  "الشرقية",
  "الغربية",
  "المنوفية",
  "البحيرة",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "أسوان",
  "الأقصر",
  "الإسماعيلية",
  "السويس",
  "بورسعيد",
  "دمياط",
  "كفر الشيخ",
  "البحر الأحمر",
  "مطروح",
];

function renderCodFunnelHtml(funnel: DropshippingFunnel): string {
  const tierCards = funnel.tiers
    .map(
      (tier, i) => `
      <label class="tier-card ${i === 1 ? "active" : ""}" data-qty="${tier.qty}">
        <input type="radio" name="qty" value="${tier.qty}" ${i === 1 ? "checked" : ""} />
        <div class="tier-top">
          <div>
            <div class="tier-title">${escapeHtml(tier.label)}</div>
            <div class="tier-ship">${tier.freeShipping ? "✅ شحن مجاني لباب البيت" : `+ ${funnel.shippingCostEgp} ج.م مصاريف شحن`}</div>
          </div>
          <div class="tier-right">
            ${tier.badge ? `<span class="badge">${escapeHtml(tier.badge)}</span>` : ""}
            <div class="price">${tier.sellingPriceEgp.toLocaleString("ar-EG")} ج.م</div>
          </div>
        </div>
      </label>`
    )
    .join("");

  const highlightsHtml = (funnel.highlights || [])
    .map((h) => `<li><span>✓</span> ${escapeHtml(h)}</li>`)
    .join("");

  const govOptions = EGYPT_GOVS.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(funnel.productName)} | ${escapeHtml(funnel.brandName)}</title>
  <meta name="description" content="${escapeHtml(funnel.tagline)}" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; font-family: 'Cairo', sans-serif; }
    body { margin: 0; background: #070b14; color: #f8fafc; line-height: 1.5; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 16px 14px 56px; }
    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 16px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.35); margin-bottom: 14px; font-size: 13px; font-weight: 800; }
    .hero { background: linear-gradient(145deg, #0f172a, #090e1c); border: 1px solid rgba(56,189,248,0.28); border-radius: 22px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.45); }
    .hero-img { width: 100%; max-height: 280px; object-fit: cover; display: block; background: #111827; }
    .hero-body { padding: 18px; }
    .pill { display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(245,158,11,0.18); border: 1px solid rgba(245,158,11,0.45); color: #fcd34d; font-size: 11px; font-weight: 800; margin-bottom: 8px; }
    h1 { margin: 0 0 6px; font-size: 22px; font-weight: 900; color: #ffffff; }
    .sub { margin: 0 0 12px; font-size: 13px; color: #94a3b8; }
    ul.bullets { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; font-size: 13px; }
    ul.bullets li span { color: #10b981; font-weight: 900; margin-left: 6px; }
    .card { background: #0f172a; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 18px; margin-bottom: 16px; }
    .sec-title { font-size: 15px; font-weight: 900; margin: 0 0 12px; color: #38bdf8; }
    .tiers { display: grid; gap: 10px; }
    .tier-card { display: block; padding: 13px 14px; border-radius: 14px; border: 2px solid rgba(255,255,255,0.12); background: rgba(2,6,23,0.65); cursor: pointer; transition: 0.15s; }
    .tier-card.active { border-color: #10b981; background: rgba(16,185,129,0.12); box-shadow: 0 0 24px rgba(16,185,129,0.18); }
    .tier-card input { display: none; }
    .tier-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .tier-title { font-weight: 900; font-size: 14px; color: #fff; }
    .tier-ship { font-size: 11px; color: #34d399; font-weight: 700; margin-top: 2px; }
    .tier-right { text-align: left; }
    .badge { display: inline-block; background: #f59e0b; color: #000; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 999px; margin-bottom: 3px; }
    .price { font-size: 17px; font-weight: 900; color: #fde047; }
    .field { margin-bottom: 11px; }
    label.lbl { display: block; font-size: 12px; font-weight: 800; color: #cbd5e1; margin-bottom: 4px; }
    input, select, textarea { width: 100%; padding: 11px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.16); background: #020617; color: #ffffff; font-size: 14px; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #10b981; }
    .summary-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 12px; background: rgba(2,6,23,0.85); border: 1px dashed rgba(16,185,129,0.5); margin: 12px 0; font-size: 14px; font-weight: 900; }
    .btn { width: 100%; padding: 14px; border: 0; border-radius: 14px; background: linear-gradient(90deg, #10b981, #059669); color: #022c22; font-size: 16px; font-weight: 900; cursor: pointer; box-shadow: 0 10px 30px rgba(16,185,129,0.3); }
    .btn:disabled { opacity: 0.6; cursor: wait; }
    .success-box { display: none; background: rgba(16,185,129,0.12); border: 2px solid #10b981; border-radius: 18px; padding: 18px; text-align: center; }
    .wa-btn { display: inline-block; margin-top: 12px; padding: 11px 18px; border-radius: 12px; background: #22c55e; color: #022c22; text-decoration: none; font-weight: 900; font-size: 14px; }
    .err { color: #fb7185; font-size: 13px; font-weight: 800; margin-top: 8px; display: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <span>🔥 ${escapeHtml(funnel.brandName)}</span>
      <span>🚚 الدفع عند الاستلام + معاينة قبل الدفع</span>
    </div>

    <div class="hero">
      ${funnel.heroImageUrl ? `<img class="hero-img" src="${escapeHtml(funnel.heroImageUrl)}" alt="${escapeHtml(funnel.productName)}" />` : ""}
      <div class="hero-body">
        <span class="pill">⚡ عرض حصري حتى نفاد الكمية</span>
        <h1>${escapeHtml(funnel.productName)}</h1>
        <p class="sub">${escapeHtml(funnel.tagline)}</p>
        <ul class="bullets">${highlightsHtml}</ul>
      </div>
    </div>

    <form id="codForm" class="card">
      <h2 class="sec-title">1. اختر العرض والكمية المناسبة (الأكثر توفيراً: قطعتين)</h2>
      <div class="tiers" id="tiersContainer">${tierCards}</div>

      <h2 class="sec-title" style="margin-top: 18px;">2. بيانات التوصيل السريع (بدون تسجيل حساب)</h2>
      <div class="field">
        <label class="lbl">الاسم بالكامل *</label>
        <input type="text" name="customerName" required placeholder="مثال: أحمد محمود" />
      </div>
      <div class="field">
        <label class="lbl">رقم الموبايل (عليه واتساب لتأكيد الأوردر) *</label>
        <input type="tel" name="customerPhone" required dir="ltr" placeholder="01012345678" />
      </div>
      <div class="field">
        <label class="lbl">المحافظة *</label>
        <select name="governorate" required>${govOptions}</select>
      </div>
      <div class="field">
        <label class="lbl">العنوان بالتفصيل (الحي / الشارع / أقرب علامة مميزة) *</label>
        <textarea name="address" rows="2" required placeholder="مدينة نصر - شارع عباس العقاد - عمارة 14"></textarea>
      </div>

      <div class="summary-bar">
        <span>الإجمالي المستحق عند الاستلام:</span>
        <span id="codTotalText" style="color:#fde047;">-- ج.م</span>
      </div>

      <button type="submit" id="submitBtn" class="btn">✅ اطلب الآن — الدفع عند الاستلام</button>
      <div id="errBox" class="err"></div>
    </form>

    <div id="successBox" class="success-box">
      <div style="font-size:28px;">🎉</div>
      <h2 style="margin:6px 0;color:#34d399;">تم استلام طلبك بنجاح!</h2>
      <p id="orderSummaryText" style="font-size:13px;color:#e2e8f0;"></p>
      <a id="waConfirmLink" class="wa-btn" target="_blank" rel="noopener">💬 تأكيد الطلب فوراً على واتساب (واحصل على خصم 30% للقطعة الإضافية)</a>
    </div>
  </div>

  <script>
    (function () {
      const tiers = ${JSON.stringify(funnel.tiers)};
      const shippingBase = ${Number(funnel.shippingCostEgp || 65)};
      const slug = ${JSON.stringify(funnel.slug)};
      const totalEl = document.getElementById('codTotalText');
      const form = document.getElementById('codForm');
      const errBox = document.getElementById('errBox');
      const btn = document.getElementById('submitBtn');
      const successBox = document.getElementById('successBox');

      function updateTotal() {
        const checked = document.querySelector('input[name="qty"]:checked');
        const q = Number(checked ? checked.value : 2);
        const tier = tiers.find(t => t.qty === q) || tiers[0];
        document.querySelectorAll('.tier-card').forEach(el => {
          el.classList.toggle('active', Number(el.dataset.qty) === q);
        });
        const ship = tier.freeShipping ? 0 : shippingBase;
        totalEl.textContent = (tier.sellingPriceEgp + ship).toLocaleString('ar-EG') + ' ج.م';
      }

      document.querySelectorAll('input[name="qty"]').forEach(r => r.addEventListener('change', updateTotal));
      updateTotal();

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errBox.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'جاري تسجيل الطلب وتأكيده...';
        try {
          const fd = new FormData(form);
          const resp = await fetch('/api/dropshipping/public/' + encodeURIComponent(slug) + '/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qty: Number(fd.get('qty') || 2),
              customerName: fd.get('customerName'),
              customerPhone: fd.get('customerPhone'),
              governorate: fd.get('governorate'),
              address: fd.get('address'),
            })
          });
          const data = await resp.json();
          if (!resp.ok || !data.ok) throw new Error(data.error || 'تعذر تسجيل الطلب');
          form.style.display = 'none';
          successBox.style.display = 'block';
          document.getElementById('orderSummaryText').textContent =
            'رقم الطلب المرجعي: ' + data.order.refCode + ' — الإجمالي عند الاستلام: ' + data.order.totalCodEgp + ' ج.م. يتواصل معك تيتو أجنت على واتساب لتأكيد موعد المندوب.';
          document.getElementById('waConfirmLink').href = data.whatsappConfirmUrl;
        } catch (err) {
          errBox.textContent = err.message || 'حدث خطأ، حاول مرة أخرى';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = '✅ اطلب الآن — الدفع عند الاستلام';
        }
      });
    })();
  </script>
</body>
</html>`;
}

export function registerDropshippingRoutes(app: Express): void {
  // 1) High-Converting Mobile-First One-Page COD Landing Funnel
  app.get("/drop/:slug", (req: Request, res: Response) => {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    const funnels = loadDropshippingFunnels();
    const funnel = funnels.find((f) => f.slug.toLowerCase() === slug) || funnels[0];
    if (!funnel) {
      return res.status(404).send("<h2 dir='rtl'>صفحة العرض غير متوفرة</h2>");
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(renderCodFunnelHtml(funnel));
  });

  // 2) Public COD Order Intake + Non-Blocking T2 Agent Confirmation + Telemetry
  app.post("/api/dropshipping/public/:slug/orders", async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug || "").trim().toLowerCase();
      const funnels = loadDropshippingFunnels();
      const funnel = funnels.find((f) => f.slug.toLowerCase() === slug);
      if (!funnel) {
        return res.status(404).json({ ok: false, error: "العرض غير موجود" });
      }

      const { qty = 1, customerName, customerPhone, governorate = "القاهرة", address, notes } = req.body || {};
      if (!String(customerName || "").trim() || !String(customerPhone || "").trim() || !String(address || "").trim()) {
        return res.status(400).json({ ok: false, error: "يرجى إدخال الاسم ورقم الموبايل والعنوان بالتفصيل" });
      }

      const numQty = Math.max(1, Number(qty) || 1);
      const tier = funnel.tiers.find((t) => t.qty === numQty) || funnel.tiers[0];
      const sellingPriceEgp = tier ? Number(tier.sellingPriceEgp) : funnel.tiers[0].sellingPriceEgp * numQty;
      const shippingFeeEgp = tier?.freeShipping ? 0 : Number(funnel.shippingCostEgp || 65);
      const totalCodEgp = sellingPriceEgp + shippingFeeEgp;
      const supplierCostTotalEgp = Number(funnel.supplierCostPerUnitEgp || 220) * (tier?.qty || numQty);
      const adSpendEgp = Number(funnel.cpaAdCostEgp || 85);
      const netProfitEgp = Math.round(
        totalCodEgp - supplierCostTotalEgp - Number(funnel.shippingCostEgp || 65) - adSpendEgp
      );

      const nowIso = new Date().toISOString();
      const refCode = `DRP-${Date.now().toString().slice(-6)}`;
      const order: DropshippingOrder = {
        id: `drp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        refCode,
        funnelSlug: funnel.slug,
        brandName: funnel.brandName,
        agentBrandId: funnel.agentBrandId || "tito_media",
        productName: funnel.productName,
        qty: tier?.qty || numQty,
        bundleLabel: tier?.label || `${numQty} قطعة`,
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
        supplierWhatsapp: funnel.supplierWhatsapp,
        status: "pending_whatsapp_confirm",
        whatsappConfirmed: false,
        bostaTrackingNumber: null,
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
          summary: `طلب دروبشيبنج COD (${order.refCode}): ${order.productName} × ${order.qty} — ${order.totalCodEgp} ج.م`,
        });
      } catch {}

      const confirmMsg =
        `أهلاً بك يا ${order.customerName} في ${funnel.brandName} 🌟\n` +
        `تم تسجيل طلبك (${order.refCode}): ${order.productName} (${order.bundleLabel}).\n` +
        `الإجمالي عند الاستلام: ${order.totalCodEgp} ج.م — المحافظة: ${order.governorate}.\n` +
        `يرجى الرد بـ "تأكيد" لشحن الطلب فوراً عبر بوسطة، وهل تحب إضافة قطعة إضافية بخصم 30% وشحن مجاني؟ 🎁`;

      // Non-blocking T2 Agent confirmation message
      t2AgentApi
        .sendManualReply(order.agentBrandId, order.customerPhone, confirmMsg)
        .catch(() => {});

      const agentFallbackWa = `https://wa.me/${formatEgyptWhatsappIntl(funnel.supplierWhatsapp)}?text=${encodeURIComponent(
        `أؤكد طلبي رقم ${order.refCode} - ${order.productName} (${order.qty} قطعة) - ${order.customerName} - ${order.governorate}`
      )}`;

      return res.json({
        ok: true,
        order,
        whatsappConfirmUrl: agentFallbackWa,
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Order intake failed" });
    }
  });

  // 3) COD Profitability Calculator + Settlement Board API
  app.get("/api/dropshipping/settlement", (_req: Request, res: Response) => {
    const funnels = loadDropshippingFunnels();
    const orders = loadDropshippingOrders();
    const summary = computeCodSettlementSummary();
    res.json({ ok: true, summary, funnels, orders });
  });

  app.post("/api/dropshipping/calculate-profit", (req: Request, res: Response) => {
    const calc = calculateCodProfitability(req.body || {});
    res.json({ ok: true, economics: calc });
  });

  app.post("/api/dropshipping/funnels", async (req: Request, res: Response) => {
    try {
      if (!isSameOriginOrLocal(req)) {
        const auth = await verifyAdminRequest(req);
        if (!auth.ok) return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const b = req.body || {};
      const rawSlug = String(b.slug || b.productName || `drop-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `drop-${Date.now().toString().slice(-5)}`;

      const basePrice = Math.max(150, Number(b.sellingPriceEgp) || 690);
      const supplierUnit = Math.max(50, Number(b.supplierCostPerUnitEgp) || Math.round(basePrice * 0.42));
      const funnel: DropshippingFunnel = {
        slug: rawSlug,
        brandName: String(b.brandName || "متجر T2OS السريع").trim(),
        agentBrandId: String(b.agentBrandId || "tito_media").trim(),
        productName: String(b.productName || "المنتج الرابح").trim(),
        tagline: String(b.tagline || "شحن سريع 1–3 أيام والدفع عند الاستلام بعد المعاينة").trim(),
        heroImageUrl: b.heroImageUrl || "/al-genedy/images/hero_led_screen.jpg",
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
        funnelUrl: `/drop/${encodeURIComponent(saved.slug)}`,
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Failed saving funnel" });
    }
  });

  // 4) Zero-Price Supplier Dispatch & Optional Bosta Waybill Creation
  app.post("/api/dropshipping/orders/:orderId/confirm-and-dispatch", async (req: Request, res: Response) => {
    try {
      if (!isSameOriginOrLocal(req)) {
        const auth = await verifyAdminRequest(req);
        if (!auth.ok) return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const orderId = String(req.params.orderId || "").trim();
      const orders = loadDropshippingOrders();
      const idx = orders.findIndex((o) => o.id === orderId || o.refCode === orderId);
      if (idx < 0) return res.status(404).json({ ok: false, error: "Order not found" });

      const order = orders[idx];
      const dispatch = await dispatchOrderToBosta(order);
      order.whatsappConfirmed = true;
      order.status = "dispatched_to_supplier";
      order.dispatchMode = dispatch.mode;
      order.bostaTrackingNumber = dispatch.trackingNumber;
      order.dispatchedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();

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
  });

  // 5) Settlement Status Transition (Confirmed / Delivered / Returned + Ad Spend Adjustment)
  app.post("/api/dropshipping/orders/:orderId/status", async (req: Request, res: Response) => {
    try {
      if (!isSameOriginOrLocal(req)) {
        const auth = await verifyAdminRequest(req);
        if (!auth.ok) return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const orderId = String(req.params.orderId || "").trim();
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
        orders[idx].status = nextStatus;
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

  // 6) Bosta Live Delivery Webhook
  app.post("/api/webhooks/bosta", (req: Request, res: Response) => {
    try {
      const secret = (process.env.BOSTA_WEBHOOK_SECRET || "").trim();
      if (secret && String(req.headers["x-bosta-secret"] || "") !== secret) {
        return res.status(403).json({ ok: false, error: "Invalid Bosta webhook secret" });
      }

      const body = req.body || {};
      const tracking = String(body.trackingNumber || body._id || "").trim();
      const bizRef = String(body.businessReference || body.orderId || "").trim();
      const rawState = String(body.state || body.status || "").toLowerCase();

      const orders = loadDropshippingOrders();
      const idx = orders.findIndex(
        (o) => (tracking && o.bostaTrackingNumber === tracking) || (bizRef && (o.refCode === bizRef || o.id === bizRef))
      );
      if (idx >= 0) {
        if (/deliver|45|completed/i.test(rawState)) {
          orders[idx].status = "delivered";
        } else if (/return|46|cancel|terminated/i.test(rawState)) {
          orders[idx].status = "returned";
        }
        orders[idx].updatedAt = new Date().toISOString();
        saveDropshippingOrders(orders);
      }

      return res.json({ ok: true, matched: idx >= 0 });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });
}
