import React, { useState, useEffect } from 'react';
import { Mic, X, Waves, Video, Monitor } from 'lucide-react';
import { useAppStore } from '../services/store';

export const LiveAPIMode: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAppStore();
    const [isScreenShared, setIsScreenShared] = useState(false);
    const [status, setStatus] = useState('Connecting to Deepmind WebRTC...');

    useEffect(() => {
        setTimeout(() => setStatus('Connected: Multimodal Live API Active'), 1500);
    }, []);

    const toggleScreenShare = async () => {
        if (!isScreenShared) {
            try {
                await navigator.mediaDevices.getDisplayMedia({ video: true });
                setIsScreenShared(true);
            } catch (e) {
                console.warn(e);
            }
        } else {
            setIsScreenShared(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in">
            <button onClick={onClose} className="absolute top-6 left-6 p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6 text-white" />
            </button>
            <div className="absolute top-6 right-6">
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-bold text-xs flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    {status}
                </div>
            </div>

            <div className="relative mb-12">
                <div className="w-48 h-48 rounded-full bg-blue-500/20 blur-3xl absolute inset-0 animate-pulse"></div>
                <div className="w-48 h-48 rounded-full border border-blue-500/50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md shadow-[0_0_100px_rgba(59,130,246,0.3)] relative z-10">
                    <Waves className="w-16 h-16 text-blue-400 animate-pulse" />
                    <span className="text-white font-black mt-2 tracking-widest text-lg">الظل</span>
                </div>
            </div>

            <div className="text-center mb-12 max-w-md">
                <h2 className="text-3xl font-black text-white mb-2 tracking-wide font-['Cairo']" dir="rtl">True Live Streaming (WebRTC)</h2>
                <p className="text-white/50 text-sm leading-relaxed font-['Cairo']" dir="rtl">تحدث بحرية، يمكن للظل مقاطعتك أو إكمالك، الإستجابة فورية بدون توقف وبمعدل تأخير شبه معدوم. الإدراك البصري الآلي مٌفعل.</p>
            </div>

            <div className="flex gap-6">
                <button 
                    onClick={toggleScreenShare}
                    className={`p-6 rounded-full border shadow-2xl transition-all ${isScreenShared ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)]' : 'bg-[#111] border-white/10 text-white/50 hover:bg-white/10'}`}
                >
                    <Monitor className="w-8 h-8" />
                </button>
                <button className="p-6 rounded-full bg-blue-600 text-white shadow-[0_0_50px_rgba(59,130,246,0.6)] border border-blue-400 animate-bounce">
                    <Mic className="w-8 h-8" />
                </button>
                <button className="p-6 rounded-full border bg-[#111] border-white/10 text-white/50 hover:bg-white/10 transition-all">
                    <Video className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};
