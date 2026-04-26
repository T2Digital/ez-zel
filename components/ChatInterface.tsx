import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Square, Volume2, VolumeX, Play, Pause, Brain, Activity, Mic2, Paperclip, X, Zap, Lock, Crown, Globe, Sun, ArrowLeft, Loader2, Sparkles, ArrowRight, DollarSign, RotateCcw, Home, Clock, MessageCircle, Share2, Copy, Shield, Download, Smartphone, Cpu, HelpCircle, Star, Search, ExternalLink, PhoneCall, CheckCircle, Ear, RefreshCw, StopCircle, MapPin, Hotel, Music, Video, Grid, Camera, Edit3, Car, Landmark, CreditCard, FileText, Printer, PenTool, Layout, Calculator, Terminal, Cloud, CloudOff, AlertTriangle, FolderOpen } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapacitorApp } from '@capacitor/app';
import { getShadowResponse, playShadowVoice, stopVoice, getShadowVoice, resumeAudioContext, audioCache, memorizeFact } from '../services/geminiService';
import { shadowDB, DBMessage, DBTask, UserProfile } from '../services/dbService';
import { submitAutonomousTask } from '../services/autonomousAgentService';
import { getDeviceContext, performNativeAction } from '../services/deviceService';
import { WakeWordEngine } from '../services/wakeWordService';
import { voiceBiometrics } from '../services/voiceBiometricsService';
import CapabilitiesGuide from './CapabilitiesGuide';
import LiveAgentAction from './LiveAgentAction';

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
  const [page, setPage] = useState(1);
  const messagesPerPage = 50;
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [input, setInput] = useState('');
  const [appStatus, setAppStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const wakeWordEngineRef = useRef<WakeWordEngine | null>(null);

  useEffect(() => {
      wakeWordEngineRef.current = new WakeWordEngine(() => {
          // When wake word is detected, trigger the main listening function
          try { Haptics.impact({ style: ImpactStyle.Heavy }); } catch(e) {}
          startListening();
      });

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          setSpeechSupported(false);
      }

      return () => {
          if (wakeWordEngineRef.current) {
              wakeWordEngineRef.current.stop();
          }
      };
  }, []);

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
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  
  const [isEnrollingVoice, setIsEnrollingVoice] = useState(false);
  const [hasVoiceSignature, setHasVoiceSignature] = useState(voiceBiometrics.hasSignature());
  const [selectedWorkspaceFile, setSelectedWorkspaceFile] = useState<any>(null);

  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSystemMessageIdRef = useRef<number | undefined>(undefined);
  const isSubmittingRef = useRef(false);
  
  const lastSpeechTimeRef = useRef<number>(0);
  const silenceCheckIntervalRef = useRef<any>(null);
  const shouldContinueListeningRef = useRef(false); 
  const currentTranscriptRef = useRef('');

  const isTito = currentUser.email === 'admin@shadow.com' || isAdmin;
  const isRestrictedMode = !isTito && (currentUser.email === 'GUEST' || (currentUser.tier === 'lite' && currentUser.affiliate?.isMarketer));
  const [isLimitReached, setIsLimitReached] = useState(false);

  const suspendSentinel = () => {
      if (isSentinelMode && passiveRecognitionRef.current) {
          try { passiveRecognitionRef.current.stop(); } catch(e){}
      }
  };

  const handleEnrollVoice = async () => {
      setIsEnrollingVoice(true);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          await voiceBiometrics.enroll(stream, 4000);
          setHasVoiceSignature(true);
          stream.getTracks().forEach(track => track.stop());
          alert("تم تسجيل البصمة الصوتية بنجاح!");
      } catch (e) {
          console.error("Voice enrollment failed", e);
          alert("فشل تسجيل البصمة الصوتية. تأكد من صلاحيات المايكروفون.");
      } finally {
          setIsEnrollingVoice(false);
      }
  };

  const handleClearVoice = () => {
      if (window.confirm("هل أنت متأكد من مسح البصمة الصوتية؟")) {
          voiceBiometrics.clearSignature();
          setHasVoiceSignature(false);
      }
  };

  const resumeSentinel = () => {
      if (isSentinelMode && !shouldContinueListeningRef.current && appStatus === 'idle') {
          startPassiveListening();
      }
  };

  useEffect(() => {
      shadowDB.onSyncStatusChange = (status) => {
          setSyncStatus(status);
      };
      return () => {
          shadowDB.onSyncStatusChange = null;
      };
  }, []);

  useEffect(() => {
      const resumeAudio = () => {
          resumeAudioContext();
      };
      window.addEventListener('click', resumeAudio);
      window.addEventListener('touchstart', resumeAudio);
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
            else setIsLimitReached(false);
        } else {
            setIsLimitReached(false);
        }
    } else {
        setIsLimitReached(false);
    }
  }, [isRestrictedMode]);

  const getGreetingSubtitle = () => {
      if (isTito) return `مرحباً تيتو (الماستر)`;
      if (currentUser.email === 'GUEST') return "مرحباً ضيف الظل";
      if (currentUser.affiliate?.isMarketer && currentUser.tier === 'lite') return `مرحباً ${currentUser.name.split(' ')[0]} (شريك)`;
      return `مرحباً ${currentUser.name.split(' ')[0]} (عضو نخبة)`;
  };

  useEffect(() => {
      let isMounted = true;
      const loadHistory = async () => {
          try {
              const uid = currentUser.email || 'GUEST';
              if (uid !== 'GUEST' && page === 1) {
                  await shadowDB.syncHistoryFast(uid);
              }
              const limit = messagesPerPage;
              const offset = (page - 1) * messagesPerPage;
              const paginatedHist = await shadowDB.getHistory(uid, limit, offset);
              
              if (isMounted) {
                  if (paginatedHist.length < messagesPerPage) {
                      setHasMoreMessages(false);
                  }

                  setMessages(prev => {
                      const existingIds = new Set(prev.map(m => m.id));
                      const newMsgs = paginatedHist.filter(m => !existingIds.has(m.id));
                      return [...newMsgs, ...prev].sort((a,b) => a.timestamp - b.timestamp);
                  });
              }
          } catch(e) { console.warn("History Load Error", e); }
      };
      
      loadHistory();

      if (currentUser.email !== 'GUEST') {
          shadowDB.subscribeToRealtime(currentUser.email, (table, payload) => {
              if (table === 'history' && isMounted) {
                  const newMsg = payload as DBMessage;
                  setMessages(prev => {
                      if (prev.some(m => m.timestamp === newMsg.timestamp)) return prev;
                      return [...prev, newMsg].sort((a,b) => a.timestamp - b.timestamp);
                  });
              }
          });
      }
      return () => { isMounted = false; };
  }, [currentUser.email, page]);

  useEffect(() => {
      if (incomingSystemMessage && incomingSystemMessage.timestamp !== lastSystemMessageIdRef.current) {
          lastSystemMessageIdRef.current = incomingSystemMessage.timestamp;
          setMessages(prev => [...prev, incomingSystemMessage]);
      }
  }, [incomingSystemMessage]);

  const toggleSentinelMode = async () => {
      if (!isSentinelMode) {
          try {
              if ('wakeLock' in navigator) {
                  // @ts-ignore
                  wakeLockRef.current = await navigator.wakeLock.request('screen');
              }
          } catch (err) {}
          
          setIsSentinelMode(true);
          startPassiveListening();
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});

      } else {
          if (wakeLockRef.current) {
              try { await wakeLockRef.current.release(); } catch(e){}
              wakeLockRef.current = null;
          }
          setIsSentinelMode(false);
          stopPassiveListening();
          if (appStatus === 'idle') setAppStatus('idle');
      }
  };

  const passiveRecognitionRef = useRef<any>(null);
  
  const startPassiveListening = () => {
      if (shouldContinueListeningRef.current || appStatus === 'speaking') return;

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
          if (shouldContinueListeningRef.current || isSubmittingRef.current || appStatus === 'speaking') return;
          const results = e.results;
          const transcript = results[results.length - 1][0].transcript.trim().toLowerCase();
          const wakeWords = ['يا ظل', 'يا شادو', 'يا تيتو', 'يا صاحبي', 'ya shadow', 'ya tito', 'ya sahby'];
          
          if (wakeWords.some(word => transcript.includes(word))) {
              stopPassiveListening(); 
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
              startListening(); 
          }
      };

      rec.onend = () => {
          if (isSentinelMode && !shouldContinueListeningRef.current && !isSubmittingRef.current && appStatus !== 'speaking') {
              try { rec.start(); } catch(e) { setTimeout(startPassiveListening, 500); }
          }
      };
      
      try { rec.start(); } catch(e) {}
      passiveRecognitionRef.current = rec;
  };

  const stopPassiveListening = () => {
      if (passiveRecognitionRef.current) {
          try { passiveRecognitionRef.current.stop(); } catch(e) {}
          passiveRecognitionRef.current = null;
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or on initial load
  useEffect(() => {
      if (scrollRef.current && page === 1) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [messages, appStatus, page]);

  // Force scroll to bottom after a slight delay to ensure rendering is complete
  useEffect(() => {
      const timer = setTimeout(() => {
          if (scrollRef.current && page === 1) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
      }, 100);
      return () => clearTimeout(timer);
  }, [messages.length, page]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeRecognitionRef = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const isCancelledRef = useRef<boolean>(false);

  const resetToIdle = useCallback(() => {
    if (isSubmittingRef.current) return;

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
    if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);

    shouldContinueListeningRef.current = false;
    currentTranscriptRef.current = '';
    isCancelledRef.current = false;
    
    setAppStatus('idle');
    setLiveTranscript('');
    setPendingImage(null);

    // Resume Wake Word listening when idle
    if (wakeWordEngineRef.current) {
        wakeWordEngineRef.current.start();
    }

    if (isSentinelMode) setTimeout(startPassiveListening, 1000); 
  }, [isSentinelMode]);

  const startListening = async () => {
    if (isLimitReached || isSubmittingRef.current) return;
    
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch(e) {}
    
    stopPassiveListening(); 
    stopVoice(); 
    resumeAudioContext(); 

    shouldContinueListeningRef.current = true;
    currentTranscriptRef.current = '';
    lastSpeechTimeRef.current = Date.now(); 
    
    setAppStatus('listening');
    setLiveTranscript('');
    isCancelledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createMediaStreamSource(stream).context.createAnalyser();
      analyser.fftSize = 256; 
      source.connect(analyser);
      analyserRef.current = analyser;
      startWaveformLoop(); 

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      
      recorder.onstop = () => { 
          stream.getTracks().forEach(track => track.stop()); 
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
              let final = '';
              for (let i = e.resultIndex; i < e.results.length; ++i) {
                  if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '; 
                  else interim += e.results[i][0].transcript;
              }
              currentTranscriptRef.current = (currentTranscriptRef.current + final).replace(/undefined/g, ''); 
              setLiveTranscript(currentTranscriptRef.current + interim);
              
              if (final.trim() || interim.trim()) {
                  lastSpeechTimeRef.current = Date.now();
              }
          };
          
          rec.onend = () => {
              if (shouldContinueListeningRef.current && !isSubmittingRef.current && !isCancelledRef.current) {
                 try { rec.start(); } catch(e){}
              }
          }
          
          rec.start();
          activeRecognitionRef.current = rec;
      }

      // Voice Biometrics Verification
      if (voiceBiometrics.hasSignature()) {
          voiceBiometrics.verify(stream, 2000).then(similarity => {
              if (similarity < 0.85 && shouldContinueListeningRef.current) {
                  // Voice doesn't match
                  console.log("Voice verification failed. Similarity:", similarity);
                  cancelRecording();
                  const fakeMsg: ExtendedMessage = {
                      id: Date.now(),
                      role: 'model',
                      text: 'عذراً، البصمة الصوتية غير متطابقة. لا يمكنني تنفيذ الأمر.',
                      timestamp: Date.now(),
                      userId: currentUser.email || 'GUEST',
                      isError: true
                  };
                  setMessages(prev => [...prev, fakeMsg]);
                  playShadowVoice('عذراً، البصمة الصوتية غير متطابقة. لا يمكنني تنفيذ الأمر.', currentUser.voicePreference === 'female' ? 'female' : 'male');
              } else {
                  console.log("Voice verified. Similarity:", similarity);
              }
          });
      }

      if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = setInterval(() => {
          const timeSinceSpeech = Date.now() - lastSpeechTimeRef.current;
          if (timeSinceSpeech > 4000 && shouldContinueListeningRef.current && (currentTranscriptRef.current.trim().length > 2 || audioChunksRef.current.length > 10)) {
              stopListeningAndSend();
          }
      }, 500);

    } catch (e) { 
        console.error("Mic Error", e);
        resetToIdle(); 
    }
  };

  const startWaveformLoop = () => {
    const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 0);
    const update = () => {
      if (analyserRef.current && shouldContinueListeningRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        if (average > 10) {
            lastSpeechTimeRef.current = Date.now();
        }
        setVisualLevels(Array.from(dataArray).slice(0, 20)); 
        rafIdRef.current = requestAnimationFrame(update);
      }
    };
    rafIdRef.current = requestAnimationFrame(update);
  };

  const stopListeningAndSend = () => {
      shouldContinueListeningRef.current = false;
      if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);
      
      if (activeRecognitionRef.current) {
          activeRecognitionRef.current.onend = null; 
          activeRecognitionRef.current.stop();
          activeRecognitionRef.current = null;
      }
      
      if (recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.onstop = () => {
              if (currentTranscriptRef.current.trim() || audioChunksRef.current.length > 5) {
                  const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  handleSend(currentTranscriptRef.current, blob);
              } else {
                  resetToIdle();
              }
          };
          recorderRef.current.stop(); 
      } else {
          if (currentTranscriptRef.current.trim()) handleSend(currentTranscriptRef.current);
          else resetToIdle();
      }
  };

  const cancelRecording = () => {
      shouldContinueListeningRef.current = false;
      isCancelledRef.current = true;
      resetToIdle();
  };

  const handleSend = async (forcedText?: string, audioBlob?: Blob, existingAudioBase64?: string, isHiddenAction?: boolean) => {
    if (isSubmittingRef.current || isLimitReached) return;
    
    // Audio Keep-Alive
    const ctx = resumeAudioContext();
    if (ctx && !isMuted) {
        try {
            const silentBuffer = ctx.createBuffer(1, 1, 24000); 
            const source = ctx.createBufferSource();
            source.buffer = silentBuffer;
            source.connect(ctx.destination);
            source.start(0);
        } catch(e) {}
    }

    stopPassiveListening();
    stopVoice();

    const textToSend = forcedText || input;
    if ((!textToSend.trim() || textToSend.trim().length < 2) && !audioBlob && !pendingImage && !existingAudioBase64) { 
        resetToIdle(); 
        return; 
    }

    isSubmittingRef.current = true;
    shouldContinueListeningRef.current = false;
    setIsSearchActive(false);
    
    const displayText = textToSend.trim() ? textToSend : ((audioBlob || existingAudioBase64) ? 'رسالة صوتية 🎤' : '');
    if (!isHiddenAction) setAppStatus('thinking');

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
        userId: currentUser.email || 'GUEST', 
        role: 'user', text: displayText, 
        timestamp: Date.now(), image: pendingImage?.data, voiceData: userVoiceDataURI || undefined,
        isError: false,
        isHidden: isHiddenAction
    };
    
    let id = await shadowDB.saveMessage(userMsg);
    setMessages(prev => [...prev, { ...userMsg, id }]);
    
    const currentImg = pendingImage;
    if (!isHiddenAction) { setInput(''); setPendingImage(null); setLiveTranscript(''); }
    abortControllerRef.current = new AbortController();

    try {
      let extra: any = undefined;
      if (geminiAudioInput) {
        extra = { data: geminiAudioInput, mimeType: 'audio/webm', type: 'audio' };
      } else if (currentImg) {
        const base64Data = currentImg.data.includes(',') ? currentImg.data.split(',')[1] : currentImg.data;
        extra = { data: base64Data, mimeType: currentImg.type, type: 'image' };
      }
      
      const history = await shadowDB.getHistory(currentUser.email || 'GUEST');
      const deviceCtx = await getDeviceContext();
      
      const result = await getShadowResponse(
          history.map(m => ({ role: m.role, parts: [{ text: m.text }] })), 
          displayText + "\n\n" + deviceCtx, 
          extra,
          currentUser,
          abortControllerRef.current.signal 
      );
      
      let finalResponseText = result.text;
      
      // Fallback text if tool was used but no text generated
      if (!finalResponseText && result.groundingLinks?.length > 0) {
          finalResponseText = "دي المصادر اللي لقيتها، بص عليها كده.";
      } else if (!finalResponseText && result.toolActions?.length > 0) {
          if (result.toolActions.some(t => t.name === 'system_terminal')) {
               finalResponseText = "ثواني بظبطلك الأكواد على السيرفر...";
          } else if (result.toolActions.some(t => t.name === 'auto_deployer')) {
              finalResponseText = "بجهزلك الأكواد عشان ارفعها على جيت هاب وانشرها دلوقتي، دقايق واللينك يكون معاك يا هندسة!";
          } else if (result.toolActions.some(t => t.name === 'crypto_trader')) {
              finalResponseText = "بحلل السوق وبظبط الماركت من بينانس، اصبر عليا ثواني يا ماستر..";
          } else if (result.toolActions.some(t => t.name === 'social_poster')) {
              finalResponseText = "بجهزلك البوست وبنزله على بيدج السوشيال حالا، متقلقش من حاجة.";
          } else {
               finalResponseText = "حاضر، هعملك اللي طلبته فوراً...";
          }
      }

      const uiCards: any[] = [];

      if (result.toolActions && result.toolActions.length > 0) {
          for (const t of result.toolActions) {
              if (t.name === 'generate_business_document') {
                  const data = t.args; 
                  uiCards.push({ cardType: 'business_doc', data });
              } 
              else if (t.name === 'system_terminal') {
                  const data = t.args;
                  uiCards.push({ cardType: 'system_terminal', data });
              }
              else if (t.name === 'schedule_reminder') {
                  const args = t.args;
                  const delayMs = (args.delay_seconds || 60) * 1000;
                  const executionTime = Date.now() + delayMs;
                  
                  const task: DBTask = {
                      userId: currentUser.email || 'GUEST',
                      task: args.task,
                      time: args.time_description,
                      executionTime: executionTime, 
                      category: 'general',
                      status: 'pending'
                  };
                  await shadowDB.saveTask(task);
                  uiCards.push({ cardType: 'task_success', title: args.task, description: args.time_description });
              }
              else if (t.name === 'workspace_manager') {
                  const args = t.args;
                  const userId = currentUser.email || 'GUEST';
                  if (args.action === 'create_folder' || args.action === 'create_file') {
                      const parts = (args.path || '').split('/').filter(Boolean);
                      const name = parts.pop() || (args.action === 'create_folder' ? 'New Folder' : 'New File');
                      const itemType = args.action === 'create_folder' ? 'folder' : 'file';
                      await shadowDB.createFSItem({
                          userId,
                          parentId: null,
                          name: name,
                          type: itemType,
                          content: args.l2_content || args.content || '',
                          l0_summary: args.l0_summary || '',
                          l1_metadata: args.l1_metadata || '',
                          l2_content: args.l2_content || args.content || '',
                          createdAt: Date.now()
                      });
                      uiCards.push({ cardType: 'workspace_item', title: name, description: `مسار: ${args.path}`, itemType, content: args.l0_summary || args.content || '' });
                  } else if (args.action === 'update_file') {
                      const items = await shadowDB.getFSItemsByUserId(userId);
                      const parts = (args.path || '').split('/').filter(Boolean);
                      const name = parts.pop();
                      const file = items.find(i => i.name === name && i.type === 'file');
                      if (file && file.id) {
                          await shadowDB.updateFSItem(file.id, { 
                              content: args.l2_content || args.content || file.content,
                              l0_summary: args.l0_summary || file.l0_summary,
                              l1_metadata: args.l1_metadata || file.l1_metadata,
                              l2_content: args.l2_content || args.content || file.l2_content 
                          });
                          uiCards.push({ cardType: 'workspace_item', title: file.name, description: 'تم تحديث الملف', itemType: 'file', content: args.l0_summary || args.content || '' });
                      }
                  } else if (args.action === 'read_file' || args.action === 'read_l0_index' || args.action === 'read_l2_content') {
                      uiCards.push({ cardType: 'system_log', title: 'Workspace', description: `جاري القراءة: ${args.action} - مسار: ${args.path}` });
                      
                      setTimeout(async () => {
                          const items = await shadowDB.getFSItemsByUserId(userId);
                          const parts = (args.path || '').split('/').filter(Boolean);
                          const name = parts.pop();
                          const file = items.find(i => i.name === name && i.type === 'file');
                          
                          let readResult = "";
                          if (!file) {
                              readResult = "الملف غير موجود.";
                          } else {
                              if (args.action === 'read_l0_index') readResult = file.l0_summary || file.content || '';
                              else if (args.action === 'read_l2_content' || args.action === 'read_file') readResult = file.l2_content || file.content || '';
                          }
                          
                          const hiddenText = `[WORKSPACE_READ_RESULT / ${args.action} / ${args.path}]\n${readResult}\n\n[INSTRUCTION]: بناءً على هذه النتيجة، أجب المستخدم.`;
                          handleSend(hiddenText, undefined, undefined, true);
                      }, 100);
                  }
              }
              else if (t.name === 'update_core_rules') {
                  const args = t.args;
                  await shadowDB.updateGlobalRules(args.new_rules);
                  uiCards.push({ cardType: 'task_success', title: 'تم تحديث القوانين الأساسية', description: 'تم تعديل سلوك النظام بنجاح.' });
                  handleSend(`[SYSTEM_RULES_UPDATED]\nالقوانين الأساسية اتعدلت بنجاح.\n\n[INSTRUCTION]: أكد للمستخدم إنك استوعبت القوانين الجديدة وتقدر تنفذها من دلوقتي.`, undefined, undefined, true);
              }
              else if (t.name === 'activate_user_account') {
                  const args = t.args;
                  const targetEmail = args.user_email;
                  const targetUser = await shadowDB.getProfile(targetEmail);
                  if (targetUser) {
                      targetUser.status = 'active';
                      let commissionMsg = '';
                      if (targetUser.referredBy) {
                          const referrer = await shadowDB.getProfile(targetUser.referredBy);
                          if (referrer && referrer.affiliate) {
                              const commission = 50; 
                              referrer.affiliate.totalEarnings += commission;
                              referrer.affiliate.referralsCount += 1;
                              await shadowDB.saveProfile(referrer);
                              commissionMsg = `وتمت إضافة عمولة ${commission} جنيه لـ ${referrer.name}`;
                              await shadowDB.setGlobalPulse(`تم تفعيل اشتراك جديد! مبروك لـ ${referrer.name} عمولة جديدة 💸`);
                          }
                      } else {
                          await shadowDB.setGlobalPulse(`تم تفعيل اشتراك جديد للمستخدم ${targetUser.name} 🎉`);
                      }
                      await shadowDB.saveProfile(targetUser);
                      uiCards.push({ cardType: 'task_success', title: 'تم تفعيل الحساب', description: `تم تفعيل حساب ${targetUser.name} بنجاح. ${commissionMsg}` });
                      handleSend(`[ACCOUNT_ACTIVATION_SUCCESS]\nتم تفعيل الحساب (${targetUser.name}) بنجاح. ${commissionMsg}\n\n[INSTRUCTION]: بصفتك المدير، بارك للمستخدم بشكل لطيف وقوله الإجراء اللي تم.`, undefined, undefined, true);
                  } else {
                      uiCards.push({ cardType: 'task_success', title: 'خطأ في التفعيل', description: `لم يتم العثور على حساب بالبريد: ${targetEmail}` });
                      handleSend(`[ACCOUNT_ACTIVATION_FAILED]\nلم يتم العثور على ايميل (${targetEmail}).\n\n[INSTRUCTION]: بلغ المستخدم إن الحساب ده مش موجود وخليه يراجع الإيميل.`, undefined, undefined, true);
                  }
              }
              else if (t.name === 'memory_archivist') {
                  const args = t.args;
                  // Use memorizeFact which handles embedding + local DB + Vector DB (Pinecone)
                  await memorizeFact(currentUser.email || 'GUEST', args.fact);
                  
                  uiCards.push({ cardType: 'task_success', title: '🧠 أرشفة الذاكرة المعرفية (RAG)', description: args.fact });
                  handleSend(`[MEMORY_SAVED]\nتم أرشفة المعلومة بنجاح.\n\n[INSTRUCTION]: أكد للمستخدم إنك سجلت المعلومة في دماغك وتقدر تفتكرها في أي وقت.`, undefined, undefined, true);
              }
              else if (t.name === 'run_autonomous_agent') {
                  const args = t.args;
                  await submitAutonomousTask(currentUser.email || 'GUEST', args.prompt_for_agent);
                  uiCards.push({ cardType: 'task_success', title: '⚡ مهام مستقلة قيد التشغيل', description: 'تم إطلاق عميل خلفي لمعالجة المهمة المعقدة.' });
              }
              else if (t.name === 'create_dynamic_plugin') {
                  const args = t.args;
                  await shadowDB.savePlugin({
                      userId: currentUser.email || 'GUEST',
                      name: args.name,
                      description: args.description,
                      parametersSchema: args.parametersSchema,
                      jsCode: args.jsCode,
                      createdAt: Date.now()
                  });
                  uiCards.push({ cardType: 'task_success', title: 'تم اختراع أداة جديدة ⚡️', description: `تم بناء الأداة (${args.name}) وتخزينها في قاعدة البيانات.` });
                  handleSend(`[PLUGIN_CREATED]\nتم بناء الأداة ${args.name} بنجاح وحفظها في قاعدة البيانات.\n\n[INSTRUCTION]: عرفني إن الأداة اتعملت وأنك مبسوط بيها وجاهز تستخدمها المهام الجاية.`, undefined, undefined, true);
              }
              else if (t.name === 'device_control') {
                  const args = t.args;
                  if (args.action === 'vibrate_heavy') {
                      try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch(e) {}
                      uiCards.push({ cardType: 'task_success', title: 'تم التنفيذ', description: 'تم تفعيل الاهتزاز القوي' });
                  } else if (args.action === 'vibrate_success') {
                      try { await Haptics.notification({ type: 'SUCCESS' as any }); } catch(e) {}
                      uiCards.push({ cardType: 'task_success', title: 'تم التنفيذ', description: 'تم تفعيل اهتزاز النجاح' });
                  } else if (args.action === 'get_status') {
                      uiCards.push({ cardType: 'task_success', title: 'حالة الهاتف', description: 'تم قراءة حساسات الهاتف بنجاح.' });
                  }
              }
              else if (t.name === 'link_reader') {
                  const args = t.args;
                  uiCards.push({ cardType: 'task_success', title: '🌐 شبكة الإنترنت', description: `جاري سحب المحتوى من: ${args.url}` });
                  
                  setTimeout(async () => {
                      try {
                          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(args.url)}`);
                          const data = await res.json();
                          const html = data.contents;
                          const parser = new DOMParser();
                          const doc = parser.parseFromString(html, 'text/html');
                          doc.querySelectorAll('script, style, nav, footer').forEach(el => el.remove());
                          const text = doc.body.innerText.replace(/\s+/g, ' ').substring(0, 15000);
                          
                          const hiddenText = `[WEB_SCRAPER_RESULT]\nتم شفط المحتوى من (${args.url}):\n\n${text}\n\n[INSTRUCTION]: بناءً على هذا المحتوى، أجب المستخدم أو لخص المحتوى بأسلوبك المصري المميز ولا تذكر أنك قرأت عبر أداة.`;
                          handleSend(hiddenText, undefined, undefined, true);
                      } catch (e) {
                          handleSend(`[WEB_SCRAPER_RESULT]\nفشل قراءة الرابط (${args.url}). أخبر المستخدم أن الموقع محمي أو غير متاح.`, undefined, undefined, true);
                      }
                  }, 500);
              }
              else if (t.name === 'auto_deployer' || t.name === 'crypto_trader' || t.name === 'social_poster') {
                  uiCards.push({
                      cardType: 'live_action',
                      actionType: t.name,
                      args: t.args
                  });
              }
              else if (t.name === 'click_on_screen') {
                  const args = t.args;
                  const nativeResult = await performNativeAction('clickNode', { text: args.target_text });
                  
                  if (nativeResult.success) {
                      uiCards.push({
                          cardType: 'task_success',
                          title: 'تحكم الهاتف',
                          description: `تم الضغط على "${args.target_text}" بنجاح.`
                      });
                  } else {
                      uiCards.push({
                          cardType: 'mobile_agent_action',
                          title: 'أمر تحكم (يتطلب التطبيق)',
                          description: `الظل يحاول الضغط على "${args.target_text}".\n(تتطلب هذه الميزة نسخة الأندرويد لتعمل تلقائياً)`,
                          target_text: args.target_text
                      });
                  }
              }
              else if (t.name === 'vision_analyzer') {
                  const args = t.args;
                  uiCards.push({ cardType: 'task_success', title: 'تم تحليل الصورة', description: args.image_description });
              }
              else if (t.name === 'app_control') {
                 const args = t.args;
                 let url = args.detail || '';
                 let label = args.target.toLowerCase();
                 let iconType = 'generic';

                 if (args.action_type === 'navigate_internal') {
                     uiCards.push({ cardType: 'internal_nav', title: `فتح: ${label}`, description: 'الانتقال لصفحة داخلية', targetSection: label });
                 } else {
                     const appOpenResult = await performNativeAction('openApp', { packageName: label, action: args.action_type, data: args.detail });
                     
                     if (appOpenResult.success) {
                         uiCards.push({ 
                             cardType: 'task_success', 
                             title: `فتح: ${label}`, 
                             description: `تم تشغيل ${label} واصدار الأوامر للنظام بنجاح.` 
                         });
                     } else {
                         const safeDetail = args.detail && !args.detail.includes('جاهز') ? encodeURIComponent(args.detail) : '';
                         
                         if (label.includes('what') || label.includes('واتس')) { 
                             url = safeDetail ? `https://wa.me/?text=${safeDetail}` : 'https://wa.me'; 
                             iconType = 'chat'; 
                         }
                         else if (label.includes('tube') || label.includes('يوتيوب') || args.action_type === 'search_media') { 
                             url = safeDetail ? `https://www.youtube.com/results?search_query=${safeDetail}` : 'https://www.youtube.com'; 
                             iconType = 'video'; 
                         }
                         else if (label.includes('uber') || label.includes('أوبر') || label.includes('اوبر')) { 
                             if (safeDetail) {
                                 // Using uber Universal Link with formatted_address which acts as a search query in the app
                                 url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${safeDetail}`;
                             } else {
                                 url = 'https://m.uber.com/ul/?action=setPickup&pickup=my_location'; 
                             }
                             iconType = 'car'; 
                         }
                         else if (label.includes('book') || label.includes('hotel') || label.includes('فندق') || label.includes('حجز')) { 
                             url = safeDetail ? `https://www.booking.com/searchresults.html?ss=${safeDetail}` : 'https://www.booking.com'; 
                             iconType = 'hotel'; 
                         }
                         else if (label.includes('map') || label.includes('location') || label.includes('خريط') || label.includes('موقع') || label.includes('طريق')) { 
                             url = safeDetail ? `https://www.google.com/maps/dir/?api=1&destination=${safeDetail}` : 'https://www.google.com/maps'; 
                             iconType = 'map'; 
                         }
                         else if (label.includes('calc') || label.includes('حاسب')) { 
                             iconType = 'calculator'; 
                         }
                         else if (label.includes('phon') || label.includes('اتصال') || label.includes('تليفون') || args.action_type === 'call_number') { 
                             url = `tel:${args.detail.replace(/[^0-9+]/g, '')}`; 
                             iconType = 'phone'; 
                         }
                         else if (label.includes('face') || label.includes('fb') || label.includes('فيس')) { 
                             url = safeDetail ? `https://www.facebook.com/search/top?q=${safeDetail}` : 'https://www.facebook.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('insta') || label.includes('انستا')) { 
                             url = 'https://www.instagram.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('twitter') || label.includes('x') || label.includes('تويتر')) { 
                             url = safeDetail ? `https://twitter.com/search?q=${safeDetail}` : 'https://twitter.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('tiktok') || label.includes('تيك')) { 
                             url = safeDetail ? `https://www.tiktok.com/search?q=${safeDetail}` : 'https://www.tiktok.com'; 
                             iconType = 'video'; 
                         }
                         else if (label.includes('linkedin') || label.includes('لينكد')) { 
                             url = 'https://www.linkedin.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('mail') || label.includes('gmail') || label.includes('بريد') || label.includes('ايميل')) { 
                             url = 'mailto:'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('spotify') || label.includes('music') || label.includes('سبوتيفاي') || label.includes('موسيقى')) { 
                             url = safeDetail ? `https://open.spotify.com/search/${safeDetail}` : 'https://open.spotify.com'; 
                             iconType = 'generic'; 
                         }
                         else if (label.includes('netflix') || label.includes('نتفليكس')) { 
                             url = safeDetail ? `https://www.netflix.com/search?q=${safeDetail}` : 'https://www.netflix.com'; 
                             iconType = 'video'; 
                         }
                         else if (label.includes('amazon') || label.includes('shop') || label.includes('امازون') || label.includes('سوق') || label.includes('شراء')) { 
                             url = safeDetail ? `https://www.amazon.com/s?k=${safeDetail}` : 'https://www.amazon.com'; 
                             iconType = 'generic'; 
                         }
                         else if ((!url.startsWith('http') && !url.startsWith('tel') && !url.startsWith('mailto') && !url.startsWith('uber://')) || url.includes('جاهز') || /[\u0600-\u06FF]/.test(url.replace(/https?:\/\//, '').split('/')[0])) { 
                             url = `https://google.com/search?q=${encodeURIComponent(args.detail || label)}`; 
                         }

                         uiCards.push({
                             cardType: 'deep_link_fallback',
                             title: `فتح تطبيق: ${label}`,
                             description: args.detail || 'اضغط هنا للفتح (ديب لينك الويب)',
                             url: url,
                             number: iconType
                         });
                     }
                 }
              }
              else {
                  const dynamicPlugins = await shadowDB.getPluginsByUserId(currentUser.email || 'GUEST');
                  const activePlugin = dynamicPlugins.find(p => p.name === t.name || `dyn_plugin_${p.id}` === t.name);
                  
                  if (activePlugin) {
                      try {
                          const fn = new Function('args', activePlugin.jsCode);
                          const pluginResult = await fn(t.args);
                          uiCards.push({ cardType: 'task_success', title: `تم تنفيذ الأداة: ${activePlugin.name}`, description: `تم بنجاح.` });
                          
                          const hiddenText = `[DYNAMIC_PLUGIN_RESULT / ${activePlugin.name}]\n${JSON.stringify(pluginResult, null, 2)}\n\n[INSTRUCTION]: بناءً على هذه النتيجة، أجب المستخدم.`;
                          setTimeout(() => handleSend(hiddenText, undefined, undefined, true), 100);
                      } catch (e: any) {
                          uiCards.push({ cardType: 'task_success', title: `خطأ في أداة ${activePlugin.name}`, description: e.toString() });
                          const errText = `[DYNAMIC_PLUGIN_ERROR / ${activePlugin.name}]\n${e.toString()}\n\n[INSTRUCTION]: لقد حدث خطأ أثناء تنفيذ هذا البلوجن. أخبر المستخدم بالخطأ.`;
                          setTimeout(() => handleSend(errText, undefined, undefined, true), 100);
                      }
                  }
              }
          }
      }

      let voiceDataToSave: string | undefined = undefined;

      // Fetch audio BEFORE showing the message if not muted
      if (!isMuted && !result.isError && finalResponseText) {
          voiceDataToSave = await getShadowVoice(finalResponseText, 'male') || undefined;
      }

      const modelMsg: ExtendedMessage = { 
          userId: currentUser.email || 'GUEST', 
          role: 'model', 
          text: finalResponseText, 
          timestamp: Date.now(), 
          groundingLinks: result.groundingLinks, 
          voiceData: voiceDataToSave, 
          isError: result.isError,
          uiCards: uiCards 
      };
      
      let modelId = await shadowDB.saveMessage(modelMsg);
      setMessages(prev => [...prev, { ...modelMsg, id: modelId }]);
      
      try { await Haptics.notification({ type: 'SUCCESS' as any }); } catch(e) {}
      
      isSubmittingRef.current = false;

      // Always attempt to speak unless explicitly muted, regardless of tools
      if (!isMuted && !result.isError && finalResponseText) {
          setPlayingMessageId(modelId);
          setAppStatus('speaking');
          
          // Force resume audio context before speaking to satisfy browser autoplay policies
          resumeAudioContext();

          playShadowVoice(finalResponseText, currentUser.voicePreference === 'female' ? 'female' : 'male', voiceDataToSave, () => { 
              setPlayingMessageId(null);
              setAppStatus('idle'); 
              if (isSentinelMode) resumeSentinel();
          });
      } else {
          setAppStatus('idle');
          if (isSentinelMode) resumeSentinel();
      }

    } catch (e: any) { 
        console.error("Error in handleSend:", e);
        const errorMsg: ExtendedMessage = {
            userId: currentUser.email || 'GUEST',
            role: 'model',
            text: "معلش يا ريس، حصل خطأ في النظام. ممكن تجرب تاني؟",
            timestamp: Date.now(),
            isError: true
        };
        setMessages(prev => [...prev, { ...errorMsg, id: Date.now() }]);
        isSubmittingRef.current = false;
        setAppStatus('idle');
        if (isSentinelMode) resumeSentinel();
    }
  };

  const [isSharingVoice, setIsSharingVoice] = useState<number | null>(null);
  const [preparedShareData, setPreparedShareData] = useState<{files: File[], title: string, text: string} | null>(null);

  const handleShareVoiceMessage = async (msg: DBMessage) => {
      setIsSharingVoice(msg.timestamp);
      try {
          const selectedVoice = (await shadowDB.getConfig('shadow_voice')) || 'male';
          let base64 = audioCache.get(msg.text);
          let neededFetch = false;
          if (!base64) {
              neededFetch = true;
              base64 = await getShadowVoice(msg.text, selectedVoice);
              if (base64) audioCache.set(msg.text, base64);
          }

          if (!base64) {
              alert("عذراً، لم نتمكن من توليد الصوت للمشاركة.");
              return;
          }

          const byteCharacters = atob(base64);
          const u8 = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
              u8[i] = byteCharacters.charCodeAt(i);
          }
          
          let parsedFile: File;
          try {
              const lamejsInstance = (window as any).lamejs;
              if (!lamejsInstance) throw new Error("lamejs not loaded");

              // Convert PCM to true MP3 using lamejs for WhatsApp compatibility
              const samples = new Int16Array(u8.buffer, u8.byteOffset, u8.byteLength / 2);
              const channels = 1;
              const sampleRate = 24000;
              const kbps = 128; // Standard quality
              
              const mp3encoder = new lamejsInstance.Mp3Encoder(channels, sampleRate, kbps);
              const mp3Data = [];
              
              const sampleBlockSize = 1152; // multiple of 576
              for (let i = 0; i < samples.length; i += sampleBlockSize) {
                  const sampleChunk = samples.subarray(i, i + sampleBlockSize);
                  const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
                  if (mp3buf.length > 0) {
                      mp3Data.push(mp3buf);
                  }
              }
              const mp3buf = mp3encoder.flush();
              if (mp3buf.length > 0) {
                  mp3Data.push(mp3buf);
              }
              
              const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
              parsedFile = new File([blob], 'shadow-voice.mp3', { type: 'audio/mpeg' });
          } catch(err) {
              console.error("MP3 conversion failed, falling back to raw payload", err);
              
              // Failsafe: if lamejs crashes (e.g. MPEGMode is not defined), wrap PCM in WAV structure and call it m4a or mp3 
              const numOfChan = 1;
              const sampleRate = 24000;
              const bitDepth = 16;
              const dataBytes = u8.length;
              const bufferWav = new ArrayBuffer(44 + dataBytes);
              const view = new DataView(bufferWav);
              
              const setUint16 = (pos: number, data: number) => view.setUint16(pos, data, true);
              const setUint32 = (pos: number, data: number) => view.setUint32(pos, data, true);
              
              setUint32(0, 0x46464952); // "RIFF"
              setUint32(4, 36 + dataBytes);
              setUint32(8, 0x45564157); // "WAVE"
              setUint32(12, 0x20746d66); // "fmt "
              setUint32(16, 16);
              setUint16(20, 1);
              setUint16(22, numOfChan);
              setUint32(24, sampleRate);
              setUint32(28, sampleRate * numOfChan * (bitDepth / 8));
              setUint16(32, numOfChan * (bitDepth / 8));
              setUint16(34, bitDepth);
              setUint32(36, 0x61746164); // "data"
              setUint32(40, dataBytes);
              new Uint8Array(bufferWav, 44).set(u8);
              
              const blob = new Blob([bufferWav], { type: 'audio/mp4' });
              parsedFile = new File([blob], 'shadow-voice.m4a', { type: 'audio/mp4' });
          }

          const refCode = currentUser.affiliate?.referralCode || '';
          const referralLink = refCode ? `\n\nاشترك في الظل الرقمي واعمل نسختك من الرابط ده:\n${window.location.origin}?ref=${refCode}` : '';
          const shareText = `اسمع رد الظل 🤖🔥${referralLink}`;

          const shareObj = { title: 'صوت الظل', text: shareText, files: [parsedFile] };

          if (neededFetch) {
              // Store it and wait for next explicit user click
              setPreparedShareData(shareObj);
          } else {
              // Direct share immediately since no await stalled us
              if (navigator.canShare && navigator.canShare({ files: [parsedFile] })) {
                  try {
                      await navigator.share(shareObj);
                  } catch (err: any) {
                      if (err.name !== 'AbortError') setPreparedShareData(shareObj);
                  }
              } else {
                  setPreparedShareData(shareObj);
              }
          }
      } catch (e) {
          console.error("Share voice error:", e);
      } finally {
          setIsSharingVoice(null);
      }
  };

  const handleShareMessage = async (text: string) => {
      const refCode = currentUser.affiliate?.referralCode || '';
      const url = `https://Ez-zel.vercel.app/${refCode ? `?ref=${refCode}` : ''}`;
      if (navigator.share) {
          try { await navigator.share({ title: 'رسالة من الظل', text: `${text}\n\n💡 ${url}` }); } catch (e) {}
      } else {
          navigator.clipboard.writeText(`${text}\n\n${url}`);
          alert("تم النسخ مع رابط الدعوة!");
      }
  };

  const handleStopPlayback = () => { 
      stopVoice(); 
      if (userAudioPlayerRef.current) { userAudioPlayerRef.current.pause(); userAudioPlayerRef.current = null; } 
      setPlayingMessageId(null); 
      if (appStatus === 'speaking') {
          setAppStatus('idle');
          if (isSentinelMode) resumeSentinel();
      }
  };
  
  const handlePlayMessage = (msg: DBMessage) => { 
      if (playingMessageId === msg.id) { handleStopPlayback(); return; } 
      
      resumeAudioContext();

      if (appStatus === 'speaking') handleStopPlayback();
      if (appStatus !== 'thinking') setAppStatus('speaking');

      setPlayingMessageId(msg.id!); 
      suspendSentinel();
      
      if (msg.role === 'user' && msg.voiceData) { 
          const audio = new Audio(msg.voiceData); 
          userAudioPlayerRef.current = audio; 
          audio.onended = () => { 
              setPlayingMessageId(null); 
              userAudioPlayerRef.current = null;
              if (appStatus !== 'thinking') setAppStatus('idle'); 
              if (isSentinelMode) resumeSentinel();
          }; 
          audio.play().catch(e => {
              setPlayingMessageId(null);
              if (appStatus !== 'thinking') setAppStatus('idle'); 
              if (isSentinelMode) resumeSentinel();
          }); 
      } else { 
          playShadowVoice(msg.text, currentUser.voicePreference === 'female' ? 'female' : 'male', msg.voiceData, () => { 
              setPlayingMessageId(null); 
              if (appStatus !== 'thinking') setAppStatus('idle'); 
              if (isSentinelMode) resumeSentinel();
          }); 
      } 
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsProcessingImage(true);
          try {
              if (file.type.startsWith('image/')) {
                  const compressed = await compressImage(file);
                  setPendingImage(compressed);
              } else {
                  // Handle text / code / document chunking (L0, L1, L2)
                  const textContent = await file.text();
                  if (textContent) {
                      setAppStatus('thinking');
                      // Minimal SLM chunking strategy using Gemini
                      const prompt = `أنت محرك تقسيم البيانات الآلي. اعطني رداً بصيغة JSON فقط كالتالي:
{
  "l0_summary": "ملخص في سطرين فقط لمحتوى الملف",
  "l1_metadata": "أهم العناوين والمواضيع الموجودة، بصيغة أسماء أو نقاط قصيرة"
}
النص:
${textContent.substring(0, 10000)}`;

                      let l0 = 'لم يتم تحديد ملخص (تجاوز)';
                      let l1 = 'لم يتم تحديد بيانات';
                      
                      try {
                          const chunkResult = await getShadowResponse([{ role: 'user', parts: [{ text: prompt }] }], prompt);
                          const jsonMatch = chunkResult.text.match(/\{[\s\S]*\}/);
                          if (jsonMatch) {
                              const parsed = JSON.parse(jsonMatch[0]);
                              if (parsed.l0_summary) l0 = parsed.l0_summary;
                              if (parsed.l1_metadata) l1 = parsed.l1_metadata;
                          }
                      } catch (e) {
                          console.error("Chunking failed", e);
                      }

                      const fileObj = {
                           userId: currentUser.email || 'GUEST',
                           parentId: null,
                           name: file.name,
                           type: 'file' as any,
                           content: textContent,
                           l0_summary: l0,
                           l1_metadata: l1,
                           l2_content: textContent,
                           createdAt: Date.now()
                      };
                      await shadowDB.createFSItem(fileObj);
                      
                      // Instruct Gemini
                      handleSend(`[FILE_PROCESSING_ENGINE]\nقام المستخدم برفع ملف (${file.name}).\nL0_SUMMARY (ملخص): ${l0}\nL1_METADATA (بيانات): ${l1}\n\n[INSTRUCTION]: أخبر المستخدم أنه تم رفع الملف وتقسيمه لأجزاء وأنت جاهز للرد على استفساراته القائمة على الملف.`, undefined, undefined, true);
                  }
              }
          } catch(err) {
              console.error(err);
          } finally {
              setIsProcessingImage(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
              if (cameraInputRef.current) cameraInputRef.current.value = '';
          }
      }
  };
  
  const handleAppCardAction = async (card: any) => { 
      if (!card) return; 
      if (card.cardType === 'internal_nav') { 
          if (onNavigateTo) onNavigateTo(card.targetSection);
          return;
      }
      if (card.cardType === 'business_doc') { window.print(); return; }
      
      if (card.url) { 
          let cleanUrl = card.url.trim();
          if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('tel:')) {
             cleanUrl = `https://${cleanUrl}`;
          }
          window.open(cleanUrl, '_blank', 'noopener,noreferrer'); 
      } 
  };

  const getCardIcon = (type: string, number?: string) => { 
      if (type === 'task_success') return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      if (type === 'internal_nav') return <Layout className="w-6 h-6 text-purple-400" />;
      if (type === 'business_doc') return <Printer className="w-6 h-6 text-white" />;
      if (type === 'system_terminal') return <Terminal className="w-6 h-6 text-white" />;
      if (type === 'deep_link_fallback') {
          if (number === 'chat') return <MessageCircle className="w-6 h-6 text-green-400" />;
          if (number === 'video') return <Video className="w-6 h-6 text-red-400" />;
          if (number === 'phone') return <PhoneCall className="w-6 h-6 text-blue-400" />;
          if (number === 'car') return <Car className="w-6 h-6 text-white" />;
          if (number === 'search') return <Search className="w-6 h-6 text-cyan-400" />;
          if (number === 'hotel') return <Hotel className="w-6 h-6 text-amber-400" />;
          if (number === 'map') return <MapPin className="w-6 h-6 text-emerald-400" />;
          if (number === 'calculator') return <Calculator className="w-6 h-6 text-orange-400" />;
          return <ExternalLink className="w-6 h-6 text-blue-400" />;
      }
      return <ExternalLink className="w-6 h-6 text-white" />;
  };

  const renderCard = (card: any, i: number) => {
      if (card.cardType === 'live_action') {
          return <LiveAgentAction key={i} actionType={card.actionType} args={card.args} onComplete={(resultText) => {
              handleSend(resultText, undefined, undefined, true);
          }} />;
      }
      if (card.cardType === 'system_terminal') {
          return (
              <div className="mt-4 bg-[#0a0a0a] rounded-[16px] border border-white/20 overflow-hidden w-full md:w-[450px] shadow-2xl font-mono text-left" dir="ltr">
                  <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2 border-b border-white/10">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="ml-2 text-[10px] text-white/40 font-bold">ez-zel@shadow-core:~</span>
                  </div>
                  <div className="p-4 text-xs font-mono">
                      <div className="text-emerald-400 mb-2">$ {card.data.command_type || 'executing...'}</div>
                      <pre className="text-white/80 whitespace-pre-wrap">{card.data.logs}</pre>
                      <div className="mt-2 text-white/50 animate-pulse">_</div>
                  </div>
              </div>
          );
      }
      if (card.cardType === 'task_success') {
          return (
              <div className="mt-4 bg-[#111] p-4 rounded-[22px] border border-emerald-500/20 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-full"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                  <div><h3 className="font-bold text-white text-sm">{card.title}</h3><p className="text-[10px] text-white/50">{card.description}</p></div>
              </div>
          );
      }
      if (card.cardType === 'business_doc') {
          return (
            <div className="mt-4 bg-white text-black rounded-[22px] p-6 shadow-2xl printable-invoice w-full md:w-[600px] border border-black/10 overflow-hidden relative print:w-full print:border-none print:shadow-none print:m-0 print:p-0">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6 px-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-xl border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center print:border-black print:shadow-none">
                                <span className="text-white text-xl font-black mb-1">E</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight uppercase">Ez-Zel <span className="text-cyan-600">Enterprise</span></h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Digital Shadow System</p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-1">
                            <h2 className="text-3xl font-black">{card.data.docType === 'quote' ? 'عرض السعـر' : (card.data.docType === 'contract' ? 'عقـد اتفـاق' : 'فـاتـورة')}</h2>
                            <p className="text-xs text-gray-400 font-bold tracking-widest" dir="ltr">DOCUMENT ID: <span className="text-black font-mono">EZ-{Math.floor(Math.random() * 90000) + 10000}</span></p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col gap-1 mt-14">
                        <p className="font-black text-sm text-gray-400 uppercase tracking-widest">التاريـخ</p>
                        <p className="text-sm font-bold font-mono bg-gray-100 px-3 py-1 rounded-md border border-gray-200" dir="ltr">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Client Section */}
                <div className="mb-8 px-2">
                    <div className="inline-block bg-black text-white px-3 py-1 rounded-md mb-3">
                        <p className="text-[10px] uppercase font-black tracking-widest">مقدم إلى</p>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 border-l-4 border-cyan-500 pl-3 leading-none">{card.data.clientName}</h3>
                </div>

                {/* Contract Body (Optional) */}
                {card.data.contractBody && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                        <h4 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest border-b border-gray-200 pb-2">تفاصيل العقد للشروط والأحكام</h4>
                        <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">{card.data.contractBody}</div>
                    </div>
                )}

                {/* Items Table */}
                {card.data.items && card.data.items.length > 0 && (
                    <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-100 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">البند / الوصف</th>
                                    <th className="py-3 px-4 text-left w-32">القيمة (EGP)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {card.data.items.map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 font-bold text-gray-800">{item.desc}</td>
                                        <td className="py-4 px-4 text-left font-mono font-bold text-gray-900 bg-gray-50/50" dir="ltr">{(item.price || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Total Section */}
                {card.data.items && card.data.items.length > 0 && (
                    <div className="flex justify-end px-2 mb-10">
                        <div className="w-full md:w-1/2 flex justify-between items-center p-4 rounded-xl bg-black text-white shadow-xl transform hover:scale-[1.02] transition-transform">
                            <span className="font-black text-sm tracking-widest uppercase">الإجمالي النهائي</span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-2xl font-mono text-cyan-400" dir="ltr">{card.data.items.reduce((s:number, i:any) => s + (i.price || 0), 0).toLocaleString()}</span>
                                <span className="text-xs font-bold text-gray-400">EGP</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Notes */}
                <div className="mt-12 text-center border-t border-gray-200 pt-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Generated by Ez-Zel Digital Shadow</p>
                    <p className="text-[9px] text-gray-300">This document is electronically verified.</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 print:hidden">
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-800 transition-all text-sm shadow-xl active:scale-95">
                        <Printer className="w-4 h-4" /> طباعة المستند
                    </button>
                    {card.data.contractBody && (
                        <button onClick={() => {
                            const contractText = `عقد اتفاق\n\nالطرف الثاني: ${card.data.clientName}\n\n${card.data.contractBody}`;
                            navigator.clipboard.writeText(contractText);
                            alert('تم نسخ نص العقد!');
                        }} className="px-4 py-3 border-2 border-black rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-sm active:scale-95">
                            <Copy className="w-4 h-4" /> نسخ النص
                        </button>
                    )}
                </div>
            </div>
          );
      }
      if (card.cardType === 'mobile_agent_action') {
          return (
              <div className="mt-3 bg-indigo-900/20 border border-indigo-500/30 rounded-[22px] p-4 overflow-hidden relative w-full md:w-[320px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
                  <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0">
                          <Smartphone className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                          <h4 className="text-xs font-bold text-indigo-300 mb-1">{card.title}</h4>
                          <p className="text-[11px] text-white/70 leading-relaxed">{card.description}</p>
                          <div className="mt-2 text-[10px] text-indigo-400/50 font-mono">
                              [NATIVE_CALL: ShadowAgent.clickOnText("{card.target_text}")]
                          </div>
                      </div>
                  </div>
              </div>
          );
      }
      if (card.cardType === 'workspace_item') {
          return (
              <div className="mt-4 rounded-[22px] p-4 w-full md:w-[320px] bg-[#1a1a1a]/95 border border-white/20 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/5 rounded-xl text-emerald-400">
                          {card.itemType === 'folder' ? <FolderOpen className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                          <h3 className="font-bold text-sm text-white truncate" dir="ltr">{card.title}</h3>
                          <p className="text-[10px] text-emerald-500/80 mt-0.5 truncate">{card.description}</p>
                      </div>
                  </div>
                  {card.itemType === 'file' && (
                      <button onClick={() => setSelectedWorkspaceFile(card)} className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs">
                          <ExternalLink className="w-3 h-3" /> فتح الملف
                      </button>
                  )}
              </div>
          );
      }
      return (
        <div className={`mt-4 rounded-[22px] p-4 w-full md:w-[320px] bg-[#0f0f0f]/90 border border-white/10`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl bg-white/10`}>{getCardIcon(card.cardType, card.number)}</div>
                <div><h3 className={`font-black text-xs text-white`}>{card.title}</h3><p className="text-[10px] text-white/50 truncate max-w-[200px]">{card.description}</p></div>
            </div>
            <button onClick={() => handleAppCardAction(card)} className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs border bg-white/10 hover:bg-white/20 text-white border-white/10`}>
                {card.cardType === 'internal_nav' ? <Layout className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                {card.cardType === 'internal_nav' ? 'فتح الصفحة' : 'فتح التطبيق'}
            </button>
        </div>
      );
  };

  const displayedMessages = messages.filter(m => {
    if ((m as any).isHidden) return false;
    if (!m.text && (!m.uiCards || m.uiCards.length === 0)) return false;
    if (!isSearchActive || !searchQuery.trim()) return true;
    return m.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#000] text-white font-['Cairo'] overflow-hidden relative">
      {showCapabilities && <CapabilitiesGuide onClose={() => setShowCapabilities(false)} onJoin={onUpgrade} onAffiliate={onOpenAffiliate} />}
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="*/*" />
      <input type="file" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />

      {appStatus === 'listening' && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="absolute top-10 left-10"><button onClick={cancelRecording} className="p-4 bg-white/10 rounded-full hover:bg-white/20"><X className="w-8 h-8" /></button></div>
              <div className="text-center mb-10"><h2 className="text-3xl font-black text-white mb-2 animate-pulse">جاري الاستماع...</h2><p className="text-white/50 text-lg font-medium">{liveTranscript || "سامعك يا ريس..."}</p></div>
              <div className="flex items-end gap-1.5 h-32 mb-12">{visualLevels.map((level, i) => (<div key={i} className="w-3 bg-gradient-to-t from-cyan-600 to-purple-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(10, level / 2)}%`, opacity: Math.max(0.3, level / 255) }}></div>))}</div>
              <button onClick={() => stopListeningAndSend()} className="p-6 bg-red-600 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform"><Square className="w-8 h-8 fill-current" /></button>
          </div>
      )}

      {isEnrollingVoice && (
          <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="text-center mb-10 max-w-md px-6">
                  <Shield className="w-16 h-16 text-purple-500 mx-auto mb-6 animate-pulse" />
                  <h2 className="text-3xl font-black text-white mb-4">تسجيل البصمة الصوتية</h2>
                  <p className="text-white/70 text-lg font-medium leading-relaxed">
                      يرجى التحدث بصوت واضح لمدة 4 ثوانٍ. قل مثلاً:
                      <br/>
                      <span className="text-purple-400 font-bold mt-2 block">"أنا الماستر، يا ظل اسمعني ونفذ أوامري"</span>
                  </p>
              </div>
              <div className="flex items-end gap-1.5 h-32 mb-12">
                  {visualLevels.map((level, i) => (
                      <div key={i} className="w-3 bg-gradient-to-t from-purple-600 to-pink-500 rounded-full transition-all duration-75 animate-pulse" style={{ height: `${Math.max(20, Math.random() * 100)}%`, opacity: 0.8 }}></div>
                  ))}
              </div>
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
                  <div className="overflow-hidden"><h1 className="text-base font-black tracking-tighter leading-none text-white whitespace-nowrap">غرفة عمليات الظل</h1><div className="flex items-center gap-1"><span className={`text-[10px] font-bold truncate ${isTito ? 'text-amber-500' : 'text-purple-500'}`}>{getGreetingSubtitle()}</span><span className="text-[10px] text-white/30">•</span><span className={`text-[9px] font-bold uppercase tracking-widest ${isSentinelMode ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>{isSentinelMode ? 'Sentinel ON' : 'Live'}</span></div></div>
              </div>
          )}
        </div>
        <div className="flex items-center gap-3 pl-2">
            {!isSearchActive && (
                <>
                    {!speechSupported && (
                        <div className="hidden md:flex items-center justify-center p-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400" title="متصفحك لا يدعم التعرف على الصوت">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    )}
                    <div className="hidden md:flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10" title={`حالة المزامنة: ${syncStatus}`}>
                        {syncStatus === 'synced' && <Cloud className="w-4 h-4 text-emerald-400" />}
                        {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />}
                        {syncStatus === 'offline' && <CloudOff className="w-4 h-4 text-white/40" />}
                        {syncStatus === 'error' && <CloudOff className="w-4 h-4 text-red-500" />}
                    </div>
                    <button onClick={toggleSentinelMode} className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${isSentinelMode ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`}>
                        <Ear className={`w-4 h-4 ${isSentinelMode ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-bold hidden md:inline">{isSentinelMode ? 'الحارس نشط' : 'الحارس'}</span>
                    </button>
                    {onOpenAffiliate && !isRestrictedMode && <button onClick={onOpenAffiliate} className="p-2 bg-emerald-900/20 border border-emerald-500/20 rounded-full text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"><DollarSign className="w-4 h-4" /></button>}
                    <button onClick={() => setIsSearchActive(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white transition-all"><Search className="w-4 h-4" /></button>
                    <button onClick={hasVoiceSignature ? handleClearVoice : handleEnrollVoice} className={`p-2 rounded-full border transition-all ${hasVoiceSignature ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`} title={hasVoiceSignature ? "مسح البصمة الصوتية" : "إعداد البصمة الصوتية"}>
                        <Shield className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full border transition-all ${isMuted ? 'bg-white/5 border-white/10 text-white/30' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'}`}>{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                </>
            )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 pb-44 space-y-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">
        {hasMoreMessages && !isSearchActive && (
            <div className="w-full flex justify-center py-4">
                <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-white/50 hover:text-white transition-all">
                    تحميل الرسائل السابقة
                </button>
            </div>
        )}
        {displayedMessages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'system' ? (
                <div className="w-full flex justify-center my-2"><div className="bg-amber-900/40 border border-amber-500/30 rounded-full px-6 py-2 flex items-center gap-3 backdrop-blur-md"><Clock className="w-4 h-4 text-amber-500 animate-pulse" /><span className="text-xs font-bold text-amber-200">{m.text}</span></div></div>
            ) : (
                <div className={`max-w-[90%] md:max-w-[70%] p-4 rounded-[20px] relative border backdrop-blur-md ${m.role === 'user' ? 'bg-[#1a1a1a] border-white/5 text-white/90 rounded-tl-none' : (m.isError ? 'bg-red-900/20 border-red-500/30 text-red-200' : 'bg-[#0f0f0f] border-purple-500/20 text-white shadow-lg')} ${m.role !== 'user' ? 'rounded-tr-none' : ''}`}>
                {m.image && <img src={m.image} className="w-full h-auto max-h-56 object-cover rounded-xl mb-3 border border-white/5" />}
                <div className="text-sm leading-6 font-medium whitespace-pre-wrap">{highlightText(m.text)}</div>
                
                {/* MULTITASKING UI CARDS: RENDER ALL */}
                {m.uiCards && m.uiCards.length > 0 ? (
                    <div className="flex flex-col gap-2 mt-4">
                        {m.uiCards.map((card, cIdx) => (
                            <div key={cIdx}>{renderCard(card, cIdx)}</div>
                        ))}
                    </div>
                ) : (
                    m.uiCard && renderCard(m.uiCard, 0) // Fallback for legacy messages
                )}

                {/* GROUNDING SOURCES (REAL-TIME INFO) */}
                {m.groundingLinks && m.groundingLinks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Globe className="w-3 h-3 animate-pulse" /> مصادر حية (Grounding)
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {m.groundingLinks.slice(0, 4).map((link, i) => (
                                <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full border border-emerald-500/20 transition-all group">
                                    <span className="text-[10px] text-white/80 truncate max-w-[150px] font-bold group-hover:text-emerald-300">{link.title || new URL(link.uri!).hostname}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
                                </a>
                            ))}
                        </div>
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
                        {m.role === 'model' && <button onClick={() => handleShareMessage(m.text)} className="px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/5 flex items-center gap-1 hover:bg-white/10" title="مشاركة كنص"><Share2 className="w-2.5 h-2.5" /></button>}
                        {m.role === 'model' && <button onClick={() => handleShareVoiceMessage(m)} disabled={isSharingVoice === m.timestamp} className="px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1 hover:bg-indigo-500/20" title="مشاركة كصوت">{isSharingVoice === m.timestamp ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Mic className="w-2.5 h-2.5" />}</button>}
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
                <div className="flex items-center gap-1 mb-0.5">
                    <button disabled={isProcessingImage} onClick={() => { if(fileInputRef.current) fileInputRef.current.value = ''; fileInputRef.current?.click(); }} className={`p-2 transition-colors hover:bg-white/5 rounded-full ${isProcessingImage ? 'text-purple-500 animate-pulse' : 'text-white/20 hover:text-white'}`} title="إرفاق صورة">{isProcessingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}</button>
                    <button disabled={isProcessingImage} onClick={() => { if(cameraInputRef.current) cameraInputRef.current.value = ''; cameraInputRef.current?.click(); }} className={`p-2 transition-colors hover:bg-white/5 rounded-full ${isProcessingImage ? 'text-purple-500 animate-pulse' : 'text-white/20 hover:text-white'}`} title="التقاط صورة"><Camera className="w-5 h-5" /></button>
                </div>
                <textarea 
                    value={input} 
                    onChange={handleInputChange} 
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                    placeholder={isRestrictedMode ? "اكتب رسالتك (فترة تجربة)..." : (isSentinelMode ? "وضع الحارس مفعل... (قول يا ظل)" : (isAdmin ? "أمرك يا ريس..." : "قولي يا ريس..."))} 
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/20 focus:ring-0 resize-none min-h-[50px] max-h-[150px] py-3 px-2 scrollbar-hide font-medium leading-relaxed" 
                    rows={1} 
                    style={{ height: 'auto', minHeight: '50px' }} 
                    onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = `${Math.min(target.scrollHeight, 150)}px`; }} 
                />
                {(input.trim() || pendingImage) && <button onClick={() => handleSend()} className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-full transition-all shadow-lg hover:shadow-cyan-600/20 mb-0.5 animate-in zoom-in"><Send className="w-5 h-5 text-white" /></button>}
            </div>
            <button onClick={startListening} className={`p-4 rounded-[24px] border shadow-lg transition-all active:scale-95 mb-0.5 ${isSentinelMode ? 'bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}>{isSentinelMode ? <Ear className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}</button>
        </div>
      </div>

      {isLimitReached && (
          <div className="fixed bottom-[32px] left-0 w-full p-4 bg-[#111] border-t border-red-500/30 z-50 text-center animate-in slide-in-from-bottom-full">
              <p className="text-red-400 font-bold mb-3">انتهت فترة التجربة (3 أيام)</p>
              <button onClick={onUpgrade} className="px-6 py-2 bg-amber-500 text-black rounded-full font-black text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  اشترك الآن لفتح كل المميزات
              </button>
          </div>
      )}

      {preparedShareData && (
          <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in">
              <div className="bg-[#111] border border-indigo-500/30 p-8 rounded-[32px] max-w-sm w-full text-center shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Mic className="w-10 h-10 text-indigo-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">الملف الصوتي جاهز!</h3>
                  <p className="text-white/50 text-xs mb-8 font-medium">تم تحضير المقطع الصوتي للظل وهو جاهز الآن لربطه بأي تطبيق للمشاركة.</p>
                  
                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={async () => {
                              try {
                                  if (navigator.canShare && navigator.canShare({ files: preparedShareData.files })) {
                                      await navigator.share(preparedShareData);
                                  } else {
                                      const url = URL.createObjectURL(preparedShareData.files[0]);
                                      const a = document.createElement('a'); a.href = url; a.download = 'shadow-voice.mp3'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
                                  }
                              } catch(e) {}
                              setPreparedShareData(null);
                          }}
                          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-white text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50"
                      >
                          <Share2 className="w-5 h-5" /> مشاركة الصوت الآن
                      </button>
                      <button 
                          onClick={() => setPreparedShareData(null)}
                          className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-white/50 text-xs transition-colors"
                      >
                          إلغاء
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedWorkspaceFile && (
          <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
              <div className="bg-[#151515] border border-white/10 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]">
                      <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-emerald-400" />
                          <div>
                              <h3 className="font-bold text-white tracking-widest">{selectedWorkspaceFile.title}</h3>
                              <p className="text-[10px] text-white/40">{selectedWorkspaceFile.description}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          {selectedWorkspaceFile.itemType === 'file' && (
                              <button onClick={() => {
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                      printWindow.document.write('<html><head><title>' + selectedWorkspaceFile.title + '</title>');
                                      printWindow.document.write('<style>body { font-family: monospace; white-space: pre-wrap; padding: 20px; color: #000; background: #fff; line-height: 1.5; font-size: 14px; }</style>');
                                      printWindow.document.write('</head><body>');
                                      printWindow.document.write(selectedWorkspaceFile.content || 'فارغ');
                                      printWindow.document.write('</body></html>');
                                      printWindow.document.close();
                                      printWindow.print();
                                  }
                              }} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold flex items-center gap-2 transition-all text-sm print:hidden">
                                  <Printer className="w-4 h-4" /> طباعة
                              </button>
                          )}
                          <button onClick={() => setSelectedWorkspaceFile(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-red-400 transition-all">
                              <X className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0f0f0f]" dir="ltr">
                      <pre className="text-white/80 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedWorkspaceFile.content || '// لا يوجد محتوى'}
                      </pre>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ChatInterface;