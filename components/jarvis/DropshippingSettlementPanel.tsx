import React, { useEffect, useState } from 'react';
import {
  Truck, CheckCircle2, RotateCcw, ExternalLink, Copy, Check,
  DollarSign, Package, RefreshCw, Send, AlertTriangle
} from 'lucide-react';
import { getAdminAuthHeaders } from '../../services/adminIdentity';

export const DropshippingSettlementPanel: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [dispatchModalText, setDispatchModalText] = useState<{ text: string; waUrl: string; tracking?: string | null } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fetchSettlement = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dropshipping/settlement', {
        credentials: 'include',
        headers: await getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (data?.ok) {
        setSummary(data.summary);
        setFunnels(Array.isArray(data.funnels) ? data.funnels : []);
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      }
    } catch (err) {
      console.error('Failed loading dropshipping settlement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
  }, []);

  const handleConfirmAndDispatch = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      const res = await fetch(`/api/dropshipping/orders/${encodeURIComponent(orderId)}/confirm-and-dispatch`, {
        method: 'POST',
        credentials: 'include',
        headers: await getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      });
      const data = await res.json();
      if (data?.ok) {
        setDispatchModalText({
          text: data.supplierDispatchText,
          waUrl: data.supplierWhatsappUrl,
          tracking: data.trackingNumber,
        });
        if (data.summary) setSummary(data.summary);
        await fetchSettlement();
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: 'delivered' | 'returned' | 'confirmed') => {
    setBusyOrderId(orderId);
    try {
      const res = await fetch(`/api/dropshipping/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: await getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data?.ok) {
        if (data.summary) setSummary(data.summary);
        await fetchSettlement();
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  const copyFunnelUrl = (slug: string) => {
    const url = `${window.location.origin}/drop/${slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case 'pending_whatsapp_confirm':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">بانتظار تأكيد واتساب</span>;
      case 'dispatched_to_supplier':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">تم التوجيه للمورد/بوسطة</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">تم التسليم والتحصيل ✅</span>;
      case 'returned':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">مرتجع ↩️</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/70">{st}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Settlement Cards */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-black text-emerald-300 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          تسوية الكاش والأرباح الحقيقية (COD Settlement Ledger)
        </h3>
        <button
          type="button"
          onClick={fetchSettlement}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-cyan-300 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-[#070d20] border border-white/10">
            <div className="text-[10px] text-white/55">إجمالي الطلبات</div>
            <div className="text-base font-black text-white">{summary.totalOrders}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070d20] border border-emerald-500/30">
            <div className="text-[10px] text-emerald-200/70">تم التسليم</div>
            <div className="text-base font-black text-emerald-300">{summary.delivered}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070d20] border border-rose-500/30">
            <div className="text-[10px] text-rose-200/70">نسبة المرتجعات</div>
            <div className="text-base font-black text-rose-300">{summary.returnRatePct}%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070d20] border border-amber-500/30">
            <div className="text-[10px] text-amber-200/70">مستحق الموردين</div>
            <div className="text-sm font-black text-amber-300">{summary.supplierPayableEgp?.toLocaleString()} ج.م</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070d20] border border-purple-500/30">
            <div className="text-[10px] text-purple-200/70">مصروف الإعلانات + الشحن</div>
            <div className="text-sm font-black text-purple-300">
              {((summary.adSpendEgp || 0) + (summary.shippingCostEgp || 0)).toLocaleString()} ج.م
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/50">
            <div className="text-[10px] text-emerald-100">صافي الربح الفعلي</div>
            <div className={`text-base font-black ${summary.netRealizedProfitEgp >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {summary.netRealizedProfitEgp?.toLocaleString()} ج.م
            </div>
          </div>
        </div>
      )}

      {/* Active One-Page COD Funnels */}
      <div className="p-3.5 rounded-2xl bg-[#070d20] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            صفحات الهبوط السريعة النشطة (One-Page COD Funnels)
          </h4>
          <span className="text-[10px] text-white/50">
            {summary?.bostaConfigured ? '🚚 Bosta API: متصل لايف' : '💬 وضع التوريد المباشر: WhatsApp + طلبات حية'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {funnels.map((f) => (
            <div key={f.slug} className="p-3 rounded-xl bg-black/50 border border-white/10 flex flex-col justify-between gap-2">
              <div>
                <div className="text-xs font-black text-white">{f.productName}</div>
                <div className="text-[10px] text-white/55">{f.brandName} • المورد: {f.supplierName}</div>
                <div className="text-[11px] font-mono text-emerald-300 mt-1">/drop/{f.slug}</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`/drop/${encodeURIComponent(f.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح صفحة البيع</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyFunnelUrl(f.slug)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedSlug === f.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSlug === f.slug ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zero-Price Supplier Dispatch Output Modal Banner */}
      {dispatchModalText && (
        <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-400/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-sky-300">
            <span>✅ رسالة توجيه المورد جاهزة (بدون سعر البيع أو صافي ربحك)</span>
            <button onClick={() => setDispatchModalText(null)} className="text-white/60 hover:text-white text-[11px] cursor-pointer">إغلاق</button>
          </div>
          {dispatchModalText.tracking && (
            <div className="text-xs font-bold text-emerald-300">🚚 رقم بوليصة بوسطة: {dispatchModalText.tracking}</div>
          )}
          <pre className="whitespace-pre-wrap text-[11px] text-white/90 bg-black/60 p-2.5 rounded-xl border border-white/10 font-sans">
            {dispatchModalText.text}
          </pre>
          <a
            href={dispatchModalText.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-black"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال أمر التوريد لواتساب المورد الآن</span>
          </a>
        </div>
      )}

      {/* Orders Ledger */}
      <div className="p-3.5 rounded-2xl bg-[#070d20] border border-white/10 space-y-2.5">
        <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
          <Truck className="w-4 h-4" />
          سجل الطلبات المباشر ({orders.length})
        </h4>

        {orders.length === 0 ? (
          <div className="p-6 text-center text-xs text-white/50">
            لا توجد طلبات COD مسجلة حتى الآن — افتح أي صفحة هبوط أعلاه واطلب تجربة لرؤية الدورة الكاملة فوراً.
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((ord) => (
              <div key={ord.id} className="p-3 rounded-xl bg-black/50 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-cyan-300">{ord.refCode}</span>
                    {statusBadge(ord.status)}
                    <span className="text-[11px] text-white/60">{ord.governorate}</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {ord.customerName} ({ord.customerPhone}) — {ord.productName} × {ord.qty}
                  </div>
                  <div className="text-[11px] text-white/60">
                    التحصيل COD: <b className="text-amber-300">{ord.totalCodEgp} ج.م</b> | جملة المورد: <b>{ord.supplierCostTotalEgp} ج.م</b> | صافي متوقع: <b className="text-emerald-300">{ord.netProfitEgp} ج.م</b>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyOrderId === ord.id}
                    onClick={() => handleConfirmAndDispatch(ord.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>تأكيد + توجيه للمورد (بدون سعر البيع)</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyOrderId === ord.id}
                    onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>تم التسليم</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyOrderId === ord.id}
                    onClick={() => handleUpdateStatus(ord.id, 'returned')}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>مرتجع</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
