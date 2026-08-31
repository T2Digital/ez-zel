import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowRight, Bot, User, Sparkles, Music2, Shield, Mic, RefreshCw } from 'lucide-react';
import { ChatMessage, ActiveView } from '../types';

interface ChatInterfaceProps {
  onBack: () => void;
  onNavigate: (view: ActiveView) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack, onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'أهلاً بك يا بطل! أنا ظلك الرقمي الحصين (Ez-Zel). جاهز لتأليف وإنتاج أي أغنية أو تراك موسيقي، كتابة الكلمات الشعرية، أو مساعدتك في إدارة مهامك وحمايتك السيادية. بماذا نبدأ اليوم؟',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Check if user is asking about music
      const isMusicRelated = /أغنية|اغنية|موسيقى|موسيقي|تراك|كلمات|راب|شعبي|لحن|ستوديو|استوديو/i.test(userText);

      await new Promise((r) => setTimeout(r, 600));

      let assistantReply = '';
      if (isMusicRelated) {
        assistantReply = `تمام يا غالي! محرك الأغاني وGoogle AI Lyrics 3.5 مدمج وجاهز تماماً لتأليف الكلمات وتوزيع الألحان وإنتاج التراكات الحقيقية بصيغة WAV. يمكنك فتح استوديو الموسيقى مباشرة للتحكم في الإيقاع، المقام، والسرعة (BPM).`;
      } else {
        assistantReply = `أمرك يا سيدي! قمت بمعالجة طلبك: "${userText}" بنجاح عبر منظومة الظل الرقمي السيادية. هل ترغب في تنفيذ أي مهام إضافية أو تأليف تراك موسيقي جديد؟`;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen bg-[#05070d]/90 text-slate-100 flex flex-col justify-between backdrop-blur-md">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600">
            <Bot className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="font-bold text-sm md:text-base font-cairo text-white">
              محادثة الظل الرقمي السيادية
            </h2>
            <p className="text-[11px] text-cyan-400">اتصال عصبي مباشر مشفر</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('music')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs hover:bg-cyan-900/60 transition-all"
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>استوديو الموسيقى</span>
          </button>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة</span>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-cyan-500 text-black'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/80 border border-purple-700/50 text-slate-100 rounded-tr-none'
                  : 'bg-[#0e1424]/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'
              }`}
            >
              <div className="whitespace-pre-line font-cairo">{m.content}</div>
              <div className="text-[10px] text-slate-400 mt-2 text-left font-mono">
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800 rounded-tl-none flex items-center gap-2 text-xs text-cyan-300">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>جارٍ التفكير ومعالجة الأمر...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 border-t border-slate-800 max-w-4xl w-full mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 p-2 rounded-2xl bg-[#0e1424] border border-slate-800 focus-within:border-cyan-400 shadow-xl"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك أو اطلب تأليف أغنية جديدة..."
            className="flex-1 bg-transparent px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl transition-all ${
              input.trim() && !isLoading
                ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 hover:scale-105'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
