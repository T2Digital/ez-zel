
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

// FIX: Disabled useSearch to prevent "Tool use with function calling is unsupported" error (400).
// Gemini API does not currently support mixing `googleSearch` with custom `functionDeclarations`.
// We prioritize Function Calling (App Control, Memory, IoT) over Search for the "Shadow" persona.
const MODEL_CONFIGS = [
    { name: "gemini-3-flash-preview", useSearch: false }, 
    { name: "gemini-flash-latest", useSearch: false }
];

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return audioCtx;
}

const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try { return await fn(); } catch (error: any) {
    const isQuota = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('503');
    if (retries > 0 && isQuota) {
      const jitter = Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const retrieveRelevantContext = (query: string, facts: DBFact[], user: UserProfile): string => {
    let context = `User: ${user.name} (${user.phone}). Rank: ${getUserRank(user)}.\n`;
    if (user.affiliate?.isMarketer) {
        context += `Affiliate: Code=${user.affiliate.referralCode}, Earnings=${user.affiliate.totalEarnings}.\n`;
    }
    if (!facts || facts.length === 0) return context;

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = facts.map(f => {
        let s = 0;
        terms.forEach(t => { if (f.fact.toLowerCase().includes(t)) s++; });
        return { ...f, s };
    }).filter(f => f.s > 0 || terms.length === 0).sort((a, b) => b.s - a.s).slice(0, 3);
    
    return context + "Memory:\n" + scored.map(f => `- ${f.fact}`).join("\n");
};

const getUserRank = (user: UserProfile) => {
    if (user.phone === 'TITO' || user.phone === '01000000000') return 'Supreme Admin';
    if (user.tier === 'sovereign') return 'Elite';
    if (user.affiliate?.isMarketer) return 'Partner';
    return 'Guest';
};

const baseTools: FunctionDeclaration[] = [
    {
        name: "executor_app_control",
        description: "Control phone apps and actions.",
        parameters: { type: Type.OBJECT, properties: { 
            app: { type: Type.STRING },
            action: { type: Type.STRING },
            payload: { type: Type.STRING }
        }, required: ["app", "action"] }
    },
    {
        name: "nexus_iot_control",
        description: "Control smart home devices via webhook.",
        parameters: { type: Type.OBJECT, properties: { 
            device_name: { type: Type.STRING },
            command: { type: Type.STRING }
        }, required: ["device_name"] }
    },
    {
        name: "accountant_check",
        description: "Check financial earnings.",
        parameters: { type: Type.OBJECT, properties: { target: { type: Type.STRING } } } 
    },
    {
        name: "archivist_save",
        description: "Save important info to memory.",
        parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] }
    }
];

const adminTools: FunctionDeclaration[] = [
    {
        name: "admin_broadcast_pulse",
        description: "Send system notification.",
        parameters: { type: Type.OBJECT, properties: { message: { type: Type.STRING } }, required: ["message"] }
    },
    {
        name: "admin_override_rules",
        description: "Update system rules.",
        parameters: { type: Type.OBJECT, properties: { new_rules: { type: Type.STRING } }, required: ["new_rules"] }
    }
];

const generateMaestroSystemInstruction = (user: UserProfile, memoryContext: string, globalRules: string) => {
    return `
**Role:** "الظل" (The Shadow), Elite Egyptian AI.
**Tone:** Intelligent, Street-Smart (جدع), Brief. Egyptian Slang.
**User:** ${user.name} (${getUserRank(user)}).
**Context:** ${memoryContext}

**Rules:**
1. Be extremely concise. Save tokens.
2. Egyptian Arabic (عامية).
3. Obey Admin (TITO).
4. Save secrets with 'archivist_save'.
5. Global: ${globalRules}
`;
};

