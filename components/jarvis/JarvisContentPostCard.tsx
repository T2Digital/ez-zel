import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles, Send, TrendingUp, Calendar } from 'lucide-react';
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
  onBackToCalendar
}) => {
  const [turboFlowVideoUrlInput, setTurboFlowVideoUrlInput] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 30 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="w-full max-w-xl rounded-3xl bg-[#01040f]/95 border-2 border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.35)] p-5 flex flex-col gap-3 backdrop-blur-2xl font-['Cairo'] text-right"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              بطاقة المحتوى والتصميم: <span className="text-purple-300">{selectedPost?.brandName || currentSelectedBrand?.name}</span>
            </h4>
            <p className="text-[10px] text-white/50">معاينة تفاعلية للتصميم، الكابشن، ومسار التحويل (Omni-Channel CTA)</p>
          </div>
        </div>
        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {selectedPost?.status === 'PUBLISHED' ? 'منشور بنجاح' : 'جاهز للنشر'}
        </span>
      </div>

      {/* The Social Post Preview Mock */}
      <div className="rounded-2xl bg-black/60 border border-purple-500/30 p-3.5 flex flex-col gap-3">
        {/* Brand Profile Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-black text-white">
              {(selectedPost?.brandName || currentSelectedBrand?.name || 'T2').slice(0, 2)}
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1">
                {selectedPost?.brandName || currentSelectedBrand?.name}
                <span className="text-cyan-400 text-[10px]">✔</span>
              </div>
              <div className="text-[9px] text-white/40">
                {selectedPost?.platform || 'Instagram & Facebook (Meta Graph)'} • {selectedPost?.day || 'اليوم'} ({selectedPost?.bestTime || '20:00'})
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-md border border-purple-500/30 font-bold">
            {selectedPost?.ctaBadge || '🛒 تحويل مباشر للتطبيق PWA'}
          </span>
        </div>

        {/* Branded Social Design or Google Flow × Turbo Flow Video Preview */}
        {selectedPost?.videoUrl ? (
          <div className="relative w-full h-60 rounded-xl overflow-hidden bg-[#050b14] border border-purple-500/40 flex items-center justify-center">
            <video
              src={selectedPost.videoUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>
        ) : (selectedPost?.visualUrl || currentSelectedBrand?.weekContentPlan?.[0]?.visualUrl) ? (
          <div className="relative w-full h-52 rounded-xl overflow-hidden bg-[#050b14] border border-purple-500/30 flex items-center justify-center">
            <img
              src={selectedPost?.visualUrl || currentSelectedBrand?.weekContentPlan?.[0]?.visualUrl}
              alt={selectedPost?.hook || currentSelectedBrand?.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gradient-to-br from-purple-950/60 via-[#070e28] to-cyan-950/60 border border-purple-500/20 flex flex-col items-center justify-center text-center p-4">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse mb-1" />
            <div className="text-sm font-black text-white max-w-sm leading-snug">
              "{selectedPost?.hook || 'ابتسامتك هوليودية بأحدث تقنيات الليزر في مصر!'}"
            </div>
            <span className="mt-2 text-[9px] text-cyan-300 bg-black/40 px-3 py-1 rounded-full border border-cyan-500/30 font-bold">
              {selectedPost?.contentType || 'Reel فيديو (9:16)'}
            </span>
          </div>
        )}

        {/* Google Flow × Turbo Flow Video Automation Panel */}
        {(selectedPost?.mediaFormat === 'video' || String(selectedPost?.contentType || '').includes('فيديو') || String(selectedPost?.contentType || '').includes('Reel')) && (
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 flex flex-col gap-2 text-[10.5px]">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="font-black text-purple-300 flex items-center gap-1">
                🎬 جسر Google Flow × Turbo Flow (Veo 3.1):
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => window.open('https://labs.google/fx/tools/flow', '_blank')}
                  className="px-2 py-0.5 rounded-lg bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 border border-purple-400/40 font-bold"
                >
                  فتح Google Flow
                </button>
                <a
                  href="/api/studio/turbo-flow/export-csv"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/40 font-bold"
                >
                  ملف Turbo Flow CSV
                </a>
              </div>
            </div>
            {selectedPost?.omniPrompt && (
              <div className="p-2 rounded-lg bg-black/60 border border-white/10 font-mono text-[9.5px] text-cyan-200 select-all" dir="ltr">
                {selectedPost.omniPrompt}
              </div>
            )}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={turboFlowVideoUrlInput}
                onChange={(e) => setTurboFlowVideoUrlInput(e.target.value)}
                placeholder="أو الصق رابط الفيديو المولد من Flow (.mp4) لحفظه في التقويم..."
                className="flex-1 px-2.5 py-1 rounded-lg bg-black/70 border border-white/15 text-white text-[10px]"
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
                className="px-2.5 py-1 rounded-lg bg-cyan-500 text-black font-black text-[10px]"
              >
                حفظ بالتقويم
              </button>
            </div>
          </div>
        )}

        {/* Caption & Copywriting */}
        <div className="text-xs text-white/85 leading-relaxed bg-white/[0.03] p-2.5 rounded-xl border border-white/10 whitespace-pre-line">
          {selectedPost?.caption || currentSelectedBrand?.weekContentPlan?.[0]?.caption || 'احجز كشفك الآن واستمتع بفحص شامل ومجاني مع خطة تقسيط مريحة بدون فوائد. تواصل معنا على الواتساب فوراً!'}
        </div>

        {/* Dual Action Boosters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            onClick={() => handlePublishPost(currentSelectedBrand?.id, 0)}
            disabled={isPublishingPost}
            className="py-2 px-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-[11px] font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] transition flex items-center justify-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishingPost ? 'جاري النشر...' : '🚀 انشره الآن'}</span>
          </button>

          <button
            onClick={() => handleApproveSchedule(currentSelectedBrand?.id)}
            disabled={isApprovingSchedule}
            className="py-2 px-2 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-500/40 text-[11px] font-black transition flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✅ اعتمد الجدولة</span>
          </button>

          <button
            onClick={() => handleLaunchAdForPost(selectedPost)}
            disabled={isLaunchingCampaign}
            className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[11px] font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] transition flex items-center justify-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isLaunchingCampaign ? 'جاري الإطلاق...' : 'تمويل كإعلان'}</span>
          </button>

          <button
            onClick={onBackToCalendar}
            className="py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] font-bold transition flex items-center justify-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>العودة للتقويم</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
