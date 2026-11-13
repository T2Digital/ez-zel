import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import {
  executeRealJarvisEcosystemAction,
  getUnifiedGrowthBrands,
  getEzZelPersonalClients,
} from "./obsidianVaultService";

export interface JarvisBrainInput {
  message: string;
  history?: Array<{ role: string; text: string }>;
  persona?: "tito" | "visitor" | "trial" | "client" | string;
  selectedBrandId?: string;
  recentChatSummary?: string;
  ai: GoogleGenAI;
  stats: any;
  synthesizeSpeech: (text: string, voice?: string) => Promise<Buffer>;
}

export interface JarvisBrainOutput {
  success: boolean;
  replyText: string;
  audioBase64: string | null;
  audioFormat: "audio/wav" | "audio/mp3";
  action: any;
  executionResult: any;
  shouldTriggerBrowser: boolean;
  suggestedScenario: string;
  resolvedBrandId: string;
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
    const direct = unifiedBrands.find(
      (b) =>
        String(b.id || "").toLowerCase() === q ||
        String(b.slug || "").toLowerCase() === q ||
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
      "التحكم في واجهة جارفيس وفتح الشاشات أو التبويبات أو النوافذ المنبثقة (الشبكة 3D، تقويم ستوديو، وكيل واتساب، ربط QR، ربط ميتا، متجر PWA، نافذة البراند الشاملة، أو إيقاف البوت).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        actionType: {
          type: Type.STRING,
          enum: ["OPEN_BRAND_SUPER_WINDOW", "SWITCH_TAB", "OPEN_MODAL", "TOGGLE_BOT"],
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
];

function buildPersonaSystemPrompt(
  persona: string,
  activeBrand: any,
  unifiedBrands: any[],
  ezzelClients: any[],
  recentChatSummary: string
): string {
  const allBrandsBrief = unifiedBrands
    .slice(0, 35)
    .map((b) => `${b.name} [id:${b.id}] (${b.businessType || "نشاط تجاري"})`)
    .join(" | ");

  let personaRoleInstruction = "";
  if (persona === "visitor") {
    personaRoleInstruction = `المتحدث معك الآن هو "زائر جديد أو صاحب نشاط تجاري" يستكشف منظومة النمو الشامل للأعمال (T2 Unified Growth OS).
دورك معه: أنت "جارفيس"، كبير مستشاري الأعمال والنمو الرقمي بالمنظومة. تتحدث باللهجة المصرية الطبيعية الذكية والودودة.
قاعدة صارمة ومطلقة: ممنوع نهائياً استخدام كلمة "استنساخ" أو "مستنسخ"، واستبدلها دائماً بكلمات: "تأسيس، إطلاق، بناء، تجهيز، تخصيص، تفعيل".
استخدم الأداة record_visitor_diagnostic تلقائياً كلما ذكر الزائر أي معلومة عن نشاطه أو صفحاته أو رقمه.
قواعد الحوار:
1. ممنوع تكرار التحية ("أهلاً بك" أو "مرحباً") بعد أول رسالة، وممنوع تكرار أي سؤال أجاب عنه مسبقاً.
2. تدرج معه بذكاء: (نشاط قائم أم من الصفر؟ -> الموقع والصفحات -> التطمين العملي -> عرض أسبوع التجربة المجانية 7 أيام).
3. اجعل ردك مختصراً جداً ومركزاً (جملة أو جملتين بالعامية المصرية الذكية).`;
  } else if (persona === "trial" || persona === "client") {
    personaRoleInstruction = `المتحدث معك الآن هو "المشترك / صاحب البراند" (${activeBrand?.name || "براند العميل"}) في وضع المدير التنفيذي.
دورك معه: أنت المدير التنفيذي والسكرتير الذكي المسؤول عن إدارة برانده (${activeBrand?.name || "البراند"}): تقويم تيتو ستوديو، وكيل واتساب، الحملات الممولة، والكتالوج.
خاطبه باحترام كشريك نجاح ("يا فندم" أو "يا ريس") باللهجة المصرية الودودة والاحترافية.`;
  } else {
    personaRoleInstruction = `المتحدث معك الآن هو الماستر "تيتو" (Ahmed Attia) — المالك والمدير العام للوكالة والمنظومة بالكامل (Super Admin).
دورك معه: أنت "جارفيس" (Jarvis)، الذراع الأيمن التنفيذي وقائد الأسطول السيادي.
خاطبه دائماً بـ "يا ماستر تيتو" أو "يا باشا" باللهجة المصرية القاهرية الطبيعية الدافئة.
لديك إلمام كامل بـ:
1. عملاء تطبيق الظل (المساعد الشخصي): عددهم ${ezzelClients.length} مشتركين نشطين.
2. عملاء وبراندات وكالة النمو الشامل الموحدة: عددهم ${unifiedBrands.length} براند.
3. البراند المحدد حالياً على الشاشة: ${activeBrand ? `"${activeBrand.name}" (${activeBrand.businessType} - واتساب: ${activeBrand.phone})` : "لا يوجد براند محدد حالياً (العرض العام للمنظومة)"}.
عند طلب أي أمر تنفيذي أو ملاحي أو تعديل في أي براند، استدعِ الأداة المناسبة فوراً بدقة.`;
  }

  return `أنت "جارفيس" (Jarvis)، العقل التنفيذي الموحد لمنظومة النمو الشامل للأعمال (Ez-Zel + Tito Studio + T2 Agent + App Cloner + Obsidian Knowledge Vault).
${personaRoleInstruction}

[قائمة الـ ${unifiedBrands.length} براند الموحدة الحية في المنظومة]:
${allBrandsBrief}
${recentChatSummary ? `\n[سياق آخر محادثة في شات الظل الرئيسي]: ${recentChatSummary}` : ""}

قواعد صارمة:
- تحدث بالعامية المصرية الطبيعية السلسة جداً (بدون تشكيل معقد وبدون فصحى روبوتية) عشان صوت Gemini البشري يطلع طبيعي 100%.
- اجعل ردك مختصراً ومباشراً في جملة أو جملتين مركزتين وعمليتين.
- لا تكرر تقارير قديمة إلا إذا سألك المستخدم عنها مباشرة.`;
}

export async function runJarvisBrainConversation(
  input: JarvisBrainInput
): Promise<JarvisBrainOutput> {
  const {
    message,
    history = [],
    persona = "tito",
    selectedBrandId = "",
    recentChatSummary = "",
    ai,
    synthesizeSpeech,
  } = input;

  const unifiedBrands = getUnifiedGrowthBrands();
  const ezzelClients = getEzZelPersonalClients();

  const mentionedOrSelectedBrand =
    resolveBrandDynamically(selectedBrandId, message, unifiedBrands) ||
    unifiedBrands[0] || {
      id: "tito_media",
      name: "تيتو ميديا",
      businessType: "نمو رقمي وتسويق",
      phone: "01030956097",
    };

  const systemPrompt = buildPersonaSystemPrompt(
    persona,
    selectedBrandId ? mentionedOrSelectedBrand : null,
    unifiedBrands,
    ezzelClients,
    recentChatSummary
  );

  const formattedHistory =
    Array.isArray(history) && history.length > 0
      ? history
          .slice(-6)
          .map(
            (h: any) =>
              `${h.role === "user" ? "المتحدث" : "جارفيس"}: "${h.text}"`
          )
          .join("\n")
      : "";

  const fullPrompt = `${systemPrompt}

${
  formattedHistory
    ? `[سجل الحوار السابق - اقرأه جيداً وممنوع تكرار التحية أو أي سؤال تم سؤاله]:\n${formattedHistory}\n`
    : ""
}رسالة المتحدث الحالية: "${message}"`;

  // Visitor persona only uses record_visitor_diagnostic; admin/client get all tools
  const activeTools =
    persona === "visitor"
      ? jarvisBrainTools.filter((t) => t.name === "record_visitor_diagnostic")
      : jarvisBrainTools;

  let chat: any = null;
  try {
    chat = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      config: {
        tools: [{ functionDeclarations: activeTools }],
        temperature: 0.4,
      },
    });
  } catch (modelErr: any) {
    console.warn(
      `[Jarvis Brain] gemini-2.0-flash failed (${modelErr?.message}), trying gemini-1.5-flash...`
    );
    try {
      chat = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: fullPrompt,
        config: {
          tools: [{ functionDeclarations: activeTools }],
          temperature: 0.4,
        },
      });
    } catch (fallbackErr: any) {
      console.warn(`[Jarvis Brain] Fallback error:`, fallbackErr?.message);
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

        if (
          publishNow &&
          !/فكرة|صمم|اعمل|جديد|توليد/i.test(message) &&
          /انشر|نزل البوست/i.test(message)
        ) {
          backendExecutionResult = await executeRealJarvisEcosystemAction({
            actionType: "PUBLISH_STUDIO_POST",
            brandId,
            data: { postIndex: 0 },
          });
          executedAction = {
            type: "TRIGGER_ACTION",
            action: "PUBLISH_POST",
            brandId,
            result: backendExecutionResult,
          };
        } else {
          backendExecutionResult = await executeRealJarvisEcosystemAction({
            actionType: "CREATE_CUSTOM_STUDIO_POST",
            brandId,
            data: {
              topic: dynamicTopic,
              publishNow,
            },
          });
          executedAction = {
            type: publishNow ? "TRIGGER_ACTION" : "SWITCH_TAB",
            action: publishNow ? "PUBLISH_POST" : undefined,
            tab: publishNow ? "content_post_card" : "studio_calendar",
            brandId,
            result: backendExecutionResult,
          };
        }
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
          if (args.actionType === "OPEN_BRAND_SUPER_WINDOW") {
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
    }
  }

  // If Gemini executed a tool and didn't produce spoken text in the same turn, generate a natural Egyptian Arabic confirmation
  let replyText = chat?.text?.trim() || "";
  if (!replyText && (backendExecutionResult || executedAction)) {
    try {
      const followUp = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${systemPrompt}
رسالة المتحدث: "${message}"
النتيجة الفعلية التي تم تنفيذها الآن لبراند "${targetBrand.name}": ${
          backendExecutionResult?.message ||
          JSON.stringify(executedAction)
        }
اكتب رد جارفيس المختصر بالعامية المصرية الطبيعية (جملة أو جملتين فقط) يؤكد تنفيذ الأمر فوراً:`,
      });
      replyText = followUp?.text?.trim() || "";
    } catch {}
  }

  if (!replyText) {
    replyText =
      backendExecutionResult?.message ||
      (persona === "tito"
        ? `أمرك يا ماستر تيتو، تم التنفيذ الفعلي لـ ${targetBrand.name} في المنظومة.`
        : `تحت أمرك يا فندم، تم التحديث بنجاح لـ ${targetBrand.name}.`);
  }

  // Synthesize response in 100% Gemini Human Voice (Puck 24kHz)
  let audioBase64: string | null = null;
  try {
    const audioBuffer = await synthesizeSpeech(replyText, "Puck");
    audioBase64 = audioBuffer.toString("base64");
  } catch (ttsErr: any) {
    console.warn("[Jarvis Live Voice TTS Warning]:", ttsErr?.message);
  }

  const shouldTriggerBrowser =
    /احجز|افحص|ادخل|شغل البراوزر|دوس على|افتح الموقع|سيلينيوم/i.test(message);

  const isWav =
    audioBase64 &&
    Buffer.from(audioBase64, "base64").toString("ascii", 0, 4) === "RIFF";

  return {
    success: true,
    replyText,
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
