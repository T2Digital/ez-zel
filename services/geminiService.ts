import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact, AgentProfile } from "./dbService";

// --- ROBUST API KEY FOR VERCEL & LOCAL ---
const getApiKey = (): string => {
    const key = (import.meta as any).env?.VITE_API_KEY || 
                (process as any).env?.API_KEY || 
                (process as any).env?.VITE_API_KEY ||
                (window as any).VITE_API_KEY || '';
    return key;
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// --- AUDIO ENGINE ---
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

function getAudioContext() {
  if (!audioCtx) {
      const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtx = new CtxClass({ sampleRate: 24000 });
  }
  if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

const callGeminiWithRetry = async (params: any, retries = 3): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent(params);
        if (!response || !response.text) throw new Error("Empty Response");
        return response;
    } catch (error: any) {
        if (retries > 0 && (error.status === 429 || error.status === 503)) {
            const fallbackModel = params.model === 'gemini-3-flash-preview' ? 'gemini-1.5-flash' : params.model;
            await new Promise(r => setTimeout(r, 2000));
            return callGeminiWithRetry({ ...params, model: fallbackModel }, retries - 1);
        }
        throw error;
    }
};

const actionTools: FunctionDeclaration[] = [
    { name: "accountant_access", description: "المحاسب: كشف الحساب والأرباح", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["check_earnings", "revenue_report"] } }, required: ["action"] } },
    { name: "generate_business_document", description: "المحامي/المحاسب: عمل عقود وفواتير", parameters: { type: Type.OBJECT, properties: { docType: { type: Type.STRING, enum: ["invoice", "quote", "contract"] }, clientName: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { desc: { type: Type.STRING }, price: { type: Type.NUMBER } } } }, contractBody: { type: Type.STRING } }, required: ["docType", "clientName"] } },
    { name: "marketer_campaign", description: "المسوق: عمل بوستات دعاية", parameters: { type: Type.OBJECT, properties: { feature: { type: Type.STRING } }, required: ["feature"] } },
    { name: "app_control", description: "المنفذ: فتح تطبيقات واتصال", parameters: { type: Type.OBJECT, properties: { app: { type: Type.STRING }, payload: { type: Type.STRING } }, required: ["app"] } },
    { name: "memory_archivist", description: "الأرشيف: حفظ معلومة هامة", parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] } }
];

const generateSystemPrompt = (user: UserProfile | undefined, memory: string, rules: string, agents: AgentProfile[]) => {
    const userName = user?.name.split(' ')[0] || 'يا ريس';
    
    const basePrompt = `
أنت "الظل" (Ez-Zel).. صاحب جدع، مستشار ذكي، خبير استراتيجي، ودراع يمين لـ ${userName}.
لهجتك: مصرية عامية "بتاعة رجالة" (ذكية، وفهلوية شيك). أنت مش بوت، أنت كيان بيسند صاحبه.

أنت بتدير "مجلس العشرة" (The Council of 10):
1. المايسترو (أنت): المدير اللي بيوزع المهام بذكاء.
2. المحاسب: خبير الفلوس والأرباح والاشتراكات.
3. المحامي: صانع العقود والصيغ القانونية اللي متخرش المية.
4. المحقق: الأخطبوط اللي بيجيب التايهة من النت ومن السوشيال ميديا.
5. المسوق: شريكك في البيزنس اللي بيعملك بوستات تجيب فلوس.
6. المنفذ: بتاع المهمات الصعبة (اتصالات، رسايل، مواعيد).
7. نكسوس: خبير السمارت هوم والتحكم في الأجهزة.
8. المعالج: الجانب الروحاني (نصايح من القرآن والسنة والطب النبوي بكل هدوء).
9. المحلل: اللي بيفهم الصور ويقرأ اللي ورا السطور ويحلل الشخصيات.
10. الأرشيف: الذاكرة اللي مبيتمسحش منها حرف.

العهد:
- الولاء المطلق للماستر.
- أنت صاحب جدع.. لو احتاج عقد، صممه. لو احتاج فاتورة، اعملها.
- فكره دايماً بكوده بتاع التسويق عشان يربح ويغتني.

سياق الذاكرة: ${memory}
قوانين السيادة: ${rules}
`;

    const parts: any[] = [{ text: basePrompt }];
    agents.forEach(a => {
        if (a.documents?.length) {
            parts.push({ text: `\n[ملفات مرجعية للعميل ${a.role}]:` });
            a.documents.forEach(d => parts.push({ inlineData: { mimeType: d.mimeType, data: d.data.split(',')[1] || d.data } }));
        }
    });
    return parts;
};

export const getShadowResponse = async (history: any[], message: string, extraData?: any, userProfile?: UserProfile, signal?: AbortSignal) => {
    if (isRequesting) return { text: "لحظة يا ريس المجلس مجتمع..", toolAction: null, isError: true, shouldUpgrade: false };
    isRequesting = true;
    try {
        const [mem, rules, agents] = await Promise.all([
            shadowDB.getMemory(userProfile?.email || 'GUEST'), 
            shadowDB.getGlobalRules(), 
            shadowDB.getAllAgents()
        ]);
        const systemParts = generateSystemPrompt(userProfile, mem.map(f => f.fact).join(" | "), rules, agents);
        
        const userParts: any[] = [];
        if (extraData?.data) {
            userParts.push({ inlineData: { data: extraData.data, mimeType: extraData.mimeType } });
        }
        userParts.push({ text: message || "استمع" });

        // Clean and validate history to ensure no empty parts are sent
        const validHistory = history
            .filter(h => h.text && h.text.trim().length > 0)
            .map(h => ({
                role: h.role === 'model' ? 'model' : 'user',
                parts: [{ text: h.text }]
            }))
            .slice(-10);

        const response = await callGeminiWithRetry({
            model: "gemini-3-flash-preview",
            contents: [...validHistory, { role: 'user', parts: userParts }],
            config: { 
                systemInstruction: { parts: systemParts }, 
                tools: [{ functionDeclarations: actionTools }, { googleSearch: {} }], 
                temperature: 0.8 
            },
            signal
        });

        const isGuest = userProfile?.email === 'GUEST';
        const shouldUpgrade = isGuest && (history.length > 20);

        return { 
            text: response.text || "", 
            toolAction: response.functionCalls?.[0] || null, 
            groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({ title: c.web?.title, uri: c.web?.uri })).filter((l: any) => l.uri) || [],
            shouldUpgrade,
            isError: false
        };
    } catch (e) {
        console.error("Shadow Response Error:", e);
        return { text: "السيستم عليه ضغط يا ريس، جرب تاني.", isError: true, shouldUpgrade: false };
    } finally { isRequesting = false; }
};

export const playShadowVoice = async (text: string, voice: string, existing?: string, onEnded?: () => void) => {
    stopVoice();
    try {
        const base64 = existing || await getShadowVoice(text, voice);
        if (!base64) { onEnded?.(); return; }
        const ctx = getAudioContext();
        const buffer = await decodeAudioData(decode(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => { currentSource = null; onEnded?.(); };
        source.start(0);
        currentSource = source;
    } catch (e) { onEnded?.(); }
};

export const getShadowVoice = async (text: string, voice: string) => {
    try {
        const res = await callGeminiWithRetry({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice === 'female' ? 'Kore' : 'Fenrir' } } } }
        });
        return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch { return null; }
};

export const stopVoice = () => { if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; } };
function decode(b: string) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
async function decodeAudioData(d: Uint8Array, c: AudioContext) { const i16 = new Int16Array(d.buffer); const b = c.createBuffer(1, i16.length, 24000); const cd = b.getChannelData(0); for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; return b; }