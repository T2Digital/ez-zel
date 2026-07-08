import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Calculator, PenTool, Scale, Cpu, Globe, Zap, Eye, Feather, TrendingUp, Brain, Terminal, FileText } from 'lucide-react';

export const BoardroomMeetingCard = ({ card }: { card: any }) => {
    const [progress, setProgress] = useState(0);
    
    // Default to the real Shadow Council roles if none provided
    const members = card.data?.members || ['المايسترو', 'المهندس', 'المحقق', 'المحاسب', 'المنفذ', 'نكسوس', 'المستشار', 'المحلل', 'المعالج', 'المحلل الفني'];
    const [activeSpeaker, setActiveSpeaker] = useState(members[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return p + 2;
            });
            setActiveSpeaker(members[Math.floor(Math.random() * members.length)]);
        }, 1200);
        return () => clearInterval(interval);
    }, [members]);

    const getIcon = (role: string) => {
        if (role.includes('مايسترو')) return <Brain className="w-5 h-5 text-purple-400" />;
        if (role.includes('مهندس')) return <Terminal className="w-5 h-5 text-blue-400" />;
        if (role.includes('محقق')) return <Globe className="w-5 h-5 text-emerald-400" />;
        if (role.includes('حاسب')) return <Calculator className="w-5 h-5 text-emerald-400" />;
        if (role.includes('منفذ')) return <Zap className="w-5 h-5 text-amber-400" />;
        if (role.includes('نكسوس')) return <Cpu className="w-5 h-5 text-cyan-400" />;
        if (role.includes('مستشار')) return <Scale className="w-5 h-5 text-blue-400" />;
        if (role.includes('محلل') && !role.includes('فني')) return <Eye className="w-5 h-5 text-purple-400" />;
        if (role.includes('معالج')) return <Feather className="w-5 h-5 text-red-400" />;
        if (role.includes('فني')) return <TrendingUp className="w-5 h-5 text-green-400" />;
        if (role.includes('سوق') || role.includes('market')) return <Briefcase className="w-5 h-5 text-purple-400" />;
        return <Users className="w-5 h-5 text-gray-400" />;
    };

    return (
        <div className="mt-4 p-5 w-full max-w-3xl overflow-hidden group font-sans mx-auto">
            <div className="relative rounded-[22px] bg-gradient-to-br from-[#0a1128] to-black border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] flex flex-col">
                
                <div className="flex justify-between items-start p-6 border-b border-white/10 z-10 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-full border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                            <Users className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-md tracking-widest leading-none">مجلس استشاري الظل</h3>
                            <p className="text-xs text-amber-300/70 mt-2 uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE SWARM MEETING
                            </p>
                        </div>
                    </div>
                </div>

                {/* CSS-Based Lightweight "Hologram" Arena instead of heavy WebGL/Three.js */}
                <div className="w-full py-8 bg-[#050510] relative flex items-center justify-center overflow-hidden min-h-[250px]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-[#050510] to-[#050510]"></div>
                    
                    {/* Center glowing table */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-12 bg-amber-500/10 rounded-[100%] blur-xl shadow-[0_0_50px_rgba(245,158,11,0.4)] animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16 border-2 border-amber-500/20 rounded-[100%] rotate-x-60 animate-[spin_10s_linear_infinite]"></div>

                    {/* Surrounding Avatars */}
                    <div className="relative w-full max-w-[400px] h-full flex flex-wrap justify-center gap-4 z-10 px-4">
                        {members.map((member: string, i: number) => {
                            const isActive = activeSpeaker === member;
                            return (
                                <div key={i} className={`flex flex-col items-center justify-center transition-all duration-500 ${isActive ? 'scale-125 z-20' : 'scale-90 opacity-60'}`}>
                                    <div className={`p-3 rounded-full border mb-2 ${isActive ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-black/50 border-gray-700'}`}>
                                        {getIcon(member)}
                                    </div>
                                    {isActive && <span className="text-[10px] font-bold text-amber-400 whitespace-nowrap bg-black/80 px-2 py-1 rounded-full border border-amber-500/30">يتحدث: {member}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-5 bg-black/80 z-10 relative border-t border-white/5">
                    <div className="bg-[#050505] border border-[#222] p-3 rounded-lg mb-2">
                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 flex justify-between">
                            <span>تقدم الجلسة وتحليل البيانات</span>
                            <span className="text-amber-400">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    {progress === 100 && (
                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center animate-in fade-in zoom-in flex flex-col items-center">
                            <div className="text-emerald-400 font-bold text-sm mb-1">تم إعداد قرار المجلس ✔️</div>
                            <p className="text-[10px] text-white/50 mb-2">انتهى السرب من التفكير الموازي، وتقرير المستشارين جاهز للتنفيذ.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
