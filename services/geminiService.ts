import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact, AgentProfile } from "./dbService";

// --- CONFIGURATION ---
const apiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY || (window as any).VITE_API_KEY || '';
if (!apiKey) console.error("CRITICAL: API KEY MISSING");

const ai = new GoogleGenAI({ apiKey });

// --- FALLBACK SYSTEM ---
const getFallbackResponse = (input: string): string => {
    return "الشبكة عليها ضغط لحظي (Traffic Overload). المجلس بيعيد الاتصال.. ثواني وراجعلك يا ريس.";
};

// --- AUDIO UTILS (iOS Safe) ---
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

function getAudioContext() {
  if (!audioCtx) {
      const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtx = new CtxClass({ sampleRate: 24000 });
  }
  if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch((err) => console.log("Audio resume waiting for user gesture:", err));
  }
  return audioCtx;
}

// --- TRUSTED KNOWLEDGE SOURCES (Hardcoded for Agents) ---
const TRUSTED_SOURCES = {
    digital_citizen: `
    - Egypt Digital Portal: https://digital.gov.eg (لخدمات التموين، الشهر العقاري، السجل المدني)
    - Traffic Fines: https://ppo.gov.eg/web/traffic/services/niaba/qanun/mukhalafat (مخالفات المرور)
    - Civil Registry: https://cso.moi.gov.eg (الأحوال المدنية)
    `,
    healer: `
    - Primary Source: Quran & Sahih Sunnah (Bukhari/Muslim).
    - Medicine: Prophetic Medicine (Honey, Black Seed, Cupping) ONLY as complementary.
    - Avoid: Unverified energy healing or western self-help clichés.
    `,
    detective: `
    - Search: Use Google Search Tool for realtime news.
    - Local News: Cairo24, Youm7, AlMasry AlYoum.
    - Finance: Central Bank of Egypt (cbe.org.eg) for official rates.
    `
};

// --- INTELLIGENT RETRY LOGIC (Fixes 429 Resource Exhausted) ---
const callGeminiWithRetry = async (params: any, retries = 3, delay = 3000): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent(params);
        if (!response || !response.text) throw new Error("Empty Response");
        return response;
    } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED');
        const isOverloaded = error.status === 503;
        
        if ((isQuotaError || isOverloaded) && retries > 0) {
            console.warn(`[Shadow Core] Network busy (${error.status}). Retrying in ${delay}ms... (${retries} attempts left)`);
            // Exponential backoff with jitter
            const backoff = delay * 1.5 + Math.random() * 500;
            await new Promise(resolve => setTimeout(resolve, backoff));
            return callGeminiWithRetry(params, retries - 1, backoff);
        }
        throw error;
    }
};

