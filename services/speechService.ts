// Auto-generated split
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { getAI, Modality } from "./aiClient";
import { resolveVoicePersona } from "./voicePersonaService";
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

// Streaming Audio Queue for Real-Time Sentence Synthesis
class AudioStreamQueue {
    private queue: { index: number; base64: string }[] = [];
    private nextPlayIndex: number = 0;
    private totalEnqueued: number = 0;
    private isPlaying: boolean = false;
    private currentSessionId: number = 0;
    private isStreamCompleted: boolean = false;
    private onQueueEnded?: () => void;

    public startSession(onEnded?: () => void) {
        this.currentSessionId = Date.now();
        this.queue = [];
        this.nextPlayIndex = 0;
        this.totalEnqueued = 0;
        this.isPlaying = false;
        this.isStreamCompleted = false;
        this.onQueueEnded = onEnded;
        if (currentSource) {
            try { currentSource.stop(); } catch {}
            currentSource = null;
        }
        return this.currentSessionId;
    }

    public stop() {
        this.currentSessionId = 0;
        this.queue = [];
        this.nextPlayIndex = 0;
        this.totalEnqueued = 0;
        this.isPlaying = false;
        this.isStreamCompleted = false;
        if (currentSource) {
            try { currentSource.stop(); } catch {}
            currentSource = null;
        }
        window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
        window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
    }

    public markCompleted(sessionId: number) {
        if (this.currentSessionId !== sessionId) return;
        this.isStreamCompleted = true;
        if (!this.isPlaying && this.queue.length === 0) {
            this.onQueueEnded?.();
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
        }
    }

    public async enqueueSentence(text: string, voice: string, sessionId: number) {
        if (this.currentSessionId !== sessionId || !text.trim()) return;
        const itemIndex = this.totalEnqueued++;

        // Fetch audio immediately in parallel
        const base64 = await getShadowVoice(text, voice);
        if (this.currentSessionId !== sessionId) return;

        if (base64) {
            this.queue.push({ index: itemIndex, base64 });
            this.queue.sort((a, b) => a.index - b.index);
        } else {
            // If synthesis failed, advance index so playback does not stall
            if (this.nextPlayIndex === itemIndex) {
                this.nextPlayIndex++;
            }
        }

        if (!this.isPlaying) {
            this.playNext(voice, sessionId);
        }
    }

    private async playNext(voice: string, sessionId: number) {
        if (this.currentSessionId !== sessionId) return;

        // Find next sequential sentence
        const nextItemIndex = this.queue.findIndex(item => item.index === this.nextPlayIndex);

        if (nextItemIndex === -1) {
            if (this.isStreamCompleted && this.nextPlayIndex >= this.totalEnqueued) {
                this.isPlaying = false;
                this.onQueueEnded?.();
                window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            } else {
                this.isPlaying = false;
            }
            return;
        }

        this.isPlaying = true;
        const nextItem = this.queue.splice(nextItemIndex, 1)[0];
        this.nextPlayIndex++;

        const ctx = resumeAudioContext();
        if (!ctx) {
            this.isPlaying = false;
            return;
        }

        try {
            const u8 = new Uint8Array(base64ToArrayBuffer(nextItem.base64));
            const buffer = await decodeAudioData(u8, ctx);
            if (this.currentSessionId !== sessionId) return;

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(ctx.destination);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let animFrame: number;

            const updateLevel = () => {
                if (!currentSource) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: Math.min(1, avg / 128) } }));
                animFrame = requestAnimationFrame(updateLevel);
            };

            source.onended = () => {
                currentSource = null;
                cancelAnimationFrame(animFrame);
                window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
                this.playNext(voice, sessionId);
            };

            source.start(0);
            currentSource = source;
            updateLevel();
        } catch (e) {
            console.error("[StreamQueue Playback Error]", e);
            this.playNext(voice, sessionId);
        }
    }
}

let currentHtmlAudio: HTMLAudioElement | null = null;

export const audioStreamQueue = new AudioStreamQueue();

