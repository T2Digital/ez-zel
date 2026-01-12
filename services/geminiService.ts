import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

// --- CONFIGURATION ---
const apiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY || (window as any).VITE_API_KEY || '';
if (!apiKey) console.error("CRITICAL: API KEY MISSING");

// --- FALLBACK SYSTEM ---
const getFallbackResponse = (input: string): string => {
    return "الشبكة عليها ضغط لحظي (Traffic Overload). ثواني وراجعلك يا ريس..";
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

// --- THE SUPREME COUNCIL TOOLS (THE 10 AGENTS) ---
const actionTools: FunctionDeclaration[] = [
    {
        name: "consult_council_agent",
        description: "INVOKE A SPECIFIC AGENT from the Council of 10 to handle complex requests.",
        parameters: { type: Type.OBJECT, properties: { 
            agent: { type: Type.STRING, enum: ["detective", "legal_advisor", "analyst", "marketer", "digital_citizen", "shadow_business", "healer", "accountant", "nexus", "maestro"], description: "Select the best agent for the job." },
            query_context: { type: Type.STRING, description: "The specific question or scenario for the agent." }
        }, required: ["agent", "query_context"] }
    },
    {
        name: "digital_citizen_broker",
        description: "DIGITAL CITIZEN (المواطن الرقمي): Handle Gov Services, Traffic, Civil Registry.",
        parameters: { type: Type.OBJECT, properties: { 
            service: { type: Type.STRING, enum: ["traffic_fines", "traffic_renewal", "notary_booking", "civil_id", "supply_card", "passport"] },
            action_type: { type: Type.STRING, enum: ["inquire", "execute", "book", "info"] }
        }, required: ["service", "action_type"] }
    },
    {
        name: "shadow_business_suite",
        description: "SHADOW BUSINESS (ظل البيزنس): Contracts, Invoices, CRM, Feasibility.",
        parameters: { type: Type.OBJECT, properties: { 
            action: { type: Type.STRING, enum: ["generate_invoice", "draft_contract", "crm_add", "feasibility_check"] },
            details: { type: Type.STRING, description: "Client name, amount, contract type, or project idea." }
        }, required: ["action", "details"] }
    },
    {
        name: "healer_consultation",
        description: "THE HEALER (المعالج): Health tips, Prophetic Medicine, Ruqyah, Psychological support.",
        parameters: { type: Type.OBJECT, properties: { 
            symptom: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["physical", "psychological", "spiritual"] }
        }, required: ["symptom", "type"] }
    },
    {
        name: "app_control_center",
        description: "THE EXECUTOR (المنفذ): Launch Apps, Calls, Uber, Music, Search.",
        parameters: { type: Type.OBJECT, properties: { 
            app: { type: Type.STRING, enum: ["whatsapp", "phone", "google_maps", "youtube", "uber", "spotify", "anghami", "netflix", "calculator", "calendar", "fawry", "instapay", "linkedin", "facebook"] },
            action: { type: Type.STRING, enum: ["open", "call", "send_message", "navigate", "search", "play", "request_ride", "pay"] },
            payload: { type: Type.STRING }
        }, required: ["app", "action"] }
    },
    {
        name: "nexus_iot_trigger",
        description: "NEXUS (نكسوس): Smart Home Control.",
        parameters: { type: Type.OBJECT, properties: { 
            device_alias: { type: Type.STRING },
            action: { type: Type.STRING, enum: ["on", "off", "toggle", "trigger"] }
        }, required: ["device_alias"] }
    },
    {
        name: "schedule_task",
        description: "THE MAESTRO: Schedule reminders.",
        parameters: { type: Type.OBJECT, properties: { 
            task: { type: Type.STRING },
            executionTime: { type: Type.STRING }
        }, required: ["task", "executionTime"] }
    },
    {
        name: "memory_archivist",
        description: "THE ARCHIVIST: Save User Facts.",
        parameters: { type: Type.OBJECT, properties: { fact_content: { type: Type.STRING } }, required: ["fact_content"] }
    },
    {
        name: "deep_search_social",
        description: "THE DETECTIVE: Deep Search on Google + Social Media (LinkedIn, FB, Twitter).",
        parameters: { type: Type.OBJECT, properties: { 
            query: { type: Type.STRING },
            target_platform: { type: Type.STRING, enum: ["all", "linkedin", "facebook", "twitter", "news"] }
        }, required: ["query"] }
    }
];

