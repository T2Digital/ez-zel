import React, { useState, useEffect, useRef } from 'react';
import { Users, CreditCard, Activity, Search, CheckCircle, XCircle, Image as ImageIcon, ShieldCheck, Zap, X, Bot, Infinity, LogOut, DollarSign, Server, Eye, Database, Globe, Cpu, FolderOpen, Radio, MessageSquare, Mic, Save, Lock, LayoutGrid, Smartphone, Wallet, TrendingUp, Briefcase, Ban, Megaphone, Send, Heart, Feather, Bell, Settings, Edit3, Plus, Trash2, FileText, Brain, UploadCloud, Paperclip } from 'lucide-react';
import { shadowDB, UserProfile, DBFeedback, AgentProfile } from '../services/dbService';
import ChatInterface from './ChatInterface';

interface Props {
    onLogout: () => void;
    onSwitchToUserMode: () => void; 
}

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
  const [activeView, setActiveView] = useState<'members' | 'marketers' | 'feedback' | 'requests' | 'chat' | 'core' | 'broadcast' | 'settings'>('requests');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [feedbacks, setFeedbacks] = useState<DBFeedback[]>([]);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState<'rules' | 'broadcast' | null>(null);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [payoutModal, setPayoutModal] = useState<{ isOpen: boolean, user?: UserProfile } >({ isOpen: false });
  const [payoutForm, setPayoutForm] = useState({ amount: '', name: '', date: '' });
  const [globalRules, setGlobalRules] = useState('');
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [agentDbData, setAgentDbData] = useState<AgentProfile | null>(null);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [newKnowledgeItem, setNewKnowledgeItem] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [adminProfile, setAdminProfile] = useState<UserProfile>({ 
      email: 'TITO',
      name: 'تيتو (المالك)', 
      shadowName: 'الماستر', 
      tier: 'sovereign', 
      status: 'active', 
      joinedAt: Date.now(),
      password: 'admin',
      affiliate: { isMarketer: true, referralCode: 'TITO_BOSS', totalEarnings: 0, referralsCount: 0, payoutHistory: [] }
  });

  useEffect(() => { 
      const initData = async () => {
          const titoProfile = await shadowDB.getProfile('TITO');
          if (titoProfile) setAdminProfile(titoProfile);
          
          const [allProfiles, allFeedback, rules] = await Promise.all([
              shadowDB.getAllProfiles(),
              shadowDB.getAllFeedback(),
              shadowDB.getGlobalRules()
          ]);
          setProfiles(allProfiles);
          setFeedbacks(allFeedback.reverse());
          setGlobalRules(rules);

          shadowDB.subscribeToAdminFeed(
              (updated) => { if(updated.length) setProfiles(updated); },
              (updated) => { if(updated.length) setFeedbacks(updated.reverse()); }
          );
      };
      initData();
  }, []); 

  const startVoiceDictation = (target: 'rules' | 'broadcast') => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) { alert("المتصفح لا يدعم الإملاء الصوتي"); return; }
      
      const rec = new SpeechRecognition();
      rec.lang = 'ar-EG';
      rec.onstart = () => setIsListening(target);
      rec.onresult = (e: any) => {
          const text = e.results[0][0].transcript;
          if (target === 'rules') setGlobalRules(prev => prev + " " + text);
          else setBroadcastMessage(prev => prev + " " + text);
      };
      rec.onend = () => setIsListening(null);
      rec.start();
  };

  const handleAgentClick = async (agent: AgentInfo) => {
      setSelectedAgent(agent);
      let data = await shadowDB.getAgentProfile(agent.id);
      if (!data) {
          data = { id: agent.id, name: agent.name, role: agent.role, isActive: true, systemInstruction: `أنت ${agent.role}. مهمتك: ${agent.description}.`, knowledgeBase: [], lastUpdated: Date.now() };
      }
      setAgentDbData(data);
  };

  const saveAgentChanges = async () => {
      if (!agentDbData) return;
      setIsSavingAgent(true);
      await shadowDB.saveAgentProfile({ ...agentDbData, lastUpdated: Date.now() });
      setTimeout(() => setIsSavingAgent(false), 800);
  };

  const handleStatusUpdate = async (email: string, status: 'active' | 'blocked' | 'pending') => {
    const profile = await shadowDB.getProfile(email);
    if (profile) {
        if (status === 'active' && profile.status !== 'active' && profile.referredBy && !profile.commissionPaid) {
            const amount = profile.subscriptionCycle === 'yearly' ? 1000 : 100;
            await shadowDB.registerReferral(profile.referredBy, amount);
            profile.commissionPaid = true; 
        }
        await shadowDB.saveProfile({ ...profile, status });
    }
  };

  const handleSendBroadcast = async () => { 
      if (!broadcastMessage.trim()) return; 
      setIsBroadcasting(true); 
      await shadowDB.setGlobalPulse(broadcastMessage);
      setBroadcastMessage(''); 
      setIsBroadcasting(false);
      alert("تم إطلاق نبض الظل للجميع.");
  };

  const saveGlobalRules = async () => { setIsSavingRules(true); await shadowDB.updateGlobalRules(globalRules); setTimeout(() => setIsSavingRules(false), 1000); };

  const councilAgents: AgentInfo[] = [
      { id: 'maestro_core', name: 'The Maestro', role: 'المايسترو', status: 'LEADER', description: 'العقل المدبر وإدارة الحوار.', color: 'purple', icon: <Brain className="w-5 h-5" /> },
      { id: 'detective', name: 'Detective', role: 'المحقق', status: 'ONLINE', description: 'جمع المعلومات والبحث الحي.', color: 'emerald', icon: <Globe className="w-5 h-5" /> },
      { id: 'accountant', name: 'Accountant', role: 'المحاسب', status: 'ACTIVE', description: 'إدارة الفلوس والتقارير.', color: 'emerald', icon: <DollarSign className="w-5 h-5" /> },
      { id: 'executor', name: 'Executor', role: 'المنفذ', status: 'ACTIVE', description: 'الاتصالات والمهمات التشغيلية.', color: 'amber', icon: <Zap className="w-5 h-5" /> },
      { id: 'legal_advisor', name: 'Legal Advisor', role: 'المستشار', status: 'READY', description: 'الصياغة القانونية والعقود.', color: 'blue', icon: <FileText className="w-5 h-5" /> },
      { id: 'healer', name: 'The Healer', role: 'المعالج', status: 'READY', description: 'الجانب الروحاني والنفسي.', color: 'red', icon: <Feather className="w-5 h-5" /> },
  ];

  const filteredProfiles = profiles.filter(p => p.name.includes(searchQuery) || p.email.includes(searchQuery));
  const pendingRequests = profiles.filter(p => p.status === 'pending' && p.paymentProof);
  const activeMembers = filteredProfiles.filter(p => p.status === 'active' && p.tier === 'sovereign' && p.email !== 'TITO');
  const marketersList = filteredProfiles.filter(p => p.affiliate?.isMarketer);

  if (activeView === 'chat') return <div className="h-screen w-full bg-black"><ChatInterface currentUser={adminProfile} onUpgrade={() => {}} onBack={() => setActiveView('requests')} isAdmin={true} /></div>;

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col font-['Cairo'] pb-48">
      <div className="p-6 md:p-8 flex justify-between items-center bg-black/50 border-b border-white/5 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-black">T</div>
            <h2 className="text-xl font-black">TITO <span className="text-amber-500">HQ</span></h2>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={onSwitchToUserMode} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold">وضع المستخدم</button>
              <button onClick={onLogout} className="p-2 text-red-500"><LogOut className="w-5 h-5" /></button>
          </div>
      </div>

      <div className="flex-1 p-6 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {councilAgents.map(agent => (
                <div key={agent.id} onClick={() => handleAgentClick(agent)} className="p-4 rounded-2xl border border-white/5 bg-[#080808] flex flex-col items-center cursor-pointer hover:border-amber-500/30 transition-all">
                    <div className={`p-3 rounded-full bg-white/5 text-${agent.color}-400 mb-2`}>{agent.icon}</div>
                    <span className="text-[10px] font-black uppercase text-white/40">{agent.name}</span>
                </div>
            ))}
        </div>

        {activeView === 'requests' && pendingRequests.map(u => (
            <div key={u.email} className="p-6 rounded-[24px] border border-amber-500/30 bg-amber-500/5 flex flex-col gap-4 mb-4">
                <div className="flex justify-between items-start">
                    <div><h3 className="font-black">{u.name}</h3><p className="text-xs opacity-50">{u.email}</p></div>
                    <button onClick={() => setSelectedProof(u.paymentProof!)} className="p-2 bg-white/10 rounded-lg"><ImageIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleStatusUpdate(u.email, 'active')} className="flex-1 py-3 bg-emerald-600 rounded-xl text-xs font-bold">تفعيل</button>
                    <button onClick={() => handleStatusUpdate(u.email, 'blocked')} className="p-3 bg-red-600/20 rounded-xl text-red-500"><X className="w-4 h-4" /></button>
                </div>
            </div>
        ))}

        {activeView === 'members' && activeMembers.map(u => (
            <div key={u.email} className="p-4 bg-[#111] rounded-2xl border border-white/5 flex justify-between items-center mb-2">
                <div><h4 className="font-bold">{u.name}</h4><p className="text-[10px] opacity-40">{u.email}</p></div>
                <button onClick={() => handleStatusUpdate(u.email, 'blocked')} className="text-red-500 text-xs font-bold">تجميد</button>
            </div>
        ))}

        {activeView === 'marketers' && marketersList.map(u => (
            <div key={u.email} className="p-4 bg-[#111] rounded-2xl border border-emerald-500/20 flex justify-between items-center mb-2">
                <div><h4 className="font-bold text-emerald-400">{u.name}</h4><p className="text-[10px] opacity-40">أرباح: {u.affiliate?.totalEarnings}ج</p></div>
                <div className="text-right"><p className="text-[10px] font-mono">{u.affiliate?.referralCode}</p></div>
            </div>
        ))}

        {activeView === 'feedback' && feedbacks.map((f, i) => (
            <div key={i} className="p-4 bg-[#111] rounded-2xl border border-purple-500/20 mb-2">
                <div className="flex justify-between mb-1"><span className="text-xs font-black text-purple-400">{f.userName}</span><span className="text-[9px] opacity-30">{new Date(f.timestamp).toLocaleString()}</span></div>
                <p className="text-sm opacity-80">{f.message}</p>
            </div>
        ))}

        {activeView === 'core' && (
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 bg-black border border-white/10 rounded-2xl p-4 relative">
                    <textarea value={globalRules} onChange={(e) => setGlobalRules(e.target.value)} className="w-full h-64 bg-transparent text-emerald-500 font-mono text-sm outline-none resize-none" placeholder="// القوانين السيادية..." />
                    <button onClick={() => startVoiceDictation('rules')} className={`absolute bottom-4 left-4 p-4 rounded-full ${isListening === 'rules' ? 'bg-red-600 animate-pulse' : 'bg-white/10 text-white'}`}><Mic className="w-6 h-6" /></button>
                </div>
                <button onClick={saveGlobalRules} disabled={isSavingRules} className="w-full py-4 bg-white text-black font-black rounded-xl">{isSavingRules ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
            </div>
        )}

        {activeView === 'broadcast' && (
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 bg-[#111] border border-amber-500/20 rounded-2xl p-6 relative">
                    <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="w-full h-48 bg-transparent text-lg text-white outline-none resize-none" placeholder="اكتب نبض الظل هنا..." />
                    <button onClick={() => startVoiceDictation('broadcast')} className={`absolute bottom-4 left-4 p-4 rounded-full ${isListening === 'broadcast' ? 'bg-red-600 animate-pulse' : 'bg-white/10 text-white'}`}><Mic className="w-6 h-6" /></button>
                </div>
                <button onClick={handleSendBroadcast} disabled={isBroadcasting} className="w-full py-4 bg-amber-500 text-black font-black rounded-xl">إرسال النبض للجميع</button>
            </div>
        )}
      </div>

      <nav className="fixed bottom-[32px] left-0 w-full bg-black/95 border-t border-white/10 pb-6 pt-3 z-[100] rounded-t-[40px]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
            <button onClick={() => setActiveView('members')} className={`flex flex-col items-center gap-1 ${activeView === 'members' ? 'text-white' : 'text-white/30'}`}><Users className="w-5 h-5" /><span className="text-[8px] font-bold">الأعضاء</span></button>
            <button onClick={() => setActiveView('marketers')} className={`flex flex-col items-center gap-1 ${activeView === 'marketers' ? 'text-white' : 'text-white/30'}`}><Briefcase className="w-5 h-5" /><span className="text-[8px] font-bold">المسوقين</span></button>
            <button onClick={() => setActiveView('requests')} className={`flex flex-col items-center gap-1 ${activeView === 'requests' ? 'text-white' : 'text-white/30'}`}><CreditCard className="w-5 h-5" /><span className="text-[8px] font-bold">الطلبات</span></button>
            <button onClick={() => setActiveView('chat')} className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-black -top-4 relative shadow-lg"><Bot className="w-6 h-6" /></button>
            <button onClick={() => setActiveView('feedback')} className={`flex flex-col items-center gap-1 ${activeView === 'feedback' ? 'text-white' : 'text-white/30'}`}><MessageSquare className="w-5 h-5" /><span className="text-[8px] font-bold">الآراء</span></button>
            <button onClick={() => setActiveView('broadcast')} className={`flex flex-col items-center gap-1 ${activeView === 'broadcast' ? 'text-white' : 'text-white/30'}`}><Megaphone className="w-5 h-5" /><span className="text-[8px] font-bold">النبض</span></button>
            <button onClick={() => setActiveView('core')} className={`flex flex-col items-center gap-1 ${activeView === 'core' ? 'text-white' : 'text-white/30'}`}><Cpu className="w-5 h-5" /><span className="text-[8px] font-bold">النواة</span></button>
        </div>
      </nav>

      {selectedProof && <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedProof(null)}><img src={selectedProof} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" /><button className="absolute top-6 right-6 p-3 bg-red-600 rounded-full text-white"><X className="w-6 h-6" /></button></div>}
    </div>
  );
};

export default AdminDashboard;