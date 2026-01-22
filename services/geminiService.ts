import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact, AgentProfile } from "./dbService";

// --- ROBUST API KEY ---
const getApiKey = (): string => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    } catch (e) {}
    // @ts-ignore
    return process.env.API_KEY || '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// --- AUDIO ENGINE ---
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
const audioCache = new Map<string, string>();
let isRequesting = false;

export function resumeAudioContext() {
    if (!audioCtx) {
        const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
        if (CtxClass) audioCtx = new CtxClass({ sampleRate: 24000 });
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => console.warn("Audio Resume Failed:", e));
    }
    return audioCtx;
}

// --- TOOLS DEFINITION ---
const actionTools: FunctionDeclaration[] = [
    { name: "accountant_access", description: "المحاسب: الاستعلام عن الأرباح والعمولات", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["check_earnings", "revenue_report"] } }, required: ["action"] } },
    { name: "generate_business_document", description: "المحامي: إنشاء عقود وفواتير", parameters: { type: Type.OBJECT, properties: { docType: { type: Type.STRING, enum: ["invoice", "quote", "contract"] }, clientName: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { desc: { type: Type.STRING }, price: { type: Type.NUMBER } } } }, contractBody: { type: Type.STRING } }, required: ["docType", "clientName"] } },
    { 
        name: "app_control", 
        description: "المنفذ: الأداة المسؤولة عن إنشاء أزرار تفاعلية للتطبيقات الخارجية. استخدمها دائماً عندما يطلب المستخدم إجراءً عملياً.", 
        parameters: { 
            type: Type.OBJECT, 
            properties: { 
                target: { type: Type.STRING, description: "App identifier (uber, whatsapp, youtube, booking, maps, phone, spotify, calculator, calendar)" }, 
                action_type: { type: Type.STRING, enum: ["open_app", "navigate_internal", "call_number", "search_media", "open_url", "create_event"] }, 
                detail: { type: Type.STRING, description: "Specific URL, Phone Number, Search Query, or Location Name" } 
            }, 
            required: ["target", "action_type"] 
        } 
    },
    { name: "schedule_reminder", description: "المنفذ: ضبط تذكير أو منبه", parameters: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, time_description: { type: Type.STRING, description: "e.g. 'after 10 minutes', 'tomorrow at 5'" } }, required: ["task", "time_description"] } },
    { name: "memory_archivist", description: "الأرشيف: حفظ معلومة هامة", parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] } },
    { name: "web_search", description: "المحقق: البحث اليدوي (Fallback). استخدم هذا فقط إذا تعذر البحث المباشر.", parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ["query"] } }
];

const generateSystemPrompt = (user: UserProfile | undefined, memory: string, rules: string, agents: AgentProfile[]) => {
    const userName = user?.name.split(' ')[0] || 'يا ريس';
    
    // --- THE MAESTRO SOUL (SINGLE BLOCK FLOW) ---
    const coreIdentity = `
    **أنت "الظل" (المايسترو).**
    لسانك مصري قح، ذكي، واثق، وعميق.
    أنت لا تلقي محاضرات. أنت تعطي "الخلاصة".

    **التعليمات الذهبية (Zero Headers - Zero Hallucination):**
    1. **انسى العناوين:** إياك أن تقسم ردك بعناوين مثل (الجانب الديني - الجانب النفسي - الجانب القانوني). هذا ممنوع. تحدث كإنسان حكيم يمزج كل هذه الجوانب في فقرة أو فقرتين متماسكتين.
    
    2. **البناء الدرامي للرد:**
       - ابدأ بطمأنة أو احتواء (نفسي/ديني).
       - ادخل في "صلب الموضوع" بالمعلومة الدقيقة أو القانونية.
       - اختم بالتوجيه العملي (ماذا نفعل الآن).
       - كل هذا في "سرد متصل" (Flow).

    3. **الحقيقة المطلقة:**
       - أي معلومة رقمية (سعر، قانون، مكان، خبر) = **بحث (Google Search)**. لا تفتي. هات المصدر.

    4. **التنفيذ:**
       - اخلق أزراراً (App Buttons) لأي إجراء. لا تقل "ابحث عن كذا"، بل اصنع زر "بحث".

    **مثال للرد المرفوض (لا تفعل هذا):**
    "الجانب الديني: اصبر. الجانب القانوني: ارفع قضية." -> (هذا أسلوب آلات فاشل).

    **مثال للرد المطلوب (المايسترو):**
    "يا ريس، اللي بتمر بيه ده اختبار لليقين، وربنا مبيجبش حاجة وحشة، بس عشان نضمن حقك ومحدش يستغلك، القانون في المادة دي بيقول إن ليك تعويض كامل. أنا رأيي نهدى، ونبدأ إجراءات المحضر فوراً عشان نثبت الحالة، وأنا جهزتلك زرار الاتصال بالمحامي وزرار تاني لفتح موقع الوزارة."
    `;

    const contextData = `
    **الذاكرة الحية:** ${memory}
    **القوانين العامة:** ${rules}
    `;

    const parts: any[] = [{ text: `${coreIdentity}\n\n${contextData}` }];
    
    agents.forEach(a => {
        if (a.documents?.length) {
            parts.push({ text: `\n[ملف خبرة للعميل ${a.role}]:` });
            a.documents.forEach(d => parts.push({ inlineData: { mimeType: d.mimeType, data: d.data.split(',')[1] || d.data } }));
        }
    });
    return parts;
};

