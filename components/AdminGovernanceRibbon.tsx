import React, { useEffect, useState, useCallback } from 'react';
import { Users, DollarSign, Activity, Layers, RefreshCw, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react';
import { UserProfile } from '../services/dbService';

interface AdminGovernanceRibbonProps {
  realProfiles: UserProfile[];
  pendingRequestsCount: number;
  activeMembersCount: number;
  marketersList: UserProfile[];
  onSelectView: (view: any) => void;
  onOpenJarvis?: () => void;
}

export const AdminGovernanceRibbon: React.FC<AdminGovernanceRibbonProps> = ({
  realProfiles,
  pendingRequestsCount,
  activeMembersCount,
  marketersList,
  onSelectView,
  onOpenJarvis,
}) => {
  const [liveBrandsCount, setLiveBrandsCount] = useState<number | null>(null);
  const [agentLiveOk, setAgentLiveOk] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchGovernanceTelemetry = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/brand-hub/agent/fleet');
      const data = await res.json();
      if (data?.ok) {
        setLiveBrandsCount(Array.isArray(data.brands) ? data.brands.length : 0);
        setAgentLiveOk(data.source === 't2_ai_agent_live');
      }
    } catch {
      setAgentLiveOk(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    fetchGovernanceTelemetry();
  }, [fetchGovernanceTelemetry]);

  const trialOrFreeCount = realProfiles.filter(
    (p) => p.status !== 'active' && p.status !== 'pending'
  ).length;

  const estimatedMrr = realProfiles
    .filter((p) => p.status === 'active')
    .reduce((sum, u) => {
      if (u.subscriptionCycle === 'yearly') return sum + Math.round(10000 / 12);
      return sum + 1000;
    }, 0);

  const pendingAffiliatePayouts = marketersList.reduce((sum, u) => {
    const pending = u.affiliate?.payoutHistory?.filter((h) => h.status === 'pending') || [];
    return sum + pending.reduce((s, h) => s + (h.amount || 0), 0);
  }, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
      {/* 1. LIVE SUBSCRIBERS & TRIALS */}
      <button
        onClick={() => onSelectView(pendingRequestsCount > 0 ? 'requests' : 'members')}
        className="text-right p-4 rounded-2xl border border-cyan-500/25 bg-[#080c18]/90 hover:border-cyan-400/60 transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            المشتركين والحسابات
          </span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[10px] font-black animate-pulse">
              {pendingRequestsCount} طلب تفعيل
            </span>
          )}
        </div>
        <div className="text-2xl font-black text-white">{realProfiles.length}</div>
        <div className="text-[11px] text-white/60 mt-1 flex items-center gap-2">
          <span className="text-emerald-300 font-bold">{activeMembersCount} نشط</span>
          <span>•</span>
          <span className="text-amber-300 font-bold">{trialOrFreeCount} تجربة/مجاني</span>
        </div>
      </button>

      {/* 2. REAL MRR & AFFILIATE PAYOUTS */}
      <button
        onClick={() => onSelectView('analytics')}
        className="text-right p-4 rounded-2xl border border-emerald-500/25 bg-[#080c18]/90 hover:border-emerald-400/60 transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            الاشتراكات الشهرية (MRR)
          </span>
          <CreditCard className="w-4 h-4 text-emerald-400/60" />
        </div>
        <div className="text-2xl font-black text-emerald-300">
          {estimatedMrr.toLocaleString('en-US')} <span className="text-xs font-bold">ج.م</span>
        </div>
        <div className="text-[11px] text-white/60 mt-1">
          عمولات معلقة للمسوقين:{' '}
          <span className="text-amber-300 font-bold">{pendingAffiliatePayouts.toLocaleString('en-US')} ج.م</span>
        </div>
      </button>

      {/* 3. ECOSYSTEM LIVE HEALTH */}
      <div
        onClick={fetchGovernanceTelemetry}
        className="text-right p-4 rounded-2xl border border-purple-500/25 bg-[#080c18]/90 hover:border-purple-400/60 transition-all cursor-pointer"
        title="اضغط لإعادة الفحص"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            صحة الأركان الأربعة
          </span>
          <RefreshCw className={`w-3.5 h-3.5 text-purple-300/70 ${checking ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex items-center gap-2 text-sm font-black text-white">
          {agentLiveOk ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">الربط الحي مكتمل</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-200">{agentLiveOk === null ? 'جاري الفحص...' : 'وضع الكاش الاحتياطي'}</span>
            </>
          )}
        </div>
        <div className="text-[11px] text-white/60 mt-1">
          ez-zel • T2 Agent • Studio • Firestore
        </div>
      </div>

      {/* 4. REAL CONNECTED BRANDS */}
      <button
        onClick={() => (onOpenJarvis ? onOpenJarvis() : onSelectView('agent_platform'))}
        className="text-right p-4 rounded-2xl border border-amber-500/25 bg-[#080c18]/90 hover:border-amber-400/60 transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            البراندات والوكلاء الفعليين
          </span>
          <span className="text-[10px] text-amber-300/80 font-bold">فتح جارفيس ↗</span>
        </div>
        <div className="text-2xl font-black text-white">
          {liveBrandsCount !== null ? liveBrandsCount : '—'} <span className="text-xs font-bold text-white/60">براند</span>
        </div>
        <div className="text-[11px] text-white/60 mt-1">
          بيانات فعلية بدون وكلاء افتراضيين
        </div>
      </button>
    </div>
  );
};
