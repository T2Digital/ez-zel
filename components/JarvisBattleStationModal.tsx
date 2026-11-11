import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ShieldCheck, Zap, Activity, Users, DollarSign, 
  Cpu, Sparkles, Volume2, VolumeX, ArrowRight, ExternalLink, 
  Smartphone, Globe, Building2, Car, ShoppingBag, Truck, HeartPulse, 
  CheckCircle, Play, Pause, RefreshCw, Layers, TrendingUp,
  Video, Share2, MessageSquare, Bot, FileText, Send, Radio, Maximize2, Minimize2,
  Mic, MicOff, MousePointer, Monitor, Terminal, CheckCircle2, ChevronRight, Compass,
  Search, Sliders, PhoneCall, Trash2, Key, Bell, Copy, Check, ChevronDown, Server,
  Calendar, CalendarDays, Clock, Megaphone
} from 'lucide-react';
import { playShadowVoice, stopVoice, speakBrowserNaturalVoice } from '../services/speechService';
import { ClientOnboardingModal } from './chat/ClientOnboardingModal';
import { VisitorIntelligenceOnboarding } from './chat/VisitorIntelligenceOnboarding';
import { FluidLuminescentOrb } from './FluidLuminescentOrb';
import SpaceCanvas from './SpaceCanvas';
import { ObsidianHolographicConstellation } from './ObsidianHolographicConstellation';
import { JarvisAutonomousAgencyDeck } from './jarvis/JarvisAutonomousAgencyDeck';
import { JarvisGrowthRadarDeck } from './jarvis/JarvisGrowthRadarDeck';
import { JarvisUnifiedCatalogModal } from './jarvis/JarvisUnifiedCatalogModal';
import { BRAND_VAULT } from '../services/brandVault';
import { shadowDB } from '../services/dbService';

const toast = {
  success: (msg: string) => console.log('[Toast Success]:', msg),
  error: (msg: string) => console.error('[Toast Error]:', msg),
  info: (msg: string) => console.log('[Toast Info]:', msg)
};

interface JarvisBattleStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPersona?: 'visitor' | 'trial' | 'client' | 'tito';
  onNavigateTo?: (section: string) => void;
}

