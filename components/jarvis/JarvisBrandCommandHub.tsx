import React, { useEffect, useState, useCallback } from 'react';
import {
  ExternalLink, Activity, Smartphone, Share2, Bot, Brain,
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Save,
  Copy, Check, ArrowRight, Send, MessageSquare, Globe,
  Calendar, ShieldCheck, Palette, Phone, MapPin, Link2
} from 'lucide-react';

interface JarvisBrandCommandHubProps {
  brandId: string;
  initialBrand?: any;
  isMasterAdmin?: boolean;
  onBackToGrid?: () => void;
  onOpenStudioCalendar?: () => void;
  onOpenWhatsAppModal?: (brandId: string) => void;
  onOpenMetaModal?: (brandId: string) => void;
}

type HubSection = 'app' | 'social' | 'agent' | 'brain';

export const resolveBrandWebUrl = (brand: any): string => {
  if (!brand) return '';
  const candidates = [
    brand.appUrl,
    brand.vercelUrl,
    brand.deployedUrl,
    brand.liveUrl,
    brand.websiteUrl,
  ]
    .map((u) => String(u || '').trim())
    .filter((u) => /^https?:\/\//i.test(u) && !u.includes('ez-zel.onrender.com/store'));
  if (candidates.length > 0) return candidates[0];

  const slug = String(brand.slug || brand.id || '').toLowerCase().trim();
  if (slug === 'auto-house' || slug.includes('auto_house')) {
    return 'https://t2-tenant-auto-house.vercel.app';
  }
  if (slug === 'clean_master' || slug === 'clean-master') {
    return 'https://cleanmaster-eg.com';
  }
  if (slug) {
    return `https://t2-tenant-${slug.replace(/_/g, '-')}.vercel.app`;
  }
  return `/store/${brand.slug || brand.id || ''}`;
};

export const JarvisBrandCommandHub: React.FC<JarvisBrandCommandHubProps> = ({
  brandId,
  initialBrand,
  isMasterAdmin = false,
  onBackToGrid,
  onOpenStudioCalendar,
  onOpenWhatsAppModal,
  onOpenMetaModal,
}) => {
  const [section, setSection] = useState<HubSection>('app');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [brandData, setBrandData] = useState<any>(initialBrand || null);
  const [healthData, setHealthData] = useState<any>(null);

  // Editable Single-Source-of-Truth fields
  const [name, setName] = useState(initialBrand?.name || '');
  const [phone, setPhone] = useState(initialBrand?.phone || '');
  const [address, setAddress] = useState(initialBrand?.address || '');
  const [primaryColor, setPrimaryColor] = useState(initialBrand?.primaryColor || '#0284c7');
  const [appUrl, setAppUrl] = useState(resolveBrandWebUrl(initialBrand));

  // Agent training fields
  const [tone, setTone] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [forbiddenTopics, setForbiddenTopics] = useState('');
  const [faq, setFaq] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');

  // Live Agent Tester
  const [testInput, setTestInput] = useState('عندكم تيل فرامل أو فلتر زيت وبكام التوصيل؟');
  const [testingAgent, setTestingAgent] = useState(false);
  const [testReply, setTestReply] = useState<string | null>(null);

  const loadHub = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(brandId)}`);
      const data = await res.json();
      if (data?.ok && data.brand) {
        const b = data.brand;
        setBrandData(b);
        setName(b.name || '');
        setPhone(b.phone || '');
        setAddress(b.address || '');
        setPrimaryColor(b.primaryColor || '#0284c7');
        setAppUrl(b.appUrl || resolveBrandWebUrl(b));
        setTone(b.agentConfig?.tone || '');
        setShippingPolicy(b.agentConfig?.shippingPolicy || '');
        setForbiddenTopics(b.agentConfig?.forbiddenTopics || '');
        setFaq(b.agentConfig?.faq || '');
        setKnowledgeBase(b.knowledgeBase || '');
      }
    } catch {
      // Fallback to initialBrand cleanly
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  const runHealthCheck = useCallback(async () => {
    if (!brandId) return;
    setCheckingHealth(true);
    try {
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(brandId)}/health-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data?.ok) {
        setHealthData(data);
      }
    } catch {
    } finally {
      setCheckingHealth(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadHub();
    setHealthData(null);
    setTestReply(null);
    setSaveMessage(null);
  }, [loadHub]);

  const handleSaveChanges = async (customSuccessMsg?: string) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(brandId)}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          address,
          primaryColor,
          appUrl,
          agentConfig: { tone, shippingPolicy, forbiddenTopics, faq },
          knowledgeBase,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setSaveMessage(
          customSuccessMsg ||
            (data.erpSynced
              ? 'تم الحفظ والمزامنة الفورية مع التطبيق والفواتير والأجنت ✅'
              : 'تم حفظ التعديلات وتحديث ذاكرة البراند ✅')
        );
        await loadHub();
      } else {
        setSaveMessage(data?.error || 'تعذر حفظ التعديلات');
      }
    } catch (err: any) {
      setSaveMessage(err?.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAgent = async () => {
    if (!testInput.trim()) return;
    setTestingAgent(true);
    setTestReply(null);
    try {
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(brandId)}/test-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerMessage: testInput }),
      });
      const data = await res.json();
      setTestReply(data?.replyText || data?.error || 'لم يتم استلام رد');
    } catch (err: any) {
      setTestReply(err?.message || 'خطأ في اختبار الأجنت');
    } finally {
      setTestingAgent(false);
    }
  };

  const effectiveAppUrl = appUrl || resolveBrandWebUrl(brandData || initialBrand);

  const handleCopyAppUrl = () => {
    if (!effectiveAppUrl) return;
    navigator.clipboard?.writeText(effectiveAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const socialItems = [
    { key: 'whatsapp', label: 'WhatsApp', connected: healthData?.checks?.whatsappAgent?.ok ?? brandData?.socialConnections?.whatsapp },
    { key: 'facebook', label: 'Facebook', connected: healthData?.checks?.social?.facebook?.ok ?? brandData?.socialConnections?.facebook },
    { key: 'instagram', label: 'Instagram', connected: healthData?.checks?.social?.instagram?.ok ?? brandData?.socialConnections?.instagram },
    { key: 'tiktok', label: 'TikTok', connected: healthData?.checks?.social?.tiktok?.ok ?? brandData?.socialConnections?.tiktok },
    { key: 'youtube', label: 'YouTube', connected: healthData?.checks?.social?.youtube?.ok ?? brandData?.socialConnections?.youtube },
    { key: 'telegram', label: 'Telegram', connected: healthData?.checks?.social?.telegram?.ok ?? brandData?.socialConnections?.telegram },
  ];

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-3 font-['Cairo'] text-right animate-in fade-in duration-200" dir="rtl">
      {/* TOP BAR: BRAND HEADER + DIRECT APP LINK + LIVE HEALTH CHECK */}
      <div className="w-full p-3 md:p-4 rounded-2xl bg-[#04091a]/95 border border-cyan-500/35 shadow-[0_0_30px_rgba(0,240,255,0.12)] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            {isMasterAdmin && onBackToGrid && (
              <button
                onClick={onBackToGrid}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-white/80 text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                title="الرجوع لشبكة البراندات"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الشبكة</span>
              </button>
            )}
            {brandData?.logoUrl ? (
              <img
                src={brandData.logoUrl}
                alt={name}
                className="w-10 h-10 rounded-xl object-cover border border-cyan-400/40 shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shrink-0 shadow"
                style={{ backgroundColor: primaryColor || '#0284c7' }}
              >
                {(name || brandId || 'B').slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-black text-white truncate">
                  {name || brandData?.name || brandId}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold">
                  {brandData?.businessType || 'نشاط تجاري'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/80 font-mono truncate mt-0.5">
                <Globe className="w-3 h-3 shrink-0" />
                <a
                  href={effectiveAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline truncate"
                >
                  {effectiveAppUrl}
                </a>
                <button
                  onClick={handleCopyAppUrl}
                  className="p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                  title="نسخ رابط التطبيق"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => window.open(effectiveAppUrl, '_blank', 'noopener,noreferrer')}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح التطبيق الآن</span>
            </button>
            <button
              onClick={runHealthCheck}
              disabled={checkingHealth}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/45 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            >
              {checkingHealth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              <span>{checkingHealth ? 'جاري الفحص...' : 'فحص حالة الاتصال'}</span>
            </button>
          </div>
        </div>

        {/* LIVE HEALTH CHECK STRIP (APPEARS ON CHECK) */}
        {healthData?.checks && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px]">
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${healthData.checks.app?.ok ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200' : 'bg-rose-500/10 border-rose-500/35 text-rose-200'}`}>
              {healthData.checks.app?.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <div className="min-w-0">
                <div className="font-bold truncate">تطبيق الويب</div>
                <div className="text-[10px] opacity-80 truncate">{healthData.checks.app?.message} ({healthData.checks.app?.latencyMs}ms)</div>
              </div>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-2 ${healthData.checks.cloudErp?.ok ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200' : 'bg-amber-500/10 border-amber-500/35 text-amber-200'}`}>
              {healthData.checks.cloudErp?.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
              <div className="min-w-0">
                <div className="font-bold truncate">قاعدة السحابة</div>
                <div className="text-[10px] opacity-80 truncate">{healthData.checks.cloudErp?.message}</div>
              </div>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-2 ${healthData.checks.whatsappAgent?.ok ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200' : 'bg-amber-500/10 border-amber-500/35 text-amber-200'}`}>
              {healthData.checks.whatsappAgent?.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
              <div className="min-w-0">
                <div className="font-bold truncate">وكيل الواتساب</div>
                <div className="text-[10px] opacity-80 truncate">{healthData.checks.whatsappAgent?.message}</div>
              </div>
            </div>

            <div className="p-2 rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 shrink-0 text-cyan-300" />
              <div className="min-w-0">
                <div className="font-bold truncate">السوشيال المتصل</div>
                <div className="text-[10px] opacity-80 truncate">
                  {Object.values(healthData.checks.social || {}).filter((s: any) => s?.ok).length} من 5 منصات متصلة
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 PILLARS NAVIGATION TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          {[
            { id: 'app', label: 'التطبيق والهوية', icon: Smartphone },
            { id: 'social', label: 'السوشيال والاستوديو', icon: Share2 },
            { id: 'agent', label: 'الأجنت وشات العملاء', icon: Bot },
            { id: 'brain', label: 'تغذية المعرفة', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSection(tab.id as HubSection)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/65 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {saveMessage && (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center justify-between">
          <span>{saveMessage}</span>
          <button onClick={() => setSaveMessage(null)} className="text-white/60 hover:text-white cursor-pointer">×</button>
        </div>
      )}

      {/* MAIN CONTENT BODY FOR ACTIVE PILLAR */}
      <div className="w-full flex-1 overflow-y-auto pr-0.5 space-y-3">
        {loading && !brandData ? (
          <div className="p-8 text-center text-cyan-300/80 text-xs font-bold">جاري تحميل غرفة قيادة البراند...</div>
        ) : null}

        {/* PILLAR 1: APP & IDENTITY */}
        {section === 'app' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4" />
                  إعدادات التطبيق والهوية (متزامنة مع الفاتورة والمتجر)
                </h4>
                <button
                  onClick={() => window.open(`${effectiveAppUrl.replace(/\/$/, '')}/?admin=1`, '_blank', 'noopener,noreferrer')}
                  className="text-[11px] font-bold text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>فتح لوحة أدمن التطبيق</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">اسم البراند / المتجر</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 flex items-center gap-1 mb-1">
                    <Phone className="w-3 h-3" /> رقم الموبايل / الواتساب (الفوتر والفاتورة)
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs text-right focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> العنوان الرسمي
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">لون الثيم الرئيسي</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor || '#0284c7'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                    />
                    <input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      dir="ltr"
                      className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/60 flex items-center gap-1 mb-1">
                  <Link2 className="w-3 h-3" /> رابط تطبيق الويب الفعلي للعميل (Vercel / Domain)
                </label>
                <input
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-cyan-300 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleSaveChanges()}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ ومزامنة مع التطبيق الآن'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white">
                  الكتالوج الحي ({(brandData?.productsCatalog || []).length} عنصر)
                </h4>
                <button
                  onClick={() => window.open(effectiveAppUrl, '_blank', 'noopener,noreferrer')}
                  className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                >
                  عرض في المتجر ↗
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {(brandData?.productsCatalog || []).length === 0 ? (
                  <p className="text-xs text-white/50 py-6 text-center">لا توجد منتجات مسجلة في الكتالوج حالياً.</p>
                ) : (
                  (brandData?.productsCatalog || []).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="p-2.5 rounded-xl bg-black/45 border border-white/10 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-white/50 truncate">{item.category || 'عام'} {item.sku ? `• ${item.sku}` : ''}</div>
                      </div>
                      <span className="text-xs font-black text-cyan-300 shrink-0">
                        {item.sellingPrice || item.numericPrice || item.price || 0} ج.م
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PILLAR 2: SOCIAL & STUDIO */}
        {section === 'social' && (
          <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-black text-cyan-300">حالة القنوات والمنصات المتصلة</h4>
                <p className="text-[11px] text-white/60">تأكد من جاهزية كل منصة قبل النشر أو تشغيل الرد الآلي</p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenMetaModal && (
                  <button
                    onClick={() => onOpenMetaModal(brandId)}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold cursor-pointer"
                  >
                    ربط فيسبوك وإنستجرام
                  </button>
                )}
                {onOpenStudioCalendar && (
                  <button
                    onClick={onOpenStudioCalendar}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>فتح تقويم ستوديو</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {socialItems.map((s) => (
                <div
                  key={s.key}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    s.connected
                      ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{s.label}</div>
                    <div className="text-[10px] opacity-80">{s.connected ? 'متصل وجاهز' : 'غير مربوط بعد'}</div>
                  </div>
                  {s.connected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400/80 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PILLAR 3: SALES AGENT TRAINING & LIVE INBOX */}
        {section === 'agent' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  تدريب وكيل المبيعات للبراند
                </h4>
                {onOpenWhatsAppModal && (
                  <button
                    onClick={() => onOpenWhatsAppModal(brandId)}
                    className="text-[11px] font-bold text-emerald-300 hover:underline cursor-pointer"
                  >
                    إعدادات ربط الواتساب ↗
                  </button>
                )}
              </div>

              <div>
                <label className="text-[10px] text-white/60 block mb-1">أسلوب ونبرة الرد</label>
                <input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 block mb-1">سياسة الشحن والضمان والدفع</label>
                <textarea
                  rows={2}
                  value={shippingPolicy}
                  onChange={(e) => setShippingPolicy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 block mb-1">قواعد ممنوعة / تنبيهات للأجنت</label>
                <textarea
                  rows={2}
                  value={forbiddenTopics}
                  onChange={(e) => setForbiddenTopics(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleSaveChanges('تم حفظ تدريب الأجنت وتفعيله فوراً ✅')}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ تدريب الأجنت</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-3">
              <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                اختبار رد الأجنت وشات العملاء
              </h4>

              <div className="flex gap-2">
                <input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestAgent()}
                  placeholder="اكتب سؤال عميل لتجربة رد الأجنت..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
                <button
                  onClick={handleTestAgent}
                  disabled={testingAgent}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingAgent ? '...' : 'اختبر'}</span>
                </button>
              </div>

              {testReply && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/35 text-xs text-white leading-relaxed">
                  <div className="text-[10px] font-bold text-cyan-300 mb-1">رد وكيل المبيعات التجريبي:</div>
                  {testReply}
                </div>
              )}

              <div className="pt-2 border-t border-white/10 space-y-2 max-h-44 overflow-y-auto">
                <div className="text-[10px] font-bold text-white/50">آخر محادثات العملاء:</div>
                {(brandData?.recentConversations || []).map((c: any) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-black/45 border border-white/10 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-white/60 text-[10px]">
                      <span className="font-bold text-cyan-300">{c.customerName} ({c.channel})</span>
                      <span>{c.time}</span>
                    </div>
                    <div className="text-white/90">العميل: {c.lastMessage}</div>
                    <div className="text-emerald-300/90">الأجنت: {c.agentReply}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PILLAR 4: UNIFIED KNOWLEDGE BASE */}
        {section === 'brain' && (
          <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-3">
            <div>
              <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                بنك المعرفة الموحد (يغذي التطبيق + الأجنت + الاستوديو معاً)
              </h4>
              <p className="text-[11px] text-white/60 mt-0.5">
                أضف هنا أي تفاصيل عن البراند، العروض الحالية، الفروع، مواعيد العمل، أو الأسئلة المتكررة، وسيعتمدها الأجنت والاستوديو فوراً.
              </p>
            </div>
            <textarea
              rows={7}
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              placeholder="مثال: أوتو هاوس متخصص في قطع غيار السيارات الألماني والياباني الأصلية بضمان 6 شهور، الفرع الرئيسي في التوفيقية القاهرة، الشحن مجاني للطلبات فوق 3000 جنيه..."
              className="w-full p-3 rounded-xl bg-black/55 border border-white/15 text-white text-xs leading-relaxed focus:border-amber-400 focus:outline-none"
            />
            <button
              onClick={() => handleSaveChanges('تم تحديث بنك المعرفة وتغذية الأجنت والاستوديو ✅')}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'جاري التحديث...' : 'حفظ وتغذية المنظومة'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
