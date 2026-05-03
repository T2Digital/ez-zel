import React, { useEffect, useState, useRef } from 'react';
import { Brain, Target, Zap, Activity, Clock, Database, CheckCircle2, Globe, BookOpen, Lightbulb, Play, Pause, DollarSign, MessageSquare, LogOut, ChevronRight, Fingerprint, Crown, User, Briefcase, Cpu, Link as LinkIcon, Save, X, Trash2, Megaphone, ExternalLink, Info, Shield, Terminal, FolderOpen } from 'lucide-react';
import { shadowDB, DBTask, DBFact, UserProfile } from '../services/dbService';
import { playShadowVoice, stopVoice, getShadowVoice } from '../services/geminiService';
import SpaceCanvas from './SpaceCanvas';
import SovereignVault from './SovereignVault';
import ApiKeysVault from './dashboard/ApiKeysVault';
import SystemOverride from './dashboard/SystemOverride';
import WorkspaceExplorer from './WorkspaceExplorer';
import { MemoryVault } from './MemoryVault';
import { TasksModal } from './dashboard/TasksModal';
import { WorkspaceModal } from './dashboard/WorkspaceModal';

// --- ORBITAL UI COMPONENTS ---
const OrbitalStyles = () => (
    <style>
        {`
            @keyframes spin-slow {
              from { transform: translateZ(0) rotate(0deg); }
              to { transform: translateZ(0) rotate(360deg); }
            }
            @keyframes reverse-spin-slow {
              from { transform: translateZ(0) rotate(360deg); }
              to { transform: translateZ(0) rotate(0deg); }
            }
            @keyframes float-depth {
              0%, 100% { transform: translateY(0px) scale(1.0); }
              50% { transform: translateY(-15px) scale(1.1); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5)); }
            }
            @keyframes twinkle {
              0%, 100% { opacity: 0.1; transform: translateZ(-50px) scale(0.8); }
              50% { opacity: 1; transform: translateZ(0px) scale(1.2); box-shadow: 0 0 10px 2px rgba(255,255,255,0.4); }
            }
            @keyframes core-pulse {
              0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 80px rgba(168,85,247,0.3); }
              50% { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 0 120px rgba(168,85,247,0.6); }
            }
            
            .spinner {
              animation-name: spin-slow;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
              will-change: transform;
            }
            
            .anti-spinner {
              animation-name: reverse-spin-slow;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
              will-change: transform;
            }
            
            .floater {
              animation: float-depth 6s ease-in-out infinite alternate;
              transform-style: preserve-3d;
              will-change: transform;
            }

            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
        `}
    </style>
);