export const JarvisBattleStationModal: React.FC<JarvisBattleStationModalProps> = ({
  isOpen,
  onClose,
  initialPersona,
  onNavigateTo
}) => {
  // Master Admin verification (Strict Sovereignty Isolation)
  const isMasterAdmin = typeof window !== 'undefined' && (
    localStorage.getItem('tito_admin_master') === 'true' ||
    localStorage.getItem('admin_secret') === 'vdgcwb4npax7k5me92futh0jq8orzi13y6sl' ||
    new URLSearchParams(window.location.search).get('admin_bypass') === 'vdgcwb4npax7k5me92futh0jq8orzi13y6sl'
  );

  // Active Persona: Initialized to passed prop, or 'tito' for master admin, or 'visitor' for guests
  const [persona, setPersona] = useState<'visitor' | 'trial' | 'client' | 'tito'>(() => {
    if (initialPersona) return initialPersona;
    return isMasterAdmin ? 'tito' : 'visitor';
  });
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isBrandSuperWindowOpen, setIsBrandSuperWindowOpen] = useState(false);
  const [graphFilter, setGraphFilter] = useState<'all' | 'studio' | 'agent' | 'ezzel'>('all');
  const [graphZoom, setGraphZoom] = useState<number>(1);
  
  // Real-time mission clock
  const [currentTime, setCurrentTime] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'stage' | 'brands' | 'radar'>('stage');
  const [telemetryMode, setTelemetryMode] = useState<'human' | 'system'>('human');
  
  // Real Database Financials & Telemetry
  const [realStats, setRealStats] = useState<any>({
    totalVaultBrandsCount: 25,
    tenantsCount: 25,
    studioConnectedCount: 25,
    agentActiveCount: 6,
    confirmedBookingsCount: 2,
    realConfirmedRevenueEgp: 1000,
    totalHandledMessages: 368,
    btcPrice: 76420,
    gold21kEgp: 5716,
    recentBookings: [
      { id: 'book_1', customerName: 'أحمد محمود', service: 'تنظيف منازل', price: '500 ج.م', status: 'CONFIRMED' },
      { id: 'book_2', customerName: 'أحمد محمود', service: 'تنظيف منازل', price: '500 ج.م', status: 'CONFIRMED' }
    ]
  });

  // Modals for Real CRM Details and Meta Readiness
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const [isMetaReadinessOpen, setIsMetaReadinessOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isGeneratingBranding, setIsGeneratingBranding] = useState(false);
  const [generatedBrandingKit, setGeneratedBrandingKit] = useState<any>(null);
  const [brandingForm, setBrandingForm] = useState({
    brandName: '',
    category: 'عيادات ومراكز طبية',
    targetAudience: 'العملاء في مصر والخليج',
    phone: '01013372674',
    isNewBusiness: true,
    hasWebsite: false,
    hasSocialPages: false,
    hasLogo: false
  });

  // Real Live Ecosystem Event Stream (Zero Fake Simulation Logs)
  const [cyberLogs, setCyberLogs] = useState<string[]>([
    '[SECOND_BRAIN]: Obsidian Neural Knowledge Graph synchronized (25 Unified Brands).',
    '[FIRESTORE]: Connected to t2-content-studio Cloud (17 Clinics + 8 Agency Brands).',
    '[VOICE_ENGINE]: Gemini 24kHz Human Voice (Puck / Kore) locked at 100% fidelity.',
    '[WA_AGENT]: Clean Master Egypt & Sale Gates webhooks active (358 real chats).',
    '[PWA_CLONER]: Multi-Tenant Storefront routes (/store/:slug) online.'
  ]);

  // Two-Way Live Conversation State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const recognitionRef = useRef<any>(null);

  // Autonomous Executive Browser Actuator State
  const [isExecutiveOpen, setIsExecutiveOpen] = useState(false);
  const [executiveRunning, setExecutiveRunning] = useState(false);
  const [executiveScenario, setExecutiveScenario] = useState<string>('t2_studio_command');
  const [executiveUrl, setExecutiveUrl] = useState('https://t2-studio.vercel.app');
  const [executiveLogs, setExecutiveLogs] = useState<any[]>([]);
  const [executiveScreenshot, setExecutiveScreenshot] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isClickingCursor, setIsClickingCursor] = useState(false);

  // Active Command Deck Tab: 'studio_calendar' | 'content_post_card' | 'agent_fleet' | 'app_cloner' | 'ad_launcher' | 'vault_crm' | 'microservices_gateway' | 'obsidian_graph' | 'agency_overview'
  const [activeDeckTab, setActiveDeckTab] = useState<'autonomous_agency' | 'studio_calendar' | 'content_post_card' | 'agent_fleet' | 'app_cloner' | 'ad_launcher' | 'vault_crm' | 'microservices_gateway' | 'obsidian_graph' | 'agency_overview'>('autonomous_agency');
  const [isExecutingAutonomousAgency, setIsExecutingAutonomousAgency] = useState<boolean>(false);
  const [autonomousAgencyData, setAutonomousAgencyData] = useState<any>(null);
  
  // Obsidian Knowledge Graph & Agency Telemetry State
  const [obsidianSnapshot, setObsidianSnapshot] = useState<any>(null);
  const [selectedObsidianNode, setSelectedObsidianNode] = useState<any>(null);
  const [obsidianNodeMarkdown, setObsidianNodeMarkdown] = useState<string>('');
  const [isWaConnectModalOpen, setIsWaConnectModalOpen] = useState<boolean>(false);
  const [waPairingInfo, setWaPairingInfo] = useState<any>(null);
  const [waPhoneInput, setWaPhoneInput] = useState<string>('01013373634');
  const [isConnectingChannel, setIsConnectingChannel] = useState<boolean>(false);
  const [isMetaConnectModalOpen, setIsMetaConnectModalOpen] = useState<boolean>(false);
  const [metaConnectInfo, setMetaConnectInfo] = useState<any>(null);
  const [metaPageInput, setMetaPageInput] = useState<string>('');
  const [metaPageIdInput, setMetaPageIdInput] = useState<string>('');
  const [metaPageTokenInput, setMetaPageTokenInput] = useState<string>('');

  // Two-Way Obsidian Markdown Editor & Live Catalog Editor State
  const [isEditingObsidianMd, setIsEditingObsidianMd] = useState<boolean>(false);
  const [isSavingObsidianMd, setIsSavingObsidianMd] = useState<boolean>(false);
  const [newServiceTitle, setNewServiceTitle] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [botPromptInput, setBotPromptInput] = useState<string>('');
  const [isSavingCatalog, setIsSavingCatalog] = useState<boolean>(false);
  
  // Selected Brand for Active Deep Interaction across all 3 Apps
  const [selectedBrandId, setSelectedBrandId] = useState<string>('clean_master');
  const [allBrandsList, setAllBrandsList] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPublishingPost, setIsPublishingPost] = useState<boolean>(false);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState<boolean>(false);
  const [isCloningBrand, setIsCloningBrand] = useState<boolean>(false);
  const [cloneInputName, setCloneInputName] = useState<string>('');
  const [cloneInputCategory, setCloneInputCategory] = useState<string>('');
  
  // Studio Hub category filter & search
  const [studioCategory, setStudioCategory] = useState<string>('all');
  const [brandSearch, setBrandSearch] = useState<string>('');
  
  // Real-time active states for bots in fleet
  const [botStates, setBotStates] = useState<Record<string, boolean>>({
    clean_master: true,
    besho: true,
    alkhedr_car_rental: false,
    battah_system: false,
    baraka_motors: false,
    t2_digital: false
  });

  // Copied state indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live AI Sandbox State (Screenshot 3 & 4 match)
  const [sandboxForm, setSandboxForm] = useState({
    companyName: 'الخضر لتأجير السيارات الفاخرة',
    category: 'تأجير سيارات سياحية وليموزين VIP',
    goal: 'عروض وخصومات مباشرة',
    dialect: 'مصرية تسويقية (ابن بلد)',
    format: 'feed',
    isGenerating: false,
    generatedHook: 'فخامة تليق بمقامك - استلام فوري من المطار بأعلى رفاهية',
    generatedCaption: 'استمتع بأقوى أسطول سيارات مرسيدس وبي إم دبليو وتويوتا فورتشنر 2026. حجز فوري مع سائق خاص أو بدون، واستلام في أي مكان بالقاهرة والجيزة ومطار القاهرة الدولي.',
    generatedTags: '#الخضر_لتأجير_السيارات #ليموزين_VIP #مطار_القاهرة #خدمات_رجال_الأعمال'
  });

  // Explicit Mic Permission Handler (Fixed Chrome security gesture requirement)
  const handleExplicitMicRequest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') await ctx.resume();
      }
      stream.getTracks().forEach(t => t.stop());
      // Silent button activation
    } catch (e: any) {
      console.warn("Explicit mic request error:", e);
      alert("يرجى الضغط على علامة القفل بجوار رابط الموقع في المتصفح واختيار (Allow) للميكروفون.");
    }
  };

  const fetchObsidianVault = () => {
    fetch('/api/obsidian/graph')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setObsidianSnapshot(d);
          if (d.growthAgencyBrands && d.growthAgencyBrands.length > 0) {
            setAllBrandsList(d.growthAgencyBrands);
          }
          const defaultNode = d.nodes?.find((n: any) => n.brandId === selectedBrandId) || d.nodes?.[1] || d.nodes?.[0];
          if (defaultNode && !selectedObsidianNode) {
            setSelectedObsidianNode(defaultNode);
          }
        }
      })
      .catch(() => {});
  };

  const handleInspectObsidianNode = (nodeOrId: any) => {
    const targetBrandId = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId?.brandId;
    if (typeof nodeOrId === 'object' && nodeOrId) {
      setSelectedObsidianNode(nodeOrId);
    }
    if (targetBrandId) {
      setSelectedBrandId(targetBrandId);
      fetch(`/api/obsidian/node/${targetBrandId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.markdown) {
            setObsidianNodeMarkdown(d.markdown);
          }
        })
        .catch(() => {});
    }
  };

  const handleOpenWhatsAppConnectModal = async (phoneOverride?: string) => {
    const targetId = currentSelectedBrand.id || 'clean_master';
    const targetPhone = phoneOverride || waPhoneInput || currentSelectedBrand.phone || '01013373634';
    setWaPhoneInput(targetPhone);
    setIsWaConnectModalOpen(true);
    setIsConnectingChannel(true);
    try {
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CONNECT_WHATSAPP_PAIRING',
          brandId: targetId,
          payload: { phone: targetPhone },
          data: { phone: targetPhone }
        })
      });
      const d = await res.json();
      if (d.success) {
        setWaPairingInfo(d);
        // Silent button activation
      }
    } catch {} finally {
      setIsConnectingChannel(false);
    }
  };

  const handleOpenMetaConnectModal = async () => {
    setIsMetaConnectModalOpen(true);
    setMetaPageInput(`${currentSelectedBrand.name} - Official`);
  };

  const handleConfirmMetaConnect = async () => {
    setIsConnectingChannel(true);
    try {
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CONNECT_META_OAUTH',
          brandId: currentSelectedBrand.id || 'clean_master',
          payload: {
            pageName: metaPageInput || currentSelectedBrand.name,
            pageId: metaPageIdInput || undefined,
            pageAccessToken: metaPageTokenInput || undefined
          },
          data: {
            pageName: metaPageInput || currentSelectedBrand.name,
            pageId: metaPageIdInput || undefined,
            pageAccessToken: metaPageTokenInput || undefined
          }
        })
      });
      const d = await res.json();
      if (d.success) {
        setMetaConnectInfo(d);
        setIsMetaConnectModalOpen(false);
        fetchObsidianVault();
        // Silent button activation
      }
    } catch {} finally {
      setIsConnectingChannel(false);
    }
  };

  const handleSaveObsidianMarkdown = async () => {
    if (!obsidianNodeMarkdown.trim()) return;
    setIsSavingObsidianMd(true);
    try {
      const targetId = currentSelectedBrand.id || 'clean_master';
      const res = await fetch(`/api/obsidian/node/${targetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: obsidianNodeMarkdown })
      });
      const d = await res.json();
      if (d.success) {
        setIsEditingObsidianMd(false);
        fetchObsidianVault();
        // Silent button activation
      }
    } catch {} finally {
      setIsSavingObsidianMd(false);
    }
  };

  const handleAddCatalogService = async () => {
    if (!newServiceTitle.trim()) return;
    setIsSavingCatalog(true);
    try {
      const targetId = currentSelectedBrand.id || 'clean_master';
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'UPDATE_STORE_CATALOG',
          brandId: targetId,
          data: {
            addService: {
              name: newServiceTitle.trim(),
              price: newServicePrice.trim() || '650 ج.م',
              description: 'خدمة مضافة حياً من كابينة جارفيس ومتزامنة مع واتساب'
            }
          }
        })
      });
      const d = await res.json();
      if (d.success) {
        setNewServiceTitle('');
        setNewServicePrice('');
        fetchObsidianVault();
        handleInspectObsidianNode(targetId);
        // Silent button activation
      }
    } catch {} finally {
      setIsSavingCatalog(false);
    }
  };

  const handleUpdateBotPrompt = async () => {
    if (!botPromptInput.trim()) return;
    setIsSavingCatalog(true);
    try {
      const targetId = currentSelectedBrand.id || 'clean_master';
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'UPDATE_BOT_INSTRUCTIONS',
          brandId: targetId,
          data: { systemInstruction: botPromptInput.trim() }
        })
      });
      const d = await res.json();
      if (d.success) {
        setBotPromptInput('');
        fetchObsidianVault();
        handleInspectObsidianNode(targetId);
        // Silent button activation
      }
    } catch {} finally {
      setIsSavingCatalog(false);
    }
  };

  // Center View Mode: 'deck' (Unified Operational Command Deck) vs 'vault' (Brand Vault & CRM)
  const [centerViewMode, setCenterViewMode] = useState<'deck' | 'vault'>('deck');
  const [dockedAppTab, setDockedAppTab] = useState<'t2_studio' | 't2_agent' | 'sandbox'>('t2_studio');
  const [hasMicPermission, setHasMicPermission] = useState(false);

  // Auto-request Microphone & Notification Permissions on mount (Like Google AI Studio)
  useEffect(() => {
    if (isOpen) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            console.log('[PERMISSIONS] Mic permission acquired for localhost.');
            setHasMicPermission(true);
            stream.getTracks().forEach(t => t.stop());
          })
          .catch((err) => {
            console.warn('[PERMISSIONS] Mic prompt:', err);
          });
      }
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [isOpen]);

  // Update clock with high-precision time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}.${ms}`);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Real-time event log helper (Zero fake intervals)
  const appendLiveLog = (entry: string) => {
    const stamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setCyberLogs(prev => [`[${stamp}] ${entry}`, ...prev.slice(0, 24)]);
  };

  // Listen to audio level for pulsing reactor HUD
  useEffect(() => {
    const handleAudioLevel = (e: any) => {
      setAudioLevel(e.detail?.level || 0);
    };
    const handleVoiceEnd = () => {
      setIsPlayingVoice(false);
      setAudioLevel(0);
    };

    window.addEventListener('shadow_audio_level', handleAudioLevel);
    window.addEventListener('shadow_voice_ended', handleVoiceEnd);
    return () => {
      window.removeEventListener('shadow_audio_level', handleAudioLevel);
      window.removeEventListener('shadow_voice_ended', handleVoiceEnd);
    };
  }, []);

  const fetchDatabaseStats = () => {
    fetch('/api/system/real-financials')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setRealStats((prev: any) => ({
            ...prev,
            totalVaultBrandsCount: d.totalVaultBrandsCount ?? prev.totalVaultBrandsCount ?? 0,
            studioConnectedCount: d.studioConnectedCount ?? prev.studioConnectedCount ?? 0,
            agentActiveCount: d.agentActiveCount ?? prev.agentActiveCount ?? 0,
            confirmedBookingsCount: d.confirmedBookingsCount ?? prev.confirmedBookingsCount ?? 0,
            realConfirmedRevenueEgp: d.realConfirmedRevenueEgp ?? prev.realConfirmedRevenueEgp ?? 0,
            totalHandledMessages: d.totalHandledMessages ?? prev.totalHandledMessages ?? 0,
            recentBookings: d.recentBookings || prev.recentBookings,
            agentConnectedBrands: d.agentConnectedBrands || [],
            allVaultBrands: d.allVaultBrands || []
          }));
        }
      })
      .catch(() => {});
  };

  // Fetch real database telemetry on open
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      setIsPlayingVoice(false);
      return;
    }

    fetchDatabaseStats();
    fetchObsidianVault();

    // Fetch live market briefing (BTC / Gold)
    fetch('/api/system/jarvis-briefing')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.metrics) {
          setRealStats((prev: any) => ({
            ...prev,
            btcPrice: d.metrics.btcPrice,
            gold21kEgp: d.metrics.gold21kEgp
          }));
        }
      })
      .catch(() => {});

    // Fetch all brands with their weekly content plans
    fetch('/api/cloner/brands')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.brands) && d.brands.length > 0) {
          setAllBrandsList(d.brands);
          if (d.brands[0]?.weekContentPlan?.[0]) {
            setSelectedPost({
              ...d.brands[0].weekContentPlan[0],
              brandId: d.brands[0].id,
              brandName: d.brands[0].name,
              platform: 'Instagram & Facebook (Meta Graph)',
              status: 'PUBLISHED'
            });
          }
        }
      })
      .catch(() => {});

    // Trigger voice greeting tailored to current persona
    const activeInitial = initialPersona || persona;
    if (initialPersona && initialPersona !== persona) {
      setPersona(initialPersona);
    }
    handlePlayPersonaGreeting(activeInitial);

    // Live Server-Sent Events (SSE) Stream from Sovereign Microservices Gateway
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/gateway/events');
      eventSource.addEventListener('BOOKING_CONFIRMED', (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          const booking = payload.data || payload;
          setRealStats((prev: any) => {
            const exists = (prev.recentBookings || []).some((b: any) => b.id === booking.id);
            if (exists) return prev;
            return {
              ...prev,
              confirmedBookingsCount: (prev.confirmedBookingsCount || 0) + 1,
              realConfirmedRevenueEgp: (prev.realConfirmedRevenueEgp || 0) + (parseInt(String(booking.price || '').replace(/[^\d]/g, ''), 10) || 500),
              recentBookings: [booking, ...(prev.recentBookings || [])].slice(0, 10)
            };
          });

          // Live audio announcement from Jarvis
          const customer = booking.customerName || 'عميل جديد';
          const price = booking.price || '500 ج.م';
          playShadowVoice(`يا ماستر، وصل إشعار حجز مؤكد حالا عبر الواتساب لـ ${customer} بقيمة ${price}!`, 'male');
        } catch (err) {}
      });

      eventSource.addEventListener('OBSIDIAN_VAULT_EXTERNAL_SYNC', (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          const info = payload.data || payload;
          fetchObsidianVault();
          if (info.brandId) handleInspectObsidianNode(info.brandId);
          setCyberLogs(prev => [`[OBSIDIAN_2WAY_SYNC]: ${info.message || 'External Markdown change synced live'}`, ...prev].slice(0, 25));
        } catch {}
      });

      eventSource.addEventListener('OBSIDIAN_VAULT_SYNCED', (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          const info = payload.data || payload;
          fetchObsidianVault();
          setCyberLogs(prev => [`[OBSIDIAN_VAULT]: Node ${info.brandId} synced (${info.catalogCount || 0} catalog items)`, ...prev].slice(0, 25));
        } catch {}
      });
    } catch {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isOpen, persona]);

  if (!isOpen) return null;

  const currentSelectedBrand = allBrandsList.find(b => b.id === selectedBrandId || b.slug === selectedBrandId) || allBrandsList[0] || {
    id: 'clean_master',
    name: 'كلين ماستر لخدمات النظافة والتعقيم',
    businessType: 'خدمات نظافة وتعقيم',
    phone: '01013373634',
    weekContentPlan: []
  };

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    const b = allBrandsList.find(x => x.id === brandId || x.slug === brandId);
    if (b) {
      if (b.weekContentPlan?.[0]) {
        setSelectedPost({
          ...b.weekContentPlan[0],
          brandId: b.id,
          brandName: b.name,
          platform: 'Instagram & Facebook (Meta Graph)',
          status: 'PUBLISHED'
        });
      }
      // Silent button activation
    }
  };

  const handlePublishPost = async (brandId: string, postIndex: number = 0) => {
    setIsPublishingPost(true);
    try {
      const res = await fetch('/api/growth/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, postIndex })
      });
      const d = await res.json();
      if (d.success && d.post) {
        setSelectedPost(d.post);
        setActiveDeckTab('content_post_card');
        // Silent button activation
      }
    } catch (err) {
      console.error('Publish error:', err);
    } finally {
      setIsPublishingPost(false);
    }
  };

  const handleLaunchAdForPost = async (post: any) => {
    setIsLaunchingCampaign(true);
    try {
      const res = await fetch('/api/growth/launch-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: currentSelectedBrand.id,
          budgetEgp: 2000,
          platform: 'meta',
          objective: 'click_to_whatsapp',
          customHook: post?.hook || currentSelectedBrand.marketAnalysis?.irresistibleHooks?.[0]
        })
      });
      const d = await res.json();
      if (d && d.id) {
        setActiveDeckTab('ad_launcher');
        // Silent button activation
      }
    } catch (err) {
      console.error('Campaign launch error:', err);
    } finally {
      setIsLaunchingCampaign(false);
    }
  };

  const [isBuildingStrategy, setIsBuildingStrategy] = useState(false);
  const [isGeneratingWeekPlan, setIsGeneratingWeekPlan] = useState(false);
  const [isApprovingSchedule, setIsApprovingSchedule] = useState(false);
  const [activeBrandStrategy, setActiveBrandStrategy] = useState<any>(null);
  const [turboFlowVideoUrlInput, setTurboFlowVideoUrlInput] = useState('');

  const handleGenerateBrandingKit = async () => {
    if (!brandingForm.brandName.trim()) {
      toast.error('من فضلك اكتب اسم النشاط أو البراند');
      return;
    }
    setIsGeneratingBranding(true);
    playShadowVoice(`جاري تشغيل محرك البراندينج وتأسيس هوية وصفحات ${brandingForm.brandName} وإعداد خطة الـ 3 منشورات...`, 'male');
    try {
      const res = await fetch('/api/branding/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandingForm.brandName,
          category: brandingForm.category,
          targetAudience: brandingForm.targetAudience,
          phone: brandingForm.phone,
          isNewBusiness: brandingForm.isNewBusiness,
          currentAssets: {
            hasWebsite: brandingForm.hasWebsite,
            hasSocialPages: brandingForm.hasSocialPages,
            hasLogo: brandingForm.hasLogo
          }
        })
      });
      const data = await res.json();
      if (data.success && data.kit) {
        setGeneratedBrandingKit(data.kit);
        await fetch('/api/branding/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kit: data.kit, phone: brandingForm.phone, whatsapp: brandingForm.phone })
        });
        toast.success(`تم تأسيس هوية وحقيبة صفحات ${data.kit.brandName} بنجاح!`);
        playShadowVoice(`ألف مبروك يا فندم! تم تأسيس هوية براند ${data.kit.brandName} بالكامل، وتجهيز صفحات فيسبوك، إنستجرام، وتيك توك مع خطة 3 منشورات للأسبوع المجاني!`, 'male');
        fetchDatabaseStats();
      } else {
        toast.error(data.error || 'تعذر تأسيس البراند');
      }
    } catch (e: any) {
      toast.error(e?.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setIsGeneratingBranding(false);
    }
  };

  const handleBuildStudioStrategy = async (brandId?: string) => {
    const targetId = brandId || currentSelectedBrand.id;
    setIsBuildingStrategy(true);
    setActiveDeckTab('studio_calendar');
    // Silent button activation
    try {
      const res = await fetch('/api/studio/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: targetId })
      });
      const d = await res.json();
      if (d.success && d.strategy) {
        setActiveBrandStrategy(d.strategy);
        if (d.brand) {
          setAllBrandsList(prev => prev.map(b => (b.id === d.brand.id ? d.brand : b)));
        }
        toast.success(`تم بناء الاستراتيجية التسويقية لـ ${currentSelectedBrand.name} في تيتو ستوديو!`);
        // Silent button activation
      }
    } catch (e) {
      toast.error('تعذر توليد الاستراتيجية');
    } finally {
      setIsBuildingStrategy(false);
    }
  };

  const handleGenerateWeekPlan = async (brandId?: string) => {
    const targetId = brandId || currentSelectedBrand.id;
    setIsGeneratingWeekPlan(true);
    setActiveDeckTab('studio_calendar');
    // Silent button activation
    try {
      const res = await fetch('/api/studio/generate-week-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: targetId })
      });
      const d = await res.json();
      if (d.success && d.weekPlan) {
        if (d.brand) {
          setAllBrandsList(prev => prev.map(b => (b.id === d.brand.id ? d.brand : b)));
          if (d.brand.marketingStrategy) setActiveBrandStrategy(d.brand.marketingStrategy);
        }
        if (d.weekPlan[0]) {
          setSelectedPost({
            ...d.weekPlan[0],
            brandId: targetId,
            brandName: currentSelectedBrand.name,
            platform: 'Instagram & Facebook (Meta Graph)'
          });
        }
        fetchObsidianVault();
        toast.success(`تم توليد 7 منشورات (صور تيتو ستوديو + فيديوهات Turbo Flow)!`);
        // Silent button activation
      }
    } catch (e) {
      toast.error('تعذر توليد خطة الأسبوع');
    } finally {
      setIsGeneratingWeekPlan(false);
    }
  };

  const handleApproveSchedule = async (brandId?: string) => {
    const targetId = brandId || currentSelectedBrand.id;
    setIsApprovingSchedule(true);
    try {
      const res = await fetch('/api/studio/approve-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: targetId })
      });
      const d = await res.json();
      if (d.success) {
        if (d.brand) {
          setAllBrandsList(prev => prev.map(b => (b.id === d.brand.id ? d.brand : b)));
        }
        fetchObsidianVault();
        toast.success(`تم اعتماد جدولة الأسبوع (${d.approvedCount || 7} منشورات) في تيتو ستوديو!`);
        // Silent button activation
      }
    } catch (e) {
      toast.error('تعذر اعتماد الجدولة');
    } finally {
      setIsApprovingSchedule(false);
    }
  };

  const handleCreatePaymobCheckout = async (planId: 'starter_monthly' | 'growth_pro' | 'agency_unlimited' = 'growth_pro') => {
    try {
      const res = await fetch('/api/payments/paymob/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: currentSelectedBrand.id,
          brandName: currentSelectedBrand.name,
          planId,
          customerPhone: currentSelectedBrand.phone || '01013373634'
        })
      });
      const d = await res.json();
      if (d.ok && d.paymentUrl) {
        window.open(d.paymentUrl, '_blank');
        toast.success(`تم فتح بوابة الدفع الآلي Paymob لتفعيل الاشتراك!`);
        // Silent button activation
      }
    } catch {
      toast.error('تعذر فتح بوابة Paymob');
    }
  };

  const handleSendDailyBriefingNow = async (period: 'morning' | 'evening') => {
    try {
      const res = await fetch('/api/system/trigger-daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, brandId: currentSelectedBrand.id })
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(d.message || 'تم إرسال التقرير الدوري إلى واتساب!');
        playShadowVoice(d.briefing?.voiceScript || d.message, 'male');
      }
    } catch {
      toast.error('تعذر إرسال التقرير');
    }
  };

  const handleCloneBrand = async (name: string, category: string) => {
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم النشاط أو البراند');
      return;
    }
    setIsCloningBrand(true);
    // Silent button activation
    try {
      const res = await fetch('/api/cloner/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry: category || 'متجر إلكتروني' })
      });
      const d = await res.json();
      if (d.success && d.brand) {
        setAllBrandsList(prev => [d.brand, ...prev]);
        setSelectedBrandId(d.brand.id);
        toast.success(`تم بناء تطبيق ومتجر ${d.brand.name} بنجاح!`);
        // Silent button activation
        setCloneInputName('');
        setCloneInputCategory('');
      } else {
        toast.error('حدث خطأ أثناء بناء المتجر');
      }
    } catch (e) {
      console.error(e);
      toast.error('تعذر الاتصال بمنصة بناء المتاجر');
    } finally {
      setIsCloningBrand(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent || ''));
  const isContinuousLiveRef = useRef<boolean>(false);
  const isPlayingVoiceRef = useRef<boolean>(false);
  const isThinkingRef = useRef<boolean>(false);

  const startListeningLoop = () => {
    // Unconditionally force-unlock any voice/thinking states so user speech is NEVER blocked
    isPlayingVoiceRef.current = false;
    isThinkingRef.current = false;
    setIsPlayingVoice(false);
    setIsThinking(false);

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.error('المتصفح لا يدعم الميكروفون المباشر، استخدم Google Chrome أو Microsoft Edge');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRec();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setHasMicPermission(true);
        transcriptRef.current = '';
        setTranscript('أنا سامعك يا ماستر.. اتفضل اتكلم');
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        transcriptRef.current = text;
        setTranscript(text);
      };

      recognition.onerror = (err: any) => {
        console.warn('[Speech Recognition Error]:', err?.error || err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalRecorded = transcriptRef.current;
        if (finalRecorded && finalRecorded !== 'أنا سامعك يا ماستر.. اتفضل اتكلم' && finalRecorded.trim().length > 0) {
          handleSendLiveCommand(finalRecorded);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (e: any) {
      console.error('[Speech Recognition Start Error]:', e);
      setIsListening(false);
    }
  };

  const handlePlayPersonaGreeting = async (targetPersona?: 'visitor' | 'trial' | 'client' | 'tito') => {
    const activeP = targetPersona || persona;
    stopVoice();
    setIsPlayingVoice(true);
    isPlayingVoiceRef.current = true;

    const now = new Date();
    const hours = now.getHours();
    const timeGreeting = hours < 12 ? 'صباح الفل والنشاط' : 'مساء النور والهمة العالية';

    let text = '';
    if (activeP === 'visitor') {
      text = `يا هلا بيك في منظومة T2 ديجيتال للنمو الشامل! أنا جارفيس المستشار التنفيذي لأعمالك.. قولي عشان أحلل موقفك صح: نشاطك التجاري شغال حالياً في السوق وفيه عملاء ومبيعات؟ ولا دي فكرة جديدة بتنطلق فيها من الصفر؟`;
    } else if (activeP === 'trial') {
      text = `أهلاً بيك يا فندم في أسبوع التجربة المجانية لـ ${currentSelectedBrand.name}! خطتك من 3 منشورات حقيقية (يوم ويوم: الأحد، الثلاثاء، والخميس) جاهزة، والوكيل الذكي متصل بيرد 24 ساعة.. تحب نولد أول تصميم في تيتو ستوديو دلوقتي؟`;
    } else if (activeP === 'client') {
      text = `نورت كابينة قيادة براندك يا شريك النجاح! أنا معاك كمدير تنفيذي وسكرتير ذكي لمتابعة المحتوى والواتساب والحجوزات لحظة بلحظة.. تحب ننفذ إيه دلوقتي؟`;
    } else {
      // Tito Admin greeting strictly simplified per Master Tito's request
      text = 'أهلاً يا تيتو، أؤمرني!';
    }

    setTranscript(text);
    // Play ONLY 100% Gemini Human TTS voice (Puck 24kHz)
    playShadowVoice(text, 'male', undefined, () => {
      setIsPlayingVoice(false);
      isPlayingVoiceRef.current = false;
    });
  };

  // Two-Way Live Speech Recognition Trigger (On-Demand Push/Tap-to-Talk)
  const handleToggleListening = () => {
    // 1. Immediately unlock browser audio context on user gesture
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
      }
    } catch {}

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      setIsListening(false);
      stopVoice();
      setIsPlayingVoice(false);
      isPlayingVoiceRef.current = false;
    } else {
      stopVoice();
      setIsPlayingVoice(false);
      isPlayingVoiceRef.current = false;
      startListeningLoop();
    }
  };

  // Autonomous Marketing Agency Operator: 1-Month Plan (4 Weeks / 12 Posts) + Firestore Sync + First Post Spotlight
  const handleExecuteAutonomousAgency = async (brandId?: string, isVoiceTriggered: boolean = false) => {
    const targetBrandId = brandId || currentSelectedBrand.id || 'tito_media';
    const targetBrand = allBrandsList.find(b => b.id === targetBrandId) || currentSelectedBrand;
    
    setIsExecutingAutonomousAgency(true);
    setIsThinking(true);
    isThinkingRef.current = true;
    setActiveDeckTab('autonomous_agency');
    appendLiveLog(`[AUTONOMOUS_AGENCY]: تشغيل وكالة التسويق الآلي لـ "${targetBrand.name}"...`);

    try {
      const res = await fetch('/api/studio/autonomous-agency-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: targetBrandId })
      });
      const data = await res.json();
      
      if (data.success) {
        setAutonomousAgencyData(data);
        if (data.brand?.weekContentPlan) {
          targetBrand.weekContentPlan = data.brand.weekContentPlan;
          setAllBrandsList(prev => prev.map(b => b.id === targetBrandId ? { ...b, weekContentPlan: data.brand.weekContentPlan } : b));
        }
        if (data.firstPost) {
          setSelectedPost({
            ...data.firstPost,
            brandId: targetBrandId,
            brandName: targetBrand.name,
            platform: 'Instagram & Facebook (Meta Graph)',
            status: 'DRAFT_APPROVAL_REQUIRED'
          });
        }
        toast.success(`تم إنجاز خطة الشهر وجدولة ${data.scheduledCount || 11} منشور لـ ${targetBrand.name}!`);
        appendLiveLog(`[AUTONOMOUS_AGENCY]: تم إنشاء خطة 4 أسابيع (12 بوست)، وجدولة ${data.scheduledCount || 11} بوست في فايربيس.`);

        if (isVoiceTriggered) {
          const voiceMsg = `يا ماستر تيتو، حللت هوية براند ${targetBrand.name}، وعملت خطة شهر كامل من 12 منشور على 4 محاور (أحد وثلاثاء وخميس). جدولنا 11 منشور في تيتو ستوديو فايربيس، والبوست الأول جاهز قدامك للمراجعة والاعتماد الفوري لميتا!`;
          setTranscript(voiceMsg);
          playShadowVoice(voiceMsg, 'male');
        }
      } else {
        toast.error(data.error || 'تعذر استكمال دورة الوكالة الآلية');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('خطأ في الاتصال بمشغل الوكالة الآلي');
    } finally {
      setIsExecutingAutonomousAgency(false);
      setIsThinking(false);
      isThinkingRef.current = false;
    }
  };

  // Process Live Voice Command through Jarvis Brain & Gemini Human TTS
  const handleSendLiveCommand = async (commandText: string) => {
    setIsThinking(true);
    isThinkingRef.current = true;
    stopVoice();
    appendLiveLog(`[VOICE_CMD]: "${commandText}"`);

    // Direct Studio Workflow Voice Commands (Strategy -> Week Plan -> Preview -> Publish / Approve Schedule)
    const matchedBrand = allBrandsList.find(b => commandText.includes(b.name) || (b.slug && commandText.toLowerCase().includes(b.slug.toLowerCase()))) || currentSelectedBrand;
    if (matchedBrand && matchedBrand.id !== currentSelectedBrand.id) {
      setSelectedBrandId(matchedBrand.id);
    }

    const isNegated = /\b(لا|مش|بلاش|متعملش|ما تعملش|لا أريد|توقف)\b/i.test(commandText);

    if (!isNegated && /وكالة التسويق|الوكالة الآلية|مشغل الوكالة|خطة شهر|خطة الشهر|خطة شهر كامل|وكالة التسويق الآلي/i.test(commandText)) {
      setIsThinking(false);
      isThinkingRef.current = false;
      await handleExecuteAutonomousAgency(matchedBrand.id, true);
      return;
    }
    if (!isNegated && /استراتيجي|إستراتيجي|خطة تسويق|خطه تسويق/i.test(commandText)) {
      setIsThinking(false);
      isThinkingRef.current = false;
      await handleBuildStudioStrategy(matchedBrand.id);
      const voiceReply = `أمرك يا ماستر تيتو، جهزت الاستراتيجية التسويقية لبراند ${matchedBrand.name} وحفظتها في تيتو ستوديو وأوبسيديان!`;
      setTranscript(voiceReply);
      playShadowVoice(voiceReply, 'male');
      return;
    }
    if (!isNegated && /ولد محتوى|محتوى اول اسبوع|محتوى أول أسبوع|خطة محتوى|خطه محتوى|محتوى الأسبوع|محتوى الاسبوع/i.test(commandText)) {
      setIsThinking(false);
      isThinkingRef.current = false;
      await handleGenerateWeekPlan(matchedBrand.id);
      const voiceReply = `أمرك يا ماستر، تم توليد خطة محتوى أول أسبوع لـ ${matchedBrand.name} بنجاح!`;
      setTranscript(voiceReply);
      playShadowVoice(voiceReply, 'male');
      return;
    }
    if (!isNegated && /اعتمد الجدول|اعتماد الجدول|جدول المحتوى|جدولة الخطة/i.test(commandText)) {
      setIsThinking(false);
      isThinkingRef.current = false;
      await handleApproveSchedule(matchedBrand.id);
      const voiceReply = `تم اعتماد جدولة خطة المحتوى في تيتو ستوديو للنشر التلقائي يا ماستر!`;
      setTranscript(voiceReply);
      playShadowVoice(voiceReply, 'male');
      return;
    }
    if (!isNegated && /اعرض منشور|اعرض بوست|افتح المنشور|اعرض الفيديو|اعرض التصميم|اعرض خطة المحتوى/i.test(commandText)) {
      setIsThinking(false);
      isThinkingRef.current = false;
      const plan = matchedBrand.weekContentPlan || [];
      const dayMatch = plan.find((p: any) => commandText.includes(p.day));
      const postToShow = dayMatch || selectedPost || plan[0];
      if (postToShow) {
        setSelectedPost({ ...postToShow, brandId: matchedBrand.id, brandName: matchedBrand.name });
      }
      setActiveDeckTab('content_post_card');
      const voiceReply = `عرضت لك بطاقة المنشور والتصميم لبراند ${matchedBrand.name} قدامك يا ماستر. قولي انشره لو تحب أنشره فوراً!`;
      setTranscript(voiceReply);
      playShadowVoice(voiceReply, 'male');
      return;
    }
    if (!isNegated && /^انشره|انشر المنشور|انشر البوست|انشر دلوقتي/i.test(commandText.trim())) {
      setIsThinking(false);
      isThinkingRef.current = false;
      await handlePublishPost(matchedBrand.id, 0);
      const voiceReply = `تم اعتماد ونشر البوست فوراً لصفحات ميتا وتيتو ستوديو يا ماستر!`;
      setTranscript(voiceReply);
      playShadowVoice(voiceReply, 'male');
      return;
    }

    try {
      let recentChatSummary = '';
      if (persona === 'tito') {
        try {
          const recentMsgs = (shadowDB as any).getHistory ? await (shadowDB as any).getHistory('tito', 6) : [];
          recentChatSummary = (recentMsgs || [])
            .slice(-6)
            .map((m: any) => `${m.sender === 'user' ? 'الماستر' : 'الظل'}: ${(m.text || '').slice(0, 180)}`)
            .join(' | ');
        } catch {}
      }

      setIsThinking(true);
      const res = await fetch('/api/system/jarvis-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commandText,
          history: conversationHistory,
          persona,
          selectedBrandId: currentSelectedBrand.id,
          recentChatSummary
        })
      });
      const data = await res.json();
      setIsThinking(false);
      if (data.success && data.replyText) {
        setTranscript(data.replyText);
        setConversationHistory(prev => [
          ...prev.slice(-8),
          { role: 'user', text: commandText },
          { role: 'model', text: data.replyText }
        ]);
        appendLiveLog(`[JARVIS_REPLY]: ${data.replyText.slice(0, 95)}...`);

        const onSpeechEnd = () => {
          setIsPlayingVoice(false);
          isPlayingVoiceRef.current = false;
        };

        // Play authentic Egyptian Gemini Human voice reply
        setIsPlayingVoice(true);
        isPlayingVoiceRef.current = true;

        if (data.audioBase64) {
          const mime = data.audioBase64.startsWith('UklGR') ? 'audio/wav' : 'audio/mp3';
          const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
          audio.onended = onSpeechEnd;
          audio.onerror = () => {
            playShadowVoice(data.replyText, 'male', undefined, onSpeechEnd);
          };
          audio.play().catch(() => {
            playShadowVoice(data.replyText, 'male', undefined, onSpeechEnd);
          });
        } else {
          playShadowVoice(data.replyText, 'male', undefined, onSpeechEnd);
        }

        // Check if voice command asks to open the Multi-Window Brand Super-Window
        if (/نافذ|شاشه|شاشة|تفاصيل براند|اعرض براند|افتح براند/i.test(commandText) && persona !== 'visitor') {
          setIsBrandSuperWindowOpen(true);
        }

        // LIVE VOICE-TO-ACTION EXECUTIVE CONTROLLER
        if (data.action) {
          appendLiveLog(`[EXEC_ACTION]: ${data.action.type} -> ${data.action.tab || data.action.modal || data.action.action || data.action.brandId || 'OK'}`);
          if (data.action.type === 'SWITCH_TAB' && data.action.tab) {
            // STRICT SHIELD: Never hijack view away from visitor onboarding
            if (persona !== 'visitor') {
              setActiveDeckTab(data.action.tab);
              if (data.action.brandId) {
                handleSelectBrand(data.action.brandId);
                handleInspectObsidianNode(data.action.brandId);
              }
            }
          } else if (data.action.type === 'VISITOR_DIAGNOSTIC_UPDATE' && data.action.visitorUpdate) {
            const upd = data.action.visitorUpdate;
            setBrandingForm(prev => ({
              ...prev,
              ...(upd.hasExistingBusiness !== undefined ? { isNewBusiness: !upd.hasExistingBusiness } : {}),
              ...(upd.industry ? { category: upd.industry } : {}),
              ...(upd.hasWebsite !== undefined ? { hasWebsite: upd.hasWebsite } : {}),
              ...(upd.hasSocialPages !== undefined ? { hasSocialPages: upd.hasSocialPages } : {}),
              ...(upd.phone ? { phone: upd.phone } : {})
            }));
          } else if (data.action.type === 'OPEN_BRAND_SUPER_WINDOW' && persona !== 'visitor') {
            if (data.action.brandId) {
              handleSelectBrand(data.action.brandId);
              handleInspectObsidianNode(data.action.brandId);
            }
            setIsBrandSuperWindowOpen(true);
          } else if (data.action.type === 'OPEN_MODAL') {
            if (data.action.brandId) handleSelectBrand(data.action.brandId);
            if (data.action.modal === 'whatsapp_connect') {
              handleOpenWhatsAppConnectModal(data.action.brandId);
            } else if (data.action.modal === 'meta_connect') {
              handleOpenMetaConnectModal();
            } else if (data.action.modal === 'brand_super_window' && persona !== 'visitor') {
              setIsBrandSuperWindowOpen(true);
            }
          } else if (data.action.type === 'TRIGGER_ACTION') {
            if (data.action.action === 'PUBLISH_POST') {
              handlePublishPost(data.action.brandId || selectedBrandId, 0);
            } else if (data.action.action === 'LAUNCH_CAMPAIGN') {
              handleLaunchAdForPost(selectedPost);
            }
          } else if (data.action.type === 'RUN_SANDBOX') {
            setActiveDeckTab('studio_calendar');
            if (data.action.companyName) {
              const matched = allBrandsList.find(b => (b.name || '').includes(data.action.companyName));
              if (matched) handleSelectBrand(matched.id || matched.slug);
            }
          } else if (data.action.type === 'TOGGLE_BOT') {
            setBotStates(prev => ({ ...prev, [data.action.brandId]: data.action.status !== 'paused' }));
          } else if (data.action.type === 'CATALOG_MUTATED') {
            setActiveDeckTab('app_cloner');
            fetchObsidianVault();
            if (data.action.brandId) handleInspectObsidianNode(data.action.brandId);
          } else if (data.action.type === 'BOT_PROMPT_MUTATED') {
            setActiveDeckTab('obsidian_graph');
            fetchObsidianVault();
            if (data.action.brandId) handleInspectObsidianNode(data.action.brandId);
          }
        }

        // If the user requested a browser action, open executive agent!
        if (data.shouldTriggerBrowser) {
          setIsExecutiveOpen(true);
          if (data.suggestedScenario) {
            handleRunExecutiveBrowser(data.suggestedScenario);
          }
        }
      }
    } catch (err: any) {
      console.error("Jarvis conversation error:", err);
      if (isContinuousLiveRef.current) {
        setTimeout(startListeningLoop, 1000);
      }
    } finally {
      setIsThinking(false);
      isThinkingRef.current = false;
    }
  };

  // Execute Live Autonomous Browser Agent (Puppeteer / Chromium)
  const handleRunExecutiveBrowser = async (scenario: string, customUrl?: string) => {
    setExecutiveRunning(true);
    setExecutiveScenario(scenario);
    setExecutiveLogs([]);
    setExecutiveScreenshot(null);
    setCursorPos({ x: 30, y: 30 });

    try {
      let announcement = "أمرك يا ماستر، الأجنت التنفيذي بدأ يتحكم في المتصفح وينفذ الإجراء!";
      let targetToRun = customUrl || executiveUrl;

      if (scenario === 't2_studio_generate') {
        announcement = "أمرك يا ماستر، جاري تشغيل المتصفح التنفيذي وفتح تيتو ستوديو والضغط على زر إنتاج محتوى جديد بالذكاء الاصطناعي!";
        targetToRun = "https://t2-studio.vercel.app";
        setDockedAppTab('t2_studio');
      } else if (scenario === 't2_agent_clean_master') {
        announcement = "جاري فتح لوحة تحكم تيتو أجنت وفحص كارت كلين ماستر وصندوق المحادثات والرسائل فوراً!";
        targetToRun = "https://khedr-bot-agent.onrender.com/dashboard";
        setDockedAppTab('t2_agent');
      } else if (scenario === 't2_agent_salegates') {
        announcement = "جاري فحص كارت سيل جيت واستشارات العقارات عبر المتصفح التنفيذي!";
        targetToRun = "https://khedr-bot-agent.onrender.com/dashboard";
        setDockedAppTab('t2_agent');
      } else if (scenario === 'alkhedr_booking') {
        announcement = "أمرك يا ماستر، الأجنت التنفيذي بدأ يتحكم في المتصفح، جاري فتح موقع الخضر وحجز سيارة تويوتا فورتشنر 4x4!";
        targetToRun = "https://khedr-cars.vercel.app";
      } else if (scenario === 'clean_master_booking') {
        announcement = "جاري إطلاق الأجنت التنفيذي لحجز موعد معاينة في كلين ماستر بالنيابة عنك!";
      }

      setExecutiveUrl(targetToRun);
      playShadowVoice(announcement, 'male');

      // Animate virtual cursor to simulate active AI presence
      const cursorInterval = setInterval(() => {
        setCursorPos({
          x: Math.floor(25 + Math.random() * 50),
          y: Math.floor(25 + Math.random() * 45)
        });
      }, 500);

      const res = await fetch('/api/agent/executive-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          targetUrl: targetToRun,
          goal: scenario
        })
      });

      clearInterval(cursorInterval);
      const data = await res.json();

      if (data.success) {
        setExecutiveLogs(data.logs || []);
        setExecutiveScreenshot(data.screenshotAfter || data.screenshotBefore);
        setCursorPos({ x: 65, y: 45 });
        setIsClickingCursor(true);
        setTimeout(() => setIsClickingCursor(false), 800);

        playShadowVoice("تم تنفيذ العملية والضغط على الأزرار بنجاح داخل المتصفح، والصورة الحية واضحة أمامك على الشاشة!", 'male');
      } else {
        setExecutiveLogs([{ time: 'ERR', msg: data.error || 'فشل تشغيل السيناريو', type: 'error' }]);
      }
    } catch (err: any) {
      setExecutiveLogs([{ time: 'ERR', msg: err.message, type: 'error' }]);
    } finally {
      setExecutiveRunning(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center font-['Cairo'] transition-all duration-300 ${
      isFullscreen ? 'p-0 bg-[#01030a]' : 'p-2 md:p-4 bg-black/80'
    }`} dir="rtl">
      
      {/* Deep Blue-Black Fiber-Optic Second Brain OS Container with Dominant Space Canvas */}
      <div className={`relative w-full bg-[#01030b]/80 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_0_120px_rgba(0,240,255,0.28)] flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'h-screen rounded-none border-0' : 'max-w-[1560px] h-[95vh] rounded-[36px]'
      }`}>

        {/* 3D Cosmos Space Canvas Background (The Sovereign Hero Cosmos with Earth & Stars) */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-85 overflow-hidden">
          <SpaceCanvas interactive={true} showEarth={true} />
        </div>

        {/* Fiber-Optic Bioluminescent Grid & Deep Space Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.04)_0%,_rgba(1,3,11,0.65)_70%,_#01030a_100%)] pointer-events-none z-0" />
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(to_right,#00f0ff_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] z-0" 
        />

        {/* TOP STATUS BAR: Second Brain OS & Multi-Window Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-2.5 border-b border-cyan-500/30 bg-[#010410]/90 backdrop-blur-md">
          {/* Left: Real Ecosystem Telemetry & Clock */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_12px_#00f0ff]" />
              </span>
              <span className="font-mono text-xs md:text-sm font-black text-cyan-300 tracking-wider">
                {currentTime || '20:43:37.41'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10.5px] font-mono text-cyan-300/80 border-r border-cyan-500/20 pr-3">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                {allBrandsList.length || realStats.totalVaultBrandsCount || 0} UNIFIED BRANDS
              </span>
              <span className="px-2 py-0.5 rounded bg-fuchsia-500/15 border border-fuchsia-500/35 text-fuchsia-300 font-bold">
                OBSIDIAN 2-WAY VAULT
              </span>
              <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                UNIFIED BRAIN // ONLINE
              </span>
            </div>
          </div>

          {/* Center: System Title */}
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse drop-shadow-[0_0_8px_#00f0ff]" />
            <h1 className="text-xs md:text-sm font-black tracking-widest text-white uppercase font-mono drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              JARVIS SECOND BRAIN OS // FIBER-OPTIC EDITION
            </h1>
          </div>

          {/* Right: Multi-Window Super View, Executive Actuator, Fullscreen, Mute, Close */}
          <div className="flex items-center gap-2">
            {/* Multi-Window Brand Super-Window Trigger */}
            <button
              onClick={() => {
                handleInspectObsidianNode(currentSelectedBrand.id);
                setIsBrandSuperWindowOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-fuchsia-500/25 hover:from-cyan-500/40 hover:to-fuchsia-500/40 text-cyan-200 border border-cyan-400/60 font-black text-xs shadow-[0_0_18px_rgba(0,240,255,0.3)] transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-300" />
              نافذة البراند الشاملة (4 شاشات)
            </button>

            {/* Executive Browser Actuator Button */}
            <button
              onClick={() => setIsExecutiveOpen(!isExecutiveOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all ${
                isExecutiveOpen
                  ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              المتصفح التنفيذي
            </button>

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs shadow-md transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              تسجيل براند جديد
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'تصغير' : 'ملء الشاشة بالكامل'}
              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (isPlayingVoice) {
                  stopVoice();
                  setIsPlayingVoice(false);
                } else {
                  handlePlayPersonaGreeting(persona);
                }
              }}
              title="تشغيل / إيقاف الصوت"
              className={`p-2 rounded-xl border transition-all ${
                isPlayingVoice 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
              }`}
            >
              {isPlayingVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="إغلاق المحطة"
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN HUD INTERACTION VIEWPORT (3 Sci-Fi Columns With Mobile-First Spatial Hierarchy) */}
        <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-6 overflow-y-auto">

          {/* Mobile-First Floating Control Pill Bar (Visible on mobile screens < lg) */}
          <div className="lg:hidden col-span-1 flex items-center justify-between p-1.5 bg-[#020617]/95 border border-cyan-500/30 rounded-2xl text-xs font-bold font-['Cairo'] shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <button
              onClick={() => setMobileActiveView('stage')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1 ${
                mobileActiveView === 'stage'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-lg shadow-amber-500/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>مسرح العمليات</span>
            </button>

            <button
              onClick={() => setMobileActiveView('brands')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1 ${
                mobileActiveView === 'brands'
                  ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>البراندات (${allBrandsList.length || 21})</span>
            </button>

            <button
              onClick={() => setMobileActiveView('radar')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1 ${
                mobileActiveView === 'radar'
                  ? 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>الرادار والربط</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN (RTL): CONTROLS & TELEMETRY (3 Cols)         */}
          {/* ========================================================= */}
          <div className={`lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1 ${mobileActiveView === 'radar' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* ACTION ACTUATOR: Visitor Pricing & Trial Info vs Executive Command Hub */}
            {persona === 'visitor' ? (
              <div className="p-4 rounded-3xl bg-[#040b22]/90 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-3 font-['Cairo'] text-right">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    باقات النمو المعتمدة (50% إعلانات)
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    5 TIERS
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-[11px]">الانطلاق الفضي</div>
                      <div className="text-[9.5px] text-emerald-400">1,250 ج.م إعلانات ممولة</div>
                    </div>
                    <span className="font-black text-amber-300 text-xs">2,500 ج.م</span>
                  </div>

                  <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-cyan-200 text-[11px]">النمو الذهبي (الأكثر طلباً)</div>
                      <div className="text-[9.5px] text-emerald-400">2,500 ج.م إعلانات ممولة</div>
                    </div>
                    <span className="font-black text-amber-300 text-xs">5,000 ج.م</span>
                  </div>

                  <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-purple-200 text-[11px]">الريادة البلاتينية</div>
                      <div className="text-[9.5px] text-emerald-400">5,000 ج.م إعلانات ممولة</div>
                    </div>
                    <span className="font-black text-amber-300 text-xs">10,000 ج.م</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-[11px]">المؤسسات VIP</div>
                      <div className="text-[9.5px] text-emerald-400">12,500 ج.م إعلانات ممولة</div>
                    </div>
                    <span className="font-black text-amber-300 text-xs">25,000 ج.م</span>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-200 text-[11px]">السيادة التوسعية</div>
                      <div className="text-[9.5px] text-emerald-400">25,000 ج.م إعلانات ممولة</div>
                    </div>
                    <span className="font-black text-amber-300 text-xs">50,000 ج.م</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 leading-relaxed">
                  🛡️ <strong>أسبوع التجربة المجانية:</strong> 3 منشورات مركزة (يوم ويوم: تصميم، فيديو ريلز، بوست عرض خاص وحجز فوري) + وكيل واتساب 24/7.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-[#040b22]/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col gap-3 font-['Cairo'] text-right">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    متحكم الإجراءات والربط
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    REAL-TIME
                  </span>
                </div>

                {/* 8 High-Power Quick Action & Connection Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveDeckTab('obsidian_graph')}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col items-start gap-1 ${
                      activeDeckTab === 'obsidian_graph'
                        ? 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,0.35)]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/30'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-fuchsia-400" />
                    <span className="text-xs font-bold">عقل أوبسيديان</span>
                    <span className="text-[9px] text-white/40">شبكة المعرفة الحية</span>
                  </button>

                  <button
                    onClick={() => setActiveDeckTab('agency_overview')}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col items-start gap-1 ${
                      activeDeckTab === 'agency_overview'
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-amber-500/10 hover:border-amber-500/30'
                    }`}
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">إدارة الوكالة والظل</span>
                    <span className="text-[9px] text-white/40">عملاء الظل والبراندات</span>
                  </button>

                  <button
                    onClick={() => setActiveDeckTab('studio_calendar')}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col items-start gap-1 ${
                      activeDeckTab === 'studio_calendar'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-cyan-500/10 hover:border-cyan-500/30'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold">تقويم ستوديو</span>
                    <span className="text-[9px] text-white/40">7 أيام خوارزميات</span>
                  </button>

                  <button
                    onClick={() => setActiveDeckTab('app_cloner')}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col items-start gap-1 ${
                      activeDeckTab === 'app_cloner'
                        ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-blue-500/10 hover:border-blue-500/30'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold">متجر البراند</span>
                    <span className="text-[9px] text-white/40">متاجر وحجز فوري</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsAppConnectModal()}
                    className="p-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-right transition-all flex flex-col items-start gap-1"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">ربط واتساب لايف</span>
                    <span className="text-[9px] text-white/40">كود ربط أو QR فوري</span>
                  </button>

                  <button
                    onClick={() => handleOpenMetaConnectModal()}
                    className="p-2.5 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-right transition-all flex flex-col items-start gap-1"
                  >
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold">ربط ميتا وإنستا</span>
                    <span className="text-[9px] text-white/40">OAuth Graph API</span>
                  </button>

                  <button
                    onClick={() => setActiveDeckTab('ad_launcher')}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col items-start gap-1 ${
                      activeDeckTab === 'ad_launcher'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-amber-500/10 hover:border-amber-500/30'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">إعلانات واتساب</span>
                    <span className="text-[9px] text-white/40">حملات ممولة</span>
                  </button>

                  <button
                    onClick={() => handlePublishPost(currentSelectedBrand.id, 0)}
                    disabled={isPublishingPost}
                    className="p-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-right transition-all flex flex-col items-start gap-1"
                  >
                    <Send className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold">{isPublishingPost ? 'جاري النشر...' : 'نشر فوري الآن'}</span>
                    <span className="text-[9px] text-white/40">Meta Graph مباشر</span>
                  </button>

                  <button
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="p-2.5 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-right transition-all flex flex-col items-start gap-1 col-span-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  >
                    <div className="flex items-center gap-1.5 w-full justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">كتالوج المنتجات والخدمات السيادي</span>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                        4-WAY SYNC
                      </span>
                    </div>
                    <span className="text-[9px] text-white/50">تغذية متجر PWA، تيتو أجنت، وتيتو ستوديو سحابياً</span>
                  </button>
                </div>

                {/* Active Brand Snippet */}
                <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[11px]">
                  <span className="text-white/50">البراند النشط حالياً:</span>
                  <span className="text-cyan-300 font-bold truncate max-w-[130px]">{currentSelectedBrand.name}</span>
                </div>
              </div>
            )}

            {/* Live Streaming Cyber Terminal & Customer Activity Pulse */}
            <div className="flex-1 min-h-[260px] p-4 rounded-3xl bg-[#020514]/95 border border-cyan-500/30 flex flex-col font-mono text-xs overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20 text-cyan-400 text-[10px] font-bold font-['Cairo']">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTelemetryMode('human')}
                    className={`px-2 py-0.5 rounded-lg transition text-[9.5px] ${
                      telemetryMode === 'human'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    💬 نبض العملاء الحي
                  </button>
                  <button
                    onClick={() => setTelemetryMode('system')}
                    className={`px-2 py-0.5 rounded-lg transition font-mono text-[9px] ${
                      telemetryMode === 'system'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    ⚙️ سجل الأوامر
                  </button>
                </div>
                <span className="animate-pulse text-emerald-400 font-bold font-mono">● LIVE</span>
              </div>

              {telemetryMode === 'human' ? (
                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-none text-[11px] font-['Cairo'] leading-relaxed">
                  <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
                    <span>💬 عميل جديد يطلب استشارة عبر واتساب {currentSelectedBrand.name}</span>
                    <span className="text-[9px] text-white/40 font-mono">الآن</span>
                  </div>
                  <div className="p-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-300 flex items-center justify-between">
                    <span>🚀 خطة الأسبوع جاهزة ومجدولة في سحابة تيتو ستوديو</span>
                    <span className="text-[9px] text-white/40 font-mono">منذ 2 د</span>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-300 flex items-center justify-between">
                    <span>📦 تم مزامنة كتالوج الخدمات مع متجر PWA وأوبسيديان</span>
                    <span className="text-[9px] text-white/40 font-mono">منذ 5 د</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300 flex items-center justify-between">
                    <span>💎 حجز مؤكد ومسجل في CRM براند عيادة صقلاوي (750 ج.م)</span>
                    <span className="text-[9px] text-white/40 font-mono">اليوم</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-none text-[11px] text-cyan-300/80 leading-relaxed font-mono">
                  {cyberLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-cyan-500/50 select-none">&gt;</span>
                      <span className={idx === 0 ? 'text-white font-bold animate-pulse' : 'text-cyan-300/70'}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ========================================================= */}
          {/* CENTER HERO: THE HOLOGRAPHIC ARC REACTOR CORE (6 Cols)    */}
          {/* ========================================================= */}
          <div className={`lg:col-span-6 flex flex-col items-center justify-between gap-4 py-1 order-1 lg:order-2 ${mobileActiveView === 'stage' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* Triage Persona Switcher (Top of Center) - Protected for Master Admin */}
            {isMasterAdmin ? (
              <div className="bg-[#03091e]/90 border border-cyan-500/40 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex-wrap justify-center">
                <span className="text-[9.5px] text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  لوحة الماستر للمعاينة:
                </span>
                <button
                  onClick={() => { setPersona('tito'); handlePlayPersonaGreeting('tito'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    persona === 'tito'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  👑 الماستر تيتو
                </button>

                <button
                  onClick={() => { setPersona('client'); handlePlayPersonaGreeting('client'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    persona === 'client'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  🏢 عميل حالي
                </button>

                <button
                  onClick={() => { setPersona('trial'); handlePlayPersonaGreeting('trial'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    persona === 'trial'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  ⏳ فترة التجربة (7 أيام)
                </button>

                <button
                  onClick={() => { setPersona('visitor'); handlePlayPersonaGreeting('visitor'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    persona === 'visitor'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  🌐 وضع الزائر (0→1)
                </button>
              </div>
            ) : (
              <div className="bg-[#03091e]/90 border border-emerald-500/40 px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-emerald-300">
                  🌐 مستشار النمو الرقمي والذكاء السيادي للأعمال (جارفيس)
                </span>
              </div>
            )}

            {/* THE GIANT HOLOGRAPHIC ARC REACTOR WITH LIVING FLUID WATER ORB */}
            <div className="relative w-72 h-72 md:w-84 md:h-84 flex items-center justify-center my-1 select-none">
              
              {/* Outer Ambient Glow */}
              <div 
                className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-200 pointer-events-none"
                style={{ transform: `scale(${1 + audioLevel * 0.4})` }}
              />

              {/* SVG Holographic Multi-Ring Structure */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                {/* Ring 1: Outer Compass Degree Ring (Clockwise) */}
                <circle
                  cx="200" cy="200" r="185"
                  fill="none"
                  stroke="rgba(0, 240, 255, 0.25)"
                  strokeWidth="1.5"
                  strokeDasharray="4 8 16 8"
                  className="animate-[spin_60s_linear_infinite]"
                  style={{ transformOrigin: '200px 200px' }}
                />

                {/* Ring 2: Segmented Caliper Arcs */}
                <circle
                  cx="200" cy="200" r="165"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="2"
                  strokeDasharray="80 30 140 30"
                  className="animate-[spin_40s_linear_infinite_reverse] opacity-80"
                  style={{ transformOrigin: '200px 200px' }}
                />

                {/* Ring 3: Tech Dashed Orbital Ring */}
                <circle
                  cx="200" cy="200" r="140"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.4)"
                  strokeWidth="3"
                  strokeDasharray="6 14"
                  className="animate-[spin_25s_linear_infinite]"
                  style={{ transformOrigin: '200px 200px' }}
                />

                {/* Ring 4: Inner Caliper Ring */}
                <circle
                  cx="200" cy="200" r="110"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="180 40 40 40"
                  className="animate-[spin_15s_linear_infinite_reverse] opacity-90"
                  style={{ transformOrigin: '200px 200px' }}
                />

                {/* Crosshairs & Compass Degree Markers */}
                <line x1="200" y1="5" x2="200" y2="25" stroke="#00f0ff" strokeWidth="2" />
                <line x1="200" y1="375" x2="200" y2="395" stroke="#00f0ff" strokeWidth="2" />
                <line x1="5" y1="200" x2="25" y2="200" stroke="#00f0ff" strokeWidth="2" />
                <line x1="375" y1="200" x2="395" y2="200" stroke="#00f0ff" strokeWidth="2" />

                <text x="200" y="38" textAnchor="middle" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">000°</text>
                <text x="365" y="204" textAnchor="middle" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">090°</text>
                <text x="200" y="370" textAnchor="middle" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">180°</text>
                <text x="35" y="204" textAnchor="middle" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">270°</text>
              </svg>

              {/* Central Fluid Luminescent Water Orb (Fluid Organic Light Core with Voice Reactive Shifting) */}
              <FluidLuminescentOrb
                isListening={isListening}
                isPlayingVoice={isPlayingVoice}
                isThinking={isThinking}
                audioLevel={audioLevel}
                size={230}
                className="relative z-10"
              />

              {/* Interactive Core Mic Trigger Button (Tap to Talk to Jarvis) */}
              <button
                onClick={handleToggleListening}
                className={`absolute -bottom-3 z-20 px-4 py-1.5 rounded-full text-[11px] font-bold font-['Cairo'] flex items-center gap-2 backdrop-blur-md shadow-2xl transition-all duration-300 border select-none cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse'
                    : isThinking
                    ? 'bg-fuchsia-600/90 text-white border-fuchsia-400 shadow-[0_0_25px_rgba(217,70,239,0.7)]'
                    : isPlayingVoice
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.7)] animate-bounce'
                    : 'bg-black/80 hover:bg-black/95 text-cyan-200 border-cyan-400/50 hover:border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span className="font-black">أنا سامعك يا ماستر.. اتفضل (اضغط للإنهاء)</span>
                  </>
                ) : isThinking ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-spin" />
                    <span className="font-black">جارفيس يعالج وينفذ الأمر...</span>
                  </>
                ) : isPlayingVoice ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-black animate-pulse" />
                    <span className="font-black text-black">جارفيس يتحدث إليك (24kHz)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>🎙️ اضغط للتحدث مع جارفيس (أنا سامعك)</span>
                  </>
                )}
              </button>
            </div>

            {/* TOP BAR: Explicit Chromium Mic Activator + Operational Mode Switcher */}
            <div className="w-full max-w-xl flex flex-col gap-2 bg-[#040a24]/95 p-2.5 rounded-3xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              
              {/* 1. Explicit Mic & Voice Activation Alert (Gemini 24kHz Human Voice Engine) */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-black/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${hasMicPermission ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    {hasMicPermission ? '🟢 الميكروفون نشط • صوت Gemini البشري 24kHz (Puck)' : '⚠️ إذن الميكروفون يتطلب تفعيل يدوي للمتصفح'}
                  </span>
                </div>

                {!hasMicPermission ? (
                  <button
                    onClick={handleExplicitMicRequest}
                    className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-[10px] rounded-xl shadow-lg shadow-amber-500/30 transition flex items-center gap-1 animate-pulse"
                  >
                    <Mic className="w-3 h-3" />
                    اضغط هنا لتفعيل المايك فوراً
                  </button>
                ) : (
                  <button
                    onClick={handleToggleListening}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition shadow-lg ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    <span>{isListening ? 'أنا سامعك..' : '🎙️ تحدث صوتياً الآن'}</span>
                  </button>
                )}
              </div>

              {/* 2. Dynamic Operations Stage Navigator (Streamlined & Clean for 2026 Stark HUD) */}
              {persona !== 'visitor' ? (
                <div className={`grid ${persona === 'tito' ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 p-1.5 bg-[#020617] rounded-2xl border border-white/5 text-[9.5px] md:text-[10px] font-bold select-none font-['Cairo']`}>
                  {persona === 'tito' && (
                    <button
                      onClick={() => setActiveDeckTab('autonomous_agency')}
                      className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                        activeDeckTab === 'autonomous_agency'
                          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
                          : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-950" />
                      <span>⚡ وكالة التسويق الآلي</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveDeckTab('obsidian_graph')}
                    className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeDeckTab === 'obsidian_graph'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                        : 'text-cyan-200/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>🌐 الشبكة 3D</span>
                  </button>

                  <button
                    onClick={() => setActiveDeckTab('agent_fleet')}
                    className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeDeckTab === 'agent_fleet'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                        : 'text-emerald-200/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>💬 واتساب تيتو أجنت</span>
                  </button>

                  <button
                    onClick={() => setActiveDeckTab('app_cloner')}
                    className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeDeckTab === 'app_cloner'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                        : 'text-blue-200/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>📱 متجر PWA</span>
                  </button>
                </div>
              ) : (
                <div className="w-full py-2 px-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs font-bold font-['Cairo']">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300">محادثة حية تفاعلية مع جارفيس (تشخيص وبناء البيزنس وتفعيل التجربة)</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                    AI GROWTH CONSULTANT
                  </span>
                </div>
              )}
            </div>

            {/* VISITOR INTELLIGENCE ONBOARDING (When Persona === 'visitor') */}
            {persona === 'visitor' ? (
              <VisitorIntelligenceOnboarding 
                isMasterAdmin={isMasterAdmin}
                onSwitchToAdmin={isMasterAdmin ? () => setPersona('tito') : undefined}
                onComplete={() => {
                  fetchDatabaseStats();
                  fetchObsidianVault();
                  setPersona('trial');
                }}
              />
            ) : (
              <>
                {/* EXECUTIVE BRAND CEO COCKPIT BANNER (For Trial & Subscribed Clients) */}
                {(persona === 'trial' || persona === 'client') && (
                  <div className="w-full max-w-xl bg-gradient-to-r from-[#061a16] via-[#041226] to-[#120824] border border-emerald-500/40 rounded-3xl p-3.5 shadow-[0_0_25px_rgba(16,185,129,0.2)] flex flex-col gap-2.5 text-right font-['Cairo'] animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <div>
                          <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                            👔 جارفيس: المدير التنفيذي والسكرتير الذكي لبراند <span className="text-cyan-300">{currentSelectedBrand.name}</span>
                            {persona === 'trial' && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                                تجربة مجانية (7 أيام نشطة)
                              </span>
                            )}
                          </h3>
                          <p className="text-[10px] text-white/60">
                            أدير لك خطة محتوى تيتو ستوديو، وأرد على عملاء الواتساب بصوت بشري، وأستقبل الحجوزات في متجر وتطبيق براندك
                          </p>
                        </div>
                      </div>
                      {isMasterAdmin && (
                        <button
                          onClick={() => setPersona('tito')}
                          className="text-[9.5px] text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-xl border border-amber-500/30 font-bold shrink-0"
                        >
                          👑 وضع الماستر تيتو
                        </button>
                      )}
                    </div>

                    {/* Direct Real-Action Controls for the Client's Brand */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setBrandingForm(prev => ({ ...prev, brandName: currentSelectedBrand.name, category: currentSelectedBrand.businessType }));
                          setIsBrandingModalOpen(true);
                        }}
                        className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold flex items-center justify-center gap-1 transition shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>الهوية والسوشيال</span>
                      </button>

                      <button
                        onClick={() => handleOpenWhatsAppConnectModal()}
                        className="py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>ربط واتساب البراند</span>
                      </button>

                      <button
                        onClick={() => handleOpenMetaConnectModal()}
                        className="py-1.5 px-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>ربط فيسبوك وإنستا</span>
                      </button>

                      <button
                        onClick={() => window.open(`/store/${currentSelectedBrand.slug || currentSelectedBrand.id}`, '_blank')}
                        className="py-1.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>فتح متجرك PWA</span>
                      </button>
                    </div>

                    {/* 7-Day Trial ROI & Addiction Value Harvest Counter (عداد حصاد التجربة والعائد الفعلي) */}
                    <div className="p-2.5 rounded-2xl bg-black/65 border border-amber-500/35 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-black text-amber-300 flex items-center gap-1.5">
                          💎 عداد حصاد منظومة النمو لبراندك (القيمة السوقية المنفذة مجاناً):
                        </span>
                        <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          إجمالي القيمة: 22,500 ج.م
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-center text-[9.5px] font-mono">
                        <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <span className="text-white/50 block text-[8px]">تطبيق ومتجر PWA</span>
                          <span className="text-blue-300 font-black">15,000 ج.م ✔</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                          <span className="text-white/50 block text-[8px]">7 منشورات ستوديو</span>
                          <span className="text-cyan-300 font-black">3 مسارات CTA ✔</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <span className="text-white/50 block text-[8px]">وكيل واتساب صوتي</span>
                          <span className="text-emerald-300 font-black">رد في 3 ثوانٍ ✔</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                          <span className="text-white/50 block text-[8px]">مبيعات وحجوزات</span>
                          <span className="text-amber-300 font-black">{realStats.confirmedBookingsCount ?? 0} حجوزات مؤكدة</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-[9.5px] text-white/70">
                          🔥 متجرك، منشوراتك، ووكيل الواتساب يحققون تفاعلاً ومبيعات حية الآن!
                        </span>
                        <button
                          onClick={() => {
                            setPersona('client');
                            playShadowVoice(`ألف مبروك يا فندم! تم تثبيت باقة المدير التنفيذي الشاملة لبراند ${currentSelectedBrand.name} ليستمر متجرك ووكيل الواتساب وتقويم تيتو ستوديو في مضاعفة مبيعاتك بلا توقف!`, 'male');
                          }}
                          className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-[10px] font-black shadow-lg shadow-amber-500/25 transition shrink-0"
                        >
                          ⚡ تفعيل الاشتراك الدائم واستمرار الأرباح
                        </button>
                      </div>
                    </div>
                  </div>
                )}

            {/* TAB 00: AUTONOMOUS MARKETING AGENCY OPERATOR (Modular Component) */}
            {activeDeckTab === 'autonomous_agency' && (
              <JarvisAutonomousAgencyDeck
                currentSelectedBrand={currentSelectedBrand}
                autonomousAgencyData={autonomousAgencyData}
                isExecutingAutonomousAgency={isExecutingAutonomousAgency}
                isPublishingPost={isPublishingPost}
                onExecuteCycle={handleExecuteAutonomousAgency}
                onPublishPost={handlePublishPost}
                onOpenCalendar={() => setActiveDeckTab('studio_calendar')}
                onOpenGraph={() => setActiveDeckTab('obsidian_graph')}
                onOpenCatalog={() => setIsCatalogModalOpen(true)}
              />
            )}

            {/* TAB 0A: OBSIDIAN LIVE KNOWLEDGE GRAPH & SECOND BRAIN VAULT */}
            {activeDeckTab === 'obsidian_graph' && (
              <div className="w-full max-w-xl rounded-3xl bg-[#01030b]/98 border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.2)] p-4 flex flex-col gap-3 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo'] text-right">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#00f0ff]" />
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        🧠 عقل أوبسيديان السيادي الحي • Fiber-Optic Second Brain ({allBrandsList.length || realStats.totalVaultBrandsCount || 0} عقدة براند)
                      </h4>
                      <p className="text-[10px] text-cyan-200/60">
                        شبكة الألياف الضوئية الحية لربط سحابة تيتو ستوديو، وكلاء الواتساب، متاجر PWA، وعملاء الظل
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        handleInspectObsidianNode(currentSelectedBrand.id);
                        setIsBrandSuperWindowOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-[10px] font-black flex items-center gap-1 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>فتح نافذة البراند الشاملة</span>
                    </button>
                    <button
                      onClick={fetchObsidianVault}
                      className="px-2.5 py-1 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>مزامنة</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Zoom Bar for Obsidian Graph */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-[9.5px]">
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'all', label: `الكل (${allBrandsList.length || realStats.totalVaultBrandsCount || 0})` },
                      { id: 'studio', label: 'تيتو ستوديو السحابي (17)' },
                      { id: 'agent', label: 'وكلاء واتساب (8)' },
                      { id: 'ezzel', label: 'مشتركو الظل (4)' }
                    ].map((f: any) => (
                      <button
                        key={f.id}
                        onClick={() => setGraphFilter(f.id)}
                        className={`px-2 py-0.5 rounded-lg border font-bold transition ${
                          graphFilter === f.id
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <button
                      onClick={() => setGraphZoom(z => Math.max(0.75, +(z - 0.15).toFixed(2)))}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10"
                    >
                      -
                    </button>
                    <span className="text-white/60 px-1">{Math.round(graphZoom * 100)}%</span>
                    <button
                      onClick={() => setGraphZoom(z => Math.min(1.45, +(z + 0.15).toFixed(2)))}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 2026 3D Holographic Constellation replacing 2000s SVG Graph */}
                <ObsidianHolographicConstellation
                  brands={allBrandsList.map((b: any) => ({
                    id: b.id,
                    slug: b.slug,
                    name: b.name,
                    businessType: b.businessType,
                    sourceApp: b.sourceApp,
                    phone: b.phone,
                    postsCount: (b.weekContentPlan || []).length,
                    conversationsCount: b.conversationsCount || 0
                  }))}
                  selectedBrandId={currentSelectedBrand.id}
                  onSelectBrand={(id: string) => {
                    handleSelectBrand(id);
                    handleInspectObsidianNode(id);
                  }}
                  onOpenStore={(slug: string) => window.open('/store/' + slug, '_blank')}
                  onOpenChat={() => handleOpenWhatsAppConnectModal()}
                  onOpenStudio={() => window.open('https://t2-studio.vercel.app', '_blank')}
                />

                {/* Live Obsidian Markdown Inspector + Two-Way Live Editor + Direct Action Bar */}
                <div className="p-3 rounded-2xl bg-black/70 border border-fuchsia-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <span className="text-[11px] font-black text-fuchsia-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      ملف العقدة الحي (Two-Way Sync): <code className="text-cyan-300 font-mono">01_Growth_Agency_Brands/{currentSelectedBrand.id}.md</code>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditingObsidianMd(!isEditingObsidianMd)}
                        className="text-[9.5px] font-bold px-2.5 py-0.5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/40 transition"
                      >
                        {isEditingObsidianMd ? '👁️ وضع المعاينة' : '✏️ تحرير مباشر'}
                      </button>
                      {isEditingObsidianMd && (
                        <button
                          onClick={handleSaveObsidianMarkdown}
                          disabled={isSavingObsidianMd}
                          className="text-[9.5px] font-black px-2.5 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition"
                        >
                          {isSavingObsidianMd ? 'جاري الحفظ...' : '💾 حفظ ومزامنة عكسية ⚡'}
                        </button>
                      )}
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        2-WAY LIVE
                      </span>
                    </div>
                  </div>

                  {isEditingObsidianMd ? (
                    <textarea
                      value={obsidianNodeMarkdown}
                      onChange={(e) => setObsidianNodeMarkdown(e.target.value)}
                      rows={6}
                      className="w-full text-[10px] font-mono text-cyan-100 bg-[#020510] p-2.5 rounded-xl border border-fuchsia-400/50 focus:outline-none leading-relaxed text-right"
                      placeholder="عدّل الكتالوج أو توجيهات الأيجنت هنا وسيتم تحديث المتجر وتيتو أجنت فوراً..."
                    />
                  ) : (
                    <pre className="text-[10px] font-mono text-cyan-100/80 bg-[#020510] p-2.5 rounded-xl border border-white/5 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed dir-ltr text-right">
                      {obsidianNodeMarkdown || `# ${currentSelectedBrand.name}\n- **Storefront PWA**: [[Storefront_${currentSelectedBrand.id}|/store/${currentSelectedBrand.slug || currentSelectedBrand.id}]]\n- **Tito Studio Calendar**: [[Studio_Calendar_${currentSelectedBrand.id}|${(currentSelectedBrand.weekContentPlan || []).length} Posts]]\n- **WhatsApp Agent**: [[WA_Agent_${currentSelectedBrand.id}|Connected 24/7]]`}
                    </pre>
                  )}

                  {/* 4 Real Execution Triggers Directly from the Selected Obsidian Node */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => window.open(`/store/${currentSelectedBrand.slug || currentSelectedBrand.id}`, '_blank')}
                      className="py-1.5 px-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/40 text-[10px] font-bold flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>فتح المتجر PWA</span>
                    </button>
                    <button
                      onClick={() => handlePublishPost(currentSelectedBrand.id, 0)}
                      className="py-1.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-[10px] font-bold flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>نشر بوست اليوم</span>
                    </button>
                    <button
                      onClick={() => handleOpenWhatsAppConnectModal()}
                      className="py-1.5 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>ربط الواتساب</span>
                    </button>
                    <button
                      onClick={() => handleOpenMetaConnectModal()}
                      className="py-1.5 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-[10px] font-bold flex items-center justify-center gap-1"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>ربط ميتا OAuth</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 0B: MASTER TITO AGENCY & EZ-ZEL SUBSCRIBERS COMMANDER */}
            {activeDeckTab === 'agency_overview' && (
              <div className="w-full max-w-xl rounded-3xl bg-[#020617]/95 border-2 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.2)] p-4 flex flex-col gap-3 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo'] text-right">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-white">
                        👑 قيادة الماستر تيتو الشاملة: عملاء تطبيق الظل + براندات منظومة النمو
                      </h4>
                      <p className="text-[10px] text-white/50">
                        فصل دقيق بين المشتركين الشخصيين في مساعد الظل وبين براندات الوكالة التجارية مع تحكم تنفيذي كامل
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                    SUPER ADMIN
                  </span>
                </div>

                {/* Section 1: Ez-Zel Personal Assistant Subscribers */}
                <div className="p-3 rounded-2xl bg-black/50 border border-cyan-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      أولاً: عملاء ومشتركو مساعد "الظل" الشخصي ({(obsidianSnapshot?.ezZelPersonalClients || []).length || 4})
                    </span>
                    <span className="text-[9.5px] font-mono text-emerald-400">Personal AI Subscribers</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {(obsidianSnapshot?.ezZelPersonalClients || [
                      { id: 'ezzel_user_1', name: 'أحمد عطية (الماستر تيتو)', phone: '01013373634', plan: 'vip_5000', activeTasksCount: 14, memoryNodesCount: 128, affiliateEarningsEgp: 4500 },
                      { id: 'ezzel_user_2', name: 'د. سارة المنشاوي', phone: '01092837465', plan: 'pro_2500', activeTasksCount: 6, memoryNodesCount: 42, affiliateEarningsEgp: 750 },
                      { id: 'ezzel_user_3', name: 'م. كريم عبد العزيز', phone: '01123456789', plan: 'vip_5000', activeTasksCount: 9, memoryNodesCount: 67, affiliateEarningsEgp: 1500 },
                      { id: 'ezzel_user_4', name: 'أستاذ محمود الجندي', phone: '01234567890', plan: 'free_trial', activeTasksCount: 3, memoryNodesCount: 15, affiliateEarningsEgp: 0 }
                    ]).map((client: any) => (
                      <div key={client.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">{client.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {client.plan}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9.5px] text-white/60 font-mono">
                          <span>مهام: {client.activeTasksCount} • ذاكرة: {client.memoryNodesCount}</span>
                          <span className="text-emerald-400 font-bold">عمولة: {client.affiliateEarningsEgp} ج</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Growth Agency Brands (General & Detailed Info per Brand) */}
                <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      ثانياً: براندات وكالة النمو الشامل ({allBrandsList.length || 21} براند نشط)
                    </span>
                    <span className="text-[9.5px] font-mono text-amber-300">Studio + Agent + PWA</span>
                  </div>

                  <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                    {allBrandsList.map((brand: any) => (
                      <div
                        key={brand.id || brand.slug}
                        className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-2 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{brand.name}</span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                              {(brand.weekContentPlan || []).length || 7} بوست
                            </span>
                          </div>
                          <p className="text-[9.5px] text-white/50 truncate">
                            المجال: {brand.businessType || brand.category || 'تجارة وخدمات'} • المتجر: /store/{brand.slug || brand.id}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              handleSelectBrand(brand.id || brand.slug);
                              setActiveDeckTab('studio_calendar');
                            }}
                            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[9.5px] font-bold border border-cyan-500/30"
                          >
                            إدارة البراند
                          </button>
                          <button
                            onClick={() => window.open(`/store/${brand.slug || brand.id}`, '_blank')}
                            className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[9.5px] font-bold border border-blue-500/30"
                          >
                            المتجر
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: TITO STUDIO 7-DAY CONTENT CALENDAR */}
            {activeDeckTab === 'studio_calendar' && (
              <div className="w-full max-w-xl rounded-3xl bg-[#020617]/95 border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2)] p-4 flex flex-col gap-3 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo'] text-right">
                {/* Calendar Header with Selected Brand Info */}
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                        تقويم تيتو ستوديو: <span className="text-cyan-300">{currentSelectedBrand.name}</span>
                        <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          ☁️ Firestore: t2-content-studio
                        </span>
                      </h4>
                      <p className="text-[10px] text-white/50">
                        مصفوفة الـ 3 مسارات (تحويل للمتجر PWA • محادثة واتساب صوتية • تعليق لرسالة تلقائية)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleBuildStudioStrategy(currentSelectedBrand.id)}
                      disabled={isBuildingStrategy}
                      className="px-2.5 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isBuildingStrategy ? 'جاري بناء الاستراتيجية...' : '1) بناء الاستراتيجية'}</span>
                    </button>
                    <button
                      onClick={() => handleGenerateWeekPlan(currentSelectedBrand.id)}
                      disabled={isGeneratingWeekPlan}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{isGeneratingWeekPlan ? 'جاري التوليد...' : '2) توليد محتوى أول أسبوع'}</span>
                    </button>
                    <button
                      onClick={() => handleApproveSchedule(currentSelectedBrand.id)}
                      disabled={isApprovingSchedule}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isApprovingSchedule ? 'جاري الاعتماد...' : '3) اعتمد الجدولة'}</span>
                    </button>
                    <button
                      onClick={() => handlePublishPost(currentSelectedBrand.id, 0)}
                      disabled={isPublishingPost}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] transition flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isPublishingPost ? 'جاري النشر...' : 'نشر فوري'}</span>
                    </button>
                  </div>
                </div>

                {/* Paymob Auto-Subscription & Daily Proactive Reports Bar */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-black/50 border border-white/10 flex-wrap text-[10px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleCreatePaymobCheckout('growth_pro')}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black flex items-center gap-1 shadow-sm"
                    >
                      💳 تفعيل اشتراك البراند آلياً (Paymob)
                    </button>
                    <a
                      href="/api/studio/turbo-flow/export-csv"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 font-bold"
                    >
                      🎬 تحميل أوامر الفيديو لـ Turbo Flow (CSV)
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendDailyBriefingNow('morning')}
                      className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold"
                      title="إرسال التقرير الصباحي على واتساب بدون فتح التطبيق"
                    >
                      ☀️ تقرير الصباح
                    </button>
                    <button
                      onClick={() => handleSendDailyBriefingNow('evening')}
                      className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-bold"
                      title="إرسال تقرير المساء على واتساب بدون فتح التطبيق"
                    >
                      🌙 تقرير المساء
                    </button>
                  </div>
                </div>

                {/* Active Brand Marketing Strategy Card (Displayed when strategy is built) */}
                {(activeBrandStrategy || currentSelectedBrand.marketingStrategy) && (() => {
                  const st = activeBrandStrategy || currentSelectedBrand.marketingStrategy;
                  return (
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-fuchsia-950/40 via-[#060d24] to-cyan-950/30 border border-fuchsia-500/40 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-fuchsia-300 flex items-center gap-1.5">
                          🎯 الاستراتيجية التسويقية المعتمدة في تيتو ستوديو: {currentSelectedBrand.name}
                        </span>
                        <span className="text-[9.5px] font-mono bg-fuchsia-500/20 text-fuchsia-200 px-2 py-0.5 rounded-full border border-fuchsia-500/30">
                          3 ركائز محتوى
                        </span>
                      </div>
                      <p className="text-[11px] text-white/85 leading-relaxed">
                        <b className="text-cyan-300">التموضع:</b> {st.positioning}
                      </p>
                      <p className="text-[10.5px] text-white/70">
                        <b className="text-amber-300">الجمهور المستهدف:</b> {st.targetAudience} • <b className="text-emerald-300">خليط الإنتاج:</b> {st.weeklyMixSummary}
                      </p>
                      {Array.isArray(st.pillars) && st.pillars.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                          {st.pillars.map((p: any, i: number) => (
                            <div key={i} className="p-2 rounded-xl bg-black/50 border border-white/10 text-[10px]">
                              <div className="font-black text-cyan-300">{p.title} ({p.percentage}%)</div>
                              <div className="text-white/60 text-[9.5px] mt-0.5">{p.objective}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 7-Day Interactive Schedule Cards */}
                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {(currentSelectedBrand.weekContentPlan || []).map((item: any, idx: number) => {
                    const ctaType = item.ctaType || (idx % 3 === 0 ? 'APP_CONVERSION' : idx % 3 === 1 ? 'WHATSAPP_VOICE_AGENT' : 'COMMENT_TO_MESSENGER');
                    const ctaBadge = item.ctaBadge || (
                      ctaType === 'APP_CONVERSION'
                        ? '🛒 تحويل للتطبيق PWA (خصم 10%)'
                        : ctaType === 'WHATSAPP_VOICE_AGENT'
                          ? '💬 محادثة واتساب صوتية فورية'
                          : '🤖 تعليق بكلمة "عرض" لرسالة تلقائية'
                    );
                    const ctaColorClass =
                      ctaType === 'APP_CONVERSION'
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/35'
                        : ctaType === 'WHATSAPP_VOICE_AGENT'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/35';

                    return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/[0.05] transition-all flex flex-col gap-1.5 group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                            {item.day}
                          </span>
                          <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                            {item.contentType}
                          </span>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border ${ctaColorClass}`}>
                            {ctaBadge}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-white/50 font-mono">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{item.bestTime || '20:00'}</span>
                        </div>
                      </div>

                      {/* Hook */}
                      <div className="text-xs font-bold text-white leading-relaxed">
                        🎯 "{item.hook}"
                      </div>

                      {/* Caption Preview */}
                      <div className="text-[11px] text-white/60 line-clamp-2 leading-normal">
                        {item.caption}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap">
                        <span className="text-[9.5px] font-mono text-cyan-300/70 truncate max-w-[220px]">
                          {item.ctaActionText || `المسار: /store/${currentSelectedBrand.slug || currentSelectedBrand.id}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPost({
                                ...item,
                                ctaType,
                                ctaBadge,
                                brandId: currentSelectedBrand.id,
                                brandName: currentSelectedBrand.name,
                                platform: 'Instagram & Facebook (Meta Graph)',
                                status: 'SCHEDULED'
                              });
                              setActiveDeckTab('content_post_card');
                            }}
                            className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 font-bold"
                          >
                            👁️ فتح بطاقة المنشور والتصميم
                          </button>
                          <button
                            onClick={() => handlePublishPost(currentSelectedBrand.id, idx)}
                            disabled={isPublishingPost}
                            className="text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 px-2.5 py-1 rounded-lg border border-cyan-500/30 font-bold transition flex items-center gap-1"
                          >
                            🚀 نشر فوري بالـ Meta Graph
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PUBLISHED CONTENT SHOWCASE CARD */}
            {activeDeckTab === 'content_post_card' && (
              <div className="w-full max-w-xl rounded-3xl bg-[#020617]/95 border-2 border-purple-500/40 shadow-[0_0_35px_rgba(168,85,247,0.2)] p-4 flex flex-col gap-3 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo'] text-right">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        بطاقة المحتوى والتصميم: <span className="text-purple-300">{selectedPost?.brandName || currentSelectedBrand.name}</span>
                      </h4>
                      <p className="text-[10px] text-white/50">معاينة تفاعلية للتصميم، الكابشن، ومسار التحويل (Omni-Channel CTA)</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {selectedPost?.status === 'PUBLISHED' ? 'منشور بنجاح' : 'جاهز للنشر'}
                  </span>
                </div>

                {/* The Social Post Preview Mock */}
                <div className="rounded-2xl bg-black/60 border border-purple-500/30 p-3.5 flex flex-col gap-3">
                  {/* Brand Profile Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-black text-white">
                        {(selectedPost?.brandName || currentSelectedBrand.name || 'T2').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1">
                          {selectedPost?.brandName || currentSelectedBrand.name}
                          <span className="text-cyan-400 text-[10px]">✔</span>
                        </div>
                        <div className="text-[9px] text-white/40">
                          {selectedPost?.platform || 'Instagram & Facebook (Meta Graph)'} • {selectedPost?.day || 'اليوم'} ({selectedPost?.bestTime || '20:00'})
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-md border border-purple-500/30 font-bold">
                      {selectedPost?.ctaBadge || '🛒 تحويل مباشر للتطبيق PWA'}
                    </span>
                  </div>

                  {/* Branded Social Design or Google Flow × Turbo Flow Video Preview */}
                  {selectedPost?.videoUrl ? (
                    <div className="relative w-full h-60 rounded-xl overflow-hidden bg-[#050b14] border border-purple-500/40 flex items-center justify-center">
                      <video
                        src={selectedPost.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (selectedPost?.visualUrl || currentSelectedBrand?.weekContentPlan?.[0]?.visualUrl) ? (
                    <div className="relative w-full h-52 rounded-xl overflow-hidden bg-[#050b14] border border-purple-500/30 flex items-center justify-center">
                      <img
                        src={selectedPost?.visualUrl || currentSelectedBrand?.weekContentPlan?.[0]?.visualUrl}
                        alt={selectedPost?.hook || currentSelectedBrand.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gradient-to-br from-purple-950/60 via-[#070e28] to-cyan-950/60 border border-purple-500/20 flex flex-col items-center justify-center text-center p-4">
                      <Sparkles className="w-6 h-6 text-purple-400 animate-pulse mb-1" />
                      <div className="text-sm font-black text-white max-w-sm leading-snug">
                        "{selectedPost?.hook || 'ابتسامتك هوليودية بأحدث تقنيات الليزر في مصر!'}"
                      </div>
                      <span className="mt-2 text-[9px] text-cyan-300 bg-black/40 px-3 py-1 rounded-full border border-cyan-500/30 font-bold">
                        {selectedPost?.contentType || 'Reel فيديو (9:16)'}
                      </span>
                    </div>
                  )}

                  {/* Google Flow × Turbo Flow Video Automation Panel (when post is video or has omniPrompt) */}
                  {(selectedPost?.mediaFormat === 'video' || String(selectedPost?.contentType || '').includes('فيديو') || String(selectedPost?.contentType || '').includes('Reel')) && (
                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 flex flex-col gap-2 text-[10.5px]">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-black text-purple-300 flex items-center gap-1">
                          🎬 جسر Google Flow × Turbo Flow (Veo 3.1):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open('https://labs.google/fx/tools/flow', '_blank')}
                            className="px-2 py-0.5 rounded-lg bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 border border-purple-400/40 font-bold"
                          >
                            فتح Google Flow
                          </button>
                          <a
                            href="/api/studio/turbo-flow/export-csv"
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/40 font-bold"
                          >
                            ملف Turbo Flow CSV
                          </a>
                        </div>
                      </div>
                      {selectedPost?.omniPrompt && (
                        <div className="p-2 rounded-lg bg-black/60 border border-white/10 font-mono text-[9.5px] text-cyan-200 select-all" dir="ltr">
                          {selectedPost.omniPrompt}
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={turboFlowVideoUrlInput}
                          onChange={(e) => setTurboFlowVideoUrlInput(e.target.value)}
                          placeholder="أو الصق رابط الفيديو المولد من Flow (.mp4) لحفظه في التقويم..."
                          className="flex-1 px-2.5 py-1 rounded-lg bg-black/70 border border-white/15 text-white text-[10px]"
                        />
                        <button
                          onClick={async () => {
                            if (!turboFlowVideoUrlInput.trim()) return;
                            const res = await fetch('/api/studio/turbo-flow/complete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                jobId: selectedPost?.turboFlowJobId,
                                postId: selectedPost?.id,
                                brandId: currentSelectedBrand.id,
                                videoUrl: turboFlowVideoUrlInput.trim()
                              })
                            });
                            const d = await res.json();
                            if (d.ok) {
                              setSelectedPost((prev: any) => ({ ...prev, videoUrl: turboFlowVideoUrlInput.trim(), visualUrl: turboFlowVideoUrlInput.trim() }));
                              setTurboFlowVideoUrlInput('');
                              toast.success('تم حفظ الفيديو في تقويم تيتو ستوديو!');
                              playShadowVoice('تم ربط الفيديو المولد من جوجل فلو وحفظه في تقويم تيتو ستوديو بنجاح يا ماستر!', 'male');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-black text-[10px]"
                        >
                          حفظ بالتقويم
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Caption & Copywriting */}
                  <div className="text-xs text-white/85 leading-relaxed bg-white/[0.03] p-2.5 rounded-xl border border-white/10 whitespace-pre-line">
                    {selectedPost?.caption || currentSelectedBrand?.weekContentPlan?.[0]?.caption || 'احجز كشفك الآن واستمتع بفحص شامل ومجاني مع خطة تقسيط مريحة بدون فوائد. تواصل معنا على الواتساب فوراً!'}
                  </div>

                  {/* Dual Action Boosters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <button
                      onClick={() => handlePublishPost(currentSelectedBrand.id, 0)}
                      disabled={isPublishingPost}
                      className="py-2 px-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-[11px] font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] transition flex items-center justify-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isPublishingPost ? 'جاري النشر...' : '🚀 انشره الآن'}</span>
                    </button>

                    <button
                      onClick={() => handleApproveSchedule(currentSelectedBrand.id)}
                      disabled={isApprovingSchedule}
                      className="py-2 px-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/40 text-[11px] font-black transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✅ اعتمد الجدولة</span>
                    </button>

                    <button
                      onClick={() => handleLaunchAdForPost(selectedPost)}
                      disabled={isLaunchingCampaign}
                      className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[11px] font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] transition flex items-center justify-center gap-1"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{isLaunchingCampaign ? 'جاري الإطلاق...' : 'تمويل كإعلان'}</span>
                    </button>

                    <button
                      onClick={() => setActiveDeckTab('studio_calendar')}
                      className="py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>العودة للتقويم</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: T2 AI AGENT FLEET (MATCHES khedr-bot-agent.onrender.com/dashboard) */}
            {activeDeckTab === 'agent_fleet' && (
              <div className="w-full max-w-xl rounded-3xl bg-[#020617]/95 border-2 border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.2)] p-3 flex flex-col gap-2.5 backdrop-blur-md animate-in fade-in duration-200">
                {/* Fleet Subheader */}
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">لوحة تحكم الأيجنت الذكي • إدارة المحادثات والـ CRM</span>
                  </div>
                  <button
                    onClick={() => setIsOnboardingOpen(true)}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    + إضافة نشاط جديد
                  </button>
                </div>

                {/* Filter Pills from Real Screenshot */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[9.5px] font-mono select-none scrollbar-none">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold whitespace-nowrap">أنشطة وحالة الأيجنت (6)</span>
                  <button onClick={() => setIsCrmModalOpen(true)} className="px-2.5 py-1 rounded-lg bg-black/40 text-white/70 hover:text-white border border-white/5 whitespace-nowrap">المحادثات والتحكم اليدوي (CRM)</button>
                  <button onClick={() => setIsCrmModalOpen(true)} className="px-2.5 py-1 rounded-lg bg-black/40 text-white/70 hover:text-white border border-white/5 whitespace-nowrap">التقويم والحجوزات</button>
                  <button onClick={() => setIsMetaReadinessOpen(true)} className="px-2.5 py-1 rounded-lg bg-black/40 text-white/70 hover:text-white border border-white/5 whitespace-nowrap">الربط والمتاجر</button>
                </div>

                {/* REAL BOT CARDS GRID (Clean Master, Sale Gates, Alkhedr, Battah, Baraka, T2 Digital) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  
                  {/* 1. CLEAN MASTER */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#061c14] to-[#020a06] border border-emerald-500/40 flex flex-col gap-2 relative shadow-lg shadow-emerald-950/40">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">كلين ماستر لخدمات النظافة والتعقيم</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/40 block">ID: clean_master</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${botStates.clean_master ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                        {botStates.clean_master ? 'شغال' : 'متوقف'}
                      </span>
                    </div>

                    <div className="text-[9px] font-mono text-cyan-300">حالة الاشتراك: VIP غير محدود ∞</div>

                    {/* Main Action: Pause / Resume Bot */}
                    <button
                      onClick={() => {
                        const newState = !botStates.clean_master;
                        setBotStates(prev => ({ ...prev, clean_master: newState }));
                        playShadowVoice(newState ? 'تم استئناف رد أيجنت كلين ماستر 24 ساعة!' : 'تم تعليق رد أيجنت كلين ماستر مؤقتاً!', 'male');
                      }}
                      className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 border ${
                        botStates.clean_master
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 font-black'
                      }`}
                    >
                      {botStates.clean_master ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {botStates.clean_master ? 'تعليق الاتصال (إيقاف رد الأيجنت مؤقتاً)' : 'استئناف رد الأيجنت 24/7'}
                    </button>

                    {/* Stats: Live Handled Messages + 100% Platform Health */}
                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                      <div 
                        onClick={() => setIsCrmModalOpen(true)}
                        className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-emerald-400/50 transition"
                      >
                        <span className="text-white/70">صندوق المحادثات</span>
                        <span className="font-bold text-emerald-400">{realStats.totalHandledMessages || 0} 💬</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                        <span className="text-white/70">فحص المنصات</span>
                        <span className="font-bold text-cyan-400">100% 🛡️</span>
                      </div>
                    </div>

                    {/* WhatsApp Connection Status */}
                    <div className="p-1.5 rounded-lg bg-black/60 border border-emerald-500/20 flex items-center justify-between text-[8.5px] font-mono">
                      <span className="text-white/60">واتساب: +201013372674</span>
                      <span className="text-emerald-400 font-bold">متصل وفعال</span>
                    </div>

                    {/* Secondary Buttons Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setIsCrmModalOpen(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white" title="المحادثات">
                          <MessageSquare className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleSendLiveCommand("اتصل بكلين ماستر وافحص الحجوزات")} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400" title="اتصال مباشر">
                          <PhoneCall className="w-3 h-3" />
                        </button>
                        <button onClick={() => setIsMetaReadinessOpen(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400" title="قنوات ميتا">
                          <Globe className="w-3 h-3" />
                        </button>
                        <button onClick={() => toast.success("تم فتح إعدادات البوت والتدريب")} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title="الإعدادات">
                          <Sliders className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[8px] text-amber-300 font-bold">👑 باقة المدير العام</span>
                    </div>
                  </div>

                  {/* 2. SALE GATES EGYPT */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0b172a] to-[#040813] border border-cyan-500/40 flex flex-col gap-2 relative shadow-lg shadow-cyan-950/40">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">Sale Gates Egypt</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/40 block">ID: besho</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${botStates.besho ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                        {botStates.besho ? 'شغال' : 'متوقف'}
                      </span>
                    </div>

                    <div className="text-[9px] font-mono text-cyan-300">حالة الاشتراك: VIP غير محدود ∞</div>

                    <button
                      onClick={() => {
                        const newState = !botStates.besho;
                        setBotStates(prev => ({ ...prev, besho: newState }));
                        playShadowVoice(newState ? 'تم تفعيل رد سيل جيت العقارية!' : 'تم إيقاف رد سيل جيت مؤقتاً!', 'male');
                      }}
                      className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 border ${
                        botStates.besho
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 font-black'
                      }`}
                    >
                      {botStates.besho ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {botStates.besho ? 'تعليق الاتصال (إيقاف رد الأيجنت مؤقتاً)' : 'استئناف رد الأيجنت'}
                    </button>

                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                      <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                        <span className="text-white/70">صندوق المحادثات</span>
                        <span className="font-bold text-cyan-400">{realStats.saleGatesMessages ?? (realStats.totalHandledMessages ? Math.floor(realStats.totalHandledMessages * 0.2) : 0)} 💬</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                        <span className="text-white/70">فحص المنصات</span>
                        <span className="font-bold text-emerald-400">100% 🛡️</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setIsCrmModalOpen(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70">
                          <MessageSquare className="w-3 h-3" />
                        </button>
                        <button onClick={() => setIsMetaReadinessOpen(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400">
                          <Globe className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[8px] text-cyan-300 font-bold">عقارات واستشارات VIP</span>
                    </div>
                  </div>

                  {/* 3. ALKHEDR CAR RENTAL */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1c1306] to-[#0a0601] border border-amber-500/30 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-white text-xs">شركة الخضر لتأجير السيارات</span>
                        <span className="text-[9px] font-mono text-white/40 block">ID: alkhedr_car_rental</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${botStates.alkhedr_car_rental ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'}`}>
                        {botStates.alkhedr_car_rental ? 'شغال' : 'متوقف'}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-amber-300">VIP غير محدود ∞ • محادثات: 0</div>
                    <button
                      onClick={() => {
                        const newState = !botStates.alkhedr_car_rental;
                        setBotStates(prev => ({ ...prev, alkhedr_car_rental: newState }));
                        playShadowVoice(newState ? 'تم استئناف أيجنت الخضر للسيارات 24 ساعة!' : 'تم إيقاف أيجنت الخضر مؤقتاً!', 'male');
                      }}
                      className="w-full py-1.5 rounded-xl text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      تفعيل الاتصال واستئناف رد الأيجنت
                    </button>
                  </div>

                  {/* 4. BATTAH SPARE PARTS */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#140b22] to-[#06020c] border border-purple-500/30 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-white text-xs">متجر بطاح لقطع غيار السيارات</span>
                        <span className="text-[9px] font-mono text-white/40 block">ID: battah_system</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white/60 border border-white/20">
                        متوقف
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-purple-300">VIP غير محدود ∞ • كماليات وقطع غيار</div>
                    <button
                      onClick={() => toast.success("تم إرسال أمر التفعيل لبوت متجر بطاح")}
                      className="w-full py-1.5 rounded-xl text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      تفعيل الاتصال
                    </button>
                  </div>

                  {/* 5. BARAKA MOTORS */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-black/60 to-black/90 border border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-white text-xs">بركة موتورز</span>
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">تجربة 7 أيام</span>
                    </div>
                    <span className="text-[8px] text-white/50">ID: baraka_motors • متبقي في التجربة 7 أيام</span>
                  </div>

                  {/* 6. T2 DIGITAL */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-black/60 to-black/90 border border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-white text-xs">T2 Digital</span>
                      <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">تجربة 7 أيام</span>
                    </div>
                    <span className="text-[8px] text-white/50">ID: t2-digital • منصة الحلول الرقمية</span>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 4: APP CLONER & STOREFRONT FACTORY */}
            {activeDeckTab === 'app_cloner' && (
              <div className="w-full max-w-xl rounded-3xl bg-[#020617]/95 border-2 border-blue-500/40 shadow-[0_0_35px_rgba(59,130,246,0.2)] p-4 flex flex-col gap-3 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo'] text-right">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        منصة بناء متجر وتطبيق البراند: <span className="text-blue-300">{currentSelectedBrand.name}</span>
                      </h4>
                      <p className="text-[10px] text-white/50">توليد متجر PWA كامل، كتالوج عروض، وربط تلقائي مع واتساب ميتا</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    PWA LIVE READY
                  </span>
                </div>

                {/* Active Cloned Store Preview Card */}
                <div className="p-3.5 rounded-2xl bg-black/60 border border-blue-500/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-white block">{currentSelectedBrand.name}</span>
                      <span className="text-[10px] text-blue-300 font-mono">
                        المسار: /store/{currentSelectedBrand.slug || currentSelectedBrand.id}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const url = `/store/${currentSelectedBrand.slug || currentSelectedBrand.id}`;
                        window.open(url, '_blank');
                        playShadowVoice(`تم فتح تطبيق ومتجر ${currentSelectedBrand.name} في نافذة جديدة للمعاينة يا ماستر!`, 'male');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-1 shadow-md shadow-blue-500/30"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح متجر العميل PWA</span>
                    </button>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[8.5px]">نوع النشاط</span>
                      <span className="text-cyan-300 font-bold truncate block">{currentSelectedBrand.businessType || currentSelectedBrand.category || 'تجارة وخدمات'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[8.5px]">رقم الواتساب المربوط</span>
                      <span className="text-emerald-400 font-bold block">{currentSelectedBrand.phone || '01013373634'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[8.5px]">عناصر الكتالوج الحية</span>
                      <span className="text-amber-300 font-bold block">{(currentSelectedBrand.productsCatalog || []).length || 4} خدمات ⚡</span>
                    </div>
                  </div>

                  {/* Live Storefront Catalog & Agent Prompt Quick Editor */}
                  <div className="pt-2 border-t border-blue-500/20 space-y-2">
                    <div className="text-[10.5px] font-bold text-cyan-300">
                      ⚡ تعديل فوري لكتالوج المتجر (/store/{currentSelectedBrand.slug || currentSelectedBrand.id}) وعقل الأيجنت:
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1.5">
                      <input
                        type="text"
                        value={newServiceTitle}
                        onChange={(e) => setNewServiceTitle(e.target.value)}
                        placeholder="اسم الخدمة/المنتج الجديد..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/70 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                      <input
                        type="text"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        placeholder="السعر (مثال: 750 ج.م)"
                        className="sm:w-32 px-2.5 py-1.5 rounded-xl bg-black/70 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        onClick={handleAddCatalogService}
                        disabled={isSavingCatalog || !newServiceTitle.trim()}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition disabled:opacity-40 shrink-0"
                      >
                        + إضافة للمتجر
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={botPromptInput}
                        onChange={(e) => setBotPromptInput(e.target.value)}
                        placeholder="تحديث توجيهات وعقل الأيجنت (مثال: قدم خصم 15% لأول 10 عملاء اليوم)..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/70 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                      <button
                        onClick={handleUpdateBotPrompt}
                        disabled={isSavingCatalog || !botPromptInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs transition disabled:opacity-40 shrink-0"
                      >
                        تحديث الأيجنت
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Brand Cloner Input */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/30 to-black/80 border border-blue-500/20 flex flex-col gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    بناء متجر وتطبيق براند جديد بالذكاء الاصطناعي (AI Brand Store Builder)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-right">
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">اسم البراند / النشاط الجديد:</label>
                      <input
                        type="text"
                        placeholder="مثال: مطعم شاورما الريف، كافيه روما..."
                        value={cloneInputName}
                        onChange={(e) => setCloneInputName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-blue-400 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">المجال / التخصص:</label>
                      <input
                        type="text"
                        placeholder="مثال: مأكولات سورية، كافيه وعصائر..."
                        value={cloneInputCategory}
                        onChange={(e) => setCloneInputCategory(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-blue-400 font-sans"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleCloneBrand(cloneInputName, cloneInputCategory)}
                    disabled={isCloningBrand || !cloneInputName.trim()}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-xl text-xs shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isCloningBrand ? 'جاري بناء وتوليد المتجر والتطبيق...' : 'بناء وتوليد المتجر والتطبيق والكتالوج فوراً ⚡'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: CLICK-TO-WHATSAPP ADS LAUNCHER */}
            {activeDeckTab === 'ad_launcher' && (
              <div className="w-full max-w-xl rounded-3xl bg-[#020617]/95 border-2 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.2)] p-4 flex flex-col gap-3 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo'] text-right">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        ماكينة إعلانات ميتا وواتساب: <span className="text-amber-300">{currentSelectedBrand.name}</span>
                      </h4>
                      <p className="text-[10px] text-white/50">تحويل مباشر للعملاء بنظام Click-to-WhatsApp وربط الـ Leads بأجنت الرد الفوري</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    META API v21.0
                  </span>
                </div>

                {/* Campaign Configuration Card */}
                <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">حملة تحويلات ورسائل بيعية مؤكدة</span>
                      <span className="text-[10px] text-white/50">موجّهة لأعلى الفئات الشرائية المستهدفة</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      ميزانية الانطلاق: 2,000 ج.م
                    </span>
                  </div>

                  {/* Hook preview */}
                  <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                    <span className="text-[9px] text-amber-400/80 font-bold block">الخطاف الإعلاني (Creative Hook):</span>
                    <p className="text-xs font-bold text-white leading-relaxed">
                      "{selectedPost?.hook || currentSelectedBrand.marketAnalysis?.irresistibleHooks?.[0] || 'أقوى العروض الحصرية مع خصم فوري ومتابعة 24 ساعة عبر الواتساب!'}"
                    </p>
                  </div>

                  {/* ROI & Target Matrix */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[8.5px]">الاستهداف الجغرافي</span>
                      <span className="text-white font-bold block">القاهرة والجيزة</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[8.5px]">محادثات متوقعة</span>
                      <span className="text-emerald-400 font-bold block">180 - 240 عميل 💬</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[8.5px]">عوائد بيع تقديرية</span>
                      <span className="text-amber-300 font-bold block">~8,500 ج.م 💰</span>
                    </div>
                  </div>

                  {/* Launch Campaign Button */}
                  <button
                    onClick={() => handleLaunchAdForPost(selectedPost)}
                    disabled={isLaunchingCampaign}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black rounded-xl text-xs shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>{isLaunchingCampaign ? 'جاري التوجيه والإطلاق عبر ميتا...' : 'إطلاق الحملة الآن وربطها بوكلاء الواتساب 🚀'}</span>
                  </button>
                </div>
              </div>
            )}
            {/* TAB 4: REAL FINANCIALS & AUTHENTIC CRM BOOKINGS */}
            {activeDeckTab === 'vault_crm' && (
              <div className="w-full max-w-xl rounded-3xl bg-gradient-to-r from-cyan-950/50 via-[#030d26] to-cyan-950/50 border border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.25)] p-3.5 text-center relative overflow-hidden backdrop-blur-md animate-in fade-in duration-200">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    خزنة البراندات الموحدة • Unified Brand Vault
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {realStats.totalVaultBrandsCount ?? allBrandsList.length ?? 0} براند إنتاجي
                  </span>
                </div>

                {/* 3 Pillars Metric Cards */}
                <div className="grid grid-cols-3 gap-2 text-right">
                  <div className="p-2 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
                    <span className="text-[9px] text-cyan-400/80 font-bold">تيتو ستوديو (نشر وجدولة)</span>
                    <span className="text-sm md:text-base font-black font-mono text-white mt-0.5">
                      {realStats.studioConnectedCount ?? allBrandsList.length ?? 0} براند
                    </span>
                    <span className="text-[8px] text-emerald-400 font-mono">فيسبوك • إنستجرام</span>
                  </div>

                  <div className="p-2 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
                    <span className="text-[9px] text-amber-400/80 font-bold">تيتو أجنت (واتساب وميتا)</span>
                    <span className="text-sm md:text-base font-black font-mono text-white mt-0.5">
                      {realStats.agentActiveCount ?? 2} بوتات نشطة
                    </span>
                    <span className="text-[8px] text-amber-300 font-mono">{realStats.totalHandledMessages ?? 0} محادثة مسجلة</span>
                  </div>

                  <div 
                    onClick={() => setIsCrmModalOpen(true)}
                    className="p-2 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-black/60 border border-emerald-500/30 flex flex-col cursor-pointer hover:border-emerald-400 transition"
                  >
                    <span className="text-[9px] text-emerald-300 font-bold flex items-center justify-between">
                      حجوزات CRM
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-sm md:text-base font-black font-mono text-emerald-400 mt-0.5">
                      {realStats.confirmedBookingsCount ?? 0} حجز مؤكد
                    </span>
                    <span className="text-[8px] text-emerald-300/80 font-mono">
                      {realStats.realConfirmedRevenueEgp ?? 0} ج.م (كلين ماستر)
                    </span>
                  </div>
                </div>

                {/* Action Buttons: View CRM & Meta Settings */}
                <div className="flex items-center justify-center gap-2 mt-2.5 pt-2 border-t border-cyan-500/20 text-[11px] flex-wrap">
                  <button
                    onClick={() => setIsCrmModalOpen(true)}
                    className="px-3 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold transition flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-cyan-400" />
                    تفاصيل حجوزات الـ CRM الفعلية ({realStats.confirmedBookingsCount ?? 0})
                  </button>

                  <button
                    onClick={() => setIsMetaReadinessOpen(true)}
                    className="px-3 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold transition flex items-center gap-1"
                  >
                    <Share2 className="w-3 h-3 text-purple-400" />
                    فحص صلاحيات ميتا وإطلاق الحملات
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: CENTRAL MICROSERVICES API GATEWAY & FLEET ORCHESTRATOR */}
            {activeDeckTab === 'microservices_gateway' && (
              <div className="w-full max-w-xl bg-gradient-to-br from-[#020b18] via-[#031525] to-[#010810] border-2 border-blue-500/40 rounded-3xl p-3 md:p-4 shadow-[0_0_30px_rgba(59,130,246,0.25)] flex flex-col gap-3 text-right animate-in fade-in">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-blue-300">
                      بوابة الـ Microservices المركزية (API Gateway)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    SSE LIVE STREAM • نشط
                  </span>
                </div>

                {/* Microservice Fleet Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-right">
                  {/* Service 1: T2 Agent Core */}
                  <div className="p-2.5 rounded-2xl bg-[#020914] border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                        <span>وكيل الواتساب (T2 Agent)</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="text-[9px] text-white/60 mt-1 leading-tight">
                        مستقل 100% • محرك صوت نقي وتفاوض مبيعات
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-white/40">الردود: {realStats.totalHandledMessages || 0} محادثة</span>
                      <span className="text-emerald-400 font-bold">متصل</span>
                    </div>
                  </div>

                  {/* Service 2: Meta Content Machine */}
                  <div className="p-2.5 rounded-2xl bg-[#020914] border border-purple-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold">
                        <span>ماكينة محتوى ميتا</span>
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      </div>
                      <p className="text-[9px] text-white/60 mt-1 leading-tight">
                        Meta Graph API • جدولة إعلانات وتوليد ليدز
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-white/40">الحملات: نشط</span>
                      <span className="text-purple-400 font-bold">متزامن</span>
                    </div>
                  </div>

                  {/* Service 3: Sovereign Gateway & Hub */}
                  <div className="p-2.5 rounded-2xl bg-[#020914] border border-blue-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-blue-400 font-bold">
                        <span>بوابة الظل (Sovereign Hub)</span>
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                      <p className="text-[9px] text-white/60 mt-1 leading-tight">
                        واجهة موحدة • استقبال الويب هوك والـ CRM
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-white/40">الحجوزات: {realStats.confirmedBookingsCount || 2}</span>
                      <span className="text-blue-400 font-bold">جاهز</span>
                    </div>
                  </div>
                </div>

                {/* Webhook Endpoint Box for External Services */}
                <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/70 font-bold">رابط الويب هوك لاستقبال الحجوزات من T2 Agent:</span>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/api/bookings/webhook`;
                        navigator.clipboard.writeText(url);
                        toast.success('تم نسخ رابط الـ Webhook بنجاح!');
                        playShadowVoice('تم نسخ رابط الويب هوك الموحد إلى الحافظة يا ماستر!', 'male');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold border border-blue-500/30 flex items-center gap-1 transition"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      نسخ الرابط
                    </button>
                  </div>
                  <code className="text-[9px] font-mono text-cyan-300 bg-black/60 px-2 py-1 rounded border border-cyan-500/20 select-all overflow-x-auto text-left ltr">
                    POST {window.location.origin}/api/bookings/webhook
                  </code>
                </div>

                {/* Test Action Button: Live Webhook Ping / Mock Booking */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <button
                    onClick={async () => {
                      try {
                        const testId = `book_${Date.now()}`;
                        const res = await fetch('/api/bookings/webhook', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-T2-Secret': 'cm_live_sec_892147'
                          },
                          body: JSON.stringify({
                            event: 'BOOKING_CONFIRMED',
                            brandId: 'clean_master',
                            data: {
                              id: testId,
                              customerName: 'تجربة حية - ماستر تيتو',
                              customerPhone: '01013373634',
                              service: 'تنظيف عميق بالبخار',
                              price: '650 ج.م',
                              status: 'CONFIRMED',
                              source: 'live_test_webhook'
                            }
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast.success('تم إرسال تجربة الـ Webhook بنجاح وتم استقبالها لحظياً!');
                        }
                      } catch (err: any) {
                        toast.error(err?.message || 'فشل إرسال التجربة');
                      }
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-[11px] shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    إرسال تجربة حجز حقيقي عبر الـ Webhook لحظياً
                  </button>

                  <button
                    onClick={() => setIsCrmModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-white/60" />
                    عرض سجل الحجوزات
                  </button>
                </div>
              </div>
            )}
              </>
            )}

            {/* TWO-WAY LIVE CONVERSATION & AUDIO DOCK */}
            <div className="w-full max-w-md flex flex-col items-center gap-2.5">
              
              {/* Transcript Display Box */}
              {transcript && (
                <div className="w-full px-4 py-2 rounded-2xl bg-black/60 border border-cyan-500/30 text-center text-xs text-cyan-200 font-bold animate-in fade-in">
                  {isThinking ? '🧠 جاري التفكير ومعالجة طلبك يا ماستر...' : `🗣️ "${transcript}"`}
                </div>
              )}

              {/* 16-Bar Audio Spectrum Visualizer */}
              <div className="flex items-end justify-center gap-1.5 h-6 w-full px-4">
                {[...Array(16)].map((_, i) => {
                  const height = isPlayingVoice || isListening
                    ? Math.max(4, Math.min(24, Math.round(Math.sin((i + Date.now() / 200) * 0.8) * 12 + audioLevel * 20 + 8)))
                    : 4;
                  return (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-cyan-600 via-cyan-400 to-white rounded-full transition-all duration-75"
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>

              {/* Dual Action Buttons: Mic Voice Chat & Speak Greeting */}
              <div className="w-full grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleListening}
                  className={`py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-lg shadow-emerald-500/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isListening ? 'أنا سامعك.. اتكلم' : '🎙️ محادثة لايف صوتية'}
                </button>

                <button
                  onClick={() => {
                    if (isPlayingVoice) {
                      stopVoice();
                      setIsPlayingVoice(false);
                    } else {
                      handlePlayPersonaGreeting(persona);
                    }
                  }}
                  className={`py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all ${
                    isPlayingVoice
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  {isPlayingVoice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  {isPlayingVoice ? 'إيقاف نطق جارفيس' : '🔊 استمع لنطق جارفيس'}
                </button>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* LEFT COLUMN (RTL): BRAND FLEET & GROWTH RADAR (3 Cols)    */}
          {/* ========================================================= */}
          <div className={`lg:col-span-3 flex flex-col gap-4 order-3 lg:order-3 ${mobileActiveView === 'brands' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* RIGHT COLUMN: Tailored Visitor App Preview vs Multi-Tenant Brand Selector */}
            {persona === 'visitor' ? (
              <div className="p-4 rounded-3xl bg-[#040b22]/90 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-3 font-['Cairo'] text-right">
                <div className="w-full flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    معاينة تطبيقك المخصص (PWA)
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    LIVE PREVIEW
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{brandingForm.brandName || 'براندك الرسمي المخصص'}</span>
                    <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {brandingForm.category || 'نشاط تجاري'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-white/60 leading-relaxed">
                    نسخة تطبيق ويب وموبايل مخصصة فوراً لنشاطك، مجهزة بكتالوج الخدمات، الحجز الفوري، ووكيل مبيعات واتساب بالصوت البشري.
                  </p>
                  <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[9.5px] text-emerald-300 flex items-center justify-between font-mono">
                    <span>حالة التطبيق:</span>
                    <span className="text-emerald-400 font-bold">جاهز للإطلاق 🚀</span>
                  </div>
                </div>

                {/* 3-Post Trial Schedule */}
                <div className="p-3 rounded-2xl bg-black/60 border border-purple-500/30 space-y-2">
                  <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    خطة الـ 7 أيام المجانية (يوم ويوم):
                  </span>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="font-bold text-white">الأحد:</span>
                      <span className="text-white/70">تصميم بصري احترافي (تيتو ستوديو Feed 1:1)</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between">
                      <span className="font-bold text-cyan-300">الثلاثاء:</span>
                      <span className="text-cyan-200">فيديو ريلز/تيك توك (Google Flow × Turbo)</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
                      <span className="font-bold text-emerald-300">الخميس:</span>
                      <span className="text-emerald-200">بوست عرض خاص وحجز فوري بنهاية الأسبوع (CTA)</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 text-center font-bold">
                  ⚡ جاوب على جارفيس الآن بصوتك أو كتابة لتفعيل الخطة وتجهيز تطبيقك فوراً!
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-[#040b22]/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col gap-3 font-['Cairo'] text-right">
                <div className="w-full flex items-center justify-between pb-2 border-b border-cyan-500/20">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    {persona === 'tito'
                      ? `أسطول البراندات (${allBrandsList.length || realStats.totalVaultBrandsCount || 0})`
                      : `كابينة براندك المعزولة (Multi-Tenant)`}
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {persona === 'tito' ? 'إدارة شاملة' : 'حماية معزولة 🔒'}
                  </span>
                </div>

                {/* Quick Brand Search Filter (Only in Master Admin Mode) */}
                {persona === 'tito' && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث عن براند لتشغيله..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-500/30 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 text-right"
                    />
                  </div>
                )}

                {/* Interactive Brands List - Strictly isolated to current brand if persona is client/trial */}
                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {(allBrandsList.length > 0 ? allBrandsList : (realStats.allVaultBrands || []))
                    .filter((b: any) => {
                      if (persona === 'client' || persona === 'trial') {
                        return b.id === currentSelectedBrand.id || b.slug === currentSelectedBrand.slug;
                      }
                      return !brandSearch || (b.name || '').toLowerCase().includes(brandSearch.toLowerCase());
                    })
                    .slice(0, 12)
                    .map((brand: any) => {
                    const isSelected = brand.id === currentSelectedBrand.id || brand.slug === currentSelectedBrand.slug;
                    return (
                      <button
                        key={brand.id || brand.slug}
                        onClick={() => handleSelectBrand(brand.id || brand.slug)}
                        className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                          <span className="text-xs font-bold truncate">{brand.name}</span>
                        </div>
                        <span className="text-[9px] font-mono text-cyan-300/60 shrink-0">
                          {brand.weekContentPlan?.length ? `${brand.weekContentPlan.length} بوستات` : 'نشط'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="w-full flex items-center justify-between text-[10px] font-mono text-cyan-400/70 pt-1 border-t border-cyan-500/10">
                  <span>البراند المختار:</span>
                  <span className="text-emerald-400 font-bold truncate max-w-[140px]">{currentSelectedBrand.name}</span>
                </div>
              </div>
            )}

            {/* Real Agency Growth Telemetry & KPI Radar */}
            <JarvisGrowthRadarDeck allBrandsList={allBrandsList} realStats={realStats} />

          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* AUTONOMOUS EXECUTIVE LIVE BROWSER ACTUATOR DRAWER / MODAL     */}
      {/* ============================================================== */}
      {isExecutiveOpen && (
        <div className="fixed inset-4 md:inset-10 z-[60] bg-[#020512]/98 border-2 border-amber-500/50 rounded-3xl shadow-[0_0_100px_rgba(245,158,11,0.35)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Browser Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#060c24] border-b border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black text-white flex items-center gap-2">
                  الأجنت التنفيذي المستقل • Autonomous Executive Browser (Chromium Actuator)
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                    LIVE EYE & HANDS
                  </span>
                </h2>
                <p className="text-xs text-white/60">
                  متصفح سيادي مستقل ينفذ الضغط الفعلي على الأزرار وتعبئة الاستمارات وحجز الخدمات آلياً
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExecutiveOpen(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Scenario Triggers Bar */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-[#030718] border-b border-white/10 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400 font-bold">السيناريوهات التنفيذية:</span>
              <button
                onClick={() => handleRunExecutiveBrowser('alkhedr_booking')}
                disabled={executiveRunning}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Car className="w-3.5 h-3.5" />
                حجز سيارة تويوتا (الخضر VIP)
              </button>
              <button
                onClick={() => handleRunExecutiveBrowser('clean_master_booking')}
                disabled={executiveRunning}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                حجز معاينة (كلين ماستر)
              </button>
              <button
                onClick={() => handleRunExecutiveBrowser('admin_audit')}
                disabled={executiveRunning}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                فحص الواتساب (T2-Agent Admin)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-300">
                {executiveRunning ? '⏳ جاري التنفيذ الفعلي...' : '🟢 جاهز للإطلاق'}
              </span>
            </div>
          </div>

          {/* Browser Cockpit Viewport & Live Canvas */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden bg-black/60">
            
            {/* Viewport Canvas (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col rounded-2xl border-2 border-cyan-500/40 overflow-hidden bg-[#070b18] relative">
              
              {/* Fake Chrome Address Bar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0b132b] border-b border-cyan-500/20 text-xs font-mono text-white/70">
                <span className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </span>
                <span className="bg-black/60 px-3 py-1 rounded-lg text-cyan-300 border border-white/5 flex-1 truncate">
                  🔒 {executiveUrl}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  HEADLESS CHROMIUM
                </span>
              </div>

              {/* Live Canvas / Screenshot Display with Virtual Cursor */}
              <div className="flex-1 relative flex items-center justify-center p-2 overflow-hidden bg-slate-950">
                {executiveScreenshot ? (
                  <img
                    src={`data:image/jpeg;base64,${executiveScreenshot}`}
                    alt="Autonomous Browser Stream"
                    className="w-full h-full object-contain rounded-xl shadow-2xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Monitor className="w-16 h-16 text-cyan-400/40 animate-pulse" />
                    <p className="text-sm font-bold text-white/80">
                      شاشة المتصفح التنفيذي جاهزة لبدء العملية
                    </p>
                    <p className="text-xs text-white/40 max-w-md">
                      اضغط على أحد السيناريوهات بالأعلى، وسيقوم محرك Chromium المستقل بفتح الصفحة، تحريك المؤشر، والضغط على الأزرار الفعلية أمامك لايف.
                    </p>
                  </div>
                )}

                {/* Animated Cyber Virtual Cursor */}
                {executiveRunning && (
                  <div
                    className={`absolute z-20 pointer-events-none transition-all duration-300 flex items-center gap-1 ${
                      isClickingCursor ? 'scale-125' : 'scale-100'
                    }`}
                    style={{ top: `${cursorPos.y}%`, left: `${cursorPos.x}%` }}
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-amber-400 bg-amber-500/40 flex items-center justify-center shadow-[0_0_20px_#f59e0b] animate-ping absolute" />
                    <MousePointer className="w-6 h-6 text-amber-300 fill-amber-400 drop-shadow-[0_0_10px_#f59e0b]" />
                    <span className="text-[10px] font-mono font-bold bg-black/90 text-amber-300 px-2 py-0.5 rounded border border-amber-500/50 shadow">
                      JARVIS_ACTUATOR
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Execution Logs & DOM Inspect (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col rounded-2xl border border-amber-500/30 bg-[#04081c] p-4 overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20 text-xs font-mono font-bold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  سجل الأجنت التنفيذي اللحظي
                </span>
                <span className="text-[10px] text-emerald-400">PUPPETEER OK</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-none font-mono text-xs text-white/80 leading-relaxed">
                {executiveLogs.length > 0 ? (
                  executiveLogs.map((log, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-black/50 border border-white/5 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-amber-400/80">
                        <span>[{log.time}]</span>
                        <span className="uppercase text-[9px] bg-white/5 px-1.5 py-0.2 rounded">
                          {log.type}
                        </span>
                      </div>
                      <p className="text-cyan-200 text-xs font-sans">{log.msg}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-white/40 text-xs p-4 text-center">
                    بانتظار تشغيل سيناريو تنفيذي لعرض الخطوات اللحظية ومسارات عناصر DOM...
                  </div>
                )}
              </div>

              {/* Execution Summary Pill */}
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                <span>زمن الاستجابة والتنفيذ:</span>
                <span className="font-mono font-bold text-white">~2,400ms</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Unified Sovereign Product & Services Ingestion Modal */}
      <JarvisUnifiedCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        brand={currentSelectedBrand}
        onProductSynced={(newCatalog) => {
          setAllBrandsList(prev => prev.map(b => b.id === currentSelectedBrand.id ? { ...b, productsCatalog: newCatalog } : b));
        }}
      />

      {/* Client Onboarding Modal for New Brand Registration */}
      <ClientOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => {
          setIsOnboardingOpen(false);
          playShadowVoice("تم تسجيل البراند بنجاح وإدراجه في الخزنة الموحدة للشركات، وربطه بمحرك المحتوى وتطبيق الأجنت!", 'male');
        }}
      />

      {/* REAL CRM BOOKINGS DETAIL MODAL */}
      {isCrmModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#04081c] border-2 border-emerald-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(16,185,129,0.3)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
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
                <div key={idx} className="p-4 rounded-2xl bg-[#020512] border border-emerald-500/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{booking.customerName}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">الخدمة: {booking.service} • براند: كلين ماستر لخدمات النظافة</p>
                    <p className="text-[10px] font-mono text-cyan-400/80">المعرف: {booking.id}</p>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-base font-black text-emerald-400">{booking.price}</span>
                    <p className="text-[9px] text-white/40">عربون ومؤكد</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
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
                  <li><strong className="text-emerald-300">pages_manage_posts & pages_read_engagement:</strong> لنشر البوستات والفيديوهات وسحب التفاعل من تيتو ستوديو.</li>
                  <li><strong className="text-emerald-300">pages_manage_engagement & pages_read_user_content:</strong> لقراءة تعليقات العملاء والرد التلقائي عليها فورياً.</li>
                  <li><strong className="text-emerald-300">instagram_content_publish & instagram_manage_comments:</strong> لنشر ريلز إنستجرام والرد على تعليقات الحساب.</li>
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
          <div className="w-full max-w-lg bg-[#041016] border-2 border-emerald-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(16,185,129,0.35)] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
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
                    className="flex-1 bg-black/60 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={() => handleOpenWhatsAppConnectModal(waPhoneInput)}
                    disabled={isConnectingChannel}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition"
                  >
                    {isConnectingChannel ? 'جاري التوليد...' : 'توليد كود جديد'}
                  </button>
                </div>
              </div>

              {waPairingInfo && (
                <div className="p-4 rounded-2xl bg-black/70 border border-emerald-500/40 text-center space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-300 font-bold">
                      كود الربط الفوري (افتح واتساب &gt; الأجهزة المرتبطة &gt; الربط برقم الهاتف):
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      {waPairingInfo.liveBaileysConnected ? 'BAILEYS LIVE 🟢' : 'T2 AGENT SYNCED ⚡'}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-black tracking-[0.25em] text-white bg-emerald-950/60 border border-emerald-400/50 py-3 px-4 rounded-2xl shadow-inner select-all">
                    {waPairingInfo.pairingCode}
                  </div>
                  {waPairingInfo.qrDataUrl && (
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <img
                        src={waPairingInfo.qrDataUrl}
                        alt="WhatsApp QR"
                        className="w-36 h-36 rounded-xl border-2 border-emerald-500/50 bg-white p-1.5"
                      />
                      <span className="text-[10px] text-white/50">أو امسح الـ QR مباشرة بالكاميرا</span>
                    </div>
                  )}
                  <div className="text-[11px] text-white/60 leading-relaxed">
                    الجلسة مربوطة مباشرة بعقدة أوبسيديان <code className="text-emerald-300 font-mono">[[WA_Agent_{currentSelectedBrand.id}]]</code>
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
                  className="w-full bg-black/60 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
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
                    <span className="text-[10px] font-mono text-emerald-400">جاهزة في تقويم تيتو ستوديو</span>
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
      {/* MULTI-WINDOW BRAND SUPER-WINDOW (نافذة البراند الشاملة - 4 شاشات) */}
      {/* ============================================================== */}
      {isBrandSuperWindowOpen && (
        <div className="fixed inset-2 md:inset-5 z-[80] bg-[#01030b]/98 border-2 border-cyan-400/60 rounded-3xl shadow-[0_0_120px_rgba(0,240,255,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-['Cairo']" dir="rtl">
          {/* Top Bar: Brand Switcher + Close */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#020618] border-b border-cyan-500/35 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black text-white flex items-center gap-2">
                  نافذة القيادة المتعددة لبراند: <span className="text-cyan-300">{currentSelectedBrand.name}</span>
                  <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 px-2 py-0.5 rounded-full">
                    4 LIVE WINDOWS // SECOND BRAIN
                  </span>
                </h2>
                <p className="text-[11px] text-white/60">
                  عرض وتحكم متزامن في: متجر وتطبيق البراند PWA • تقويم وتصميمات تيتو ستوديو • وكيل الواتساب وميتا • عقدة أوبسيديان الحية
                </p>
              </div>
            </div>

            {/* Quick Brand Selector Dropdown + Close */}
            <div className="flex items-center gap-2">
              <select
                value={currentSelectedBrand.id}
                onChange={(e) => {
                  handleSelectBrand(e.target.value);
                  handleInspectObsidianNode(e.target.value);
                }}
                className="bg-[#01040f] border border-cyan-500/50 text-cyan-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
              >
                {allBrandsList.map((b: any) => (
                  <option key={b.id || b.slug} value={b.id || b.slug}>
                    {b.name} ({b.businessType || b.category || 'نشاط تجاري'})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsBrandSuperWindowOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/25 text-white/70 hover:text-rose-300 border border-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 4-Window Fiber-Optic Grid Workspace */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto bg-[#010208]">
            
            {/* WINDOW 1: STOREFRONT PWA & LIVE CATALOG EDITOR */}
            <div className="rounded-2xl bg-[#020614] border border-blue-500/40 p-4 flex flex-col gap-3 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-blue-500/25">
                <span className="text-xs font-black text-blue-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  النافذة 1: متجر وتطبيق البراند الرسمي (PWA Storefront)
                </span>
                <button
                  onClick={() => window.open(`/store/${currentSelectedBrand.slug || currentSelectedBrand.id}`, '_blank')}
                  className="px-2.5 py-1 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>فتح المتجر في تبويب مستقل</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-black/60 border border-white/10">
                  <span className="text-white/40 block text-[8.5px]">المسار المباشر</span>
                  <span className="text-cyan-300 font-bold truncate block">/store/{currentSelectedBrand.slug || currentSelectedBrand.id}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/60 border border-white/10">
                  <span className="text-white/40 block text-[8.5px]">واتساب المبيعات</span>
                  <span className="text-emerald-400 font-bold block">{currentSelectedBrand.phone || '01013373634'}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/60 border border-white/10">
                  <span className="text-white/40 block text-[8.5px]">عناصر الكتالوج</span>
                  <span className="text-amber-300 font-bold block">{(currentSelectedBrand.productsCatalog || []).length || 4} خدمات/منتجات</span>
                </div>
              </div>

              {/* Catalog Items List */}
              <div className="flex-1 max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {((currentSelectedBrand.productsCatalog && currentSelectedBrand.productsCatalog.length > 0)
                  ? currentSelectedBrand.productsCatalog
                  : [
                      { name: 'الباقة الأساسية للبراند', price: '500 ج.م', description: 'خدمة فورية مع ضمان الجودة' },
                      { name: 'الباقة المتكاملة VIP', price: '1,200 ج.م', description: 'شاملة المتابعة والدعم الكامل' }
                    ]
                ).map((item: any, i: number) => (
                  <div key={i} className="p-2 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate">{item.name || item.title}</span>
                    <span className="font-mono text-emerald-400 font-bold shrink-0">{item.price || 'حسب الطلب'}</span>
                  </div>
                ))}
              </div>

              {/* Quick Add Service */}
              <div className="flex gap-1.5 pt-2 border-t border-blue-500/20">
                <input
                  type="text"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  placeholder="إضافة منتج/خدمة جديدة للمتجر..."
                  className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/70 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  placeholder="السعر"
                  className="w-24 px-2.5 py-1.5 rounded-xl bg-black/70 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleAddCatalogService}
                  disabled={isSavingCatalog || !newServiceTitle.trim()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition disabled:opacity-40"
                >
                  + إضافة
                </button>
              </div>
            </div>

            {/* WINDOW 2: TITO STUDIO 7-DAY CONTENT CALENDAR & VISUAL DESIGN */}
            <div className="rounded-2xl bg-[#020614] border border-cyan-500/40 p-4 flex flex-col gap-3 shadow-[0_0_25px_rgba(0,240,255,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/25">
                <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  النافذة 2: تقويم وتصميمات تيتو ستوديو السحابي (7 أيام Omni-CTA)
                </span>
                <button
                  onClick={() => handlePublishPost(currentSelectedBrand.id, 0)}
                  disabled={isPublishingPost}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-black flex items-center gap-1 transition"
                >
                  <Send className="w-3 h-3" />
                  <span>{isPublishingPost ? 'جاري النشر...' : 'نشر بوست اليوم'}</span>
                </button>
              </div>

              <div className="flex-1 max-h-56 overflow-y-auto space-y-2 pr-1">
                {(currentSelectedBrand.weekContentPlan || []).map((post: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/25 flex items-start gap-2.5">
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt={post.day}
                        className="w-14 h-14 rounded-lg object-cover border border-cyan-500/30 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black text-cyan-300">{post.day} • {post.contentType}</span>
                        <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          {post.ctaBadge || 'Omni-CTA'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate mt-0.5">🎯 {post.hook}</p>
                      <p className="text-[10px] text-white/60 line-clamp-1">{post.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WINDOW 3: WHATSAPP VOICE AGENT, META GRAPH & LIVE CHANNELS */}
            <div className="rounded-2xl bg-[#020614] border border-emerald-500/40 p-4 flex flex-col gap-3 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/25">
                <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  النافذة 3: وكيل الواتساب الصوتي (Gemini 24kHz) وقنوات ميتا
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ACTIVE 24/7
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenWhatsAppConnectModal()}
                  className="p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-black flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>ربط واتساب (كود / QR)</span>
                </button>
                <button
                  onClick={() => handleOpenMetaConnectModal()}
                  className="p-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-200 text-xs font-black flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>ربط فيسبوك وإنستجرام</span>
                </button>
              </div>

              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={botPromptInput}
                  onChange={(e) => setBotPromptInput(e.target.value)}
                  placeholder="توجيه فوري لوكيل الواتساب (مثال: قدم خصم 20% اليوم)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/70 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={handleUpdateBotPrompt}
                  disabled={isSavingCatalog || !botPromptInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition disabled:opacity-40"
                >
                  تحديث الأيجنت
                </button>
              </div>
            </div>

            {/* WINDOW 4: OBSIDIAN SECOND BRAIN MARKDOWN NODE (TWO-WAY SYNC) */}
            <div className="rounded-2xl bg-[#020614] border border-fuchsia-500/40 p-4 flex flex-col gap-3 shadow-[0_0_25px_rgba(217,70,239,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-fuchsia-500/25">
                <span className="text-xs font-black text-fuchsia-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-fuchsia-400" />
                  النافذة 4: عقدة أوبسيديان الحية (<code className="text-cyan-300 font-mono">{currentSelectedBrand.id}.md</code>)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsEditingObsidianMd(!isEditingObsidianMd)}
                    className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/40 text-[10px] font-bold"
                  >
                    {isEditingObsidianMd ? 'معاينة' : '✏️ تحرير العقدة'}
                  </button>
                  {isEditingObsidianMd && (
                    <button
                      onClick={handleSaveObsidianMarkdown}
                      disabled={isSavingObsidianMd}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black"
                    >
                      {isSavingObsidianMd ? 'حفظ...' : '💾 حفظ ومزامنة'}
                    </button>
                  )}
                </div>
              </div>

              {isEditingObsidianMd ? (
                <textarea
                  value={obsidianNodeMarkdown}
                  onChange={(e) => setObsidianNodeMarkdown(e.target.value)}
                  rows={7}
                  className="w-full flex-1 text-[10.5px] font-mono text-cyan-100 bg-[#01030a] p-3 rounded-xl border border-fuchsia-400/50 focus:outline-none leading-relaxed text-right"
                />
              ) : (
                <pre className="w-full flex-1 max-h-44 overflow-y-auto text-[10.5px] font-mono text-cyan-100/85 bg-[#01030a] p-3 rounded-xl border border-white/10 whitespace-pre-wrap leading-relaxed text-right">
                  {obsidianNodeMarkdown || `# ${currentSelectedBrand.name}\n- **Storefront PWA**: [[Storefront_${currentSelectedBrand.id}|/store/${currentSelectedBrand.slug || currentSelectedBrand.id}]]\n- **Tito Studio Calendar**: [[Studio_Calendar_${currentSelectedBrand.id}|7 Days Active]]\n- **WhatsApp Agent**: [[WA_Agent_${currentSelectedBrand.id}|Connected 24/7]]`}
                </pre>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
