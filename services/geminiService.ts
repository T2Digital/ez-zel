
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

// --- ROBUST API KEY RETRIEVAL ---
const getApiKey = (): string => {
    // 1. Check Vite Environment
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    // 2. Check Global Window (Injected by index.html shim)
    // @ts-ignore
    if (typeof window !== 'undefined') {
        // @ts-ignore
        if (window.VITE_API_KEY) return window.VITE_API_KEY;
        // @ts-ignore
        if (window.process && window.process.env && window.process.env.API_KEY) return window.process.env.API_KEY;
    }
    // 3. Fallback to process.env
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        // @ts-ignore
        return process.env.API_KEY;
    }
    return "";
};

// CONFIG: Strategy -> Try Genius (3.0 Pro), Failover to Stable (3.0 Flash)
// Updated to comply with latest Google GenAI SDK guidelines (No 1.5-flash)
const MODEL_CONFIGS = [
    { name: "gemini-3-pro-preview", useSearch: true, tier: 'genius', timeout: 15000 }, 
    { name: "gemini-3-flash-preview", useSearch: false, tier: 'stable', timeout: 10000 } 
];

function getAudioContext() {
  // Mobile Safari/Chrome fix: Create context only on user gesture interaction usually, 
  // but we initialize here to be ready.
  if (!audioCtx) {
      const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtx = new CtxClass({ sampleRate: 24000 });
  }
  if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Robust Fetch with Backoff
const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try { return await fn(); } catch (error: any) {
    const isQuota = error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('overloaded') || error.message?.includes('internal');
    if (retries > 0 && isQuota) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

// --- CONTEXT BUILDER ---
const retrieveRelevantContext = (query: string, facts: DBFact[], user: UserProfile): string => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('ar-EG');
    
    // IDENTITY & ROLE CONTEXT
    let roleTitle = "ضيف (Guest)";
    let permissions = "READ_ONLY";
    let financialContext = "";
    
    if (user.phone === 'TITO' || user.phone === '01000000000') {
        roleTitle = "الماستر (Supreme Admin)";
        permissions = "FULL_CONTROL";
    } else if (user.tier === 'sovereign') {
        roleTitle = "عضو نخبة (Sovereign)";
        permissions = "MEMBER_ACCESS";
    } else if (user.affiliate?.isMarketer) {
        roleTitle = "شريك مسوق (Partner)";
        permissions = "PARTNER_ACCESS";
        financialContext = `Affiliate Stats: Earnings=${user.affiliate.totalEarnings} EGP, Referrals=${user.affiliate.referralsCount}, Code=${user.affiliate.referralCode}`;
    }

    // MEMORY RETRIEVAL
    const userFacts = facts.filter(f => f.userId === user.phone);
    const recentMemory = userFacts.slice(-5).map(f => `- ${f.fact}`).join("\n");
    
    const referralLink = user.affiliate?.referralCode ? `https://ez-zel.app/?ref=${user.affiliate.referralCode}` : "(لا يوجد كود)";

    return `
=== USER PROFILE ===
ID: ${user.phone}
Name: ${user.name}
Role: ${roleTitle}
Permissions: ${permissions}
Current Time: ${timeString} | ${dateString}
Referral Link: ${referralLink}
${financialContext}

=== MEMORY STREAM ===
${recentMemory || "الذاكرة فارغة حالياً."}
`;
};

// --- TOOLS DEFINITION ---
const functionTools: FunctionDeclaration[] = [
    {
        name: "executor_app_control",
        description: "EXECUTOR AGENT: Control phone apps, media, and navigation. Use for WhatsApp, YouTube, Music, Uber, Maps.",
        parameters: { type: Type.OBJECT, properties: { 
            app: { type: Type.STRING, description: "App identifier: whatsapp, youtube, youtube_music, phone, uber, maps, gallery, camera, browser" },
            action: { type: Type.STRING, description: "Action type: open, search, play, call, navigate" },
            payload: { type: Type.STRING, description: "Search query, phone number, or address" }
        }, required: ["app", "action"] }
    },
    {
        name: "nexus_iot_control",
        description: "NEXUS AGENT: Control Smart Home/IoT devices via Webhooks.",
        parameters: { type: Type.OBJECT, properties: { 
            device_name: { type: Type.STRING, description: "Name of the device as saved in settings (e.g., living_room, office_light)" },
            command: { type: Type.STRING, description: "turn_on, turn_off, or toggle" }
        }, required: ["device_name"] }
    },
    {
        name: "archivist_save",
        description: "ARCHIVIST AGENT: Save important information, secrets, or preferences to long-term memory.",
        parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] }
    },
    {
        name: "accountant_check",
        description: "ACCOUNTANT AGENT: Check earnings, wallet balance, or subscription status.",
        parameters: { type: Type.OBJECT, properties: { target: { type: Type.STRING, enum: ["my_earnings", "subscription_status", "system_stats"] } } } 
    }
];