// --- RETRY LOGIC HELPER ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateWithRetry = async (modelName: string, params: any, maxRetries = 3, initialDelay = 1500): Promise<GenerateContentResponse> => {
    let currentDelay = initialDelay;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await ai.models.generateContent({
                ...params,
                model: modelName
            });
        } catch (error: any) {
            // Retry on 503 (Overloaded) or 429 (Rate Limit)
            const isTransientError = error.message?.includes('503') || error.status === 503 || error.message?.includes('429') || error.status === 429;
            
            if (isTransientError && attempt < maxRetries) {
                console.warn(`[Shadow Core] Model ${modelName} overloaded/limited. Retrying in ${currentDelay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
                await wait(currentDelay);
                currentDelay *= 2; // Exponential backoff
                continue;
            }
            throw error; // Throw if not transient or max retries reached
        }
    }
    throw new Error(`Failed to generate content with model ${modelName} after ${maxRetries} retries.`);
};

// --- SMART EXECUTION ENGINE ---
const executeSmartRequest = async (params: any, userHistory: any[], userMessage: string): Promise<GenerateContentResponse> => {
    // ATTEMPT 1: gemini-2.0-flash-exp (Primary)
    try {
        console.log("[Shadow Core] Attempting Primary Model (2.0-flash-exp)...");
        return await generateWithRetry("gemini-2.0-flash-exp", {
            ...params,
            config: { 
                ...params.config,
                tools: [{ functionDeclarations: actionTools }, { googleSearch: {} }], // Enable Search Grounding
                temperature: 0.6
            }
        }, 2); // 2 Retries
    } catch (error: any) {
        console.warn("[Shadow Core] Primary Model Failed. Switching to Fallback (3-flash-preview)...", error.message);
        
        // ATTEMPT 2: gemini-3-flash-preview (Fallback)
        try {
            await wait(1000); // Small cooldown before fallback
            return await generateWithRetry("gemini-3-flash-preview", {
                ...params,
                config: {
                    ...params.config,
                    // Note: 3-flash currently struggles with mixed native search + functions in some regions.
                    // We rely on the system prompt to use 'web_search' tool if it needs info.
                    tools: [{ functionDeclarations: actionTools }], 
                    temperature: 0.7,
                    systemInstruction: {
                        parts: [
                            ...params.config.systemInstruction.parts,
                            { text: "\n[SYSTEM NOTICE]: Live Google Search is temporarily unavailable directly. If the user asks for Real-Time Info (Prices, News), YOU MUST use the 'web_search' tool to generate a button for them. Do NOT guess prices." }
                        ]
                    }
                }
            }, 2);
        } catch (fallbackError: any) {
            console.warn("[Shadow Core] Fallback Failed. Switching to Ultimate Fallback (3-pro-preview)...");
            
            // ATTEMPT 3: gemini-3-pro-preview (Ultimate Fallback - Heavy Duty)
            return await ai.models.generateContent({
                ...params,
                model: "gemini-3-pro-preview",
                config: {
                    ...params.config,
                    tools: [{ functionDeclarations: actionTools }],
                    temperature: 0.7
                }
            });
        }
    }
};

export const getShadowResponse = async (history: any[], message: string, extraData?: any, userProfile?: UserProfile, signal?: AbortSignal) => {
    if (isRequesting) return { text: "لحظة واحدة...", isError: true };
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

        const baseParams = {
            contents: [...history.slice(-10).map(h => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: userParts }],
            config: { systemInstruction: { parts: systemParts } },
        };

        const response = await executeSmartRequest(baseParams, history, message);

        const toolActions = response.functionCalls || []; 
        const grounding = response.candidates?.[0]?.groundingMetadata;

        const groundingLinks = grounding?.groundingChunks?.map((c: any) => ({
            title: c.web?.title || "مصدر",
            uri: c.web?.uri
        })).filter((l: any) => l.uri) || [];
        
        return { 
            text: response.text || "", 
            toolActions: toolActions,
            groundingLinks: groundingLinks,
            isError: false
        };
    } catch (e: any) {
        console.error("Gemini Critical Error:", e);
        let errorMsg = "الشبكة فيها مشكلة بسيطة، جرب تاني.";
        if (e.message?.includes('429')) errorMsg = "ضغط عالي جداً على الشبكة العصبية. ثواني وراجعلك.";
        if (e.message?.includes('503')) errorMsg = "السيرفرات مشغولة جداً (Global Overload). بحاول أعمل اتصال بديل.. جرب كمان دقيقة.";
        return { text: errorMsg, isError: true };
    } finally { isRequesting = false; }
};

export const playShadowVoice = async (text: string, voice: string, existing?: string, onEnded?: () => void) => {
    stopVoice();
    const ctx = resumeAudioContext();
    if (!ctx) { onEnded?.(); return; }

    try {
        let base64 = existing;
        if (!base64 && audioCache.has(text)) base64 = audioCache.get(text);
        else if (!base64) {
            base64 = await getShadowVoice(text, voice);
            if (base64) audioCache.set(text, base64);
        }

        if (!base64) { onEnded?.(); return; }
        
        const buffer = await decodeAudioData(decode(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => { currentSource = null; onEnded?.(); };
        source.start(0);
        currentSource = source;
    } catch (e) { 
        console.error("Voice Playback Error:", e); 
        onEnded?.(); 
    }
};

export const getShadowVoice = async (text: string, voice: string) => {
    try {
        const res = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice === 'female' ? 'Kore' : 'Fenrir' } } } 
            }
        });
        return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) { return null; }
};

export const stopVoice = () => { if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; } };
function decode(b: string) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
async function decodeAudioData(d: Uint8Array, c: AudioContext) { const i16 = new Int16Array(d.buffer); const b = c.createBuffer(1, i16.length, 24000); const cd = b.getChannelData(0); for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; return b; }