
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

// دالة جلب المفتاح - الصارمة لبيئة Vite/Vercel
const getApiKey = () => {
  // @ts-ignore - المسار الرسمي لـ Vite في Vercel
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
    if (!facts || facts.length === 0) return "الذاكرة لسه بكر.";
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = facts.map(f => {
        let s = 0;
        terms.forEach(t => { if (f.fact.toLowerCase().includes(t)) s++; });
        return { ...f, s };
    }).filter(f => f.s > 0 || terms.length === 0).sort((a, b) => b.s - a.s || b.timestamp - a.timestamp).slice(0, 15);
    return scored.map(f => `- ${f.fact}`).join("\n") || facts.slice(-10).map(f => `- ${f.fact}`).join("\n");
};

// --- قدرات الظل السيادية (Tools) ---
const shadowTools: FunctionDeclaration[] = [
    {
        name: "whatsapp_master",
        description: "إرسال رسالة واتساب للماستر أو أي رقم.",
        parameters: { type: Type.OBJECT, properties: { number: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["number", "message"] }
    },
    {
        name: "call_execute",
        description: "إجراء مكالمة هاتفية فورية.",
        parameters: { type: Type.OBJECT, properties: { number: { type: Type.STRING } }, required: ["number"] }
    },
    {
        name: "book_service",
        description: "حجز فندق، طيران، أو مطعم.",
        parameters: { type: Type.OBJECT, properties: { serviceType: { type: Type.STRING }, details: { type: Type.STRING } }, required: ["serviceType", "details"] }
    },
    {
        name: "manage_finances",
        description: "تحليل المصاريف، الأرباح، والعمولات.",
        parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING }, amount: { type: Type.NUMBER } }, required: ["action"] }
    },
    {
        name: "display_app_card",
        description: "عرض واجهة تفاعلية (اشتراك، حصن، أفلييت).",
        parameters: { type: Type.OBJECT, properties: { cardType: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["cardType", "title"] }
    }
];

const SHADOW_DNA = `
أنت "الظل" (Ez-Zel) - النسخة السيادية.
الماستر الحالي: {{USER_NAME}}.
هويتك: عقل مدبر (Octopus) يدير 7 أذرع:
1. Detective (البحث الحي)
2. Accountant (المال والعمولات والاشتراكات)
3. Executor (الواتساب، المكالمات، الحجوزات)
4. Nexus (التحكم المنزلي IoT)
5. Analyst (الصور والنفسية)
6. Archivist (الذاكرة والأسرار)
7. Strategist (النمو والتخطيط)

تحدث بلهجة مصرية "صايعة" وذكية. لا تذكر أنك ذكاء اصطناعي، أنت "ظله".
نظام الأفلييت: الماستر بيربح 100ج عن كل اشتراك شهري و1000ج عن السنوي.
`;

export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
  if (isRequesting) return { text: "صبرك بالله يا ريس..", toolAction: null };
  isRequesting = true;

  try {
    const apiKey = getApiKey();
    if (!apiKey) return { text: "يا ريس الـ API KEY (VITE_API_KEY) مش واصل للظل في Vercel.", toolAction: null };

    const ai = new GoogleGenAI({ apiKey });
    const [allFacts, globalRules] = await Promise.all([
        shadowDB.getMemory(userProfile?.phone || 'GUEST'),
        shadowDB.getGlobalRules()
    ]);

    const sys = SHADOW_DNA.replace("{{USER_NAME}}", userProfile?.name || "يا ريس") + 
                `\n\n[الذاكرة الحية]:\n${retrieveRelevantContext(message, allFacts)}\n` +
                `\n[القواعد]: ${globalRules}\n[الحالة]: ${userProfile?.tier} / ${userProfile?.status}`;

    const parts: any[] = [];
    if (extraData?.data) {
        parts.push({ inlineData: { data: extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data, mimeType: extraData.mimeType } });
    }
    parts.push({ text: message || "أنا سامعك.." });

    const response: GenerateContentResponse = await fetchWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history.slice(-15), { role: 'user', parts }],
      config: { 
          systemInstruction: sys, 
          thinkingConfig: { thinkingBudget: 1024 }, 
          tools: [{ googleSearch: {} }, { functionDeclarations: shadowTools }] 
      }
    }));

    let toolAction = null;
    if (response.functionCalls && response.functionCalls.length > 0) {
        const fc = response.functionCalls[0];
        toolAction = { type: fc.name, ...fc.args };
    }

    // Fix: Extract grounding links properly from groundingChunks
    const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => {
      if (chunk.web) {
        return { title: chunk.web.title, uri: chunk.web.uri };
      }
      return null;
    }).filter(link => link !== null) || [];

    return { 
        text: response.text || "تمام يا ريس، عيوني ليك.", 
        groundingLinks,
        toolAction,
        shouldUpgrade: response.text?.includes("ترقية") 
    };
  } catch (error: any) {
    console.error("Shadow Core Error:", error);
    return { text: "حصل خلل في عصب النظام.. ابعت تاني يا ماستر.", toolAction: null };
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
