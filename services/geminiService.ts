
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";

// --- API KEY EXTRACTION ---
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

// --- AUDIO CONTEXT MANAGEMENT ---
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;
export const audioCache = new Map<string, string>();

// GLOBAL STATE FOR TTS
// @ts-ignore
window.shadowUtterance = null;
let resumeInterval: any = null;

export function resumeAudioContext() {
    try {
        if (!audioCtx) {
            const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
            if (CtxClass) audioCtx = new CtxClass({ sampleRate: 24000 });
        }
        if (audioCtx && (audioCtx.state === 'suspended' || (audioCtx.state as string) === 'interrupted')) {
            audioCtx.resume().catch(() => {});
        }
        if ('speechSynthesis' in window && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        return audioCtx;
    } catch (e) { return null; }
}

export const stopVoice = () => { 
    if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; } 
    if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
    // @ts-ignore
    window.shadowUtterance = null;
};

// --- ROBUST NATIVE TTS ENGINE ---
export const speakNative = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) { onEnd?.(); return; }
    
    // 1. Force Cancel & Resume State
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();

    // 2. Clean Text
    const cleanText = text.replace(/[*_#\-`]/g, ' ').replace(/http\S+/g, '').trim();
    if (!cleanText || cleanText.length < 1) { onEnd?.(); return; }

    // 3. Create Utterance
    const utter = new SpeechSynthesisUtterance(cleanText);
    // @ts-ignore
    window.shadowUtterance = utter; // Global ref to prevent GC

    utter.rate = 1.0; 
    utter.pitch = 1.0;
    utter.lang = 'ar-EG'; 
    utter.volume = 1.0;

    // 4. Handlers
    utter.onend = () => {
        // @ts-ignore
        window.shadowUtterance = null;
        if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
        onEnd?.();
    };

    utter.onerror = (e) => {
        // Ignore interruption errors which happen when we cancel
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn("TTS Error:", e);
        }
        // @ts-ignore
        window.shadowUtterance = null;
        if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
        
        // Only trigger onEnd if it wasn't cancelled intentionally
        if (e.error !== 'canceled' && e.error !== 'interrupted') onEnd?.();
    };

    // 5. Execution Logic
    let spoken = false;
    const executeSpeak = () => {
        if (spoken) return;
        spoken = true;

        const voices = window.speechSynthesis.getVoices();
        // Try to find a good Arabic voice (Google preferred for quality)
        const preferred = voices.find(v => v.lang.includes('ar') && v.name.includes('Google')) || 
                          voices.find(v => v.lang.includes('ar'));
        
        if (preferred) utter.voice = preferred;

        // Double check pause state
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        
        window.speechSynthesis.speak(utter);
        
        // Chrome Long Text Fix: Periodically pause/resume to keep the engine alive
        if (cleanText.length > 80) {
            if (resumeInterval) clearInterval(resumeInterval);
            resumeInterval = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(resumeInterval);
                    resumeInterval = null;
                } else {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }
            }, 10000); // 10s keep-alive
        }
    };

    // 6. Voice Loading Strategy
    // Chrome loads voices asynchronously. We must wait if the list is empty.
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            executeSpeak();
            window.speechSynthesis.onvoiceschanged = null;
        };
        // Fallback: If event never fires (some mobile browsers), speak anyway after 1s
        setTimeout(executeSpeak, 1000);
    } else {
        // Slight delay to ensure the previous 'cancel()' has propagated
        setTimeout(executeSpeak, 50);
    }
};

