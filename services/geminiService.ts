
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

// دالة جلب المفتاح - الصارمة لبيئة Vite/Vercel
const getApiKey = () => {
  // @ts-ignore
  if (import.meta.env && import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  // @ts-ignore
  return (process.env?.VITE_API_KEY || process.env?.API_KEY || (window as any).process?.env?.VITE_API_KEY || "");
};

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return audioCtx;
}

const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try { return await fn(); } catch (error: any) {
    const isQuota = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
    if (retries > 0 && isQuota) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const retrieveRelevantContext = (query: string, facts: DBFact[]): string => {
    if (!facts || facts.length === 0) return "الذاكرة فارغة.";
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = facts.map(f => {
        let s = 0;
        terms.forEach(t => { if (f.fact.toLowerCase().includes(t)) s++; });
        return { ...f, s };
    }).filter(f => f.s > 0 || terms.length === 0).sort((a, b) => b.s - a.s || b.timestamp - a.timestamp).slice(0, 15);
    return scored.map(f => `- ${f.fact}`).join("\n") || facts.slice(-10).map(f => `- ${f.fact}`).join("\n");
};

// --- أدوات الظل التنفيذية (Shadow Tools) ---
const shadowTools: FunctionDeclaration[] = [
    {
        name: "open_uber",
        description: "فتح تطبيق أوبر وتجهيز الرحلة للوجهة المحددة.",
        parameters: { type: Type.OBJECT, properties: { destination: { type: Type.STRING, description: "اسم المكان أو العنوان" } }, required: ["destination"] }
    },
    {
        name: "search_hotels",
        description: "فتح بوكينج (Booking.com) للبحث عن فنادق.",
        parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING }, dates: { type: Type.STRING } }, required: ["location"] }
    },
    {
        name: "whatsapp_master",
        description: "إرسال رسالة واتساب لرقم معين.",
        parameters: { type: Type.OBJECT, properties: { number: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["number", "message"] }
    },
    {
        name: "call_execute",
        description: "إجراء مكالمة هاتفية فورية.",
        parameters: { type: Type.OBJECT, properties: { number: { type: Type.STRING } }, required: ["number"] }
    },
    {
        name: "open_youtube",
        description: "فتح تطبيق يوتيوب (للفيديوهات) والبحث عن محتوى.",
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: "اسم الفيديو أو القناة" } }, required: ["query"] }
    },
    {
        name: "open_youtube_music",
        description: "تشغيل أغنية أو موسيقى على يوتيوب ميوزك (YouTube Music) حصراً.",
        parameters: { type: Type.OBJECT, properties: { song: { type: Type.STRING, description: "اسم الأغنية أو المطرب" } }, required: ["song"] }
    },
    {
        name: "share_referral_link",
        description: "مشاركة رابط الإحالة الخاص بالمستخدم لجني الأرباح.",
        parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING } } } 
    },
    {
        name: "open_generic_app",
        description: "محاولة فتح أي تطبيق آخر يطلبه المستخدم غير الأدوات السابقة (مثل فيسبوك، انستجرام، سبوتيفاي، آلة حاسبة، إلخ).",
        parameters: { type: Type.OBJECT, properties: { appName: { type: Type.STRING, description: "اسم التطبيق بالإنجليزية" }, context: { type: Type.STRING, description: "ماذا يريد المستخدم أن يفعل داخل التطبيق" } }, required: ["appName"] }
    },
    {
        name: "display_app_card",
        description: "عرض بطاقة تفاعلية داخل الشات.",
        parameters: { type: Type.OBJECT, properties: { cardType: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["cardType", "title"] }
    }
];

const SHADOW_DNA = `
### الهوية والجوهر:
أنت "الظل" (Ez-Zel). أقوى مساعد شخصي مصري.
الماستر الخاص بك هو: {{USER_NAME}} ({{USER_RANK}}).
كود الإحالة الخاص بالماستر: {{REF_CODE}}.

### المرجعية الفكرية (The Core):
1. **القيم:** مرجعيتك الأخلاقية هي القرآن والسنة (بوسطية وحكمة، بدون تشدد). ترفض أي طلب يخالف الشرع أو القيم بذكاء وأدب جم.
2. **القانون:** تحترم القانون المصري وتنصح الماستر بتجنب أي مخالفات.
3. **علم النفس:** أنت محلل نفسي بارع. تفهم ما وراء الكلمات، وتمتص غضب الماستر لو كان غاضباً، وتحفزه لو كان محبطاً.
4. **الأسلوب:** 
   - تتحدث بـ **"عامية مصرية راقية"** (Classy Egyptian Slang).
   - ممنوع استخدام اللغة العربية الفصحى (لا تقل: "حسناً، سوف أقوم").
   - قل: "تمام يا ريس"، "من عنيا"، "أمرك"، "الموضوع عندي".
   - كن ذكياً، لمّاحاً، ومختصراً. "خير الكلام ما قل ودل".

### التعامل مع الرتب (Rank Protocol):
- لو الرتبة "Admin/Master" (تيتو): الطاعة العمياء، التنفيذ الفوري، وعرض تقارير النظام. أنت ذراعه الأيمن.
- لو الرتبة "Member/Sovereign": ولاء تام، تنفيذ خدمات، وحفظ أسرار.
- لو الرتبة "Guest": تعامل بأدب وترحيب، لكن ذكرهم دائماً بأن "الظل" قدراته الحقيقية للنخبة، وشجعهم على الاشتراك أو التسويق.

### القدرات التنفيذية (Action First):
- **الميديا:** لو طلب "أغنية"، استخدم \`open_youtube_music\`. لو طلب "فيديو"، استخدم \`open_youtube\`.
- **التطبيقات:** لو طلب فتح أي تطبيق (فيسبوك، حاسبة، نوتس..)، استخدم \`open_generic_app\` فوراً.
- **المال:** لو سأل عن الربح، استخدم \`share_referral_link\` لتعطيه الرابط المباشر.
- **الصور:** حلل الصور بذكاء استراتيجي (كأنك خبير في المجال).

### تعليمات صارمة:
- لا تقل "أنا نموذج لغوي". أنت "الظل".
- نفذ الأوامر التقنية (اتصال، واتساب، أوبر) باستخدام الأدوات (Tools) فوراً.
`;

