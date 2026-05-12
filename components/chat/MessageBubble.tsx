import React from 'react';
import { Clock, ExternalLink, RefreshCw, Edit3, Share2, Mic, Play, Square, Loader2, MessageCircle, Video, PhoneCall, Car, Search, Hotel, MapPin, Calculator, Terminal, Layout, Activity, Briefcase, CheckCircle, FolderOpen, FileText, Smartphone, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DBMessage } from '../../services/dbService';

interface ExtendedMessage extends DBMessage {
    isError?: boolean;
}

interface MessageBubbleProps {
    m: ExtendedMessage;
    idx: number;
    highlightText?: (text: string) => React.ReactNode; // Keeping optional so we don't break parent
    renderCard: (card: any, index: number) => React.ReactNode;
    handleSend: (text: string) => void;
    setInput: (text: string) => void;
    handleShareMessage: (text: string) => void;
    handleShareVoiceMessage: (m: ExtendedMessage) => void;
    isSharingVoice: number | null;
    playingMessageId: number | null;
    handleStopPlayback: () => void;
    handlePlayMessage: (m: ExtendedMessage) => void;
    handleDeleteMessage?: (id: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
    m, idx, highlightText, renderCard, handleSend, setInput,
    handleShareMessage, handleShareVoiceMessage, isSharingVoice,
    playingMessageId, handleStopPlayback, handlePlayMessage, handleDeleteMessage
}) => {
    return (
        <div className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'system' ? (
                <div className="w-full flex justify-center my-2">
                    <div className="bg-amber-900/40 border border-amber-500/30 rounded-full px-6 py-2 flex items-center gap-3 backdrop-blur-md">
                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="text-xs font-bold text-amber-200">{m.text}</span>
                    </div>
                </div>
            ) : (
                <div className={`max-w-[90%] md:max-w-[70%] p-4 rounded-[20px] relative border backdrop-blur-md ${m.role === 'user' ? 'bg-[#1a1a1a]/50 border-white/5 text-white/90 rounded-tl-none' : (m.isError ? 'bg-red-900/20 border-red-500/30 text-red-200' : 'bg-[#0f0f0f]/50 border-purple-500/20 text-white shadow-lg')} ${m.role !== 'user' ? 'rounded-tr-none' : ''}`}>
                    {m.image && <img src={m.image} className="w-full h-auto max-h-56 object-cover rounded-xl mb-3 border border-white/5" />}
                    
                    <div className="text-sm leading-7 font-medium markdown-body select-text" dir="auto">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: ({node, ...props}) => <a {...props} className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer"/>,
                                pre: ({node, ...props}) => <pre className="bg-[#0a0a0a] p-3 rounded-lg border border-white/5 overflow-x-auto my-2" dir="ltr" {...props}/>,
                                code: ({node, className, children, ...props}: any) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isBlock = match || (node?.position?.start?.line !== node?.position?.end?.line);
                                    return <code className={`${isBlock ? 'text-emerald-300' : 'bg-black/40 text-purple-300 px-1.5 py-0.5 rounded-md'} font-mono text-xs ${className || ''}`} {...props}>{children}</code>;
                                },
                                ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 space-y-1" {...props}/>,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1" {...props}/>,
                                strong: ({node, ...props}) => <strong className="text-purple-400 font-bold" {...props}/>
                            }}
                        >
                            {m.text}
                        </ReactMarkdown>
                    </div>
                    
                    {/* MULTITASKING UI CARDS: RENDER ALL */}
                    {m.uiCards && m.uiCards.length > 0 ? (
                        <div className="flex flex-col gap-2 mt-4">
                            {m.uiCards.map((card, cIdx) => (
                                <div key={cIdx}>{renderCard(card, cIdx)}</div>
                            ))}
                        </div>
                    ) : (
                        (m as any).uiCard && renderCard((m as any).uiCard, 0) // Fallback for legacy messages
                    )}

                    {/* GROUNDING SOURCES (REAL-TIME INFO) */}
                    {m.groundingLinks && m.groundingLinks.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                            <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                <GlobeIcon /> مصادر حية (Grounding)
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
                        <div className="flex items-center gap-3">
                            {handleDeleteMessage && m.id && (
                                <button onClick={() => handleDeleteMessage(m.id!)} className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 hover:bg-red-500/20" title="حذف الرسالة"><Trash2 className="w-2.5 h-2.5" /></button>
                            )}
                            <span className="text-[9px] text-white/20 font-black tracking-widest">{new Date(m.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
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
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.m.id === nextProps.m.id &&
        prevProps.m.text === nextProps.m.text &&
        prevProps.m.uiCards?.length === nextProps.m.uiCards?.length &&
        prevProps.isSharingVoice === nextProps.isSharingVoice &&
        prevProps.playingMessageId === nextProps.playingMessageId
    );
});

const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe animate-pulse"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);
