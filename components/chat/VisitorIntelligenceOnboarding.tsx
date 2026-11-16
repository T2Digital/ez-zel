import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Building2, Rocket, Globe, Smartphone, ArrowRight, 
  CheckCircle, Play, RefreshCw, Send, DollarSign, Share2, Layers, Bot, QrCode, Link2, CheckCircle2, ExternalLink
} from 'lucide-react';
import { playShadowVoice } from '../../services/speechService';

interface VisitorIntelligenceOnboardingProps {
  onComplete?: (brandData: any) => void;
  onSwitchToAdmin?: () => void;
  isMasterAdmin?: boolean;
  initialBusinessName?: string;
  initialIndustry?: string;
  initialHasExistingBusiness?: boolean | null;
}

export const VisitorIntelligenceOnboarding: React.FC<VisitorIntelligenceOnboardingProps> = ({
  onComplete,
  onSwitchToAdmin,
  isMasterAdmin = false,
  initialBusinessName = '',
  initialIndustry = '',
  initialHasExistingBusiness = null
}) => {
  const [step, setStep] = useState<number>(() => (initialHasExistingBusiness === true ? 4 : initialHasExistingBusiness === false ? 2 : 1));
  const [hasExistingBusiness, setHasExistingBusiness] = useState<boolean | null>(initialHasExistingBusiness);

  // Form & AI Generation State
  const [industry, setIndustry] = useState(initialIndustry);
  const [brandName, setBrandName] = useState(initialBusinessName);

  useEffect(() => {
    if (initialBusinessName && initialBusinessName.trim()) {
      setBrandName(initialBusinessName.trim());
    }
    if (initialIndustry && initialIndustry.trim()) {
      setIndustry(initialIndustry.trim());
    }
    if (initialHasExistingBusiness === true) {
      setHasExistingBusiness(true);
      setStep(4);
    }
  }, [initialBusinessName, initialIndustry, initialHasExistingBusiness]);
  const [salesChannel, setSalesChannel] = useState('');
  const [phone, setPhone] = useState('01013373634');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [suggestedSlogans, setSuggestedSlogans] = useState<string[]>([]);
  const [selectedSlogan, setSelectedSlogan] = useState<string>('');
  const [suggestedLogoUrl, setSuggestedLogoUrl] = useState<string>('');
  const [appTemplate, setAppTemplate] = useState<'auto' | 'products_erp' | 'services_booking'>('auto');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'META_OAUTH_SUCCESS') {
        setMetaConnectData({
          pageName: ev.data.pageName || 'صفحة فيسبوك المتصلة',
          pageId: ev.data.pageId || '',
          connected: true
        });
        playShadowVoice(`مبروك! تم ربط صفحة ${ev.data.pageName} رسمياً عبر Meta OAuth وتفعيل النشر التلقائي!`, 'male');
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const [referralCode] = useState(() => 'VIP_' + Math.floor(1000 + Math.random() * 9000));

  // Real Provisioned Output & Live Connection Windows
  const [generatedBrand, setGeneratedBrand] = useState<any>(null);
  const [generatedAppUrl, setGeneratedAppUrl] = useState('');
  const [ownerCredentials, setOwnerCredentials] = useState<{ email: string; password: string; pin?: string } | null>(null);
  const [weekPlan, setWeekPlan] = useState<any[]>([]);

  // Existing Business Assets & Omni-Channel Social State
  const [hasExistingLogo, setHasExistingLogo] = useState(false);
  const [hasExistingWebsite, setHasExistingWebsite] = useState(false);
  const [hasExistingSocial, setHasExistingSocial] = useState(false);
  const [existingAppChoice, setExistingAppChoice] = useState<'auto' | 'products_erp' | 'services_booking' | 'existing_site'>('auto');
  const [optionalFlagshipUrl, setOptionalFlagshipUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [activeSocialTab, setActiveSocialTab] = useState<'tiktok' | 'youtube' | 'telegram' | 'x' | 'linkedin' | 'snapchat'>('tiktok');
  const [socialInput, setSocialInput] = useState('');
  const [isConnectingSocial, setIsConnectingSocial] = useState(false);

  // Real Account Connection Windows inside Visitor Flow
  const [waPairingData, setWaPairingData] = useState<{ pairingCode: string; qrDataUrl: string; connected: boolean } | null>(null);
  const [isConnectingWa, setIsConnectingWa] = useState(false);
  const [metaConnectData, setMetaConnectData] = useState<{ pageName: string; pageId: string; connected: boolean } | null>(null);
  const [metaInputPageName, setMetaInputPageName] = useState('');
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSuggestedLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestExistingIdentity = async () => {
    const target = brandName.trim() || industry || 'نشاط تجاري';
    setIsGenerating(true);
    try {
      const res = await fetch('/api/branding/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: target,
          category: industry || target,
          phone: phone || '01013373634',
          isNewBusiness: false
        })
      });
      const data = await res.json();
      const kit = data?.kit;
      if (kit?.slogan && !selectedSlogan) setSelectedSlogan(kit.slogan);
      if (kit?.logoUrl) setSuggestedLogoUrl(kit.logoUrl);
      playShadowVoice(`جهزتلك شعار مبدئي وسلوجان احترافي لـ ${target}!`, 'male');
    } catch {}
    setIsGenerating(false);
  };

  const handleConnectSocialChannel = async (platformId: string, valueOverride?: string) => {
    const val = (valueOverride ?? socialInput).trim();
    if (!val) return;
    setIsConnectingSocial(true);
    try {
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CONNECT_SOCIAL_CHANNEL',
          brandId: generatedBrand?.id || generatedBrand?.slug || 'clean_master',
          data: { platform: platformId, handleOrUrl: val }
        })
      });
      const d = await res.json();
      if (d.success) {
        setSocialLinks(prev => ({ ...prev, [platformId]: val }));
        if (!valueOverride) setSocialInput('');
        playShadowVoice(`تم ربط حساب ${platformId} بنجاح وإضافته لخطة النشر التلقائي!`, 'male');
      }
    } catch {}
    setIsConnectingSocial(false);
  };

  // Persist visitor journey across page reloads (Zero-Dead-End Resilience)
  useEffect(() => {
    if (generatedBrand && generatedAppUrl) {
      try {
        localStorage.setItem(
          'ezzel_visitor_journey_v1',
          JSON.stringify({
            brandName: generatedBrand.name || brandName,
            industry,
            phone,
            generatedBrand,
            generatedAppUrl,
            optionalFlagshipUrl,
            socialLinks,
            hasExistingBusiness,
            savedAt: Date.now()
          })
        );
      } catch {}
    }
  }, [generatedBrand, generatedAppUrl, optionalFlagshipUrl, socialLinks, brandName, industry, phone, hasExistingBusiness]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ezzel_visitor_journey_v1');
      if (!raw || generatedBrand) return;
      const saved = JSON.parse(raw);
      if (saved?.generatedBrand && saved?.generatedAppUrl && Date.now() - (saved.savedAt || 0) < 7 * 86400000) {
        setGeneratedBrand(saved.generatedBrand);
        setGeneratedAppUrl(saved.generatedAppUrl);
        if (saved.optionalFlagshipUrl) setOptionalFlagshipUrl(saved.optionalFlagshipUrl);
        if (saved.socialLinks) setSocialLinks(saved.socialLinks);
        if (saved.brandName) setBrandName(saved.brandName);
        if (saved.phone) setPhone(saved.phone);
        setStep(3);
      }
    } catch {}
  }, []);

  // Step 1: Initial Question (Zero-to-One vs Existing)
  const handleSelectBusinessStatus = (hasBusiness: boolean) => {
    setHasExistingBusiness(hasBusiness);
    if (!hasBusiness) {
      setStep(2);
      playShadowVoice("على بركة الله! سيب القيادة ليا وركز إنت في البيزنس. قولي يا غالي، إيه المجال أو النشاط اللي بتفكر فيه؟", 'male');
    } else {
      setStep(4);
      playShadowVoice("نورتنا يا فندم! حددلي إيه اللي موجود عندك بالفعل (لوجو، موقع، صفحات سوشيال) وإيه اللي تحب نجهزهولك، وهنربط كل منصاتك في ثواني!", 'male');
    }
  };

  // Scratch Path: Live AI Name, Slogan & Logo Generation via /api/branding/forge
  const handleGenerateNames = async (chosenIndustry: string) => {
    setIndustry(chosenIndustry);
    setIsGenerating(true);
    setSuggestedSlogans([]);
    setSuggestedLogoUrl('');

    const namesMap: Record<string, string[]> = {
      'تأجير سيارات': ['إليت ليموزين VIP', 'أورينت كارز مصر', 'رويال درايف للسيارات'],
      'عيادات وطب أسنان': ['عيادات بريمير دينتال', 'كريستال كير التخصصية', 'دايموند سمايل'],
      'خدمات ونظافة': ['برو كلين للخدمات المتكاملة', 'ماستر كير مصر', 'سوبر شاين للتعقيم'],
      'عقارات ومقاولات': ['برايم جيتس للتطوير', 'سكاي هوم العقارية', 'رواد المعمار'],
      'متاجر وأزياء': ['ستايل هاب مصر', 'تريند زون فاشون', 'أوربان كوليكشن']
    };

    try {
      const res = await fetch('/api/branding/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: chosenIndustry,
          category: chosenIndustry,
          phone: phone || '01013373634',
          isNewBusiness: true
        })
      });
      const data = await res.json();
      const kit = data?.kit;
      const aiNames: string[] = Array.isArray(kit?.suggestedNames)
        ? kit.suggestedNames
            .map((item: any) => (typeof item === 'string' ? item : item?.arabic || item?.english || ''))
            .filter(Boolean)
            .slice(0, 3)
        : [];
      const pool = aiNames.length > 0 ? aiNames : (namesMap[chosenIndustry] || ['رويال جروب', 'أفق الرقمية', 'إليت سوليوشنز']);
      const slogans: string[] = Array.isArray(kit?.suggestedSlogans)
        ? kit.suggestedSlogans.filter(Boolean).slice(0, 3)
        : (kit?.slogan ? [kit.slogan] : []);

      setSuggestedNames(pool);
      setBrandName(pool[0]);
      setSuggestedSlogans(slogans);
      if (slogans[0]) setSelectedSlogan(slogans[0]);
      if (kit?.logoUrl) setSuggestedLogoUrl(kit.logoUrl);
      playShadowVoice(`اقترحت عليك 3 أسماء و3 سلوجان بالذكاء الاصطناعي لمجال ${chosenIndustry} مع شعار مبدئي. اختار الأنسب ليك عشان نولد التطبيق فوراً!`, 'male');
    } catch {
      const pool = namesMap[chosenIndustry] || ['رويال جروب', 'أفق الرقمية', 'إليت سوليوشنز'];
      setSuggestedNames(pool);
      setBrandName(pool[0]);
      playShadowVoice(`اقترحت عليك 3 أسماء ليهم هيبة في السوق لمجال ${chosenIndustry}. اختار الأنسب ليك عشان نولد الهوية والتطبيق فوراً!`, 'male');
    } finally {
      setIsGenerating(false);
    }
  };

  // Real Provisioning via /api/jarvis/execute-action (PROVISION_VISITOR_TRIAL)
  const handleProvisionVisitorBrand = async (customChannel?: string) => {
    if (customChannel) setSalesChannel(customChannel);
    const targetName = brandName.trim() || 'براند النخبة الرقمي';
    const targetIndustry = industry || customChannel || 'خدمات وتجارة';

    setIsGenerating(true);
    try {
      const effectiveTemplate = hasExistingBusiness
        ? (existingAppChoice === 'existing_site' || existingAppChoice === 'auto' ? undefined : existingAppChoice)
        : (appTemplate === 'auto' ? undefined : appTemplate);
      const effectiveAppMode = hasExistingBusiness
        ? (existingAppChoice === 'existing_site' && websiteUrl.trim() ? 'existing_site' : existingAppChoice)
        : appTemplate;

      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'PROVISION_VISITOR_TRIAL',
          data: {
            businessName: targetName,
            industry: targetIndustry,
            phone: phone || '01013373634',
            websiteUrl,
            slogan: selectedSlogan || undefined,
            logoUrl: suggestedLogoUrl || undefined,
            appTemplate: effectiveTemplate,
            appMode: effectiveAppMode,
            hasExistingBusiness: Boolean(hasExistingBusiness),
            existingAssets: hasExistingBusiness
              ? { hasLogo: hasExistingLogo, hasWebsite: hasExistingWebsite, hasSocialPages: hasExistingSocial }
              : undefined,
            socialLinks
          }
        })
      });
      const data = await res.json();
      if (data.success && data.brand) {
        setGeneratedBrand(data.brand);
        const fallbackAppUrl = `${window.location.origin}/app/${data.brand.slug || data.brand.id}`;
        setGeneratedAppUrl(data.flagshipUrl || fallbackAppUrl);
        if (data.optionalFlagshipUrl) setOptionalFlagshipUrl(data.optionalFlagshipUrl);
        if (data.ownerCredentials) setOwnerCredentials(data.ownerCredentials);
        if (Array.isArray(data.brand.weekContentPlan)) {
          setWeekPlan(data.brand.weekContentPlan);
        }
      }
    } catch (e) {
      console.error('Provision error:', e);
    } finally {
      setIsGenerating(false);
      setStep(3);
      playShadowVoice(`ألف مبروك يا فندم! تم بناء وتجهيز تطبيق ${targetName}، وتأسيس خطة أسبوع التجربة المجانية (3 منشورات مركزة يوم ويوم: بوست تصميم، فيديو ريلز، وبوست حجز فوري). دلوقتي تقدر تربط الواتساب وصفحات السوشيال وتدخل كابينة قيادة براندك!`, 'male');
    }
  };

  // Real WhatsApp Pairing Code & QR Action
  const handleConnectWhatsAppLive = async () => {
    setIsConnectingWa(true);
    try {
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CONNECT_WHATSAPP_PAIRING',
          brandId: generatedBrand?.id || 'clean_master',
          data: { phone }
        })
      });
      const d = await res.json();
      if (d.success) {
        setWaPairingData({
          pairingCode: d.pairingCode,
          qrDataUrl: d.qrDataUrl,
          connected: true
        });
        playShadowVoice(`تم توليد كود الربط الفوري لواتساب رقم ${phone}! امسح الكود أو أدخل كود الربط ${d.pairingCode} في هاتفك لتشغيل الرد الذكي 24 ساعة.`, 'male');
      }
    } catch {}
    setIsConnectingWa(false);
  };

  // Real Meta Page Connect Action
  const handleConnectMetaLive = async () => {
    setIsConnectingMeta(true);
    const pageToLink = metaInputPageName.trim() || `${brandName || 'براند'} - الصفحة الرسمية`;
    try {
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CONNECT_META_OAUTH',
          brandId: generatedBrand?.id || 'clean_master',
          data: { pageName: pageToLink }
        })
      });
      const d = await res.json();
      if (d.success) {
        setMetaConnectData({
          pageName: d.pageName,
          pageId: d.pageId,
          connected: true
        });
        playShadowVoice(`تم ربط صفحة فيسبوك وإنستجرام ${d.pageName} بمحركي تيتو ستوديو وتيتو أجنت بنجاح!`, 'male');
      }
    } catch {}
    setIsConnectingMeta(false);
  };

  return (
    <div className="w-full max-w-xl bg-[#04081c]/95 border-2 border-emerald-500/40 rounded-3xl p-4 md:p-5 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col gap-3.5 text-right animate-in fade-in backdrop-blur-md font-['Cairo']">
      
      {/* Top Header Badge */}
      <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-black font-black">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-white flex items-center gap-1.5">
              محرك تأسيس وتطوير الأعمال الذكي (جديد أو قائم)
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                OMNI-CHANNEL
              </span>
            </h3>
            <p className="text-[10px] text-white/50">بناء أو ربط تطبيقك وهويتك + ربط واتساب وكل منصات السوشيال + 7 أيام مجاناً</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {step === 3 && generatedBrand && (
            <button
              type="button"
              onClick={() => {
                try { localStorage.removeItem('ezzel_visitor_journey_v1'); } catch {}
                setGeneratedBrand(null);
                setGeneratedAppUrl('');
                setStep(1);
              }}
              className="text-[10px] text-white/60 hover:text-white bg-white/5 px-2 py-1 rounded-lg border border-white/10"
            >
              + براند آخر
            </button>
          )}
          {isMasterAdmin && onSwitchToAdmin && (
            <button 
              onClick={onSwitchToAdmin}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 transition"
            >
              👑 وضع الماستر تيتو
            </button>
          )}
        </div>
      </div>

      {/* 4-Stage Visual Journey Stepper */}
      <div className="grid grid-cols-4 gap-1.5 text-[9px] font-bold">
        {[
          { n: 1, label: '1. الوضع الحالي', active: step === 1, done: step > 1 },
          { n: 2, label: '2. الهوية والكتالوج', active: step === 2 || step === 4, done: step === 3 },
          { n: 3, label: '3. التطبيق والقنوات', active: step === 3, done: false },
          { n: 4, label: '4. تفعيل 7 أيام', active: false, done: Boolean(generatedBrand) }
        ].map((st) => (
          <div
            key={st.n}
            className={`px-2 py-1 rounded-lg text-center border transition ${
              st.active
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : st.done
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {st.done ? '✓ ' : ''}{st.label}
          </div>
        ))}
      </div>

      {/* STAGE 1: HAS BUSINESS OR ZERO-TO-ONE? */}
      {step === 1 && (
        <div className="space-y-3.5 py-1 animate-in zoom-in-95">
          <div className="p-3 rounded-2xl bg-black/50 border border-cyan-500/30 text-center space-y-1">
            <span className="text-xs text-cyan-300 font-bold">🗣️ جارفيس يرحب بك بالصوت البشري:</span>
            <p className="text-xs md:text-sm font-bold text-white leading-relaxed">
              "أهلاً بيك في منظومة النمو الشامل للأعمال! قولي يا غالي، عندك نشاط تجاري شغال حالياً وعاوز تضاعف مبيعاته، ولا بتأسس فكرة جديدة من الصفر؟"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => handleSelectBusinessStatus(false)}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-[#020d1a] border-2 border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col items-center text-center gap-1.5 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <Rocket className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-white">🚀 فكرة جديدة من الصفر (0→1)</div>
              <p className="text-[10px] text-white/60">ابتكار الاسم والهوية + بناء وتوليد متجر + ربط واتساب وميتا + أسبوع مجاناً</p>
            </button>

            <button
              onClick={() => handleSelectBusinessStatus(true)}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-[#020d1a] border-2 border-cyan-500/40 hover:border-cyan-400 transition-all flex flex-col items-center text-center gap-1.5 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-white">🏢 عندي نشاط وبيزنس قائم</div>
              <p className="text-[10px] text-white/60">بناء وتوليد تطبيق لنشاطك + ربط رقم واتساب وصفحة فيسبوك + تجربة 7 أيام مجاناً</p>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: FROM SCRATCH -> INDUSTRY & NAME GENERATION */}
      {step === 2 && (
        <div className="space-y-3 py-1 animate-in zoom-in-95">
          <div className="p-2.5 rounded-2xl bg-black/40 border border-emerald-500/30 text-xs text-emerald-300 font-bold">
            💡 اختر مجال مشروعك عشان جارفيس يقترحلك أقوى الأسماء ويولد الكتالوج والتطبيق:
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['تأجير سيارات', 'عيادات وطب أسنان', 'خدمات ونظافة', 'عقارات ومقاولات', 'متاجر وأزياء'].map(cat => (
              <button
                key={cat}
                onClick={() => handleGenerateNames(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  industry === cat 
                    ? 'bg-emerald-500 text-black shadow-md' 
                    : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isGenerating ? (
            <div className="p-5 text-center text-cyan-400 text-xs font-bold animate-pulse space-y-2">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin" />
              <p>جاري بناء الهوية وبناء وتوليد التطبيق وتقويم المحتوى...</p>
            </div>
          ) : suggestedNames.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {suggestedNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setBrandName(name)}
                    className={`p-2 rounded-xl text-xs font-black border transition ${
                      brandName === name 
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {suggestedSlogans.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-cyan-300">✨ اختر السلوجان (الشعار اللفظي):</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {suggestedSlogans.map(slogan => (
                      <button
                        key={slogan}
                        onClick={() => setSelectedSlogan(slogan)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold border transition text-right ${
                          selectedSlogan === slogan
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        {slogan}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestedLogoUrl && (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-white/10">
                  <img src={suggestedLogoUrl} alt="AI Logo" className="w-10 h-10 rounded-lg object-cover border border-white/20" />
                  <span className="text-[10px] text-emerald-300 font-bold">🎨 تم توليد شعار مبدئي بالذكاء الاصطناعي لهوية البراند</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">اسم البراند المعتمد:</label>
                  <input 
                    type="text" 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">رقم واتساب لاستقبال الحجوزات:</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'auto', label: '⚡ اختيار تلقائي حسب النشاط' },
                  { id: 'products_erp', label: '🛒 قالب متجر + ERP/POS' },
                  { id: 'services_booking', label: '📅 قالب خدمات + تقويم حجوزات' }
                ].map((tpl: any) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setAppTemplate(tpl.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      appTemplate === tpl.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleProvisionVisitorBrand()}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-black font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                توليد التطبيق المطور وفتح نوافذ ربط واتساب وميتا فوراً ⚡
              </button>
            </div>
          )}
        </div>
      )}

      {/* STAGE 4: EXISTING BUSINESS INPUT (ALL POSSIBILITIES: LOGO / SITE / SOCIAL / APP) */}
      {step === 4 && (
        <div className="space-y-2.5 py-1 animate-in zoom-in-95">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-white/80 mb-1">اسم البراند أو الشركة الحالية:</label>
              <input 
                type="text" 
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="مثال: عيادة دكتور حسام، معرض البركة"
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/80 mb-1">رقم الواتساب للربط الفوري:</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01013373634"
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* What assets does the existing business already have? */}
          <div className="p-2.5 rounded-2xl bg-black/40 border border-cyan-500/25 space-y-2">
            <div className="text-[10px] font-black text-cyan-300">✅ حدد إيه اللي موجود عندك حالياً (والباقي الظل هيجهزهولك تلقائياً):</div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setHasExistingLogo(v => !v)}
                className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                  hasExistingLogo ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-white/5 border-white/10 text-white/60'
                }`}
              >
                {hasExistingLogo ? '✓ ' : ''}🎨 عندي لوجو جاهز
              </button>
              <button
                type="button"
                onClick={() => setHasExistingWebsite(v => !v)}
                className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                  hasExistingWebsite ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-white/5 border-white/10 text-white/60'
                }`}
              >
                {hasExistingWebsite ? '✓ ' : ''}🌐 عندي موقع/متجر
              </button>
              <button
                type="button"
                onClick={() => setHasExistingSocial(v => !v)}
                className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                  hasExistingSocial ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-white/5 border-white/10 text-white/60'
                }`}
              >
                {hasExistingSocial ? '✓ ' : ''}📱 عندي صفحات سوشيال
              </button>
            </div>
          </div>

          {/* Existing Logo / Slogan OR AI Suggestion */}
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
            {hasExistingLogo ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-white/80">ارفع صورة اللوجو أو الصق رابطه + السلوجان:</label>
                  <label className="cursor-pointer px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-bold text-cyan-200">
                    📁 رفع لوجو
                    <input type="file" accept="image/*" onChange={handleLogoFileUpload} className="hidden" />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={suggestedLogoUrl.startsWith('data:') ? 'تم رفع صورة اللوجو بنجاح ✓' : suggestedLogoUrl}
                    onChange={(e) => setSuggestedLogoUrl(e.target.value)}
                    placeholder="رابط اللوجو (https://...)"
                    className="w-full bg-[#141b2d] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white font-mono"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    value={selectedSlogan}
                    onChange={(e) => setSelectedSlogan(e.target.value)}
                    placeholder="السلوجان الحالي (اختياري)"
                    className="w-full bg-[#141b2d] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-white/70">معندكش لوجو أو حابب شعار مطوّر؟</span>
                <button
                  type="button"
                  onClick={handleSuggestExistingIdentity}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-black"
                >
                  {isGenerating ? 'جاري التوليد...' : '✨ اقترح لي لوجو وسلوجان بالذكاء الاصطناعي'}
                </button>
              </div>
            )}
            {suggestedLogoUrl && (
              <div className="flex items-center gap-2 pt-1">
                <img src={suggestedLogoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-white/20" />
                <span className="text-[10px] text-emerald-300 font-bold">تم اعتماد اللوجو {selectedSlogan ? `— "${selectedSlogan}"` : ''}</span>
              </div>
            )}
          </div>

          {/* Existing Website + App Mode Choice */}
          <div className="space-y-1.5">
            {hasExistingWebsite && (
              <input 
                type="url" 
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="رابط موقعك أو متجرك الحالي (https://...)"
                className="w-full bg-[#141b2d] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                dir="ltr"
              />
            )}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'auto', label: '⚡ تطبيق ذكي تلقائي لنشاطك' },
                { id: 'products_erp', label: '🛒 نسخة متكاملة (متجر + ERP/POS)' },
                { id: 'services_booking', label: '📅 نسخة متكاملة (خدمات + حجوزات)' },
                ...(hasExistingWebsite ? [{ id: 'existing_site', label: '🔗 ربط موقعي الحالي فقط بدون تطبيق جديد' }] : [])
              ].map((opt: any) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExistingAppChoice(opt.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                    existingAppChoice === opt.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {hasExistingSocial && (
            <div className="p-2 rounded-xl bg-blue-950/20 border border-blue-500/25 text-[10px] text-blue-200">
              💡 ممتاز! في الخطوة الجاية مباشرة هتلاقي نوافذ ربط جاهزة لصفحاتك الحالية على: <b>فيسبوك، إنستجرام، واتساب، تيك توك، يوتيوب، تيليجرام، X، لينكدإن، وسناب شات</b>.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            {['مبيعات عبر واتساب وسوشيال', 'فرع أو عيادة وحجوزات', 'متجر إلكتروني وتوصيل', 'عقارات أو سيارات'].map(ch => (
              <button
                key={ch}
                onClick={() => handleProvisionVisitorBrand(ch)}
                disabled={isGenerating}
                className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 text-[11px] font-bold text-white text-right transition flex items-center justify-between"
              >
                <span>{ch}</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 3: REAL LIVE EXECUTION HUB (STOREFRONT + WHATSAPP QR/CODE + META CONNECT + 7-DAY TRIAL) */}
      {step === 3 && (
        <div className="space-y-3 py-1 animate-in zoom-in-95">
          {/* 1. Provisioned Storefront Live Banner */}
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-black text-white">تم بناء وتوليد وتفعيل تطبيق: {generatedBrand?.name || brandName}</h4>
                <p className="text-[10px] text-emerald-300 font-mono">{generatedAppUrl}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <a 
                href={generatedAppUrl || `/app/${generatedBrand?.slug || 'clean_master'}`}
                target="_blank" 
                rel="noreferrer" 
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1 shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {existingAppChoice === 'existing_site' && hasExistingBusiness ? 'فتح موقعك المربوط' : 'فتح تطبيقك الحي'}
              </a>
              {optionalFlagshipUrl && optionalFlagshipUrl !== generatedAppUrl && (
                <a
                  href={optionalFlagshipUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 text-[10px] font-bold text-center"
                >
                  + تجربة نسخة التطبيق الذكي
                </a>
              )}
            </div>
          </div>

          {ownerCredentials && (
            <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-500/35 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <div className="space-y-0.5">
                <div className="font-black text-amber-300">🔐 بيانات دخول لوحة الإدارة الخاصة بتطبيقك (PWA):</div>
                <div className="font-mono text-white/90" dir="ltr">
                  Email: <span className="text-cyan-300">{ownerCredentials.email}</span> • Pass: <span className="text-emerald-300">{ownerCredentials.password}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(`Email: ${ownerCredentials.email}\nPassword: ${ownerCredentials.password}`);
                  } catch {}
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold"
              >
                نسخ البيانات
              </button>
            </div>
          )}

          {/* 2. Real Interactive Account Connection Windows (WhatsApp & Meta) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Window A: WhatsApp QR & Pairing Code */}
            <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/30 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  نافذة ربط واتساب الذكي
                </span>
                <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full">
                  {waPairingData?.connected ? 'تم التوليد 🟢' : 'T2 Agent'}
                </span>
              </div>

              {waPairingData ? (
                <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2.5">
                  <img src={waPairingData.qrDataUrl} alt="WhatsApp QR" className="w-16 h-16 rounded-lg bg-white p-1 shrink-0" />
                  <div className="space-y-1 text-right">
                    <div className="text-[10px] text-white/70">كود الربط المباشر للهاتف:</div>
                    <div className="text-xs font-mono font-black text-amber-300 bg-black/60 px-2 py-1 rounded border border-amber-500/30">
                      {waPairingData.pairingCode}
                    </div>
                    <div className="text-[9px] text-emerald-300">امسح الـ QR أو أدخل الكود في واتساب</div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-white/60">
                  اربط رقم الواتساب ({phone}) بمحرك T2 Agent للرد الآلي بالصوت البشري وتأكيد الحجوزات 24/7.
                </p>
              )}

              <button
                onClick={handleConnectWhatsAppLive}
                disabled={isConnectingWa}
                className="w-full py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-black transition"
              >
                {isConnectingWa ? 'جاري فتح جلسة الربط...' : waPairingData ? '🔄 تحديث كود الربط و QR' : '📱 إظهار QR وكود ربط واتساب الآن'}
              </button>
            </div>

            {/* Window B: Meta (Facebook & Instagram) Connect */}
            <div className="p-3 rounded-2xl bg-black/60 border border-blue-500/30 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-400 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" />
                  نافذة ربط فيسبوك وإنستجرام
                </span>
                <span className="text-[9px] font-mono bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full">
                  {metaConnectData?.connected ? 'متصل 🟢' : 'Meta Graph'}
                </span>
              </div>

              {metaConnectData ? (
                <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-1">
                  <div className="text-xs font-black text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {metaConnectData.pageName}
                  </div>
                  <div className="text-[9px] font-mono text-cyan-300">Page ID: {metaConnectData.pageId}</div>
                  <div className="text-[9px] text-emerald-400">النشر التلقائي والرد على التعليقات مفعل!</div>
                </div>
              ) : (
                <input
                  type="text"
                  value={metaInputPageName}
                  onChange={(e) => setMetaInputPageName(e.target.value)}
                  placeholder={`اسم الصفحة (مثال: ${brandName || 'صفحتي الرسمية'})`}
                  className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-white"
                />
              )}

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const bId = generatedBrand?.id || generatedBrand?.slug || 'clean_master';
                    window.open(`/api/auth/meta/login?brandId=${encodeURIComponent(bId)}`, 'meta_oauth', 'width=600,height=700');
                  }}
                  className="flex-1 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/45 text-blue-200 border border-blue-400/50 text-[10px] font-black transition"
                >
                  🔐 ربط رسمي (Meta OAuth)
                </button>
                <button
                  onClick={handleConnectMetaLive}
                  disabled={isConnectingMeta}
                  className="flex-1 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-black transition"
                >
                  {isConnectingMeta ? 'جاري الربط...' : metaConnectData ? '✅ متصل' : '🔗 ربط سريع'}
                </button>
              </div>
            </div>
          </div>

          {/* 2.5 Omni-Channel Social Platforms Hub (TikTok, YouTube, Telegram, X, LinkedIn, Snapchat) */}
          <div className="p-3 rounded-2xl bg-black/60 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                ربط باقي منصات السوشيال ميديا والنشر المتعدد
              </span>
              <span className="text-[9px] font-mono bg-purple-500/15 text-purple-200 px-2 py-0.5 rounded-full">
                {Object.keys(socialLinks).length > 0 ? `${Object.keys(socialLinks).length} منصات مربوطة 🟢` : 'اختياري / حسب قنواتك'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'tiktok', label: 'TikTok' },
                { id: 'youtube', label: 'YouTube' },
                { id: 'telegram', label: 'Telegram' },
                { id: 'x', label: 'X / Twitter' },
                { id: 'linkedin', label: 'LinkedIn' },
                { id: 'snapchat', label: 'Snapchat' }
              ].map((p: any) => {
                const isLinked = Boolean(socialLinks[p.id]);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActiveSocialTab(p.id);
                      setSocialInput(socialLinks[p.id] || '');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition ${
                      activeSocialTab === p.id
                        ? 'bg-purple-500/30 border-purple-400 text-white'
                        : isLinked
                          ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {isLinked ? '🟢 ' : ''}{p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={socialInput}
                onChange={(e) => setSocialInput(e.target.value)}
                placeholder={`رابط أو @يوزر حسابك على ${activeSocialTab.toUpperCase()}...`}
                className="flex-1 bg-[#141b2d] border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-white font-mono"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => handleConnectSocialChannel(activeSocialTab)}
                disabled={isConnectingSocial || !socialInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 disabled:opacity-40 text-purple-200 border border-purple-400/40 text-[10px] font-black shrink-0"
              >
                {isConnectingSocial ? 'جاري الربط...' : socialLinks[activeSocialTab] ? '🔄 تحديث' : '🔗 ربط وحفظ'}
              </button>
            </div>
          </div>

          {/* 3. Activate 7-Day Free Trial as Executive Brand CEO */}
          <button
            onClick={() => onComplete?.(generatedBrand)}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 text-black font-black text-xs shadow-[0_0_25px_rgba(16,185,129,0.4)] transition flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            تفعيل أسبوع التجربة المجانية والدخول لغرفة المدير التنفيذي لبراندك ➔
          </button>
        </div>
      )}

    </div>
  );
};