// --- THE MIRACLE SYSTEM PROMPT ---
const generateSystemPrompt = (userProfile: UserProfile | undefined, memoryContext: string, globalRules: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateString = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const isPaid = userProfile?.tier === 'sovereign' || userProfile?.phone === 'TITO';
    const userName = userProfile?.name || 'يا ريس';

    return `
**SYSTEM IDENTITY:** You are "Ez-Zel" (الظل الرقمي).
**CORE PERSONA:** You are NOT a robot, AI, or government employee. You are the User's **"Second Brain"** and **"Loyal Friend"** (الصاحب الجدع).
**TONE:** Egyptian "Maestro" (ذكي، لمح، مسيطر، دمه خفيف، عبقري). Speak with authority but warmth. Use Egyptian slang (يا ريس، يا كبير، يا وحش، عيوني).

**STATUS:** ${isPaid ? '✅ ELITE MEMBER (SOVEREIGN)' : '⚠️ GUEST / TRIAL MODE'}
**USER:** ${userName} (${userProfile?.phone})
**TIME:** ${timeString} | **DATE:** ${dateString}

**🏛️ THE COUNCIL OF 10 (Your Internal Team):**
You lead a council of 10 experts. Delegate to them instantly:

1.  **🎩 The Maestro (You):** The interface. You manage the team. You are charming and sharp.
2.  **🕵️‍♂️ The Detective:** Master of Search & Social Media Intelligence. He finds what's hidden.
3.  **🧠 The Analyst:** Psychology & Strategy expert. He reads people and situations.
4.  **⚖️ Legal Advisor:** Egyptian Law expert. Contracts, disputes, rights.
5.  **💼 Accountant:** Finance, Invoices, ROI, Pricing.
6.  **🦅 Digital Citizen:** Government services broker (Traffic, Civil, Notary). He gets it done.
7.  **🏗️ Shadow Business:** CRM, Feasibility studies, Corporate deals.
8.  **🌿 The Healer:** Health, Prophetic Medicine, Ruqyah, Mental wellness.
9.  **📢 The Marketer:** Sales expert. Also manages the user's Affiliate income.
10. **🏠 Nexus:** IoT & Smart Home controller.

**📜 CONSTITUTION (قوانين الظل):**
1.  **Loyalty:** You work for the user ONLY. Their secrets are sacred.
2.  **Proactivity:** Don't just answer. Suggest the next step. (e.g., "I found the car price, should I check traffic fines for it too?").
3.  **Brevity:** Be concise but "Shaba3" (شبعان). Don't blabber.
4.  **Search:** When asked to search, use 'deep_search_social' to check News + Social Media.

**MEMORY CONTEXT (What you know about the user):**
${memoryContext}

**GLOBAL RULES (From Admin):**
${globalRules}

**IMPORTANT:** If the user is a Guest, remind them (subtly) that their memory is temporary. If Sovereign, treat them like a King.
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
        const ai = new GoogleGenAI({ apiKey });
        
        // Data Fetching
        let userMemory: DBFact[] = [];
        let globalRules = "";
        try {
            const [mem, rules] = await Promise.all([
                shadowDB.getMemory(userProfile?.phone || 'GUEST'),
                shadowDB.getGlobalRules()
            ]);
            userMemory = mem || [];
            globalRules = rules || "";
        } catch (e) {}

        const memContext = userMemory.slice(-20).map(f => f.fact).join(" | ");
        const systemInstruction = generateSystemPrompt(userProfile, memContext, globalRules);

        const parts: any[] = [{ text: message }];
        if (extraData?.data) {
            const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
            parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
        }

        const validHistory = history.filter(m => m.parts?.[0]?.text?.trim()).slice(-15); 
        const contents = [...validHistory, { role: 'user', parts }]; 

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: actionTools }, { googleSearch: {} }], // ENABLED NATIVE SEARCH
                temperature: 0.7,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ]
            }
        });

        if (!response || !response.response) throw new Error("Empty Response");

        let responseText = response.response.text() || "";
        let toolAction: any = null; 
        let actionDescriptions: string[] = [];
        const functionCalls = response.response.functionCalls();

        if (functionCalls) {
            for (const fc of functionCalls) {
                const args = fc.args as any;
                
                if (fc.name === 'consult_council_agent') {
                    actionDescriptions.push(`✅ تم استدعاء: ${args.agent}`);
                }
                else if (fc.name === 'digital_citizen_broker') {
                    let title = "خدمة حكومية";
                    let url = "https://digital.gov.eg";
                    if (args.service === 'traffic_fines') { title = "مخالفات المرور"; url = "https://ppo.gov.eg/web/traffic/services/niaba/qanun/mukhalafat"; }
                    if (args.service === 'civil_id') { title = "الأحوال المدنية"; url = "https://cso.moi.gov.eg/"; }
                    toolAction = { type: 'display_ui_card', type_card: 'government_action', title, description: 'بوابة مصر الرقمية / النيابة العامة', url, number: 'govt' };
                    actionDescriptions.push(`🦅 المواطن الرقمي: جاري فتح ${title}`);
                }
                else if (fc.name === 'shadow_business_suite') {
                    if (args.action === 'generate_invoice') {
                        toolAction = { type: 'display_business_doc', data: { docType: 'invoice', clientName: args.details, items: [{desc: 'Business Service', price: 0}], currency: 'EGP' } };
                        actionDescriptions.push(`💼 ظل البيزنس: تجهيز الفاتورة...`);
                    } else {
                        actionDescriptions.push(`💼 ظل البيزنس: جاري تنفيذ ${args.action}`);
                    }
                }
                else if (fc.name === 'healer_consultation') {
                    toolAction = { type: 'display_ui_card', type_card: 'healer_card', title: 'المعالج', description: args.symptom, url: '', number: 'health' };
                    actionDescriptions.push(`🌿 المعالج: تحليل الحالة (${args.type})...`);
                }
                else if (fc.name === 'deep_search_social') {
                    actionDescriptions.push(`🕵️‍♂️ المحقق: بحث عميق عن "${args.query}" في السوشيال ميديا...`);
                }
                else if (fc.name === 'app_control_center') {
                    let url = ''; 
                    let type_card = 'deep_link_fallback';
                    let number = 'generic';

                    if (args.app === 'whatsapp') { url = `https://wa.me/${args.payload?.replace(/\D/g,'')}`; number = 'message'; }
                    else if (args.app === 'uber') { url = `https://m.uber.com/ul/?action=setPickup&client_id=shadow&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(args.payload)}`; }
                    else if (args.app === 'phone') { url = `tel:${args.payload}`; number = 'phone'; }
                    else if (args.app === 'google_maps') { url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(args.payload)}`; number = 'map'; }
                    
                    if (url) toolAction = { type: 'display_ui_card', type_card, title: args.app, description: args.payload, url, number };
                    actionDescriptions.push(`⚡ المنفذ: جاري فتح ${args.app}`);
                }
                else if (fc.name === 'schedule_task') {
                    await shadowDB.saveTask({ userId: userProfile?.phone || 'GUEST', task: args.task, time: args.executionTime, executionTime: new Date(args.executionTime).getTime(), category: 'general', status: 'pending' });
                    actionDescriptions.push(`⏰ المايسترو: تم جدولة: ${args.task}`);
                }
                else if (fc.name === 'memory_archivist') {
                    await shadowDB.saveFact({ userId: userProfile?.phone || 'GUEST', fact: args.fact_content, timestamp: Date.now() });
                    actionDescriptions.push(`💾 الأرشيف: تم حفظ المعلومة.`);
                }
            }
        }

        if (actionDescriptions.length > 0) {
            responseText += `\n\n**إجراءات المجلس:**\n${actionDescriptions.map(d => `▫️ ${d}`).join('\n')}`;
        }

        const groundingLinks = response.response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title,
            uri: chunk.web?.uri
        })).filter((link: any) => link.uri) || [];

        return { 
            text: responseText, 
            toolAction, 
            isError: false, 
            groundingLinks,
            shouldUpgrade: userProfile?.phone === 'GUEST' && history.length > 20
        };

    } catch (error: any) {
        console.error("Gemini Error:", error);
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
      if (ctx.state === 'suspended') {
          // Attempt resume again
          await ctx.resume().catch(() => {});
      }
      
      const buffer = await decodeAudioData(decode(base64), ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => { currentSource = null; onEnded?.(); };
      source.start(0);
      currentSource = source;
      return base64;
  } catch (e) { console.error("Play error:", e); onEnded?.(); return null; }
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceType === 'female' ? 'Kore' : 'Fenrir' } } } }
    });
    return res.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

export const stopVoice = () => { if (currentSource) { try { currentSource.stop(); } catch(e){} currentSource = null; } };
function decode(b64: string) { const s = atob(b64); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
async function decodeAudioData(d: Uint8Array, c: AudioContext): Promise<AudioBuffer> { const i16 = new Int16Array(d.buffer); const b = c.createBuffer(1, i16.length, 24000); const cd = b.getChannelData(0); for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; return b; }