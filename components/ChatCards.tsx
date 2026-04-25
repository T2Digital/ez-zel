import React from 'react';
import { Terminal, CheckCircle, Printer, Copy, Smartphone, FolderOpen, FileText, ExternalLink, MessageCircle, Video, PhoneCall, Car, Search, Hotel, MapPin, Calculator, Layout } from 'lucide-react';
import LiveAgentAction from './LiveAgentAction';

export const getCardIcon = (type: string, number?: string) => {
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

interface ChatCardProps {
    card: any;
    onSend: (text: string, voiceData?: string, image?: string, autoSubmit?: boolean) => void;
    onAppCardAction: (card: any) => void;
    onSelectWorkspaceFile: (card: any) => void;
}

export const ChatCard: React.FC<ChatCardProps> = ({ card, onSend, onAppCardAction, onSelectWorkspaceFile }) => {
    if (card.cardType === 'live_action') {
        return <LiveAgentAction actionType={card.actionType} args={card.args} onComplete={(resultText: string) => {
            onSend(resultText, undefined, undefined, true);
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
                      <p className="text-sm font-bold font-mono bg-gray-100 px-3 py-1 rounded-md border border-gray-200" dir="ltr">{new Date().toLocaleDateString('en-GB')}</p>
                  </div>
              </div>

              <div className="mb-8 px-2">
                  <div className="inline-block bg-black text-white px-3 py-1 rounded-md mb-3"><p className="text-[10px] uppercase font-black tracking-widest">مقدم إلى</p></div>
                  <h3 className="text-2xl font-black text-gray-800 border-l-4 border-cyan-500 pl-3 leading-none">{card.data.clientName}</h3>
              </div>

              {card.data.contractBody && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest border-b border-gray-200 pb-2">تفاصيل العقد</h4>
                      <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">{card.data.contractBody}</div>
                  </div>
              )}

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
                                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                      <td className="py-4 px-4 font-bold text-gray-800">{item.desc}</td>
                                      <td className="py-4 px-4 text-left font-mono font-bold text-gray-900 bg-gray-50/50" dir="ltr">{(item.price || 0).toLocaleString()}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}

              {card.data.items && card.data.items.length > 0 && (
                  <div className="flex justify-end px-2 mb-10">
                      <div className="w-full md:w-1/2 flex justify-between items-center p-4 rounded-xl bg-black text-white shadow-xl">
                          <span className="font-black text-sm tracking-widest uppercase">الإجمالي</span>
                          <div className="flex items-center gap-2">
                              <span className="font-black text-2xl font-mono text-cyan-400" dir="ltr">{card.data.items.reduce((s:number, i:any) => s + (i.price || 0), 0).toLocaleString()}</span>
                              <span className="text-xs font-bold text-gray-400">EGP</span>
                          </div>
                      </div>
                  </div>
              )}

              <div className="mt-8 flex gap-3 print:hidden">
                  <button onClick={() => window.print()} className="flex-1 py-3 bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 text-sm shadow-xl active:scale-95"><Printer className="w-4 h-4" /> طباعة</button>
                  {card.data.contractBody && (
                      <button onClick={() => {
                          const contractText = `عقد اتفاق\n\nالطرف الثاني: ${card.data.clientName}\n\n${card.data.contractBody}`;
                          navigator.clipboard.writeText(contractText);
                      }} className="px-4 py-3 border-2 border-black rounded-xl font-black justify-center gap-2 text-sm"><Copy className="w-4 h-4" /> نسخ</button>
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
                    <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0"><Smartphone className="w-5 h-5 text-indigo-400" /></div>
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-indigo-300 mb-1">{card.title}</h4>
                        <p className="text-[11px] text-white/70 leading-relaxed">{card.description}</p>
                        <div className="mt-2 text-[10px] text-indigo-400/50 font-mono">[NATIVE_CALL: ShadowAgent.clickOnText("{card.target_text}")]</div>
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
                    <button onClick={() => onSelectWorkspaceFile(card)} className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center gap-2 justify-center text-xs">
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
          <button onClick={() => onAppCardAction(card)} className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs border bg-white/10 hover:bg-white/20 text-white border-white/10`}>
              {card.cardType === 'internal_nav' ? <Layout className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
              {card.cardType === 'internal_nav' ? 'فتح الصفحة' : 'فتح التطبيق'}
          </button>
      </div>
    );
};
