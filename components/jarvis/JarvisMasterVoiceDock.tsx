import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';

export interface JarvisMasterVoiceDockProps {
  transcript: string;
  lastReplyText?: string;
  onClearLastReply?: () => void;
  onReplayFullReply?: () => void;
  pendingGreetingPlay?: boolean;
  onPlayPendingGreeting?: () => void;
  wakeWordEnabled?: boolean;
  onToggleWakeWord?: () => void;
  wakeArmed?: boolean;
  isThinking: boolean;
  isListening: boolean;
  isPlayingVoice: boolean;
  audioLevel: number;
  persona: string;
  handleToggleListening: () => void;
  handlePlayPersonaGreeting: (persona: string) => void;
  setIsPlayingVoice: React.Dispatch<React.SetStateAction<boolean>>;
}

export const JarvisMasterVoiceDock: React.FC<JarvisMasterVoiceDockProps> = ({
  transcript,
  lastReplyText,
  onClearLastReply,
  onReplayFullReply,
  pendingGreetingPlay,
  onPlayPendingGreeting,
  wakeWordEnabled = true,
  onToggleWakeWord,
  wakeArmed = false,
  isThinking,
  isListening,
  isPlayingVoice,
  audioLevel,
  handleToggleListening,
}) => {
  return (
    <div className="w-full max-w-xl shrink-0 relative z-20 flex flex-col items-center gap-2 font-['Cairo'] select-none">
      {pendingGreetingPlay && onPlayPendingGreeting && (
        <button
          type="button"
          onClick={onPlayPendingGreeting}
          className="shrink-0 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-slate-950 text-xs font-black shadow-[0_0_24px_rgba(34,211,238,0.45)] flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>اضغط لسماع ترحيب جارفيس الصوتي</span>
        </button>
      )}
      {/* Persistent Readable Jarvis Reply Card (never overwritten when mic reopens) */}
      <AnimatePresence>
        {lastReplyText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="w-full shrink-0 rounded-2xl bg-[#040c22]/98 border border-cyan-400/45 shadow-[0_0_30px_rgba(0,240,255,0.2)] backdrop-blur-2xl overflow-hidden text-right"
            dir="rtl"
          >
            <div className="px-3.5 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center justify-between gap-2 text-[10.5px]">
              <span className="font-black text-cyan-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                رد جارفيس التنفيذي
              </span>
              <div className="flex items-center gap-1.5">
                {onReplayFullReply && (
                  <button
                    type="button"
                    onClick={onReplayFullReply}
                    className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/35 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>استماع كامل</span>
                  </button>
                )}
                {onClearLastReply && (
                  <button
                    type="button"
                    onClick={onClearLastReply}
                    aria-label="إخفاء الرد"
                    className="p-0.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-36 overflow-y-auto px-4 py-2 text-xs text-white/95 leading-relaxed whitespace-pre-line select-text">
              {lastReplyText.replace(/\*\*/g, '')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Live Mic / Transcript Strip + Always-Reachable Glowing Orb Button */}
      <div className="w-full shrink-0 flex items-center justify-center gap-2 px-1">
        <button
          type="button"
          onClick={handleToggleListening}
          aria-label={isListening ? 'إيقاف المايك' : 'اضغط للتحدث مع جارفيس'}
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer shrink-0 ${
            isPlayingVoice
              ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_22px_rgba(168,85,247,0.65)] animate-pulse'
              : isListening
              ? 'bg-rose-600/30 border-rose-400 text-rose-200 shadow-[0_0_24px_rgba(244,63,94,0.75)] scale-105'
              : isThinking
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 animate-spin'
              : 'bg-cyan-500/20 hover:bg-cyan-400/30 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.5)]'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0 px-3.5 py-2 rounded-2xl bg-[#030718]/95 border border-cyan-400/35 text-xs text-cyan-200 font-bold backdrop-blur-xl flex items-center justify-between gap-2">
          <span className="truncate">
            {isThinking
              ? '🧠 جاري التحليل وتنفيذ الأمر...'
              : isPlayingVoice
              ? '🔊 جارفس يتحدث الآن...'
              : transcript
              ? `🗣️ "${transcript.replace(/\*\*/g, '')}"`
              : 'اضغط دائرة المايك للتحدث مع جارفس مباشرة'}
          </span>

          {/* Compact 12-Bar Audio Spectrum Visualizer */}
          <div className="flex items-end gap-0.5 h-5 shrink-0">
            {[...Array(12)].map((_, i) => {
              const height = isPlayingVoice || isListening
                ? Math.max(4, Math.min(20, Math.round(Math.sin((i + Date.now() / 150) * 0.7) * 8 + audioLevel * 14 + 6)))
                : 3;
              return (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-all duration-75 ${
                    isPlayingVoice
                      ? 'bg-purple-400'
                      : isListening
                      ? 'bg-cyan-400'
                      : 'bg-cyan-500/30'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Wake-Word Guard Toggle + Active Standby Indicator */}
      {onToggleWakeWord && (
        <div className="shrink-0 flex items-center justify-center gap-2 flex-wrap px-2">
          <button
            type="button"
            onClick={onToggleWakeWord}
            className={`px-3.5 py-1 rounded-full border text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              wakeWordEnabled
                ? wakeArmed
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/40 text-cyan-200'
                : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/40 text-amber-200'
            }`}
            title="منع التداخل الصوتي: في الوضع التلقائي ابدأ كلامك بكلمة جارفيس، والضغط اليدوي على المايك يستمع لأمرك فوراً"
          >
            <span className={`w-2 h-2 rounded-full ${wakeWordEnabled ? (wakeArmed ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400') : 'bg-amber-400'}`} />
            <span>
              {wakeWordEnabled
                ? wakeArmed
                  ? '🟢 وضع النداء: سامعك الآن — قل طلبك'
                  : '🎙️ النداء التلقائي بـ «جارفيس»: مفعّل (الضغط على المايك يستمع فوراً)'
                : '🎙️ استماع مباشر مستمر (بدون كلمة «جارفيس»)'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
