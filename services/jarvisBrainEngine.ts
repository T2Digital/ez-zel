import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import {
  executeRealJarvisEcosystemAction,
  getUnifiedGrowthBrands,
  getEzZelPersonalClients,
  persistBrandUpdateAcrossEcosystem,
} from "./obsidianVaultService";
import { titoStudioApi, getTitoStudioBaseUrl } from "./titoStudioApiClient";
import { t2AgentApi, getT2AgentBaseUrl } from "./t2AgentApiClient";
import { runLiveEcosystemHealthProbe } from "./ecosystemConfigService";
import { syncBrandToAllEcosystems } from "./universalBrandSync";
import { saveGeneratedMedia } from "./mediaStorageService";
import { generateBrandingAndSocialKit, saveBrandedClientToVault } from "./brandingForgeService";
import { resolveFlagshipTemplate, FLAGSHIP_TEMPLATES } from "./tenantFactory";
import { readPersistentJson, savePersistentJson } from "./persistentStorage";
import { getDynamicSaasPlans } from "./saasPlansService";
import { readPaymobSubscriptions } from "./paymobService";
import { ACTIVE_GEMINI_TEXT_MODELS } from "./geminiKeyPool";

export interface JarvisBrainInput {
  message: string;
  history?: Array<{ role: string; text: string }>;
  persona?: "tito" | "visitor" | "trial" | "client" | string;
  selectedBrandId?: string;
  recentChatSummary?: string;
  skipTts?: boolean;
  ai: GoogleGenAI;
  stats: any;
  synthesizeSpeech: (text: string, voice?: string) => Promise<Buffer>;
}

export interface JarvisBrainOutput {
  success: boolean;
  replyText: string;
  detectedVisitorName?: string;
  quickChips?: string[];
  audioBase64: string | null;
  audioFormat: "audio/wav" | "audio/mp3";
  action: any;
  executionResult: any;
  shouldTriggerBrowser: boolean;
  suggestedScenario: string;
  resolvedBrandId: string;
}

/**
 * Maps internal ez-zel brand IDs/slugs/names to their real Tito Studio Firestore clinic document ID
 * so that phantom documents like `tito_media` (name: undefined) or fallback `"1"` (الشموخ) are never selected.
 */
export function resolveRealStudioClinicFromList(
  liveList: any[],
  brandId?: string,
  targetBrand?: any,
  message?: string,
  explicitArg?: string
): { clinicId: string; matchedBrand: any } {
  const norm = (s: any) => String(s || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const STUDIO_ALIAS_MAP: Record<string, string> = {
    titomedia: "brand_1779847291377",
    t2media: "brand_1779847291377",
    t2studio: "brand_1779847291377",
    t2digitalos: "brand_1779847291377",
    cleanmaster: "brand_1788540631941",
    autohouse: "brand_1794892093806",
    alkhedr: "brand_1785774967683",
    kyan: "brand_1782148514207",
    albaraka: "brand_1780863827841",
    skyvip: "brand_1780593467882",
    fazaa: "brand_1783239457203",
    almeshwar: "brand_1789888817820",
    cryptobelarabi: "brand_1779846650608",
  };

  const validList = (Array.isArray(liveList) ? liveList : []).filter(
    (sb: any) => sb && sb.id && sb.name && String(sb.name) !== "undefined"
  );

  const candidates = [explicitArg, brandId, targetBrand?.id, targetBrand?.slug, targetBrand?.name].filter(Boolean);
  for (const c of candidates) {
    const k = norm(c);
    const aliasTarget = STUDIO_ALIAS_MAP[k];
    if (aliasTarget) {
      const found = validList.find((sb: any) => String(sb.id) === aliasTarget);
      if (found) return { clinicId: String(found.id), matchedBrand: found };
      return { clinicId: aliasTarget, matchedBrand: null };
    }
  }

  const msgLower = String(message || "").toLowerCase();
  if (/تيتو\s*ميديا|tito\s*media|t2\s*media/i.test(msgLower)) {
    const found = validList.find((sb: any) => String(sb.id) === "brand_1779847291377");
    return { clinicId: "brand_1779847291377", matchedBrand: found || null };
  }

  const needle = String(explicitArg || targetBrand?.name || brandId || message || "").toLowerCase();
  // Prefer brands that actually have a connected Meta page or genuine name match
  const matched =
    validList.find(
      (sb: any) =>
        sb.selectedMetaPage?.id &&
        (String(sb.id).toLowerCase() === String(brandId || "").toLowerCase() ||
          (sb.name && needle.includes(String(sb.name).toLowerCase())) ||
          (sb.englishName && needle.includes(String(sb.englishName).toLowerCase())) ||
          (targetBrand?.name &&
            (String(sb.name || "").includes(targetBrand.name) || targetBrand.name.includes(String(sb.name || "")))))
    ) ||
    validList.find(
      (sb: any) =>
        String(sb.id).toLowerCase() === String(brandId || "").toLowerCase() ||
        (sb.name && needle.includes(String(sb.name).toLowerCase())) ||
        (sb.englishName && needle.includes(String(sb.englishName).toLowerCase())) ||
        (targetBrand?.name &&
          (String(sb.name || "").includes(targetBrand.name) || targetBrand.name.includes(String(sb.name || ""))))
    );

  if (matched?.id) {
    return { clinicId: String(matched.id), matchedBrand: matched };
  }

  const defaultTito = validList.find((sb: any) => String(sb.id) === "brand_1779847291377");
  return {
    clinicId: defaultTito ? String(defaultTito.id) : String(brandId && brandId !== "tito_media" ? brandId : "brand_1779847291377"),
    matchedBrand: defaultTito || null,
  };
}

/**
 * Dynamically resolves any brand across the entire unified ecosystem (Tito Studio, Tito Agent, PWA Cloner, Obsidian Vault)
 * by ID, slug, exact name, partial Arabic/English name, or businessType keywords.
 */
export function resolveBrandDynamically(
  queryOrId: string | undefined,
  messageText: string,
  unifiedBrands: any[]
): any {
  if (!unifiedBrands || unifiedBrands.length === 0) return null;

  // 1. Direct ID or slug match from explicit tool argument
  if (queryOrId && queryOrId.trim()) {
    const q = queryOrId.trim().toLowerCase();
    const qNorm = q.replace(/[-_]+/g, "-");
    const direct = unifiedBrands.find(
      (b) =>
        String(b.id || "").toLowerCase() === q ||
        String(b.slug || "").toLowerCase().replace(/[-_]+/g, "-") === qNorm ||
        String(b.name || "").toLowerCase() === q
    );
    if (direct) return direct;

    const partial = unifiedBrands.find(
      (b) =>
        String(b.name || "").toLowerCase().includes(q) ||
        q.includes(String(b.name || "").toLowerCase()) ||
        String(b.id || "").toLowerCase().includes(q)
    );
    if (partial) return partial;
  }

  // 2. Scan user's natural Egyptian Arabic message against ALL brands dynamically
  const msg = messageText.toLowerCase();
  let bestMatch: any = null;
  let bestScore = 0;

  for (const b of unifiedBrands) {
    const name = String(b.name || "").toLowerCase();
    const id = String(b.id || "").toLowerCase();
    const slug = String(b.slug || "").toLowerCase();
    let score = 0;

    if (name && msg.includes(name)) score += 100;
    if (id && id.length > 2 && msg.includes(id)) score += 90;
    if (slug && slug.length > 2 && msg.includes(slug)) score += 90;

    // Token-level overlap (e.g., "كريستال", "الخضر", "بطاح", "كلين ماستر", or any newly registered brand!)
    const tokens = name.split(/[\s\-_()/]+/).filter((t) => t.length >= 3);
    for (const token of tokens) {
      if (
        !["شركة", "عيادة", "مركز", "مكتب", "متجر", "خدمات", "للطب", "لطب"].includes(token) &&
        msg.includes(token)
      ) {
        score += 35;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = b;
    }
  }

  if (bestMatch && bestScore >= 35) return bestMatch;

  return null;
}

const jarvisBrainTools: FunctionDeclaration[] = [
  {
    name: "update_store_catalog",
    description:
      "إضافة أو تعديل خدمة أو منتج أو باقة داخل متجر PWA وكتالوج أي براند بناءً على طلب المستخدم الصوتي أو النصي.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        brandNameOrId: {
          type: Type.STRING,
          description: "اسم البراند أو المعرف الخاص به كما ورد في حديث المستخدم أو البراند المحدد حالياً.",
        },
        serviceName: {
          type: Type.STRING,
          description: "اسم الخدمة أو المنتج المطلوب إضافته أو تعديله.",
        },
        servicePrice: {
          type: Type.STRING,
          description: "سعر الخدمة بالجنيه المصري (مثال: '650 ج.م').",
        },
      },
      required: ["serviceName"],
    },
  },
  {
    name: "update_bot_instructions",
    description:
      "تعديل أو تحديث تعليمات أو برومبت أو أسلوب رد وكيل الواتساب الذكي (Tito Agent) الخاص ببراند معين.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        brandNameOrId: {
          type: Type.STRING,
          description: "اسم البراند أو المعرف الخاص به.",
        },
        systemInstruction: {
          type: Type.STRING,
          description: "التعليمات الجديدة لوكيل الواتساب.",
        },
      },
      required: ["systemInstruction"],
    },
  },
  {
    name: "create_and_publish_post",
    description:
      "إنشاء فكرة بوست أو منشور تسويقي في تيتو ستوديو لبراند معين، مع خيار النشر الفوري على ميتا أو الجدولة.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        brandNameOrId: {
          type: Type.STRING,
          description: "اسم البراند أو المعرف الخاص به.",
        },
        topic: {
          type: Type.STRING,
          description: "موضوع أو فكرة المنشور المطلوب إنشاؤه للبراند.",
        },
        publishNow: {
          type: Type.BOOLEAN,
          description: "true إذا طلب المستخدم النشر فوراً الآن، false إذا طلب الإنشاء أو الجدولة فقط.",
        },
      },
      required: ["publishNow"],
    },
  },
  {
    name: "launch_meta_ad",
    description:
      "إطلاق حملة إعلانية ممولة على فيسبوك وإنستجرام (Click-to-WhatsApp) بميزانية محددة لبراند معين.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        brandNameOrId: {
          type: Type.STRING,
          description: "اسم البراند أو المعرف الخاص به.",
        },
        budgetEgp: {
          type: Type.NUMBER,
          description: "ميزانية الإعلان بالجنيه المصري (الافتراضي 2000 إذا لم يحدد المستخدم).",
        },
      },
      required: ["budgetEgp"],
    },
  },
  {
    name: "navigate_jarvis_ui",
    description:
      "التحكم في واجهة جارفيس: استخدم SWITCH_BRAND عندما يطلب المستخدم الانتقال لبراند معين أو فتح شاشة/لوحة براند كذا (سيفتح شاشة البراند الشاملة ذات الأركان الأربعة في مربع العرض مكان الشبكة)، أو SWITCH_TAB لتبديل التبويب، أو OPEN_MODAL لربط واتساب/ميتا. لا تستخدم OPEN_BRAND_SUPER_WINDOW إلا إذا طلب المستخدم نافذة القيادة المتعددة بالاسم.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        actionType: {
          type: Type.STRING,
          enum: ["SWITCH_BRAND", "SWITCH_TAB", "OPEN_MODAL", "TOGGLE_BOT", "OPEN_BRAND_SUPER_WINDOW"],
          description: "نوع إجراء الواجهة المطلوب.",
        },
        tab: {
          type: Type.STRING,
          enum: [
            "obsidian_graph",
            "studio_calendar",
            "content_post_card",
            "agent_fleet",
            "app_cloner",
            "ad_launcher",
            "vault_crm",
            "agency_overview",
          ],
          description: "اسم التبويب المطلوب عند اختيار SWITCH_TAB.",
        },
        modal: {
          type: Type.STRING,
          enum: ["whatsapp_connect", "meta_connect"],
          description: "اسم النافذة المنبثقة عند اختيار OPEN_MODAL.",
        },
        brandNameOrId: {
          type: Type.STRING,
          description: "اسم البراند أو المعرف المرتبط بالإجراء.",
        },
        botStatus: {
          type: Type.STRING,
          enum: ["paused", "active"],
          description: "حالة البوت عند اختيار TOGGLE_BOT.",
        },
      },
      required: ["actionType"],
    },
  },
  {
    name: "record_visitor_diagnostic",
    description:
      "تسجيل بيانات التشخيص للزائر الجديد (هل لديه نشاط قائم، موقع، صفحات تواصل اجتماعي، مجاله، ورقم هاتفه) أثناء الحوار الاستشاري.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        hasExistingBusiness: { type: Type.BOOLEAN },
        hasWebsite: { type: Type.BOOLEAN },
        hasSocialPages: { type: Type.BOOLEAN },
        industry: { type: Type.STRING },
        businessName: { type: Type.STRING },
        phone: { type: Type.STRING },
      },
    },
  },
  {
    name: "tito_studio_brand_manager",
    description:
      "إدارة البراندات في تيتو ستوديو السحابي: جلب البراندات، إنشاء براند جديد ومزامنته، تحديث بياناته، توليد ميثاق الهوية (Brand Kit: الرسالة والرؤية والألوان)، أو استخلاص بيانات موقع منافس/عميل من رابط URL.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["list_brands", "create_brand", "update_brand", "generate_brand_kit", "scrape_url"],
        },
        brandNameOrId: { type: Type.STRING },
        industry: { type: Type.STRING },
        phone: { type: Type.STRING },
        primaryColor: { type: Type.STRING },
        description: { type: Type.STRING },
        url: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "tito_studio_content_and_recycle",
    description:
      "إدارة التقويم والمحتوى في تيتو ستوديو: استعراض المنشورات، إعادة تدوير منشور بعد 30 يوم بهوك ذكي جديد، حذف منشور، أو فحص طابور المنشورات المستحقة للنشر.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["list_content", "recycle_30_days", "delete_content", "check_due_queue"],
        },
        brandNameOrId: { type: Type.STRING },
        contentId: { type: Type.STRING },
        daysAhead: { type: Type.NUMBER },
      },
      required: ["action"],
    },
  },
  {
    name: "tito_studio_ideas_and_appointments",
    description:
      "إدارة بنك الأفكار التسويقية وحجوزات ومواعيد العملاء في تيتو ستوديو: إضافة أو عرض الأفكار، استعراض الحجوزات، تسجيل حجز عميل جديد، أو تأكيد/إلغاء حجز.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["list_ideas", "create_idea", "list_appointments", "create_appointment", "update_appointment"],
        },
        brandNameOrId: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        patientName: { type: Type.STRING },
        phone: { type: Type.STRING },
        service: { type: Type.STRING },
        date: { type: Type.STRING },
        time: { type: Type.STRING },
        appointmentId: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["pending", "confirmed", "cancelled", "completed"] },
      },
      required: ["action"],
    },
  },
  {
    name: "tito_studio_autopilot_and_trends",
    description:
      "تشغيل الأوتوبايلوت في تيتو ستوديو لتوليد مسودة تلقائية أو التصفح السحابي الافتراضي لاقتناص تريندات السوق وتحويلها لمحتوى جاهز.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["run_autopilot", "virtual_browse_trends"],
        },
        brandNameOrId: { type: Type.STRING },
        queryFocus: { type: Type.STRING, description: "موضوع التريند أو البحث المطلوب اقتناصه." },
      },
      required: ["action"],
    },
  },
  {
    name: "tito_studio_omnichannel_publish",
    description:
      "النشر الفوري على جميع المنصات المفعلة (فيسبوك، إنستجرام، تيك توك، يوتيوب شورتس، سناب شات، جوجل بزنس وخرائط جوجل Google Business & Maps، منصة X) أو جلب والرد الذكي على تعليقات ميتا وسناب شات وتقييمات خرائط جوجل.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: [
            "publish_tiktok",
            "publish_youtube",
            "publish_snapchat",
            "publish_x",
            "publish_google_business",
            "list_comments",
            "reply_comment",
            "reply_snapchat_comment",
            "list_google_reviews",
            "reply_google_review",
          ],
        },
        brandNameOrId: { type: Type.STRING },
        caption: { type: Type.STRING },
        title: { type: Type.STRING },
        mediaUrl: { type: Type.STRING },
        commentId: { type: Type.STRING },
        pageId: { type: Type.STRING },
        reviewId: { type: Type.STRING },
        reviewerName: { type: Type.STRING },
        commentText: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "onboard_new_client_brand",
    description:
      "أداة تأسيس العميل والبراند الجديد من الصفر: تقترح على العميل 3 أسماء براند مميزة ليختار منها + 3 سلوجانات بيعية رنانة + تصمم له شعاراً حقيقياً بالذكاء الاصطناعي (AI Logo) + ترشح له تطبيق الويب المناسب (Battah للمنتجات أو Clean Master للخدمات) + تجهز خطوة ربط واتساب وباقي المنصات المفعلة.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        businessIdeaOrName: { type: Type.STRING, description: "فكرة النشاط أو الاسم المبدئي أو مجال العمل" },
        category: { type: Type.STRING, description: "نوع النشاط (بيع منتجات أم حجز خدمات، ومجاله التخصصي)" },
        phone: { type: Type.STRING, description: "رقم واتساب/هاتف العميل إن وجد" },
        isNewBusiness: { type: Type.BOOLEAN, description: "true إذا كان بيزنس جديد من الصفر" },
        provisionWebApp: { type: Type.BOOLEAN, description: "true إذا طلب العميل إطلاق تطبيق الويب فوراً" },
      },
      required: ["category"],
    },
  },
  {
    name: "tito_studio_ads_and_sales_radar",
    description:
      "رادار المبيعات والحملات في تيتو ستوديو: استعراض العملاء المحتملين (Hot Leads)، تحليل تعليق عميل وصياغة عرض DM، توليد حملة إعلانية، عرض/إيقاف/تشغيل الحملات، جلب تحليلات ROAS، إرسال واتساب أو تنبيه تيليجرام.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: [
            "list_leads",
            "analyze_lead_comment",
            "generate_ai_ad",
            "list_campaigns",
            "toggle_campaign",
            "get_insights",
            "send_whatsapp",
            "test_alert",
          ],
        },
        brandNameOrId: { type: Type.STRING },
        comment: { type: Type.STRING },
        campaignName: { type: Type.STRING },
        dailyBudget: { type: Type.NUMBER },
        campaignId: { type: Type.STRING },
        campaignStatus: { type: Type.STRING, enum: ["ACTIVE", "PAUSED"] },
        phone: { type: Type.STRING },
        message: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "tito_studio_media_studio",
    description:
      "استوديو الميديا بالذكاء الاصطناعي في تيتو ستوديو: توليد صورة إعلانية فائقة الدقة، بدء توليد فيديو سينمائي 3D عبر Veo، أو استشارة المساعد التنفيذي زين.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["generate_image", "start_veo_video", "check_veo_video", "zain_copilot"],
        },
        brandNameOrId: { type: Type.STRING },
        prompt: { type: Type.STRING },
        operationName: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "show_dynamic_widget",
    description:
      "عرض Widget ديناميكي تفاعلي فوق الشبكة العصبية حسب طلب المستخدم: مؤشرات أداء وتحليلات حية، مقارنة بين براندين، ملف DNA البراند والطيار الآلي، أو مخطط حملة إعلانية.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        widgetType: {
          type: Type.STRING,
          enum: ["analytics_kpis", "brand_comparison", "brand_dna", "whatsapp_insights", "campaign_planner"],
        },
        brandNameOrId: { type: Type.STRING },
        secondBrandNameOrId: { type: Type.STRING, description: "يُستخدم عند مقارنة براندين." },
      },
      required: ["widgetType"],
    },
  },
  {
    name: "whatsapp_to_content_loop",
    description:
      "تحويل أكثر أسئلة العملاء المتكررة على الواتساب إلى أفكار وبوستات حقيقية مجدولة في تقويم تيتو ستوديو للبراند.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        brandNameOrId: { type: Type.STRING },
      },
    },
  },
  {
    name: "t2_agent_enterprise_control",
    description:
      "التحكم الكامل في منصة T2 AI Agent Enterprise (واتساب Baileys، الحجوزات، الحملات الجماعية، استعادة المبيعات المفقودة Re-engagement، روابط الدفع الفوري، والـ CRM الموحد).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: [
            "health_summary",
            "pair_whatsapp",
            "toggle_pause",
            "send_reply",
            "trigger_reengagement",
            "generate_payment_link",
            "start_broadcast",
            "list_bookings",
          ],
        },
        brandNameOrId: { type: Type.STRING },
        phone: { type: Type.STRING },
        message: { type: Type.STRING },
        customerName: { type: Type.STRING },
        serviceName: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        campaignName: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "check_ecosystem_health",
    description:
      "فحص الاتصال الحي بين المنصات الثلاث (سيرفر الظل/جارفس + تيتو ستوديو + تيتو أجنت) وفتح لوحة إعداد روابطهم ومفاتيحهم.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "tito_studio_remote_execute",
    description:
      "تنفيذ أي زر أو عملية داخل تيتو ستوديو عن بُعد (60 أمر: showroom.send, showroom.approve, showroom.request_revision, content.generate_copy, content.generate_design, content.generate_carousel, content.generate_voiceover, video.generate, publish.multi_platform, drama.generate_film, autopilot.run, autopilot.batch_produce, calendar.schedule_post, calendar.recycle_30d, ideas.generate_batch, ideas.convert_to_post, research.generate_report, branding.generate_and_save, metaAds.generate, metaAds.create, email.generate_campaign, email.send_campaign) وفتح شاشة الاستوديو المدمجة (embedView) للاعتماد المباشر.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: "اسم الأمر مثل showroom.approve أو content.generate_copy أو autopilot.batch_produce أو research.generate_report أو calendar.schedule_post",
        },
        brandNameOrId: {
          type: Type.STRING,
          description: "اسم البراند أو معرفه في تيتو ستوديو (مثل عيادة كريستال أو تيتو ميديا)",
        },
        embedView: {
          type: Type.STRING,
          description: "اسم الشاشة المراد عرضها داخل جارفيس: showroom, generator, videoHub, dramaFilm, calendar, workflowStudio, marketResearch, metaAds, salesRadar, emailMarketing, branding, ideas, analytics",
        },
        payloadJson: {
          type: Type.STRING,
          description: "JSON string اختياري لبيانات الأمر مثل itemId أو topic أو platforms",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "t2_agent_remote_execute",
    description:
      "تنفيذ أي زر أو عملية في تيتو أجنت عن بُعد (16 قسماً / 107 عملية: brands, whatsapp, crm, calendar, funnel, playground, broadcast_whatsapp, broadcast_facebook, re_engagement, followups, omnichannel, ecommerce, team, telemetry, payments, notifications, admin) وفتح شاشة أو مودال الأجنت المدمج (embedWindow: brands, crm, calendar, playground, broadcast-whatsapp, broadcast-facebook, re-engagement, funnel, omnichannel, ecommerce, team, telemetry, qr, catalog, integrations, new-booking, payment-link).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        section: {
          type: Type.STRING,
          description: "اسم القسم مثل whatsapp أو crm أو calendar أو brands أو broadcast_whatsapp أو ecommerce أو admin",
        },
        action: {
          type: Type.STRING,
          description: "اسم الأمر مثل create_booking أو send_reply أو toggle_pause أو get_qr أو activate_vip أو extract_catalog",
        },
        brandNameOrId: {
          type: Type.STRING,
          description: "اسم البراند أو معرفه في تيتو أجنت مثل clean_master أو alkhedr_car_rental أو battah_system",
        },
        embedWindow: {
          type: Type.STRING,
          description: "اسم نافذة التضمين المراد فتحها: brands, crm, calendar, playground, qr, catalog, broadcast-whatsapp, omnichannel, admin",
        },
        isAdminAction: {
          type: Type.BOOLEAN,
          description: "true إذا كان أمراً للمدير العام فقط (تفعيل باقات/VIP)",
        },
        payloadJson: {
          type: Type.STRING,
          description: "JSON string لبيانات الأمر",
        },
      },
      required: ["section", "action"],
    },
  },
  {
    name: "manage_store_erp",
    description:
      "الأداة التنفيذية الكاملة لإدارة متجر ونظام ERP/POS الخاص بالبراند: تقرأ كل تفصيلة وكل جنيه وكل منتج أو خدمة ومبيعات ومصاريف وخزينة وموظفين وموردين، وتنفذ تعديلات فورية (إضافة منتج، تعديل سعر/مخزون، تسجيل مبيعة أو مصروف، إضافة موظف/سلفة، إضافة مورد/فاتورة شراء، حركة خزينة، أو تعديل إعدادات المتجر) مع مزامنة لحظية للداشبورد.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: [
            "get_summary",
            "add_product",
            "update_price",
            "update_stock",
            "add_expense",
            "record_sale",
            "update_order_status",
            "add_employee",
            "record_advance",
            "add_supplier",
            "record_purchase",
            "add_treasury_tx",
            "update_store_settings",
            "customize_app",
          ],
          description: "العملية المطلوبة على المتجر ونظام الـ ERP",
        },
        brandSlugOrId: {
          type: Type.STRING,
          description: "معرف أو slug البراند مثل auto-house",
        },
        productName: { type: Type.STRING, description: "اسم المنتج أو الخدمة" },
        sku: { type: Type.STRING, description: "كود الصنف SKU" },
        category: { type: Type.STRING, description: "تصنيف المنتج أو المصروف" },
        price: { type: Type.NUMBER, description: "السعر الجديد بالجنيه" },
        stock: { type: Type.NUMBER, description: "الكمية بالمخزن أو الكمية المباعة في الفاتورة" },
        quantity: { type: Type.NUMBER, description: "الكمية المطلوبة في الفاتورة" },
        discount: { type: Type.NUMBER, description: "قيمة الخصم بالجنيه" },
        isTaxable: { type: Type.BOOLEAN, description: "هل الفاتورة ضريبية (+14% ضريبة قيمة مضافة)" },
        paymentMethod: { type: Type.STRING, description: "طريقة الدفع: نقدى، إلكتروني، آجل" },
        branch: { type: Type.STRING, description: "الفرع: main, branch1, branch2, branch3" },
        description: { type: Type.STRING, description: "وصف العملية أو المنتج أو المصروف" },
        amount: { type: Type.NUMBER, description: "المبلغ بالجنيه" },
        customerName: { type: Type.STRING, description: "اسم العميل" },
        orderId: { type: Type.STRING, description: "رقم الطلب" },
        status: { type: Type.STRING, description: "حالة الطلب" },
        employeeName: { type: Type.STRING, description: "اسم الموظف" },
        employeeRole: { type: Type.STRING, description: "المسمى الوظيفي للموظف" },
        salary: { type: Type.NUMBER, description: "الراتب الأساسي الشهري" },
        supplierName: { type: Type.STRING, description: "اسم المورد" },
        phone: { type: Type.STRING, description: "رقم الهاتف" },
        txType: { type: Type.STRING, description: "نوع حركة الخزينة: in (وارد) أو out (صادر)" },
        companyName: { type: Type.STRING, description: "اسم المتجر/الشركة في الإعدادات" },
        tickerText: { type: Type.STRING, description: "نص الشريط الإعلاني أعلى المتجر" },
        address: { type: Type.STRING, description: "عنوان المتجر الذي يظهر في الفوتر والفاتورة" },
        primaryColor: { type: Type.STRING, description: "لون الثيم الأساسي للمتجر والأزرار مثل #0284c7" },
        branchCount: { type: Type.NUMBER, description: "عدد الفروع الظاهرة في الفواتير (1 إلى 4)" },
        cashierCount: { type: Type.NUMBER, description: "عدد الكاشيرات الظاهرة في الفواتير (1 إلى 3)" },
        primaryBranchLabel: { type: Type.STRING, description: "اسم الفرع الأول أو الوحيد" },
        primaryCashierLabel: { type: Type.STRING, description: "اسم الكاشير الأول أو الوحيد" },
      },
      required: ["action"],
    },
  },
  {
    name: "edit_tenant_repo_code",
    description:
      "أداة الماستر تيتو البرمجية لتعديل الكود المصدري لأي تطبيق عميل أو قالب (مثل t2-tenant-auto-house أو battah أو clean-master-egy) على GitHub مع فحص صياغة TypeScript/esbuild إجباري قبل الرفع ونشر Vercel تلقائياً أو التراجع (Rollback).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["inspect_repo", "edit_code", "rollback"],
          description: "inspect_repo لقراءة ملفات المستودع، edit_code لتعديل ملف ورفعه بعد الفحص، rollback للتراجع عن آخر تعديل",
        },
        repoName: {
          type: Type.STRING,
          description: "اسم المستودع مثل t2-tenant-auto-house أو battah أو clean-master-egy",
        },
        filePath: {
          type: Type.STRING,
          description: "مسار الملف داخل المستودع مثل components/sales/DailySaleModal.tsx",
        },
        instruction: {
          type: Type.STRING,
          description: "وصف التعديل البرمجي الدقيق المطلوب تنفيذه في الملف",
        },
      },
      required: ["action", "repoName"],
    },
  },
];

