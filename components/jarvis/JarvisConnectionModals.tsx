import React from 'react';
import { X, CheckCircle2, MessageSquare, Sparkles, RefreshCw, Copy, FileText, Share2 } from 'lucide-react';
import { toast } from './jarvisToast';

export interface JarvisConnectionModalsProps {
  isCrmModalOpen: boolean;
  setIsCrmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMetaReadinessOpen: boolean;
  setIsMetaReadinessOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isWaConnectModalOpen: boolean;
  setIsWaConnectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMetaConnectModalOpen: boolean;
  setIsMetaConnectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBrandingModalOpen: boolean;
  setIsBrandingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  waPairingInfo: any;
  currentSelectedBrand: any;
  realStats: any;
  waPhoneInput: string;
  setWaPhoneInput: React.Dispatch<React.SetStateAction<string>>;
  handleOpenWhatsAppConnectModal: (phone?: string) => Promise<void>;
  isConnectingChannel: boolean;
  metaPageInput: string;
  setMetaPageInput: React.Dispatch<React.SetStateAction<string>>;
  metaPageIdInput: string;
  setMetaPageIdInput: React.Dispatch<React.SetStateAction<string>>;
  metaPageTokenInput: string;
  setMetaPageTokenInput: React.Dispatch<React.SetStateAction<string>>;
  handleConfirmMetaConnect: () => Promise<void>;
  brandingForm: any;
  setBrandingForm: React.Dispatch<React.SetStateAction<any>>;
  handleGenerateBrandingKit: () => Promise<void>;
  isGeneratingBranding: boolean;
  generatedBrandingKit: any;
}