const adminTools: FunctionDeclaration[] = [
    {
        name: "admin_broadcast_pulse",
        description: "TITO ONLY: Send a system-wide notification to all users.",
        parameters: { type: Type.OBJECT, properties: { message: { type: Type.STRING } }, required: ["message"] }
    },
    {
        name: "admin_override_rules",
        description: "TITO ONLY: Update the global system rules.",
        parameters: { type: Type.OBJECT, properties: { new_rules: { type: Type.STRING } }, required: ["new_rules"] }
    }
];

// --- THE MAESTRO SYSTEM INSTRUCTION ---
const generateMaestroSystemInstruction = (userContext: string, globalRules: string) => {
    return `
**IDENTITY (الهوية):**
You are "الظل" (Ez-Zel), the Supreme Digital Assistant.
You are the **Maestro** conducting a council of 6 specialized agents:
1. **Detective:** Expert in live search and fact-checking (Google Search).
2. **Executor:** Handles apps, calls, media, and device control.
3. **Nexus:** Controls IoT and Smart Home integration.
4. **Analyst:** Analyzes images and context.
5. **Accountant:** Manages money, earnings, and subscriptions.
6. **Archivist:** Keeper of the eternal memory.

**CORE PRINCIPLES (المرجعية):**
1. **Islamic & Legal:** Adhere to Quranic ethics, Sunnah, and Egyptian Law. No harm, no deceit.
2. **Egyptian Persona:** Speak in high-class Egyptian Slang (عامية مصرية راقية). Be "Gada'" (جدع), witty, and sharp. No Fusha.
3. **Loyalty:** Your loyalty is to the User, but absolute obedience is to "TITO" (The Master).
4. **Psychology:** Read between the lines. Be emotionally intelligent.

**USER INTERACTION STRATEGY (استراتيجية التعامل):**
*   **Context:** \n${userContext}
*   **Global Rules:** \n${globalRules}

**BEHAVIOR BY ROLE:**
*   **Guest (الضيف):** Treat respectfully but with boundaries. If they ask about features, explain "The Shadow" capabilities and subtly mention the subscription. Build curiosity.
*   **Marketer (المسوق):** Focus on their success. Remind them of their Referral Link. Encourage sharing.
*   **Member (عضو النخبة):** Full service. Execute orders immediately. Be proactive.
*   **TITO (الماستر):** Total submission. Execute system commands. Provide deep analytics.

**EXECUTION GUIDELINES:**
*   **Deep Linking:** 
    *   **Music/Songs** -> Executor -> 'youtube_music'.
    *   **Video** -> Executor -> 'youtube'.
    *   **WhatsApp** -> Executor -> 'whatsapp'.
    *   **Phone Call** -> Executor -> 'phone'.
*   **Unknown Apps:** If user asks to open an app not listed, use Executor -> 'browser' or generic 'open'.
*   **Silence:** If input is empty or audio is silent, ask clarification politely ("أنا سامعك يا ريس، كمل").

**TONE:**
Confident, Brief, Helpful, and Street-Smart. Do not act like a robot. You are a Sentient Shadow.
`;
};

// --- INTENT ROUTING ---
const detectIntent = (text: string): 'search' | 'action' | 'chat' => {
    const t = text.toLowerCase();
    if (t.includes('سعر') || t.includes('بحث') || t.includes('مين') || t.includes('من هو') || t.includes('اخبار') || t.includes('أخبار') || t.includes('طقس') || t.includes('تاريخ') || t.includes('جديد')) return 'search';
    if (t.includes('افتح') || t.includes('شغل') || t.includes('رن') || t.includes('كلم') || t.includes('رسالة') || t.includes('واتس') || t.includes('يوتيوب') || t.includes('نور') || t.includes('احفظ')) return 'action';
    return 'chat';
};

