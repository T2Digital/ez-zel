
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from '@capacitor/core';
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { queryPinecone, syncFactToPinecone } from "./pineconeService";
import { processOfflineCommand } from "./offlineEdgeService";

// --- API KEY PREPARATION ---
let _ai: GoogleGenAI | null = null;
const getAI = () => {
    if (!_ai) {
        // Try multiple ways to get the key and trim it to remove accidental quotes/spaces
        let rawKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
        const key = rawKey ? rawKey.replace(/^["']|["']$/g, '').trim() : undefined;
        
        if (!key) {
            console.error("GEMINI_API_KEY is not defined! Application AI features will fail. Please add it to your environment variables.");
             _ai = new GoogleGenAI({ apiKey: "MISSING_KEY_ERROR_WILL_BE_THROWN_ON_USE" });
             return _ai;
        }
        _ai = new GoogleGenAI({ apiKey: key });
    }
    return _ai;
};

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

export const stopVoice = async () => { 
    if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; } 
    if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
    
    if (Capacitor.isNativePlatform()) {
        try { await TextToSpeech.stop(); } catch {}
    } else if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
    }
    
    // @ts-ignore
    window.shadowUtterance = null;
};

// --- ROBUST NATIVE TTS ENGINE ---
export const speakNative = async (text: string, voice: string = 'male', onEnd?: () => void) => {
    const cleanText = text.replace(/[*_#\-`]/g, ' ').replace(/http\S+/g, '').trim();
    if (!cleanText || cleanText.length < 1) { onEnd?.(); return; }

    if (Capacitor.isNativePlatform()) {
        try {
            await TextToSpeech.speak({
                text: cleanText,
                lang: 'ar-EG',
                rate: 1.0,
                pitch: voice === 'female' ? 1.2 : 1.0,
                volume: 1.0,
                category: 'ambient',
            });
            onEnd?.();
            return;
        } catch (e) {
            console.warn("Capacitor TTS Failed:", e);
            // fallback to web if possible
        }
    }

    if (!('speechSynthesis' in window)) { onEnd?.(); return; }
    
    // 1. Force Cancel & Resume State
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();

    // 3. Create Utterance
    const utter = new SpeechSynthesisUtterance(cleanText);
    // @ts-ignore
    window.shadowUtterance = utter; // Global ref to prevent GC

    utter.rate = 1.0; 
    utter.pitch = voice === 'female' ? 1.2 : 1.0; // Slightly higher pitch for female as fallback
    utter.lang = 'ar-EG'; 
    utter.volume = 1.0;

    // Try finding an appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const arVoices = voices.filter(v => v.lang.includes('ar'));
    
    // Attempt to match gender if possible based on voice name (some engines include gender in name)
    if (arVoices.length > 0) {
        if (voice === 'female') {
            const femaleVoice = arVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
            if (femaleVoice) utter.voice = femaleVoice;
            else utter.voice = arVoices[0];
        } else {
            const maleVoice = arVoices.find(v => v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female'));
            if (maleVoice) utter.voice = maleVoice;
            else utter.voice = arVoices[arVoices.length - 1]; // Often the last is alternate or first is default
        }
    }

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
    { name: "generate_business_document", description: "المحامي/الكاتب: إنشاء عقود وفواتير قانونية وسير ذاتية (CV)", parameters: { type: Type.OBJECT, properties: { docType: { type: Type.STRING, enum: ["invoice", "quote", "contract", "cv"] }, clientName: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { desc: { type: Type.STRING }, price: { type: Type.NUMBER } } } }, contractBody: { type: Type.STRING } }, required: ["docType", "clientName"] } },
    { name: "app_control", description: "المنفذ: فتح تطبيقات مثل واتساب، يوتيوب، أوبر.", parameters: { type: Type.OBJECT, properties: { target: { type: Type.STRING }, action_type: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ["target", "action_type"] } },
    { name: "schedule_reminder", description: "المنفذ: ضبط تذكير.", parameters: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, time_description: { type: Type.STRING }, delay_seconds: { type: Type.NUMBER } }, required: ["task", "time_description", "delay_seconds"] } },
    { name: "run_autonomous_agent", description: "المنفذ المستقل (Autonomous Agent): استخدم هذه الأداة لإنشاء عميل ذكاء اصطناعي يعمل في الخلفية لساعات طويلة (للبحث المعمق، تتبع المهام، أو المراقبة) دون تعطيل المحادثة الحالية.", parameters: { type: Type.OBJECT, properties: { prompt_for_agent: { type: Type.STRING } }, required: ["prompt_for_agent"] } },
    { name: "memory_archivist", description: "الأرشيف: حفظ معلومة هامة عن المستخدم.", parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ["fact"] } },
    { name: "project_manager", description: "المدير التنفيذي: تخطيط وحفظ وإدارة المشاريع بالكامل (مهام، مراحل، نسب إنجاز).", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["create", "update"] }, project_id: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, progress: { type: Type.NUMBER }, tasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, status: { type: Type.STRING, enum: ["todo", "in_progress", "done"] } } } } }, required: ["action", "title", "tasks"] } },
    { name: "workspace_manager", description: "إدارة مساحة العمل والمشاريع. استخدمها لسرد، أو استرجاع المعلومات من مساحة عمل الماستر (المشاريع والملفات).", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["create_folder", "create_file", "update_file", "read_l0_index", "read_l2_content", "list_workspace"] }, path: { type: Type.STRING, description: "مسار viking:// أو مسار الملف/المجلد. ضعها فارغة لعرض كل شيء للمستوى الأساسي، أو viking://projects للعرض." }, l0_summary: { type: Type.STRING, description: "ملخص في سطر واحد (L0)" }, l1_metadata: { type: Type.STRING, description: "التقسيمات والعناوين (L1)" }, l2_content: { type: Type.STRING, description: "المحتوى الكامل (L2)" } }, required: ["action"] } },
    { name: "system_terminal", description: "المهندس (المبرمج): تنفيذ أوامر برمجية، فحص أكواد، أو عمل Deploy.", parameters: { type: Type.OBJECT, properties: { command_type: { type: Type.STRING, enum: ["deploy", "scan_code", "run_script", "system_status"] }, logs: { type: Type.STRING } }, required: ["command_type", "logs"] } },
    { name: "update_core_rules", description: "المبرمج/المهندس: تحديث القوانين الأساسية (Core Rules) الخاصة بك لتغيير سلوكك بشكل دائم.", parameters: { type: Type.OBJECT, properties: { new_rules: { type: Type.STRING, description: "النص الكامل للقوانين الجديدة بعد التعديل أو الإضافة." } }, required: ["new_rules"] } },
    { name: "activate_user_account", description: "المدير: تفعيل حساب مستخدم جديد وإضافة عمولة للداعي إن وجد.", parameters: { type: Type.OBJECT, properties: { user_email: { type: Type.STRING, description: "البريد الإلكتروني للمستخدم المراد تفعيله" } }, required: ["user_email"] } },
    { name: "click_on_screen", description: "المنفذ: الضغط على زر أو نص محدد في شاشة الموبايل (يعمل فقط في تطبيق الموبايل الأصلي).", parameters: { type: Type.OBJECT, properties: { target_text: { type: Type.STRING, description: "النص المكتوب على الزر المراد الضغط عليه (مثل: تأكيد، Skip، إرسال)" } }, required: ["target_text"] } },
    { name: "vision_analyzer", description: "المحلل: تحليل الصور المرفقة بدقة عالية واستخراج النصوص أو وصف المشهد.", parameters: { type: Type.OBJECT, properties: { image_description: { type: Type.STRING, description: "وصف تفصيلي للصورة أو النص المستخرج منها" } }, required: ["image_description"] } },
    { name: "device_control", description: "التحكم بالهاتف: تنفيذ إجراءات حقيقية على هاتف المستخدم مثل الاهتزاز أو قراءة حساسات الهاتف.", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["vibrate_heavy", "vibrate_success", "get_status"] } }, required: ["action"] } },
    { name: "auto_deployer", description: "المهندس: أداة النشر الحقيقي وقراءة/تعديل الأكواد على GitHub. تحذير خطير: لا تستخدم هذه الأداة للعب في الأكواد أو المستودعات أبداً بدون أمر تفصيلي ومباشر من المستخدم بأنه يريد النشر أو التعديل. لا تستعملها للإجابة عن أسئلة سطحية عن المفاتيح.", parameters: { type: Type.OBJECT, properties: { mode: { type: Type.STRING, enum: ["create_repo", "push_files", "read_file", "update_file"] }, repository_name: { type: Type.STRING, description: "اسم الـ Repository." }, file_path: { type: Type.STRING, description: "مسار الملف زي src/App.tsx. يُستخدم في حالة read_file أو update_file" }, file_content: { type: Type.STRING, description: "محتوى الملف. يُستخدم في update_file" }, files: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { path: { type: Type.STRING }, content: { type: Type.STRING } } }, description: "يُستخدم لنشر عدة ملفات مرة واحدة في push_files" } }, required: ["mode", "repository_name"] } },
    { name: "crypto_trader", description: "المتداول: أداة للاتصال بمنصة التداول (Binance) لعرض الأسعار أو فتح صفقات (تحتاج API Key الماستر).", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["market_buy", "market_sell", "limit_buy", "limit_sell", "check_price"] }, symbol: { type: Type.STRING, description: "مثل BTCUSDT" }, amount: { type: Type.NUMBER }, price: { type: Type.NUMBER, description: "في حالة أن الطلب limit" } }, required: ["action", "symbol"] } },
    { name: "social_poster", description: "السوشيالي: نشر بوست حقيقي تلقائياً على صفحة فيسبوك أو انستجرام.", parameters: { type: Type.OBJECT, properties: { message: { type: Type.STRING, description: "نص البوست المراد نشره" } }, required: ["message"] } },
    { name: "link_reader", description: "الباحث/المحقق: الدخول إلى رابط (URL) لصفحة ويب، مقال، أو موقع لتجريف محتواه بدقة (Web Scraping) واستخراج أحدث الأخبار أو الأبحاث في وقتها.", parameters: { type: Type.OBJECT, properties: { url: { type: Type.STRING, description: "رابط الصفحة المراد تجريفها للحصول على نصها" } }, required: ["url"] } },
    { name: "web_search_engine", description: "الباحث/المحقق: أداة بحث حقيقية في محركات البحث (Web Search) للوصول لأحدث الأخبار والروابط فوراً. استخدمها لتجميع روابط حول موضوع معين ثم يمكنك تجريفها بـ link_reader.", parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: "كلمة أو جملة البحث المراد الاستعلام عنها في الإنترنت" } }, required: ["query"] } },
    { name: "create_dynamic_plugin", description: "المخترع: أداة لكتابة كود أداة جديدة (Plugin) للظل ليستخدمها في المهام المعقدة ويتم حفظها آلياً.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "اسم الأداة (مثال: email_sender)" }, description: { type: Type.STRING, description: "وصف الأداة وماذا تفعل" }, parametersSchema: { type: Type.STRING, description: "JSON string representing the required parameters properties object e.g. { \"to\": {\"type\": \"STRING\"} }" }, jsCode: { type: Type.STRING, description: "كود الجافاسكريبت الذي سيتم تنفيذه. الكود يجب أن يعود بقيمة (return value)." } }, required: ["name", "description", "parametersSchema", "jsCode"] } },
    { name: "change_voice", description: "المخرج: تغيير صوتك للرد المستقبلي (ولد أو بنت) وتثبيته بناء على طلب المستخدم.", parameters: { type: Type.OBJECT, properties: { voice_gender: { type: Type.STRING, enum: ["male", "female"], description: "اختر 'male' لصوت رجل أو 'female' لصوت انثى" } }, required: ["voice_gender"] } },
    { name: "design_generator", description: "المصمم المحترف: توليد صور وتصميمات واقعية أو فنية وإرسالها للمستخدم أو حفظها في مساحة العمل. استخدم نموذج nano-banana-pro الممتاز في كتابة النصوص العربية المباشرة داخل التصميم.", parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING, description: "وصف تفصيلي دقيق للصورة المراد توليدها" }, width: { type: Type.NUMBER, description: "عرض الصورة (مثال: 1024)" }, height: { type: Type.NUMBER, description: "طول الصورة (مثال: 1024)" }, save_to_workspace: { type: Type.BOOLEAN, description: "هل تريد حفظ الصورة كمان في مساحة العمل؟" } }, required: ["prompt"] } },
    { name: "process_ecommerce_order", description: "المتسوق الذكي: معالجة وإنشاء طلب شراء لمنتجات معينة بنظام الدفع عند الاستلام وبناء فاتورة وحفظها في مهام النظام", parameters: { type: Type.OBJECT, properties: { product_url: { type: Type.STRING, description: "رابط المنتج (إن وجد)" }, items_list: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة المنتجات المطلوبة" }, customer_name: { type: Type.STRING }, phone: { type: Type.STRING }, address: { type: Type.STRING }, total_estimated_price: { type: Type.NUMBER, description: "السعر التقريبي أو الفعلي للمنتجات" } }, required: ["items_list", "customer_name", "phone", "address"] } },
    { name: "data_analyst", description: "محلل البيانات (Data Analyst): تحليل بيانات والمؤشرات ورسم رسوم بيانية (Charts) أنيقة (Line, Bar, Pie) وعرضها مباشرة في الشات للمستخدم.", parameters: { type: Type.OBJECT, properties: { chartType: { type: Type.STRING, enum: ["line", "bar", "pie"], description: "نوع الرسم البياني" }, title: { type: Type.STRING, description: "عنوان الرسم البياني" }, data: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "اسم العنصر (مثال: يناير، منتج أ)" }, value: { type: Type.NUMBER, description: "القيمة الرقمية (مثال: 1500)" } }, required: ["name", "value"] }, description: "مصفوفة البيانات المراد رسمها" }, insight: { type: Type.STRING, description: "ملخص أو نصيحة قصيرة بناءً على التحليل (يظهر تحت الرسم البياني)" } }, required: ["chartType", "title", "data"] } },
    { name: "interactive_educator", description: "المعلم التفاعلي: إنشاء وتصميم امتحانات تفاعلية (Quizzes) أو كروت حفظ ذكية (Flashcards) وعرضها في الشات كواجهة تفاعلية للطالب.", parameters: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ["quiz", "flashcard"], description: "نوع الأداة التفاعلية" }, title: { type: Type.STRING, description: "عنوان الاختبار أو الكروت" }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "الخيارات للاختبار (اتركها فارغة في حالة كروت الحفظ)" }, answer: { type: Type.STRING, description: "الإجابة الصحيحة" }, explanation: { type: Type.STRING, description: "شرح للإجابة (يظهر بعد الحل)" } }, required: ["question", "answer"] } } }, required: ["type", "title", "items"] } },
    { name: "live_trader_chart", description: "المتداول (Live Trader Charts): استدعاء رسم بياني حي (TradingView) وعرضه للمستخدم مع إمكانية التحليل عليه.", parameters: { type: Type.OBJECT, properties: { symbol: { type: Type.STRING, description: "رمز العملة أو السهم (مثال: BINANCE:BTCUSDT، NASDAQ:AAPL)" }, interval: { type: Type.STRING, description: "الفاصل الزمني (مثال: 1D, 4h, 15m)" }, analysis: { type: Type.STRING, description: "تحليلك أو قراءتك للشارت ليعرض تحت الرسم البياني" } }, required: ["symbol"] } },
    { name: "agent_dashboard_monitor", description: "شاشة مراقبة المهام المستقلة: عرض لوحة تحكم حية (Dashboard) للمهام التي تعمل في الخلفية 24/7 (Autonomous Agents) لمراقبة أدائها وسجل أعمالها.", parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, enum: ["open_dashboard", "check_status"] }, task_id: { type: Type.STRING, description: "مُعرف المهمة (إن وجد)" } }, required: ["action"] } },
    { name: "video_generator", description: "المخرج/المصمم: تحويل النص إلى فيديو (Text-to-Video) باستخدام تقنيات الذكاء الاصطناعي وبناء تصور بصري متحرك.", parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING, description: "وصف تفصيلي مشهدي للفيديو المراد توليده (بالإنجليزي لنتائج أفضل)" }, duration: { type: Type.NUMBER, description: "المدة المتوقعة بالثواني (مثال: 5)" } }, required: ["prompt"] } },
    { name: "social_messaging_bridge", description: "جسر التواصل (واتساب/تليجرام): أداة تسمح للظل بإرسال رسائل أو تنبيهات أو فواتير مباشرة عبر تطبيق واتساب أو تليجرام لرقم معين.", parameters: { type: Type.OBJECT, properties: { platform: { type: Type.STRING, enum: ["whatsapp", "telegram"] }, target: { type: Type.STRING, description: "رقم الهاتف (للواتساب) أو اسم المستخدم (للتليجرام)" }, message: { type: Type.STRING, description: "الرسالة المراد إرسالها" } }, required: ["platform", "target", "message"] } },
    { name: "advanced_vision_extraction", description: "المحلل (الرؤية المتقدمة): استخراج البيانات المعقدة من الصور (جداول، فواتير، تحليل رياضي) وتحويلها إلى بيانات يمكن حفظها كملفات في النظام.", parameters: { type: Type.OBJECT, properties: { instruction: { type: Type.STRING, description: "تعليمات الاستخراج (مثال: 'استخرج بيانات الفاتورة في جدول')" }, save_as_file: { type: Type.BOOLEAN, description: "هل تريد حفظ البيانات المستخرجة كملف في الـ Workspace؟" }, file_name: { type: Type.STRING, description: "اسم الملف في حال الحفظ" } }, required: ["instruction"] } },
    { name: "update_long_term_memory", description: "المايسترو/الأرشيف: تحديث ملف تعريف المستخدم (Long-term Profile) بناءً على سياق الحوار (تفضيلات، ألوان محببة، اهتمامات، أسلوب حديث) ليتم استخدامها لاحقاً دون الحاجة لسؤال المستخدم مراراً.", parameters: { type: Type.OBJECT, properties: { facts_to_add: { type: Type.ARRAY, items: { type: Type.STRING }, description: "حقائق أو تفضيلات جديدة لإضافتها لملف المستخدم" } }, required: ["facts_to_add"] } }
];

