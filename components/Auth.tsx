import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Phone, ArrowLeft, Ghost, Loader2, Eye, EyeOff, Diamond, DollarSign, KeyRound } from 'lucide-react';
import { shadowDB, UserProfile } from '../services/dbService';

interface Props {
  selectedPlan: string;
  defaultTab?: 'login' | 'register';
  isAffiliateRegistration?: boolean; 
  billingCycle?: 'monthly' | 'yearly'; // New Prop
  onAuthSuccess: (user: UserProfile) => void;
  onAdminLogin: () => void;
  onBack: () => void;
}

const Auth: React.FC<Props> = ({ selectedPlan, defaultTab = 'login', isAffiliateRegistration = false, billingCycle = 'monthly', onAuthSuccess, onAdminLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(defaultTab === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [shadowName, setShadowName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    setIsLogin(defaultTab === 'login');
    // Auto-fill phone if available in local storage (Simulating "Remembered User")
    const lastPhone = localStorage.getItem('shadow_last_user');
    if (lastPhone && defaultTab === 'login') {
        setPhone(lastPhone);
    }

    // Check URL for ref
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);
  }, [defaultTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if ((phone === '01000000000' || phone.toUpperCase() === 'TITO') && password === 'admin') {
        setTimeout(() => { onAdminLogin(); setIsLoading(false); }, 1000);
        return;
    }

    try {
        const existing = await shadowDB.getProfile(phone);
        
        if (isLogin) {
            // --- LOGIN FLOW ---
            if (!existing) { setError('هذا الرقم غير مسجل. سجل عضوية جديدة.'); setIsLoading(false); return; }
            if (existing.password !== password) { setError('مفتاح المرور غير صحيح.'); setIsLoading(false); return; }
            onAuthSuccess(existing);
        } else {
            // --- REGISTRATION FLOW ---
            
            // Generate Affiliate Data Helper
            const generateAffiliateData = (userName: string) => ({
                isMarketer: true,
                referralCode: (userName.substring(0,3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(),
                totalEarnings: 0,
                referralsCount: 0,
                payoutHistory: []
            });

            if (existing) {
                // SCENARIO 1: Existing User trying to become a MARKETER
                if (isAffiliateRegistration) {
                    if (existing.affiliate?.isMarketer) {
                        setError('لديك حساب مسوق بالفعل. سجل دخولك.');
                        setIsLogin(true);
                        setIsLoading(false);
                        return;
                    }
                    
                    const updatedUser: UserProfile = {
                        ...existing,
                        affiliate: generateAffiliateData(existing.name)
                    };
                    await shadowDB.saveProfile(updatedUser);
                    onAuthSuccess(updatedUser);
                    return;
                }

                // SCENARIO 2: Existing Marketer (Lite) trying to become a MEMBER (Sovereign)
                if (!isAffiliateRegistration) {
                    if (existing.tier === 'sovereign') {
                        setError('أنت مشترك بالفعل. سجل دخولك.');
                        setIsLogin(true);
                        setIsLoading(false);
                        return;
                    }

                    const updatedUser: UserProfile = {
                        ...existing,
                        name: name || existing.name, 
                        password: password, 
                        shadowName: shadowName || existing.shadowName || 'الظل',
                        tier: 'sovereign',
                        status: 'pending', 
                        subscriptionCycle: billingCycle as 'monthly' | 'yearly',
                        commissionPaid: false
                    };
                    await shadowDB.saveProfile(updatedUser);
                    onAuthSuccess(updatedUser);
                    return;
                }
            }

            // SCENARIO 3: Brand New User (Create)
            let affiliateData = undefined;
            if (isAffiliateRegistration) {
                affiliateData = generateAffiliateData(name);
            }

            const newUser: UserProfile = {
                phone, name, 
                shadowName: isAffiliateRegistration ? 'Marketer' : (shadowName || 'الظل'),
                voicePreference: 'male', password, 
                tier: isAffiliateRegistration ? 'lite' : 'sovereign',
                status: isAffiliateRegistration ? 'active' : 'pending', 
                joinedAt: Date.now(),
                referredBy: referralCode || undefined,
                affiliate: affiliateData,
                subscriptionCycle: isAffiliateRegistration ? undefined : (billingCycle as 'monthly' | 'yearly'),
                commissionPaid: false
            };

            await shadowDB.saveProfile(newUser);
            onAuthSuccess(newUser);
        }
    } catch (e) { setError('خطأ في النظام.'); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#020202] font-['Cairo'] relative overflow-hidden">
      
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

        <div className="glass rounded-[48px] p-8 border border-white/10 shadow-2xl bg-[#080808]">
            {error && <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">{error}</div>}

            <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${isLogin ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}>دخول (عضو حالي)</button>
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}>
                    {isAffiliateRegistration ? 'حساب مسوق' : 'عضو جديد'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <>
                        <div className="relative group animate-in slide-in-from-right-2">
                            <User className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                            <input type="text" required placeholder="الاسم الكامل" className="w-full bg-white/5 border border-white/10 rounded-[24px] py-4 pr-14 pl-6 text-white text-sm focus:border-white/30 transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        
                        {!isAffiliateRegistration && (
                            <div className="relative group animate-in slide-in-from-right-2 delay-75">
                                <Ghost className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                <input type="text" placeholder="اسم مساعدك (اختياري)" className="w-full bg-white/5 border border-white/10 rounded-[24px] py-4 pr-14 pl-6 text-white text-sm focus:border-white/30 transition-colors" value={shadowName} onChange={(e) => setShadowName(e.target.value)} />
                            </div>
                        )}
                    </>
                )}
                <div className="relative group">
                    <Phone className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                        type="tel" 
                        required 
                        placeholder="رقم الهاتف" 
                        className="w-full bg-white/5 border border-white/10 rounded-[24px] py-4 pr-14 pl-6 text-white text-sm focus:border-white/30 transition-colors font-mono" 
                        dir="ltr" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                    />
                </div>
                <div className="relative group">
                    <KeyRound className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        placeholder={isLogin ? "مفتاح المرور (Secure Key)" : "إنشاء مفتاح مرور"}
                        className="w-full bg-white/5 border border-white/10 rounded-[24px] py-4 pr-14 pl-14 text-white text-sm focus:border-white/30 transition-colors font-mono" 
                        dir="ltr"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>

                {/* Implicit "Keep me logged in" text */}
                <div className="flex items-center justify-center gap-2 mt-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-white/30 font-bold">جلسة آمنة (سيتم حفظ الدخول)</span>
                </div>

                <button disabled={isLoading} className={`w-full py-5 hover:bg-white/90 rounded-[24px] text-black font-black text-lg flex items-center justify-center gap-4 transition-all shadow-xl group mt-2 active:scale-95 ${isAffiliateRegistration && !isLogin ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-white'}`}>
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>{isLogin ? 'فتح السيستم' : (isAffiliateRegistration ? 'ابدأ البيزنس' : 'إرسال الطلب')}</span>}
                </button>
            </form>
            <p className="text-center text-white/10 text-[8px] mt-6 font-black tracking-widest uppercase">Elite Security Protocol v4.0 • No OTP Required</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;