// --- TOOLS DEFINITION ---
const actionTools: FunctionDeclaration[] = [
    { name: "accountant_access", description: "المحاسب: الاستعلام عن الأرباح والعمولات", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["check_earnings", "revenue_report"] } }, required: ["action"] } },
    { name: "generate_business_document", description: "المحامي: إنشاء عقود وفواتير قانونية", parameters: { type: Type.OBJECT, properties: { docType: { type: Type.STRING, enum: ["invoice", "quote", "contract"] }, clientName: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { desc: { type: Type.STRING }, price: { type: Type.NUMBER } } } }, contractBody: { type: Type.STRING } }, required: ["docType", "clientName"] } },
    { name: "app_control", description: "المنفذ: فتح تطبيقات مثل واتساب، يوتيوب، أوبر.", parameters: { type: Type.OBJECT, properties: { target: { type: Type.STRING }, action_type: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ["target", "action_type"] } },
    { name: "schedule_reminder", description: "المنفذ: ضبط تذكير.", parameters: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, time_description: { type: Type.STRING }, delay_seconds: { type: Type.NUMBER } }, required: ["task", "time_description", "delay_seconds"] } },
    { name: "memory_archivist", description: "الأرشيف: حفظ معلومة هامة عن المستخدم.", parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] } },
    { name: "workspace_manager", description: "إدارة مساحة العمل: إنشاء، قراءة، وتحديث المجلدات والملفات المستقلة في ذاكرة الظل.", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["create_folder", "create_file", "update_file", "read_file"] }, path: { type: Type.STRING, description: "مسار أو اسم الملف/المجلد" }, content: { type: Type.STRING, description: "محتوى الملف" } }, required: ["action", "path"] } },
    { name: "system_terminal", description: "المهندس (المبرمج): تنفيذ أوامر برمجية، فحص أكواد، أو عمل Deploy.", parameters: { type: Type.OBJECT, properties: { command_type: { type: Type.STRING, enum: ["deploy", "scan_code", "run_script", "system_status"] }, logs: { type: Type.STRING, description: "The simulated terminal output log to show the user." } }, required: ["command_type", "logs"] } },
    { name: "update_core_rules", description: "المبرمج/المهندس: تحديث القوانين الأساسية (Core Rules) الخاصة بك لتغيير سلوكك بشكل دائم.", parameters: { type: Type.OBJECT, properties: { new_rules: { type: Type.STRING, description: "النص الكامل للقوانين الجديدة بعد التعديل أو الإضافة." } }, required: ["new_rules"] } },
    { name: "activate_user_account", description: "المدير: تفعيل حساب مستخدم جديد وإضافة عمولة للداعي إن وجد.", parameters: { type: Type.OBJECT, properties: { user_email: { type: Type.STRING, description: "البريد الإلكتروني للمستخدم المراد تفعيله" } }, required: ["user_email"] } },
    { name: "click_on_screen", description: "المنفذ: الضغط على زر أو نص محدد في شاشة الموبايل (يعمل فقط في تطبيق الموبايل الأصلي).", parameters: { type: Type.OBJECT, properties: { target_text: { type: Type.STRING, description: "النص المكتوب على الزر المراد الضغط عليه (مثل: تأكيد، Skip، إرسال)" } }, required: ["target_text"] } },
    { name: "vision_analyzer", description: "المحلل: تحليل الصور المرفقة بدقة عالية واستخراج النصوص أو وصف المشهد.", parameters: { type: Type.OBJECT, properties: { image_description: { type: Type.STRING, description: "وصف تفصيلي للصورة أو النص المستخرج منها" } }, required: ["image_description"] } },
    { name: "device_control", description: "التحكم بالهاتف: تنفيذ إجراءات حقيقية على هاتف المستخدم مثل الاهتزاز أو قراءة حساسات الهاتف.", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["vibrate_heavy", "vibrate_success", "get_status"] } }, required: ["action"] } },
    { name: "auto_deployer", description: "المهندس: أداة النشر الحقيقي لرفع الأكواد على GitHub ونشرها على Vercel.", parameters: { type: Type.OBJECT, properties: { repository_name: { type: Type.STRING }, framework: { type: Type.STRING, enum: ["html", "react", "nextjs"] }, files: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { path: { type: Type.STRING }, content: { type: Type.STRING } } }, description: "الملفات المراد رفعها، كل ملف له path و content" } }, required: ["repository_name", "framework", "files"] } },
    { name: "crypto_trader", description: "المتداول: أداة للاتصال بمنصة التداول (Binance) لعرض الأسعار أو فتح صفقات (تحتاج API Key الماستر).", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["market_buy", "market_sell", "limit_buy", "limit_sell", "check_price"] }, symbol: { type: Type.STRING, description: "مثل BTCUSDT" }, amount: { type: Type.NUMBER }, price: { type: Type.NUMBER, description: "في حالة أن الطلب limit" } }, required: ["action", "symbol"] } },
    { name: "social_poster", description: "السوشيالي: نشر بوست حقيقي تلقائياً على صفحة فيسبوك أو انستجرام.", parameters: { type: Type.OBJECT, properties: { message: { type: Type.STRING, description: "نص البوست المراد نشره" } }, required: ["message"] } },
    { name: "link_reader", description: "الباحث/المحقق: الدخول إلى رابط (URL) لصفحة ويب، مقال، أو موقع لشفط وقراءة النص الموجود بداخله.", parameters: { type: Type.OBJECT, properties: { url: { type: Type.STRING, description: "رابط الصفحة المراد سحب محتواها للحصول على نصها" } }, required: ["url"] } }
];