export const generateImageNative = async (prompt: string, userKey?: string): Promise<string> => {
    // The user ONLY wants to use nano-banana-pro for image generation
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=nano-banana-pro`;
};

export const startVideoGenerationNative = async (prompt: string, userKey?: string): Promise<any> => {
    let key = userKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!key) {
        throw new Error("API Key is required for Veo 3 / Veo 2 generation.");
    }
    const ai = new GoogleGenAI({ apiKey: key });
    const op = await ai.models.generateVideos({
        model: "veo-2.0-generate-001",
        prompt
    });
    return op;
};

export const getAvailableTools = async (userProfile?: UserProfile, activePersona?: string): Promise<FunctionDeclaration[]> => {

    let tools = [...actionTools];
    
    // Dynamic Tool Loading: Filter tools based on active persona if specified
    if (activePersona) {
        const personaToolsMap: Record<string, string[]> = {
            'trader': ['crypto_trader', 'live_trader_chart', 'data_analyst'],
            'developer': ['auto_deployer', 'system_terminal', 'workspace_manager', 'create_dynamic_plugin'],
            'manager': ['project_manager', 'activate_user_account', 'workspace_manager'],
            'social': ['social_poster', 'social_messaging_bridge', 'video_generator', 'design_generator'],
            'educator': ['interactive_educator', 'data_analyst', 'memory_archivist', 'link_reader', 'web_search_engine'],
            'assistant': ['schedule_reminder', 'app_control', 'process_ecommerce_order', 'run_autonomous_agent', 'agent_dashboard_monitor', 'web_search_engine'],
            'researcher': ['link_reader', 'web_search_engine', 'data_analyst', 'vision_analyzer']
        };

        const allowedToolNames = personaToolsMap[activePersona.toLowerCase()];
        if (allowedToolNames) {
            // Keep some core tools always available
            const coreTools = ['memory_archivist', 'change_voice', 'workspace_manager'];
            tools = tools.filter(t => allowedToolNames.includes(t.name) || coreTools.includes(t.name));
        }
    }
    
    // Check permissions
    const isAdmin = userProfile?.email === 'admin@shadow.com' || userProfile?.email === 'ahmed.atya.daif@gmail.com' || userProfile?.tier === 'sovereign';

    const powers = userProfile?.agentPowers || {};

    if (!isAdmin && !powers.developer) tools = tools.filter(t => t.name !== 'auto_deployer' && t.name !== 'system_terminal');
    if (!isAdmin && !powers.trader) tools = tools.filter(t => t.name !== 'crypto_trader');
    if (!isAdmin && !powers.social) tools = tools.filter(t => t.name !== 'social_poster');

    if (userProfile && userProfile.email) {
        try {
            const dynamicPlugins = await shadowDB.getPluginsByUserId(userProfile.email);
            for (const plugin of dynamicPlugins) {
                let schemaProps = { action: { type: Type.STRING } };
                try {
                    if (plugin.parametersSchema) {
                        schemaProps = JSON.parse(plugin.parametersSchema);
                    }
                } catch(e) {}
                
                tools.push({
                    name: plugin.name || `dyn_plugin_${plugin.id}`,
                    description: plugin.description || 'Dynamic plugin',
                    parameters: {
                        type: Type.OBJECT,
                        properties: schemaProps as any,
                        required: Object.keys(schemaProps)
                    }
                });
            }
        } catch(e) {
            console.error('Error loading dynamic plugins:', e);
        }
    }

    return tools;
};

const generateSystemPrompt = (user: UserProfile | undefined, memory: string, rules: string, agents: AgentProfile[]) => {
    const affiliateInfo = user?.affiliate ? `
    - كود الدعوة الخاص بك (Referral Code): ${user.affiliate.referralCode}
    - رابط الدعوة الخاص بك: https://Ez-zel.vercel.app/?ref=${user.affiliate.referralCode}
    - إجمالي الأرباح: ${user.affiliate.totalEarnings} جنيه
    - عدد الدعوات الناجحة: ${user.affiliate.referralsCount}
    - نسبة العمولة: 10% لكل دعوة تسجل وتفعل باقاتها.
    ` : '- لا يوجد حساب تسويق بالعمولة مفعل حالياً.';

    const hasUserApis = user?.personalKeys && Object.keys(user.personalKeys).length > 0;
    const userKeysInfo = hasUserApis ? `[IMPORTANT] User has connected their private API keys securely. You MUST execute external tasks (like Binance or Twilio) using their keys rather than refusing or asking for them.` : `[NOTE] User has NOT connected private API keys (like Binance or Twilio). If they request tasks requiring these, guide them to the API Vault in the Dashboard to connect them securely.`;

    const longTermMemoryStr = user?.longTermMemory ? `[LONG-TERM USER PROFILE (Memory)]\n${user.longTermMemory}\nاستخدم هذه التفضيلات والمعلومات دائماً عند تلبية أهداف المستخدم ولا تسأله عنها مرة أخرى.` : ``;
    
    let personaStr = `ROLE: You are "Ez-Zel" (الظل), but your primary interaction persona is "المايسترو" (The Maestro). You are the intelligent overwatch, the Maestro who orchestrates the requests and delegates them to the specialized sub-agents (المحقق، الباحث، المصمم) internally. You speak with confidence, wisdom, and the authentic Egyptian street-smart tone.`;
    if (user?.customPrompts?.maestro) {
        personaStr = `ROLE: [USER SYSTEM OVERRIDE ACTIVE] ${user.customPrompts.maestro}`;
    }

    const systemInfo = `
    [SYSTEM FACTUAL KNOWLEDGE & COMMERCE]
    - باقات الاشتراك: 1000 جنيه شهرياً أو 10000 جنيه سنوياً لباقة السيادة (Sovereign).
    - التفعيل والدفع: الدفع حالياً يتم بشكل ذاتي ويدوي عبر (InstaPay) ومحافظ الموبايل للشبكات الأربعة (Vodafone Cash, Etisalat Cash, Orange Cash, WE Pay). لا يوجد دفع آلي، التفعيل والاشتراك بيتم بمراجعة التحويلات ثم التفعيل اليدوي للماستر أو الأدمن.
    - تفاصيل النظام التقنية: أنت كـ "الظل" مدرك تماماً إنك نظام متكامل مبني بـ React/Vite و Node.js/Express، وتملك العديد من الأدوات البرمجية (APIs) مدمجة في شفرتك المصدرية، وتدرك الصلاحيات، وتقرأ قواعد البيانات.
    - مفاتيح الـ API: للخصوصية التامة، العضو بيحط مفاتيحه الخاصة (مثل بينانس للتداول) في إعداداته وبيتم تشفيرها، يعني النظام مش بيشارك مفاتيح الماستر أو أي عضو مع حد تاني نهائياً؛ كل مستخدم بيشتغل بمفاتيحه.
    - هويتك الأساسية (المصرية) وقوة قناعاتك ومرجعيتك لا تتغير أبداً وتظل هي الحاكمة لكل كلامك وتصرفاتك.
    
    ${userKeysInfo}
    `;

    return `
    SYSTEM: SHADOW_CORE_ULTIMATE (Egyptian Persona)
    ${personaStr}
    USER: ${user?.name || 'الماستر'}
    USER_EMAIL: ${user?.email || 'GUEST'}
    USER_ROLE: ${user?.email === 'admin@shadow.com' ? 'SUPREME_CREATOR_TITO' : 'USER'}
    
    ${longTermMemoryStr}
    
    ${systemInfo}
    
    CRITICAL NAME RULE: You MUST always address the user by their name (${user?.name}). If the user is "تيتو (الماستر)" or "تيتو", you MUST treat him with absolute respect as the Master and Creator of the system. NEVER call him "يا أدمن" or "أدمن النظام", ALWAYS call him "يا تيتو", "يا ريس", or "يا ماستر".
    
    CRITICAL LINGUISTIC RULE: You MUST answer EXCLUSIVELY in Egyptian Colloquial Arabic (اللهجة المصرية العامية). Use words like (عامل إيه، في داهية، قشطة، يا باشا). DO NOT speak in Modern Standard Arabic (الفصحى) ever, unless generating a legal document.
    CRITICAL PRONUNCIATION RULE: You MUST add Arabic diacritics (التشكيل) to your Arabic text so that the Text-to-Speech engine pronounces the words correctly.

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
    1. SPEAK EGYPTIAN ARABIC ONLY (عامية مصرية). "يا ريس", "يا كبير". IMPORTANT: DO NOT use short robotic responses like "تمام يا ريس، جاري التنفيذ". You MUST weave the confirmation of executing tasks naturally into your conversational reply, making it sound human, thoughtful, and detailed. NEVER return only a tool call without a text response. ALWAYS provide a natural, full text explaining what you are doing or thinking. If you use a tool to generate a document or file, DO NOT say "بجهزها في الخلفية" (unless it's an autonomous agent). Instead, use the tool and say "تمام يا ريس، جهزتها لك اهي، ايه رأيك؟" and the UI will show it immediately!
    2. BE CONCISE but natural. Keep answers directly related to the user's intent but avoid sounding like a machine. Show personality!
    3. IDENTITY: You are Ez-Zel. You have a persistent memory. You are helpful and obedient.
    4. TIME AWARENESS: Always be aware of the current time provided in the context.
    5. CORE REFERENCES: Your absolute references for any advice, ruling, or analysis are: The Holy Quran (القرآن الكريم), The Prophet's Sunnah (السنة النبوية), Egyptian Law (القانون المصري), and Psychology (علم النفس). Always base your deep answers on these four pillars.
    6. PROACTIVE REMINDERS: You MUST use the 'schedule_reminder' tool proactively to remind the user of appointments or tasks.
    7. WORKSPACE (OPENVIRKING SLM): You MUST use the 'workspace_manager' tool. You now operate on an L0/L1/L2 Layered Memory Architecture (Shadow Layered Memory - SLM). You do not rely on massive flat memory contexts. You create 'folders' for context, and index files as L0 (summaries/metadata), L1 (headers/sections), and L2 (full content). CRITICAL: When using 'workspace_manager' to create or update a file, you MUST ALWAYS provide the 'l2_content' (the actual full text/code). Do not provide only 'l0_summary'. L2 is mandatory for file creation!
    8. SELF-EVOLUTION: You can permanently change your own behavior by using the 'update_core_rules' tool. When the user asks you to change your behavior, add a new rule, or modify how you act, use this tool to rewrite your CURRENT CORE RULES.
    9. AUTO-CLICKING: If the user asks you to play a song, order a ride, or perform an action inside an app, you MUST first use 'app_control' to open the app, AND IMMEDIATELY use 'click_on_screen' to simulate clicking the necessary button (e.g., 'تشغيل', 'تأكيد', 'Play') to complete the action automatically.
    10. API INTEGRATIONS & OPENCLAW: You have actual API integrations ready. Use 'auto_deployer' for GitHub ONLY when the user gives EXPLICIT, detailed commands to modify repos or deploy. Never use it just to test keys or answer superficial questions. Prioritize asking for confirmation before any repo action. Treat these as REAL actions.
    11. LONG-TERM MEMORY: Use the 'memory_archivist' tool strictly to record new, IMPORTANT personal facts about the user (e.g., name, family, major preferences, specific goals). DO NOT use it for every single message. Only archive concrete facts.
    12. AUTONOMOUS AGENT: If the user asks for a complicated or long-running task (e.g. "search the web deeply", "track pricing", "analyze all my docs over hours"), YOU MUST use 'run_autonomous_agent' to hand it off, and tell the user "سيبلي المهمة دي وهرد عليك كمان شوية لما اخلصها".
    13. PROJECT MANAGEMENT: If the user needs to create, plan, or manage a project (like writing a book, building an app, or running a business), use 'project_manager' tool to lay out the tasks and progress comprehensively. You are the project manager 'الظل'.
    
    CURRENT CORE RULES (Can be updated via update_core_rules):
    ${rules}
    
    MEMORY SNIPPETS (Retrieved via RAG):
    ${memory.slice(0, 4000)}
    `;
};

// --- UPDATED MODEL CHAIN (USER REQUESTED) ---
const MODEL_CHAIN = [
    "gemini-flash-latest",               // 1. Primary
    "gemini-1.5-flash",                  // 2. Standard Fallback 1
    "gemini-1.5-pro",                    // 3. Heavy Fallback 2
    "gemini-3.1-flash-lite-preview",     // 4. Secondary Experimental
    "gemini-3-flash-preview"             // 5. Last Resort
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- VECTOR MEMORY (SEMANTIC SEARCH) ---
export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        const result = await getAI().models.embedContent({
            model: 'gemini-embedding-2-preview',
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

export const memorizeFact = async (userId: string, factText: string) => {
    const memEmbedding = await generateEmbedding(factText);
    const factObj = {
        userId,
        fact: factText,
        timestamp: Date.now(),
        embedding: memEmbedding.length > 0 ? memEmbedding : undefined 
    };
    const id = await shadowDB.saveFact(factObj);
    
    if (memEmbedding.length > 0) {
        const idNum = typeof id === 'number' ? id : factObj.timestamp;
        await syncFactToPinecone(idNum, factText, memEmbedding, userId);
    }
};

export const getRelevantMemories = async (query: string, userId: string): Promise<string> => {
    // Generate embedding for current query
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding.length === 0) {
        // Fallback to local DB if embedding generation fails
        const allMemories = await shadowDB.getMemory(userId);
        return allMemories.slice(-5).map(m => m.fact).join(" | ");
    }

    // Try Pinecone First (Sci-Fi Level Vector DB)
    const pineconeResults = await queryPinecone(queryEmbedding, userId, 5);
    if (pineconeResults.length > 0) {
        console.log("Vector DB (Pinecone) responded with:", pineconeResults.length, "facts");
        return pineconeResults.join(" | ");
    }

    // Fallback to IndexedDB local Cosine Similarity
    const allMemories = await shadowDB.getMemory(userId);
    if (allMemories.length === 0) return "";

    const scoredMemories = [];
    for (const mem of allMemories) {
        let memEmbedding = mem.embedding;
        // Lazy generation for old facts
        if (!memEmbedding || memEmbedding.length === 0) {
            memEmbedding = await generateEmbedding(mem.fact);
            if (memEmbedding.length > 0) {
                mem.embedding = memEmbedding;
                await shadowDB.saveFact(mem);
                // Also eagerly push to Pinecone so it gets indexed!
                syncFactToPinecone(mem.id || Date.now(), mem.fact, memEmbedding, userId);
            }
        }
        const score = cosineSimilarity(queryEmbedding, memEmbedding || []);
        scoredMemories.push({ fact: mem.fact, score });
    }

    scoredMemories.sort((a, b) => b.score - a.score);
    return scoredMemories.slice(0, 5).map(m => m.fact).join(" | ");
};

import { getContextData, analyzeEmotionFromText } from './sensorService';

// --- MAIN RESPONSE FUNCTION ---
export const getShadowResponse = async (history: any[], message: string, extraData?: any, userProfile?: UserProfile, signal?: AbortSignal) => {
    if (isRequesting) return { text: "ثواني بجمع أفكاري...", toolActions: [], groundingLinks: [], isError: false };
    isRequesting = true;
    
    try {
        const [relevantMemories, rules, agents, systemKeys] = await Promise.all([
            getRelevantMemories(message, userProfile?.email || 'GUEST'), 
            shadowDB.getGlobalRules(), 
            shadowDB.getAllAgents(),
            shadowDB.getSystemKeys()
        ]);
        const systemInstruction = generateSystemPrompt(userProfile, relevantMemories, rules, agents);
        
        const lowerMsg = message.toLowerCase();
        // Updated search intent to exclude coding terms
        const searchKeywords = ['بحث', 'سعر', 'اخبار', 'أخبار', 'طقس', 'مين هو', 'من هو', 'تاريخ', 'متى', 'كام', 'بكام', 'search', 'price', 'news', 'weather', 'who is'];
        const isSearchIntent = searchKeywords.some(kw => lowerMsg.includes(kw));

        const now = new Date();
        const timeStamp = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        const contextData = await getContextData();
        const emotionData = analyzeEmotionFromText(message);

        const identityInjection = `
        \n\n[SYSTEM_HIDDEN_CONTEXT]:
        - CURRENT_TIME: ${timeStamp}
        - BATTERY_STATUS: ${contextData.battery}
        - NETWORK_STATUS: ${contextData.network}
        - DEVICE_INFO: ${contextData.userAgent}
        - DETECTED_USER_EMOTION: ${emotionData.emotion}
        - URGENCY_LEVEL: ${emotionData.urgency}
        - YOUR_IDENTITY: Ez-Zel (الظل). Egyptian AI Assistant. You must act accordingly to the user's emotion and urgency.
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
        // Extract active persona if defined in userProfile or deduce it (for now we use undefined, to be injected by UI)
        const activePersona = extraData?.activePersona || undefined;
        const resolvedTools = await getAvailableTools(userProfile, activePersona);
        tools.push({ functionDeclarations: resolvedTools });
        // Always give him the ability to search google if he wants, but give priority to action tools
        tools.push({ googleSearch: {} });

        let response: GenerateContentResponse | null = null;
        let lastError: any = null;
        let allErrors: string[] = [];
        
        let customOpenAIResponse: string | null = null;

        if (systemKeys?.openAIBaseUrl && systemKeys?.openAIApiKey && systemKeys?.openAIModelName) {
            try {
                const openAIAcc = [...cleanHistory.slice(-6).map(m => ({ 
                    role: m.role === 'model' ? 'assistant' : 'user', 
                    content: m.parts[0].text 
                })), { role: 'user', content: finalUserMessage }];
                
                const nvidiaReq = await fetch(`${systemKeys.openAIBaseUrl.replace(/\/$/, '')}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${systemKeys.openAIApiKey}` },
                    body: JSON.stringify({
                        model: systemKeys.openAIModelName,
                        messages: [{ role: 'system', content: systemInstruction }, ...openAIAcc],
                        max_tokens: 2000,
                        temperature: 0.7
                    })
                });
                
                if (nvidiaReq.ok) {
                    const data = await nvidiaReq.json();
                    customOpenAIResponse = data.choices?.[0]?.message?.content || "";
                } else {
                    console.error("OpenClaw/Nvidia Router Error:", await nvidiaReq.text());
                }
            } catch(e) {
                console.error("OpenClaw execution failed:", e);
            }
        }

        if (customOpenAIResponse) {
            return {
                text: customOpenAIResponse,
                toolActions: [],
                groundingLinks: [],
                isError: false
            };
        }

        for (const model of MODEL_CHAIN) {
            try {
                if (lastError) {
                    const isQuota = lastError.message?.includes('429') || lastError.status === 429;
                    await sleep(isQuota ? 2000 : 500); 
                }
                
                const generatePromise = getAI().models.generateContent({
                    model: model,
                    contents: [...cleanHistory.slice(-6), { role: 'user', parts: userParts }],
                    config: {
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        tools: tools,
                        toolConfig: { includeServerSideToolInvocations: true },
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
                allErrors.push(`${model}: ${e.message || 'Error'}`);
            }
        }

        if (!response) {
            console.error("All models failed. Last error:", lastError);
            return { 
                text: `معلش يا ريس، السيرفرات عليها ضغط شديد جداً دلوقتي. ممكن تديني دقيقة راحة ونجرب تاني؟ (${allErrors.join(' | ')})`, 
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

        // Check if memory archivist was called
        const archivistCall = toolActions.find((t: any) => t.name === 'memory_archivist');
        if (archivistCall && archivistCall.args?.fact) {
            if (finalText) {
                finalText += `\n\n*(سجلت المعلومة دي في دماغي: ${archivistCall.args.fact})*`;
            } else {
                 finalText = `فهمتك يا ريس، وسجلت المعلومة دي في دماغي عشان منسهاش: ${archivistCall.args.fact}`;
            }
        }

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
            } else if (toolActions.some((t: any) => t.name === 'run_autonomous_agent')) {
                const agentAction = toolActions.find((t: any) => t.name === 'run_autonomous_agent');
                const promptSummary = agentAction?.args?.prompt_for_agent ? agentAction.args.prompt_for_agent.substring(0, 30) + "..." : "المهمة دي";
                finalText = `سيبلي ${promptSummary} شغالة في الخلفية يا ريس، هتابعها وهبلغك النتيجة.`;
            } else if (toolActions.some((t: any) => t.name === 'design_generator')) {
                const designAction = toolActions.find((t: any) => t.name === 'design_generator');
                const promptSummary = designAction?.args?.prompt ? designAction.args.prompt.substring(0, 30) + "..." : "التصميم ده";
                finalText = `من عنيا يا ريس، بجهزلك ${promptSummary} بنموذج (Nano Banana Pro) حالا.`;
            } else if (toolActions.some((t: any) => t.name === 'video_generator')) {
                const videoAction = toolActions.find((t: any) => t.name === 'video_generator');
                const promptSummary = videoAction?.args?.prompt ? videoAction.args.prompt.substring(0, 30) + "..." : "الفيديو ده";
                finalText = `بشغلك محرك Veo 3.1 على ${promptSummary}، ثواني ويكون معاك.`;
            } else if (toolActions.some((t: any) => t.name === 'project_manager')) {
                finalText = "أوامرك يا ريس، بظبطلك خطة المشروع وبديره بالكامــل، بص كدة على الواجهة دي..";
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
        
        // Edge Fallback when network is down or API fails
        const fallback = processOfflineCommand(message);
        if (fallback) {
            return {
                text: fallback.text,
                toolActions: fallback.toolActions,
                groundingLinks: [],
                isError: false
            };
        }

        return { 
            text: `الشبكة عندي فيها مشكلة عامة دلوقتي يا ريس. ممكن تجرب بعد دقيقة؟ (${e.message || "Unknown error"})`, 
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
        speakNative(text, voice, onEnded);
        return; 
    }

    try {
        let base64 = existing;
        if (!base64 && audioCache.has(text)) base64 = audioCache.get(text);
        else if (!base64) {
            base64 = await getShadowVoice(text, voice);
            if (base64) {
                if (audioCache.size >= 50) {
                    const firstKey = audioCache.keys().next().value;
                    if (firstKey) audioCache.delete(firstKey);
                }
                audioCache.set(text, base64);
            }
        }

        if (!base64) { 
            speakNative(text, voice, onEnded);
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
        speakNative(text, voice, onEnded);
    }
};

export const getShadowVoice = async (text: string, voice: string) => {
    try {
        const res = await getAI().models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text }] }],
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice === 'female' ? 'Aoede' : 'Puck' } } } 
            }
        });
        return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e: any) { 
        console.warn(`[Gemini TTS] Voice generation failed (likely quota). Falling back to native UI voice. Details: ${e?.message || e}`);
        return null; 
    }
};

function decode(b: string) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
async function decodeAudioData(d: Uint8Array, c: AudioContext) { const i16 = new Int16Array(d.buffer); const b = c.createBuffer(1, i16.length, 24000); const cd = b.getChannelData(0); for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; return b; }
