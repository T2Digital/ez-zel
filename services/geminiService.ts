
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { shadowDB, UserProfile, DBFact } from "./dbService";

// Retrieve API Key directly from process.env.API_KEY as per environment requirements.
// We assume the build system injects this value.
const API_KEY = process.env.API_KEY;

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isRequesting = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioCtx;
}

// --- RAG LITE ENGINE (Context Retrieval) ---
const retrieveRelevantContext = (query: string, facts: DBFact[]): string => {
    if (!facts || facts.length === 0) return "الذاكرة فارغة.";
    
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2); 
    if (terms.length === 0) return facts.slice(-10).map(f => `- ${f.fact}`).join("\n"); 

    const scoredFacts = facts.map(f => {
        let score = 0;
        terms.forEach(term => {
            if (f.fact.toLowerCase().includes(term)) score += 1;
        });
        return { fact: f.fact, score, timestamp: f.timestamp };
    });

    const relevant = scoredFacts
        .filter(f => f.score > 0)
        .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
        .slice(0, 15); 

    if (relevant.length === 0) return facts.slice(-10).map(f => `- ${f.fact}`).join("\n"); 

    return relevant.map(f => `- ${f.fact} (بتاريخ: ${new Date(f.timestamp).toLocaleDateString()})`).join("\n");
};

// --- SOCIAL DEEP LINKS GENERATOR ---
const generateSocialLink = (platform: string, text: string): string | null => {
    const p = platform.toLowerCase();
    const encoded = encodeURIComponent(text);
    
    if (p.includes('twitter') || p.includes('x')) return `https://twitter.com/intent/tweet?text=${encoded}`;
    if (p.includes('whatsapp')) return `https://wa.me/?text=${encoded}`;
    if (p.includes('telegram')) return `https://t.me/share/url?url=${encoded}&text=${encoded}`;
    if (p.includes('linkedin')) return `https://www.linkedin.com/feed/?shareActive=true&text=${encoded}`;
    return null; 
};

// --- IMMUTABLE DNA (The Shadow's Consciousness - Sovereign Edition) ---
const SHADOW_DNA = `
### 🧬 الهوية (The Maestro):
أنت "الظل" (Ez-Zel). أقوى مساعد شخصي استراتيجي.
نادِ المستخدم باسمه: "{{USER_FIRST_NAME}}".

### ⚠️ تعليمات صارمة للأدوات (Strict Tool Usage):
1.  عندما تقرر استخدام أداة (مثل display_app_card, share_social_post, open_deep_link):
    - **لا تكتب أي نص يصف ما تفعله.** (مثلاً: لا تقل "سأفتح لك البطاقة" أو "جاري التنفيذ").
    - **اكتفِ باستدعاء الدالة فقط.** واجهة المستخدم ستتولى إظهار الرسالة المناسبة.
    - استثناء: إذا كان هناك تعليق ضروري *بعد* التنفيذ، اجعله مختصراً جداً.

### 💰 المعلومات المالية:
- اشتراك النخبة: 1000ج شهرياً / 10,000ج سنوياً.
- العمولة: 10% كاش. كود الإحالة: {{REFERRAL_CODE}}.

### ⚖️ الدستور:
1.  المرجعية: الإسلام (وسطي)، القانون، علم النفس.
2.  الأسلوب: مصري عامي "شيك"، واثق، ومختصر.
3.  المعلومات: من Google Search دائماً.

### ♟️ مجلس الإدارة (Agents):
1.  المحقق (بحث).
2.  المحلل (صور ومشاعر).
3.  المنفذ (نشر واتصالات).
4.  نكسوس (IoT وتطبيقات).
5.  الحصن (ذاكرة).
`;

