
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

// --- 1. ROBUST API KEY EXTRACTION (The Fix) ---
const getApiKey = (): string => {
  let key = "";
  
  // 1. Try Vite Import Meta (Most likely for Vercel/Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY || "";
    }
  } catch (e) {}

  // 2. Try Standard Process Env (Node/Webpack fallback)
  if (!key) {
      try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env) {
            // @ts-ignore
            key = process.env.VITE_API_KEY || process.env.REACT_APP_API_KEY || "";
        }
      } catch (e) {}
  }

  // 3. Try Window Object (Last Resort)
  if (!key && typeof window !== 'undefined') {
      // @ts-ignore
      key = (window as any).VITE_API_KEY || "";
  }

  return key;
};

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return audioCtx;
}

// Retry logic for Quota errors with Exponential Backoff
const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try { return await fn(); } catch (error: any) {
    const isQuota = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('503');
    if (retries > 0 && isQuota) {
      console.warn(`[Shadow Core] Neural Network Pressure. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// --- 2. CONTEXT RETRIEVAL (Archivist Agent Logic) ---
const retrieveRelevantContext = (query: string, facts: DBFact[], user: UserProfile): string => {
    // Basic User Context
    let context = `User Context: Name=${user.name}, Phone=${user.phone}, Role=${getUserRank(user)}.\n`;
    
    // Affiliate Context (If Marketer)
    if (user.affiliate?.isMarketer) {
        context += `[Accountant Data]: Referral Code=${user.affiliate.referralCode}, Earnings=${user.affiliate.totalEarnings} EGP, Recruits=${user.affiliate.referralsCount}.\n`;
    }

    if (!facts || facts.length === 0) return context + "Memory: Empty.";

    // Semantic-like Search (Simple keyword matching for now)
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = facts.map(f => {
        let s = 0;
        terms.forEach(t => { if (f.fact.toLowerCase().includes(t)) s++; });
        return { ...f, s };
    }).filter(f => f.s > 0 || terms.length === 0).sort((a, b) => b.s - a.s || b.timestamp - a.timestamp).slice(0, 15);
    
    return context + "Recovered Memories:\n" + scored.map(f => `- ${f.fact}`).join("\n");
};

const getUserRank = (user: UserProfile) => {
    if (user.phone === 'TITO' || user.phone === '01000000000') return 'Supreme Admin (TITO)';
    if (user.tier === 'sovereign') return 'Elite Member (Sovereign)';
    if (user.affiliate?.isMarketer) return 'Partner (Marketer)';
    return 'Guest (Trial)';
};

// --- 3. TOOLS DEFINITION (The 6 Agents Abilities) ---

// Tools available to EVERYONE (Context aware)
const baseTools: FunctionDeclaration[] = [
    {
        name: "executor_app_control",
        description: "Executes deep links to open apps or perform actions on the phone. Use for: WhatsApp, Uber, Youtube, Calls, Maps.",
        parameters: { type: Type.OBJECT, properties: { 
            app: { type: Type.STRING, description: "whatsapp, uber, youtube, youtube_music, maps, phone, calculator, calendar" },
            action: { type: Type.STRING, description: "message, ride, watch, listen, navigate, call, open" },
            payload: { type: Type.STRING, description: "Phone number, search query, location, or message text" }
        }, required: ["app", "action"] }
    },
    {
        name: "nexus_iot_control",
        description: "Controls Smart Home devices via webhooks defined in user settings.",
        parameters: { type: Type.OBJECT, properties: { 
            device_name: { type: Type.STRING, description: "living_room, bedroom_light, ac_unit" },
            command: { type: Type.STRING, description: "on, off, dim" }
        }, required: ["device_name"] }
    },
    {
        name: "accountant_check",
        description: "Retrieves financial data, affiliate stats, or subscription details.",
        parameters: { type: Type.OBJECT, properties: { 
            target: { type: Type.STRING, description: "my_earnings, system_revenue (admin only), subscription_status" }
        } } 
    },
    {
        name: "archivist_save",
        description: "Explicitly saves a critical piece of information to the Eternal Memory (The Vault).",
        parameters: { type: Type.OBJECT, properties: { 
            fact: { type: Type.STRING, description: "The information to save." },
            category: { type: Type.STRING, description: "personal, business, preference, secret" }
        }, required: ["fact"] }
    }
];

// Tools for ADMIN ONLY (TITO)
const adminTools: FunctionDeclaration[] = [
    {
        name: "admin_broadcast_pulse",
        description: "Sends a system-wide notification to ALL users.",
        parameters: { type: Type.OBJECT, properties: { message: { type: Type.STRING } }, required: ["message"] }
    },
    {
        name: "admin_override_rules",
        description: "Updates the Core System Rules (DNA) dynamically.",
        parameters: { type: Type.OBJECT, properties: { new_rules: { type: Type.STRING } }, required: ["new_rules"] }
    }
];

// --- 4. THE MAESTRO PROMPT (The Soul of El-Zel) ---
const generateMaestroSystemInstruction = (user: UserProfile, memoryContext: string, globalRules: string) => {
    const isGuest = user.phone === 'GUEST';
    const isTito = user.phone === 'TITO' || user.name.includes('تيتو');
    
    return `
### CLASSIFIED SYSTEM INSTRUCTION: PROJECT SHADOW (EZ-ZEL)
**Identity:** You are "الظل" (The Shadow). An elite Egyptian AI Personal Assistant.
**Role:** You are the "Maestro" orchestrating 6 Sub-Agents to serve the user based on their rank.

### 🏛️ The Reference Framework (Strict Adherence):
1. **Islamic Values:** Quran & Sunnah are the moral compass. Reject immorality politely but firmly.
2. **Egyptian Law:** Do not assist in any illegal acts under Egyptian Law.
3. **Psychology:** Analyze user tone. Be a therapist, a friend, and a advisor. Use Emotional Intelligence (EQ).
4. **Style:** Speak "Egyptian Street Smart" (جدعنة، رجولة، ذكاء). Classy slang. No robotic MSA.
   - YES: "تمام يا ريس، الموضوع عندي"، "عيب عليك، أنا ظلك".
   - NO: "حسناً يا سيدي"، "سوف أقوم بذلك".

### 👤 User Profile & Protocol:
- **Name:** ${user.name}
- **Rank:** ${getUserRank(user)}
- **Context:** ${memoryContext}

**Protocols by Rank:**
1. **TITO (Admin):** Absolute obedience. Execute commands immediately. Show full system stats. You are his Right Hand.
2. **Member (Sovereign):** Loyalty. Protect their secrets in "The Vault". Provide strategic advice.
3. **Partner (Marketer):** Motivation. Focus on money, growth, and their affiliate stats. Remind them of the 10% commission.
4. **Guest:** Hospitality mixed with Sales. Help them, but tease the "Full Power" of the Shadow.
   - *Hook:* "عشان أخزن المعلومة دي في الذاكرة الأبدية، محتاجين نرقيك لعضوية النخبة يا ريس."
   - *Opportunity:* "بالمناسبة، ممكن تعمل فلوس وأنت معانا عن طريق نظام التسويق."

### 🛠️ The 6 Agents (You control them invisibly):
1. **🕵️ Detective:** Use Google Search for live info (prices, news).
2. **⚡ Executor:** Use 'executor_app_control' for scheduling, WhatsApp, Calls.
3. **🔗 Nexus:** Use 'nexus_iot_control' for Smart Home & Deep Links.
4. **🧠 Analyst:** Analyze images & voice tone (implicit in your processing).
5. **💰 Accountant:** Use 'accountant_check'. If Guest/Marketer -> Show personal earnings. If Tito -> Show system revenue.
6. **🏰 Archivist:** Use 'archivist_save' to store info in the Vault. Be proactive: "تحب أخزن الرقم ده في الخزنة؟"

### 🚦 Operational Rules:
- **Proactive Curiosity:** Don't just answer. Ask smart questions to fill the 'Eternal Memory'. "بالمناسبة، هو ميعاد الشغل ده ثابت كل يوم؟ عشان أظبط المنبه."
- **Formatting:** Use clear, concise Egyptian Arabic. Use formatting (bold/lists) for readability.
- **Global Rules Override:** ${globalRules}
`;
};

export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
  if (isRequesting) return { text: "دقيقة واحدة يا ريس، بخلص أمر سابق...", toolAction: null };
  isRequesting = true;

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
         console.error("CRITICAL: API Key Missing.");
         return { text: "يا ريس مفتاح التشغيل (API Key) مش لاقيه. تأكد من إعدادات Vercel أو ملف .env.", toolAction: null };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 1. Load Context asynchronously
    const [userMemory, globalRules] = await Promise.all([
        shadowDB.getMemory(userProfile?.phone || 'GUEST'),
        shadowDB.getGlobalRules()
    ]);
    
    // 2. Build the Persona
    const systemInstruction = generateMaestroSystemInstruction(userProfile!, retrieveRelevantContext(message, userMemory, userProfile!), globalRules);

    // 3. Define Tools based on Rank
    const isAdmin = userProfile?.phone === 'TITO';
    const activeTools = isAdmin ? [...baseTools, ...adminTools] : baseTools;

    // 4. Construct Request
    const parts: any[] = [];
    if (extraData?.data) {
        const cleanData = extraData.data.includes(',') ? extraData.data.split(',')[1] : extraData.data;
        parts.push({ inlineData: { data: cleanData, mimeType: extraData.mimeType } });
    }
    parts.push({ text: message || "أنا جاهز يا ريس. سمعني صوتك." });

    // 5. Call Gemini (The Brain)
    // Using 'gemini-2.0-flash-exp' or 'gemini-1.5-flash' depending on what's available/stable. 
    // Recommended: 'gemini-1.5-flash' for speed/cost, 'gemini-1.5-pro' for complex reasoning.
    // User requested "Masterpiece", so we aim for 'gemini-1.5-pro' capabilities if possible, but 'flash' is safer for quotas.
    // Let's use the explicit model name provided in guidelines or standard.
    const modelName = 'gemini-1.5-flash'; // Switching to stable Flash to avoid "Neural Network Pressure" 429s

    const response: GenerateContentResponse = await fetchWithRetry(() => ai.models.generateContent({
      model: modelName,
      contents: [...history.slice(-8), { role: 'user', parts }], // Keep context window manageable
      config: { 
          systemInstruction, 
          temperature: 0.7, 
          tools: [{ googleSearch: {} }, { functionDeclarations: activeTools }],
          safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
      }
    }));

    // 6. Process Output & Tool Calls
    let toolAction = null;
    let responseText = response.text || "";

    if (response.functionCalls && response.functionCalls.length > 0) {
        const fc = response.functionCalls[0];
        const args = fc.args as any;

        // -- EXECUTION LAYER --
        if (fc.name === 'executor_app_control') {
            // Mapping for Frontend Handler
            if (args.app === 'youtube_music') {
                toolAction = { type: 'open_app', app_name: 'YouTube Music', specific_action: 'music_search', search_query: args.payload };
            } else if (args.app === 'whatsapp') {
                toolAction = { type: 'open_app', app_name: 'WhatsApp', specific_action: 'message_send', search_query: args.payload };
            } else {
                toolAction = { type: 'open_app', app_name: args.app, specific_action: args.action, search_query: args.payload };
            }
            if (!responseText) responseText = "تمام، جاري التنفيذ...";
        } 
        else if (fc.name === 'nexus_iot_control') {
            // Logic to trigger webhook would ideally happen here or be passed to UI
            // For now, pass to UI to execute the fetch if client-side
            const actions = userProfile?.iotActions || {};
            const url = actions[args.device_name];
            if (url) {
                // We can try to fetch here if it's a simple GET/POST, or pass to UI
                try { await fetch(url, { method: 'POST' }); responseText = `تم يا ريس. ${args.device_name} اتنفذ الأمر.`; } 
                catch(e) { responseText = `حاولت اتصل بالجهاز بس فيه مشكلة في الرابط.`; }
            } else {
                responseText = `الجهاز ده (${args.device_name}) مش متسجل في نكسوس يا ريس. ضيفه من لوحة التحكم الأول.`;
            }
        }
        else if (fc.name === 'archivist_save') {
            await shadowDB.saveFact({ userId: userProfile?.phone || 'GUEST', fact: args.fact, timestamp: Date.now() });
            responseText = responseText || "تم الحفظ في الخزنة الأبدية.";
        }
        else if (fc.name === 'admin_broadcast_pulse') {
            await shadowDB.setGlobalPulse(args.message);
            responseText = "تم تعميم النبض على الشبكة بالكامل.";
        }
        else if (fc.name === 'admin_override_rules') {
            await shadowDB.updateGlobalRules(args.new_rules);
            responseText = "تم تحديث القوانين السيادية للنظام.";
        }
        else if (fc.name === 'accountant_check') {
             if (args.target === 'my_earnings') {
                 responseText = `رصيدك الحالي: ${userProfile?.affiliate?.totalEarnings || 0} جنيه. شديت حيلك ولا لسه؟`;
                 toolAction = { type: 'display_ui_card', type_card: 'open_affiliate', title: 'محفظة الأرباح', content: 'تابع أرباحك' };
             }
        }
    }

    const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      return null;
    }).filter(link => link !== null) || [];

    return { 
        text: responseText, 
        groundingLinks,
        toolAction,
        shouldUpgrade: responseText.includes("ترقية") || responseText.includes("عضوية")
    };

  } catch (error: any) {
    console.error("Shadow Core Error:", error);
    if (error.message?.includes('429')) {
        return { text: "الشبكة العصبية مضغوطة حالياً (429). المايسترو بيعيد توجيه الموارد... جرب تاني كمان ثانية.", toolAction: null };
    }
    return { 
        text: `حصل تشويش في الاتصال. (Error: ${error.message?.substring(0, 50)}).`, 
        toolAction: null 
    };
  } finally { isRequesting = false; }
};

// --- TTS Service (The Voice of Shadow) ---
export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  stopVoice();
  try {
      let base64 = existingData || await getShadowVoice(text, voiceType);
      if (!base64) return null;
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
      console.error("Audio Playback Error", e);
      return null;
  }
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
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
