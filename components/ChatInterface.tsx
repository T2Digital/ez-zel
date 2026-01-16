import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Square, Volume2, VolumeX, Play, Pause, Brain, Activity, Mic2, Paperclip, X, Zap, Lock, Crown, Globe, Sun, ArrowLeft, Loader2, Sparkles, ArrowRight, DollarSign, RotateCcw, Home, Clock, MessageCircle, Share2, Copy, Shield, Download, Smartphone, Cpu, HelpCircle, Star, Search, ExternalLink, PhoneCall, CheckCircle, Ear, RefreshCw, StopCircle, MapPin, Hotel, Music, Video, Grid, Camera, Edit3, Car, Landmark, CreditCard, FileText, Printer, PenTool } from 'lucide-react';
import { getShadowResponse, playShadowVoice, stopVoice, getShadowVoice } from '../services/geminiService';
import { shadowDB, DBMessage, DBTask, UserProfile } from '../services/dbService';
import CapabilitiesGuide from './CapabilitiesGuide';

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
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve({ data: dataUrl, type: 'image/jpeg', originalFile: file });
                }
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

  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSystemMessageIdRef = useRef<number | undefined>(undefined);
  const isSubmittingRef = useRef(false);

  const isRestrictedMode = currentUser.phone === 'GUEST' || (currentUser.tier === 'lite' && currentUser.affiliate?.isMarketer);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
      const resumeAudio = () => {
          const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
          if (Ctx) {
             const ctx = new Ctx();
             if (ctx.state === 'suspended') ctx.resume();
          }
      };
      window.addEventListener('click', resumeAudio, { once: true });
      window.addEventListener('touchstart', resumeAudio, { once: true });
      return () => {
          window.removeEventListener('click', resumeAudio);
          window.removeEventListener('touchstart', resumeAudio);
      };
  }, []);

  useEffect(() => {
    if (isRestrictedMode) {
        const trialStartStr = localStorage.getItem('shadow_guest_start');
        if (trialStartStr) {
            const trialStart = parseInt(trialStartStr);
            const now = Date.now();
            const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
            if (now - trialStart > threeDaysMs) setIsLimitReached(true);
        }
    }
  }, [isRestrictedMode]);

  const getGreetingSubtitle = () => {
      if (isAdmin) return `مرحباً ${currentUser.name.split(' ')[0]} (الماستر)`;
      if (currentUser.phone === 'GUEST') return "مرحباً ضيف الظل";
      if (currentUser.affiliate?.isMarketer && currentUser.tier === 'lite') return `مرحباً ${currentUser.name.split(' ')[0]} (شريك)`;
      return `مرحباً ${currentUser.name.split(' ')[0]} (عضو نخبة)`;
  };

  useEffect(() => {
      if (currentUser.phone !== 'GUEST') {
          shadowDB.subscribeToRealtime(currentUser.phone, (table, payload) => {
              if (table === 'history') {
                  const newMsg = payload as DBMessage;
                  setMessages(prev => {
                      if (prev.some(m => m.timestamp === newMsg.timestamp)) return prev;
                      return [...prev, newMsg];
                  });
              }
          });
      }
  }, [currentUser.phone]);

  useEffect(() => {
      if (incomingSystemMessage && incomingSystemMessage.timestamp !== lastSystemMessageIdRef.current) {
          lastSystemMessageIdRef.current = incomingSystemMessage.timestamp;
          setMessages(prev => [...prev, incomingSystemMessage]);
      }
  }, [incomingSystemMessage]);

  // --- SENTINEL MODE LOGIC ---
  const toggleSentinelMode = async () => {
      if (!isSentinelMode) {
          // ACTIVATE
          try {
              if ('wakeLock' in navigator) {
                  // @ts-ignore
                  wakeLockRef.current = await navigator.wakeLock.request('screen');
                  console.log("Sentinel: Wake Lock Active");
              }
          } catch (err) { console.log("Wake Lock Error", err); }
          
          setIsSentinelMode(true);
          startPassiveListening();
          
          // Audio feedback
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});

      } else {
          // DEACTIVATE
          if (wakeLockRef.current) {
              try { await wakeLockRef.current.release(); } catch(e){}
              wakeLockRef.current = null;
          }
          setIsSentinelMode(false);
          stopPassiveListening();
          setAppStatus('idle');
      }
  };

  // Re-acquire Wake Lock if visibility changes (e.g. user minimized then returned)
  useEffect(() => {
      const handleVisibilityChange = async () => {
          if (isSentinelMode && document.visibilityState === 'visible' && !wakeLockRef.current) {
              try {
                  // @ts-ignore
                  wakeLockRef.current = await navigator.wakeLock.request('screen');
              } catch(e) {}
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSentinelMode]);

  const passiveRecognitionRef = useRef<any>(null);
  
  const startPassiveListening = () => {
      if (stateRef.current.isListening) return;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      
      // Prevent duplicates
      if (passiveRecognitionRef.current) {
          try { passiveRecognitionRef.current.stop(); } catch(e) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'ar-EG'; // Listen for Arabic Wake Words

      rec.onresult = (e: any) => {
          if (stateRef.current.isListening || isSubmittingRef.current) return;
          
          const results = e.results;
          const transcript = results[results.length - 1][0].transcript.trim().toLowerCase();
          
          // WAKE WORDS
          const wakeWords = ['يا ظل', 'يا شادو', 'يا تيتو', 'يا صاحبي', 'ya shadow', 'ya tito', 'ya sahby'];
          
          if (wakeWords.some(word => transcript.includes(word))) {
              stopPassiveListening(); 
              // Wake Sound
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
              
              // Start Active Interaction
              startListening();
          }
      };

      // INFINITE LOOP LOGIC
      rec.onend = () => {
          if (isSentinelMode && !stateRef.current.isListening && !isSubmittingRef.current) {
              // Restart if Sentinel Mode is still active
              try { rec.start(); } catch(e) {
                  setTimeout(startPassiveListening, 500);
              }
          }
      };
      
      rec.onerror = (e: any) => {
          // Restart on error too if in Sentinel Mode
          if (isSentinelMode && e.error !== 'aborted') {
              setTimeout(startPassiveListening, 1000);
          }
      };
      
      try { rec.start(); } catch(e) {}
      passiveRecognitionRef.current = rec;
  };

  const stopPassiveListening = () => {
      if (passiveRecognitionRef.current) {
          passiveRecognitionRef.current.onend = null;
          passiveRecognitionRef.current.onerror = null;
          try { passiveRecognitionRef.current.stop(); } catch(e) {}
          passiveRecognitionRef.current = null;
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value);

  useEffect(() => {
    if (!isRestrictedMode) {
        const load = async () => setMessages(await shadowDB.getHistory(currentUser.phone));
        load();
    } else {
        setMessages(prev => {
            if (prev.length === 0) {
                return [{
                    role: 'model',
                    userId: currentUser.phone,
                    text: `يا مرحب بيك يا ${currentUser.name.split(' ')[0]}.
أنا ظلك الرقمي.. عقلك التاني اللي بيحلل، وبيخطط، وبيحفظ أسرارك.
أنا هنا عشان أشيل عنك الحمل.
معاك 3 أيام تجرب قدراتي.. هات آخرك يا ريس.`,
                    timestamp: Date.now()
                }];
            }
            return prev;
        });
    }
  }, [isRestrictedMode, currentUser.phone]);

  useEffect(() => { 
    if (scrollRef.current && !isSearchActive && !searchQuery) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, appStatus, liveTranscript, isSearchActive, searchQuery]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeRecognitionRef = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const isCancelledRef = useRef<boolean>(false);
  const stateRef = useRef({ isListening: false, finalTranscript: '' });

  const resetToIdle = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
         recorderRef.current.onstop = null; 
         recorderRef.current.stop();
    }
    if (activeRecognitionRef.current) { 
        activeRecognitionRef.current.onend = null;
        activeRecognitionRef.current.stop(); 
        activeRecognitionRef.current = null; 
    }
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    stateRef.current.isListening = false;
    stateRef.current.finalTranscript = '';
    isCancelledRef.current = false;
    isSubmittingRef.current = false;
    
    setAppStatus('idle');
    setLiveTranscript('');
    setPendingImage(null);

    // AUTO-RESUME SENTINEL MODE
    if (isSentinelMode) {
        setTimeout(startPassiveListening, 1000); 
    }
  }, [isSentinelMode]);

  const startListening = async () => {
    if (isLimitReached || isSubmittingRef.current) return;
    
    stopPassiveListening(); // Must pause sentinel while active
    stopVoice();

    stateRef.current.isListening = true;
    stateRef.current.finalTranscript = '';
    
    setAppStatus('listening');
    setLiveTranscript('');
    isCancelledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createMediaStreamSource(stream).context.createAnalyser();
      analyser.fftSize = 64; 
      source.connect(analyser);
      analyserRef.current = analyser;
      startWaveformLoop();

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      
      recorder.onstop = () => { 
          stream.getTracks().forEach(track => track.stop()); 
          if (!isCancelledRef.current) {
              const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              if (stateRef.current.finalTranscript.trim() || blob.size > 1500) {
                  handleSend(stateRef.current.finalTranscript, blob);
              } else {
                  resetToIdle();
              }
          } else {
              resetToIdle();
          }
      };
      recorder.start(100);
      recorderRef.current = recorder;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
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
              resetSilenceTimer();
          };
          
          rec.onstart = () => resetSilenceTimer();
          rec.onend = () => {
              if (stateRef.current.isListening && !isSubmittingRef.current) {
                 try { rec.start(); } catch(e){}
              }
          }
          rec.start();
          activeRecognitionRef.current = rec;
      }

    } catch (e) { 
        console.error("Active Mic Error:", e);
        resetToIdle(); 
    }
  };

  const resetSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
          if (stateRef.current.isListening) {
             stopListeningAndSend();
          }
      }, 3500); 
  };

  const startWaveformLoop = () => {
    const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 0);
    const update = () => {
      if (analyserRef.current && stateRef.current.isListening) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const rawLevels = Array.from(dataArray).slice(0, 20); 
        setVisualLevels(rawLevels); 
        
        const sum = rawLevels.reduce((a, b) => a + b, 0);
        const average = sum / rawLevels.length;

        if (average > 10) {
            resetSilenceTimer();
        }

        rafIdRef.current = requestAnimationFrame(update);
      }
    };
    rafIdRef.current = requestAnimationFrame(update);
  };

  const stopListeningAndSend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      if (activeRecognitionRef.current) {
          activeRecognitionRef.current.onend = null; 
          activeRecognitionRef.current.stop();
          activeRecognitionRef.current = null;
      }

      if (recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.stop(); 
      } else {
          if (stateRef.current.finalTranscript) handleSend(stateRef.current.finalTranscript);
          else resetToIdle();
      }
  };

  const cancelRecording = () => {
      isCancelledRef.current = true;
      resetToIdle();
  };

  const handleSend = async (forcedText?: string, audioBlob?: Blob, existingAudioBase64?: string) => {
    if (isSubmittingRef.current || isLimitReached) return;
    
    const textToSend = forcedText || input;
    if (!textToSend.trim() && !audioBlob && !pendingImage && !existingAudioBase64) { 
        resetToIdle(); 
        return; 
    }

    isSubmittingRef.current = true;
    setIsSearchActive(false);
    
    const displayText = textToSend.trim() ? textToSend : ((audioBlob || existingAudioBase64) ? 'رسالة صوتية 🎤' : '');
    stateRef.current.isListening = false;
    setAppStatus('thinking');

    let userVoiceDataURI = existingAudioBase64 || '';
    let geminiAudioInput = ''; 
    
    if (existingAudioBase64) {
        geminiAudioInput = existingAudioBase64.includes(',') ? existingAudioBase64.split(',')[1] : existingAudioBase64;
    } else if (audioBlob) {
        userVoiceDataURI = await new Promise<string>((resolve) => { 
            const reader = new FileReader(); 
            reader.onload = () => resolve(reader.result as string); 
            reader.readAsDataURL(audioBlob); 
        });
        geminiAudioInput = userVoiceDataURI.split(',')[1];
    }

    const userMsg: ExtendedMessage = { 
        userId: currentUser.phone, 
        role: 'user', text: displayText, 
        timestamp: Date.now(), image: pendingImage?.data, voiceData: userVoiceDataURI || undefined,
        isError: false
    };
    
    let id = Date.now();
    if (!isRestrictedMode) id = await shadowDB.saveMessage(userMsg);
    setMessages(prev => [...prev, { ...userMsg, id }]);
    
    const currentImg = pendingImage;
    setInput(''); setPendingImage(null); setLiveTranscript('');
    abortControllerRef.current = new AbortController();

    try {
      let extra: any = undefined;
      if (geminiAudioInput) {
        extra = { data: geminiAudioInput, mimeType: 'audio/webm', type: 'audio' };
      } else if (currentImg) {
        extra = { data: currentImg.data, mimeType: currentImg.type, type: 'image' };
      }
      
      const history = isRestrictedMode ? messages : await shadowDB.getHistory(currentUser.phone);
      
      const result = await getShadowResponse(
          history.map(m => ({ role: m.role, parts: [{ text: m.text }] })), 
          displayText || "استمع إلى الصوت", 
          extra,
          currentUser,
          abortControllerRef.current.signal 
      );
      
      let voiceData: string | null = null;
      if (!isMuted && !result.isError) {
          voiceData = await getShadowVoice(result.text, 'male');
      }

      // Format Action Card Data for UI
      let uiCard = undefined;
      if (result.toolAction) {
          const t = result.toolAction;
          if (t.type === 'display_business_doc') {
              uiCard = { cardType: 'business_doc', data: t.data };
          } else if (t.type === 'display_ui_card' || t.type === 'open_app') {
             uiCard = {
                 cardType: t.type_card || 'deep_link_fallback',
                 title: t.title || t.app_name || 'Action',
                 description: t.description || t.specific_action || '',
                 url: t.url || t.search_query,
                 number: t.number || 'generic'
             };
             // Auto open link if needed
             if (t.type === 'open_app' && t.url) setTimeout(() => window.open(t.url, '_blank'), 1500);
          }
      }

      const modelMsg: ExtendedMessage = { 
          userId: currentUser.phone, role: 'model', text: result.text, timestamp: Date.now(), 
          groundingLinks: result.groundingLinks, voiceData: voiceData || undefined, isError: result.isError,
          uiCard: uiCard // Save Card to Message
      };
      
      let modelId = Date.now() + 1;
      if (!isRestrictedMode) modelId = await shadowDB.saveMessage(modelMsg);
      setMessages(prev => [...prev, { ...modelMsg, id: modelId }]);
      
      isSubmittingRef.current = false;

      if (voiceData) {
          setPlayingMessageId(modelId);
          setAppStatus('speaking');
          playShadowVoice(result.text, 'male', voiceData, () => { 
              setPlayingMessageId(null);
              resetToIdle(); 
              if (result.shouldUpgrade) setTimeout(() => onUpgrade(), 500);
          });
      } else {
          resetToIdle();
          if (isMuted && !result.isError) {
            getShadowVoice(result.text, 'male').then(async (audio) => { if (audio) await shadowDB.updateMessage(modelId, { voiceData: audio }); });
          }
          if (result.shouldUpgrade) setTimeout(() => onUpgrade(), 1500);
      }

    } catch (e: any) { 
        const errorMsg: ExtendedMessage = {
             userId: currentUser.phone, role: 'model', text: "السيستم عليه ضغط بسيط يا ريس. دقيقة وراجعلك.", timestamp: Date.now(), isError: true
        };
        setMessages(prev => [...prev, errorMsg]);
        resetToIdle();
    }
  };

  const handleShareMessage = async (text: string) => {
      const refCode = currentUser.affiliate?.referralCode || '';
      const url = `https://Ez-zel.vercel.app/${refCode ? `?ref=${refCode}` : ''}`;
      if (navigator.share) {
          try { await navigator.share({ title: 'رسالة من الظل', text: `${text}\n\n💡 ${url}` }); } catch (e) {}
      } else {
          navigator.clipboard.writeText(`${text}\n\n${url}`);
          alert("تم النسخ!");
      }
  };

  const handleStopPlayback = () => { 
      stopVoice(); 
      if (userAudioPlayerRef.current) { userAudioPlayerRef.current.pause(); userAudioPlayerRef.current = null; } 
      setPlayingMessageId(null); 
      if (!stateRef.current.isListening) resetToIdle(); 
  };
  
  const handlePlayMessage = (msg: DBMessage) => { 
      if (playingMessageId === msg.id) { handleStopPlayback(); return; } 
      handleStopPlayback(); 
      setPlayingMessageId(msg.id!); 
      
      if (msg.role === 'user' && msg.voiceData) { 
          const audio = new Audio(msg.voiceData); 
          userAudioPlayerRef.current = audio; 
          audio.onended = () => { setPlayingMessageId(null); userAudioPlayerRef.current = null; }; 
          audio.play().catch(e => setPlayingMessageId(null)); 
      } else { 
          setAppStatus('speaking'); 
          playShadowVoice(msg.text, 'male', msg.voiceData, () => { 
              setPlayingMessageId(null); 
              setAppStatus('idle'); 
          }); 
      } 
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0]; 
      if (file) { 
          setIsProcessingImage(true); 
          try { const compressed = await compressImage(file); setPendingImage(compressed); } catch(err) { console.error(err); } finally { setIsProcessingImage(false); if (fileInputRef.current) fileInputRef.current.value = ''; } 
      } 
  };
  
  const handleAppCardAction = async (card: any) => { 
      if (!card) return; 
      
      // Invoice/Quote Print Logic
      if (card.cardType === 'business_doc') {
          window.print();
          return;
      }

      if (card.url) { 
          window.open(card.url, '_blank', 'noopener,noreferrer'); 
      } 
  };

  const getCardIcon = (type: string, number?: string) => { 
      if (type === 'business_doc') return <Printer className="w-6 h-6 text-white" />;
      if (type === 'government_action') return <Landmark className="w-6 h-6 text-amber-400" />;
      if (type === 'deep_link_fallback') {
          if (number === 'music') return <Music className="w-6 h-6 text-red-400" />;
          if (number === 'video') return <Video className="w-6 h-6 text-red-400" />;
          if (number === 'phone') return <PhoneCall className="w-6 h-6 text-green-400" />;
          if (number === 'message') return <MessageCircle className="w-6 h-6 text-green-400" />;
          if (number === 'hotel') return <Hotel className="w-6 h-6 text-blue-400" />;
          if (number === 'govt') return <Landmark className="w-6 h-6 text-amber-400" />;
          if (number === 'pay') return <CreditCard className="w-6 h-6 text-purple-400" />;
          return <ExternalLink className="w-6 h-6 text-blue-400" />;
      }
      return <ExternalLink className="w-6 h-6 text-white" />;
  };

  const renderCard = (card: any) => {
      if (card.cardType === 'business_doc') {
          return (
            <div className="mt-4 bg-white text-black rounded-[22px] p-6 shadow-2xl printable-invoice w-full md:w-[400px]">
                <div className="flex justify-between items-start mb-6 border-b border-black/10 pb-4">
                    <div>
                        <h2 className="text-xl font-black">{card.data.docType === 'quote' ? 'عرض سعر' : (card.data.docType === 'contract' ? 'عقد اتفاق' : 'فاتورة')}</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">#{Math.floor(Math.random() * 10000)}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-xs">التاريخ</p>
                        <p className="text-[10px] text-gray-600 font-mono">{new Date().toLocaleDateString('en-EG')}</p>
                    </div>
                </div>
                <div className="mb-4">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">إلى السيد/السادة</p>
                    <h3 className="text-lg font-bold">{card.data.clientName}</h3>
                </div>
                
                {card.data.docType === 'contract' ? (
                    <div className="mb-6 text-xs leading-relaxed whitespace-pre-wrap font-medium border p-3 rounded-xl bg-gray-50 border-gray-200">
                        {card.data.contractBody || "..."}
                        <div className="mt-6 flex justify-between pt-4 border-t border-black/10">
                            <div className="text-center w-1/3">
                                <p className="font-bold text-[10px] mb-6">توقيع الطرف الأول</p>
                                <div className="h-0.5 bg-black/20 w-full"></div>
                            </div>
                            <div className="text-center w-1/3">
                                <p className="font-bold text-[10px] mb-6">توقيع الطرف الثاني</p>
                                <div className="h-0.5 bg-black/20 w-full"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-right text-xs mb-4">
                            <thead className="border-b border-black/10 text-gray-500">
                                <tr>
                                    <th className="py-2">الوصف</th>
                                    <th className="py-2 text-left">القيمة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {card.data.items?.map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-black/5 last:border-0">
                                        <td className="py-2 font-bold">{item.desc}</td>
                                        <td className="py-2 text-left font-mono">{item.price} {card.data.currency}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className={`flex justify-between items-center p-3 rounded-xl mb-4 ${card.data.docType === 'quote' ? 'bg-amber-100 text-amber-900' : 'bg-black text-white'}`}>
                            <span className="font-bold text-xs">الإجمالي</span>
                            <span className="font-black text-lg font-mono">
                                {card.data.items?.reduce((s:number, i:any) => s + i.price, 0)} {card.data.currency}
                            </span>
                        </div>
                    </>
                )}
                
                <button onClick={() => window.print()} className="w-full py-2 border-2 border-black rounded-xl font-black flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all text-xs print:hidden">
                    <Printer className="w-3 h-3" /> طباعة / PDF
                </button>
            </div>
          );
      } else {
          return (
            <div className={`mt-4 rounded-[22px] p-4 w-full md:w-[320px] ${card.cardType === 'government_action' ? 'bg-[#0f0f0f] border border-amber-500/20' : 'bg-[#0f0f0f]/90 border border-white/10'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-xl ${card.cardType === 'government_action' ? 'bg-amber-500/10' : 'bg-white/10'}`}>
                        {getCardIcon(card.cardType, card.number)}
                    </div>
                    <div>
                        <h3 className={`font-black text-xs ${card.cardType === 'government_action' ? 'text-amber-500' : 'text-white'}`}>{card.title}</h3>
                        <p className="text-[10px] text-white/50 truncate max-w-[200px]">{card.description}</p>
                    </div>
                </div>
                <button onClick={() => handleAppCardAction(card)} className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs border ${card.cardType === 'government_action' ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-600' : 'bg-white/10 hover:bg-white/20 text-white border-white/10'}`}>
                    {card.cardType === 'deep_link_fallback' || card.cardType === 'government_action' ? <ExternalLink className="w-3 h-3" /> : (card.cardType === 'copy_link' ? <Copy className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />)}
                    {card.cardType === 'government_action' ? 'بدء الخدمة' : (card.cardType === 'deep_link_fallback' ? 'فتح الرابط' : (card.cardType === 'copy_link' ? 'نسخ' : 'تنفيذ'))}
                </button>
            </div>
          );
      }
  };

  const displayedMessages = messages.filter(m => {
    if (!isSearchActive || !searchQuery.trim()) return true;
    return m.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#000] text-white font-['Cairo'] overflow-hidden relative">
      {showCapabilities && <CapabilitiesGuide onClose={() => setShowCapabilities(false)} onJoin={onUpgrade} onAffiliate={onOpenAffiliate} />}
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />

      {appStatus === 'listening' && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="absolute top-10 left-10"><button onClick={cancelRecording} className="p-4 bg-white/10 rounded-full hover:bg-white/20"><X className="w-8 h-8" /></button></div>
              <div className="text-center mb-10"><h2 className="text-3xl font-black text-white mb-2 animate-pulse">جاري الاستماع...</h2><p className="text-white/50 text-lg font-medium">{liveTranscript || "سامعك يا ريس..."}</p></div>
              <div className="flex items-end gap-1.5 h-32 mb-12">{visualLevels.map((level, i) => (<div key={i} className="w-3 bg-gradient-to-t from-cyan-600 to-purple-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(10, level / 2)}%`, opacity: Math.max(0.3, level / 255) }}></div>))}</div>
              <button onClick={() => stopListeningAndSend()} className="p-6 bg-red-600 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform"><Square className="w-8 h-8 fill-current" /></button>
          </div>
      )}

      {/* HEADER */}
      <div className="h-14 px-4 border-b border-white/10 bg-[#0a0a0a] flex justify-between items-center shrink-0 z-50 shadow-md relative transition-all">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all group shrink-0"><Home className="w-4 h-4 group-hover:text-cyan-400 transition-colors" /></button>
          {isSearchActive ? (
              <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                  <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" /><input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث في الذاكرة..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-full py-1.5 pr-9 pl-4 text-sm text-white focus:border-purple-500/50 outline-none" /></div>
                  <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-1.5 bg-white/5 rounded-full hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
          ) : (
              <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0 ${appStatus === 'thinking' ? 'bg-purple-600 shadow-purple-500/50' : 'bg-white/10'}`}>{appStatus === 'thinking' ? <Brain className="w-4 h-4 text-white animate-pulse" /> : <Activity className="w-4 h-4 text-cyan-400" />}</div>
                  <div className="overflow-hidden"><h1 className="text-base font-black tracking-tighter leading-none text-white whitespace-nowrap">غرفة عمليات الظل</h1><div className="flex items-center gap-1"><span className={`text-[10px] font-bold truncate ${isAdmin ? 'text-amber-500' : 'text-purple-500'}`}>{getGreetingSubtitle()}</span><span className="text-[10px] text-white/30">•</span><span className={`text-[9px] font-bold uppercase tracking-widest ${isSentinelMode ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>{isSentinelMode ? 'Sentinel ON' : 'Live'}</span></div></div>
              </div>
          )}
        </div>
        <div className="flex items-center gap-3 pl-2">
            {!isSearchActive && (
                <>
                    <button onClick={toggleSentinelMode} className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${isSentinelMode ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`}>
                        <Ear className={`w-4 h-4 ${isSentinelMode ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-bold hidden md:inline">{isSentinelMode ? 'الحارس نشط' : 'الحارس'}</span>
                    </button>
                    {onOpenAffiliate && !isRestrictedMode && <button onClick={onOpenAffiliate} className="p-2 bg-emerald-900/20 border border-emerald-500/20 rounded-full text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"><DollarSign className="w-4 h-4" /></button>}
                    <button onClick={() => setIsSearchActive(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white transition-all"><Search className="w-4 h-4" /></button>
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full border transition-all ${isMuted ? 'bg-white/5 border-white/10 text-white/30' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'}`}>{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                </>
            )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 pb-44 space-y-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">
        {displayedMessages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'system' ? (
                <div className="w-full flex justify-center my-2"><div className="bg-amber-900/40 border border-amber-500/30 rounded-full px-6 py-2 flex items-center gap-3 backdrop-blur-md"><Clock className="w-4 h-4 text-amber-500 animate-pulse" /><span className="text-xs font-bold text-amber-200">{m.text}</span></div></div>
            ) : (
                <div className={`max-w-[90%] md:max-w-[70%] p-4 rounded-[20px] relative border backdrop-blur-md ${m.role === 'user' ? 'bg-[#1a1a1a] border-white/5 text-white/90 rounded-tl-none' : (m.isError ? 'bg-red-900/20 border-red-500/30 text-red-200' : 'bg-[#0f0f0f] border-purple-500/20 text-white shadow-lg')} ${m.role !== 'user' ? 'rounded-tr-none' : ''}`}>
                {m.image && <img src={m.image} className="w-full h-auto max-h-56 object-cover rounded-xl mb-3 border border-white/5" />}
                <div className="text-sm leading-6 font-medium whitespace-pre-wrap">{highlightText(m.text)}</div>
                
                {/* PERSISTENT ACTION CARD RENDERING */}
                {m.uiCard && renderCard(m.uiCard)}

                {m.groundingLinks && m.groundingLinks.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/5">
                        <div className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> المصادر الحية (Realtime News)</div>
                        <div className="flex flex-col gap-1">{m.groundingLinks.slice(0, 3).map((link, i) => (<a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all group"><span className="text-[10px] text-cyan-200 truncate flex-1 font-bold group-hover:text-cyan-400">{link.title || link.uri}</span></a>))}</div>
                    </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-[9px] text-white/20 font-black tracking-widest">{new Date(m.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                    <div className="flex gap-2 items-center">
                        {m.isError && <button onClick={() => handleSend(m.text)} className="flex items-center gap-1 text-[9px] text-red-400 font-bold bg-red-900/20 px-2 py-1 rounded-full border border-red-500/30"><RefreshCw className="w-3 h-3" /></button>}
                        {m.role === 'user' && !m.voiceData && (
                            <button onClick={() => setInput(m.text)} className="px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/5 flex items-center gap-1 hover:bg-white/10" title="إعادة استخدام">
                                <Edit3 className="w-2.5 h-2.5" />
                            </button>
                        )}
                        {m.role === 'model' && <button onClick={() => handleShareMessage(m.text)} className="px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/5 flex items-center gap-1 hover:bg-white/10"><Share2 className="w-2.5 h-2.5" /></button>}
                        {(m.role === 'model' || (m.role === 'user' && m.voiceData)) && !m.isError && (
                            <div className="flex gap-2">
                                {playingMessageId === m.id ? <button onClick={handleStopPlayback} className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><Square className="w-2.5 h-2.5 fill-current" /> <span className="text-[9px] font-black">إيقاف</span></button> : <button onClick={() => handlePlayMessage(m)} className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1"><Play className="w-2.5 h-2.5 fill-current" /> <span className="text-[9px] font-black">{m.role === 'user' ? 'تسميع' : 'تشغيل'}</span></button>}
                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}
          </div>
        ))}
        
        {appStatus === 'thinking' && !searchQuery && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 items-center gap-3">
                <div className="bg-[#0f0f0f] border border-purple-500/20 rounded-[20px] rounded-tr-none p-4 flex items-center gap-3 shadow-lg"><Brain className="w-4 h-4 text-purple-500 animate-pulse" /><div className="flex flex-col"><span className="text-[10px] font-black text-purple-400 animate-pulse tracking-wide">الظل بيفكر...</span></div></div>
                <button onClick={() => { if(abortControllerRef.current) abortControllerRef.current.abort(); resetToIdle(); }} className="p-3 bg-red-600 rounded-full text-white shadow-lg"><StopCircle className="w-5 h-5" /></button>
            </div>
        )}
      </div>

      <div className={`fixed bottom-[32px] left-0 w-full p-3 md:p-4 bg-[#0a0a0a] border-t border-white/5 z-50 transition-all duration-500 ${isLimitReached ? 'opacity-0 pointer-events-none translate-y-full' : 'opacity-100'}`}>
        {pendingImage && (<div className="mb-2 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg w-fit border border-white/10"><span className="text-[10px] text-white/70 font-bold">صورة مرفقة</span><button onClick={() => setPendingImage(null)}><X className="w-3 h-3 text-white/50 hover:text-red-400" /></button></div>)}
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
            <div className="flex-1 bg-[#151515] border border-white/10 rounded-[24px] flex items-end p-2 focus-within:border-cyan-500/30 transition-colors shadow-inner">
                <button disabled={isProcessingImage} onClick={() => { if(fileInputRef.current) fileInputRef.current.value = ''; fileInputRef.current?.click(); }} className={`p-3 transition-colors hover:bg-white/5 rounded-full mb-0.5 ${isProcessingImage ? 'text-purple-500 animate-pulse' : 'text-white/20 hover:text-white'}`}>{isProcessingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}</button>
                <textarea value={input} onChange={handleInputChange} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={isRestrictedMode ? "اكتب رسالتك (فترة تجربة)..." : (isSentinelMode ? "وضع الحارس مفعل... (قول يا ظل)" : (isAdmin ? "أمرك يا ريس..." : "قولي يا ريس..."))} className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/20 focus:ring-0 resize-none min-h-[50px] max-h-[150px] py-3 px-2 scrollbar-hide font-medium leading-relaxed" rows={1} style={{ height: 'auto', minHeight: '50px' }} onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = `${Math.min(target.scrollHeight, 150)}px`; }} />
                {(input.trim() || pendingImage) && <button onClick={() => handleSend()} className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-full transition-all shadow-lg hover:shadow-cyan-600/20 mb-0.5 animate-in zoom-in"><Send className="w-5 h-5 text-white" /></button>}
            </div>
            <button onClick={startListening} className={`p-4 rounded-[24px] border shadow-lg transition-all active:scale-95 mb-0.5 ${isSentinelMode ? 'bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}>{isSentinelMode ? <Ear className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}</button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;