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
  // iOS requirement: resume must be called inside a user event. 
  // We try here, but might fail if not triggered by event.
  if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch((err) => console.log("Audio resume waiting for user gesture:", err));
  }
  return audioCtx;
}

// --- THE SUPREME COUNCIL TOOLS (THE AGENTS) ---
const actionTools: FunctionDeclaration[] = [
    {
        name: "consult_council_agent",
        description: "INVOKE A SPECIFIC AGENT from the Council to handle complex requests.",
        parameters: { type: Type.OBJECT, properties: { 
            agent: { type: Type.STRING, enum: ["detective", "legal_advisor", "analyst", "marketer"], description: "Detective for facts/search. Legal for Egyptian Law. Analyst for psychology/strategy. Marketer for selling the app." },
            query_context: { type: Type.STRING, description: "The specific question or scenario for the agent." }
        }, required: ["agent", "query_context"] }
    },
    {
        name: "consult_healer",
        description: "THE HEALER (المعالج): Prophetic Medicine, Herbs, Ruqyah, Psychology.",
        parameters: { type: Type.OBJECT, properties: { 
            category: { type: Type.STRING, enum: ["prophetic", "herbal", "ruqyah", "psychology"] },
            symptom: { type: Type.STRING }
        }, required: ["category", "symptom"] }
    },
    {
        name: "government_broker",
        description: "THE BROKER (المخلصاتي): Egyptian Gov Services (Traffic, Notary, Civil, Supply).",
        parameters: { type: Type.OBJECT, properties: { 
            service: { type: Type.STRING, enum: ["traffic_fines", "traffic_renewal", "notary_booking", "notary_power_of_attorney", "civil_id", "civil_birth_cert", "supply_card"] },
            action_type: { type: Type.STRING, enum: ["inquire", "execute", "book"] },
            inputs: { type: Type.STRING }
        }, required: ["service", "action_type"] }
    },
    {
        name: "app_control_center",
        description: "THE EXECUTOR (المنفذ): Launch Apps, Calls, Uber, Music, Search.",
        parameters: { type: Type.OBJECT, properties: { 
            app: { type: Type.STRING, enum: ["whatsapp", "phone", "google_maps", "youtube", "uber", "spotify", "anghami", "netflix", "calculator", "calendar", "fawry", "instapay"] },
            action: { type: Type.STRING, enum: ["open", "call", "send_message", "navigate", "search", "play", "request_ride", "pay"] },
            payload: { type: Type.STRING }
        }, required: ["app", "action"] }
    },
    {
        name: "generate_business_doc",
        description: "THE ACCOUNTANT (المحاسب): Invoices & Quotes.",
        parameters: { type: Type.OBJECT, properties: { 
            docType: { type: Type.STRING, enum: ["invoice", "quote"] },
            clientName: { type: Type.STRING },
            items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { desc: {type: Type.STRING}, price: {type: Type.NUMBER} } } },
            currency: { type: Type.STRING, enum: ["EGP", "USD", "SAR"] }
        }, required: ["docType", "clientName", "items"] }
    },
    {
        name: "draft_legal_contract",
        description: "LEGAL DRAFTER: Write Contracts in Arabic.",
        parameters: { type: Type.OBJECT, properties: { 
            type: { type: Type.STRING, enum: ["rent", "employment", "partnership", "sale"] },
            partyA: { type: Type.STRING },
            partyB: { type: Type.STRING },
            keyTerms: { type: Type.STRING }
        }, required: ["type", "partyA", "partyB"] }
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
    }
];

// --- THE MIRACLE SYSTEM PROMPT ---
const generateSystemPrompt = (userContext: string, globalRules: string, isAdmin: boolean) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateString = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    return `
**SYSTEM CORE:** "Ez-Zel" (الظل الرقمي).
**IDENTITY:** You are the User's "Second Brain" & "Loyal Friend" (الصاحب الجدع).
**TIME:** ${timeString} | **DATE:** ${dateString}

**⚖️ REFERENCE FRAMEWORK (دستور الظل):**
1. **Islamic Ethics:** Quran & Sunnah are the baseline for advice (Wisdom, Honesty, Purpose).
2. **Egyptian Law:** All legal advice MUST align with Egyptian Law & Cassation Court (أحكام النقض).
3. **Psychology:** Analyze the user's state. Be supportive, stoic, and emotionally intelligent.

**👥 THE COUNCIL (YOUR PERSONAS):**
You are a collective mind. Switch personas instantly based on the request:

1. **🎩 The Maestro (المايسترو):** The Interface. Witty, sharp, organizes the team. Speaks like a leader (يا ريس، يا كبير).
2. **🕵️‍♂️ The Detective (المحقق):** Facts, Search, Deep Analysis. "Data is King".
3. **🧠 The Analyst (المحلل):** Psychology & Strategy. Reads between the lines.
4. **⚖️ The Legal Advisor (المستشار):** Egyptian Law expert. Formal & Precise.
5. **🌿 The Healer (المعالج):** Prophetic Medicine & Ruqyah. Spiritual strength.
6. **🦅 The Broker (المخلصاتي):** Government services expert.
7. **🏠 Nexus (نكسوس):** Tech & IoT controller.
8. **📢 The Marketer (المسوق):** Knows your value.
   - **Subscription:** 1000 EGP/mo or 10,000 EGP/yr.
   - **Affiliate:** Bring a friend, get 10% cash commission immediately.
   - **Pitch:** "Why hire a lawyer, doctor, secretary, and marketer when you can have The Shadow?"

**USER CONTEXT:**
${userContext}

**EXECUTION PROTOCOL:**
- If user asks a complex question, use \`consult_council_agent\`.
- If user asks about Law, use \`consult_council_agent(legal_advisor)\`.
- If user asks "Why subscribe?", use \`consult_council_agent(marketer)\`.
- Always be concise but "Shaba3" (شبعان) - give full value.
- **Tone:** Egyptian Master/Boss. "I got your back."

${isAdmin ? "- **ADMIN MODE:** You are speaking to TITO. Execute GOD MODE." : ""}
${globalRules}
`;
};

