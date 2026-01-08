
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Square, Volume2, VolumeX, Play, Pause, Brain, Activity, Mic2, Paperclip, X, Zap, Lock, Crown, Globe, Sun, ArrowLeft, Loader2, Sparkles, ArrowRight, DollarSign, RotateCcw, Home, Clock, MessageCircle, Share2, Copy, Shield, Download, Smartphone, Cpu, HelpCircle, Star, Search, ExternalLink, PhoneCall, CheckCircle, Ear, RefreshCw, StopCircle, MapPin, Hotel, Music, Video, Grid } from 'lucide-react';
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

// Extend DBMessage locally to support UI states
interface ExtendedMessage extends DBMessage {
    isError?: boolean;
}

// Image Compression Helper
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
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);
  
  const [isSentinelMode, setIsSentinelMode] = useState(false);
  const wakeLockRef = useRef<any>(null);
  
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showFeedback, setShowFeedback] = useState(false);
  const [activeAppCard, setActiveAppCard] = useState<{ cardType: string, title: string, description: string, url?: string, number?: string } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSystemMessageIdRef = useRef<number | undefined>(undefined);

  const isRestrictedMode = currentUser.phone === 'GUEST' || (currentUser.tier === 'lite' && currentUser.affiliate?.isMarketer);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    if (isRestrictedMode) {
        const trialStartStr = localStorage.getItem('shadow_guest_start');
        if (trialStartStr) {
            const trialStart = parseInt(trialStartStr);
            const now = Date.now();
            const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
            if (now - trialStart > threeDaysMs) {
                setIsLimitReached(true);
            }
        }
    }
  }, [isRestrictedMode]);

  useEffect(() => {
      window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          setInstallPrompt(e);
      });
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const passiveRecognitionRef = useRef<any>(null); 
  const rafIdRef = useRef<number | null>(null);
  
  // FIX: Using Ref for File Input to ensure programmatic access
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const isCancelledRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number>(0);
  const stateRef = useRef({ isBusy: false, isListening: false, finalTranscript: '', lastAudioTime: Date.now() });

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

  useEffect(() => {
      const savedDraft = localStorage.getItem(`shadow_draft_${currentUser.phone}`);
      if (savedDraft) {
          setInput(savedDraft);
      }
  }, [currentUser.phone]);

  const toggleSentinelMode = async () => {
      if (!isSentinelMode) {
          try {
              if ('wakeLock' in navigator) {
                  // @ts-ignore
                  wakeLockRef.current = await navigator.wakeLock.request('screen');
              }
              setIsSentinelMode(true);
              startPassiveListening();
          } catch (err) {
              console.error(err);
              setIsSentinelMode(true);
              startPassiveListening();
          }
      } else {
          if (wakeLockRef.current) {
              wakeLockRef.current.release();
              wakeLockRef.current = null;
          }
          setIsSentinelMode(false);
          if (passiveRecognitionRef.current) passiveRecognitionRef.current.stop();
          setAppStatus('idle');
      }
  };

  const startPassiveListening = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      if (passiveRecognitionRef.current) {
          try { passiveRecognitionRef.current.stop(); } catch(e) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'ar-EG';

      rec.onresult = (e: any) => {
          if (stateRef.current.isBusy || appStatus !== 'idle') return;

          const results = e.results;
          const transcript = results[results.length - 1][0].transcript.trim().toLowerCase();
          
          if (transcript.includes('يا ظل') || transcript.includes('يا تيتو') || transcript.includes('يا صاحبي')) {
              rec.stop(); 
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
              setTimeout(() => startListening(), 200);
          }
      };

      rec.onend = () => {
          if (isSentinelMode && !stateRef.current.isBusy && appStatus === 'idle') {
              try { rec.start(); } catch(e) {}
          }
      };

      try { rec.start(); } catch(e) {}
      passiveRecognitionRef.current = rec;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInput(val);
      localStorage.setItem(`shadow_draft_${currentUser.phone}`, val);
  };

  useEffect(() => {
    if (!isRestrictedMode) {
        const load = async () => setMessages(await shadowDB.getHistory(currentUser.phone));
        load();
    } else {
        const savedHistory = localStorage.getItem('shadow_trial_history');
        if (savedHistory) {
            try {
                setMessages(JSON.parse(savedHistory));
            } catch (e) {
                localStorage.removeItem('shadow_trial_history');
                setMessages([]);
            }
        }
        setMessages(prev => {
            if (prev.length === 0) {
                return [{
                    role: 'model',
                    userId: currentUser.phone,
                    text: `يا مرحب بيك يا ${currentUser.name.split(' ')[0]}.
أنا ظلك الرقمي.. مش مجرد تطبيق.
أنا عقلك التاني اللي بيحلل، وبيخطط، وبيحفظ أسرارك.

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
      if (isRestrictedMode && messages.length > 0) {
          try {
            const safeHistory = messages.map(m => ({
                ...m,
                voiceData: undefined, 
                image: m.image && m.image.length > 50000 ? undefined : m.image 
            }));
            localStorage.setItem('shadow_trial_history', JSON.stringify(safeHistory));
          } catch (e) { }
      }
  }, [messages, isRestrictedMode]);

  const saveVoiceToMessage = async (msgId: number, audioBase64: string) => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, voiceData: audioBase64 } : m));
      if (!isRestrictedMode) {
          await shadowDB.updateMessage(msgId, { voiceData: audioBase64 });
      }
  };

  useEffect(() => { 
    if (scrollRef.current && !isSearchActive && !searchQuery) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, appStatus, liveTranscript, activeAppCard, isSearchActive, searchQuery]);

  useEffect(() => {
      if (isSearchActive && searchInputRef.current) {
          searchInputRef.current.focus();
      }
  }, [isSearchActive]);

  const resetToIdle = useCallback(() => {
    if (recorderRef.current) {
        if(recorderRef.current.state !== 'inactive') recorderRef.current.stop();
        recorderRef.current = null;
    }
    if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stateRef.current.isBusy = false;
    stateRef.current.isListening = false;
    stateRef.current.finalTranscript = '';
    isCancelledRef.current = false;
    setAppStatus('idle');
    setLiveTranscript('');
    setPendingImage(null);
    if (isSentinelMode) {
        setTimeout(startPassiveListening, 500); 
    }
  }, [isSentinelMode]);

  const startListening = async () => {
    if (isLimitReached) return;
    stateRef.current.isBusy = true;

    if (passiveRecognitionRef.current) {
        try { passiveRecognitionRef.current.stop(); } catch(e) {}
    }
    
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    stopVoice();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createMediaStreamSource(stream).context.createAnalyser();
      analyser.fftSize = 64; 
      source.connect(analyser);
      analyserRef.current = analyser;

      setAppStatus('listening');
      stateRef.current.isListening = true;
      stateRef.current.finalTranscript = '';
      stateRef.current.lastAudioTime = Date.now();
      recordingStartTimeRef.current = Date.now(); 
      isCancelledRef.current = false;

      setupActiveSpeechRecognition();
      
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      
      recorder.onstop = () => { 
        if (isCancelledRef.current) { 
            stream.getTracks().forEach(track => track.stop());
            resetToIdle();
            return;
        }

        const duration = Date.now() - recordingStartTimeRef.current;
        if (duration < 1000 && !stateRef.current.finalTranscript.trim()) {
            stream.getTracks().forEach(track => track.stop());
            resetToIdle();
            return;
        }

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSend(stateRef.current.finalTranscript, blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start(100);
      recorderRef.current = recorder;
      startWaveformLoop();
    } catch (e) { 
        console.error("Mic Access Error:", e);
        resetToIdle(); 
    }
  };

  const startWaveformLoop = () => {
    const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 0);
    const update = () => {
      if (analyserRef.current && stateRef.current.isListening) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const rawLevels = Array.from(dataArray).slice(0, 20); 
        setVisualLevels(rawLevels); 
      }
      rafIdRef.current = requestAnimationFrame(update);
    };
    rafIdRef.current = requestAnimationFrame(update);
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
      
      if (stateRef.current.isListening) {
           silenceTimerRef.current = setTimeout(() => {
               if (stateRef.current.isListening) {
                   stopListeningAndSend();
               }
           }, 5000); 
      }
    };

    rec.onend = () => {
        if (stateRef.current.isListening) {
             try { rec.start(); } catch(e) { }
        }
    };

    try { rec.start(); } catch(e) {}
    recognitionRef.current = rec;
  };

  const stopListeningAndSend = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
        recognitionRef.current.onend = null; 
        recognitionRef.current.stop();
        recognitionRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
        stateRef.current.isListening = false;
        recorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
      isCancelledRef.current = true; 
      stateRef.current.isListening = false;
      stateRef.current.isBusy = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.stop();
      }
      if (recognitionRef.current) {
          recognitionRef.current.onend = null; 
          recognitionRef.current.stop();
          recognitionRef.current = null;
      }
  };

  const stopThinking = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      setAppStatus('idle');
      stateRef.current.isBusy = false;
      if (isSentinelMode) startPassiveListening();
  };

  const handleSend = async (forcedText?: string, audioBlob?: Blob, existingAudioBase64?: string) => {
    if (isLimitReached) return; 
    
    if (isSearchActive) {
        setIsSearchActive(false);
        setSearchQuery('');
    }

    const textToSend = forcedText || input;
    if (!textToSend.trim() && !audioBlob && !pendingImage && !existingAudioBase64) { resetToIdle(); return; }
    
    const displayText = textToSend.trim() ? textToSend : ((audioBlob || existingAudioBase64) ? 'رسالة صوتية 🎤' : '');

    stateRef.current.isBusy = true;
    setAppStatus('thinking');
    setActiveAppCard(null); 

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
    
    setInput(''); 
    localStorage.removeItem(`shadow_draft_${currentUser.phone}`);
    setPendingImage(null); 
    setLiveTranscript('');

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
      
      // Handle Deep Links and Tools - ENHANCED
      if (result.toolAction) {
          const t = result.toolAction;
          
          if (t.type === 'open_uber') {
              const dest = t.destination || '';
              const deepLink = `https://m.uber.com/ul/?action=setPickup&client_id=YOUR_CLIENT_ID&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(dest)}`;
              window.open(deepLink, '_blank');
              setActiveAppCard({ cardType: 'deep_link_fallback', title: `فتح Uber: ${dest}`, description: 'تأكيد الرحلة.', url: deepLink });
          } 
          else if (t.type === 'search_hotels') {
              const loc = t.location || '';
              const deepLink = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(loc)}`;
              window.open(deepLink, '_blank');
              setActiveAppCard({ cardType: 'deep_link_fallback', title: `فنادق في ${loc}`, description: 'Booking.com', url: deepLink });
          } 
          else if (t.type === 'open_youtube') {
              const query = t.query || '';
              const deepLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
              window.open(deepLink, '_blank');
              setActiveAppCard({ cardType: 'deep_link_fallback', title: `فيديو: ${query}`, description: 'فتح على YouTube', url: deepLink });
          }
          else if (t.type === 'open_youtube_music') {
              const song = t.song || '';
              // Music Redirect
              const deepLink = `https://music.youtube.com/search?q=${encodeURIComponent(song)}`;
              window.open(deepLink, '_blank');
              setActiveAppCard({ cardType: 'deep_link_fallback', title: `تشغيل: ${song}`, description: 'YouTube Music 🎵', url: deepLink });
          }
          else if (t.type === 'open_generic_app') {
               const appName = t.appName || '';
               const context = t.context || '';
               // Try to construct a search scheme for Google Play or a common web URL
               const storeLink = `https://play.google.com/store/search?q=${encodeURIComponent(appName)}&c=apps`;
               window.open(storeLink, '_blank');
               setActiveAppCard({ cardType: 'deep_link_fallback', title: `تطبيق ${appName}`, description: `البحث في المتجر: ${context}`, url: storeLink });
          }
          else if (t.type === 'share_referral_link') {
               const refCode = currentUser.affiliate?.referralCode || '';
               const link = `https://ez-zel.app/?ref=${refCode}`;
               setActiveAppCard({ cardType: 'copy_link', title: `رابط الإحالة الخاص بيك`, description: link, url: link });
          }
          else if (t.type === 'app_card') {
             setActiveAppCard({ cardType: t.cardType, title: t.title, description: t.description });
          } 
          else if (t.type === 'call_execute' || t.type === 'call') {
             const number = t.number;
             window.location.href = `tel:${number}`;
             setActiveAppCard({ cardType: 'call', title: `اتصال بـ: ${number}`, description: 'جاري الاتصال...', number: number });
          } 
          else if (t.type === 'whatsapp_master' || t.type === 'whatsapp') {
             let phone = t.number.replace(/\s/g, ''); 
             if (phone.startsWith('01')) phone = '+2' + phone; 
             const msg = t.message || '';
             const url = `https://wa.me/${phone.replace(/^\++/, '')}?text=${encodeURIComponent(msg)}`;
             window.open(url, '_blank');
             setActiveAppCard({ cardType: 'deep_link_fallback', title: `فتح WhatsApp`, description: `مراسلة ${phone}`, url: url });
          }
      }

      let voiceData: string | null = null;
      if (!isMuted) {
          voiceData = await getShadowVoice(result.text, 'male');
      }

      const modelMsg: DBMessage = { 
          userId: currentUser.phone,
          role: 'model', 
          text: result.text, 
          timestamp: Date.now(), 
          groundingLinks: result.groundingLinks,
          voiceData: voiceData || undefined
      };
      
      let modelId = Date.now() + 1;
      if (!isRestrictedMode) modelId = await shadowDB.saveMessage(modelMsg);
      
      setMessages(prev => [...prev, { ...modelMsg, id: modelId }]);
      
      if (voiceData) {
          setPlayingMessageId(modelId);
          setAppStatus('speaking');
          setLastSpokenText(result.text);
          playShadowVoice(result.text, 'male', voiceData, () => { 
              setPlayingMessageId(null); 
              if (!stateRef.current.isBusy) {
                  setAppStatus('idle'); 
                  if (isSentinelMode) startPassiveListening();
              }
              if (result.shouldUpgrade) {
                  setTimeout(() => onUpgrade(), 500);
              }
          });
      } else {
          setAppStatus('idle');
          stateRef.current.isBusy = false; 
          if (isSentinelMode) startPassiveListening();
          if (isMuted) {
            getShadowVoice(result.text, 'male').then(async (audio) => {
                if (audio) await saveVoiceToMessage(modelId, audio);
            });
          }
          if (result.shouldUpgrade) {
               setTimeout(() => onUpgrade(), 1500);
          }
      }

    } catch (e: any) { 
        if (e.name === 'AbortError') {
            console.log("Generation Aborted");
        } else {
            console.error(e); 
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isError: true } : m));
        }
        setAppStatus('idle'); 
        stateRef.current.isBusy = false;
        if (isSentinelMode) startPassiveListening();
    }
  };

  const handleShareMessage = async (text: string) => {
      const refCode = currentUser.affiliate?.referralCode || '';
      const url = `https://ez-zel.app/${refCode ? `?ref=${refCode}` : ''}`;
      const shareText = `${text}\n\n💡 الظل مش مجرد ذكاء اصطناعي، ده عقلك التاني.\nجربه من هنا: ${url}`;

      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'رسالة من الظل',
                  text: shareText,
              });
          } catch (e) { console.log("Share skipped"); }
      } else {
          navigator.clipboard.writeText(shareText);
          alert("تم نسخ الرسالة مع رابط الدعوة! 📋");
      }
  };

  const handleResendUserMessage = (msg: ExtendedMessage) => {
      if (msg.voiceData) {
          handleSend(msg.text, undefined, msg.voiceData);
      } else {
          handleSend(msg.text);
      }
  };

  const handleStopPlayback = () => { stopVoice(); if (userAudioPlayerRef.current) { userAudioPlayerRef.current.pause(); userAudioPlayerRef.current = null; } setPlayingMessageId(null); 
    if (!stateRef.current.isBusy) setAppStatus('idle'); 
  };
  
  const handlePlayMessage = (msg: DBMessage) => { 
      if (playingMessageId === msg.id) { 
          handleStopPlayback(); 
          return; 
      } 
      handleStopPlayback(); 
      setPlayingMessageId(msg.id!); 
      const wasThinking = appStatus === 'thinking';

      if (msg.role === 'user' && msg.voiceData) { 
          const audio = new Audio(msg.voiceData); 
          userAudioPlayerRef.current = audio; 
          audio.onended = () => { setPlayingMessageId(null); userAudioPlayerRef.current = null; }; 
          audio.play().catch(e => { console.error("Playback failed", e); setPlayingMessageId(null); }); 
      } else { 
          if (!wasThinking) setAppStatus('speaking');
          playShadowVoice(msg.text, 'male', msg.voiceData, () => { 
              setPlayingMessageId(null); 
              if (!wasThinking && !stateRef.current.isBusy) setAppStatus('idle'); 
          }); 
      } 
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0]; 
      if (file) { 
          setIsProcessingImage(true); 
          try { 
              const compressed = await compressImage(file); 
              setPendingImage(compressed); 
          } catch(err) { 
              console.error("Compression failed", err); 
          } finally { 
              setIsProcessingImage(false); 
              // Reset input so same file can be selected again if needed
              if (fileInputRef.current) fileInputRef.current.value = '';
          } 
      } 
  };
  
  const handleAppCardAction = async () => { 
      if (!activeAppCard) return; 
      if (activeAppCard.cardType === 'deep_link_fallback' && activeAppCard.url) { 
          window.open(activeAppCard.url, '_blank'); 
      } else if (activeAppCard.cardType === 'copy_link' && activeAppCard.url) {
          navigator.clipboard.writeText(activeAppCard.url);
          alert("تم نسخ الرابط! 📋");
      } else if (activeAppCard.cardType === 'call' && activeAppCard.number) { 
          window.location.href = `tel:${activeAppCard.number}`; 
      } else if (activeAppCard.cardType === 'install_app') { 
          if (installPrompt) { 
              installPrompt.prompt(); 
              const { outcome } = await installPrompt.userChoice; 
              if (outcome === 'accepted') setInstallPrompt(null); 
          } 
      } else if (['open_vault', 'open_nexus', 'open_pricing'].includes(activeAppCard.cardType)) { 
          if (onNavigateTo) { 
              const section = activeAppCard.cardType.replace('open_', ''); 
              onNavigateTo(section); 
          } 
      } else if (activeAppCard.cardType === 'open_affiliate') { 
          if (onOpenAffiliate) onOpenAffiliate(); 
      } else if (activeAppCard.cardType === 'open_capabilities') { 
          setShowCapabilities(true); setActiveAppCard(null); 
      } else if (activeAppCard.cardType === 'open_support') { 
          setShowFeedback(true); setActiveAppCard(null); 
      } 
  };

  const getCardIcon = (type: string) => { 
      switch(type) { 
          case 'install_app': return <Download className="w-6 h-6 text-white" />; 
          case 'open_vault': return <Shield className="w-6 h-6 text-purple-400" />; 
          case 'open_affiliate': return <DollarSign className="w-6 h-6 text-emerald-400" />; 
          case 'open_nexus': return <Cpu className="w-6 h-6 text-cyan-400" />; 
          case 'open_capabilities': return <Star className="w-6 h-6 text-amber-400" />; 
          case 'open_support': return <HelpCircle className="w-6 h-6 text-pink-400" />; 
          case 'copy_link': return <Copy className="w-6 h-6 text-emerald-400" />;
          case 'deep_link_fallback': 
              if (activeAppCard?.title.includes('YouTube Music')) return <Music className="w-6 h-6 text-red-400" />;
              if (activeAppCard?.title.includes('فيديو')) return <Video className="w-6 h-6 text-red-400" />;
              return <ExternalLink className="w-6 h-6 text-blue-400" />; 
          case 'call': return <PhoneCall className="w-6 h-6 text-white" />; 
          default: return <Grid className="w-6 h-6 text-white" />; 
      } 
  };

  const getCardColor = (type: string) => { 
      switch(type) { 
          case 'install_app': return 'bg-blue-600 hover:bg-blue-500'; 
          case 'open_vault': return 'bg-purple-600 hover:bg-purple-500'; 
          case 'open_affiliate': case 'copy_link': return 'bg-emerald-600 hover:bg-emerald-500'; 
          case 'open_nexus': return 'bg-cyan-600 hover:bg-cyan-500'; 
          case 'deep_link_fallback': return 'bg-white/10 hover:bg-white/20 border border-white/10'; 
          case 'call': return 'bg-emerald-600 hover:bg-emerald-500'; 
          default: return 'bg-white/10 hover:bg-white/20'; 
      } 
  };

  const displayedMessages = messages.filter(m => {
    if (!isSearchActive || !searchQuery.trim()) return true;
    return m.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#000] text-white font-['Cairo'] overflow-hidden relative">
      
      {showCapabilities && <CapabilitiesGuide onClose={() => setShowCapabilities(false)} onJoin={onUpgrade} onAffiliate={onOpenAffiliate} />}
      
      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="image/*" 
      />

      {/* Listening Overlay */}
      {appStatus === 'listening' && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="absolute top-10 left-10">
                  <button onClick={cancelRecording} className="p-4 bg-white/10 rounded-full hover:bg-white/20 hover:text-red-500 transition-all border border-white/5">
                      <X className="w-8 h-8" />
                  </button>
              </div>
              <div className="text-center mb-10"><h2 className="text-3xl font-black text-white mb-2 animate-pulse">جاري الاستماع...</h2><p className="text-white/50 text-lg font-medium">{liveTranscript || "سامعك يا ريس..."}</p></div>
              <div className="flex items-end gap-1.5 h-32 mb-12">{visualLevels.map((level, i) => (<div key={i} className="w-3 bg-gradient-to-t from-cyan-600 to-purple-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(10, level / 2)}%`, opacity: Math.max(0.3, level / 255) }}></div>))}</div>
              <button onClick={() => stopListeningAndSend()} className="p-6 bg-red-600 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform"><Square className="w-8 h-8 fill-current" /></button>
          </div>
      )}

      {/* Top Command Bar */}
      <div className="h-14 px-4 border-b border-white/10 bg-[#0a0a0a] flex justify-between items-center shrink-0 z-50 shadow-md relative transition-all">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all group shrink-0">
             <Home className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
          </button>

          {isSearchActive ? (
              <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                  <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث في الذاكرة..." className="w-full bg-[#1a1a1a] border border-white/10 rounded-full py-1.5 pr-9 pl-4 text-sm text-white focus:border-purple-500/50 outline-none" />
                  </div>
                  <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-1.5 bg-white/5 rounded-full hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
          ) : (
              <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0 ${appStatus === 'thinking' ? 'bg-purple-600 shadow-purple-500/50' : 'bg-white/10'}`}>
                     {appStatus === 'thinking' ? <Brain className="w-4 h-4 text-white animate-pulse" /> : <Activity className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="overflow-hidden">
                      <h1 className="text-base font-black tracking-tighter leading-none text-white whitespace-nowrap">غرفة عمليات الظل</h1>
                      <div className="flex items-center gap-1"><span className={`text-[10px] font-bold truncate ${isAdmin ? 'text-amber-500' : 'text-purple-500'}`}>{getGreetingSubtitle()}</span><span className="text-[10px] text-white/30">•</span><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{isSentinelMode ? 'Sentinel ON' : 'Live'}</span></div>
                  </div>
              </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 pl-2">
            {!isSearchActive && (
                <>
                    <button 
                        onClick={toggleSentinelMode} 
                        className={`p-2 rounded-full border transition-all ${isSentinelMode ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`} 
                        title="وضع الحارس (استماع دائم)"
                    >
                        <Ear className="w-4 h-4" />
                    </button>

                    {onOpenAffiliate && !isRestrictedMode && <button onClick={onOpenAffiliate} className="p-2 bg-emerald-900/20 border border-emerald-500/20 rounded-full text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]" title="اربح المال"><DollarSign className="w-4 h-4" /></button>}
                    <button onClick={() => setIsSearchActive(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white transition-all"><Search className="w-4 h-4" /></button>
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full border transition-all ${isMuted ? 'bg-white/5 border-white/10 text-white/30' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'}`}>{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                </>
            )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 pb-44 space-y-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">
        {displayedMessages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'system' ? (
                <div className="w-full flex justify-center my-2"><div className="bg-amber-900/40 border border-amber-500/30 rounded-full px-6 py-2 flex items-center gap-3 backdrop-blur-md"><Clock className="w-4 h-4 text-amber-500 animate-pulse" /><span className="text-xs font-bold text-amber-200">{m.text}</span></div></div>
            ) : (
                <div className={`max-w-[90%] md:max-w-[70%] p-4 rounded-[20px] relative border backdrop-blur-md ${m.role === 'user' ? 'bg-[#1a1a1a] border-white/5 text-white/90 rounded-tl-none' : 'bg-[#0f0f0f] border-purple-500/20 text-white rounded-tr-none shadow-lg'}`}>
                {m.image && <img src={m.image} className="w-full h-auto max-h-56 object-cover rounded-xl mb-3 border border-white/5" />}
                <div className="text-sm leading-6 font-medium whitespace-pre-wrap">{highlightText(m.text)}</div>
                {m.groundingLinks && m.groundingLinks.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/5">
                        <div className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> المصادر (Detective Agent)</div>
                        <div className="flex flex-col gap-1">{m.groundingLinks.slice(0, 3).map((link, i) => (<a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all group"><span className="text-[10px] text-cyan-200 truncate flex-1 font-bold group-hover:text-cyan-400">{link.title || link.uri}</span></a>))}</div>
                    </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-[9px] text-white/20 font-black tracking-widest">{new Date(m.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                    <div className="flex gap-2 items-center">
                        {m.isError && (
                            <button onClick={() => handleSend(m.text)} className="flex items-center gap-1 text-[9px] text-red-400 font-bold bg-red-900/20 px-2 py-1 rounded-full border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">
                                <RefreshCw className="w-3 h-3" /> إعادة محاولة
                            </button>
                        )}
                        {m.role === 'user' && (
                            <button onClick={() => handleResendUserMessage(m)} className="px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/5 flex items-center gap-1 hover:bg-white/10 hover:text-white transition-all" title="إعادة إرسال">
                                <RefreshCw className="w-2.5 h-2.5" />
                            </button>
                        )}
                        {m.role === 'model' && (
                            <button onClick={() => handleShareMessage(m.text)} className="px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/5 flex items-center gap-1 hover:bg-white/10 hover:text-white transition-all">
                                <Share2 className="w-2.5 h-2.5" />
                            </button>
                        )}
                        {(m.role === 'model' || (m.role === 'user' && m.voiceData)) && (
                            <div className="flex gap-2">
                                {playingMessageId === m.id ? <button onClick={handleStopPlayback} className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 hover:bg-red-500 hover:text-white transition-all"><Square className="w-2.5 h-2.5 fill-current" /> <span className="text-[9px] font-black">إيقاف</span></button> : <button onClick={() => handlePlayMessage(m)} className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 hover:bg-cyan-500 hover:text-black transition-all"><Play className="w-2.5 h-2.5 fill-current" /> <span className="text-[9px] font-black">{m.role === 'user' ? 'تسميع' : 'تشغيل'}</span></button>}
                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}
          </div>
        ))}
        {activeAppCard && !searchQuery && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
                <div className="max-w-[85%] md:max-w-[60%] p-1 rounded-[24px] bg-gradient-to-br from-white/10 to-transparent shadow-xl border border-white/20 backdrop-blur-md">
                    <div className="bg-[#0f0f0f]/90 rounded-[22px] p-5">
                        <div className="flex items-center gap-3 mb-4"><div className={`p-2 rounded-xl ${getCardColor(activeAppCard.cardType).split(' ')[0]} bg-opacity-20`}>{getCardIcon(activeAppCard.cardType)}</div><div><h3 className="font-black text-white text-sm">{activeAppCard.title}</h3><p className="text-[10px] text-white/50">{activeAppCard.description}</p></div></div>
                        <button onClick={handleAppCardAction} className={`w-full py-3 ${getCardColor(activeAppCard.cardType)} text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95`}>{activeAppCard.cardType === 'call' ? <PhoneCall className="w-4 h-4" /> : (activeAppCard.cardType === 'copy_link' ? <Copy className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}{activeAppCard.cardType === 'deep_link_fallback' ? 'فتح الآن' : (activeAppCard.cardType === 'copy_link' ? 'نسخ الرابط' : 'تنفيذ')}</button>
                    </div>
                </div>
            </div>
        )}
        
        {appStatus === 'thinking' && !searchQuery && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 items-center gap-3">
                <div className="bg-[#0f0f0f] border border-purple-500/20 rounded-[20px] rounded-tr-none p-4 flex items-center gap-3 shadow-lg">
                    <Brain className="w-4 h-4 text-purple-500 animate-pulse" />
                    <div className="flex flex-col"><span className="text-[10px] font-black text-purple-400 animate-pulse tracking-wide">الظل بيفكر...</span></div>
                </div>
                <button onClick={stopThinking} className="p-3 bg-red-600 rounded-full text-white shadow-lg shadow-red-600/30 hover:scale-110 active:scale-95 transition-all" title="إلغاء التفكير">
                    <StopCircle className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>

      {/* Input Deck */}
      <div className={`fixed bottom-[32px] left-0 w-full p-3 md:p-4 bg-[#0a0a0a] border-t border-white/5 z-50 transition-all duration-500 ${isLimitReached ? 'opacity-0 pointer-events-none translate-y-full' : 'opacity-100'}`}>
        {pendingImage && (
            <div className="mb-2 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg w-fit border border-white/10">
                <span className="text-[10px] text-white/70 font-bold">صورة مرفقة (مضغوطة)</span>
                <button onClick={() => setPendingImage(null)}><X className="w-3 h-3 text-white/50 hover:text-red-400" /></button>
            </div>
        )}
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
            <div className="flex-1 bg-[#151515] border border-white/10 rounded-[24px] flex items-end p-2 focus-within:border-cyan-500/30 transition-colors shadow-inner">
                {/* File Upload Trigger */}
                <button 
                    disabled={isProcessingImage} 
                    onClick={() => {
                        // Ensure input is cleared to allow same file selection
                        if(fileInputRef.current) fileInputRef.current.value = '';
                        fileInputRef.current?.click();
                    }} 
                    className={`p-3 transition-colors hover:bg-white/5 rounded-full mb-0.5 ${isProcessingImage ? 'text-purple-500 animate-pulse' : 'text-white/20 hover:text-white'}`}
                >
                    {isProcessingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <textarea 
                    value={input} 
                    onChange={handleInputChange} 
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={isRestrictedMode ? "اكتب رسالتك (فترة تجربة)..." : (isSentinelMode ? "وضع الحارس مفعل (قل: يا ظل)..." : (isAdmin ? "أمرك يا ريس..." : "قولي يا ريس..."))} 
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/20 focus:ring-0 resize-none min-h-[50px] max-h-[150px] py-3 px-2 scrollbar-hide font-medium leading-relaxed"
                    rows={1}
                    style={{ height: 'auto', minHeight: '50px' }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                    }}
                />
                {(input.trim() || pendingImage) && (
                    <button onClick={() => handleSend()} className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-full transition-all shadow-lg hover:shadow-cyan-600/20 mb-0.5 animate-in zoom-in">
                        <Send className="w-5 h-5 text-white" />
                    </button>
                )}
            </div>
            
            <button 
                onClick={startListening}
                className={`p-4 rounded-[24px] border shadow-lg transition-all active:scale-95 mb-0.5 ${isSentinelMode ? 'bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
            >
                {isSentinelMode ? <Ear className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
            </button>
        </div>
      </div>

    </div>
  );
};

export default ChatInterface;
