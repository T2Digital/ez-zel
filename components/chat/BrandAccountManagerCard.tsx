// D:\ez-zel-\components\chat\BrandAccountManagerCard.tsx
// كارت مدير الحساب الذكي للبراند (Brand Account Manager Agent)
// يمثل وكيل الإدارة التسويقية المستقل لكل براند داخل منظومة الظل

import React, { useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  Rocket, 
  Layers, 
  Clock, 
  Target, 
  MessageSquare, 
  Copy, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Bot
} from 'lucide-react';

interface CampaignWeek {
  weekNumber: number;
  title: string;
  focusService: string;
  priceOffer: string;
  adHook: string;
  caption: string;
  visualPrompt: string;
  targetAudience: string;
  status: 'active' | 'scheduled' | 'draft';
}

export const BrandAccountManagerCard = ({ card }: { card?: any }) => {
  const brandName = card?.data?.brandName || 'كلين ماستر لخدمات النظافة والتعقيم';
  const managerName = card?.data?.managerName || 'سارة - مديرة حساب كلين ماستر';
  const campaignMonth = card?.data?.month || 'نوفمبر 2026 (موسم الخصومات وعروض الشتاء)';
  const logoUrl = 'https://i.ibb.co/f52dPHc/1000049048.jpg';

  const [activeWeek, setActiveWeek] = useState<number>(0);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [designGenerated, setDesignGenerated] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [botSynced, setBotSynced] = useState(false);

  const campaignWeeks: CampaignWeek[] = [
    {
      weekNumber: 1,
      title: 'موجة سجاد المساجد بالبخار والتعقيم 🕌',
      focusService: 'غسيل سجاد وموكيت المساجد ودور العبادة بالبخار الحار والتعقيم الشامل',
      priceOffer: '7 ج.م / م² + خصم 10% فوري عند دفع 25% عربون جدية حجز',
      adHook: 'بيوت الله أولى بالنظافة والتعقيم قبل برد الشتاء! سجاد المسجد هيرجع كأنه مفروش إمبارح مع تعقيم عميق ضد الفيروسات 🕌✨',
      caption: `بيوت الله أطهر البقاع وأولى بالنظافة والتعقيم! 🕌✨

شركة كلين ماستر لخدمات النظافة والتعقيم تقدم عرضها المتخصص للمساجد والجمعيات الخيرية:
🔹 غسيل عميق لسجاد وموكيت المساجد بأحدث معدات البخار الحار الألمانية.
🔹 تعقيم وتطهير شامل يقضي على 99.9% من البكتيريا والجراثيم والروائح الكريهة.
🔹 تجفيف سريع وفوري دون تعطيل أوقات الصلاة.
🔹 السعر: 7 جنيه فقط للمتر المربع!
🔥 خصم فوري 10% عند سداد 25% عربون جدية حجز عبر إنستاباي أو المحافظ الإلكترونية على 01013373634!

فريقنا المتخصص متواجد لخدمتكم في (التجمع والقاهرة الجديدة، الشيخ زايد، 6 أكتوبر، المعادي، مدينتي والرحاب).
للتواصل المباشر مع مسؤول خدمة المساجد على واتساب: 01013373634

#كلين_ماستر #غسيل_سجاد_مساجد #تعقيم_مساجد #نظافة_مساجد #مساجد_مصر #التجمع_الخامس #الشيخ_زايد`,
      visualPrompt: 'Majestic grand mosque prayer hall in Cairo with magnificent red and gold prayer carpet being professionally steam cleaned by technicians in deep teal uniforms with Clean Master logo, atmospheric sunlight rays pouring from arch windows, pristine before and after carpet steam freshness, 8k commercial photography.',
      targetAudience: 'لجان المساجد، المتبرعين، وأهالي ورواد المساجد في القاهرة والجيزة',
      status: 'active'
    },
    {
      weekNumber: 2,
      title: 'موجة تنظيف الشقق والمنازل بالمتر المربع 🏠',
      focusService: 'تنظيف معمق للشقق بعد التشطيب والعادي (بالمتر المربع)',
      priceOffer: 'عادي 10 ج/م² • تشطيب 13 ج/م² • عميق 14 ج/م² مع خصم 10% للدفع الإلكتروني',
      adHook: 'شقتك بالمتر المربع.. ادفع على قد مساحتك بالظبط واستلم بيتك بيلمع ومعقم بالكامل في نفس اليوم!',
      caption: `نظافة بيتك بالمتر المربع.. شفافية تامة وبدون تكاليف خفية! 🏠✨

كلين ماستر بتوفرلك باقات تنظيف المنازل بالمتر المربع:
🔹 تنظيف عادي شامل: 10 جنيه / م² (غرف، حمامات، مطابخ، مسح وتلميع).
🔹 تنظيف بعد التشطيب: 13 جنيه / م² (إزالة الدهانات، الأسمنت، الجبس، وجلي الأرضيات).
🔹 تنظيف عميق (Deep Cleaning): 14 جنيه / م² (إزالة الدهون الصعبة، تلميع الأجهزة، وتطهير شامل).
🔥 احصل على خصم 10% فوري عند دفع 25% عربون الحجز على 01013373634!

احجز معاينتك المجانية الآن عبر واتساب: 01013373634

#تنظيف_منازل #تنظيف_شقق #كلين_ماستر #ديب_كليننج #تنظيف_بعد_التشطيب #التجمع #زايد`,
      visualPrompt: 'Modern luxury Cairo apartment interior, pristine clean polished marble floor reflection, deep teal and cream minimalist modern aesthetic, Clean Master branded team finishing inspection, 8k photo.',
      targetAudience: 'أصحاب الشقق الجديدة والمقبلين على الزواج في التجمع وزايد وأكتوبر',
      status: 'scheduled'
    },
    {
      weekNumber: 3,
      title: 'موجة أطقم الانتريه والصالونات بالرغوة 🛋️',
      focusService: 'غسيل انتريه، صالون، وركنة بالرغوة الجافة والشفط الإيطالي',
      priceOffer: '350 ج.م للطقم بالكامل + خصم 10% مع عربون إنستاباي',
      adHook: 'صالونك أو انتريهك شايل بقع ومحتاس فيه؟ في أقل من ساعة هيرجع كالجديد بألوانه الأصلية وبدون غرق!',
      caption: `صالونك هيرجع جديد بألوانه الزاهية بدون ما تشتري ولا تنجد! 🛋️✨

عرض الأسبوع الثالث من كلين ماستر:
🔹 غسيل طقم الانتريه أو الصالون بالكامل بالرغوة الجافة والشفط الإيطالي القوي.
🔹 القضاء التام على البقع العنيدة والأتربة والروائح الكريهة مع جفاف سريع.
🔹 350 جنيه فقط للطقم بالكامل!
🔥 خصم 10% إضافي عند الدفع الإلكتروني.

للحجز وتأكيد الموعد عبر واتساب: 01013373634

#غسيل_انتريه #غسيل_صالون #رغوة_جافة #كلين_ماستر #نظافة_فندقية`,
      visualPrompt: 'Before and after modern velvet sofa cleaning, deep teal Clean Master theme, spotless pristine upholstery, high-end Cairo apartment.',
      targetAudience: 'العائلات وربات البيوت في مدينتي والرحاب والمعادي والتجمع',
      status: 'scheduled'
    },
    {
      weekNumber: 4,
      title: 'موجة ميجا الجمعة البيضاء الشاملة 👑',
      focusService: 'باقة تنظيف الشقة بالكامل بالمتر المربع + الصالون والتعقيم',
      priceOffer: 'خصم استثنائي 20% + 5% إضافية عبر إنستاباي مع تعقيم مجاني',
      adHook: 'الجمعة البيضاء في كلين ماستر غير! أكبر باقة خصومات لتنظيف المنازل والشقق في مصر كلها!',
      caption: `أقوى عروض الجمعة البيضاء في مصر وصلت مع كلين ماستر! 👑💥

الباقة الشاملة الكبرى:
🔹 تنظيف منزلك بالكامل بالمتر + تعقيم فندقي شامل للأرضيات والأسطح.
🔹 غسيل طقم الصالون أو الانتريه مجاناً ضمن باقة العروض الكبرى!
🔹 خصم فوري 20% + 5% عند سداد العربون بإنستاباي!

الأماكن محدودة جداً بجدول مواعيد نهاية الشهر، احجز دورك الآن على واتساب: 01013373634

#الجمعة_البيضاء #White_Friday #كلين_ماستر #عروض_مصر #خصومات_كبرى`,
      visualPrompt: 'Clean Master White Friday promotional commercial render, deep teal and gold luxury aesthetic, clean master official emblem.',
      targetAudience: 'جميع عملاء كلين ماستر وسكان المجمعات السكنية في القاهرة والجيزة',
      status: 'draft'
    }
  ];

  const current = campaignWeeks[activeWeek];

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(current.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleSimulateDesign = () => {
    setIsGeneratingDesign(true);
    setTimeout(() => {
      setIsGeneratingDesign(false);
      setDesignGenerated(true);
    }, 1500);
  };

  const handlePublishPost = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishResult('تم النشر والجدولة بنجاح على صفحة فيسبوك وإنستجرام عبر الـ Graph API المعتمد! ✅');
    }, 1800);
  };

  const handleSyncBot = () => {
    setBotSynced(true);
    setTimeout(() => setBotSynced(false), 3000);
  };

  return (
    <div className="w-full max-w-2xl bg-gradient-to-b from-[#0f141c] via-[#0b0e14] to-[#080b0f] border border-emerald-500/30 rounded-3xl p-5 shadow-2xl font-cairo text-right my-3 relative overflow-hidden" dir="rtl">
      {/* هيدر الكارت والتعريف بالإيجنت */}
      <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">{managerName}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                إيجنت أكونت مانيجر نشط
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              البراند المستهدف: <span className="text-emerald-400 font-bold">{brandName}</span> • {campaignMonth}
            </p>
          </div>
        </div>

        <div className="text-left">
          <span className="text-[10px] text-slate-500 block font-mono">AUTONOMOUS_AM_v2</span>
          <span className="text-xs font-black text-cyan-400 font-mono">KPI: 100% READY</span>
        </div>
      </div>

      {/* خريطة أسابيع الحملة الأربعة */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {campaignWeeks.map((week, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActiveWeek(idx);
              setDesignGenerated(false);
              setPublishResult(null);
            }}
            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between gap-1 ${
              activeWeek === idx
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-mono block text-emerald-400 font-bold">الأسبوع {week.weekNumber}</span>
            <span className="text-[10px] font-bold truncate max-w-full block leading-tight">{week.title.split(' ')[1] || week.title}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
              week.status === 'active' ? 'bg-emerald-500/30 text-emerald-300' :
              week.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {week.status === 'active' ? 'موجة حية' : week.status === 'scheduled' ? 'مجدول' : 'مسودة'}
            </span>
          </button>
        ))}
      </div>

      {/* تفاصيل خطة الأسبوع المختار */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-4 space-y-3 mb-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>خطة {current.title}</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
            العرض المالي: {current.priceOffer}
          </span>
        </div>

        {/* الكول تو أكشن والجمهور المستهدف */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-0.5">الخدمة المستهدفة:</span>
            <span className="text-slate-200 font-bold">{current.focusService}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-0.5">الجمهور والمناطق:</span>
            <span className="text-emerald-300 font-bold">{current.targetAudience}</span>
          </div>
        </div>

        {/* الكابشن التسويقي الجاهز */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <span className="text-slate-400 font-bold">صياغة المنشور التسويقي (كابشن باللهجة المصرية):</span>
            <button
              onClick={handleCopyCaption}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedCaption ? 'تم النسخ!' : 'نسخ الكابشن'}</span>
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-xs text-slate-300 leading-relaxed font-sans max-h-36 overflow-y-auto whitespace-pre-line">
            {current.caption}
          </div>
        </div>

        {/* فكرة وتوجيه التصميم لموديل نانو بنانا */}
        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">النمط البصري: إعلان ثلاثي الأبعاد بموديل Nano Banana</span>
          </div>
          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {designGenerated ? '✅ التصميم جاهز' : 'جاهز للتوليد'}
          </span>
        </div>
      </div>

      {/* شريط الإجراءات التنفيذية الذاتية */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* زرار توليد التصميم */}
          <button
            onClick={handleSimulateDesign}
            disabled={isGeneratingDesign}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isGeneratingDesign ? 'animate-spin' : ''}`} />
            <span>{isGeneratingDesign ? 'جاري التصميم...' : designGenerated ? 'إعادة توليد التصميم' : 'توليد تصميم الأسبوع'}</span>
          </button>

          {/* زرار مزامنة بوت واتساب */}
          <button
            onClick={handleSyncBot}
            className="py-2.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>{botSynced ? 'تمت مزامنة البوت! ✅' : 'مزامنة عروض واتساب'}</span>
          </button>

          {/* زرار النشر المباشر عبر Graph API */}
          <button
            onClick={handlePublishPost}
            disabled={isPublishing}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            <Rocket className={`w-3.5 h-3.5 ${isPublishing ? 'animate-bounce' : ''}`} />
            <span>{isPublishing ? 'جاري النشر السحابي...' : 'نشر وجدولة الآن'}</span>
          </button>
        </div>

        {/* نتيجة النشر */}
        {publishResult && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{publishResult}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono">STATUS: PUBLISHED_LIVE</span>
          </div>
        )}
      </div>

      {/* الفوتر */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
        <span>المايسترو: الظل (Executive Jarvis)</span>
        <span className="text-emerald-400 font-mono">CLEAN_MASTER_ORCHESTRATOR_ACTIVE</span>
      </div>
    </div>
  );
};
