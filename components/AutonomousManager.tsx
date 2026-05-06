import React, { useEffect, useState } from 'react';
import { Bot, RefreshCw, X, PlayCircle, CheckCircle, Clock } from 'lucide-react';
import { useAppStore } from '../services/store';
import { shadowDB, DBTask } from '../services/dbService';

export const AutonomousManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAppStore();
    const [tasks, setTasks] = useState<DBTask[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        if (!user?.email) return;
        setLoading(true);
        const allTasks = await shadowDB.getTasks(user.email);
        const autoTasks = allTasks.filter(t => t.category === 'autonomous').reverse();
        setTasks(autoTasks);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
        window.addEventListener('autonomous_status_changed', fetchTasks);
        return () => window.removeEventListener('autonomous_status_changed', fetchTasks);
    }, [user]);

    const handleDelete = async (id?: number) => {
        if (!id) return;
        await shadowDB.deleteTask(id);
        fetchTasks();
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#111] border border-fuchsia-500/30 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-[0_0_50px_rgba(217,70,239,0.15)] relative overflow-hidden font-['Cairo']" dir="rtl">
                <div className="flex items-center justify-between p-6 border-b border-fuchsia-500/10 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30">
                            <Bot className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">إدارة المهام المستقلة</h2>
                            <p className="text-[10px] text-fuchsia-300 mt-1 uppercase tracking-widest">Autonomous Core</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <RefreshCw className="w-6 h-6 text-fuchsia-500 animate-spin" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                            <Bot className="w-12 h-12 opacity-50" />
                            <p className="text-sm font-bold">لا توجد مهام مستقلة قيد التشغيل حالياً.</p>
                        </div>
                    ) : (
                        tasks.map((t, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/10">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-sm font-bold text-white leading-relaxed flex-1">{t.task}</h3>
                                    <div className="pr-4 shrink-0">
                                        {t.status === 'done' ? (
                                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> مكتملة
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-bold rounded border border-fuchsia-500/20 flex items-center gap-1 animate-pulse">
                                                <PlayCircle className="w-3 h-3" /> جاري التنفيذ...
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 text-[10px] text-white/40 border-t border-white/5 pt-3">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(t.time).toLocaleString('ar-EG')}
                                    </div>
                                    <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-300 font-bold">
                                        حذف السجل
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
