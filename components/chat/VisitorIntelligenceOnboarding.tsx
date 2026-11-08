import React, { useState } from 'react';
import { 
  Sparkles, Building2, Rocket, Globe, Smartphone, ArrowRight, 
  CheckCircle, Play, RefreshCw, Send, DollarSign, Share2, Layers, Bot
} from 'lucide-react';
import { playShadowVoice } from '../../services/speechService';

interface VisitorIntelligenceOnboardingProps {
  onComplete?: (brandData: any) => void;
  onSwitchToAdmin?: () => void;
}

export const VisitorIntelligenceOnboarding: React.FC<VisitorIntelligenceOnboardingProps> = ({
  onComplete,
  onSwitchToAdmin
}) => {
  // Current Conversation Step in the Intelligence Interrogation
  // 1: Has Business? (from scratch vs existing)
  // 2A: From Scratch -> Industry & Name Generation
  // 3A: From Scratch -> Brand Identity, App Link & 1-Week Launch Plan
  // 2B: Existing Business -> Sales Channels (Store / Page / Web / WhatsApp)
  // 3B: Existing Business -> Connect & Growth Package (5,000 EGP Bundled)
  // 4: Complete & Trial Activation + Viral "اعمل فلوس" Loop
  const [step, setStep] = useState<number>(1);
  const [hasExistingBusiness, setHasExistingBusiness] = useState<boolean | null>(null);

  // Form & AI Generation State
  const [industry, setIndustry] = useState('');
  const [brandName, setBrandName] = useState('');
  const [salesChannel, setSalesChannel] = useState('');
  const [phone, setPhone] = useState('');
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referralCode] = useState(() => 'VIP_' + Math.floor(1000 + Math.random() * 9000));

  // Generated Plan & Output
  const [generatedAppUrl, setGeneratedAppUrl] = useState('');
  const [weekPlan, setWeekPlan] = useState<any[]>([]);

  // Step 1: Initial Question (Zero-to-One vs Existing)
  const handleSelectBusinessStatus = (hasBusiness: boolean) => {
    setHasExistingBusiness(hasBusiness);
    if (!hasBusiness) {
      setStep(2); // Scratch path
      playShadowVoice("على بركة الله! سيب القيادة ليا وركز إنت في البيزنس. قولي يا غالي، إيه المجال أو النشاط اللي بتفكر فيه؟", 'male');
    } else {
      setStep(4); // Existing path
      playShadowVoice("نورتنا يا فندم! طب قولي بتبيع وتستقبل عملاءك إزاي حالياً؟ محل على الأرض ولا صفحة سوشيال ولا موقع ولا واتساب فقط؟", 'male');
    }
  };

  // Scratch Path: Name Generation
  const handleGenerateNames = (chosenIndustry: string) => {
    setIndustry(chosenIndustry);
    setIsGenerating(true);

    const namesMap: Record<string, string[]> = {
      'تأجير سيارات': ['إليت ليموزين VIP', 'أورينت كارز مصر', 'رويال درايف للسيارات'],
      'عيادات وطب أسنان': ['عيادات بريمير دينتال', 'كريستال كير التخصصية', 'دايموند سمايل'],
      'خدمات ونظافة': ['برو كلين للخدمات المتكاملة', 'ماستر كير مصر', 'سوبر شاين للتعقيم'],
      'عقارات ومقاولات': ['برايم جيتس للتطوير', 'سكاي هوم العقارية', 'رواد المعمار'],
      'متاجر وأزياء': ['ستايل هاب مصر', 'تريند زون فاشون', 'أوربان كوليكشن']
    };

    const pool = namesMap[chosenIndustry] || ['رويال جروب', 'أفق الرقمية', 'إليت سوليوشنز'];
    setTimeout(() => {
      setSuggestedNames(pool);
      setBrandName(pool[0]);
      setIsGenerating(false);
      playShadowVoice(`اقترحت عليك 3 أسماء ليهم هيبة في السوق لمجال ${chosenIndustry}. اختار الأنسب ليك عشان نولد الهوية والتطبيق فوراً!`, 'male');
    }, 1000);
  };

  // Scratch Path: Launch Brand Creation
  const handleLaunchScratchBrand = async () => {
    setIsGenerating(true);
    const cleanSlug = brandName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    const localStoreUrl = `${window.location.origin}/store/${cleanSlug || 'elite-brand'}`;
    setGeneratedAppUrl(localStoreUrl);

    try {
      const res = await fetch('/api/cloner/clone-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandName,
          industry: industry || 'خدمات عامة',
          phone: phone || '01013373634',
          ownerEmail: 'client@t2digital.com'
        })
      });
      const data = await res.json();
      if (data.success && data.brand) {
        if (data.brand.weekContentPlan && data.brand.weekContentPlan.length > 0) {
          setWeekPlan(data.brand.weekContentPlan.map((p: any) => ({
            day: p.day,
            type: p.contentType,
            hook: p.hook,
            cta: p.caption
          })));
        }
      }
    } catch {
      // Fallback 1-Week Launch Strategy
      const plan = [
        { day: 'السبت (اليوم 1)', type: 'بوست إطلاق رسمي (Feed 1:1)', hook: `فخامة تليق بمقامك - رسمياً انطلاق أحدث خدمات ${brandName} في مصر!`, cta: 'حجز فوري بخصم 10%' },
        { day: 'الأحد (اليوم 2)', type: 'فيديو ريلز طرش (Reels 9:16)', hook: `ليه تدفع أكتر لما تقدر تستمتع بأعلى جودة مع ${brandName}؟`, cta: 'شاهد التجربة كاملة' },
        { day: 'الثلاثاء (اليوم 3)', type: 'كاروسيل تعليمي (Carousel)', hook: `3 أخطاء شائعة تجنبها تماماً قبل ما تختار خدمتك!`, cta: 'استشارة مجانية بالواتساب' },
        { day: 'الخميس (اليوم 4)', type: 'عرض نهاية الأسبوع (Story 9:16)', hook: `عرض حصري لـ 24 ساعة فقط - خصم فوري مع سداد 25% عربون جدية!`, cta: 'احجز مكانك الآن' }
      ];
      setWeekPlan(plan);
    }

    setIsGenerating(false);
    setStep(3);
    playShadowVoice(`ألف مبروك يا فندم! تطبيقك بقى لايف على الرابط، وجهزتلك لوجو وهوية كاملة، مع خطة محتوى أسبوع كامل تشمل بوستات وفيديوهات ريلز طرش! كل الأنظمة شغالة ومستعدة.`, 'male');
  };

  // Existing Business Path: Connect Channels & Activate Growth Package
  const handleActivateExistingBusiness = async (channel: string) => {
    setSalesChannel(channel);
    setIsGenerating(true);

    try {
      const cleanSlug = (brandName || 't2-partner').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const localStoreUrl = `${window.location.origin}/store/${cleanSlug}`;
      setGeneratedAppUrl(localStoreUrl);

      await fetch('/api/cloner/clone-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandName || 'براند شريك T2',
          industry: 'نشاط قائم - مبيعات وسوشيال',
          phone: phone || '01013373634',
          ownerEmail: 'client@t2digital.com'
        })
      });
    } catch {}

    setTimeout(() => {
      setIsGenerating(false);
      setStep(5);
      playShadowVoice(`تم بنجاح تأكيد ربط نشاطك القائم! وكيل الواتساب والسوشيال الذكي بصوت بشري جاهز للرد في 3 ثواني، وتطبيقك المستنسخ تم تفعيله، وباقة النمو 5000 جنيه (نصها إعلانات ممولة للتطبيق ورسايل السوشيال) جاهزة لبدء التجربة المجانية 7 أيام كاملة!`, 'male');
    }, 1200);
  };

  return (
    <div className="w-full max-w-xl bg-[#04081c]/95 border-2 border-emerald-500/40 rounded-3xl p-4 md:p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col gap-4 text-right animate-in fade-in backdrop-blur-md font-['Cairo']">
      
      {/* Top Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-black font-black">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              محراب جارفيس للاستجواب الفريندلي وتأسيس البيزنس
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                AI Onboarding 0→1
              </span>
            </h3>
            <p className="text-[11px] text-white/50">محادثة حية ذكية تؤسس وتطلق مشروعك أو تضاعف مبيعاتك القائمة</p>
          </div>
        </div>

        <button 
          onClick={onSwitchToAdmin}
          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 transition"
        >
          👑 العودة لوضع الأدمن
        </button>
      </div>

      {/* ========================================================= */}
      {/* STAGE 1: HAS BUSINESS OR ZERO-TO-ONE?                    */}
      {/* ========================================================= */}
      {step === 1 && (
        <div className="space-y-4 py-2 animate-in zoom-in-95">
          <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/30 text-center space-y-1">
            <span className="text-xs text-cyan-300 font-bold">🗣️ جارفيس يسألك بود واحترافية:</span>
            <p className="text-sm font-bold text-white">
              "يا مرحب بيك يا فندم في محراب T2 السيادي.. قولي يا غالي، هل عندك نشاط تجاري قائم بالفعل وشغال، ولا دي فكرة جديدة وبتبدأ معانا من الصفر؟"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleSelectBusinessStatus(false)}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-[#020d1a] border-2 border-emerald-500/40 hover:border-emerald-400 hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-2 group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <Rocket className="w-6 h-6" />
              </div>
              <div className="text-sm font-black text-white">🚀 فكرة جديدة وببدأ من الصفر (0→1)</div>
              <p className="text-[10px] text-white/60">هنبتكر الاسم واللوجو، وننشئ صفحة السوشيال وتطبيق الويب، وخطة الأسبوع الأول كاملة!</p>
            </button>

            <button
              onClick={() => handleSelectBusinessStatus(true)}
              className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-[#020d1a] border-2 border-cyan-500/40 hover:border-cyan-400 hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-2 group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-sm font-black text-white">🏢 عندي نشاط وبيزنس قائم وشغال</div>
              <p className="text-[10px] text-white/60">هنربط صفحاتك وأرقامك، ونشغل الأجنت بصوت بشري، ونفعل باقة النمو المدمجة بالإعلانات!</p>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2A: FROM SCRATCH -> INDUSTRY & NAME GENERATION      */}
      {/* ========================================================= */}
      {step === 2 && (
        <div className="space-y-4 py-1 animate-in zoom-in-95">
          <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/30 text-xs text-emerald-300 font-bold">
            💡 "إيه المجال أو النشاط اللي حابب تطلقه في السوق؟ اضغط على مجالك أو اكتبه:"
          </div>

          <div className="flex flex-wrap gap-2">
            {['تأجير سيارات', 'عيادات وطب أسنان', 'خدمات ونظافة', 'عقارات ومقاولات', 'متاجر وأزياء'].map(cat => (
              <button
                key={cat}
                onClick={() => handleGenerateNames(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  industry === cat 
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30' 
                    : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isGenerating ? (
            <div className="p-6 text-center text-cyan-400 text-xs font-bold animate-pulse space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
              <p>جارفيس يدرس السوق المصري ويولد أقوى الأسماء التجارية الرنانة...</p>
            </div>
          ) : suggestedNames.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-amber-300">
                ✨ الأسماء المقترحة ذات الهيبة والمصداقية (اضغط لاختيار اسمك الرسمي):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {suggestedNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setBrandName(name)}
                    className={`p-2.5 rounded-xl text-xs font-black border transition ${
                      brandName === name 
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">رقم الواتساب لاستقبال الحجوزات والطلبات:</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01013373634 أو +201..."
                  className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <button
                onClick={handleLaunchScratchBrand}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                تأسيس البراند واستنساخ التطبيق وخطة المحتوى فوراً
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 3A: FROM SCRATCH COMPLETED -> APP LINK & WEEK PLAN   */}
      {/* ========================================================= */}
      {step === 3 && (
        <div className="space-y-4 py-1 animate-in zoom-in-95">
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-black text-white">رسمياً تم تأسيس براند: {brandName}!</h4>
              <p className="text-xs text-emerald-300">تم حجز الهوية، وبناء الكتالوج، وإطلاق رابط التطبيق المباشر.</p>
            </div>
          </div>

          {/* Generated App Link Card */}
          <div className="p-3 rounded-2xl bg-black/60 border border-cyan-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[10px] text-cyan-300 font-bold block">رابط تطبيقك المستنسخ للعملاء (PWA):</span>
                <span className="text-xs font-mono text-white truncate max-w-[220px] block">{generatedAppUrl}</span>
              </div>
            </div>
            <a 
              href={generatedAppUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black flex items-center gap-1 shadow-md transition"
            >
              فتح التطبيق
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 1-Week Launch Strategy Box */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              خطة الأسبوع الأول لإطلاق ونشر المحتوى (تيتو ستوديو):
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {weekPlan.map((p, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">{p.day}</span>
                    <span className="text-[9.5px] bg-purple-500/20 text-purple-300 px-2 py-0.2 rounded-full font-mono">{p.type}</span>
                  </div>
                  <p className="text-white font-medium">"{p.hook}"</p>
                  <span className="text-[9.5px] text-emerald-400 font-bold">الزرار: {p.cta}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/60">بدأت التجربة المجانية الكاملة (شاملة التطبيق)</span>
            <button
              onClick={() => setStep(5)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black rounded-xl shadow-md transition"
            >
              استعراض خيارات الاشتراك والأرباح
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2B: EXISTING BUSINESS -> SALES CHANNELS             */}
      {/* ========================================================= */}
      {step === 4 && (
        <div className="space-y-4 py-1 animate-in zoom-in-95">
          <div className="p-3 rounded-2xl bg-black/40 border border-cyan-500/30 text-xs text-cyan-300 font-bold">
            🏢 "اكتب اسم بيزنسك الحالي، واختر القناة الأساسية اللي بتبيع وتستقبل زباينك عليها:"
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">اسم البراند أو العيادة أو الشركة الحالية:</label>
              <input 
                type="text" 
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="مثال: عيادة دكتور حسام للأسنان، معرض البركة للسيارات"
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1">رقم الواتساب الحالي للشغل:</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01013373634"
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-amber-300">أين تتواجد مبيعاتك الحالية أكثر؟</label>
            <div className="grid grid-cols-2 gap-2">
              {['محل / مقر أرضي على الشارع', 'صفحات فيسبوك وإنستجرام', 'شات ومجموعات واتساب فقط', 'موقع إلكتروني أو تطبيق'].map(ch => (
                <button
                  key={ch}
                  onClick={() => handleActivateExistingBusiness(ch)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 hover:bg-cyan-950/30 text-xs font-bold text-white text-right transition"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 5: BUNDLED GROWTH PACKAGES & VIRAL "اعمل فلوس" LOOP */}
      {/* ========================================================= */}
      {step === 5 && (
        <div className="space-y-4 py-1 animate-in zoom-in-95">
          <div className="text-center space-y-1">
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full font-bold">
              🔥 معادلة النمو المدمجة (50% إعلانات ممولة + 50% نظام وأجنت)
            </span>
            <h4 className="text-sm font-black text-white">اختر خطة انطلاقك بعد الأسبوع التجريبي المجاني</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Package 2500: Entry Level (WhatsApp & Messages Only - No App) */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-white/70">باقة الانطلاق الأساسية</div>
                <div className="text-base font-black text-white">2,500 ج.م <span className="text-xs font-normal text-white/50">/ شهر</span></div>
                <p className="text-[10px] text-white/60 pt-1">1,250 ج إعلانات ممولة لرسايل الواتساب + وكيل الرد الآلي 24 ساعة.</p>
                <div className="mt-2 text-[9.5px] text-rose-400 font-bold bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                  ⚠️ لا تشمل تطبيق الويب المستنسخ بعد انتهاء التجربة.
                </div>
              </div>
              <button 
                onClick={() => alert("تم اختيار باقة الانطلاق (2500 ج) بنجاح!")}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition"
              >
                اختيار باقة 2,500 ج
              </button>
            </div>

            {/* Package 5000: The Growth Package (Includes Cloned Web App + Conversion Ads) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-[#020d1a] border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] space-y-2 flex flex-col justify-between relative">
              <span className="absolute -top-2.5 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                ⭐ الأكثر طلباً (تشمل التطبيق)
              </span>
              <div>
                <div className="text-xs font-black text-amber-300">باقة النمو المتكاملة</div>
                <div className="text-base font-black text-white">5,000 ج.م <span className="text-xs font-normal text-white/50">/ شهر</span></div>
                <p className="text-[10px] text-white/70 pt-1">2,500 ج إعلانات ممولة لرسايل الواتساب والتحويل لتطبيقك + وكيل الرد الذكي بصوت بشري + تطبيق ويب كامل باسمك.</p>
                <div className="mt-2 text-[9.5px] text-emerald-400 font-bold bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                  ✅ استمرار تطبيق الويب المستنسخ مفتوحاً 100%.
                </div>
              </div>
              <button 
                onClick={() => alert("تم تفعيل باقة النمو (5000 ج) بنجاح!")}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-black font-black text-xs rounded-xl shadow-md transition"
              >
                تفعيل باقة النمو (5,000 ج)
              </button>
            </div>
          </div>

          {/* Viral Marketing Loop: "اعمل فلوس" Box */}
          <div className="p-3.5 rounded-2xl bg-[#03091e] border border-cyan-500/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                مش جاهز تشترك دلوقتي؟ دوس "اعمل فلوس"!
              </span>
              <p className="text-[10px] text-white/50">سوّق للمنظومة بكودك <span className="font-mono text-cyan-400 font-bold">{referralCode}</span> وجارفيس هيولدلك بوستات تسويقية تكسب منها عمولات حقيقية!</p>
            </div>
            <button 
              onClick={() => {
                const link = `https://Ez-zel.vercel.app/?ref=${referralCode}`;
                navigator.clipboard.writeText(link);
                alert(`تم نسخ رابط الإحالة التسويقي الخاص بك:\n${link}\nانشره الآن واكسب عمولات مع كل اشتراك!`);
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-black font-black text-xs flex items-center gap-1 shrink-0 shadow-md transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              اعمل فلوس
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
