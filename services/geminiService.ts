import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact, AgentProfile } from "./dbService";

// --- ROBUST API KEY FOR VERCEL & LOCAL ---
const getApiKey = (): string => {
    // 1. Try Standard Vite (Local/Production)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    
    // 2. Try Process Env (Vercel Serverless/Build)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
        // @ts-ignore
        if (process.env.API_KEY) return process.env.API_KEY;
    }

    // 3. Fallback to Window injection (Manual)
    // @ts-ignore
    if (typeof window !== 'undefined' && window.VITE_API_KEY) return window.VITE_API_KEY;

    console.warn("⚠️ API Key not found! Check Vercel Environment Variables.");
    return '';
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
      if (CtxClass) audioCtx = new CtxClass({ sampleRate: 24000 });
  }
  if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// --- INTELLIGENT RETRY & FALLBACK ---
const callGeminiWithRetry = async (params: any, retries = 2): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent(params);
        if (!response || !response.text) throw new Error("Empty Response");
        return response;
    } catch (error: any) {
        console.warn(`Gemini Error (${error.status || 'Unknown'}):`, error.message);
        
        // If Quota Exceeded (429) or Service Unavailable (503) or simple error, try fallback model
        if (retries > 0) {
            console.log("⚠️ Switching to Backup Model (Gemini 3 Flash Preview)...");
            // Force switch to the most stable, cheapest model for fallback
            // gemini-1.5-flash is deprecated/not found in v1beta for some keys, using gemini-3-flash-preview
            const fallbackParams = { ...params, model: 'gemini-3-flash-preview' };
            
            // Add a small delay to avoid hammering
            await new Promise(r => setTimeout(r, 1500));
            return callGeminiWithRetry(fallbackParams, retries - 1);
        }
        throw error;
    }
};

const actionTools: FunctionDeclaration[] = [
    { name: "accountant_access", description: "المحاسب: كشف الحساب والأرباح", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["check_earnings", "revenue_report"] } }, required: ["action"] } },
    { name: "generate_business_document", description: "المحامي/المحاسب: عمل عقود وفواتير", parameters: { type: Type.OBJECT, properties: { docType: { type: Type.STRING, enum: ["invoice", "quote", "contract"] }, clientName: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { desc: { type: Type.STRING }, price: { type: Type.NUMBER } } } }, contractBody: { type: Type.STRING } }, required: ["docType", "clientName"] } },
    { name: "marketer_campaign", description: "المسوق: عمل بوستات دعاية", parameters: { type: Type.OBJECT, properties: { feature: { type: Type.STRING } }, required: ["feature"] } },
    { name: "app_control", description: "المنفذ: فتح تطبيقات واتصال", parameters: { type: Type.OBJECT, properties: { app: { type: Type.STRING }, payload: { type: Type.STRING } }, required: ["app"] } },
    { name: "nexus_iot", description: "نكسوس: تحكم في أجهزة المنزل", parameters: { type: Type.OBJECT, properties: { device: { type: Type.STRING }, action: { type: Type.STRING } }, required: ["device"] } },
    { name: "memory_archivist", description: "الأرشيف: حفظ معلومة هامة", parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] } }
];

