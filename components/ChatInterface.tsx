
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Square, Volume2, VolumeX, Play, Pause, Brain, Activity, Mic2, Paperclip, X, Zap, Lock, Crown, Globe, Sun, ArrowLeft, Loader2, Sparkles, ArrowRight, DollarSign, RotateCcw, Home, Clock, MessageCircle, Share2, Copy, Shield, Download, Smartphone, Cpu, HelpCircle, Star, Search, ExternalLink, PhoneCall, CheckCircle, Ear, RefreshCw, StopCircle } from 'lucide-react';
import { getShadowResponse, playShadowVoice, stopVoice, getShadowVoice } from '../services/geminiService';
import { shadowDB, DBMessage, DBTask, UserProfile } from '../services/dbService';
import CapabilitiesGuide from './CapabilitiesGuide';
import SovereignVault from './SovereignVault'; 

interface Props {
    currentUser: UserProfile;
    onUpgrade: () => void;
    onBack: () => void; 
    onOpenAffiliate?: () => void; 
    isAdmin?: boolean; 
    onNavigateTo?: (section: string) => void; 
    incomingSystemMessage?: DBMessage | null; 
}

interface ExtendedMessage extends DBMessage {
    isError?: boolean;
}

const compressImage = (file: File): Promise<{ data: string, type: string, originalFile: File }> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve({ data: dataUrl, type: 'image/jpeg', originalFile: file });
            };
        };
    });
};

