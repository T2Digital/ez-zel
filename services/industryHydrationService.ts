export interface HydratedCatalogItem {
  id: string;
  name: string;
  price: string;
  numericPrice: number;
  category: string;
  description: string;
  image: string;
  imageUrl: string;
}

export interface ScrapedSiteMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
}

const DOMAIN_FALLBACK_CATALOGS: Array<{ match: RegExp; defaultImage: string; items: Array<{ name: string; price: number; category: string; description: string; image: string }> }> = [
  {
    match: /قطع غيار|سيار|عربي|أوتو|اوتو|ميكانيك|auto|car|parts/i,
    defaultImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&auto=format&fit=crop&q=80',
    items: [
      { name: 'طقم تيل فرامل أمامي أصلي', price: 1450, category: 'الفرامل والتعليق', description: 'أداء كبح فائق وعمر افتراضي طويل بدون صوت.', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&auto=format&fit=crop&q=80' },
      { name: 'فلتر زيت + فلتر هواء كوري/ياباني', price: 420, category: 'الصيانة الدورية', description: 'حماية كاملة للموتور وتقليل استهلاك البنزين.', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80' },
      { name: 'بطارية سيارة 70 أمبير جافة بضمان', price: 3600, category: 'الكهرباء والبطاريات', description: 'شحن قوي وتشغيل فوري في كل الأجواء مع ضمان سنة.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80' },
      { name: 'طقم بوجيهات إيريديوم أصلي', price: 980, category: 'نظام الإشعال', description: 'عزم أقوى واستجابة أسرع للموتور.', image: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=600&auto=format&fit=crop&q=80' },
      { name: 'زيت محرك تخليقي بالكامل 5W-30 (4 لتر)', price: 1350, category: 'الزيوت والسوائل', description: 'حماية قصوى للمحركات الحديثة حتى 10,000 كم.', image: 'https://images.unsplash.com/photo-1635784063388-1ff609731d7d?w=600&auto=format&fit=crop&q=80' },
      { name: 'طقم مساعدين خلفي أصلي', price: 2800, category: 'العفشة والتعليق', description: 'ثبات عالي على الطرق السريعة وامتصاص ممتاز للصدمات.', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    match: /عياد|أسنان|اسنان|طب|دكتور|مستشف|تجميل|clinic|dental|med/i,
    defaultImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
    items: [
      { name: 'كشف استشاري وتشخيص شامل', price: 400, category: 'الكشوفات', description: 'فحص دقيق مع خطة علاجية واضحة ومكتوبة.', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80' },
      { name: 'تنظيف وتلميع وإزالة الجير بالليزر', price: 850, category: 'العناية الوقائية', description: 'جلسة سريعة بدون ألم لابتسامة صحية ونظيفة.', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80' },
      { name: 'تبييض احترافي بالليزر', price: 2900, category: 'التجميل', description: 'نتيجة فورية بدرجات أفتح وآمنة تماماً على المينا.', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80' },
      { name: 'حشو تجميلي بلون السن', price: 1100, category: 'العلاج التحفظي', description: 'خامات ألمانية عالية التحمل ومطابقة للون الطبيعي.', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80' },
      { name: 'تركيبات زيركون عالية الجودة', price: 4500, category: 'التركيبات', description: 'ثبات ومتانة ومظهر طبيعي 100%.', image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&auto=format&fit=crop&q=80' },
      { name: 'متابعة واستشارة أونلاين', price: 250, category: 'الاستشارات', description: 'تقييم سريع ومتابعة خطة العلاج عن بُعد.', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    match: /نظاف|تعقيم|صيان|تكييف|سباك|كهرب|clean/i,
    defaultImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    items: [
      { name: 'تنظيف وتعقيم شقة بالكامل بالبخار', price: 1200, category: 'القطاع السكني', description: 'تعقيم شامل بأحدث أجهزة البخار الألمانية.', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80' },
      { name: 'غسيل وتنظيف أنتريه وصالون بالبخار', price: 650, category: 'المفروشات', description: 'إزالة البقع الصعبة والروائح مع تجفيف سريع.', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80' },
      { name: 'تنظيف ما بعد التشطيب والدهانات', price: 2200, category: 'التشطيبات', description: 'إزالة بقايا الأسمنت والدهانات وتلميع الأرضيات.', image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&auto=format&fit=crop&q=80' },
      { name: 'تنظيف وتعقيم خزانات المياه', price: 900, category: 'التعقيم', description: 'مواد آمنة ومعتمدة لصحة الأسرة.', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop&q=80' },
      { name: 'نظافة وتعقيم مقرات الشركات والمكاتب', price: 1800, category: 'قطاع الأعمال', description: 'تجهيز شامل للمكاتب وقاعات الاجتماعات.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80' },
      { name: 'صيانة وتنظيف تكييف سبليت', price: 350, category: 'الصيانة', description: 'تنظيف الوحدة الداخلية والخارجية ورفع الكفاءة.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  {
    match: /أزياء|ملابس|موض|شوز|أحذية|fashion|clothes|store|متجر/i,
    defaultImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80',
    items: [
      { name: 'تيشيرت قطن مصري 100% أوفر سايز', price: 480, category: 'ملابس كاجوال', description: 'خامة قطن طبيعي ناعمة ومريحة للبس اليومي.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80' },
      { name: 'هودي شتوي مبطن خامة ثقيلة', price: 890, category: 'ملابس شتوية', description: 'تدفئة مثالية وتصميم عصري بألوان متعددة.', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80' },
      { name: 'بنطلون جينز سليم فيت', price: 750, category: 'البنطلونات', description: 'قصة مريحة وخامة مرنة عالية التحمل.', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80' },
      { name: 'سنيكرز رياضي خفيف الوزن', price: 1250, category: 'الأحذية', description: 'نعل طبي مريح للمشي والجري طوال اليوم.', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
      { name: 'قميص كتان صيفي أنيق', price: 620, category: 'كلاسيك وكاجوال', description: 'مناسب للعمل والخروجات الرسمية وغير الرسمية.', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80' },
      { name: 'بوكس هدايا متكامل', price: 1650, category: 'العروض والباقات', description: 'تنسيق أنيق جاهز للتقديم كهدية مميزة.', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80' }
    ]
  }
];

function resolveDomainFallbackGroup(industry: string, brandName: string) {
  return DOMAIN_FALLBACK_CATALOGS.find((d) => d.match.test(`${industry} ${brandName}`));
}

function buildFallbackCatalog(industry: string, brandName: string): HydratedCatalogItem[] {
  const matched = resolveDomainFallbackGroup(industry, brandName);
  const genericImgs = [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80',
  ];
  const source = matched
    ? matched.items
    : [
        { name: `الباقة الأساسية — ${brandName}`, price: 500, category: 'الخدمات الأساسية', description: `خدمة احترافية معتمدة في مجال ${industry || 'الأعمال'}.`, image: genericImgs[0] },
        { name: `الباقة المتقدمة VIP — ${brandName}`, price: 1200, category: 'الباقات المميزة', description: 'تنفيذ سريع وأولوية قصوى مع متابعة مستمرة.', image: genericImgs[1] },
        { name: 'استشارة ومعاينة متخصصة', price: 300, category: 'الاستشارات', description: 'تقييم احترافي دقيق وخطة عمل واضحة.', image: genericImgs[2] },
        { name: 'خدمة التوصيل / التنفيذ الفوري', price: 250, category: 'الخدمات السريعة', description: 'استلام أو تنفيذ في نفس اليوم.', image: genericImgs[3] },
        { name: 'باقة الاشتراك الشهري للشركات', price: 3500, category: 'قطاع الأعمال', description: 'تغطية شاملة ودعم مستمر طوال الشهر.', image: genericImgs[4] },
        { name: 'عرض خاص للعملاء الجدد', price: 750, category: 'العروض الحصرية', description: 'خصم مميز لأول طلب أو حجز عبر التطبيق.', image: genericImgs[5] }
      ];

  return source.map((item, idx) => ({
    id: `item_${Date.now().toString().slice(-4)}_${idx + 1}`,
    name: item.name,
    price: `${item.price} ج.م`,
    numericPrice: item.price,
    category: item.category,
    description: item.description,
    image: item.image,
    imageUrl: item.image,
  }));
}

export async function generateIndustryCatalogWithAI(input: {
  ai: any;
  brandName: string;
  industry: string;
  appTemplate?: 'products_erp' | 'services_booking';
}): Promise<HydratedCatalogItem[]> {
  const { ai, brandName, industry, appTemplate } = input;
  const fallbackList = buildFallbackCatalog(industry, brandName);
  if (!ai) {
    return fallbackList;
  }

  const kindLabel = appTemplate === 'products_erp' ? 'منتجات فعلية للبيع' : 'خدمات وحجوزات';
  const prompt = `أنشئ 6 ${kindLabel} واقعية ومقنعة للسوق المصري لبراند اسمه "${brandName}" في مجال "${industry}".
أرجع النتيجة كـ JSON Array فقط بدون أي نص إضافي، بحيث يحتوي كل عنصر على:
{ "name": "اسم قصير وواضح بالعربية", "numericPrice": رقم_بالجنيه_المصري, "category": "تصنيف قصير", "description": "وصف بيعي من جملة واحدة" }`;

  try {
    const resp = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      }),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('AI_CATALOG_TIMEOUT')), 3500))
    ]);
    const raw = (resp as any)?.text?.trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
      if (list.length >= 3) {
        return list.slice(0, 8).map((item: any, idx: number) => {
          const num = Math.max(50, Number(item.numericPrice || item.price || 500) || 500);
          const rawCat = typeof item.category === 'object' && item.category !== null
            ? (item.category.name || item.category.label || item.category.title)
            : item.category;
          const img = fallbackList[idx % fallbackList.length]?.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80';
          return {
            id: `ai_item_${Date.now().toString().slice(-4)}_${idx + 1}`,
            name: String(item.name || `عنصر ${idx + 1}`).trim(),
            price: `${num} ج.م`,
            numericPrice: num,
            category: String(rawCat || industry || 'عام').trim(),
            description: String(item.description || 'متاح للطلب والحجز الفوري').trim(),
            image: img,
            imageUrl: img,
          };
        });
      }
    }
  } catch {}

  return fallbackList;
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
