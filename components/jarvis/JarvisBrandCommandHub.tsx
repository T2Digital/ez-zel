import React, { useEffect, useState, useCallback } from 'react';
import {
  ExternalLink, Activity, Smartphone, Share2, Bot, Brain,
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Save,
  Copy, Check, ArrowRight, Send, MessageSquare, Globe,
  Calendar, ShieldCheck, Palette, Phone, MapPin, Link2, Box, Search, Rocket, Sparkles
} from 'lucide-react';
import { hybridMemory } from '../../services/hybridMemoryService';
import { getAdminAuthHeaders } from '../../services/adminIdentity';

const WorkspaceExplorer = React.lazy(() => import('../WorkspaceExplorer'));

interface JarvisBrandCommandHubProps {
  brandId: string;
  initialBrand?: any;
  isMasterAdmin?: boolean;
  onBackToGrid?: () => void;
  onOpenStudioCalendar?: () => void;
  onOpenAdLauncher?: () => void;
  onOpenWhatsAppModal?: (brandId: string) => void;
  onOpenMetaModal?: (brandId: string) => void;
}

type HubSection = 'app' | 'social' | 'agent' | 'brain';

export function getBrandIndustryDefaults(brand: any): {
  sampleQuestion: string;
  kbPlaceholder: string;
} {
  const biz = `${brand?.businessType || ''} ${brand?.name || ''} ${brand?.appTemplate || ''}`.toLowerCase();
  if (/نظاف|تنظيف|clean/i.test(biz)) {
    return {
      sampleQuestion: 'محتاج تنظيف شقة 120 متر بالبخار يوم الخميس، التكلفة والمواعيد إيه؟',
      kbPlaceholder: `مثال: ${brand?.name || 'براندك'} متخصص في خدمات التنظيف بالبخار والتعقيم في القاهرة والجيزة، مواعيد العمل 8 صباحاً - 10 مساءً، وخصم 10% للحجز الإلكتروني...`,
    };
  }
  if (/عطر|عطور|perfume|عود|بخور/i.test(biz)) {
    return {
      sampleQuestion: 'إيه أفضل عطر عود رجالي وثباته كام ساعة وسعره بكام؟',
      kbPlaceholder: `مثال: ${brand?.name || 'براندك'} للعطور الشرقية والفرنسية الأصلية بتركيز عالٍ وثبات 24 ساعة، والشحن متاح لجميع المحافظات...`,
    };
  }
  if (/سيار|قطع غيار|تيل|auto/i.test(biz)) {
    return {
      sampleQuestion: 'عندكم تيل فرامل أو فلتر زيت وبكام التوصيل؟',
      kbPlaceholder: `مثال: ${brand?.name || 'براندك'} لقطع غيار السيارات الأصلية بضمان 6 شهور وشحن سريع داخل القاهرة والمحافظات...`,
    };
  }
  if (/عياد|دكتور|طب|أسنان|clinic|medical/i.test(biz)) {
    return {
      sampleQuestion: 'مواعيد الكشف وسعر الاستشارة إيه وهل متاح حجز بكرة؟',
      kbPlaceholder: `مثال: ${brand?.name || 'العيادة'} متخصصة في الكشف والعلاج بأحدث الأجهزة، مواعيد الحجز يومياً مع متابعة فورية عبر واتساب...`,
    };
  }
  if (brand?.appTemplate === 'services_booking') {
    return {
      sampleQuestion: 'ما هي الباقات المتاحة ومواعيد الحجز القريبة؟',
      kbPlaceholder: `مثال: أضف تفاصيل خدمات ${brand?.name || 'البراند'}، مواعيد العمل، المناطق المغطاة، وسياسة العربون أو الدفع...`,
    };
  }
  return {
    sampleQuestion: 'هل المنتج متوفر حالياً وبكام الشحن للقاهرة؟',
    kbPlaceholder: `مثال: أضف تفاصيل منتجات ${brand?.name || 'البراند'}، الأسعار، الضمان، وسياسة الشحن داخل القاهرة والمحافظات...`,
  };
}

