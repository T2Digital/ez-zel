import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Database, PauseCircle, RefreshCw, Save, Search, Sparkles } from 'lucide-react';

type LifecycleStage = 'active_client' | 'trial' | 'paused_archive' | 'self_growth';

interface RegistryBrand {
  id: string;
  canonicalId: string;
  slug: string;
  name: string;
  businessType: string;
  phone: string;
  lifecycleStage: LifecycleStage;
  appTemplate: 'products_erp' | 'services_booking';
  titoStudioClinicId: string;
  agentBrandId: string;
  catalogCount: number;
  status: string;
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

const STAGE_META: Record<LifecycleStage, { label: string; badgeClass: string }> = {
  active_client: { label: '🟢 شغّال', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  trial: { label: '🟡 تجربة 7 أيام', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  self_growth: { label: '🔵 تسويق للظل', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  paused_archive: { label: '⚫ متوقف / أرشيف', badgeClass: 'bg-white/10 text-white/60 border-white/15' },
};

export const AdminBrandRegistryPanel: React.FC = () => {
  const [brands, setBrands] = useState<RegistryBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<'all' | LifecycleStage>('all');
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/brands/registry', { headers });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.brands)) {
        setBrands(data.brands);
      } else {
        setStatusMsg({ type: 'err', text: data?.error || 'تعذر تحميل سجل البراندات' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'خطأ في الاتصال' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const updateLocalBrand = (id: string, patch: Partial<RegistryBrand>) => {
    setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const saveBrandEntry = async (brand: RegistryBrand, overrideStage?: LifecycleStage) => {
    setBusyId(brand.id);
    setStatusMsg(null);
    const stageToSave = overrideStage || brand.lifecycleStage;
    try {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/brands/registry', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          canonicalId: brand.canonicalId || brand.id,
          slug: brand.slug,
          name: brand.name,
          lifecycleStage: stageToSave,
          appTemplate: brand.appTemplate,
          titoStudioClinicId: brand.titoStudioClinicId,
          agentBrandId: brand.agentBrandId,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        updateLocalBrand(brand.id, { lifecycleStage: stageToSave });
        setStatusMsg({ type: 'ok', text: data.message || `تم حفظ (${brand.name}) ✅` });
      } else {
        setStatusMsg({ type: 'err', text: data?.error || 'فشل الحفظ' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'خطأ أثناء الحفظ' });
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkPauseAll = async () => {
    setBusyId('__bulk__');
    setStatusMsg(null);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/brands/registry/bulk-pause', { method: 'POST', headers });
      const data = await res.json();
      if (data?.ok) {
        setBrands((prev) => prev.map((b) => ({ ...b, lifecycleStage: 'paused_archive', status: 'متوقف' })));
        setStatusMsg({ type: 'ok', text: data.message || 'تم إيقاف الكل وتنظيف الشبكة العصبية ✅' });
      } else {
        setStatusMsg({ type: 'err', text: data?.error || 'فشل الإيقاف الجماعي' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'خطأ في الاتصال' });
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    all: brands.length,
    active_client: brands.filter((b) => b.lifecycleStage === 'active_client').length,
    trial: brands.filter((b) => b.lifecycleStage === 'trial').length,
    self_growth: brands.filter((b) => b.lifecycleStage === 'self_growth').length,
    paused_archive: brands.filter((b) => b.lifecycleStage === 'paused_archive').length,
  };

  const filtered = brands.filter((b) => {
    if (filterStage !== 'all' && b.lifecycleStage !== filterStage) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${b.name} ${b.id} ${b.slug} ${b.businessType}`.toLowerCase().includes(q);
  });

  return (
    <div className="w-full space-y-5 animate-fadeIn pb-24" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-l from-emerald-500/10 via-cyan-500/10 to-slate-900 border border-cyan-500/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-base font-black text-white">توحيد وتصنيف البراندات (Single Source of Truth • Firestore)</h3>
            <p className="text-xs text-white/60">
              الوضع الافتراضي: الكل متوقف/أرشيف لتنظيف الشبكة العصبية — شغّل البراندات الحقيقية فقط ووحد ربطها بالاستوديو والأيجنت والمصنع
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkPauseAll}
            disabled={busyId === '__bulk__'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-black hover:bg-rose-500/30 disabled:opacity-50"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>{busyId === '__bulk__' ? 'جاري الإيقاف...' : 'إيقاف الكل (أرشيف)'}</span>
          </button>
          <button
            onClick={loadRegistry}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-bold hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', `الكل (${counts.all})`],
              ['active_client', `🟢 شغّال (${counts.active_client})`],
              ['trial', `🟡 تجربة (${counts.trial})`],
              ['self_growth', `🔵 تسويق للظل (${counts.self_growth})`],
              ['paused_archive', `⚫ متوقف (${counts.paused_archive})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStage(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                filterStage === key
                  ? 'bg-cyan-500 text-black border-cyan-400'
                  : 'bg-[#111] text-white/70 border-white/10 hover:border-white/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-white/40 absolute right-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الـ ID..."
            className="w-full bg-[#111] border border-white/15 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Brands Table / Cards */}
      {loading && brands.length === 0 ? (
        <div className="text-center py-12 text-xs text-white/50">جاري تحميل السجل الموحد...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const meta = STAGE_META[b.lifecycleStage] || STAGE_META.paused_archive;
            const isBusy = busyId === b.id;
            return (
              <div key={b.id} className="bg-[#111] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">{b.name}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                        {b.canonicalId}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      {b.businessType || 'نشاط تجاري'} • منتجات/خدمات: {b.catalogCount} • واتساب: {b.phone || '—'}
                    </p>
                  </div>

                  {/* Quick 1-click Lifecycle Toggles */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['active_client', 'trial', 'self_growth', 'paused_archive'] as LifecycleStage[]).map((st) => (
                      <button
                        key={st}
                        disabled={isBusy}
                        onClick={() => saveBrandEntry(b, st)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition ${
                          b.lifecycleStage === st
                            ? STAGE_META[st].badgeClass
                            : 'bg-black/40 text-white/50 border-white/10 hover:text-white'
                        }`}
                      >
                        {st === 'active_client'
                          ? '🟢 تشغيل'
                          : st === 'trial'
                          ? '🟡 تجربة'
                          : st === 'self_growth'
                          ? '🔵 للظل'
                          : '⚫ إيقاف'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unified IDs & Template Mapping */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 border-t border-white/5 items-end">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">نوع القالب (المصنع)</label>
                    <select
                      value={b.appTemplate}
                      onChange={(e) => updateLocalBrand(b.id, { appTemplate: e.target.value as any })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="products_erp">products_erp (متجر + مخزون)</option>
                      <option value="services_booking">services_booking (خدمات + حجوزات)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">ID تيتو استوديو (clinicId)</label>
                    <input
                      type="text"
                      value={b.titoStudioClinicId}
                      onChange={(e) => updateLocalBrand(b.id, { titoStudioClinicId: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-purple-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">ID تيتو أجنت (agentBrandId)</label>
                    <input
                      type="text"
                      value={b.agentBrandId}
                      onChange={(e) => updateLocalBrand(b.id, { agentBrandId: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-emerald-300"
                    />
                  </div>
                  <button
                    onClick={() => saveBrandEntry(b)}
                    disabled={isBusy}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isBusy ? 'جاري الحفظ...' : 'حفظ الربط الموحد'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminBrandRegistryPanel;
