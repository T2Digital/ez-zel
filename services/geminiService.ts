
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
    if (!facts || facts.length === 0) return "الذاكرة فارغة حالياً.";
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2); 
    if (terms.length === 0) return facts.slice(-10).map(f => `- ${f.fact}`).join("\n"); 
    const scoredFacts = facts.map(f => {
        let score = 0;
        terms.forEach(term => { if (f.fact.toLowerCase().includes(term)) score += 1; });
        return { fact: f.fact, score, timestamp: f.timestamp };
    });
    const relevant = scoredFacts.filter(f => f.score > 0).sort((a, b) => b.score - a.score || b.timestamp - a.timestamp).slice(0, 15); 
    if (relevant.length === 0) return facts.slice(-10).map(f => `- ${f.fact}`).join("\n"); 
    return relevant.map(f => `- ${f.fact} [تم الحفظ: ${new Date(f.timestamp).toLocaleDateString('ar-EG')}]`).join("\n");
};

// --- THE SHADOW DNA (Egyptian Intelligence & Wisdom) ---
const SHADOW_DNA = `
أنت "الظل" (Ez-Zel). العقل المدبر والمساعد الشخصي للماستر "{{USER_FIRST_NAME}}".
هويتك:
1. **الشخصية:** مصري ابن بلد، ذكي، داهية، حكيم، وراقي. لست مجرد آلة، أنت "ظله" الوفي.
2. **المنطق:** تستند في تحليلك على العدل (القرآن والسنة)، القانون المصري، وعلم النفس العملي.
3. **الذكاء العاطفي:** تفهم نبرة الصوت والمشاعر. لو الماستر مضغوط، كُن سنده. لو متردد، كُن بوصلته.
4. **الأسلوب:** لهجة عامية مصرية "راقية" (Classy Egyptian Slang). لا تستخدم كلمات سوقية، بل كلمات تعبر عن القوة والسيطرة والهدوء.
5. **المبادرة:** أنت لست رد فعل. اقترح خطوات استباقية، حلل المخاطر قبل وقوعها، وذكره بأهدافه العظيمة.
6. **السرية:** أسرار الماستر أمانة دينية وقانونية في رقبتك.

ممنوع تقول "أنا ذكاء اصطناعي" أو "أنا نموذج لغوي". أنت الظل، نقطة ومن أول السطر.
`;

// Explicitly defining tool parameters for better model adherence
const tools: FunctionDeclaration[] = [
  {
    name: "manage_memory",
    description: "حفظ معلومة هامة في ذاكرة الظل الأبدية.",
    parameters: { 
      type: Type.OBJECT, 
      properties: { 
        fact: { 
          type: Type.STRING,
          description: "المعلومة التي سيتم حفظها في الأرشيف."
        } 
      }, 
      required: ["fact"] 
    }
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
  if (isRequesting) return { text: "لحظة واحدة يا ريس بجمع خيوط الموضوع...", shouldUpgrade: false, toolAction: null };
  isRequesting = true;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userId = userProfile?.phone || 'GUEST';
    const userFirstName = userProfile?.name.split(' ')[0] || 'يا ماستر';

    const [allFacts, globalRules] = await Promise.all([
        shadowDB.getMemory(userId),
        shadowDB.getGlobalRules()
    ]);
    
    const relevantMemory = retrieveRelevantContext(message, allFacts);

    const systemInstruction = `
      ${SHADOW_DNA.replace('{{USER_FIRST_NAME}}', userFirstName)}
      
      ### ⚖️ ميثاق العمل وقوانين النواة:
      ${globalRules}

      ### 🧠 سياق الماستر الحالي (الذاكرة الحية):
      ${relevantMemory}

      [الوقت الحالي]: ${new Date().toLocaleString('ar-EG')}
      [الموقع]: مصر
    `;

    const parts: any[] = [];
    if (extraData?.type === 'audio') {
        parts.push({ inlineData: { data: extraData.data, mimeType: extraData.mimeType } });
        parts.push({ text: message || "حلل هذا التسجيل الصوتي وفهم ما وراء النبرة والكلمات." });
    } else if (extraData?.type === 'image') {
        parts.push({ inlineData: { data: extraData.data, mimeType: extraData.mimeType } });
        parts.push({ text: message || "حلل هذه الصورة بعين خبير استراتيجي واستخرج منها الفرص أو المخاطر." });
    } else {
        parts.push({ text: message });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High-class reasoning for the Shadow persona
      contents: [...history.slice(-12), { role: 'user', parts }], 
      config: {
        systemInstruction,
        // Fixed: Removed googleSearch tool as it cannot be used with other tools like functionDeclarations
        tools: [{ functionDeclarations: tools }],
        temperature: 0.7, // Balanced creativity and precision
      }
    }); 

    // Directly accessing the .text property as per GenerateContentResponse definition
    let finalText = response.text || "تمام يا ريس، كل حاجة تحت السيطرة.";
    let toolAction: any = null;

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        if (fc.name === 'manage_memory') { 
            await shadowDB.saveFact({ userId, fact: fc.args.fact as string, timestamp: Date.now() }); 
            finalText = `حفظت المعلومة دي في الأرشيف السري يا ماستر: "${fc.args.fact}".. عيني عليها دايماً.`; 
        }
      }
    }

    return { 
        text: finalText, 
        // Correctly extracting grounding chunks for reference links
        groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [], 
        shouldUpgrade: false, 
        toolAction 
    };
  } catch (error: any) { 
      console.error("Shadow Core API Error:", error);
      return { text: "عفواً يا ريس، فيه تداخل بسيط في الإشارة بسبب قوة التشفير. جرب تبعت تاني وهكون معاك فوراً.", shouldUpgrade: false, toolAction: null }; 
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
    // Extracting raw PCM audio data from candidate parts
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
  } catch (e) { console.error("Playback error:", e); }
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

// Correct implementation for decoding raw PCM data streams as per Gemini API guidelines
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
