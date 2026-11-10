import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Mail, ArrowLeft, Ghost, Loader2, Eye, EyeOff, Diamond, DollarSign, KeyRound, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';
import { shadowDB, UserProfile } from '../services/dbService';

interface Props {
  selectedPlan: string;
  defaultTab?: 'login' | 'register';
  isAffiliateRegistration?: boolean; 
  billingCycle?: 'monthly' | 'yearly';
  onAuthSuccess: (user: UserProfile) => void;
  onAdminLogin: () => void;
  onBack: () => void;
}

const Auth: React.FC<Props> = ({ selectedPlan, defaultTab = 'login', isAffiliateRegistration = false, billingCycle = 'monthly', onAuthSuccess, onAdminLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(defaultTab === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    setIsLogin(defaultTab === 'login');
    const lastUser = localStorage.getItem('shadow_last_user');
    if (lastUser && lastUser.includes('@') && defaultTab === 'login') {
        setEmail(lastUser);
    }
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);
  }, [defaultTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
        // --- MASTER ADMIN FIREBASE CHECK ---
        if ((email || '').toLowerCase() === 'admin@shadow.com') {
             // Firebase requires at least 6 characters for a password
             const firebasePassword = password === 'admin' ? 'admin123' : password;

             try {
                 await shadowDB.loginUser(email, firebasePassword);
                 setTimeout(() => { onAdminLogin(); setIsLoading(false); }, 500);
                 return;
             } catch (e: any) {
                 const errMsg = e.message || '';
                 // If user genuinely not found, create the admin account
                 if (errMsg.includes('user-not-found') || errMsg.includes('invalid-credential') || errMsg.includes('auth/invalid-login-credentials')) {
                      if (password === 'admin') {
                          try {
                              await shadowDB.registerUser(email, firebasePassword, 'تيتو (الماستر)', false);
                              
                              // Make sure they have a sovereign profile 
                              let adminProfile = await shadowDB.getProfile(email.toLowerCase());
                              if (adminProfile) {
                                  adminProfile.tier = 'sovereign';
                                  adminProfile.name = 'تيتو (الماستر)';
                                  await shadowDB.saveProfile(adminProfile, true);
                              }
                              
                              setTimeout(() => { onAdminLogin(); setIsLoading(false); }, 500);
                              return;
                          } catch(err: any) {
                              if (err.message?.includes('email-already-in-use')) {
                                  setError('كلمة المرور غير صحيحة.');
                                  setIsLoading(false);
                                  return;
                              }
                              console.warn("Firebase Error", err);
                              // OFFLINE FALLBACK FOR ADMIN
                              let adminProfile = await shadowDB.getProfile(email.toLowerCase());
                              if (!adminProfile) {
                                  adminProfile = { 
                                      email: 'admin@shadow.com', 
                                      phone: 'admin@shadow.com',
                                      uid: 'ADMIN_OFFLINE_UID',
                                      status: 'active',
                                      joinedAt: Date.now(),
                                      tier: 'sovereign',
                                      name: 'تيتو (الماستر)',
                                      shadowName: 'الماستر',
                                      affiliate: { isMarketer: true, referralCode: 'ADMIN_BOSS', totalEarnings: 0, referralsCount: 0, payoutHistory: [] }
                                  };
                                  await shadowDB.saveProfile(adminProfile, true);
                              }
                              setTimeout(() => { onAdminLogin(); setIsLoading(false); }, 500);
                              return;
                          } 
                      }
                 }
                 
                 setError(`فشل التسجيل: ${e.message || 'مشكلة في الإتصال'}`);
                 setIsLoading(false);
                 return;
             }
        }

        if (isLogin) {
            // --- USER LOGIN FLOW ---
            const user = await shadowDB.loginUser(email, password);
            if (user.status === 'blocked') {
                setError('تم تجميد هذا الحساب. يرجى التواصل مع الدعم.');
                setIsLoading(false);
                return;
            }
            onAuthSuccess(user);
        } else {
            // --- REGISTRATION FLOW ---
            if (password.length < 6) {
                setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
                setIsLoading(false);
                return;
            }

            const newUser = await shadowDB.registerUser(
                email, 
                password, 
                name, 
                isAffiliateRegistration, 
                referralCode || undefined
            );
            
            onAuthSuccess(newUser);
        }
    } catch (e: any) { 
        console.error("Auth System Error:", e);
        if (e.message?.includes('auth/email-already-in-use')) setError('البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول.');
        else if (e.message?.includes('auth/invalid-credential') || e.message?.includes('auth/wrong-password') || e.message?.includes('auth/user-not-found')) setError('البريد أو كلمة المرور غير صحيحة.');
        else if (e.message?.includes('auth/too-many-requests')) setError('محاولات كثيرة خاطئة. حاول لاحقاً.');
        else if (e.message?.includes('network')) setError('خطأ في الاتصال. تأكد من الإنترنت.');
        else setError('حدث خطأ غير متوقع. حاول مرة أخرى.'); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleForgotPassword = async () => {
      if (!email || !email.includes('@')) {
          setError('يرجى كتابة البريد الإلكتروني أولاً.');
          return;
      }
      setIsLoading(true);
      try {
          await shadowDB.resetPassword(email);
          setSuccessMsg('تم إرسال رابط إعادة التعيين لبريدك الإلكتروني.');
          setError('');
      } catch (e: any) {
          setError('فشل الإرسال. تأكد أن البريد مسجل وصحيح.');
      } finally {
          setIsLoading(false);
      }
  };

  const handleGoogleLogin = async () => {
      setError('');
      setSuccessMsg('');
      setIsLoading(true);
      try {
          const user = await shadowDB.loginWithGoogle(isAffiliateRegistration, referralCode || undefined);
          if (user.status === 'blocked') {
              setError('تم تجميد هذا الحساب. يرجى التواصل مع الدعم.');
              setIsLoading(false);
              return;
          }
          onAuthSuccess(user);
      } catch (e: any) {
          console.error("Google Auth Error:", e);
          if (e.message?.includes('popup-closed-by-user')) {
              setError('تم إغلاق نافذة تسجيل الدخول بجوجل قبل إتمام العملية.');
          } else if (e.message?.includes('operation-not-allowed')) {
              setError('يرجى تفعيل Google Sign-In من لوحة تحكم Firebase Authentication.');
          } else {
              setError(`تعذر تسجيل الدخول بجوجل: ${e.message || 'تأكد من تفعيل Google في Firebase'}`);
          }
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-transparent font-['Cairo'] relative overflow-y-auto overflow-x-hidden">
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-white/30 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> العودة
        </button>

        <div className="text-center mb-10">
            <div className={`relative inline-flex p-1 rounded-[32px] border shadow-2xl mb-6 ${isAffiliateRegistration ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <img src="https://i.ibb.co/fYp5VRYb/1000053833.jpg" alt="Logo" className="w-24 h-24 rounded-[28px] object-cover shadow-inner" />
                {isAffiliateRegistration && <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black p-1.5 rounded-full border border-black"><DollarSign className="w-4 h-4" /></div>}
            </div>
            <h1 className="text-3xl font-black italic text-white mb-2 tracking-tighter">
                {isLogin ? 'العودة للظل' : (isAffiliateRegistration ? 'تسجيل مسوق' : 'بوابة الأعضاء')}
            </h1>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">
                {isLogin ? 'Welcome Back, Sovereign' : (isAffiliateRegistration ? 'Join The Family Business' : 'Secure Access Point')}
            </p>
            {referralCode && <p className="text-emerald-400 text-xs mt-2 font-bold animate-pulse">دعوة خاصة مفعلة ✅</p>}
        </div>

        <div className="glass rounded-[48px] p-8 border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl">
            {error && <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
            {successMsg && <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> {successMsg}</div>}

            <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${isLogin ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}>دخول</button>
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}>
                    {isAffiliateRegistration ? 'مسوق جديد' : 'عضو جديد'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <>
                        <div className="relative group animate-in slide-in-from-right-2">
                            <User className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                            <input type="text" required placeholder="الاسم الكامل" className="w-full bg-white/5 border border-white/10 rounded-[24px] py-4 pr-14 pl-6 text-white text-sm focus:border-white/30 transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                    </>
                )}
                <div className="relative group">
                    <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                        type="email" 
                        required 
                        placeholder="البريد الإلكتروني" 
                        className="w-full bg-white/5 border border-white/10 rounded-[24px] py-4 pr-14 pl-6 text-white text-sm focus:border-white/30 transition-colors font-mono" 
                        dir="ltr" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                </div>
                <div className="relative group">
                    <KeyRound className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        placeholder={isLogin ? "كلمة المرور" : "إنشاء كلمة مرور"}
                        className="w-full bg-white/5 border border-white/10 rounded-[24px] py-4 pr-14 pl-14 text-white text-sm focus:border-white/30 transition-colors font-mono" 
                        dir="ltr"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>

                {isLogin && (
                    <div className="flex justify-end">
                        <button type="button" onClick={handleForgotPassword} className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" /> نسيت كلمة السر؟
                        </button>
                    </div>
                )}

                <button disabled={isLoading} className={`w-full py-5 hover:bg-white/90 rounded-[24px] text-black font-black text-lg flex items-center justify-center gap-4 transition-all shadow-xl group mt-2 active:scale-95 ${isAffiliateRegistration && !isLogin ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-white'}`}>
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>{isLogin ? 'فتح السيستم' : (isAffiliateRegistration ? 'ابدأ البيزنس' : 'إرسال الطلب')}</span>}
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-3 text-white/30 text-[10px] font-bold">أو المتابعة السريعة عبر</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-4 rounded-[24px] bg-[#04091a] hover:bg-[#081230] border border-cyan-500/40 text-white font-black text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_25px_rgba(6,182,212,0.2)] active:scale-95"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                        <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z" />
                        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z" />
                    </svg>
                    <span>تسجيل الدخول بحساب Google</span>
                </button>
            </form>
            <p className="text-center text-white/10 text-[8px] mt-6 font-black tracking-widest uppercase">Secured by Firebase Auth • Encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;