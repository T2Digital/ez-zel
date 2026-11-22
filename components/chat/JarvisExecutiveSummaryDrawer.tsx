import React from 'react';
import {
  Sparkles,
  Bot,
  Film,
  PlusCircle,
  ShieldCheck,
  Cpu,
  Radio,
} from 'lucide-react';
import { isMasterAdminEmail } from '../../services/adminIdentity';

interface JarvisExecutiveSummaryDrawerProps {
  userProfile?: any;
  onQuickPrompt?: (prompt: string) => void;
  externalRefreshKey?: number;
  onOpenBattleStation?: () => void;
  onOpenNewBrand?: () => void;
  onNavigateAdmin?: (section?: string) => void;
}

export const JarvisExecutiveSummaryDrawer: React.FC<JarvisExecutiveSummaryDrawerProps> = ({
  userProfile,
  onQuickPrompt,
  onOpenBattleStation,
  onOpenNewBrand,
  onNavigateAdmin,
}) => {
  const emailLower = (userProfile?.email || '').toLowerCase();
  const isMaster =
    userProfile?.role === 'master' ||
    isMasterAdminEmail(emailLower) ||
    (userProfile?.tier === 'sovereign' && String(userProfile?.name || '').includes('تيتو'));

  return (
    <div className="w-full px-3 md:px-6 pt-2 z-20 shrink-0 font-['Cairo']" dir="rtl">
      <div className="rounded-2xl bg-[#060d1f]/95 border border-cyan-500/35 shadow-[0_8px_28px_rgba(6,182,212,0.14)] px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        {/* Left: Sovereign Launcher Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.45)]">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-white whitespace-nowrap hidden sm:inline">
            {isMaster ? 'شريط القيادة السريع (ماستر تيتو)' : 'شريط إطلاق خدمات البراند'}
          </span>
        </div>

        {/* Right: Direct 1-Tap Action Buttons (Works identically on Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenBattleStation && (
            <button
              type="button"
              onClick={onOpenBattleStation}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/45 text-[11px] font-black flex items-center gap-1 whitespace-nowrap transition cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>غرفة جارفيس</span>
            </button>
          )}

          {onOpenNewBrand && (
            <button
              type="button"
              onClick={onOpenNewBrand}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[11px] font-black flex items-center gap-1 whitespace-nowrap transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ براند جديد</span>
            </button>
          )}

          <a
            href={isMaster ? 'https://studio.t2os.app/?clinicId=brand_1779847291377' : 'https://studio.t2os.app'}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 border border-purple-400/40 text-[11px] font-black flex items-center gap-1 whitespace-nowrap transition"
          >
            <Film className="w-3.5 h-3.5 text-purple-300" />
            <span>الاستوديو</span>
          </a>

          <a
            href="https://agent.t2os.app/dashboard"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 text-[11px] font-black flex items-center gap-1 whitespace-nowrap transition"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-300" />
            <span>الأجنت</span>
          </a>

          {isMaster && onNavigateAdmin && (
            <button
              type="button"
              onClick={() => onNavigateAdmin('admin')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/45 text-[11px] font-black flex items-center gap-1 whitespace-nowrap transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>لوحة الإدارة</span>
            </button>
          )}

          {onQuickPrompt && (
            <button
              type="button"
              onClick={() =>
                onQuickPrompt(
                  isMaster
                    ? 'اعرض ملخص حالة البراندات النشطة وجلسات الواتساب وخطة محتوى تيتو ميديا اليوم'
                    : 'جهز لي خطة محتوى وبوست جديد لبراندي الآن'
                )
              }
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/90 border border-white/15 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>فحص وتنفيذ فوري</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
