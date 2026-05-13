import React, { useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import ChatInterface from "./components/ChatInterface";
import Pricing from "./components/Pricing";
import Auth from "./components/Auth";
import Payment from "./components/Payment";
import AdminDashboard from "./components/AdminDashboard";
import SecurityGate from "./components/SecurityGate";
import AffiliateDashboard from "./components/AffiliateDashboard";
import Dashboard from "./components/Dashboard";
import LiveTickers from "./components/LiveTickers";
import InstallPrompt from "./components/InstallPrompt";
import WorkspaceExplorer from "./components/WorkspaceExplorer";
import { AssistantWidget } from "./components/AssistantWidget";
import { FloatingShadowAvatar } from "./components/FloatingShadowAvatar";
import SpaceCanvas from "./components/SpaceCanvas";
import { shadowDB, DBMessage } from "./services/dbService";
import {
  speakNative,
  stopVoice,
  resumeAudioContext,
  playShadowVoice,
} from "./services/geminiService";
import {
  Loader2,
  Fingerprint,
  ShieldCheck,
  Clock,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "./services/store";
import { cleanupStaleAutonomousTasks } from "./services/autonomousAgentService";
import { setupBackgroundProcessing } from "./services/backgroundTaskService";
import { App as CapacitorApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { showSafeNotification } from "./services/notificationService";

const App: React.FC = () => {
  const {
    view,
    user,
    selectedPlan,
    billingCycle,
    authDefaultTab,
    isAffiliateRegistration,
    isCheckingStatus,
    dashboardAction,
    isAppLocked,
    latestSystemMessage,
    isAuthReady,
    setView,
    setUser,
    setBillingCycle,
    setSelectedPlan,
    setAuthDefaultTab,
    setIsAffiliateRegistration,
    setDashboardAction,
    setIsAppLocked,
    setLatestSystemMessage,
    setIsAuthReady,
    checkSession,
    handleAuthSuccess,
    handleLogout,
    handleGuestAccess,
    handleAdminLogin,
    handleUpgradeRequest,
    handleStartAffiliate,
    checkStatusManual,
  } = useAppStore();

  useEffect(() => {
    const unsub = shadowDB.onAuthStateChanged((firebaseUser) => {
      setIsAuthReady(true);
      const lastEmail = localStorage.getItem("shadow_last_user");

      // Sync check: If Firebase says nobody is logged in, but local cache thinks a real user is logged in
      if (!firebaseUser && lastEmail && lastEmail !== "GUEST") {
        console.warn(
          "[Auth Sync] Cloud identity missing. Auto-nuking stale local cache...",
        );
        shadowDB.nukeLocalDatabase().then(() => {
          window.location.reload();
        });
      }

      // Sync check: If Firebase says someone IS logged in, but local cache is missing (e.g. after clearing storage)
      if (
        firebaseUser &&
        firebaseUser.email &&
        (!lastEmail || lastEmail !== firebaseUser.email)
      ) {
        console.log(
          "[Auth Sync] Cloud identity found but local is missing. Restoring from cloud...",
        );
        localStorage.setItem("shadow_last_user", firebaseUser.email);
        shadowDB.downloadUserCloudData(firebaseUser.email).then(() => {
          checkSession();
        });
      }
    });

    // Capacitor Background Listener
    CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      console.log("App state changed. Is active?", isActive);
      if (!isActive) {
        // App went to background
        // We could schedule a local notification here if needed
      }
    });

    // Request Local Notifications Permission
    LocalNotifications.requestPermissions()
      .then((result) => {
        console.log("Local Notifications Permission:", result.display);
      })
      .catch(() => {});

    setupBackgroundProcessing();

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
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // --- HISTORY & NAVIGATION HANDLER ---
  // Sync store view -> URL
  useEffect(() => {
    const pathMapping: Record<string, string> = {
      dashboard: "/",
      chat: "/chat",
      pricing: "/pricing",
      auth: "/auth",
      payment: "/payment",
      admin: "/admin",
      workspace: "/workspace",
      affiliate: "/affiliate",
      widget: "/widget",
      pending_review: "/pending",
      blocked: "/blocked",
      loading: "/loading",
    };

    const targetPath = pathMapping[view];
    if (targetPath && targetPath !== location.pathname) {
      navigate(targetPath, {
        replace: view === "loading" || view === "dashboard",
      });
    }
  }, [view, navigate]);

  // Sync URL -> store view (Handles Back/Forward buttons)
  useEffect(() => {
    const pathMappingReverse: Record<string, string> = {
      "/": "dashboard",
      "/chat": "chat",
      "/pricing": "pricing",
      "/auth": "auth",
      "/payment": "payment",
      "/admin": "admin",
      "/workspace": "workspace",
      "/affiliate": "affiliate",
      "/widget": "widget",
      "/pending": "pending_review",
      "/blocked": "blocked",
      "/loading": "loading",
    };

    const targetView = pathMappingReverse[location.pathname];
    if (targetView && targetView !== view) {
      setView(targetView as any);
    }
  }, [location.pathname, setView]);

  useEffect(() => {
    const setupAndroidBack = async () => {
      return await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
        if (location.pathname !== "/" && location.pathname !== "/pricing") {
          navigate(-1);
        } else {
          // Fallback
          setView("dashboard");
        }
      });
    };
    const backListenerPromise = setupAndroidBack();

    return () => {
      backListenerPromise.then((l) => l.remove());
    };
  }, [location.pathname, navigate, setView]);

  // Update history state when view specifically changes via UI buttons
  const navigateToView = (newView: any) => {
    setView(newView);
    const pathMapping: Record<string, string> = {
      dashboard: "/",
      chat: "/chat",
      pricing: "/pricing",
      auth: "/auth",
      payment: "/payment",
      admin: "/admin",
      workspace: "/workspace",
      affiliate: "/affiliate",
      widget: "/widget",
      pending_review: "/pending",
      blocked: "/blocked",
      loading: "/loading",
    };
    if (pathMapping[newView]) {
      navigate(pathMapping[newView]);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mode") === "widget") {
      const guestUserStr = localStorage.getItem("shadow_guest_active");
      const lastUser = localStorage.getItem("shadow_last_user");
      if (guestUserStr || (lastUser && lastUser !== "GUEST")) {
        setView("widget");
        return;
      }
    }
    checkSession();
  }, []);

  // --- GLOBAL SYSTEM SYNC & ALARM ENGINE ---
  useEffect(() => {
    // Request Notification Permission
    if (
      "Notification" in window &&
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
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
              role: "system",
              text: `📢 **نداء عام (Shadow Pulse):**\n\n${pulse.text}`,
              timestamp: pulse.timestamp,
            };
            shadowDB.saveMessage(pulseMsg, true).then(() => {
              setLatestSystemMessage(pulseMsg);
              shadowDB.updateLastPulseReceived(user.email, pulse.timestamp);
              setUser({ ...user, lastPulseReceived: pulse.timestamp });
              const audio = document.getElementById(
                "notification-sound",
              ) as HTMLAudioElement;
              if (audio) {
                audio.volume = 1.0;
                audio.play().catch((e) => {});
              }
              speakNative(
                "رسالة هامة من الإدارة",
                user?.voicePreference || "male",
              );
            });
          }
        }
      },
      (rules) => {
        console.log("[System] Global rules updated.");
      },
    );

    // ALARM CHECKER
    let isChecking = false;
    let timeoutId: any;
    let loopCount = 0;
    const runBackgroundChecks = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        loopCount++;
        const now = Date.now();
        const uid = user.email || "GUEST";
        
        if (loopCount % 60 === 0 && uid !== "GUEST") {
            cleanupStaleAutonomousTasks(uid).catch(console.error);
        }

        const allTasks = await shadowDB.getTasks(uid);

        const dueTasks = allTasks.filter(
          (t) =>
            t.status === "pending" &&
            !t.notified &&
            t.executionTime &&
            t.executionTime <= now,
        );

        if (dueTasks.length > 0) {
          const task = dueTasks[0];
          // Clear simple text for TTS
          const cleanTask = task.task.replace(
            /[^a-zA-Z\u0600-\u06FF0-9 ]/g,
            "",
          );
          const reminderText = `تنبيه يا ريس.. ميعاد ${cleanTask} جه.`;

          console.log("ALARM TRIGGERED:", task.task);

          // 1. Ensure Audio Context is active
          resumeAudioContext();

          // 2. Play Beep
          const audio = document.getElementById(
            "notification-sound",
          ) as HTMLAudioElement;
          if (audio) {
            audio.volume = 1.0;
            audio.currentTime = 0;
            audio.play().catch((e) => console.warn("Alarm beep blocked", e));
          }

          // 3. Play Natural Voice (Fallback to native only if offline/error is handled inside playShadowVoice)
          playShadowVoice(
            reminderText,
            user.voicePreference === "female" ? "female" : "male",
          );

          // 4. Show Native/Web Notification
          try {
            LocalNotifications.schedule({
              notifications: [
                {
                  title: "تنبيه من الظل",
                  body: task.task,
                  id: Date.now(),
                  schedule: { at: new Date(Date.now() + 1000) },
                  sound: null,
                  attachments: null,
                  actionTypeId: "",
                  extra: null,
                },
              ],
            });
          } catch (e) {
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              showSafeNotification("تنبيه من الظل", {
                body: task.task,
                icon: "/icon.png",
              });
            }
          }

          // 5. Save Message
          const alarmMsg: DBMessage = {
            userId: uid,
            role: "system",
            text: `🔔 **تنبيه:** ${task.task}`,
            timestamp: Date.now(),
          };
          await shadowDB.saveMessage(alarmMsg, true);
          setLatestSystemMessage(alarmMsg);

          // 6. Mark Done or Reschedule
          if (task.recurring) {
              const nextTime = Date.now() + 24 * 60 * 60 * 1000; // Reschedule for next day (24 hours) by default
              await shadowDB.updateTaskStatus(task.id!, { notified: false, executionTime: nextTime });
          } else {
              await shadowDB.updateTaskStatus(task.id!, { notified: true, status: "completed" });
          }
        }
      } finally {
        isChecking = false;
        timeoutId = setTimeout(runBackgroundChecks, 1000);
      }
    };

    runBackgroundChecks();
    return () => {
      clearTimeout(timeoutId);
      stopVoice();
      shadowDB.unsubscribeSystem();
    };
  }, [user?.email, user?.phone, isAuthReady]);

  // --- ADMIN NOTIFIER ---
  useEffect(() => {
    if (user && user.email === "admin@shadow.com") {
      const interval = setInterval(async () => {
        const lastCheck = (await shadowDB.getConfig("last_admin_check")) || 0;
        const allProfiles = await shadowDB.getAllProfiles();
        const newPending = allProfiles.filter(
          (p) =>
            p.status === "pending" && p.paymentProof && p.joinedAt > lastCheck,
        );
        const allFeedback = await shadowDB.getAllFeedback();
        const newFeedback = allFeedback.filter((f) => f.timestamp > lastCheck);

        if (newPending.length > 0 || newFeedback.length > 0) {
          let msgText = "🔴 **تقرير عمليات (New Alert)**:\n";
          if (newPending.length > 0)
            msgText += `\n📌 **طلبات اشتراك جديدة (${newPending.length})**`;
          if (newFeedback.length > 0)
            msgText += `\n💬 **رسائل رأي جديدة (${newFeedback.length})**`;

          const adminMsg: DBMessage = {
            userId: "admin@shadow.com",
            role: "system",
            text: msgText,
            timestamp: Date.now(),
          };
          await shadowDB.saveMessage(adminMsg, true);
          setLatestSystemMessage(adminMsg);
          await shadowDB.setConfig("last_admin_check", Date.now());
          const audio = document.getElementById(
            "notification-sound",
          ) as HTMLAudioElement;
          if (audio) {
            audio.play().catch((e) => {});
          }
          speakNative("تنبيه إداري جديد", user?.voicePreference || "male");
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (view === "pending_review" && user && user.tier === "sovereign") {
      interval = setInterval(async () => {
        checkStatusManual();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [view, user]);

  const handleChatNavigation = (section: string) => {
    if (section === "vault") {
      setDashboardAction("open_vault");
      navigateToView("dashboard");
    } else if (section === "affiliate") {
      navigateToView("affiliate");
    } else if (section === "pricing") {
      handleUpgradeRequest();
    } else if (section === "nexus") {
      setDashboardAction("open_nexus");
      navigateToView("dashboard");
    } else if (section === "workspace") {
      navigateToView("workspace");
    } else if (section === "admin") {
      navigateToView("admin");
    }
  };

  const isAdminUser = user
    ? user.email === "TITO" ||
      user.email === "tito@shadow.com" ||
      user.email === "admin@shadow.com" ||
      user.email === "ahmed.atya.daif@gmail.com" ||
      (user.tier === "sovereign" && user.name.includes("تيتو"))
    : false;

  const renderView = () => {
    return (
      <Routes>
        <Route
          path="/loading"
          element={
            <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-center text-white font-['Cairo']">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-purple-600 blur-[100px] opacity-20 animate-pulse"></div>
                <div className="relative z-10 p-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                  <Fingerprint className="w-16 h-16 text-purple-500 animate-pulse" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-white/90 tracking-tighter mb-2">
                جاري استعادة الاتصال...
              </h1>
            </div>
          }
        />

        <Route
          path="/"
          element={
            user ? (
              isAppLocked ? (
                <SecurityGate
                  user={user}
                  onUnlock={() => setIsAppLocked(false)}
                  onLogout={isAdminUser ? () => setView("admin") : handleLogout}
                />
              ) : (
                <Dashboard
                  user={user}
                  initialAction={dashboardAction}
                  onClearAction={() => setDashboardAction(null)}
                  onOpenChat={() => navigateToView("chat")}
                  onOpenAffiliate={() => navigateToView("affiliate")}
                  onLogout={
                    isAdminUser ? () => navigateToView("admin") : handleLogout
                  }
                  onUpgrade={handleUpgradeRequest}
                  onStartAffiliate={handleStartAffiliate}
                  onOpenWorkspace={() => navigateToView("workspace")}
                />
              )
            ) : (
              <Navigate to="/pricing" replace />
            )
          }
        />

        <Route
          path="/chat"
          element={
            user ? (
              isAppLocked ? (
                <SecurityGate
                  user={user}
                  onUnlock={() => setIsAppLocked(false)}
                  onLogout={isAdminUser ? () => setView("admin") : handleLogout}
                />
              ) : (
                <div className="fixed inset-0 bg-transparent text-white font-['Cairo'] overflow-hidden">
                  <ChatInterface
                    onBack={() => navigateToView("dashboard")}
                    onNavigateTo={handleChatNavigation}
                  />
                </div>
              )
            ) : (
              <Navigate to="/pricing" replace />
            )
          }
        />

        <Route
          path="/pricing"
          element={
            <Pricing
              onSelectPlan={(plan, cycle) => {
                setSelectedPlan(plan);
                if (cycle) setBillingCycle(cycle);
                setIsAffiliateRegistration(false);
                setAuthDefaultTab("register");
                navigateToView("auth");
              }}
              onTrialStart={handleGuestAccess}
              onAffiliateStart={() => {
                setIsAffiliateRegistration(true);
                setAuthDefaultTab("register");
                navigateToView("auth");
              }}
            />
          }
        />

        <Route
          path="/auth"
          element={
            <Auth
              selectedPlan={selectedPlan}
              defaultTab={authDefaultTab}
              isAffiliateRegistration={isAffiliateRegistration}
              billingCycle={billingCycle}
              onAuthSuccess={handleAuthSuccess}
              onAdminLogin={handleAdminLogin}
              onBack={() => navigateToView("pricing")}
            />
          }
        />

        <Route
          path="/payment"
          element={
            <Payment
              planId={selectedPlan}
              billingCycle={billingCycle}
              onSuccess={async (proof, finalCycle) => {
                if (user && user.email !== "GUEST") {
                  const updatedUser = {
                    ...user,
                    paymentProof: proof,
                    status: "pending" as const,
                    subscriptionCycle: finalCycle,
                  };
                  try {
                    await shadowDB.saveProfile(updatedUser);
                    setUser(updatedUser);
                    navigateToView("pending_review");
                  } catch (e) {
                    console.error(e);
                  }
                }
              }}
              onBack={() => navigateToView("auth")}
            />
          }
        />

        <Route
          path="/admin"
          element={
            <AdminDashboard
              onLogout={handleLogout}
              onSwitchToUserMode={() => navigateToView("dashboard")}
              onNavigateTo={(v) =>
                navigateToView(
                  v as "dashboard" | "chat" | "pricing" | "auth" | "admin",
                )
              }
            />
          }
        />

        <Route
          path="/workspace"
          element={
            user ? (
              <WorkspaceExplorer
                userId={user.email}
                onItemSelect={(item) => console.log("Selected item:", item)}
                onBack={() => navigateToView("dashboard")}
              />
            ) : (
              <Navigate to="/pricing" replace />
            )
          }
        />

        <Route
          path="/affiliate"
          element={
            user ? (
              <AffiliateDashboard
                user={user}
                onBack={() => navigateToView("dashboard")}
                onUpdateUser={setUser}
              />
            ) : (
              <Navigate to="/pricing" replace />
            )
          }
        />

        <Route
          path="/widget"
          element={
            user ? (
              <AssistantWidget
                user={user}
                onOpenApp={() => (window.location.search = "")}
              />
            ) : (
              <Navigate to="/pricing" replace />
            )
          }
        />

        <Route
          path="/pending"
          element={
            <div className="fixed inset-0 bg-transparent flex items-center justify-center p-6 font-['Cairo'] text-white">
              <div className="max-w-md w-full glass p-10 rounded-[40px] border border-amber-500/20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black mb-3 text-white">
                    جاري المراجعة
                  </h2>
                  <p className="text-white/50 text-sm mb-8 leading-relaxed">
                    طلبك وصل للعمليات. <br />
                    يتم الآن مراجعة إيصال الدفع وتفعيل حسابك.
                    <span className="block mt-2 text-amber-400 font-bold text-xs">
                      متوسط وقت الانتظار: 10 دقائق
                    </span>
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={checkStatusManual}
                      disabled={isCheckingStatus}
                      className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isCheckingStatus ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      تحديث الحالة الآن
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> خروج مؤقت
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        />

        <Route
          path="/blocked"
          element={
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center text-center p-8 text-white font-['Cairo']">
              <div>
                <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-black mb-2">الحساب معلق</h1>
                <button
                  onClick={() => navigateToView("pricing")}
                  className="mt-8 px-6 py-3 bg-white/10 rounded-xl"
                >
                  عودة
                </button>
              </div>
            </div>
          }
        />

        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/pricing"} replace />}
        />
      </Routes>
    );
  };

  return (
    <>
      <SpaceCanvas interactive={true} showEarth={true} />
      <div className="relative z-10 h-full w-full pointer-events-none">
        <div className="pointer-events-auto h-full w-full">
          <LiveTickers />
          <InstallPrompt />
          {renderView()}
        </div>
      </div>
      
      {/* Floating Maestro Avatar */}
      <FloatingShadowAvatar user={user} onNavigateChat={() => navigateToView("chat")} hide={view === 'chat' || location.pathname === '/chat' || location.pathname.startsWith('/chat/')} />

      <audio
        id="notification-sound"
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        preload="auto"
      />
    </>
  );
};

export default App;
