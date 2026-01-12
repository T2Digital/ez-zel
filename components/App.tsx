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
import InstallPrompt from './components/InstallPrompt';
import { shadowDB, UserProfile, DBMessage } from './services/dbService';
import { playShadowVoice, stopVoice } from './services/geminiService';
import { Loader2, Fingerprint, ShieldCheck, Clock, CheckCircle2, Home, LogOut, RefreshCw } from 'lucide-react';

type ViewState = 'loading' | 'pricing' | 'auth' | 'payment' | 'dashboard' | 'chat' | 'admin' | 'blocked' | 'pending_review' | 'affiliate';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('elite');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly'); 
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  const [isAffiliateRegistration, setIsAffiliateRegistration] = useState(false);
  const [latestSystemMessage, setLatestSystemMessage] = useState<DBMessage | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const lastUserEmail = localStorage.getItem('shadow_last_user');
      if (lastUserEmail && lastUserEmail !== 'GUEST') {
          const profile = await shadowDB.getProfile(lastUserEmail);
          if (profile) {
              setUser(profile);
              if (profile.status === 'active') {
                 setView(profile.email === 'TITO' ? 'admin' : 'dashboard');
                 setIsAppLocked(true); // Always lock on fresh session
                 return;
              } else if (profile.status === 'pending') {
                 setView(profile.paymentProof ? 'pending_review' : 'payment');
                 setIsAppLocked(false);
                 return;
              }
          }
      }
      setView('pricing');
    } catch { setView('pricing'); }
  };

  const handleAuthSuccess = async (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('shadow_last_user', profile.email);
    if (profile.email === 'TITO') { setView('admin'); setIsAppLocked(false); }
    else if (profile.status === 'active') { setView('dashboard'); setIsAppLocked(false); }
    else if (profile.status === 'pending') { setView(profile.paymentProof ? 'pending_review' : 'payment'); setIsAppLocked(false); }
    else setView('blocked');
  };

  const handleGuestAccess = () => {
      setUser({ email: 'GUEST', name: 'ضيف', tier: 'lite', status: 'active', joinedAt: Date.now() });
      setView('dashboard');
      setIsAppLocked(false);
  };

  const handleLogout = () => {
      shadowDB.logout();
      localStorage.removeItem('shadow_last_user');
      setUser(null);
      setView('pricing');
  };

  const renderView = () => {
      if ((view === 'chat' || view === 'dashboard') && user) {
          if (isAppLocked && user.email !== 'GUEST') return <SecurityGate user={user} onUnlock={() => setIsAppLocked(false)} onLogout={handleLogout} />;
          if (view === 'dashboard') return <Dashboard user={user} onOpenChat={() => setView('chat')} onOpenAffiliate={() => setView('affiliate')} onLogout={handleLogout} onUpgrade={() => setView('pricing')} />;
          return <div className="fixed inset-0 bg-black"><ChatInterface currentUser={user} onUpgrade={() => setView('pricing')} onBack={() => setView('dashboard')} isAdmin={user.email === 'TITO'} incomingSystemMessage={latestSystemMessage} /></div>;
      }
      if (view === 'pricing') return <Pricing onSelectPlan={(p, c) => { setSelectedPlan(p); setBillingCycle(c); setView('auth'); }} onTrialStart={handleGuestAccess} onAffiliateStart={() => { setIsAffiliateRegistration(true); setView('auth'); }} />;
      if (view === 'auth') return <Auth selectedPlan={selectedPlan} isAffiliateRegistration={isAffiliateRegistration} billingCycle={billingCycle} onAuthSuccess={handleAuthSuccess} onAdminLogin={() => setView('admin')} onBack={() => setView('pricing')} />;
      if (view === 'payment') return <Payment planId={selectedPlan} billingCycle={billingCycle} onSuccess={async (p, c) => { if(user) { const u = {...user, paymentProof: p, status: 'pending' as const, subscriptionCycle: c}; await shadowDB.saveProfile(u); setUser(u); setView('pending_review'); } }} onBack={() => setView('pricing')} />;
      if (view === 'admin') return <AdminDashboard onLogout={handleLogout} onSwitchToUserMode={() => setView('dashboard')} />;
      if (view === 'affiliate' && user) return <AffiliateDashboard user={user} onBack={() => setView('dashboard')} onUpdateUser={setUser} />;
      return null;
  };

  return <>{renderView()}<LiveTickers /><InstallPrompt /><audio id="notification-sound" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" /></>;
};

export default App;