import React from 'react';
import { 
  Zap, Calendar, CalendarDays, CheckCircle2, Send, 
  Layers, ShoppingBag, ArrowRight, Sparkles 
} from 'lucide-react';

interface JarvisAutonomousAgencyDeckProps {
  currentSelectedBrand: any;
  autonomousAgencyData: any;
  isExecutingAutonomousAgency: boolean;
  isPublishingPost: boolean;
  onExecuteCycle: (brandId?: string) => void;
  onPublishPost: (brandId: string, postIndex: number) => void;
  onOpenCalendar: () => void;
  onOpenGraph: () => void;
  onOpenCatalog: () => void;
}

export const JarvisAutonomousAgencyDeck: React.FC<JarvisAutonomousAgencyDeckProps> = ({
  currentSelectedBrand,
  autonomousAgencyData,
  isExecutingAutonomousAgency,
  isPublishingPost,
  onExecuteCycle,
  onPublishPost,
  onOpenCalendar,
  onOpenGraph,
  onOpenCatalog
}) => {
  const brandName = currentSelectedBrand.name || 'البراند النشط';
  const firstPost = autonomousAgencyData?.firstPost || currentSelectedBrand.weekContentPlan?.[0];

  return (
    <div className="w-full max-w-xl rounded-3xl bg-[#020516]/95 border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] p-4 flex flex-col gap-3.5 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo'] text-right">
      
      {/* Header: Title, Target Brand, Execute CTA */}
      <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/20 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping shadow-[0_0_12px_#f59e0b]" />
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              ⚡ مشغل وكالة التسويق الآلي الاحترافي • دورة الشهر الكامل (4 أسابيع)
            </h4>
            <p className="text-[10px] text-amber-200/70">
              البراند المستهدف: <span className="text-cyan-300 font-black">{brandName}</span> • 12 بوست (أحد / ثلاثاء / خميس)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenCatalog}
            className="px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[9.5px] font-bold flex items-center gap-1 transition"
          >
            <ShoppingBag className="w-3 h-3 text-cyan-400" />
            <span>الكتالوج الموحد</span>
          </button>

          <button
            onClick={() => onExecuteCycle(currentSelectedBrand.id)}
            disabled={isExecutingAutonomousAgency}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black text-[10px] font-black flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition disabled:opacity-50"
          >
            <Zap className={`w-3 h-3 ${isExecutingAutonomousAgency ? 'animate-spin' : ''}`} />
            <span>{isExecutingAutonomousAgency ? 'جاري التشغيل...' : 'تشغيل الدورة الآن ⚡'}</span>
          </button>
        </div>
      </div>

      {/* Progress / Diagnostics Stream if executing */}
      {isExecutingAutonomousAgency && (
        <div className="p-3 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col gap-2 font-mono text-[10px] text-amber-300 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>جارفيس يحلل عمق وهوية {brandName} ويبني استراتيجية الـ 4 أسابيع ويجدول في فايربيس...</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-[9px]">
            <div className="p-1 rounded bg-amber-500/10 border border-amber-500/20">1. تحليل الهوية</div>
            <div className="p-1 rounded bg-amber-500/10 border border-amber-500/20">2. صياغة 12 بوست</div>
            <div className="p-1 rounded bg-amber-500/10 border border-amber-500/20">3. جدولة Firestore</div>
            <div className="p-1 rounded bg-amber-500/10 border border-amber-500/20">4. استخراج الأول</div>
          </div>
        </div>
      )}

      {/* SPOTLIGHT FIRST POST CARD (Ready for Meta Instant Approval & 1-Click Publishing) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#09152b] to-[#04091a] border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-black text-cyan-300">
              🎯 بوست الانطلاق الأول (الأسبوع 1) — جاهز للمراجعة والاعتماد لميتا
            </span>
          </div>
          <span className="text-[9.5px] font-mono text-cyan-200 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
            📅 الأحد القادم • 10:00 AM
          </span>
        </div>

        {/* Post Content Snippet */}
        <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[10.5px] text-white/90 leading-relaxed font-sans">
          <p className="font-bold text-amber-300 mb-1">
            {firstPost?.hook || `انطلاقة جديدة وهوية استثنائية لـ ${brandName} في عالم النمو الرقمي!`}
          </p>
          <p className="text-white/80 line-clamp-3 text-[10px]">
            {firstPost?.caption || `نقدم لك في ${brandName} أرقى الحلول والخدمات المصممة خصيصاً لتفوق أعمالك وخدمة عملائك على مدار الساعة مع دعم ذكي متكامل.`}
          </p>
          <div className="flex items-center gap-1 text-[9px] text-cyan-400 font-mono mt-1.5 flex-wrap">
            <span>#{brandName.replace(/\s+/g, '_')}</span>
            <span>#T2_Growth</span>
            <span>#تيتو_ستوديو</span>
            <span>#نشر_آلي</span>
          </div>
        </div>

        {/* Immediate 1-Click Approval & Publishing Action Button */}
        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <div className="text-[9.5px] text-white/60 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>قناة النشر: <strong className="text-white">Facebook & Instagram (Meta Graph API)</strong></span>
          </div>

          <button
            onClick={() => onPublishPost(currentSelectedBrand.id, 0)}
            disabled={isPublishingPost}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.5)] transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-black" />
            <span>{isPublishingPost ? 'جاري النشر المباشر لميتا...' : '🚀 اعتماد ونشر البوست الأول لميتا فوراً'}</span>
          </button>
        </div>
      </div>

      {/* 4-WEEK STRATEGY MATRIX (12 Posts: Sun, Tue, Thu) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-white/80 px-1">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
            توزيع خطة الشهر (12 منشوراً • جدول الأحد والثلاثاء والخميس):
          </span>
          <span className="text-[9px] font-mono text-emerald-400">
            ✅ 11 منشور مجدول في تيتو ستوديو فايربيس
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-right font-['Cairo']">
          {/* Week 1 */}
          <div className="p-2 rounded-xl bg-[#03091e] border border-cyan-500/30 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-black text-cyan-300">الأسبوع 1</span>
              <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">3 بوستات</span>
            </div>
            <span className="text-[9px] text-white/90 font-bold truncate">الوعي وبناء الهوية</span>
            <span className="text-[8px] text-emerald-300">● 1 للاعتماد + 2 مجدولة</span>
          </div>

          {/* Week 2 */}
          <div className="p-2 rounded-xl bg-[#03091e] border border-purple-500/30 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-black text-purple-300">الأسبوع 2</span>
              <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">3 بوستات</span>
            </div>
            <span className="text-[9px] text-white/90 font-bold truncate">المشكلة والحلول</span>
            <span className="text-[8px] text-purple-300 font-mono">✅ مجدولة بفايربيس</span>
          </div>

          {/* Week 3 */}
          <div className="p-2 rounded-xl bg-[#03091e] border border-emerald-500/30 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-black text-emerald-300">الأسبوع 3</span>
              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">3 بوستات</span>
            </div>
            <span className="text-[9px] text-white/90 font-bold truncate">إثبات اجتماعي وقصص</span>
            <span className="text-[8px] text-emerald-300 font-mono">✅ مجدولة بفايربيس</span>
          </div>

          {/* Week 4 */}
          <div className="p-2 rounded-xl bg-[#03091e] border border-amber-500/30 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-black text-amber-300">الأسبوع 4</span>
              <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">3 بوستات</span>
            </div>
            <span className="text-[9px] text-white/90 font-bold truncate">إغلاق المبيعات والعروض</span>
            <span className="text-[8px] text-amber-300 font-mono">✅ مجدولة بفايربيس</span>
          </div>
        </div>
      </div>

      {/* Bottom Quick Tools */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9.5px]">
        <button
          onClick={onOpenCalendar}
          className="text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-bold transition"
        >
          <Calendar className="w-3 h-3" />
          <span>عرض تقويم تيتو ستوديو الكامل</span>
        </button>

        <button
          onClick={onOpenGraph}
          className="text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1 font-bold transition"
        >
          <Layers className="w-3 h-3" />
          <span>عرض في شبكة أوبسيديان 3D</span>
        </button>
      </div>

    </div>
  );
};
