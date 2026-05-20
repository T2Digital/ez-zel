import React, { useState, useEffect } from 'react';
import { MailSearch, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';

export const LeadGeneratorCard = ({ card }: { card: any }) => {
    const industry = card.data?.target_industry || 'الشركات';
    const [leads, setLeads] = useState<any[]>([]);
    const [status, setStatus] = useState('جاري الفحص وجمع البيانات...');

    useEffect(() => {
        const dummyLeads = [
            { name: 'شركة TechVision', email: 'contact@techvision.ae', match: '98%', sent: false },
            { name: 'وكالة ابتكار', email: 'sponsorship@ibtikar.sa', match: '95%', sent: false },
            { name: 'Future Media', email: 'hello@futuremedia.com', match: '88%', sent: false }
        ];

        let i = 0;
        const iv = setInterval(() => {
            if (i < dummyLeads.length) {
                setLeads(prev => [...prev, dummyLeads[i]]);
                i++;
            } else {
                setStatus('تم تجهيز العملاء ورسائل التواصل المخصصة.');
                clearInterval(iv);
            }
        }, 1500);

        return () => clearInterval(iv);
    }, []);

    const markSent = (idx: number) => {
        setLeads(prev => prev.map((l, i) => i === idx ? { ...l, sent: true } : l));
    };

    return (
        <div className="mt-4 rounded-[22px] p-5 w-full md:w-[450px] bg-gradient-to-br from-[#051014] to-black border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-600/10 blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6 relative z-10 border-b border-cyan-500/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/40">
                        <MailSearch className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-xs tracking-widest uppercase">Lead Generator</h3>
                        <p className="text-[10px] text-cyan-400 mt-1 uppercase">صيد صفقات ورعايات: {industry}</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mb-4 text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                {status}
            </div>

            <div className="relative z-10 flex flex-col gap-2">
                {leads.map((lead, idx) => (
                    <div key={idx} className="bg-black/60 border border-[#222] p-3 rounded-xl flex items-center justify-between group/lead hover:border-cyan-500/30 transition-colors animate-fade-in">
                        <div>
                            <div className="text-white text-xs font-bold mb-1 flex items-center gap-2">
                                <Briefcase className="w-3 h-3 text-cyan-400" /> {lead.name}
                            </div>
                            <div className="text-[9px] text-gray-500 font-mono">{lead.email}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1 rounded">Match {lead.match}</span>
                            {lead.sent ? (
                                <span className="text-emerald-500 text-[10px] flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" /> تم الإرسال</span>
                            ) : (
                                <button onClick={() => markSent(idx)} className="text-[9px] bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                    إرسال إيميل <ChevronRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {leads.length === 3 && (
                <button className="relative z-10 w-full mt-4 p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95">
                    إرسال للجميع (Auto-Campaign)
                </button>
            )}
        </div>
    );
};