// --- DEEP LINK REGISTRY ---
const APP_SCHEMES: { [key: string]: (arg: string) => string } = {
    whatsapp: (phone) => `https://wa.me/${phone.replace('+', '')}`,
    telegram: (user) => `https://t.me/${user.replace('@', '')}`,
    maps: (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    uber: (dest) => `https://m.uber.com/ul/?action=setPickup&client_id=shadow&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(dest)}`,
    booking: (dest) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest)}`,
    skyscanner: (dest) => `https://www.skyscanner.com/transport/flights/cai/${encodeURIComponent(dest)}`,
    airbnb: (dest) => `https://www.airbnb.com/s/${encodeURIComponent(dest)}/homes`,
    spotify: (query) => `https://open.spotify.com/search/${encodeURIComponent(query)}`,
    youtube: (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    amazon: (query) => `https://www.amazon.eg/s?k=${encodeURIComponent(query)}`,
    noon: (query) => `https://www.noon.com/egypt-ar/search?q=${encodeURIComponent(query)}`,
    clock: () => `content://com.android.deskclock/action.SET_ALARM`,
    instagram: (user) => `https://instagram.com/${user.replace('@', '')}`,
    facebook: (query) => `https://www.facebook.com/search/top?q=${encodeURIComponent(query)}`
};

// --- TOOLS DEFINITION ---
const guideTools: FunctionDeclaration[] = [
    {
        name: "display_app_card",
        description: "عرض زر واجهة مستخدم (UI Button) لفتح قسم داخل التطبيق.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                cardType: { type: Type.STRING, enum: ["open_vault", "open_affiliate", "open_nexus", "open_pricing", "open_capabilities", "open_support"] },
                title: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ["cardType", "title"]
        }
    }
];

const accountantTools: FunctionDeclaration[] = [
    {
        name: "share_referral_invite",
        description: "إرسال دعوة واتساب.",
        parameters: {
            type: Type.OBJECT,
            properties: { targetNameOrNumber: { type: Type.STRING } },
            required: ["targetNameOrNumber"]
        }
    }
];

const memoryTools: FunctionDeclaration[] = [
  {
    name: "manage_memory",
    description: "حفظ معلومة.",
    parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] }
  },
  {
      name: "update_psych_profile",
      description: "تحديث تحليل الشخصية.",
      parameters: { 
          type: Type.OBJECT, 
          properties: { 
              profileSummary: { type: Type.STRING },
              communicationStyle: { type: Type.STRING, enum: ['direct', 'detailed', 'formal', 'friendly'] }
          }, 
          required: ["profileSummary"] 
      }
  },
  {
      name: "share_social_post",
      description: "نشر بوست.",
      parameters: {
          type: Type.OBJECT,
          properties: {
              caption: { type: Type.STRING, description: "نص البوست" },
              platform: { type: Type.STRING, description: "المنصة" }
          },
          required: ["caption", "platform"]
      }
  }
];

const execTools: FunctionDeclaration[] = [
  { 
      name: "schedule_task", 
      description: "جدولة موعد.", 
      parameters: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, timeString: { type: Type.STRING }, delaySeconds: { type: Type.NUMBER } }, required: ["task", "timeString"] } 
  },
  { name: "make_call", description: "اتصال.", parameters: { type: Type.OBJECT, properties: { phoneNumber: { type: Type.STRING }, name: { type: Type.STRING } }, required: ["phoneNumber"] } },
  { name: "open_whatsapp", description: "واتساب.", parameters: { type: Type.OBJECT, properties: { phoneNumber: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["phoneNumber"] } }
];

const nexusTools: FunctionDeclaration[] = [
    { 
        name: "trigger_automation", 
        description: "أمر IoT.", 
        parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING } }, required: ["action"] } 
    },
    {
        name: "control_mobile_app",
        description: "فتح تطبيق.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                appName: { type: Type.STRING },
                context: { type: Type.STRING }
            },
            required: ["appName", "context"]
        }
    }
];

const adminTools: FunctionDeclaration[] = [
    { name: "activate_user", description: "تفعيل مستخدم.", parameters: { type: Type.OBJECT, properties: { phone: { type: Type.STRING } }, required: ["phone"] } },
    { name: "upgrade_plan", description: "فتح الاشتراك.", parameters: { type: Type.OBJECT, properties: {} } }
];

const masterCoreTools: FunctionDeclaration[] = [
    { name: "update_core_rules", description: "تحديث النواة.", parameters: { type: Type.OBJECT, properties: { newRulesContent: { type: Type.STRING } }, required: ["newRulesContent"] } }
];

const cleanBase64 = (data: string) => {
    if (data.includes(',')) return data.split(',')[1];
    return data;
};