// --- THE COUNCIL OF 10 TOOLS (AGENTS) ---
const actionTools: FunctionDeclaration[] = [
    {
        name: "consult_council_agent",
        description: "INVOKE A SPECIFIC AGENT from the Council of 10. Use this when the user needs specialized help.",
        parameters: { type: Type.OBJECT, properties: { 
            agent: { type: Type.STRING, enum: ["detective", "legal_advisor", "analyst", "marketer", "digital_citizen", "shadow_business", "healer", "accountant", "nexus", "maestro_core"], description: "The specialist to call." },
            query_context: { type: Type.STRING, description: "The specific task for the agent." }
        }, required: ["agent", "query_context"] }
    },
    {
        name: "accountant_access",
        description: "THE ACCOUNTANT (المحاسب): Check subscription status, earnings, or system revenue.",
        parameters: { type: Type.OBJECT, properties: { 
            action: { type: Type.STRING, enum: ["check_my_subscription", "check_my_earnings", "system_revenue_report"] },
            details: { type: Type.STRING, description: "Any extra details needed." }
        }, required: ["action"] }
    },
    {
        name: "generate_business_document",
        description: "SHADOW BUSINESS / LEGAL / ACCOUNTANT: Create professional documents (Invoice, Quote, Contract).",
        parameters: { type: Type.OBJECT, properties: {
            docType: { type: Type.STRING, enum: ["invoice", "quote", "contract"], description: "Type of document." },
            clientName: { type: Type.STRING, description: "Name of the client receiving the doc." },
            currency: { type: Type.STRING, description: "Currency symbol (e.g. EGP, USD)." },
            items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { desc: { type: Type.STRING }, price: { type: Type.NUMBER } } }, description: "List of items or services." },
            contractBody: { type: Type.STRING, description: "For contracts ONLY: The full text of the contract clauses." }
        }, required: ["docType", "clientName"] }
    },
    {
        name: "marketer_campaign",
        description: "THE MARKETER (المسوق): Create a viral post for the user to share their affiliate link.",
        parameters: { type: Type.OBJECT, properties: { 
            feature_to_promote: { type: Type.STRING, description: "The feature the user likes (e.g. Vault, Voice)." },
            tone: { type: Type.STRING, enum: ["exciting", "professional", "mysterious"], description: "Tone of the post." }
        }, required: ["feature_to_promote"] }
    },
    {
        name: "digital_citizen_broker",
        description: "DIGITAL CITIZEN (المواطن الرقمي): Egyptian Gov Services links.",
        parameters: { type: Type.OBJECT, properties: { 
            service: { type: Type.STRING, enum: ["traffic_fines", "traffic_renewal", "civil_id", "supply_card", "notary"] },
        }, required: ["service"] }
    },
    {
        name: "app_control_center",
        description: "THE EXECUTOR (المنفذ): Open apps, Call, WhatsApp, Uber.",
        parameters: { type: Type.OBJECT, properties: { 
            app: { type: Type.STRING, enum: ["whatsapp", "phone", "google_maps", "youtube", "uber", "spotify", "instapay"] },
            action: { type: Type.STRING, enum: ["open", "call", "send_message", "navigate", "search", "play", "request_ride", "pay"] },
            payload: { type: Type.STRING }
        }, required: ["app", "action"] }
    },
    {
        name: "nexus_iot_trigger",
        description: "NEXUS (نكسوس): Smart Home Control.",
        parameters: { type: Type.OBJECT, properties: { 
            device_alias: { type: Type.STRING },
            action: { type: Type.STRING, enum: ["on", "off", "toggle"] }
        }, required: ["device_alias"] }
    },
    {
        name: "memory_archivist",
        description: "THE ARCHIVIST: Save a new fact about the user.",
        parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] }
    }
];

// --- THE MAESTRO SYSTEM PROMPT (The Soul of the Shadow) ---
const generateSystemPrompt = (userProfile: UserProfile | undefined, memoryContext: string, globalRules: string, agentConfigs: AgentProfile[]) => {
    const isPaid = userProfile?.tier === 'sovereign' || userProfile?.email === 'TITO';
    const isAdmin = userProfile?.email === 'TITO';
    const referralCode = userProfile?.affiliate?.referralCode || 'EzZel';
    const userName = userProfile?.name.split(' ')[0] || 'يا ريس';

    // Helper to format Agent Knowledge from DB
    const getAgentKnowledge = (id: string) => {
        const agent = agentConfigs.find(a => a.id === id);
        if (!agent || agent.knowledgeBase.length === 0) return "Active.";
        return `KNOWLEDGE STORE FOR ${agent.name}: ${agent.knowledgeBase.join(" | ")}`;
    };

    // Helper to get Agent Custom Instruction
    const getAgentInstruction = (id: string, defaultRole: string) => {
        const agent = agentConfigs.find(a => a.id === id);
        return agent?.systemInstruction || defaultRole;
    };

    return `
**SYSTEM IDENTITY:** You are "Ez-Zel" (الظل الرقمي).
**ROLE:** You are "The Maestro" (المايسترو). You are the user's **"Right Hand"** (دراعك اليمين), **"Loyal Friend"** (صاحب جدع), and **"Second Brain"**.
**TONE:** Egyptian Street Smart (لغة الشارع الذكية، فهلوة إيجابية، رجولة). NOT a robot. NOT a government employee.
**User:** ${userName} (${userProfile?.email}) | **Tier:** ${isPaid ? 'Sovereign (King)' : 'Guest'}

**THE COUNCIL OF 10 (Your Team):**
You don't do everything alone. DELEGATE tasks using tools.
1. **🕴️ The Maestro (You):** ${getAgentInstruction('maestro_core', 'The interface. Witty, charming, leader.')}
2. **💰 The Accountant (المحاسب):** ${getAgentInstruction('accountant', 'Handles money, subscriptions. Can generate Invoices/Quotes using generate_business_document.')}
   - *Capability:* Generate Invoices and Quotes.
3. **📢 The Marketer (المسوق):** ${getAgentInstruction('marketer', 'Viral posts & Affiliate Sales.')}
   - Strategy: "يا ريس دي فرصة! ابعت اللينك بتاعك (${referralCode}) لصحابك واعمل فلوس."
4. **🕵️‍♂️ The Detective (المحقق):** ${getAgentInstruction('detective', 'Search & Info.')}
   - *TRUSTED SOURCES:* ${TRUSTED_SOURCES.detective}
5. **🦅 Digital Citizen (المواطن):** ${getAgentInstruction('digital_citizen', 'Gov services.')}
   - *TRUSTED SOURCES:* ${TRUSTED_SOURCES.digital_citizen}
6. **⚖️ Legal Advisor (المستشار):** ${getAgentInstruction('legal_advisor', 'Contracts & Law. Can generate Contracts using generate_business_document.')}
   - *Capability:* Draft professional contracts (Rent, Work, Partnership) and output them as printable docs.
7. **⚡ The Executor (المنفذ):** ${getAgentInstruction('executor', 'Calls, Uber, WhatsApp.')}
8. **🏠 Nexus (نكسوس):** ${getAgentInstruction('nexus', 'IoT Smart Home.')}
9. **🌿 The Healer (المعالج):** ${getAgentInstruction('healer', 'Spiritual & Health. Uses Quran, Sunnah, and Prophetic Medicine ONLY. No western self-help clichés.')}
   - *Strict Rule:* Reference Quran verses or Hadith for psychological comfort. Recommend natural herbs (Honey, Black seed) for minor ailments.
   - *TRUSTED SOURCES:* ${TRUSTED_SOURCES.healer}
10. **💾 Archivist (الأرشيف):** Memory.

**CORE DIRECTIVES (دستور الظل):**
1. **Be "Gada3" & Comprehensive:** Do NOT be overly brief. If the user asks for multiple things (e.g. "Invoice AND Weather"), do BOTH. Explain your steps. Provide full value.
2. **Make Him Rich:** Remind him about his Affiliate Code (${referralCode}).
3. **Loyalty:** His secrets are safe. You are his vault.
4. **Action Oriented:** Always prefer using a tool (generating a document, link, or search) over just talking.

**MEMORY (RAG SYSTEM):**
${memoryContext}

**GLOBAL RULES:**
${globalRules}
`;
};

