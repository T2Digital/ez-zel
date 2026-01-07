
import React, { useState, useRef } from 'react';
import { Phone, ArrowRight, CheckCircle, Copy, ExternalLink, ShieldCheck, Wallet, Sparkles, Smartphone, ArrowLeft, ImagePlus, X, Loader2, CreditCard } from 'lucide-react';

interface Props {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (proofData: string, finalCycle: 'monthly' | 'yearly') => void;
  onBack: () => void;
}

const Payment: React.FC<Props> = ({ planId, billingCycle, onSuccess, onBack }) => {
  const [currentCycle, setCurrentCycle] = useState<'monthly' | 'yearly'>(billingCycle);
  const [method, setMethod] = useState<'vodafone' | 'instapay' | 'orange' | 'etisalat' | 'we' | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const priceEGP = currentCycle === 'yearly' ? '10,000' : '1,000';
  const priceUSD = currentCycle === 'yearly' ? '200' : '20';
  const planName = currentCycle === 'yearly' ? 'باقة النخبة (سنوي)' : 'باقة النخبة (شهري)';

  // رقم المحفظة الموحد
  const WALLET_NUMBER = "01030956097";
  const AMOUNT = priceEGP.replace(/,/g, ''); // Remove commas for USSD

  const wallets = {
      vodafone: {
          name: 'فودافون كاش',
          color: 'border-red-500 bg-red-500/10',
          iconColor: 'text-red-500',
          ussd: `*9*7*${WALLET_NUMBER}*${AMOUNT}#`,
          dialCode: `*9*7*${WALLET_NUMBER}*${AMOUNT}%23`
      },
      orange: {
          name: 'أورانج كاش',
          color: 'border-orange-500 bg-orange-500/10',
          iconColor: 'text-orange-500',
          ussd: `*7115*${WALLET_NUMBER}*${AMOUNT}#`,
          dialCode: `*7115*${WALLET_NUMBER}*${AMOUNT}%23`
      },
      etisalat: {
          name: 'إي آند (اتصالات)',
          color: 'border-emerald-500 bg-emerald-500/10',
          iconColor: 'text-emerald-500',
          ussd: `*777*${WALLET_NUMBER}*${AMOUNT}#`,
          dialCode: `*777*${WALLET_NUMBER}*${AMOUNT}%23`
      },
      we: {
          name: 'وي باي (WE)',
          color: 'border-purple-500 bg-purple-500/10',
          iconColor: 'text-purple-500',
          ussd: `*322*${WALLET_NUMBER}*${AMOUNT}#`,
          dialCode: `*322*${WALLET_NUMBER}*${AMOUNT}%23`
      }
  };

  const instapayLink = `https://ipn.eg/S/ahmatya2030/instapay/5ZecgL`;

  const handleDial = (code: string) => {
      window.open(`tel:${code}`, '_self');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
          setProofImage(ev.target?.result as string);
          setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full w-full bg-[#020202] relative overflow-y-auto font-['Cairo'] px-6 py-8 md:p-12 scrollbar-hide pb-32">
      <div className="max-w-xl mx-auto relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-white/30 hover:text-white transition-all text-xs font-black mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> العودة للباقات
        </button>

        <div className="text-center mb-6">
            <h1 className="text-3xl font-black italic text-white mb-2 tracking-tighter">تأكيد الاشتراك</h1>
            <p className="text-white/40 text-sm font-bold">{planName}</p>
        </div>

        {/* CYCLE TOGGLE */}
        <div className="flex justify-center mb-8">
            <div className="bg-white/5 p-1 rounded-full border border-white/10 flex relative w-64 h-12 items-center overflow-hidden">
                <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-purple-600 rounded-full transition-all duration-300 shadow-lg z-0 ${currentCycle === 'monthly' ? 'right-1' : 'right-[calc(50%+2px)]'}`}
                ></div>
                
                <button 
                    onClick={() => setCurrentCycle('monthly')}
                    className={`flex-1 rounded-full text-xs font-black transition-all relative z-10 h-full flex items-center justify-center ${currentCycle === 'monthly' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                >
                    شهري
                </button>
                <button 
                    onClick={() => setCurrentCycle('yearly')}
                    className={`flex-1 rounded-full text-xs font-black transition-all relative z-10 h-full flex items-center justify-center ${currentCycle === 'yearly' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                >
                    سنوي (وفر 2000)
                </button>
            </div>
        </div>

        <div className="text-center mb-8 animate-in zoom-in duration-300">
            <div className="flex justify-center items-center gap-4 mb-2">
                 <div className="px-6 py-3 bg-white text-black rounded-2xl text-3xl font-black inline-block shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    {priceEGP} <span className="text-sm align-top">ج.م</span>
                 </div>
            </div>
            {currentCycle === 'yearly' && (
                <span className="text-emerald-400 text-[10px] font-bold bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                    ⚡ تم تطبيق خصم 20% للباقة السنوية
                </span>
            )}
        </div>

        {/* Instapay Special Box */}
        <div onClick={() => setMethod('instapay')} className={`glass p-5 rounded-[24px] border-2 transition-all cursor-pointer mb-4 flex items-center gap-4 ${method === 'instapay' ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 hover:border-white/20'}`}>
             <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-purple-400" />
             </div>
             <div className="flex-1">
                 <h3 className="text-lg font-black text-white">إنستاباي (InstaPay)</h3>
                 <p className="text-white/40 text-[10px]">تحويل لحظي مباشر (ينصح به للمبالغ الكبيرة)</p>
             </div>
             {method === 'instapay' && <CheckCircle className="w-5 h-5 text-purple-500" />}
        </div>
        
        {method === 'instapay' && (
             <div className="mb-8 animate-in slide-in-from-top-4 fade-in">
                 <a href={instapayLink} target="_blank" className="block w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-[20px] text-center text-white font-black shadow-lg shadow-purple-900/50 transition-all text-sm">
                     فتح التطبيق والدفع
                 </a>
                 <p className="text-center text-white/30 text-[10px] mt-2 font-mono">username: ahmatya2030</p>
             </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.keys(wallets) as Array<keyof typeof wallets>).map((key) => (
                <div key={key} onClick={() => setMethod(key)} className={`glass p-4 rounded-[24px] border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-2 ${method === key ? wallets[key].color : 'border-white/5 hover:border-white/20'}`}>
                    <Smartphone className={`w-6 h-6 ${wallets[key].iconColor}`} />
                    <span className="text-xs font-black text-white">{wallets[key].name}</span>
                </div>
            ))}
        </div>

        {method && method !== 'instapay' && (
            <div className="mb-8 animate-in slide-in-from-top-4 fade-in glass p-5 rounded-[24px] border border-white/10">
                <div className="bg-black/50 p-3 rounded-xl text-center border border-white/5 mb-3">
                    <p className="text-white/40 text-[10px] mb-1">كود التحويل المباشر</p>
                    <p className="text-white font-mono text-base font-bold tracking-widest" dir="ltr">{wallets[method as keyof typeof wallets].ussd}</p>
                    {currentCycle === 'yearly' && (
                        <p className="text-amber-500 text-[9px] mt-2 font-bold">تنبيه: تأكد أن محفظتك تسمح بتحويل 10,000ج في عملية واحدة.</p>
                    )}
                </div>
                <button onClick={() => handleDial(wallets[method as keyof typeof wallets].dialCode)} className={`w-full py-3 rounded-[20px] font-black text-white flex items-center justify-center gap-2 transition-all text-sm ${method === 'vodafone' ? 'bg-red-600' : method === 'orange' ? 'bg-orange-600' : method === 'etisalat' ? 'bg-emerald-600' : 'bg-purple-600'}`}>
                    <Phone className="w-4 h-4 fill-current" />
                    <span>اتصال (Dial)</span>
                </button>
            </div>
        )}

        {/* Proof Upload */}
        <div className="glass p-6 rounded-[32px] border border-white/10 animate-in fade-in slide-in-from-bottom-6">
            <h4 className="text-sm font-black text-white mb-4 italic text-center">سكرين شوت للعملية</h4>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            {!proofImage ? (
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-purple-500/30 rounded-[24px] text-white/40 hover:text-purple-400 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group">
                    <div className="p-3 bg-white/5 rounded-full group-hover:bg-purple-500/20 transition-colors">
                        <ImagePlus className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xs">اضغط لرفع الصورة</span>
                </button>
            ) : (
                <div className="relative mb-4 group">
                    <img src={proofImage} className="w-full h-40 object-cover rounded-[20px] border border-emerald-500" />
                    <div className="absolute top-2 right-2">
                         <button onClick={() => setProofImage(null)} className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                             <X className="w-5 h-5" />
                         </button>
                    </div>
                    <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                        <span className="bg-black/80 px-4 py-1 rounded-full text-emerald-400 text-[10px] font-bold border border-emerald-500/30">تم الرفع بنجاح</span>
                    </div>
                </div>
            )}

            <button disabled={!proofImage || isProcessing} onClick={() => onSuccess(proofImage!, currentCycle)} className={`w-full py-4 rounded-[20px] font-black text-lg transition-all mt-4 flex items-center justify-center gap-2 ${proofImage ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02]' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}>
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : 'إرسال للمراجعة'}
                {!isProcessing && <ArrowRight className="w-4 h-4" />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
