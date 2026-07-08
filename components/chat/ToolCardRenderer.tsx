import React from 'react';
import { 
    CheckCircle, Layout, Printer, Terminal, ExternalLink, 
    MessageCircle, Video, PhoneCall, Car, Search, Hotel, 
    MapPin, Calculator 
} from 'lucide-react';
import LiveAgentAction from '../LiveAgentAction';
import { UserProfile } from '../../services/dbService';

export const getCardIcon = (type: string, number?: string) => { 
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

export const handleAppCardAction = async (card: any, onNavigateTo?: (section: string) => void) => { 
    if (!card) return; 
    if (card.cardType === 'internal_nav') { 
        if (onNavigateTo) onNavigateTo(card.targetSection);
        return;
    }
    if (card.cardType === 'business_doc') { window.print(); return; }
    
    if (card.url) { 
        let cleanUrl = card.url.trim();
        if (!cleanUrl.match(/^[a-zA-Z0-9+-]+:/)) {
           cleanUrl = `https://${cleanUrl}`;
        }
        window.open(cleanUrl, '_blank', 'noopener,noreferrer'); 
    } 
};

interface ToolCardRendererProps {
    card: any;
    index: number;
    currentUser: UserProfile;
    handleSend: (text: string, audio?: Blob, existingAudio?: string, isHidden?: boolean) => void;
    onNavigateTo?: (section: string) => void;
}

export const ToolCardRenderer: React.FC<ToolCardRendererProps> = ({ card, index, currentUser, handleSend, onNavigateTo }) => {
    if (card.cardType === 'live_action') {
        return <LiveAgentAction key={index} actionType={card.actionType} args={card.args} userProfile={currentUser} onComplete={(resultText) => {
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
            <div className="mt-4 bg-[#111] p-4 rounded-[22px] border border-emerald-500/20 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-full"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                    <div><h3 className="font-bold text-white text-sm">{card.title}</h3><p className="text-[10px] text-white/50">{card.description}</p></div>
                </div>
                {card.audioData && (
                    <audio controls className="w-full mt-2 rounded-[12px] bg-black/50" src={card.audioData}></audio>
                )}
            </div>
        );
    }
    if (card.cardType === 'business_doc') {
        return (
          <div className="mt-4 bg-white text-black rounded-[22px] p-6 shadow-2xl printable-invoice w-full md:w-[600px] border border-black/10 overflow-hidden relative print:w-full print:border-none print:shadow-none print:m-0 print:p-0">
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
                          <h2 className="text-3xl font-black">{card.data.docType === 'quote' ? 'عرض السعـر' : (card.data.docType === 'contract' ? 'عقـد اتفـاق' : (card.data.docType === 'cv' ? 'سيـرة ذاتيـة' : 'فـاتـورة'))}</h2>
                          <p className="text-xs text-gray-400 font-bold tracking-widest" dir="ltr">DOCUMENT ID: <span className="text-black font-mono">EZ-{Math.floor(Math.random() * 90000) + 10000}</span></p>
                      </div>
                  </div>
                  <div className="text-right flex flex-col gap-1 mt-14">
                      <p className="font-black text-sm text-gray-400 uppercase tracking-widest">التاريـخ</p>
                      <p className="text-sm font-bold font-mono bg-gray-100 px-3 py-1 rounded-md border border-gray-200" dir="ltr">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
              </div>

              <div className="mb-8 px-2">
                  <div className="inline-block bg-black text-white px-3 py-1 rounded-md mb-3">
                      <p className="text-[10px] uppercase font-black tracking-widest">{card.data.docType === 'cv' ? 'الاسم' : 'مقدم إلى'}</p>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 border-l-4 border-cyan-500 pl-3 leading-none">{card.data.clientName}</h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200 shadow-inner">
                  <pre className="whitespace-pre-wrap font-['Cairo'] text-sm leading-8 text-black font-semibold text-right">{card.data.content}</pre>
              </div>

              {(card.data.totalAmount !== undefined && card.data.totalAmount > 0) && (
                  <div className="flex justify-end px-2 mb-8 border-t-2 border-black pt-4">
                      <div className="text-left bg-black text-white p-4 rounded-xl inline-flex flex-col gap-1 shadow-lg w-64 items-center">
                          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">المبلـغ الإجمالـي</span>
                          <span className="text-3xl font-mono font-black">{card.data.totalAmount} <span className="text-sm font-['Cairo'] text-cyan-400">جنيه</span></span>
                      </div>
                  </div>
              )}

              <div className="mt-12 text-center pt-6 border-t border-gray-200 flex flex-col items-center justify-center gap-2">
                  <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Generated by Ez-Zel Digital Shadow</p>
                  <div className="w-16 h-1 bg-cyan-500 rounded-full"></div>
              </div>
          </div>
        );
    }
    if (card.cardType === 'mobile_agent_action') {
        return (
            <div className="mt-4 bg-[#151515] p-3 md:p-5 rounded-[22px] border border-cyan-500/20 shadow-xl flex items-center gap-4 cursor-pointer hover:bg-[#222] transition-colors" onClick={() => handleAppCardAction(card, onNavigateTo)}>
                <div className="p-3 md:p-4 bg-cyan-500/10 rounded-full">{getCardIcon(card.cardType, card.number)}</div>
                <div className="flex-1">
                    <h3 className="font-bold text-white text-sm md:text-md mb-1 flex items-center gap-2">{card.title} {card.cardType === 'internal_nav' && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">داخلي</span>}</h3>
                    <p className="text-xs md:text-sm text-cyan-400 font-bold">{card.action}</p>
                </div>
                <div className="flex flex-col items-center opacity-50 px-2">
                    {card.cardType === 'internal_nav' ? <Layout className="w-4 h-4 md:w-5 md:h-5" /> : <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />}
                    <span className="text-[8px] md:text-[10px] mt-1 text-center font-bold">{card.cardType === 'internal_nav' ? 'فتح الصفحة' : 'فتح التطبيق'}</span>
                </div>
            </div>
        );
    }
    if (card.cardType === 'workspace_item') {
        return (
            <div className="mt-4 bg-[#0a0a0a] p-4 rounded-[22px] border border-emerald-500/20 flex flex-col gap-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-full"><Terminal className="w-4 h-4 text-emerald-500" /></div>
                    <div><h3 className="font-bold text-white text-sm">{card.title}</h3><p className="text-[10px] text-white/50">{card.description}</p></div>
                </div>
                <pre className="text-emerald-400/80 bg-black/50 p-2 rounded-lg border border-white/5 whitespace-pre-wrap mt-2 max-h-[100px] overflow-hidden">{card.content}</pre>
            </div>
        );
    }
    
    return (
        <div className="mt-4 bg-[#111] p-4 rounded-[22px] border border-white/10 shadow-xl flex items-center gap-4 cursor-pointer hover:bg-[#1a1a1a]" onClick={() => handleAppCardAction(card, onNavigateTo)}>
            <div className="p-3 bg-white/5 rounded-full">{getCardIcon(card.cardType, card.number)}</div>
            <div className="flex-1"><h3 className="font-bold text-white text-sm mb-1">{card.title}</h3><p className="text-xs text-white/60">{card.description}</p></div>
            <div className="flex flex-col items-center opacity-40 px-2">
                {card.cardType === 'internal_nav' ? <Layout className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                <span className="text-[8px] mt-1">{card.cardType === 'internal_nav' ? 'فتح الصفحة' : 'فتح التطبيق'}</span>
            </div>
        </div>
    );
};