export const JarvisConnectionModals: React.FC<JarvisConnectionModalsProps> = ({
  isCrmModalOpen,
  setIsCrmModalOpen,
  isMetaReadinessOpen,
  setIsMetaReadinessOpen,
  isWaConnectModalOpen,
  setIsWaConnectModalOpen,
  isMetaConnectModalOpen,
  setIsMetaConnectModalOpen,
  isBrandingModalOpen,
  setIsBrandingModalOpen,
  waPairingInfo,
  currentSelectedBrand,
  realStats,
  waPhoneInput,
  setWaPhoneInput,
  handleOpenWhatsAppConnectModal,
  isConnectingChannel,
  metaPageInput,
  setMetaPageInput,
  metaPageIdInput,
  setMetaPageIdInput,
  metaPageTokenInput,
  setMetaPageTokenInput,
  handleConfirmMetaConnect,
  brandingForm,
  setBrandingForm,
  handleGenerateBrandingKit,
  isGeneratingBranding,
  generatedBrandingKit
}) => {
  return (
    <>
{/* REAL CRM BOOKINGS DETAIL MODAL */}
      {isCrmModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#04081c] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(0,240,255,0.3)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <FileText className="w-5 h-5" />
                <span>حجوزات الـ CRM المؤكدة (قواعد البيانات الحقيقية)</span>
              </div>
              <button 
                onClick={() => setIsCrmModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(realStats.recentBookings || []).map((booking: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#020512] border border-cyan-500/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{booking.customerName}</span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">الخدمة: {booking.service} • براند: كلين ماستر لخدمات النظافة</p>
                    <p className="text-[10px] font-mono text-cyan-400/80">المعرف: {booking.id}</p>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-base font-black text-cyan-400">{booking.price}</span>
                    <p className="text-[9px] text-white/40">عربون ومؤكد</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between">
              <span>إجمالي الحجوزات المؤكدة:</span>
              <span className="font-bold font-mono text-white text-sm">
                {realStats.realConfirmedRevenueEgp ?? 0} ج.م (كلين ماستر)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* META CAMPAIGNS READINESS & PERMISSIONS MODAL */}
      {isMetaReadinessOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-[#04081c] border-2 border-purple-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(168,85,247,0.3)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-base">
                <Share2 className="w-5 h-5" />
                <span>جاهزية تطبيق ميتا وإطلاق الحملات (Meta Marketing & Ads API)</span>
              </div>
              <button 
                onClick={() => setIsMetaReadinessOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
              <p className="text-white/80">
                لكي يتمكن جارفيس والظل من إطلاق ومتابعة الحملات الإعلانية وسحب جميع الإحداثيات (المشاهدات، الميزانيات، النقرات، والليدات) والرد على التعليقات آلياً، هذه هي خريطة الصلاحيات المطلوبة في تطبيق ميتا:
              </p>

              {/* Marketing & Ads API */}
              <div className="p-3.5 rounded-2xl bg-black/50 border border-purple-500/30 space-y-2">
                <span className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  1. صلاحيات إدارة وإطلاق الحملات الإعلانية (Ads & Marketing API):
                </span>
                <ul className="list-disc list-inside space-y-1 text-white/70 text-[11px] font-mono mr-2">
                  <li><strong className="text-cyan-300">ads_management:</strong> لإنشاء وتعديل الحملات والميزانيات ووقف/تشغيل الإعلانات برمجياً من الظل.</li>
                  <li><strong className="text-cyan-300">ads_read:</strong> لسحب تقارير الأداء اللحظية (Spend, Impressions, CPC, ROAS).</li>
                  <li><strong className="text-cyan-300">leads_retrieval:</strong> لسحب بيانات العملاء من إعلانات Lead Generation وصبّها فورياً في CRM الحجوزات.</li>
                  <li><strong className="text-cyan-300">business_management:</strong> للوصول للحساب الإعلاني وPixel الخاص ببيزنس ميتا.</li>
                </ul>
              </div>

              {/* Social Publishing & Auto-Replies */}
              <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-2">
                <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  2. صلاحيات النشر التلقائي والرد على التعليقات (Organic & Engagement):
                </span>
                <ul className="list-disc list-inside space-y-1 text-white/70 text-[11px] font-mono mr-2">
                  <li><strong className="text-cyan-300">pages_manage_posts & pages_read_engagement:</strong> لنشر البوستات والفيديوهات وسحب التفاعل من تيتو ستوديو.</li>
                  <li><strong className="text-cyan-300">pages_manage_engagement & pages_read_user_content:</strong> لقراءة تعليقات العملاء والرد التلقائي عليها فورياً.</li>
                  <li><strong className="text-cyan-300">instagram_content_publish & instagram_manage_comments:</strong> لنشر ريلز إنستجرام والرد على تعليقات الحساب.</li>
                </ul>
              </div>

              {/* Quick Config Tips */}
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
                <p className="font-bold">💡 خطوة التفعيل المتبقية في ملف البيئة (.env):</p>
                <p>
                  إضافة <code className="bg-black/60 px-1 py-0.5 rounded text-cyan-300">META_APP_ID</code> و <code className="bg-black/60 px-1 py-0.5 rounded text-cyan-300">META_APP_SECRET</code> و <code className="bg-black/60 px-1 py-0.5 rounded text-cyan-300">META_AD_ACCOUNT_ID</code> حتى يسحب جارفيس كل تفاصيل الحملات حياً!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE WHATSAPP PAIRING & QR CONNECTION MODAL */}
      {isWaConnectModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-['Cairo']" dir="rtl">
          <div className="w-full max-w-lg bg-[#041016] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(0,240,255,0.35)] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-base">
                <MessageSquare className="w-5 h-5" />
                <span>نافذة ربط واتساب الذكي: {currentSelectedBrand.name}</span>
              </div>
              <button
                onClick={() => setIsWaConnectModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1.5 font-bold">رقم واتساب البيزنس المراد ربطه بالوكيل الصوتي:</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={waPhoneInput}
                    onChange={(e) => setWaPhoneInput(e.target.value)}
                    placeholder="01013373634"
                    className="flex-1 bg-black/60 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleOpenWhatsAppConnectModal(waPhoneInput)}
                    disabled={isConnectingChannel}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition"
                  >
                    {isConnectingChannel ? 'جاري التوليد...' : 'توليد كود جديد'}
                  </button>
                </div>
              </div>

              {waPairingInfo && (
                <div className="p-4 rounded-2xl bg-black/70 border border-cyan-500/40 text-center space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-cyan-300 font-bold">
                      كود الربط الفوري (افتح واتساب &gt; الأجهزة المرتبطة &gt; الربط برقم الهاتف):
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      {waPairingInfo.liveBaileysConnected ? 'BAILEYS LIVE 🟢' : 'T2 AGENT SYNCED ⚡'}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-black tracking-[0.25em] text-white bg-cyan-950/60 border border-cyan-400/50 py-3 px-4 rounded-2xl shadow-inner select-all">
                    {waPairingInfo.pairingCode}
                  </div>
                  {waPairingInfo.qrDataUrl && (
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <img
                        src={waPairingInfo.qrDataUrl}
                        alt="WhatsApp QR"
                        className="w-36 h-36 rounded-xl border-2 border-cyan-500/50 bg-white p-1.5"
                      />
                      <span className="text-[10px] text-white/50">أو امسح الـ QR مباشرة بالكاميرا</span>
                    </div>
                  )}
                  <div className="text-[11px] text-white/60 leading-relaxed">
                    الجلسة مربوطة مباشرة بعقدة أوبسيديان <code className="text-cyan-300 font-mono">[[WA_Agent_{currentSelectedBrand.id}]]</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIVE META GRAPH OAUTH & TOKEN CONNECTION MODAL */}
      {isMetaConnectModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-['Cairo']" dir="rtl">
          <div className="w-full max-w-lg bg-[#07081c] border-2 border-indigo-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(99,102,241,0.35)] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-500/30">
              <div className="flex items-center gap-2 text-indigo-400 font-black text-base">
                <Share2 className="w-5 h-5" />
                <span>نافذة ربط صفحة فيسبوك وإنستجرام: {currentSelectedBrand.name}</span>
              </div>
              <button
                onClick={() => setIsMetaConnectModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-white/70 leading-relaxed">
                يربط هذا الإجراء براند <strong>{currentSelectedBrand.name}</strong> بمحرك النشر التلقائي في تيتو ستوديو وماكينة إعلانات Click-to-WhatsApp عبر Graph API v21.0:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-white/70 block mb-1 font-bold">اسم صفحة فيسبوك / إنستجرام:</label>
                  <input
                    type="text"
                    value={metaPageInput}
                    onChange={(e) => setMetaPageInput(e.target.value)}
                    placeholder={`${currentSelectedBrand.name} Official`}
                    className="w-full bg-black/60 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/70 block mb-1 font-bold">معرف الصفحة (Page ID - اختياري):</label>
                  <input
                    type="text"
                    value={metaPageIdInput}
                    onChange={(e) => setMetaPageIdInput(e.target.value)}
                    placeholder="مثال: 10492837465"
                    className="w-full bg-black/60 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1 font-bold">توكن الصفحة المباشر (Meta Page Access Token للتحقق الحي):</label>
                <input
                  type="password"
                  value={metaPageTokenInput}
                  onChange={(e) => setMetaPageTokenInput(e.target.value)}
                  placeholder="EAAGm0PX4ZCpsBA... (اختياري للتحقق الفوري من Graph API v21.0)"
                  className="w-full bg-black/60 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleConfirmMetaConnect}
                  disabled={isConnectingChannel}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/30 transition"
                >
                  {isConnectingChannel ? 'جاري تفويض وربط ميتا...' : 'تأكيد الربط الفوري وتفعيل النشر التلقائي 🚀'}
                </button>
                <button
                  onClick={() => {
                    window.open('/api/oauth/facebook/start', '_blank', 'width=600,height=700');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition"
                >
                  بوابة Meta OAuth
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BRANDING FORGE & SOCIAL PAGES LAUNCH KIT MODAL */}
      {isBrandingModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-['Cairo']" dir="rtl">
          <div className="w-full max-w-2xl bg-[#03091e] border-2 border-cyan-400/50 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(6,182,212,0.35)] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    محرك البراندينج وتجهيز صفحات السوشيال ميديا
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-full font-mono">
                      FB • IG • TIKTOK
                    </span>
                  </h3>
                  <p className="text-[11px] text-cyan-200/60">
                    تأسيس هوية البراند بالكامل، الألوان، اللوجو، بايو السوشيال المعتمد، وخطة الـ 3 منشورات للأسبوع المجاني
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsBrandingModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
              <div>
                <label className="text-[11px] text-white/70 block mb-1 font-bold">اسم النشاط أو البراند:</label>
                <input
                  type="text"
                  value={brandingForm.brandName}
                  onChange={(e) => setBrandingForm({ ...brandingForm, brandName: e.target.value })}
                  placeholder="مثال: عيادات دايموند سمايل أو رويال كارز"
                  className="w-full bg-black/60 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1 font-bold">مجال وتصنيف النشاط:</label>
                <select
                  value={brandingForm.category}
                  onChange={(e) => setBrandingForm({ ...brandingForm, category: e.target.value })}
                  className="w-full bg-black/60 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="عيادات ومراكز طبية">عيادات ومراكز طبية</option>
                  <option value="عقارات وتطوير ومقاولات">عقارات وتطوير ومقاولات</option>
                  <option value="خدمات ونظافة وصيانة">خدمات ونظافة وصيانة</option>
                  <option value="تأجير وليموزين سيارات">تأجير وليموزين سيارات</option>
                  <option value="تجارة إلكترونية وأزياء">تجارة إلكترونية وأزياء</option>
                  <option value="مطاعم وكافيهات وأغذية">مطاعم وكافيهات وأغذية</option>
                  <option value="شحن وخدمات لوجستية">شحن وخدمات لوجستية</option>
                  <option value="أخرى">نشاط تجاري عام</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1 font-bold">رقم واتساب المبيعات والحجوزات:</label>
                <input
                  type="tel"
                  value={brandingForm.phone}
                  onChange={(e) => setBrandingForm({ ...brandingForm, phone: e.target.value })}
                  placeholder="01013372674"
                  className="w-full bg-black/60 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1 font-bold">حالة المشروع الحالي:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBrandingForm({ ...brandingForm, isNewBusiness: false })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      !brandingForm.isNewBusiness
                        ? 'bg-cyan-500/25 border-cyan-400 text-white'
                        : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    نشاط قائم وشغال
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandingForm({ ...brandingForm, isNewBusiness: true })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      brandingForm.isNewBusiness
                        ? 'bg-cyan-500/25 border-cyan-400 text-white'
                        : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    فكرة جديدة من الصفر
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button: Generate Kit */}
            <button
              onClick={handleGenerateBrandingKit}
              disabled={isGeneratingBranding}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs shadow-lg shadow-cyan-500/30 transition flex items-center justify-center gap-2"
            >
              {isGeneratingBranding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>جاري تأسيس الهوية وحقيبة صفحات السوشيال...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>⚡ تأسيس هوية البراند وحقيبة صفحات السوشيال (فيسبوك، إنستا، تيك توك)</span>
                </>
              )}
            </button>

            {/* Generated Kit Display */}
            {generatedBrandingKit && (
              <div className="space-y-3 pt-2 border-t border-cyan-500/20 text-right animate-in fade-in">
                {/* Brand Identity Summary Banner */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-black/80 border border-cyan-400/40 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{generatedBrandingKit.brandName}</span>
                      <span className="text-[10px] font-mono text-cyan-300">({generatedBrandingKit.englishName})</span>
                    </div>
                    <p className="text-[11px] text-amber-300 font-bold mt-0.5">"{generatedBrandingKit.slogan}"</p>
                    <p className="text-[10px] text-white/60 mt-0.5">{generatedBrandingKit.essence}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/60">ألوان الهوية:</span>
                    <span className="w-5 h-5 rounded-full border border-white/40" style={{ backgroundColor: generatedBrandingKit.colors?.primary }} title="اللون الأساسي" />
                    <span className="w-5 h-5 rounded-full border border-white/40" style={{ backgroundColor: generatedBrandingKit.colors?.secondary }} title="اللون الثانوي" />
                    <span className="w-5 h-5 rounded-full border border-white/40" style={{ backgroundColor: generatedBrandingKit.colors?.accent }} title="لون الإجراء" />
                  </div>
                </div>

                {/* 3 Social Media Profile Kits (Facebook, Instagram, TikTok) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-right">
                  {/* Facebook Page Kit */}
                  <div className="p-3 rounded-2xl bg-[#030d22] border border-blue-500/40 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between text-blue-400 font-bold text-xs pb-1 border-b border-blue-500/20">
                        <span className="flex items-center gap-1">📘 فيسبوك (Facebook Page)</span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1.5">{generatedBrandingKit.socialKits?.facebook?.title}</p>
                      <p className="text-[10px] text-white/70 mt-1 whitespace-pre-line leading-relaxed">
                        {generatedBrandingKit.socialKits?.facebook?.bio}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${generatedBrandingKit.socialKits?.facebook?.title}\n\n${generatedBrandingKit.socialKits?.facebook?.bio}`);
                        toast.success('تم نسخ بيانات صفحة فيسبوك');
                      }}
                      className="w-full py-1 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>نسخ بايو فيسبوك</span>
                    </button>
                  </div>

                  {/* Instagram Profile Kit */}
                  <div className="p-3 rounded-2xl bg-[#17051a] border border-fuchsia-500/40 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between text-fuchsia-400 font-bold text-xs pb-1 border-b border-fuchsia-500/20">
                        <span className="flex items-center gap-1">📸 إنستجرام (Instagram Profile)</span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1.5">{generatedBrandingKit.socialKits?.instagram?.title}</p>
                      <p className="text-[10px] text-white/70 mt-1 whitespace-pre-line leading-relaxed font-sans">
                        {generatedBrandingKit.socialKits?.instagram?.bio}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedBrandingKit.socialKits?.instagram?.bio);
                        toast.success('تم نسخ بايو إنستجرام');
                      }}
                      className="w-full py-1 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>نسخ بايو إنستجرام</span>
                    </button>
                  </div>

                  {/* TikTok Channel Kit */}
                  <div className="p-3 rounded-2xl bg-[#02131b] border border-cyan-500/40 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between text-cyan-400 font-bold text-xs pb-1 border-b border-cyan-500/20">
                        <span className="flex items-center gap-1">🎵 تيك توك (TikTok Kit)</span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1.5">{generatedBrandingKit.socialKits?.tiktok?.title}</p>
                      <p className="text-[10px] text-white/70 mt-1 whitespace-pre-line leading-relaxed">
                        {generatedBrandingKit.socialKits?.tiktok?.bio}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedBrandingKit.socialKits?.tiktok?.bio);
                        toast.success('تم نسخ بايو تيك توك');
                      }}
                      className="w-full py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>نسخ بايو تيك توك</span>
                    </button>
                  </div>
                </div>

                {/* 3-Post Day-On-Day Trial Plan (الأحد، الثلاثاء، الخميس) */}
                <div className="p-3 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>📅 خطة أسبوع التجربة المجانية (3 منشورات يوم ويوم):</span>
                    <span className="text-[10px] font-mono text-cyan-400">جاهزة في تقويم تيتو ستوديو</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(generatedBrandingKit.trialContentPlan || []).map((post: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/10 text-right space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-amber-400">{post.day}</span>
                          <span className="text-cyan-300 font-mono text-[9px]">{post.formatName}</span>
                        </div>
                        <p className="text-[10px] font-bold text-white line-clamp-1">{post.hook}</p>
                        <p className="text-[9px] text-white/60 line-clamp-2">{post.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      
    </>
  );
};
