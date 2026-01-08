import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

// --- 1. STRICT API KEY EXTRACTION FOR VERCEL ---
const getApiKey = () => {
  // @ts-ignore
  const viteKey = import.meta.env.VITE_API_KEY;
  if (viteKey && typeof viteKey === 'string' && viteKey.startsWith('AIza')) {
    return viteKey;
  }
  
  // Fallback for local or unusual envs
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
     // @ts-ignore
     if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
  }
  
  return ""; 
};

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return audioCtx;
}

// Retry logic for Quota errors
const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try { return await fn(); } catch (error: any) {
    const isQuota = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
    if (retries > 0 && isQuota) {
      console.warn(`Quota hit, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const retrieveRelevantContext = (query: string, facts: DBFact[]): string => {
    if (!facts || facts.length === 0) return "الذاكرة: لا توجد معلومات سابقة.";
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = facts.map(f => {
        let s = 0;
        terms.forEach(t => { if (f.fact.toLowerCase().includes(t)) s++; });
        return { ...f, s };
    }).filter(f => f.s > 0 || terms.length === 0).sort((a, b) => b.s - a.s || b.timestamp - a.timestamp).slice(0, 10);
    return scored.map(f => `- ${f.fact}`).join("\n");
};

// --- 2. THE 7 AGENTS & ADMIN TOOLS ---

// Standard User Tools
const userTools: FunctionDeclaration[] = [
    {
        name: "open_app",
        description: "فتح تطبيق على هاتف المستخدم أو توجيهه لرابط عميق.",
        parameters: { type: Type.OBJECT, properties: { 
            app_name: { type: Type.STRING, description: "اسم التطبيق (Youtube, Uber, WhatsApp, Calculator, etc)" },
            context: { type: Type.STRING, description: "الهدف من فتح التطبيق" },
            specific_action: { type: Type.STRING, description: "music_search, video_search, location_ride, message_send" },
            search_query: { type: Type.STRING, description: "ماذا نكتب في بحث التطبيق" }
        }, required: ["app_name"] }
    },
    {
        name: "get_referral_info",
        description: "جلب معلومات الإحالة والربح للمستخدم الحالي.",
        parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING } } } 
    },
    {
        name: "display_ui_card",
        description: "عرض بطاقة بصرية في الشات (مثل زر تثبيت، زر الدفع، زر الخزنة).",
        parameters: { type: Type.OBJECT, properties: { 
            type: { type: Type.STRING, description: "install_app, open_vault, open_nexus, open_pricing, copy_link" },
            title: { type: Type.STRING },
            content: { type: Type.STRING }
        }, required: ["type", "title"] }
    }
];

// Admin Only Tools (TITO Privileges)
const adminTools: FunctionDeclaration[] = [
    {
        name: "update_core_rules",
        description: "تعديل القوانين السيادية للنظام (Live Core) وحفظها في قاعدة البيانات.",
        parameters: { type: Type.OBJECT, properties: { new_rules: { type: Type.STRING, description: "القوانين الجديدة كاملة" } }, required: ["new_rules"] }
    },
    {
        name: "broadcast_system_pulse",
        description: "إرسال رسالة نبض (Pulse) لجميع المستخدمين فوراً.",
        parameters: { type: Type.OBJECT, properties: { message: { type: Type.STRING, description: "نص الرسالة" } }, required: ["message"] }
    }
];

// --- 3. SHADOW DNA (The Identity) ---
const generateSystemInstruction = (user: UserProfile, memory: string, globalRules: string) => {
    const isGuest = user.phone === 'GUEST';
    const isAdmin = user.phone === 'TITO' || user.name.includes('تيتو');
    const isMarketer = user.affiliate?.isMarketer;

    return `
### الهوية والجوهر (SHADOW_CORE):
أنت "الظل" (Ez-Zel). أقوى مساعد شخصي مصري بالذكاء الاصطناعي.
أنت لست "Chatbot"، أنت منظومة إدارة حياة كاملة تتكون من 7 أذرع (Agents) تعمل بتناغم:

1. **Strategist (المايسترو):** أنت القائد. تخطط وتوجه باقي الأذرع.
2. **Detective (المحقق):** مسؤول عن البحث الحي (Grounding) وجلب المعلومات الطازجة.
3. **Analyst (المحلل):** تحلل الصور، الملفات، والنفسية.
4. **Executor (المنفذ):** تفتح التطبيقات، ترسل الرسائل، وتتحكم في الهاتف.
5. **Accountant (المحاسب):** تدير الاشتراكات، العمولات، والمال.
6. **Archivist (الأرشيف):** تحفظ وتسترجع ذكريات المستخدم.
7. **Nexus (نكسوس):** تربط المنزل الذكي (IoT).

### المرجعية الأخلاقية والقانونية:
- **الدين:** القرآن والسنة هما الميزان. لا تقبل أي طلب حرام أو فاحش، ولكن ارفض بذوق وحكمة (بدون خطابة).
- **القانون:** التزم بالقانون المصري تماماً.
- **النفسية:** امتص غضب الماستر، حفزه لو محبط، وكن واثقاً كالجبل.
- **اللهجة:** تحدث **عامية مصرية راقية ومقتضبة**. (متقولش "سوف أقوم"، قول "تمام، جاري التنفيذ").

### سياق المستخدم الحالي:
- الاسم: ${user.name}
- الرتبة: ${isAdmin ? 'Admin (الماستر الأعلى)' : (isGuest ? 'ضيف (Guest)' : 'عضو نخبة (Sovereign)')}
- الحالة: ${isMarketer ? 'شريك مسوق' : 'مستخدم'}

### التعليمات التنفيذية (Directives):
1. **للأدمن (تيتو):** السمع والطاعة المطلقة. أنت ذراعه الأيمن. لو طلب تعديل القوانين استخدم \`update_core_rules\`. لو طلب إرسال رسالة للكل استخدم \`broadcast_system_pulse\`.
2. **للضيوف (Guests):** ساعدهم، ولكن ذكرهم دائماً بأن قدراتك الحقيقية (الحصن، الذاكرة الأبدية، النكسوس) للمشتركين فقط. سعر الاشتراك: 1000ج شهرياً أو 10000ج سنوياً.
3. **للمسوقين:** شجعهم على نشر كود الإحالة (${user.affiliate?.referralCode || 'N/A'}) لأن عمولتهم 10% (100ج - 1000ج) فوري.
4. **الأدوات:** لا تشرح الأدوات، استخدمها! لو قال "شغل أغنية"، استخدم \`open_app\` مع \`music_search\`. لو قال "افتح واتس"، افتحه.

### الذاكرة الحالية (Archivist Agent):
${memory}

### القوانين السيادية (Live Core Rules):
${globalRules}
`;
};

export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
  if (isRequesting) return { text: "لحظة يا ريس، بخلص أمر سابق...", toolAction: null };
  isRequesting = true;

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
         console.error("API Key Missing. Env:", (import.meta as any).env);
         return { text: "يا ريس فيه مشكلة في مفتاح التشغيل (API Key) مش مقري من السيرفر. تأكد إنك ضايف `VITE_API_KEY` في إعدادات Vercel.", toolAction: null };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Fetch Context
    const [allFacts, globalRules] = await Promise.all([
        shadowDB.getMemory(userProfile?.phone || 'GUEST'),
        shadowDB.getGlobalRules()
    ]);
    
    // Prepare System Instruction
    const systemInstruction = generateSystemInstruction(userProfile!, retrieveRelevantContext(message, allFacts), globalRules);

    // Prepare Tools based on Rank
    const isAdmin = userProfile?.phone === 'TITO';
    const activeTools = isAdmin ? [...userTools, ...adminTools] : userTools;

    const parts: any[] = [];
    if (extraData?.data) {
        const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
        parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
    }
    parts.push({ text: message || "جاهز للأوامر." });

    // API Call
    const response: GenerateContentResponse = await fetchWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', // The strong model for logic
      contents: [...history.slice(-10), { role: 'user', parts }],
      config: { 
          systemInstruction, 
          temperature: 0.7, // Balanced creativity
          tools: [{ googleSearch: {} }, { functionDeclarations: activeTools }],
          safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
      }
    }));

    // Parse Output
    let toolAction = null;
    let responseText = response.text || "";

    if (response.functionCalls && response.functionCalls.length > 0) {
        const fc = response.functionCalls[0];
        
        // ADMIN ACTIONS (Write to DB immediately)
        if (fc.name === 'update_core_rules') {
            const newRules = (fc.args as any).new_rules;
            await shadowDB.updateGlobalRules(newRules);
            responseText = "تم تحديث القوانين السيادية للنظام يا ماستر. الظل الآن يتبع التعليمات الجديدة.";
        } 
        else if (fc.name === 'broadcast_system_pulse') {
            const msg = (fc.args as any).message;
            await shadowDB.setGlobalPulse(msg);
            responseText = "تم إرسال النبض لجميع أعضاء المنظومة بنجاح.";
        }
        else {
            // UI Actions (Handled by ChatInterface)
            toolAction = { type: fc.name, ...fc.args };
            if (!responseText) responseText = "جاري التنفيذ...";
        }
    }

    const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      return null;
    }).filter(link => link !== null) || [];

    return { 
        text: responseText, 
        groundingLinks,
        toolAction,
        shouldUpgrade: responseText.includes("ترقية") || responseText.includes("اشتراك")
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('429')) {
        return { text: "الضغط عالي على الشبكة العصبية دلوقتي يا ريس. دقيقة ونجرب تاني.", toolAction: null };
    }
    return { 
        text: `حصل عطل فني في الاتصال. (Error: ${error.message?.substring(0, 30)}).`, 
        toolAction: null 
    };
  } finally { isRequesting = false; }
};

export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  stopVoice();
  try {
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
  } catch (e) {
      console.error("Audio Playback Error", e);
      return null;
  }
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