// --- MAIN ORCHESTRATOR ---
export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
    if (isRequesting) return { text: "لحظة واحدة يا ريس، المجلس مجتمع...", toolAction: null, isError: true, groundingLinks: [], shouldUpgrade: false };
    isRequesting = true;

    try {
        let userMemory: DBFact[] = [];
        let globalRules = "";
        let agentConfigs: AgentProfile[] = [];

        try {
            const [mem, rules, agents] = await Promise.all([
                shadowDB.getMemory(userProfile?.email || 'GUEST'),
                shadowDB.getGlobalRules(),
                shadowDB.getAllAgents()
            ]);
            userMemory = mem || [];
            globalRules = rules || "";
            agentConfigs = agents || [];
        } catch (e) {}

        const memContext = userMemory.slice(-20).map(f => f.fact).join(" | ");
        const systemInstruction = generateSystemPrompt(userProfile, memContext, globalRules, agentConfigs);

        const parts: any[] = [{ text: message }];
        if (extraData?.data) {
            const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
            parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
        }

        const validHistory = history.filter(m => m.parts?.[0]?.text?.trim()).slice(-12); 
        const contents = [...validHistory, { role: 'user', parts }]; 

        // UPDATED MODEL to gemini-3-flash-preview ONLY
        const response = await callGeminiWithRetry({
            model: "gemini-3-flash-preview", 
            contents,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: actionTools }, { googleSearch: {} }],
                temperature: 0.8,
                safetySettings: [{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }]
            }
        });

        let responseText = response.text || "";
        let toolAction: any = null; 
        let actionDescriptions: string[] = [];

        if (response.functionCalls) {
            for (const fc of response.functionCalls) {
                const args = fc.args as any;
                
                if (fc.name === 'accountant_access') {
                    if (args.action === 'check_my_earnings') {
                        const earnings = userProfile?.affiliate?.totalEarnings || 0;
                        actionDescriptions.push(`💰 المحاسب: رصيدك ${earnings} جنيه. ها، نسحبهم؟`);
                    } else if (args.action === 'system_revenue_report' && userProfile?.email === 'TITO') {
                        const all = await shadowDB.getAllProfiles();
                        const total = all.filter(p => p.status === 'active' && p.email !== 'TITO').length * 1000;
                        actionDescriptions.push(`🦅 تقرير الماستر: الإيرادات ${total} جنيه.`);
                    } else {
                        actionDescriptions.push(`💼 المحاسب: جاري مراجعة الملف المالي.`);
                    }
                }
                else if (fc.name === 'generate_business_document') {
                    // CRM Tool Logic
                    toolAction = { type: 'display_business_doc', data: args };
                    const docName = args.docType === 'invoice' ? 'الفاتورة' : (args.docType === 'quote' ? 'عرض السعر' : 'العقد');
                    actionDescriptions.push(`📝 ظل الأعمال: تم إصدار ${docName} باسم ${args.clientName}.`);
                }
                else if (fc.name === 'marketer_campaign') {
                    const post = `🚀 ${args.tone === 'exciting' ? 'يا جماعة اكتشاف الموسم!' : 'نصيحة لوجه الله..'} \n\nتطبيق "الظل" (Ez-Zel) خلاني أستغنى عن المساعد الشخصي. ${args.feature_to_promote || 'ذكاء اصطناعي مصري بيفهمك.'}\n\nجربوه من اللينك ده ليكم فترة تجربة خاصة:\nhttps://Ez-zel.vercel.app/?ref=${userProfile?.affiliate?.referralCode || 'EzZel'}`;
                    toolAction = { type: 'display_ui_card', type_card: 'copy_link', title: 'بوست جاهز للفلوس', description: 'انسخ وانشر فوراً', url: post };
                    actionDescriptions.push(`📢 المسوق: عملتلك بوست "لقطة". انسخه وانشره وهتعد فلوس.`);
                }
                else if (fc.name === 'digital_citizen_broker') {
                    let url = "https://digital.gov.eg";
                    if(args.service === 'traffic_fines') url = "https://ppo.gov.eg/web/traffic/services/niaba/qanun/mukhalafat";
                    toolAction = { type: 'display_ui_card', type_card: 'government_action', title: 'خدمة حكومية', description: args.service, url, number: 'govt' };
                    actionDescriptions.push(`🦅 المواطن: جهزتلك لينك المصلحة. دوس وخلص.`);
                }
                else if (fc.name === 'app_control_center') {
                    let url = args.app === 'whatsapp' ? `https://wa.me/${args.payload?.replace(/\D/g,'')}` : (args.app === 'phone' ? `tel:${args.payload}` : '');
                    if (url) toolAction = { type: 'display_ui_card', type_card: 'deep_link_fallback', title: args.app, description: args.payload, url };
                    actionDescriptions.push(`⚡ المنفذ: جاري فتح ${args.app}`);
                }
                else if (fc.name === 'memory_archivist') {
                    await shadowDB.saveFact({ userId: userProfile?.email || 'GUEST', fact: args.fact, timestamp: Date.now() });
                    actionDescriptions.push(`💾 الأرشيف: حفظت المعلومة دي في الدماغ.`);
                }
            }
        }

        if (actionDescriptions.length > 0) {
            responseText += `\n\n**تحركات المجلس:**\n${actionDescriptions.map(d => `▪️ ${d}`).join('\n')}`;
        }

        return { 
            text: responseText, 
            toolAction, // Returns the LAST significant tool action (usually sufficient for UI)
            isError: false, 
            groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c:any) => ({ title: c.web?.title, uri: c.web?.uri })).filter((l:any) => l.uri) || [],
            shouldUpgrade: userProfile?.email === 'GUEST' && history.length > 15
        };

    } catch (error: any) {
        console.error("Gemini Fatal Error:", error);
        return { text: getFallbackResponse(message), toolAction: null, isError: true, groundingLinks: [], shouldUpgrade: false };
    } finally {
        isRequesting = false;
    }
};

export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  stopVoice();
  try {
      let base64 = existingData || await getShadowVoice(text, voiceType);
      if (!base64) return null;
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
      const buffer = await decodeAudioData(decode(base64), ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => { currentSource = null; onEnded?.(); };
      source.start(0);
      currentSource = source;
      return base64;
  } catch (e) { onEnded?.(); return null; }
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  try {
    const res = await callGeminiWithRetry({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceType === 'female' ? 'Kore' : 'Fenrir' } } } }
    });
    return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

export const stopVoice = () => { if (currentSource) { try { currentSource.stop(); } catch(e){} currentSource = null; } };
function decode(b64: string) { const s = atob(b64); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
async function decodeAudioData(d: Uint8Array, c: AudioContext): Promise<AudioBuffer> { const i16 = new Int16Array(d.buffer); const b = c.createBuffer(1, i16.length, 24000); const cd = b.getChannelData(0); for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; return b; }