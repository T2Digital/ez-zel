
import React, { useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Pricing from './components/Pricing';
import Auth from './components/Auth';
import Payment from './components/Payment';
import AdminDashboard from './components/AdminDashboard';
import SecurityGate from './components/SecurityGate';
import AffiliateDashboard from './components/AffiliateDashboard';
import Dashboard from './components/Dashboard'; 
import LiveTickers from './components/LiveTickers'; 
import InstallPrompt from './components/InstallPrompt';
import WorkspaceExplorer from './components/WorkspaceExplorer';
import { shadowDB, DBMessage } from './services/dbService';
import { speakNative, stopVoice, resumeAudioContext, playShadowVoice } from './services/geminiService';
import { Loader2, Fingerprint, ShieldCheck, Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAppStore } from './services/store';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';

const App: React.FC = () => {
  const { 
    view, user, selectedPlan, billingCycle, authDefaultTab, isAffiliateRegistration, isCheckingStatus, dashboardAction, isAppLocked, latestSystemMessage, isAuthReady,
    setView, setUser, setBillingCycle, setSelectedPlan, setAuthDefaultTab, setIsAffiliateRegistration, setDashboardAction, setIsAppLocked, setLatestSystemMessage, setIsAuthReady,
    checkSession, handleAuthSuccess, handleLogout, handleGuestAccess, handleAdminLogin, handleUpgradeRequest, handleStartAffiliate, checkStatusManual
  } = useAppStore();

  useEffect(() => {
      const unsub = shadowDB.onAuthStateChanged((firebaseUser) => {
          setIsAuthReady(true);
      });

      // Capacitor Background Listener
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          console.log('App state changed. Is active?', isActive);
          if (!isActive) {
              // App went to background
              // We could schedule a local notification here if needed
          }
      });

      // Request Local Notifications Permission
      LocalNotifications.requestPermissions().then((result) => {
          console.log('Local Notifications Permission:', result.display);
      }).catch(() => {});

      return () => {
          unsub();
          CapacitorApp.removeAllListeners();
      };
  }, []);

  // --- GLOBAL AUDIO UNLOCKER ---
  useEffect(() => {
      const unlock = () => {
          resumeAudioContext();
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
      return () => {
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
      };
  }, []);

  // --- POKA-YOKE NAVIGATION HANDLER ---
  useEffect(() => {
      if (view === 'chat' || view === 'affiliate') {
          window.history.pushState({ view }, '');
      }

      const handlePopState = (event: PopStateEvent) => {
          if (view === 'chat' || view === 'affiliate') {
              setView('dashboard'); 
          } 
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  useEffect(() => {
    checkSession();
  }, []);

  // --- GLOBAL SYSTEM SYNC & ALARM ENGINE ---
  useEffect(() => {
      // Request Notification Permission
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
      }

      if (!user || !isAuthReady) return;

      // Subscribe to Global System Changes
      shadowDB.subscribeToSystem(
          (pulse) => {
              if (pulse) {
                  const lastSeen = user.lastPulseReceived || 0;
                  if (pulse.timestamp > lastSeen + 1000) {
                      const pulseMsg: DBMessage = {
                          userId: user.email,
                          role: 'system',
                          text: `📢 **نداء عام (Shadow Pulse):**\n\n${pulse.text}`,
                          timestamp: pulse.timestamp
                      };
                      shadowDB.saveMessage(pulseMsg, true).then(() => {
                          setLatestSystemMessage(pulseMsg);
                          shadowDB.updateLastPulseReceived(user.email, pulse.timestamp);
                          setUser({ ...user, lastPulseReceived: pulse.timestamp });
                          const audio = document.getElementById('notification-sound') as HTMLAudioElement;
                          if (audio) { audio.volume = 1.0; audio.play().catch(e => {}); }
                          speakNative("رسالة هامة من الإدارة");
                      });
                  }
              }
          },
          (rules) => { console.log("[System] Global rules updated."); }
      );

      // ALARM CHECKER
      let isChecking = false;
      let timeoutId: any;
      const runBackgroundChecks = async () => {
        if (isChecking) return;
        isChecking = true;
        try {
            const now = Date.now();
            const uid = user.email || 'GUEST';
            const allTasks = await shadowDB.getTasks(uid);
            
            const dueTasks = allTasks.filter(t => 
                t.status === 'pending' && 
                !t.notified && 
                t.executionTime && 
                t.executionTime <= now
            );

            if (dueTasks.length > 0) {
                const task = dueTasks[0];
                // Clear simple text for TTS
                const cleanTask = task.task.replace(/[^a-zA-Z\u0600-\u06FF0-9 ]/g, '');
                const reminderText = `تنبيه يا ريس.. ميعاد ${cleanTask} جه.`;
                
                console.log("ALARM TRIGGERED:", task.task);
                
                // 1. Ensure Audio Context is active
                resumeAudioContext();

                // 2. Play Beep
                const audio = document.getElementById('notification-sound') as HTMLAudioElement;
                if (audio) { 
                    audio.volume = 1.0; 
                    audio.currentTime = 0;
                    audio.play().catch(e => console.warn("Alarm beep blocked", e));
                }
                
                // 3. Play Natural Voice (Fallback to native only if offline/error is handled inside playShadowVoice)
                playShadowVoice(reminderText, user.voicePreference === 'female' ? 'female' : 'male');

                // 4. Show Native/Web Notification
                try {
                    LocalNotifications.schedule({
                        notifications: [
                            {
                                title: 'تنبيه من الظل',
                                body: task.task,
                                id: Date.now(),
                                schedule: { at: new Date(Date.now() + 1000) },
                                sound: null,
                                attachments: null,
                                actionTypeId: '',
                                extra: null
                            }
                        ]
                    });
                } catch(e) {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('تنبيه من الظل', {
                            body: task.task,
                            icon: '/icon.png'
                        });
                    }
                }

                // 5. Save Message
                const alarmMsg: DBMessage = {
                    userId: uid,
                    role: 'system',
                    text: `🔔 **تنبيه:** ${task.task}`,
                    timestamp: Date.now()
                };
                await shadowDB.saveMessage(alarmMsg, true);
                setLatestSystemMessage(alarmMsg);
                
                // 6. Mark Done
                await shadowDB.updateTaskStatus(task.id!, { notified: true });
            }
        } finally {
            isChecking = false;
            timeoutId = setTimeout(runBackgroundChecks, 1000);
        }
      };

      runBackgroundChecks();
      return () => { clearTimeout(timeoutId); stopVoice(); };
  }, [user?.email, user?.phone, isAuthReady]);

  // --- ADMIN NOTIFIER ---
  useEffect(() => {
      if (user && (user.email === 'TITO' || user.email === 'tito@shadow.com' || user.email === 'ahmed.atya.daif@gmail.com' || (user.tier === 'sovereign' && user.name.includes('تيتو')))) {
          const interval = setInterval(async () => {
            const lastCheck = await shadowDB.getConfig('last_admin_check') || 0; 
            const allProfiles = await shadowDB.getAllProfiles();
            const newPending = allProfiles.filter(p => p.status === 'pending' && p.paymentProof && p.joinedAt > lastCheck);
            const allFeedback = await shadowDB.getAllFeedback();
            const newFeedback = allFeedback.filter(f => f.timestamp > lastCheck);

            if (newPending.length > 0 || newFeedback.length > 0) {
                let msgText = "🔴 **تقرير عمليات (New Alert)**:\n";
                if (newPending.length > 0) msgText += `\n📌 **طلبات اشتراك جديدة (${newPending.length})**`;
                if (newFeedback.length > 0) msgText += `\n💬 **رسائل رأي جديدة (${newFeedback.length})**`;
                
                const adminMsg: DBMessage = { userId: 'TITO', role: 'system', text: msgText, timestamp: Date.now() };
                await shadowDB.saveMessage(adminMsg, true);
                setLatestSystemMessage(adminMsg);
                await shadowDB.setConfig('last_admin_check', Date.now());
                const audio = document.getElementById('notification-sound') as HTMLAudioElement;
                if (audio) { audio.play().catch(e => {}); }
                speakNative("تنبيه إداري جديد");
            }
          }, 60000);
          return () => clearInterval(interval);
      }
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (view === 'pending_review' && user && user.tier === 'sovereign') {
        interval = setInterval(async () => {
            checkStatusManual();
        }, 5000); 
    }
    return () => clearInterval(interval);
  }, [view, user]);

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
      } else if (section === 'workspace') {
          setView('workspace');
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
              <h1 className="text-2xl font-black text-white/90 tracking-tighter mb-2">جاري استعادة الاتصال...</h1>
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
                      onLogout={(user.email === 'TITO' || user.email === 'tito@shadow.com' || user.email === 'ahmed.atya.daif@gmail.com' || (user.tier === 'sovereign' && user.name.includes('تيتو'))) ? () => setView('admin') : handleLogout} 
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
                    isAdmin={(user.email === 'TITO' || user.email === 'tito@shadow.com' || user.email === 'ahmed.atya.daif@gmail.com' || (user.tier === 'sovereign' && user.name.includes('تيتو')))}
                    onNavigateTo={handleChatNavigation}
                    incomingSystemMessage={latestSystemMessage} 
                />
            </div>
          );
      }

      if (view === 'pricing') return <Pricing onSelectPlan={(plan, cycle) => { setSelectedPlan(plan); if(cycle) setBillingCycle(cycle); setIsAffiliateRegistration(false); setAuthDefaultTab('register'); setView('auth'); }} onTrialStart={handleGuestAccess} onAffiliateStart={() => { setIsAffiliateRegistration(true); setAuthDefaultTab('register'); setView('auth'); }} />;
      if (view === 'auth') return <Auth selectedPlan={selectedPlan} defaultTab={authDefaultTab} isAffiliateRegistration={isAffiliateRegistration} billingCycle={billingCycle} onAuthSuccess={handleAuthSuccess} onAdminLogin={handleAdminLogin} onBack={() => setView('pricing')} />;
      if (view === 'payment') return <Payment planId={selectedPlan} billingCycle={billingCycle} onSuccess={async (proof, finalCycle) => { if (user && user.email !== 'GUEST') { const updatedUser = { ...user, paymentProof: proof, status: 'pending' as const, subscriptionCycle: finalCycle }; try { await shadowDB.saveProfile(updatedUser); setUser(updatedUser); setView('pending_review'); } catch(e) { console.error(e); } } }} onBack={() => setView('auth')} />;
      if (view === 'admin') return <AdminDashboard onLogout={handleLogout} onSwitchToUserMode={() => setView('dashboard')} />;
      if (view === 'workspace' && user) return <WorkspaceExplorer userId={user.email} onItemSelect={(item) => console.log('Selected item:', item)} onBack={() => setView('dashboard')} />;
      if (view === 'affiliate' && user) return <AffiliateDashboard user={user} onBack={() => setView('dashboard')} onUpdateUser={setUser} />;
      if (view === 'pending_review') return (<div className="fixed inset-0 bg-[#020202] flex items-center justify-center p-6 font-['Cairo'] text-white"><div className="max-w-md w-full glass p-10 rounded-[40px] border border-amber-500/20 text-center relative overflow-hidden"><div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div><div className="relative z-10"><div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]"><Clock className="w-10 h-10 text-amber-500 animate-pulse" /></div><h2 className="text-2xl font-black mb-3 text-white">جاري المراجعة</h2><p className="text-white/50 text-sm mb-8 leading-relaxed">طلبك وصل للعمليات. <br/>يتم الآن مراجعة إيصال الدفع وتفعيل حسابك.<span className="block mt-2 text-amber-400 font-bold text-xs">متوسط وقت الانتظار: 10 دقائق</span></p><div className="flex flex-col gap-3"><button onClick={checkStatusManual} disabled={isCheckingStatus} className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">{isCheckingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}تحديث الحالة الآن</button><button onClick={handleLogout} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> خروج مؤقت</button></div></div></div></div>);
      if (view === 'blocked') return (<div className="fixed inset-0 bg-black flex items-center justify-center text-center p-8 text-white font-['Cairo']"><div><ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-6" /><h1 className="text-3xl font-black mb-2">الحساب معلق</h1><button onClick={() => setView('pricing')} className="mt-8 px-6 py-3 bg-white/10 rounded-xl">عودة</button></div></div>);
      return null;
  };

  return (
      <>
          <LiveTickers />
          <InstallPrompt />
          {renderView()}
          <audio id="notification-sound" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      </>
  );
};

export default App;
