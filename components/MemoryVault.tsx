import React, { useEffect, useState, useRef } from 'react';
import { Brain, Trash2, X, Activity, Plus, Save, Database, Shield, FileText, Cloud, Download, Upload } from 'lucide-react';
import { useAppStore } from '../services/store';
import { shadowDB } from '../services/dbService';
import { memorizeFact } from '../services/geminiService';

export const MemoryVault: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, setUser } = useAppStore();
    const [activeTab, setActiveTab] = useState<'facts' | 'rules' | 'context' | 'backup'>('facts');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Facts State
    const [memories, setMemories] = useState<any[]>([]);
    const [loadingFacts, setLoadingFacts] = useState(true);
    const [newFact, setNewFact] = useState('');

    // Rules State
    const [rules, setRules] = useState('');
    const [savingRules, setSavingRules] = useState(false);

    // Context State
    const [context, setContext] = useState('');
    const [savingContext, setSavingContext] = useState(false);

    const loadData = async () => {
        if (user?.email) {
            // Load facts
            const mems = await shadowDB.getMemory(user.email);
            setMemories(mems.filter(m => m.fact).reverse());
            
            // Load Context
            setContext(user.longTermMemory || '');
        }
        setLoadingFacts(false);
        
        // Load Rules
        const globalRules = await shadowDB.getGlobalRules();
        setRules(globalRules || '');
    };

    useEffect(() => {
        loadData();
    }, [user, activeTab]);

    const handleDeleteFact = async (id: number) => {
        await shadowDB.deleteMemory(id);
        setMemories(prev => prev.filter(m => m.id !== id));
    };

    const handleAddFact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFact.trim() || !user || user.email === 'GUEST') return;
        
        await memorizeFact(user.email, newFact.trim());
        setNewFact('');
        loadData();
    };

    const handleSaveRules = async () => {
        setSavingRules(true);
        await shadowDB.updateGlobalRules(rules);
        setSavingRules(false);
    };

    const handleSaveContext = async () => {
        if (!user || user.email === 'GUEST') return;
        setSavingContext(true);
        const updatedUser = { ...user, longTermMemory: context };
        await shadowDB.saveProfile(updatedUser);
        setUser(updatedUser);
        setSavingContext(false);
    };

    const handleExportBackup = async () => {
        if (!user?.email) return;
        try {
            const profiles = await shadowDB.getProfile(user.email);
            const history = await shadowDB.getHistory(user.email);
            const rules = await shadowDB.getGlobalRules();
            const memory = await shadowDB.getMemory(user.email);
            
            const backupData = {
                timestamp: Date.now(),
                version: '1.0',
                profiles: [profiles],
                history,
                rules,
                memory
            };
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shadow_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('تم استخراج النسخة الاحتياطية بنجاح.');
        } catch (e: any) {
            alert('خطأ أثناء التصدير: ' + e.message);
        }
    };

    const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.profiles && data.profiles.length > 0) {
                    await shadowDB.saveProfile(data.profiles[0]);
                }
                if (data.rules) {
                    await shadowDB.updateGlobalRules(data.rules);
                }
                alert('تم استيراد النسخة الاحتياطية بنجاح.');
                loadData();
            } catch (error) {
                alert('الملف غير صالح أو مشوه.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#111] border border-fuchsia-500/20 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(217,70,239,0.1)] relative overflow-hidden font-['Cairo']" dir="rtl">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                            <Brain className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">خزانة الذاكرة (Memory Vault)</h2>
                            <p className="text-[10px] text-fuchsia-300 font-mono tracking-widest mt-1 flex items-center gap-1">
                                <Activity className="w-3 h-3 animate-pulse" /> Shadow SLM Database Management
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-[#0d0d0d] px-4 overflow-x-auto scrollbar-hide">
                    <button 
                        onClick={() => setActiveTab('facts')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'facts' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Database className="w-4 h-4" /> الحقائق المستخرجة
                    </button>
                    <button 
                        onClick={() => setActiveTab('rules')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'rules' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Shield className="w-4 h-4" /> القوانين التأسيسية
                    </button>
                    <button 
                        onClick={() => setActiveTab('context')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'context' ? 'border-amber-500 text-amber-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <FileText className="w-4 h-4" /> سياق الماستر
                    </button>
                    <button 
                        onClick={() => setActiveTab('backup')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'backup' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Cloud className="w-4 h-4" /> تزامن ونسخ
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-[#0a0a0a] relative">
                    {/* FACTS TAB */}
                    {activeTab === 'facts' && (
                        <div className="flex flex-col h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                            <div className="p-4 border-b border-white/5 bg-black/50 sticky top-0 z-10">
                                <form onSubmit={handleAddFact} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newFact}
                                        onChange={(e) => setNewFact(e.target.value)}
                                        placeholder="أضف حقيقة أو معلومة جديدة يدوياً..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                                    />
                                    <button type="submit" disabled={!newFact.trim()} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                                        <Plus className="w-4 h-4" /> إضافة
                                    </button>
                                </form>
                            </div>
                            
                            <div className="p-4 space-y-3">
                                {loadingFacts ? (
                                    <div className="flex justify-center py-10 text-white/30 text-xs">جاري تحميل الذاكرة...</div>
                                ) : memories.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-2">
                                        <Database className="w-12 h-12 opacity-50" />
                                        <p className="text-sm font-bold">لاتوجد حقائق مستخرجة حتى الآن.</p>
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
                                            <button onClick={() => handleDeleteFact(m.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 min-w-10 flex justify-center items-center">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* RULES TAB */}
                    {activeTab === 'rules' && (
                        <div className="flex flex-col h-full p-4 gap-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-200">
                                القوانين التأسيسية هي التعليمات الجذرية التي تحدد كيف يتصرف الظل الرقمي (المايسترو). قم بتعديلها لتغيير سلوكه الأساسي بالكامل.
                            </div>
                            <textarea
                                value={rules}
                                onChange={e => setRules(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-blue-100 font-mono focus:border-blue-500/50 outline-none resize-none"
                                placeholder="اكتب القوانين الأساسية هنا..."
                            />
                            <div className="flex justify-end pt-2">
                                <button onClick={handleSaveRules} disabled={savingRules} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2">
                                    {savingRules ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    حفظ القوانين
                                </button>
                            </div>
                        </div>
                    )}

                    {/* CONTEXT TAB */}
                    {activeTab === 'context' && (
                        <div className="flex flex-col h-full p-4 gap-4">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-200">
                                هذا هو سياقك الشخصي (Long-Term Memory). كل ما يستنتجه النظام عن شخصيتك وعملك يتم تخزينه هنا لتوجيه الإجابات لتناسبك.
                            </div>
                            <textarea
                                value={context}
                                onChange={e => setContext(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-amber-100 font-sans leading-loose focus:border-amber-500/50 outline-none resize-none"
                                placeholder="سياق المستخدم..."
                            />
                            <div className="flex justify-end pt-2">
                                <button onClick={handleSaveContext} disabled={savingContext || !user || user.email === 'GUEST'} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2">
                                    {savingContext ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    حفظ السياق
                                </button>
                            </div>
                        </div>
                    )}

                    {/* BACKUP TAB */}
                    {activeTab === 'backup' && (
                        <div className="flex flex-col h-full p-6 gap-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-200">
                                نظام الظل المعرفي يعمل بالكامل محلياً لضمان أفضل خصوصية. احرص على أخذ نسخة احتياطية بشكل دوري لتتمكن من استخدام الظل على أجهزة أخرى.
                            </div>
                            
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".json" 
                                ref={fileInputRef} 
                                onChange={handleImportBackup} 
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors cursor-pointer" onClick={handleExportBackup}>
                                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 text-blue-400">
                                        <Download className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">تصدير العقل (Export)</h3>
                                    <p className="text-white/50 text-xs">تحميل ملف مشفر يحتوي على ذاكرتك الكاملة وتفضيلاتك</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-16 h-16 bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-2 text-fuchsia-400">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">حقن العقل (Import)</h3>
                                    <p className="text-white/50 text-xs">رفع ملف الذاكرة المعرفية لاستعادة بياناتك على هذا الجهاز</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

