import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, ChevronDown, ChevronUp, ExternalLink, RefreshCw,
  CheckCircle2, Clock, AlertCircle, Globe, MessageCircle,
  Share2, Layers, Cpu, Zap
} from 'lucide-react';

interface SwarmAgentReport {
  id: string;
  name: string;
  roleTitle: string;
  status: 'done' | 'active' | 'pending' | 'needs_action';
  summary: string;
  metric?: string;
  actionLabel?: string;
  actionUrl?: string;
}

interface SwarmSnapshot {
  ok: boolean;
  role: string;
  brandId?: string;
  brandName?: string;
  latencyMs?: number;
  agents: SwarmAgentReport[];
  executiveSummary: {
    hasBrand: boolean;
    logoUrl?: string;
    slogan?: string;
    appUrl?: string;
    appTemplate?: string;
    whatsappConnected: boolean;
    connectedSocials: string[];
    totalSocialSlots: number;
    studioPostsCount: number;
    trialDaysLeft: number | null;
    subscriptionStatus: string;
    totalBrandsCount?: number;
    totalSubscribersCount?: number;
    activeTrialsCount?: number;
  };
}

interface JarvisExecutiveSummaryDrawerProps {
  userProfile?: any;
  onQuickPrompt?: (prompt: string) => void;
  externalRefreshKey?: number;
}

