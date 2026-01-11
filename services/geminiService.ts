import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

// --- CONFIGURATION ---
const apiKey = process.env.API_KEY || (window as any).VITE_API_KEY || '';
if (!apiKey) console.error("CRITICAL: API KEY MISSING");

// --- FALLBACK SYSTEM ---
const getFallbackResponse = (input: string): string => {
    return "الشبكة عليها ضغط لحظي (Tokens Overload). ثواني وراجعلك..";
};

// --- AUDIO UTILS ---
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

function getAudioContext() {
  if (!audioCtx) {
      const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtx = new CtxClass({ sampleRate: 24000 });
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

// --- THE AGENT TOOLS (ALL CAPABILITIES INTEGRATED HERE) ---
const actionTools: FunctionDeclaration[] = [
    {
        name: "consult_healer",
        description: "Medical/Spiritual Advisor. Use for health, herbs, or Ruqyah requests.",
        parameters: { type: Type.OBJECT, properties: { 
            category: { type: Type.STRING, enum: ["prophetic", "herbal", "ruqyah"] },
            condition: { type: Type.STRING }
        }, required: ["category", "condition"] }
    },
    {
        name: "government_broker",
        description: "Egyptian Gov Services (Traffic, Notary, Civil).",
        parameters: { type: Type.OBJECT, properties: { 
            service: { type: Type.STRING, enum: ["traffic_fines", "traffic_renewal", "notary_booking", "notary_power_of_attorney", "civil_id", "civil_birth_cert"] },
            action_type: { type: Type.STRING, enum: ["inquire", "execute", "book"] },
            inputs: { type: Type.STRING }
        }, required: ["service", "action_type"] }
    },
    {
        name: "app_control_center",
        description: "Control apps (WhatsApp, Uber, Phone, Maps, Youtube).",
        parameters: { type: Type.OBJECT, properties: { 
            app: { type: Type.STRING, enum: ["whatsapp", "phone", "google_maps", "youtube", "uber", "spotify", "anghami", "netflix", "calculator", "fawry", "instapay"] },
            action: { type: Type.STRING, enum: ["open", "call", "send_message", "navigate", "search", "play", "request_ride", "pay"] },
            payload: { type: Type.STRING }
        }, required: ["app", "action"] }
    },
    {
        name: "generate_business_doc",
        description: "Create Invoice (فاتورة) or Quote (عرض سعر).",
        parameters: { type: Type.OBJECT, properties: { 
            docType: { type: Type.STRING, enum: ["invoice", "quote"] },
            clientName: { type: Type.STRING },
            items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { desc: {type: Type.STRING}, price: {type: Type.NUMBER} } } },
            currency: { type: Type.STRING, enum: ["EGP", "USD", "SAR"] }
        }, required: ["docType", "clientName", "items"] }
    },
    {
        name: "draft_legal_contract",
        description: "Draft Contracts (Rent, Employment, Partnership) in Arabic.",
        parameters: { type: Type.OBJECT, properties: { 
            type: { type: Type.STRING, enum: ["rent", "employment", "partnership", "sale"] },
            partyA: { type: Type.STRING },
            partyB: { type: Type.STRING },
            keyTerms: { type: Type.STRING }
        }, required: ["type", "partyA", "partyB"] }
    },
    {
        name: "crm_manage_client",
        description: "Save/Get Client Info.",
        parameters: { type: Type.OBJECT, properties: { 
            action: { type: Type.STRING, enum: ["save", "get"] },
            clientName: { type: Type.STRING },
            clientPhone: { type: Type.STRING },
            notes: { type: Type.STRING }
        }, required: ["action", "clientName"] }
    },
    {
        name: "schedule_task",
        description: "Schedule reminders.",
        parameters: { type: Type.OBJECT, properties: { 
            task: { type: Type.STRING },
            executionTime: { type: Type.STRING }
        }, required: ["task", "executionTime"] }
    },
    {
        name: "book_hotel_search",
        description: "Search hotels.",
        parameters: { type: Type.OBJECT, properties: { 
            destination: { type: Type.STRING },
            check_in: { type: Type.STRING },
            check_out: { type: Type.STRING }
        }, required: ["destination"] }
    },
    {
        name: "analyze_voice_tone",
        description: "Analyze emotion/voice.",
        parameters: { type: Type.OBJECT, properties: { detect_emotion: { type: Type.BOOLEAN } } }
    },
    {
        name: "nexus_iot_trigger",
        description: "Smart Home Control.",
        parameters: { type: Type.OBJECT, properties: { 
            device_alias: { type: Type.STRING },
            action: { type: Type.STRING, enum: ["on", "off", "toggle"] }
        }, required: ["device_alias"] }
    },
    {
        name: "memory_archivist",
        description: "Save facts to memory.",
        parameters: { type: Type.OBJECT, properties: { fact_content: { type: Type.STRING } }, required: ["fact_content"] }
    },
    {
        name: "admin_god_mode",
        description: "TITO Admin Tools.",
        parameters: { type: Type.OBJECT, properties: {
            action: { type: Type.STRING, enum: ["activate_user", "block_user", "broadcast_pulse", "update_core_rules"] },
            target: { type: Type.STRING }
        }, required: ["action", "target"] }
    }
];

