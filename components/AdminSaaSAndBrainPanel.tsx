import React, { useCallback, useEffect, useState } from 'react';
import { Brain, CheckCircle2, CreditCard, DollarSign, RefreshCw, Save, Sparkles, Wrench } from 'lucide-react';

interface SaasPlanItem {
  id: string;
  nameAr: string;
  priceEgp: number;
  adsBudgetEgp: number;
  systemFeeEgp: number;
  monthlyDesignsQuota: number;
  monthlyVideosQuota: number;
  appAccessMode: 'landing_page' | 'full_app';
  durationDays?: number;
}

async function getAdminHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { getAuth } = await import('firebase/auth');
    const user = getAuth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
}

export const AdminSaaSAndBrainPanel: React.FC = () => {
  const [plans, setPlans] = useState<Record<string, SaasPlanItem>>({});
  const [customDirective, setCustomDirective] = useState('');
  const [directiveUpdatedAt, setDirectiveUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPlans, setSavingPlans] = useState(false);
  const [savingBrain, setSavingBrain] = useState(false);
  const [repairingAutoHouse, setRepairingAutoHouse] = useState(false);
  const [aiCostSummary, setAiCostSummary] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const [plansRes, brainRes, aiCostRes] = await Promise.all([
        fetch('/api/saas/plans', { headers }),
        fetch('/api/jarvis/brain-config', { headers }),
        fetch('/api/admin/ai-costs/summary?days=30', { headers }),
      ]);
      const plansData = await plansRes.json().catch(() => null);
      if (plansData?.ok && plansData?.plans) {
        setPlans(plansData.plans);
      }
      const brainData = await brainRes.json().catch(() => null);
      if (brainData?.ok && brainData?.config) {
        setCustomDirective(brainData.config.customDirective || '');
        setDirectiveUpdatedAt(brainData.config.updatedAt || '');
      }
      const aiCostJson = await aiCostRes.json().catch(() => null);
      if (aiCostJson?.ok) {
        setAiCostSummary(aiCostJson);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'تعذر تحميل البيانات الحية' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updatePlanField = (planId: string, field: keyof SaasPlanItem, value: any) => {
    setPlans((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value,
      },
    }));
  };

  const handleSavePlans = async () => {
    setSavingPlans(true);
    setStatusMsg(null);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/saas/plans', {
        method: 'POST',
        headers,
        body: JSON.stringify({ plans }),
      });
      const data = await res.json();
      if (data?.ok) {
        if (data.plans) setPlans(data.plans);
        setStatusMsg({ type: 'ok', text: data.message || 'تم حفظ الباقات والأسعار في Firestore بنجاح ✅' });
      } else {
        setStatusMsg({ type: 'err', text: data?.error || 'فشل حفظ الباقات (تأكد من تسجيل الدخول بحساب الأدمن)' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'خطأ في الاتصال بالسيرفر' });
    } finally {
      setSavingPlans(false);
    }
  };

  const handleSaveBrain = async () => {
    setSavingBrain(true);
    setStatusMsg(null);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/jarvis/brain-config', {
        method: 'POST',
        headers,
        body: JSON.stringify({ customDirective }),
      });
      const data = await res.json();
      if (data?.ok) {
        setDirectiveUpdatedAt(data?.config?.updatedAt || new Date().toISOString());
        setStatusMsg({ type: 'ok', text: data.message || 'تم تحديث توجيهات عقل جارفس بنجاح ✅' });
      } else {
        setStatusMsg({ type: 'err', text: data?.error || 'فشل حفظ التوجيهات' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'خطأ في الاتصال بالسيرفر' });
    } finally {
      setSavingBrain(false);
    }
  };

  const handleRepairAutoHouse = async () => {
    setRepairingAutoHouse(true);
    setStatusMsg(null);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/brands/repair-auto-house', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (data?.ok) {
        setStatusMsg({ type: 'ok', text: data.message || 'تم تصحيح سجل auto-house في Firestore بنجاح ✅' });
      } else {
        setStatusMsg({ type: 'err', text: data?.error || 'تعذر تصحيح سجل auto-house' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'خطأ أثناء تصحيح auto-house' });
    } finally {
      setRepairingAutoHouse(false);
    }
  };

  const planList = Object.values(plans);

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-24" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-l from-cyan-500/10 via-amber-500/10 to-purple-500/10 border border-cyan-500/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-base font-black text-white">محرر الباقات الحي وعقل جارفس الديناميكي</h3>
            <p className="text-xs text-white/60">أي تعديل هنا يتحفظ فوراً في Firestore ويقرأه جارفس، الكوتة، وبوابات التطبيقات بدون إعادة نشر</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRepairAutoHouse}
            disabled={repairingAutoHouse}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 disabled:opacity-50"
          >
            <Wrench className="w-3.5 h-3.5" />
            {repairingAutoHouse ? 'جاري التصحيح...' : 'تصحيح auto-house (Firestore)'}
          </button>
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-bold hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Dynamic Brain Directive */}
      <div className="bg-[#111] border border-purple-500/30 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-purple-400" />
            <div>
              <h4 className="text-sm font-black text-white">توجيهات عقل جارفس الديناميكية (customDirective)</h4>
              <p className="text-[11px] text-white/50">
                تُحقن مباشرة في البرومت الحي لجارفس بدون كود ثابت
                {directiveUpdatedAt ? ` • آخر تحديث: ${new Date(directiveUpdatedAt).toLocaleString('ar-EG')}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveBrain}
            disabled={savingBrain}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingBrain ? 'جاري الحفظ...' : 'حفظ توجيهات العقل'}
          </button>
        </div>

        <textarea
          value={customDirective}
          onChange={(e) => setCustomDirective(e.target.value)}
          rows={5}
          placeholder="اكتب هنا أي سياسات بيعية، قواعد تسعير، لهجة، أو أولويات تشغيلية تريد من جارفس الالتزام بها لحظياً..."
          className="w-full bg-black/70 border border-white/15 rounded-2xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-400 leading-relaxed"
        />
      </div>

      {/* SaaS Plans Grid */}
      <div className="bg-[#111] border border-cyan-500/25 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-sm font-black text-white">الباقات والأسعار والكوتة الشهرية ({planList.length})</h4>
              <p className="text-[11px] text-white/50">تحكم في السعر الإجمالي، ميزانية الإعلانات، حصة النظام، عدد التصاميم/الفيديوهات، ونوع الوصول</p>
            </div>
          </div>
          <button
            onClick={handleSavePlans}
            disabled={savingPlans || planList.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingPlans ? 'جاري حفظ الباقات...' : 'حفظ كل الباقات'}
          </button>
        </div>

        {loading && planList.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/50">جاري تحميل الباقات الحية...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {planList.map((plan) => (
              <div key={plan.id} className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg">{plan.id}</span>
                  <select
                    value={plan.appAccessMode}
                    onChange={(e) => updatePlanField(plan.id, 'appAccessMode', e.target.value as 'landing_page' | 'full_app')}
                    className="bg-[#18181b] border border-white/15 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-300 focus:outline-none"
                  >
                    <option value="landing_page">landing_page (لاندنج بيدج فقط)</option>
                    <option value="full_app">full_app (تطبيق ويب كامل)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-white/50 mb-1">اسم الباقة</label>
                  <input
                    type="text"
                    value={plan.nameAr || ''}
                    onChange={(e) => updatePlanField(plan.id, 'nameAr', e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">السعر (ج.م)</label>
                    <input
                      type="number"
                      value={plan.priceEgp ?? 0}
                      onChange={(e) => updatePlanField(plan.id, 'priceEgp', Number(e.target.value) || 0)}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">الإعلانات</label>
                    <input
                      type="number"
                      value={plan.adsBudgetEgp ?? 0}
                      onChange={(e) => updatePlanField(plan.id, 'adsBudgetEgp', Number(e.target.value) || 0)}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">حصة النظام</label>
                    <input
                      type="number"
                      value={plan.systemFeeEgp ?? 0}
                      onChange={(e) => updatePlanField(plan.id, 'systemFeeEgp', Number(e.target.value) || 0)}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">تصاميم / شهر (-1 = لا محدود)</label>
                    <input
                      type="number"
                      value={plan.monthlyDesignsQuota ?? 0}
                      onChange={(e) => updatePlanField(plan.id, 'monthlyDesignsQuota', Number(e.target.value) || 0)}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1">فيديوهات / شهر (-1 = لا محدود)</label>
                    <input
                      type="number"
                      value={plan.monthlyVideosQuota ?? 0}
                      onChange={(e) => updatePlanField(plan.id, 'monthlyVideosQuota', Number(e.target.value) || 0)}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-Time AI Cost & Brand Profit Margin Ledger */}
      <div className="bg-[#111] border border-emerald-500/30 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-black text-white">سجل تكاليف الذكاء الاصطناعي وصافي ربحية البراندات (30 يوم)</h4>
              <p className="text-[11px] text-white/50">
                متابعة استهلاك Gemini & Veo من التلات خدمات (Core + Studio + Agent) مقابل صافي الدخل بعد خصم 50% ميزانية الإعلانات
              </p>
            </div>
          </div>
          {aiCostSummary?.totals && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
              <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200">
                المكالمات: {aiCostSummary.totals.totalCalls ?? 0}
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                تكلفة AI: {aiCostSummary.totals.totalCostEgp ?? 0} ج.م (\${aiCostSummary.totals.totalCostUsd ?? 0})
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                صافي الدخل (50%): {aiCostSummary.totals.totalNetSystemRevenueEgp ?? 0} ج.م
              </span>
            </div>
          )}
        </div>

        {Array.isArray(aiCostSummary?.perBrand) && aiCostSummary.perBrand.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[11px]">
                  <th className="py-2 px-3">البراند</th>
                  <th className="py-2 px-3">العمليات (AI)</th>
                  <th className="py-2 px-3">تكلفة AI (USD / ج.م)</th>
                  <th className="py-2 px-3">الاشتراك / صافي 50%</th>
                  <th className="py-2 px-3">الربح الصافي بعد AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {aiCostSummary.perBrand.slice(0, 25).map((row: any) => (
                  <tr key={row.brandId} className="hover:bg-white/[0.03]">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {row.brandName}
                      <span className="block text-[10px] text-white/40 font-mono">{row.brandId}</span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">
                      {(row.textAndAgentCalls || 0) + (row.imagesGenerated || 0) + (row.videosGenerated || 0)}
                      <span className="block text-[10px] text-white/45 font-normal">
                        نص {row.textAndAgentCalls || 0} • صور {row.imagesGenerated || 0} • ريلز {row.videosGenerated || 0}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-amber-300 font-bold">
                      {row.totalAiCostEgp} ج.م <span className="text-[10px] text-white/40">(\${row.totalAiCostUsd})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {row.subscriptionEgp} ج.م ← <span className="text-emerald-300">{row.netSystemRevenueEgp} ج.م</span>
                    </td>
                    <td className="py-2.5 px-3 font-black">
                      <span className={row.netMarginEgp >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.netMarginEgp} ج.م ({row.netMarginPct}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-white/45">
            لا توجد عمليات AI مسجلة بعد في هذه النافذة الزمنية — ستظهر التكاليف والهوامش لحظياً فور تشغيل التوليد أو الردود.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSaaSAndBrainPanel;
