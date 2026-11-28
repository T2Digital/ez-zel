import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Zap, UserCheck, Sparkles, Check, FileText, Volume2, ChevronDown, Gift, ArrowLeft } from 'lucide-react';
import { playShadowVoice, stopVoice } from '../services/speechService';

const CapabilitiesGuide = lazy(() => import('./CapabilitiesGuide'));
const WhitePaper = lazy(() => import('./WhitePaper'));
const JarvisBattleStationModal = lazy(() => import('./JarvisBattleStationModal').then(m => ({ default: m.JarvisBattleStationModal })));

const JARVIS_WELCOME_SCRIPT =
  'أهلاً بيك في منظومة T2OS من تيتو ديجيتال للحلول الرقمية وتطوير الأعمال! عندك 7 أيام تجربة مجانية كاملة بكل المميزات بدون بطاقة بنكية، وبعدها باقات تبدأ من 5,000 جنيه نصفها إعلانات ممولة مباشرة لنشاطك.';

const PRICING_FAQS = [
  {
    q: 'ماذا تشمل فترة التجربة المجانية (7 أيام)؟',
    a: 'تشمل متجر أو تطبيق حجز خاص ببراندك جاهز للنشر، وكيل مبيعات ذكي على واتساب وماسنجر والتعليقات، بالإضافة إلى 2 بوست احترافي و1 فيديو ريل لتبدأ التسويق فوراً بدون بطاقة بنكية.',
  },
  {
    q: 'كيف تُدار ميزانية الـ 50% إعلانات ممولة في الباقات؟',
    a: 'نصف قيمة أي باقة مدفوعة يُوجّه مباشرة كميزانية إعلانات ممولة على ميتا وتيك توك وجوجل لبراندك، مع تقارير أداء وعائد واضحة من لوحة التحكم.',
  },
  {
    q: 'ما هو الحد الأدنى للاستكمال بعد التجربة وهل يوجد التزام طويل؟',
    a: 'الحد الأدنى للاستكمال بعد أسبوع التجربة هو باقة النمو الذهبي 5,000 ج.م شهرياً (منها 2,500 ج.م إعلانات ممولة). لا توجد قيود تعاقد طويلة ويمكنك الترقية أو الإيقاف في أي وقت.',
  },
  {
    q: 'كيف يعمل نظام الإحالة والربح (500 ج.م وأكثر)؟',
    a: 'تحصل على عمولة 10% كاش فوري ومدى الحياة على كل عميل يشترك عن طريق رابط الإحالة الخاص بك — تبدأ من 500 ج.م شهرياً لباقة النمو وتصل إلى 5,000 ج.م لباقة السيادة.',
  },
];

interface Props {
  onSelectPlan: (plan: string, cycle: 'monthly' | 'yearly') => void;
  onTrialStart: () => void;
  onAffiliateStart: () => void;
  onLoginClick?: () => void;
}