const OrbitalRing: React.FC<{ radius: number, speed: number, reverse?: boolean, children: React.ReactNode }> = ({ radius, speed, reverse = false, children }) => {
    const items = React.Children.toArray(children).filter(child => React.isValidElement(child));
    const activeSpinClass = reverse ? 'anti-spinner' : 'spinner';
    const activeCounterSpinClass = reverse ? 'spinner' : 'anti-spinner';

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: radius*2, height: radius*2, transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 rounded-full border border-white/30 border-dashed shadow-[0_0_15px_rgba(255,255,255,0.1)] opacity-70"></div>
            <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center">
                {items.map((child, i) => {
                    const angle = (360 / items.length) * i;
                    // Make each item have a slightly different speed so they eventually intersect
                    const itemSpeed = speed + (i * 8); 
                    return (
                        <div key={i} className={`absolute w-0 h-0 flex items-center justify-center ${activeSpinClass}`} style={{ animationDuration: `${itemSpeed}s` }}>
                            <div className="absolute pointer-events-auto" style={{ transform: `rotate(${angle}deg)` }}>
                                <div className="absolute" style={{ transform: `translateY(-${radius}px)` }}>
                                    <div className={`${activeCounterSpinClass} flex items-center justify-center`} style={{ animationDuration: `${itemSpeed}s` }}>
                                        <div className="floater" style={{ animationDelay: `-${i * 1.5}s`, transform: `rotate(-${angle}deg)` }}>
                                            {child}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface SatelliteProps {
    icon?: any;
    label: string;
    value?: string | number;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    onClick?: () => void;
    size?: string;
}

const SatelliteCard: React.FC<SatelliteProps> = ({ icon: Icon, label, value, colorClass, bgClass, borderClass, onClick, size = 'w-32 h-32 lg:w-40 lg:h-40' }) => (
    <div onClick={onClick} className={`group relative ${size} rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-125 shadow-lg ${bgClass} ${borderClass} border backdrop-blur-md`}>
        {Icon && <Icon className={`${value !== undefined ? 'w-10 h-10 lg:w-14 lg:h-14' : 'w-1/2 h-1/2'} ${colorClass} relative z-10`} style={{ animation: 'spin-slow 10s linear infinite' }} />}
        {value !== undefined && <div className={`mt-1 font-black text-xl lg:text-3xl leading-none ${colorClass}`}>{value}</div>}
        <div className="absolute -bottom-16 opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex flex-col items-center z-50">
             <span className={`text-sm lg:text-lg font-bold ${colorClass} bg-black/90 px-4 py-2 rounded-xl border ${borderClass} whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.8)] uppercase tracking-widest`}>
                 {label}
             </span>
        </div>
        <div className="absolute inset-0 rounded-full border border-white/5 opacity-50 group-hover:animate-ping"></div>
    </div>
);

// --- END ORBITAL COMPONENTS ---

interface Props {
  user: UserProfile;
  initialAction?: string | null;
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
  const [showApiVault, setShowApiVault] = useState(false);
  const [showSystemOverride, setShowSystemOverride] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [selectedTaskIdx, setSelectedTaskIdx] = useState<number | null>(null);

  const [editingTask, setEditingTask] = useState<DBTask | null>(null);

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
    loadData();
    // NOTE: Alarm Logic Moved to App.tsx to run globally.
  }, []);

  const loadData = async () => {
        // FETCH DATA FOR SPECIFIC USER ID
        const [allTasks, allMemory, rate] = await Promise.all([
            shadowDB.getTasks(user.phone), 
            shadowDB.getMemory(user.phone),
            shadowDB.getSyncStats()
        ]);
        setTasks(allTasks.reverse());
        setMemory(allMemory.reverse());
        setSyncRate(rate);
  };

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

  const isAdmin = user.email === 'admin@shadow.com' || user.email === 'TITO' || user.email === 'tito@shadow.com';

  return (
    <div className="fixed inset-0 w-full h-full bg-[#020202] text-white font-['Cairo'] overflow-hidden flex items-center justify-center">
        <SpaceCanvas interactive={true} />
        <OrbitalStyles />
        
        {/* Responsive scaling container to always fit strictly in the center without scrollbars */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] pointer-events-none flex items-center justify-center scale-[0.4] sm:scale-[0.55] md:scale-[0.75] lg:scale-[0.9] xl:scale-100" style={{ transformOrigin: 'center center' }}>
            
            {/* --- THE CORE (SUN) --- */}
            <div 
                onClick={onOpenChat}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-purple-600/40 to-black border border-purple-500/50 flex flex-col items-center justify-center cursor-pointer group pointer-events-auto z-50 hover:bg-purple-900/60 transition-all font-cairo"
                style={{ animation: 'core-pulse 4s ease-in-out infinite' }}
            >
                <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping opacity-20"></div>
                
                <Brain className="w-16 h-16 lg:w-24 lg:h-24 text-white fill-purple-300/30 relative z-10 mb-2 group-hover:scale-110 transition-transform duration-500" />
                <span className="text-white text-lg lg:text-3xl font-black tracking-widest uppercase relative z-10 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]">الظل الرقمي</span>
                <span className="text-xs lg:text-base text-purple-200 font-bold uppercase relative z-10 tracking-[0.3em] mt-1 shadow-black drop-shadow-md">
                    {user.phone === 'GUEST' ? 'تجربة محدودة' : 'الدخول للاجتماع'}
                </span>
            </div>

            {/* --- ORBIT 1: INNER (Speed: 30s) --- */}
            {user.phone !== 'GUEST' && (
                <OrbitalRing radius={220} speed={30}>
                    <SatelliteCard 
                        icon={Target} label="المهام الشغالة" value={tasks.filter(t => t.status === 'pending').length} 
                        colorClass="text-amber-500" bgClass="bg-amber-500/10" borderClass="border-amber-500/30" onClick={() => setShowTasksModal(true)} 
                    />
                    <SatelliteCard 
                        icon={Database} label="الذاكرة والأسرار" value={memory.length} 
                        colorClass="text-purple-500" bgClass="bg-purple-500/10" borderClass="border-purple-500/30" onClick={() => setShowMemoryModal(true)} 
                    />
                    <SatelliteCard 
                        icon={Activity} label="تزامن النظام" value={syncRate + '%'} 
                        colorClass="text-cyan-500" bgClass="bg-cyan-500/10" borderClass="border-cyan-500/30" 
                    />
                    <SatelliteCard 
                        icon={Shield} label="خزينة المفاتيح API" 
                        colorClass="text-emerald-500" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/30" onClick={() => setShowApiVault(true)} 
                    />
                </OrbitalRing>
            )}

            {/* --- ORBIT 2: MIDDLE (Speed: 45s) --- */}
            <OrbitalRing radius={360} speed={45} reverse={true}>
                <SatelliteCard 
                    icon={identity.icon} label={identity.label} 
                    colorClass={identity.color} bgClass={identity.bg} borderClass={identity.border} onClick={() => setShowVault(true)}
                />
                
                {user.phone === 'GUEST' ? (
                    <SatelliteCard 
                        icon={Megaphone} label="سوق للظل واربح" 
                        colorClass="text-emerald-400" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/30" onClick={onStartAffiliate}
                    />
                ) : (
                    <SatelliteCard 
                        icon={DollarSign} label="بيزنس العيلة (تسويق)" 
                        colorClass="text-emerald-400" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/30" onClick={onOpenAffiliate}
                    />
                )}

                {user.phone === 'GUEST' ? (
                    <SatelliteCard 
                        icon={Crown} label="انضم للنخبة (ترقية)" 
                        colorClass="text-white" bgClass="bg-white/10" borderClass="border-white/30" onClick={onUpgrade}
                    />
                ) : ((user.tier === 'sovereign' || user.phone === 'TITO') ? (
                    <SatelliteCard 
                        icon={Cpu} label="نكسوس (التحكم المنزلي IoT)" 
                        colorClass="text-cyan-400" bgClass="bg-cyan-500/10" borderClass="border-cyan-500/30" onClick={() => setShowNexusConfig(true)}
                    />
                ) : (
                   <SatelliteCard 
                        icon={Crown} label="انضم للنخبة (ترقية)" 
                        colorClass="text-white" bgClass="bg-white/10" borderClass="border-white/30" onClick={onUpgrade}
                    />
                ))}
            </OrbitalRing>

            {/* --- ORBIT 3: OUTER (Speed: 70s) --- */}
            <OrbitalRing radius={500} speed={70}>
                <SatelliteCard 
                    icon={voiceStatus === 'playing' ? Pause : Play} label="رسالة التوجيه (صوت الظل)" 
                    colorClass={voiceStatus === 'playing' ? 'text-amber-500' : 'text-white/40'} 
                    bgClass={voiceStatus === 'playing' ? 'bg-amber-500/20' : 'bg-white/5'} 
                    borderClass={voiceStatus === 'playing' ? 'border-amber-500/50' : 'border-white/10'} 
                    onClick={toggleVoice} 
                />
                
                {isAdmin && (
                    <SatelliteCard 
                        icon={Terminal} label="النظام الداخلي (Override)" 
                        colorClass="text-red-500" bgClass="bg-red-900/20" borderClass="border-red-500/30" onClick={() => setShowSystemOverride(true)} 
                    />
                )}
                
                {isAdmin && (
                    <SatelliteCard 
                        icon={FolderOpen} label="مساحة العمل (Workspace)" 
                        colorClass="text-purple-500" bgClass="bg-purple-900/20" borderClass="border-purple-500/30" onClick={() => setShowWorkspace(true)} 
                    />
                )}
                
                <SatelliteCard 
                    icon={LogOut} label="خروج مؤقت" 
                    colorClass="text-gray-400" bgClass="bg-white/5" borderClass="border-white/10" onClick={onLogout} 
                />
            </OrbitalRing>
        </div>

        {/* --- MODALS REUSED EXACTLY AS BEFORE --- */}
        {showVault && (
            <SovereignVault user={user} onVaultReady={() => setShowVault(false)} />
        )}

        {showApiVault && (
            <ApiKeysVault user={user} onClose={() => setShowApiVault(false)} onSave={(updatedUser) => {
                setShowApiVault(false);
            }} />
        )}

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

        {showSystemOverride && (
          <SystemOverride 
            user={user} 
            onClose={() => setShowSystemOverride(false)} 
            onSave={() => setShowSystemOverride(false)} 
          />
        )}

        {showTasksModal && (
            <TasksModal 
                tasks={tasks}
                onClose={() => setShowTasksModal(false)}
                onTasksChanged={loadData}
            />
        )}

        {showMemoryModal && (
            <MemoryVault onClose={() => setShowMemoryModal(false)} />
        )}

        {showWorkspace && (
            <WorkspaceModal user={user} onClose={() => setShowWorkspace(false)} />
        )}

    </div>
  );
};

export default Dashboard;