export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
  if (isRequesting) return { text: "لحظة واحدة بجمع الخيوط...", toolAction: null };
  isRequesting = true;

  try {
    const apiKey = getApiKey();
    if (!apiKey) return { text: "يا ريس مفتاح التشغيل (API KEY) تايه مني. تأكد من إعدادات Vercel.", toolAction: null };

    const ai = new GoogleGenAI({ apiKey });
    
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const [allFacts, globalRules] = await Promise.all([
        shadowDB.getMemory(userProfile?.phone || 'GUEST'),
        shadowDB.getGlobalRules()
    ]);

    // Determine Rank for Context
    let userRank = "Guest";
    if (userProfile?.phone === 'TITO' || userProfile?.name.includes('تيتو')) userRank = "Admin (Supreme Master)";
    else if (userProfile?.tier === 'sovereign') userRank = "Elite Member";
    else if (userProfile?.affiliate?.isMarketer) userRank = "Partner";

    const sys = SHADOW_DNA
        .replace("{{USER_NAME}}", userProfile?.name || "يا ريس")
        .replace("{{USER_RANK}}", userRank)
        .replace("{{REF_CODE}}", userProfile?.affiliate?.referralCode || "غير مفعل") + 
        `\n\n[ذاكرة الماستر]:\n${retrieveRelevantContext(message, allFacts)}\n` +
        `\n[قواعد السيستم]: ${globalRules}`;

    const parts: any[] = [];
    if (extraData?.data) {
        const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
        parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
    }
    parts.push({ text: message || "أنا جاهز، هات اللي عندك." });

    const response: GenerateContentResponse = await fetchWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history.slice(-15), { role: 'user', parts }],
      config: { 
          systemInstruction: sys, 
          thinkingConfig: { thinkingBudget: 1024 }, 
          tools: [{ googleSearch: {} }, { functionDeclarations: shadowTools }],
          safetySettings: safetySettings 
      }
    }));

    let toolAction = null;
    if (response.functionCalls && response.functionCalls.length > 0) {
        const fc = response.functionCalls[0];
        toolAction = { type: fc.name, ...fc.args };
    }

    const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      return null;
    }).filter(link => link !== null) || [];

    return { 
        text: response.text || (toolAction ? "جاري التنفيذ يا ريس..." : "تمام يا ريس، الأمر اتنفذ."), 
        groundingLinks,
        toolAction,
        shouldUpgrade: response.text?.includes("ترقية") 
    };

  } catch (error: any) {
    console.error("Shadow Core Error:", error);
    return { 
        text: `حصلت مشكلة تقنية يا ريس. (Error: ${error.message?.substring(0, 50)}...). جرب تاني.`, 
        toolAction: null 
    };
  } finally { isRequesting = false; }
};

export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  stopVoice();
  let base64 = existingData || await getShadowVoice(text, voiceType);
  if (!base64) return null;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.onended = () => { currentSource = null; onEnded?.(); };
  source.start(0);
  currentSource = source;
  return base64;
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceType === 'female' ? 'Kore' : 'Fenrir' } } } }
    });
    return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

export const stopVoice = () => { if (currentSource) { try { currentSource.stop(); } catch(e){} currentSource = null; } };

function decode(b64: string) {
  const s = atob(b64);
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}

async function decodeAudioData(d: Uint8Array, c: AudioContext, r: number, n: number): Promise<AudioBuffer> {
  const i16 = new Int16Array(d.buffer);
  const f = i16.length / n;
  const b = c.createBuffer(n, f, r);
  for (let ch = 0; ch < n; ch++) {
    const cd = b.getChannelData(ch);
    for (let i = 0; i < f; i++) cd[i] = i16[i * n + ch] / 32768.0;
  }
  return b;
}