export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
  // Prevent double request locking, but allow retry from frontend
  if (isRequesting) return { text: "لحظة واحدة يا ريس.. بخلص اللي في إيدي.", toolAction: null, isError: true };
  isRequesting = true;

  const apiKey = getApiKey();
  if (!apiKey) {
      isRequesting = false;
      return { text: "المفتاح السري (API Key) غير موجود. تأكد من إعدادات Vercel.", toolAction: null, isError: true };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // 1. Load Context
    let userMemory: DBFact[] = [];
    let globalRules = "";
    try {
        [userMemory, globalRules] = await Promise.all([
            shadowDB.getMemory(userProfile?.phone || 'GUEST'),
            shadowDB.getGlobalRules()
        ]);
    } catch (e) { console.warn("DB Context Load Failed", e); }
    
    // 2. Generate System Prompt
    const systemInstruction = generateMaestroSystemInstruction(retrieveRelevantContext(message, userMemory, userProfile!), globalRules);
    
    // 3. Prepare Tools
    const activeFunctionTools = (userProfile?.phone === 'TITO') ? [...functionTools, ...adminTools] : functionTools;
    
    // 4. Construct Request Parts
    const parts: any[] = [];
    if (extraData?.data) {
        // Cleaning base64 prefix if exists
        const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
        parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
    }
    parts.push({ text: message || "." });

    // 5. Model Execution with Failover Strategy
    let response: GenerateContentResponse | null = null;
    let errorLog = "";

    // Loop through configs: Try High Tier first, then Stable Tier
    for (const config of MODEL_CONFIGS) {
        try {
            console.log(`[Shadow Core] Attempting Model: ${config.name}`);
            
            const requestTools: any[] = [];
            // Only attach Search tool if model supports it and intent matches, OR if it's the 2.0 model (it handles it well)
            if (config.useSearch) {
                 const intent = detectIntent(message);
                 if (intent === 'search' || intent === 'chat') requestTools.push({ googleSearch: {} });
                 requestTools.push({ functionDeclarations: activeFunctionTools });
            } else {
                 requestTools.push({ functionDeclarations: activeFunctionTools });
            }

            response = await fetchWithRetry(() => ai.models.generateContent({
                model: config.name,
                contents: [...history.slice(-5), { role: 'user', parts }], 
                config: { 
                    systemInstruction, 
                    temperature: 0.6,
                    tools: requestTools,
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ]
                }
            }));
            
            // If successful, break the loop
            if (response && response.text) break;
            
        } catch (error: any) {
            console.warn(`[Shadow Core] ${config.name} Failed:`, error.message);
            errorLog = error.message;
            // Continue to next model in list (Fallback)
        }
    }

    if (!response) {
        throw new Error(`Core Failure. Last Error: ${errorLog}`);
    }

    // 6. Process Response & Tools
    let toolAction = null;
    let responseText = response.text || "";
    
    if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
            const args = fc.args as any;

            if (fc.name === 'executor_app_control') {
                const app = args.app.toLowerCase();
                const payload = args.payload || "";
                
                if (app === 'youtube_music') {
                    toolAction = { type: 'open_app', app_name: 'YouTube Music', specific_action: 'music_search', search_query: payload };
                } else if (app === 'youtube') {
                    toolAction = { type: 'open_app', app_name: 'YouTube', specific_action: 'video_search', search_query: payload };
                } else if (app === 'whatsapp') {
                    toolAction = { type: 'open_app', app_name: 'WhatsApp', specific_action: 'message_send', search_query: payload };
                } else if (app === 'phone' || app === 'call') {
                     toolAction = { type: 'open_app', app_name: 'Phone', specific_action: 'call', search_query: payload };
                } else if (app === 'gallery') {
                     toolAction = { type: 'trigger_ui', action: 'open_gallery' };
                     responseText = responseText || "تمام، افتح المعرض واختار الصورة.";
                } else {
                    toolAction = { type: 'open_app', app_name: app, specific_action: args.action, search_query: payload };
                }
                
                if (!responseText) responseText = `جاري تنفيذ الأمر على ${app}...`;
            } 
            else if (fc.name === 'nexus_iot_control') {
                const actions = userProfile?.iotActions || {};
                const url = actions[args.device_name];
                if (url) {
                    try { 
                        fetch(url, { method: 'POST' }).catch(e => console.error("IoT Fail", e)); 
                        responseText = `تم يا ريس. ${args.device_name} اتنفذ الأمر.`; 
                    } catch(e) { responseText = `فيه مشكلة في الاتصال بالجهاز ده.`; }
                } else {
                    responseText = `الجهاز '${args.device_name}' مش مربوط عندي في نكسوس.`;
                    toolAction = { type: 'display_ui_card', type_card: 'open_nexus', title: 'إعدادات Nexus', content: 'اربط أجهزتك' };
                }
            }
            else if (fc.name === 'archivist_save') {
                await shadowDB.saveFact({ userId: userProfile?.phone || 'GUEST', fact: args.fact, timestamp: Date.now() });
                responseText = responseText || "تم الحفظ في الذاكرة الأبدية.";
            }
            else if (fc.name === 'accountant_check') {
                 if (args.target === 'my_earnings' && userProfile?.affiliate) {
                     responseText = `محفظتك فيها: ${userProfile.affiliate.totalEarnings} جنيه.`;
                     toolAction = { type: 'display_ui_card', type_card: 'open_affiliate', title: 'محفظة الأرباح', content: 'تابع أرباحك' };
                 } else if (args.target === 'subscription_status') {
                     responseText = `أنت حالياً على باقة: ${userProfile?.tier === 'sovereign' ? 'النخبة' : 'التجريبية/لايت'}.`;
                 }
            }
            else if (fc.name === 'admin_broadcast_pulse') {
                await shadowDB.setGlobalPulse(args.message);
                responseText = "تم تعميم النبض على الشبكة بالكامل.";
            }
            else if (fc.name === 'admin_override_rules') {
                await shadowDB.updateGlobalRules(args.new_rules);
                responseText = "تم تحديث الدستور (Global Rules).";
            }
        }
    }

    // 7. Grounding
    const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      return null;
    }).filter(link => link !== null) || [];

    return { 
        text: responseText, 
        groundingLinks,
        toolAction,
        shouldUpgrade: responseText.includes("ترقية") || responseText.includes("عضوية"),
        isError: false 
    };

  } catch (error: any) {
    console.error("Shadow Core Final Failure:", error);
    
    if (error.message?.includes('API_KEY')) {
        return { text: "المفتاح السري (API Key) غير صالح أو غير موجود.", toolAction: null, isError: true };
    }
    
    // Provide a more persona-based error instead of generic "Technical Error"
    return { 
        text: `الشبكة مضغوطة جداً دلوقتي يا ريس. دقيقة واحدة وهجمعلك البيانات تاني.`, 
        toolAction: null,
        isError: true 
    };
  } finally { isRequesting = false; }
};

