import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Camera, Monitor, MessageSquare, Video, X, Loader2, Maximize, Send, Paperclip } from 'lucide-react';
import { getShadowResponse, playShadowVoice, stopVoice, resumeAudioContext } from '../services/geminiService';
import { motion } from 'motion/react';
import { ShadowFace } from './ShadowFace';
import { shadowDB, DBMessage } from '../services/dbService';

interface FloatingShadowAvatarProps {
    user: any;
    onNavigateChat: () => void;
    hide?: boolean;
}

export const FloatingShadowAvatar: React.FC<FloatingShadowAvatarProps> = ({ user, onNavigateChat, hide }) => {
    const [tapCount, setTapCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mode, setMode] = useState<'idle' | 'recording' | 'vision' | 'camera' | 'thinking' | 'speaking'>('idle');
    const [currentAction, setCurrentAction] = useState<string>('');
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    
    const clickTimeout = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const navigate = useNavigate();
    const location = useLocation();

    const [showQuickInput, setShowQuickInput] = useState(false);
    const [quickInputText, setQuickInputText] = useState('');

    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream, mode]);

    const stopAllModes = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(t => t.stop());
            setMediaStream(null);
        }
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e){}
        }
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        stopVoice();
        setMode('idle');
        setCurrentAction('');
        setShowQuickInput(false);
        setQuickInputText('');
    };

    const handleTap = () => {
        if (mode !== 'idle' && mode !== 'camera' && mode !== 'vision') {
            return; // Don't process taps while recording/thinking/speaking
        }

        if (mode === 'camera' || mode === 'vision') {
            if (mode === 'camera') {
                setIsFrontCamera(!isFrontCamera);
                startCamera(!isFrontCamera);
            }
            return;
        }

        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 200);

        setTapCount(prev => prev + 1);

        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
        }

        clickTimeout.current = setTimeout(() => {
            executeAction(tapCount + 1);
            setTapCount(0);
        }, 400);
    };

    const processAudioText = async (text: string, playAudioReply: boolean = true) => {
        if (!text.trim()) {
            setCurrentAction('مفيش حاجة اتهيألي');
            setTimeout(stopAllModes, 2000);
            return;
        }

        setMode('thinking');
        setCurrentAction('جاري التفكير...');
        setShowQuickInput(false);

        try {
            const userMsg: DBMessage = {
                id: Date.now(),
                role: 'user',
                text: text,
                timestamp: Date.now(),
                userId: user.email || 'GUEST',
            };
            await shadowDB.saveMessage(userMsg);
            window.dispatchEvent(new CustomEvent('shadow_new_message', { detail: userMsg }));

            const response = await getShadowResponse([], text, undefined, user);
            
            const modelMsg: DBMessage = {
                id: Date.now(),
                role: 'model',
                text: response.text,
                timestamp: Date.now(),
                userId: user.email || 'GUEST',
            };
            await shadowDB.saveMessage(modelMsg);
            window.dispatchEvent(new CustomEvent('shadow_new_message', { detail: modelMsg }));

            if (playAudioReply) {
                setMode('speaking');
                setCurrentAction('المايسترو بيتكلم...');
                await playShadowVoice(response.text, user.voicePreference || 'male', undefined, stopAllModes);
            } else {
                stopAllModes();
                // Brief success action
                setCurrentAction('رديت جوه الشات 😎');
                setTimeout(() => setCurrentAction(''), 3000);
            }
        } catch(err) {
            setCurrentAction('حصلت مشكلة!');
            setTimeout(stopAllModes, 2000);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleQuickSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hasContent = quickInputText.trim() || selectedFile;
        if (hasContent) {
            // Include file handling logic if selectedFile exists (stubbed or passed to processAudioText)
            processAudioText(quickInputText || 'شوف دي كده', true);
            setQuickInputText('');
            setSelectedFile(null);
            setShowQuickInput(false);
        }
    };

    const startRecording = async () => {
        setMode('recording');
        setCurrentAction('المايسترو بيسمعك...');
        try {
            await resumeAudioContext();
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setCurrentAction('التعرف على الصوت غير مدعوم');
                setTimeout(stopAllModes, 2000);
                return;
            }
            const rec = new SpeechRecognition();
            rec.lang = 'ar-EG';
            rec.continuous = true;
            rec.interimResults = true;
            recognitionRef.current = rec;

            let finalAccumulated = '';
            let isProcessed = false;

            const resetSilenceTimeout = (currentText: string) => {
                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = setTimeout(() => {
                    if (!isProcessed) {
                        isProcessed = true;
                        try { rec.stop(); } catch(e){}
                        processAudioText(currentText);
                    }
                }, 5000);
            };

            rec.onresult = (e: any) => {
                let interim = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) {
                    if (e.results[i].isFinal) {
                        finalAccumulated += e.results[i][0].transcript + ' ';
                    } else {
                        interim += e.results[i][0].transcript;
                    }
                }
                const currentText = (finalAccumulated + interim).trim();
                
                // Show a brief version of what's being heard
                if (currentText.length > 20) {
                    setCurrentAction('... ' + currentText.substring(currentText.length - 20));
                } else {
                    setCurrentAction('بيسمعك: ' + currentText);
                }

                resetSilenceTimeout(currentText);
            };

            rec.onend = () => {
                if (!isProcessed && mode === 'recording') {
                    isProcessed = true;
                    processAudioText(finalAccumulated);
                }
            };

            rec.start();
            // Start initial 5-second silence timer in case nothing is said at all
            resetSilenceTimeout('');
        } catch(e) {
            setCurrentAction('تم رفض المايك!');
            setTimeout(stopAllModes, 2000);
        }
    };

    const startCamera = async (front: boolean = true) => {
        setMode('camera');
        setCurrentAction('عيون المايسترو (اضغط للتبديل)');
        try {
            if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: front ? 'user' : 'environment' },
                audio: false
            });
            setMediaStream(stream);
        } catch(e) {
            setCurrentAction('مش قادر افتح الكاميرا!');
            setTimeout(stopAllModes, 2000);
        }
    };

    const startVision = async () => {
        setMode('vision');
        setCurrentAction('تحليل الشاشة...');
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            setMediaStream(stream);
        } catch(e) {
            setCurrentAction('تم إلغاء الشاشة');
            setTimeout(stopAllModes, 2000);
        }
    };

    const executeAction = (taps: number) => {
        if (taps === 1) {
            setShowQuickInput(!showQuickInput);
        } else if (taps === 2) {
            startRecording();
        } else if (taps === 3) {
            startVision();
        } else if (taps >= 4) {
            setIsFrontCamera(true);
            startCamera(true);
        }
    };

    // Do not show widget if explicitly hidden or inside chat page as a fallback
    if (hide || !user || location.pathname === '/chat' || location.pathname.startsWith('/chat/')) return null;

    let shadowFaceStatus: 'idle' | 'listening' | 'speaking' | 'thinking' = 'idle';
    if (mode === 'recording') shadowFaceStatus = 'listening';
    if (mode === 'thinking') shadowFaceStatus = 'thinking';
    if (mode === 'speaking') shadowFaceStatus = 'speaking';

    return (
        <motion.div 
            drag 
            dragMomentum={false}
            className="fixed bottom-6 left-6 z-[9999] flex flex-col items-center font-['Cairo'] no-canvas-pan"
        >
            {/* Live Media Overlay */}
            {(mode === 'camera' || mode === 'vision') && mediaStream && (
                <div className="absolute bottom-[90px] left-0 w-48 h-64 bg-black rounded-3xl border-2 border-purple-500 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.5)] animate-in slide-in-from-bottom-5">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <button onClick={stopAllModes} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500">
                        <X className="w-4 h-4" />
                    </button>
                    {mode === 'camera' && (
                        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/70 font-bold drop-shadow-md">
                            اضغط على وجه المايسترو للتبديل (أمامية/خلفية)
                        </div>
                    )}
                </div>
            )}

            {currentAction && (
                <div className={`mb-3 flex items-center justify-between gap-3 text-xs font-bold px-4 py-2 rounded-full border shadow-lg backdrop-blur-xl animate-in fade-in ${mode === 'recording' || mode === 'speaking' ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-black/80 border-cyan-500 text-cyan-200'}`}>
                    <span className="max-w-[120px] truncate">{currentAction}</span>
                    {mode !== 'idle' && mode !== 'thinking' && mode !== 'speaking' && (
                        <button onClick={(e) => { e.stopPropagation(); stopAllModes(); }} className="text-white/50 hover:text-white bg-white/10 rounded-full p-1">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}
            
            {/* Quick Input Popup */}
            {showQuickInput && mode === 'idle' && (
                <div className="absolute bottom-[85px] right-0 w-80 bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-2 flex flex-col gap-2 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-in slide-in-from-bottom-5 z-[99999]" onPointerDown={(e) => e.stopPropagation()}>
                    {selectedFile && (
                        <div className="flex items-center justify-between bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-500/20 mx-1 mt-1">
                            <span className="text-xs text-purple-200 truncate pr-4">{selectedFile.name}</span>
                            <button onClick={() => setSelectedFile(null)} className="text-purple-300 hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setSelectedFile(e.target.files[0]);
                                }
                            }}
                        />
                        <button onClick={() => fileInputRef.current?.click()} type="button" className="p-2 text-white/50 hover:text-purple-400 bg-white/5 rounded-xl transition-colors">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <form onSubmit={handleQuickSubmit} className="flex-1 flex gap-2">
                            <input 
                                type="text" 
                                value={quickInputText}
                                onChange={(e) => setQuickInputText(e.target.value)}
                                placeholder="أسأل المايسترو..."
                                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                                autoFocus
                            />
                            <button type="submit" disabled={!quickInputText.trim() && !selectedFile} className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition-colors">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="relative">
                <div 
                    onClick={handleTap}
                    className={`relative group w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 ${isAnimating ? 'scale-90' : 'scale-100'} shadow-[0_0_35px_rgba(168,85,247,0.4)] overflow-hidden cursor-move`}
                >
                    {/* Active radar ping effect */}
                    <div className={`absolute inset-0 rounded-full border ${mode === 'recording' ? 'border-red-500 bg-red-500/10 animate-ping opacity-30' : 'border-purple-500 opacity-20'}`}></div>
                    
                    {/* Rotating ring */}
                    <div className={`absolute inset-[-10%] rounded-full border-t-2 ${mode === 'recording' ? 'border-red-400' : 'border-purple-300'} opacity-50 ${mode !== 'idle' ? 'animate-[spin_2s_linear_infinite]' : ''}`}></div>
                    
                    <ShadowFace 
                        appStatus={shadowFaceStatus}
                        size="small"
                        className="!w-full !h-full rounded-full !border-0 !shadow-none !bg-transparent scale-125"
                    />
                    
                    <div className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-black z-20 ${mode === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                </div>
                
                {/* Floating tooltips */}
                {mode === 'idle' && !currentAction && (
                    <div className="absolute left-[85px] top-1/2 -translate-y-1/2 w-[180px] opacity-0 group-hover:opacity-100 transition-all pointer-events-none text-right">
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-[10px] text-white/80 leading-relaxed shadow-xl">
                            <span className="block font-bold text-purple-400 mb-1">المايسترو معاك:</span>
                            • لمسة: شات<br/>
                            • لمستين: تسجيل صوتي<br/>
                            • 3 لمسات: مشاركة الشاشة<br/>
                            • 4 لمسات: رؤية الكاميرا<br/>
                            <span className="text-white/50 text-[8px] mt-1 block">(اسحبني لتحريكي)</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