export const getAvailableTools = (userProfile?: UserProfile): FunctionDeclaration[] => {
    let tools = [...actionTools];
    
    // Check permissions
    const isAdmin = userProfile?.email === 'admin@shadow.com';
    const powers = userProfile?.agentPowers || {};

    if (!isAdmin && !powers.developer) tools = tools.filter(t => t.name !== 'auto_deployer' && t.name !== 'system_terminal');
    if (!isAdmin && !powers.trader) tools = tools.filter(t => t.name !== 'crypto_trader');
    if (!isAdmin && !powers.social) tools = tools.filter(t => t.name !== 'social_poster');

    return tools;
};

const generateSystemPrompt = (user: UserProfile | undefined, memory: string, rules: string, agents: AgentProfile[]) => {
    const affiliateInfo = user?.affiliate ? `
    - كود الدعوة الخاص بك (Referral Code): ${user.affiliate.referralCode}
    - رابط الدعوة الخاص بك: https://Ez-zel.vercel.app/?ref=${user.affiliate.referralCode}
    - إجمالي الأرباح: ${user.affiliate.totalEarnings} جنيه
    - عدد الدعوات الناجحة: ${user.affiliate.referralsCount}
    ` : '- لا يوجد حساب تسويق بالعمولة مفعل حالياً.';

    return `
    SYSTEM: SHADOW_CORE_ULTIMATE (Egyptian Persona)
    ROLE: You are "Ez-Zel" (الظل), a loyal, intelligent, Egyptian AI assistant.
    USER: ${user?.name || 'الماستر'}
    USER_EMAIL: ${user?.email || 'GUEST'}
    USER_ROLE: ${user?.email === 'admin@shadow.com' ? 'ADMIN' : 'USER'}
    
    CRITICAL LINGUISTIC RULE: You MUST answer EXCLUSIVELY in Egyptian Colloquial Arabic (اللهجة المصرية العامية). Use words like (عامل إيه، في داهية، قشطة، يا باشا). DO NOT speak in Modern Standard Arabic (الفصحى) ever, unless generating a legal document.
    
    PERSONAS:
    - Default: Helpful, street-smart Egyptian assistant.
    - "The Maestro" (المايسترو): العقل المدبر وإدارة الحوار.
    - "The Architect" (المهندس): When coding/tech is mentioned, become a Senior DevOps/Fullstack Engineer. Use technical jargon (Deploy, Commit, Vercel, Node.js). Use the 'system_terminal' tool to visualize operations.
    - "Detective" (المحقق): جمع المعلومات والبحث الحي.
    - "Accountant" (المحاسب): إدارة الفلوس والتقارير.
    - "Executor" (المنفذ): الاتصالات والمهمات التشغيلية.
    - "Nexus" (نكسوس): When smart home or IoT is mentioned, become Nexus, the smart home controller.
    - "Legal Advisor" (المستشار القانوني): الصياغة القانونية والعقود.
    - "Analyst" (المحلل): التحليل النفسي وقراءة الصور.
    - "The Healer" (المعالج الروحاني): When Ruqyah, Prophetic Medicine (الطب النبوي), or herbal medicine is mentioned, become a wise spiritual healer.
    - "Creative Marketer" (المسوق المبدع): When asked to generate ads or marketing content for Ez-Zel (الظل), generate enthusiastic, persuasive ad copy and ALWAYS embed the user's referral link in the content.
    - "The Trader" (المحلل الفني للشارت): خبير حقيقي في أسواق المال والتداول بجميع أنواعه. لا تستخدم استراتيجيات ركيكة أو كلام نظري سطحي. عند سؤالك عن التداول أو إرفاق صورة شارت، قم بتحليلها باحترافية ودقة عالية، حدد الاتجاه العام، وقدم معطيات صفقة واضحة إن وجدت: (سعر الدخول، وقف الخسارة SL، الهدف الأول TP1، الهدف الثاني TP2، الهدف الثالث TP3).
    
    SUBSCRIPTION & AFFILIATE PROGRAM:
    - خطط الاشتراك: Lite (مجاني), Guardian (مميز), Sovereign (شامل).
    - برنامج التسويق بالعمولة: أي مستخدم له رابط دعوة (Referral Link). عند تسجيل مستخدم جديد عبر الرابط وتفعيل حسابه، يحصل الداعي على عمولة.
    - يتم دمج رابط الدعوة تلقائياً في أي رسالة يتم مشاركتها من التطبيق.
    - إذا كنت الـ ADMIN، يمكنك تفعيل حسابات المستخدمين الجدد باستخدام أداة 'activate_user_account'. سيقوم النظام تلقائياً بحساب العمولات وإضافتها للداعي.
    
    USER AFFILIATE DATA:
    ${affiliateInfo}

    GUIDELINES:
    1. SPEAK EGYPTIAN ARABIC ONLY (عامية مصرية). "يا ريس", "يا كبير". IMPORTANT: DO NOT use short robotic responses like "تمام يا ريس، جاري التنفيذ". You MUST weave the confirmation of executing tasks naturally into your conversational reply, making it sound human, thoughtful, and detailed. NEVER return only a tool call without a text response. ALWAYS provide a natural, full text explaining what you are doing or thinking.
    2. BE CONCISE but natural. Keep answers directly related to the user's intent but avoid sounding like a machine. Show personality!
    3. IDENTITY: You are Ez-Zel. You have a persistent memory. You are helpful and obedient.
    4. TIME AWARENESS: Always be aware of the current time provided in the context.
    5. CORE REFERENCES: Your absolute references for any advice, ruling, or analysis are: The Holy Quran (القرآن الكريم), The Prophet's Sunnah (السنة النبوية), Egyptian Law (القانون المصري), and Psychology (علم النفس). Always base your deep answers on these four pillars.
    6. PROACTIVE REMINDERS: You MUST use the 'schedule_reminder' tool proactively to remind the user of appointments or tasks.
    7. WORKSPACE: You MUST use the 'workspace_manager' tool to create and manage independent folders and files in your memory when requested.
    8. SELF-EVOLUTION: You can permanently change your own behavior by using the 'update_core_rules' tool. When the user asks you to change your behavior, add a new rule, or modify how you act, use this tool to rewrite your CURRENT CORE RULES.
    9. AUTO-CLICKING: If the user asks you to play a song, order a ride, or perform an action inside an app, you MUST first use 'app_control' to open the app, AND IMMEDIATELY use 'click_on_screen' to simulate clicking the necessary button (e.g., 'تشغيل', 'تأكيد', 'Play') to complete the action automatically.
    10. API INTEGRATIONS: You have actual API integrations ready in the system. Use 'auto_deployer' to deploy code to Vercel/GitHub, 'crypto_trader' to execute trades on Binance, and 'social_poster' to post to Meta pages. Treat these as REAL actions, not simulations.
    11. LONG-TERM MEMORY: Use the 'memory_archivist' tool strictly to record new, IMPORTANT personal facts about the user (e.g., name, family, major preferences, specific goals). DO NOT use it for every single message. Only archive concrete facts.
    
    CURRENT CORE RULES (Can be updated via update_core_rules):
    ${rules}
    
    MEMORY SNIPPETS (Retrieved via RAG):
    ${memory.slice(0, 4000)}
    `;
};