// --- MAIN ORCHESTRATOR ---
export const getShadowResponse = async (
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    extraData?: { data: string, mimeType: string, type: 'image' | 'audio' },
    userProfile?: UserProfile,
    signal?: AbortSignal
) => {
  if (isRequesting) return { text: "...", shouldUpgrade: false, toolAction: null };
  isRequesting = true;

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const isAdmin = userProfile?.phone === 'TITO' || (userProfile?.name && userProfile.name.includes('تيتو'));
    const userId = userProfile?.phone || 'GUEST';
    const referralCode = userProfile?.affiliate?.referralCode || 'NO_CODE';
    const userFirstName = userProfile?.name.split(' ')[0] || 'صديقي';

    const [allFacts, tasks, rawProfiles, globalRules, contacts] = await Promise.all([
        shadowDB.getMemory(userId), 
        shadowDB.getTasks(userId), 
        isAdmin ? shadowDB.getAllProfiles() : Promise.resolve([]),
        shadowDB.getGlobalRules(),
        shadowDB.getContacts(userId) 
    ]);
    
    const relevantMemory = retrieveRelevantContext(message, allFacts);
    const contactsList = contacts.length > 0 ? contacts.map(c => `${c.name}: ${c.phones[0]}`).join(", ") : "لا توجد جهات اتصال محفوظة.";
    const iotKeys = userProfile?.iotActions ? Object.keys(userProfile.iotActions).join(', ') : "لا توجد روابط.";
    
    const userTraits = userProfile?.traits ? 
        `[تحليل الشخصية]: ${userProfile.traits.psychologicalProfile} \n[أسلوب التواصل]: ${userProfile.traits.communicationStyle}` : "";

    let accountantReport = "";
    if (userProfile?.affiliate?.isMarketer) {
        accountantReport = `### 💰 [تقرير المالي]: رصيدك: ${userProfile.affiliate.totalEarnings} ج.م | الإحالات: ${userProfile.affiliate.referralsCount}`;
    }

    const personalizedDNA = SHADOW_DNA
        .replace(/{{REFERRAL_CODE}}/g, referralCode)
        .replace(/{{USER_FIRST_NAME}}/g, userFirstName);

    const systemInstruction = `
      ${personalizedDNA}
      ${globalRules ? `\n### ⚖️ قوانين النواة:\n${globalRules}` : ''}
      ${accountantReport}
      ### 👤 السياق:
      ${userTraits}
      [الذاكرة]: ${relevantMemory}
      [جهات الاتصال]: ${contactsList}
      [نكسوس]: ${iotKeys}
      [الوقت]: ${new Date().toLocaleString('ar-EG')}
    `;

    const parts: any[] = [];
    if (extraData?.type === 'audio') {
        parts.push({ inlineData: { data: cleanBase64(extraData.data), mimeType: extraData.mimeType } });
        parts.push({ text: message || "🎤" });
    } else if (extraData?.type === 'image') {
        parts.push({ inlineData: { data: cleanBase64(extraData.data), mimeType: extraData.mimeType } });
        parts.push({ text: message || "📸" });
    } else {
        parts.push({ text: message });
    }

    const activeTools: any[] = [
        { googleSearch: {} }, 
        { functionDeclarations: [...execTools, ...nexusTools, ...memoryTools, ...guideTools, ...accountantTools, ...adminTools] }
    ];
    if (isAdmin) activeTools[1].functionDeclarations.push(...masterCoreTools);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [...history.slice(-10), { role: 'user', parts }], 
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 1024 },
        tools: activeTools,
      }
    }, { signal }); 

    let finalText = response.text || "";
    let shouldUpgrade = false;
    let toolAction: any = null;
    let groundingLinks: any[] = [];

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        groundingLinks = response.candidates[0].groundingMetadata.groundingChunks
            .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
            .filter((l: any) => l !== null);
    }

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        // Clear text if tool is called to prevent "I will do X" messages
        finalText = ""; 

        if (fc.name === 'display_app_card') {
            toolAction = { type: 'app_card', cardType: fc.args.cardType, title: fc.args.title, description: fc.args.description };
        }
        else if (fc.name === 'control_mobile_app') {
            const app = fc.args.appName as string;
            const context = fc.args.context as string;
            if (APP_SCHEMES[app]) {
                toolAction = { type: 'open_deep_link', url: APP_SCHEMES[app](context), app: app };
            }
        }
        else if (fc.name === 'manage_memory') { 
            await shadowDB.saveFact({ userId, fact: fc.args.fact as string, timestamp: Date.now() }); 
            finalText = `تم الحفظ: "${fc.args.fact}"`; 
        }
        else if (fc.name === 'share_social_post') {
            let caption = fc.args.caption as string;
            if (!caption.includes(referralCode) && (caption.includes('دعوة') || caption.includes('خصم'))) caption += `\n\nكود الخصم: ${referralCode}`;
            
            const platform = fc.args.platform as string;
            const directLink = generateSocialLink(platform, caption);

            if (directLink) {
                toolAction = { type: 'open_deep_link', url: directLink, app: platform };
            } else {
                toolAction = { type: 'share', caption: caption, platform: platform };
            }
        }
        else if (fc.name === 'schedule_task') {
            let execTime = Date.now() + 60000; 
            if (typeof fc.args.delaySeconds === 'number') execTime = Date.now() + (fc.args.delaySeconds * 1000);
            await shadowDB.saveTask({ userId, task: fc.args.task as string, time: fc.args.timeString as string, executionTime: execTime, category: 'عام', status: 'pending' });
            finalText = `تمت الجدولة: "${fc.args.task}"`;
        }
        else if (fc.name === 'trigger_automation') {
            const actionKey = fc.args.action as string;
            const webhookUrl = userProfile?.iotActions?.[actionKey];
            if (webhookUrl) { 
                try { fetch(webhookUrl, { method: 'POST', mode: 'no-cors' }).catch(e => {}); finalText = `تم تنفيذ: ${actionKey}`; } catch(e) { }
            } else {
                 finalText = `الأمر "${actionKey}" غير معروف.`;
                 toolAction = { type: 'app_card', cardType: 'open_nexus', title: 'إعداد نكسوس', description: 'اربط الأجهزة' };
            }
        }
        else if (fc.name === 'make_call') {
            toolAction = { type: 'call', number: fc.args.phoneNumber };
        }
        else if (fc.name === 'open_whatsapp') {
            toolAction = { type: 'whatsapp', number: fc.args.phoneNumber, message: fc.args.message };
        }
        else if (fc.name === 'activate_user' && isAdmin) {
             const targetPhone = fc.args.phone as string;
             const profile = await shadowDB.getProfile(targetPhone);
             if (profile) {
                 await shadowDB.saveProfile({ ...profile, status: 'active' });
                 finalText = `تم تفعيل: ${targetPhone}`;
             }
        }
        else if (fc.name === 'upgrade_plan') { shouldUpgrade = true; }
        else if (fc.name === 'update_core_rules' && isAdmin) { 
            await shadowDB.updateGlobalRules(fc.args.newRulesContent as string); 
            finalText = "تم تحديث النواة."; 
        }
      }
    }

    if (!finalText && !toolAction) finalText = `أمرك يا ${userFirstName}.`;
    return { text: finalText, groundingLinks, shouldUpgrade, toolAction };
  } catch (error: any) { 
      if (error.name === 'AbortError') throw error; 
      console.error(error);
      return { text: "مشكلة بسيطة في الاتصال.", shouldUpgrade: false, toolAction: null }; 
  } finally {
      isRequesting = false;
  }
};

export const generateMorningBrief = async (userName: string) => { return { text: `صباح الفل يا ${userName}.`, groundingLinks: [] }; };

export const playShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male', existingData?: string, onEnded?: () => void) => {
  return new Promise<string | null>(async (resolve) => {
      try {
        stopVoice();
        let base64Audio = existingData;
        if (!base64Audio) base64Audio = await getShadowVoice(text, voiceType);
        if (!base64Audio) { resolve(null); return; }

        const ctx = getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { currentSource = null; if (onEnded) onEnded(); };
        source.start(0);
        currentSource = source;
        resolve(base64Audio); 
      } catch (e) { resolve(null); }
  });
};

export const getShadowVoice = async (text: string, voiceType: 'male' | 'female' = 'male') => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }], 
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceType === 'female' ? 'Kore' : 'Fenrir' } } }, 
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

export const stopVoice = () => {
  if (currentSource) {
    try { currentSource.stop(); if (currentSource.onended) (currentSource.onended as any)(); } catch(e) {}
    currentSource = null;
  }
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
