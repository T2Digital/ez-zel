import React, { useState, useEffect } from 'react';
import { Mic, Loader2, Ear, User } from 'lucide-react';
import { voiceBiometrics } from '../services/voiceBiometricsService';
import { getShadowResponse, playShadowVoice, stopVoice, getShadowVoice } from '../services/geminiService';
import { UserProfile, DBMessage } from '../services/dbService';

export const AssistantWidget: React.FC<{ user: UserProfile, onOpenApp: () => void }> = ({ user, onOpenApp }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Simplified logic, listens on tap, plays response, then goes back to idle.
  // This UI would usually be rendered over a transparent activity.
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4">
      {/* 
        This div captures pointer events. In a true native implementation, 
        Capacitor could pipe this size to Android's window manager to only catch 
        touches over the widget, letting other touches fall through to the background app.
      */}
      <div className="bg-[#111]/90 backdrop-blur-xl border border-white/20 p-4 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto flex items-center gap-4 transition-all duration-300 transform scale-100 animate-in fade-in zoom-in-50">
        
        {isProcessing && (
           <div className="flex items-center gap-2 pr-2 text-purple-400">
               <span className="text-xs font-bold font-['Cairo']">جاري التفكير...</span>
               <Loader2 className="w-5 h-5 animate-spin" />
           </div>
        )}

        {isPlaying && (
           <div className="flex items-center gap-2 pr-2 text-cyan-400">
               <span className="text-xs font-bold font-['Cairo']">صوت الظل</span>
               <div className="flex gap-1">
                   <div className="w-1 bg-cyan-400 animate-bounce" style={{height: '10px'}} />
                   <div className="w-1 bg-cyan-400 animate-bounce" style={{height: '16px', animationDelay: '0.1s'}} />
                   <div className="w-1 bg-cyan-400 animate-bounce" style={{height: '10px', animationDelay: '0.2s'}} />
               </div>
           </div>
        )}

        <button 
           onClick={() => {
              if (isListening || isProcessing || isPlaying) return;
              // Here we would implement immediate SpeechRecognition
              alert("تم استدعاء مساعد الظل من الواجهة العائمة!");
           }}
           onDoubleClick={onOpenApp}
           className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
               isListening ? 'bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.6)]' :
               isProcessing ? 'bg-purple-600 scale-95 opacity-50' :
               isPlaying ? 'bg-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.6)]' :
               'bg-white/10 hover:bg-white/20 shadow-xl'
           }`}
        >
           {isListening ? <Ear className="w-8 h-8 text-white animate-pulse" /> : <Mic className="w-8 h-8 text-white" />}
        </button>
      </div>
    </div>
  );
};
