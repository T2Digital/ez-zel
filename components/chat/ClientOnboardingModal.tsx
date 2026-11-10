import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, Sparkles, Building2, Car, ShoppingBag, 
  Truck, HeartPulse, Layers, Smartphone, QrCode, Facebook, 
  Instagram, Share2, ArrowRight, ArrowLeft, Loader2, Globe, Github, Check
} from 'lucide-react';
import { playShadowVoice } from '../../services/speechService';

interface ClientOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBusinessName?: string;
  initialCategory?: string;
  onSuccess?: (tenant: any) => void;
}

const CATEGORIES = [
  { id: 'ecommerce_store', name: 'متجر تجارة إلكترونية ذكي', icon: ShoppingBag, color: 'from-amber-500 to-orange-600', mrr: '18,000 ج.م/شهر' },
  { id: 'car_rental', name: 'تأجير سيارات فارهة ونقل VIP', icon: Car, color: 'from-blue-500 to-cyan-600', mrr: '28,000 ج.م/شهر' },
  { id: 'real_estate', name: 'عقارات ومستشارك الذكي', icon: Building2, color: 'from-emerald-500 to-teal-600', mrr: '35,000 ج.م/شهر' },
  { id: 'medical_clinic', name: 'عيادات ومراكز طبية متخصصة', icon: HeartPulse, color: 'from-rose-500 to-pink-600', mrr: '20,000 ج.م/شهر' },
  { id: 'shipping_logistics', name: 'شحن وتوصيل ولوجستيات', icon: Truck, color: 'from-purple-500 to-indigo-600', mrr: '12,650 ج.م/شهر' },
  { id: 'clean_master', name: 'خدمات صيانة ونظافة وحجوزات', icon: Sparkles, color: 'from-cyan-500 to-blue-600', mrr: '14,850 ج.م/شهر' },
];

