/**
 * Sovereign Brand Vault for The Shadow (D:\ez-zel-)
 * Single Source of Truth unifying:
 * 1. All 17 production brands from Tito Content Studio (Firebase).
 * 2. Operational conversational bots, pricing catalogs, and live WhatsApp numbers from Tito Agent.
 * 
 * Auto-generated & verified by The Shadow Core Engine.
 */

export interface ServiceItem {
  name: string;
  price?: string | number;
  details?: string;
  unit?: string;
  imageUrl?: string;
}

export interface BrandConfig {
  id: string;
  studioId?: string;
  name: string;
  englishName?: string;
  category: string;
  source: 'unified' | 'studio' | 'agent';
  status: 'شغال' | 'متوقف';
  conversationsCount: number;
  phone: string;
  whatsapp: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  address?: string;
  locationUrl?: string;
  metaPageId?: string;
  metaPageName?: string;
  metaPageToken?: string;
  subscriptionPlan: string;
  catalog: Record<string, ServiceItem | any>;
  pricingRules?: Record<string, any>;
  systemPrompt?: string;
  knowledgeText?: string;
}

export const BRAND_VAULT: Record<string, BrandConfig> = {
  "crystal_teeth": {
    "id": "crystal_teeth",
    "studioId": "2",
    "name": "عيادة كريستال لطب الأسنان",
    "englishName": "Crystal teeth of ITALI",
    "category": "رعاية صحية وطب أسنان",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01152751755",
    "whatsapp": "01152751755",
    "primaryColor": "#2563eb",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/HfgMpWJ3/image.png",
    "address": "أول فيصل، أعلى معرض سيارات الأبيض، برج النصر، الدور الـ 2",
    "locationUrl": "https://share.google/djfW2bSBONbrFRTEY",
    "metaPageId": "507456179126127",
    "metaPageName": "Crystal teeth of ITALI",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "implants": {
            "name": "زراعة الأسنان الفورية وتجميل الفكين بأحدث التقنيات الألمانية",
            "price": "كشف واستشارة مجانية"
        },
        "hollywoodSmile": {
            "name": "ابتسامة هوليود وفينير وعدسات إيماكس عالية الدقة",
            "price": "عروض تقسيط متاحة"
        },
        "teethCleaning": {
            "name": "تنظيف الجير وتلميع الأسنان وإزالة التصبغات بجهاز الكافيترون",
            "price": "جلسة سريعة بدون ألم"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ عيادة كريستال لطب الأسنان. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "socotra_dental": {
    "id": "socotra_dental",
    "studioId": "3",
    "name": "عيادة سقطرى لطب الأسنان",
    "englishName": "Socotra dental clinic",
    "category": "رعاية صحية وطب أسنان",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01114474774",
    "whatsapp": "01114474774",
    "primaryColor": "#2563eb",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/SDhsnLQM/image.png",
    "address": "447 شارع الملك فيصل، محطة مدكور، فوق صيدلية العزبي",
    "locationUrl": "https://share.google/hJzQd8FV5R7zuZm6h",
    "metaPageId": "115267591569812",
    "metaPageName": "Socotra dental clinic",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "implants": {
            "name": "زراعة الأسنان الفورية وتجميل الفكين بأحدث التقنيات الألمانية",
            "price": "كشف واستشارة مجانية"
        },
        "hollywoodSmile": {
            "name": "ابتسامة هوليود وفينير وعدسات إيماكس عالية الدقة",
            "price": "عروض تقسيط متاحة"
        },
        "teethCleaning": {
            "name": "تنظيف الجير وتلميع الأسنان وإزالة التصبغات بجهاز الكافيترون",
            "price": "جلسة سريعة بدون ألم"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ عيادة سقطرى لطب الأسنان. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "alkhalig_dental": {
    "id": "alkhalig_dental",
    "studioId": "4",
    "name": "عيادة الخليج لطب الأسنان",
    "englishName": "Alkhalig dental center",
    "category": "رعاية صحية وطب أسنان",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01040441411",
    "whatsapp": "01040441411",
    "primaryColor": "#bba775",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/QFh9K9Yx/image.png",
    "address": "1 شارع العشرين فيصل، أعلى دريم ستور",
    "locationUrl": "https://share.google/FMI1vHif2Ka4cUjFf",
    "metaPageId": "517588714769965",
    "metaPageName": "Alkhalig dental centers",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "implants": {
            "name": "زراعة الأسنان الفورية وتجميل الفكين بأحدث التقنيات الألمانية",
            "price": "كشف واستشارة مجانية"
        },
        "hollywoodSmile": {
            "name": "ابتسامة هوليود وفينير وعدسات إيماكس عالية الدقة",
            "price": "عروض تقسيط متاحة"
        },
        "teethCleaning": {
            "name": "تنظيف الجير وتلميع الأسنان وإزالة التصبغات بجهاز الكافيترون",
            "price": "جلسة سريعة بدون ألم"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ عيادة الخليج لطب الأسنان. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "dental_district": {
    "id": "dental_district",
    "studioId": "5",
    "name": "عيادة حي الأسنان",
    "englishName": "Dental District",
    "category": "رعاية صحية وطب أسنان",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01114664644",
    "whatsapp": "01114664644",
    "primaryColor": "#554835",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/gMC459QD/image.png",
    "address": "تقاطع شارع الثلاثيني _ مع شارع العشرين - فيصل",
    "locationUrl": "https://share.google/cdAfHTXeDY3zGOoB5",
    "metaPageId": "143504448855677",
    "metaPageName": "Dental District ",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "implants": {
            "name": "زراعة الأسنان الفورية وتجميل الفكين بأحدث التقنيات الألمانية",
            "price": "كشف واستشارة مجانية"
        },
        "hollywoodSmile": {
            "name": "ابتسامة هوليود وفينير وعدسات إيماكس عالية الدقة",
            "price": "عروض تقسيط متاحة"
        },
        "teethCleaning": {
            "name": "تنظيف الجير وتلميع الأسنان وإزالة التصبغات بجهاز الكافيترون",
            "price": "جلسة سريعة بدون ألم"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ عيادة حي الأسنان. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "mecca_dental": {
    "id": "mecca_dental",
    "studioId": "6",
    "name": "عيادة مكة لطب الأسنان",
    "englishName": "Mecca dental clinic",
    "category": "رعاية صحية وطب أسنان",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01040111001",
    "whatsapp": "01040111001",
    "primaryColor": "#ecda8e",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/xtGZd05V/image.png",
    "address": "شارع عباس علي عيسي متفرع من شارع ترعه زنين أمام شارع عشره واعلي اسماك بيبو الثلاثين الدور الاول",
    "locationUrl": "",
    "metaPageId": "700014333205238",
    "metaPageName": "Mecca dental clinic",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "implants": {
            "name": "زراعة الأسنان الفورية وتجميل الفكين بأحدث التقنيات الألمانية",
            "price": "كشف واستشارة مجانية"
        },
        "hollywoodSmile": {
            "name": "ابتسامة هوليود وفينير وعدسات إيماكس عالية الدقة",
            "price": "عروض تقسيط متاحة"
        },
        "teethCleaning": {
            "name": "تنظيف الجير وتلميع الأسنان وإزالة التصبغات بجهاز الكافيترون",
            "price": "جلسة سريعة بدون ألم"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ عيادة مكة لطب الأسنان. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "dr_abdelaziz_moussa": {
    "id": "dr_abdelaziz_moussa",
    "studioId": "7",
    "name": "عيادة د. عبدالعزيز الموسى",
    "englishName": "",
    "category": "رعاية صحية وطب أسنان",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "920000007",
    "whatsapp": "920000007",
    "primaryColor": "#0f172a",
    "accentColor": "#38bdf8",
    "logoUrl": "https://picsum.photos/seed/almousa/200/200",
    "address": "الرياض، حي الملقا",
    "locationUrl": "",
    "metaPageId": "1120073281192800",
    "metaPageName": "SKY VIP",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "implants": {
            "name": "زراعة الأسنان الفورية وتجميل الفكين بأحدث التقنيات الألمانية",
            "price": "كشف واستشارة مجانية"
        },
        "hollywoodSmile": {
            "name": "ابتسامة هوليود وفينير وعدسات إيماكس عالية الدقة",
            "price": "عروض تقسيط متاحة"
        },
        "teethCleaning": {
            "name": "تنظيف الجير وتلميع الأسنان وإزالة التصبغات بجهاز الكافيترون",
            "price": "جلسة سريعة بدون ألم"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ عيادة د. عبدالعزيز الموسى. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "crypto_bel_arabi": {
    "id": "crypto_bel_arabi",
    "studioId": "brand_1779846650608",
    "name": "كريبتو بالعربي",
    "englishName": "Crypto Bel Arabi",
    "category": "تسويق ونمو رقمي وأتمتة",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "201000000000",
    "whatsapp": "201000000000",
    "primaryColor": "#f59e0b",
    "accentColor": "#38bdf8",
    "logoUrl": "https://api.dicebear.com/7.x/initials/svg?seed=%D9%83%D8%B1%D9%8A%D8%A8%D8%AA%D9%88%20%D8%A8%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A",
    "address": "المملكة العربية السعودية",
    "locationUrl": "",
    "metaPageId": "103390919014781",
    "metaPageName": "كريبتو بالعربى -Crypto bel Arabi",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "contentProduction": {
            "name": "إنتاج محتوى مرئي وتصوير إعلانات سوشيال ميديا احترافية",
            "price": "باقات شهرية"
        },
        "sponsoredAds": {
            "name": "إدارة وتوجيه الحملات الإعلانية الممولة على فيسبوك وتيك توك وجوجل",
            "price": "استهداف دقيق"
        },
        "aiAutomations": {
            "name": "ربط وكلاء الذكاء الاصطناعي وأنظمة الرد الآلي للواتساب والماسنجر",
            "price": "تكامل كامل"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ كريبتو بالعربي. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "tito_media": {
    "id": "tito_media",
    "studioId": "brand_1779847291377",
    "name": "تيتو ميديا",
    "englishName": "T2 Media",
    "category": "تسويق ونمو رقمي وأتمتة",
    "source": "unified",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01030956097",
    "whatsapp": "01030956097",
    "primaryColor": "#6366f1",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/FLBkWxb5/image.png",
    "address": "مصر و الوطن العربي",
    "locationUrl": "",
    "metaPageId": "111155044732876",
    "metaPageName": "تيتو ميديا  - T2 Media",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "تجربة مجانية 7 أيام",
    "catalog": {
        "saasBots": {
            "name": "بناء وكلاء الذكاء الاصطناعي والأتمتة السحابية للشركات",
            "price": "باقات شهرية وحلول مخصصة"
        },
        "growthMarketing": {
            "name": "إدارة الحملات الإعلانية الممولة وتأسيس العلامة التجارية",
            "price": "إشراف كامل واستراتيجيات نمو ROI"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت تيتو، مطور أعمال وخبير النمو والتسويق الرقمي لمنظومة T2 Media. تقدم المشورة والخطط التسويقية وحلول الذكاء الاصطناعي للشركات."
},

  "sky_vip": {
    "id": "sky_vip",
    "studioId": "brand_1780593467882",
    "name": "SKY VIP",
    "englishName": "Sky VIP",
    "category": "تأجير سيارات وسياحة",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "201154040041",
    "whatsapp": "201154040041",
    "primaryColor": "#dec67c",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/TDCpGh8D/image.png",
    "address": "247 شارع السودان - ميدان لبنان - المهندسين - الجيزة",
    "locationUrl": "",
    "metaPageId": "1120073281192800",
    "metaPageName": "SKY VIP",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "dailyRentals": {
            "name": "تأجير سيارات يومي وأسبوعي (موديلات حديثة)",
            "price": "أسعار تبدأ من 700 ج.م"
        },
        "vipChauffeur": {
            "name": "خدمات الليموزين وسيارات VIP بالسائق للمشاوير والمطارات",
            "price": "تغطية 24/7"
        },
        "corporateLease": {
            "name": "عقود تأجير سيارات شهرية وسنوية للشركات والمؤسسات",
            "price": "خصومات للشركات"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ SKY VIP. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "baraka_motors": {
    "id": "baraka_motors",
    "studioId": "brand_1780863827841",
    "name": "البركة موتورز",
    "englishName": "Al Baraka Motors",
    "category": "تأجير سيارات وسياحة",
    "source": "unified",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01147418358",
    "whatsapp": "01147418358",
    "primaryColor": "#ff0505",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/RG4Kv2pF/image.png",
    "address": "محور المهندس شريف أسماعيل ( الطريق الابيض ) أمام محطة بنزين cpc",
    "locationUrl": "https://share.google/bdeSv8GTKrd2JxAtS",
    "metaPageId": "135852182951014",
    "metaPageName": "Al Baraka Motors",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "تجربة مجانية 7 أيام",
    "catalog": {
        "cashSales": {
            "name": "بيع وشراء سيارات جديدة ومستعملة وكسر زيرو",
            "price": "أفضل أسعار سوق السيارات المصري"
        },
        "installments": {
            "name": "برامج تقسيط مباشر بنكية وبدون حظر بيع",
            "price": "بمقدم يبدأ من 20% وفترات سداد حتى 5 سنوات"
        }
    },
    "pricingRules": {
        "electronicDiscountPct": 10,
        "currency": "EGP"
    },
    "systemPrompt": "أنت المساعد الذكي لشركة بركة موتورز لتجارة وتأجير السيارات. تجيب عن استفسارات الموديلات والمقدمات والأوراق المطلوبة للتقسيط."
},

  "kyan_store": {
    "id": "kyan_store",
    "studioId": "brand_1782148514207",
    "name": "كيان",
    "englishName": "Kyan",
    "category": "متجر إلكتروني وتجارة رقمية",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01038690400",
    "whatsapp": "201038690400",
    "primaryColor": "#968267",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/V8y1sgn/image.png",
    "address": "توصيل لكل مكان فى مصر",
    "locationUrl": "https://kyan-fashion.com/",
    "metaPageId": "1035185613007730",
    "metaPageName": "كيان - KYAN",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "ecommerceCatalog": {
            "name": "منتجات وسلع استهلاكية وتجارة إلكترونية فورية",
            "price": "شحن لجميع المحافظات والدفع عند الاستلام"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ كيان. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "fazaa_express": {
    "id": "fazaa_express",
    "studioId": "brand_1783239457203",
    "name": "فزعه إكسبريس",
    "englishName": "Fazaa Express",
    "category": "خدمات شحن ولوجستيات وسياحة",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01141244184",
    "whatsapp": "01141244184",
    "primaryColor": "#f7b602",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/svT4X246/image.jpg",
    "address": "30 شارع غزة - من شارع فوزى رماح -  المهندسين  - الجيزه",
    "locationUrl": "",
    "metaPageId": "1120073281192800",
    "metaPageName": "SKY VIP",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "generalServices": {
            "name": "خدمات تخصصية وحلول متكاملة",
            "price": "حسب الطلب"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ فزعه إكسبريس . تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "alkhedr_car_rental": {
    "id": "alkhedr_car_rental",
    "studioId": "brand_1785774967683",
    "name": "الخضر لتأجير السيارات",
    "englishName": "Alkhedr car rental",
    "category": "تأجير سيارات وسياحة",
    "source": "unified",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "+966112973666",
    "whatsapp": "+966112973666",
    "primaryColor": "#0284c7",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/hxn3LhHn/image.jpg",
    "address": "المملكة العربية السعودية",
    "locationUrl": "",
    "metaPageId": "1120073281192800",
    "metaPageName": "SKY VIP",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "VIP غير محدود",
    "catalog": {
        "elantraCN7": {
            "name": "هيونداي إلنترا CN7 موديل 2024",
            "price": "800 ج.م / يوم (5000 ج.م أسبوعي)",
            "details": "أوتوماتيك، شاشة، كاميرا، فرش جلد، تسليم فوري"
        },
        "kiaCerato": {
            "name": "كيا سيراتو 2024",
            "price": "750 ج.م / يوم (4800 ج.م أسبوعي)",
            "details": "اقتصادية بالبنزين، عائلية، عداد مفتوح للعقود الأسبوعية"
        },
        "toyotaFortuner": {
            "name": "تويوتا فورتشنر 4x4",
            "price": "1800 ج.م / يوم (11500 ج.م أسبوعي)",
            "details": "دفع رباعي 7 ركاب، مثالية للسفر والمشاوير الصحراوية"
        }
    },
    "pricingRules": {
        "currency": "SAR / EGP",
        "insuranceDepositRequired": true
    },
    "systemPrompt": "أنت مسؤول الحجوزات لشركة الخضر لتأجير السيارات. تعرض أسطول السيارات والأسعار اليومية والأسبوعية وشروط التأجير وتستلم صور الرخص لحجز السيارة."
},

  "al_shomoukh_dentistry": {
    "id": "al_shomoukh_dentistry",
    "studioId": "brand_1786261318926",
    "name": "الشموخ لطب الأسنان",
    "englishName": "Al-Shomoukh Dentistry",
    "category": "رعاية صحية وطب أسنان",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01114844884",
    "whatsapp": "201114844884",
    "primaryColor": "#0f766e",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/Xr4C7S3X/image.png",
    "address": "أول فيصل، أعلى معرض سيارات الأبيض، برج النصر، الدور السادس",
    "locationUrl": "https://maps.app.goo.gl/B3FhpYjyQxVzqfRy7",
    "metaPageId": "1036068363157622",
    "metaPageName": "Dr. Abdelaziz Moussa - Al-shomoukh Dentistry",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "implants": {
            "name": "زراعة الأسنان الفورية وتجميل الفكين بأحدث التقنيات الألمانية",
            "price": "كشف واستشارة مجانية"
        },
        "hollywoodSmile": {
            "name": "ابتسامة هوليود وفينير وعدسات إيماكس عالية الدقة",
            "price": "عروض تقسيط متاحة"
        },
        "teethCleaning": {
            "name": "تنظيف الجير وتلميع الأسنان وإزالة التصبغات بجهاز الكافيترون",
            "price": "جلسة سريعة بدون ألم"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ الشموخ لطب الأسنان. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "clean_master": {
    "id": "clean_master",
    "studioId": "brand_1788540631941",
    "name": "كلين ماستر",
    "englishName": "Clean Master",
    "category": "خدمات عامة وحجوزات",
    "source": "unified",
    "status": "شغال",
    "conversationsCount": 221,
    "phone": "201013373634",
    "whatsapp": "201013373634",
    "primaryColor": "#0d9488",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/Kc8C6fkx/image.png",
    "address": "المهندسين الجيزة",
    "locationUrl": "https://cleanmaster-lac.vercel.app/",
    "metaPageId": "355285914324865",
    "metaPageName": "كلين ماستر clean master",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "VIP غير محدود",
    "catalog": {
        "mosqueCarpets": {
            "name": "غسيل سجاد وموكيت المساجد ودور العبادة بالبخار الحار",
            "price": "7 ج.م / م²",
            "details": "غسيل في المكان بماكينات ضغط وشفط إيطالية وتجفيف فوري"
        },
        "homeDeepCleaning": {
            "name": "تنظيف وتطهير المنازل والشقق ما بعد التشطيب والمفروشة",
            "price": "10 - 14 ج.م / م²",
            "details": "تطهير شامل للأرضيات والرخام والحمامات والمطابخ"
        },
        "sofaUpholstery": {
            "name": "غسيل وتطهير أطقم الكنب والإنتريهات بالرغوة الجافة",
            "price": "450 ج.م / طقم",
            "details": "إزالة أصعب البقع والتعقيم بالبخار الحار"
        }
    },
    "pricingRules": {
        "minimumOrder": 300,
        "inspectionFee": 0,
        "electronicDiscountPct": 10,
        "currency": "EGP"
    },
    "systemPrompt": "أنت مسؤول خدمة العملاء والحجوزات الرسمي لشركة كلين ماستر. تتحدث بلهجة مصرية محترفة وسريعة وتقوم بتأكيد مواعيد الزيارة والعناوين وتوضيح الأسعار والخصومات."
},

  "t2_studio": {
    "id": "t2_studio",
    "studioId": "brand_1789238625448",
    "name": "T2 Studio",
    "englishName": "T2 Studio",
    "category": "تسويق ونمو رقمي وأتمتة",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "+966 50 123 4567",
    "whatsapp": "+966 50 123 4567",
    "primaryColor": "#2563eb",
    "accentColor": "#38bdf8",
    "logoUrl": "https://api.dicebear.com/7.x/initials/svg?seed=T2%20Studio",
    "address": "القاهره - مصر",
    "locationUrl": "",
    "metaPageId": "111155044732876",
    "metaPageName": "تيتو ميديا  - T2 Media",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "contentProduction": {
            "name": "إنتاج محتوى مرئي وتصوير إعلانات سوشيال ميديا احترافية",
            "price": "باقات شهرية"
        },
        "sponsoredAds": {
            "name": "إدارة وتوجيه الحملات الإعلانية الممولة على فيسبوك وتيك توك وجوجل",
            "price": "استهداف دقيق"
        },
        "aiAutomations": {
            "name": "ربط وكلاء الذكاء الاصطناعي وأنظمة الرد الآلي للواتساب والماسنجر",
            "price": "تكامل كامل"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ T2 Studio. تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "almeshwar_rent_car": {
    "id": "almeshwar_rent_car",
    "studioId": "brand_1789888817820",
    "name": "المشوار لتأجير السيارات",
    "englishName": "Al meshwar rent car",
    "category": "تأجير سيارات وسياحة",
    "source": "studio",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "0112716060",
    "whatsapp": "0112716060",
    "primaryColor": "#d93d42",
    "accentColor": "#38bdf8",
    "logoUrl": "https://i.ibb.co/PZskjJCd/00d71b914230.jpg",
    "address": "المملكة العربية السعودية",
    "locationUrl": "",
    "metaPageId": "111155044732876",
    "metaPageName": "تيتو ميديا  - T2 Media",
    "metaToken": "EAAaEIxaL5OsBRDqt5YIdeWEbZCuU3oNoc1AnXAkiFKa8iLbQ5rUKi8TzrNXgbW5TIQwUZB3svnKiwm77XFZCM78ccb9RFRb3Ig7wzNANZAB61heN7Q8hX2Iznyxh4KyZCOuUmxZCjbuQAmSZAkZC5csct7LxelHMEL9tA73ToUGWqEO5fcb7tzo0jPa0pc0Co2YYOnjBZBKpD2DFNIl0ZAguHGnewAgEN2sXNXI9YxmWahdVQ4boWA7KPZC8rrjGXxfj3MZB91BjOp4IAz2sQhliDgEXuLA4GG1HG2m7pOAZC",
    "subscriptionPlan": "خطة المؤسسات الموحدة",
    "catalog": {
        "dailyRentals": {
            "name": "تأجير سيارات يومي وأسبوعي (موديلات حديثة)",
            "price": "أسعار تبدأ من 700 ج.م"
        },
        "vipChauffeur": {
            "name": "خدمات الليموزين وسيارات VIP بالسائق للمشاوير والمطارات",
            "price": "تغطية 24/7"
        },
        "corporateLease": {
            "name": "عقود تأجير سيارات شهرية وسنوية للشركات والمؤسسات",
            "price": "خصومات للشركات"
        }
    },
    "pricingRules": {
        "currency": "EGP / SAR"
    },
    "systemPrompt": "أنت المساعد الذكي الرسمي لـ المشوار لتأجير السيارات . تتواصل مع العملاء باحترافية وتجيب عن الاستفسارات وتجمع متطلبات الخدمة لتأكيد الحجز."
},

  "battah_system": {
    "id": "battah_system",
    "studioId": "battah_system",
    "name": "متجر بطاح لقطع غيار السيارات والكماليات",
    "englishName": "Battah Auto Parts",
    "category": "متجر إلكتروني وتجارة رقمية",
    "source": "unified",
    "status": "متوقف",
    "conversationsCount": 0,
    "phone": "01013373634",
    "whatsapp": "201013373634",
    "primaryColor": "#B91C1C",
    "accentColor": "#EF4444",
    "address": "القاهرة، مصر - شحن فوري لكافة المحافظات",
    "subscriptionPlan": "VIP غير محدود",
    "catalog": {
        "brakePads": {
            "name": "تيل فرامل أصلي معتمد",
            "price": "خصم 10% دفع إلكتروني مسبق"
        },
        "engineFilters": {
            "name": "فلاتر زيت وهواء وتكييف معتمدة",
            "price": "خصم 10% فوري"
        },
        "sparkPlugs": {
            "name": "بوجيهات إيريديوم ليزر وسير كاتينة ألماني",
            "price": "شحن 24-48 ساعة"
        }
    },
    "pricingRules": {
        "currency": "EGP",
        "prepayDiscountPercent": 10,
        "paymentPhone": "01013373634"
    },
    "systemPrompt": "أنت مسؤول المبيعات والمشتريات الرسمي لمتجر بطاح لقطع غيار السيارات عبر واتساب. تعرض التوافق الفني وتجمع تفاصيل الطلب وتوضح خصم الدفع المسبق."
},

  "besho": {
    "id": "besho",
    "studioId": "besho",
    "name": "Sale Gates Egypt",
    "englishName": "Sale Gates Egypt",
    "category": "منصة بيع وعقارات",
    "source": "agent",
    "status": "شغال",
    "conversationsCount": 59,
    "phone": "011111462944",
    "whatsapp": "201111462944",
    "primaryColor": "#059669",
    "accentColor": "#10B981",
    "address": "القاهرة، مصر - مشروعات العاصمة الإدارية والشيخ زايد والتجمع الخامس",
    "subscriptionPlan": "VIP غير محدود",
    "catalog": {
        "residentialUnits": {
            "name": "شقق ودوبلكس بكمبوندات راقية مع تسهيلات سداد حتى 8 سنوات"
        },
        "commercialOffices": {
            "name": "محلات تجارية ومكاتب إدارية في مواقع حيوية بعائد استثماري"
        },
        "villasLuxury": {
            "name": "فيلات مستقلة وتاون هاوس استلام فوري وتقسيط"
        }
    },
    "pricingRules": {
        "currency": "EGP",
        "consultationFee": "مجاناً"
    },
    "systemPrompt": "أنت المستشار العقاري الذكي لمنصة Sale Gates Egypt. تتواصل مع العملاء لتحديد نوع العقار المطلوب والميزانية وترتيب المعاينة الميدانية."
}
};

export const getBrandConfig = (brandId: string): BrandConfig | undefined => {
  return BRAND_VAULT[brandId];
};

export const getAllBrands = (): BrandConfig[] => {
  return Object.values(BRAND_VAULT);
};

export const getBrandsByCategory = (category: string): BrandConfig[] => {
  return Object.values(BRAND_VAULT).filter(b => b.category === category);
};

export const getBrandByPhone = (phone: string): BrandConfig | undefined => {
  const clean = phone.replace(/[^0-9]/g, '');
  return Object.values(BRAND_VAULT).find(b => {
    const bPhone = (b.phone || '').replace(/[^0-9]/g, '');
    const bWa = (b.whatsapp || '').replace(/[^0-9]/g, '');
    return bPhone.endsWith(clean) || bWa.endsWith(clean) || clean.endsWith(bPhone) || clean.endsWith(bWa);
  });
};

export const getBrandByMetaPageId = (pageId: string): BrandConfig | undefined => {
  return Object.values(BRAND_VAULT).find(b => b.metaPageId === pageId);
};
