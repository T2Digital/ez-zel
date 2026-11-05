import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, 
  Fingerprint, Mic, Volume2, ArrowRight, Lock, KeyRound, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface GuardrailApprovalRequest {
  id: string;
  title: string;
  actionType: 'financial' | 'system_terminal' | 'messaging_blast' | 'delete_files' | 'booking_purchase';
  description: string;
  amount?: { value: number; currency: string };
  targetResource?: string;
  riskLevel: 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
  onApprove: () => void;
  onReject: () => void;
}

export const ZeroMistakeGuardrailModal: React.FC = () => {
  const [activeRequest, setActiveRequest] = useState<GuardrailApprovalRequest | null>(null);
  const [countdown, setCountdown] = useState<number>(15);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [authSuccess, setAuthSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleApprovalRequest = (e: Event) => {
      const custom = e as CustomEvent<GuardrailApprovalRequest>;
      if (custom.detail) {
        setActiveRequest(custom.detail);
        setCountdown(15);
        setIsAuthorizing(false);
        setAuthSuccess(false);
      }
    };

    window.addEventListener('shadow_guardrail_request' as any, handleApprovalRequest);
    return () => {
      window.removeEventListener('shadow_guardrail_request' as any, handleApprovalRequest);
    };
  }, []);

  useEffect(() => {
    if (!activeRequest) return;
    if (countdown <= 0) {
      // Auto reject on timeout for high security
      handleReject();
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRequest, countdown]);

  const handleApprove = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      setAuthSuccess(true);
      setTimeout(() => {
        if (activeRequest) {
          activeRequest.onApprove();
        }
        setActiveRequest(null);
      }, 700);
    }, 600);
  };

  const handleReject = () => {
    if (activeRequest) {
      activeRequest.onReject();
    }
    setActiveRequest(null);
  };

  if (!activeRequest) return null;

  const getRiskBadge = () => {
    switch (activeRequest.riskLevel) {
      case 'critical':
        return { label: 'حرج للغاية (Critical)', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
      case 'high':
        return { label: 'عالي الخطورة (High Risk)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      default:
        return { label: 'متوسط الحساسية (Medium)', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' };
    }
  };

  const riskBadge = getRiskBadge();

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl font-['Cairo'] select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-[#0a0a0c] border border-red-500/40 rounded-3xl p-6 shadow-[0_0_80px_rgba(239,68,68,0.25)] relative overflow-hidden"
        dir="rtl"
      >
        {/* Glow Header bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 animate-pulse" />

        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider block">
                JARVIS Zero-Mistake Guardrail
              </span>
              <span className="text-[10px] text-white/50">صمام أمان التدخل البشري الحقيقي (HITL)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${riskBadge.color}`}>
              {riskBadge.label}
            </span>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{countdown}s</span>
            </div>
          </div>
        </div>

        {/* Action Title & Resource */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-5">
          <h3 className="text-base font-black text-white mb-1.5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            {activeRequest.title}
          </h3>
          <p className="text-xs text-white/70 leading-relaxed mb-3">
            {activeRequest.description}
          </p>

          {activeRequest.amount && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs text-amber-300 font-bold">المبلغ المطلوب للدفع/التنفيذ:</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {activeRequest.amount.value.toLocaleString()} {activeRequest.amount.currency}
              </span>
            </div>
          )}

          {activeRequest.targetResource && (
            <div className="mt-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-800/40 truncate">
              المورد المستهدف: {activeRequest.targetResource}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-[11px] text-white/50 leading-relaxed mb-5 flex items-start gap-2 bg-red-950/20 p-3 rounded-xl border border-red-900/30">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>
            هذا الإجراء يتطلب توقيعك البشري المباشر. لن يقوم جارفيس بخصم أي أموال أو حذف أي ملفات أو إرسال مراسلات رسمية دون إذنك الصريح بلمسة واحدة.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4 text-red-400" />
            <span>إلغاء وتجميد الإجراء</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={isAuthorizing || authSuccess}
            className="flex-[2] py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {authSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black animate-bounce" />
                <span>تم الاعتماد بنجاح!</span>
              </>
            ) : isAuthorizing ? (
              <>
                <Fingerprint className="w-4 h-4 text-black animate-pulse" />
                <span>جاري توثيق البصمة...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4 text-black" />
                <span>اعتماد فوري بلمسة واحدة (Authorize)</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
