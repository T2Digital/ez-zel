import React, { useState, useEffect } from 'react';
import { Video, BarChart4, Send, Loader2, Sparkles, Youtube, Instagram, Twitter, CalendarDays, CheckCircle2 } from 'lucide-react';

export const ContentMachineCard = ({ card }: { card: any }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('جارِ تهيئة صانع المحتوى...');
    const [completed, setCompleted] = useState(false);

    const isCampaign = card.data?.content_type === 'full_campaign';

    useEffect(() => {
        if (!card) return;
        
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * (isCampaign ? 5 : 15);
            if (p > 100) p = 100;
            setProgress(p);

            if (isCampaign) {
                if (p < 20) setStatus('تحليل التريندات والمنافسين للشهر القادم...');
                else if (p < 40) setStatus('كتابة 30 اسكربت للفيديوهات القصيرة والطويلة...');
                else if (p < 70) setStatus('توليد الفيديوهات والأصول بنماذج الذكاء الاصطناعي...');
                else if (p < 90) setStatus('تركيب الصوت والمكساج وتجهيز الجدولة...');
                else if (p < 99) setStatus('توزيع المحتوى على Buffer/Make للجدولة التلقائية...');
                else if (p === 100) {
                    setStatus('تم تجهيز خطة الشهر بالكامل وجدولتها! 🚀');
                    setCompleted(true);
                    clearInterval(interval);
                }
            } else {
                if (p < 30) setStatus('كتابة الإسكربت وجمع الموارد...');
                else if (p < 60) setStatus('توليد الفيديو بواسطة نماذج الفيديو المتقدمة...');
                else if (p < 85) setStatus('إضافة التعليق الصوتي والهندسة الصوتية...');
                else if (p < 99) setStatus('نشر المحتوى وجدولة البوستات...');
                else if (p === 100) {
                    setStatus('تم الإنتاج والنشر بنجاح! 🚀');
                    setCompleted(true);
                    clearInterval(interval);
                }
            }
        }, 800);

        return () => clearInterval(interval);
    }, [card, isCampaign]);

    return (
        <div className="mt-4 rounded-[22px] p-5 w-full md:w-[450px] bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.2)] relative overflow-hidden group">
            {/* Visual background elements */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_50%)] animate-spin-slow pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                        {isCampaign ? <CalendarDays className="w-6 h-6 text-pink-400" /> : <Video className="w-6 h-6 text-indigo-400" />}
                    </div>
                    <div>
                        <h3 className="font-black text-white text-md tracking-tight flex items-center gap-2">
                            {isCampaign ? 'خطة محتوى احترافية 30 يوم' : 'ماكينة المحتوى OmniFlash'} <Sparkles className="w-3 h-3 text-pink-400" />
                        </h3>
                        <p className="text-xs text-indigo-300 mt-0.5">{card.data?.channel_name || 'قناة جديدة'} - {card.data?.niche || 'منوعات'}</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mb-6 bg-black/40 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white/70">{status}</span>
                    <span className="text-xs font-mono text-indigo-400">{Math.floor(progress)}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer" />
                    </div>
                </div>
            </div>

            {isCampaign && (
                <div className="grid grid-cols-7 gap-1 mb-6 relative z-10">
                    {Array.from({ length: 28 }).map((_, i) => {
                        const dayProgress = Math.min(100, Math.max(0, (progress - (i * (100 / 28))) * 28));
                        const isDone = dayProgress >= 100;
                        return (
                            <div key={i} className={`aspect-square rounded flex items-center justify-center text-[8px] font-bold transition-all duration-500 ${isDone ? 'bg-indigo-500/40 text-white' : 'bg-white/5 text-white/20'}`}>
                                {isDone ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : i + 1}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="relative z-10 flex gap-2 mb-4">
                {card.data?.platforms?.includes('youtube') && (
                    <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                        <Youtube className="w-4 h-4 mb-1" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">YouTube</span>
                    </div>
                )}
                {card.data?.platforms?.includes('instagram') && (
                    <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
                        <Instagram className="w-4 h-4 mb-1" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Instagram</span>
                    </div>
                )}
                {card.data?.platforms?.includes('tiktok') && (
                    <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-black/50 border border-white/10 text-white">
                        <Video className="w-4 h-4 mb-1" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">TikTok</span>
                    </div>
                )}
            </div>

            {completed && (
                <div className="relative z-10 mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3 animate-fade-in">
                    <BarChart4 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-emerald-300">تمت العملية بنجاح</h4>
                        <p className="text-[10px] text-white/60 mt-1">
                            {isCampaign ? 'تم إنشاء الخطة وجدولة الفيديوهات لشهر كامل. الماكينة الآن تعمل بالخلفية لجلب المشاهدات.' : `الفيديو (صيغة ${card.data?.content_type === 'short_video' ? 'Shorts' : 'Long Form'}) تم تحميله للمنصات بنجاح.`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
