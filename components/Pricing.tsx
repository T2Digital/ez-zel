import React, { useState, useEffect, useRef } from 'react';
import { Zap, UserCheck, Eye, Fingerprint, Sparkles, BrainCircuit, Shield, Mic, HardDrive, ArrowLeft, Calendar, Check, FileText, Terminal } from 'lucide-react';
import CapabilitiesGuide from './CapabilitiesGuide';
import WhitePaper from './WhitePaper';
import { JarvisBattleStationModal } from './JarvisBattleStationModal';
import { JarvisArcReactorCore } from './jarvis/JarvisArcReactorCore';
import { playShadowVoice } from '../services/speechService';

const TerminalEffect = () => {
    const lines = [
        "أنا الظل.. عقلك التاني اللي مابينساش.",
        "ذاكرتي أبدية، بشوف الصور وبفهمها، وبحلل المشاعر ونبرة الصوت.",
        "عندي فريق كامل تحت أمرك:",
        "- المايسترو: بيدير الحوار ويفهمك من نص كلمة.",
        "- المهندس: بيكتب أكواد ويظبطلك سيرفراتك.",
        "- المحقق: بيبحث في الويب ويجيبلك الخلاصة.",
        "- المحاسب: بيظبطلك ميزانيتك ومصاريفك.",
        "- المنفذ: بينفذ أوامرك على تليفونك (بيفتح تطبيقات، بيشغل أغاني).",
        "- نكسوس: بيتحكم في بيتك الذكي.",
        "- المستشار: بيصيغلك العقود القانونية.",
        "- المحلل: بيحلل الصور والمستندات.",
        "- المعالج: بيسمعك ويخفف عنك.",
        "- المحلل الفني: بيتابعلك السوق والشارتات.",
        "وكمان عندنا بيزنس العيلة (نظام الإحالة اعمل فلوس):",
        "لو دعيت حد واشترك في باقة الانطلاق (2500 جنيه) هينزلك 250 جنيه كاش فوري.",
        "ولو اشترك في باقة النمو (5000 جنيه) هينزلك 500 جنيه كاش (عمولة 10% مدى الحياة).",
        "تقدر تسحب أرباحك من محفظتك في أي وقت (فودافون كاش أو إنستاباي).",
        "--- ميثاق الظل ---",
        "1. السرية التامة: بياناتك مشفرة ومحفوظة في الخزنة.",
        "2. الولاء المطلق: أنا هنا لخدمتك وحماية مصالحك.",
        "3. الدقة والسرعة: تنفيذ الأوامر بدون تأخير.",
        "4. التطور المستمر: بتعلم منك كل يوم عشان أكون أحسن.",
        "5. الاستقلالية: أنت المالك الوحيد لبياناتك.",
        "الظل جاهز.. مستني إيه؟"
    ];
    const [displayedLines, setDisplayedLines] = useState<string[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const terminalRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentLineIndex >= lines.length) return;

        const fullText = lines[currentLineIndex];
        
        if (currentText.length < fullText.length) {
            const timeout = setTimeout(() => {
                setCurrentText(fullText.slice(0, currentText.length + 1));
                if (terminalRef.current) {
                    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
                }
            }, 30); // Typing speed
            return () => clearTimeout(timeout);
        } else {
            // Finished typing current line, move to next
            const timeout = setTimeout(() => {
                setDisplayedLines(prev => [...prev, fullText]);
                setCurrentText('');
                setCurrentLineIndex(prev => prev + 1);
                if (terminalRef.current) {
                    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
                }
            }, 800); // Wait before next line
            return () => clearTimeout(timeout);
        }
    }, [currentText, currentLineIndex]);

    return (
        <div className="bg-black/60 backdrop-blur-xl rounded-[20px] border border-white/10 p-4 font-mono text-left w-full h-[180px] flex flex-col relative overflow-hidden shadow-inner" dir="ltr">
            <div className="absolute top-2 left-3 flex gap-1.5 z-10">
                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            </div>
            <div ref={terminalRef} className="mt-4 flex-1 overflow-y-auto text-[10px] md:text-xs space-y-1 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {displayedLines.map((line, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">ez-zel:~ $</span>
                        <span className="text-white/90" dir="rtl">{line}</span>
                    </div>
                ))}
                {currentLineIndex < lines.length && (
                    <div className="flex gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">ez-zel:~ $</span>
                        <span className="text-white/90" dir="rtl">{currentText}</span>
                        <span className="w-1.5 h-3 bg-white/70 animate-pulse ml-0.5 mt-0.5 shrink-0"></span>
                    </div>
                )}
            </div>
        </div>
    );
};

