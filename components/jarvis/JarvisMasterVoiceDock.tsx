import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Square } from 'lucide-react';
import { stopVoice } from '../../services/speechService';

export interface JarvisMasterVoiceDockProps {
  transcript: string;
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
  isThinking,
  isListening,
  isPlayingVoice,
  audioLevel,
  persona,
  handleToggleListening,
  handlePlayPersonaGreeting,
  setIsPlayingVoice
}) => {
  const handlePrimaryVoiceClick = () => {
    if (isPlayingVoice) {
      stopVoice();
      setIsPlayingVoice(false);
      return;
    }
    handleToggleListening();
  };

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-3 font-['Cairo'] select-none">
      {/* Living Holographic Voice Ribbon (Framer Motion Spring Physics) */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full px-5 py-2.5 rounded-2xl bg-[#030718]/90 border border-cyan-400/40 text-center text-xs text-cyan-200 font-bold shadow-[0_0_35px_rgba(0,240,255,0.25)] backdrop-blur-2xl"
          >
            {isThinking ? (
              <span className="flex items-center justify-center gap-2 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-spin" />
                🧠 جاري التفكير وتحليل طلبك يا ماستر...
              </span>
            ) : (
              <span className="leading-relaxed">🗣️ "{transcript}"</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 24-Bar High-Definition Audio Spectrum Visualizer */}
      <div className="flex items-end justify-center gap-1 h-7 w-full px-6">
        {[...Array(24)].map((_, i) => {
          const height = isPlayingVoice || isListening
            ? Math.max(4, Math.min(28, Math.round(Math.sin((i + Date.now() / 150) * 0.7) * 14 + audioLevel * 22 + 8)))
            : 3;
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${
                isPlayingVoice
                  ? 'bg-gradient-to-t from-purple-600 via-pink-400 to-white'
                  : isListening
                  ? 'bg-gradient-to-t from-rose-600 via-cyan-400 to-white'
                  : 'bg-cyan-500/30'
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      {/* SOVEREIGN UNIFIED MASTER VOICE CONTROLLER (SINGLE MASTER ORB - ZERO CLASH) */}
      <div className="w-full">
        <button
          onClick={handlePrimaryVoiceClick}
          className={`relative group overflow-hidden w-full py-3.5 px-6 rounded-2xl flex items-center justify-between transition-all duration-300 shadow-2xl cursor-pointer ${
            isPlayingVoice
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black border border-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-pulse'
              : isListening
              ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 text-white border border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.7)] animate-pulse'
              : isThinking
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
              : 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black border border-cyan-300 shadow-[0_0_30px_rgba(0,240,255,0.45)]'
          }`}
        >
          {/* Shimmer Light Reflection Sweep */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />

          {/* Left Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              isPlayingVoice ? 'bg-amber-950 animate-ping' :
              isListening ? 'bg-white animate-ping' :
              isThinking ? 'bg-cyan-300 animate-spin' : 'bg-black/80'
            }`} />
            <span className="text-[11px] font-mono font-black tracking-wider uppercase opacity-80">
              {isPlayingVoice ? 'LIVE AUDIO' : isListening ? 'LISTENING 24k' : isThinking ? 'THINKING' : 'READY 24kHz'}
            </span>
          </div>

          {/* Center Call to Action */}
          <div className="flex items-center gap-2 text-sm font-black tracking-wide">
            {isPlayingVoice ? (
              <>
                <Volume2 className="w-5 h-5 animate-bounce" />
                <span>جارفيس يتحدث الآن.. (اضغط للإيقاف)</span>
              </>
            ) : isListening ? (
              <>
                <MicOff className="w-5 h-5 animate-bounce" />
                <span>سامعك يا ماستر.. اتكلم الآن</span>
              </>
            ) : isThinking ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري معالجة الأمر...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 animate-pulse" />
                <span>تحدث مع جارفيس (صوت حي 24kHz)</span>
              </>
            )}
          </div>

          {/* Right Action Hint */}
          <div className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-black/20 backdrop-blur-sm">
            {isPlayingVoice ? 'إيقاف' : isListening ? 'إنهاء' : 'بدء'}
          </div>
        </button>
      </div>
    </div>
  );
};
