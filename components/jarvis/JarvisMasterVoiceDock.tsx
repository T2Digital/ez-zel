import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
}) => {
  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-2 font-['Cairo'] select-none">
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

      {/* Status Hint Strip (No Giant Mic Button — Clicking the Glowing Orb Controls Voice) */}
      <div className="text-[11px] font-bold text-cyan-300/80 tracking-wide">
        {isPlayingVoice
          ? 'جارفس يتحدث الآن.. (اضغط على الكرة المضيئة للإيقاف)'
          : isListening
          ? 'سامعك يا ماستر.. اتكلم الآن (اضغط على الكرة للإنهاء)'
          : isThinking
          ? 'جاري معالجة الأمر...'
          : 'اضغط على الكرة المضيئة للتحدث مع جارفس'}
      </div>
    </div>
  );
};
