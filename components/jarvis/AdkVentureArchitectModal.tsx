import React, { useState } from 'react';
import {
  X, Sparkles, Brain, TrendingUp, DollarSign, ShoppingBag,
  CalendarDays, Rocket, CheckCircle2, Loader2, Target, Layers, ExternalLink, Truck
} from 'lucide-react';
import { DropshippingSettlementPanel } from './DropshippingSettlementPanel';
import { getAdminAuthHeaders } from '../../services/adminIdentity';

interface AdkVentureArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchBusiness: (venture: any) => void;
}

export const AdkVentureArchitectModal: React.FC<AdkVentureArchitectModalProps> = ({
  isOpen,
  onClose,
  onLaunchBusiness,
}) => {
  const [niche, setNiche] = useState('');
  const [budgetEgp, setBudgetEgp] = useState('50000');
  const [city, setCity] = useState('القاهرة والجيزة');
  const [fulfillmentMode, setFulfillmentMode] = useState<'dropshipping' | 'own_inventory'>('dropshipping');
  const [supplierWhatsapp, setSupplierWhatsapp] = useState('01013372674');
  const [loading, setLoading] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [error, setError] = useState('');
  const [blueprint, setBlueprint] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'architect' | 'settlement'>('architect');
  const [launchingDrop, setLaunchingDrop] = useState(false);
  const [launchedFunnelUrl, setLaunchedFunnelUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLaunchCodFunnel = async (item?: any) => {
    if (!blueprint) return;
    setLaunchingDrop(true);
    try {
      const targetItem = item || blueprint.starterCatalog?.[0] || {
        name: blueprint.recommendedBrandName || niche,
        numericPrice: 690,
        supplierCostEgp: 260,
      };
      const res = await fetch('/api/dropshipping/funnels', {
        method: 'POST',
        credentials: 'include',
        headers: await getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          brandName: blueprint.recommendedBrandName || 'T2OS DropStore',
          productName: targetItem.name,
          tagline: blueprint.slogan || targetItem.description,
          sellingPriceEgp: targetItem.numericPrice || 690,
          supplierCostPerUnitEgp: targetItem.supplierCostEgp || 260,
          supplierWhatsapp: supplierWhatsapp || '01013372674',
        }),
      });
      const data = await res.json();
      if (data?.ok && data.funnelUrl) {
        setLaunchedFunnelUrl(data.funnelUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر إطلاق صفحة الهبوط');
    } finally {
      setLaunchingDrop(false);
    }
  };

  const phases = [
    'Think — تحليل الفجوة السوقية والطلب والمنافسين...',
    'Act — هندسة نموذج الربح والتسعير والكتالوج...',
    'Observe — حساب هامش الربح وتوزيع ميزانية الـ 50/50...',
    'Reflect — صياغة خطة الإطلاق العملية لأول 30 يوم...',
  ];

  const handleRunAdk = async () => {
    if (!niche.trim()) {
      setError('اكتب فكرة أو مجال المشروع أولاً');
      return;
    }
    setError('');
    setLoading(true);
    setBlueprint(null);
    setPhaseIdx(0);

    const timer = setInterval(() => {
      setPhaseIdx((p) => (p < 3 ? p + 1 : 3));
    }, 1100);

    try {
      const res = await fetch('/api/adk/invent-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: niche.trim(),
          budgetEgp: Number(budgetEgp) || 50000,
          city: city.trim() || 'مصر',
          fulfillmentMode,
          supplierWhatsapp: supplierWhatsapp.trim() || '01013372674',
        }),
      });
      const data = await res.json();
      if (data?.ok && data.blueprint) {
        setBlueprint(data.blueprint);
      } else {
        setError(data?.error || 'تعذر إتمام دراسة المشروع حالياً');
      }
    } catch (err: any) {
      setError(err?.message || 'خطأ في الاتصال بالخادم');
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[270] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-['Cairo']" dir="rtl">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#030714] border border-cyan-500/45 rounded-3xl shadow-[0_0_70px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#050b1f] border-b border-cyan-500/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-black shadow-lg">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                مخترع المشاريع الذكي (ADK Venture Architect)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-mono">
                  0 → 1
                </span>
              </h2>
              <p className="text-[11px] text-white/60">
                دراسة سوق محكمة + تسعير + كتالوج + خطة 30 يوم ← ثم تأسيس التطبيق في ضغطة واحدة
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-2.5 bg-[#04091a] border-b border-white/10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('architect')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'architect'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>اختراع المشروع وحاسبة COD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settlement')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'settlement'
                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>غرفة عمليات وتسوية الدروبشيبنج (COD Settlement)</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'settlement' ? (
            <DropshippingSettlementPanel />
          ) : (
          <>
          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#070d20] border border-white/10">
            <div className="md:col-span-3 sm:col-span-1">
              <label className="text-[11px] font-bold text-cyan-300 block mb-1">المجال أو فكرة المشروع</label>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="مثال: براند عناية بالسيارات / متجر قهوة مختصة / عيادة تغذية"
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-emerald-300 block mb-1">رأس المال التقريبي (ج.م)</label>
              <input
                type="number"
                value={budgetEgp}
                onChange={(e) => setBudgetEgp(e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs text-right focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-amber-300 block mb-1">السوق / المدينة المستهدفة</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Fulfillment & Dropshipping Selector */}
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-purple-300 block mb-1">نموذج التوريد والتشغيل (Inventory vs Dropshipping)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('dropshipping')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    fulfillmentMode === 'dropshipping'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.25)]'
                      : 'bg-black/50 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <span>🚚 دروبشيبنج مربوط بموردين جاهزين</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('own_inventory')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    fulfillmentMode === 'own_inventory'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_18px_rgba(0,240,255,0.2)]'
                      : 'bg-black/50 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <span>📦 منتجات أو خدمات خاصة (مخزونك)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-emerald-300 block mb-1">
                {fulfillmentMode === 'dropshipping' ? 'واتساب المورد (لتحويل الطلبات بدون أسعار)' : 'واتساب مسؤول التشغيل'}
              </label>
              <input
                value={supplierWhatsapp}
                onChange={(e) => setSupplierWhatsapp(e.target.value)}
                dir="ltr"
                placeholder="010..."
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs text-right focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3 flex items-center justify-between gap-3 flex-wrap pt-1">
              {error ? <span className="text-xs text-rose-400 font-bold">{error}</span> : <span className="text-[11px] text-white/50">يعمل بدورة ADK: Think → Act → Observe → Reflect</span>}
              <button
                onClick={handleRunAdk}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'جاري تشغيل الدراسة المحكمة...' : 'اخترع المشروع وادرسه الآن'}</span>
              </button>
            </div>
          </div>

          {/* Live ADK Progress */}
          {loading && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/35 space-y-2">
              {phases.map((p, idx) => (
                <div key={idx} className={`flex items-center gap-2 text-xs font-bold ${idx <= phaseIdx ? 'text-cyan-200' : 'text-white/30'}`}>
                  {idx < phaseIdx ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : idx === phaseIdx ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}

          {/* Blueprint Result */}
          {blueprint && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Brand Identity Hero */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-[#071128] to-purple-500/15 border border-cyan-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    {blueprint.businessModel === 'products_erp' ? 'متجر تجارة ومنتجات (Battah Core)' : 'منصة خدمات وحجوزات (Clean Master Core)'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-2">{blueprint.recommendedBrandName}</h3>
                  <p className="text-xs text-cyan-300 font-bold">"{blueprint.slogan}"</p>
                  {Array.isArray(blueprint.alternativeNames) && blueprint.alternativeNames.length > 0 && (
                    <p className="text-[11px] text-white/60 mt-1">أسماء بديلة: {blueprint.alternativeNames.join(' • ')}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={launchingDrop}
                    onClick={() => handleLaunchCodFunnel()}
                    className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-60"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{launchingDrop ? 'جاري التجهيز...' : '🚀 إطلاق متجر Battah الاحترافي (/shop/...)'}</span>
                  </button>
                  <button
                    onClick={() => onLaunchBusiness(blueprint)}
                    className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>أسّس هذا المشروع وأطلق تطبيقه</span>
                  </button>
                </div>
              </div>
              {launchedFunnelUrl && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-black text-emerald-200">
                    ✅ تم إطلاق صفحة البيع الفوري بنجاح: <span className="font-mono text-cyan-200">{launchedFunnelUrl}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={launchedFunnelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-black text-[11px]"
                    >
                      فتح صفحة الطلب COD
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveTab('settlement')}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-bold text-[11px] cursor-pointer"
                    >
                      لوحة التسوية والموردين
                    </button>
                  </div>
                </div>
              )}

              {/* Market Study & Unit Economics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#070d20] border border-white/10 space-y-2">
                  <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    دراسة السوق والميزة التنافسية (USP)
                  </h4>
                  <p className="text-xs text-white/80 leading-relaxed">{blueprint.marketStudy?.opportunity}</p>
                  <div className="text-[11px] text-white/65">
                    <b className="text-white">الجمهور المستهدف:</b> {blueprint.marketStudy?.targetAudience}
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    <b>سر التميز:</b> {blueprint.marketStudy?.usp}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#070d20] border border-white/10 space-y-2">
                  <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    اقتصاديات المشروع والباقة المقترحة
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[10px] text-white/50 block">متوسط الطلب (AOV)</span>
                      <b className="text-white">{blueprint.unitEconomics?.avgOrderValueEgp} ج.م</b>
                    </div>
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[10px] text-white/50 block">هامش الربح المتوقع</span>
                      <b className="text-emerald-300">{blueprint.unitEconomics?.estimatedMarginPct}%</b>
                    </div>
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[10px] text-white/50 block">نقطة التعادل</span>
                      <b className="text-amber-300">{blueprint.unitEconomics?.breakEvenOrders} طلب/شهر</b>
                    </div>
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[10px] text-white/50 block">باقة T2OS الأنسب</span>
                      <b className="text-cyan-300">{blueprint.recommendedSaasPlan}</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Starter Catalog & Dropshipping Profit Matrix */}
              <div className="p-4 rounded-2xl bg-[#070d20] border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    الكتالوج الجاهز ومصفوفة ربح الدروبشيبنج ({(blueprint.starterCatalog || []).length} منتجات رابحة)
                  </h4>
                  {blueprint.fulfillmentMode === 'dropshipping' && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                      🚚 توجيه آلي للمورد بدون كشف سعر البيع أو هامش ربحك
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(blueprint.starterCatalog || []).map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{item.name}</div>
                          <div className="text-[10px] text-white/55 truncate">{item.description}</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                          {item.supplierSource || 'مورد معتمد'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10 text-center text-[10px]">
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <span className="text-white/50 block">جملة المورد</span>
                          <b className="text-amber-300">{item.supplierCostEgp || Math.round((item.numericPrice || 500) * 0.48)} ج.م</b>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <span className="text-white/50 block">سعر البيع</span>
                          <b className="text-white">{item.numericPrice} ج.م</b>
                        </div>
                        <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                          <span className="text-emerald-200/80 block">
                            صافي فعلي ({item.codEconomics?.realNetMarginPct ?? 25}%)
                          </span>
                          <b className="text-emerald-300">+{item.codEconomics?.realNetProfitPerDeliveredEgp ?? item.netMarginEgp ?? Math.round((item.numericPrice || 500) * 0.3)} ج.م</b>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span className={item.codEconomics?.verdict === 'REJECT_LOW_MARGIN' ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
                          {item.codEconomics?.verdict === 'REJECT_LOW_MARGIN' ? '⚠️ هامش منخفض بعد CPA والمرتجعات' : '✅ منتج رابح (بعد الشحن و20% مرتجع)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLaunchCodFunnel(item)}
                          className="text-cyan-300 hover:underline font-bold cursor-pointer"
                        >
                          إنشاء رابط بيع
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dropshipping Supplier Network & Auto-Forwarding Bridge */}
                {blueprint.dropshippingConfig?.supplierPartners && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-emerald-300">
                      <span>🔗 شبكة الموردين وبوابة التوجيه الآلي (T2 Dropshipping Bridge)</span>
                      <span className="font-mono text-[10px] text-cyan-300">
                        واتساب المورد: {blueprint.dropshippingConfig.supplierWhatsapp || supplierWhatsapp}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                      {blueprint.dropshippingConfig.supplierPartners.map((sp: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-black/50 border border-white/10">
                          <div className="font-black text-white">{sp.name}</div>
                          <div className="text-white/60 mt-0.5">{sp.type}</div>
                          <div className="text-emerald-400 font-bold mt-1">⏱️ التوصيل: {sp.avgDeliveryDays}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 30-Day Launch Roadmap */}
              <div className="p-4 rounded-2xl bg-[#070d20] border border-white/10 space-y-2">
                <h4 className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  خطة الإطلاق والتنفيذ لأول 30 يوم
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(blueprint.launchRoadmap30Days || []).map((w: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-black/45 border border-purple-500/20 text-xs">
                      <div className="font-black text-purple-200 mb-0.5">{w.week}</div>
                      <div className="text-[11px] text-white/75">{w.focus}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};
