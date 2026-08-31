import React from 'react';

interface ShadowFaceProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const ShadowFace: React.FC<ShadowFaceProps> = ({
  isListening = false,
  isSpeaking = false,
  onClick,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative ${sizeClasses} rounded-full bg-black flex items-center justify-center cursor-pointer transition-all duration-300 select-none ${
        isListening
          ? 'shadow-[0_0_40px_rgba(0,242,254,0.8)] border-2 border-cyan-400'
          : isSpeaking
          ? 'shadow-[0_0_45px_rgba(236,72,153,0.8)] border-2 border-pink-500 scale-105'
          : 'shadow-[0_0_25px_rgba(121,40,202,0.5)] border border-purple-500/40 hover:scale-105'
      }`}
    >
      {/* Outer Atmospheric Aura */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-900/30 via-transparent to-cyan-500/20 animate-pulse pointer-events-none" />

      {/* Eyes & Eyebrows Container */}
      <div className="flex flex-col items-center gap-1.5 z-10">
        {/* Eyebrows */}
        <div className="flex gap-4">
          <div
            className={`w-4 h-1 bg-white rounded-full transition-transform duration-200 ${
              isListening ? '-rotate-12 translate-y-[-2px]' : isSpeaking ? 'rotate-6' : '-rotate-6'
            }`}
          />
          <div
            className={`w-4 h-1 bg-white rounded-full transition-transform duration-200 ${
              isListening ? 'rotate-12 translate-y-[-2px]' : isSpeaking ? '-rotate-6' : 'rotate-6'
            }`}
          />
        </div>

        {/* Eyes */}
        <div className="flex gap-4">
          <div className="relative w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
            <div
              className={`w-1.5 h-1.5 bg-black rounded-full transition-transform duration-150 ${
                isListening ? 'scale-125' : ''
              }`}
            />
          </div>
          <div className="relative w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
            <div
              className={`w-1.5 h-1.5 bg-black rounded-full transition-transform duration-150 ${
                isListening ? 'scale-125' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Status indicator dot */}
      <div
        className={`absolute bottom-1 right-2 w-2.5 h-2.5 rounded-full ${
          isListening ? 'bg-cyan-400 animate-ping' : isSpeaking ? 'bg-pink-400' : 'bg-emerald-400'
        }`}
      />
    </div>
  );
};