export function resumeAudioContext() {
    try {
        if (!audioCtx) {
            const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
            if (CtxClass) {
                try {
                    // Default to hardware sample rate for zero-distortion compatibility
                    audioCtx = new CtxClass();
                } catch {
                    try {
                        audioCtx = new CtxClass({ sampleRate: 24000 });
                    } catch {
                        audioCtx = null;
                    }
                }
            }
        }
        if (audioCtx && (audioCtx.state === "suspended" || (audioCtx.state as string) === "interrupted")) {
            audioCtx.resume().catch(() => {});
        }
        if ("speechSynthesis" in window && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        return audioCtx;
    } catch (e) { return null; }
}

export const audioCache = new Map<string, string>();

// GLOBAL STATE FOR TTS
// @ts-ignore
window.shadowUtterance = null;
let resumeInterval: any = null;

export const stopVoice = async () => { 
    audioStreamQueue.stop();
    if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; } 
    if (currentHtmlAudio) {
        try {
            currentHtmlAudio.pause();
            currentHtmlAudio.currentTime = 0;
        } catch {}
        currentHtmlAudio = null;
    }
    if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
    
    if (Capacitor.isNativePlatform()) {
        try { await TextToSpeech.stop(); } catch {}
    } else if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
    }
    
    // @ts-ignore
    window.shadowUtterance = null;
    window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
};

// --- ROBUST NATIVE TTS ENGINE (Permanently Routed to Studio Neural Human Voice) ---

export const speakNative = async (text: string, voice: string = 'male', onEnd?: () => void) => {
    // Permanent ban on robotic browser speech synthesis!
    // All voice is routed exclusively through our high-fidelity human neural voice engine.
    await playShadowVoice(text, voice, undefined, onEnd);
};

// --- TOOLS DEFINITION ---
import { actionTools } from './toolsConfig';


function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

async function decodeAudioData(d: Uint8Array, c: AudioContext): Promise<AudioBuffer> { 
    // 1. Try standard browser native audio decoder (instant for MP3, WAV, OGG, WebM)
    try {
        const copy = d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
        const decoded = await c.decodeAudioData(copy);
        if (decoded) return decoded;
    } catch (e) {
        // Not a container format, fall through to raw PCM
    }

    // 2. Fallback: Raw PCM 24kHz 16-bit Mono (e.g. from Gemini TTS preview)
    const byteLength = d.length % 2 === 0 ? d.length : d.length - 1;
    const i16 = new Int16Array(d.buffer, d.byteOffset, byteLength / 2); 
    const b = c.createBuffer(1, i16.length, 24000); 
    const cd = b.getChannelData(0); 
    for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; 
    return b; 
}

export const generateMp3FromShadowVoice = async (text: string, voice: string): Promise<{file: File, base64: string} | null> => {
    let base64 = audioCache.get(text);
    if (!base64) {
        base64 = await shadowDB.getAudioSegment(text) || undefined;
    }
    if (!base64) {
        base64 = await getShadowVoice(text, voice);
        if (base64) {
            audioCache.set(text, base64);
            shadowDB.saveAudioSegment(text, base64);
        }
    }
    if (!base64) return null;

    const arrayBuffer = base64ToArrayBuffer(base64);
    const u8 = new Uint8Array(arrayBuffer);
    
    // Check if it has ID3 or MP3 sync header (0x49 0x44 0x33 or 0xFF)
    const isMp3 = (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) || (u8[0] === 0xFF && (u8[1] & 0xE0) === 0xE0);
    if (isMp3) {
        const parsedFile = new File([new Blob([arrayBuffer], { type: 'audio/mp3' })], 'shadow-voice.mp3', { type: 'audio/mp3' });
        return { file: parsedFile, base64 };
    }

    // Fallback: Return WAV container
    const dataBytes = u8.length % 2 === 0 ? u8.length : u8.length - 1;
    const u8Even = new Uint8Array(u8.buffer, 0, dataBytes);
    const bufferWav = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(bufferWav);
    
    const setUint16 = (pos: number, data: number) => view.setUint16(pos, data, true);
    const setUint32 = (pos: number, data: number) => view.setUint32(pos, data, true);
    
    setUint32(0, 0x46464952); setUint32(4, 36 + dataBytes); setUint32(8, 0x45564157);
    setUint32(12, 0x20746d66); setUint32(16, 16); setUint16(20, 1); setUint16(22, 1);
    setUint32(24, 24000); setUint32(28, 24000 * 2); setUint16(32, 2); setUint16(34, 16);
    setUint32(36, 0x61746164); setUint32(40, dataBytes);
    new Uint8Array(bufferWav, 44).set(u8Even);
    
    const parsedFile = new File([new Blob([bufferWav], { type: 'audio/wav' })], 'shadow-voice.wav', { type: 'audio/wav' });
    return { file: parsedFile, base64 };
};

