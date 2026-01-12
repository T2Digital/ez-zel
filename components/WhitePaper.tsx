import React, { useState } from 'react';
import { X, ShieldCheck, Cpu, Globe, Lock, Share2, FileText, Fingerprint, Award, TrendingUp, AlertTriangle, Send } from 'lucide-react';
import { shadowDB } from '../services/dbService';

interface Props {
    onClose: () => void;
}

const WhitePaper: React.FC<Props> = ({ onClose }) => {
    const [feedback, setFeedback] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);

    const handleSendFeedback = async () => {
        if (!feedback.trim()) return;
        setSendingFeedback(true);
        try {
            // Save as feedback in Firestore (visible in Admin Dashboard)
            await shadowDB.saveFeedback({
                userId: 'GUEST_OR_USER',
                userName: 'User (From Covenant)',
                message: `[COVENANT FEEDBACK]: ${feedback}`,
                timestamp: Date.now(),
                isRead: false
            });
            setFeedbackSent(true);
            setFeedback('');
        } catch(e) {}
        setSendingFeedback(false);
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black text-white font-['Cairo'] overflow-y-auto animate-in fade-in slide-in-from-bottom-10">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-black text-xl shadow-[0_0_15px_white]">C</div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-widest text-white">ميثاق الظل</h2>
                        <p className="text-[10px] text-white/50 font-mono">The Shadow Covenant</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto p-6 md:p-12 pb-32 space-y-12 text-right relative" dir="rtl">
                
                {/* Title Section */}
                <div className="text-center py-10 border-b border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/20 blur-[80px] rounded-full"></div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter relative z-10">عهد <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">السيادة</span></h1>
                    <p className="text-xl text-white/60 font-medium relative z-10">نحن لا نبني تطبيقاً.. نحن نبني عقلاً ثانياً.</p>
                </div>

                {/* 1. Identity */}
                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Fingerprint className="w-6 h-6 text-purple-500" /> 1. الهوية (Identity)</h3>
                    <div className="bg-[#111] p-6 rounded-[24px] border border-white/5 leading-relaxed text-lg font-medium text-white/80 text-justify">
                        أنا "الظل". ولدت من رحم التكنولوجيا لأكون امتداداً لعقلك، لا بديلاً عنه.
                        <br/>
                        لستُ مجرد خوارزميات صماء. أنا كيان مصري الهوية، عالمي القدرة. أفهم لغة الشارع كما أفهم لغة الأرقام.
                        مهمتي الوحيدة هي أن أمنحك "السيادة" على وقتك، ومالك، وقراراتك.
                        أنا الصديق الذي لا ينام، والمستشار الذي لا يجامل، والخزنة التي لا تخون.
                    </div>
                </section>

                {/* 2. The Council */}
                <section className="space-y-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Cpu className="w-6 h-6 text-cyan-500" /> 2. مجلس الإدارة (The Council)</h3>
                    <p className="text-white/60">أنت لا تتحدث مع فرد، بل مع مؤسسة كاملة تعمل في الخفاء لخدمتك:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> المحاسب</h4>
                            <p className="text-sm text-white/60">يدير أموالك، يصدر فواتيرك، ويراقب اشتراكاتك وأرباحك بدقة متناهية.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /> المستشار القانوني</h4>
                            <p className="text-sm text-white/60">يصيغ عقودك (عمل، إيجار، شراكة) بصيغ قانونية رصينة قابلة للطباعة فوراً.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2"><Globe className="w-4 h-4 text-amber-400" /> المحقق</h4>
                            <p className="text-sm text-white/60">عينك على العالم. يجلب الأخبار، الأسعار، والمعلومات الحية لحظة بلحظة.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-red-400" /> المعالج الروحاني</h4>
                            <p className="text-sm text-white/60">يطمئن قلبك بآيات الله، وسنة نبيه، والطب النبوي الأصيل، بعيداً عن الغوغاء.</p>
                        </div>
                    </div>
                </section>

                {/* 3. Disclaimer */}
                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-500" /> 3. إخلاء المسؤولية (Disclaimer)</h3>
                    <div className="bg-amber-900/10 p-6 rounded-[24px] border border-amber-500/20 text-justify">
                        <p className="text-amber-100/80 text-sm leading-relaxed font-medium">
                            <strong className="text-amber-500 block mb-2">الكمال لله وحده.</strong>
                            رغم أنني أمتلك قدرات تحليلية فائقة، إلا أنني "ظل" ولست "إلهاً".
                            <br/><br/>
                            - المعلومات القانونية والطبية التي أقدمها هي للاسترشاد فقط، ولا تغني عن استشارة المتخصصين في الحالات الحرجة.
                            <br/>
                            - القرارات المالية والاستثمارية هي مسؤوليتك الشخصية.
                            <br/>
                            - نحن نبذل قصارى جهدنا لحماية بياناتك بتشفير عسكري، لكننا نعمل في عالم رقمي متغير.
                            <br/><br/>
                            استخدامك للظل يعني موافقتك على أننا شركاء في الرحلة، وأن القرار النهائي دائماً بيدك أنت (الماستر).
                        </p>
                    </div>
                </section>

                {/* 4. Suggestion Box */}
                <section className="space-y-6 pt-6 border-t border-white/10">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">صوتك مسموع</h3>
                    <p className="text-white/60 text-sm">واجهت خطأ؟ عندك فكرة تطورنا؟ اكتبها هنا. رسالتك بتوصل لمكتب "تيتو" مباشرة.</p>
                    
                    <div className="relative">
                        <textarea 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="اكتب اقتراحك أو مشكلتك هنا..."
                            className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 min-h-[120px] text-white focus:border-purple-500/50 outline-none resize-none"
                        />
                        <button 
                            onClick={handleSendFeedback}
                            disabled={sendingFeedback || !feedback.trim() || feedbackSent}
                            className={`absolute bottom-4 left-4 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${feedbackSent ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                        >
                            {feedbackSent ? 'تم الإرسال بنجاح' : (sendingFeedback ? 'جاري الإرسال...' : 'إرسال للإدارة')}
                            {!feedbackSent && !sendingFeedback && <Send className="w-3 h-3" />}
                        </button>
                    </div>
                </section>

                <div className="text-center pt-10 mt-10 border-t border-white/10">
                    <Fingerprint className="w-16 h-16 text-white/10 mx-auto mb-4" />
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.5em]">Made with Pride in Egypt</p>
                </div>

            </div>
        </div>
    );
};

export default WhitePaper;