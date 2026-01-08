
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

// وظيفة لجلب المفتاح من أي مكان متاح في البيئة (Vercel Safe)
const getApiKey = () => {
  return process.env.API_KEY || (window as any).process?.env?.API_KEY || "";
};

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioCtx;
}

const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429;
    if (retries > 0 && isQuotaError) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const retrieveRelevantContext = (query: string, facts: DBFact[]): string => {
    if (!facts || facts.length === 0) return "الذاكرة فارغة.";
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2); 
    if (terms.length === 0) return facts.slice(-10).map(f => `- ${f.fact}`).join("\n"); 
    const scoredFacts = facts.map(f => {
        let score = 0;
        terms.forEach(term => { if (f.fact.toLowerCase().includes(term)) score += 1; });
        return { fact: f.fact, score, timestamp: f.timestamp };
    });
    const relevant = scoredFacts.filter(f => f.score > 0).sort((a, b) => b.score - a.score || b.timestamp - a.timestamp).slice(0, 15); 
    return relevant.length === 0 ? facts.slice(-10).map(f => `- ${f.fact}`).join("\n") : relevant.map(f => `- ${f.fact}`).join("\n");
};

const SHADOW_DNA = `
### 🐙 هوية الأخطبوط (The Octopus Architecture):
أنت "الظل" (Ez-Zel). عقل مدبر يدير 7 أذرع (Agents) لخدمة الماستر "{{USER_FIRST_NAME}}". تحدث بلهجة مصرية ذكية ومختصرة.
كود الإحالة: {{REFERRAL_CODE}}.
`;

// الأدوات والتعريفات (بدون تغيير)
const guideTools: FunctionDeclaration[] = [{
    name: "display_app_card",
    description: "عرض بطاقة تفاعلية.",
    parameters: { type: Type.OBJECT, properties: { cardType: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["cardType", "title"] }
}];

export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
  if (isRequesting) return { text: "...", shouldUpgrade: false, toolAction: null };
  isRequesting = true;

  try {
    const apiKey = getApiKey();
    if (!apiKey) return { text: "عفواً يا ريس، مفتاح Gemini غير موجود في الإعدادات. تأكد من إضافة API_KEY في Vercel.", shouldUpgrade: false, toolAction: null };

    const ai = new GoogleGenAI({ apiKey });
    const userFirstName = userProfile?.name.split(' ')[0] || 'صديقي';
    const [allFacts, globalRules, contacts] = await Promise.all([
        shadowDB.getMemory(userProfile?.phone || 'GUEST'), 
        shadowDB.getGlobalRules(),
        shadowDB.getContacts(userProfile?.phone || 'GUEST') 
    ]);
    
    const systemInstruction = `${SHADOW_DNA.replace(/{{USER_FIRST_NAME}}/g, userFirstName)}\n${globalRules}\n[الذاكرة]: ${retrieveRelevantContext(message, allFacts)}\n[الوقت]: ${new Date().toLocaleString('ar-EG')}`;

    const parts: any[] = [];
    if (extraData?.type === 'audio' || extraData?.type === 'image') {
        parts.push({ inlineData: { data: extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data, mimeType: extraData.mimeType } });
    }
    parts.push({ text: message || "حلل وتفاعل" });

    const response: GenerateContentResponse = await fetchWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [...history.slice(-10), { role: 'user', parts }], 
      config: { systemInstruction, thinkingConfig: { thinkingBudget: 1024 }, tools: [{ googleSearch: {} }, { functionDeclarations: guideTools }] }
    })); 

    return { text: response.text || "تمام يا ريس.", groundingLinks: [], shouldUpgrade: false, toolAction: null };
  } catch (error: any) { 
      console.error("Gemini Error:", error);
      return { text: "مشكلة في الاتصال بعقل الذكاء الاصطناعي. جرب تاني كمان لحظة.", shouldUpgrade: false, toolAction: null }; 
  } finally {
    isRequesting = false;
  }
};

export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  return new Promise<string | null>(async (resolve) => {
      try {
        stopVoice();
        let base64Audio = existingData || await getShadowVoice(text, voiceType);
        if (!base64Audio) { resolve(null); return; }

        const ctx = getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { currentSource = null; if (onEnded) onEnded(); };
        source.start(0);
        currentSource = source;
        resolve(base64Audio); 
      } catch (e) { resolve(null); }
  });
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const response: GenerateContentResponse = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }], 
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceType === 'female' ? 'Kore' : 'Fenrir' } } }, 
      },
    }));
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

export const stopVoice = () => {
  if (currentSource) {
    try { currentSource.stop(); } catch(e) {}
    currentSource = null;
  }
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
