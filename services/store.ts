import { create } from 'zustand';
import { UserProfile, DBMessage, shadowDB } from './dbService';
import { isMasterAdminEmail } from './adminIdentity';

export type ViewState = 'loading' | 'pricing' | 'auth' | 'payment' | 'dashboard' | 'chat' | 'admin' | 'blocked' | 'pending_review' | 'affiliate' | 'workspace' | 'widget';

interface AppState {
  view: ViewState;
  user: UserProfile | null;
  selectedPlan: string;
  billingCycle: 'monthly' | 'yearly';
  authDefaultTab: 'login' | 'register';
  isAffiliateRegistration: boolean;
  isCheckingStatus: boolean;
  dashboardAction: string | null;
  isAppLocked: boolean;
  latestSystemMessage: DBMessage | null;
  isAuthReady: boolean;
  runningTasks: number;

  // Setters
  setView: (view: ViewState) => void;
  setUser: (user: UserProfile | null) => void;
  setSelectedPlan: (plan: string) => void;
  setBillingCycle: (cycle: 'monthly' | 'yearly') => void;
  setAuthDefaultTab: (tab: 'login' | 'register') => void;
  setIsAffiliateRegistration: (val: boolean) => void;
  setIsCheckingStatus: (val: boolean) => void;
  setDashboardAction: (action: string | null) => void;
  setIsAppLocked: (val: boolean) => void;
  setLatestSystemMessage: (msg: DBMessage | null) => void;
  setIsAuthReady: (val: boolean) => void;
  setRunningTasks: (val: number) => void;

  // Complex Actions
  checkSession: () => Promise<void>;
  handleAuthSuccess: (profile: UserProfile) => void;
  handleLogout: () => void;
  handleGuestAccess: () => void;
  handleAdminLogin: () => Promise<void>;
  handleUpgradeRequest: () => void;
  handleStartAffiliate: () => void;
  checkStatusManual: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'loading',
  user: null,
  selectedPlan: 'elite',
  billingCycle: 'monthly',
  authDefaultTab: 'login',
  isAffiliateRegistration: false,
  isCheckingStatus: false,
  dashboardAction: null,
  isAppLocked: true,
  latestSystemMessage: null,
  isAuthReady: false,
  runningTasks: 0,

  setView: (view) => set({ view }),
  setUser: (user) => set({ user }),
  setSelectedPlan: (selectedPlan) => set({ selectedPlan }),
  setBillingCycle: (billingCycle) => set({ billingCycle }),
  setAuthDefaultTab: (authDefaultTab) => set({ authDefaultTab }),
  setIsAffiliateRegistration: (isAffiliateRegistration) => set({ isAffiliateRegistration }),
  setIsCheckingStatus: (isCheckingStatus) => set({ isCheckingStatus }),
  setDashboardAction: (dashboardAction) => set({ dashboardAction }),
  setIsAppLocked: (isAppLocked) => set({ isAppLocked }),
  setLatestSystemMessage: (latestSystemMessage) => set({ latestSystemMessage }),
  setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
  setRunningTasks: (runningTasks) => set({ runningTasks }),

  checkSession: async () => {
    try {
      const lastUserEmail = localStorage.getItem('shadow_last_user');
      const guestSession = localStorage.getItem('shadow_guest_active');

      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      const preserveChatView = currentPath === '/chat' || currentPath.startsWith('/chat/') || sessionStorage.getItem('jarvis_battlestation_open') === 'true';

      if (lastUserEmail && lastUserEmail !== 'GUEST') {
          const profile = await shadowDB.getProfile(lastUserEmail);
          if (profile) {
              set({ user: profile });
              
              // Pull cloud history in the background without blocking app startup
              shadowDB.downloadUserCloudData(lastUserEmail).catch(() => {});

              if (profile.status === 'active') {
                 if (isMasterAdminEmail(profile.email)) {
                     try { localStorage.setItem('tito_admin_master', 'true'); } catch {}
                 }
                 if (preserveChatView) {
                     set({ view: 'chat', isAppLocked: false });
                 } else if (isMasterAdminEmail(profile.email) && currentPath === '/admin') {
                     set({ view: 'admin', isAppLocked: false });
                 } else {
                     set({ view: 'dashboard', isAppLocked: false });
                 }
                 return;
              } else if (profile.status === 'pending') {
                 if (profile.paymentProof) {
                     set({ view: 'pending_review' });
                 } else {
                     set({ view: 'payment' });
                 }
                 return;
              }
          }
      }

      if (guestSession === 'true') {
        const guestUser: UserProfile = { email: 'GUEST', phone: 'GUEST', name: 'ضيف', tier: 'lite', status: 'active', joinedAt: Date.now() };
        set({ user: guestUser, view: preserveChatView ? 'chat' : 'dashboard', isAppLocked: false });
        return;
      }

      // Preserve explicit route navigation on /auth, /admin (handled by route guard), /jarvis, or /client/:slug
      if (
        currentPath === '/auth' ||
        currentPath === '/admin' ||
        currentPath === '/jarvis' ||
        currentPath.startsWith('/client/')
      ) {
        return;
      }
      
      set({ view: 'pricing' });
    } catch (e) {
      set({ view: 'pricing' });
    }
  },

