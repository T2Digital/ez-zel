import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles, Send, TrendingUp, Calendar, Layers, Cpu, Film } from 'lucide-react';
import { toast } from './jarvisToast';
import { playShadowVoice } from '../../services/speechService';

export interface JarvisContentPostCardProps {
  selectedPost: any;
  currentSelectedBrand: any;
  setSelectedPost: React.Dispatch<React.SetStateAction<any>>;
  handlePublishPost: (brandId: string, postIndex: number) => Promise<void>;
  isPublishingPost: boolean;
  handleApproveSchedule: (brandId: string) => Promise<void>;
  isApprovingSchedule: boolean;
  handleLaunchAdForPost: (post: any) => Promise<void>;
  isLaunchingCampaign: boolean;
  onBackToCalendar: () => void;
  onTransformResult?: (widgetType: string, data: any) => void;
}

export const JarvisContentPostCard: React.FC<JarvisContentPostCardProps> = ({
  selectedPost,
  currentSelectedBrand,
  setSelectedPost,
  handlePublishPost,
  isPublishingPost,
  handleApproveSchedule,
  isApprovingSchedule,
  handleLaunchAdForPost,
  isLaunchingCampaign,
  onBackToCalendar,
  onTransformResult
}) => {
  const [turboFlowVideoUrlInput, setTurboFlowVideoUrlInput] = useState('');
  const [showWatermark, setShowWatermark] = useState(true);
  const [isTransforming, setIsTransforming] = useState<string | null>(null);

  const handleTransform = async (mode: 'carousel' | 'reel') => {
    setIsTransforming(mode);
    try {
      const res = await fetch('/api/jarvis/transform-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: currentSelectedBrand?.id,
          hook: displayHook,
          caption: displayCaption,
          mode,
        }),
      });
      const json = await res.json();
      if (json.ok && onTransformResult) {
        onTransformResult(mode === 'carousel' ? 'carousel_result' : 'reel_result', json.data);
      } else {
        toast.error(json.error || 'تعذر تحويل البوست');
      }
    } catch {
      toast.error('فشل الاتصال بمحرك التحويل');
    } finally {
      setIsTransforming(null);
    }
  };

  const activePost = selectedPost || currentSelectedBrand?.weekContentPlan?.[0] || {};
  const visualSrc = activePost?.videoUrl || activePost?.visualUrl || '';
  const isVideoFile = Boolean(
    activePost?.videoUrl ||
    (typeof visualSrc === 'string' && /\.(mp4|webm|mov)(\?|$)/i.test(visualSrc))
  );
  const displayHook = activePost?.hook || currentSelectedBrand?.name || 'محتوى إبداعي مولد بالذكاء الاصطناعي';
  const displayCaption =
    activePost?.caption ??
    'جارٍ تجهيز نص المنشور الاحترافي عبر محرك تيتو ستوديو...';
  const isPublished = activePost?.status === 'published' || activePost?.publishedNow;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 24 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      className="relative w-full max-w-2xl rounded-[28px] bg-[#020813]/75 border border-cyan-500/25 shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_40px_rgba(6,182,212,0.12)] p-5 flex flex-col gap-4 backdrop-blur-2xl font-['Cairo'] text-right overflow-hidden"
    >
      {/* 2026 Spatial HUD Corner Reticles */}
      <span className="pointer-events-none absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400/70 rounded-tr-sm" />
      <span className="pointer-events-none absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400/70 rounded-tl-sm" />
      <span className="pointer-events-none absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400/70 rounded-br-sm" />
      <span className="pointer-events-none absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400/70 rounded-bl-sm" />

      {/* Top HUD Telemetry Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-cyan-300 font-black text-sm shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            {(currentSelectedBrand?.name || 'T2').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white truncate">
                {currentSelectedBrand?.name || 'تيتو ميديا'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-bold text-cyan-300">
                <Cpu className="w-3 h-3" />
                <span>TITO STUDIO // AI ENGINE</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {activePost?.platform || 'Instagram & Facebook (Meta Graph)'} • {activePost?.contentType || 'Post + AI Visual'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
              isPublished
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                : 'bg-cyan-500/15 text-cyan-200 border-cyan-400/35'
            }`}
          >
            {isPublished ? '● تم النشر فعلياً' : '● جاهز للنشر المباشر'}
          </span>
        </div>
      </div>

      {/* Full-Bleed Visual Holographic Viewport */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-[#040b18] border border-white/10 group">
        {visualSrc ? (
          isVideoFile ? (
            <video
              src={visualSrc}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={visualSrc}
              alt={displayHook}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-6 text-center bg-gradient-to-br from-cyan-950/30 via-[#040b18] to-slate-950/80">
            <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
            <div className="text-sm font-black text-white max-w-md leading-snug">
              "{displayHook}"
            </div>
            <span className="text-[10px] text-cyan-300/90 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-400/25 font-bold">
              {activePost?.contentType || 'AI Visual Ready'}
            </span>
          </div>
        )}

        {/* Brand Identity Watermark Overlay */}
        {showWatermark && (
          <div className="pointer-events-none absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-[#020813]/75 backdrop-blur-md border border-cyan-400/30 flex items-center gap-2 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-black text-white">{currentSelectedBrand?.name || 'تيتو ميديا'}</span>
            {currentSelectedBrand?.phone && (
              <span className="text-cyan-300 font-mono">{currentSelectedBrand.phone}</span>
            )}
          </div>
        )}

        {/* Floating Hook Overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#020813]/95 via-[#020813]/55 to-transparent p-3.5 flex items-end justify-between gap-2">
          <div className="text-xs font-black text-white drop-shadow line-clamp-2">
            {displayHook}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[10px] text-cyan-200 font-bold">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>{activePost?.day || 'اليوم'}</span>
          </span>
        </div>
      </div>

      {/* Google Flow × Turbo Flow Video Automation Panel */}
      {(selectedPost?.mediaFormat === 'video' || String(selectedPost?.contentType || '').includes('فيديو') || String(selectedPost?.contentType || '').includes('Reel')) && (
        <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/25 flex flex-col gap-2 text-[10.5px]">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <span className="font-black text-cyan-300 flex items-center gap-1">
              🎬 جسر Google Flow × Turbo Flow (Veo 3.1):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => window.open('https://labs.google/fx/tools/flow', '_blank')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold transition"
              >
                فتح Google Flow
              </button>
              <a
                href="/api/studio/turbo-flow/export-csv"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/35 font-bold transition"
              >
                ملف Turbo Flow CSV
              </a>
            </div>
          </div>
          {selectedPost?.omniPrompt && (
            <div className="p-2 rounded-xl bg-black/50 border border-white/10 font-mono text-[9.5px] text-cyan-200 select-all" dir="ltr">
              {selectedPost.omniPrompt}
            </div>
          )}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={turboFlowVideoUrlInput}
              onChange={(e) => setTurboFlowVideoUrlInput(e.target.value)}
              placeholder="أو الصق رابط الفيديو المولد من Flow (.mp4) لحفظه في التقويم..."
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/15 text-white text-[10.5px] focus:outline-none focus:border-cyan-400/60"
            />
            <button
              onClick={async () => {
                if (!turboFlowVideoUrlInput.trim()) return;
                const res = await fetch('/api/studio/turbo-flow/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jobId: selectedPost?.turboFlowJobId,
                    postId: selectedPost?.id,
                    brandId: currentSelectedBrand?.id,
                    videoUrl: turboFlowVideoUrlInput.trim()
                  })
                });
                const d = await res.json();
                if (d.ok) {
                  setSelectedPost((prev: any) => ({ ...prev, videoUrl: turboFlowVideoUrlInput.trim(), visualUrl: turboFlowVideoUrlInput.trim() }));
                  setTurboFlowVideoUrlInput('');
                  toast.success('تم حفظ الفيديو في تقويم تيتو ستوديو!');
                  playShadowVoice('تم ربط الفيديو المولد من جوجل فلو وحفظه في تقويم تيتو ستوديو بنجاح يا ماستر!', 'male');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10.5px] transition"
            >
              حفظ بالتقويم
            </button>
          </div>
        </div>
      )}

      {/* Editable Copywriting Surface */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="font-bold text-cyan-300/90">نص المنشور (قابل للتعديل الفوري قبل النشر)</span>
          <span>{displayCaption.length} حرف</span>
        </div>
        <textarea
          rows={4}
          value={displayCaption}
          onChange={(e) =>
            setSelectedPost((prev: any) => ({
              ...(prev || activePost),
              caption: e.target.value
            }))
          }
          className="w-full text-xs text-slate-100 leading-relaxed bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.07] p-3 rounded-2xl border border-white/10 focus:border-cyan-400/50 focus:outline-none resize-none transition"
        />
      </div>

      {/* Media Repurpose & Watermark Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleTransform('carousel')}
            disabled={isTransforming !== null}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-cyan-200 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isTransforming === 'carousel' ? 'جاري التحويل...' : 'حوّله لكاروسيل 5 سلايدات'}</span>
          </button>
          <button
            onClick={() => handleTransform('reel')}
            disabled={isTransforming !== null}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-purple-200 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Film className="w-3.5 h-3.5" />
            <span>{isTransforming === 'reel' ? 'جاري التحويل...' : 'سكريبت Reel + Veo'}</span>
          </button>
        </div>
        <button
          onClick={() => setShowWatermark((w) => !w)}
          className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-[10px] font-bold cursor-pointer"
        >
          {showWatermark ? 'إخفاء توقيع البراند' : 'إظهار توقيع البراند'}
        </button>
      </div>

      {/* 2026 Spatial Action Dock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <button
          onClick={() => handlePublishPost(currentSelectedBrand?.id, 0)}
          disabled={isPublishingPost}
          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-60 text-slate-950 text-[11px] font-black shadow-[0_0_24px_rgba(6,182,212,0.35)] transition flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isPublishingPost ? 'جاري النشر...' : 'انشره الآن'}</span>
        </button>

        <button
          onClick={() => handleApproveSchedule(currentSelectedBrand?.id)}
          disabled={isApprovingSchedule}
          className="py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 disabled:opacity-60 text-cyan-200 border border-cyan-400/35 text-[11px] font-black transition flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>اعتمد الجدولة</span>
        </button>

        <button
          onClick={() => handleLaunchAdForPost(activePost)}
          disabled={isLaunchingCampaign}
          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-60 text-slate-950 text-[11px] font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] transition flex items-center justify-center gap-1.5"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isLaunchingCampaign ? 'جاري الإطلاق...' : 'تمويل كإعلان'}</span>
        </button>

        <button
          onClick={onBackToCalendar}
          className="py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 text-[11px] font-bold transition flex items-center justify-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>العودة للتقويم</span>
        </button>
      </div>
    </motion.div>
  );
};