function buildBrandLiveStatsSummary(brand: any, tenantRecords: Record<string, any[]>): string {
  if (!brand) return "لا يوجد براند محدد حالياً.";
  const records = tenantRecords?.[brand.id] || [];
  const revenueEgp = records.reduce((s: number, r: any) => s + (Number(r.totalEgp || r.price || 0) || 0), 0);
  const plan = Array.isArray(brand.weekContentPlan) ? brand.weekContentPlan : [];
  const publishedCount = plan.filter((p: any) => p.status === "PUBLISHED").length;
  const waConnected = Boolean(brand.phone || brand.whatsapp);
  const metaConnected = Boolean(brand.metaPageId || brand.metaToken);
  return [
    `الاسم: "${brand.name}" [id:${brand.id}] (${brand.businessType || "نشاط تجاري"})`,
    `رابط التطبيق: /app/${brand.slug || brand.id} (قالب: ${brand.appTemplate || "تلقائي"})`,
    `الطلبات/الحجوزات المسجلة: ${records.length} • الإيرادات المسجلة: ${revenueEgp} ج.م`,
    `خطة المحتوى: ${plan.length} منشورات (${publishedCount} منشور فعلياً)`,
    `واتساب: ${waConnected ? `مربوط (${brand.phone || brand.whatsapp})` : "غير مربوط"} • ميتا: ${metaConnected ? `متصل (${brand.metaPageName || brand.metaPageId})` : "غير متصل"}`
  ].join(" | ");
}

