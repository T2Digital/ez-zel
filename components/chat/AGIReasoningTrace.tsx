import React, { useState, useEffect } from 'react';
import { Brain, Cpu, ShieldCheck, Sparkles, ChevronDown, ChevronUp, StopCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onAbort: () => void;
}

const REASONING_STEPS = [
  { id: 1, title: 'استيعاب نية الماستر وتفكيك الهدف', sub: 'Intent & Goal Decomposition', icon: Cpu, time: '0.2s' },
  { id: 2, title: 'استدعاء الذاكرة الدلالية وخزائن السياق', sub: 'Long-term Semantic RAG & Context', icon: Brain, time: '0.8s' },
  { id: 3, title: 'تفويض الوكلاء التخصصيين واستدعاء الأدوات', sub: 'Headless Sub-Agents Execution', icon: Sparkles, time: '1.6s' },
  { id: 4, title: 'فحص الجودة والنقد الذاتي (Self-Reflection)', sub: 'Zero-Mistake Critic & Audit', icon: ShieldCheck, time: '2.4s' },
  { id: 5, title: 'صياغة واعتماد قرار المايسترو السيادي', sub: 'Maestro Sovereign Synthesis', icon: Sparkles, time: '3.0s' }
];

export const AGIReasoningTrace: React.FC<Props> = ({ onAbort }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime;
      setElapsedMs(diff);

      if (diff < 700) setCurrentStep(1);
      else if (diff < 1500) setCurrentStep(2);
      else if (diff < 2500) setCurrentStep(3);
      else if (diff < 3500) setCurrentStep(4);
      else setCurrentStep(5);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (ms: number) => (ms / 1000).toFixed(1);

  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 items-start gap-3 my-2" dir="rtl">
      <div className="bg-[#0b0c10]/95 backdrop-blur-2xl border border-purple-500/30 rounded-[24px] rounded-tr-none p-4 shadow-[0_0_40px_rgba(168,85,247,0.15)] flex flex-col gap-2 max-w-md w-full border-l-purple-500 border-l-2">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping absolute inset-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 relative block" />
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-black text-white tracking-wide">
                مسار الإدراك العصبي (AGI Reasoning)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
              {formatSeconds(elapsedMs)}s
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors text-xs flex items-center gap-1"
              title="عرض/إخفاء تفاصيل التفكير"
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Current Active Step Banner */}
        <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-bold text-[11px]">
              {REASONING_STEPS[currentStep - 1]?.title}
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono font-bold">
            [{currentStep}/5]
          </span>
        </div>

        {/* Progress Bars */}
        <div className="flex gap-1.5 pt-0.5">
          {REASONING_STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s.id < currentStep
                  ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                  : s.id === currentStep
                  ? 'bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.9)]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Expandable Step Trace Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5 pt-2 border-t border-white/5 mt-1 text-[11px]"
            >
              {REASONING_STEPS.map((step) => {
                const Icon = step.icon;
                const isPassed = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-purple-500/10 border-purple-500/30 text-white font-bold'
                        : isPassed
                        ? 'bg-black/30 border-white/5 text-white/50'
                        : 'border-transparent text-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-400 animate-spin' : 'text-white/30'}`} />
                      )}
                      <span>{step.title}</span>
                    </div>
                    <span className="font-mono text-[9px] text-white/40">{step.sub}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Abort Button */}
      <button
        onClick={onAbort}
        className="p-3 bg-red-600/80 hover:bg-red-600 rounded-full text-white shadow-lg transition-all active:scale-95 hover:shadow-red-600/30"
        title="إلغاء التفكير فوراً"
      >
        <StopCircle className="w-5 h-5" />
      </button>
    </div>
  );
};