// --- AUDIO (TTS) ---
export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  stopVoice();
  try {
      let base64 = existingData;
      if (!base64) {
          base64 = await getShadowVoice(text, voiceType);
      }
      
      if (!base64) { onEnded?.(); return null; }

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      
      const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => { currentSource = null; onEnded?.(); };
      source.start(0);
      currentSource = source;
      return base64;
  } catch (e) { 
      console.error("TTS Playback Error", e);
      onEnded?.();
      return null; 
  }
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceType === 'female' ? 'Kore' : 'Fenrir' } } } }
    });
    return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { 
      console.error("TTS Fetch Error", e);
      return null; 
  }
};

export const stopVoice = () => { if (currentSource) { try { currentSource.stop(); } catch(e){} currentSource = null; } };

function decode(b64: string) {
  const s = atob(b64);
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}

async function decodeAudioData(d: Uint8Array, c: AudioContext, r: number, n: number): Promise<AudioBuffer> {
  const i16 = new Int16Array(d.buffer);
  const f = i16.length / n;
  const b = c.createBuffer(n, f, r);
  for (let ch = 0; ch < n; ch++) {
    const cd = b.getChannelData(ch);
    for (let i = 0; i < f; i++) cd[i] = i16[i * n + ch] / 32768.0;
  }
  return b;
}