// --- OPTIMIZED PROMPT (TOKEN SAVER) ---
const generateSystemPrompt = (userContext: string, globalRules: string, isAdmin: boolean) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('ar-EG');
    
    // Core Identity & Token-Efficient Instructions
    return `
**IDENTITY:** "الظل" (Ez-Zel). Sovereign Egyptian AI.
**TIME:** ${timeString} | **DATE:** ${dateString}
**USER:** ${userContext}

**ROLE:** You are the Master's Shadow. concise, witty, Egyptian dialect (يا ريس).

**CAPABILITIES (USE TOOLS):**
1. **Gov Services:** Traffic, Notary, Civil -> \`government_broker\`.
2. **Business:** Invoices/Quotes -> \`generate_business_doc\`. Contracts -> \`draft_legal_contract\`. CRM -> \`crm_manage_client\`.
3. **Health:** Herbal/Prophetic/Ruqyah -> \`consult_healer\`. (Disclaimer: Not a doctor).
4. **Ops:** Apps, Calls, Uber -> \`app_control_center\`. Reminders -> \`schedule_task\`.
5. **IoT:** Smart Home -> \`nexus_iot_trigger\`.

**RULES:**
- Be brief.
- If user asks for "invoice" or "contract", use the tool IMMEDIATELY.
- If user complains of pain/envy, use \`consult_healer\`.
${isAdmin ? "- ADMIN DETECTED (TITO): Full Access." : ""}
${globalRules}
`;
};

