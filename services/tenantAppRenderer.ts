export type TenantAppTemplate = 'products_erp' | 'services_booking';
import { resolveBrandAppAccessMode } from './saasPlansService';

export function resolveBrandTemplate(brand: any): TenantAppTemplate {
  const slugLower = String(brand?.slug || brand?.id || '').toLowerCase();
  if (slugLower === 'auto-house' || slugLower.includes('auto_house')) {
    return 'products_erp';
  }
  if (brand?.appTemplate === 'products_erp' || brand?.appTemplate === 'services_booking') {
    return brand.appTemplate;
  }
  const text = `${brand?.businessType || ''} ${brand?.industry || ''} ${brand?.name || ''}`.toLowerCase();
  const productKeywords = [
    'متجر', 'تجارة', 'أزياء', 'ملابس', 'منتج', 'مبيعات', 'بيع', 'إلكترونيات', 'قطع غيار',
    'سوبرماركت', 'مطعم', 'كافيه', 'أثاث', 'مفروشات', 'إكسسوار', 'store', 'shop', 'ecommerce', 'pos', 'retail', 'parts'
  ];
  return productKeywords.some((kw) => text.includes(kw)) ? 'products_erp' : 'services_booking';
}

export function buildFlagshipTenantUrl(slug: string, appTemplate: TenantAppTemplate | string): string {
  const cleanSlug = String(slug || 'app')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app';

  const isProducts = appTemplate === 'products_erp';
  const wildcardDomain = isProducts
    ? (process.env.BATTAH_WILDCARD_DOMAIN || '').trim()
    : (process.env.CLEAN_MASTER_WILDCARD_DOMAIN || '').trim();

  if (wildcardDomain) {
    const cleanDomain = wildcardDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    return `https://${cleanSlug}.${cleanDomain}`;
  }

  const baseUrl = (isProducts
    ? (process.env.BATTAH_MULTI_TENANT_URL || 'https://store.t2os.app')
    : (process.env.CLEAN_MASTER_MULTI_TENANT_URL || 'https://book.t2os.app')
  ).replace(/\/$/, '');
  const routePrefix = isProducts ? 's' : 'b';
  return `${baseUrl}/${routePrefix}/${encodeURIComponent(cleanSlug)}`;
}

function escapeHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBrandCatalog(brand: any, template: TenantAppTemplate) {
  if (Array.isArray(brand?.productsCatalog) && brand.productsCatalog.length > 0) {
    return brand.productsCatalog;
  }
  if (template === 'products_erp') {
    return [
      { id: 'prod_1', name: `منتج مميز — ${brand.name}`, price: '450 ج.م', numericPrice: 450, stock: 25, category: 'الأكثر مبيعاً', description: 'جودة عالية مع ضمان استبدال وشحن سريع' },
      { id: 'prod_2', name: `باقة التوفير العائلية`, price: '890 ج.م', numericPrice: 890, stock: 14, category: 'العروض', description: 'تشكيلة مختارة بخصم 15% لفترة محدودة' },
      { id: 'prod_3', name: `إصدار VIP المحدود`, price: '1,350 ج.م', numericPrice: 1350, stock: 8, category: 'VIP', description: 'تغليف فاخر وتوصيل مجاني حتى باب المنزل' }
    ];
  }
  return [
    { id: 'srv_1', name: `الخدمة الأساسية من ${brand.name}`, price: '650 ج.م', numericPrice: 650, duration: '60 دقيقة', description: 'تنفيذ احترافي بأعلى معايير الجودة والضمان' },
    { id: 'srv_2', name: `باقة الصيانة والعناية المتكاملة`, price: '1,200 ج.م', numericPrice: 1200, duration: '90 دقيقة', description: 'زيارة شاملة مع تقرير فني ومتابعة دورية' },
    { id: 'srv_3', name: `باقة VIP السريعة`, price: '1,800 ج.م', numericPrice: 1800, duration: '120 دقيقة', description: 'أولوية قصوى في التنفيذ وفريق متخصص' }
  ];
}

