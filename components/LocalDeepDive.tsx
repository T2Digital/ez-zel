import React, { useState, useEffect } from 'react';
import { Cpu, X, Download, ShieldCheck, WifiOff, Terminal, Play, Loader2 } from 'lucide-react';

export const LocalDeepDive: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [modelState, setModelState] = useState<'not_downloaded' | 'downloading' | 'ready'>('not_downloaded');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [input, setInput] = useState('');

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleDownload = () => {
        setModelState('downloading');
        addLog('Initiating WebGPU check...');
        setTimeout(() => addLog('WebGPU supported. Requesting Local LLM (Llama 3 8B 4-bit config)...'), 500);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 5 + 2;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setModelState('ready');
                addLog('Model downloaded and loaded into VRAM securely.');
            }
            setDownloadProgress(progress);
        }, 300);
    };

    const handleSimulateInference = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || modelState !== 'ready') return;
        
        const q = input;
        setInput('');
        addLog(`User: ${q}`);
        addLog('Generating response offline (0 tokens/sec)...');
        
        setTimeout(() => {
            addLog(`Shadow (Local): تم معالجة طلبك محلياً بشكل كامل وبدون إنترنت. القرار: آمن.`);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#111] border border-emerald-500/20 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden font-['Cairo']" dir="rtl">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                            <Cpu className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                وضع المحاكي المحلي (Offline Local Deep-Dive)
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> آمن ومغلق
                                </span>
                            </h2>
                            <p className="text-[10px] text-emerald-300/70 font-mono tracking-widest mt-1">
                                ZERO-NETWORK ENVIRONMENT ACTIVE
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    
                    {/* Left Sidebar Status */}
                    <div className="w-full md:w-64 border-l border-white/5 bg-black/60 p-6 flex flex-col gap-6">
                        <div>
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <WifiOff className="w-4 h-4 text-emerald-400" /> الحالة المتصلة
                            </h3>
                            <div className="space-y-3 font-mono text-xs">
                                <div className="flex justify-between">
                                    <span className="text-white/50">Model</span>
                                    <span className="text-emerald-400">Llama 3 8B (4-bit)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Runtime</span>
                                    <span className="text-white">WebGPU</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">VRAM Est.</span>
                                    <span className="text-white">4.8 GB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Network</span>
                                    <span className="text-red-400 font-bold">DISABLED</span>
                                </div>
                            </div>
                        </div>

                        {modelState === 'not_downloaded' && (
                            <button onClick={handleDownload} className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                                <Download className="w-4 h-4" /> تحميل المودل للذاكرة
                            </button>
                        )}

                        {modelState === 'downloading' && (
                            <div className="mt-auto">
                                <div className="flex justify-between text-xs font-mono text-emerald-400 mb-2">
                                    <span>جاري التحميل...</span>
                                    <span>{Math.floor(downloadProgress)}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                                </div>
                            </div>
                        )}

                        {modelState === 'ready' && (
                            <div className="mt-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> المودل جاهز للعمل أوفلاين
                            </div>
                        )}
                    </div>

                    {/* Right Terminal Area */}
                    <div className="flex-1 flex flex-col p-6 bg-black/80 relative">
                        <div className="flex items-center gap-2 text-white/30 text-xs font-mono mb-4">
                            <Terminal className="w-4 h-4" /> System Logs (Local Instance)
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs text-white/70 mb-4 scrollbar-thin scrollbar-thumb-white/10">
                            {logs.map((log, i) => (
                                <div key={i} className={log.includes('Shadow (Local):') ? 'text-emerald-400' : 'text-emerald-200/50'}>
                                    {log}
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-white/20 italic">Waiting for model initialization...</div>
                            )}
                        </div>

                        <form onSubmit={handleSimulateInference} className="flex gap-2">
                            <input 
                                type="text"
                                value={input}
                                onChange={(e)=>setInput(e.target.value)}
                                disabled={modelState !== 'ready'}
                                placeholder={modelState === 'ready' ? "تحدث مع الظل بدون إنترنت..." : "يجب تحميل المودل أولاً"}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
                            />
                            <button disabled={modelState !== 'ready'} type="submit" className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 font-bold rounded-xl transition-all">
                                <Play className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};