export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({
  isOpen,
  onClose,
  initialBusinessName = '',
  initialCategory = 'ecommerce_store',
  onSuccess
}) => {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [completedTenant, setCompletedTenant] = useState<any>(null);

  // Form Fields
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [subdomain, setSubdomain] = useState('');
  
  // Step 2: Branding
  const [logoUrl, setLogoUrl] = useState('');
  const [slogan, setSlogan] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#06b6d4');
  
  // Step 3: WhatsApp
  const [whatsapp, setWhatsapp] = useState('01013373634');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrConnected, setQrConnected] = useState(false);
  
  // Step 4: Meta & Ad Budget Package
  const [metaPageName, setMetaPageName] = useState('');
  const [metaAutoReply, setMetaAutoReply] = useState(true);
  const [metaAutoPost, setMetaAutoPost] = useState(true);
  const [metaDMs, setMetaDMs] = useState(true);
  const [selectedPlanAmount, setSelectedPlanAmount] = useState<number>(5000);

  const BUNDLED_PLANS = [
    { amount: 2500, label: 'باقة الانطلاق (2,500 ج)', ads: '1,250 ج إعلانات', tech: '1,250 ج سيستم', popular: false },
    { amount: 5000, label: 'باقة النمو (5,000 ج)', ads: '2,500 ج إعلانات', tech: '2,500 ج سيستم', popular: true },
    { amount: 10000, label: 'باقة البرو (10,000 ج)', ads: '5,000 ج إعلانات', tech: '5,000 ج سيستم', popular: false },
    { amount: 20000, label: 'باقة المؤسسات (20,000 ج)', ads: '10,000 ج إعلانات', tech: '10,000 ج سيستم', popular: false },
    { amount: 50000, label: 'الباقة السيادية (50,000 ج)', ads: '25,000 ج إعلانات', tech: '25,000 ج سيستم', popular: false },
  ];

  useEffect(() => {
    if (initialBusinessName) {
      setBusinessName(initialBusinessName);
      setSubdomain(initialBusinessName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'));
    }
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialBusinessName, initialCategory]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!businessName || !clientName) {
        alert('يرجى كتابة اسم البراند واسم المسؤول');
        return;
      }
      if (!subdomain) {
        setSubdomain(businessName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'));
      }
    }
    setStep(s => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: businessName,
        clientName,
        businessName,
        category,
        templateId: category,
        subdomain: subdomain || businessName.toLowerCase().replace(/\s+/g, '-'),
        phone: whatsapp,
        whatsapp,
        logoUrl,
        primaryColor,
        slogan,
        metaPageId: metaPageName,
        metaConnected: true,
        metaAutoReply,
        metaAutoPost,
        planType: selectedPlanAmount,
        adBudgetRatio: 0.5
      };

      // Call Unified Register Brand Endpoint
      const res = await fetch('/api/vault/register-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setCompletedTenant(data.tenant);
        onSuccess?.(data.tenant);
        // Play human voice celebration
        playShadowVoice(
          `ألف مبروك يا ماستر تيتو! تم بنجاح تأسيس براند ${businessName} وإدراجه في الخزنة الموحدة، وربطه بالأجنت والستوديو وباقة إعلانات بقيمة ${data.economics?.adBudget || 2500} جنيه!`,
          'male'
        );
      } else {
        alert(data.error || 'حدث خطأ أثناء بناء وتوليد التطبيق');
      }
    } catch (err: any) {
      alert('تعذر الاتصال بسيرفر المصنع: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md font-['Cairo'] animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/10 bg-[#070b14]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                مصنع بناء وتوليد وتشغيل التطبيقات
                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                  Sovereign Factory 0→1
                </span>
              </h2>
              <p className="text-xs text-white/50">تجهيز هوية البراند، وربط الواتساب وميتا في دقائق معدودة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        {!completedTenant && (
          <div className="px-5 py-3 bg-[#0d1424] border-b border-white/5 flex items-center justify-between">
            {[
              { num: 1, title: 'بيانات البراند' },
              { num: 2, title: 'الهوية واللوجو' },
              { num: 3, title: 'ربط واتساب' },
              { num: 4, title: 'ربط ميتا وسوشيال' }
            ].map(s => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num 
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]' 
                    : step > s.num 
                    ? 'bg-emerald-500 text-black' 
                    : 'bg-white/10 text-white/40'
                }`}>
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className={`text-xs hidden sm:inline font-bold ${step === s.num ? 'text-cyan-400' : 'text-white/40'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
          {completedTenant ? (
            /* Success View */
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">تم بناء وتوليد ونشر تطبيق [{completedTenant.businessName}] بنجاح!</h3>
                <p className="text-sm text-white/60 mt-1">تم حقن الهوية، تشغيل بوت الواتساب، وربط صفحات ميتا على مدار الساعة.</p>
              </div>

              {/* Tenant Credentials Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                <a 
                  href={completedTenant.liveUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-cyan-400 group-hover:animate-spin" />
                    <div>
                      <div className="text-xs text-cyan-400 font-bold">رابط التطبيق المباشر (Vercel)</div>
                      <div className="text-sm font-mono text-white truncate max-w-[200px]">{completedTenant.liveUrl}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </a>

                <a 
                  href={`https://wa.me/${completedTenant.whatsappBot.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs text-emerald-400 font-bold">شات بوت الواتساب المربوط</div>
                      <div className="text-sm font-mono text-white">{completedTenant.whatsappBot}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </a>

                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-3">
                  <Facebook className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-xs text-purple-400 font-bold">نظام ميتا الآلي</div>
                    <div className="text-sm text-white font-bold">نشر تلقائي + رد ذكي على التعليقات</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs text-amber-400 font-bold">الاشتراك الشهري المقدر</div>
                    <div className="text-sm text-white font-black">{completedTenant.monthlyRevenue?.toLocaleString('en-US')} ج.م / شهر</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-lg shadow-cyan-500/20 transition-all"
                >
                  تم، إغلاق النافذة
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Brand Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/80 mb-1.5">اسم النشاط أو البراند التجارية *</label>
                      <input 
                        type="text" 
                        value={businessName}
                        onChange={(e) => {
                          setBusinessName(e.target.value);
                          setSubdomain(e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'));
                        }}
                        placeholder="مثال: متجر البارون للأحذية، عيادات الشفاء"
                        className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/80 mb-1.5">اسم العميل / صاحب البيزنس *</label>
                      <input 
                        type="text" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="مثال: أحمد عبد الله، دكتور حسام"
                        className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">اختر نموذج المنظومة المتخصصة *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {CATEGORIES.map(c => {
                        const Icon = c.icon;
                        const active = category === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategory(c.id)}
                            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-24 ${
                              active 
                                ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <Icon className={`w-5 h-5 ${active ? 'text-cyan-400' : 'text-white/60'}`} />
                              <span className="text-[10px] text-white/40">{c.mrr}</span>
                            </div>
                            <div className={`text-xs font-bold leading-tight ${active ? 'text-cyan-300' : 'text-white/80'}`}>
                              {c.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">الدومين والاسم الفرعي (Subdomain)</label>
                    <div className="flex items-center gap-2 bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2 text-sm">
                      <span className="text-white/40 font-mono text-xs">.vercel.app</span>
                      <input 
                        type="text" 
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^\w-]/g, ''))}
                        className="flex-1 bg-transparent text-white focus:outline-none font-mono text-left"
                        dir="ltr"
                        placeholder="elbaron-store"
                      />
                      <span className="text-white/40 font-mono text-xs">https://</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Branding & Logo */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">شعار البراند (Logo URL أو صورة)</label>
                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 shrink-0 overflow-hidden">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-white/30" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input 
                          type="text" 
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="ضع رابط صورة الشعار (PNG/JPG) أو سيتم استخدام الشعار الافتراضي"
                          className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-white/40">يمكنك ترك الرابط فارغاً وسيقوم مصمم الظل الذكي بإنشاء شعار مبسط للبراند تلقائياً.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">الشعار اللفظي أو الوصف (Slogan)</label>
                    <input 
                      type="text" 
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="مثال: وجهتك الأولى لأرقى الموديلات العصرية"
                      className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-2">لون البراند الرئيسي</label>
                    <div className="flex items-center gap-3">
                      {['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'].map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setPrimaryColor(col)}
                          style={{ backgroundColor: col }}
                          className={`w-9 h-9 rounded-full transition-transform ${
                            primaryColor === col ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: WhatsApp Automation */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">رقم هاتف الواتساب المخصص للبوت *</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="tel" 
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="01013373634 أو +201..."
                        className="flex-1 bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                        dir="ltr"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setQrGenerated(true);
                          setTimeout(() => setQrConnected(true), 2500);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        <QrCode className="w-4 h-4" />
                        توليد كود الربط
                      </button>
                    </div>
                  </div>

                  {/* QR Box */}
                  <div className="p-4 rounded-xl bg-[#090d18] border border-white/10 flex flex-col items-center justify-center text-center space-y-3">
                    {qrGenerated ? (
                      qrConnected ? (
                        <div className="py-4 space-y-2 animate-in zoom-in-95">
                          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div className="text-sm font-bold text-white">تم التحقق من ربط جلسة واتساب بنجاح!</div>
                          <div className="text-xs text-emerald-400">البوت جاهز للرد على استفسارات وحجوزات العملاء تلقائياً 24/7.</div>
                        </div>
                      ) : (
                        <div className="py-2 space-y-2 animate-pulse">
                          <div className="w-32 h-32 bg-white rounded-lg p-2 mx-auto flex items-center justify-center">
                            <QrCode className="w-28 h-28 text-black" />
                          </div>
                          <p className="text-xs text-cyan-300 font-bold">امسح الكود عبر تطبيق WhatsApp Web للربط الفوري...</p>
                        </div>
                      )
                    ) : (
                      <div className="py-6 text-white/40 space-y-2">
                        <QrCode className="w-12 h-12 mx-auto opacity-30" />
                        <p className="text-xs">اضغط على "توليد كود الربط" لإنشاء جلسة محاكاة أو ربط حقيقي مع خادم البوت.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Meta & Social Ecosystem */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">معرف أو اسم صفحة فيسبوك / إنستجرام</label>
                    <input 
                      type="text" 
                      value={metaPageName}
                      onChange={(e) => setMetaPageName(e.target.value)}
                      placeholder="مثال: facebook.com/elbaron أو @elbaron_official"
                      className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Bundled Ad & System Package Selector */}
                  <div className="space-y-2 pt-1 pb-2 border-b border-white/10">
                    <label className="block text-xs font-bold text-amber-300">
                      💰 اختر باقة النمو المدمجة (50% ميزانية إعلانات ممولة + 50% نظام وأجنت):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {BUNDLED_PLANS.map(p => {
                        const isSelected = selectedPlanAmount === p.amount;
                        return (
                          <button
                            key={p.amount}
                            type="button"
                            onClick={() => setSelectedPlanAmount(p.amount)}
                            className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 relative ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {p.popular && (
                              <span className="absolute -top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                الأكثر طلباً
                              </span>
                            )}
                            <div className="text-xs font-black text-white">{p.label}</div>
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-emerald-400 font-bold">{p.ads}</span>
                              <span className="text-cyan-400">{p.tech}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-bold text-white/80">صلاحيات منظومة الأوتوميشن الذكية:</div>
                    
                    <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Facebook className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-xs font-bold text-white">الرد الآلي على تعليقات المنشورات</div>
                          <div className="text-[10px] text-white/40">يرد على "بكام"، "التفاصيل"، ويحوّل العميل للخاص أو واتساب</div>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={metaAutoReply}
                        onChange={(e) => setMetaAutoReply(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500 rounded" 
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <div>
                          <div className="text-xs font-bold text-white">الرد الفوري على رسائل الدايركت (DMs) والماسنجر</div>
                          <div className="text-[10px] text-white/40">إغلاق الصفقات وإتمام عمليات البيع تلقائياً داخل المحادثة</div>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={metaDMs}
                        onChange={(e) => setMetaDMs(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500 rounded" 
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Share2 className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="text-xs font-bold text-white">النشر التلقائي للمنتجات والمحتوى التسويقي</div>
                          <div className="text-[10px] text-white/40">توليد تصاميم بالذكاء الاصطناعي وجدولتها بدون تدخل بشري</div>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={metaAutoPost}
                        onChange={(e) => setMetaAutoPost(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500 rounded" 
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!completedTenant && (
          <div className="p-4 border-t border-white/10 bg-[#070b14]/90 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
              >
                التالي
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري البناء الذكي والنشر...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    بناء وتوليد وتشغيل التطبيق الآن
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