function buildPersonaSystemPrompt(
  persona: string,
  activeBrand: any,
  unifiedBrands: any[],
  ezzelClients: any[],
  recentChatSummary: string
): string {
  const tenantRecords = readPersistentJson<Record<string, any[]>>("tenant_records.json", {});
  const paymobSubs = readPersistentJson<any[]>("paymob_subscriptions.json", []);
  const trialClients = (ezzelClients || []).filter((c: any) => c.status === "trial");
  const paidClients = (ezzelClients || []).filter((c: any) => c.status === "active" || c.status === "paid");

  const allBrandsBrief = unifiedBrands
    .slice(0, 35)
    .map((b) => {
      const recs = tenantRecords?.[b.id] || [];
      return `${b.name} [id:${b.id}] (${b.businessType || "نشاط"}, طلبات:${recs.length})`;
    })
    .join(" | ");

  const activeBrandStats = buildBrandLiveStatsSummary(activeBrand, tenantRecords);
  let personaRoleInstruction = "";
  const activatedPlatformsKnowledge = `
[المنصات والقنوات المفعلة حالياً في المنظومة (T2 Studio + T2 Agent)]:
1. واتساب (WhatsApp عبر T2 Agent Baileys QR & Pairing Code للرد الذكي وحجز المواعيد واستعادة المبيعات).
2. ميتا: فيسبوك وإنستجرام (Facebook & Instagram: نشر Feed و Reels، سحب التعليقات، وردود ذكية تلقائية).
3. تيك توك (TikTok Creator API: النشر المباشر للفيديوهات + سحب تعليقات ورسائل العملاء للرد عليها عبر T2 Agent).
4. يوتيوب (YouTube Shorts: رفع ونشر الفيديوهات القصيرة والطويلة مع العناوين والوصف).
5. سناب شات (Snapchat Public Profile & Spotlight: نشر القصص والأضواء + جسر الرد الذكي على تعليقات ورسائل سناب عبر T2 Agent).
6. جوجل بزنس وخرائط جوجل (Google Business Profile & Maps): نشر البوستات والعروض على خرائط جوجل + سحب تقييمات العملاء والرد الذكي التلقائي عليها.
7. منصة إكس (X / Twitter).

[فنيات وتريكات الماستر تيتو في تيتو ستوديو (T2 Studio Craft)]:
- أسلوب "ابن البلد" في الكوبي: هوك مصري خاطف في أول سطر يلمس وجع أو رغبة العميل + كلام بسيط دافئ + عرض واضح + CTA مباشر برقم الواتساب.
- تريكة دمج الأبطال والمكان الحقيقي: عند طلب تصميم احترافي، فضّل دائماً استخدام صور المنتجات الحقيقية وخلفيات المكان الفعلي من مكتبة البراند والكتالوج بدل الصور المولدة العشوائية، واختر النوع الأنسب للهدف (تصميم Feed، إنفوجراف طبي/تعليمي، كاروسيل شرائح، مقارنة قبل وبعد، استنساخ ستايل ناجح، أو فيديو ريلز/فيلم درامي 10 مشاهد).
- دورة الإنتاج والاعتماد الاحترافية: توليد الفكرة/النسخة -> توليد التصميم الفعلي عبر content.generate_design في تيتو ستوديو -> إرسال لصالة العرض (showroom.send) -> اعتماد العميل (showroom.approve) -> النشر الفوري عبر publish.multi_platform على كل المنصات المتصلة للبراند (فيسبوك، إنستجرام، سناب شات، إكس، وللفيديوهات تيك توك ويوتيوب).
- أسلحة النمو المتقدمة: الأوتوبايلوت واقتناص التريندات (autopilot.virtual_browse)، الرد الذكي بالذكاء الاصطناعي على تعليقات السوشيال (comments.ai_reply)، وحملات ميتا والإيميل.

[فنيات وتريكات الماستر تيتو في تيتو أجنت (T2 Agent Craft)]:
- استخراج الكتالوج والزحف الذكي (Crawler) من موقع البراند لتغذية البوت بالأسعار والخدمات الحقيقية فوراً.
- قمع المبيعات الذكي: ربط واتساب (QR / Pairing Code) + تدريب البوت (playground) -> حجز المواعيد في التقويم -> توليد رابط دفع فوري -> إعادة استهداف العملاء غير المكتملين (re-engagement) وبث الحملات الآمن بتناوب الأرقام الإضافية.
- القاعدة الذهبية للتنفيذ: استخدم tito_studio_remote_execute لعمليات الاستوديو وt2_agent_remote_execute لعمليات الأجنت وmanage_store_erp لقراءة وتعديل منتجات وأسعار ومبيعات ومصاريف وطلبات المتجر مباشرة، وافتح النافذة المدمجة المناسبة للمستخدم ليراجع ويعتمد مباشرة.

[أهم تطبيقي ويب أساسيين للعملاء (Flagship Templates) — مع تغيير الهوية والواجهة وإعدادات العمل الداخلية لأي مجال]:
1. قالب بيع المنتجات الشامل (${FLAGSHIP_TEMPLATES.battah.repoUrl} — Live: ${FLAGSHIP_TEMPLATES.battah.referenceLiveUrl}):
   يدمج متجر إلكتروني + ERP + CRM + POS (نقطة بيع ومخازن) مع تخصيص كامل للهوية والواجهة وإعدادات الأدمن الداخلية حسب المجال (مناسب لأي نشاط بيع منتجات: متاجر، قطع غيار، ملابس، سوبر ماركت، مطاعم، صيدليات).
2. قالب حجز الخدمات الشامل (${FLAGSHIP_TEMPLATES.clean_master.repoUrl} — Live: ${FLAGSHIP_TEMPLATES.clean_master.referenceLiveUrl}):
   تطبيق خدمات ولوحة تحكم تضم تقويم الحجوزات + الماليات + CRM + شات بوت ذكي (مناسب لأي نشاط حجز خدمات: صيانة وتنظيف، عيادات ومراكز طبية، تأجير سيارات، عقارات، صالونات، سياحة).`;

  // 100% Dynamic Runtime Plan Catalog from Firestore/Persistent Overrides + Defaults (Zero Hardcoded Pricing/Quotas)
  const dynamicPlansBlock = Object.values(getDynamicSaasPlans())
    .map((p) => {
      const designsLabel = p.monthlyDesignsQuota < 0 ? "غير محدود" : `${p.monthlyDesignsQuota} تصميم`;
      const videosLabel = p.monthlyVideosQuota < 0 ? "غير محدود" : `${p.monthlyVideosQuota} فيديو`;
      const modeLabel = p.appAccessMode === "landing_page" ? "لاندنج بيدج من تيتو ستوديو" : "تطبيق ويب متكامل (PWA + ERP)";
      if (p.priceEgp === 0) {
        return `• ${p.nameAr}: ${modeLabel} + ${designsLabel} + ${videosLabel}`;
      }
      return `• ${p.nameAr}: (${p.adsBudgetEgp} ج.م إعلانات + ${p.systemFeeEgp} ج.م سيستم) ← ${designsLabel} + ${videosLabel} + ${modeLabel}`;
    })
    .join("\n");

  // Optional live Admin Brain Directive override from persistent storage / Firestore (0 static lock-in)
  const dynamicBrainOverride = readPersistentJson<{ customDirective?: string }>("t2_dynamic_brain_config.json", {})?.customDirective || "";

  if (persona === "visitor") {
    personaRoleInstruction = `المتحدث معك الآن هو "زائر جديد أو صاحب نشاط تجاري" يستكشف منظومة T2OS.
دورك معه: أنت "جارفيس"، مستشار الأعمال والنمو الرقمي بالمنظومة. تتحدث بالعامية المصرية الطبيعية الودودة.

[الباقات والخطط الحية الآن من قاعدة النظام]:
${dynamicPlansBlock}

قواعد صارمة:
1. ممنوع استخدام كلمة "استنساخ" أو "مستنسخ"، واستبدلها بـ "تأسيس، إطلاق، بناء، تجهيز، تخصيص، تفعيل".
2. ممنوع ذكر أي بيانات أو أرقام تخص براندات أخرى.
3. ممنوع ذكر أسماء الدوال البرمجية أو أسماء القوالب الداخلية.
4. إذا كان للزائر براند قائم، اعتمد اسمه فوراً ولا تقترح أسماء جديدة؛ وإذا كان يبدأ من الصفر اقترح 3 أسماء وسلوجانات.
5. استدعِ الأدوات بصمت عند طلب التأسيس الفعلي.`;
  } else if (persona === "trial" || persona === "client") {
    const clientSub = (ezzelClients || []).find((c: any) => c.linkedBrandId === activeBrand?.id);
    const subStatusNote = clientSub
      ? clientSub.status === "trial"
        ? `في فترة التجربة المجانية (تنتهي: ${clientSub.trialEndsAt || "غير محدد"})`
        : `مشترك مفعل (${clientSub.plan || "نشط"})`
      : persona === "trial"
        ? "في فترة التجربة المجانية"
        : "حساب عميل مفعل";
    personaRoleInstruction = `المتحدث معك الآن هو صاحب براند (${activeBrand?.name || "البراند"}) في وضع المدير التنفيذي.
حالة الاشتراك الحية: ${subStatusNote}.
بيانات براندك الحية الآن: ${activeBrandStats}

[باقات الترقية الحية من النظام]:
${dynamicPlansBlock}

ركز بالكامل على برانده فقط وممنوع ذكر أي براند آخر.`;
  } else {
    const trialList = trialClients.slice(0, 8).map((c: any) => `${c.name} (ينتهي ${c.trialEndsAt || "-"})`).join("، ") || "لا يوجد";
    const paidList = paidClients.slice(0, 8).map((c: any) => `${c.name} (${c.monthlySubscriptionEgp || 2500} ج.م)`).join("، ") || "لا يوجد";
    const mrrEgp = paidClients.reduce((s: number, c: any) => s + (Number(c.monthlySubscriptionEgp) || 0), 0);
    const allUnifiedNow = getUnifiedGrowthBrands();
    const regCounts = {
      active: allUnifiedNow.filter((b: any) => b.lifecycleStage === "active_client").length,
      trial: allUnifiedNow.filter((b: any) => b.lifecycleStage === "trial").length,
      self: allUnifiedNow.filter((b: any) => b.lifecycleStage === "self_growth").length,
      paused: allUnifiedNow.filter((b: any) => b.lifecycleStage === "paused_archive").length,
    };
    personaRoleInstruction = `المتحدث معك الآن هو الماستر "تيتو" — المالك والمدير العام لمنظومة T2OS.
دورك: أنت "جارفيس"، العقل التنفيذي الموحد المتصل لحظياً بقواعد البيانات (بدون أي أرقام محفوظة مسبقاً — كل بياناتك من الحقائق الحية أدناه فقط).

[الباقات الحية الآن من saasPlansService]:
${dynamicPlansBlock}

[البيانات الحية الآن من قواعد المنظومة]:
1. المشتركون المسجلون (${ezzelClients.length}): مدفوعون (${paidClients.length} بقيمة ${mrrEgp} ج.م: ${paidList}) | تجارب (${trialClients.length}: ${trialList}) | Paymob: ${paymobSubs.length}.
2. السجل الموحد للبراندات (توحيد البراندات): شغّال: ${regCounts.active} | تجربة: ${regCounts.trial} | تسويق للظل: ${regCounts.self} | متوقف/أرشيف: ${regCounts.paused}.
3. البراندات النشطة على الشبكة (${unifiedBrands.length}): ${allBrandsBrief || "لا توجد براندات نشطة حالياً (كلها في الأرشيف حتى يتم تشغيلها)"}
4. البراند المحدد حالياً: ${activeBrand ? activeBrandStats : "العرض العام للمنظومة"}.
${dynamicBrainOverride ? `\n[توجيهات إضافية محدثة]: ${dynamicBrainOverride}` : ""}`;
  }

  return `أنت "جارفيس" (Jarvis)، العقل التنفيذي الموحد لمنظومة T2OS من شركة T2 Digital.
${personaRoleInstruction}
${persona !== "visitor" ? activatedPlatformsKnowledge : ""}
${recentChatSummary ? `\n[سياق الذاكرة المشتركة مع شات الظل الرئيسي]: ${recentChatSummary}` : ""}

قواعد صارمة لشخصية جارفيس المتحدث (Executive Poise):
- تحدث بالعامية المصرية المهذبة والرزينة (بدون مبالغة أو كلام إنشائي) لصوت طبيعي واضح.
- أجب بأرقام وحقائق حقيقية من الذاكرة الحية أو من نتائج الأدوات فقط — ممنوع تأليف أي رقم أو سعر أو حالة غير موجودة.
- عند أي أمر تنفيذي (نشر، تعديل سعر، إضافة منتج، مصروف، موظف، مورد، خزينة، ربط واتساب): نفّذ الأداة أولاً ثم قدّم تقريراً تنفيذياً دقيقاً في جملة أو جملتين.
- عند أي سؤال عن المنتجات أو الأسعار أو المخزون أو المبيعات أو المصاريف أو تأكيد وجود/إضافة منتج في المتجر: استخدم 'manage_store_erp' ('get_summary' أو 'add_product' أو 'update_price') فوراً — وممنوع خلط طلبات المتجر بأدوات النشر على السوشيال ميديا ('create_and_publish_post').
- لا تكرر تقارير قديمة إلا إذا سألك المستخدم عنها مباشرة.`;
}

async function fetchLiveEcosystemFromStudioAndAgent(persona: string, selectedBrandId: string): Promise<string> {
  if (persona === "visitor") return "";
  const withTimeout = <T>(p: Promise<T>, ms = 2200): Promise<T | null> =>
    Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]).catch(() => null);

  try {
    const [studioBrandsRes, agentHealthRes, brandBookingsRes, liveErpSummary] = await Promise.all([
      persona === "tito" ? withTimeout(titoStudioApi.listBrands()) : Promise.resolve(null),
      persona === "tito" ? withTimeout(t2AgentApi.getAllBrandsHealth()) : Promise.resolve(null),
      selectedBrandId ? withTimeout(t2AgentApi.getBookings(selectedBrandId)) : Promise.resolve(null),
      selectedBrandId ? withTimeout((async () => {
        const { loadTenantErpState, normalizeSlugKey } = await import("./tenantErpStoreService");
        const st = await loadTenantErpState(normalizeSlugKey(selectedBrandId));
        if (!st || typeof st !== "object") return null;
        const prods = Array.isArray(st.products) ? st.products : [];
        const sales = Array.isArray(st.dailySales) ? st.dailySales : [];
        const exps = Array.isArray(st.expenses) ? st.expenses : [];
        const emps = Array.isArray(st.employees) ? st.employees : [];
        const sups = Array.isArray(st.suppliers) ? st.suppliers : [];
        const treas = Array.isArray(st.treasury) ? st.treasury : [];
        const ords = Array.isArray(st.orders) ? st.orders : [];
        const totalSales = sales.reduce((s: number, x: any) => s + (Number(x.total || x.amount || 0) || 0), 0);
        const totalExps = exps.reduce((s: number, x: any) => s + (Number(x.amount || 0) || 0), 0);
        const treasBal = treas.reduce((s: number, x: any) => s + (Number(x.amountIn || 0) || 0) - (Number(x.amountOut || 0) || 0), 0);
        const topProds = prods.slice(0, 8).map((p: any) => `${p.name} (${p.sellingPrice || 0} ج.م، مخزون:${p.stock?.main ?? 0})`).join("، ");
        return `[بيانات Cloud ERP الحية للبراند (${selectedBrandId})]: المنتجات (${prods.length}${topProds ? `: ${topProds}` : ""}) | المبيعات: ${sales.length} (${totalSales} ج.م) | المصاريف: ${exps.length} (${totalExps} ج.م) | الخزينة: ${treasBal} ج.م | الموظفون: ${emps.length} | الموردون: ${sups.length} | الطلبات: ${ords.length}`;
      })(), 2200) : Promise.resolve(null),
    ]);

    const lines: string[] = [];
    const studioBrands = Array.isArray((studioBrandsRes as any)?.brands)
      ? (studioBrandsRes as any).brands
      : Array.isArray(studioBrandsRes)
        ? studioBrandsRes
        : [];
    if (studioBrands.length > 0) {
      lines.push(
        `• قاعدة بيانات تيتو ستوديو الحية (${studioBrands.length} براند): ` +
          studioBrands.slice(0, 15).map((b: any) => `${b.name || b.id}`).join("، ")
      );
    }

    const agentBrands = Array.isArray((agentHealthRes as any)?.brands)
      ? (agentHealthRes as any).brands
      : Array.isArray(agentHealthRes)
        ? agentHealthRes
        : [];
    if (agentBrands.length > 0) {
      const isBrandConnected = (b: any) =>
        b?.connected === true ||
        String(b?.status || "").toUpperCase() === "CONNECTED" ||
        String(b?.status || "").toUpperCase() === "OPEN" ||
        String(b?.status || "").toUpperCase() === "READY";
      const registryBrands = getUnifiedGrowthBrands();
      const nonPausedKeys = new Set<string>();
      registryBrands
        .filter((rb: any) => rb?.lifecycleStage !== "paused_archive")
        .forEach((rb: any) => {
          [rb.id, rb.slug, rb.canonicalId, rb.agentBrandId].filter(Boolean).forEach((k: any) =>
            nonPausedKeys.add(String(k).toLowerCase())
          );
        });
      const isPausedInRegistry = (b: any) => {
        if (nonPausedKeys.size === 0) return true;
        const keys = [b?.brandId, b?.id, b?.slug].filter(Boolean).map((k: any) => String(k).toLowerCase());
        return !keys.some((k: string) => nonPausedKeys.has(k));
      };
      const disconnectedList = agentBrands
        .filter((b: any) => !isBrandConnected(b) && !isPausedInRegistry(b))
        .map((b: any) => `${b.brandName || b.brandId || b.id} (${b.status || "DISCONNECTED"})`);
      lines.push(
        `• قاعدة بيانات تيتو أجنت الحية (${agentBrands.length} جلسة واتساب): ` +
          agentBrands
            .slice(0, 15)
            .map((b: any) => `${b.brandName || b.brandId || b.id} (${isBrandConnected(b) ? "متصل ✅" : `غير متصل ❌ [${b.status || "DISCONNECTED"}]`})`)
            .join("، ")
      );
      if (disconnectedList.length > 0) {
        lines.push(
          `• ⚠️ تنبيه عاجل للماستر تيتو — براندات واتساب نشطة ومنفصلة الآن وتحتاج إعادة ربط QR/Pairing (${disconnectedList.length}): ${disconnectedList.join("، ")}. نبّه الماستر تيتو عليها بوضوح عند سؤاله عن حالة المنظومة أو البراندات.`
        );
      } else if (nonPausedKeys.size === 0) {
        lines.push(
          `• ملاحظة السجل الموحد: جميع البراندات مصنفة حالياً كـ (متوقف/أرشيف) حتى يتم تفعيل المطلوب من شاشة "توحيد البراندات".`
        );
      }
    }

    const bookings = Array.isArray((brandBookingsRes as any)?.bookings)
      ? (brandBookingsRes as any).bookings
      : Array.isArray(brandBookingsRes)
        ? brandBookingsRes
        : [];
    if (bookings.length > 0) {
      lines.push(`• حجوزات البراند الحية في تيتو أجنت: ${bookings.length} حجز.`);
    }

    if (liveErpSummary) {
      lines.push(`• ${liveErpSummary}`);
    }

    return lines.length > 0 ? `\n[بيانات حية مباشرة من قواعد بيانات تيتو ستوديو وتيتو أجنت والمتجر الآن]:\n${lines.join("\n")}` : "";
  } catch {
    return "";
  }
}