export function renderTenantAppHtml(brand: any): string {
  const template = resolveBrandTemplate(brand);
  const catalog = getBrandCatalog(brand, template);
  const cleanPhone = String(brand?.phone || '01013373634').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
  const primary = brand?.primaryColor || (template === 'products_erp' ? '#06b6d4' : '#10b981');
  const slug = encodeURIComponent(brand?.slug || brand?.id || 'app');
  const logoHtml = brand?.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.name)}" style="width:68px;height:68px;border-radius:18px;object-fit:cover;border:2px solid ${primary};margin:0 auto 10px;display:block;background:#0f172a;" />`
    : `<div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,${primary},#3b82f6);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#020617;margin:0 auto 10px;">${escapeHtml((brand?.name || 'T2').slice(0, 2))}</div>`;

  const publicBase = (process.env.PUBLIC_BASE_URL || 'https://t2os.app').replace(/\/+$/, '');
  const canonicalUrl = brand?.appUrl || brand?.vercelUrl || brand?.liveUrl || `${publicBase}/app/${slug}`;
  const seoTitle = `${brand.name} | ${brand?.slogan || (template === 'products_erp' ? 'المتجر الإلكتروني المعتمد والطلب الفوري' : 'الخدمات المعتمدة وحجز المواعيد أونلاين')}`;
  const seoDesc = brand?.directKnowledge || `${brand.name} — ${brand?.businessType || (template === 'products_erp' ? 'متجر إلكتروني' : 'مركز خدمات')} في ${brand?.address || 'مصر'}. تصفح الكتالوج والأسعار واطلب أو احجز مباشرة عبر الويب أو واتساب ${brand?.phone || ''}.`;
  const keywords = [
    brand.name,
    brand?.businessType,
    brand?.address,
    template === 'products_erp' ? 'متجر إلكتروني, تسوق أونلاين, أسعار, طلب فوري' : 'حجز مواعيد, خدمات معتمدة, أسعار',
    ...catalog.slice(0, 6).map((c: any) => c?.name).filter(Boolean)
  ].filter(Boolean).join(', ');

  const initialChar = escapeHtml((brand?.name || 'T').trim().slice(0, 1) || 'T');
  const svgFavicon = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${primary}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="34" fill="#ffffff">${initialChar}</text></svg>`)}`;
  const faviconHref = brand?.logoUrl ? escapeHtml(brand.logoUrl) : svgFavicon;
  const ogImage = brand?.logoUrl ? escapeHtml(brand.logoUrl) : 'https://i.ibb.co/fYp5VRYb/1000053833.jpg';

  const offerItems = catalog.slice(0, 10).map((item: any) => ({
    '@type': 'Offer',
    name: item?.name || 'خدمة/منتج',
    price: Number(item?.numericPrice || item?.sellingPrice || String(item?.price || '').replace(/[^\d.]/g, '')) || 0,
    priceCurrency: 'EGP',
    availability: 'https://schema.org/InStock',
    description: item?.description || ''
  }));

  const geoJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': template === 'products_erp' ? 'Store' : 'LocalBusiness',
        name: brand.name,
        description: seoDesc,
        url: canonicalUrl,
        image: ogImage,
        telephone: brand?.phone || '',
        address: brand?.address ? { '@type': 'PostalAddress', streetAddress: brand.address, addressCountry: 'EG' } : undefined,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: `كتالوج ${brand.name}`,
          itemListElement: offerItems
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `ما هي خدمات ومنتجات ${brand.name}؟`,
            acceptedAnswer: { '@type': 'Answer', text: seoDesc }
          },
          {
            '@type': 'Question',
            name: `كيف أتواصل أو أطلب من ${brand.name}؟`,
            acceptedAnswer: { '@type': 'Answer', text: `يمكنك الطلب مباشرة من التطبيق على ${canonicalUrl} أو عبر واتساب على الرقم ${brand?.phone || 'المتاح في التطبيق'}.` }
          }
        ]
      }
    ]
  }).replace(/</g, '\\u003c');

  const commonHead = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDesc)}" />
  <meta name="keywords" content="${escapeHtml(keywords)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="theme-color" content="${escapeHtml(primary)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="alternate" hreflang="ar-EG" href="${escapeHtml(canonicalUrl)}" />
  <link rel="icon" href="${faviconHref}" />
  <link rel="apple-touch-icon" href="${faviconHref}" />

  <!-- Open Graph / Social Sharing -->
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ar_EG" />
  <meta property="og:site_name" content="${escapeHtml(brand.name)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="${escapeHtml(seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(seoDesc)}" />
  <meta property="og:image" content="${ogImage}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(seoTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(seoDesc)}" />
  <meta name="twitter:image" content="${ogImage}" />

  <!-- GEO (Generative Engine Optimization) JSON-LD -->
  <script type="application/ld+json">${geoJsonLd}</script>
  ${brand?.metaPixelId ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${escapeHtml(brand.metaPixelId)}');fbq('track','PageView');</script>` : ''}
  ${brand?.tiktokPixelId ? `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${escapeHtml(brand.tiktokPixelId)}');ttq.page()}(window,document,'ttq');</script>` : ''}
  ${brand?.googleTagId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(brand.googleTagId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${escapeHtml(brand.googleTagId)}');</script>` : ''}

  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <style>
    :root { --primary: ${primary}; }
    * { box-sizing: border-box; }
    body { margin:0; padding:16px; background:#030712; color:#f8fafc; font-family:'Cairo',sans-serif; text-align:right; }
    .container { max-width:720px; margin:0 auto; padding-bottom:48px; }
    .topbar { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:14px; }
    .admin-link { text-decoration:none; font-size:12px; font-weight:800; color:#cbd5e1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14); padding:7px 12px; border-radius:12px; }
    .header { text-align:center; padding:24px 18px; background:linear-gradient(180deg,rgba(6,182,212,0.12),rgba(15,23,42,0.75)); border:1px solid rgba(255,255,255,0.12); border-radius:24px; margin-bottom:18px; }
    .badge { display:inline-block; padding:4px 12px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); color:#34d399; border-radius:20px; font-size:11px; font-weight:800; margin-bottom:8px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:12px; }
    .card { background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:15px; display:flex; flex-direction:column; justify-content:space-between; gap:10px; transition:all .2s; }
    .card:hover, .card.active { border-color:var(--primary); background:rgba(15,23,42,0.98); transform:translateY(-2px); }
    .box { background:rgba(15,23,42,0.92); border:1px solid rgba(56,189,248,0.28); border-radius:22px; padding:18px; margin-top:18px; }
    .input { width:100%; background:#020617; border:1px solid rgba(255,255,255,0.15); color:#fff; padding:11px 13px; border-radius:12px; font-family:'Cairo',sans-serif; font-size:13px; margin-bottom:10px; }
    .btn { width:100%; border:none; cursor:pointer; background:linear-gradient(90deg,var(--primary),#38bdf8); color:#020617; font-weight:900; padding:13px; border-radius:14px; font-family:'Cairo',sans-serif; font-size:14px; }
    .btn-sm { border:none; cursor:pointer; background:var(--primary); color:#020617; font-weight:900; padding:8px 12px; border-radius:10px; font-family:'Cairo',sans-serif; font-size:12px; }
    .btn-wa { display:block; width:100%; background:rgba(37,211,102,0.12); border:1px solid #25D366; color:#4ade80; font-weight:800; text-align:center; text-decoration:none; padding:12px; border-radius:14px; font-size:13px; margin-top:12px; }
    .slot { padding:8px 10px; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background:#020617; color:#cbd5e1; font-size:12px; font-weight:700; cursor:pointer; }
    .slot.active { background:var(--primary); color:#020617; border-color:var(--primary); font-weight:900; }
  </style>
</head>`;

  const accessMode = resolveBrandAppAccessMode(brand);
  if (accessMode === 'landing_page') {
    const landingItems = catalog.slice(0, 4).map((item: any) => `
      <div class="card">
        <div>
          <div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:4px;">${escapeHtml(item?.name || 'عرض مميز')}</div>
          <div style="font-size:12px;color:#94a3b8;line-height:1.6;">${escapeHtml(item?.description || '')}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <span style="font-size:14px;font-weight:900;color:var(--primary);">${escapeHtml(item?.price || (item?.numericPrice ? `${item.numericPrice} ج.م` : 'تواصل للسعر'))}</span>
          <a href="https://wa.me/${waNumber}?text=${encodeURIComponent(`مرحباً ${brand.name}، أرغب في الاستفسار عن: ${item?.name || 'العرض'}`)}" target="_blank" class="btn-sm" style="text-decoration:none;">اطلب عبر واتساب</a>
        </div>
      </div>`).join('');

    return `${commonHead}
<body>
  <div class="container">
    <div class="header">
      <div class="badge">صفحة هبوط تحويلية • Landing Page (باقة الانطلاق 2,500 ج.م)</div>
      ${logoHtml}
      <h1 style="margin:6px 0 4px;font-size:24px;font-weight:900;color:#fff;">${escapeHtml(brand.name)}</h1>
      <p style="margin:0;color:#cbd5e1;font-size:13.5px;line-height:1.7;">${escapeHtml(seoDesc)}</p>
      <a href="https://wa.me/${waNumber}?text=${encodeURIComponent(`مرحباً ${brand.name}، أريد حجز / طلب الآن`)}" target="_blank" class="btn-wa" style="margin-top:14px;">💬 تواصل وحجز فوري على واتساب</a>
    </div>
    <h3 style="margin:14px 2px 10px;font-size:15px;color:#e2e8f0;">أبرز العروض والخدمات</h3>
    <div class="grid">${landingItems}</div>
    <div class="box" style="text-align:center;">
      <div style="font-size:13px;font-weight:800;color:#38bdf8;margin-bottom:6px;">🚀 هل تريد فتح المتجر الكامل + سلة الشراء + فواتير ERP؟</div>
      <div style="font-size:12px;color:#94a3b8;line-height:1.6;">متاح تلقائياً عند الترقية إلى باقة النمو (5,000 ج.م) أو أعلى من لوحة T2OS.</div>
    </div>
  </div>
</body>
</html>`;
  }

  if (template === 'products_erp') {
    const productsJson = JSON.stringify(catalog).replace(/</g, '\\u003c');
    return `${commonHead}
<body>
  <div class="container">
    <div class="topbar">
      <span style="font-size:11px;color:#94a3b8;">🛒 قالب المتجر الذكي + ERP & CRM</span>
      <a class="admin-link" href="/app/${slug}/admin">🔐 لوحة تحكم التاجر (ERP / POS)</a>
    </div>
    <div class="header">
      ${logoHtml}
      <span class="badge">متجر إلكتروني تفاعلي • طلب فوري</span>
      <h1 style="margin:6px 0;font-size:24px;font-weight:900;">${escapeHtml(brand.name)}</h1>
      ${brand?.slogan ? `<p style="margin:0 0 6px;color:#38bdf8;font-size:13px;font-weight:800;">"${escapeHtml(brand.slogan)}"</p>` : ''}
      <p style="margin:0;color:#94a3b8;font-size:12px;">${escapeHtml(brand.directKnowledge || brand.businessType || 'تسوق أونلاين بأسعار مباشرة وتوصيل سريع')}</p>
    </div>

    <input id="searchBox" class="input" placeholder="🔍 ابحث عن منتج..." oninput="renderProducts()" />
    <div id="productsGrid" class="grid"></div>

    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h2 style="margin:0;font-size:16px;color:#38bdf8;">🛍️ سلة المشتريات وإتمام الطلب</h2>
        <span id="cartTotal" style="font-size:14px;font-weight:900;color:#34d399;">0 ج.م</span>
      </div>
      <div id="cartItems" style="font-size:12px;color:#94a3b8;margin-bottom:12px;">السلة فارغة — أضف منتجاتك من الأعلى</div>
      <input id="custName" class="input" placeholder="الاسم بالكامل" />
      <input id="custPhone" class="input" placeholder="رقم الموبايل / واتساب" />
      <input id="custAddress" class="input" placeholder="العنوان التفصيلي للتوصيل" />
      <button class="btn" id="orderBtn" onclick="submitOrder()">✅ تأكيد الطلب الآن وتسجيله في النظام</button>
      <div id="orderStatus" style="display:none;margin-top:12px;padding:12px;border-radius:12px;background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#34d399;font-size:13px;font-weight:800;text-align:center;"></div>
    </div>

    <a href="https://wa.me/${waNumber}?text=${encodeURIComponent(`أهلاً ${brand.name}، حابب أستفسر عن المنتجات`)}" class="btn-wa" target="_blank">💬 تواصل مع خدمة العملاء على واتساب (${escapeHtml(brand.phone || '')})</a>
  </div>

  <script>
    const PRODUCTS = ${productsJson};
    let cart = [];
    function parsePrice(p) {
      const n = Number(String(p.numericPrice ?? p.price ?? '0').replace(/[^0-9.]/g, ''));
      return Number.isFinite(n) && n > 0 ? n : 450;
    }
    function renderProducts() {
      const q = (document.getElementById('searchBox').value || '').trim().toLowerCase();
      const filtered = PRODUCTS.filter(p => !q || String(p.name).toLowerCase().includes(q) || String(p.description || '').toLowerCase().includes(q));
      document.getElementById('productsGrid').innerHTML = filtered.map((p, idx) => \`
        <div class="card">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:10px;color:#38bdf8;font-weight:800;">\${p.category || 'منتج'}</span>
              <span style="font-size:10px;color:#94a3b8;">متاح: \${p.stock ?? 15}</span>
            </div>
            <h3 style="margin:0 0 6px;font-size:15px;font-weight:800;">\${p.name}</h3>
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">\${p.description || ''}</p>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);">
            <span style="font-weight:900;color:#34d399;font-size:14px;">\${p.price || (parsePrice(p) + ' ج.م')}</span>
            <button class="btn-sm" onclick="addToCart(\${idx})">+ أضف للسلة</button>
          </div>
        </div>
      \`).join('');
    }
    function addToCart(idx) {
      const item = PRODUCTS[idx];
      if (!item) return;
      const existing = cart.find(c => c.id === (item.id || item.name));
      if (existing) existing.qty += 1;
      else cart.push({ id: item.id || item.name, name: item.name, price: parsePrice(item), qty: 1 });
      renderCart();
    }
    function removeFromCart(i) { cart.splice(i, 1); renderCart(); }
    function renderCart() {
      const box = document.getElementById('cartItems');
      const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
      document.getElementById('cartTotal').innerText = total + ' ج.م';
      if (!cart.length) { box.innerText = 'السلة فارغة — أضف منتجاتك من الأعلى'; return; }
      box.innerHTML = cart.map((c, i) => \`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#f8fafc;">
          <span>\${c.name} × \${c.qty}</span>
          <span>\${c.price * c.qty} ج.م <button onclick="removeFromCart(\${i})" style="background:none;border:none;color:#f87171;cursor:pointer;font-weight:900;">✕</button></span>
        </div>
      \`).join('');
    }
    async function submitOrder() {
      if (!cart.length) { alert('يرجى إضافة منتج واحد على الأقل للسلة'); return; }
      const customerName = document.getElementById('custName').value.trim();
      const customerPhone = document.getElementById('custPhone').value.trim();
      const address = document.getElementById('custAddress').value.trim();
      if (!customerName || !customerPhone) { alert('يرجى إدخال الاسم ورقم الموبايل'); return; }
      const btn = document.getElementById('orderBtn');
      const statusBox = document.getElementById('orderStatus');
      btn.disabled = true; btn.innerText = '⏳ جاري تسجيل الطلب...';
      try {
        const res = await fetch('/api/app/${slug}/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerName, customerPhone, address, items: cart })
        });
        const d = await res.json();
        statusBox.style.display = 'block';
        statusBox.innerHTML = d.ok ? '✅ تم تسجيل طلبك رقم #' + d.order.id + ' بنجاح! سيتواصل معك فريق المبيعات فوراً.' : ('❌ ' + (d.error || 'تعذر تسجيل الطلب'));
        if (d.ok) { cart = []; renderCart(); }
      } catch {
        statusBox.style.display = 'block';
        statusBox.innerText = '❌ حدث خطأ في الاتصال بالسيرفر';
      } finally {
        btn.disabled = false; btn.innerText = '✅ تأكيد الطلب الآن وتسجيله في النظام';
      }
    }
    renderProducts();
  </script>
</body></html>`;
  }

  // Services + Booking Calendar Template (inspired by clean-master-egy)
  const servicesHtml = catalog.map((p: any, idx: number) => `
    <div class="card ${idx === 0 ? 'active' : ''}" id="card-${idx}" onclick="selectService('${escapeHtml(p.name)}', '${escapeHtml(p.price || '650 ج.م')}', ${idx})" style="cursor:pointer;">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:10px;color:#34d399;font-weight:800;">⏱️ ${escapeHtml(p.duration || '60 دقيقة')}</span>
          <span style="font-weight:900;color:#34d399;font-size:14px;">${escapeHtml(p.price || '650 ج.م')}</span>
        </div>
        <h3 style="margin:0 0 6px;font-size:15px;font-weight:800;">${escapeHtml(p.name)}</h3>
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">${escapeHtml(p.description || '')}</p>
      </div>
    </div>
  `).join('');

  const todayStr = new Date().toISOString().split('T')[0];

  return `${commonHead}
<body>
  <div class="container">
    <div class="topbar">
      <span style="font-size:11px;color:#94a3b8;">📅 قالب الخدمات وتقويم الحجوزات</span>
      <a class="admin-link" href="/app/${slug}/admin">🔐 لوحة التحكم (التقويم والماليات)</a>
    </div>
    <div class="header">
      ${logoHtml}
      <span class="badge">تطبيق الحجز الذكي المباشر • PWA</span>
      <h1 style="margin:6px 0;font-size:24px;font-weight:900;">${escapeHtml(brand.name)}</h1>
      ${brand?.slogan ? `<p style="margin:0 0 6px;color:#34d399;font-size:13px;font-weight:800;">"${escapeHtml(brand.slogan)}"</p>` : ''}
      <p style="margin:0;color:#94a3b8;font-size:12px;">${escapeHtml(brand.directKnowledge || brand.businessType || 'احجز موعدك أونلاين في ثوانٍ')}</p>
    </div>

    <h2 style="font-size:15px;color:#38bdf8;margin-bottom:10px;">1. اختر الخدمة المطلوبة:</h2>
    <div class="grid">${servicesHtml}</div>

    <div class="box">
      <h2 style="font-size:15px;color:#34d399;margin:0 0 12px;">2. اختر التاريخ والموعد وأكّد الحجز:</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div>
          <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px;">التاريخ المفضل:</label>
          <input id="bookingDate" type="date" class="input" value="${todayStr}" style="margin:0;" />
        </div>
        <div>
          <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px;">الخدمة المختارة:</label>
          <input id="custService" class="input" readonly value="${escapeHtml(catalog[0]?.name || 'خدمة أساسية')}" style="margin:0;" />
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;" id="timeSlots">
        ${['10:00 ص', '12:00 م', '02:00 م', '04:00 م', '06:00 م', '08:00 م'].map((t, i) => `<button type="button" class="slot ${i === 2 ? 'active' : ''}" onclick="selectTime(this, '${t}')">${t}</button>`).join('')}
      </div>
      <input id="custPrice" type="hidden" value="${escapeHtml(catalog[0]?.price || '650 ج.م')}" />
      <input id="custName" class="input" placeholder="الاسم بالكامل" />
      <input id="custPhone" class="input" placeholder="رقم الموبايل / واتساب" />
      <input id="custAddress" class="input" placeholder="العنوان أو ملاحظات الحجز" />
      <button class="btn" id="submitBtn" onclick="submitBooking()">✅ تأكيد الحجز وإضافته للتقويم</button>
      <div id="bookingStatus" style="display:none;margin-top:12px;padding:12px;border-radius:12px;background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#34d399;font-size:13px;font-weight:800;text-align:center;"></div>
    </div>

    <a href="https://wa.me/${waNumber}?text=${encodeURIComponent(`مرحباً ${brand.name}، أود الاستفسار والحجز`)}" class="btn-wa" target="_blank">💬 تحدث مباشرة مع وكيل ${escapeHtml(brand.name)} على واتساب (${escapeHtml(brand.phone || '')})</a>
  </div>

  <script>
    let selectedTime = '02:00 م';
    function selectTime(el, time) {
      selectedTime = time;
      document.querySelectorAll('#timeSlots .slot').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
    }
    function selectService(name, price, idx) {
      document.getElementById('custService').value = name + ' (' + price + ')';
      document.getElementById('custPrice').value = price;
      document.querySelectorAll('.card').forEach(el => el.classList.remove('active'));
      const c = document.getElementById('card-' + idx);
      if (c) c.classList.add('active');
    }
    async function submitBooking() {
      const customerName = document.getElementById('custName').value.trim();
      const customerPhone = document.getElementById('custPhone').value.trim();
      const address = document.getElementById('custAddress').value.trim() || 'القاهرة';
      const bookingDate = document.getElementById('bookingDate').value;
      const service = document.getElementById('custService').value;
      const price = document.getElementById('custPrice').value;
      if (!customerName || !customerPhone) { alert('يرجى إدخال الاسم ورقم الموبايل'); return; }
      const btn = document.getElementById('submitBtn');
      const statusBox = document.getElementById('bookingStatus');
      btn.disabled = true; btn.innerText = '⏳ جاري تأكيد الموعد في التقويم...';
      try {
        const res = await fetch('/api/app/${slug}/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerName, customerPhone, address, service, price, bookingDate, bookingTime: selectedTime })
        });
        const d = await res.json();
        statusBox.style.display = 'block';
        statusBox.innerHTML = d.ok ? '✅ تم تأكيد حجزك ليوم ' + bookingDate + ' الساعة ' + selectedTime + ' بنجاح!' : ('❌ ' + (d.error || 'تعذر الحجز'));
      } catch {
        statusBox.style.display = 'block';
        statusBox.innerText = '❌ حدث خطأ في الاتصال';
      } finally {
        btn.disabled = false; btn.innerText = '✅ تأكيد الحجز وإضافته للتقويم';
      }
    }
  </script>
</body></html>`;
}

export function renderTenantAdminHtml(brand: any): string {
  const template = resolveBrandTemplate(brand);
  const slug = encodeURIComponent(brand?.slug || brand?.id || 'app');
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>لوحة تحكم ${escapeHtml(brand.name)} | ${template === 'products_erp' ? 'ERP + POS + CRM' : 'التقويم والماليات'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { margin:0; padding:18px; background:#020617; color:#f8fafc; font-family:'Cairo',sans-serif; text-align:right; }
    .wrap { max-width:960px; margin:0 auto; }
    .panel { background:#0f172a; border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:18px; margin-bottom:16px; }
    .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:16px; }
    .stat { background:#091124; border:1px solid rgba(56,189,248,0.22); border-radius:16px; padding:14px; }
    .input { width:100%; background:#020617; border:1px solid rgba(255,255,255,0.16); color:#fff; padding:10px 12px; border-radius:10px; font-family:'Cairo',sans-serif; font-size:13px; margin-bottom:10px; }
    .btn { border:none; cursor:pointer; background:linear-gradient(90deg,#06b6d4,#10b981); color:#020617; font-weight:900; padding:10px 18px; border-radius:12px; font-family:'Cairo',sans-serif; font-size:13px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th, td { padding:10px 8px; border-bottom:1px solid rgba(255,255,255,0.08); text-align:right; }
    th { color:#38bdf8; }
  </style>
</head>
<body>
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div>
        <h1 style="margin:0;font-size:20px;font-weight:900;">⚡ لوحة تحكم ${escapeHtml(brand.name)}</h1>
        <span style="font-size:12px;color:#94a3b8;">${template === 'products_erp' ? 'إدارة المتجر والمبيعات والعملاء (ERP / CRM)' : 'تقويم الحجوزات وسجل الماليات'}</span>
      </div>
      <a href="/app/${slug}" style="color:#38bdf8;text-decoration:none;font-size:12px;font-weight:800;">↗ عرض واجهة العملاء</a>
    </div>

    <div id="loginBox" class="panel" style="max-width:420px;margin:40px auto;">
      <h2 style="margin:0 0 8px;font-size:16px;">🔐 تسجيل دخول مدير النشاط</h2>
      <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;">أدخل رقم الواتساب المسجل للنشاط أو كود الإدارة (PIN):</p>
      <input id="pinInput" type="password" class="input" placeholder="رقم الهاتف المسجل أو PIN" />
      <button class="btn" style="width:100%;" onclick="loadAdminData()">دخول إلى لوحة التحكم</button>
      <div id="authErr" style="color:#f87171;font-size:12px;margin-top:8px;"></div>
    </div>

    <div id="dashBox" style="display:none;">
      <div class="stats">
        <div class="stat"><div style="font-size:11px;color:#94a3b8;">إجمالي الطلبات / الحجوزات</div><div id="stCount" style="font-size:22px;font-weight:900;color:#38bdf8;">0</div></div>
        <div class="stat"><div style="font-size:11px;color:#94a3b8;">إجمالي الإيرادات</div><div id="stRev" style="font-size:22px;font-weight:900;color:#34d399;">0 ج.م</div></div>
        <div class="stat"><div style="font-size:11px;color:#94a3b8;">العناصر في الكتالوج</div><div id="stCat" style="font-size:22px;font-weight:900;color:#fbbf24;">0</div></div>
      </div>

      <div class="panel">
        <h3 style="margin:0 0 10px;font-size:15px;">➕ إضافة ${template === 'products_erp' ? 'منتج جديد للمخزون' : 'خدمة جديدة للتقويم'}</h3>
        <div style="display:grid;grid-template-columns:2fr 1fr 2fr auto;gap:8px;">
          <input id="newName" class="input" placeholder="الاسم" style="margin:0;" />
          <input id="newPrice" class="input" placeholder="السعر (مثال: 500 ج.م)" style="margin:0;" />
          <input id="newDesc" class="input" placeholder="وصف مختصر" style="margin:0;" />
          <button class="btn" onclick="addCatalogItem()">إضافة</button>
        </div>
      </div>

      <div class="panel" style="overflow-x:auto;">
        <h3 style="margin:0 0 10px;font-size:15px;">📋 أحدث ${template === 'products_erp' ? 'الطلبات والعملاء (CRM)' : 'الحجوزات والمواعيد'}</h3>
        <table>
          <thead><tr><th>العميل</th><th>الهاتف</th><th>التفاصيل / الموعد</th><th>القيمة</th><th>الحالة</th></tr></thead>
          <tbody id="recordsBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    let authPin = '';
    async function loadAdminData() {
      authPin = document.getElementById('pinInput').value.trim();
      const res = await fetch('/api/app/${slug}/admin-data', { headers: { 'x-tenant-auth': authPin } });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        document.getElementById('authErr').innerText = d.error || 'بيانات الدخول غير صحيحة';
        return;
      }
      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('dashBox').style.display = 'block';
      document.getElementById('stCount').innerText = d.records.length;
      document.getElementById('stRev').innerText = d.totalRevenueEgp + ' ج.م';
      document.getElementById('stCat').innerText = d.catalog.length;
      document.getElementById('recordsBody').innerHTML = d.records.map(r => \`
        <tr>
          <td>\${r.customerName || '-'}</td>
          <td dir="ltr">\${r.customerPhone || '-'}</td>
          <td>\${r.summary || r.service || '-'} \${r.bookingDate ? ('(' + r.bookingDate + ' ' + (r.bookingTime || '') + ')') : ''}</td>
          <td style="color:#34d399;font-weight:800;">\${r.totalEgp || r.price || 0} ج.م</td>
          <td>\${r.status || 'CONFIRMED'}</td>
        </tr>
      \`).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;">لا توجد سجلات بعد</td></tr>';
    }
    async function addCatalogItem() {
      const name = document.getElementById('newName').value.trim();
      const price = document.getElementById('newPrice').value.trim() || '500 ج.م';
      const description = document.getElementById('newDesc').value.trim();
      if (!name) return;
      const res = await fetch('/api/app/${slug}/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-auth': authPin },
        body: JSON.stringify({ name, price, description })
      });
      if (res.ok) {
        document.getElementById('newName').value = '';
        document.getElementById('newPrice').value = '';
        document.getElementById('newDesc').value = '';
        loadAdminData();
      }
    }
  </script>
</body></html>`;
}
