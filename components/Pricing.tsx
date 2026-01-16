import React, { useState } from 'react';
import { Zap, UserCheck, Eye, Fingerprint, Sparkles, BrainCircuit, Shield, Mic, HardDrive, ArrowLeft, Calendar, Check, FileText } from 'lucide-react';
import CapabilitiesGuide from './CapabilitiesGuide';
import WhitePaper from './WhitePaper';

interface Props {
  onSelectPlan: (plan: string, cycle: 'monthly' | 'yearly') => void;
  onTrialStart: () => void;
  onAffiliateStart: () => void;
}

const Pricing: React.FC<Props> = ({ onSelectPlan, onTrialStart, onAffiliateStart }) => {
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showWhitePaper, setShowWhitePaper] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const prices = {
      monthly: { egp: '1,000', usd: '20', label: 'شهرياً', discount: '' },
      yearly: { egp: '10,000', usd: '200', label: 'سنوياً', discount: 'وفر 2000 ج.م' }
  };

  const currentPrice = prices[billingCycle];
  const commissionAmount = billingCycle === 'yearly' ? '1000' : '100';

  const handleJoinFromGuide = () => {
      setShowCapabilities(false);
      onSelectPlan('elite', billingCycle);
  };

  const handleAffiliateFromGuide = () => {
      setShowCapabilities(false);
      onAffiliateStart();
  };

  return (
    <div className="h-screen w-full bg-[#020202] text-white overflow-hidden flex flex-col font-['Cairo'] relative selection:bg-purple-500/30">
      
      {showCapabilities && (
        <CapabilitiesGuide 
            onClose={() => setShowCapabilities(false)} 
            onJoin={handleJoinFromGuide}
            onAffiliate={handleAffiliateFromGuide}
        />
      )}

      {showWhitePaper && (
          <WhitePaper onClose={() => setShowWhitePaper(false)} />
      )}

      {/* Deep Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-amber-900/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-md mx-auto px-6 py-4 flex flex-col justify-between relative z-10 h-full">
        
        {/* 1. HEADER (Top) */}
        <div className="flex flex-col items-center justify-center pt-4 shrink-0">
            <div className="mb-3 animate-in slide-in-from-top-8 duration-1000">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">الجيل القادم من المساعدين</span>
                </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-tight text-center drop-shadow-2xl mb-2 whitespace-nowrap">
                امتلك <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-cyan-400">ظلك الرقمي</span>
            </h1>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowCapabilities(true)} 
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all group backdrop-blur-md"
                >
                    <Sparkles className="w-3 h-3 text-purple-400 group-hover:text-white transition-colors" />
                    <span className="text-[9px] font-bold text-white/60 group-hover:text-white">اكتشف القدرات</span>
                </button>
                <button 
                    onClick={() => setShowWhitePaper(true)} 
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all group backdrop-blur-md"
                >
                    <FileText className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
                    <span className="text-[9px] font-bold text-white/60 group-hover:text-white">ميثاق الظل</span>
                </button>
            </div>
        </div>

        {/* 2. CARD (Center) */}
        <div className="flex-1 flex items-center justify-center relative py-2">
            <div className="relative w-full glass p-5 pt-10 rounded-[32px] border border-white/10 bg-[#080808]/60 shadow-2xl backdrop-blur-xl group hover:border-purple-500/20 transition-colors">
                
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 p-3 bg-[#050505] rounded-[20px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 group-hover:scale-110 transition-transform duration-500">
                    <Fingerprint className="w-6 h-6 text-purple-500 animate-pulse" />
                </div>

                <div className="text-center mt-1">
                    <h2 className="text-xl font-black text-white mb-1 flex items-center justify-center gap-2 tracking-tight">
                        <BrainCircuit className="w-5 h-5 text-amber-500" />
                        عقلك التاني
                    </h2>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Your Second Brain</p>
                    
                    <div className="flex justify-center mb-5">
                        <div className="bg-black p-1 rounded-full border border-white/20 flex relative shadow-inner w-56 h-10 items-center overflow-hidden">
                            <div 
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-300 shadow-lg z-0 ${billingCycle === 'monthly' ? 'left-[calc(50%+2px)]' : 'left-1'}`}
                                style={{ left: billingCycle === 'monthly' ? '52%' : '2%' }} 
                            ></div>
                            
                            <button 
                                onClick={() => setBillingCycle('monthly')}
                                className={`flex-1 rounded-full text-xs font-black transition-all relative z-10 h-full flex items-center justify-center ${billingCycle === 'monthly' ? 'text-black' : 'text-white/60 hover:text-white'}`}
                            >
                                شهري
                            </button>
                            <button 
                                onClick={() => setBillingCycle('yearly')}
                                className={`flex-1 rounded-full text-xs font-black transition-all relative z-10 h-full flex items-center justify-center ${billingCycle === 'yearly' ? 'text-black' : 'text-white/60 hover:text-white'}`}
                            >
                                سنوي
                            </button>
                        </div>
                    </div>
                    
                    <div onClick={() => setShowCapabilities(true)} className="grid grid-cols-1 gap-2 bg-white/5 p-3 rounded-[20px] border border-white/5 text-right cursor-pointer hover:bg-white/10 transition-all">
                         <div className="flex items-center gap-3">
                            <Check className="w-3 h-3 text-purple-500" />
                            <span className="text-[11px] font-bold text-white/90">ذاكرة أبدية لا تنسى</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check className="w-3 h-3 text-cyan-500" />
                            <span className="text-[11px] font-bold text-white/90">رؤية استراتيجية للصور</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check className="w-3 h-3 text-amber-500" />
                            <span className="text-[11px] font-bold text-white/90">تحليل المشاعر ونبرة الصوت</span>
                        </div>
                         <p className="text-[8px] text-white/20 text-center mt-1 font-bold uppercase">اضغط للمزيد من التفاصيل</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. FOOTER ACTIONS (Bottom) */}
        <div className="shrink-0 w-full space-y-2 pb-6">
             <div className="text-center space-y-1 mb-2">
                 {billingCycle === 'yearly' && currentPrice.discount && (
                     <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded animate-pulse border border-emerald-500/20">
                         {currentPrice.discount}
                     </span>
                 )}
                 <div className="flex items-end justify-center gap-2 leading-none">
                    <div className="flex items-baseline">
                        <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">{currentPrice.egp}</span>
                        <span className="text-[10px] font-bold text-white/50 mr-1">EGP</span>
                    </div>
                    <span className="text-white/20 text-lg font-thin">/</span>
                    <div className="flex items-baseline">
                        <span className="text-xl font-bold text-white/70">{currentPrice.usd}</span>
                        <span className="text-[9px] font-bold text-white/30 mr-1">USD</span>
                    </div>
                 </div>
                 <p className="text-[9px] text-white/30 font-bold">{currentPrice.label}</p>
                 
                 <button 
                    onClick={onAffiliateStart} 
                    className="inline-block px-3 py-1 mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg animate-pulse cursor-pointer transition-colors"
                 >
                    <p className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                        💡 ادعي صحابك واربح {commissionAmount}ج كاش! <span className="underline">التفاصيل</span>
                    </p>
                 </button>
             </div>

             <div className="space-y-2">
                <button onClick={onTrialStart} className="group relative w-full py-3.5 bg-white text-black rounded-[20px] font-black text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Eye className="w-5 h-5 text-black" /> 
                    <span>تجربة الظل (3 أيام)</span>
                </button>
                
                <div className="flex gap-2">
                    <button onClick={() => onSelectPlan('elite', billingCycle)} className="flex-[2] py-3.5 bg-[#151515] hover:bg-[#1a1a1a] text-purple-400 border border-white/10 rounded-[18px] font-bold text-xs transition-all flex items-center justify-center gap-2 hover:border-purple-500/30">
                        <Zap className="w-4 h-4" /> تفعيل الاشتراك
                    </button>
                    <button onClick={() => onSelectPlan('elite', billingCycle)} className="flex-1 py-3.5 bg-transparent hover:bg-white/5 text-white/40 hover:text-white border border-white/5 rounded-[18px] font-bold text-xs transition-all flex items-center justify-center gap-2">
                        <UserCheck className="w-4 h-4" /> دخول
                    </button>
                </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;