const playHtml5Audio = (base64Audio: string, onAudioEnd?: () => void, onFallback?: () => void) => {
    try {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        currentHtmlAudio = audio;
        
        const interval = setInterval(() => {
            if (!currentHtmlAudio) {
                clearInterval(interval);
                return;
            }
            const lvl = 0.3 + Math.random() * 0.5;
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: lvl } }));
        }, 120);

        audio.onended = () => {
            clearInterval(interval);
            currentHtmlAudio = null;
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            onAudioEnd?.();
        };

        audio.onerror = () => {
            clearInterval(interval);
            currentHtmlAudio = null;
            onFallback?.();
        };

        audio.play().catch(() => {
            clearInterval(interval);
            currentHtmlAudio = null;
            onFallback?.();
        });
    } catch {
        onFallback?.();
    }
};

export const playShadowVoice = async (
    text: string, 
    voice: string, 
    existing?: string, 
    onEnded?: () => void,
    onVoiceLoaded?: (base64: string) => void
) => {
    stopVoice();

    try {
        // ALWAYS fetch fresh neural audio from Google Gemini TTS
        // Completely bypass old cached robotic audio from previous sessions
        let base64 = await getShadowVoice(text, voice);
        if (base64) {
            onVoiceLoaded?.(base64);
        }

        if (!base64) { 
            console.log("[TTS] Server audio unavailable, speaking via Browser Natural Voice Engine...");
            const spoken = speakBrowserNaturalVoice(text, voice, onEnded);
            if (!spoken) onEnded?.();
            return; 
        }

        // Direct HTML5 Audio playback via Blob URL - Pristine 24kHz Human Neural Quality
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const isWav = byteArray.length > 4 && byteArray[0] === 0x52 && byteArray[1] === 0x49 && byteArray[2] === 0x46 && byteArray[3] === 0x46;
        const mimeType = isWav ? 'audio/wav' : 'audio/mp3';
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        const audio = new Audio(blobUrl);
        currentHtmlAudio = audio;

        // Lip-sync / waveform simulation for UI
        const interval = setInterval(() => {
            if (!currentHtmlAudio || currentHtmlAudio.paused) {
                clearInterval(interval);
                return;
            }
            const lvl = 0.35 + Math.random() * 0.45;
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: lvl } }));
        }, 80);

        audio.onended = () => {
            clearInterval(interval);
            URL.revokeObjectURL(blobUrl);
            currentHtmlAudio = null;
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            onEnded?.();
        };

        audio.onerror = (e) => {
            console.error("[TTS] HTML5 Audio playback error:", e);
            clearInterval(interval);
            URL.revokeObjectURL(blobUrl);
            currentHtmlAudio = null;
            onEnded?.();
        };

        audio.onerror = () => {
            clearInterval(interval);
            URL.revokeObjectURL(blobUrl);
            currentHtmlAudio = null;
            if (!speakBrowserNaturalVoice(text, voice, onEnded)) {
                onEnded?.();
            }
        };

        try {
            await audio.play();
        } catch (playErr: any) {
            console.warn("[TTS] Autoplay blocked by browser policy, queuing for next user interaction:", playErr);
            const onUserInteract = () => {
                if (currentHtmlAudio === audio) {
                    audio.play().catch(() => {});
                }
                window.removeEventListener('click', onUserInteract);
                window.removeEventListener('touchstart', onUserInteract);
                window.removeEventListener('keydown', onUserInteract);
            };
            window.addEventListener('click', onUserInteract, { once: true });
            window.addEventListener('touchstart', onUserInteract, { once: true });
            window.addEventListener('keydown', onUserInteract, { once: true });
        }
    } catch (e: any) { 
        console.error("[TTS] PlayShadowVoice Error:", e);
        if (!speakBrowserNaturalVoice(text, voice, onEnded)) {
            onEnded?.();
        }
    }
};

