import React, { useState, useEffect } from 'react';
import { 
  Building2, Car, Sparkles, ShoppingBag, Rocket, Globe, 
  Github, CheckCircle, Smartphone, ExternalLink, RefreshCw, 
  Layers, ShieldCheck, Zap, Plus, ArrowRight, Truck, HeartPulse 
} from 'lucide-react';
import { 
  TENANT_TEMPLATES, 
  TenantTemplate, 
  DeployedTenant, 
  getDeployedTenants, 
  provisionClientApp, 
  TenantProvisionConfig 
} from '../services/tenantFactory';

export const TenantFactoryView: React.FC = () => {
  const [templates] = useState<TenantTemplate[]>(TENANT_TEMPLATES);
  const [deployedTenants, setDeployedTenants] = useState<DeployedTenant[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('car_rental');
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [provisionStep, setProvisionStep] = useState<number>(0);
  const [lastDeployed, setLastDeployed] = useState<any>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('01013373634');
  const [whatsapp, setWhatsapp] = useState('01013373634');
  const [subdomain, setSubdomain] = useState('');
  const [pricingNotes, setPricingNotes] = useState('');

  useEffect(() => {
    setDeployedTenants(getDeployedTenants());
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !clientName) {
      alert('يرجى كتابة اسم العميل واسم النشاط التجاري');
      return;
    }

    setIsProvisioning(true);
    setProvisionStep(1);

    // Step 1: Clone template
    setTimeout(() => setProvisionStep(2), 1000);

    // Step 2: Inject brand & prices
    setTimeout(() => setProvisionStep(3), 2000);

    // Step 3: Create GitHub Repo & Push
    setTimeout(() => setProvisionStep(4), 3000);

    // Step 4: Vercel Deploy & Finalize
    setTimeout(async () => {
      const config: TenantProvisionConfig = {
        clientName,
        businessName,
        templateId: selectedTemplate as any,
        phone,
        whatsapp,
        subdomain: subdomain || businessName.replace(/\s+/g, '-').toLowerCase(),
        pricingNotes
      };

      const result = await provisionClientApp(config);
      setLastDeployed(result);
      setDeployedTenants(getDeployedTenants());
      setIsProvisioning(false);
      setProvisionStep(0);
      
      // Clear inputs
      setClientName('');
      setBusinessName('');
      setSubdomain('');
      setPricingNotes('');
    }, 4000);
  };

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Car': return <Car className="w-5 h-5 text-amber-400" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-indigo-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-teal-400" />;
      case 'ShoppingBag': return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
      case 'Truck': return <Truck className="w-5 h-5 text-cyan-400" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-rose-400" />;
      default: return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-100 p-2 sm:p-6" dir="rtl">
      {/* Top Banner: Sovereign SaaS Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
              <Zap className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                مصنع التطبيقات وباقة دكتور بزنس | Dr. Business Platform
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                لوحة إمبراطور المنظومة (تيتو) — بناء وتوليد ونشر تطبيقات الـ 100 عميل ومتابعة الاشتراكات الشهرية
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs">
            🏢 عملاء المنظومة: <span className="font-bold text-amber-400 font-mono text-sm">{deployedTenants.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs">
            💰 اشتراكات المنظومة (MRR): <span className="font-bold text-emerald-400 font-mono text-sm">
              {deployedTenants.reduce((acc, t) => acc + (t.monthlyRevenue || 0), 0).toLocaleString('en-US')} ج.م
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Builder Form & Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Provisioning Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              إطلاق تطبيق لعميل جديد (0-to-1 Deployment)
            </h2>
            <span className="text-xs text-slate-500">جاهز للتنفيذ الصوتي أو اليدوي</span>
          </div>

          <form onSubmit={handleLaunch} className="space-y-4">
            
            {/* Step 1: Select Template */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                1. اختار قالب التطبيق المطلوب للعميل:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {templates.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      selectedTemplate === t.id 
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950/40' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-800/80 mt-0.5">
                      {getTemplateIcon(t.icon)}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{t.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Client Info Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم العميل / المالك:</label>
                <input
                  type="text"
                  placeholder="مثال: م. محمد الشاذلي"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم البراند / النشاط:</label>
                <input
                  type="text"
                  placeholder="مثال: شركة البركة لتأجير السيارات"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">رقم الهاتف / واتساب الحجز:</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم الدومين المقترح (Subdomain):</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="baraka-cars"
                    value={subdomain}
                    onChange={e => setSubdomain(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-left"
                    dir="ltr"
                  />
                  <span className="bg-slate-800 px-2 py-2 text-xs text-slate-400 border border-slate-800 rounded-l-xl border-r-0 font-mono">
                    .vercel.app
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing notes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">تفاصيل الأسعار أو الخدمات الخاصة:</label>
              <textarea
                rows={2}
                placeholder="مثال: هيونداي توسان 800 ج/يوم، مرسيدس C200 2500 ج/يوم، خصم 15% للأسبوع.."
                value={pricingNotes}
                onChange={e => setPricingNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Provision Progress or Action Button */}
            {isProvisioning ? (
              <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    جاري الإنتاج الآلي للتطبيق...
                  </span>
                  <span>خطوة {provisionStep} من 4</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${provisionStep * 25}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {provisionStep === 1 && '📦 1. بناء وتوليد كود القالب الجاهز من المستودع المركزي...'}
                  {provisionStep === 2 && '🎨 2. حقن هوية العميل والأسعار ورقم الواتساب في ملفات التكوين...'}
                  {provisionStep === 3 && '🐙 3. إنشاء مستودع GitHub جديد ورفع الكود عبر الـ API...'}
                  {provisionStep === 4 && '🚀 4. تشغيل خط البناء السحابي على Vercel وربط شهادة الأمان...'}
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition"
              >
                <Rocket className="w-4 h-4" />
                <span>إطلاق التطبيق آلياً بالكامل (Auto Deploy to GitHub & Vercel)</span>
              </button>
            )}

            {lastDeployed && (
              <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">🎉 تم النشر بنجاح!</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">تطبيق العميل شغال لايف الآن</p>
                </div>
                <a
                  href={lastDeployed.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition"
                >
                  <span>فتح الرابط</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

          </form>
        </div>

        {/* Right: Live Deployed Apps Showcase (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                التطبيقات النشطة في المصنع ({deployedTenants.length})
              </h2>
              <span className="text-[11px] text-emerald-400 font-mono">100% لايف</span>
            </div>

            <div className="space-y-3 mt-4 max-h-[460px] overflow-y-auto pr-1">
              {deployedTenants.map(item => (
                <div key={item.id} className="p-3.5 bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl transition space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{item.businessName}</div>
                      <div className="text-[11px] text-slate-400">{item.clientName} • {item.templateName}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                    <a 
                      href={item.liveUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1"
                    >
                      <span>{item.liveUrl.replace('https://', '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-slate-400 font-mono">
                      واتساب: {item.whatsappBot}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>كل عميل جديد يُنشأ له مستودع GitHub مستقل ومفصول تماماً.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
