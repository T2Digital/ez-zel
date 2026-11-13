import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, GitCompare, MessageSquare, Sparkles, X, ExternalLink, Film, Layers, ShieldCheck } from 'lucide-react';

export interface JarvisDynamicWidgetHUDProps {
  widget: {
    widgetType: string;
    data: any;
  };
  onClose: () => void;
  onOpenCalendar?: (brandId: string) => void;
}

export const JarvisDynamicWidgetHUD: React.FC<JarvisDynamicWidgetHUDProps> = ({
  widget,
  onClose,
  onOpenCalendar,
}) => {
  const { widgetType, data } = widget;
  const brand = data?.brand;
  const secondBrand = data?.secondBrand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.96 }}
      className="relative w-full max-w-3xl rounded-[28px] bg-[#020813]/80 border border-cyan-500/30 shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(6,182,212,0.14)] p-5 backdrop-blur-2xl font-['Cairo'] text-right"
    >
      <span className="pointer-events-none absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400/70 rounded-tr-sm" />
      <span className="pointer-events-none absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400/70 rounded-tl-sm" />

      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2 text-cyan-300 font-black text-sm">
          {widgetType === 'analytics_kpis' && <BarChart3 className="w-4 h-4" />}
          {widgetType === 'brand_comparison' && <GitCompare className="w-4 h-4" />}
          {widgetType === 'whatsapp_insights' && <MessageSquare className="w-4 h-4" />}
          {widgetType === 'brand_dna' && <ShieldCheck className="w-4 h-4" />}
          {widgetType === 'carousel_result' && <Layers className="w-4 h-4" />}
          {widgetType === 'reel_result' && <Film className="w-4 h-4" />}
          <span>
            {widgetType === 'analytics_kpis' && 'رادار المؤشرات الحية للمنظومة'}
            {widgetType === 'brand_comparison' && 'مقارنة ذكية بين البراندات'}
            {widgetType === 'whatsapp_insights' && 'حلقة واتساب ← تيتو ستوديو (محتوى مبني على الأسئلة)'}
            {widgetType === 'brand_dna' && `هوية البراند وبوابة العميل: ${brand?.name || ''}`}
            {widgetType === 'carousel_result' && `كاروسيل 5 سلايدات: ${data?.title || ''}`}
            {widgetType === 'reel_result' && `سكريبت Reel + برومبت Veo: ${data?.title || ''}`}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 transition cursor-pointer"
          title="إغلاق والعودة للشبكة العصبية"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {widgetType === 'analytics_kpis' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-cyan-500/20">
            <div className="text-[11px] text-slate-400">البراندات الموحدة</div>
            <div className="text-2xl font-black text-cyan-300 mt-1">{data?.summary?.totalBrands ?? 0}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-purple-500/20">
            <div className="text-[11px] text-slate-400">عملاء تطبيق الظل</div>
            <div className="text-2xl font-black text-purple-300 mt-1">{data?.summary?.ezzelClientsCount ?? 0}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-500/20">
            <div className="text-[11px] text-slate-400">البوستات المجدولة</div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{data?.summary?.totalPosts ?? 0}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-amber-500/20">
            <div className="text-[11px] text-slate-400">إجمالي المنتجات</div>
            <div className="text-2xl font-black text-amber-300 mt-1">{data?.summary?.totalProducts ?? 0}</div>
          </div>
        </div>
      )}

      {widgetType === 'brand_comparison' && brand && secondBrand && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[brand, secondBrand].map((b: any, i: number) => (
            <div key={b.id || i} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-1.5">
              <div className="text-sm font-black text-white">{b.name}</div>
              <div className="text-[11px] text-cyan-300">{b.businessType || 'نشاط تجاري'}</div>
              <div className="text-xs text-slate-300 mt-1">
                خطة المحتوى: <span className="font-bold text-white">{b.weekContentPlan?.length || 0}</span> بوست
              </div>
              <div className="text-xs text-slate-300">
                الكتالوج: <span className="font-bold text-white">{b.catalog?.length || 0}</span> منتج/خدمة
              </div>
              <div className="text-xs text-slate-400">واتساب: {b.phone || 'غير مسجل'}</div>
            </div>
          ))}
        </div>
      )}

      {widgetType === 'whatsapp_insights' && (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-slate-300">
            تم تحليل أسئلة العملاء على واتساب براند <span className="text-cyan-300 font-bold">{brand?.name}</span> وتوليد بوستات مجدولة تلقائياً:
          </div>
          <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {(data?.generatedPosts || []).map((p: any, idx: number) => (
              <div key={p.id || idx} className="p-3 rounded-2xl bg-white/[0.04] border border-cyan-500/20 flex flex-col gap-1">
                <div className="text-[11px] text-amber-300 font-bold">سؤال العميل: "{p.sourceQuestion}"</div>
                <div className="text-xs font-black text-white">{p.hook}</div>
                <div className="text-[11px] text-slate-300 leading-relaxed">{p.caption}</div>
              </div>
            ))}
          </div>
          {brand?.id && onOpenCalendar && (
            <button
              onClick={() => onOpenCalendar(brand.id)}
              className="self-start px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black transition cursor-pointer"
            >
              فتح تقويم تيتو ستوديو الكامل
            </button>
          )}
        </div>
      )}

      {widgetType === 'brand_dna' && brand && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="text-slate-400 text-[11px]">النشاط والهوية</div>
              <div className="text-white font-bold mt-1">{brand.name} — {brand.businessType || 'نشاط تجاري'}</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="text-slate-400 text-[11px]">حالة خطة المحتوى</div>
              <div className="text-emerald-300 font-bold mt-1">{brand.weekContentPlan?.length || 0} منشور جاهز</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={data?.portalUrl || `/client/${brand.slug || brand.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-black flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح بوابة العميل المستقلة (/client/{brand.slug || brand.id})</span>
            </a>
            <a
              href={`/store/${brand.slug || brand.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>فتح متجر PWA</span>
            </a>
          </div>
        </div>
      )}

      {widgetType === 'carousel_result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto">
          {(data?.slides || []).map((s: any, i: number) => (
            <div key={i} className="p-3 rounded-2xl bg-white/[0.04] border border-cyan-500/20">
              <div className="text-[10px] font-black text-cyan-400">SLIDE #{s.slideNumber || i + 1}</div>
              <div className="text-xs font-black text-white mt-0.5">{s.headline}</div>
              <div className="text-[11px] text-slate-300 mt-1">{s.body}</div>
              {s.visualCue && <div className="text-[10px] text-slate-400 mt-1.5">التصميم: {s.visualCue}</div>}
            </div>
          ))}
        </div>
      )}

      {widgetType === 'reel_result' && (
        <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto text-xs">
          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 font-bold">
            الافتتاحية (Hook): {data?.hookLine}
          </div>
          {(data?.scenes || []).map((sc: any, i: number) => (
            <div key={i} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-cyan-400 font-mono text-[10px]">{sc.time}</span>
              <div className="text-white font-bold mt-0.5">{sc.voiceover}</div>
              <div className="text-slate-400 text-[11px] mt-0.5">المشهد: {sc.visual}</div>
            </div>
          ))}
          {data?.veoPrompt && (
            <div className="p-2.5 rounded-xl bg-black/50 border border-purple-500/30 font-mono text-[10px] text-purple-200 select-all" dir="ltr">
              Veo Prompt: {data.veoPrompt}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
