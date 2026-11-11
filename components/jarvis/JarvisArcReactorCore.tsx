import React from 'react';
import { FluidLuminescentOrb } from '../FluidLuminescentOrb';

export interface JarvisArcReactorCoreProps {
  isListening: boolean;
  isPlayingVoice: boolean;
  isThinking: boolean;
  audioLevel: number;
}

export const JarvisArcReactorCore: React.FC<JarvisArcReactorCoreProps> = ({
  isListening,
  isPlayingVoice,
  isThinking,
  audioLevel
}) => {
  return (
    <div className="relative w-72 h-72 md:w-84 md:h-84 flex items-center justify-center my-1 select-none">
      {/* Outer Ambient Glow */}
      <div 
        className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-200 pointer-events-none"
        style={{ transform: `scale(${1 + audioLevel * 0.4})` }}
      />

      {/* SVG Holographic Multi-Ring Structure */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
        {/* Ring 1: Outer Compass Degree Ring (Clockwise) */}
        <circle
          cx="200" cy="200" r="185"
          fill="none"
          stroke="rgba(0, 240, 255, 0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 8 16 8"
          className="animate-[spin_60s_linear_infinite]"
          style={{ transformOrigin: '200px 200px' }}
        />

        {/* Ring 2: Segmented Caliper Arcs */}
        <circle
          cx="200" cy="200" r="165"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="2"
          strokeDasharray="80 30 140 30"
          className="animate-[spin_40s_linear_infinite_reverse] opacity-80"
          style={{ transformOrigin: '200px 200px' }}
        />

        {/* Ring 3: Tech Dashed Orbital Ring */}
        <circle
          cx="200" cy="200" r="140"
          fill="none"
          stroke="rgba(56, 189, 248, 0.4)"
          strokeWidth="3"
          strokeDasharray="6 14"
          className="animate-[spin_25s_linear_infinite]"
          style={{ transformOrigin: '200px 200px' }}
        />

        {/* Ring 4: Inner Caliper Ring */}
        <circle
          cx="200" cy="200" r="110"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="180 40 40 40"
          className="animate-[spin_15s_linear_infinite_reverse] opacity-90"
          style={{ transformOrigin: '200px 200px' }}
        />

        {/* Crosshairs & Compass Degree Markers */}
        <line x1="200" y1="5" x2="200" y2="25" stroke="#00f0ff" strokeWidth="2" />
        <line x1="200" y1="375" x2="200" y2="395" stroke="#00f0ff" strokeWidth="2" />
        <line x1="5" y1="200" x2="25" y2="200" stroke="#00f0ff" strokeWidth="2" />
        <line x1="375" y1="200" x2="395" y2="200" stroke="#00f0ff" strokeWidth="2" />

        <text x="200" y="38" textAnchor="middle" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">000°</text>
        <text x="365" y="204" textAnchor="middle" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">090°</text>
        <text x="200" y="370" textAnchor="middle" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">180°</text>
        <text x="35" y="204" textAnchor="middle" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">270°</text>
      </svg>

      {/* Central Fluid Luminescent Water Orb */}
      <FluidLuminescentOrb
        isListening={isListening}
        isPlayingVoice={isPlayingVoice}
        isThinking={isThinking}
        audioLevel={audioLevel}
        size={230}
        className="relative z-10"
      />

      {/* Clean Voice State Indicator Badge */}
      <div className="absolute -bottom-2 z-20 px-3.5 py-1 rounded-full text-[10px] font-bold font-['Cairo'] flex items-center gap-2 backdrop-blur-md shadow-xl border select-none bg-black/80 border-cyan-500/40 text-cyan-200">
        <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : isPlayingVoice ? 'bg-cyan-400 animate-bounce' : 'bg-cyan-400'}`} />
        <span>{isListening ? '🎙️ استماع صوتي نشط (Full-Duplex)' : isPlayingVoice ? '🔊 جارفيس يتحدث (24kHz)' : '🔵 العقل الحي متصل وجاهز'}</span>
      </div>
    </div>
  );
};
