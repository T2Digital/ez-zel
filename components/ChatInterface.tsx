import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Square, Volume2, VolumeX, Play, Pause, Brain, Activity, Mic2, Paperclip, X, Zap, Lock, Crown, Globe, Sun, ArrowLeft, Loader2, Sparkles, ArrowRight, DollarSign, RotateCcw, Home, Clock, MessageCircle, Share2, Copy, Shield, Download, Smartphone, Cpu, HelpCircle, Star, Search, ExternalLink, PhoneCall, CheckCircle, Ear, RefreshCw, StopCircle, MapPin, Hotel, Music, Video, Grid, Camera, Edit3, Car, Landmark, CreditCard, FileText, Printer, PenTool } from 'lucide-react';
import { getShadowResponse, playShadowVoice, stopVoice, getShadowVoice } from '../services/geminiService';
import { shadowDB, DBMessage, UserProfile } from '../services/dbService';

interface Props {
    currentUser: UserProfile;
    onUpgrade: () => void;
    onBack: () => void; 
    onOpenAffiliate?: () => void; 
    isAdmin?: boolean; 
    onNavigateTo?: (section: string) => void; 
    incomingSystemMessage?: DBMessage | null; 
}

const ChatInterface: React.FC<Props> = ({ currentUser, onUpgrade, onBack, onOpenAffiliate, isAdmin = false, onNavigateTo, incomingSystemMessage }) => {
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [input, setInput] = useState('');
  const [appStatus, setAppStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [isSentinelMode, setIsSentinelMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const load = async () => {
        const history = await shadowDB.getHistory(currentUser.email);
        setMessages(history);
    };
    load();
  }, [currentUser.email]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, appStatus, liveTranscript]);

  const handleSend = async (forcedText?: string) => {
    if (isSubmittingRef.current) return;
    const textToSend = forcedText || input;
    if (!textToSend.trim()) return;

    isSubmittingRef.current = true;
    const userMsg: DBMessage = { userId: currentUser.email, role: 'user', text: textToSend, timestamp: Date.now() };
    const userMsgId = await shadowDB.saveMessage(userMsg);
    setMessages(prev => [...prev, { ...userMsg, id: userMsgId }]);
    setInput('');
    setAppStatus('thinking');

    abortControllerRef.current = new AbortController();
    try {
      const result = await getShadowResponse(messages, textToSend, undefined, currentUser, abortControllerRef.current.signal);
      
      let voiceData: string | null = null;
      if (!isMuted && !result.isError) voiceData = await getShadowVoice(result.text, 'male');

      const modelMsg: DBMessage = { userId: currentUser.email, role: 'model', text: result.text, timestamp: Date.now(), voiceData: voiceData || undefined };
      const modelId = await shadowDB.saveMessage(modelMsg);
      setMessages(prev => [...prev, { ...modelMsg, id: modelId }]);
      
      if (voiceData) {
          setPlayingMessageId(modelId);
          setAppStatus('speaking');
          playShadowVoice(result.text, 'male', voiceData, () => {
              setPlayingMessageId(null);
              setAppStatus('idle');
              if (result.shouldUpgrade) onUpgrade();
          });
      } else {
          setAppStatus('idle');
          if (result.shouldUpgrade) onUpgrade();
      }
    } catch (e) {
      setMessages(prev => [...prev, { userId: currentUser.email, role: 'model', text: "عذراً يا ريس، فيه ضغط على السيستم.", timestamp: Date.now() }]);
      setAppStatus('idle');
    } finally { isSubmittingRef.current = false; }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#000] text-white font-['Cairo'] overflow-hidden relative">
      <div className="h-14 px-4 border-b border-white/10 bg-[#0a0a0a] flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full bg-white/5"><Home className="w-4 h-4" /></button>
          <h1 className="text-base font-black">غرفة عمليات الظل</h1>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="p-2">{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-[20px] ${m.role === 'user' ? 'bg-[#1a1a1a] border border-white/5' : 'bg-[#0f0f0f] border border-purple-500/20'}`}>
                <p className="text-sm leading-relaxed">{m.text}</p>
                <div className="mt-2 text-[9px] opacity-30">{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {appStatus === 'thinking' && <div className="flex justify-end animate-pulse text-xs text-purple-400">الظل بيفكر...</div>}
      </div>

      <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
        <div className="flex gap-2 max-w-4xl mx-auto">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="أمرك يا ريس..." className="flex-1 bg-[#151515] border border-white/10 rounded-2xl p-3 text-sm focus:outline-none focus:border-cyan-500/50 resize-none" rows={1} />
            <button onClick={() => handleSend()} className="p-4 bg-cyan-600 rounded-full"><Send className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;