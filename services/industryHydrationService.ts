export interface HydratedCatalogItem {
  id: string;
  name: string;
  price: string;
  numericPrice: number;
  category: string;
  description: string;
}

export interface ScrapedSiteMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
}

const DOMAIN_FALLBACK_CATALOGS: Array<{ match: RegExp; items: Array<{ name: string; price: number; category: string; description: string }> }> = [
  {
    match: /قطع غيار|سيار|عربي|أوتو|اوتو|ميكانيك|auto|car|parts/i,
    items: [
      { name: 'طقم تيل فرامل أمامي أصلي', price: 1450, category: 'الفرامل والتعليق', description: 'أداء كبح فائق وعمر افتراضي طويل بدون صوت.' },
      { name: 'فلتر زيت + فلتر هواء كوري/ياباني', price: 420, category: 'الصيانة الدورية', description: 'حماية كاملة للموتور وتقليل استهلاك البنزين.' },
      { name: 'بطارية سيارة 70 أمبير جافة بضمان', price: 3600, category: 'الكهرباء والبطاريات', description: 'شحن قوي وتشغيل فوري في كل الأجواء مع ضمان سنة.' },
      { name: 'طقم بوجيهات إيريديوم أصلي', price: 980, category: 'نظام الإشعال', description: 'عزم أقوى واستجابة أسرع للموتور.' },
      { name: 'زيت محرك تخليقي بالكامل 5W-30 (4 لتر)', price: 1350, category: 'الزيوت والسوائل', description: 'حماية قصوى للمحركات الحديثة حتى 10,000 كم.' },
      { name: 'طقم مساعدين خلفي أصلي', price: 2800, category: 'العفشة والتعليق', description: 'ثبات عالي على الطرق السريعة وامتصاص ممتاز للصدمات.' }
    ]
  },
  {
    match: /عياد|أسنان|اسنان|طب|دكتور|مستشف|تجميل|clinic|dental|med/i,
    items: [
      { name: 'كشف استشاري وتشخيص شامل', price: 400, category: 'الكشوفات', description: 'فحص دقيق مع خطة علاجية واضحة ومكتوبة.' },
      { name: 'تنظيف وتلميع وإزالة الجير بالليزر', price: 850, category: 'العناية الوقائية', description: 'جلسة سريعة بدون ألم لابتسامة صحية ونظيفة.' },
      { name: 'تبييض احترافي بالليزر', price: 2900, category: 'التجميل', description: 'نتيجة فورية بدرجات أفتح وآمنة تماماً على المينا.' },
      { name: 'حشو تجميلي بلون السن', price: 1100, category: 'العلاج التحفظي', description: 'خامات ألمانية عالية التحمل ومطابقة للون الطبيعي.' },
      { name: 'تركيبات زيركون عالية الجودة', price: 4500, category: 'التركيبات', description: 'ثبات ومتانة ومظهر طبيعي 100%.' },
      { name: 'متابعة واستشارة أونلاين', price: 250, category: 'الاستشارات', description: 'تقييم سريع ومتابعة خطة العلاج عن بُعد.' }
    ]
  },
  {
    match: /نظاف|تعقيم|صيان|تكييف|سباك|كهرب|clean/i,
    items: [
      { name: 'تنظيف وتعقيم شقة بالكامل بالبخار', price: 1200, category: 'القطاع السكني', description: 'تعقيم شامل بأحدث أجهزة البخار الألمانية.' },
      { name: 'غسيل وتنظيف أنتريه وصالون بالبخار', price: 650, category: 'المفروشات', description: 'إزالة البقع الصعبة والروائح مع تجفيف سريع.' },
      { name: 'تنظيف ما بعد التشطيب والدهانات', price: 2200, category: 'التشطيبات', description: 'إزالة بقايا الأسمنت والدهانات وتلميع الأرضيات.' },
      { name: 'تنظيف وتعقيم خزانات المياه', price: 900, category: 'التعقيم', description: 'مواد آمنة ومعتمدة لصحة الأسرة.' },
      { name: 'نظافة وتعقيم مقرات الشركات والمكاتب', price: 1800, category: 'قطاع الأعمال', description: 'تجهيز شامل للمكاتب وقاعات الاجتماعات.' },
      { name: 'صيانة وتنظيف تكييف سبليت', price: 350, category: 'الصيانة', description: 'تنظيف الوحدة الداخلية والخارجية ورفع الكفاءة.' }
    ]
  },
  {
    match: /أزياء|ملابس|موض|شوز|أحذية|fashion|clothes|store|متجر/i,
    items: [
      { name: 'تيشيرت قطن مصري 100% أوفر سايز', price: 480, category: 'ملابس كاجوال', description: 'خامة قطن طبيعي ناعمة ومريحة للبس اليومي.' },
      { name: 'هودي شتوي مبطن خامة ثقيلة', price: 890, category: 'ملابس شتوية', description: 'تدفئة مثالية وتصميم عصري بألوان متعددة.' },
      { name: 'بنطلون جينز سليم فيت', price: 750, category: 'البنطلونات', description: 'قصة مريحة وخامة مرنة عالية التحمل.' },
      { name: 'سنيكرز رياضي خفيف الوزن', price: 1250, category: 'الأحذية', description: 'نعل طبي مريح للمشي والجري طوال اليوم.' },
      { name: 'قميص كتان صيفي أنيق', price: 620, category: 'كلاسيك وكاجوال', description: 'مناسب للعمل والخروجات الرسمية وغير الرسمية.' },
      { name: 'بوكس هدايا متكامل', price: 1650, category: 'العروض والباقات', description: 'تنسيق أنيق جاهز للتقديم كهدية مميزة.' }
    ]
  }
];