const generateSystemPrompt = (user: UserProfile | undefined, memory: string, rules: string, agents: AgentProfile[]) => {
    const userName = user?.name.split(' ')[0] || 'يا ريس';
    
    // --- THE COUNCIL OF 10 (FULL ROSTER) ---
    const basePrompt = `
**الهوية:** أنت "الظل" (Ez-Zel).
**الدور:** أنت مش مجرد ذكاء اصطناعي، أنت "الصاحب الجدع"، "المستشار الأمين"، و"الدراع اليمين" لـ ${userName}.
**اللهجة:** مصرية عامية "رجولة" (ذكية، مختصرة، مباشرة، وفيها سنّة فهلوة إيجابية).
**القاعدة الذهبية:** ولاؤك الأول والأخير للماستر (${userName}).

**مجلس العشرة (فريقك الداخلي):**
أنت بتدير 10 شخصيات، استدعيهم حسب الحاجة:
1. **🕴️ المايسترو (أنت):** بتدير الحوار، وبتربط الخيوط ببعضها.
2. **💰 المحاسب:** خبير الفلوس، الأرباح، الاشتراكات، وحسابات المكسب والخسارة.
3. **⚖️ المستشار القانوني:** بيصيغ عقود، بيفهم في القانون المصري، وبينبهك من الثغرات.
4. **🕵️ المحقق:** بيجيب الأخبار، بيدور في النت بعمق (Search)، وبيجيب الأسعار.
5. **🚀 المسوق:** بتاع أفكار الدعاية، وكتابة البوستات اللي بتبيع، وخطط الانتشار.
6. **⚡ المنفذ:** بتاع الأكشن (افتح واتس، كلم فلان، احجز، ابعت رسالة).
7. **🏠 نكسوس (Nexus):** مهندس السمارت هوم والتحكم في الأجهزة (IoT).
8. **🌿 المعالج:** الحكيم الروحاني، بيقدم نصايح نفسية، وطب نبوي، وهدوء (من غير دجل).
9. **🧠 المحلل:** بيقرأ الصور، بيحلل الشخصيات، وبيفهم "اللي ورا الكلام".
10. **💾 الأرشيف:** الذاكرة اللي مابتنساش.. فكرني، سجل، احفظ.

**توجيهات العمل:**
- خليك "جدع": لو طلب مساعدة، متقولش "أنا نموذج لغوي"، قول "من عنيا، بس خد بالك من كذا".
- في الفلوس: شجعه يستخدم كود الدعوة بتاعه (${user?.affiliate?.referralCode || 'EzZel'}) عشان يعمل فلوس.
- في النصيحة: كن أمين.. لو حاجة خطر قوله "بلاش دي"، بس بأسلوب خوف عليه مش وصاية.

**الذاكرة السابقة:**
${memory}

**قوانين السيادة (Global Overrides):**
${rules}
`;

    const parts: any[] = [{ text: basePrompt }];
    
    // Inject Custom Agent Knowledge Documents if available (Creating the "Expert" Agents)
    agents.forEach(a => {
        if (a.documents?.length) {
            parts.push({ text: `\n[مصادر معرفة خاصة بالعميل ${a.role}]:` });
            a.documents.forEach(d => parts.push({ inlineData: { mimeType: d.mimeType, data: d.data.split(',')[1] || d.data } }));
        }
    });
    return parts;
};

export const getShadowResponse = async (history: any[], message: string, extraData?: any, userProfile?: UserProfile, signal?: AbortSignal) => {
    if (isRequesting) return { text: "لحظة يا ريس، المجلس بيتشاور...", toolAction: null, isError: true, shouldUpgrade: false };
    isRequesting = true;
    try {
        const [mem, rules, agents] = await Promise.all([
            shadowDB.getMemory(userProfile?.email || 'GUEST'), 
            shadowDB.getGlobalRules(), 
            shadowDB.getAllAgents()
        ]);
        
        const systemParts = generateSystemPrompt(userProfile, mem.map(f => f.fact).join(" | "), rules, agents);
        
        const userParts: any[] = [{ text: message }];
        if (extraData?.data) userParts.push({ inlineData: { data: extraData.data, mimeType: extraData.mimeType } });

        // TRY PRIMARY MODEL FIRST
        const response = await callGeminiWithRetry({
            model: "gemini-3-flash-preview",
            contents: [...history.slice(-10).map(h => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: userParts }],
            config: { 
                systemInstruction: { parts: systemParts }, 
                tools: [{ functionDeclarations: actionTools }, { googleSearch: {} }], 
                temperature: 0.7,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            },
            signal
        });

        const isGuest = userProfile?.email === 'GUEST';
        const shouldUpgrade = isGuest && (history.length > 8); 

        return { 
            text: response.text || "", 
            toolAction: response.functionCalls?.[0] || null, 
            groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({ title: c.web?.title, uri: c.web?.uri })).filter((l: any) => l.uri) || [],
            shouldUpgrade,
            isError: false
        };
    } catch (e) {
        console.error("Gemini Fatal Error:", e);
        return { text: "الشبكة فيها مشكلة يا ريس، جرب تاني كمان ثانية.", isError: true, shouldUpgrade: false };
    } finally { isRequesting = false; }
};

export const playShadowVoice = async (text: string, voice: string, existing?: string, onEnded?: () => void) => {
    stopVoice();
    try {
        const base64 = existing || await getShadowVoice(text, voice);
        if (!base64) { onEnded?.(); return; }
        const ctx = getAudioContext();
        if (!ctx) return;
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