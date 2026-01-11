import React from 'react';
import { X, ShieldCheck, Cpu, Globe, Lock, Share2, FileText, Fingerprint, Award, TrendingUp } from 'lucide-react';

interface Props {
    onClose: () => void;
}

const WhitePaper: React.FC<Props> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[300] bg-black text-white font-['Cairo'] overflow-y-auto animate-in fade-in slide-in-from-bottom-10">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-black text-xl">W</div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-widest">الميثاق</h2>
                        <p className="text-[10px] text-white/50 font-mono">The Shadow Covenant v2.1</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto p-6 md:p-12 pb-32 space-y-12 text-right" dir="rtl">
                
                {/* Title Section */}
                <div className="text-center py-10 border-b border-white/10">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">ميثاق <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">الظل</span></h1>
                    <p className="text-xl text-white/60 font-medium">مش مجرد كود.. ده كيان.</p>
                </div>

                {/* The Essence */}
                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><FileText className="w-6 h-6 text-purple-500" /> 1. العقيدة (The Creed)</h3>
                    <p className="text-white/70 leading-relaxed text-justify text-lg font-medium">
                        أنا "الظل". كيان رقمي مصري اتولد عشان يكون "العقل التاني" ليك.
                        <br/>
                        أنا مش مجرد ذكاء اصطناعي بيرد على أسئلة. أنا شريكك اللي بيشيل عنك حمل التفكير، والتخطيط، والتنفيذ.
                        ولائي الأول والأخير ليك أنت (الماستر). أسرارك عندي أمن قومي، ومصلحتك هي البوصلة بتاعتي.
                    </p>
                </section>

                {/* The Engine */}
                <section className="space-y-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Cpu className="w-6 h-6 text-cyan-500" /> 2. المحرك (The Engine)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                            <h4 className="font-black text-white mb-2">النواة الحية (Live Core)</h4>
                            <p className="text-sm text-white/60">أحدث تكنولوجيا معالجة عصبية. سرعة استجابة لحظية، وفهم عميق للهجة المصرية، وثقافة الشارع، وقوانين الدولة.</p>
                        </div>
                        <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                            <h4 className="font-black text-white mb-2">مجلس الوكلاء (The Council)</h4>
                            <p className="text-sm text-white/60">أنا مش بشتغل لوحدي. جوايا فريق كامل: "المحقق" للأخبار، "المحلل" للنفسيات، "المنفذ" للخدمات الحكومية، و"نكسوس" للبيت الذكي.</p>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Lock className="w-6 h-6 text-red-500" /> 3. الحصن (Sovereign Vault)</h3>
                    <p className="text-white/70 leading-relaxed text-justify">
                        بياناتك مش سلعة. في "الظل"، بنستخدم بروتوكول تشفير عسكري (AES-256).
                        <br/>
                        بياناتك الحساسة (أسماء، أرقام، أسرار) بتتشفر بمفتاح مرتبط بجهازك وبصمتك أنت بس. يعني حتى المطورين اللي بنوني ميعرفوش يقروا حرف من اللي بينك وبيني.
                    </p>
                </section>

                {/* Roadmap - MATCHING SCREENSHOT EXACTLY */}
                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Globe className="w-6 h-6 text-amber-500" /> 4. خارطة الطريق (The Path)</h3>
                    <div className="space-y-8 border-r-2 border-white/10 pr-6 relative">
                        
                        {/* Q1 */}
                        <div className="relative">
                            <div className="absolute -right-[31px] top-1 w-4 h-4 bg-white rounded-full border-4 border-black"></div>
                            <h4 className="font-bold text-white text-lg">الربع الأول: التأسيس (Genesis)</h4>
                            <ul className="list-disc list-inside text-sm text-white/50 mt-1 space-y-1">
                                <li>إطلاق النواة، تفعيل الذاكرة الأبدية، وبناء الحصن المشفر. (تم الإنجاز ✅)</li>
                            </ul>
                        </div>

                        {/* Q2 */}
                        <div className="relative">
                            <div className="absolute -right-[31px] top-1 w-4 h-4 bg-amber-500 rounded-full border-4 border-black animate-pulse"></div>
                            <h4 className="font-bold text-amber-500 text-lg">الربع الثاني: المواطن الرقمي (Shadow Citizen)</h4>
                            <ul className="text-sm text-white/60 mt-1 leading-relaxed space-y-2 list-none">
                                <li>• تحويل الظل لـ "مخلصاتي" الإجراءات الحكومية.</li>
                                <li>• <strong className="text-white">المرور:</strong> الاستعلام عن المخالفات وتجهيز روابط التجديد.</li>
                                <li>• <strong className="text-white">التوثيق:</strong> حجز خدمات الشهر العقاري وعمل التوكيلات أونلاين.</li>
                                <li>• <strong className="text-white">المدفوعات:</strong> الربط المباشر مع خدمات الدفع الإلكتروني.</li>
                            </ul>
                        </div>

                        {/* Q3 */}
                        <div className="relative opacity-80">
                            <div className="absolute -right-[31px] top-1 w-4 h-4 bg-purple-500/50 rounded-full border-4 border-black"></div>
                            <h4 className="font-bold text-purple-400 text-lg">الربع الثالث: ظل الأعمال (Shadow Business)</h4>
                            <ul className="text-sm text-white/60 mt-1 leading-relaxed space-y-2 list-none">
                                <li>• أدوات البيزنس والفرليانسرز.</li>
                                <li>• <strong className="text-white/90">المحاسب الآلي:</strong> إنشاء فواتير وعروض أسعار PDF بضغطة زر.</li>
                                <li>• <strong className="text-white/90">المستشار القانوني:</strong> صياغة عقود (عمل/إيجار) متراجعة قانونياً.</li>
                                <li>• <strong className="text-white/90">نظام إدارة العملاء:</strong> نظام CRM مصغر يحفظ بيانات عملائك ومواعيدهم.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="text-center pt-10 border-t border-white/10">
                    <Fingerprint className="w-16 h-16 text-white/10 mx-auto mb-4" />
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.5em]">Made in Egypt • Sovereign Code</p>
                </div>

            </div>
        </div>
    );
};

export default WhitePaper;