interface Props {
  onSelectPlan: (plan: string, cycle: 'monthly' | 'yearly') => void;
  onTrialStart: () => void;
  onAffiliateStart: () => void;
  onLoginClick?: () => void;
}

const Pricing: React.FC<Props> = ({ onSelectPlan, onTrialStart, onAffiliateStart, onLoginClick }) => {
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showWhitePaper, setShowWhitePaper] = useState(false);
  const [showBattleStation, setShowBattleStation] = useState(false);
  const [isGreetingPlaying, setIsGreetingPlaying] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const hasAutoGreetedRef = useRef(false);

  const handlePlayJarvisWelcome = () => {
    setIsGreetingPlaying(true);
    playShadowVoice(
      'أهلاً بيك في منظومة الظل وجارفس! أنا عقلك التاني اللي هيدير تسويقك، يصمم محتواك بالذكاء الاصطناعي في تيتو ستوديو، ويرد على عملاءك في الواتساب ويقفّل مبيعات أوتوماتيك 24 ساعة. اضغط على الأسبوع المجاني أو ادخل محطة جارفس دلوقتي وشوف كل برانداتك شغالة قدامك لايف!',
      'male',
      undefined,
      () => setIsGreetingPlaying(false)
    );
  };

  useEffect(() => {
    if (hasAutoGreetedRef.current) return;
    const triggerAutoGreeting = () => {
      if (hasAutoGreetedRef.current) return;
      hasAutoGreetedRef.current = true;
      handlePlayJarvisWelcome();
    };
    const timer = setTimeout(triggerAutoGreeting, 900);
    const onFirstInteraction = () => {
      triggerAutoGreeting();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, []);
  const [selectedTier, setSelectedTier] = useState<'tier_2500' | 'tier_5000' | 'tier_10000' | 'tier_25000' | 'tier_50000'>('tier_5000');

  const tierPrices = {
    tier_2500: {
      name: 'الانطلاق (2,500 ج)',
      monthly: { egp: '2,500', usd: '50', label: 'شهرياً • 1,250 ج إعلانات ممولة لنشاطك (نصف الباقة) + تطبيق PWA + وكيل واتساب الذكي', discount: '' },
      yearly: { egp: '25,000', usd: '500', label: 'سنوياً • 12,500 ج إعلانات ممولة + تطبيق PWA', discount: 'وفر 5,000 ج.م' },
      adBadge: '1,250 ج.م إعلانات ممولة مباشرة',
      commissionMonthly: '250',
      commissionYearly: '2,500'
    },
    tier_5000: {
      name: 'النمو الذهبي (5,000 ج)',
      monthly: { egp: '5,000', usd: '100', label: 'شهرياً • 2,500 ج إعلانات ممولة (نصف الباقة) + تطبيق PWA مخصص + فيديوهات ريلز Turbo Flow', discount: '' },
      yearly: { egp: '50,000', usd: '1,000', label: 'سنوياً • 25,000 ج إعلانات ممولة + أتمتة كاملة', discount: 'وفر 10,000 ج.م' },
      adBadge: '2,500 ج.م إعلانات ممولة مباشرة',
      commissionMonthly: '500',
      commissionYearly: '5,000'
    },
    tier_10000: {
      name: 'الريادة (10,000 ج)',
      monthly: { egp: '10,000', usd: '200', label: 'شهرياً • 5,000 ج إعلانات ممولة (نصف الباقة) + حملات متقدمة Meta & TikTok + دعم استراتيجي', discount: '' },
      yearly: { egp: '100,000', usd: '2,000', label: 'سنوياً • 50,000 ج إعلانات ممولة + تقارير أداء حية', discount: 'وفر 20,000 ج.م' },
      adBadge: '5,000 ج.م إعلانات ممولة مباشرة',
      commissionMonthly: '1,000',
      commissionYearly: '10,000'
    },
    tier_25000: {
      name: 'المؤسسات (25,000 ج)',
      monthly: { egp: '25,000', usd: '500', label: 'شهرياً • 12,500 ج إعلانات ممولة (نصف الباقة) + استراتيجية تسويق كاملة + إنتاج مرئي موسع', discount: '' },
      yearly: { egp: '250,000', usd: '5,000', label: 'سنوياً • 125,000 ج إعلانات ممولة + استشارات نمو', discount: 'وفر 50,000 ج.م' },
      adBadge: '12,500 ج.م إعلانات ممولة مباشرة',
      commissionMonthly: '2,500',
      commissionYearly: '25,000'
    },
    tier_50000: {
      name: 'السيادة (50,000 ج)',
      monthly: { egp: '50,000', usd: '1,000', label: 'شهرياً • 25,000 ج إعلانات ممولة (نصف الباقة) + هيمنة على السوق + وكلاء ذكاء اصطناعي متعددين', discount: '' },
      yearly: { egp: '500,000', usd: '10,000', label: 'سنوياً • 250,000 ج إعلانات ممولة + إدارة VIP متكاملة 24/7', discount: 'وفر 100,000 ج.م' },
      adBadge: '25,000 ج.م إعلانات ممولة مباشرة',
      commissionMonthly: '5,000',
      commissionYearly: '50,000'
    }
  };

  const currentPrice = tierPrices[selectedTier][billingCycle];
  const commissionAmount = billingCycle === 'yearly' ? tierPrices[selectedTier].commissionYearly : tierPrices[selectedTier].commissionMonthly;

  const handleJoinFromGuide = () => {
      setShowCapabilities(false);
      onSelectPlan('elite', billingCycle);
  };

  const handleAffiliateFromGuide = () => {
      setShowCapabilities(false);
      onAffiliateStart();
  };

  return (
    <div className="min-h-screen w-full bg-transparent text-white overflow-y-auto overflow-x-hidden flex flex-col font-['Cairo'] relative selection:bg-purple-500/30">
      
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

      {showBattleStation && (
          <JarvisBattleStationModal 
              isOpen={showBattleStation} 
              onClose={() => setShowBattleStation(false)} 
              initialPersona="visitor" 
          />
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
            
            <div className="flex gap-2 flex-wrap justify-center">
                <button 
                    onClick={() => setShowBattleStation(true)} 
                    className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600/30 via-cyan-500/30 to-emerald-500/30 hover:from-blue-600/50 hover:to-cyan-400/50 border border-cyan-400/60 rounded-full transition-all group backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                >
                    <Zap className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                    <span className="text-[10px] font-black text-cyan-200 group-hover:text-white">محطة جارفيس ⚡</span>
                </button>
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
        <div className="flex-1 flex flex-col items-center justify-center relative py-2 gap-2">
            {/* Jarvis Pulsing Reactor Orb Only (Voice Welcome for Visitors) */}
            <button
                type="button"
                onClick={handlePlayJarvisWelcome}
                title="اضغط لسماع ترحيب جارفس الصوتي"
                className="group relative flex flex-col items-center justify-center cursor-pointer focus:outline-none -mb-4 z-30"
            >
                <div className="scale-75 hover:scale-[0.8] transition-transform duration-300">
                    <JarvisArcReactorCore
                        isListening={false}
                        isPlayingVoice={isGreetingPlaying}
                        isThinking={false}
                        audioLevel={isGreetingPlaying ? 0.85 : 0.25}
                    />
                </div>
                <span className="mt-1 px-3 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-400/35 text-[10px] font-bold text-cyan-200 backdrop-blur-md">
                    {isGreetingPlaying ? 'جارفس يرحب بك الآن...' : 'اضغط للتحدث والترحيب الصوتي من جارفس'}
                </span>
            </button>

            <div className="relative w-full glass p-5 pt-10 rounded-[32px] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-2xl group hover:border-purple-500/20 transition-colors">
                
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
                    
                    <div onClick={() => setShowCapabilities(true)} className="cursor-pointer hover:scale-[1.02] transition-transform">
                        <TerminalEffect />
                        <p className="text-[8px] text-white/20 text-center mt-2 font-bold uppercase">اضغط للمزيد من التفاصيل</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. FOOTER ACTIONS (Bottom) */}
        <div className="shrink-0 w-full space-y-2 pb-6">
             {/* Tier Selector: 5 Official Tiers (2.5K - 5K - 10K - 25K - 50K) */}
             <div className="flex justify-center mb-1 overflow-x-auto scrollbar-none py-1">
               <div className="bg-black/80 p-1 rounded-2xl border border-white/10 flex gap-1 text-[10.5px] font-black select-none max-w-full">
                 {(['tier_2500', 'tier_5000', 'tier_10000', 'tier_25000', 'tier_50000'] as const).map((tierKey) => {
                   const isSelected = selectedTier === tierKey;
                   return (
                     <button
                       key={tierKey}
                       onClick={() => setSelectedTier(tierKey)}
                       className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                         isSelected
                           ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 font-black scale-105'
                           : 'text-white/60 hover:text-white bg-white/5 border border-white/5'
                       }`}
                     >
                       <span>{tierPrices[tierKey].name}</span>
                     </button>
                   );
                 })}
               </div>
             </div>

             {/* 50% Ad Allocation Guaranteed Badge */}
             <div className="flex justify-center">
               <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded-full flex items-center gap-1">
                 <Sparkles className="w-3 h-3 text-amber-400" />
                 {tierPrices[selectedTier].adBadge} (50% من قيمة الباقة)
               </span>
             </div>

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
                 <p className="text-[9px] text-white/40 font-bold px-2">{currentPrice.label}</p>
                 
                 <button 
                    onClick={onAffiliateStart} 
                    className="inline-block px-3 py-1 mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg animate-pulse cursor-pointer transition-colors"
                 >
                    <p className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                        💡 ادعي صحابك واربح {commissionAmount}ج كاش فوري! (10% مدى الحياة) <span className="underline">التفاصيل</span>
                    </p>
                 </button>
             </div>

             <div className="space-y-2">
                <button 
                  onClick={() => setShowBattleStation(true)} 
                  className="group relative w-full py-3.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-black rounded-[20px] font-black text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Eye className="w-5 h-5 text-black" /> 
                    <span>ابدأ الأسبوع المجاني مع جارفيس (7 أيام)</span>
                </button>
                
                <div className="flex gap-2">
                    <button onClick={() => onSelectPlan(selectedTier, billingCycle)} className="flex-[2] py-3.5 bg-[#151515] hover:bg-[#1a1a1a] text-purple-400 border border-white/10 rounded-[18px] font-bold text-xs transition-all flex items-center justify-center gap-2 hover:border-purple-500/30">
                        <Zap className="w-4 h-4" /> تفعيل الاشتراك المباشر
                    </button>
                    <button 
                      onClick={() => {
                        if (onLoginClick) onLoginClick();
                        else onSelectPlan(selectedTier, billingCycle);
                      }} 
                      className="flex-1 py-3.5 bg-transparent hover:bg-white/5 text-white/40 hover:text-white border border-white/5 rounded-[18px] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
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