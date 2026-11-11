import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Play, Pause } from 'lucide-react';
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
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-2.5">
      {/* Living Holographic Voice Ribbon (Framer Motion Spring Physics) */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full px-5 py-2.5 rounded-2xl bg-black/80 border border-cyan-400/40 text-center text-xs text-cyan-200 font-bold shadow-[0_0_30px_rgba(0,240,255,0.25)] backdrop-blur-xl"
          >
            {isThinking ? (
              <span className="flex items-center justify-center gap-2 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-spin" />
                🧠 جاري التفكير ومعالجة طلبك يا ماستر...
              </span>
            ) : (
              <span className="leading-relaxed">🗣️ "{transcript}"</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 16-Bar Audio Spectrum Visualizer */}
      <div className="flex items-end justify-center gap-1.5 h-6 w-full px-4">
        {[...Array(16)].map((_, i) => {
          const height = isPlayingVoice || isListening
            ? Math.max(4, Math.min(24, Math.round(Math.sin((i + Date.now() / 200) * 0.8) * 12 + audioLevel * 20 + 8)))
            : 4;
          return (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-cyan-600 via-cyan-400 to-white rounded-full transition-all duration-75"
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      {/* Master Audio Controller: Shimmer Mic Controller & Playback Trigger */}
      <div className="w-full grid grid-cols-2 gap-2">
        {/* Shimmer Full-Duplex Mic Button */}
        <button
          onClick={handleToggleListening}
          className={`relative group overflow-hidden py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all shadow-xl select-none cursor-pointer ${
            isListening
              ? 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse border border-rose-400'
              : 'bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 hover:from-cyan-300 hover:to-cyan-200 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] border border-cyan-200'
          }`}
        >
          {/* Subtle Shimmer Overlay */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
          {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4 animate-pulse" />}
          <span>{isListening ? '🔴 سامعك يا ماستر.. اتكلم' : '🎙️ محادثة لايف صوتية'}</span>
        </button>

        {/* Listen / Pause Voice Synthesis */}
        <button
          onClick={() => {
            if (isPlayingVoice) {
              stopVoice();
              setIsPlayingVoice(false);
            } else {
              handlePlayPersonaGreeting(persona);
            }
          }}
          className={`py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all ${
            isPlayingVoice
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
          }`}
        >
          {isPlayingVoice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          {isPlayingVoice ? 'إيقاف نطق جارفيس' : '🔊 استمع لنطق جارفيس'}
        </button>
      </div>
    </div>
  );
};
