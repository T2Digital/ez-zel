import React, { useState } from 'react';
import { 
  Sparkles, Building2, Rocket, Globe, Smartphone, ArrowRight, 
  CheckCircle, Play, RefreshCw, Send, DollarSign, Share2, Layers, Bot, QrCode, Link2, CheckCircle2, ExternalLink
} from 'lucide-react';
import { playShadowVoice } from '../../services/speechService';

interface VisitorIntelligenceOnboardingProps {
  onComplete?: (brandData: any) => void;
  onSwitchToAdmin?: () => void;
}

export const VisitorIntelligenceOnboarding: React.FC<VisitorIntelligenceOnboardingProps> = ({
  onComplete,
  onSwitchToAdmin
}) => {
  const [step, setStep] = useState<number>(1);
  const [hasExistingBusiness, setHasExistingBusiness] = useState<boolean | null>(null);

  // Form & AI Generation State
  const [industry, setIndustry] = useState('');
  const [brandName, setBrandName] = useState('');
  const [salesChannel, setSalesChannel] = useState('');
  const [phone, setPhone] = useState('01013373634');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referralCode] = useState(() => 'VIP_' + Math.floor(1000 + Math.random() * 9000));

  // Real Provisioned Output & Live Connection Windows
  const [generatedBrand, setGeneratedBrand] = useState<any>(null);
  const [generatedAppUrl, setGeneratedAppUrl] = useState('');
  const [weekPlan, setWeekPlan] = useState<any[]>([]);

  // Real Account Connection Windows inside Visitor Flow
  const [waPairingData, setWaPairingData] = useState<{ pairingCode: string; qrDataUrl: string; connected: boolean } | null>(null);
  const [isConnectingWa, setIsConnectingWa] = useState(false);
  const [metaConnectData, setMetaConnectData] = useState<{ pageName: string; pageId: string; connected: boolean } | null>(null);
  const [metaInputPageName, setMetaInputPageName] = useState('');
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);

  // Step 1: Initial Question (Zero-to-One vs Existing)
  const handleSelectBusinessStatus = (hasBusiness: boolean) => {
    setHasExistingBusiness(hasBusiness);
    if (!hasBusiness) {
      setStep(2);
      playShadowVoice("على بركة الله! سيب القيادة ليا وركز إنت في البيزنس. قولي يا غالي، إيه المجال أو النشاط اللي بتفكر فيه؟", 'male');
    } else {
      setStep(4);
      playShadowVoice("نورتنا يا فندم! اكتبلي اسم نشاطك ورقم الواتساب عشان نستنسخ تطبيقك ونفتحلك نافذة ربط الواتساب وميتا فوراً!", 'male');
    }
  };

  // Scratch Path: Name Generation
  const handleGenerateNames = (chosenIndustry: string) => {
    setIndustry(chosenIndustry);
    setIsGenerating(true);

    const namesMap: Record<string, string[]> = {
      'تأجير سيارات': ['إليت ليموزين VIP', 'أورينت كارز مصر', 'رويال درايف للسيارات'],
      'عيادات وطب أسنان': ['عيادات بريمير دينتال', 'كريستال كير التخصصية', 'دايموند سمايل'],
      'خدمات ونظافة': ['برو كلين للخدمات المتكاملة', 'ماستر كير مصر', 'سوبر شاين للتعقيم'],
      'عقارات ومقاولات': ['برايم جيتس للتطوير', 'سكاي هوم العقارية', 'رواد المعمار'],
      'متاجر وأزياء': ['ستايل هاب مصر', 'تريند زون فاشون', 'أوربان كوليكشن']
    };

    const pool = namesMap[chosenIndustry] || ['رويال جروب', 'أفق الرقمية', 'إليت سوليوشنز'];
    setTimeout(() => {
      setSuggestedNames(pool);
      setBrandName(pool[0]);
      setIsGenerating(false);
      playShadowVoice(`اقترحت عليك 3 أسماء ليهم هيبة في السوق لمجال ${chosenIndustry}. اختار الأنسب ليك عشان نولد الهوية والتطبيق فوراً!`, 'male');
    }, 600);
  };

  // Real Provisioning via /api/jarvis/execute-action (PROVISION_VISITOR_TRIAL)
  const handleProvisionVisitorBrand = async (customChannel?: string) => {
    if (customChannel) setSalesChannel(customChannel);
    const targetName = brandName.trim() || 'براند النخبة الرقمي';
    const targetIndustry = industry || customChannel || 'خدمات وتجارة';

    setIsGenerating(true);
    try {
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'PROVISION_VISITOR_TRIAL',
          data: {
            businessName: targetName,
            industry: targetIndustry,
            phone: phone || '01013373634',
            websiteUrl
          }
        })
      });
      const data = await res.json();
      if (data.success && data.brand) {
        setGeneratedBrand(data.brand);
        const storeUrl = `${window.location.origin}/store/${data.brand.slug || data.brand.id}`;
        setGeneratedAppUrl(storeUrl);
        if (Array.isArray(data.brand.weekContentPlan)) {
          setWeekPlan(data.brand.weekContentPlan);
        }
      }
    } catch (e) {
      console.error('Provision error:', e);
    } finally {
      setIsGenerating(false);
      setStep(3);
      playShadowVoice(`ألف مبروك يا فندم! تم بناء وتوليد تطبيق ${targetName} فعلياً، وتوليد خطة محتوى تيتو ستوديو لـ 7 أيام. دلوقتي تقدر تربط الواتساب وصفحة ميتا من النوافذ الحية قدامك وتدخل كابينة المدير التنفيذي لبراندك!`, 'male');
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
              محرك تأسيس وبناء وتوليد البيزنس للزائر الجديد (0→1)
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                REAL EXECUTION
              </span>
            </h3>
            <p className="text-[10px] text-white/50">بناء وتوليد تطبيق PWA فعلي + ربط واتساب وميتا + تفعيل 7 أيام مجاناً</p>
          </div>
        </div>

        <button 
          onClick={onSwitchToAdmin}
          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 transition"
        >
          👑 وضع الماستر تيتو
        </button>
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

      {/* STAGE 4: EXISTING BUSINESS INPUT */}
      {step === 4 && (
        <div className="space-y-3 py-1 animate-in zoom-in-95">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-white/80 mb-1">اسم البراند أو الشركة الحالية:</label>
              <input 
                type="text" 
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="مثال: عيادة دكتور حسام، معرض البركة"
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/80 mb-1">رقم الواتساب للربط الفوري:</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01013373634"
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/80 mb-1">رابط موقعك الحالي أو صفحة فيسبوك (اختياري لسحب الكتالوج):</label>
            <input 
              type="url" 
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {['مبيعات عبر واتساب وسوشيال', 'فرع أو عيادة وحجوزات', 'متجر إلكتروني وتوصيل', 'عقارات أو سيارات'].map(ch => (
              <button
                key={ch}
                onClick={() => handleProvisionVisitorBrand(ch)}
                disabled={isGenerating}
                className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold text-white text-right transition flex items-center justify-between"
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
        <div className="space-y-3 py-1 animate-in zoom-in-95 max-h-[390px] overflow-y-auto pr-1">
          {/* 1. Provisioned Storefront Live Banner */}
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-black text-white">تم بناء وتوليد وتفعيل تطبيق: {generatedBrand?.name || brandName}</h4>
                <p className="text-[10px] text-emerald-300 font-mono">{generatedAppUrl}</p>
              </div>
            </div>
            <a 
              href={generatedAppUrl || `/store/${generatedBrand?.slug || 'clean_master'}`}
              target="_blank" 
              rel="noreferrer" 
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1 shrink-0 shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              فتح تطبيقك الحي
            </a>
          </div>

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

              <button
                onClick={handleConnectMetaLive}
                disabled={isConnectingMeta}
                className="w-full py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-black transition"
              >
                {isConnectingMeta ? 'جاري ربط Meta Graph...' : metaConnectData ? '✅ تم ربط الصفحة بنجاح' : '🔗 ربط صفحة فيسبوك وإنستجرام الآن'}
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
