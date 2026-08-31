import React, { useState } from 'react';
import { Music2, MessageSquare, Shield, Cpu, Mic, Sparkles, Radio, Zap, Globe, Layers } from 'lucide-react';
import { SpaceCanvas } from './SpaceCanvas';
import { ShadowFace } from './ShadowFace';
import { ActiveView } from '../types';

interface DashboardProps {
  onNavigate: (view: ActiveView) => void;
  onVoiceCommand: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onVoiceCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const agents = [
    { id: 'nexus', name: 'Nexus Core', role: 'المركز السيادي والتحكم', speed: '27,500 km/h', status: 'نشط 100%' },
    { id: 'accountant', name: 'Accountant', role: 'الذكاء المالي والصفقات', speed: '24,200 km/h', status: 'مراقب للأسواق' },
    { id: 'architect', name: 'Architect', role: 'هندسة الأنظمة والتطوير', speed: '26,800 km/h', status: 'جاهز للتنفيذ' },
    { id: 'healer', name: 'Healer', role: 'الدفاع السيبراني والحصانة', speed: '28,100 km/h', status: 'حصن أمني فعال' },
    { id: 'lawyer', name: 'Lawyer', role: 'الحوكمة والعقود المشفرة', speed: '25,400 km/h', status: 'قيد الحماية' },
  ];

  const handleVoiceToggle = () => {
    setIsListening(prev => !prev);
    onVoiceCommand();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between select-none">
      {/* 3D Orbiting Space Canvas */}
      <SpaceCanvas />

      {/* Top Header / Status Bar */}
      <header className="relative z-10 p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping absolute" />
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-base font-cairo text-white flex items-center gap-2">
              الظل الرقمي | Ez-Zel Sovereign OS
            </h1>
            <div className="text-[11px] text-cyan-300/80 font-mono">
              محطة الفضاء السيادية • سرعة المدار: 27,500km/h
            </div>
          </div>
        </div>

        {/* Action Hub Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('music')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-900/60 to-cyan-900/60 hover:from-purple-800 hover:to-cyan-800 border border-cyan-400/40 text-cyan-200 text-xs font-semibold backdrop-blur-md transition-all shadow-lg shadow-cyan-500/20"
          >
            <Music2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>استوديو الموسيقى</span>
          </button>

          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold backdrop-blur-md transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>المحادثة المباشرة</span>
          </button>
        </div>
      </header>

      {/* Center Interactive Core Hub */}
      <main className="relative z-10 flex flex-col items-center justify-center my-auto px-4 text-center">
        {/* Floating Digital Shadow Face */}
        <div className="mb-4">
          <ShadowFace
            isListening={isListening}
            size="lg"
            onClick={handleVoiceToggle}
          />
        </div>

        <h2 className="text-lg md:text-xl font-bold font-cairo text-slate-100 tracking-wide">
          أنا ظلك الرقمي الحصين.. في خدمتك
        </h2>
        <p className="text-xs md:text-sm text-slate-400 max-w-md mt-1">
          نظام ذكاء اصطناعي متكامل للإنتاج الصوتي والموسيقي، الحماية السيادية، وإدارة المهام المستقلة.
        </p>

        {/* Orbiting Agent Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-xl">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.name)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 transition-all backdrop-blur-sm flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="font-semibold text-slate-200">{agent.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">({agent.speed})</span>
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Floating Command Bar */}
      <footer className="relative z-10 p-4 md:p-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl">
          {/* Voice Microphone Trigger */}
          <button
            onClick={handleVoiceToggle}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-cairo transition-all ${
              isListening
                ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isListening ? 'جارٍ الاستماع للأمر...' : 'الأوامر الصوتية'}</span>
          </button>

          {/* Music Studio Direct Button */}
          <button
            onClick={() => onNavigate('music')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 text-black text-xs font-bold font-cairo transition-all shadow-md shadow-cyan-500/20"
          >
            <Music2 className="w-4 h-4 fill-current" />
            <span>فتح استوديو الموسيقى</span>
          </button>

          {/* Smart Chat Button */}
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium font-cairo transition-all"
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>المحادثة</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          Ez-Zel Sovereign AI Platform • Gemini 2.5 Flash & Google AI Lyrics Engine
        </div>
      </footer>
    </div>
  );
};