const ALL_SOCIALS = [
  { id: 'facebook', label: 'FB' },
  { id: 'instagram', label: 'IG' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YT' },
  { id: 'telegram', label: 'TG' },
  { id: 'x', label: 'X' },
  { id: 'linkedin', label: 'IN' },
  { id: 'snapchat', label: 'Snap' }
];

export const JarvisExecutiveSummaryDrawer: React.FC<JarvisExecutiveSummaryDrawerProps> = ({
  userProfile,
  onQuickPrompt,
  externalRefreshKey = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<SwarmSnapshot | null>(() => {
    return (typeof window !== 'undefined' && (window as any).__LAST_SWARM_SNAPSHOT) || null;
  });

  const emailLower = (userProfile?.email || '').toLowerCase();
  const isMaster =
    userProfile?.role === 'master' ||
    emailLower === 'ahm.atya@gmail.com' ||
    emailLower === 'ahmed.atya.daif@gmail.com';
  const inferredRole = isMaster ? 'MASTER_ADMIN' : userProfile?.linkedBrandId ? 'BRAND_OWNER' : 'VISITOR';

  const runSwarmRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/swarm/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: inferredRole,
          brandId: userProfile?.linkedBrandId,
          phone: userProfile?.phone
        })
      });
      const data = await res.json();
      if (data?.ok) {
        setSnapshot(data);
        (window as any).__LAST_SWARM_SNAPSHOT = data;
      }
    } catch {}
    setIsLoading(false);
  }, [inferredRole, userProfile?.linkedBrandId, userProfile?.phone]);

  useEffect(() => {
    runSwarmRefresh();
  }, [runSwarmRefresh, externalRefreshKey]);

  const summary = snapshot?.executiveSummary;
  const connectedCount = summary?.connectedSocials?.length || 0;

  return (
    <div className="w-full px-3 md:px-6 pt-2 z-20 shrink-0 font-['Cairo']" dir="rtl">
      <div className="rounded-2xl bg-[#071024]/90 border border-cyan-500/30 shadow-[0_8px_30px_rgba(6,182,212,0.12)] backdrop-blur-md overflow-hidden">
        {/* Compact Executive Bar */}
        <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {summary?.logoUrl ? (
              <img
                src={summary.logoUrl}
                alt={snapshot?.brandName || 'Brand'}
                className="w-7 h-7 rounded-lg object-cover border border-cyan-400/50 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-black shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                <span>
                  {isMaster
                    ? 'غرفة قيادة السرب (ماستر تيتو)'
                    : snapshot?.brandName || 'سرب جارفيس الذكي للخدمات'}
                </span>
                {snapshot?.latencyMs !== undefined && (
                  <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    5 Agents • {snapshot.latencyMs}ms
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isMaster && summary?.totalBrandsCount !== undefined ? (
              <>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  🏢 {summary.totalBrandsCount} براند
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  👥 {summary.totalSubscribersCount || 0} مشترك
                </span>
              </>
            ) : (
              <>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    summary?.appUrl
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-white/60 border-white/10'
                  }`}
                >
                  {summary?.appUrl ? '🟢 التطبيق' : '⚪ التطبيق'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    connectedCount > 0
                      ? 'bg-purple-500/15 text-purple-200 border-purple-500/30'
                      : 'bg-white/5 text-white/60 border-white/10'
                  }`}
                >
                  📱 {connectedCount}/{summary?.totalSocialSlots || 8} منصات
                </span>
                {summary?.trialDaysLeft !== null && summary?.trialDaysLeft !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    ⏳ {summary.trialDaysLeft} يوم
                  </span>
                )}
              </>
            )}

            <button
              type="button"
              onClick={runSwarmRefresh}
              disabled={isLoading}
              title="تشغيل وتحديث السرب الآن"
              className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-white border border-cyan-400/40 text-[11px] font-black flex items-center gap-1 transition"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-300" />
              <span>ملخص الخدمات</span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Executive Drawer (No internal scroll trap!) */}
        {isOpen && (
          <div className="px-3 pb-3 pt-2 border-t border-white/10 space-y-2.5 animate-in fade-in">
            {/* 5 Specialist Swarm Agents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {(snapshot?.agents || []).map((agent) => {
                const statusBadge =
                  agent.status === 'done'
                    ? { icon: CheckCircle2, cls: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30', label: 'مكتمل' }
                    : agent.status === 'active'
                    ? { icon: Zap, cls: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/30', label: 'نشط' }
                    : agent.status === 'needs_action'
                    ? { icon: AlertCircle, cls: 'text-amber-300 border-amber-500/30 bg-amber-950/30', label: 'بانتظارك' }
                    : { icon: Clock, cls: 'text-white/60 border-white/10 bg-white/5', label: 'جاهز' };
                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={agent.id}
                    className={`p-2.5 rounded-xl border ${statusBadge.cls} flex flex-col justify-between gap-1.5`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black text-white truncate">{agent.name}</span>
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <p className="text-[10px] text-white/75 leading-relaxed">{agent.summary}</p>
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-[9px] font-mono text-white/60 truncate">{agent.metric}</span>
                      {agent.actionUrl ? (
                        <a
                          href={agent.actionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-black text-emerald-300 hover:underline flex items-center gap-0.5 shrink-0"
                        >
                          {agent.actionLabel || 'فتح'} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        onQuickPrompt && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onQuickPrompt(`شغّل ${agent.name} واعرض لي الخطوة التالية والتنفيذ الفعلي`);
                            }}
                            className="text-[9px] font-black text-cyan-300 hover:underline shrink-0"
                          >
                            تشغيل ➔
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connected Social Matrix + App Link */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-white/10">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-white/70 flex items-center gap-1">
                  <Share2 className="w-3 h-3 text-purple-300" />
                  المنصات:
                </span>
                {ALL_SOCIALS.map((s) => {
                  const active = summary?.connectedSocials?.includes(s.id);
                  return (
                    <span
                      key={s.id}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      {active ? '🟢 ' : ''}{s.label}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {summary?.appUrl && (
                  <a
                    href={summary.appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    فتح التطبيق الحي
                  </a>
                )}
                {onQuickPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onQuickPrompt('يا جارفيس شغّل السرب بالكامل واديني خطة التنفيذ الفورية لبراندنا والخدمات المتاحة');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 text-[10px] font-black flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    تقرير السرب التنفيذي
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
