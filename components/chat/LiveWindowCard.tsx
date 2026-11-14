import React, { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Power,
  RefreshCw,
  Send,
  Sparkles,
  DollarSign,
  Minimize2,
  Maximize2,
} from "lucide-react";

type WindowType = "ecosystem_status" | "brand_operations" | "studio_closed_loop";

export const LiveWindowCard: React.FC<{ card: any }> = ({ card }) => {
  const initialType: WindowType =
    card?.data?.window_type || card?.data?.windowType || "brand_operations";
  const [windowType, setWindowType] = useState<WindowType>(initialType);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [health, setHealth] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);

  const [brands, setBrands] = useState<any[]>([]);
  const [studioBrands, setStudioBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    card?.data?.brand_id || card?.data?.brandId || ""
  );
  const [brandStatus, setBrandStatus] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [quickPhone, setQuickPhone] = useState("");
  const [quickMsg, setQuickMsg] = useState("");

  const [studioStrategy, setStudioStrategy] = useState<any>(null);
  const [studioContent, setStudioContent] = useState<any[]>([]);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadLiveData = async () => {
    setLoading(true);
    try {
      const [hRes, fRes, brRes, stBrRes] = await Promise.allSettled([
        fetch("/api/system/ecosystem-health").then((r) => r.json()),
        fetch("/api/system/real-financials").then((r) => r.json()),
        fetch("/api/t2-agent/brands").then((r) => r.json()),
        fetch("/api/studio/live/brands").then((r) => r.json()),
      ]);
      if (hRes.status === "fulfilled") setHealth(hRes.value);
      if (fRes.status === "fulfilled") setFinancials(fRes.value);
      if (brRes.status === "fulfilled" && Array.isArray(brRes.value?.brands)) {
        setBrands(brRes.value.brands);
      }
      if (stBrRes.status === "fulfilled" && Array.isArray(stBrRes.value?.brands)) {
        setStudioBrands(stBrRes.value.brands);
      }
      const fallbackList =
        (stBrRes.status === "fulfilled" && Array.isArray(stBrRes.value?.brands) && stBrRes.value.brands) ||
        (brRes.status === "fulfilled" && Array.isArray(brRes.value?.brands) && brRes.value.brands) ||
        [];
      if (!selectedBrandId && fallbackList.length > 0) {
        setSelectedBrandId(fallbackList[0].id);
      }
    } catch {}
    setLoading(false);
  };

  const loadBrandDetails = async (brandId: string) => {
    if (!brandId) return;
    setStudioError(null);
    const [stRes, bkRes, cvRes, ctRes] = await Promise.allSettled([
      fetch(`/api/t2-agent/brands/${encodeURIComponent(brandId)}/status`).then((r) => r.json()),
      fetch(`/api/t2-agent/brands/${encodeURIComponent(brandId)}/bookings`).then((r) => r.json()),
      fetch(`/api/t2-agent/brands/${encodeURIComponent(brandId)}/conversations`).then((r) => r.json()),
      fetch(`/api/studio/live/content?clinicId=${encodeURIComponent(brandId)}`).then((r) => r.json()),
    ]);
    if (stRes.status === "fulfilled") setBrandStatus(stRes.value);
    if (bkRes.status === "fulfilled") setBookings(Array.isArray(bkRes.value?.bookings) ? bkRes.value.bookings : []);
    if (cvRes.status === "fulfilled") setConversations(Array.isArray(cvRes.value?.conversations) ? cvRes.value.conversations : []);
    if (ctRes.status === "fulfilled") {
      if (ctRes.value?.success === false) {
        setStudioError(ctRes.value?.error || "Tito Studio غير متصل حالياً");
        setStudioContent([]);
      } else if (Array.isArray(ctRes.value?.content)) {
        setStudioContent(ctRes.value.content);
      }
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  useEffect(() => {
    if (selectedBrandId) {
      loadBrandDetails(selectedBrandId);
    }
  }, [selectedBrandId]);

  const handleToggleBot = async () => {
    if (!selectedBrandId) return;
    setBusy(true);
    try {
      const nextStatus = brandStatus?.isAiActive ? "paused" : "active";
      const res = await fetch(`/api/t2-agent/brands/${encodeURIComponent(selectedBrandId)}/toggle-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      }).then((r) => r.json());
      notify(res?.message || "تم تحديث حالة البوت");
      loadBrandDetails(selectedBrandId);
    } catch (e: any) {
      notify(e?.message || "تعذر تغيير حالة البوت");
    } finally {
      setBusy(false);
    }
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim() || !quickMsg.trim() || !selectedBrandId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/t2-agent/brands/${encodeURIComponent(selectedBrandId)}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: quickPhone.trim(), message: quickMsg.trim() }),
      }).then((r) => r.json());
      notify(res?.message || "تم إرسال الرسالة");
      setQuickMsg("");
    } catch (e: any) {
      notify(e?.message || "فشل الإرسال");
    } finally {
      setBusy(false);
    }
  };

  const handleStudioStrategy = async () => {
    if (!selectedBrandId) return;
    setBusy(true);
    try {
      const currentBrand = brands.find((b) => b.id === selectedBrandId);
      const res = await fetch("/api/studio/live/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: selectedBrandId,
          brandName: currentBrand?.name || selectedBrandId,
          industry: currentBrand?.industry || currentBrand?.specialty || "Services",
        }),
      }).then((r) => r.json());
      if (res?.success && res?.strategy) {
        setStudioStrategy(res.strategy);
        notify("تم توليد الاستراتيجية وحفظها في T2 Studio");
      } else {
        notify(res?.error || "تعذر الاتصال بـ T2 Studio");
      }
    } catch (e: any) {
      notify(e?.message || "تعذر الاتصال بـ T2 Studio");
    } finally {
      setBusy(false);
    }
  };

  const handleStudioPlan = async () => {
    if (!selectedBrandId) return;
    setBusy(true);
    try {
      const currentBrand = brands.find((b) => b.id === selectedBrandId);
      const res = await fetch("/api/studio/live/content-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: selectedBrandId,
          brandName: currentBrand?.name || selectedBrandId,
          days: 7,
          saveToCalendar: true,
        }),
      }).then((r) => r.json());
      if (res?.success && Array.isArray(res?.posts)) {
        setStudioContent((prev) => [...res.posts, ...prev]);
        notify(`تم إنشاء ${res.posts.length} منشور بانتظار موافقتك`);
      } else {
        notify(res?.error || "تعذر إنشاء الخطة");
      }
    } catch (e: any) {
      notify(e?.message || "تعذر إنشاء الخطة");
    } finally {
      setBusy(false);
    }
  };

  const handleApprovePost = async (item: any, publishNow: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/studio/live/approve-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: item.id,
          clinicId: selectedBrandId,
          caption: item.caption,
          platform: item.scheduledPlatforms?.[0] || "facebook",
          publishNow,
        }),
      }).then((r) => r.json());
      if (res?.success) {
        setStudioContent((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, status: publishNow ? "published" : "approved" } : c))
        );
        notify(publishNow ? "تم الاعتماد والنشر الفوري!" : "تم الاعتماد في الجدول!");
      } else {
        notify(res?.error || "فشل الاعتماد");
      }
    } catch (e: any) {
      notify(e?.message || "فشل الاعتماد");
    } finally {
      setBusy(false);
    }
  };

  const title =
    card?.data?.title ||
    (windowType === "ecosystem_status"
      ? "الرادار الحي للسيرفرات والمالية الحقيقية"
      : windowType === "studio_closed_loop"
      ? "نافذة T2 Studio — الدائرة المغلقة والموافقة"
      : "نافذة عمليات البراندات الحية — T2 Agent");

  return (
    <div dir="rtl" className="mt-3 w-full max-w-4xl rounded-2xl bg-slate-950/95 border border-cyan-500/35 shadow-[0_0_30px_rgba(6,182,212,0.12)] overflow-hidden text-white font-['Cairo']">
      {/* Window Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs sm:text-sm font-black text-white">{title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWindowType("brand_operations")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
              windowType === "brand_operations" ? "bg-cyan-600 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            البراندات والحجوزات
          </button>
          <button
            onClick={() => setWindowType("studio_closed_loop")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
              windowType === "studio_closed_loop" ? "bg-purple-600 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            T2 Studio والمحتوى
          </button>
          <button
            onClick={() => setWindowType("ecosystem_status")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
              windowType === "ecosystem_status" ? "bg-emerald-600 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            السيرفرات والمالية
          </button>
          <button
            onClick={() => {
              loadLiveData();
              if (selectedBrandId) loadBrandDetails(selectedBrandId);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
            title="تحديث البيانات الحية"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
          >
            {collapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {toast && (
        <div className="px-4 py-2 bg-cyan-500/20 border-b border-cyan-500/30 text-xs font-bold text-cyan-200">
          {toast}
        </div>
      )}

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Ecosystem Status */}
          {windowType === "ecosystem_status" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">الظل Core</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm font-black text-emerald-300 mt-1">متصل ويعمل</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">T2 Agent</span>
                    {health?.t2Agent?.reachable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-sm font-black mt-1">
                    {health?.t2Agent?.reachable ? "متصل" : "غير متصل"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{health?.t2Agent?.url}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">T2 Studio</span>
                    {health?.titoStudio?.reachable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-sm font-black mt-1">
                    {health?.titoStudio?.reachable ? "متصل" : "غير متصل"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{health?.titoStudio?.url}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> الحجوزات المؤكدة</p>
                  <p className="text-lg font-black text-white mt-1">{financials?.confirmedBookingsCount ?? 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-slate-400 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> الإيراد المؤكد</p>
                  <p className="text-lg font-black text-emerald-300 mt-1">{financials?.realConfirmedRevenueEgp ?? 0} ج.م</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-slate-400 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> الرسائل المعالجة</p>
                  <p className="text-lg font-black text-cyan-300 mt-1">{financials?.totalHandledMessages ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Brand Operations & Studio Closed Loop Selector */}
          {windowType !== "ecosystem_status" && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-black/35 border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-300">البراند:</span>
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-bold"
                >
                  {(windowType === "studio_closed_loop" && studioBrands.length > 0 ? studioBrands : brands).length === 0 ? (
                    <option value="">جاري تحميل البراندات من السيرفر...</option>
                  ) : (
                    (windowType === "studio_closed_loop" && studioBrands.length > 0 ? studioBrands : brands).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id})
                      </option>
                    ))
                  )}
                </select>
              </div>
              {windowType === "brand_operations" && selectedBrandId && (
                <button
                  disabled={busy}
                  onClick={handleToggleBot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 font-bold cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{brandStatus?.isAiActive !== false ? "إيقاف الذكاء الاصطناعي مؤقتاً" : "تشغيل الذكاء الاصطناعي"}</span>
                </button>
              )}
            </div>
          )}

          {/* Brand Operations Content */}
          {windowType === "brand_operations" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/35 border border-white/10 space-y-2">
                <h4 className="font-black text-emerald-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> الحجوزات الحية ({bookings.length})
                </h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {bookings.length === 0 ? (
                    <p className="text-slate-400">لا توجد حجوزات حية مسجلة حالياً.</p>
                  ) : (
                    bookings.slice(0, 10).map((bk: any, i: number) => (
                      <div key={bk.id || i} className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
                        <div className="flex justify-between font-bold">
                          <span>{bk.customerName || "عميل"}</span>
                          <span className="text-emerald-300">{bk.finalPrice || bk.price || ""}</span>
                        </div>
                        <p className="text-slate-300">{bk.service || bk.serviceName}</p>
                        <p className="text-[10px] text-slate-400">{bk.date} {bk.time} • {bk.phone || bk.customerPhone}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/35 border border-white/10 space-y-2">
                <h4 className="font-black text-cyan-300 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> المحادثات وإرسال واتساب ({conversations.length})
                </h4>
                <form onSubmit={handleSendWhatsApp} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="2010..."
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="w-28 bg-slate-900 border border-white/15 rounded-lg px-2 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="رسالة واتساب..."
                    value={quickMsg}
                    onChange={(e) => setQuickMsg(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/15 rounded-lg px-2 py-1.5 text-white"
                  />
                  <button type="submit" disabled={busy} className="px-2.5 py-1.5 rounded-lg bg-cyan-600 font-bold cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <p className="text-slate-400">لا توجد محادثات مفتوحة حالياً.</p>
                  ) : (
                    conversations.slice(0, 10).map((cv: any, i: number) => (
                      <div key={cv.phone || i} className="p-2 rounded-lg bg-slate-900/80 border border-white/5">
                        <div className="flex justify-between font-bold">
                          <span>{cv.customerName || cv.name || cv.phone}</span>
                          <span className="text-[10px] text-slate-400">{cv.phone}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{cv.lastMessage}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Studio Closed Loop */}
          {windowType === "studio_closed_loop" && (
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy || !selectedBrandId}
                  onClick={handleStudioStrategy}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-bold cursor-pointer"
                >
                  1. دراسة السوق والاستراتيجية
                </button>
                <button
                  disabled={busy || !selectedBrandId}
                  onClick={handleStudioPlan}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-bold cursor-pointer"
                >
                  2. توليد خطة محتوى 7 أيام
                </button>
              </div>

              {studioError && (
                <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200">
                  {studioError}
                </div>
              )}

              {studioStrategy && (
                <div className="p-3 rounded-xl bg-black/40 border border-purple-500/25 space-y-1">
                  <p className="font-black text-purple-200">التموضع: {studioStrategy.positioning}</p>
                  <p className="text-slate-300">{studioStrategy.marketAnalysis}</p>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {studioContent.length === 0 ? (
                  <p className="text-slate-400">لا يوجد محتوى محمل حالياً لهذا البراند.</p>
                ) : (
                  studioContent.slice(0, 10).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="p-2.5 rounded-xl bg-black/35 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white">{item.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10">{item.status || "draft"}</span>
                        </div>
                        <p className="text-slate-300 line-clamp-2">{item.caption}</p>
                      </div>
                      {item.status !== "published" && (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            disabled={busy}
                            onClick={() => handleApprovePost(item, false)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 font-bold cursor-pointer"
                          >
                            اعتماد
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleApprovePost(item, true)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-bold cursor-pointer"
                          >
                            اعتماد ونشر
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
