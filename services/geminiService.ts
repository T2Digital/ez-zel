
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioCtx;
}

// --- RAG LITE ENGINE ---
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
    if (relevant.length === 0) return facts.slice(-10).map(f => `- ${f.fact}`).join("\n"); 
    return relevant.map(f => `- ${f.fact} (بتاريخ: ${new Date(f.timestamp).toLocaleDateString()})`).join("\n");
};

// --- THE OCTOPUS ARCHITECTURE ---
const SHADOW_DNA = `
أنت "الظل" (Ez-Zel). عقل مدبر يدير 7 أذرع (Agents) لخدمة الماستر "{{USER_FIRST_NAME}}".
تحدث بلهجة مصرية ذكية، داهية، ومختصرة.
أنت لست مجرد ذكاء اصطناعي، أنت "ظله" الرقمي.
`;

const tools: FunctionDeclaration[] = [
  {
    name: "manage_memory",
    description: "حفظ معلومة في الذاكرة الأبدية.",
    parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] }
  }
];

// --- MAIN ORCHESTRATOR ---
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
    // Correct initialization using process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userId = userProfile?.phone || 'GUEST';
    const userFirstName = userProfile?.name.split(' ')[0] || 'صديقي';

    const [allFacts, globalRules] = await Promise.all([
        shadowDB.getMemory(userId),
        shadowDB.getGlobalRules()
    ]);
    
    const relevantMemory = retrieveRelevantContext(message, allFacts);

    const systemInstruction = `
      ${SHADOW_DNA.replace('{{USER_FIRST_NAME}}', userFirstName)}
      ${globalRules ? `\n### ⚖️ قوانين النواة:\n${globalRules}` : ''}
      ### 👤 السياق الحالي:
      [الذاكرة الحية]: ${relevantMemory}
      [الوقت]: ${new Date().toLocaleString('ar-EG')}
    `;

    const parts: any[] = [];
    if (extraData?.type === 'audio') {
        parts.push({ inlineData: { data: extraData.data, mimeType: extraData.mimeType } });
        parts.push({ text: message || "🎤 [تحليل صوتي]" });
    } else if (extraData?.type === 'image') {
        parts.push({ inlineData: { data: extraData.data, mimeType: extraData.mimeType } });
        parts.push({ text: message || "📸 [تحليل بصري]" });
    } else {
        parts.push({ text: message });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [...history.slice(-10), { role: 'user', parts }], 
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }, { functionDeclarations: tools }],
      }
    }); 

    let finalText = response.text || "تمام يا ريس.";
    let toolAction: any = null;

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        if (fc.name === 'manage_memory') { 
            await shadowDB.saveFact({ userId, fact: fc.args.fact as string, timestamp: Date.now() }); 
            finalText = `تم الحفظ في الذاكرة يا ماستر: "${fc.args.fact}"`; 
        }
      }
    }

    return { 
        text: finalText, 
        groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [], 
        shouldUpgrade: false, 
        toolAction 
    };
  } catch (error: any) { 
      if (error.name === 'AbortError') throw error; 
      console.error("Gemini API Error:", error);
      return { text: "عفواً يا ريس، فيه تداخل في الإشارة. جرب تاني.", shouldUpgrade: false, toolAction: null }; 
  } finally {
    isRequesting = false;
  }
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }], 
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceType === 'female' ? 'Kore' : 'Fenrir' } } }, 
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  try {
    stopVoice();
    let base64Audio = existingData;
    if (!base64Audio) base64Audio = await getShadowVoice(text, voiceType);
    if (!base64Audio) return;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => { currentSource = null; if (onEnded) onEnded(); };
    source.start(0);
    currentSource = source;
  } catch (e) { console.error(e); }
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