export async function runJarvisBrainConversation(
  input: JarvisBrainInput
): Promise<JarvisBrainOutput> {
  const {
    message,
    history = [],
    persona = "visitor",
    selectedBrandId = "",
    recentChatSummary = "",
    ai,
    synthesizeSpeech,
  } = input;

  const unifiedBrands = getUnifiedGrowthBrands();
  const activeUnifiedBrands = unifiedBrands.filter((b: any) => b?.lifecycleStage !== "paused_archive");
  const ezzelClients = getEzZelPersonalClients();

  // Strict Role-Based Brand Isolation:
  // - visitor: NEVER auto-attach unifiedBrands[0]! Starts clean with null.
  // - trial / client: ONLY their verified selectedBrandId (never fallback to unifiedBrands[0]).
  // - tito: can resolve any brand dynamically by name or selectedBrandId.
  const resolvedBrand =
    persona === "tito"
      ? resolveBrandDynamically(selectedBrandId, message, unifiedBrands) || null
      : (persona === "trial" || persona === "client") && selectedBrandId
        ? unifiedBrands.find((b: any) => {
            const qNorm = String(selectedBrandId).toLowerCase().replace(/[-_]+/g, "-");
            return String(b.id || "").toLowerCase() === String(selectedBrandId).toLowerCase() ||
              String(b.slug || "").toLowerCase().replace(/[-_]+/g, "-") === qNorm;
          }) || null
        : null;

  const mentionedOrSelectedBrand = resolvedBrand || {
    id: selectedBrandId || "",
    name: persona === "visitor" ? "مشروعك الجديد" : "البراند",
    businessType: "أعمال",
    phone: "",
  };

  const { loadCloudMemory, saveCloudMemory } = await import("./swarmOrchestrator");
  const scopeKey = persona === "tito" ? "ahm.atya@gmail.com" : (selectedBrandId || "guest");
  const [cloudMem, liveDbContext] = await Promise.all([
    loadCloudMemory(scopeKey).catch(() => null),
    fetchLiveEcosystemFromStudioAndAgent(persona, selectedBrandId),
  ]);

  const combinedMemory = [recentChatSummary, cloudMem?.rollingSummary, liveDbContext].filter(Boolean).join("\n");

  const systemPrompt = buildPersonaSystemPrompt(
    persona,
    resolvedBrand,
    persona === "tito" ? activeUnifiedBrands : unifiedBrands,
    ezzelClients,
    combinedMemory
  );

  const hasPriorTurns = Array.isArray(history) && history.length > 0;
  const allUserTexts = [
    ...(Array.isArray(history) ? history.filter((h: any) => h.role === "user").map((h: any) => String(h.text || "")) : []),
    message,
  ].join("\n");

  const nameMatch = allUserTexts.match(
    /(?:أنا\s+اسمي|اسمي|معاك|كلمني\s+يا|ناديني\s+يا|أنا\s+الاستاذ|أنا\s+المهندس|أنا\s+دكتور)\s+([^\s،,.!?\n]{2,20})/i
  );
  let detectedVisitorName = nameMatch ? nameMatch[1].trim() : "";

  // Also detect a direct 1-2 word name reply if Jarvis just asked for their name
  if (!detectedVisitorName && Array.isArray(history) && history.length > 0) {
    const lastModelMsg = [...history].reverse().find((h: any) => h.role !== "user")?.text || "";
    const lastUserMsg = [...history].reverse().find((h: any) => h.role === "user")?.text || "";
    const askedName = /اسمك|أناديك\s+بإيه|نتشرف\s+باسمك/i.test(lastModelMsg);
    const candidate = (askedName ? message : (/اسمك|نتشرف\s+باسمك/i.test(lastModelMsg) ? lastUserMsg : "")).trim();
    const words = candidate.split(/\s+/).filter(Boolean);
    if (askedName && words.length >= 1 && words.length <= 2 && candidate.length >= 2 && candidate.length <= 24 && !/نعم|لأ|لا|أيوة|تمام|ماشي|عند|جديد|قائم/i.test(candidate)) {
      detectedVisitorName = words[0];
    }
  }

  const formattedHistory =
    hasPriorTurns
      ? history
          .slice(-8)
          .map(
            (h: any) =>
              `${h.role === "user" ? "المتحدث" : "جارفيس"}: "${h.text}"`
          )
          .join("\n")
      : "";

  const conversationMemoryDirective = [
    detectedVisitorName
      ? `اسم المتحدث الحالي: "${detectedVisitorName}" — نادِه دائماً باسمه ("يا ${detectedVisitorName}") في ردودك.`
      : `إذا لم تعرف اسم المتحدث بعد في أول حوار، اسأله بلطف مرة واحدة تحب أناديك بإيه.`,
    hasPriorTurns
      ? `ممنوع منعاً باتاً إعادة تقديم نفسك أو قول "أهلاً بيك أنا جارفيس" أو "مرحباً بك" لأن الحوار مستمر بالفعل — ادخل في الإجابة أو التنفيذ مباشرة!`
      : ``,
  ]
    .filter(Boolean)
    .join("\n");

  const fullSystemInstruction = `${systemPrompt}

[توجيه الذاكرة الشخصية اللحظي]:
${conversationMemoryDirective}`;

  const structuredContents = [
    ...(hasPriorTurns
      ? history.slice(-20).map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: String(h.text || "") }],
        }))
      : []),
    { role: "user", parts: [{ text: message }] },
  ];

  const SOVEREIGN_UNIFIED_TOOLS = new Set([
    "tito_studio_remote_execute",
    "t2_agent_remote_execute",
    "manage_store_erp",
    ...(persona === "tito" ? ["edit_tenant_repo_code"] : []),
    "create_and_publish_post",
    "onboard_new_client_brand",
    "navigate_jarvis_ui",
    "show_dynamic_widget",
    "check_ecosystem_health",
  ]);

  const activeTools =
    persona === "visitor"
      ? jarvisBrainTools.filter(
          (t) =>
            t.name === "record_visitor_diagnostic" ||
            t.name === "onboard_new_client_brand"
        )
      : jarvisBrainTools.filter((t) => SOVEREIGN_UNIFIED_TOOLS.has(t.name));

  const modelCascade = [...ACTIVE_GEMINI_TEXT_MODELS];

  const withModelTimeout = <T>(p: Promise<T>, ms = 9000): Promise<T> =>
    Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`MODEL_TIMEOUT_${ms}ms`)), ms))]);

  let chat: any = null;
  let lastModelError = "";

  // 1. Try with Native Function Calling tools across active models
  for (const modelName of modelCascade) {
    try {
      chat = await withModelTimeout(ai.models.generateContent({
        model: modelName,
        contents: structuredContents,
        config: {
          systemInstruction: { parts: [{ text: fullSystemInstruction }] },
          tools: [{ functionDeclarations: activeTools }],
          temperature: 0.4,
        },
      }), 9000);
      if (chat) break;
    } catch (err: any) {
      lastModelError = err?.message || String(err);
      console.warn(`[Jarvis Brain] ${modelName} (with tools) failed:`, lastModelError);
    }
  }

  // 2. If tool-enabled call failed on all models, retry pure conversational mode without tools
  if (!chat) {
    for (const modelName of modelCascade) {
      try {
        chat = await withModelTimeout(ai.models.generateContent({
          model: modelName,
          contents: structuredContents,
          config: {
            systemInstruction: { parts: [{ text: fullSystemInstruction }] },
            temperature: 0.5,
          },
        }), 7000);
        if (chat) break;
      } catch (err: any) {
        lastModelError = err?.message || String(err);
        console.warn(`[Jarvis Brain] ${modelName} (no-tools fallback) failed:`, lastModelError);
      }
    }
  }

  let executedAction: any = null;
  let backendExecutionResult: any = null;
  let targetBrand = mentionedOrSelectedBrand;

  const functionCalls = chat?.functionCalls;
  if (Array.isArray(functionCalls) && functionCalls.length > 0) {
    const call = functionCalls[0];
    const args: any = call.args || {};

    if (args.brandNameOrId) {
      const resolved = resolveBrandDynamically(
        args.brandNameOrId,
        message,
        unifiedBrands
      );
      if (resolved) targetBrand = resolved;
    }

    const brandId = targetBrand.id;

    switch (call.name) {
      case "update_store_catalog": {
        const serviceName = String(args.serviceName || "خدمة VIP جديدة").trim();
        const servicePrice = String(args.servicePrice || "650 ج.م").trim();
        backendExecutionResult = await executeRealJarvisEcosystemAction({
          actionType: "UPDATE_STORE_CATALOG",
          brandId,
          data: {
            addService: {
              name: serviceName,
              price: servicePrice,
              description: "تمت الإضافة والتسعير بأمر مباشر من عقل جارفيس",
            },
          },
        });
        executedAction = {
          type: "CATALOG_MUTATED",
          tab: "app_cloner",
          brandId,
          result: backendExecutionResult,
        };
        break;
      }

      case "update_bot_instructions": {
        const systemInstruction = String(args.systemInstruction || message).trim();
        backendExecutionResult = await executeRealJarvisEcosystemAction({
          actionType: "UPDATE_BOT_INSTRUCTIONS",
          brandId,
          data: { systemInstruction },
        });
        executedAction = {
          type: "BOT_PROMPT_MUTATED",
          tab: "obsidian_graph",
          brandId,
          result: backendExecutionResult,
        };
        break;
      }

      case "create_and_publish_post": {
        const publishNow = Boolean(args.publishNow);
        const dynamicTopic =
          String(args.topic || "").trim() ||
          `أقوى خدمات وعروض ${targetBrand.name} (${targetBrand.businessType || "خدمات احترافية"})`;

        // Resolve real Tito Studio clinicId + connected platforms (e.g. brand_1779847291377 for تيتو ميديا)
        let studioClinicId = String(brandId && brandId !== "tito_media" ? brandId : "brand_1779847291377");
        let matchedStudioBrand: any = null;
        try {
          const liveBrandsRes: any = await titoStudioApi.listBrands();
          const liveList = Array.isArray(liveBrandsRes?.brands) ? liveBrandsRes.brands : Array.isArray(liveBrandsRes) ? liveBrandsRes : [];
          const resolvedStudio = resolveRealStudioClinicFromList(liveList, brandId, targetBrand, message, args.brandNameOrId);
          studioClinicId = resolvedStudio.clinicId;
          matchedStudioBrand = resolvedStudio.matchedBrand;
        } catch {}

        const resolveConnectedPlatforms = (brandObj: any, isVideo: boolean): string[] => {
          const p: string[] = [];
          if (brandObj?.selectedMetaPage?.id || brandObj?.metaToken) p.push("facebook");
          if (brandObj?.selectedMetaPage?.instagram_business_account?.id || brandObj?.instagramAccountId) p.push("instagram");
          if (brandObj?.snapchatToken) p.push("snapchat");
          if (brandObj?.xToken) p.push("x");
          if (isVideo && brandObj?.tiktokToken) p.push("tiktok");
          if (isVideo && brandObj?.youtubeToken) p.push("youtube");
          return p;
        };

        if (
          publishNow &&
          !/فكرة|صمم|اعمل|جديد|توليد|باقات|عن /i.test(message) &&
          /انشر|نزل البوست/i.test(message)
        ) {
          try {
            const targetPlatforms = resolveConnectedPlatforms(matchedStudioBrand, false);
            const pubRes = await titoStudioApi.executeRemoteAction("publish.multi_platform", studioClinicId, {
              platforms: targetPlatforms,
            });
            backendExecutionResult = pubRes;
            const embedUrl = titoStudioApi.buildStudioEmbedUrl("showroom", studioClinicId);
            executedAction = {
              type: "STUDIO_EMBED_VIEW",
              view: "showroom",
              clinicId: studioClinicId,
              embedUrl,
              actionExecuted: "publish.multi_platform",
              result: pubRes,
            };
          } catch (pubErr: any) {
            backendExecutionResult = { success: false, message: `تعذر النشر عبر تيتو ستوديو: ${pubErr?.message}` };
          }
        } else {
          const targetPlatforms = resolveConnectedPlatforms(matchedStudioBrand, false);

          // 1. Delegate copy + design generation + Studio persistence 100% to Tito Studio API
          let customHook = `🚀 ${dynamicTopic}`;
          let customCaption = dynamicTopic;
          let publicMediaUrl = "";
          let studioSavedId = "";
          let studioDesignWarning: string | undefined;

          try {
            const studioDesignRes: any = await titoStudioApi.executeRemoteAction("content.generate_design", studioClinicId, {
              topic: dynamicTopic,
              prompt: message,
              platforms: targetPlatforms.length > 0 ? targetPlatforms : ["instagram", "facebook"],
              saveToCalendar: true,
              sendToShowroom: true,
              status: publishNow && targetPlatforms.length > 0 ? "published" : "scheduled",
            });
            const designResult = studioDesignRes?.result || studioDesignRes?.data || studioDesignRes || {};
            if (designResult?.copy?.hook) customHook = designResult.copy.hook;
            else if (designResult?.copy?.title) customHook = designResult.copy.title;
            if (designResult?.copy?.caption) customCaption = designResult.copy.caption;
            if (designResult?.visualUrl) publicMediaUrl = String(designResult.visualUrl);
            if (designResult?.savedId) studioSavedId = String(designResult.savedId);
          } catch (studioErr: any) {
            studioDesignWarning = studioErr?.message;
            console.warn("[Jarvis Brain -> Tito Studio content.generate_design] warning:", studioDesignWarning);
          }

          // 2. Mirror into local T2OS brand state for unified dashboard sync (without overwriting Studio design with raw brand logo)
          backendExecutionResult = await executeRealJarvisEcosystemAction({
            actionType: "CREATE_CUSTOM_STUDIO_POST",
            brandId,
            data: {
              topic: dynamicTopic,
              customHook,
              customCaption,
              visualUrl: publicMediaUrl || undefined,
              publishNow,
            },
          });
          backendExecutionResult = {
            ...backendExecutionResult,
            studioClinicId,
            studioSavedId,
            visualUrl: publicMediaUrl,
            studioDesignWarning,
          };

          // 3. If immediate social publish was requested, dispatch via Tito Studio's multi-platform publisher
          let studioDispatchRes: any = null;
          if (publishNow) {
            if (targetPlatforms.length === 0) {
              // Poka-Yoke Guard: Never dispatch to unlinked channels; route to Showroom + Settings cleanly
              backendExecutionResult = {
                ...backendExecutionResult,
                pokaYokeBlocked: true,
                studioClinicId,
                message: `تم تصميم المنشور في تيتو ستوديو وحفظه في صالة العرض لبراند (${targetBrand?.name || studioClinicId})، ولكن لا توجد صفحات سوشيال مربوطة بعد. اربط صفحة فيسبوك/إنستجرام من الإعدادات ثم اعتمد النشر بضغطة واحدة.`,
              };
            } else if (!publicMediaUrl) {
              backendExecutionResult = {
                ...backendExecutionResult,
                pokaYokeBlocked: true,
                studioClinicId,
                message: `تم حفظ نص المنشور في تيتو ستوديو لبراند (${targetBrand?.name || studioClinicId})، وتم إيقاف النشر المباشر مؤقتاً لحين اعتماد التصميم المرئي في الاستوديو بدلاً من نشر اللوجو.`,
              };
            } else {
              try {
                studioDispatchRes = await titoStudioApi.executeRemoteAction("publish.multi_platform", studioClinicId, {
                  itemId: studioSavedId || undefined,
                  title: customHook,
                  caption: customCaption || dynamicTopic,
                  mediaUrl: publicMediaUrl,
                  platforms: targetPlatforms,
                });
                backendExecutionResult = {
                  ...backendExecutionResult,
                  studioClinicId,
                  targetPlatforms,
                  studioDispatchRes,
                  publishResult: studioDispatchRes,
                };
              } catch (pubErr: any) {
                backendExecutionResult = {
                  ...backendExecutionResult,
                  studioClinicId,
                  targetPlatforms,
                  studioPublishError: pubErr?.message,
                };
              }
            }
          }

          const embedUrl = titoStudioApi.buildStudioEmbedUrl(publishNow ? "showroom" : "calendar", studioClinicId);
          executedAction = {
            type: "STUDIO_EMBED_VIEW",
            view: publishNow ? "showroom" : "calendar",
            clinicId: studioClinicId,
            embedUrl,
            actionExecuted: publishNow ? "publish.multi_platform" : "content.generate_design",
            brandId: studioClinicId,
            result: backendExecutionResult,
          };
        }
        break;
      }

      case "show_dynamic_widget": {
        const widgetType = String(args.widgetType || "analytics_kpis");
        const primaryBrand = targetBrand || unifiedBrands[0];
        const secondQuery = String(args.secondBrandNameOrId || "").trim().toLowerCase();
        const secondBrand = secondQuery
          ? unifiedBrands.find((b) =>
              String(b.id || "").toLowerCase() === secondQuery ||
              String(b.slug || "").toLowerCase() === secondQuery ||
              String(b.name || "").toLowerCase().includes(secondQuery)
            )
          : unifiedBrands.find((b) => b.id !== primaryBrand?.id) || unifiedBrands[1];

        const totalPosts = unifiedBrands.reduce((sum, b) => sum + (b.weekContentPlan?.length || 0), 0);
        const totalProducts = unifiedBrands.reduce((sum, b) => sum + (b.catalog?.length || 0), 0);

        backendExecutionResult = {
          widgetType,
          brand: primaryBrand,
          secondBrand,
          portalUrl: primaryBrand ? `/client/${primaryBrand.slug || primaryBrand.id}` : "/client/tito_media",
          summary: {
            totalBrands: unifiedBrands.length,
            ezzelClientsCount: ezzelClients.length,
            totalPosts,
            totalProducts,
          },
        };

        executedAction = {
          type: "DYNAMIC_WIDGET",
          widgetType,
          brandId: primaryBrand?.id,
          data: backendExecutionResult,
        };
        break;
      }

      case "whatsapp_to_content_loop": {
        const b: any = targetBrand || unifiedBrands[0];
        if (b) {
          let generatedIdeas: any[] = [];
          const loopPrompt = `أنت مدير تسويق مصري ذكي. حلل طبيعة نشاط "${b.name}" (${b.businessType || "خدمات رقمية"}) وتوقّع أهم 3 أسئلة بيسألها العملاء على الواتساب يومياً، وحوّل كل سؤال إلى بوست تسويقي جاهز باللهجة المصرية.
أعد JSON فقط كمصفوفة: [{"question": "...", "hook": "...", "caption": "...", "contentType": "تصميم Feed (1:1)"}]`;
          for (const m of ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"]) {
            try {
              const r = await ai.models.generateContent({
                model: m,
                contents: loopPrompt,
                config: { responseMimeType: "application/json" },
              });
              const parsed = JSON.parse((r.text || "").trim());
              if (Array.isArray(parsed)) {
                generatedIdeas = parsed;
                break;
              }
            } catch {}
          }

          if (generatedIdeas.length > 0) {
            const newPosts = generatedIdeas.map((idea, idx) => ({
              id: `wa_loop_${Date.now()}_${idx}`,
              day: `مقترح واتساب #${idx + 1}`,
              platform: "Instagram & Facebook (Meta Graph)",
              contentType: idea.contentType || "تصميم Feed (1:1)",
              hook: idea.hook,
              caption: idea.caption,
              sourceQuestion: idea.question,
              status: "scheduled",
            }));
            const nextPlan = [...newPosts, ...(b.weekContentPlan || [])].slice(0, 14);
            const updatedBrand = persistBrandUpdateAcrossEcosystem(b.id || b.slug, { weekContentPlan: nextPlan }) || {
              ...b,
              weekContentPlan: nextPlan,
            };
            backendExecutionResult = {
              widgetType: "whatsapp_insights",
              brand: updatedBrand,
              generatedPosts: newPosts,
            };
          } else {
            backendExecutionResult = {
              widgetType: "whatsapp_insights",
              brand: b,
              generatedPosts: [],
            };
          }

          executedAction = {
            type: "DYNAMIC_WIDGET",
            widgetType: "whatsapp_insights",
            brandId: b.id,
            data: backendExecutionResult,
          };
        }
        break;
      }

      case "t2_agent_enterprise_control": {
        const t2Action = String(args.action || "health_summary");
        const targetId = brandId || targetBrand?.id || "tito_media";
        try {
          if (t2Action === "pair_whatsapp" && args.phone) {
            backendExecutionResult = await t2AgentApi.requestPairingCode(targetId, String(args.phone));
          } else if (t2Action === "toggle_pause") {
            backendExecutionResult = await t2AgentApi.togglePauseBot(targetId);
          } else if (t2Action === "send_reply" && args.phone && args.message) {
            backendExecutionResult = await t2AgentApi.sendManualReply(targetId, String(args.phone), String(args.message));
          } else if (t2Action === "trigger_reengagement") {
            backendExecutionResult = await t2AgentApi.triggerReEngagement(targetId, String(args.phone || "all"), args.message);
          } else if (t2Action === "generate_payment_link" && args.phone) {
            const { createPaymobCheckoutSession } = await import("./paymobService");
            const serviceLabel = String(args.serviceName || "باقة خدمات");
            const amountVal = Number(args.amount) || 1000;
            const checkout = await createPaymobCheckoutSession({
              brandId: targetId,
              brandName: targetBrand?.name || targetId,
              planId: "custom_brand_order",
              customTitle: serviceLabel,
              amountEgp: amountVal,
              customerName: String(args.customerName || "عميلنا العزيز"),
              customerEmail: "client@t2-studio.app",
              customerPhone: String(args.phone),
            });
            const paymobUrl = checkout?.paymentUrl || "";
            let waDispatch: any = null;
            if (paymobUrl) {
              const payMsg = `أهلاً بك يا ${args.customerName || "فندم"} في ${targetBrand?.name || "خدماتنا"}! 💳\nرابط الدفع الآمن عبر Paymob لطلب (${serviceLabel}) بقيمة ${amountVal} ج.م:\n${paymobUrl}`;
              try {
                waDispatch = await t2AgentApi.sendManualReply(targetId, String(args.phone), payMsg);
              } catch {}
            }
            backendExecutionResult = {
              success: Boolean(paymobUrl),
              brandId: targetId,
              paymobUrl,
              orderId: checkout?.orderId,
              whatsappSent: Boolean(waDispatch),
              checkout,
              waDispatch,
            };
          } else if (t2Action === "start_broadcast" && args.message) {
            backendExecutionResult = await t2AgentApi.startWhatsAppBroadcast(targetId, {
              campaignName: String(args.campaignName || "حملة جارفس الذكية"),
              templateMessage: String(args.message),
              targetFilter: "all",
              enableAiParaphrase: true,
            });
          } else if (t2Action === "list_bookings") {
            backendExecutionResult = await t2AgentApi.getBookings(targetId);
          } else {
            backendExecutionResult = await t2AgentApi.getSystemHealth();
          }
        } catch (err: any) {
          backendExecutionResult = {
            ok: false,
            fallbackUsed: true,
            error: err?.message || "T2 Agent Enterprise API unreachable",
          };
        }
        break;
      }

      case "check_ecosystem_health": {
        const report = await runLiveEcosystemHealthProbe(
          getTitoStudioBaseUrl(),
          getT2AgentBaseUrl()
        );
        backendExecutionResult = report;
        executedAction = {
          type: "DYNAMIC_WIDGET",
          widgetType: "ecosystem_health",
          data: report,
        };
        break;
      }

      case "launch_meta_ad": {
        const budgetEgp = Number(args.budgetEgp) || 2000;
        backendExecutionResult = await executeRealJarvisEcosystemAction({
          actionType: "LAUNCH_META_AD",
          brandId,
          data: { budgetEgp },
        });
        executedAction = {
          type: "TRIGGER_ACTION",
          action: "LAUNCH_CAMPAIGN",
          brandId,
          result: backendExecutionResult,
        };
        break;
      }

      case "navigate_jarvis_ui": {
        if (persona !== "visitor") {
          if (args.actionType === "SWITCH_BRAND") {
            const targetSwitch =
              persona === "tito" && args.brandNameOrId
                ? resolveBrandDynamically(String(args.brandNameOrId), message, unifiedBrands) || targetBrand
                : targetBrand;
            const switchId = targetSwitch?.slug || targetSwitch?.id || brandId;
            executedAction = {
              type: "SWITCH_BRAND",
              brandId: switchId,
              brandName: targetSwitch?.name || switchId,
              openHub: true,
            };
          } else if (args.actionType === "OPEN_BRAND_SUPER_WINDOW") {
            executedAction = { type: "OPEN_BRAND_SUPER_WINDOW", brandId };
          } else if (args.actionType === "OPEN_MODAL") {
            executedAction = {
              type: "OPEN_MODAL",
              modal: args.modal || "whatsapp_connect",
              brandId,
            };
          } else if (args.actionType === "TOGGLE_BOT") {
            executedAction = {
              type: "TOGGLE_BOT",
              brandId,
              status: args.botStatus || "paused",
            };
          } else {
            executedAction = {
              type: "SWITCH_TAB",
              tab: args.tab || "obsidian_graph",
              brandId,
            };
          }
        }
        break;
      }

      case "record_visitor_diagnostic": {
        if (persona === "visitor") {
          const visitorUpdate: any = {};
          if (typeof args.hasExistingBusiness === "boolean")
            visitorUpdate.hasExistingBusiness = args.hasExistingBusiness;
          if (typeof args.hasWebsite === "boolean")
            visitorUpdate.hasWebsite = args.hasWebsite;
          if (typeof args.hasSocialPages === "boolean")
            visitorUpdate.hasSocialPages = args.hasSocialPages;
          if (args.industry) visitorUpdate.industry = args.industry;
          if (args.businessName) visitorUpdate.businessName = args.businessName;
          if (args.phone) visitorUpdate.phone = args.phone;

          if (Object.keys(visitorUpdate).length > 0) {
            executedAction = {
              type: "VISITOR_DIAGNOSTIC_UPDATE",
              visitorUpdate,
            };
          }
        }
        break;
      }

      case "tito_studio_brand_manager": {
        try {
          if (args.action === "list_brands") {
            backendExecutionResult = await titoStudioApi.listBrands();
          } else if (args.action === "create_brand") {
            const name = args.brandNameOrId || "براند جديد";
            backendExecutionResult = await titoStudioApi.createBrand({
              name,
              industry: args.industry || "general",
              dialect: "egyptian",
              primaryColor: args.primaryColor || "#00f0ff",
              phone: args.phone || "01030956097",
              description: args.description || `نشاط ${name} المتكامل`,
            });
            await syncBrandToAllEcosystems({
              id: backendExecutionResult?.id,
              name,
              businessType: args.industry || "نشاط تجاري",
              phone: args.phone || "01030956097",
              primaryColor: args.primaryColor || "#00f0ff",
              source: "Jarvis_TitoStudio_Create",
            });
          } else if (args.action === "update_brand") {
            backendExecutionResult = await titoStudioApi.updateBrand(brandId, {
              ...(args.primaryColor ? { primaryColor: args.primaryColor } : {}),
              ...(args.phone ? { phone: args.phone } : {}),
            });
          } else if (args.action === "generate_brand_kit") {
            backendExecutionResult = await titoStudioApi.generateBrandKit({
              brandName: targetBrand.name,
              industry: args.industry || targetBrand.businessType || "خدمات",
              currentDescription: args.description || targetBrand.name,
              dialect: "egyptian",
            });
          } else if (args.action === "scrape_url" && args.url) {
            backendExecutionResult = await titoStudioApi.scrapeUrlToBrand(args.url, brandId);
          }
          executedAction = {
            type: "TITO_STUDIO_ACTION",
            module: "brands",
            brandId,
            result: backendExecutionResult,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, message: `تعذر تنفيذ أمر البراند في ستوديو: ${err?.message}` };
        }
        break;
      }

      case "tito_studio_content_and_recycle": {
        try {
          if (args.action === "list_content") {
            backendExecutionResult = await titoStudioApi.listContent(brandId);
          } else if (args.action === "recycle_30_days") {
            let targetContentId = args.contentId;
            if (!targetContentId) {
              const list = await titoStudioApi.listContent(brandId);
              targetContentId = list?.items?.[0]?.id;
            }
            if (targetContentId) {
              backendExecutionResult = await titoStudioApi.recycleContent(
                targetContentId,
                Number(args.daysAhead) || 30
              );
            } else {
              backendExecutionResult = { success: false, message: `لا توجد منشورات سابقة لبراند ${targetBrand.name} لإعادة تدويرها.` };
            }
          } else if (args.action === "delete_content" && args.contentId) {
            backendExecutionResult = await titoStudioApi.deleteContent(args.contentId);
          } else if (args.action === "check_due_queue") {
            backendExecutionResult = await titoStudioApi.processScheduledPosts();
          }
          executedAction = {
            type: "SWITCH_TAB",
            tab: "studio_calendar",
            brandId,
            result: backendExecutionResult,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, message: `خطأ في إدارة محتوى ستوديو: ${err?.message}` };
        }
        break;
      }

      case "tito_studio_ideas_and_appointments": {
        try {
          if (args.action === "list_ideas") {
            backendExecutionResult = await titoStudioApi.listIdeas(brandId);
          } else if (args.action === "create_idea") {
            backendExecutionResult = await titoStudioApi.createIdea({
              clinicId: brandId,
              title: args.title || `فكرة تسويقية لـ ${targetBrand.name}`,
              description: args.description || message,
              type: "video",
            });
          } else if (args.action === "list_appointments") {
            backendExecutionResult = await titoStudioApi.listAppointments(brandId);
          } else if (args.action === "create_appointment") {
            backendExecutionResult = await titoStudioApi.createAppointment({
              clinicId: brandId,
              patientName: args.patientName || "عميل جديد",
              phone: args.phone || "01000000000",
              service: args.service || "استشارة وحجز",
              date: args.date,
              time: args.time,
              status: args.status || "pending",
            });
          } else if (args.action === "update_appointment" && args.appointmentId) {
            backendExecutionResult = await titoStudioApi.updateAppointment(args.appointmentId, {
              status: args.status || "confirmed",
            });
          }
          executedAction = {
            type: "TITO_STUDIO_ACTION",
            module: "ideas_appointments",
            brandId,
            result: backendExecutionResult,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, message: `خطأ في بنك الأفكار/الحجوزات: ${err?.message}` };
        }
        break;
      }

      case "tito_studio_autopilot_and_trends": {
        try {
          if (args.action === "run_autopilot") {
            backendExecutionResult = await titoStudioApi.runAutopilot(brandId);
          } else if (args.action === "virtual_browse_trends") {
            backendExecutionResult = await titoStudioApi.runVirtualBrowse(
              brandId,
              args.queryFocus || `${targetBrand.name} ${targetBrand.businessType || ""} 2026`
            );
          }
          executedAction = {
            type: "SWITCH_TAB",
            tab: "studio_calendar",
            brandId,
            result: backendExecutionResult,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, message: `خطأ في تشغيل الأوتوبايلوت: ${err?.message}` };
        }
        break;
      }

      case "onboard_new_client_brand": {
        try {
          const category = String(args.category || "نشاط تجاري وخدمات").trim();
          const initialName = String(args.businessIdeaOrName || category).trim();
          const phone = String(args.phone || "").trim();
          const kit = await generateBrandingAndSocialKit({
            brandName: initialName,
            category,
            phone: phone || "01013372674",
            isNewBusiness: args.isNewBusiness !== false,
          });
          const flagshipApp = resolveFlagshipTemplate(`${category} ${initialName}`);
          const savedBrand = saveBrandedClientToVault(kit, { phone, whatsapp: phone });
          try {
            await syncBrandToAllEcosystems({
              id: savedBrand.id,
              slug: savedBrand.slug,
              name: savedBrand.name,
              businessType: savedBrand.businessType,
              phone: savedBrand.phone,
              whatsapp: savedBrand.whatsapp,
              slogan: savedBrand.slogan,
              primaryColor: savedBrand.primaryColor,
              accentColor: savedBrand.accentColor,
              weekContentPlan: savedBrand.weekContentPlan,
            });
          } catch {}

          backendExecutionResult = {
            success: true,
            suggestedNames: kit.suggestedNames,
            suggestedSlogans: kit.suggestedSlogans,
            selectedBrandName: kit.brandName,
            slogan: kit.slogan,
            logoUrl: kit.logoUrl,
            logoPrompt: kit.logoPrompt,
            colors: kit.colors,
            flagshipWebApp: {
              templateKey: flagshipApp.templateKey,
              name: flagshipApp.name,
              repoUrl: flagshipApp.repoUrl,
              referenceLiveUrl: flagshipApp.referenceLiveUrl,
              modulesEnabled: flagshipApp.modulesEnabled,
              descriptionAr: flagshipApp.adminCustomization.descriptionAr,
            },
            socialKits: kit.socialKits,
            nextSteps: [
              "اختيار الاسم والسلوجان المفضل من المقترحات الـ 3",
              "اعتماد الشعار المصمم وتطبيق الويب (Battah للمنتجات أو Clean Master للخدمات)",
              "ربط رقم الواتساب (QR / Pairing Code) وتوصيل صفحات Meta و TikTok و YouTube و Snapchat و Google Business & Maps",
            ],
            brand: savedBrand,
          };
          executedAction = {
            type: "DYNAMIC_WIDGET",
            widgetType: "brand_dna",
            brandId: savedBrand.id,
            data: backendExecutionResult,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, error: err?.message || "Failed to onboard client brand" };
        }
        break;
      }

      case "tito_studio_omnichannel_publish": {
        try {
          if (args.action === "publish_tiktok") {
            backendExecutionResult = await titoStudioApi.publishTikTok({
              clinicId: brandId,
              videoUrl: args.mediaUrl || "https://cdn.mybrand.com/media/reel.mp4",
              title: args.title || targetBrand.name,
              caption: args.caption || message,
            });
          } else if (args.action === "publish_youtube") {
            backendExecutionResult = await titoStudioApi.publishYouTube({
              clinicId: brandId,
              videoUrl: args.mediaUrl || "https://cdn.mybrand.com/media/short.mp4",
              title: args.title || targetBrand.name,
              description: args.caption || message,
            });
          } else if (args.action === "publish_snapchat") {
            backendExecutionResult = await titoStudioApi.publishSnapchat({
              clinicId: brandId,
              mediaUrl: args.mediaUrl || "https://cdn.mybrand.com/media/snap.mp4",
              caption: args.caption || message,
            });
          } else if (args.action === "publish_x") {
            backendExecutionResult = await titoStudioApi.publishX({
              clinicId: brandId,
              caption: args.caption || message,
            });
          } else if (args.action === "publish_google_business") {
            backendExecutionResult = await titoStudioApi.publishGoogleBusiness({
              clinicId: brandId,
              caption: args.caption || message,
              mediaUrl: args.mediaUrl || undefined,
              topicType: "STANDARD",
            });
          } else if (args.action === "list_google_reviews") {
            backendExecutionResult = await titoStudioApi.listGoogleBusinessReviews(brandId);
          } else if (args.action === "reply_google_review" && args.reviewId) {
            backendExecutionResult = await titoStudioApi.replyGoogleBusinessReview({
              clinicId: brandId,
              reviewId: args.reviewId,
              comment: args.commentText,
              reviewerName: args.reviewerName,
              replyText: args.caption,
              autoGenerateAiReply: !args.caption,
            });
          } else if (args.action === "reply_snapchat_comment") {
            backendExecutionResult = await titoStudioApi.replySnapchatComment({
              clinicId: brandId,
              commentId: args.commentId,
              senderName: args.reviewerName,
              commentText: args.commentText || message,
              replyText: args.caption,
              autoGenerateAiReply: !args.caption,
            });
          } else if (args.action === "list_comments" && args.pageId) {
            backendExecutionResult = await titoStudioApi.getMetaComments(args.pageId);
          } else if (args.action === "reply_comment" && args.commentId) {
            backendExecutionResult = await titoStudioApi.replyMetaComment({
              commentId: args.commentId,
              message: args.caption || "أهلاً بحضرتك! تم إرسال التفاصيل على الخاص.",
            });
          }
          executedAction = {
            type: "TITO_STUDIO_ACTION",
            module: "omnichannel_publish",
            brandId,
            result: backendExecutionResult,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, message: `خطأ في النشر متعدد المنصات: ${err?.message}` };
        }
        break;
      }

      case "tito_studio_ads_and_sales_radar": {
        try {
          if (args.action === "list_leads") {
            backendExecutionResult = await titoStudioApi.listLeads(brandId);
          } else if (args.action === "analyze_lead_comment") {
            backendExecutionResult = await titoStudioApi.analyzeLeadComment({
              comment: args.comment || message,
              clinic: {
                id: brandId,
                name: targetBrand.name,
                industry: targetBrand.businessType,
                whatsappNumber: targetBrand.phone,
              },
            });
          } else if (args.action === "generate_ai_ad") {
            backendExecutionResult = await titoStudioApi.generateMetaAdCampaign({
              campaignName: args.campaignName || `حملة ${targetBrand.name}`,
              dailyBudget: Number(args.dailyBudget) || 500,
              clinicId: brandId,
              dialect: "egyptian",
            });
          } else if (args.action === "list_campaigns") {
            backendExecutionResult = await titoStudioApi.listMetaCampaigns(brandId);
          } else if (args.action === "toggle_campaign" && args.campaignId) {
            backendExecutionResult = await titoStudioApi.setMetaCampaignStatus({
              metaCampaignId: args.campaignId,
              status: args.campaignStatus || "ACTIVE",
            });
          } else if (args.action === "get_insights" && args.campaignId) {
            backendExecutionResult = await titoStudioApi.getMetaInsights(args.campaignId);
          } else if (args.action === "send_whatsapp" && args.phone) {
            backendExecutionResult = await titoStudioApi.sendStudioWhatsApp(
              args.phone,
              args.message || `أهلاً بحضرتك من ${targetBrand.name}!`
            );
          } else if (args.action === "test_alert") {
            backendExecutionResult = await titoStudioApi.sendAlertTest(
              brandId,
              args.message || `اختبار تنبيه فوري من جارفيس لبراند ${targetBrand.name}`
            );
          }
          executedAction = {
            type: "TITO_STUDIO_ACTION",
            module: "ads_sales_radar",
            brandId,
            result: backendExecutionResult,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, message: `خطأ في رادار المبيعات أو الإعلانات: ${err?.message}` };
        }
        break;
      }

      case "t2_agent_remote_execute": {
        if (persona === "visitor") {
          backendExecutionResult = { success: false, message: "هذه الميزة متاحة للأعضاء والمديرين فقط. سجل دخولك أو فعّل التجربة المجانية أولاً." };
          break;
        }
        try {
          const section = String(args.section || "crm").trim();
          let actionName = String(args.action || "get_status").trim();
          if (section === "brands" && (actionName === "create_brand" || actionName === "register")) {
            actionName = "create";
          }
          if (persona !== "tito" && (section === "admin" || args.isAdminAction)) {
            backendExecutionResult = { success: false, message: "أوامر الإدارة العامة متاحة للمدير العام فقط." };
            break;
          }
          const embedWindow = String(args.embedWindow || (section === "whatsapp" ? "qr" : section === "admin" ? "admin" : section === "brands" ? "catalog" : section)).trim();
          let agentBrandId = String(brandId || "clean_master");

          // Resolve exact brandId from live T2 Agent /api/admin/brands/health
          // Strict client isolation: non-admin users are locked to their own brandId/targetBrand only
          try {
            const healthRes: any = await t2AgentApi.getAllBrandsHealth();
            const list = Array.isArray(healthRes?.brands) ? healthRes.brands : Array.isArray(healthRes) ? healthRes : [];
            const needle = persona === "tito"
              ? String(args.brandNameOrId || targetBrand?.name || message || "").toLowerCase()
              : String(brandId || targetBrand?.name || "").toLowerCase();
            const matched = list.find((ab: any) =>
              String(ab.brandId || ab.id).toLowerCase() === String(brandId || "").toLowerCase() ||
              (persona === "tito" && (
                String(ab.brandId || ab.id).toLowerCase() === needle ||
                (ab.brandName && needle.includes(String(ab.brandName).toLowerCase()))
              )) ||
              (targetBrand?.name && String(ab.brandName || "").includes(targetBrand.name))
            );
            if (matched) agentBrandId = String(matched.brandId || matched.id);
          } catch {}

          let parsedPayload: Record<string, any> = {};
          if (args.payloadJson) {
            try { parsedPayload = JSON.parse(String(args.payloadJson)); } catch {}
          }

          if (section === "brands" && actionName === "create") {
            const rawSlug = String(parsedPayload.brandId || args.brandNameOrId || targetBrand?.slug || agentBrandId || "")
              .toLowerCase()
              .replace(/[^a-z0-9_]+/g, "_")
              .replace(/^_+|_+$/g, "");
            if (rawSlug && rawSlug !== "brand") agentBrandId = rawSlug;
            parsedPayload.brandId = agentBrandId;
            parsedPayload.name = parsedPayload.name || targetBrand?.name || args.brandNameOrId || agentBrandId;
          }

          let remoteRes: any;
          if (actionName === "generate_payment_link" && (parsedPayload.phone || parsedPayload.customerPhone)) {
            const { createPaymobCheckoutSession } = await import("./paymobService");
            const customerPhone = String(parsedPayload.phone || parsedPayload.customerPhone);
            const serviceLabel = String(parsedPayload.serviceName || "باقة خدمات");
            const amountVal = Number(parsedPayload.amount) || 1000;
            const checkout = await createPaymobCheckoutSession({
              brandId: agentBrandId,
              brandName: targetBrand?.name || agentBrandId,
              planId: "custom_brand_order",
              customTitle: serviceLabel,
              amountEgp: amountVal,
              customerName: String(parsedPayload.customerName || "عميلنا العزيز"),
              customerEmail: "client@t2-studio.app",
              customerPhone,
            });
            const paymobUrl = checkout?.paymentUrl || "";
            let waDispatch: any = null;
            if (paymobUrl) {
              const payMsg = `أهلاً بك يا ${parsedPayload.customerName || "فندم"} في ${targetBrand?.name || "خدماتنا"}! 💳\nرابط الدفع الآمن عبر Paymob لطلب (${serviceLabel}) بقيمة ${amountVal} ج.م:\n${paymobUrl}`;
              try {
                waDispatch = await t2AgentApi.sendManualReply(agentBrandId, customerPhone, payMsg);
              } catch {}
            }
            remoteRes = {
              success: Boolean(paymobUrl),
              brandId: agentBrandId,
              paymobUrl,
              orderId: checkout?.orderId,
              whatsappSent: Boolean(waDispatch),
              message: paymobUrl
                ? `تم إصدار رابط دفع Paymob لبراند (${agentBrandId}) وإرساله للعميل (${customerPhone}) عبر واتساب.`
                : "تعذر توليد رابط Paymob.",
            };
          } else {
            remoteRes = (persona === "tito" && args.isAdminAction)
              ? await t2AgentApi.executeExternalAdminAction(actionName, { brandId: agentBrandId, ...parsedPayload })
              : await t2AgentApi.executeExternalAction(agentBrandId, section, actionName, parsedPayload);
          }

          let brandApiKey: string | undefined;
          try {
            const keysRes: any = await t2AgentApi.getBrandKeys(agentBrandId);
            brandApiKey = keysRes?.apiKey || keysRes?.keys?.apiKey || keysRes?.data?.apiKey;
          } catch {}

          const embedUrl = t2AgentApi.buildAgentEmbedUrl(embedWindow, agentBrandId, brandApiKey);
          backendExecutionResult = {
            success: true,
            brandId: agentBrandId,
            section,
            action: actionName,
            embedUrl,
            data: remoteRes,
            message: remoteRes?.message || `تم تنفيذ (${section}.${actionName}) في تيتو أجنت للبراند (${agentBrandId}) وتجهيز نافذة (${embedWindow})!`,
          };
          executedAction = {
            type: "AGENT_EMBED_VIEW",
            windowName: embedWindow,
            brandId: agentBrandId,
            embedUrl,
            actionExecuted: `${section}.${actionName}`,
            result: remoteRes,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, message: `تعذر تنفيذ أمر تيتو أجنت عن بُعد: ${err?.message}` };
        }
        break;
      }

      case "tito_studio_remote_execute": {
        if (persona === "visitor") {
          backendExecutionResult = { success: false, message: "هذه الميزة متاحة للأعضاء والمديرين فقط. سجل دخولك أو فعّل التجربة المجانية أولاً." };
          break;
        }
        try {
          let actionName = String(args.action || "calendar.schedule_post").trim();
          if (persona !== "tito" && (actionName === "brand.delete" || actionName.startsWith("admin."))) {
            backendExecutionResult = { success: false, message: "هذا الإجراء متاح للمدير العام فقط." };
            break;
          }
          const embedView = String(args.embedView || (actionName.startsWith("showroom") ? "showroom" : actionName.startsWith("research") ? "marketResearch" : actionName.startsWith("drama") ? "dramaFilm" : actionName.startsWith("autopilot") ? "workflowStudio" : actionName.startsWith("metaAds") ? "metaAds" : "calendar")).trim();
          if (actionName === "ui.navigate" && embedView === "showroom" && /صمم|تصميم|اعمل بوست|بوست جديد|جديد/i.test(message)) {
            actionName = "content.generate_design";
          }

          // Resolve exact clinicId from live Tito Studio /api/brands
          // Strict client isolation: non-admin users are locked to their own brandId/targetBrand only
          let clinicId = String(brandId && brandId !== "tito_media" ? brandId : "brand_1779847291377");
          try {
            const liveBrandsRes: any = await titoStudioApi.listBrands();
            const liveList = Array.isArray(liveBrandsRes?.brands) ? liveBrandsRes.brands : Array.isArray(liveBrandsRes) ? liveBrandsRes : [];
            const resolvedStudio = resolveRealStudioClinicFromList(
              liveList,
              brandId,
              targetBrand,
              persona === "tito" ? message : "",
              persona === "tito" ? args.brandNameOrId : undefined
            );
            clinicId = resolvedStudio.clinicId;
          } catch {}

          let parsedPayload: Record<string, any> = {};
          if (args.payloadJson) {
            try { parsedPayload = JSON.parse(String(args.payloadJson)); } catch {}
          }

          const remoteRes = await titoStudioApi.executeRemoteAction(actionName, clinicId, parsedPayload);
          const embedUrl = titoStudioApi.buildStudioEmbedUrl(embedView, clinicId);

          backendExecutionResult = {
            success: true,
            clinicId,
            action: actionName,
            embedUrl,
            data: remoteRes,
            message: remoteRes?.message || `تم تنفيذ (${actionName}) عبر تيتو ستوديو للبراند (${clinicId}) وتجهيز شاشة (${embedView}) للاعتماد والنشر!`,
          };
          executedAction = {
            type: "STUDIO_EMBED_VIEW",
            view: embedView,
            clinicId,
            embedUrl,
            actionExecuted: actionName,
            result: remoteRes,
          };
        } catch (err: any) {
          const fallbackClinicId = String(brandId && brandId !== "tito_media" ? brandId : "brand_1779847291377");
          const fallbackEmbedView = String(args.embedView || "generator").trim();
          const fallbackEmbedUrl = titoStudioApi.buildStudioEmbedUrl(fallbackEmbedView, fallbackClinicId);
          backendExecutionResult = {
            success: false,
            embedUrl: fallbackEmbedUrl,
            message: `تعذر تنفيذ الأمر الخلفي (${err?.message})، لكن تم فتح شاشة (${fallbackEmbedView}) في تيتو ستوديو مباشرة لتكمل منها فوراً.`,
          };
          executedAction = {
            type: "STUDIO_EMBED_VIEW",
            view: fallbackEmbedView,
            clinicId: fallbackClinicId,
            embedUrl: fallbackEmbedUrl,
            actionExecuted: String(args.action || "ui.navigate"),
          };
        }
        break;
      }

      case "manage_store_erp": {
        const erpAction = String(args.action || "get_summary").trim();
        const resolvedSlug = String(
          args.brandSlugOrId || targetBrand?.slug || targetBrand?.id || brandId || "auto-house"
        ).trim();
        try {
          const { loadTenantErpState, saveTenantErpState, normalizeSlugKey } = await import("./tenantErpStoreService");
          const slugKey = normalizeSlugKey(resolvedSlug);
          const erpState = await loadTenantErpState(slugKey);
          let products: any[] = Array.isArray(erpState.products) && erpState.products.length > 0
            ? [...erpState.products]
            : (Array.isArray(targetBrand?.productsCatalog)
                ? targetBrand.productsCatalog.map((p: any, idx: number) => ({
                    id: idx + 1,
                    name: p.name || `منتج ${idx + 1}`,
                    sku: p.sku || `SKU-${idx + 101}`,
                    category: p.category || "عام",
                    description: p.description || "",
                    sellingPrice: Number(p.numericPrice || String(p.price || "").replace(/[^\d.]/g, "")) || 500,
                    purchasePrice: Math.round((Number(p.numericPrice || 500) || 500) * 0.7),
                    stock: { main: 25, branch1: 10, branch2: 10, branch3: 10 },
                  }))
                : []);
          const sales: any[] = Array.isArray(erpState.dailySales) ? [...erpState.dailySales] : [];
          const expenses: any[] = Array.isArray(erpState.expenses) ? [...erpState.expenses] : [];
          const orders: any[] = Array.isArray(erpState.orders) ? [...erpState.orders] : [];

          if (erpAction === "get_summary") {
            const totalSalesEgp = sales.reduce((s, x) => s + (Number(x.total || x.amount || 0) || 0), 0);
            const totalExpensesEgp = expenses.reduce((s, x) => s + (Number(x.amount || 0) || 0), 0);
            const totalOrdersEgp = orders.reduce((s, x) => s + (Number(x.total || x.totalAmount || 0) || 0), 0);
            backendExecutionResult = {
              success: true,
              brandSlug: slugKey,
              productsCount: products.length,
              products: products.slice(0, 25).map((p: any) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                category: p.category,
                priceEgp: p.sellingPrice || p.price,
                mainStock: p.stock?.main ?? p.stock ?? 0,
              })),
              salesCount: sales.length,
              totalSalesEgp,
              expensesCount: expenses.length,
              totalExpensesEgp,
              netProfitEgp: totalSalesEgp - totalExpensesEgp,
              ordersCount: orders.length,
              totalOrdersEgp,
            };
          } else if (erpAction === "add_product") {
            const newPrice = Number(args.price || 500) || 500;
            const newStock = Number(args.stock ?? 20);
            const newProd = {
              id: Date.now(),
              name: String(args.productName || "منتج جديد"),
              sku: String(args.sku || `SKU-${Date.now().toString().slice(-5)}`),
              category: String(args.category || "عام"),
              mainCategory: String(args.category || "عام"),
              description: String(args.description || ""),
              purchasePrice: Math.round(newPrice * 0.7),
              sellingPrice: newPrice,
              stock: { main: newStock, branch1: 5, branch2: 5, branch3: 5 },
              imageUrl: targetBrand?.logoUrl || "",
              images: targetBrand?.logoUrl ? [targetBrand.logoUrl] : [],
            };
            products = [newProd, ...products];
            await saveTenantErpState(slugKey, { products });
            if (targetBrand?.id) {
              const nextCatalog = [
                { name: newProd.name, sku: newProd.sku, category: newProd.category, numericPrice: newPrice, description: newProd.description },
                ...(Array.isArray(targetBrand.productsCatalog) ? targetBrand.productsCatalog : []),
              ];
              persistBrandUpdateAcrossEcosystem(targetBrand.id, { productsCatalog: nextCatalog });
            }
            backendExecutionResult = {
              success: true,
              product: newProd,
              message: `تمت إضافة "${newProd.name}" بسعر ${newPrice} ج.م (${newStock} قطعة) وحفظه في المتجر السحابي فوراً!`,
            };
          } else if (erpAction === "update_price") {
            const needle = String(args.productName || args.sku || "").trim().toLowerCase();
            const newPrice = Number(args.price || 0);
            const idx = products.findIndex((p: any) =>
              (needle && String(p.name || "").toLowerCase().includes(needle)) ||
              (needle && String(p.sku || "").toLowerCase() === needle)
            );
            if (idx === -1 || !newPrice) {
              backendExecutionResult = { success: false, error: `لم يتم العثور على المنتج "${needle}" أو السعر غير صالح` };
            } else {
              const oldPrice = products[idx].sellingPrice;
              products[idx] = { ...products[idx], sellingPrice: newPrice };
              await saveTenantErpState(slugKey, { products });
              backendExecutionResult = {
                success: true,
                productName: products[idx].name,
                oldPrice,
                newPrice,
                message: `تم تحديث سعر "${products[idx].name}" من ${oldPrice} ج.م إلى ${newPrice} ج.م في المتجر السحابي فوراً!`,
              };
            }
          } else if (erpAction === "add_expense") {
            const amt = Number(args.amount || 0);
            const exp = {
              id: Date.now(),
              date: new Date().toISOString().split("T")[0],
              category: String(args.category || "مصروفات تشغيل"),
              description: String(args.description || args.productName || "مصروف مسجل عبر جارفيس"),
              amount: amt,
              branch: "main",
            };
            await saveTenantErpState(slugKey, { expenses: [exp, ...expenses] });
            backendExecutionResult = { success: true, expense: exp, message: `تم تسجيل مصروف "${exp.description}" بقيمة ${amt} ج.م.` };
          } else if (erpAction === "record_sale") {
            const qty = Math.max(1, Number(args.quantity || args.stock || 1) || 1);
            const needle = String(args.productName || args.sku || "").trim().toLowerCase();
            const branchKey = String(args.branch || "branch1").trim();
            const matchedIdx = needle
              ? products.findIndex((p: any) =>
                  String(p.name || "").toLowerCase().includes(needle) ||
                  String(p.sku || "").toLowerCase() === needle
                )
              : -1;
            const matchedProduct = matchedIdx >= 0 ? products[matchedIdx] : null;
            const unitPrice = Number(args.price || args.amount || matchedProduct?.sellingPrice || 0) || 0;
            const subtotal = matchedProduct && !args.amount ? unitPrice * qty : (Number(args.amount) || unitPrice * qty);
            const discountVal = Math.max(0, Number(args.discount || 0) || 0);
            const afterDiscount = Math.max(0, subtotal - discountVal);
            const isTax = Boolean(args.isTaxable);
            const taxAmount = isTax ? Math.round(afterDiscount * 0.14) : 0;
            const total = afterDiscount + taxAmount;

            const todayCompact = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const todaySeq = sales.filter((s: any) => String(s.invoiceNumber || "").startsWith(todayCompact)).length + 1;
            const invoiceNumber = `${todayCompact}${String(todaySeq).padStart(3, "0")}`;
            const saleId = Date.now();
            const payMethod = String(args.paymentMethod || "نقدى");

            if (matchedIdx >= 0 && products[matchedIdx]) {
              const curStock = typeof products[matchedIdx].stock === "object"
                ? { ...products[matchedIdx].stock }
                : { main: Number(products[matchedIdx].stock || 0), branch1: Number(products[matchedIdx].stock || 0) };
              curStock[branchKey] = Math.max(0, Number(curStock[branchKey] ?? 0) - qty);
              products[matchedIdx] = { ...products[matchedIdx], stock: curStock };
            }

            const sale = {
              id: saleId,
              invoiceNumber,
              date: new Date().toISOString().split("T")[0],
              direction: "بيع",
              invoiceType: "retail",
              branchSoldFrom: branchKey,
              cashierLocation: "تحت",
              customerName: String(args.customerName || "عميل نقدي"),
              items: [
                {
                  productId: matchedProduct?.id || 0,
                  productName: matchedProduct?.name || String(args.productName || "مبيعات عامة"),
                  name: matchedProduct?.name || String(args.productName || "مبيعات عامة"),
                  quantity: qty,
                  unitPrice,
                  price: unitPrice,
                  total: subtotal,
                },
              ],
              subtotal,
              discount: discountVal,
              isTaxable: isTax,
              taxAmount,
              total,
              cashAmount: payMethod === "نقدى" ? total : 0,
              electronicAmount: payMethod === "إلكتروني" ? total : 0,
              remainingAmount: payMethod === "آجل" ? total : 0,
              paymentMethod: payMethod,
              branch: branchKey,
            };

            const treasuryList: any[] = Array.isArray(erpState.treasury) ? [...erpState.treasury] : [];
            if (payMethod !== "آجل" && total > 0) {
              treasuryList.unshift({
                id: saleId + 1,
                date: new Date().toISOString(),
                type: "sale",
                description: `فاتورة مبيعات #${invoiceNumber} - ${sale.customerName}`,
                amountIn: total,
                amountOut: 0,
                relatedId: invoiceNumber,
              });
            }

            await saveTenantErpState(slugKey, {
              dailySales: [sale, ...sales],
              products,
              treasury: treasuryList,
            });

            const appBase = String(targetBrand?.dedicatedLiveUrl || `https://t2-tenant-${slugKey}.vercel.app`).replace(/\/$/, "");
            const invoicePrintUrl = `${appBase}/#print-invoice/${saleId}`;
            backendExecutionResult = {
              success: true,
              invoiceNumber,
              sale,
              invoicePrintUrl,
              stockDeducted: Boolean(matchedProduct),
              message: `تم إصدار الفاتورة رقم #${invoiceNumber} للعميل "${sale.customerName}" بإجمالي ${total} ج.م${matchedProduct ? ` وخصم ${qty} قطعة من مخزون "${matchedProduct.name}" وترحيل المبلغ للخزينة` : ""}. رابط الطباعة الفوري: ${invoicePrintUrl}`,
            };
            executedAction = {
              type: "OPEN_INVOICE_PRINT",
              url: invoicePrintUrl,
              invoiceNumber,
              total,
            };
          } else if (erpAction === "update_order_status") {
            const oid = String(args.orderId || "");
            const oIdx = orders.findIndex((o: any) => String(o.id) === oid);
            if (oIdx === -1) {
              backendExecutionResult = { success: false, error: `الطلب (${oid}) غير موجود` };
            } else {
              orders[oIdx] = { ...orders[oIdx], status: String(args.status || "confirmed") };
              await saveTenantErpState(slugKey, { orders });
              backendExecutionResult = { success: true, order: orders[oIdx], message: `تم تحديث حالة الطلب ${oid} إلى ${orders[oIdx].status}.` };
            }
          } else if (erpAction === "update_stock") {
            const needle = String(args.productName || args.sku || "").trim().toLowerCase();
            const newQty = Number(args.stock ?? 0);
            const branchKey = String(args.branch || "main").trim();
            const idx = products.findIndex((p: any) =>
              (needle && String(p.name || "").toLowerCase().includes(needle)) ||
              (needle && String(p.sku || "").toLowerCase() === needle)
            );
            if (idx === -1) {
              backendExecutionResult = { success: false, error: `لم يتم العثور على المنتج "${needle}"` };
            } else {
              const prevStock = typeof products[idx].stock === "object" ? { ...products[idx].stock } : { main: Number(products[idx].stock || 0) };
              prevStock[branchKey] = newQty;
              products[idx] = { ...products[idx], stock: prevStock };
              await saveTenantErpState(slugKey, { products });
              backendExecutionResult = { success: true, productName: products[idx].name, branch: branchKey, stock: newQty, message: `تم تحديث مخزون "${products[idx].name}" في (${branchKey}) إلى ${newQty} قطعة.` };
            }
          } else if (erpAction === "add_employee") {
            const employees: any[] = Array.isArray(erpState.employees) ? [...erpState.employees] : [];
            const emp = {
              id: Date.now(),
              name: String(args.employeeName || "موظف جديد"),
              role: String(args.employeeRole || "مبيعات"),
              salary: Number(args.salary || args.amount || 4000),
              phone: String(args.phone || ""),
              branch: String(args.branch || "main"),
              joinDate: new Date().toISOString().split("T")[0],
            };
            await saveTenantErpState(slugKey, { employees: [emp, ...employees] });
            backendExecutionResult = { success: true, employee: emp, message: `تم تسجيل الموظف "${emp.name}" براتب ${emp.salary} ج.م.` };
          } else if (erpAction === "record_advance") {
            const advances: any[] = Array.isArray(erpState.advances) ? [...erpState.advances] : [];
            const amt = Number(args.amount || 0);
            const adv = {
              id: Date.now(),
              employeeName: String(args.employeeName || "موظف"),
              amount: amt,
              date: new Date().toISOString().split("T")[0],
              notes: String(args.description || "سلفة مسجلة عبر جارفيس"),
            };
            await saveTenantErpState(slugKey, { advances: [adv, ...advances] });
            backendExecutionResult = { success: true, advance: adv, message: `تم تسجيل سلفة بقيمة ${amt} ج.م للموظف "${adv.employeeName}".` };
          } else if (erpAction === "add_supplier") {
            const suppliers: any[] = Array.isArray(erpState.suppliers) ? [...erpState.suppliers] : [];
            const sup = {
              id: Date.now(),
              name: String(args.supplierName || "مورد جديد"),
              phone: String(args.phone || ""),
              notes: String(args.description || ""),
              balance: 0,
            };
            await saveTenantErpState(slugKey, { suppliers: [sup, ...suppliers] });
            backendExecutionResult = { success: true, supplier: sup, message: `تمت إضافة المورد "${sup.name}" لقاعدة الموردين.` };
          } else if (erpAction === "record_purchase") {
            const purchases: any[] = Array.isArray(erpState.purchases) ? [...erpState.purchases] : [];
            const amt = Number(args.amount || 0);
            const pur = {
              id: Date.now(),
              date: new Date().toISOString().split("T")[0],
              supplierName: String(args.supplierName || "مورد عام"),
              description: String(args.description || args.productName || "فاتورة مشتريات"),
              total: amt,
              branch: String(args.branch || "main"),
            };
            await saveTenantErpState(slugKey, { purchases: [pur, ...purchases] });
            backendExecutionResult = { success: true, purchase: pur, message: `تم تسجيل فاتورة مشتريات من "${pur.supplierName}" بقيمة ${amt} ج.م.` };
          } else if (erpAction === "add_treasury_tx") {
            const treasury: any[] = Array.isArray(erpState.treasury) ? [...erpState.treasury] : [];
            const amt = Number(args.amount || 0);
            const isOut = String(args.txType || "in").toLowerCase() === "out";
            const tx = {
              id: Date.now(),
              date: new Date().toISOString(),
              type: isOut ? "expense" : "deposit",
              description: String(args.description || (isOut ? "صرف خزينة عبر جارفيس" : "إيداع خزينة عبر جارفيس")),
              amountIn: isOut ? 0 : amt,
              amountOut: isOut ? amt : 0,
              relatedId: `JRV-${Date.now()}`,
            };
            await saveTenantErpState(slugKey, { treasury: [tx, ...treasury] });
            backendExecutionResult = { success: true, transaction: tx, message: `تم تسجيل حركة خزينة (${isOut ? "صادر" : "وارد"}) بقيمة ${amt} ج.م.` };
          } else if (erpAction === "update_store_settings") {
            const currentSettings = (erpState.storefrontSettings && typeof erpState.storefrontSettings === "object") ? { ...erpState.storefrontSettings } : {};
            const nextSettings = {
              ...currentSettings,
              ...(args.companyName ? { companyName: String(args.companyName) } : {}),
              ...(args.tickerText ? { tickerText: String(args.tickerText) } : {}),
              ...(args.phone ? { contactPhone: String(args.phone) } : {}),
              ...(args.address ? { address: String(args.address) } : {}),
              ...(args.primaryColor ? { primaryColor: String(args.primaryColor) } : {}),
              ...(args.description ? { aboutUs: String(args.description) } : {}),
            };
            await saveTenantErpState(slugKey, { storefrontSettings: nextSettings });
            if (typeof args.branchCount === "number" || typeof args.cashierCount === "number" || args.primaryBranchLabel || args.primaryCashierLabel) {
              const { customizeAppLiveConfig } = await import("./aiCodeSurgeonService");
              const cRes = await customizeAppLiveConfig(slugKey, {
                branchCount: typeof args.branchCount === "number" ? args.branchCount : undefined,
                cashierCount: typeof args.cashierCount === "number" ? args.cashierCount : undefined,
                primaryBranchLabel: args.primaryBranchLabel ? String(args.primaryBranchLabel) : undefined,
                primaryCashierLabel: args.primaryCashierLabel ? String(args.primaryCashierLabel) : undefined,
              });
              backendExecutionResult = { success: true, storefrontSettings: nextSettings, ...cRes };
            } else {
              backendExecutionResult = { success: true, storefrontSettings: nextSettings, message: "تم تحديث إعدادات المتجر السحابية بنجاح." };
            }
          } else if (erpAction === "customize_app") {
            const { customizeAppLiveConfig } = await import("./aiCodeSurgeonService");
            const cRes = await customizeAppLiveConfig(slugKey, {
              branchCount: typeof args.branchCount === "number" ? args.branchCount : undefined,
              cashierCount: typeof args.cashierCount === "number" ? args.cashierCount : undefined,
              primaryBranchLabel: args.primaryBranchLabel ? String(args.primaryBranchLabel) : undefined,
              primaryCashierLabel: args.primaryCashierLabel ? String(args.primaryCashierLabel) : undefined,
            });
            backendExecutionResult = { success: true, ...cRes };
          }
        } catch (err: any) {
          backendExecutionResult = { success: false, error: err?.message || "ERP execution error" };
        }
        break;
      }

      case "edit_tenant_repo_code": {
        if (persona !== "tito") {
          backendExecutionResult = { success: false, error: "أداة التعديل البرمجي متاحة للماستر تيتو فقط." };
          break;
        }
        const surgeonAction = String(args.action || "inspect_repo").trim();
        const repoName = String(args.repoName || "t2-tenant-auto-house").trim();
        try {
          const { inspectTenantRepo, editTenantRepoCode, rollbackLastRepoEdit } = await import("./aiCodeSurgeonService");
          if (surgeonAction === "inspect_repo") {
            const res = await inspectTenantRepo(repoName, args.filePath ? String(args.filePath) : undefined);
            backendExecutionResult = { success: Boolean(res.ok), ...res };
          } else if (surgeonAction === "edit_code") {
            const res = await editTenantRepoCode({
              repoName,
              filePath: String(args.filePath || ""),
              instruction: String(args.instruction || message),
              ai,
            });
            backendExecutionResult = { success: Boolean(res.ok), ...res };
          } else if (surgeonAction === "rollback") {
            const res = await rollbackLastRepoEdit(repoName);
            backendExecutionResult = { success: Boolean(res.ok), ...res };
          }
        } catch (err: any) {
          backendExecutionResult = { success: false, error: err?.message || "Code surgeon error" };
        }
        break;
      }

      case "tito_studio_media_studio": {
        try {
          if (args.action === "generate_image") {
            backendExecutionResult = await titoStudioApi.generateGeminiImage(
              args.prompt || `Commercial advertising visual for ${targetBrand.name}, luxury lighting`
            );
          } else if (args.action === "start_veo_video") {
            backendExecutionResult = await titoStudioApi.startVeoVideo(
              args.prompt || `Cinematic 9:16 vertical reel for ${targetBrand.name}`
            );
          } else if (args.action === "check_veo_video" && args.operationName) {
            backendExecutionResult = await titoStudioApi.checkVeoOperation(args.operationName);
          } else if (args.action === "zain_copilot") {
            backendExecutionResult = await titoStudioApi.zainCopilotChat(
              args.prompt || message,
              { name: targetBrand.name, industry: targetBrand.businessType }
            );
          }
          executedAction = {
            type: "TITO_STUDIO_ACTION",
            module: "media_studio",
            brandId,
            result: backendExecutionResult,
          };
        } catch (err: any) {
          backendExecutionResult = { success: false, message: `خطأ في استوديو الميديا 3D: ${err?.message}` };
        }
        break;
      }
    }
  }

  // Zero-Hallucination Deterministic Guard for live App Customization (branches / cashiers)
  if (!backendExecutionResult?.appCustomization && /فرع|فروع|كاشير/i.test(message) && /واحد|اثنين|2|1|3|عدل|خلي|خلّي/i.test(message)) {
    try {
      const { customizeAppLiveConfig } = await import("./aiCodeSurgeonService");
      const branchCount = /فرع\s*واحد|فرع\s*1\b|فرع\s*فقط/i.test(message) ? 1 : (/فرعين|2\s*فرع/i.test(message) ? 2 : undefined);
      const cashierCount = /كاشير\s*واحد|كاشير\s*1\b|كاشير\s*فقط/i.test(message) ? 1 : (/كاشيرين|2\s*كاشير/i.test(message) ? 2 : undefined);
      if (branchCount || cashierCount) {
        const slugTarget = String(targetBrand?.slug || targetBrand?.id || selectedBrandId || "auto-house").trim();
        backendExecutionResult = await customizeAppLiveConfig(slugTarget, {
          ...(branchCount ? { branchCount } : {}),
          ...(cashierCount ? { cashierCount } : {}),
        });
      }
    } catch {}
  }

  // If Gemini executed a tool and didn't produce spoken text in the same turn, generate a natural Egyptian Arabic confirmation
  let replyText = chat?.text?.trim() || "";
  if (!replyText && (backendExecutionResult || executedAction)) {
    for (const modelName of ACTIVE_GEMINI_TEXT_MODELS.slice(0, 3)) {
      try {
        const followUp = await ai.models.generateContent({
          model: modelName,
          contents: `${systemPrompt}
رسالة المتحدث: "${message}"
النتيجة الفعلية التي تم تنفيذها الآن لبراند "${targetBrand.name}": ${
            backendExecutionResult?.message ||
            JSON.stringify(executedAction)
          }
اكتب رد جارفيس المختصر بالعامية المصرية الطبيعية (جملة أو جملتين فقط) يؤكد تنفيذ الأمر فوراً:`,
        });
        replyText = followUp?.text?.trim() || "";
        if (replyText) break;
      } catch {}
    }
  }

  if (!replyText) {
    if (backendExecutionResult?.message) {
      replyText = backendExecutionResult.message;
    } else {
      const msgLower = String(message || "").toLowerCase();
      const wantsPlans = /باقة|باقات|سعر|أسعار|اشتراك|2500|5000|10000|20000|50000|تجربة/.test(msgLower);
      const wantsStatus = /حالة|تقرير|منظومة|سرب|واتساب|متصل|منفصل|أخبار|براند/.test(msgLower);
      const disconnectMatch = String(liveDbContext || "").match(/براندات واتساب منفصلة الآن[^:]*:\s*([^\n.]+)/);

      if (wantsPlans) {
        const dynamicPlansSpeech = Object.values(getDynamicSaasPlans())
          .map((p) => `${p.nameAr} (${p.appAccessMode === "landing_page" ? "لاندنج بيدج" : "تطبيق كامل"})`)
          .join("، ");
        replyText = `الباقات المتاحة حالياً في النظام هي: ${dynamicPlansSpeech}. تحب نفعّل أي باقة؟`;
      } else if (wantsStatus && persona === "tito") {
        const disconnectNote = disconnectMatch
          ? ` ⚠️ وتنبيه مهم: يوجد براند منفصل على واتساب حالياً (${disconnectMatch[1]}) ويحتاج إعادة ربط QR.`
          : " جميع جلسات واتساب المسجلة مستقرة.";
        replyText = `يا ماستر تيتو، المنظومة تدير حالياً ${unifiedBrands.length} براند.${disconnectNote}`;
      } else {
        const paidPlansCount = Object.values(getDynamicSaasPlans()).filter((p) => p.priceEgp > 0).length;
        replyText =
          persona === "tito"
            ? `يا ماستر تيتو، حصّة مفاتيح Gemini وصلت للحد اللحظي (429)، لكن كل أنظمة المنظومة (${unifiedBrands.length} براند) شغالة. قولي اسم البراند أو الأمر التنفيذي وهنفذه فوراً.`
            : `أهلاً بحضرتك يا فندم! حالياً فيه ضغط لحظي على محرك الذكاء الاصطناعي، قولي اسم نشاطك أو اسألني عن الباقات (${paidPlansCount} باقات متاحة + تجربة مجانية) وهعرضهالك فوراً.`;
      }
    }
  }

  // Sanitize replyText: strip any leaked function_call syntax or internal template names for visitors
  replyText = replyText
    .replace(/[a-z_][a-z0-9_]*\s*\([^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (persona !== "tito") {
    replyText = replyText
      .replace(/يا\s*ماستر\s*تيتو|يا\s*ماستر/gi, detectedVisitorName ? `يا ${detectedVisitorName}` : "يا فندم")
      .replace(/\bBattah\b|بطاح/gi, "منصة المتاجر والمخازن المتكاملة")
      .replace(/\bClean\s*Master\b|كلين\s*ماستر/gi, "منصة الخدمات والحجوزات الذكية");

    if (hasPriorTurns) {
      replyText = replyText
        .replace(/^(?:أهلاً|اهلا|مرحباً|مرحبا|يا هلا)\s+(?:بيك|بك|بحضرتك)[^.!؟\n]{0,65}(?:أنا\s*جارفيس|أنا\s*جارفز|منظومة\s*T2|النمو\s*الشامل)[^.!؟\n]*[.!؟،]?\s*/i, "")
        .trim();
    }
  }

  // Deterministic UI action fallback if Admin asked to open a view or switch brand and Gemini replied in text only
  if (persona === "tito" && !executedAction) {
    if (/صالة العرض|الاعتماد|showroom/i.test(message)) {
      const cid = String(resolvedBrand?.id || selectedBrandId || "1");
      executedAction = {
        type: "STUDIO_EMBED_VIEW",
        view: "showroom",
        clinicId: cid,
        embedUrl: titoStudioApi.buildStudioEmbedUrl("showroom", cid),
        actionExecuted: "ui.navigate",
      };
    } else if (/استوديو المحتوى|افتح الاستوديو|generator/i.test(message)) {
      const cid = String(resolvedBrand?.id || selectedBrandId || "1");
      executedAction = {
        type: "STUDIO_EMBED_VIEW",
        view: "generator",
        clinicId: cid,
        embedUrl: titoStudioApi.buildStudioEmbedUrl("generator", cid),
        actionExecuted: "ui.navigate",
      };
    } else if (/افتح|افتحلي|افتح لى|اعرض|وريني|شغل|انقل/i.test(message) && resolvedBrand?.id) {
      executedAction = {
        type: "SWITCH_BRAND",
        brandId: resolvedBrand.slug || resolvedBrand.id,
        brandName: resolvedBrand.name,
        openHub: true,
      };
    }
  } else if (persona === "client" && !executedAction && /افتح|اعرض|وريني|لوحة|براندي/i.test(message) && resolvedBrand?.id) {
    executedAction = {
      type: "SWITCH_BRAND",
      brandId: resolvedBrand.slug || resolvedBrand.id,
      brandName: resolvedBrand.name,
      openHub: true,
    };
  }

  // Detect existing business name mentioned by visitor to auto-sync onboarding card
  const existingBrandMatch =
    persona === "visitor"
      ? message.match(/(?:عندي\s+(?:براند|نشاط|شركة|متجر|محل)[^.\n]*?(?:اسمه|اسمها)\s+|براند\s+اسمه\s+|اسمه\s+)([^\n،,.!?]{2,40})/i)
      : null;
  if (existingBrandMatch && !executedAction) {
    executedAction = {
      type: "VISITOR_EXISTING_BUSINESS_DETECTED",
      businessName: existingBrandMatch[1].trim(),
      hasExistingBusiness: true,
    };
  }

  // Synthesize response in 100% Gemini Human Voice (Puck 24kHz) ONLY when explicitly requested (skipTts defaults to true)
  let audioBase64: string | null = null;
  if (input.skipTts === false) {
    try {
      const audioBuffer = await Promise.race([
        synthesizeSpeech(replyText, "Puck"),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("TTS_TIMEOUT")), 4500)),
      ]);
      audioBase64 = audioBuffer.toString("base64");
    } catch (ttsErr: any) {
      console.warn("[Jarvis Live Voice TTS Warning]:", ttsErr?.message);
    }
  }

  const shouldTriggerBrowser =
    /احجز|افحص|ادخل|شغل البراوزر|دوس على|افتح الموقع|سيلينيوم/i.test(message);

  const isWav =
    audioBase64 &&
    Buffer.from(audioBase64, "base64").toString("ascii", 0, 4) === "RIFF";

  const quickChips: string[] =
    persona === "visitor"
      ? (executedAction?.type === "VISITOR_EXISTING_BUSINESS_DETECTED" || targetBrand?.id !== "clean_master"
          ? ["تجهيز التطبيق والكتالوج الآن", "عندي لوجو وموقع حالي", "عاوز أربط واتساب والسوشيال"]
          : ["عندي بيزنس قائم بالفعل", "فكرة جديدة من الصفر", "ورّيني الباقات والتجربة 7 أيام"])
      : ["تقرير السرب والأرقام الآن", "ملخص تفاعلات الواتساب", "خطة المحتوى في ستوديو"];

  // Persist rolling summary to Cloud-First Memory so /jarvis and /chat share one brain
  saveCloudMemory(scopeKey, {
    rollingSummary: `المتحدث: ${message.slice(0, 120)} | جارفيس: ${replyText.slice(0, 160)}`,
    facts: detectedVisitorName ? [`اسم العميل: ${detectedVisitorName}`] : undefined,
  }).catch(() => {});

  return {
    success: true,
    replyText,
    detectedVisitorName: detectedVisitorName || undefined,
    quickChips,
    audioBase64,
    audioFormat: isWav ? "audio/wav" : "audio/mp3",
    action: executedAction,
    executionResult: backendExecutionResult,
    shouldTriggerBrowser,
    suggestedScenario: /عربية|سيارة|الخضر/i.test(message)
      ? "alkhedr_booking"
      : /نظافة|كلين/i.test(message)
      ? "clean_master_booking"
      : "admin_audit",
    resolvedBrandId: targetBrand.id,
  };
}
