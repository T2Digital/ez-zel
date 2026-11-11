import React from 'react';
import { Sparkles, Zap, CheckCircle2, Send, Clock } from 'lucide-react';

export interface JarvisStudioCalendarDeckProps {
  currentSelectedBrand: any;
  activeBrandStrategy: any;
  isBuildingStrategy: boolean;
  isGeneratingWeekPlan: boolean;
  isApprovingSchedule: boolean;
  isPublishingPost: boolean;
  handleBuildStudioStrategy: (brandId: string) => Promise<void>;
  handleGenerateWeekPlan: (brandId: string) => Promise<void>;
  handleApproveSchedule: (brandId: string) => Promise<void>;
  handlePublishPost: (brandId: string, postIndex: number) => Promise<void>;
  handleCreatePaymobCheckout: (planId: string) => Promise<void>;
  handleSendDailyBriefingNow: (type: 'morning' | 'evening') => Promise<void>;
  onOpenPostCard: (postItem: any) => void;
}

export const JarvisStudioCalendarDeck: React.FC<JarvisStudioCalendarDeckProps> = ({
  currentSelectedBrand,
  activeBrandStrategy,
  isBuildingStrategy,
  isGeneratingWeekPlan,
  isApprovingSchedule,
  isPublishingPost,
  handleBuildStudioStrategy,
  handleGenerateWeekPlan,
  handleApproveSchedule,
  handlePublishPost,
  handleCreatePaymobCheckout,
  handleSendDailyBriefingNow,
  onOpenPostCard
}) => {
  return (
    <div className="w-full max-w-xl rounded-3xl bg-[#020617]/95 border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(0,240,255,0.2)] p-4 flex flex-col gap-3 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo'] text-right">
      {/* Calendar Header with Selected Brand Info */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
              تقويم تيتو ستوديو: <span className="text-cyan-300">{currentSelectedBrand?.name}</span>
              <span className="text-[9px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                ☁️ Firestore: t2-content-studio
              </span>
            </h4>
            <p className="text-[10px] text-white/50">
              مصفوفة الـ 3 مسارات (تحويل للمتجر PWA • محادثة واتساب صوتية • تعليق لرسالة تلقائية)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleBuildStudioStrategy(currentSelectedBrand?.id)}
            disabled={isBuildingStrategy}
            className="px-2.5 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/40 text-[10px] font-bold flex items-center gap-1 transition"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isBuildingStrategy ? 'جاري بناء الاستراتيجية...' : '1) بناء الاستراتيجية'}</span>
          </button>
          <button
            onClick={() => handleGenerateWeekPlan(currentSelectedBrand?.id)}
            disabled={isGeneratingWeekPlan}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition"
          >
            <Zap className="w-3 h-3" />
            <span>{isGeneratingWeekPlan ? 'جاري التوليد...' : '2) توليد محتوى أول أسبوع'}</span>
          </button>
          <button
            onClick={() => handleApproveSchedule(currentSelectedBrand?.id)}
            disabled={isApprovingSchedule}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 transition"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{isApprovingSchedule ? 'جاري الاعتماد...' : '3) اعتمد الجدولة'}</span>
          </button>
          <button
            onClick={() => handlePublishPost(currentSelectedBrand?.id, 0)}
            disabled={isPublishingPost}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black shadow-[0_0_15px_rgba(0,240,255,0.4)] transition flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishingPost ? 'جاري النشر...' : 'نشر فوري'}</span>
          </button>
        </div>
      </div>

      {/* Paymob Auto-Subscription & Daily Proactive Reports Bar */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-black/50 border border-white/10 flex-wrap text-[10px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleCreatePaymobCheckout('growth_pro')}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-black flex items-center gap-1 shadow-sm"
          >
            💳 تفعيل اشتراك البراند آلياً (Paymob)
          </button>
          <a
            href="/api/studio/turbo-flow/export-csv"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 font-bold"
          >
            🎬 تحميل أوامر الفيديو لـ Turbo Flow (CSV)
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSendDailyBriefingNow('morning')}
            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold"
            title="إرسال التقرير الصباحي على واتساب بدون فتح التطبيق"
          >
            ☀️ تقرير الصباح
          </button>
          <button
            onClick={() => handleSendDailyBriefingNow('evening')}
            className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-bold"
            title="إرسال تقرير المساء على واتساب بدون فتح التطبيق"
          >
            🌙 تقرير المساء
          </button>
        </div>
      </div>

      {/* Active Brand Marketing Strategy Card */}
      {(activeBrandStrategy || currentSelectedBrand?.marketingStrategy) && (() => {
        const st = activeBrandStrategy || currentSelectedBrand?.marketingStrategy;
        return (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-fuchsia-950/40 via-[#060d24] to-cyan-950/30 border border-fuchsia-500/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-fuchsia-300 flex items-center gap-1.5">
                🎯 الاستراتيجية التسويقية المعتمدة في تيتو ستوديو: {currentSelectedBrand?.name}
              </span>
              <span className="text-[9.5px] font-mono bg-fuchsia-500/20 text-fuchsia-200 px-2 py-0.5 rounded-full border border-fuchsia-500/30">
                3 ركائز محتوى
              </span>
            </div>
            <p className="text-[11px] text-white/85 leading-relaxed">
              <b className="text-cyan-300">التموضع:</b> {st.positioning}
            </p>
            <p className="text-[10.5px] text-white/70">
              <b className="text-amber-300">الجمهور المستهدف:</b> {st.targetAudience} • <b className="text-cyan-300">خليط الإنتاج:</b> {st.weeklyMixSummary}
            </p>
            {Array.isArray(st.pillars) && st.pillars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                {st.pillars.map((p: any, i: number) => (
                  <div key={i} className="p-2 rounded-xl bg-black/50 border border-white/10 text-[10px]">
                    <div className="font-black text-cyan-300">{p.title} ({p.percentage}%)</div>
                    <div className="text-white/60 text-[9.5px] mt-0.5">{p.objective}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* 7-Day Interactive Schedule Cards */}
      <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
        {(currentSelectedBrand?.weekContentPlan || []).map((item: any, idx: number) => {
          const ctaType = item.ctaType || (idx % 3 === 0 ? 'APP_CONVERSION' : idx % 3 === 1 ? 'WHATSAPP_VOICE_AGENT' : 'COMMENT_TO_MESSENGER');
          const ctaBadge = item.ctaBadge || (
            ctaType === 'APP_CONVERSION'
              ? '🛒 تحويل للتطبيق PWA (خصم 10%)'
              : ctaType === 'WHATSAPP_VOICE_AGENT'
                ? '💬 محادثة واتساب صوتية فورية'
                : '🤖 تعليق بكلمة "عرض" لرسالة تلقائية'
          );
          const ctaColorClass =
            ctaType === 'APP_CONVERSION'
              ? 'bg-blue-500/15 text-blue-300 border-blue-500/35'
              : ctaType === 'WHATSAPP_VOICE_AGENT'
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/35';

          return (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white/[0.03] border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/[0.05] transition-all flex flex-col gap-1.5 group"
            >
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                    {item.day}
                  </span>
                  <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                    {item.contentType}
                  </span>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border ${ctaColorClass}`}>
                    {ctaBadge}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/50 font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{item.bestTime || '20:00'}</span>
                </div>
              </div>

              {/* Hook */}
              <div className="text-xs font-bold text-white leading-relaxed">
                🎯 "{item.hook}"
              </div>

              {/* Caption Preview */}
              <div className="text-[11px] text-white/60 line-clamp-2 leading-normal">
                {item.caption}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap">
                <span className="text-[9.5px] font-mono text-cyan-300/70 truncate max-w-[220px]">
                  {item.ctaActionText || `المسار: /store/${currentSelectedBrand?.slug || currentSelectedBrand?.id}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onOpenPostCard({
                        ...item,
                        ctaType,
                        ctaBadge,
                        brandId: currentSelectedBrand?.id,
                        brandName: currentSelectedBrand?.name,
                        platform: 'Instagram & Facebook (Meta Graph)',
                        status: 'SCHEDULED'
                      });
                    }}
                    className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 font-bold"
                  >
                    👁️ فتح بطاقة المنشور والتصميم
                  </button>
                  <button
                    onClick={() => handlePublishPost(currentSelectedBrand?.id, idx)}
                    disabled={isPublishingPost}
                    className="text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 px-2.5 py-1 rounded-lg border border-cyan-500/30 font-bold transition flex items-center gap-1"
                  >
                    🚀 نشر فوري بالـ Meta Graph
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
