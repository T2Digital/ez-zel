import React, { useEffect, useState } from 'react';
import { Brain, Trash2, X, Activity } from 'lucide-react';
import { shadowDB } from '../services/dbService';
import { useAppStore } from '../services/store';

export const MemoryVault: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAppStore();
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemories = async () => {
            if (user?.email) {
                const mems = await shadowDB.getMemory(user.email);
                setMemories(mems.filter(m => m.fact).reverse()); // Newest first
            }
            setLoading(false);
        };
        fetchMemories();
    }, [user]);

    const handleDelete = async (id: number) => {
        await shadowDB.deleteMemory(id);
        setMemories(prev => prev.filter(m => m.id !== id));
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#111] border border-fuchsia-500/20 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-[0_0_50px_rgba(217,70,239,0.1)] relative overflow-hidden font-['Cairo']" dir="rtl">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                            <Brain className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">الذاكرة المعرفية (Memory Vault)</h2>
                            <p className="text-[10px] text-fuchsia-300 font-mono tracking-widest uppercase mt-1 flex items-center gap-1">
                                <Activity className="w-3 h-3 animate-pulse" /> Shadow SLM Database
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-white/30 text-xs">جاري تحميل الذاكرة...</div>
                    ) : memories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                            <Brain className="w-12 h-12 opacity-50" />
                            <p className="text-sm font-bold">الذاكرة فاضية يا ريس، لسه مسجلتش حاجة.</p>
                        </div>
                    ) : (
                        memories.map((m, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3 items-center group transition-all hover:bg-white/10">
                                <div className="flex-1">
                                    <p className="text-sm text-white/90 leading-6">{m.fact}</p>
                                    <p className="text-[10px] text-white/30 mt-1 font-mono" dir="ltr">
                                        ID: {m.id} | {new Date(m.createdAt || Date.now()).toLocaleString('ar-EG')}
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(m.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
