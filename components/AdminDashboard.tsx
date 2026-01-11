import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Activity, Search, CheckCircle, XCircle, Image as ImageIcon, ShieldCheck, Zap, X, Bot, Infinity, LogOut, DollarSign, Server, Eye, Database, Globe, Cpu, FolderOpen, Radio, MessageSquare, Mic, Save, Lock, LayoutGrid, Smartphone, Wallet, TrendingUp, Briefcase, Ban, Megaphone, Send, Heart, Feather } from 'lucide-react';
import { shadowDB, UserProfile, DBFeedback } from '../services/dbService';
import ChatInterface from './ChatInterface';

interface Props {
    onLogout: () => void;
    onSwitchToUserMode: () => void; 
}

// Agent Definition
interface AgentInfo {
    id: string;
    name: string;
    role: string;
    status: string;
    description: string;
    color: string;
    icon: any;
}

const AdminDashboard: React.FC<Props> = ({ onLogout, onSwitchToUserMode }) => {
  const [activeView, setActiveView] = useState<'members' | 'marketers' | 'feedback' | 'requests' | 'chat' | 'core' | 'broadcast'>('requests');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [feedbacks, setFeedbacks] = useState<DBFeedback[]>([]);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payout Modal State
  const [payoutModal, setPayoutModal] = useState<{ isOpen: boolean, user?: UserProfile } >({ isOpen: false });
  const [payoutForm, setPayoutForm] = useState({ amount: '', name: '', date: '' });
  
  // Core Config State
  const [globalRules, setGlobalRules] = useState('');
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isListeningRules, setIsListeningRules] = useState(false);

  // Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isListeningBroadcast, setIsListeningBroadcast] = useState(false);
  
  // Agent Details Modal
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  // TITO Profile State (Real DB Profile)
  const [adminProfile, setAdminProfile] = useState<UserProfile>({ 
      phone: 'TITO', 
      name: 'تيتو (المالك)', 
      shadowName: 'الماستر', 
      tier: 'sovereign', 
      status: 'active', 
      joinedAt: Date.now(),
      affiliate: {
          isMarketer: true,
          referralCode: 'TITO_BOSS', // Default Fallback
          totalEarnings: 0,
          referralsCount: 0,
          payoutHistory: []
      }
  });

  useEffect(() => { 
      const initData = async () => {
          const titoProfile = await shadowDB.getProfile('TITO');
          if (titoProfile) {
              const mergedProfile = { ...adminProfile, ...titoProfile, affiliate: titoProfile.affiliate || adminProfile.affiliate };
              setAdminProfile(mergedProfile);
              if (!titoProfile.affiliate) await shadowDB.saveProfile(mergedProfile);
          } else {
              await shadowDB.saveProfile(adminProfile);
          }
          
          loadData();
          
          shadowDB.subscribeToRealtime('TITO', (table, payload) => {
              console.log("Admin Dashboard Realtime Update:", table);
              loadData();
          });
      };
      initData();
  }, []); // Run once on mount

  // Force reload when view changes to ensure fresh data
  useEffect(() => {
      loadData();
  }, [activeView]);

  const loadData = async () => {
    const [allProfiles, allFeedback, rules] = await Promise.all([
        shadowDB.getAllProfiles(),
        shadowDB.getAllFeedback(),
        shadowDB.getGlobalRules()
    ]);
    setProfiles(allProfiles);
    setFeedbacks(allFeedback.reverse());
    setGlobalRules(rules);
  };

  const handleStatusUpdate = async (phone: string, status: 'active' | 'blocked' | 'pending') => {
    const profile = await shadowDB.getProfile(phone);
    if (profile) {
        if (status === 'active' && profile.status !== 'active' && profile.referredBy && !profile.commissionPaid) {
            const amount = profile.subscriptionCycle === 'yearly' ? 1000 : 100;
            await shadowDB.registerReferral(profile.referredBy, amount);
            profile.commissionPaid = true; 
        }
        await shadowDB.saveProfile({ ...profile, status });
        // Force refresh
        await loadData();
    }
  };
  
  const openPayoutModal = (user: UserProfile) => {
      setPayoutModal({ isOpen: true, user });
      setPayoutForm({ 
          amount: user.affiliate?.totalEarnings.toString() || '0', 
          name: user.affiliate?.payoutDetails?.name || '',
          date: new Date().toISOString().slice(0, 16)
      });
  };

  const confirmPayout = async () => {
      if (!payoutModal.user || !payoutForm.amount || !payoutForm.name) return;
      
      const amount = parseFloat(payoutForm.amount);
      if (amount <= 0) return;

      await shadowDB.recordPayout(payoutModal.user.phone, amount);
      setPayoutModal({ isOpen: false });
      loadData();
  };

  const saveGlobalRules = async () => { setIsSavingRules(true); await shadowDB.updateGlobalRules(globalRules); setTimeout(() => setIsSavingRules(false), 1000); };
  
  const handleMicInput = () => { setIsListeningRules(true); const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (SpeechRecognition) { const rec = new SpeechRecognition(); rec.lang = 'ar-EG'; rec.onresult = (e: any) => { const transcript = e.results[0][0].transcript; setGlobalRules(prev => prev + '\n- ' + transcript); }; rec.onend = () => setIsListeningRules(false); rec.start(); } else { setIsListeningRules(false); alert("Browser doesn't support speech recognition."); } };
  
  const handleBroadcastMic = () => { 
      setIsListeningBroadcast(true); 
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; 
      if (SpeechRecognition) { 
          const rec = new SpeechRecognition(); 
          rec.lang = 'ar-EG'; 
          rec.onresult = (e: any) => { 
              const transcript = e.results[0][0].transcript; 
              setBroadcastMessage(prev => (prev ? prev + ' ' : '') + transcript); 
          }; 
          rec.onend = () => setIsListeningBroadcast(false); 
          rec.start(); 
      } else { 
          setIsListeningBroadcast(false); 
          alert("Browser doesn't support speech recognition."); 
      } 
  };

  const handleSendBroadcast = async () => { 
      if (!broadcastMessage.trim()) return; 
      setIsBroadcasting(true); 
      try { 
          await shadowDB.setGlobalPulse(broadcastMessage);
          setBroadcastMessage(''); 
          alert("تم إطلاق نبض الظل. سيصل لجميع المستخدمين."); 
      } catch (e) { 
          console.error(e); 
          alert("حدث خطأ أثناء الإرسال."); 
      } finally { 
          setIsBroadcasting(false); 
      } 
  };

  // --- AGENTS DATA ---
  const councilAgents: AgentInfo[] = [
      { id: 'detective', name: 'Detective', role: 'المحقق', status: 'ONLINE', description: 'الأخطبوط المعلوماتي. يجلب الأخبار الحية، ويبحث بدقة في السوشيال ميديا (Google Dorks).', color: 'emerald', icon: <Globe className="w-5 h-5" /> },
      { id: 'accountant', name: 'Accountant', role: 'المحاسب', status: 'ACTIVE', description: 'المسؤول المالي. إدارة الاشتراكات، الإيرادات، المسوقين، وتقارير النظام.', color: 'emerald', icon: <DollarSign className="w-5 h-5" /> },
      { id: 'executor', name: 'Executor', role: 'المنفذ', status: 'ACTIVE', description: 'إجراء الاتصالات، إرسال الرسائل، جدولة المواعيد والتذكيرات.', color: 'amber', icon: <Zap className="w-5 h-5" /> },
      { id: 'nexus', name: 'Nexus', role: 'نكسوس', status: 'READY', description: 'التحكم في المنزل الذكي (IoT)، وربط التطبيقات ببعضها.', color: 'cyan', icon: <Cpu className="w-5 h-5" /> },
      { id: 'analyst', name: 'Analyst', role: 'المحلل', status: 'ONLINE', description: 'التحليل النفسي، تحليل الصور، وتقديم المشورة الاستراتيجية.', color: 'purple', icon: <Eye className="w-5 h-5" /> },
      { id: 'archivist', name: 'Archivist', role: 'الأرشيف', status: 'STANDBY', description: 'إدارة الملفات، المشاريع، وتنظيم مساحة العمل (Workspace).', color: 'blue', icon: <FolderOpen className="w-5 h-5" /> },
      { id: 'healer', name: 'The Healer', role: 'المعالج', status: 'SPIRITUAL', description: 'الجانب الروحاني. يقدم النصائح من الطب النبوي، الأعشاب، والرقية الشرعية.', color: 'emerald', icon: <Feather className="w-5 h-5" /> },
  ];

  const filteredProfiles = profiles.filter(p => p.name.includes(searchQuery) || p.phone.includes(searchQuery));
  const pendingRequests = profiles.filter(p => p.status === 'pending' && p.paymentProof);
  const activeMembers = filteredProfiles.filter(p => p.status !== 'pending' && p.tier === 'sovereign' && p.phone !== 'TITO');
  const marketersList = filteredProfiles.filter(p => p.affiliate?.isMarketer);
  const totalRevenue = activeMembers.reduce((sum, p) => sum + (p.subscriptionCycle === 'yearly' ? 10000 : 1000), 0);

  if (activeView === 'chat') {
      return (
          <div className="h-screen w-full flex flex-col relative bg-black">
              <ChatInterface 
                currentUser={adminProfile} 
                onUpgrade={() => {}} 
                onBack={() => setActiveView('requests')}
                isAdmin={true} 
              />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col font-['Cairo'] relative pb-48 overflow-x-hidden">
      
      {/* Header */}
      <div className="p-6 md:p-8 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-black italic shadow-[0_0_20px_rgba(245,158,11,0.3)] text-black text-xl">T</div>
            <div>
                <h2 className="text-xl font-black tracking-tighter leading-none text-white">TITO <span className="text-amber-500">HQ</span></h2>
                <div className="flex items-center gap-1 mt-1">
                    <Infinity className="w-3 h-3 text-amber-500" />
                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-[0.2em]">Master Control</p>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
              <button onClick={onSwitchToUserMode} className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-white flex items-center gap-2 transition-all group" title="فتح واجهة المستخدم">
                  <Smartphone className="w-4 h-4 text-emerald-400 group-hover:animate-pulse" />
                  <span className="text-xs font-bold hidden md:inline">وضع المستخدم</span>
              </button>
              <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-full text-red-500/50 hover:text-red-500 transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 space-y-8">
        
        {/* Council Agents */}
        {activeView !== 'core' && activeView !== 'broadcast' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {councilAgents.map(agent => (
                    <div key={agent.id} onClick={() => setSelectedAgent(agent)} className={`p-4 rounded-2xl border border-white/5 bg-[#080808] flex flex-col items-center justify-center text-center gap-3 group hover:bg-${agent.color}-500/5 hover:border-${agent.color}-500/30 transition-all cursor-pointer`}>
                        <div className={`p-3 rounded-full bg-white/5 group-hover:bg-${agent.color}-500/10 group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] text-${agent.color}-400`}>{agent.icon}</div>
                        <div><span className="text-[9px] text-white/40 uppercase font-black tracking-widest block mb-1">{agent.name}</span><span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded bg-white/5 border border-white/5 group-hover:border-${agent.color}-500/20 transition-colors`}>{agent.status}</span></div>
                    </div>
                ))}
            </div>
        )}

        {/* Global Stats */}
        {activeView !== 'core' && activeView !== 'broadcast' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#080808] p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                <div className="text-center md:border-l border-white/5 relative z-10 group cursor-default">
                    <h4 className="text-3xl font-black text-emerald-400 tracking-tighter drop-shadow-lg group-hover:scale-110 transition-transform">{totalRevenue.toLocaleString()}</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase mt-1">إجمالي الإيرادات (EGP)</p>
                </div>
                <div onClick={() => setActiveView('members')} className={`text-center md:border-l border-white/5 relative z-10 cursor-pointer transition-all hover:bg-white/5 rounded-xl p-2 ${activeView === 'members' ? 'bg-white/5 ring-1 ring-white/10' : ''}`}>
                    <h4 className="text-3xl font-black text-white drop-shadow-lg">{activeMembers.length}</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase mt-1">مشترك نشط</p>
                </div>
                <div onClick={() => setActiveView('requests')} className={`text-center md:border-l border-white/5 relative z-10 cursor-pointer transition-all hover:bg-white/5 rounded-xl p-2 ${activeView === 'requests' ? 'bg-white/5 ring-1 ring-white/10' : ''}`}>
                    <h4 className="text-3xl font-black text-amber-500 drop-shadow-lg">{pendingRequests.length}</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase mt-1">طلبات معلقة</p>
                </div>
                <div onClick={() => setActiveView('marketers')} className={`text-center relative z-10 cursor-pointer transition-all hover:bg-white/5 rounded-xl p-2 ${activeView === 'marketers' ? 'bg-white/5 ring-1 ring-white/10' : ''}`}>
                    <h4 className="text-3xl font-black text-purple-400 drop-shadow-lg">{marketersList.length}</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase mt-1">عدد المسوقين</p>
                </div>
            </div>
        )}
        
        {/* Search Bar */}
        {(activeView === 'members' || activeView === 'requests' || activeView === 'marketers') && (
            <div className="relative group"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-amber-500 transition-colors" /><input type="text" placeholder="بحث بالاسم أو الرقم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#080808] border border-white/10 rounded-2xl py-3 pr-12 pl-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all text-white" /></div>
        )}

        {/* Views */}
        {activeView === 'core' && (
            <div className="animate-in fade-in zoom-in duration-500 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="p-3 bg-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse"><Cpu className="w-6 h-6 text-white" /></div><div><h2 className="text-2xl font-black text-white">النواة الحية (Live Core)</h2><p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em]">Top Secret • Global Overrides</p></div></div></div>
                <div className="flex-1 bg-black border border-white/10 rounded-[32px] p-6 relative overflow-hidden flex flex-col shadow-2xl"><div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-600 via-transparent to-transparent"></div><textarea value={globalRules} onChange={(e) => setGlobalRules(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-emerald-500 font-mono text-sm leading-relaxed resize-none placeholder:text-emerald-900/50" placeholder="// اكتب القوانين السيادية هنا..." /><div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5"><div className="flex items-center gap-2"><button onClick={handleMicInput} className={`p-4 rounded-full transition-all ${isListeningRules ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-white/40 hover:text-white'}`}><Mic className="w-6 h-6" /></button></div><button onClick={saveGlobalRules} disabled={isSavingRules} className="px-8 py-3 bg-white text-black rounded-xl font-black flex items-center gap-2 hover:bg-white/90 transition-all">{isSavingRules ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isSavingRules ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button></div></div>
            </div>
        )}

        {activeView === 'broadcast' && (
             <div className="animate-in fade-in zoom-in duration-500 h-full flex flex-col">
                 <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3"><div className="p-3 bg-amber-500 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse"><Megaphone className="w-6 h-6 text-black" /></div><div><h2 className="text-2xl font-black text-white">نبض الظل (Shadow Pulse)</h2><p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em]">Global System Broadcast</p></div></div>
                     <div className="bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full"><span className="text-[10px] text-red-400 font-black animate-pulse">● LIVE TO ALL USERS</span></div>
                 </div>
                 <div className="flex-1 bg-[#111] border border-amber-500/20 rounded-[32px] p-8 relative overflow-hidden flex flex-col shadow-2xl">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                     <div className="mb-4"><label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">محتوى النبضة (تظهر كتنبيه سيستم للجميع)</label><textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="w-full h-40 bg-black border border-white/10 rounded-2xl p-4 text-white text-lg leading-relaxed resize-none focus:border-amber-500/50 outline-none transition-all placeholder:text-white/20" placeholder="اكتب رسالتك هنا.. (تهنئة، تحديث هام، تحذير، أو نصيحة عامة)..." /></div>
                     <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6"><div className="flex items-center gap-3"><button onClick={handleBroadcastMic} className={`p-4 rounded-full transition-all border ${isListeningBroadcast ? 'bg-amber-500 text-black border-amber-600 animate-pulse' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}><Mic className="w-6 h-6" /></button><span className="text-[10px] text-white/30 max-w-[150px] hidden md:block">* سيتم إرسال هذا النبض لجميع المشتركين والمسوقين وتيتو فوراً.</span></div><button onClick={handleSendBroadcast} disabled={isBroadcasting || !broadcastMessage.trim()} className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_30px_rgba(245,158,11,0.3)]">{isBroadcasting ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}{isBroadcasting ? 'جاري البث...' : 'إرسال النبض للجميع'}</button></div>
                 </div>
             </div>
        )}

        {activeView === 'requests' && pendingRequests.map(u => (
            <div key={u.phone} className="glass p-6 rounded-[32px] border border-amber-500/30 bg-amber-500/5 flex flex-col gap-4 relative overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex justify-between items-start"><div className="flex items-center gap-3"><div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><CreditCard className="w-5 h-5" /></div><div><h3 className="text-lg font-black text-white flex items-center gap-2">{u.name} {u.affiliate?.isMarketer && <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">مسوق حالي</span>}</h3><p className="text-xs text-white/40 font-mono">{u.phone}</p><span className="block text-[10px] text-amber-300 font-bold mt-1">اشتراك: {u.subscriptionCycle === 'yearly' ? 'سنوي (10,000ج)' : 'شهري (1,000ج)'}</span></div></div></div>
                {u.paymentProof && <button onClick={() => setSelectedProof(u.paymentProof!)} className="w-full py-3 bg-black/40 rounded-xl border border-white/5 text-xs font-bold text-white/60 hover:text-white flex items-center justify-center gap-2"><ImageIcon className="w-4 h-4" /> معاينة إيصال الدفع</button>}
                <div className="flex gap-2"><button onClick={() => handleStatusUpdate(u.phone, 'active')} className="flex-1 py-3 bg-emerald-600 rounded-xl text-white font-bold text-xs shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-transform">تفعيل الاشتراك</button><button onClick={() => handleStatusUpdate(u.phone, 'blocked')} className="p-3 bg-white/5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all"><X className="w-5 h-5" /></button></div>
            </div>
        ))}
        {activeView === 'requests' && pendingRequests.length === 0 && (
             <div className="text-center py-20 opacity-30">
                 <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                 <p>لا توجد طلبات معلقة.</p>
             </div>
        )}

        {activeView === 'feedback' && (
            <div className="space-y-3">
                <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">أراء العملاء والرسائل الخاصة</h3>
                {feedbacks.length > 0 ? feedbacks.map((fb, idx) => (
                    <div key={idx} className="bg-[#080808] p-5 rounded-[24px] border border-white/5 flex flex-col gap-2 relative group hover:bg-white/5 transition-all">
                        <div className="flex justify-between items-start">
                            <div><h4 className="font-bold text-white text-sm">{fb.userName} <span className="text-xs text-white/30 font-mono">({fb.userId})</span></h4><span className="text-[10px] text-white/20">{new Date(fb.timestamp).toLocaleString('ar-EG')}</span></div>
                            {!fb.isRead && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>}
                        </div>
                        <div className="bg-black/30 p-3 rounded-xl text-sm text-white/80 leading-relaxed border border-white/5">"{fb.message}"</div>
                    </div>
                )) : <div className="text-center py-10 opacity-30"><MessageSquare className="w-12 h-12 mx-auto mb-2" /><p>صندوق الوارد فارغ.</p></div>}
            </div>
        )}

        {activeView === 'members' && (
            <>
                <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">المشتركين النشطين (النخبة)</h3>
                {activeMembers.map(u => (
                    <div key={u.phone} className="bg-[#080808] p-4 rounded-2xl border border-white/5 flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3"><div className={`w-2 h-12 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div><div><h4 className="font-bold text-sm text-white flex items-center gap-2">{u.name}</h4><div className="flex items-center gap-2 mt-1"><span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/40 font-mono">{u.phone}</span>{u.subscriptionCycle && <span className="text-[9px] text-amber-500 bg-amber-900/20 px-1.5 py-0.5 rounded">{u.subscriptionCycle === 'yearly' ? 'سنوي' : 'شهري'}</span>}</div></div></div>
                        <div className="flex gap-2"><button onClick={() => handleStatusUpdate(u.phone, u.status === 'active' ? 'blocked' : 'active')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/30 hover:text-white">{u.status === 'active' ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}</button></div>
                    </div>
                ))}
            </>
        )}

        {activeView === 'marketers' && (
            <>
                <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">شركاء النجاح (المسوقين)</h3>
                {marketersList.map(u => (
                    <div key={u.phone} className="bg-[#080808] p-4 rounded-2xl border border-white/5 flex items-center justify-between mb-2 group hover:border-purple-500/20 transition-all">
                        <div className="flex items-center gap-3"><div className="w-2 h-12 rounded-full bg-purple-500"></div><div><h4 className="font-bold text-sm text-white flex items-center gap-2">{u.name}</h4><div className="flex items-center gap-2 mt-1"><span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/40 font-mono">{u.phone}</span><span className="text-[9px] bg-emerald-900/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">رصيد: {u.affiliate?.totalEarnings}ج</span></div></div></div>
                        <div className="flex gap-2"><button onClick={() => openPayoutModal(u)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20"><DollarSign className="w-4 h-4" /> صرف</button><button onClick={() => handleStatusUpdate(u.phone, u.status === 'active' ? 'blocked' : 'active')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/30 hover:text-white">{u.status === 'active' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}</button></div>
                    </div>
                ))}
            </>
        )}
      </div>

      {/* --- MASTER BOTTOM NAVIGATION (FIXED LAYOUT) --- */}
      <nav className="fixed bottom-[32px] left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 pb-6 pt-3 px-2 z-[100] rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="flex items-end justify-between max-w-lg mx-auto w-full relative px-2">
             <div className="flex items-end flex-1 justify-around">
                <button onClick={() => setActiveView('members')} className={`flex flex-col items-center gap-1 p-2 group transition-all ${activeView === 'members' ? 'text-white scale-110' : 'text-white/30'}`}><Users className="w-5 h-5" /><span className="text-[8px] font-bold">الأعضاء</span></button>
                <button onClick={() => setActiveView('marketers')} className={`flex flex-col items-center gap-1 p-2 group transition-all ${activeView === 'marketers' ? 'text-white scale-110' : 'text-white/30'}`}><Briefcase className="w-5 h-5" /><span className="text-[8px] font-bold">المسوقين</span></button>
                <button onClick={() => setActiveView('requests')} className={`flex flex-col items-center gap-1 p-2 group transition-all relative ${activeView === 'requests' ? 'text-white scale-110' : 'text-white/30'}`}><div className="relative"><CreditCard className="w-5 h-5" />{pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-bounce"></span>}</div><span className="text-[8px] font-bold">الطلبات</span></button>
             </div>

            <div className="relative -top-8 mx-2 transform transition-transform hover:scale-110 active:scale-95 z-50">
                <button onClick={() => setActiveView('chat')} className={`w-14 h-14 rounded-full border-4 border-black flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] relative overflow-hidden group ${(activeView as any) === 'chat' ? 'bg-amber-500 text-black' : 'bg-[#1a1a1a] text-amber-500'}`}><Bot className="w-6 h-6" /><div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div></button>
            </div>

            <div className="flex items-end flex-1 justify-around">
                <button onClick={() => setActiveView('feedback')} className={`flex flex-col items-center gap-1 p-2 group transition-all relative ${activeView === 'feedback' ? 'text-white scale-110' : 'text-white/30'}`}><div className="relative"><MessageSquare className="w-5 h-5" />{feedbacks.some(f => !f.isRead) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>}</div><span className="text-[8px] font-bold">الآراء</span></button>
                <button onClick={() => setActiveView('broadcast')} className={`flex flex-col items-center gap-1 p-2 group transition-all ${activeView === 'broadcast' ? 'text-white scale-110' : 'text-white/30'}`}><Megaphone className="w-5 h-5" /><span className="text-[8px] font-bold">النبض</span></button>
                <button onClick={() => setActiveView('core')} className={`flex flex-col items-center gap-1 p-2 group transition-all ${activeView === 'core' ? 'text-white scale-110' : 'text-white/30'}`}><Cpu className="w-5 h-5" /><span className="text-[8px] font-bold">النواة</span></button>
            </div>
        </div>
      </nav>

      {/* Payment Proof Modal & Payout Modal */}
      {selectedProof && (<div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedProof(null)}><img src={selectedProof} className="max-w-full max-h-[90vh] rounded-[24px] border border-white/20 shadow-2xl" alt="Proof" /><button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-600 rounded-full text-white transition-all"><X className="w-6 h-6" /></button></div>)}
      {payoutModal.isOpen && payoutModal.user && (
          <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl p-6 flex items-center justify-center animate-in zoom-in">
              <div className="max-w-md w-full bg-[#111] border border-emerald-500/30 rounded-[32px] p-6 relative shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <button onClick={() => setPayoutModal({ isOpen: false })} className="absolute top-4 left-4 text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                  <div className="text-center mb-6"><div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20"><DollarSign className="w-8 h-8 text-emerald-500" /></div><h3 className="text-xl font-black text-white">تسجيل صرف يدوي</h3></div>
                  <div className="space-y-4">
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5"><p className="text-[10px] text-white/40 uppercase font-bold mb-1">المسوق</p><p className="font-bold text-white mb-2">{payoutModal.user.name}</p></div>
                      <div><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">اسم المستلم</label><input type="text" value={payoutForm.name} onChange={(e) => setPayoutForm({...payoutForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none" /></div>
                      <div><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">المبلغ</label><input type="number" value={payoutForm.amount} onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none font-mono" /></div>
                      <button onClick={confirmPayout} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">تأكيد الصرف</button>
                  </div>
              </div>
          </div>
      )}
      {selectedAgent && (<div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-md p-6 flex items-center justify-center animate-in zoom-in"><div className="max-w-sm w-full bg-[#111] border border-white/10 rounded-[32px] p-8 relative shadow-2xl"><button onClick={() => setSelectedAgent(null)} className="absolute top-4 left-4 text-white/30 hover:text-white"><X className="w-5 h-5" /></button><div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-${selectedAgent.color}-500/10 border border-${selectedAgent.color}-500/20 text-${selectedAgent.color}-400 shadow-[0_0_30px_rgba(0,0,0,0.3)]`}>{React.cloneElement(selectedAgent.icon, { className: "w-10 h-10" })}</div><h3 className="text-2xl font-black text-white text-center mb-1">{selectedAgent.role}</h3><p className="text-center text-[10px] text-white/40 uppercase font-bold tracking-widest mb-6">{selectedAgent.name} • {selectedAgent.status}</p><div className="bg-white/5 p-4 rounded-2xl border border-white/5"><p className="text-sm text-white/80 leading-relaxed text-center">{selectedAgent.description}</p></div></div></div>)}
    </div>
  );
};

export default AdminDashboard;