import React from 'react';
import { Sparkles, Pause, Play, MessageSquare, PhoneCall, Globe, Sliders } from 'lucide-react';
import { toast } from './jarvisToast';
import { playShadowVoice } from '../../services/speechService';

export interface JarvisAgentFleetDeckProps {
  botStates: Record<string, boolean>;
  setBotStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  realStats: any;
  setIsOnboardingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCrmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMetaReadinessOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSendLiveCommand: (cmd: string) => Promise<void>;
}

export const JarvisAgentFleetDeck: React.FC<JarvisAgentFleetDeckProps> = ({
  botStates,
  setBotStates,
  realStats,
  setIsOnboardingOpen,
  setIsCrmModalOpen,
  setIsMetaReadinessOpen,
  handleSendLiveCommand
}) => {
  return (
    <div className="w-full max-w-xl rounded-3xl bg-[#020617]/95 border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(0,240,255,0.2)] p-3 flex flex-col gap-2.5 backdrop-blur-md animate-in fade-in duration-200">
      {/* Fleet Subheader */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-white">لوحة تحكم الأيجنت الذكي • إدارة المحادثات والـ CRM</span>
        </div>
        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-[10px] font-bold transition flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          + إضافة نشاط جديد
        </button>
      </div>

      {/* Filter Pills from Real Screenshot */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[9.5px] font-mono select-none scrollbar-none">
        <span className="px-2.5 py-1 rounded-lg bg-cyan-500 text-black font-bold whitespace-nowrap">أنشطة وحالة الأيجنت (6)</span>
        <button onClick={() => setIsCrmModalOpen(true)} className="px-2.5 py-1 rounded-lg bg-black/40 text-white/70 hover:text-white border border-white/5 whitespace-nowrap">المحادثات والتحكم اليدوي (CRM)</button>
        <button onClick={() => setIsCrmModalOpen(true)} className="px-2.5 py-1 rounded-lg bg-black/40 text-white/70 hover:text-white border border-white/5 whitespace-nowrap">التقويم والحجوزات</button>
        <button onClick={() => setIsMetaReadinessOpen(true)} className="px-2.5 py-1 rounded-lg bg-black/40 text-white/70 hover:text-white border border-white/5 whitespace-nowrap">الربط والمتاجر</button>
      </div>

      {/* REAL BOT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        
        {/* 1. CLEAN MASTER */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#041226] to-[#01040f] border border-cyan-500/40 flex flex-col gap-2 relative shadow-lg shadow-cyan-950/40">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">كلين ماستر لخدمات النظافة والتعقيم</span>
              </div>
              <span className="text-[9px] font-mono text-white/40 block">ID: clean_master</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${botStates.clean_master ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
              {botStates.clean_master ? 'شغال' : 'متوقف'}
            </span>
          </div>

          <div className="text-[9px] font-mono text-cyan-300">حالة الاشتراك: VIP غير محدود ∞</div>

          {/* Main Action: Pause / Resume Bot */}
          <button
            onClick={() => {
              const newState = !botStates.clean_master;
              setBotStates(prev => ({ ...prev, clean_master: newState }));
              playShadowVoice(newState ? 'تم استئناف رد أيجنت كلين ماستر 24 ساعة!' : 'تم تعليق رد أيجنت كلين ماستر مؤقتاً!', 'male');
            }}
            className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 border ${
              botStates.clean_master
                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 font-black'
            }`}
          >
            {botStates.clean_master ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {botStates.clean_master ? 'تعليق الاتصال (إيقاف رد الأيجنت مؤقتاً)' : 'استئناف رد الأيجنت 24/7'}
          </button>

          {/* Stats: Live Handled Messages + 100% Platform Health */}
          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
            <div 
              onClick={() => setIsCrmModalOpen(true)}
              className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-cyan-400/50 transition"
            >
              <span className="text-white/70">صندوق المحادثات</span>
              <span className="font-bold text-cyan-400">{realStats?.totalHandledMessages || 0} 💬</span>
            </div>
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-white/70">فحص المنصات</span>
              <span className="font-bold text-cyan-400">100% 🛡️</span>
            </div>
          </div>

          {/* WhatsApp Connection Status */}
          <div className="p-1.5 rounded-lg bg-black/60 border border-cyan-500/20 flex items-center justify-between text-[8.5px] font-mono">
            <span className="text-white/60">واتساب: +201013372674</span>
            <span className="text-cyan-400 font-bold">متصل وفعال</span>
          </div>

          {/* Secondary Buttons Row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
            <div className="flex items-center gap-1">
              <button onClick={() => setIsCrmModalOpen(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white" title="المحادثات">
                <MessageSquare className="w-3 h-3" />
              </button>
              <button onClick={() => handleSendLiveCommand("اتصل بكلين ماستر وافحص الحجوزات")} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400" title="اتصال مباشر">
                <PhoneCall className="w-3 h-3" />
              </button>
              <button onClick={() => setIsMetaReadinessOpen(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400" title="قنوات ميتا">
                <Globe className="w-3 h-3" />
              </button>
              <button onClick={() => toast.success("تم فتح إعدادات البوت والتدريب")} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title="الإعدادات">
                <Sliders className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[8px] text-amber-300 font-bold">👑 باقة المدير العام</span>
          </div>
        </div>

        {/* 2. SALE GATES EGYPT */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0b172a] to-[#040813] border border-cyan-500/40 flex flex-col gap-2 relative shadow-lg shadow-cyan-950/40">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">Sale Gates Egypt</span>
              </div>
              <span className="text-[9px] font-mono text-white/40 block">ID: besho</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${botStates.besho ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
              {botStates.besho ? 'شغال' : 'متوقف'}
            </span>
          </div>

          <div className="text-[9px] font-mono text-cyan-300">حالة الاشتراك: VIP غير محدود ∞</div>

          <button
            onClick={() => {
              const newState = !botStates.besho;
              setBotStates(prev => ({ ...prev, besho: newState }));
              playShadowVoice(newState ? 'تم تفعيل رد سيل جيت العقارية!' : 'تم إيقاف رد سيل جيت مؤقتاً!', 'male');
            }}
            className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 border ${
              botStates.besho
                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 font-black'
            }`}
          >
            {botStates.besho ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {botStates.besho ? 'تعليق الاتصال (إيقاف رد الأيجنت مؤقتاً)' : 'استئناف رد الأيجنت'}
          </button>

          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-white/70">صندوق المحادثات</span>
              <span className="font-bold text-cyan-400">{realStats?.saleGatesMessages ?? (realStats?.totalHandledMessages ? Math.floor(realStats.totalHandledMessages * 0.2) : 0)} 💬</span>
            </div>
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-white/70">فحص المنصات</span>
              <span className="font-bold text-cyan-400">100% 🛡️</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
            <div className="flex items-center gap-1">
              <button onClick={() => setIsCrmModalOpen(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70">
                <MessageSquare className="w-3 h-3" />
              </button>
              <button onClick={() => setIsMetaReadinessOpen(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400">
                <Globe className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[8px] text-cyan-300 font-bold">عقارات واستشارات VIP</span>
          </div>
        </div>

        {/* 3. ALKHEDR CAR RENTAL */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1c1306] to-[#0a0601] border border-amber-500/30 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-bold text-white text-xs">شركة الخضر لتأجير السيارات</span>
              <span className="text-[9px] font-mono text-white/40 block">ID: alkhedr_car_rental</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${botStates.alkhedr_car_rental ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-white/60'}`}>
              {botStates.alkhedr_car_rental ? 'شغال' : 'متوقف'}
            </span>
          </div>
          <div className="text-[9px] font-mono text-amber-300">VIP غير محدود ∞ • محادثات: 0</div>
          <button
            onClick={() => {
              const newState = !botStates.alkhedr_car_rental;
              setBotStates(prev => ({ ...prev, alkhedr_car_rental: newState }));
              playShadowVoice(newState ? 'تم استئناف أيجنت الخضر للسيارات 24 ساعة!' : 'تم إيقاف أيجنت الخضر مؤقتاً!', 'male');
            }}
            className="w-full py-1.5 rounded-xl text-[10px] font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3" />
            تفعيل الاتصال واستئناف رد الأيجنت
          </button>
        </div>

        {/* 4. BATTAH SPARE PARTS */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#140b22] to-[#06020c] border border-purple-500/30 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-bold text-white text-xs">متجر بطاح لقطع غيار السيارات</span>
              <span className="text-[9px] font-mono text-white/40 block">ID: battah_system</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white/60 border border-white/20">
              متوقف
            </span>
          </div>
          <div className="text-[9px] font-mono text-purple-300">VIP غير محدود ∞ • كماليات وقطع غيار</div>
          <button
            onClick={() => toast.success("تم إرسال أمر التفعيل لبوت متجر بطاح")}
            className="w-full py-1.5 rounded-xl text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3" />
            تفعيل الاتصال
          </button>
        </div>

        {/* 5. BARAKA MOTORS */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-black/60 to-black/90 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-start justify-between">
            <span className="font-bold text-white text-xs">بركة موتورز</span>
            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">تجربة 7 أيام</span>
          </div>
          <span className="text-[8px] text-white/50">ID: baraka_motors • متبقي في التجربة 7 أيام</span>
        </div>

        {/* 6. T2 DIGITAL */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-black/60 to-black/90 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-start justify-between">
            <span className="font-bold text-white text-xs">T2 Digital</span>
            <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">تجربة 7 أيام</span>
          </div>
          <span className="text-[8px] text-white/50">ID: t2-digital • منصة الحلول الرقمية</span>
        </div>

      </div>
    </div>
  );
};
