// Auto-generated split
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { getAI } from "./geminiService";
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export function resumeAudioContext() {
    try {
        if (!audioCtx) {
            const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
            if (CtxClass) audioCtx = new CtxClass({ sampleRate: 24000 });
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

import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { getShadowResponse } from "./geminiService";

export const audioCache = new Map<string, string>();

// GLOBAL STATE FOR TTS
// @ts-ignore
window.shadowUtterance = null;
let resumeInterval: any = null;




export const stopVoice = async () => { 
    if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; } 
    if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
    
    if (Capacitor.isNativePlatform()) {
        try { await TextToSpeech.stop(); } catch {}
    } else if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
    }
    
    // @ts-ignore
    window.shadowUtterance = null;
};

// --- ROBUST NATIVE TTS ENGINE ---

export const speakNative = async (text: string, voice: string = 'male', onEnd?: () => void) => {
    const cleanText = text.replace(/[*_#\-`]/g, ' ').replace(/http\S+/g, '').trim();
    if (!cleanText || cleanText.length < 1) { onEnd?.(); return; }

    if (Capacitor.isNativePlatform()) {
        try {
            let selectedVoiceUrl;
            try {
                const { voices } = await TextToSpeech.getSupportedVoices();
                const arVoices = voices.filter((v: any) => v.lang.toLowerCase().includes('ar'));
                if (arVoices.length > 0) {
                    if (voice === 'female') {
                        const fb = arVoices.find((v: any) => /(laila|salma|zeina|female)/i.test(v.name) && v.lang.includes('EG')) || arVoices.find((v: any) => /(laila|salma|zeina|female)/i.test(v.name)) || arVoices.find((v: any) => v.lang === 'ar-EG');
                        if (fb) selectedVoiceUrl = fb.voiceURI || (fb as any).id;
                    } else {
                        const mb = arVoices.find((v: any) => /(maged|tariq|male|majed)/i.test(v.name) && v.lang.includes('EG')) || arVoices.find((v: any) => /(maged|tariq|male|majed)/i.test(v.name)) || arVoices.find((v: any) => v.lang === 'ar-EG');
                        if (mb) selectedVoiceUrl = mb.voiceURI || (mb as any).id;
                    }
                }
            } catch (e) {
                console.warn("Could not fetch native voices", e);
            }

            await TextToSpeech.speak({
                text: cleanText,
                lang: 'ar-EG',
                rate: 0.98,
                pitch: 1.0,
                volume: 1.0,
                category: 'ambient',
                voice: selectedVoiceUrl,
            });
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            onEnd?.();
            return;
        } catch (e) {
            console.warn("Capacitor TTS Failed:", e);
            // fallback to web if possible
        }
    }

    if (!('speechSynthesis' in window)) { 
        (window as any).dispatchEvent(new CustomEvent('shadow_voice_ended'));
        onEnd?.(); 
        return; 
    }
    
    // 1. Force Cancel & Resume State
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();

    // 3. Create Utterance
    const utter = new SpeechSynthesisUtterance(cleanText);
    // @ts-ignore
    window.shadowUtterance = utter; // Global ref to prevent GC

    utter.rate = 1.0; 
    utter.pitch = voice === 'female' ? 1.2 : 1.0; // Slightly higher pitch for female as fallback
    utter.lang = 'ar-EG'; 
    utter.volume = 1.0;

    // Try finding an appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const arVoices = voices.filter(v => v.lang.toLowerCase().includes('ar'));
    
    // Advanced Voice Selection: Prioritize high-quality, local, Egyptian human-like voices
    if (arVoices.length > 0) {
        let selectedVoice: SpeechSynthesisVoice | undefined;

        if (voice === 'female') {
            // Priority: Laila, Salma, Zeina (Apple/Google high quality female), then ar-EG local
            selectedVoice = arVoices.find(v => /(laila|salma|zeina|female)/i.test(v.name) && v.lang.includes('EG')) ||
                            arVoices.find(v => /(laila|salma|zeina|female)/i.test(v.name)) ||
                            arVoices.find(v => /(local|-x-)/i.test(v.name) && v.lang.includes('EG')) || // Android HQ local
                            arVoices.find(v => v.lang === 'ar-EG') ||
                            arVoices[0];
        } else {
            // Priority: Maged, Tariq (Apple high quality male), then ar-EG local
            selectedVoice = arVoices.find(v => /(maged|tariq|male|majed)/i.test(v.name) && v.lang.includes('EG')) ||
                            arVoices.find(v => /(maged|tariq|male|majed)/i.test(v.name)) ||
                            arVoices.find(v => /(local|-x-)/i.test(v.name) && v.lang.includes('EG') && !/female|zeina|salma/i.test(v.name)) ||
                            arVoices.find(v => v.lang === 'ar-EG') ||
                            arVoices[arVoices.length - 1];
        }

        if (selectedVoice) {
            utter.voice = selectedVoice;
            console.log(`[Offline TTS] Selected Edge Voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        }
    }

    // 4. Handlers
    utter.onend = () => {
        // @ts-ignore
        window.shadowUtterance = null;
        if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
        window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
        onEnd?.();
    };

    utter.onerror = (e) => {
        // Ignore interruption errors which happen when we cancel
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn("TTS Error:", e);
        }
        // @ts-ignore
        window.shadowUtterance = null;
        if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
        
        // Only trigger onEnd if it wasn't cancelled intentionally
        if (e.error !== 'canceled' && e.error !== 'interrupted') onEnd?.();
    };

    // 5. Execution Logic
    let spoken = false;
    const executeSpeak = () => {
        if (spoken) return;
        spoken = true;

        const voices = window.speechSynthesis.getVoices();
        // Try to find a good Arabic voice (Google preferred for quality)
        const preferred = voices.find(v => v.lang.includes('ar') && v.name.includes('Google')) || 
                          voices.find(v => v.lang.includes('ar'));
        
        if (preferred) utter.voice = preferred;

        // Double check pause state
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        
        window.speechSynthesis.speak(utter);
        
        // Chrome Long Text Fix: Periodically pause/resume to keep the engine alive
        if (cleanText.length > 80) {
            if (resumeInterval) clearInterval(resumeInterval);
            resumeInterval = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(resumeInterval);
                    resumeInterval = null;
                } else {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }
            }, 10000); // 10s keep-alive
        }
    };

    // 6. Voice Loading Strategy
    // Chrome loads voices asynchronously. We must wait if the list is empty.
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            executeSpeak();
            window.speechSynthesis.onvoiceschanged = null;
        };
        // Fallback: If event never fires (some mobile browsers), speak anyway after 1s
        setTimeout(executeSpeak, 1000);
    } else {
        // Slight delay to ensure the previous 'cancel()' has propagated
        setTimeout(executeSpeak, 50);
    }
};

// --- TOOLS DEFINITION ---
import { actionTools } from './toolsConfig';


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

    let u8: Uint8Array;
    try {
        const res = await fetch(`data:application/octet-stream;base64,${base64}`);
        const buffer = await res.arrayBuffer();
        u8 = new Uint8Array(buffer);
    } catch (e) {
        // Fallback if fetch fails
        const byteCharacters = atob(base64);
        u8 = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            u8[i] = byteCharacters.charCodeAt(i);
        }
    }
    
    // FAST PATH: Return WAV format to skip extremely slow lamejs mp3 encoding
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


export const playShadowVoice = async (text: string, voice: string, existing?: string, onEnded?: () => void) => {
    stopVoice();
    const ctx = resumeAudioContext();
    
    if (!ctx) { 
        speakNative(text, voice, onEnded);
        return; 
    }

    try {
        let base64 = existing;
        if (!base64 && audioCache.has(text)) base64 = audioCache.get(text);
        if (!base64) base64 = await shadowDB.getAudioSegment(text) || undefined;
        
        if (!base64) {
            base64 = await getShadowVoice(text, voice);
            if (base64) {
                if (audioCache.size >= 50) {
                    const firstKey = audioCache.keys().next().value;
                    if (firstKey) audioCache.delete(firstKey);
                }
                audioCache.set(text, base64);
                shadowDB.saveAudioSegment(text, base64);
            }
        }

        if (!base64) { 
            speakNative(text, voice, onEnded);
            return; 
        }
        
        const buffer = await decodeAudioData(decode(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        // Add Analyser for lip-sync and face reactivity
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationFrame: number;
        
        const updateAudioLevel = () => {
            if (!currentSource) return;
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average level
            let sum = 0;
            for(let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalizedLevel = Math.min(1, average / 128); // 0 to 1
            
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: normalizedLevel } }));
            animationFrame = requestAnimationFrame(updateAudioLevel);
        };
        
        source.onended = () => { 
            currentSource = null; 
            cancelAnimationFrame(animationFrame);
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            onEnded?.(); 
        };
        
        source.start(0);
        currentSource = source;
        updateAudioLevel();
    } catch (e) { 
        console.error("Voice Playback Error:", e); 
        speakNative(text, voice, onEnded);
    }
};


export const getShadowVoice = async (text: string, voice: string) => {
    try {
        const res = await getAI().models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text }] }],
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice === 'female' ? 'Kore' : 'Puck' } } } 
            }
        });
        return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e: any) { 
        console.warn(`[Gemini TTS] Voice generation failed (likely quota). Falling back to native UI voice. Details: ${e?.message || e}`);
        return null; 
    }
};

function decode(b: string) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
async function decodeAudioData(d: Uint8Array, c: AudioContext) { 
    const byteLength = d.length % 2 === 0 ? d.length : d.length - 1;
    const i16 = new Int16Array(d.buffer, 0, byteLength / 2); 
    const b = c.createBuffer(1, i16.length, 24000); 
    const cd = b.getChannelData(0); 
    for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; 
    return b; 
}