const highlightText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-purple-400 font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const ChatInterface: React.FC<Props> = ({ currentUser, onUpgrade, onBack, onOpenAffiliate, isAdmin = false, onNavigateTo, incomingSystemMessage }) => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [input, setInput] = useState('');
  const [appStatus, setAppStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [pendingImage, setPendingImage] = useState<{data: string, type: string, originalFile: File} | null>(null);
  const [visualLevels, setVisualLevels] = useState<number[]>(new Array(20).fill(5));
  const [liveTranscript, setLiveTranscript] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const [isSentinelMode, setIsSentinelMode] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAppCard, setActiveAppCard] = useState<{ cardType: string, title: string, description: string, url?: string, number?: string } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSystemMessageIdRef = useRef<number | undefined>(undefined);

  const isRestrictedMode = currentUser.phone === 'GUEST';
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    if (isRestrictedMode) {
        const trialStartStr = localStorage.getItem('shadow_guest_start');
        if (trialStartStr) {
            const trialStart = parseInt(trialStartStr);
            if (Date.now() - trialStart > 3 * 24 * 60 * 60 * 1000) setIsLimitReached(true);
        }
    }
  }, [isRestrictedMode]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const passiveRecognitionRef = useRef<any>(null); 
  const rafIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number>(0);
  const stateRef = useRef({ isBusy: false, isListening: false, finalTranscript: '', lastAudioTime: Date.now() });

  const getGreetingSubtitle = () => {
      if (isAdmin) return `مرحباً ${currentUser.name.split(' ')[0]} (الماستر)`;
      if (currentUser.phone === 'GUEST') return "مرحباً ضيف الظل";
      return `مرحباً ${currentUser.name.split(' ')[0]} (عضو نخبة)`;
  };

  useEffect(() => {
      if (currentUser.phone !== 'GUEST') {
          shadowDB.subscribeToRealtime(currentUser.phone, (table, payload) => {
              if (table === 'history') {
                  const newMsg = payload as DBMessage;
                  setMessages(prev => prev.some(m => m.timestamp === newMsg.timestamp) ? prev : [...prev, newMsg]);
              }
          });
      }
  }, [currentUser.phone]);

  const resetToIdle = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    if (recognitionRef.current) { recognitionRef.current.onend = null; recognitionRef.current.stop(); }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stateRef.current.isBusy = false;
    stateRef.current.isListening = false;
    setAppStatus('idle');
    setLiveTranscript('');
    setPendingImage(null);
    if (isSentinelMode) setTimeout(startPassiveListening, 500); 
  }, [isSentinelMode]);

  const startListening = async () => {
    if (isLimitReached) return;
    stateRef.current.isBusy = true;
    stopVoice();
    if (passiveRecognitionRef.current) try { passiveRecognitionRef.current.stop(); } catch(e) {}

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; 
      source.connect(analyser);
      analyserRef.current = analyser;

      setAppStatus('listening');
      stateRef.current.isListening = true;
      stateRef.current.finalTranscript = '';
      recordingStartTimeRef.current = Date.now(); 
      isCancelledRef.current = false;

      setupActiveSpeechRecognition();
      
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => { 
        stream.getTracks().forEach(t => t.stop());
        if (isCancelledRef.current) { resetToIdle(); return; }
        const duration = Date.now() - recordingStartTimeRef.current;
        if (duration < 800 && !stateRef.current.finalTranscript.trim()) { resetToIdle(); return; }
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSend(stateRef.current.finalTranscript, blob);
      };
      
      recorder.start(100);
      recorderRef.current = recorder;
      startWaveformLoop();
    } catch (e) { resetToIdle(); }
  };

  const setupActiveSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'ar-EG';
    
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) stateRef.current.finalTranscript += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setLiveTranscript(stateRef.current.finalTranscript + interim);
      
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // PROACTIVE AUTO-SEND: 2 seconds of silence after talking
      silenceTimerRef.current = setTimeout(() => {
          if (stateRef.current.isListening && (stateRef.current.finalTranscript.trim() || interim.trim())) {
              stopListeningAndSend();
          }
      }, 2000); 
    };

    rec.onend = () => { if (stateRef.current.isListening) try { rec.start(); } catch(e) {} };
    try { rec.start(); } catch(e) {}
    recognitionRef.current = rec;
  };

  const stopListeningAndSend = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stateRef.current.isListening = false;
    if (recognitionRef.current) { recognitionRef.current.onend = null; recognitionRef.current.stop(); }
    if (recorderRef.current && recorderRef.current.state === 'recording') recorderRef.current.stop();
  };

  const startWaveformLoop = () => {
    const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 0);
    const update = () => {
      if (analyserRef.current && stateRef.current.isListening) {
        analyserRef.current.getByteFrequencyData(dataArray);
        setVisualLevels(Array.from(dataArray).slice(0, 20)); 
      }
      rafIdRef.current = requestAnimationFrame(update);
    };
    rafIdRef.current = requestAnimationFrame(update);
  };

  const handleSend = async (forcedText?: string, audioBlob?: Blob, existingAudioBase64?: string) => {
    if (isLimitReached) return; 
    const textToSend = forcedText || input;
    if (!textToSend.trim() && !audioBlob && !pendingImage && !existingAudioBase64) { resetToIdle(); return; }
    
    stateRef.current.isBusy = true;
    setAppStatus('thinking');
    setActiveAppCard(null); 

    let userVoiceDataURI = existingAudioBase64 || '';
    let geminiAudioInput = ''; 
    if (existingAudioBase64) {
        geminiAudioInput = existingAudioBase64.includes(',') ? existingAudioBase64.split(',')[1] : existingAudioBase64;
    } else if (audioBlob) {
        userVoiceDataURI = await new Promise((r) => { const rd = new FileReader(); rd.onload = () => r(rd.result as string); rd.readAsDataURL(audioBlob); });
        geminiAudioInput = userVoiceDataURI.split(',')[1];
    }

    const userMsg: ExtendedMessage = { 
        userId: currentUser.phone, role: 'user', 
        text: textToSend.trim() || 'رسالة صوتية 🎤', 
        timestamp: Date.now(), image: pendingImage?.data, voiceData: userVoiceDataURI || undefined
    };
    
    let id = Date.now();
    if (!isRestrictedMode) id = await shadowDB.saveMessage(userMsg);
    setMessages(prev => [...prev, { ...userMsg, id }]);
    
    setInput(''); 
    setPendingImage(null); 
    setLiveTranscript('');
    abortControllerRef.current = new AbortController();

    try {
      const extra = geminiAudioInput ? { data: geminiAudioInput, mimeType: 'audio/webm', type: 'audio' as const } : (pendingImage ? { data: pendingImage.data.split(',')[1], mimeType: pendingImage.type, type: 'image' as const } : undefined);
      const history = isRestrictedMode ? messages : await shadowDB.getHistory(currentUser.phone);
      
      const result = await getShadowResponse(
          history.map(m => ({ role: m.role, parts: [{ text: m.text }] })), 
          textToSend || "تحليل الصوت", extra, currentUser, abortControllerRef.current.signal 
      );
      
      const voiceData = isMuted ? undefined : await getShadowVoice(result.text, 'male');
      const modelMsg: DBMessage = { userId: currentUser.phone, role: 'model', text: result.text, timestamp: Date.now(), groundingLinks: result.groundingLinks, voiceData: voiceData || undefined };
      
      let modelId = Date.now() + 1;
      if (!isRestrictedMode) modelId = await shadowDB.saveMessage(modelMsg);
      setMessages(prev => [...prev, { ...modelMsg, id: modelId }]);
      
      if (voiceData) {
          setPlayingMessageId(modelId);
          setAppStatus('speaking');
          playShadowVoice(result.text, 'male', voiceData, () => { 
              setPlayingMessageId(null); 
              setAppStatus('idle'); 
              stateRef.current.isBusy = false;
              if (isSentinelMode) startPassiveListening();
          });
      } else {
          setAppStatus('idle');
          stateRef.current.isBusy = false; 
          if (isSentinelMode) startPassiveListening();
      }
    } catch (e: any) { 
        setAppStatus('idle'); 
        stateRef.current.isBusy = false;
    }
  };

  const startPassiveListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.lang = 'ar-EG';
    rec.onresult = (e: any) => {
        const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
        if (transcript.includes('يا ظل') || transcript.includes('يا تيتو')) {
            rec.stop();
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
            setTimeout(startListening, 300);
        }
    };
    rec.onend = () => { if (isSentinelMode && appStatus === 'idle') try { rec.start(); } catch(e){} };
    try { rec.start(); } catch(e){}
    passiveRecognitionRef.current = rec;
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-white font-['Cairo'] overflow-hidden relative">
      {appStatus === 'listening' && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="text-center mb-10"><h2 className="text-3xl font-black text-white mb-2 animate-pulse tracking-tighter">الظل يستمع...</h2><p className="text-white/50 text-lg">{liveTranscript || "أنا سامعك يا ماستر، كمل.."}</p></div>
              <div className="flex items-end gap-1.5 h-32 mb-12">{visualLevels.map((level, i) => (<div key={i} className="w-3 bg-gradient-to-t from-purple-600 to-cyan-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(10, level / 2)}%` }}></div>))}</div>
              <button onClick={stopListeningAndSend} className="p-6 bg-red-600 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)]"><Square className="w-8 h-8 fill-current" /></button>
          </div>
      )}

      {/* Top Header */}
      <div className="h-16 px-4 border-b border-white/10 bg-[#0a0a0a] flex justify-between items-center z-50">
          <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 rounded-full bg-white/5"><Home className="w-5 h-5 text-white/50" /></button>
              <div><h1 className="text-sm font-black text-white">غرفة العمليات</h1><p className="text-[10px] text-purple-500 font-bold">{getGreetingSubtitle()}</p></div>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => setIsSentinelMode(!isSentinelMode)} className={`p-2 rounded-full border transition-all ${isSentinelMode ? 'bg-red-600 border-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-white/30'}`}><Ear className="w-5 h-5" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full border ${isMuted ? 'bg-white/5' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'}`}>{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
          </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-[24px] border backdrop-blur-md ${m.role === 'user' ? 'bg-[#1a1a1a] border-white/5 rounded-tl-none' : 'bg-purple-900/10 border-purple-500/20 rounded-tr-none'}`}>
                {m.image && <img src={m.image} className="w-full rounded-xl mb-2" />}
                <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{highlightText(m.text)}</div>
                <div className="mt-2 flex justify-between items-center border-t border-white/5 pt-2">
                    <span className="text-[9px] text-white/20">{new Date(m.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                    {(m.role === 'model' || m.voiceData) && <button onClick={() => playShadowVoice(m.text, 'male', m.voiceData)} className="p-1 text-cyan-400"><Play className="w-4 h-4 fill-current" /></button>}
                </div>
            </div>
          </div>
        ))}
        {appStatus === 'thinking' && (
            <div className="flex justify-end items-center gap-2">
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-full px-4 py-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500 animate-pulse" />
                    <span className="text-[10px] font-black text-purple-400 animate-pulse uppercase">الظل يحلل استراتيجياً...</span>
                </div>
            </div>
        )}
      </div>

      {/* Input Deck */}
      <div className="absolute bottom-6 inset-x-4 flex items-end gap-2 bg-[#0a0a0a] p-2 rounded-[32px] border border-white/10 shadow-2xl">
          <button onClick={() => fileInputRef.current?.click()} className="p-4 text-white/40 hover:text-white transition-colors"><Paperclip className="w-6 h-6" /><input type="file" ref={fileInputRef} className="hidden" onChange={async (e)=>{const f=e.target.files?.[0]; if(f){setIsProcessingImage(true); const c=await compressImage(f); setPendingImage(c); setIsProcessingImage(false);}}} /></button>
          <textarea 
            value={input} 
            onChange={(e)=>setInput(e.target.value)} 
            placeholder={isSentinelMode ? "وضع الحارس مفعل (قل: يا ظل)..." : "أمرك مسموع يا ماستر..."} 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 resize-none max-h-32"
            rows={1}
          />
          <button onClick={startListening} className={`p-4 rounded-full transition-all ${appStatus === 'listening' ? 'bg-red-600 animate-pulse' : 'bg-white/5 text-white/50'}`}><Mic className="w-6 h-6" /></button>
          {input.trim() && <button onClick={()=>handleSend()} className="p-4 bg-purple-600 rounded-full text-white"><Send className="w-6 h-6" /></button>}
      </div>
    </div>
  );
};

export default ChatInterface;