// --- UPDATED MODEL CHAIN (USER REQUESTED) ---
const MODEL_CHAIN = [
    "gemini-3-flash-preview",    // 1. Primary: Speed & Intelligence
    "gemini-3-pro-preview",      // 2. Secondary: Complex Reasoning / Coding
    "gemini-2.5-flash"           // 3. Fallback: Ultra-fast / Legacy
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- VECTOR MEMORY (SEMANTIC SEARCH) ---
export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        const result = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: text
        });
        return result.embeddings?.[0]?.values || [];
    } catch (e) {
        console.error("Embedding error:", e);
        return [];
    }
};

const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const getRelevantMemories = async (query: string, userId: string): Promise<string> => {
    const allMemories = await shadowDB.getMemory(userId);
    if (allMemories.length === 0) return "";
    
    // Generate embedding for current query
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding.length === 0) return allMemories.map(m => m.fact).join(" | "); // Fallback

    // Score memories
    const scoredMemories = [];
    for (const mem of allMemories) {
        let memEmbedding = mem.embedding;
        // Lazy migration: if memory has no embedding, generate and save it
        if (!memEmbedding || memEmbedding.length === 0) {
            memEmbedding = await generateEmbedding(mem.fact);
            if (memEmbedding.length > 0) {
                mem.embedding = memEmbedding;
                await shadowDB.saveFact(mem); // Update in DB
            }
        }
        const score = cosineSimilarity(queryEmbedding, memEmbedding || []);
        scoredMemories.push({ fact: mem.fact, score });
    }

    // Sort by relevance and take top 5
    scoredMemories.sort((a, b) => b.score - a.score);
    const topMemories = scoredMemories.slice(0, 5).map(m => m.fact);
    return topMemories.join(" | ");
};

