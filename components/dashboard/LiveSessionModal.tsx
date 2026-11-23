import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, StopCircle, Zap, Camera, Volume2, Radio, Hand } from 'lucide-react';
import { UserProfile } from '../../services/dbService';

type VoicePhase = 'idle' | 'connecting' | 'listening' | 'speaking' | 'muted';

const WORKLET_PROCESSOR_CODE = `
class Pcm16CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
  }
  process(inputs) {
    const input = inputs[0];
    if (input && input[0] && input[0].length > 0) {
      const ch = input[0];
      for (let i = 0; i < ch.length; i++) this.buffer.push(ch[i]);
      if (this.buffer.length >= 1024) {
        const chunk = new Float32Array(this.buffer.splice(0, 1024));
        this.port.postMessage(chunk, [chunk.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('pcm16-capture-processor', Pcm16CaptureProcessor);
`;

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

function computeRms(input: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    return Math.sqrt(sum / Math.max(1, input.length));
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
    const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [pushToTalkMode, setPushToTalkMode] = useState(false);
    const [isPttHolding, setIsPttHolding] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [useCamera, setUseCamera] = useState(false);
    const [audioData, setAudioData] = useState<number[]>(new Array(10).fill(10));

    const logsEndRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<AudioNode | null>(null);
    const silentGainRef = useRef<GainNode | null>(null);
    const workletBlobUrlRef = useRef<string | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const videoIntervalRef = useRef<number | null>(null);
    const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const nextStartTimeRef = useRef<number>(0);

    // Refs synced with UI state for real-time audio callback without re-binding
    const isMutedRef = useRef(false);
    const pushToTalkModeRef = useRef(false);
    const isPttHoldingRef = useRef(false);
    const isAiSpeakingRef = useRef(false);
    const lastSpeechTsRef = useRef(0);

    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { pushToTalkModeRef.current = pushToTalkMode; }, [pushToTalkMode]);
    useEffect(() => { isPttHoldingRef.current = isPttHolding; }, [isPttHolding]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-80), `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    const clearPlaybackQueue = () => {
        for (const src of activeSourcesRef.current) {
            try {
                src.stop();
                src.disconnect();
            } catch {}
        }
        activeSourcesRef.current = [];
        isAiSpeakingRef.current = false;
        if (playbackContextRef.current) {
            nextStartTimeRef.current = playbackContextRef.current.currentTime;
        } else {
            nextStartTimeRef.current = 0;
        }
        setVoicePhase((prev) => (prev === 'speaking' ? (isMutedRef.current ? 'muted' : 'listening') : prev));
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

        const startAt = Math.max(ctx.currentTime + 0.015, nextStartTimeRef.current);
        source.start(startAt);
        nextStartTimeRef.current = startAt + audioBuffer.duration;
        activeSourcesRef.current.push(source);
        isAiSpeakingRef.current = true;
        setVoicePhase('speaking');

        source.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
            if (activeSourcesRef.current.length === 0) {
                isAiSpeakingRef.current = false;
                setVoicePhase(isMutedRef.current ? 'muted' : 'listening');
            }
        };
    };

    const processAudio = () => {
        if (!analyzerRef.current) return;
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);

        const step = Math.max(1, Math.floor(dataArray.length / 10));
        const newAudioData = [];
        for (let i = 0; i < 10; i++) {
            const val = dataArray[i * step] || 0;
            newAudioData.push(Math.max(6, (val / 255) * 100));
        }
        setAudioData(newAudioData);
        animationFrameRef.current = requestAnimationFrame(processAudio);
    };

    const sendAudioChunk = (inputChannel: Float32Array, inputRate: number) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (isMutedRef.current) return;
        if (pushToTalkModeRef.current && !isPttHoldingRef.current) return;

        // Smart VAD / Noise Gate + Echo Guard while Jarvis is speaking
        const rms = computeRms(inputChannel);
        const now = Date.now();
        const threshold = isAiSpeakingRef.current ? 0.032 : 0.011;
        if (rms >= threshold) {
            lastSpeechTsRef.current = now;
        }
        // Keep streaming 450ms hangover tail after speech ends so Gemini detects end-of-turn naturally
        const withinTail = now - lastSpeechTsRef.current < 450;
        if (!pushToTalkModeRef.current && rms < threshold && !withinTail) {
            return;
        }

        const pcm16 = downsampleTo16kHz(inputChannel, inputRate);
        const base64Audio = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
        wsRef.current.send(JSON.stringify({ audio: base64Audio }));
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
            try { processorRef.current.disconnect(); } catch {}
            processorRef.current = null;
        }
        if (silentGainRef.current) {
            try { silentGainRef.current.disconnect(); } catch {}
            silentGainRef.current = null;
        }
        if (workletBlobUrlRef.current) {
            URL.revokeObjectURL(workletBlobUrlRef.current);
            workletBlobUrlRef.current = null;
        }
        clearPlaybackQueue();
        if (wsRef.current) {
            try { wsRef.current.close(); } catch {}
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
        setVoicePhase('idle');
    };

    const startLive = async () => {
        try {
            setIsLive(true);
            setVoicePhase('connecting');

            // CRITICAL iOS Safari fix: create & resume playback AudioContext synchronously inside click gesture
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            playbackContextRef.current = new AudioCtx({ sampleRate: 24000 });
            if (playbackContextRef.current.state === 'suspended') {
                playbackContextRef.current.resume().catch(() => {});
            }
            nextStartTimeRef.current = playbackContextRef.current.currentTime;

            addLog("يتم طلب صلاحيات الميكروفون والكاميرا...");
            const constraints: MediaStreamConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                },
                video: useCamera ? { facingMode: "user" } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            addLog("تم الاتصال بالصوت" + (useCamera ? " والصورة" : "") + " بنجاح (عزل صدى + فلتر ضوضاء).");

            if (useCamera && videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

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

            ws.onopen = async () => {
                if (!audioContextRef.current) return;
                const ctx = audioContextRef.current;
                const inputRate = ctx.sampleRate;

                // Silent GainNode(0) prevents mic feedback/echo loop into speaker output
                const silentGain = ctx.createGain();
                silentGain.gain.value = 0;
                silentGain.connect(ctx.destination);
                silentGainRef.current = silentGain;

                // Prefer low-latency off-main-thread AudioWorklet (~64ms chunks)
                let workletReady = false;
                if (ctx.audioWorklet) {
                    try {
                        const blob = new Blob([WORKLET_PROCESSOR_CODE], { type: 'application/javascript' });
                        const blobUrl = URL.createObjectURL(blob);
                        workletBlobUrlRef.current = blobUrl;
                        await ctx.audioWorklet.addModule(blobUrl);
                        const workletNode = new AudioWorkletNode(ctx, 'pcm16-capture-processor');
                        workletNode.port.onmessage = (ev) => {
                            if (ev.data instanceof Float32Array) {
                                sendAudioChunk(ev.data, inputRate);
                            }
                        };
                        source.connect(workletNode);
                        workletNode.connect(silentGain);
                        processorRef.current = workletNode;
                        workletReady = true;
                    } catch {
                        workletReady = false;
                    }
                }

                // Graceful fallback to ScriptProcessorNode (2048 samples) routed to silent sink
                if (!workletReady) {
                    const processor = ctx.createScriptProcessor(2048, 1, 1);
                    processor.onaudioprocess = (event) => {
                        sendAudioChunk(event.inputBuffer.getChannelData(0), inputRate);
                    };
                    source.connect(processor);
                    processor.connect(silentGain);
                    processorRef.current = processor;
                }

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
                        setVoicePhase(isMutedRef.current ? 'muted' : 'listening');
                        addLog("✅ الاتصال الصوتي المباشر جاهز — تكلم الآن بصوت طبيعي.");
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

    const toggleMute = () => {
        setIsMuted((prev) => {
            const next = !prev;
            if (isLive) setVoicePhase(next ? 'muted' : (isAiSpeakingRef.current ? 'speaking' : 'listening'));
            return next;
        });
    };

    useEffect(() => {
        return () => {
            cleanupResources();
        };
    }, []);

    const phaseMeta: Record<VoicePhase, { label: string; badgeClass: string; orbClass: string }> = {
        idle: { label: 'جاهز للبدء', badgeClass: 'bg-white/10 text-white/60 border-white/10', orbClass: 'bg-blue-500/10 border-blue-500/20' },
        connecting: { label: 'جاري الربط...', badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', orbClass: 'bg-yellow-500/20 border-yellow-400/40 animate-pulse' },
        listening: { label: pushToTalkMode ? (isPttHolding ? '🎤 يسمعك الآن...' : 'اضغط مطولاً للتحدث') : '🎤 الظل يسمعك الآن', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40', orbClass: 'bg-blue-500/25 border-blue-400/50 shadow-[0_0_40px_rgba(59,130,246,0.35)]' },
        speaking: { label: '🔊 الظل يتحدث...', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', orbClass: 'bg-emerald-500/25 border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.35)] animate-pulse' },
        muted: { label: '🔇 الميكروفون مكتوم', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', orbClass: 'bg-amber-500/15 border-amber-400/30' },
    };

    const currentPhase = phaseMeta[voicePhase];

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-blue-500/20 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.1)] relative overflow-hidden font-['Cairo']">

                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                            <Zap className={`w-5 h-5 ${isLive ? 'text-yellow-400 animate-pulse' : 'text-blue-400'}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">جلسة الظل الحية (Jarvis Voice)</h2>
                            <span className={`inline-block mt-0.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentPhase.badgeClass}`}>
                                {currentPhase.label}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 min-h-0">
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-black border border-white/10 rounded-xl relative overflow-hidden h-56 lg:h-full flex items-center justify-center shadow-inner">
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
                                <div className="text-white/70 flex flex-col items-center gap-4">
                                    <div className={`w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentPhase.orbClass}`}>
                                        {voicePhase === 'speaking' ? (
                                            <Volume2 className="w-11 h-11 text-emerald-400" />
                                        ) : voicePhase === 'muted' ? (
                                            <MicOff className="w-10 h-10 text-amber-400" />
                                        ) : (
                                            <Mic className={`w-10 h-10 ${isLive ? 'text-blue-400' : 'text-white/30'}`} />
                                        )}
                                    </div>
                                    <span className="text-xs font-bold tracking-wide text-white/60">{currentPhase.label}</span>
                                </div>
                            )}

                            {/* Visualizer Overlay */}
                            {isLive && (
                                <div className="absolute bottom-4 left-0 right-0 flex gap-1.5 h-12 items-end justify-center px-4 mix-blend-screen drop-shadow-md opacity-90">
                                    {audioData.map((val, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 rounded-t-sm transition-all duration-75 ${voicePhase === 'speaking' ? 'bg-emerald-400' : voicePhase === 'muted' ? 'bg-amber-500/40' : 'bg-blue-400'}`}
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
                                <div className="text-center text-white/40 h-full flex items-center justify-center px-4 leading-relaxed">
                                    اضغط "بدء الجلسة الحية" للتحدث المباشر مع الظل بصوت نقي واستجابة فورية (مع عزل الصدى وفلتر الضوضاء).
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="text-blue-200/90 border-r-2 border-blue-500/30 pr-2.5 leading-relaxed">
                                    {log}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 shrink-0 bg-[#0a0a0a]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white">
                                <input
                                    type="checkbox"
                                    checked={useCamera}
                                    onChange={(e) => setUseCamera(e.target.checked)}
                                    disabled={isLive}
                                    className="rounded border-white/20 bg-black/50"
                                />
                                <Camera className="w-4 h-4" /> كاميرا
                            </label>

                            <button
                                type="button"
                                onClick={() => setPushToTalkMode((v) => !v)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${pushToTalkMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'}`}
                                title="وضع اضغط وتكلم مفيد في الأماكن الصاخبة"
                            >
                                <Radio className="w-3.5 h-3.5" />
                                {pushToTalkMode ? 'وضع: اضغط وتكلم' : 'وضع: حر (Hands-Free)'}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isLive && pushToTalkMode && (
                                <button
                                    type="button"
                                    onMouseDown={() => setIsPttHolding(true)}
                                    onMouseUp={() => setIsPttHolding(false)}
                                    onMouseLeave={() => setIsPttHolding(false)}
                                    onTouchStart={(e) => { e.preventDefault(); setIsPttHolding(true); }}
                                    onTouchEnd={() => setIsPttHolding(false)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all select-none ${isPttHolding ? 'bg-blue-500 text-white scale-95 shadow-lg shadow-blue-500/30' : 'bg-blue-600/20 text-blue-300 border border-blue-500/40'}`}
                                >
                                    <Mic className="w-4 h-4" /> {isPttHolding ? 'جاري الاستماع...' : 'اضغط مطولاً للتحدث'}
                                </button>
                            )}

                            {isLive && (
                                <>
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${isMuted ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'}`}
                                    >
                                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        {isMuted ? 'إلغاء الكتم' : 'كتم'}
                                    </button>
                                    {voicePhase === 'speaking' && (
                                        <button
                                            type="button"
                                            onClick={clearPlaybackQueue}
                                            className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
                                        >
                                            <Hand className="w-4 h-4" /> مقاطعة
                                        </button>
                                    )}
                                    <button onClick={stopLive} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all">
                                        <StopCircle className="w-4 h-4" /> إنهاء
                                    </button>
                                </>
                            )}

                            {!isLive && (
                                <button onClick={startLive} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                                    <Mic className="w-5 h-5" /> بدء الجلسة الحية
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
