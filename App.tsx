
import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Pricing from './components/Pricing';
import Auth from './components/Auth';
import Payment from './components/Payment';
import AdminDashboard from './components/AdminDashboard';
import SecurityGate from './components/SecurityGate';
import AffiliateDashboard from './components/AffiliateDashboard';
import Dashboard from './components/Dashboard'; 
import LiveTickers from './components/LiveTickers'; 
import { shadowDB, UserProfile, DBMessage } from './services/dbService';
import { playShadowVoice, stopVoice } from './services/geminiService';
import { Loader2, Fingerprint, ShieldCheck, Clock, CheckCircle2, Home, LogOut, RefreshCw } from 'lucide-react';

type ViewState = 'loading' | 'pricing' | 'auth' | 'payment' | 'dashboard' | 'chat' | 'admin' | 'blocked' | 'pending_review' | 'affiliate';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('elite');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly'); 
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  const [isAffiliateRegistration, setIsAffiliateRegistration] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  const [dashboardAction, setDashboardAction] = useState<string | null>(null);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [latestSystemMessage, setLatestSystemMessage] = useState<DBMessage | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  // --- GLOBAL ALARM SYSTEM & ADMIN NOTIFIER & SHADOW PULSE ---
  useEffect(() => {
    if (!user || isAppLocked) return;

    const runBackgroundChecks = async () => {
        const now = Date.now();

        // 1. Alarms (For Everyone)
        const allTasks = await shadowDB.getTasks(user.phone);
        const dueTasks = allTasks.filter(t => 
            t.status === 'pending' && 
            !t.notified && 
            t.executionTime && 
            t.executionTime <= now
        );

        if (dueTasks.length > 0) {
            const audio = document.getElementById('notification-sound') as HTMLAudioElement;
            if (audio) { audio.volume = 1.0; audio.play().catch(e => console.log("Audio play prevented:", e)); }
            
            const task = dueTasks[0];
            const reminderText = `يا ريس.. تنبيه هام: ${task.task}. الميعاد وصل.`;
            setTimeout(() => { playShadowVoice(reminderText, user.voicePreference || 'male'); }, 1000);

            if (Notification.permission === 'granted') {
                new Notification('تنبيه من الظل 🔔', { 
                    body: `حان موعد: ${task.task}`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/2098/2098402.png'
                });
            }

            const alarmMsg: DBMessage = {
                userId: user.phone,
                role: 'system',
                text: `🔔 تنبيه: حان موعد "${task.task}"`,
                timestamp: Date.now()
            };
            setLatestSystemMessage(alarmMsg);
            
            for (const t of dueTasks) { await shadowDB.updateTaskStatus(t.id!, { notified: true }); }
        }

        // 2. SHADOW PULSE (Global Broadcast Check)
        const pulse = await shadowDB.getGlobalPulse();
        if (pulse) {
            const lastSeen = user.lastPulseReceived || 0;
            if (pulse.timestamp > lastSeen) {
                const pulseMsg: DBMessage = {
                    userId: user.phone,
                    role: 'system',
                    text: `📢 **نبض الظل (System Broadcast):**\n\n${pulse.text}`,
                    timestamp: pulse.timestamp
                };
                await shadowDB.saveMessage(pulseMsg);
                await shadowDB.updateLastPulseReceived(user.phone, pulse.timestamp);
                setLatestSystemMessage(pulseMsg);
                setUser(prev => prev ? ({ ...prev, lastPulseReceived: pulse.timestamp }) : null);
                const audio = document.getElementById('notification-sound') as HTMLAudioElement;
                if (audio) { audio.play().catch(e => {}); }
            }
        }

        // 3. Admin Notifier (Strictly TITO Only)
        if (user.phone === 'TITO') {
            const lastCheck = await shadowDB.getConfig('last_admin_check') || 0; 
            const allProfiles = await shadowDB.getAllProfiles();
            const newPending = allProfiles.filter(p => p.status === 'pending' && p.paymentProof && p.joinedAt > lastCheck);
            const allFeedback = await shadowDB.getAllFeedback();
            const newFeedback = allFeedback.filter(f => f.timestamp > lastCheck);

            if (newPending.length > 0 || newFeedback.length > 0) {
                let msgText = "🔴 **تقرير عمليات (New Alert)**:\n";
                if (newPending.length > 0) {
                    msgText += `\n📌 **طلبات اشتراك جديدة (${newPending.length}):**\n`;
                    newPending.forEach(p => msgText += `- ${p.name} (${p.phone})\n`);
                }
                if (newFeedback.length > 0) {
                    msgText += `\n💬 **رسائل رأي جديدة (${newFeedback.length}):**\n`;
                    newFeedback.forEach(f => msgText += `- من ${f.userName}: "${f.message.substring(0, 30)}..."\n`);
                }
                
                const adminMsg: DBMessage = {
                    userId: 'TITO',
                    role: 'system',
                    text: msgText,
                    timestamp: Date.now()
                };

                await shadowDB.saveMessage(adminMsg);
                setLatestSystemMessage(adminMsg);
                await shadowDB.setConfig('last_admin_check', Date.now());
                const audio = document.getElementById('notification-sound') as HTMLAudioElement;
                if (audio) { audio.play().catch(e => {}); }
            }
        }
    };

    if (Notification.permission === 'default') { Notification.requestPermission(); }
    // Increased interval to 120s (2 minutes) to reduce API resource usage significantly
    const interval = setInterval(runBackgroundChecks, 120000); 
    return () => { clearInterval(interval); stopVoice(); };
  }, [user, isAppLocked]);

  useEffect(() => {
    let interval: any;
    if (view === 'pending_review' && user && user.tier === 'sovereign') {
        interval = setInterval(async () => {
            checkStatusManual();
        }, 5000); 
    }
    return () => clearInterval(interval);
  }, [view, user]);

  const checkStatusManual = async () => {
      if (!user) return;
      setIsCheckingStatus(true);
      const updatedProfile = await shadowDB.getProfile(user.phone);
      if (updatedProfile && updatedProfile.status === 'active') {
          setUser(updatedProfile);
          setView('dashboard'); 
      }
      setTimeout(() => setIsCheckingStatus(false), 1000);
  };

  const checkSession = async () => {
    try {
      const lastUserPhone = localStorage.getItem('shadow_last_user');
      const guestSession = localStorage.getItem('shadow_guest_active');

      if (lastUserPhone) {
          const profile = await shadowDB.getProfile(lastUserPhone);
          if (profile && profile.status === 'active') {
             setUser(profile);
             if (profile.phone === 'TITO') {
                 setView('admin');
                 setIsAppLocked(false);
             } else {
                 setView('dashboard');
                 setIsAppLocked(true); 
             }
             return;
          } else if (profile && profile.status === 'pending') {
             setUser(profile);
             if (profile.paymentProof) {
                 setView('pending_review');
             } else {
                 setView('payment');
             }
             return;
          }
      }

      if (guestSession === 'true') {
        const guestUser: UserProfile = { phone: 'GUEST', name: 'ضيف', tier: 'lite', status: 'active', joinedAt: Date.now() };
        setUser(guestUser);
        setView('dashboard');
        setIsAppLocked(true); 
        return;
      }
      
      setView('pricing');
    } catch (e) {
      setView('pricing');
    }
  };

  const handleAuthSuccess = async (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('shadow_last_user', profile.phone);
    
    setLatestSystemMessage(null);

    const guestHistory = localStorage.getItem('shadow_guest_history');
    if (guestHistory) {
        try {
            const messages = JSON.parse(guestHistory);
            await shadowDB.migrateGuestMessages(messages);
            localStorage.removeItem('shadow_guest_history');
            localStorage.removeItem('shadow_guest_active');
            localStorage.removeItem('shadow_guest_start'); 
        } catch (e) { console.error("Migration failed", e); }
    }

    if (profile.phone === 'TITO' || profile.phone === '01000000000' || (profile.tier === 'sovereign' && profile.name.includes('تيتو'))) {
        setView('admin');
        setIsAppLocked(false); 
        return;
    }

    if (profile.tier === 'lite' && profile.affiliate?.isMarketer) {
         setView('dashboard');
         setIsAppLocked(false);
         return;
    }

    if (profile.status === 'active') {
        setView('dashboard'); 
        setIsAppLocked(false); 
    } else if (profile.status === 'pending') {
        if (profile.paymentProof) setView('pending_review');
        else setView('payment');
    } else {
        setView('blocked');
    }
  };

  const handleGuestAccess = () => {
      localStorage.setItem('shadow_guest_active', 'true');
      if (!localStorage.getItem('shadow_guest_start')) {
          localStorage.setItem('shadow_guest_start', Date.now().toString());
      }
      const guestUser: UserProfile = { phone: 'GUEST', name: 'ضيف', tier: 'lite', status: 'active', joinedAt: Date.now() };
      setUser(guestUser);
      setLatestSystemMessage(null);
      setView('dashboard');
      setIsAppLocked(false);
  };

  const handleAdminLogin = async () => {
      let adminProfile = await shadowDB.getProfile('TITO');
      
      if (!adminProfile) {
          adminProfile = { 
              phone: 'TITO', 
              name: 'تيتو (المالك)', 
              shadowName: 'الظل الأبدي', 
              tier: 'sovereign', 
              status: 'active', 
              joinedAt: Date.now(),
              affiliate: {
                  isMarketer: true,
                  referralCode: 'TITO_BOSS',
                  totalEarnings: 0,
                  referralsCount: 0,
                  payoutHistory: []
              }
          };
          await shadowDB.saveProfile(adminProfile);
      }
      
      if (adminProfile.phone !== 'TITO') {
          adminProfile.phone = 'TITO';
      }
      
      handleAuthSuccess(adminProfile);
  };

  const handleUpgradeRequest = () => {
      localStorage.removeItem('shadow_guest_active');
      localStorage.removeItem('shadow_last_user');
      setUser(null);
      setLatestSystemMessage(null);
      setSelectedPlan('elite');
      setIsAffiliateRegistration(false);
      setAuthDefaultTab('register'); 
      setView('auth'); 
  };
  
  const handleStartAffiliate = () => {
      if (user?.phone === 'GUEST') {
        localStorage.removeItem('shadow_guest_active');
        setUser(null);
        setLatestSystemMessage(null);
      }
      setIsAffiliateRegistration(true);
      setAuthDefaultTab('register');
      setView('auth');
  }

  const handleLogout = () => {
      localStorage.removeItem('shadow_last_user');
      localStorage.removeItem('shadow_guest_active');
      setUser(null);
      setLatestSystemMessage(null); 
      setView('pricing');
  };

  const handleChatNavigation = (section: string) => {
      if (section === 'vault') {
          setDashboardAction('open_vault');
          setView('dashboard');
      } else if (section === 'affiliate') {
          setView('affiliate');
      } else if (section === 'pricing') {
          handleUpgradeRequest();
      } else if (section === 'nexus') {
          setDashboardAction('open_nexus');
          setView('dashboard');
      }
  };

  if (view === 'loading') {
      return (
          <div className="fixed inset-0 bg-[#020202] flex flex-col items-center justify-center text-white font-['Cairo']">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-purple-600 blur-[100px] opacity-20 animate-pulse"></div>
                  <div className="relative z-10 p-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                    <Fingerprint className="w-16 h-16 text-purple-500 animate-pulse" />
                  </div>
              </div>
              <h1 className="text-2xl font-black text-white/90 tracking-tighter mb-2">جاري تأمين الاتصال...</h1>
          </div>
      );
  }

  const renderView = () => {
      if ((view === 'chat' || view === 'dashboard') && user) {
          if (isAppLocked) {
              return <SecurityGate user={user} onUnlock={() => setIsAppLocked(false)} onLogout={handleLogout} />;
          }
          
          if (view === 'dashboard') {
              return (
                  <Dashboard 
                      user={user}
                      initialAction={dashboardAction} 
                      onClearAction={() => setDashboardAction(null)} 
                      onOpenChat={() => setView('chat')}
                      onOpenAffiliate={() => setView('affiliate')}
                      onLogout={user.phone === 'TITO' ? () => setView('admin') : handleLogout} 
                      onUpgrade={handleUpgradeRequest}
                      onStartAffiliate={handleStartAffiliate}
                  />
              );
          }

          return (
            <div className="fixed inset-0 bg-black text-white font-['Cairo'] overflow-hidden">
                <ChatInterface 
                    currentUser={user} 
                    onUpgrade={handleUpgradeRequest} 
                    onBack={() => setView('dashboard')} 
                    onOpenAffiliate={() => setView('affiliate')}
                    isAdmin={user.phone === 'TITO'}
                    onNavigateTo={handleChatNavigation}
                    incomingSystemMessage={latestSystemMessage} 
                />
            </div>
          );
      }

      if (view === 'pricing') return (
          <Pricing 
            onSelectPlan={(plan, cycle) => { 
                setSelectedPlan(plan); 
                if(cycle) setBillingCycle(cycle);
                setIsAffiliateRegistration(false);
                setAuthDefaultTab('register'); 
                setView('auth'); 
            }} 
            onTrialStart={handleGuestAccess}
            onAffiliateStart={() => {
                setIsAffiliateRegistration(true);
                setAuthDefaultTab('register');
                setView('auth');
            }}
          />
      );
      
      if (view === 'auth') return (
          <Auth 
            selectedPlan={selectedPlan} 
            defaultTab={authDefaultTab} 
            isAffiliateRegistration={isAffiliateRegistration}
            billingCycle={billingCycle} 
            onAuthSuccess={handleAuthSuccess} 
            onAdminLogin={handleAdminLogin} 
            onBack={() => setView('pricing')} 
          />
      );

      if (view === 'payment') {
          return (
            <Payment 
                planId={selectedPlan} 
                billingCycle={billingCycle}
                onSuccess={async (proof, finalCycle) => {
                    if (user && user.phone !== 'GUEST') {
                        const updatedUser = { 
                            ...user, 
                            paymentProof: proof, 
                            status: 'pending' as const,
                            subscriptionCycle: finalCycle 
                        };
                        await shadowDB.saveProfile(updatedUser);
                        setUser(updatedUser);
                        setView('pending_review'); 
                    }
                }}
                onBack={() => setView('auth')}
            />
          );
      }

      if (view === 'admin') return <AdminDashboard onLogout={handleLogout} onSwitchToUserMode={() => setView('dashboard')} />;
      
      if (view === 'affiliate' && user) return <AffiliateDashboard user={user} onBack={() => setView('dashboard')} onUpdateUser={setUser} />;

      if (view === 'pending_review') {
          return (
            <div className="fixed inset-0 bg-[#020202] flex items-center justify-center p-6 font-['Cairo'] text-white">
                <div className="max-w-md w-full glass p-10 rounded-[40px] border border-amber-500/20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                            <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black mb-3 text-white">جاري المراجعة</h2>
                        <p className="text-white/50 text-sm mb-8 leading-relaxed">
                            طلبك وصل للعمليات. <br/>
                            يتم الآن مراجعة إيصال الدفع وتفعيل حسابك.
                            <span className="block mt-2 text-amber-400 font-bold text-xs">متوسط وقت الانتظار: 10 دقائق</span>
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={checkStatusManual} 
                                disabled={isCheckingStatus}
                                className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isCheckingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                تحديث الحالة الآن
                            </button>
                            
                            <button onClick={handleLogout} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2">
                                <LogOut className="w-4 h-4" /> خروج مؤقت
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          );
      }

      if (view === 'blocked') {
          return (
            <div className="fixed inset-0 bg-black flex items-center justify-center text-center p-8 text-white font-['Cairo']">
                <div>
                    <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-black mb-2">الحساب معلق</h1>
                    <button onClick={() => setView('pricing')} className="mt-8 px-6 py-3 bg-white/10 rounded-xl">عودة</button>
                </div>
            </div>
          );
      }
      return null;
  };

  return (
      <>
          <LiveTickers />
          {renderView()}
      </>
  );
};

export default App;
