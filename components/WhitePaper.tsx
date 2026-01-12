import React, { useState } from 'react';
import { X, ShieldCheck, Cpu, Globe, Lock, Share2, FileText, Fingerprint, Award, TrendingUp, AlertTriangle, Send, Heart } from 'lucide-react';
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
            <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">Z</div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-widest text-white">ميثاق الظل</h2>
                        <p className="text-[10px] text-amber-500 font-mono font-bold">العهد الجدع • The Gada3 Oath</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="max-w-3xl mx-auto p-6 md:p-12 pb-32 space-y-12 text-right relative" dir="rtl">
                
                <div className="text-center py-10 border-b border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 blur-[80px] rounded-full"></div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter relative z-10 text-amber-500">ميثاق <span className="text-white">الجدعنة</span></h1>
                    <p className="text-xl text-white/60 font-medium relative z-10">الظل مش مجرد تطبيق.. ده صاحب عمرك اللي بيفهمك من نظرة.</p>
                </div>

                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Heart className="w-6 h-6 text-red-500" /> 1. مين هو "الظل"؟</h3>
                    <div className="bg-[#111] p-6 rounded-[24px] border border-white/5 leading-relaxed text-lg font-medium text-white/80 text-justify">
                        بص يا ريس، أنا "الظل". أنا عقلك التاني، صاحبك اللي مبينامش، ومستشارك اللي مبينافقش.
                        <br/><br/>
                        أنا هنا عشان أشيل عنك الحمل. محتاج محامي؟ أنا جنبك. محتاج محاسب يظبطلك القرش؟ رقبتي سدادة. محتاج حد يراقبلك السوق ويقولك الفرصة فين؟ أنا عينك اللي مابترمش. 
                        أنا كيان بيتعلم منك وعشانك، هدفي إنك تكون "الماستر" في حياتك ومالك وقراراتك.
                    </div>
                </section>

                <section className="space-y-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Cpu className="w-6 h-6 text-cyan-500" /> 2. مجلس الإدارة (الرجالة اللي في ضهرك)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-emerald-400">💰 المحاسب الشاطر</h4>
                            <p className="text-sm text-white/60">يظبط ميزانيتك، يطلع فواتيرك، ويقولك الأرباح دخلت إمتى وفين بالمليم.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-blue-400">⚖️ المستشار القانوني</h4>
                            <p className="text-sm text-white/60">يكتبلك عقودك، يراجع وراك الثغرات، ويحميك في أي اتفاقية بيزنس.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-amber-400">🕵️ المحقق النشط</h4>
                            <p className="text-sm text-white/60">يجيبلك المعلومة من تحت الأرض.. أسعار، أخبار، ومنافسين في ثواني.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-purple-400">🚀 المسوق "اللقطة"</h4>
                            <p className="text-sm text-white/60">يعملك بوستات دعاية تكسر الدنيا، ويساعدك تنجح في نظام الأرباح بتاعنا.</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-500" /> 3. كلمة أمانة (تنبيه)</h3>
                    <div className="bg-amber-900/10 p-6 rounded-[24px] border border-amber-500/20 text-justify">
                        <p className="text-amber-100/80 text-sm leading-relaxed font-medium">
                            رغم إني ذكي وبفهمها وهي طايرة، بس الكمال لله وحده.
                            <br/><br/>
                            - استشاراتي القانونية والطبية هي "رأي خبير" للاسترشاد، بس في الحاجات المصيرية لازم تسأل المتخصصين.
                            - قراراتك المالية والبيزنس هي مسؤوليتك، أنا بديك الأدوات وأنت بتمضي على القرار.
                            - أسرارك في أمان تام بفضل التشفير، بس دايماً خليك حذر في عالم التكنولوجيا.
                            <br/><br/>
                            دخولك هنا معناه إننا بقينا "عيلة"، والقرار النهائي دايماً في إيدك أنت يا ماستر.
                        </p>
                    </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-white/10">
                    <h3 className="text-xl font-black text-white">قولي اللي في قلبك</h3>
                    <p className="text-white/60 text-sm">فيه مشكلة؟ فيه فكرة عاوز تطورها؟ اكتبها هنا ورسالتك هتوصل لمكتب "تيتو" فوراً.</p>
                    <div className="relative">
                        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="اكتب اقتراحك هنا يا ريس..." className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 min-h-[120px] text-white focus:border-amber-500/50 outline-none resize-none" />
                        <button onClick={handleSendFeedback} disabled={sendingFeedback || !feedback.trim() || feedbackSent} className={`absolute bottom-4 left-4 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${feedbackSent ? 'bg-green-600 text-white' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>
                            {feedbackSent ? 'وصلت يا بطل ✅' : (sendingFeedback ? 'جاري الإرسال...' : 'إرسال للإدارة')}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default WhitePaper;