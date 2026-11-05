import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, StopCircle, Zap, Camera } from 'lucide-react';
import { UserProfile } from '../../services/dbService';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const sub = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(sub));
    }
    return btoa(binary);
}

function base64ToInt16Array(base64: string): Int16Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
}

function downsampleTo16kHz(input: Float32Array, inputSampleRate: number): Int16Array {
    if (inputSampleRate === 16000) {
        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return pcm16;
    }
    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(input.length / ratio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
        let accum = 0;
        let count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
            accum += input[i];
            count++;
        }
        const sample = count > 0 ? accum / count : 0;
        const clamped = Math.max(-1, Math.min(1, sample));
        result[offsetResult] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}

export const LiveSessionModal: React.FC<{ user: UserProfile, onClose: () => void }> = ({ user, onClose }) => {
    const [isLive, setIsLive] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [useCamera, setUseCamera] = useState(false);
    const [audioData, setAudioData] = useState<number[]>(new Array(10).fill(10));
    
    const logsEndRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const videoIntervalRef = useRef<number | null>(null);
    const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const nextStartTimeRef = useRef<number>(0);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    const clearPlaybackQueue = () => {
        for (const src of activeSourcesRef.current) {
            try {
                src.stop();
                src.disconnect();
            } catch {}
        }
        activeSourcesRef.current = [];
        if (playbackContextRef.current) {
            nextStartTimeRef.current = playbackContextRef.current.currentTime;
        } else {
            nextStartTimeRef.current = 0;
        }
    };

    const enqueuePcm24kAudio = (base64Pcm: string) => {
        const ctx = playbackContextRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const int16 = base64ToInt16Array(base64Pcm);
        if (int16.length === 0) return;

        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
        audioBuffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
        source.start(startAt);
        nextStartTimeRef.current = startAt + audioBuffer.duration;
        activeSourcesRef.current.push(source);

        source.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        };
    };

    const processAudio = () => {
        if (!analyzerRef.current) return;
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        const step = Math.floor(dataArray.length / 10);
        const newAudioData = [];
        for (let i = 0; i < 10; i++) {
            const val = dataArray[i * step];
            newAudioData.push(Math.max(5, (val / 255) * 100));
        }
        setAudioData(newAudioData);
        animationFrameRef.current = requestAnimationFrame(processAudio);
    };

    const cleanupResources = () => {
        if (videoIntervalRef.current) {
            window.clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (processorRef.current) {
            try {
                processorRef.current.disconnect();
            } catch {}
            processorRef.current = null;
        }
        clearPlaybackQueue();
        if (wsRef.current) {
            try {
                wsRef.current.close();
            } catch {}
            wsRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (playbackContextRef.current) {
            playbackContextRef.current.close().catch(() => {});
            playbackContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setAudioData(new Array(10).fill(5));
    };

    const startLive = async () => {
        try {
            setIsLive(true);
            addLog("يتم طلب صلاحيات الميكروفون والكاميرا...");
            
            const constraints: MediaStreamConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: useCamera ? { facingMode: "user" } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            addLog("تم الاتصال بالصوت" + (useCamera ? " والصورة" : "") + " بنجاح.");
            
            if (useCamera && videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
            playbackContextRef.current = new AudioCtx({ sampleRate: 24000 });
            nextStartTimeRef.current = playbackContextRef.current.currentTime;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 64;
            source.connect(analyzerRef.current);
            processAudio();

            addLog("جاري الاتصال بخوادم الظل (Gemini Live API)...");

            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const voiceParam = encodeURIComponent(user?.voicePreference || 'male');
            const nameParam = encodeURIComponent(user?.name || '');
            const wsUrl = `${wsProtocol}//${window.location.host}/api/gemini/live?voice=${voiceParam}&user=${nameParam}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                // Stream 16kHz PCM microphone audio to the server
                if (!audioContextRef.current) return;
                const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                const inputRate = audioContextRef.current.sampleRate;

                processor.onaudioprocess = (event) => {
                    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
                    const inputChannel = event.inputBuffer.getChannelData(0);
                    const pcm16 = downsampleTo16kHz(inputChannel, inputRate);
                    const base64Audio = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
                    wsRef.current.send(JSON.stringify({ audio: base64Audio }));
                };

                source.connect(processor);
                processor.connect(audioContextRef.current.destination);

                // Stream 1 FPS JPEG camera frames if Vision Context is enabled
                if (useCamera) {
                    const canvas = document.createElement('canvas');
                    const ctx2d = canvas.getContext('2d');
                    videoIntervalRef.current = window.setInterval(() => {
                        const vid = videoRef.current;
                        if (!vid || !ctx2d || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
                        if (vid.videoWidth === 0 || vid.videoHeight === 0) return;
                        const targetW = Math.min(640, vid.videoWidth);
                        const targetH = Math.round((vid.videoHeight / vid.videoWidth) * targetW);
                        canvas.width = targetW;
                        canvas.height = targetH;
                        ctx2d.drawImage(vid, 0, 0, targetW, targetH);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
                        const base64Jpeg = dataUrl.split(',')[1];
                        if (base64Jpeg) {
                            wsRef.current.send(JSON.stringify({ video: base64Jpeg }));
                        }
                    }, 1000);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.status === 'connected') {
                        addLog("✅ تم تنشيط الاتصال المستمر. يمكنك التحدث الآن.");
                    } else if (msg.interrupted) {
                        clearPlaybackQueue();
                    } else if (msg.audio) {
                        enqueuePcm24kAudio(msg.audio);
                    } else if (msg.inputTranscript) {
                        addLog(`🎤 أنت: ${msg.inputTranscript}`);
                    } else if (msg.outputTranscript) {
                        addLog(`⚡ الظل: ${msg.outputTranscript}`);
                    } else if (msg.error) {
                        addLog(`❌ خطأ من السيرفر: ${msg.error}`);
                    }
                } catch {}
            };

            ws.onerror = () => {
                addLog("❌ تعذر الاتصال بجسر البث الحي على الخادم.");
            };

            ws.onclose = () => {
                setIsLive((currentlyLive) => {
                    if (currentlyLive) {
                        addLog("تم إنهاء اتصال البث الحي.");
                        cleanupResources();
                    }
                    return false;
                });
            };

        } catch (error: any) {
            addLog(`❌ حدث خطأ أثناء الوصول للصلاحيات: ${error.message}`);
            cleanupResources();
            setIsLive(false);
        }
    };

    const stopLive = () => {
        setIsLive(false);
        addLog("جاري إنهاء الاتصال وقطع الموارد...");
        cleanupResources();
        setTimeout(() => {
            addLog("تم إغلاق الجلسة بنجاح.");
        }, 300);
    };

    useEffect(() => {
        return () => {
            cleanupResources();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-blue-500/20 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.1)] relative overflow-hidden font-['Cairo']">
                
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                            <Zap className={`w-5 h-5 ${isLive ? 'text-yellow-400 animate-pulse' : 'text-blue-400'}`} />
                        </div>
                        <h2 className="text-lg font-black text-white">جلسة الظل الحية (Live Stream)</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 min-h-0">
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-black border border-white/10 rounded-xl relative overflow-hidden h-48 lg:h-full flex items-center justify-center shadow-inner">
                            {useCamera ? (
                                <>
                                    <video 
                                        ref={videoRef}
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        className="w-full h-full object-cover"
                                    />
                                    {!isLive && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm transition-all text-white/50">
                                            <Camera className="w-8 h-8 opacity-50" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-white/20 flex flex-col items-center gap-3">
                                    <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Mic className={`w-10 h-10 ${isLive ? 'text-blue-400 animate-pulse' : 'text-white/30'}`} />
                                    </div>
                                    <span className="text-sm font-mono tracking-widest">{isLive ? "AUDIO_STREAMING" : "CAMERA_OFF"}</span>
                                </div>
                            )}
                            
                            {/* Visualizer Overlay */}
                            {isLive && (
                                <div className="absolute bottom-4 left-0 right-0 flex gap-1 h-12 items-end justify-center px-4 mix-blend-screen drop-shadow-md opacity-80">
                                    {audioData.map((val, i) => (
                                        <div 
                                            key={i}
                                            className="w-2 bg-blue-400 rounded-t-sm transition-all duration-75"
                                            style={{ height: `${val}%` }}
                                        ></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 flex flex-col gap-4">
                        <div className="bg-black/50 border border-white/10 rounded-xl flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
                            {logs.length === 0 && (
                                <div className="text-center text-white/30 h-full flex items-center justify-center">
                                    اضغط "بدء الجلسة" لتفعيل الاتصال المستمر ثنائي الاتجاه بالصوت والصورة مع الظل.
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="text-blue-300/80 border-l border-blue-500/20 pl-2">
                                    {log}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 shrink-0 bg-[#0a0a0a]">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
                            <input 
                                type="checkbox" 
                                checked={useCamera} 
                                onChange={(e) => setUseCamera(e.target.checked)} 
                                disabled={isLive}
                                className="rounded border-white/20 bg-black/50"
                            />
                            <Camera className="w-4 h-4" /> تفعيل الكاميرا (Vision Context)
                        </label>
                        
                        {isLive ? (
                            <button onClick={stopLive} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all">
                                <StopCircle className="w-5 h-5" /> إنهاء الجلسة 
                            </button>
                        ) : (
                            <button onClick={startLive} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                                <Mic className="w-5 h-5" /> بدء الجلسة الحية
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
