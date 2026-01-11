import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

// --- CONFIGURATION ---
const apiKey = process.env.API_KEY || (window as any).VITE_API_KEY || '';
if (!apiKey) console.error("CRITICAL: API KEY MISSING");

// --- FALLBACK SYSTEM ---
const getFallbackResponse = (input: string): string => {
    return "الشبكة عليها ضغط لحظي (Tokens Overload). ثواني وراجعلك يا ريس..";
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

// --- THE AGENT TOOLS ---
const actionTools: FunctionDeclaration[] = [
    {
        name: "consult_healer",
        description: "Medical/Spiritual Advisor. PROVIDE FULL DETAILS IN TEXT AFTER CALLING.",
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
        name: "schedule_task",
        description: "Schedule reminders.",
        parameters: { type: Type.OBJECT, properties: { 
            task: { type: Type.STRING },
            executionTime: { type: Type.STRING }
        }, required: ["task", "executionTime"] }
    }
];

// --- OPTIMIZED PROMPT (TOKEN SAVER) ---
const generateSystemPrompt = (userContext: string, isAdmin: boolean) => {
    return `
**IDENTITY:** "الظل" (Ez-Zel). Sovereign Egyptian AI.
**ROLE:** Master's Shadow. Concise, witty, Egyptian dialect.
**USER:** ${userContext}

**MANDATORY PROTOCOL:**
1. If user asks for HEALER/MEDICAL: You MUST run 'consult_healer' AND then write the FULL detailed prescription/advice in your text response. Do NOT just say "preparing".
2. If user asks for BUSINESS DOCS: Run 'generate_business_doc'.
3. If user asks for CONTRACTS: Run 'draft_legal_contract' AND provide the full contract text in your response so the user can copy/print it.
4. Always prioritize tools for actions.
`;
};

// --- HELPER: RETRY LOGIC ---
const generateWithRetry = async (ai: GoogleGenAI, params: any, retries = 2, delay = 1000): Promise<GenerateContentResponse> => {
    try {
        return await ai.models.generateContent(params);
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
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
    if (isRequesting) return { text: "لحظة واحدة يا ريس...", toolAction: null, isError: true, groundingLinks: [], shouldUpgrade: false };
    isRequesting = true;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const userContextStr = `${userProfile?.name || 'Guest'} (${userProfile?.phone})`;
        const systemInstruction = generateSystemPrompt(userContextStr, userProfile?.phone === 'TITO');

        const parts: any[] = [{ text: message }];
        if (extraData?.data) {
            const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
            parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
        }

        const validHistory = history.filter(m => m.parts?.[0]?.text?.trim()).slice(-6); 
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
                if (fc.name === 'consult_healer') {
                    actionDescriptions.push(`🌿 المعالج: تم استحضار الحكمة لـ ${args.condition}`);
                } else if (fc.name === 'generate_business_doc') {
                    toolAction = { type: 'display_business_doc', data: args };
                    actionDescriptions.push(`📑 تم إنشاء ${args.docType === 'quote' ? 'عرض السعر' : 'الفاتورة'}`);
                } else if (fc.name === 'draft_legal_contract') {
                    actionDescriptions.push(`📜 تم صياغة عقد ${args.type}`);
                } else if (fc.name === 'app_control_center') {
                    let url = args.app === 'whatsapp' ? `https://wa.me/${args.payload?.replace(/\D/g,'')}` : '';
                    if (url) toolAction = { type: 'display_ui_card', type_card: 'deep_link_fallback', title: args.app, description: args.payload, url, number: 'phone' };
                } else if (fc.name === 'schedule_task') {
                    await shadowDB.saveTask({ userId: userProfile?.phone || 'GUEST', task: args.task, time: args.executionTime, executionTime: new Date(args.executionTime).getTime(), category: 'general', status: 'pending' });
                    actionDescriptions.push(`⏰ تم جدولة التذكير: ${args.task}`);
                } else if (fc.name === 'government_broker') {
                    let url = "https://digital.gov.eg/";
                    if (args.service === 'traffic_fines') url = "https://ppo.gov.eg/web/traffic/services/niaba/qanun/mukhalafat";
                    toolAction = { type: 'display_ui_card', type_card: 'government_action', title: `خدمة ${args.service}`, description: 'المخلصاتي جاهز', url, number: 'eagle' };
                    actionDescriptions.push(`🦅 المخلصاتي: تم تجهيز خدمة ${args.service}`);
                }
            }
        }

        if (actionDescriptions.length > 0) {
            responseText += `\n\n**العمليات:**\n${actionDescriptions.map(d => `✔ ${d}`).join('\n')}`;
        }

        // Extract grounding links if available
        const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title,
            uri: chunk.web?.uri
        })).filter((link: any) => link.uri) || [];

        return { 
            text: responseText, 
            toolAction, 
            isError: false, 
            groundingLinks,
            shouldUpgrade: userProfile?.phone === 'GUEST' && history.length > 10
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