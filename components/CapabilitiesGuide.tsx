
import React, { useState } from 'react';
import { X, Brain, Eye, Mic, Globe, Shield, Zap, Database, Fingerprint, Volume2, StopCircle, DollarSign, Crown } from 'lucide-react';
import { playShadowVoice, stopVoice } from '../services/geminiService';

interface Props {
  onClose: () => void;
  onJoin?: () => void; // Optional handler for Join button
  onAffiliate?: () => void; // Optional handler for Affiliate button
}

const CapabilitiesGuide: React.FC<Props> = ({ onClose, onJoin, onAffiliate }) => {
  const [activeCap, setActiveCap] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopVoice();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const capabilities = [
    {
      icon: <Brain className="w-6 h-6 text-cyan-400" />,
      title: "المستشار التنفيذي بالصوت (جارفيس)",
      desc: "تدير نشاطك كله بالصوت أو الشات: تفتح غرفة قيادة براندك، تراجع المبيعات، تطلب حملات، وتوجّه فريقك الذكي في لحظة.",
      voiceScript: "أنا جارفيس، مستشارك التنفيذي. كلمني بالصوت أدير لك براندك، أراجع مبيعاتك، وأشغّل الاستوديو ووكيل الواتساب بأمر واحد.",
      color: "bg-cyan-500/10 border-cyan-500/25"
    },
    {
      icon: <Globe className="w-6 h-6 text-emerald-400" />,
      title: "تطبيق ويب ومتجر / حجوزات كامل (PWA)",
      desc: "تطبيق سريع باسم براندك وهويتك، مجهّز بسلة تسوق أو تقويم حجوزات، فواتير مطبوعة، Cloud ERP، وSEO/GEO لمحركات البحث والذكاء الاصطناعي.",
      voiceScript: "بنبني لبراندك تطبيق ويب متكامل بهويتك، جاهز للطلب الفوري والفواتير المطبوعة ومتوافق مع محركات البحث والذكاء الاصطناعي.",
      color: "bg-emerald-500/10 border-emerald-500/25"
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: "استوديو المحتوى والإنتاج (T2 Studio)",
      desc: "خطط تسويقية شهرية وأسبوعية، تصميمات جرافيك احترافية، وفيديوهات ريلز وإعلانات جاهزة للنشر التلقائي على فيسبوك وإنستجرام وتيك توك.",
      voiceScript: "استوديو متكامل لصناعة محتوى براندك: تصميمات وفيديوهات احترافية وجدولة نشر تلقائي حسب باقتك.",
      color: "bg-amber-500/10 border-amber-500/25"
    },
    {
      icon: <Mic className="w-6 h-6 text-purple-400" />,
      title: "وكيل المبيعات 24/7 (WhatsApp & Social)",
      desc: "ربط حقيقي برقم الواتساب وصفحات السوشيال للرد الذكي على العملاء، إغلاق الطلبات والحجوزات، مع صندوق شات مباشر للتدخل اليدوي في أي وقت.",
      voiceScript: "وكيل مبيعات لا ينام على الواتساب والسوشيال، بيرد على عملائك بلهجتك وبيانات كتالوجك وبيقفل معاهم الطلب.",
      color: "bg-purple-500/10 border-purple-500/25"
    },
    {
      icon: <Eye className="w-6 h-6 text-blue-400" />,
      title: "تتبع الإعلانات والبكسلات (50% ميزانية مُدارة)",
      desc: "ربط مباشر ببكسلات Meta وTikTok وGoogle وSnapchat لتتبع المشاهدات والسلة والشراء بدقة، مع تخصيص 50% من باقتك ميزانية إعلانات ممولة.",
      voiceScript: "كل زيارة وكل طلب بيتقاس بالبكسل عشان حملاتك الممولة تجيب أعلى عائد بأقل تكلفة.",
      color: "bg-blue-500/10 border-blue-500/25"
    },
    {
      icon: <Shield className="w-6 h-6 text-rose-400" />,
      title: "غرفة قيادة موحدة وعزل تام للبيانات",
      desc: "شاشة واحدة تجمع التطبيق والسوشيال والأجنت وبنك المعرفة، مع حماية وعزل كامل لبيانات براندك وعملائك على السحابة.",
      voiceScript: "بيانات براندك وعملائك معزولة ومحمية بالكامل، وبتدير كل قنواتك من غرفة قيادة واحدة.",
      color: "bg-rose-500/10 border-rose-500/25"
    }
  ];

  const handleSelectCap = (idx: number) => {
      stopVoice();
      setActiveCap(idx);
      setIsPlaying(true);
      playShadowVoice(capabilities[idx].voiceScript, 'male', undefined, () => setIsPlaying(false));
  };

  const handleClose = () => {
      stopVoice();
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in duration-300 font-['Cairo']">
      <div className="w-full max-w-4xl glass rounded-[40px] border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden bg-[#050505]">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/20">
                    <Zap className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">قدرات الظل</h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">تفاعلي • صوتي • ذكي</p>
                </div>
            </div>
            <button onClick={handleClose} className="p-3 hover:bg-white/10 rounded-full transition-all group">
                <X className="w-6 h-6 text-white/40 group-hover:text-white" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {capabilities.map((cap, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => handleSelectCap(idx)}
                        className={`cursor-pointer p-6 rounded-[24px] border transition-all duration-300 flex flex-col gap-4 group relative overflow-hidden ${activeCap === idx ? 'bg-white/10 border-white/30 scale-[1.02] shadow-2xl' : `${cap.color} hover:scale-[1.02] hover:bg-white/5`}`}
                    >
                        {activeCap === idx && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse pointer-events-none"></div>}
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div className="p-3 bg-black/40 rounded-full border border-white/5 group-hover:bg-white/10 transition-colors">
                                {activeCap === idx && isPlaying ? <Volume2 className="w-6 h-6 text-emerald-400 animate-pulse" /> : cap.icon}
                            </div>
                            <Fingerprint className={`w-8 h-8 transition-colors ${activeCap === idx ? 'text-white' : 'text-white/5 group-hover:text-white/10'}`} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-white mb-2">{cap.title}</h3>
                            <p className="text-xs text-white/60 leading-relaxed font-medium">{cap.desc}</p>
                            <span className="text-[9px] font-bold text-white/30 mt-3 block uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                                {activeCap === idx ? (isPlaying ? 'جارٍ التحدث...' : 'اضغط للإعادة') : 'اضغط للاستماع'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-transparent rounded-[24px] border border-purple-500/20 flex items-center gap-6">
                <div className="hidden md:block">
                    <Fingerprint className="w-16 h-16 text-purple-500/50" />
                </div>
                <div>
                    <h4 className="text-lg font-black text-white mb-1">تطور مستمر...</h4>
                    <p className="text-xs text-white/50">الظل بيتعلم منك كل يوم. كل ما تتكلم معاه أكتر، كل ما ذكائه بيزيد ويفهمك أسرع. أنت بتبني نسختك الخاصة.</p>
                </div>
            </div>
        </div>

        {/* Action Footer */}
        {(onJoin || onAffiliate) && (
            <div className="absolute bottom-0 left-0 w-full p-4 bg-black/90 border-t border-white/10 backdrop-blur-xl flex gap-3">
                {onJoin && (
                    <button onClick={onJoin} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-[20px] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 transition-all">
                        <Crown className="w-5 h-5" />
                        امتلك ظلك الآن
                    </button>
                )}
                {onAffiliate && (
                    <button onClick={onAffiliate} className="flex-1 py-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-[20px] font-black text-sm flex items-center justify-center gap-2 transition-all">
                        <DollarSign className="w-5 h-5" />
                        نظام الأرباح
                    </button>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default CapabilitiesGuide;