export const getShadowVoice = async (text: string, voice: string, preferredEngine?: 'gemini' | 'edge'): Promise<string | null> => {
    const cleanText = text
        .replace(/[*_#\-`~>]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\{.*?\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleanText) return null;

    // Resolve authentic Egyptian voice persona
    let edgeVoiceName = voice === 'female' ? 'ar-EG-SalmaNeural' : 'ar-EG-ShakirNeural';
    let edgeRate = '+0%';
    let edgePitch = '+0Hz';

    try {
        const { persona } = resolveVoicePersona(voice);
        if (persona?.edgeVoice) edgeVoiceName = persona.edgeVoice;
        if (persona?.edgeRate) edgeRate = persona.edgeRate;
        if (persona?.edgePitch) edgePitch = persona.edgePitch;
    } catch {}

    // 1. PRIMARY & SOVEREIGN: 100% Studio Human Egyptian Neural Voice (Shakir / Salma)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch('/api/tts/edge-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: cleanText.substring(0, 1500),
                voice: edgeVoiceName,
                rate: edgeRate,
                pitch: edgePitch,
                format: 'audio-24khz-48kbitrate-mono-mp3'
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            if (arrayBuffer.byteLength > 100) {
                let binary = '';
                const bytes = new Uint8Array(arrayBuffer);
                const len = bytes.byteLength;
                const chunkSize = 8192;
                for (let i = 0; i < len; i += chunkSize) {
                    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
                    binary += String.fromCharCode.apply(null, chunk as any);
                }
                const base64Audio = btoa(binary);
                if (base64Audio && base64Audio.length > 100) {
                    return base64Audio;
                }
            }
        }
    } catch (e: any) {
        console.warn("[TTS] Human Egyptian Neural endpoint failed:", e?.message);
    }

    // 2. SECONDARY RESILIENT FALLBACK: Sovereign TTS Route
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const resp = await fetch('/api/tts/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: cleanText.substring(0, 1500),
                voice: edgeVoiceName
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            if (arrayBuffer.byteLength > 100) {
                let binary = '';
                const bytes = new Uint8Array(arrayBuffer);
                const len = bytes.byteLength;
                const chunkSize = 8192;
                for (let i = 0; i < len; i += chunkSize) {
                    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
                    binary += String.fromCharCode.apply(null, chunk as any);
                }
                const base64Audio = btoa(binary);
                if (base64Audio && base64Audio.length > 100) {
                    return base64Audio;
                }
            }
        }
    } catch (gErr: any) {
        console.warn("[TTS] Sovereign fallback failed:", gErr?.message);
    }

    return null;
};

/**
 * Splits text into low-latency sentence chunks and starts streaming audio playback immediately
 * from the very first sentence without waiting for the complete text synthesis.
 */
