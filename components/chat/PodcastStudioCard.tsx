import React, { useState, useEffect } from 'react';
import { Mic2, Headphones, Activity, Radio, PlayCircle, Loader2 } from 'lucide-react';

export const PodcastStudioCard = ({ card }: { card: any }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('جارِ إنشاء الاستوديو...');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!card) return;
        
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 12;
            if (p > 100) p = 100;
            setProgress(p);

            if (p < 25) setStatus('كتابة اسكربت البودكاست وتوزيع الأدوار...');
            else if (p < 50) setStatus('توليد أصوات الضيوف والمضيف (التعليق الصوتي)...');
            else if (p < 75) setStatus('الهندسة الصوتية والمكساج والخلفيات الموسيقية...');
            else if (p < 99) setStatus('تجهيز الملف النهائي للنشر على المنصات...');
            else if (p === 100) {
                setStatus('الحلقة جاهزة وموزعة للمنصات 🎧');
                setIsReady(true);
                clearInterval(interval);
            }
        }, 800);

        return () => clearInterval(interval);
    }, [card]);

    return (
        <div className="mt-4 rounded-[22px] p-5 w-full md:w-[450px] bg-gradient-to-br from-orange-900/40 to-black border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 to-amber-500" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black border-2 border-orange-500/50 rounded-full flex items-center justify-center relative inner-shadow shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                        <Mic2 className="w-5 h-5 text-orange-400" />
                        {!isReady && <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>}
                    </div>
                    <div>
                        <h3 className="font-black text-white text-md tracking-tight flex items-center gap-2">
                            استوديو بودكاست الظل
                        </h3>
                        <p className="text-xs text-orange-300 mt-0.5 max-w-[200px] truncate">{card.data?.podcast_name || 'بودكاست جديد'}</p>
                    </div>
                </div>
                <div className="bg-black/40 px-2 py-1 rounded text-[10px] font-mono text-orange-400 border border-orange-500/20">
                    استوديو رقمي
                </div>
            </div>

            <div className="bg-black/50 border border-white/5 rounded-xl p-4 relative z-10 mb-4">
                <div className="text-xs font-bold text-white mb-2">موضوع الحلقة: {card.data?.episode_topic}</div>
                <div className="flex gap-2 flex-wrap">
                    {card.data?.hosts?.map((host: string, idx: number) => (
                        <span key={idx} className="bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-1 rounded-md text-[10px] flex items-center gap-1">
                            <Headphones className="w-3 h-3" /> {host}
                        </span>
                    ))}
                </div>
            </div>

            {!isReady ? (
                <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] text-orange-400">
                        <span>{status}</span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-white/40">
                        <Activity className="w-3 h-3 text-amber-500 animate-pulse" /> تتم المعالجة في الخوادم الصوتية...
                    </div>
                </div>
            ) : (
                <div className="relative z-10 mt-4 animate-fade-in border-t border-orange-500/20 pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                            <Radio className="w-4 h-4" /> جاري البث على المنصات...
                        </div>
                        <div className="text-[10px] text-white/50 text-left" dir="ltr">{card.data?.duration_minutes || 15}:00 MIN</div>
                    </div>
                    <button className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 text-sm">
                        <PlayCircle className="w-5 h-5" /> استمع للحلقة الآن
                    </button>
                    <div className="text-center text-[9px] text-white/30 mt-3 uppercase tracking-widest">
                        Distributed to Spotify & Apple Podcasts
                    </div>
                </div>
            )}
        </div>
    );
};
