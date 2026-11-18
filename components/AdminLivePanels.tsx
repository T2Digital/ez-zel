import React, { useEffect, useState, useCallback } from 'react';
import {
  Bot, Film, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle,
  MessageSquare, Calendar, Sparkles, Power, Globe, Zap
} from 'lucide-react';

interface AdminLivePanelsProps {
  onOpenBrandInJarvis?: (brandId: string) => void;
}

export const AdminLiveStudioPanel: React.FC<AdminLivePanelsProps> = ({ onOpenBrandInJarvis }) => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyBrandId, setBusyBrandId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadStudioData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/obsidian/graph');
      const data = await res.json();
      if (data?.success && Array.isArray(data.growthAgencyBrands)) {
        setBrands(data.growthAgencyBrands);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudioData();
  }, [loadStudioData]);

  const handleGenerateWeekPlan = async (brand: any) => {
    setBusyBrandId(brand.id);
    setToastMsg(null);
    try {
      const res = await fetch('/api/tito-studio/generate-week-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: brand.id, brandName: brand.name }),
      });
      const data = await res.json();
      setToastMsg(data?.success ? `تم توليد وتزامن خطة الأسبوع لـ ${brand.name} عبر API الاستوديو ✅` : (data?.error || 'تعذر توليد الخطة'));
      await loadStudioData();
    } catch (e: any) {
      setToastMsg(e?.message || 'خطأ في الاتصال بالاستوديو');
    } finally {
      setBusyBrandId(null);
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Film className="w-6 h-6 text-amber-400" />
          <div>
            <h3 className="text-base font-black text-white">تيتو ستوديو • التحكم عبر API الاستوديو الحي</h3>
            <p className="text-xs text-white/60">عرض مباشر لخطط المحتوى المتزامنة مع Firestore بدون الحاجة لتسجيل الدخول داخل iframe</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStudioData}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
          <a
            href="https://t2-studio.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-amber-500 text-black text-xs font-black rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>فتح تطبيق الاستوديو</span>
          </a>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
          {toastMsg}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-white/60 text-sm">جاري تحميل بيانات البراندات من T2 Studio API...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b: any) => {
            const planCount = Array.isArray(b.weekContentPlan) ? b.weekContentPlan.length : 0;
            const approvedCount = Array.isArray(b.weekContentPlan)
              ? b.weekContentPlan.filter((p: any) => p.approved || p.status === 'approved' || p.status === 'published').length
              : 0;
            return (
              <div key={b.id || b.slug} className="p-4 rounded-2xl bg-[#070b14]/90 border border-amber-500/25 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{b.name}</h4>
                    <span className="text-[10px] text-amber-300/80 font-mono">{b.businessType || b.slug}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-[10px] font-bold shrink-0">
                    {planCount} منشورات
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-white/50 block text-[9px]">المعتمد / المنشور</span>
                    <span className="text-emerald-300 font-black">{approvedCount} / {planCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-white/50 block text-[9px]">ربط السوشيال</span>
                    <span className="text-cyan-300 font-black">{b.metaConnected ? 'متصل ✅' : 'يحتاج ربط'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleGenerateWeekPlan(b)}
                    disabled={busyBrandId === b.id}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{busyBrandId === b.id ? 'جاري التوليد...' : 'توليد خطة الأسبوع'}</span>
                  </button>
                  {onOpenBrandInJarvis && (
                    <button
                      onClick={() => onOpenBrandInJarvis(b.slug || b.id)}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
                    >
                      إدارة
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AdminLiveAgentPanel: React.FC<AdminLivePanelsProps> = ({ onOpenBrandInJarvis }) => {
  const [fleet, setFleet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadFleet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brand-hub/agent/fleet');
      const data = await res.json();
      if (data?.ok) setFleet(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  const handleToggleBot = async (brandId: string) => {
    setTogglingId(brandId);
    setStatusMsg(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const { getAuth } = await import('firebase/auth');
        const user = getAuth().currentUser;
        if (user) {
          const token = await user.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {}
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(brandId)}/toggle-bot`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      setStatusMsg(data?.ok ? `تم تحديث حالة تشغيل الأجنت للبراند (${brandId}) ✅` : (data?.error || 'تعذر تغيير الحالة'));
      await loadFleet();
    } catch (e: any) {
      setStatusMsg(e?.message || 'خطأ في الاتصال بـ T2 Agent');
    } finally {
      setTogglingId(null);
    }
  };

  const brands = Array.isArray(fleet?.brands) ? fleet.brands : [];
  const totalConvs = brands.reduce((acc: number, b: any) => acc + Number(b.conversationsCount || b.handledConversations || 0), 0);
  const activeBots = brands.filter((b: any) => b.status !== 'paused' && !b.isPaused).length;

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-emerald-400" />
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              أسطول T2 AI Agent الفعلي
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${fleet?.source === 't2_ai_agent_live' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-amber-500/20 border-amber-400 text-amber-200'}`}>
                {fleet?.source === 't2_ai_agent_live' ? 'متصل حياً بـ T2 Agent ✅' : 'بيانات متزامنة'}
              </span>
            </h3>
            <p className="text-xs text-white/60">البيانات والحالات الفعلية من khedr-bot-agent.onrender.com بدون محاكاة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadFleet}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث حي</span>
          </button>
          <a
            href={fleet?.agentPortalUrl || 'https://khedr-bot-agent.onrender.com/dashboard'}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-1.5"
          >
            <span>لوحة T2 Agent المركزية ↗</span>
          </a>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
          {statusMsg}
        </div>
      )}

      {/* LIVE METRICS FROM ACTUAL FLEET */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-3.5 text-center">
          <span className="text-[10px] text-emerald-400/80 font-bold block mb-1">الأنشطة في الأسطول</span>
          <span className="text-2xl font-black text-emerald-300">{brands.length}</span>
        </div>
        <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-3.5 text-center">
          <span className="text-[10px] text-cyan-400/80 font-bold block mb-1">الوكلاء النشطين الآن</span>
          <span className="text-2xl font-black text-cyan-300">{activeBots}</span>
        </div>
        <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-3.5 text-center">
          <span className="text-[10px] text-amber-400/80 font-bold block mb-1">إجمالي المحادثات</span>
          <span className="text-2xl font-black text-amber-300">{totalConvs}</span>
        </div>
        <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-3.5 text-center">
          <span className="text-[10px] text-purple-400/80 font-bold block mb-1">مصدر البيانات</span>
          <span className="text-xs font-black text-purple-300 mt-1 inline-block">
            {fleet?.source === 't2_ai_agent_live' ? 'T2 Agent Live API' : 'Unified Vault'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-white/60 text-sm">جاري جلب بيانات الأسطول الحقيقية من T2 AI Agent...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b: any) => {
            const isPaused = b.status === 'paused' || Boolean(b.isPaused);
            const convCount = Number(b.conversationsCount || b.handledConversations || 0);
            return (
              <div key={b.id || b.slug} className="p-4 rounded-2xl bg-[#070b14]/90 border border-emerald-500/25 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{b.name}</h4>
                    <span className="text-[10px] text-white/50 font-mono block truncate">ID: {b.id || b.slug}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${isPaused ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                    {isPaused ? 'متوقف' : 'شغال'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/45 border border-white/10 flex items-center justify-between">
                    <span className="text-white/60">المحادثات</span>
                    <span className="font-black text-emerald-300">{convCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/45 border border-white/10 flex items-center justify-between">
                    <span className="text-white/60">واتساب</span>
                    {b.whatsappConnected ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleToggleBot(b.id || b.slug)}
                    disabled={togglingId === (b.id || b.slug)}
                    className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer border ${
                      isPaused
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{togglingId === (b.id || b.slug) ? '...' : isPaused ? 'تشغيل الأجنت' : 'تعليق مؤقت'}</span>
                  </button>
                  {onOpenBrandInJarvis && (
                    <button
                      onClick={() => onOpenBrandInJarvis(b.slug || b.id)}
                      className="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>الشات والتدريب</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