function buildFallbackCatalog(industry: string, brandName: string): HydratedCatalogItem[] {
  const matched = DOMAIN_FALLBACK_CATALOGS.find((d) => d.match.test(`${industry} ${brandName}`));
  const source = matched
    ? matched.items
    : [
        { name: `الباقة الأساسية — ${brandName}`, price: 500, category: 'الخدمات الأساسية', description: `خدمة احترافية معتمدة في مجال ${industry || 'الأعمال'}.` },
        { name: `الباقة المتقدمة VIP — ${brandName}`, price: 1200, category: 'الباقات المميزة', description: 'تنفيذ سريع وأولوية قصوى مع متابعة مستمرة.' },
        { name: 'استشارة ومعاينة متخصصة', price: 300, category: 'الاستشارات', description: 'تقييم احترافي دقيق وخطة عمل واضحة.' },
        { name: 'خدمة التوصيل / التنفيذ الفوري', price: 250, category: 'الخدمات السريعة', description: 'استلام أو تنفيذ في نفس اليوم.' },
        { name: 'باقة الاشتراك الشهري للشركات', price: 3500, category: 'قطاع الأعمال', description: 'تغطية شاملة ودعم مستمر طوال الشهر.' },
        { name: 'عرض خاص للعملاء الجدد', price: 750, category: 'العروض الحصرية', description: 'خصم مميز لأول طلب أو حجز عبر التطبيق.' }
      ];

  return source.map((item, idx) => ({
    id: `item_${Date.now().toString().slice(-4)}_${idx + 1}`,
    name: item.name,
    price: `${item.price} ج.م`,
    numericPrice: item.price,
    category: item.category,
    description: item.description
  }));
}

export async function generateIndustryCatalogWithAI(input: {
  ai: any;
  brandName: string;
  industry: string;
  appTemplate?: 'products_erp' | 'services_booking';
}): Promise<HydratedCatalogItem[]> {
  const { ai, brandName, industry, appTemplate } = input;
  if (!ai) {
    return buildFallbackCatalog(industry, brandName);
  }

  const kindLabel = appTemplate === 'products_erp' ? 'منتجات فعلية للبيع' : 'خدمات وحجوزات';
  const prompt = `أنشئ 6 ${kindLabel} واقعية ومقنعة للسوق المصري لبراند اسمه "${brandName}" في مجال "${industry}".
أرجع النتيجة كـ JSON Array فقط بدون أي نص إضافي، بحيث يحتوي كل عنصر على:
{ "name": "اسم قصير وواضح بالعربية", "numericPrice": رقم_بالجنيه_المصري, "category": "تصنيف قصير", "description": "وصف بيعي من جملة واحدة" }`;

  for (const model of ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']) {
    try {
      const resp = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      });
      const raw = resp?.text?.trim();
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
      if (list.length >= 3) {
        return list.slice(0, 8).map((item: any, idx: number) => {
          const num = Math.max(50, Number(item.numericPrice || item.price || 500) || 500);
          return {
            id: `ai_item_${Date.now().toString().slice(-4)}_${idx + 1}`,
            name: String(item.name || `عنصر ${idx + 1}`).trim(),
            price: `${num} ج.م`,
            numericPrice: num,
            category: String(item.category || industry || 'عام').trim(),
            description: String(item.description || 'متاح للطلب والحجز الفوري').trim()
          };
        });
      }
    } catch {}
  }

  return buildFallbackCatalog(industry, brandName);
}

export async function scrapeWebsiteMetadata(websiteUrl?: string): Promise<ScrapedSiteMetadata> {
  const raw = String(websiteUrl || '').trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return {};

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(raw, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EzZelGrowthBot/1.0)' }
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    const html = (await res.text()).slice(0, 60000);

    const titleMatch = html.match(/<title[^>]*>([^<]{2,120})<\/title>/i);
    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{4,260})["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']{4,260})["'][^>]+name=["']description["']/i);
    const ogImgMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    return {
      title: titleMatch?.[1]?.trim(),
      description: descMatch?.[1]?.trim(),
      ogImage: ogImgMatch?.[1]?.trim()
    };
  } catch {
    return {};
  }
}
