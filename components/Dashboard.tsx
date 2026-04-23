import React, { useEffect, useState, useRef } from 'react';
import { Brain, Target, Zap, Activity, Clock, Database, CheckCircle2, Globe, BookOpen, Lightbulb, Play, Pause, DollarSign, MessageSquare, LogOut, ChevronRight, Fingerprint, Crown, User, Briefcase, Cpu, Link as LinkIcon, Save, X, Trash2, Megaphone, ExternalLink, Info, Shield } from 'lucide-react';
import { shadowDB, DBTask, DBFact, UserProfile } from '../services/dbService';
import { playShadowVoice, stopVoice, getShadowVoice } from '../services/geminiService';
import SovereignVault from './SovereignVault';

interface Props {
  user: UserProfile;
  initialAction?: string | null; // New Prop for Deep Linking
  onClearAction?: () => void;
  onOpenChat: () => void;
  onOpenAffiliate: () => void;
  onLogout: () => void;
  onUpgrade?: () => void; 
  onStartAffiliate?: () => void; 
}

const Dashboard: React.FC<Props> = ({ user, initialAction, onClearAction, onOpenChat, onOpenAffiliate, onLogout, onUpgrade, onStartAffiliate }) => {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [memory, setMemory] = useState<DBFact[]>([]);
  const [syncRate, setSyncRate] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'playing'>('idle');
  
  // Nexus / IoT Modal State
  const [showNexusConfig, setShowNexusConfig] = useState(false);
  const [iotActions, setIotActions] = useState<{ [key: string]: string }>(user.iotActions || {});
  const [newActionKey, setNewActionKey] = useState('');
  const [newActionUrl, setNewActionUrl] = useState('');

  // Vault State
  const [showVault, setShowVault] = useState(false);
  
  // --- IDENTITY RESOLVER ---
  const getIdentity = () => {
      if (user.phone === 'GUEST') {
          return { label: 'زائر مؤقت', sub: 'Guest Access', color: 'text-white/60', bg: 'bg-white/10', border: 'border-white/10', icon: User };
      }
      if (user.affiliate?.isMarketer && user.tier === 'lite') {
          return { label: 'شريك نجاح', sub: 'Affiliate Partner', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Briefcase };
      }
      if (user.email === 'admin@shadow.com') {
          return { label: 'الماستر', sub: 'System Admin', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Crown };
      }
      return { label: 'عضو نخبة', sub: 'Sovereign Tier', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Fingerprint };
  };

  const identity = getIdentity();

  // Handle Deep Links
  useEffect(() => {
      if (initialAction) {
          if (initialAction === 'open_vault') {
              setShowVault(true);
          } else if (initialAction === 'open_nexus') {
              setShowNexusConfig(true);
          }
          if (onClearAction) onClearAction();
      }
  }, [initialAction]);

  useEffect(() => {
    const fetchData = async () => {
        // FETCH DATA FOR SPECIFIC USER ID
        const [allTasks, allMemory, rate] = await Promise.all([
            shadowDB.getTasks(user.phone), 
            shadowDB.getMemory(user.phone),
            shadowDB.getSyncStats()
        ]);
        setTasks(allTasks.slice(-5).reverse());
        setMemory(allMemory.slice(-4).reverse());
        setSyncRate(rate);
    };
    fetchData();

    // NOTE: Alarm Logic Moved to App.tsx to run globally.
  }, []);

  const handleVoiceGreeting = async () => {
      setVoiceStatus('playing');
      const name = user.name.split(' ')[0];
      const gender = user.voicePreference || 'male'; 
      
      const greeting = `يا ريس، أنا مش مجرد تطبيق.. أنا ظلك.
      عقلك التاني اللي مبيناش.
      شيل من دماغك، وارميه عليا.
      أنا هنا عشان أحفظ أسرارك، وأدير حياتك، وأخليك دايماً سابق بخطوة.
      صباحك زي الفل يا ${name}.. أنا جاهز.`;
      
      await playShadowVoice(greeting, gender, undefined, () => setVoiceStatus('idle'));
  };

  const toggleVoice = () => {
      if (voiceStatus === 'playing') { stopVoice(); setVoiceStatus('idle'); } else { handleVoiceGreeting(); }
  };

  // --- NEXUS CONFIG LOGIC ---
  const saveAction = async () => {
      if (!newActionKey || !newActionUrl) return;
      // Normalize key to be AI friendly (replace spaces with underscores)
      const cleanKey = newActionKey.trim().replace(/\s+/g, '_').toLowerCase();
      const updatedActions = { ...iotActions, [cleanKey]: newActionUrl };
      setIotActions(updatedActions);
      const updatedUser = { ...user, iotActions: updatedActions };
      await shadowDB.saveProfile(updatedUser);
      setNewActionKey('');
      setNewActionUrl('');
  };

  const deleteAction = async (key: string) => {
      const updatedActions = { ...iotActions };
      delete updatedActions[key];
      setIotActions(updatedActions);
      const updatedUser = { ...user, iotActions: updatedActions };
      await shadowDB.saveProfile(updatedUser);
  };

  return (
    <div className="h-full w-full bg-[#020202] text-white font-['Cairo'] overflow-y-auto pb-28">
        
        {/* Top Header */}
        <div className="p-6 md:p-8 flex justify-between items-center bg-gradient-to-b from-[#0a0a0a] to-[#020202] border-b border-white/5 sticky top-0 z-50">
            {/* Identity Icon - Now Clickable to Open Vault */}
            <div 
                onClick={() => setShowVault(true)}
                className="flex items-center gap-4 cursor-pointer group"
                title="فتح الحصن (Sovereign Vault)"
            >
                <div className={`w-12 h-12 rounded-2xl ${identity.bg} ${identity.border} border flex items-center justify-center relative overflow-hidden shadow-lg group-hover:scale-105 transition-transform`}>
                    <div className={`absolute inset-0 ${identity.color} opacity-10 animate-pulse`}></div>
                    <identity.icon className={`w-6 h-6 ${identity.color} relative z-10`} />
                    {/* Security Badge */}
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black"></div>
                </div>
                <div>
                    <h2 className="text-lg font-black leading-none text-white group-hover:text-purple-400 transition-colors">{identity.label}</h2>
                    <p className={`text-[10px] ${identity.color} font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-1`}>
                        <Shield className="w-3 h-3" /> {identity.sub}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button onClick={toggleVoice} className={`p-3 rounded-full border transition-all ${voiceStatus === 'playing' ? 'bg-amber-500 text-black border-amber-500 animate-pulse' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`} title="تعريف الظل">
                    {voiceStatus === 'playing' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button onClick={onLogout} className="p-3 bg-white/5 border border-white/10 rounded-full text-white/30 hover:text-red-400 transition-all">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="p-4 md:p-8 space-y-6">
            
            {/* HERO SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Chat Entry */}
                <div onClick={onOpenChat} className="group relative p-8 rounded-[40px] bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all shadow-xl">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform">
                            <Brain className="w-7 h-7 text-white fill-white/20" />
                        </div>
                        <h2 className="text-3xl font-black mb-1">الظل الرقمي</h2>
                        <h3 className="text-xl font-bold text-purple-400 mb-2">عقلك التاني</h3>
                        <p className="text-purple-200/50 text-sm font-medium mb-6">
                            {user.phone === 'GUEST' ? 'تجربة محدودة لقدرات الظل (3 أيام).' : 'مجلس إدارتك (المحقق، المحلل، والمنفذ) جاهزين.'}
                        </p>
                        <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                            <span>{user.phone === 'GUEST' ? 'جرب الآن' : 'ادخل الاجتماع'}</span> <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* 2. Affiliate / Marketing */}
                <div onClick={user.phone === 'GUEST' ? onStartAffiliate : onOpenAffiliate} className="group relative p-8 rounded-[40px] bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/30 overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all shadow-xl">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 blur-[60px] rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,247,0.4)] group-hover:scale-110 transition-transform">
                            {user.phone === 'GUEST' ? <Megaphone className="w-7 h-7 text-white" /> : <DollarSign className="w-8 h-8 text-white" />}
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-white">{user.phone === 'GUEST' ? 'سوق للظل' : 'بيزنس العيلة'}</h2>
                        <p className="text-emerald-200/50 text-sm font-medium mb-6">
                            {user.affiliate?.isMarketer ? 'تابع أرباحك، وعدد الناس اللي دخلوا عن طريقك.' : 'اربح 100 جنيه على كل مشترك جديد تجيبه. سجل كمسوق الآن.'}
                        </p>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                            <span>{user.affiliate?.isMarketer ? 'لوحة الأرباح' : 'اشترك كمسوق'}</span> <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* 3. Join Elite / Nexus (Smart Home) */}
                {user.phone === 'GUEST' ? (
                    <div onClick={onUpgrade} className="group relative p-8 rounded-[40px] bg-gradient-to-br from-white/10 to-black border border-white/10 overflow-hidden cursor-pointer hover:bg-white/5 transition-all">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                                    <Crown className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-3xl font-black mb-2 text-white">انضم للنخبة</h2>
                                <p className="text-white/50 text-sm font-medium mb-4">فتح جميع القدرات بلا حدود.</p>
                            </div>
                            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                <span>سجل عضوية</span> <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                ) : (
                    (user.tier === 'sovereign' || user.phone === 'TITO') && (
                        <div onClick={() => setShowNexusConfig(true)} className="group relative p-8 rounded-[40px] bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all shadow-xl">
                             <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/20 blur-[60px] rounded-full group-hover:bg-cyan-500/30 transition-all"></div>
                             <div className="relative z-10 flex flex-col h-full justify-between">
                                 <div>
                                    <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform">
                                        <Cpu className="w-7 h-7 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-black mb-2 text-white">التحكم المنزلي</h2>
                                    <p className="text-cyan-200/50 text-sm font-medium">نظام "Nexus". اربط إضاءة بيتك وأجهزتك وتحكم فيها بصوتك من هنا.</p>
                                 </div>
                                 <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest mt-6 group-hover:gap-4 transition-all">
                                    <span>إعداد الأجهزة</span> <ChevronRight className="w-4 h-4" />
                                </div>
                             </div>
                        </div>
                    )
                )}
            </div>

            {/* Stats Widget */}
            {user.phone !== 'GUEST' && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-[#111] rounded-[24px] border border-white/5 text-center">
                        <Target className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                        <span className="block text-2xl font-black text-white">{tasks.filter(t => t.status === 'pending').length}</span>
                        <span className="text-[9px] text-white/40 uppercase font-bold">مهام شغالة</span>
                    </div>
                    <div className="p-4 bg-[#111] rounded-[24px] border border-white/5 text-center">
                        <Database className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <span className="block text-2xl font-black text-white">{memory.length}</span>
                        <span className="text-[9px] text-white/40 uppercase font-bold">أسرار محفوظة</span>
                    </div>
                    <div className="p-4 bg-[#111] rounded-[24px] border border-white/5 text-center">
                        <Activity className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
                        <span className="block text-2xl font-black text-white">{syncRate}%</span>
                        <span className="text-[9px] text-white/40 uppercase font-bold">قوة السيستم</span>
                    </div>
                </div>
            )}

            {/* Active Task Snippet */}
            {user.phone !== 'GUEST' && (
                <div className="p-6 bg-[#0a0a0a] rounded-[32px] border border-white/5 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-5 h-5 text-white/30" />
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest">إيه ورانا؟</h3>
                    </div>
                    <div className="space-y-3">
                        {tasks.filter(t => t.status === 'pending').length > 0 ? tasks.filter(t => t.status === 'pending').slice(0,3).map((t, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                <span className="text-sm text-white/80 font-bold truncate flex-1">{t.task}</span>
                                <span className="text-[10px] text-white/30 font-mono">{t.time}</span>
                            </div>
                        )) : <p className="text-center text-white/20 text-xs">الجدول رايق.. استمتع.</p>}
                    </div>
                </div>
            )}
            
        </div>

        {/* --- SOVEREIGN VAULT MODAL --- */}
        {showVault && (
            <SovereignVault user={user} onVaultReady={() => setShowVault(false)} />
        )}

        {/* --- NEXUS CONFIG MODAL --- */}
        {showNexusConfig && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in">
                <div className="w-full max-w-2xl bg-[#080808] border border-cyan-500/20 rounded-[40px] p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-y-auto max-h-[90vh] scrollbar-hide">
                    <button onClick={() => setShowNexusConfig(false)} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-white/50" /></button>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-cyan-900/20 rounded-xl border border-cyan-500/30">
                            <Cpu className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">إعدادات التحكم المنزلي</h2>
                            <p className="text-cyan-200/50 text-xs font-bold uppercase tracking-widest">Smart Home / IoT Nexus</p>
                        </div>
                    </div>

                    <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 mb-6">
                        <h4 className="flex items-center gap-2 text-sm font-black text-white mb-2">
                             <Info className="w-4 h-4 text-cyan-400" />
                             طريقة الربط (eWeLink / Tuya):
                        </h4>
                        <ol className="text-xs text-white/70 space-y-3 list-decimal list-inside leading-relaxed p-2">
                            <li>ادخل موقع <b>IFTTT.com</b> واعمل Create New Applet.</li>
                            <li>في خانة (If This) اختار <b>Webhooks</b>، وسمي الحدث (مثلاً: <span className="text-amber-400 font-mono">room_light</span>).</li>
                            <li>في خانة (Then That) اختار <b>eWeLink</b> أو <b>Smart Life</b> وحدد الجهاز (مثلاً: اللمبة تشتغل).</li>
                            <li>انسخ رابط الويب هوك (Webhook URL) من إعدادات IFTTT.</li>
                            <li>ضيف الرابط ده هنا تحت، بنفس الاسم اللي اخترته (room_light).</li>
                            <li>قول للظل: "ولع نور الغرفة"، وهو هينفذ فوراً.</li>
                        </ol>
                        <p className="text-[10px] text-white/40 mt-3 font-medium">ملاحظة: هذه هي الطريقة المعيارية لربط الأجهزة الذكية عبر الإنترنت بدون Hardware Hub خاص.</p>
                        <a href="https://ifttt.com/maker_webhooks" target="_blank" className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-cyan-900/30 rounded-lg text-xs font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-500/20">
                            فتح موقع IFTTT للإعداد <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="space-y-4 mb-6">
                        {Object.entries(iotActions).map(([key, url]) => (
                            <div key={key} className="flex items-center gap-3 p-3 bg-[#111] rounded-2xl border border-white/5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        <span className="text-sm font-bold text-white">{key}</span>
                                    </div>
                                    <span className="text-[10px] text-white/30 font-mono truncate block max-w-[200px] md:max-w-md">{url}</span>
                                </div>
                                <button onClick={() => deleteAction(key)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#151515] p-4 rounded-[24px] border border-white/10">
                        <h4 className="text-xs font-black text-white/50 mb-3 uppercase">إضافة جهاز جديد</h4>
                        <div className="flex flex-col gap-3">
                            <input 
                                type="text" 
                                placeholder="اسم الأمر (مثلاً: living_room)" 
                                value={newActionKey} 
                                onChange={(e) => setNewActionKey(e.target.value)} 
                                className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none" 
                            />
                            <input 
                                type="text" 
                                placeholder="رابط الويب هوك (Webhook URL)" 
                                value={newActionUrl} 
                                onChange={(e) => setNewActionUrl(e.target.value)} 
                                className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none font-mono" 
                            />
                            <button onClick={saveAction} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20">
                                <Save className="w-4 h-4" /> حفظ الجهاز
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        )}
    </div>
  );
};

export default Dashboard;