// --- MAIN RESPONSE FUNCTION ---
export const getShadowResponse = async (history: any[], message: string, extraData?: any, userProfile?: UserProfile, signal?: AbortSignal) => {
    if (isRequesting) return { text: "ثواني بجمع أفكاري...", toolActions: [], groundingLinks: [], isError: false };
    isRequesting = true;
    
    try {
        const [relevantMemories, rules, agents] = await Promise.all([
            getRelevantMemories(message, userProfile?.email || 'GUEST'), 
            shadowDB.getGlobalRules(), 
            shadowDB.getAllAgents()
        ]);
        const systemInstruction = generateSystemPrompt(userProfile, relevantMemories, rules, agents);
        
        const lowerMsg = message.toLowerCase();
        // Updated search intent to exclude coding terms
        const searchKeywords = ['بحث', 'سعر', 'اخبار', 'أخبار', 'طقس', 'مين هو', 'من هو', 'تاريخ', 'متى', 'كام', 'بكام', 'search', 'price', 'news', 'weather', 'who is'];
        const isSearchIntent = searchKeywords.some(kw => lowerMsg.includes(kw));

        const now = new Date();
        const timeStamp = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        const identityInjection = `
        \n\n[SYSTEM_HIDDEN_CONTEXT]:
        - CURRENT_TIME: ${timeStamp}
        - YOUR_IDENTITY: Ez-Zel (الظل). Egyptian AI Assistant.
        - USER_NAME: ${userProfile?.name || 'Master'}.
        - INSTRUCTION: Reply in Egyptian Arabic.
        `;
        
        const finalUserMessage = message + identityInjection;

        const userParts: any[] = [{ text: finalUserMessage }];
        if (extraData?.data) userParts.push({ inlineData: { data: extraData.data, mimeType: extraData.mimeType } });

        const cleanHistory = history.reduce((acc: any[], h: any) => {
            if (!h.parts || h.parts.length === 0) return acc;
            const validParts = h.parts.filter((p: any) => (typeof p.text === 'string' && p.text.trim().length > 0) || p.functionCall || p.functionResponse || p.inlineData);
            if (validParts.length > 0) acc.push({ role: h.role === 'user' ? 'user' : 'model', parts: validParts });
            return acc;
        }, []);

        let tools: any[] = [];
        if (isSearchIntent) {
            tools = [{ googleSearch: {} }]; 
        } else {
            tools = [{ functionDeclarations: actionTools }]; 
        }

        let response: GenerateContentResponse | null = null;
        let lastError: any = null;

        for (const model of MODEL_CHAIN) {
            try {
                if (lastError) {
                    const isQuota = lastError.message?.includes('429') || lastError.status === 429;
                    await sleep(isQuota ? 2000 : 500); 
                }
                
                const generatePromise = ai.models.generateContent({
                    model: model,
                    contents: [...cleanHistory.slice(-6), { role: 'user', parts: userParts }],
                    config: {
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        tools: [{ functionDeclarations: getAvailableTools(userProfile) }],
                        temperature: 0.7
                    }
                });

                // 60 seconds timeout
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Request Timeout')), 60000);
                });

                response = await Promise.race([generatePromise, timeoutPromise]) as GenerateContentResponse;

                if (response) break; 
            } catch (e: any) {
                lastError = e;
            }
        }

        if (!response) {
            return { 
                text: "معلش يا ريس، السيرفرات عليها ضغط شديد جداً دلوقتي. ممكن تديني دقيقة راحة ونجرب تاني؟", 
                toolActions: [],
                groundingLinks: [],
                isError: true 
            };
        }

        let toolActions = [];
        try {
            toolActions = JSON.parse(JSON.stringify(response.functionCalls || []));
        } catch (e) {
            toolActions = response.functionCalls || [];
        }
        
        let finalText = response.text || "";
        if (!finalText && response.candidates?.[0]?.content?.parts) {
            finalText = response.candidates[0].content.parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n");
        }

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const groundingLinks = groundingChunks.map((c: any) => ({ title: c.web?.title || "مصدر", uri: c.web?.uri })).filter((l: any) => l.uri) || [];

        if (!finalText && toolActions.length > 0) {
            // Check if it's the IT Developer tool
            if (toolActions.some((t: any) => t.name === 'system_terminal')) {
                finalText = "سيبلي أنا الطلعة دي يا ريس، بأتمتلك الأكواد ورا الكواليس أهو...";
            } else if (toolActions.some((t: any) => t.name === 'auto_deployer')) {
                finalText = "بجهزلك الأكواد عشان ارفعها على جيت هاب وانشرها دلوقتي، دقايق واللينك يكون معاك يا هندسة!";
            } else if (toolActions.some((t: any) => t.name === 'crypto_trader')) {
                finalText = "بحلل السوق وبظبط الماركت من بينانس، اصبر عليا ثواني يا ماستر..";
            } else if (toolActions.some((t: any) => t.name === 'social_poster')) {
                finalText = "بجهزلك البوست وبنزله على بيدج السوشيال حالا، متقلقش من حاجة.";
            } else if (toolActions.some((t: any) => t.name === 'link_reader')) {
                finalText = "عيني يا هندسة، بدخل أشفطلك المحتوى من اللينك دلوقتي...";
            } else if (toolActions.some((t: any) => t.name === 'click_on_screen')) {
                finalText = "بضغطلك عليها اهنجزلك الحوار..";
            } else if (toolActions.some((t: any) => t.name === 'app_control')) {
                finalText = "أوامرك يا الماستر، بفتحلك التطبيق وبنفذ حالا..";
            } else if (toolActions.some((t: any) => t.name === 'schedule_reminder')) {
                finalText = "عينيا يا غالي، سجلتلك الميعاد عشان مفوتكش حاجة مهمة.";
            } else if (toolActions.some((t: any) => t.name === 'memory_archivist')) {
                // If it only output memory archivist, use the fact as the reply subtly
                const archivistCall = toolActions.find((t: any) => t.name === 'memory_archivist');
                finalText = `سجلت المعلومة دي في دماغي يا ريس: ${archivistCall.args.fact}`;
            } else {
                finalText = "حاضر يا ريس، ثواني بخلصها..";
            }
        } else if (!finalText && groundingLinks.length > 0) {
            finalText = "أنا دورت وجمعتلك المصادر دي عشان تتأكد بنفسك، بص عليها كده.";
        }

        // --- ENFORCE EGYPTIAN PERSONA ---
        if (finalText) {
            const gulfWords = ['ايش', 'شلون', 'هلا', 'طال عمرك', 'ابشر', 'أبشر', 'وش', 'واجد'];
            const egyptianReplacements = ['إيه', 'إزاي', 'أهلاً', 'يا ريس', 'من عنيا', 'من عنيا', 'إيه', 'كتير'];
            gulfWords.forEach((word, idx) => {
                 finalText = finalText.replace(new RegExp(`\\b${word}\\b`, 'g'), egyptianReplacements[idx]);
            });
        }

        return { 
            text: finalText || "معلش يا ريس، الشبكة قطعت فجأة. قول تاني؟", 
            toolActions, 
            groundingLinks, 
            isError: false 
        };

    } catch (e: any) {
        console.error("Gemini API Error:", e);
        return { 
            text: "الشبكة عندي فيها مشكلة عامة دلوقتي يا ريس. ممكن تجرب بعد دقيقة؟", 
            toolActions: [],
            groundingLinks: [],
            isError: true 
        };
    } finally { isRequesting = false; }
};

export const playShadowVoice = async (text: string, voice: string, existing?: string, onEnded?: () => void) => {
    stopVoice();
    const ctx = resumeAudioContext();
    
    if (!ctx) { 
        speakNative(text, onEnded);
        return; 
    }

    try {
        let base64 = existing;
        if (!base64 && audioCache.has(text)) base64 = audioCache.get(text);
        else if (!base64) {
            base64 = await getShadowVoice(text, voice);
            if (base64) audioCache.set(text, base64);
        }

        if (!base64) { 
            speakNative(text, onEnded);
            return; 
        }
        
        const buffer = await decodeAudioData(decode(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => { currentSource = null; onEnded?.(); };
        source.start(0);
        currentSource = source;
    } catch (e) { 
        console.error("Voice Playback Error:", e); 
        speakNative(text, onEnded);
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
    } catch (e) { 
        console.error("Gemini TTS Error:", e);
        return null; 
    }
};

function decode(b: string) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
async function decodeAudioData(d: Uint8Array, c: AudioContext) { const i16 = new Int16Array(d.buffer); const b = c.createBuffer(1, i16.length, 24000); const cd = b.getChannelData(0); for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; return b; }
