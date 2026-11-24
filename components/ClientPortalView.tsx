import React, { useEffect, useState } from 'react';
import { Bot, Check, CheckCircle2, Copy, ExternalLink, Film, LayoutGrid, MessageSquare, Send, Sparkles } from 'lucide-react';

interface ClientPortalViewProps {
  slug: string;
}

interface PortalLinks {
  studioShowroomUrl?: string;
  agentDashboardUrl?: string;
  agentFullDashboardUrl?: string;
  storefrontUrl?: string;
  studioLandingPageUrl?: string;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ slug }) => {
  const [brand, setBrand] = useState<any>(null);
  const [portals, setPortals] = useState<PortalLinks>({});
  const [planSpec, setPlanSpec] = useState<any>(null);
  const [appAccessMode, setAppAccessMode] = useState<'landing_page' | 'full_app'>('full_app');
  const [quota, setQuota] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('active');
  const [upgradeUrl, setUpgradeUrl] = useState<string>(`/pricing?brandId=${encodeURIComponent(slug)}`);
  const [portalAuthValid, setPortalAuthValid] = useState<boolean>(true);
  const [authBanner, setAuthBanner] = useState<string>('');
  const [portalToken, setPortalToken] = useState<string>(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('token') || '';
      const storageKey = `t2_portal_token_${slug}`;
      if (fromUrl) {
        sessionStorage.setItem(storageKey, fromUrl);
        return fromUrl;
      }
      return sessionStorage.getItem(storageKey) || '';
    } catch {
      return '';
    }
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'showroom' | 'agent' | 'account_manager' | 'posts'>('overview');
  const [copiedWelcome, setCopiedWelcome] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyIdx, setBusyIdx] = useState<number | null>(null);

  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  const loadPortal = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (portalToken) headers['x-portal-token'] = portalToken;
      const res = await fetch(`/api/client-portal/${encodeURIComponent(slug)}`, { headers });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'تعذر تحميل بيانات البراند');
      setBrand(data.brand);
      setPortals(data.portals || {});
      setPlanSpec(data.planSpec || null);
      setAppAccessMode(data.appAccessMode || 'full_app');
      setQuota(data.quota || null);
      if (data.subscriptionStatus) setSubscriptionStatus(data.subscriptionStatus);
      if (data.upgradeUrl) setUpgradeUrl(data.upgradeUrl);
      setPortalAuthValid(data.portalAuthValid !== false);
      if (chatHistory.length === 0) {
        setChatHistory([
          {
            role: 'assistant',
            text: `أهلاً بك في بوابة ${data.brand?.name || slug}! أنا مدير الحساب الذكي الخاص ببراندك. تقدر تطلب مني تجهيز بوستات، متابعة صالة العرض في تيتو استوديو، أو مراجعة حالة بوت الواتساب في تيتو أجنت.`,
          },
        ]);
      }
    } catch (e: any) {
      setError(e.message || 'خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, [slug]);

  const handleDecision = async (postIndex: number, decision: 'approved' | 'revision_requested') => {
    setBusyIdx(postIndex);
    setAuthBanner('');
    try {
      const feedback =
        decision === 'revision_requested'
          ? window.prompt('اكتب التعديل المطلوب على هذا المنشور:') || 'يرجى تعديل الصياغة'
          : '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (portalToken) headers['x-portal-token'] = portalToken;
      const res = await fetch(`/api/client-portal/${encodeURIComponent(slug)}/approve-post`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ postIndex, decision, feedback, portalToken }),
      });
      const data = await res.json();
      if (res.status === 401 || res.status === 402) {
        setAuthBanner(data?.error || 'الرابط غير موثق أو انتهت صلاحية الاشتراك.');
        if (data?.upgradeUrl) setUpgradeUrl(data.upgradeUrl);
      } else if (data.ok && data.brand) {
        setBrand(data.brand);
      }
    } finally {
      setBusyIdx(null);
    }
  };

  const handleSendToAccountManager = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || chatSending) return;
    const nextHistory = [...chatHistory, { role: 'user' as const, text: msg }];
    setChatHistory(nextHistory);
    setChatInput('');
    setChatSending(true);
    setAuthBanner('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (portalToken) headers['x-portal-token'] = portalToken;
      const res = await fetch(`/api/client-portal/${encodeURIComponent(slug)}/account-manager`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: msg,
          portalToken,
          history: nextHistory.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      if (res.status === 401 || res.status === 402) {
        setAuthBanner(data?.error || 'مطلوب رابط دخول موثق أو تجديد الاشتراك للتحدث مع مدير الحساب.');
        if (data?.upgradeUrl) setUpgradeUrl(data.upgradeUrl);
      }
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data?.replyText || data?.error || 'تم استلام رسالتك وجاري العمل عليها.',
        },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: err?.message || 'تعذر الوصول لمدير الحساب الآن.' },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020611] text-white flex items-center justify-center font-['Cairo']">
        جاري تحميل بوابة العميل...
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-[#020611] text-rose-300 flex items-center justify-center font-['Cairo']">
        {error || 'البراند غير موجود'}
      </div>
    );
  }

  const posts: any[] = Array.isArray(brand.weekContentPlan) ? brand.weekContentPlan : [];
  const storefrontHref = portals.storefrontUrl || `/store/${brand.slug || brand.id}`;

  return (
    <div dir="rtl" className="min-h-screen bg-[#020611] text-white font-['Cairo'] p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <header className="rounded-3xl bg-[#071122]/85 border border-cyan-500/25 p-5 md:p-6 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
          <div>
            <div className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>بوابة العميل الموحدة • {planSpec?.nameAr || 'الظل T2OS'}</span>
            </div>
            <h1 className="text-2xl font-black mt-1">{brand.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {brand.businessType || 'نشاط تجاري'} • وضع الوصول:{' '}
              <span className="text-amber-300 font-bold">
                {appAccessMode === 'landing_page' ? 'لاندنج بيدج (2,500)' : 'تطبيق ويب متكامل'}
              </span>
              {quota && (
                <>
                  {' '}
                  • رصيد الشهر: <span className="text-emerald-300 font-bold">{quota.designsRemaining ?? quota.monthlyDesigns ?? 0} تصميم</span> /{' '}
                  <span className="text-cyan-300 font-bold">{quota.videosRemaining ?? quota.monthlyVideos ?? 0} فيديو</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {portals.studioShowroomUrl && (
              <a
                href={portals.studioShowroomUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-purple-600/25 border border-purple-400/40 text-purple-200 text-xs font-black flex items-center gap-1.5 hover:bg-purple-600/40"
              >
                <Film className="w-3.5 h-3.5" />
                <span>الشو روم (تيتو استوديو)</span>
              </a>
            )}
            {(portals.agentFullDashboardUrl || portals.agentDashboardUrl) && (
              <a
                href={portals.agentFullDashboardUrl || portals.agentDashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600/25 border border-emerald-400/40 text-emerald-200 text-xs font-black flex items-center gap-1.5 hover:bg-emerald-600/40"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>داشبورد تيتو أجنت</span>
              </a>
            )}
            <a
              href={storefrontHref}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{appAccessMode === 'landing_page' ? 'فتح اللاندنج بيدج' : 'معاينة المتجر/التطبيق'}</span>
            </a>
          </div>
        </header>

        {/* Subscription / Auth Banner */}
        {(subscriptionStatus === 'expired' || authBanner || !portalAuthValid) && (
          <div className="rounded-2xl bg-amber-500/15 border border-amber-400/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-amber-200">
              {authBanner ||
                (subscriptionStatus === 'expired'
                  ? 'انتهت مدة التجربة/الاشتراك الحالية — يرجى تجديد الباقة لاستمرار النشر ومدير الحساب.'
                  : 'هذا الرابط للمعاينة فقط — لإعتماد المنشورات أو محادثة مدير الحساب افتح الرابط الموثق (?token=...).')}
            </span>
            <a
              href={upgradeUrl}
              className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black hover:bg-amber-300 transition"
            >
              ترقية وتفعيل الاشتراك الآن
            </a>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-white text-slate-950' : 'bg-[#071122] text-slate-300 border border-white/10 hover:border-cyan-400/40'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>📊 نظرة عامة وروابطي</span>
          </button>
          <button
            onClick={() => setActiveTab('showroom')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              activeTab === 'showroom' ? 'bg-purple-600 text-white' : 'bg-[#071122] text-slate-300 border border-white/10 hover:border-purple-400/40'
            }`}
          >
            🎨 صالة العرض (Showroom فقط)
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              activeTab === 'agent' ? 'bg-emerald-600 text-white' : 'bg-[#071122] text-slate-300 border border-white/10 hover:border-emerald-400/40'
            }`}
          >
            🤖 داشبورد تيتو أجنت والواتساب
          </button>
          <button
            onClick={() => setActiveTab('account_manager')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              activeTab === 'account_manager' ? 'bg-cyan-500 text-slate-950' : 'bg-[#071122] text-slate-300 border border-white/10 hover:border-cyan-400/40'
            }`}
          >
            🧠 مدير الحساب الذكي (Account Manager)
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              activeTab === 'posts' ? 'bg-amber-500 text-slate-950' : 'bg-[#071122] text-slate-300 border border-white/10 hover:border-amber-400/40'
            }`}
          >
            📋 اعتماد المنشورات السريع ({posts.length})
          </button>
        </div>

        {/* Tab 0: Overview & Welcome Kit */}
        {activeTab === 'overview' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-[#071122]/85 border border-cyan-500/30 p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-cyan-300">1. المتجر والتطبيق</div>
                <h3 className="text-base font-black mt-1">{brand.name}</h3>
                <p className="text-xs text-slate-400 mt-1">كتالوج المنتجات والطلبات المباشرة للعملاء</p>
              </div>
              <a
                href={storefrontHref}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح التطبيق الآن</span>
              </a>
            </div>

            <div className="rounded-3xl bg-[#071122]/85 border border-purple-500/30 p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-purple-300">2. تيتو استوديو (المحتوى)</div>
                <h3 className="text-base font-black mt-1">الرصيد: {quota?.designsRemaining ?? quota?.monthlyDesigns ?? 2} تصميم / {quota?.videosRemaining ?? quota?.monthlyVideos ?? 1} فيديو</h3>
                <p className="text-xs text-slate-400 mt-1">مراجعة واعتماد التصميمات والريلز الجاهزة للنشر</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('showroom')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black cursor-pointer"
              >
                فتح صالة العرض
              </button>
            </div>

            <div className="rounded-3xl bg-[#071122]/85 border border-emerald-500/30 p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-emerald-300">3. تيتو أجنت (الواتساب)</div>
                <h3 className="text-base font-black mt-1">{brand.whatsappConnected ? 'واتساب متصل ويعمل 24/7' : 'جاهز لربط QR'}</h3>
                <p className="text-xs text-slate-400 mt-1">الرد الآلي على العملاء وتحويل الحجوزات للوحة</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('agent')}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
              >
                فتح لوحة الأيجنت والـ QR
              </button>
            </div>

            <div className="rounded-3xl bg-[#071122]/85 border border-amber-500/30 p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-amber-300">4. باقة الترحيب السريعة</div>
                <h3 className="text-base font-black mt-1">{planSpec?.nameAr || 'باقة التشغيل الذكي'}</h3>
                <p className="text-xs text-slate-400 mt-1">انسخ جميع روابط متجرك وبوابتك بضغطة واحدة</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const txt = [
                    `باقة الترحيب لبراند: ${brand.name}`,
                    `المتجر: ${storefrontHref}`,
                    portals.studioShowroomUrl ? `تيتو استوديو (الشو روم): ${portals.studioShowroomUrl}` : '',
                    (portals.agentFullDashboardUrl || portals.agentDashboardUrl) ? `تيتو أجنت (واتساب QR): ${portals.agentFullDashboardUrl || portals.agentDashboardUrl}` : '',
                    `بوابة العميل: ${typeof window !== 'undefined' ? window.location.href : ''}`,
                  ].filter(Boolean).join('\n');
                  navigator.clipboard?.writeText(txt).catch(() => {});
                  setCopiedWelcome(true);
                  setTimeout(() => setCopiedWelcome(false), 2500);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedWelcome ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWelcome ? 'تم نسخ الروابط!' : 'نسخ باقة الترحيب'}</span>
              </button>
            </div>
          </section>
        )}

        {/* Tab 1: T2 Studio Showroom Only */}
        {activeTab === 'showroom' && (
          <div className="rounded-3xl bg-[#071122]/80 border border-purple-500/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs">
              <span className="font-bold text-purple-300">صالة العرض المخصصة لـ {brand.name} (معزولة عن خريطة الاستوديو الكاملة)</span>
              {portals.studioShowroomUrl && (
                <a href={portals.studioShowroomUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline flex items-center gap-1">
                  <span>فتح في نافذة مستقلة</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {portals.studioShowroomUrl ? (
              <iframe src={portals.studioShowroomUrl} title="T2 Studio Showroom" className="w-full h-[720px] border-0 bg-[#070b14]" />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">رابط صالة العرض غير متاح حالياً</div>
            )}
          </div>
        )}

        {/* Tab 2: T2 Agent Client Dashboard */}
        {activeTab === 'agent' && (
          <div className="rounded-3xl bg-[#071122]/80 border border-emerald-500/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300">لوحة تيتو أجنت والواتساب المخصصة لـ {brand.name}</span>
              {(portals.agentFullDashboardUrl || portals.agentDashboardUrl) && (
                <a href={portals.agentFullDashboardUrl || portals.agentDashboardUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline flex items-center gap-1">
                  <span>فتح لوحة الأيجنت كاملة</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {portals.agentDashboardUrl ? (
              <iframe src={portals.agentDashboardUrl} title="T2 Agent Client Dashboard" className="w-full h-[720px] border-0 bg-[#070b14]" />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">رابط لوحة الأيجنت غير متاح حالياً</div>
            )}
          </div>
        )}

        {/* Tab 3: Brand Account Manager Agent */}
        {activeTab === 'account_manager' && (
          <div className="rounded-3xl bg-[#071122]/85 border border-cyan-500/30 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <Bot className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-black text-white">مدير الحساب الذكي لـ {brand.name}</h3>
                <p className="text-[11px] text-slate-400">اطلب تعديل محتوى، تصميمات جديدة، تقارير الكوتة، أو مساعدة في ربط الواتساب</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto p-2">
              {chatHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'self-start bg-cyan-500/20 border border-cyan-400/30 text-white'
                      : 'self-end bg-white/5 border border-white/10 text-slate-200'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendToAccountManager} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب طلبك لمدير الحساب الذكي..."
                className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="px-5 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{chatSending ? 'جاري الرد...' : 'إرسال'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Quick Posts Approval */}
        {activeTab === 'posts' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post, idx) => (
              <div
                key={post.id || idx}
                className="rounded-2xl bg-[#071122]/75 border border-white/10 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-cyan-300">{post.day || `منشور #${idx + 1}`}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      post.clientApproval === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : post.clientApproval === 'revision_requested'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {post.clientApproval === 'approved'
                      ? 'معتمد للنشر'
                      : post.clientApproval === 'revision_requested'
                      ? 'مطلوب تعديل'
                      : 'بانتظار مراجعتك'}
                  </span>
                </div>

                {post.visualUrl && (
                  <img
                    src={post.visualUrl}
                    alt={post.hook}
                    className="w-full h-52 object-cover rounded-xl border border-white/10"
                  />
                )}

                <div className="text-sm font-black">{post.hook}</div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{post.caption}</p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={busyIdx === idx}
                    onClick={() => handleDecision(idx, 'approved')}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اعتماد للنشر</span>
                  </button>
                  <button
                    disabled={busyIdx === idx}
                    onClick={() => handleDecision(idx, 'revision_requested')}
                    className="flex-1 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>طلب تعديل</span>
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};