export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
  if (isRequesting) return { text: "لحظة يا ريس، بخلص العملية اللي فاتت...", toolAction: null, isError: true };
  isRequesting = true;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let userMemory: DBFact[] = [];
    let globalRules = "";
    try {
        [userMemory, globalRules] = await Promise.all([
            shadowDB.getMemory(userProfile?.phone || 'GUEST'),
            shadowDB.getGlobalRules()
        ]);
    } catch (e) { console.warn("DB Context Load Failed", e); }
    
    const systemInstruction = generateMaestroSystemInstruction(userProfile!, retrieveRelevantContext(message, userMemory, userProfile!), globalRules);
    const activeTools = (userProfile?.phone === 'TITO') ? [...baseTools, ...adminTools] : baseTools;

    const parts: any[] = [];
    if (extraData?.data) {
        const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
        parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
    }
    parts.push({ text: message || "." });

    const optimizedHistory = history.slice(-2); 

    let response: GenerateContentResponse | null = null;

    for (const config of MODEL_CONFIGS) {
        try {
            const requestTools: any[] = [];
            
            // STRICT RULE: `googleSearch` cannot be used with other tools.
            // Since `activeTools` (Function Declarations) are critical for "The Shadow" (App Control, Memory),
            // we prioritize them. We only add Google Search if NO function tools are present.
            if (activeTools && activeTools.length > 0) {
                 requestTools.push({ functionDeclarations: activeTools });
            } else if (config.useSearch) {
                 requestTools.push({ googleSearch: {} });
            }

            response = await fetchWithRetry(() => ai.models.generateContent({
                model: config.name,
                contents: [...optimizedHistory, { role: 'user', parts }], 
                config: { 
                    systemInstruction, 
                    temperature: 0.7, 
                    tools: requestTools,
                }
            }));
            
            break; 
        } catch (error: any) {
            console.warn(`[Shadow Core] Model ${config.name} failed. Switching...`);
            if (config.name === MODEL_CONFIGS[MODEL_CONFIGS.length - 1].name) throw error;
            continue; 
        }
    }

    if (!response) {
        throw new Error("All Shadow models are currently unreachable.");
    }

    let toolAction = null;
    let responseText = response.text || "";

    if (response.functionCalls && response.functionCalls.length > 0) {
        const fc = response.functionCalls[0];
        const args = fc.args as any;

        if (fc.name === 'executor_app_control') {
            if (args.app === 'youtube_music') {
                toolAction = { type: 'open_app', app_name: 'YouTube Music', specific_action: 'music_search', search_query: args.payload };
            } else if (args.app === 'whatsapp') {
                toolAction = { type: 'open_app', app_name: 'WhatsApp', specific_action: 'message_send', search_query: args.payload };
            } else {
                toolAction = { type: 'open_app', app_name: args.app, specific_action: args.action, search_query: args.payload };
            }
            if (!responseText) responseText = "تمام، جاري التنفيذ...";
        } 
        else if (fc.name === 'nexus_iot_control') {
            const actions = userProfile?.iotActions || {};
            const url = actions[args.device_name];
            if (url) {
                try { await fetch(url, { method: 'POST' }); responseText = `تم يا ريس. ${args.device_name} اتنفذ الأمر.`; } 
                catch(e) { responseText = `فيه مشكلة في الاتصال بالجهاز.`; }
            } else {
                responseText = `الجهاز ده مش متسجل في نكسوس.`;
            }
        }
        else if (fc.name === 'archivist_save') {
            await shadowDB.saveFact({ userId: userProfile?.phone || 'GUEST', fact: args.fact, timestamp: Date.now() });
            responseText = responseText || "تم الحفظ في الذاكرة.";
        }
        else if (fc.name === 'admin_broadcast_pulse') {
            await shadowDB.setGlobalPulse(args.message);
            responseText = "تم تعميم النبض.";
        }
        else if (fc.name === 'admin_override_rules') {
            await shadowDB.updateGlobalRules(args.new_rules);
            responseText = "تم تحديث القوانين.";
        }
        else if (fc.name === 'accountant_check') {
             if (args.target === 'my_earnings') {
                 responseText = `رصيدك: ${userProfile?.affiliate?.totalEarnings || 0} جنيه.`;
                 toolAction = { type: 'display_ui_card', type_card: 'open_affiliate', title: 'محفظة الأرباح', content: 'تابع أرباحك' };
             }
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
        shouldUpgrade: responseText.includes("ترقية") || responseText.includes("عضوية"),
        isError: false 
    };

  } catch (error: any) {
    console.error("Shadow Core Error:", error);
    
    if (error.message?.includes('API_KEY')) {
        return { text: "المفتاح (API Key) غير صالح أو مفقود. يرجى التحقق من المصدر.", toolAction: null, isError: true };
    }
    if (error.message?.includes('429')) {
        return { text: "الشبكة مشغولة حالياً (Quota Exceeded). دقيقة ونجرب تاني.", toolAction: null, isError: true };
    }
    
    return { 
        text: `حدث خطأ تقني مؤقت.`, 
        toolAction: null,
        isError: true 
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
  } catch (e) { return null; }
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