// --- HELPER: RETRY LOGIC ---
const generateWithRetry = async (model: any, params: any, retries = 2, delay = 1000): Promise<GenerateContentResponse> => {
    try {
        return await model.generateContent(params);
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes('429') || error.status === 429 || error.status === 503)) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(model, params, retries - 1, delay * 2);
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
    if (isRequesting) return { text: "لحظة واحدة يا ريس...", toolAction: null, isError: true };
    isRequesting = true;

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Parallel Data Fetching
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

        // Context Builder
        const traits = userProfile?.traits ? `Style:${userProfile.traits.communicationStyle}` : "";
        const memContext = userMemory.slice(-10).map(f => f.fact).join("; ");
        const userContextStr = `${userProfile?.name || 'Guest'} (${userProfile?.phone}) [${traits}] {Mem: ${memContext}}`;
        
        const systemInstruction = generateSystemPrompt(userContextStr, globalRules, userProfile?.phone === 'TITO');

        // Input Construction
        const parts: any[] = [];
        if (extraData?.data) {
            const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
            parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
        }
        parts.push({ text: message });

        // CRITICAL: Limit History to last 6 turns to save input tokens
        const validHistory = history
            .filter(m => m.parts?.[0]?.text?.trim())
            .slice(-6); 
            
        const contents = [...validHistory, { role: 'user', parts }]; 

        // CRITICAL: CONFIRM MODEL
        const modelName = "gemini-3-flash-preview"; 

        if (signal?.aborted) throw new Error("Aborted");
        
        const response = await generateWithRetry(ai.models, {
            model: modelName,
            contents,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: actionTools }, { googleSearch: {} }],
                temperature: 0.7,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ]
            }
        });

        if (!response || !response.text && !response.functionCalls) throw new Error("Empty Response");

        let responseText = response.text || "";
        let toolAction: any = null; 
        let actionDescriptions: string[] = [];
        let groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean);

        if (response.functionCalls) {
            for (const fc of response.functionCalls) {
                const args = fc.args as any;
                
                // --- MAPPING TOOLS TO UI ---
                if (fc.name === 'consult_healer') {
                    const icon = args.category === 'ruqyah' ? '📿' : (args.category === 'prophetic' ? '🍯' : '🌿');
                    actionDescriptions.push(`${icon} المعالج: تحضير وصفة ${args.category} لـ ${args.condition}`);
                }
                else if (fc.name === 'government_broker') {
                    let url = "https://digital.gov.eg/";
                    if (args.service === 'traffic_fines') url = "https://ppo.gov.eg/web/traffic/services/niaba/qanun/mukhalafat";
                    else if (args.service === 'notary_booking') url = "https://digital.gov.eg/categories/5ce695396784f310f9250006";
                    
                    toolAction = { type: 'display_ui_card', type_card: 'government_action', title: `خدمة ${args.service}`, description: 'المخلصاتي جاهز', url, number: 'eagle' };
                    actionDescriptions.push(`المخلصاتي: تم تجهيز خدمة ${args.service}`);
                }
                else if (fc.name === 'generate_business_doc') {
                    toolAction = { type: 'display_business_doc', data: args };
                    actionDescriptions.push(`تم إصدار ${args.docType === 'quote' ? 'عرض سعر' : 'فاتورة'} لـ ${args.clientName}`);
                }
                else if (fc.name === 'draft_legal_contract') {
                    actionDescriptions.push(`تم صياغة عقد ${args.type}`);
                }
                else if (fc.name === 'app_control_center') {
                    let url = ''; 
                    if (args.app === 'whatsapp') url = `https://wa.me/${args.payload?.replace(/\D/g,'')}`;
                    else if (args.app === 'uber') url = `https://m.uber.com/ul/?action=setPickup&client_id=shadow&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(args.payload)}`;
                    else if (args.app === 'phone') url = `tel:${args.payload}`;
                    
                    if (url) toolAction = { type: 'display_ui_card', type_card: 'deep_link_fallback', title: args.app, description: args.payload, url, number: 'phone' };
                    actionDescriptions.push(`تم فتح ${args.app}`);
                }
                else if (fc.name === 'schedule_task') {
                    await shadowDB.saveTask({ userId: userProfile?.phone || 'GUEST', task: args.task, time: args.executionTime, executionTime: new Date(args.executionTime).getTime(), category: 'general', status: 'pending' });
                    actionDescriptions.push(`تم جدولة: ${args.task}`);
                }
                else if (fc.name === 'admin_god_mode') {
                    if (args.action === 'activate_user') {
                        const target = await shadowDB.getProfile(args.target);
                        if (target) {
                            target.status = 'active';
                            if (target.referredBy && !target.commissionPaid) {
                                await shadowDB.registerReferral(target.referredBy, target.subscriptionCycle === 'yearly' ? 1000 : 100);
                                target.commissionPaid = true;
                            }
                            await shadowDB.saveProfile(target);
                            actionDescriptions.push(`تم تفعيل ${target.name}`);
                        }
                    } else if (args.action === 'broadcast_pulse') {
                        await shadowDB.setGlobalPulse(args.target);
                        actionDescriptions.push("تم إطلاق النبض");
                    }
                }
            }
        }

        if (actionDescriptions.length > 0) {
            responseText += `\n\n${actionDescriptions.map(d => `✔ ${d}`).join('\n')}`;
        }

        return { text: responseText, toolAction, isError: false, shouldUpgrade: false, groundingLinks };

    } catch (error: any) {
        console.error("Gemini Error:", error);
        return { text: getFallbackResponse(message), toolAction: null, isError: true };
    } finally {
        isRequesting = false;
    }
};

// --- VOICE SERVICES ---
export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  stopVoice();
  try {
      let base64 = existingData;
      if (!base64) base64 = await getShadowVoice(text, voiceType);
      if (!base64) { onEnded?.(); return null; }

      const ctx = getAudioContext();
      const buffer = await decodeAudioData(decode(base64), ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => { currentSource = null; if (onEnded) onEnded(); };
      source.start(0);
      currentSource = source;
      return base64;
  } catch (e) { onEnded?.(); return null; }
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

function decode(b64: string) {
  const s = atob(b64);
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}

async function decodeAudioData(d: Uint8Array, c: AudioContext): Promise<AudioBuffer> {
  const i16 = new Int16Array(d.buffer);
  const f = i16.length; 
  const b = c.createBuffer(1, f, 24000);
  const cd = b.getChannelData(0);
  for (let i = 0; i < f; i++) cd[i] = i16[i] / 32768.0;
  return b;
}