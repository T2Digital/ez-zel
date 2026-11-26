import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, DollarSign, Activity, Layers, RefreshCw, CheckCircle2,
  AlertTriangle, CreditCard, Sparkles, Clock, ShieldCheck, Filter
} from 'lucide-react';
import { UserProfile } from '../services/dbService';
import { getAdminAuthHeaders } from '../services/adminIdentity';

export type AdminMemberFilter = 'all' | 'active' | 'trial' | 'pending';

interface AdminGovernanceRibbonProps {
  realProfiles: UserProfile[];
  pendingRequestsCount: number;
  activeMembersCount: number;
  marketersList: UserProfile[];
  activeFilter?: AdminMemberFilter;
  onFilterMembers?: (filter: AdminMemberFilter) => void;
  onSelectView: (view: any) => void;
  onOpenJarvis?: () => void;
}

export const AdminGovernanceRibbon: React.FC<AdminGovernanceRibbonProps> = ({
  realProfiles,
  pendingRequestsCount,
  activeMembersCount,
  marketersList,
  activeFilter = 'all',
  onFilterMembers,
  onSelectView,
  onOpenJarvis,
}) => {
  const [liveBrandsCount, setLiveBrandsCount] = useState<number | null>(null);
  const [totalRegistryCount, setTotalRegistryCount] = useState<number>(20);
  const [activeRegistryBrands, setActiveRegistryBrands] = useState<any[]>([]);
  const [trialRegistryCount, setTrialRegistryCount] = useState<number>(0);
  const [agentLiveOk, setAgentLiveOk] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const [adminManagedCount, setAdminManagedCount] = useState<number>(0);
  const [publicPaidCount, setPublicPaidCount] = useState<number>(0);
  const [publicPaidRevenue, setPublicPaidRevenue] = useState<number>(0);
  const [publicTrialCount, setPublicTrialCount] = useState<number>(0);

  const fetchGovernanceTelemetry = useCallback(async () => {
    setChecking(true);
    try {
      const headers = await getAdminAuthHeaders();
      const [fleetRes, regRes, finRes, revRes] = await Promise.all([
        fetch('/api/brand-hub/agent/fleet', { credentials: 'include', headers }).then(r => r.json()).catch(() => null),
        fetch('/api/admin/brands/registry', { credentials: 'include', headers }).then(r => r.json()).catch(() => null),
        fetch('/api/system/real-financials', { credentials: 'include', headers }).then(r => r.json()).catch(() => null),
        fetch('/api/admin/revenue/summary', { credentials: 'include', headers }).then(r => r.json()).catch(() => null),
      ]);
      if (fleetRes?.ok) {
        setAgentLiveOk(String(fleetRes.source || '').startsWith('t2_ai_agent_live'));
      }
      if (regRes?.ok && Array.isArray(regRes.brands)) {
        const regList = regRes.brands;
        const publicList = regList.filter((b: any) => b?.accountOrigin !== 'admin_managed');
        const legacyManaged = regList.filter((b: any) => b?.accountOrigin === 'admin_managed');
        const publicActiveList = publicList.filter((b: any) => b.lifecycleStage === 'active_client');
        const publicTrialList = publicList.filter((b: any) => b.lifecycleStage === 'trial');
        setTotalRegistryCount(regList.length);
        setActiveRegistryBrands(publicActiveList);
        setTrialRegistryCount(publicTrialList.length);
        setAdminManagedCount(Number(finRes?.adminManagedBrandsCount ?? legacyManaged.length));
        setPublicTrialCount(Number(finRes?.publicTrialAccountsCount ?? publicTrialList.length));
        setLiveBrandsCount(regList.filter((b: any) => b.lifecycleStage === 'active_client').length || regList.length);
      } else if (fleetRes?.ok) {
        setLiveBrandsCount(typeof fleetRes.brandsCount === 'number' ? fleetRes.brandsCount : Array.isArray(fleetRes.brands) ? fleetRes.brands.length : 0);
      }
      const paidCnt = Number(revRes?.paidCount ?? finRes?.publicPaidSubscribersCount ?? 0);
      const paidRev = Number(revRes?.totalPaymobRevenueEgp ?? finRes?.publicConfirmedRevenueEgp ?? 0);
      setPublicPaidCount(paidCnt);
      setPublicPaidRevenue(paidRev);
    } catch {
      setAgentLiveOk(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    fetchGovernanceTelemetry();
  }, [fetchGovernanceTelemetry]);

  const effectiveActiveClientsCount = Math.max(publicPaidCount, activeRegistryBrands.length);
  const effectiveTrialCount = Math.max(publicTrialCount, trialRegistryCount);
  const effectiveTotalSubscribers = effectiveActiveClientsCount + effectiveTrialCount + pendingRequestsCount;

  const estimatedMrr = publicPaidRevenue > 0
    ? publicPaidRevenue
    : activeRegistryBrands.reduce((sum, b) => sum + (Number(b.planAmount || 5000) || 5000), 0);

  const estimatedAdsPool = Math.round(estimatedMrr * 0.5);
  const estimatedNetSystem = estimatedMrr - estimatedAdsPool;

  const pendingAffiliatePayouts = marketersList.reduce((sum, u) => {
    const pending = u.affiliate?.payoutHistory?.filter((h) => h.status === 'pending') || [];
    return sum + pending.reduce((s, h) => s + (h.amount || 0), 0);
  }, 0);

  const triggerFilter = (f: AdminMemberFilter) => {
    if (onFilterMembers) onFilterMembers(f);
    onSelectView(f === 'pending' ? 'requests' : 'members');
  };

  return (
    <div className="space-y-4 relative z-10">
      {/* SOVEREIGN SAAS EXECUTIVE KPI DECK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. SUBSCRIBERS & TRIAL CONVERSION */}
        <button
          onClick={() => onSelectView('brand_registry')}
          className="text-right p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#071327]/95 via-[#050a18]/95 to-black/95 hover:border-cyan-400/70 transition-all group cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.12)] relative overflow-hidden"
        >
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-cyan-300 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              قاعدة المشتركين والبراندات
            </span>
            {pendingRequestsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[10px] font-black animate-pulse">
                {pendingRequestsCount} بانتظار التفعيل
              </span>
            ) : (
              <ShieldCheck className="w-4 h-4 text-cyan-400/60" />
            )}
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{effectiveTotalSubscribers}</div>
          <div className="text-[11px] text-white/70 mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="text-emerald-300 font-bold">{effectiveActiveClientsCount} مشترك عام مدفوع</span>
            <span className="text-white/30">•</span>
            <span className="text-amber-300 font-bold">{effectiveTrialCount} تجربة جمهور</span>
            {adminManagedCount > 0 && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-cyan-300/80">{adminManagedCount} إدارة حاليين</span>
              </>
            )}
          </div>
        </button>

        {/* 2. MRR + 50% ADS / 50% SYSTEM SPLIT */}
        <button
          onClick={() => onSelectView('analytics')}
          className="text-right p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#071f17]/95 via-[#040d0c]/95 to-black/95 hover:border-emerald-400/70 transition-all group cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.12)] relative overflow-hidden"
        >
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              الإيراد الشهري (50/50)
            </span>
            <CreditCard className="w-4 h-4 text-emerald-400/70" />
          </div>
          <div className="text-3xl font-black text-emerald-300 tracking-tight">
            {estimatedMrr.toLocaleString('en-US')} <span className="text-xs font-bold">ج.م</span>
          </div>
          <div className="text-[11px] text-white/70 mt-1.5 flex items-center gap-2 flex-wrap">
            <span>سيستم: <b className="text-white">{estimatedNetSystem.toLocaleString('en-US')}</b></span>
            <span className="text-white/30">|</span>
            <span>إعلانات: <b className="text-amber-300">{estimatedAdsPool.toLocaleString('en-US')}</b></span>
            {pendingAffiliatePayouts > 0 && (
              <span className="text-rose-300 font-bold">• عمولات: {pendingAffiliatePayouts}ج</span>
            )}
          </div>
        </button>

        {/* 3. ECOSYSTEM 4-ENGINE TELEMETRY */}
        <div
          onClick={fetchGovernanceTelemetry}
          className="text-right p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#170b2b]/95 via-[#090514]/95 to-black/95 hover:border-purple-400/70 transition-all cursor-pointer shadow-[0_0_25px_rgba(168,85,247,0.12)] relative overflow-hidden"
          title="اضغط لإعادة الفحص الحي"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-purple-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              الركائز الأربع المتصلة
            </span>
            <RefreshCw className={`w-3.5 h-3.5 text-purple-300/80 ${checking ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex items-center gap-2 text-base font-black text-white mt-1">
            {agentLiveOk ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300">المنظومة متزامنة 100%</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-amber-200">{agentLiveOk === null ? 'جاري الفحص...' : 'وضع الكاش الاحتياطي'}</span>
              </>
            )}
          </div>
          <div className="text-[10.5px] text-white/60 mt-2 font-mono">
            ez-zel • T2 Agent • Studio • Firestore
          </div>
        </div>

        {/* 4. REAL CONNECTED BRANDS -> JARVIS */}
        <button
          onClick={() => (onOpenJarvis ? onOpenJarvis() : onSelectView('brand_registry'))}
          className="text-right p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#231705]/95 via-[#0f0a03]/95 to-black/95 hover:border-amber-400/70 transition-all group cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.12)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              البراندات وغرفة القيادة
            </span>
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-white">
            {liveBrandsCount !== null ? liveBrandsCount : '—'}{' '}
            <span className="text-xs font-bold text-amber-300/80">براند شغّال (من {totalRegistryCount})</span>
          </div>
          <div className="text-[11px] text-amber-200/80 mt-1.5 font-bold">
            دخول مباشر لغرفة قيادة جارفيس ↗
          </div>
        </button>
      </div>

      {/* REAL SUBSCRIBER & TRIAL FILTER BAR (MOVED FROM JARVIS PREVIEW TO ADMIN HQ) */}
      <div className="p-2.5 rounded-2xl bg-[#070b16]/95 border border-white/10 flex items-center justify-between gap-2 flex-wrap shadow-lg">
        <div className="flex items-center gap-2 text-xs font-black text-white/75 px-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>فلترة حسابات وبراندات المنظومة الفعلية:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onSelectView('brand_registry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-black shadow'
                : 'bg-white/5 text-white/65 hover:text-white hover:bg-white/10'
            }`}
          >
            الكل ({totalRegistryCount})
          </button>
          <button
            onClick={() => onSelectView('brand_registry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'active'
                ? 'bg-emerald-500 text-black shadow shadow-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>العملاء النشطين ({effectiveActiveClientsCount})</span>
          </button>
          <button
            onClick={() => triggerFilter('trial')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'trial'
                ? 'bg-purple-500 text-white shadow shadow-purple-500/30'
                : 'bg-purple-500/10 text-purple-300 border border-purple-500/25 hover:bg-purple-500/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>المجربين والمستخدمين ({effectiveTrialCount})</span>
          </button>
          <button
            onClick={() => triggerFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'pending'
                ? 'bg-amber-500 text-black shadow shadow-amber-500/30'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>طلبات التفعيل ({pendingRequestsCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