  handleAuthSuccess: (profile: UserProfile) => {
    set({ user: profile, latestSystemMessage: null });
    localStorage.setItem('shadow_last_user', profile.email);

    if (localStorage.getItem('shadow_guest_history')) {
        localStorage.removeItem('shadow_guest_history');
        localStorage.removeItem('shadow_guest_active');
    }
    
    // Start the proactive sentinel locally
    if (profile.email !== 'GUEST') {
        import('./autonomousAgentService').then(mod => {
            mod.startProactiveSentinel(profile.email);
        });
    }

    const alreadyInChat = typeof window !== 'undefined' && (window.location.pathname === '/chat' || get().view === 'chat');

    if (isMasterAdminEmail(profile.email)) {
        try { localStorage.setItem('tito_admin_master', 'true'); } catch {}
        set({ view: alreadyInChat ? 'chat' : 'admin', isAppLocked: false });
        // NOTE: Admin sets `isAppLocked: false`, bypassing SecurityGate
        return;
    }

    if (profile.tier === 'lite' && profile.affiliate?.isMarketer) {
         set({ view: alreadyInChat ? 'chat' : 'dashboard', isAppLocked: false });
         return;
    }

    if (profile.status === 'active') {
        set({ view: alreadyInChat ? 'chat' : 'dashboard', isAppLocked: false });
    } else if (profile.status === 'pending') {
        if (profile.paymentProof) set({ view: 'pending_review' });
        else set({ view: 'payment' });
    } else {
        set({ view: 'blocked' });
    }
  },

  handleLogout: () => {
      shadowDB.logout(); 
      localStorage.removeItem('shadow_guest_active');
      localStorage.removeItem('shadow_last_user');
      localStorage.removeItem('t2os_admin_token');
      localStorage.removeItem('tito_admin_master');
      set({ user: null, latestSystemMessage: null, view: 'pricing' });
  },

  handleGuestAccess: () => {
      localStorage.setItem('shadow_guest_active', 'true');
      if (!localStorage.getItem('shadow_guest_start')) {
          localStorage.setItem('shadow_guest_start', Date.now().toString());
      }
      const guestUser: UserProfile = { email: 'GUEST', phone: 'GUEST', name: 'ضيف', tier: 'lite', status: 'active', joinedAt: Date.now() };
      set({ user: guestUser, latestSystemMessage: null, view: 'dashboard', isAppLocked: false });
  },

  handleAdminLogin: async () => {
      let adminProfile = await shadowDB.getProfile('admin@shadow.com');
      if (!adminProfile) {
          adminProfile = { 
              email: 'admin@shadow.com', 
              phone: 'admin',
              name: 'تيتو', 
              shadowName: 'تيتو', 
              tier: 'sovereign', 
              status: 'active', 
              joinedAt: Date.now(),
              affiliate: {
                  isMarketer: true,
                  referralCode: 'tito123',
                  totalEarnings: 0,
                  referralsCount: 0,
                  payoutHistory: []
              }
          };
          await shadowDB.saveProfile(adminProfile);
      }
      get().handleAuthSuccess(adminProfile);
  },

  handleUpgradeRequest: () => {
      localStorage.removeItem('shadow_guest_active');
      set({ 
          user: null, 
          latestSystemMessage: null, 
          selectedPlan: 'elite', 
          isAffiliateRegistration: false, 
          authDefaultTab: 'register', 
          view: 'auth' 
      });
  },

  handleStartAffiliate: () => {
      const { user } = get();
      if (user?.email === 'GUEST') {
        localStorage.removeItem('shadow_guest_active');
        set({ user: null, latestSystemMessage: null });
        set({ isAffiliateRegistration: true, authDefaultTab: 'register', view: 'auth' });
      } else if (user && user.status === 'active') {
          // If the user connects to affiliate system and logged in
          set({ view: 'affiliate' });
      } else {
          set({ isAffiliateRegistration: true, authDefaultTab: 'register', view: 'auth' });
      }
  },

  checkStatusManual: async () => {
      const { user } = get();
      if (!user) return;
      set({ isCheckingStatus: true });
      const updatedProfile = await shadowDB.getProfile(user.email);
      if (updatedProfile && updatedProfile.status === 'active') {
          const keepCurrentView = typeof window !== 'undefined' && ['/chat', '/admin', '/affiliate', '/workspace'].includes(window.location.pathname);
          set({ user: updatedProfile, view: keepCurrentView ? get().view : 'dashboard' });
      }
      setTimeout(() => set({ isCheckingStatus: false }), 1000);
  }
}));