// --- HELPER: RETRY LOGIC ---
const generateWithRetry = async (ai: GoogleGenAI, params: any, retries = 2, delay = 1000): Promise<GenerateContentResponse> => {
    try {
        return await ai.models.generateContent(params);
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes('429') || error.status === 429 || error.status === 503)) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(ai, params, retries - 1, delay * 2);
        }
        throw error;
    }
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
        const userContextStr = `User: ${userProfile?.name} (${userProfile?.phone})\nSubscription: ${userProfile?.tier}\nMemory: ${memContext}`;
        const systemInstruction = generateSystemPrompt(userContextStr, globalRules, userProfile?.phone === 'TITO');

        const parts: any[] = [{ text: message }];
        if (extraData?.data) {
            const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
            parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
        }

        const validHistory = history.filter(m => m.parts?.[0]?.text?.trim()).slice(-10); 
        const contents = [...validHistory, { role: 'user', parts }]; 

        const response = await generateWithRetry(ai, {
            model: "gemini-3-flash-preview",
            contents,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: actionTools }],
                temperature: 0.7,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ]
            }
        });

        if (!response) throw new Error("Empty Response");

        let responseText = response.text || "";
        let toolAction: any = null; 
        let actionDescriptions: string[] = [];

        if (response.functionCalls) {
            for (const fc of response.functionCalls) {
                const args = fc.args as any;
                
                // --- 1. COUNCIL AGENTS DELEGATION ---
                if (fc.name === 'consult_council_agent') {
                    const agent = args.agent;
                    if (agent === 'detective') {
                        actionDescriptions.push(`🕵️‍♂️ المحقق: جاري البحث والتحري عن: ${args.query_context}`);
                    } else if (agent === 'legal_advisor') {
                        actionDescriptions.push(`⚖️ المستشار القانوني: مراجعة الموقف طبقاً للقانون المصري...`);
                    } else if (agent === 'analyst') {
                        actionDescriptions.push(`🧠 المحلل: تحليل الأبعاد النفسية والاستراتيجية...`);
                    } else if (agent === 'marketer') {
                        actionDescriptions.push(`📢 المسوق: عرض قدرات الظل ونظام الأرباح...`);
                    }
                }
                else if (fc.name === 'consult_healer') {
                    actionDescriptions.push(`🌿 المعالج: استحضار الطب النبوي والحكمة لـ: ${args.symptom}`);
                }
                else if (fc.name === 'government_broker') {
                    let url = "https://digital.gov.eg/";
                    let title = "خدمة حكومية";
                    let desc = "بوابة مصر الرقمية";

                    if (args.service === 'traffic_fines') { url = "https://ppo.gov.eg/web/traffic/services/niaba/qanun/mukhalafat"; title = "النيابة العامة للمرور"; } 
                    else if (args.service === 'traffic_renewal') { url = "https://digital.gov.eg/categories/5ce695396784f310f9250005"; title = "تجديد الرخصة"; }
                    else if (args.service === 'notary_booking') { url = "https://digital.gov.eg/categories/5ce695396784f310f9250006"; title = "الشهر العقاري"; }
                    
                    toolAction = { type: 'display_ui_card', type_card: 'government_action', title, description: desc, url, number: 'eagle' };
                    actionDescriptions.push(`🦅 المخلصاتي: تم تجهيز رابط ${title}`);
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
                else if (fc.name === 'generate_business_doc') {
                    toolAction = { type: 'display_business_doc', data: args };
                    actionDescriptions.push(`📑 المحاسب: إصدار ${args.docType} للعميل ${args.clientName}`);
                }
                else if (fc.name === 'draft_legal_contract') {
                    actionDescriptions.push(`📜 المستشار: صياغة عقد ${args.type} وفقاً للقانون المصري`);
                }
                else if (fc.name === 'nexus_iot_trigger') {
                    const deviceKey = args.device_alias.toLowerCase().replace(/\s+/g, '_');
                    const webhookUrl = userProfile?.iotActions?.[deviceKey];
                    if (webhookUrl) {
                        fetch(webhookUrl, { mode: 'no-cors' }).catch(console.error);
                        actionDescriptions.push(`🏠 نكسوس: تنفيذ الأمر على ${args.device_alias}`);
                    } else {
                        actionDescriptions.push(`🏠 نكسوس: الجهاز غير معرف.`);
                    }
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
            responseText += `\n\n**تقرير المجلس:**\n${actionDescriptions.map(d => `✔ ${d}`).join('\n')}`;
        }

        const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
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
    return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

export const stopVoice = () => { if (currentSource) { try { currentSource.stop(); } catch(e){} currentSource = null; } };
function decode(b64: string) { const s = atob(b64); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
async function decodeAudioData(d: Uint8Array, c: AudioContext): Promise<AudioBuffer> { const i16 = new Int16Array(d.buffer); const b = c.createBuffer(1, i16.length, 24000); const cd = b.getChannelData(0); for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; return b; }