const Pricing: React.FC<Props> = ({ onSelectPlan, onTrialStart, onAffiliateStart, onLoginClick }) => {
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showWhitePaper, setShowWhitePaper] = useState(false);
  const [showBattleStation, setShowBattleStation] = useState(() => {
    try { return typeof window !== 'undefined' && window.location.pathname === '/jarvis'; } catch { return false; }
  });
  const [isGreetingPlaying, setIsGreetingPlaying] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [selectedTier, setSelectedTier] = useState<'tier_5000' | 'tier_10000' | 'tier_25000' | 'tier_50000'>('tier_5000');

  useEffect(() => {
    try {
      if (window.location.pathname === '/') return;
      if (showBattleStation && window.location.pathname !== '/jarvis') {
        window.history.pushState({}, '', '/jarvis');
      } else if (!showBattleStation && window.location.pathname === '/jarvis') {
        window.history.pushState({}, '', '/pricing');
      }
    } catch {}
  }, [showBattleStation]);

  const handlePlayJarvisWelcome = () => {
    if (isGreetingPlaying) {
      stopVoice();
      setIsGreetingPlaying(false);
      return;
    }
    setIsGreetingPlaying(true);
    playShadowVoice(JARVIS_WELCOME_SCRIPT, 'male', undefined, () => setIsGreetingPlaying(false));
  };

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, []);

  const tierList = [
    {
      key: 'tier_5000' as const,
      title: 'النمو الذهبي',
      badge: 'الأكثر مبيعاً للاستكمال',
      monthlyEgp: 5000,
      monthlyUsd: 100,
      adsMonthly: '2,500 ج.م',
      features: [
        '2,500 ج.م إعلانات ممولة (50%)',
        'تطبيق ويب ومتجر PWA متكامل',
        'أجنت واتساب وماسنجر وتعليقات 24/7',
        'تصميمات + فيديوهات ريلز أسبوعية',
      ],
    },
    {
      key: 'tier_10000' as const,
      title: 'الريادة',
      badge: 'نمو متسارع',
      monthlyEgp: 10000,
      monthlyUsd: 200,
      adsMonthly: '5,000 ج.م',
      features: [
        '5,000 ج.م إعلانات ممولة (50%)',
        'حملات متقدمة Meta & TikTok',
        'محتوى موسّع + فحص جودة Vision QA',
        'تقارير أداء وتحويلات أسبوعية',
      ],
    },
    {
      key: 'tier_25000' as const,
      title: 'المؤسسات',
      badge: 'توسع متعدد الفروع',
      monthlyEgp: 25000,
      monthlyUsd: 500,
      adsMonthly: '12,500 ج.م',
      features: [
        '12,500 ج.م إعلانات ممولة (50%)',
        'استراتيجية تسويق كاملة + إنتاج مرئي',
        'ربط فروع متعدد + صلاحيات فريق',
        'أولوية تنفيذ ودعم استراتيجي مخصص',
      ],
    },
    {
      key: 'tier_50000' as const,
      title: 'السيادة VIP',
      badge: 'هيمنة السوق',
      monthlyEgp: 50000,
      monthlyUsd: 1000,
      adsMonthly: '25,000 ج.م',
      features: [
        '25,000 ج.م إعلانات ممولة (50%)',
        'وكلاء ذكاء اصطناعي متعددون للبيزنس',
        'إنتاج يومي كامل + فيديوهات إعلانية',
        'إدارة VIP متكاملة على مدار الساعة',
      ],
    },
  ];

  const handleJoinFromGuide = () => {
    setShowCapabilities(false);
    onSelectPlan('tier_5000', billingCycle);
  };

  const handleAffiliateFromGuide = () => {
    setShowCapabilities(false);
    onAffiliateStart();
  };

  return (
    <div className="min-h-screen w-full bg-[#020510] text-white overflow-y-auto overflow-x-hidden flex flex-col font-['Cairo'] relative selection:bg-cyan-500/30 pb-14" dir="rtl">
      <Suspense fallback={null}>
        {showCapabilities && (
          <CapabilitiesGuide onClose={() => setShowCapabilities(false)} onJoin={handleJoinFromGuide} onAffiliate={handleAffiliateFromGuide} />
        )}
        {showWhitePaper && <WhitePaper onClose={() => setShowWhitePaper(false)} />}
        {showBattleStation && (
          <JarvisBattleStationModal isOpen={showBattleStation} onClose={() => setShowBattleStation(false)} initialPersona="visitor" />
        )}
      </Suspense>

      <div className="w-full max-w-6xl mx-auto px-4 pt-6 sm:pt-10 space-y-6">
        {/* Clean Header & Top Navigation Actions */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>منظومة T2OS من تيتو ديجيتال — 50% من أي باقة إعلانات ممولة</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            خطط واضحة لنمو مبيعاتك بدون تعقيد
          </h1>
          <p className="text-xs sm:text-sm text-white/65 max-w-xl">
            ابدأ بـ 7 أيام تجربة مجانية (متجر أو تطبيق حجز + أجنت واتساب وماسنجر + 2 بوست و1 ريل) بدون بطاقة بنكية.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => { if (onTrialStart) onTrialStart(); else setShowBattleStation(true); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:brightness-105 cursor-pointer flex items-center gap-1.5"
            >
              <span>ابدأ الأسبوع المجاني مع جارفيس</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePlayJarvisWelcome}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-cyan-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isGreetingPlaying ? 'إيقاف الترحيب' : 'اسمع شرح سريع من جارفيس'}</span>
            </button>
            <button
              type="button"
              onClick={() => { if (onLoginClick) onLoginClick(); else onSelectPlan(selectedTier, billingCycle); }}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>دخول المشتركين</span>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="bg-white/5 p-1 rounded-full border border-white/15 flex w-56 h-10 items-center mt-2">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 h-full rounded-full text-xs font-black transition cursor-pointer ${billingCycle === 'monthly' ? 'bg-white text-slate-950' : 'text-white/65 hover:text-white'}`}
            >
              شهري
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 h-full rounded-full text-xs font-black transition cursor-pointer ${billingCycle === 'yearly' ? 'bg-white text-slate-950' : 'text-white/65 hover:text-white'}`}
            >
              سنوي (شهرين مجاناً)
            </button>
          </div>
        </div>

        {/* Crisp 4-Tier Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tierList.map((tier) => {
            const isSelected = selectedTier === tier.key;
            const displayEgp = billingCycle === 'yearly' ? tier.monthlyEgp * 10 : tier.monthlyEgp;
            const displayUsd = billingCycle === 'yearly' ? tier.monthlyUsd * 10 : tier.monthlyUsd;
            const adsTotal = billingCycle === 'yearly' ? `${(tier.monthlyEgp * 5).toLocaleString()} ج.م` : tier.adsMonthly;
            return (
              <div
                key={tier.key}
                onClick={() => setSelectedTier(tier.key)}
                className={`rounded-2xl p-5 border flex flex-col justify-between gap-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#081228] border-cyan-400 shadow-[0_0_28px_rgba(34,211,238,0.2)]'
                    : 'bg-[#060b18] border-white/10 hover:border-white/25'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-black text-white">{tier.title}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-white/5 text-white/60'}`}>
                      {tier.badge}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-white">{displayEgp.toLocaleString()}</span>
                      <span className="text-xs font-bold text-cyan-300">ج.م</span>
                      <span className="text-[11px] text-white/45">/ {billingCycle === 'yearly' ? 'سنوياً' : 'شهرياً'}</span>
                    </div>
                    <div className="text-[11px] text-white/50">(${displayUsd.toLocaleString()} USD) • يشمل {adsTotal} إعلانات</div>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-white/10 text-xs text-white/85">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlan(tier.key, billingCycle);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>اشترك في {tier.title}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Referral Program Card */}
        <div className="rounded-2xl p-4 bg-emerald-950/35 border border-emerald-500/35 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white">برنامج شركاء النجاح: اربح 500 ج.م كاش فوري وأكثر</div>
              <div className="text-xs text-emerald-200/80">10% عمولة مستمرة مدى الحياة عن كل براند يشترك عبر رابطك.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAffiliateStart}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
            >
              احصل على رابط الإحالة
            </button>
            <button
              type="button"
              onClick={() => setShowCapabilities(true)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/75 text-xs font-bold cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>القدرات الكاملة</span>
            </button>
          </div>
        </div>

        {/* Concise FAQ Accordion */}
        <div className="rounded-2xl bg-[#060b18] border border-white/10 p-5 space-y-2">
          <h3 className="text-sm font-black text-cyan-300 mb-3">الأسئلة الشائعة</h3>
          {PRICING_FAQS.map((item, idx) => {
            const isOpenFaq = openFaqIdx === idx;
            return (
              <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpenFaq ? null : idx)}
                  className="w-full px-4 py-3 flex items-center justify-between text-right text-xs sm:text-sm font-bold text-white cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${isOpenFaq ? 'rotate-180' : ''}`} />
                </button>
                {isOpenFaq && (
                  <div className="px-4 pb-3 text-xs text-white/75 leading-relaxed border-t border-white/5 pt-2">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pricing;