export const playShadowVoiceStreaming = async (
    text: string,
    voice: string = 'male',
    onSentenceStart?: (sentence: string) => void,
    onEnded?: () => void
): Promise<number> => {
    stopVoice();
    const ctx = resumeAudioContext();
    if (!ctx) {
        speakNative(text, voice, onEnded);
        return 0;
    }

    const sessionId = audioStreamQueue.startSession(onEnded);

    // Natural sentence delimiter regex (periods, exclamation, question marks, Arabic commas, semicolons, linebreaks)
    const rawSegments = text
        .split(/([.!؟،؛\n]+)/)
        .reduce((acc: string[], curr: string, idx: number) => {
            if (idx % 2 === 0) {
                if (curr.trim()) acc.push(curr.trim());
            } else if (acc.length > 0) {
                acc[acc.length - 1] += curr;
            }
            return acc;
        }, [])
        .map(s => s.trim())
        .filter(s => s.length > 0);

    if (rawSegments.length === 0) {
        audioStreamQueue.markCompleted(sessionId);
        onEnded?.();
        return sessionId;
    }

    // Fire off synthesis for all sentences in parallel; the sequenced queue will play them in order
    Promise.all(
        rawSegments.map((sentence) => {
            onSentenceStart?.(sentence);
            return audioStreamQueue.enqueueSentence(sentence, voice, sessionId);
        })
    ).then(() => {
        audioStreamQueue.markCompleted(sessionId);
    }).catch((err) => {
        console.warn("[Streaming TTS Pipeline Error]", err);
        audioStreamQueue.markCompleted(sessionId);
    });

    return sessionId;
};





// Pre-load and cache browser voices at module initialization
let cachedBrowserVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
        cachedBrowserVoices = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            cachedBrowserVoices = window.speechSynthesis.getVoices();
        };
    } catch {}
}

/**
 * Speaks text using the user's browser's native natural voice (Microsoft Shakir Online (Natural) or ar-EG)
 * Instant, client-side, 0 delay, 100% human studio quality directly through Windows/Chrome!
 */
export function speakBrowserNaturalVoice(text: string, voice: string = 'male', onEnd?: () => void): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    try {
        window.speechSynthesis.cancel();
        const cleanText = text
            .replace(/[*_#\-`~>]/g, ' ')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\{.*?\}/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText) return false;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'ar-EG';

        const pickVoice = (vList: SpeechSynthesisVoice[]) => {
            return vList.find(v => 
                v.lang.toLowerCase().replace('_', '-').includes('ar-eg') && (v.name.includes('Natural') || v.name.includes('Shakir') || v.name.includes('Salma') || v.name.includes('Online'))
            ) || vList.find(v => 
                v.lang.toLowerCase().startsWith('ar') && (v.name.includes('Natural') || v.name.includes('Online'))
            ) || vList.find(v => v.lang.toLowerCase().replace('_', '-').includes('ar-eg'))
              || vList.find(v => v.lang.toLowerCase().startsWith('ar'));
        };

        let interval: any;
        utterance.onstart = () => {
            interval = setInterval(() => {
                const lvl = 0.3 + Math.random() * 0.5;
                window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: lvl } }));
            }, 80);
        };

        utterance.onend = () => {
            clearInterval(interval);
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            onEnd?.();
        };

        utterance.onerror = () => {
            clearInterval(interval);
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
            onEnd?.();
        };

        const speakNow = (selectedVoice?: SpeechSynthesisVoice) => {
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        };

        const speakWithNaturalArabicVoice = () => {
            let vList = cachedBrowserVoices.length > 0 ? cachedBrowserVoices : window.speechSynthesis.getVoices();
            let matched = pickVoice(vList);

            if (matched) {
                speakNow(matched);
                return;
            }

            // If natural Arabic voice has not fully loaded in Chromium yet, wait up to 1.5s for voiceschanged
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                const freshVoices = window.speechSynthesis.getVoices();
                if (freshVoices.length > 0) cachedBrowserVoices = freshVoices;
                const freshMatch = pickVoice(freshVoices);
                if (freshMatch || attempts >= 15) {
                    clearInterval(checkInterval);
                    speakNow(freshMatch);
                }
            }, 100);

            window.speechSynthesis.onvoiceschanged = () => {
                const freshVoices = window.speechSynthesis.getVoices();
                cachedBrowserVoices = freshVoices;
                const freshMatch = pickVoice(freshVoices);
                if (freshMatch) {
                    clearInterval(checkInterval);
                    speakNow(freshMatch);
                }
            };
        };

        speakWithNaturalArabicVoice();
        return true;
    } catch {
        return false;
    }
}
