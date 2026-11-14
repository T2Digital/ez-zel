import React, { useEffect, useState } from "react";
import { UserProfile } from "../services/dbService";
import {
  Bot,
  Briefcase,
  DollarSign,
  Activity,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Mic,
  Shield,
  Sparkles,
  Calendar,
  Send,
  Power,
  Settings,
  ArrowUpRight,
} from "lucide-react";

interface CommandCenterProps {
  user: UserProfile;
  onOpenChat: () => void;
  onOpenAdmin: () => void;
  onOpenWorkspace: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
}

type TabKey = "jarvis" | "brands" | "finance" | "radar";

export const CommandCenter: React.FC<CommandCenterProps> = ({
  user,
  onOpenChat,
  onOpenAdmin,
  onOpenWorkspace,
  onUpgrade,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("jarvis");
  const [loading, setLoading] = useState(false);

  // Live Ecosystem Health & Briefing
  const [health, setHealth] = useState<any>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);

  // Brands & T2 Agent Live State
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("clean_master");
  const [brandStatus, setBrandStatus] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [quickPhone, setQuickPhone] = useState("");
  const [quickMsg, setQuickMsg] = useState("");
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Ecosystem Config Form
  const [studioUrlInput, setStudioUrlInput] = useState("");
  const [studioKeyInput, setStudioKeyInput] = useState("");
  const [agentUrlInput, setAgentUrlInput] = useState("");
  const [agentKeyInput, setAgentKeyInput] = useState("");

  const notify = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4000);
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [hRes, bRes, fRes, brRes] = await Promise.allSettled([
        fetch("/api/system/ecosystem-health").then((r) => r.json()),
        fetch("/api/system/daily-executive-briefing?audio=false").then((r) => r.json()),
        fetch("/api/system/real-financials").then((r) => r.json()),
        fetch("/api/t2-agent/brands").then((r) => r.json()),
      ]);
      if (hRes.status === "fulfilled") {
        setHealth(hRes.value);
        if (hRes.value?.titoStudio?.url) setStudioUrlInput(hRes.value.titoStudio.url);
        if (hRes.value?.t2Agent?.url) setAgentUrlInput(hRes.value.t2Agent.url);
      }
      if (bRes.status === "fulfilled") setBriefing(bRes.value);
      if (fRes.status === "fulfilled") setFinancials(fRes.value);
      if (brRes.status === "fulfilled" && Array.isArray(brRes.value?.brands)) {
        setBrands(brRes.value.brands);
        if (brRes.value.brands.length > 0 && !brRes.value.brands.some((b: any) => b.id === selectedBrandId)) {
          setSelectedBrandId(brRes.value.brands[0].id);
        }
      }
    } catch {}
    setLoading(false);
  };

  const fetchBrandLiveDetails = async (brandId: string) => {
    if (!brandId) return;
    try {
      const [stRes, bkRes, cvRes] = await Promise.allSettled([
        fetch(`/api/t2-agent/brands/${encodeURIComponent(brandId)}/status`).then((r) => r.json()),
        fetch(`/api/t2-agent/brands/${encodeURIComponent(brandId)}/bookings`).then((r) => r.json()),
        fetch(`/api/t2-agent/brands/${encodeURIComponent(brandId)}/conversations`).then((r) => r.json()),
      ]);
      if (stRes.status === "fulfilled") setBrandStatus(stRes.value);
      if (bkRes.status === "fulfilled") setBookings(Array.isArray(bkRes.value?.bookings) ? bkRes.value.bookings : []);
      if (cvRes.status === "fulfilled") setConversations(Array.isArray(cvRes.value?.conversations) ? cvRes.value.conversations : []);
    } catch {}
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "brands" && selectedBrandId) {
      fetchBrandLiveDetails(selectedBrandId);
    }
  }, [activeTab, selectedBrandId]);

  const handleToggleBot = async () => {
    try {
      const nextStatus = brandStatus?.isAiActive ? "paused" : "active";
      const res = await fetch(`/api/t2-agent/brands/${encodeURIComponent(selectedBrandId)}/toggle-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      }).then((r) => r.json());
      notify(res?.message || "تم تحديث حالة البوت");
      fetchBrandLiveDetails(selectedBrandId);
    } catch (e: any) {
      notify(e?.message || "تعذر تغيير حالة البوت");
    }
  };

  const handleSendQuickWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim() || !quickMsg.trim()) return;
    try {
      const res = await fetch(`/api/t2-agent/brands/${encodeURIComponent(selectedBrandId)}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: quickPhone.trim(), message: quickMsg.trim() }),
      }).then((r) => r.json());
      notify(res?.message || "تم الإرسال");
      setQuickMsg("");
    } catch (e: any) {
      notify(e?.message || "فشل الإرسال");
    }
  };

  const handleSaveEcosystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/system/ecosystem-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titoStudioUrl: studioUrlInput,
          titoStudioApiKey: studioKeyInput || undefined,
          t2AgentUrl: agentUrlInput,
          t2AgentAdminKey: agentKeyInput || undefined,
        }),
      }).then((r) => r.json());
      if (res?.ok) {
        notify("تم حفظ إعدادات الربط وفحص المنظومة بنجاح!");
        setStudioKeyInput("");
        setAgentKeyInput("");
        fetchOverview();
      } else {
        notify(res?.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (e: any) {
      notify(e?.message || "فشل الاتصال بالسيرفر");
    }
  };

  const isAdmin = user.tier === "sovereign" || user.phone === "TITO";
  const studioOk = Boolean(health?.titoStudio?.reachable);
  const agentOk = Boolean(health?.t2Agent?.reachable);

  const navItems: { id: TabKey; label: string; icon: any }[] = [
    { id: "jarvis", label: "غرفة جارفيس", icon: Bot },
    { id: "brands", label: "البراندات والعمليات", icon: Briefcase },
    { id: "finance", label: "الماليات والحجوزات", icon: DollarSign },
    { id: "radar", label: "الرادار والإعدادات", icon: Activity },
  ];

  return (
    <div dir="rtl" className="min-h-screen w-full bg-[#030712]/90 backdrop-blur-xl text-white font-['Cairo'] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950/80 border-b md:border-b-0 md:border-l border-white/10 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between md:justify-start gap-3 pb-4 mb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide text-white">الظل — Command OS</h1>
              <p className="text-[11px] text-cyan-400 font-semibold">{user.name || "ماستر تيتو"}</p>
            </div>
          </div>

          <nav className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "text-slate-300 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-white/10">
          <button
            onClick={onOpenChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-black text-white shadow-lg cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>فتح الشات والصوت الكامل</span>
          </button>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={onOpenAdmin}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 border border-white/10 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>الأدمن</span>
              </button>
              <button
                onClick={onOpenWorkspace}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 border border-white/10 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" />
                <span>الملفات</span>
              </button>
            </div>
          )}
          {user.phone === "GUEST" && (
            <button
              onClick={onUpgrade}
              className="w-full py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold cursor-pointer"
            >
              ترقية الباقة
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
        {/* Top Live Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-white/10 rounded-2xl p-3.5">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              الظل Core: متصل
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold ${
                agentOk
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
              }`}
            >
              {agentOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              T2 Agent: {agentOk ? "متصل" : "غير متصل"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold ${
                studioOk
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
              }`}
            >
              {studioOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              Tito Studio: {studioOk ? "متصل" : "غير متصل"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>تحديث</span>
            </button>
            <button
              onClick={onOpenChat}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 text-xs font-bold text-white cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>جارفيس</span>
            </button>
          </div>
        </div>

        {actionToast && (
          <div className="bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 px-4 py-2.5 rounded-xl text-xs font-bold">
            {actionToast}
          </div>
        )}

        {/* TAB 1: JARVIS */}
        {activeTab === "jarvis" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-1">البراندات النشطة</p>
                <p className="text-2xl font-black text-cyan-300">
                  {briefing?.metrics?.liveBrandsCount ?? brands.length ?? 0}
                </p>
              </div>
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-1">الحجوزات المؤكدة</p>
                <p className="text-2xl font-black text-emerald-300">
                  {briefing?.metrics?.liveBookingsCount ?? financials?.confirmedBookingsCount ?? 0}
                </p>
              </div>
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-1">إجمالي الإيرادات المسجلة</p>
                <p className="text-2xl font-black text-amber-300">
                  {briefing?.metrics?.liveRevenueEgp ?? financials?.realConfirmedRevenueEgp ?? 0} ج.م
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-cyan-500/25 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-cyan-300 flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  التقرير التنفيذي الاستباقي الحي
                </h2>
                <button
                  onClick={onOpenChat}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-bold text-cyan-200 cursor-pointer"
                >
                  <span>بدء محادثة صوتية أو نصية مع جارفيس</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-xs md:text-sm text-slate-200 leading-relaxed font-['Cairo'] bg-black/30 p-4 rounded-xl border border-white/5">
                {briefing?.text || "جاري تحميل التقرير الحي من منظومة T2..."}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: BRANDS & OPERATIONS */}
        {activeTab === "brands" && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-300">اختر البراند:</label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                >
                  {brands.length === 0 ? (
                    <option value="clean_master">كلين ماستر (clean_master)</option>
                  ) : (
                    brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    brandStatus?.isAiActive !== false
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-red-500/15 text-red-300 border-red-500/30"
                  }`}
                >
                  الذكاء الاصطناعي: {brandStatus?.isAiActive !== false ? "شغال" : "متوقف"}
                </span>
                <button
                  onClick={handleToggleBot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{brandStatus?.isAiActive !== false ? "إيقاف مؤقت" : "تشغيل"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Live Bookings */}
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-emerald-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  أحدث الحجوزات الحية ({bookings.length})
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {bookings.length === 0 ? (
                    <p className="text-xs text-slate-400">لا توجد حجوزات مسجلة حالياً لهذا البراند.</p>
                  ) : (
                    bookings.slice(0, 15).map((bk: any, i: number) => (
                      <div key={bk.id || i} className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-white">{bk.customerName || "عميل"}</span>
                          <span className="text-emerald-300">{bk.finalPrice || bk.price || ""}</span>
                        </div>
                        <p className="text-slate-300">{bk.service || bk.serviceName}</p>
                        <p className="text-[11px] text-slate-400">
                          {bk.date} {bk.time} • {bk.phone || bk.customerPhone}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Live Conversations & Quick Send */}
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-cyan-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  المحادثات وإرسال واتساب سريع ({conversations.length})
                </h3>
                <form onSubmit={handleSendQuickWhatsApp} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="رقم العميل (مثال: 2010...)"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white sm:w-40"
                  />
                  <input
                    type="text"
                    placeholder="اكتب رسالة واتساب مباشرة..."
                    value={quickMsg}
                    onChange={(e) => setQuickMsg(e.target.value)}
                    className="bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white flex-1"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال</span>
                  </button>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-slate-400">لا توجد محادثات مفتوحة حالياً.</p>
                  ) : (
                    conversations.slice(0, 12).map((cv: any, i: number) => (
                      <div key={cv.phone || i} className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs">
                        <div className="flex justify-between font-bold text-slate-200">
                          <span>{cv.customerName || cv.name || cv.phone}</span>
                          <span className="text-[11px] text-slate-400">{cv.phone}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{cv.lastMessage}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINANCE */}
        {activeTab === "finance" && (
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              الملخص المالي الحقيقي للمنظومة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-slate-400">إجمالي الحجوزات المؤكدة</p>
                <p className="text-xl font-black text-white mt-1">
                  {financials?.confirmedBookingsCount ?? 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-slate-400">الإيرادات المؤكدة (ج.م)</p>
                <p className="text-xl font-black text-emerald-300 mt-1">
                  {financials?.realConfirmedRevenueEgp ?? 0} ج.م
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-slate-400">الرسائل المعالجة</p>
                <p className="text-xl font-black text-cyan-300 mt-1">
                  {financials?.totalHandledMessages ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RADAR & ECOSYSTEM SETTINGS */}
        {activeTab === "radar" && (
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-black text-cyan-300 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              إعدادات الربط السحابي الحي (Ez-Zel ⇄ T2 Agent ⇄ Tito Studio)
            </h2>
            <form onSubmit={handleSaveEcosystemConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">رابط T2 Agent</label>
                <input
                  type="url"
                  value={agentUrlInput}
                  onChange={(e) => setAgentUrlInput(e.target.value)}
                  placeholder="https://khedr-bot-agent.onrender.com"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">مفتاح T2 Agent Admin Key (اختياري للتحديث)</label>
                <input
                  type="password"
                  value={agentKeyInput}
                  onChange={(e) => setAgentKeyInput(e.target.value)}
                  placeholder="اتركه فارغاً للإبقاء على المفتاح الحالي"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">رابط Tito Studio</label>
                <input
                  type="url"
                  value={studioUrlInput}
                  onChange={(e) => setStudioUrlInput(e.target.value)}
                  placeholder="https://t2-studio.vercel.app"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">مفتاح Tito Studio API Key (اختياري للتحديث)</label>
                <input
                  type="password"
                  value={studioKeyInput}
                  onChange={(e) => setStudioKeyInput(e.target.value)}
                  placeholder="اتركه فارغاً للإبقاء على المفتاح الحالي"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer"
                >
                  حفظ وفحص الاتصال الحي
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default CommandCenter;