export const resolveBrandWebUrl = (brand: any): string => {
  if (!brand) return '';
  const candidates = [
    brand.appUrl,
    brand.vercelUrl,
    brand.deployedUrl,
    brand.liveUrl,
    brand.websiteUrl,
  ]
    .map((u) => String(u || '').trim())
    .filter((u) => /^https?:\/\//i.test(u) && !u.includes('ez-zel.onrender.com/store') && !u.includes('t2os.app/store'));
  if (candidates.length > 0) return candidates[0];

  const slug = String(brand.slug || brand.id || '').toLowerCase().trim();
  const canonicalSlug = slug.replace(/_/g, '-');
  if (slug === 'auto-house' || slug.includes('auto_house')) {
    return 'https://t2-tenant-auto-house.vercel.app';
  }
  if (slug === 'clean_master' || slug === 'clean-master') {
    return 'https://book.t2os.app/b/clean_master';
  }
  if (slug === 'al_genedy' || slug === 'al-genedy' || slug.includes('genedy')) {
    return 'https://elgenedy.com';
  }
  if (canonicalSlug) {
    const isBookingBiz =
      brand?.appTemplate === 'services_booking' ||
      /تنظيف|نظاف|عياد|دكتور|صيان|سيار|ليموزين|clinic|clean|car|service/i.test(`${brand?.businessType || ''} ${brand?.name || ''}`);
    return isBookingBiz
      ? `https://book.t2os.app/b/${encodeURIComponent(canonicalSlug)}`
      : `https://store.t2os.app/s/${encodeURIComponent(canonicalSlug)}`;
  }
  return '';
};

export const JarvisBrandCommandHub: React.FC<JarvisBrandCommandHubProps> = ({
  brandId,
  initialBrand,
  isMasterAdmin = false,
  onBackToGrid,
  onOpenStudioCalendar,
  onOpenAdLauncher,
  onOpenWhatsAppModal,
  onOpenMetaModal,
}) => {
  const initialDefaults = getBrandIndustryDefaults(initialBrand);
  const [activeBrandId, setActiveBrandId] = useState<string>(brandId);
  const [availableBrands, setAvailableBrands] = useState<Array<{ id: string; slug?: string; name: string }>>([]);
  const [section, setSection] = useState<HubSection>('app');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deployingVercel, setDeployingVercel] = useState(false);
  const [activatingGrowth, setActivatingGrowth] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const initialSlug = initialBrand?.id || initialBrand?.slug || '';
  useEffect(() => {
    if (brandId) setActiveBrandId(brandId);
    setBrandData(initialBrand || null);
    setName(initialBrand?.name || '');
    setPhone(initialBrand?.phone || '');
    setAddress(initialBrand?.address || '');
    setPrimaryColor(initialBrand?.primaryColor || '#0284c7');
    setAppUrl(resolveBrandWebUrl(initialBrand));
    setTone(initialBrand?.agentConfig?.tone || '');
    setShippingPolicy(initialBrand?.agentConfig?.shippingPolicy || '');
    setForbiddenTopics(initialBrand?.agentConfig?.forbiddenTopics || '');
    setFaq(initialBrand?.agentConfig?.faq || '');
    setKnowledgeBase(initialBrand?.knowledgeBase || '');
    setTestInput(getBrandIndustryDefaults(initialBrand).sampleQuestion);
    setTestBookingReceipt(null);
    setTestBookingResultUrl(null);
  }, [brandId, initialSlug]);

  const [brandData, setBrandData] = useState<any>(initialBrand || null);
  const [healthData, setHealthData] = useState<any>(null);

  // Editable Single-Source-of-Truth fields
  const [name, setName] = useState(initialBrand?.name || '');
  const [phone, setPhone] = useState(initialBrand?.phone || '');
  const [address, setAddress] = useState(initialBrand?.address || '');
  const [primaryColor, setPrimaryColor] = useState(initialBrand?.primaryColor || '#0284c7');
  const [appUrl, setAppUrl] = useState(resolveBrandWebUrl(initialBrand));

  // Agent training fields
  const [tone, setTone] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [forbiddenTopics, setForbiddenTopics] = useState('');
  const [faq, setFaq] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');

  // Live Agent Tester & Playground Correction & Manual Reply
  const [testInput, setTestInput] = useState(initialDefaults.sampleQuestion);
  const [testingAgent, setTestingAgent] = useState(false);
  const [testReply, setTestReply] = useState<string | null>(null);
  const [correctedAnswer, setCorrectedAnswer] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [replyTargetPhone, setReplyTargetPhone] = useState<string | null>(null);
  const [manualReplyText, setManualReplyText] = useState('');
  const [sendingManualReply, setSendingManualReply] = useState(false);

  // Media Gallery Modal (real generated assets first, optional 3D explorer toggle)
  const [isMediaVaultOpen, setIsMediaVaultOpen] = useState(false);
  const [show3DWorkspaceInVault, setShow3DWorkspaceInVault] = useState(false);
  const [testBookingResultUrl, setTestBookingResultUrl] = useState<string | null>(null);
  const [testBookingReceipt, setTestBookingReceipt] = useState<{
    bookingId: string;
    customerName: string;
    service: string;
    price: string;
    storeUrl: string;
  } | null>(null);
  const loadReqSeqRef = React.useRef(0);
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticHits, setSemanticHits] = useState<Array<{ text: string; score: number }>>([]);
  const [searchingSemantic, setSearchingSemantic] = useState(false);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    return await getAdminAuthHeaders({ 'Content-Type': 'application/json' });
  };

  useEffect(() => {
    if (!isMasterAdmin) return;
    let mounted = true;
    (async () => {
      try {
        const headers = await getAdminAuthHeaders();
        const r = await fetch('/api/admin/brands/registry', { headers });
        const d = await r.json().catch(() => null);
        if (mounted && d?.ok && Array.isArray(d.brands)) {
          setAvailableBrands(
            d.brands.map((b: any) => ({
              id: b.canonicalId || b.id,
              slug: b.slug,
              name: b.name || b.id,
            }))
          );
          return;
        }
        const gRes = await fetch('/api/obsidian/graph', { headers });
        const gData = await gRes.json().catch(() => null);
        if (mounted && Array.isArray(gData?.growthAgencyBrands)) {
          setAvailableBrands(
            gData.growthAgencyBrands.map((b: any) => ({
              id: b.id || b.slug,
              slug: b.slug,
              name: b.name || b.id,
            }))
          );
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [isMasterAdmin]);

  const loadHub = useCallback(async () => {
    if (!activeBrandId) return;
    const reqSeq = ++loadReqSeqRef.current;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(activeBrandId)}`, {
        credentials: 'include',
        headers,
      });
      const data = await res.json();
      if (reqSeq !== loadReqSeqRef.current) return;
      if (data?.ok && data.brand) {
        const b = data.brand;
        setBrandData(b);
        setName(b.name || '');
        setPhone(b.phone || '');
        setAddress(b.address || '');
        setPrimaryColor(b.primaryColor || '#0284c7');
        setAppUrl(b.dedicatedLiveUrl || b.appUrl || resolveBrandWebUrl(b));
        setTone(b.agentConfig?.tone || '');
        setShippingPolicy(b.agentConfig?.shippingPolicy || '');
        setForbiddenTopics(b.agentConfig?.forbiddenTopics || '');
        setFaq(b.agentConfig?.faq || '');
        setKnowledgeBase(b.knowledgeBase || '');
        setTestInput(getBrandIndustryDefaults(b).sampleQuestion);
      }
    } catch {
      // Fallback to initialBrand cleanly
    } finally {
      if (reqSeq === loadReqSeqRef.current) {
        setLoading(false);
      }
    }
  }, [activeBrandId]);

  const runHealthCheck = useCallback(async () => {
    if (!activeBrandId) return;
    setCheckingHealth(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(activeBrandId)}/health-check`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (data?.ok) {
        setHealthData(data);
      }
    } catch {
    } finally {
      setCheckingHealth(false);
    }
  }, [activeBrandId]);

  useEffect(() => {
    loadHub();
    setHealthData(null);
    setTestReply(null);
    setSaveMessage(null);
  }, [loadHub]);

  const handleDeployDedicatedVercel = async () => {
    if (!activeBrandId) return;
    setDeployingVercel(true);
    setSaveMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/deploy/dedicated-tenant', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrandId,
          englishSlug: brandData?.englishSlug || brandData?.slug || activeBrandId,
          brandName: name || brandData?.name,
          appTemplate: brandData?.appTemplate || 'products_erp',
          templateId: brandData?.templateId,
        }),
      });
      const data = await res.json();
      if (data?.ok && data?.dedicatedLiveUrl) {
        setAppUrl(data.dedicatedLiveUrl);
        setSaveMessage(`تم نشر التطبيق المستقل على Vercel بنجاح: ${data.dedicatedLiveUrl} 🚀`);
        await loadHub();
      } else {
        setSaveMessage(data?.message || data?.error || 'تعذر النشر على Vercel');
      }
    } catch (err: any) {
      setSaveMessage(err?.message || 'خطأ أثناء النشر على Vercel');
    } finally {
      setDeployingVercel(false);
    }
  };

  const handleActivateGrowthCycle = async () => {
    if (!activeBrandId) return;
    setActivatingGrowth(true);
    setSaveMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/brands/${encodeURIComponent(activeBrandId)}/activate-growth-cycle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ planPriceEgp: 5000 }),
      });
      const data = await res.json();
      if (data?.ok) {
        setSaveMessage(
          `تم إطلاق دورة النمو (${data.researchSource || 'AI'}) + خطة الإعلانات (${data.adBudgetEgp} ج.م) + الاستوديو + Vision QA ${data.studioJobId ? `[Job: ${data.studioJobId}]` : ''} ⚡`
        );
      } else {
        setSaveMessage(data?.error || 'تعذر إطلاق دورة النمو');
      }
    } catch (err: any) {
      setSaveMessage(err?.message || 'خطأ في الاتصال بدورة النمو');
    } finally {
      setActivatingGrowth(false);
    }
  };

  const handleSaveChanges = async (customSuccessMsg?: string) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(activeBrandId)}/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          phone,
          address,
          primaryColor,
          appUrl,
          agentConfig: { tone, shippingPolicy, forbiddenTopics, faq },
          knowledgeBase,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        if (knowledgeBase && knowledgeBase.trim().length > 8) {
          try {
            const scopeId = `brand:${activeBrandId}`;
            const segments = knowledgeBase
              .split(/\n+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 5)
              .slice(0, 8);
            for (const seg of segments) {
              await hybridMemory.storeVectorChunk({
                userId: scopeId,
                text: seg,
                category: 'fact',
              });
              await hybridMemory.extractAndStoreTriples(seg);
            }
          } catch {}
        }
        const flags = [
          data.firestoreSaved ? 'Firestore' : null,
          data.erpSynced ? 'التطبيق والفواتير' : null,
          data.agentSynced ? 'T2 AI Agent' : null,
          knowledgeBase?.trim() ? 'الذاكرة الدلالية' : null,
        ]
          .filter(Boolean)
          .join(' + ');
        setSaveMessage(
          customSuccessMsg ||
            (flags ? `تم الحفظ والمزامنة الفورية مع (${flags}) ✅` : 'تم حفظ التعديلات وتحديث ذاكرة البراند ✅')
        );
        await loadHub();
      } else {
        setSaveMessage(data?.error || 'تعذر حفظ التعديلات');
      }
    } catch (err: any) {
      setSaveMessage(err?.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!semanticQuery.trim()) return;
    setSearchingSemantic(true);
    try {
      const results = await hybridMemory.querySemanticVectors(semanticQuery, `brand:${activeBrandId}`, { topK: 3 });
      setSemanticHits(results.map((r) => ({ text: r.text, score: Math.round(r.score * 100) })));
    } catch {
      setSemanticHits([]);
    } finally {
      setSearchingSemantic(false);
    }
  };

  const handleSavePlaygroundCorrection = async () => {
    if (!testInput.trim() || !correctedAnswer.trim()) return;
    setSavingCorrection(true);
    setSaveMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(activeBrandId)}/playground-correct`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: testInput,
          botReply: testReply || '',
          correctedAnswer,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setSaveMessage('تم تدريب T2 AI Agent على الإجابة المصححة بنجاح ✅');
        setCorrectedAnswer('');
      } else {
        setSaveMessage(data?.error || 'تعذر حفظ التصحيح في الأجنت');
      }
    } catch (err: any) {
      setSaveMessage(err?.message || 'خطأ في الاتصال');
    } finally {
      setSavingCorrection(false);
    }
  };

  const handleSendManualReply = async (phoneTarget: string) => {
    if (!phoneTarget || !manualReplyText.trim()) return;
    setSendingManualReply(true);
    setSaveMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(activeBrandId)}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: phoneTarget, message: manualReplyText }),
      });
      const data = await res.json();
      if (data?.ok) {
        setSaveMessage(`تم إرسال ردك للعميل (${phoneTarget}) عبر T2 Agent ✅`);
        setManualReplyText('');
        setReplyTargetPhone(null);
        await loadHub();
      } else {
        setSaveMessage(data?.error || 'تعذر إرسال الرد');
      }
    } catch (err: any) {
      setSaveMessage(err?.message || 'خطأ في إرسال الرد');
    } finally {
      setSendingManualReply(false);
    }
  };

  const handleTestAgent = async () => {
    if (!testInput.trim()) return;
    setTestingAgent(true);
    setTestReply(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brand-hub/${encodeURIComponent(activeBrandId)}/test-agent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ customerMessage: testInput }),
      });
      const data = await res.json();
      setTestReply(data?.replyText || data?.error || 'لم يتم استلام رد');
    } catch (err: any) {
      setTestReply(err?.message || 'خطأ في اختبار الأجنت');
    } finally {
      setTestingAgent(false);
    }
  };

  const effectiveAppUrl = appUrl || resolveBrandWebUrl(brandData || initialBrand);

  const handleCopyAppUrl = () => {
    if (!effectiveAppUrl) return;
    navigator.clipboard?.writeText(effectiveAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const socialItems = [
    { key: 'whatsapp', label: 'WhatsApp', connected: healthData?.checks?.whatsappAgent?.ok ?? brandData?.socialConnections?.whatsapp },
    { key: 'facebook', label: 'Facebook', connected: healthData?.checks?.social?.facebook?.ok ?? brandData?.socialConnections?.facebook },
    { key: 'instagram', label: 'Instagram', connected: healthData?.checks?.social?.instagram?.ok ?? brandData?.socialConnections?.instagram },
    { key: 'tiktok', label: 'TikTok', connected: healthData?.checks?.social?.tiktok?.ok ?? brandData?.socialConnections?.tiktok },
    { key: 'youtube', label: 'YouTube', connected: healthData?.checks?.social?.youtube?.ok ?? brandData?.socialConnections?.youtube },
    { key: 'telegram', label: 'Telegram', connected: healthData?.checks?.social?.telegram?.ok ?? brandData?.socialConnections?.telegram },
  ];

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-3 font-['Cairo'] text-right animate-in fade-in duration-200" dir="rtl">
      {/* TOP BAR: BRAND HEADER + DIRECT APP LINK + LIVE HEALTH CHECK */}
      <div className="w-full p-3 md:p-4 rounded-2xl bg-[#04091a]/95 border border-cyan-500/35 shadow-[0_0_30px_rgba(0,240,255,0.12)] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            {isMasterAdmin && onBackToGrid && (
              <button
                onClick={onBackToGrid}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-white/80 text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                title="الرجوع لشبكة البراندات"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الشبكة</span>
              </button>
            )}
            {brandData?.logoUrl ? (
              <img
                src={brandData.logoUrl}
                alt={name}
                className="w-10 h-10 rounded-xl object-cover border border-cyan-400/40 shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shrink-0 shadow"
                style={{ backgroundColor: primaryColor || '#0284c7' }}
              >
                {(name || activeBrandId || 'B').slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-black text-white truncate">
                  {name || brandData?.name || activeBrandId}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold">
                  {brandData?.businessType || 'نشاط تجاري'}
                </span>
                {isMasterAdmin && availableBrands.length > 0 && (
                  <select
                    value={activeBrandId}
                    onChange={(e) => setActiveBrandId(e.target.value)}
                    className="bg-black/70 border border-cyan-500/40 rounded-lg px-2 py-0.5 text-[11px] font-bold text-cyan-200 focus:outline-none focus:border-cyan-400 max-w-[180px]"
                    title="التبديل المباشر بين البراندات"
                  >
                    {!availableBrands.some((b) => b.id === activeBrandId || b.slug === activeBrandId) && (
                      <option value={activeBrandId}>{name || activeBrandId}</option>
                    )}
                    {availableBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/80 font-mono truncate mt-0.5">
                <Globe className="w-3 h-3 shrink-0" />
                <a
                  href={effectiveAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline truncate"
                >
                  {effectiveAppUrl}
                </a>
                <button
                  onClick={handleCopyAppUrl}
                  className="p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                  title="نسخ رابط التطبيق"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => {
                if (effectiveAppUrl && /^(https?:\/\/|\/)/i.test(effectiveAppUrl)) {
                  window.open(effectiveAppUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح التطبيق</span>
            </button>
            {isMasterAdmin && (
              <>
                <button
                  onClick={handleDeployDedicatedVercel}
                  disabled={deployingVercel}
                  className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/45 text-violet-200 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                  title="بناء مستودع GitHub ونشر المتجر/التطبيق مستقلاً على Vercel"
                >
                  <Rocket className={`w-3.5 h-3.5 ${deployingVercel ? 'animate-pulse' : ''}`} />
                  <span>{deployingVercel ? 'جاري النشر...' : 'نشر/تحديث على Vercel'}</span>
                </button>
                <button
                  onClick={handleActivateGrowthCycle}
                  disabled={activatingGrowth}
                  className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/45 text-amber-200 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                  title="تشغيل بحث السوق + خطة 50% إعلانات + إنتاج المحتوى وVision QA في الاستوديو"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${activatingGrowth ? 'animate-spin' : ''}`} />
                  <span>{activatingGrowth ? 'جاري التشغيل...' : 'بحث السوق + إنتاج محتوى (QA)'}</span>
                </button>
              </>
            )}
            <button
              onClick={runHealthCheck}
              disabled={checkingHealth}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/45 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            >
              {checkingHealth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              <span>{checkingHealth ? 'جاري الفحص...' : 'فحص الاتصال'}</span>
            </button>
          </div>
        </div>

        {/* LIVE HEALTH CHECK STRIP (APPEARS ON CHECK) */}
        {healthData?.checks && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px]">
            <div className={`p-2 rounded-xl border flex items-center gap-2 ${healthData.checks.app?.ok ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200' : 'bg-rose-500/10 border-rose-500/35 text-rose-200'}`}>
              {healthData.checks.app?.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <div className="min-w-0">
                <div className="font-bold truncate">تطبيق الويب</div>
                <div className="text-[10px] opacity-80 truncate">{healthData.checks.app?.message} ({healthData.checks.app?.latencyMs}ms)</div>
              </div>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-2 ${healthData.checks.cloudErp?.ok ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200' : 'bg-amber-500/10 border-amber-500/35 text-amber-200'}`}>
              {healthData.checks.cloudErp?.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
              <div className="min-w-0">
                <div className="font-bold truncate">قاعدة السحابة</div>
                <div className="text-[10px] opacity-80 truncate">{healthData.checks.cloudErp?.message}</div>
              </div>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-2 ${healthData.checks.whatsappAgent?.ok ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200' : 'bg-amber-500/10 border-amber-500/35 text-amber-200'}`}>
              {healthData.checks.whatsappAgent?.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
              <div className="min-w-0">
                <div className="font-bold truncate">وكيل الواتساب</div>
                <div className="text-[10px] opacity-80 truncate">{healthData.checks.whatsappAgent?.message}</div>
              </div>
            </div>

            <div className="p-2 rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 shrink-0 text-cyan-300" />
              <div className="min-w-0">
                <div className="font-bold truncate">السوشيال المتصل</div>
                <div className="text-[10px] opacity-80 truncate">
                  {Object.values(healthData.checks.social || {}).filter((s: any) => s?.ok).length} من 5 منصات متصلة
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GUIDED 4-STEP CLIENT LIFECYCLE COCKPIT */}
        {(() => {
          const isTrialUser = brandData?.isTrial || brandData?.subscriptionStatus === 'trial' || brandData?.planId === 'trial_7d';
          const hasAppReady = Boolean(effectiveAppUrl);
          const hasChannelsLinked = Boolean(
            brandData?.whatsappConnected ||
            brandData?.metaConnected ||
            healthData?.checks?.whatsappAgent?.ok ||
            Object.values(healthData?.checks?.social || {}).some((s: any) => s?.ok)
          );
          const weekPlanArr = Array.isArray(brandData?.weekContentPlan) ? brandData.weekContentPlan : [];
          const hasShowroomApproved = weekPlanArr.some((p: any) => p?.clientApproval === 'approved' || p?.status === 'scheduled' || p?.status === 'published');
          const brandSlug = brandData?.slug || brandData?.id || activeBrandId;

          return (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#061229]/95 via-[#07182f]/95 to-[#0d102b]/95 border border-cyan-500/25 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-black text-cyan-200 flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                  خريطة تشغيل براندك في 4 خطوات
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={async () => {
                      setTestBookingResultUrl(null);
                      setTestBookingReceipt(null);
                      try {
                        const headers = await getAuthHeaders();
                        const targetBrandId = String(brandSlug || activeBrandId || 'clean_master');
                        const testPrice = '750 ج.م';
                        const testService = brandData?.appTemplate === 'services_booking' ? 'حجز تجربة فوري' : 'طلب تجربة فوري';
                        const res = await fetch('/api/jarvis/execute-action', {
                          method: 'POST',
                          credentials: 'include',
                          headers,
                          body: JSON.stringify({
                            actionType: 'CREATE_LIVE_BOOKING',
                            brandId: targetBrandId,
                            data: { customerName: 'عميل تجربة (Aha Test)', customerPhone: phone || '01099887766', service: testService, price: testPrice },
                          }),
                        });
                        const d = await res.json();
                        if (d?.success) {
                          const storeUrl =
                            (effectiveAppUrl && /^https?:\/\//i.test(effectiveAppUrl) ? effectiveAppUrl : '') ||
                            resolveBrandWebUrl(brandData || initialBrand) ||
                            `https://store.t2os.app/s/${encodeURIComponent(targetBrandId)}`;
                          setSaveMessage('✅ تم تسجيل حجز/طلب تجريبي حي وتحديث العدادات فوراً!');
                          setTestBookingResultUrl(storeUrl);
                          setTestBookingReceipt({
                            bookingId: String(d?.booking?.id || `TEST-${Date.now().toString().slice(-4)}`),
                            customerName: 'عميل تجربة (Aha Test)',
                            service: testService,
                            price: testPrice,
                            storeUrl,
                          });
                          window.dispatchEvent(new CustomEvent('t2_brand_stats_updated', {
                            detail: { brandId: targetBrandId, bookingsDelta: 1 },
                          }));
                          await loadHub();
                        } else {
                          setSaveMessage(d?.error || 'تعذر تنفيذ الاختبار');
                        }
                      } catch {
                        setSaveMessage('تعذر الاتصال بخدمة الاختبار التجريبي');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/40 text-[10px] font-black cursor-pointer transition"
                  >
                    🧪 اختبر براندك الآن (حجز تجريبي)
                  </button>
                  {isTrialUser && (
                    <a
                      href={`/pricing?brandId=${encodeURIComponent(String(brandSlug || ''))}&upgrade=1`}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 text-black text-[10px] font-black hover:opacity-95 transition"
                    >
                      ⚡ ترقية لباقة النمو (5,000 ج.م + 2,500 إعلانات)
                    </a>
                  )}
                </div>
              </div>
              {/* Unified Live Telemetry Strip (Single Source of Truth) */}
              {brandData?.stats && (
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                    <div className="font-black text-cyan-300">{brandData.stats.bookingsCount ?? 0}</div>
                    <div className="text-white/55">حجوزات حية</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                    <div className="font-black text-emerald-300">{brandData.stats.conversationsCount ?? 0}</div>
                    <div className="text-white/55">محادثات واتساب</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                    <div className="font-black text-amber-300">{brandData.stats.ordersCount ?? 0}</div>
                    <div className="text-white/55">طلبات المتجر</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                    <div className="font-black text-purple-300">{brandData.stats.postsCount ?? 0}</div>
                    <div className="text-white/55">منشورات الخطة</div>
                  </div>
                </div>
              )}
              {(testBookingReceipt || testBookingResultUrl) && (
                <div className="px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black">تجريبي</span>
                      <span className="text-cyan-100 font-bold">
                        تم تسجيل الطلب التجريبي بنجاح {testBookingReceipt ? `(#${testBookingReceipt.bookingId})` : ''} — {testBookingReceipt?.service} ({testBookingReceipt?.price})
                      </span>
                    </div>
                  </div>
                  <a
                    href={testBookingReceipt?.storeUrl || testBookingResultUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-cyan-400 text-slate-950 font-black shrink-0"
                  >
                    فتح المتجر ↗
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSection('app')}
                  className={`p-2 rounded-xl border text-right transition cursor-pointer ${hasAppReady ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 text-white/70'}`}
                >
                  <div className="font-black">1. الهوية والتطبيق {hasAppReady ? '✅' : '⏳'}</div>
                  <div className="opacity-75 truncate">الكتالوج والبيانات</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSection('agent')}
                  className={`p-2 rounded-xl border text-right transition cursor-pointer ${hasChannelsLinked ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200' : 'bg-cyan-500/10 border-cyan-400/35 text-cyan-100'}`}
                >
                  <div className="font-black">2. الأجنت والقنوات {hasChannelsLinked ? '✅' : '👈'}</div>
                  <div className="opacity-75 truncate">ربط واتساب وميتا</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenStudioCalendar) onOpenStudioCalendar();
                    else setSection('social');
                  }}
                  className={`p-2 rounded-xl border text-right transition cursor-pointer ${hasShowroomApproved ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200' : 'bg-purple-500/10 border-purple-400/35 text-purple-100'}`}
                >
                  <div className="font-black">3. الشو روم والنشر {hasShowroomApproved ? '✅' : '🎨'}</div>
                  <div className="opacity-75 truncate">مراجعة واعتماد المحتوى</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isTrialUser && onOpenAdLauncher) {
                      onOpenAdLauncher();
                    } else {
                      window.location.assign(`/pricing?brandId=${encodeURIComponent(String(brandSlug || ''))}&upgrade=1`);
                    }
                  }}
                  className="p-2 rounded-xl border bg-amber-500/10 border-amber-400/35 text-amber-200 hover:bg-amber-500/20 text-right transition block cursor-pointer"
                >
                  <div className="font-black">4. الانطلاق والإعلانات 🚀</div>
                  <div className="opacity-75 truncate">{isTrialUser ? 'فعّل باقة النمو' : 'إدارة الحملة'}</div>
                </button>
              </div>
            </div>
          );
        })()}

        {/* 4 PILLARS NAVIGATION TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          {[
            { id: 'app', label: 'التطبيق والهوية', icon: Smartphone },
            { id: 'social', label: 'السوشيال والاستوديو', icon: Share2 },
            { id: 'agent', label: 'الأجنت وشات العملاء', icon: Bot },
            { id: 'brain', label: 'تغذية المعرفة', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSection(tab.id as HubSection)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/65 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {saveMessage && (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center justify-between">
          <span>{saveMessage}</span>
          <button onClick={() => setSaveMessage(null)} className="text-white/60 hover:text-white cursor-pointer">×</button>
        </div>
      )}

      {/* MAIN CONTENT BODY FOR ACTIVE PILLAR */}
      <div className="w-full flex-1 overflow-y-auto pr-0.5 space-y-3">
        {loading && !brandData ? (
          <div className="p-8 text-center text-cyan-300/80 text-xs font-bold">جاري تحميل غرفة قيادة البراند...</div>
        ) : null}

        {/* PILLAR 1: APP & IDENTITY */}
        {section === 'app' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4" />
                  إعدادات التطبيق والهوية (متزامنة مع الفاتورة والمتجر)
                </h4>
                <button
                  onClick={() => window.open(`${effectiveAppUrl.replace(/\/$/, '')}/?admin=1`, '_blank', 'noopener,noreferrer')}
                  className="text-[11px] font-bold text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>فتح لوحة أدمن التطبيق</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">اسم البراند / المتجر</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 flex items-center gap-1 mb-1">
                    <Phone className="w-3 h-3" /> رقم الموبايل / الواتساب (الفوتر والفاتورة)
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs text-right focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> العنوان الرسمي
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">لون الثيم الرئيسي</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor || '#0284c7'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                    />
                    <input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      dir="ltr"
                      className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/60 flex items-center gap-1 mb-1">
                  <Link2 className="w-3 h-3" /> رابط تطبيق الويب الفعلي للعميل (Vercel / Domain)
                </label>
                <input
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-cyan-300 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleSaveChanges()}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ ومزامنة مع التطبيق الآن'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white">
                  الكتالوج الحي ({(brandData?.productsCatalog || []).length} عنصر)
                </h4>
                <button
                  onClick={() => window.open(effectiveAppUrl, '_blank', 'noopener,noreferrer')}
                  className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                >
                  عرض في المتجر ↗
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {(brandData?.productsCatalog || []).length === 0 ? (
                  <p className="text-xs text-white/50 py-6 text-center">لا توجد منتجات مسجلة في الكتالوج حالياً.</p>
                ) : (
                  (brandData?.productsCatalog || []).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="p-2.5 rounded-xl bg-black/45 border border-white/10 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-white/50 truncate">{item.category || 'عام'} {item.sku ? `• ${item.sku}` : ''}</div>
                      </div>
                      <span className="text-xs font-black text-cyan-300 shrink-0">
                        {item.sellingPrice || item.numericPrice || item.price || 0} ج.م
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PILLAR 2: SOCIAL & STUDIO */}
        {section === 'social' && (
          <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-black text-cyan-300">حالة القنوات والمنصات المتصلة</h4>
                <p className="text-[11px] text-white/60">تأكد من جاهزية كل منصة قبل النشر أو تشغيل الرد الآلي</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsMediaVaultOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/45 text-purple-200 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>معرض الميديا 3D (Workspace)</span>
                </button>
                {onOpenMetaModal && (
                  <button
                    onClick={() => onOpenMetaModal(activeBrandId)}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold cursor-pointer"
                  >
                    ربط فيسبوك وإنستجرام
                  </button>
                )}
                {onOpenStudioCalendar && (
                  <button
                    onClick={onOpenStudioCalendar}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>فتح تقويم ستوديو</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {socialItems.map((s) => (
                <div
                  key={s.key}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    s.connected
                      ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{s.label}</div>
                    <div className="text-[10px] opacity-80">{s.connected ? 'متصل وجاهز' : 'غير مربوط بعد'}</div>
                  </div>
                  {s.connected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400/80 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PILLAR 3: SALES AGENT TRAINING & LIVE INBOX */}
        {section === 'agent' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  تدريب وكيل المبيعات للبراند
                </h4>
                {onOpenWhatsAppModal && (
                  <button
                    onClick={() => onOpenWhatsAppModal(activeBrandId)}
                    className="text-[11px] font-bold text-emerald-300 hover:underline cursor-pointer"
                  >
                    إعدادات ربط الواتساب ↗
                  </button>
                )}
              </div>

              <div>
                <label className="text-[10px] text-white/60 block mb-1">أسلوب ونبرة الرد</label>
                <input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 block mb-1">سياسة الشحن والضمان والدفع</label>
                <textarea
                  rows={2}
                  value={shippingPolicy}
                  onChange={(e) => setShippingPolicy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 block mb-1">قواعد ممنوعة / تنبيهات للأجنت</label>
                <textarea
                  rows={2}
                  value={forbiddenTopics}
                  onChange={(e) => setForbiddenTopics(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleSaveChanges('تم حفظ تدريب الأجنت وتفعيله فوراً ✅')}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ تدريب الأجنت</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  تجربة وتدريب T2 Agent + شات العملاء الفعلي
                </h4>
                <button
                  onClick={async () => {
                    try {
                      const headers = await getAuthHeaders();
                      const res = await fetch(`/api/embed/signed-urls?brandId=${encodeURIComponent(activeBrandId)}&window=crm`, { headers });
                      const d = await res.json().catch(() => null);
                      if (d?.ok && d?.agentFullUrl) {
                        window.open(d.agentFullUrl, '_blank', 'noopener,noreferrer');
                        return;
                      }
                    } catch {}
                    window.open(brandData?.agentPortalUrl || `https://agent.t2os.app/dashboard?brandId=${encodeURIComponent(activeBrandId)}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="text-[11px] font-bold text-purple-300 hover:underline cursor-pointer"
                >
                  فتح شاشة T2 Agent الكاملة ↗
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestAgent()}
                  placeholder="اكتب سؤال عميل لتجربة رد الأجنت..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
                <button
                  onClick={handleTestAgent}
                  disabled={testingAgent}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingAgent ? '...' : 'اختبر'}</span>
                </button>
              </div>

              {testReply && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/35 text-xs text-white space-y-2 leading-relaxed">
                  <div className="text-[10px] font-bold text-cyan-300">رد وكيل المبيعات التجريبي:</div>
                  <div>{testReply}</div>
                  <div className="pt-2 border-t border-white/10 flex gap-2">
                    <input
                      value={correctedAnswer}
                      onChange={(e) => setCorrectedAnswer(e.target.value)}
                      placeholder="لو الرد محتاج تعديل: اكتب الإجابة الصح هنا لتدريب T2 Agent..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-[11px] focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                      onClick={handleSavePlaygroundCorrection}
                      disabled={savingCorrection || !correctedAnswer.trim()}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {savingCorrection ? '...' : 'حفظ التدريب'}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/10 space-y-2 max-h-56 overflow-y-auto">
                <div className="flex items-center justify-between text-[10px] font-bold text-white/60">
                  <span>
                    محادثات العملاء ({brandData?.liveAgentSource === 't2_ai_agent_live' ? 'مربوط حياً مع T2 Agent ✅' : 'متصل عند تشغيل T2 Agent'})
                  </span>
                  <span>{(brandData?.recentConversations || []).length} محادثة</span>
                </div>
                {(brandData?.recentConversations || []).length === 0 ? (
                  <p className="text-[11px] text-white/45 py-3 text-center">لا توجد محادثات مسجلة لهذا البراند في T2 Agent حالياً.</p>
                ) : (
                  (brandData?.recentConversations || []).map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-black/45 border border-white/10 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-white/60 text-[10px]">
                        <span className="font-bold text-cyan-300">{c.customerName} ({c.channel})</span>
                        <div className="flex items-center gap-2">
                          <span>{c.time}</span>
                          {c.phone && (
                            <button
                              onClick={() => setReplyTargetPhone(replyTargetPhone === c.phone ? null : c.phone)}
                              className="text-emerald-300 hover:underline font-bold cursor-pointer"
                            >
                              رد يدوي
                            </button>
                          )}
                        </div>
                      </div>
                      {c.lastMessage && <div className="text-white/90">العميل: {c.lastMessage}</div>}
                      {c.agentReply && <div className="text-emerald-300/90">الأجنت: {c.agentReply}</div>}
                      {replyTargetPhone === c.phone && c.phone && (
                        <div className="flex gap-1.5 pt-1">
                          <input
                            value={manualReplyText}
                            onChange={(e) => setManualReplyText(e.target.value)}
                            placeholder="اكتب ردك المباشر على واتساب/سوشيال العميل..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/70 border border-emerald-400/40 text-white text-[11px] focus:outline-none"
                          />
                          <button
                            onClick={() => handleSendManualReply(c.phone)}
                            disabled={sendingManualReply || !manualReplyText.trim()}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black cursor-pointer disabled:opacity-50"
                          >
                            {sendingManualReply ? '...' : 'إرسال'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PILLAR 4: UNIFIED KNOWLEDGE BASE */}
        {section === 'brain' && (
          <div className="p-4 rounded-2xl bg-[#04091a]/90 border border-white/10 space-y-3">
            <div>
              <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                بنك المعرفة الموحد (يغذي التطبيق + الأجنت + الاستوديو معاً)
              </h4>
              <p className="text-[11px] text-white/60 mt-0.5">
                أضف هنا أي تفاصيل عن البراند، العروض الحالية، الفروع، مواعيد العمل، أو الأسئلة المتكررة، وسيعتمدها الأجنت والاستوديو فوراً.
              </p>
            </div>
            <textarea
              rows={7}
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              placeholder={getBrandIndustryDefaults(brandData || initialBrand).kbPlaceholder}
              className="w-full p-3 rounded-xl bg-black/55 border border-white/15 text-white text-xs leading-relaxed focus:border-amber-400 focus:outline-none"
            />
            <button
              onClick={() => handleSaveChanges('تم تحديث بنك المعرفة وفهرسته في الذاكرة الدلالية ✅')}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'جاري التحديث...' : 'حفظ وفهرسة في الذاكرة الدلالية'}</span>
            </button>

            {/* Semantic Memory Search Verification */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-cyan-300">اختبار الذاكرة الدلالية (Vector Search) للبراند:</div>
              <div className="flex gap-2">
                <input
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                  placeholder="اسأل بأي صياغة للتأكد من استرجاع المعلومة دلالياً..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
                <button
                  onClick={handleSemanticSearch}
                  disabled={searchingSemantic}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{searchingSemantic ? '...' : 'بحث دلالي'}</span>
                </button>
              </div>
              {semanticHits.length > 0 && (
                <div className="space-y-1.5">
                  {semanticHits.map((h, i) => (
                    <div key={i} className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-[11px] text-white flex items-center justify-between gap-2">
                      <span className="truncate">{h.text}</span>
                      <span className="text-[10px] font-mono text-emerald-300 shrink-0">{h.score}% تطابق</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BRAND MEDIA GALLERY & OPTIONAL 3D WORKSPACE OVERLAY */}
      {isMediaVaultOpen && (
        <div className="fixed inset-0 z-[260] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#020614] border-b border-purple-500/40 flex-wrap gap-2">
            <span className="text-xs sm:text-sm font-black text-purple-200 flex items-center gap-2">
              <Box className="w-4 h-4 text-purple-400" />
              معرض ميديا وأصول براند ({name || brandData?.name || activeBrandId})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShow3DWorkspaceInVault((v) => !v)}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/40 text-purple-200 text-xs font-bold cursor-pointer"
              >
                {show3DWorkspaceInVault ? 'عرض شبكة الأصول' : 'عرض الفضاء ثلاثي الأبعاد 3D'}
              </button>
              <button
                onClick={() => { setIsMediaVaultOpen(false); setShow3DWorkspaceInVault(false); }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-200 text-xs font-bold cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative overflow-y-auto p-4">
            {show3DWorkspaceInVault ? (
              <React.Suspense fallback={<div className="p-10 text-center text-purple-300 text-xs">جاري فتح الفضاء ثلاثي الأبعاد...</div>}>
                <WorkspaceExplorer
                  userId={activeBrandId}
                  onItemSelect={() => {}}
                  onBack={() => setShow3DWorkspaceInVault(false)}
                />
              </React.Suspense>
            ) : (() => {
              const assets: any[] = Array.isArray(brandData?.mediaAssets) ? brandData.mediaAssets : [];
              if (assets.length === 0) {
                return (
                  <div className="max-w-lg mx-auto mt-10 p-6 rounded-2xl bg-[#060d24] border border-purple-500/35 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-purple-300 mx-auto" />
                    <div className="text-sm font-black text-white">لا توجد تصميمات أو فيديوهات مولّدة بعد لهذا البراند</div>
                    <p className="text-xs text-white/65">اضغط على "فتح تقويم ستوديو" لتوليد تصميمات السوشيال وفيديوهات الريلز وحفظها هنا تلقائياً.</p>
                    {onOpenStudioCalendar && (
                      <button
                        type="button"
                        onClick={() => { setIsMediaVaultOpen(false); onOpenStudioCalendar(); }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-slate-950 text-xs font-black cursor-pointer"
                      >
                        توليد محتوى في تيتو ستوديو الآن
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assets.map((asset: any, idx: number) => (
                    <div key={asset.id || idx} className="rounded-2xl bg-[#070f26] border border-white/15 overflow-hidden flex flex-col justify-between">
                      {asset.mediaFormat === 'video' ? (
                        <video src={asset.url} controls className="w-full h-44 object-cover bg-black" />
                      ) : (
                        <img src={asset.url} alt={asset.title || `أصل ${idx + 1}`} className="w-full h-44 object-cover bg-black" />
                      )}
                      <div className="p-3 space-y-2">
                        <div className="text-xs font-bold text-white line-clamp-2">{asset.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-white/60">
                          <span>{asset.day || asset.mediaFormat}</span>
                          <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline font-bold">فتح ↗</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
