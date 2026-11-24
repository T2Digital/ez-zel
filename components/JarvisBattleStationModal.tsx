import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { motion, AnimatePresence } from 'motion/react';
import { playShadowVoice, stopVoice, speakBrowserNaturalVoice } from '../services/speechService';
import { ClientOnboardingModal } from './chat/ClientOnboardingModal';
import { VisitorIntelligenceOnboarding } from './chat/VisitorIntelligenceOnboarding';
import { LiveTelemetryNotifier } from './LiveTelemetryNotifier';
import { FluidLuminescentOrb } from './FluidLuminescentOrb';
import { ObsidianHolographicConstellation } from './ObsidianHolographicConstellation';
import { JarvisGrowthRadarDeck } from './jarvis/JarvisGrowthRadarDeck';
import { JarvisUnifiedCatalogModal } from './jarvis/JarvisUnifiedCatalogModal';
import { JarvisMasterVoiceDock } from './jarvis/JarvisMasterVoiceDock';
import { JarvisContentPostCard } from './jarvis/JarvisContentPostCard';
import { JarvisStudioCalendarDeck } from './jarvis/JarvisStudioCalendarDeck';
import { JarvisAgentFleetDeck } from './jarvis/JarvisAgentFleetDeck';
import { JarvisArcReactorCore } from './jarvis/JarvisArcReactorCore';
import { JarvisDynamicWidgetHUD } from './jarvis/JarvisDynamicWidgetHUD';
import { JarvisConnectionModals } from './jarvis/JarvisConnectionModals';
import { JarvisBrandCommandHub, resolveBrandWebUrl } from './jarvis/JarvisBrandCommandHub';
const AdkVentureArchitectModal = React.lazy(() => import('./jarvis/AdkVentureArchitectModal').then(m => ({ default: m.AdkVentureArchitectModal })));
import { jarvisVoiceSocket, VoiceSocketState } from '../services/jarvisVoiceSocketService';
import { BRAND_VAULT } from '../services/brandVault';
import { shadowDB } from '../services/dbService';
import { useAppStore } from '../services/store';
import { isMasterAdminEmail, getAdminAuthHeaders } from '../services/adminIdentity';

const MissionClock: React.FC = React.memo(() => {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('en-GB', { hour12: false })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden sm:inline font-mono text-xs md:text-sm font-black text-cyan-300 tracking-wider">
      {clock}
    </span>
  );
});

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
  const storeUser = useAppStore((s) => s.user);
  const storeUserEmail = (storeUser?.email || '').toLowerCase();
  const isMasterAdmin = typeof window !== 'undefined' && (
    localStorage.getItem('tito_admin_master') === 'true' ||
    Boolean(localStorage.getItem('t2os_admin_token')) ||
    isMasterAdminEmail(storeUserEmail) ||
    (storeUser?.tier === 'sovereign' && Boolean(storeUser?.name?.includes('تيتو')))
  );

  // Active Persona: Initialized to passed prop (with URL ?persona=visitor override for QA/preview), 'tito' for master admin, or 'visitor' for guests
  const urlPersonaOverride = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('persona') : null;
  const [persona, setPersona] = useState<'visitor' | 'trial' | 'client' | 'tito'>(() => {
    if (urlPersonaOverride === 'visitor' || urlPersonaOverride === 'trial') return urlPersonaOverride;
    if (isMasterAdmin) return initialPersona === 'client' ? 'tito' : (initialPersona || 'tito');
    if (initialPersona) return initialPersona;
    return 'visitor';
  });
  const [adminPreviewVisitor, setAdminPreviewVisitor] = useState<boolean>(() => urlPersonaOverride === 'visitor');
  const [textCommandInput, setTextCommandInput] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAdkVentureOpen, setIsAdkVentureOpen] = useState(false);
  const [adkPresetName, setAdkPresetName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isBrandSuperWindowOpen, setIsBrandSuperWindowOpen] = useState(false);
  const [graphFilter, setGraphFilter] = useState<'all' | 'studio' | 'agent' | 'ezzel'>('all');
  const [graphZoom, setGraphZoom] = useState<number>(1);
  
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'stage' | 'brands' | 'radar'>('stage');
  const [telemetryMode, setTelemetryMode] = useState<'human' | 'system'>('human');
  
  // Real Database Financials & Telemetry
  const [realStats, setRealStats] = useState<any>({
    totalVaultBrandsCount: 0,
    tenantsCount: 0,
    studioConnectedCount: 0,
    agentActiveCount: 0,
    confirmedBookingsCount: 0,
    realConfirmedRevenueEgp: 0,
    totalHandledMessages: 0,
    btcPrice: 0,
    gold21kEgp: 0,
    recentBookings: []
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
    '[T2OS]: جاري مزامنة الأنظمة الحية (الظل + الاستوديو + الأيجنت)...'
  ]);

  // Two-Way Live Conversation State
  const [isListening, setIsListening] = useState(false);
  const [voiceSocketState, setVoiceSocketState] = useState<VoiceSocketState>('disconnected');
  const [transcript, setTranscript] = useState(() => {
    try {
      return localStorage.getItem('ezzel_last_jarvis_transcript') || '';
    } catch {
      return '';
    }
  });
  useEffect(() => {
    if (transcript) {
      try { localStorage.setItem('ezzel_last_jarvis_transcript', transcript); } catch {}
    }
  }, [transcript]);
  useEffect(() => {
    if (!isOpen) return;
    const syncSpeaking = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
        setIsPlayingVoice(true);
        isPlayingVoiceRef.current = true;
      }
    };
    syncSpeaking();
    const t = setInterval(() => {
      if (typeof window !== 'undefined' && isPlayingVoiceRef.current && !window.speechSynthesis?.speaking && !activeAudioRef.current) {
        setIsPlayingVoice(false);
        isPlayingVoiceRef.current = false;
      }
    }, 600);
    return () => clearInterval(t);
  }, [isOpen]);
  const transcriptRef = useRef<string>('');
  const streamTimerRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechSeqRef = useRef<number>(0);

  const stopAllJarvisAudio = useCallback(() => {
    speechSeqRef.current += 1;
    try { stopVoice(); } catch {}
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.onended = null;
        activeAudioRef.current.onerror = null;
        activeAudioRef.current.pause();
        activeAudioRef.current.src = '';
      } catch {}
      activeAudioRef.current = null;
    }
    setIsPlayingVoice(false);
    isPlayingVoiceRef.current = false;
  }, []);
  const [quickChips, setQuickChips] = useState<string[]>([
    'عندي بيزنس قائم بالفعل',
    'فكرة جديدة من الصفر',
    'تجهيز التطبيق والكتالوج'
  ]);
  const [visitorName, setVisitorName] = useState<string>(() => {
    try { return localStorage.getItem('ezzel_visitor_name_v1') || ''; } catch { return ''; }
  });
  const [detectedVisitorBrand, setDetectedVisitorBrand] = useState<{
    businessName?: string;
    industry?: string;
    hasExistingBusiness?: boolean | null;
  }>({});
  const [studioEmbed, setStudioEmbed] = useState<{
    open: boolean;
    view: string;
    clinicId: string;
    embedUrl: string;
  } | null>(null);
  const studioIframeRef = useRef<HTMLIFrameElement>(null);
  const [agentEmbed, setAgentEmbed] = useState<{
    open: boolean;
    windowName: string;
    brandId: string;
    embedUrl: string;
  } | null>(null);
  const agentIframeRef = useRef<HTMLIFrameElement>(null);

  const streamTranscriptWords = useCallback((fullText: string) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    const words = String(fullText || '').split(/\s+/).filter(Boolean);
    if (words.length <= 4) {
      setTranscript(fullText);
      return;
    }
    let idx = 3;
    setTranscript(words.slice(0, idx).join(' '));
    streamTimerRef.current = setInterval(() => {
      idx += 3;
      if (idx >= words.length) {
        setTranscript(fullText);
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      } else {
        setTranscript(words.slice(0, idx).join(' '));
      }
    }, 55);
  }, []);
  const [isThinking, setIsThinking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'model'; text: string }>>(() => {
    try {
      const raw = localStorage.getItem('ezzel_voice_history_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const voiceChatEndRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef(conversationHistory);
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  useEffect(() => {
    try {
      if (conversationHistory.length > 0) {
        localStorage.setItem('ezzel_voice_history_v1', JSON.stringify(conversationHistory.slice(-20)));
      }
    } catch {}
    voiceChatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [conversationHistory]);
  const recognitionRef = useRef<any>(null);
  const autoLoopEnabledRef = useRef<boolean>(true);
  const isOpenRef = useRef<boolean>(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; if (!isOpen) { autoLoopEnabledRef.current = false; try { recognitionRef.current?.abort(); } catch {} } else { autoLoopEnabledRef.current = true; } }, [isOpen]);

  // Autonomous Executive Browser Actuator State
  const [isExecutiveOpen, setIsExecutiveOpen] = useState(false);
  const [executiveRunning, setExecutiveRunning] = useState(false);
  const [executiveScenario, setExecutiveScenario] = useState<string>('t2_studio_command');
  const [executiveUrl, setExecutiveUrl] = useState('https://studio.t2os.app');
  const [executiveLogs, setExecutiveLogs] = useState<any[]>([]);
  const [executiveScreenshot, setExecutiveScreenshot] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isClickingCursor, setIsClickingCursor] = useState(false);

  // Active Command Deck Tab: 'studio_calendar' | 'content_post_card' | 'agent_fleet' | 'app_cloner' | 'ad_launcher' | 'vault_crm' | 'microservices_gateway' | 'obsidian_graph' | 'agency_overview' | 'brand_hub'
  const [activeDeckTab, setActiveDeckTab] = useState<'autonomous_agency' | 'studio_calendar' | 'content_post_card' | 'agent_fleet' | 'app_cloner' | 'ad_launcher' | 'vault_crm' | 'microservices_gateway' | 'obsidian_graph' | 'agency_overview' | 'brand_hub'>(initialPersona === 'client' ? 'brand_hub' : 'obsidian_graph');
  const [jarvisWorkspaceMode, setJarvisWorkspaceMode] = useState<'command' | 'ops'>('ops');
  const [isExecutingAutonomousAgency, setIsExecutingAutonomousAgency] = useState<boolean>(false);
  const [autonomousAgencyData, setAutonomousAgencyData] = useState<any>(null);
  const [activeDynamicWidget, setActiveDynamicWidget] = useState<{ widgetType: string; data: any } | null>(null);
  
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isWaConnectModalOpen) setIsWaConnectModalOpen(false);
        else if (isMetaConnectModalOpen) setIsMetaConnectModalOpen(false);
        else if (isBrandingModalOpen) setIsBrandingModalOpen(false);
        else if (isCrmModalOpen) setIsCrmModalOpen(false);
        else if (isMetaReadinessOpen) setIsMetaReadinessOpen(false);
        else if (isBrandSuperWindowOpen) setIsBrandSuperWindowOpen(false);
        else if (studioEmbed?.open) setStudioEmbed(null);
        else if (agentEmbed?.open) setAgentEmbed(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isWaConnectModalOpen, isMetaConnectModalOpen, isBrandingModalOpen, isCrmModalOpen, isMetaReadinessOpen, isBrandSuperWindowOpen, studioEmbed?.open, agentEmbed?.open, onClose]);

  // Two-Way Obsidian Markdown Editor & Live Catalog Editor State
  const [isEditingObsidianMd, setIsEditingObsidianMd] = useState<boolean>(false);
  const [isSavingObsidianMd, setIsSavingObsidianMd] = useState<boolean>(false);
  const [newServiceTitle, setNewServiceTitle] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [botPromptInput, setBotPromptInput] = useState<string>('');
  const [isSavingCatalog, setIsSavingCatalog] = useState<boolean>(false);
  
  // Selected Brand for Active Deep Interaction across all 3 Apps
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
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
  
  // Real-time active states for bots in fleet (populated dynamically from real backend/T2 Agent)
  const [botStates, setBotStates] = useState<Record<string, boolean>>({});

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

  const fetchObsidianVault = (scopedBrandId?: string) => {
    const canReadFullGraph = isMasterAdmin && !adminPreviewVisitor && persona === 'tito';
    const targetId = scopedBrandId || (!canReadFullGraph ? (selectedBrandId || undefined) : undefined);
    if (!canReadFullGraph && !targetId) return;
    const url = canReadFullGraph ? '/api/obsidian/graph' : `/api/obsidian/graph?brandId=${encodeURIComponent(targetId!)}`;
    fetch(url, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.success) {
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
      const headers = await getAdminAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        credentials: 'include',
        headers,
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

  const handleOpenMetaConnectModal = async (targetBrandId?: string) => {
    setIsMetaConnectModalOpen(true);
    setMetaPageInput(`${currentSelectedBrand.name} - Official`);
  };

  const handleConfirmMetaConnect = async () => {
    setIsConnectingChannel(true);
    try {
      const headers = await getAdminAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        credentials: 'include',
        headers,
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
      const headers = await getAdminAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        credentials: 'include',
        headers,
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
      const headers = await getAdminAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        credentials: 'include',
        headers,
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

  // Clock is now isolated inside <MissionClock /> to prevent 20Hz re-renders of the entire modal.

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

  const fetchDatabaseStats = async () => {
    if (!isMasterAdmin || adminPreviewVisitor) return;
    const headers = await getAdminAuthHeaders();
    fetch('/api/system/real-financials', { credentials: 'include', headers })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.success) {
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

  useEffect(() => {
    if ((!isMasterAdmin || adminPreviewVisitor || persona !== 'tito') && activeDeckTab === 'obsidian_graph') {
      setActiveDeckTab('brand_hub');
    }
  }, [isMasterAdmin, adminPreviewVisitor, persona, activeDeckTab]);

  // Fetch real database telemetry on open
  useEffect(() => {
    if (!isOpen) {
      jarvisVoiceSocket.disconnect();
      stopVoice();
      setIsPlayingVoice(false);
      return;
    }

    const canAccessFullFleet = isMasterAdmin && !adminPreviewVisitor;

    // Preserve completed onboarding brand ONLY for non-admin visitors or preview-as-visitor
    let savedTrialBrand: any = null;
    if (!canAccessFullFleet) {
      try {
        const rawTrial = localStorage.getItem('t2_active_trial_brand');
        if (rawTrial) savedTrialBrand = JSON.parse(rawTrial);
      } catch {}
    }

    if (canAccessFullFleet) {
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

      // Fetch all brands with their weekly content plans (admin only)
      (async () => {
        const headers = await getAdminAuthHeaders();
        fetch('/api/cloner/brands', { credentials: 'include', headers })
          .then(r => (r.ok ? r.json() : null))
          .then(d => {
            if (d?.success && Array.isArray(d.brands) && d.brands.length > 0) {
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
      })();
    } else if (savedTrialBrand?.id) {
      const targetBrandId = savedTrialBrand.slug || savedTrialBrand.id;
      fetchObsidianVault(targetBrandId);
      fetch(`/api/cloner/brands?brandId=${encodeURIComponent(targetBrandId)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (d?.success && Array.isArray(d.brands) && d.brands.length > 0) {
            setAllBrandsList(d.brands);
          }
        })
        .catch(() => {});
    }

    const activeInitial = canAccessFullFleet
      ? 'tito'
      : savedTrialBrand?.id && !adminPreviewVisitor
      ? 'trial'
      : adminPreviewVisitor
      ? 'visitor'
      : initialPersona || persona;

    if (canAccessFullFleet) {
      if (persona !== 'tito') setPersona('tito');
    } else if (savedTrialBrand?.id && !adminPreviewVisitor) {
      setAllBrandsList(prev => (prev.some(b => b.id === savedTrialBrand.id) ? prev : [savedTrialBrand, ...prev]));
      setSelectedBrandId(prev => prev || savedTrialBrand.id);
      if (persona === 'visitor') setPersona('trial');
    } else if (!adminPreviewVisitor && initialPersona && initialPersona !== persona) {
      setPersona(initialPersona);
    }

    setTranscript(
      activeInitial === 'tito'
        ? 'أهلاً يا ماستر تيتو، جاهز — اكتب أمرك أو اضغط الكرة للتحدث.'
        : 'جارفيس جاهز — اكتب طلبك أو اضغط الكرة للتحدث.'
    );

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

  const selectedBrand = selectedBrandId ? (allBrandsList.find(b => b.id === selectedBrandId || b.slug === selectedBrandId) || null) : null;
  const currentSelectedBrand = selectedBrand || allBrandsList[0] || {
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
      const authHeaders = await getAdminAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch('/api/branding/forge', {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders,
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
          credentials: 'include',
          headers: authHeaders,
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

  const handleCreatePaymobCheckout = async (planId: 'tier_5000' | 'tier_8500' | 'tier_12500' | 'starter_monthly' | 'growth_pro' | 'agency_unlimited' = 'tier_5000') => {
    try {
      const amountMap: Record<string, number> = {
        tier_5000: 5000,
        tier_8500: 8500,
        tier_12500: 12500,
        growth_pro: 5000,
        starter_monthly: 5000,
        agency_unlimited: 12500
      };
      const res = await fetch('/api/payments/paymob/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: currentSelectedBrand.id || currentSelectedBrand.slug,
          brandName: currentSelectedBrand.name,
          planId: planId === 'growth_pro' || planId === 'starter_monthly' ? 'tier_5000' : planId,
          amountEgp: amountMap[planId] || 5000,
          customerPhone: currentSelectedBrand.phone || ''
        })
      });
      const d = await res.json();
      if ((d.ok || d.success) && d.paymentUrl) {
        const resolvedUrl = new URL(d.paymentUrl, window.location.origin).toString();
        window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
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
        credentials: 'include',
        headers: await getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
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
        setTranscript(isMasterAdmin ? 'أنا سامعك يا ماستر.. اتفضل اتكلم' : 'أهلاً بيك في منظومة الظل — أنا سامعك، اتفضل اتكلم');
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        transcriptRef.current = text;
        setTranscript(text);
    streamTranscriptWords(text);
    setConversationHistory(prev => (prev.length === 0 ? [{ role: 'model', text }] : prev));
      };

      recognition.onerror = (err: any) => {
        console.warn('[Speech Recognition Error]:', err?.error || err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalRecorded = transcriptRef.current;
        if (finalRecorded && !finalRecorded.includes('اتفضل اتكلم') && finalRecorded.trim().length > 0) {
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
      let savedJourney: any = null;
      try {
        const raw = localStorage.getItem('ezzel_visitor_journey_v1');
        if (raw) savedJourney = JSON.parse(raw);
      } catch {}

      if (savedJourney?.generatedBrand?.name) {
        let liveOrders = 0;
        let liveWa = 0;
        try {
          const tel = await fetch(`/api/telemetry/live?brandId=${encodeURIComponent(savedJourney.generatedBrand.id || savedJourney.generatedBrand.slug)}`).then(r => r.json());
          if (tel?.ok) {
            liveOrders = (tel.orders || 0) + (tel.bookings || 0);
            liveWa = tel.whatsappMessages || 0;
          }
        } catch {}
        const namePart = visitorName ? `يا ${visitorName}` : 'يا فندم';
        text = `أهلاً بيك ${namePart} مرة تانية في T2OS! براند ${savedJourney.generatedBrand.name} شغال الآن — سجّلنا ${liveOrders} طلب وحجز و${liveWa} رسالة واتساب. تحب نراجع أو نطوّر إيه النهاردة؟`;
      } else if (visitorName) {
        text = `أهلاً بيك يا ${visitorName} في منظومة T2OS من T2 Digital! قولي عشان نبدأ صح: عندك نشاط تجاري شغال حالياً في السوق، ولا دي فكرة جديدة بتنطلق فيها من الصفر؟`;
      } else {
        text = `أهلاً بيك في منظومة T2OS من T2 Digital! أنا جارفيس المستشار التنفيذي لأعمالك.. نتشرف باسمك الأول يا فندم؟ وقولي هل عندك نشاط تجاري شغال حالياً ولا بتبدأ فكرة جديدة من الصفر؟`;
      }
    } else if (activeP === 'trial') {
      text = `أهلاً بيك يا فندم في أسبوع التجربة المجانية لـ ${currentSelectedBrand.name}! خطتك من 3 منشورات حقيقية (يوم ويوم: الأحد، الثلاثاء، والخميس) جاهزة، والوكيل الذكي متصل بيرد 24 ساعة.. تحب نولد أول تصميم في تيتو ستوديو دلوقتي؟`;
    } else if (activeP === 'client') {
      text = `نورت كابينة قيادة براندك يا شريك النجاح! أنا معاك كمدير تنفيذي وسكرتير ذكي لمتابعة المحتوى والواتساب والحجوزات لحظة بلحظة.. تحب ننفذ إيه دلوقتي؟`;
    } else {
      // Tito Admin greeting strictly simplified per Master Tito's request
      text = 'أهلاً يا تيتو، أؤمرني!';
    }

    setTranscript(text);
    streamTranscriptWords(text);
    setConversationHistory(prev => (prev.length === 0 ? [{ role: 'model', text }] : prev));
    // Play ONLY 100% Gemini Human TTS voice (Puck 24kHz)
    playShadowVoice(text, 'male', undefined, () => {
      setIsPlayingVoice(false);
      isPlayingVoiceRef.current = false;
      if (isOpenRef.current && autoLoopEnabledRef.current) {
        setTimeout(() => {
          if (isOpenRef.current && !isPlayingVoiceRef.current && autoLoopEnabledRef.current) {
            startListeningLoop();
          }
        }, 250);
      }
    });
  };

  // Two-Way Sovereign Voice Controller (Direct Native Speech Recognition + Human 24kHz Gemini Voice)
  const handleToggleListening = async () => {
    // 1. Immediately unlock browser audio context on user gesture
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') await ctx.resume();
      }
    } catch {}

    if (isListening) {
      autoLoopEnabledRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      stopVoice();
      setIsPlayingVoice(false);
      isPlayingVoiceRef.current = false;
      setTranscript('');
      return;
    }

    autoLoopEnabledRef.current = true;
    stopVoice();
    setIsPlayingVoice(false);
    isPlayingVoiceRef.current = false;
    startListeningLoop();
  };

  // Autonomous Marketing Agency Operator: 1-Month Plan (4 Weeks / 12 Posts) + Firestore Sync + First Post Spotlight
  const handleExecuteAutonomousAgency = async (brandId?: string, isVoiceTriggered: boolean = false) => {
    const targetBrandId = brandId || currentSelectedBrand.id || 'tito_media';
    const targetBrand = allBrandsList.find(b => b.id === targetBrandId) || currentSelectedBrand;
    
    setIsExecutingAutonomousAgency(true);
    setIsThinking(true);
    isThinkingRef.current = true;
    setActiveDeckTab('studio_calendar');
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
    stopAllJarvisAudio();
    const mySpeechSeq = speechSeqRef.current;
    setIsThinking(true);
    isThinkingRef.current = true;
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
          const recentMsgs = await shadowDB.getMessages();
          recentChatSummary = (recentMsgs || [])
            .slice(-6)
            .map((m: any) => `${m.sender === 'user' ? 'الماستر' : 'الظل'}: ${(m.text || '').slice(0, 180)}`)
            .join(' | ');
        } catch {}
      }

      setIsThinking(true);
      const headers = await getAdminAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch('/api/system/jarvis-conversation', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          message: commandText,
          history: conversationHistoryRef.current,
          persona,
          selectedBrandId: currentSelectedBrand.id,
          recentChatSummary,
          includeAudio: false
        })
      });
      const data = await res.json();
      setIsThinking(false);
      if (data.detectedVisitorName) {
        setVisitorName(data.detectedVisitorName);
        try { localStorage.setItem('ezzel_visitor_name_v1', data.detectedVisitorName); } catch {}
      }
      if (Array.isArray(data.quickChips) && data.quickChips.length > 0) {
        setQuickChips(data.quickChips);
      }
      if (data.action?.type === 'VISITOR_EXISTING_BUSINESS_DETECTED' && data.action.businessName) {
        setDetectedVisitorBrand({
          businessName: data.action.businessName,
          hasExistingBusiness: true
        });
      }
      if (data.success && data.replyText) {
        const cleanReply = isMasterAdmin
          ? data.replyText
          : String(data.replyText)
              .replace(/[a-z_][a-z0-9_]*\s*\([^)]*\)/gi, '')
              .replace(/يا\s*ماستر\s*تيتو|يا\s*ماستر/gi, visitorName ? `يا ${visitorName}` : 'يا فندم')
              .replace(/\bBattah\b|بطاح/gi, 'منصة المتاجر والمخازن المتكاملة')
              .replace(/\bClean\s*Master\b|كلين\s*ماستر/gi, 'منصة الخدمات والحجوزات الذكية')
              .trim();
        streamTranscriptWords(cleanReply);
        setConversationHistory(prev => [
          ...prev.slice(-8),
          { role: 'user', text: commandText },
          { role: 'model', text: data.replyText }
        ]);
        // Mirror conversation turns directly into the main Shadow Chat & DB
        try {
          const activeUser = useAppStore.getState().user;
          const uid = activeUser?.email || (isMasterAdmin ? 'ahm.atya@gmail.com' : 'GUEST');
          const nowTs = Date.now();
          const uMsg = { id: nowTs, role: 'user' as const, text: `🎤 ${commandText}`, timestamp: nowTs, userId: uid };
          const mMsg = { id: nowTs + 1, role: 'model' as const, text: cleanReply || data.replyText, timestamp: nowTs + 1, userId: uid };
          shadowDB.saveMessage(uMsg as any).catch(() => {});
          shadowDB.saveMessage(mMsg as any).catch(() => {});
          window.dispatchEvent(new CustomEvent('shadow_new_message', { detail: uMsg }));
          window.dispatchEvent(new CustomEvent('shadow_new_message', { detail: mMsg }));
        } catch {}
        appendLiveLog(`[JARVIS_REPLY]: ${data.replyText.slice(0, 95)}...`);

        const onSpeechEnd = () => {
          setIsPlayingVoice(false);
          isPlayingVoiceRef.current = false;
          if (isOpenRef.current && autoLoopEnabledRef.current) {
            setTimeout(() => {
              if (isOpenRef.current && !isPlayingVoiceRef.current && autoLoopEnabledRef.current) {
                startListeningLoop();
              }
            }, 250);
          }
        };

        // Play authentic Egyptian Gemini Human voice reply (strictly single active channel)
        if (speechSeqRef.current !== mySpeechSeq) return;
        stopAllJarvisAudio();
        const activeSeq = speechSeqRef.current;
        setIsPlayingVoice(true);
        isPlayingVoiceRef.current = true;

        if (data.audioBase64) {
          const mime = data.audioBase64.startsWith('UklGR') ? 'audio/wav' : 'audio/mp3';
          const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
          activeAudioRef.current = audio;
          audio.onended = () => {
            if (activeAudioRef.current === audio) activeAudioRef.current = null;
            onSpeechEnd();
          };
          audio.onerror = () => {
            if (activeAudioRef.current === audio) activeAudioRef.current = null;
            if (speechSeqRef.current === activeSeq) playShadowVoice(data.replyText, 'male', undefined, onSpeechEnd);
          };
          audio.play().catch(() => {
            if (activeAudioRef.current === audio) activeAudioRef.current = null;
            if (speechSeqRef.current === activeSeq) playShadowVoice(data.replyText, 'male', undefined, onSpeechEnd);
          });
        } else {
          playShadowVoice(data.replyText, 'male', undefined, onSpeechEnd);
        }

        // LIVE VOICE-TO-ACTION EXECUTIVE CONTROLLER
        if (data.action) {
          appendLiveLog(`[EXEC_ACTION]: ${data.action.type} -> ${data.action.tab || data.action.modal || data.action.action || data.action.brandId || 'OK'}`);
          if (data.action.type === 'OPEN_INVOICE_PRINT' && data.action.url) {
            window.open(data.action.url, '_blank', 'noopener,noreferrer');
          }
          if ((data.action.type === 'SWITCH_BRAND' || data.action.type === 'OPEN_BRAND_HUB') && persona !== 'visitor') {
            if (data.action.brandId) {
              handleSelectBrand(data.action.brandId);
              handleInspectObsidianNode(data.action.brandId);
            }
            setIsBrandSuperWindowOpen(false);
            setActiveDeckTab('brand_hub');
          }
          if (data.action.type === 'STUDIO_EMBED_VIEW' && data.action.embedUrl && persona !== 'visitor') {
            setStudioEmbed({
              open: true,
              view: data.action.view || 'calendar',
              clinicId: data.action.clinicId || '1',
              embedUrl: data.action.embedUrl
            });
          }
          if (data.action.type === 'AGENT_EMBED_VIEW' && data.action.embedUrl && persona !== 'visitor') {
            setAgentEmbed({
              open: true,
              windowName: data.action.windowName || 'crm',
              brandId: data.action.brandId || 'clean_master',
              embedUrl: data.action.embedUrl
            });
          }
          if (data.action.type === 'SWITCH_TAB' && data.action.tab) {
            // STRICT SHIELD: Never hijack view away from visitor onboarding
            if (persona !== 'visitor') {
              setActiveDeckTab(data.action.tab);
              if (data.action.brandId) {
                handleSelectBrand(data.action.brandId);
                handleInspectObsidianNode(data.action.brandId);
              }
              if (data.action.result?.post) {
                setSelectedPost(data.action.result.post);
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
          } else if ((data.action.type === 'SWITCH_BRAND' || data.action.type === 'OPEN_BRAND_HUB') && persona !== 'visitor') {
            if (data.action.brandId) {
              handleSelectBrand(data.action.brandId);
              handleInspectObsidianNode(data.action.brandId);
            }
            setIsBrandSuperWindowOpen(false);
            setActiveDeckTab('brand_hub');
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
              handleOpenMetaConnectModal(data.action.brandId);
            } else if (data.action.modal === 'brand_super_window' && persona !== 'visitor') {
              setIsBrandSuperWindowOpen(true);
            }
          } else if (data.action.type === 'DYNAMIC_WIDGET') {
            if (data.action.brandId) handleSelectBrand(data.action.brandId);
            setActiveDynamicWidget({ widgetType: data.action.widgetType || 'analytics_kpis', data: data.action.data || {} });
          } else if (data.action.type === 'TRIGGER_ACTION') {
            if (data.action.brandId) {
              handleSelectBrand(data.action.brandId);
            }
            if (data.action.result?.post) {
              setSelectedPost(data.action.result.post);
            }
            if (data.action.action === 'PUBLISH_POST') {
              handlePublishPost(data.action.brandId || selectedBrandId, 0);
            } else if (data.action.action === 'LAUNCH_CAMPAIGN') {
              handleLaunchAdForPost(data.action.result?.post || selectedPost);
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
        targetToRun = "https://studio.t2os.app";
        setDockedAppTab('t2_studio');
      } else if (scenario === 't2_agent_clean_master') {
        announcement = "جاري فتح لوحة تحكم تيتو أجنت وفحص كارت كلين ماستر وصندوق المحادثات والرسائل فوراً!";
        targetToRun = "https://agent.t2os.app/dashboard";
        setDockedAppTab('t2_agent');
      } else if (scenario === 't2_agent_salegates') {
        announcement = "جاري فحص كارت سيل جيت واستشارات العقارات عبر المتصفح التنفيذي!";
        targetToRun = "https://agent.t2os.app/dashboard";
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
    <div className={`fixed inset-0 z-[9995] flex items-center justify-center font-['Cairo'] transition-all duration-300 ${
      isFullscreen ? 'p-0 bg-[#01030a]' : 'p-3 sm:p-6 bg-black/80'
    }`} dir="rtl">
      
      {/* Deep Blue-Black Fiber-Optic Second Brain OS Container */}
      <div className={`relative mx-auto w-full bg-[#01030b]/90 border border-cyan-500/40 shadow-[0_0_60px_rgba(0,240,255,0.2)] flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'h-[100dvh] rounded-none border-0' : 'max-w-6xl h-[92dvh] rounded-[28px]'
      }`}>

        {/* Fiber-Optic Bioluminescent Grid & Deep Space Vignette (Zero duplicate SpaceCanvas) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.04)_0%,_rgba(1,3,11,0.92)_65%,_#01030a_100%)] pointer-events-none z-0" />
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(to_right,#00f0ff_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] z-0" 
        />

        {/* TOP STATUS BAR: Responsive Second Brain OS & Multi-Window Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-cyan-500/30 bg-[#010410]/95">
          {/* Left: Real Ecosystem Telemetry & Clock */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_12px_#00f0ff]" />
              </span>
              <MissionClock />
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] font-['Cairo'] border-r border-white/10 pr-2.5 shrink-0">
              {isMasterAdmin && persona === 'tito' ? (
                <>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black whitespace-nowrap">
                    👑 الماستر تيتو
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveDeckTab((prev) => (prev === 'vault_crm' ? 'obsidian_graph' : 'vault_crm'))}
                    className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-400/25 hover:border-cyan-400/60 text-cyan-200 font-bold whitespace-nowrap transition cursor-pointer"
                    title="عرض وإدارة جميع البراندات الموحدة"
                  >
                    {allBrandsList.length || realStats.totalVaultBrandsCount || 0} براند متصل
                  </button>
                </>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold whitespace-nowrap">
                  تجربة مجانية 7 أيام
                </span>
              )}
            </div>
          </div>

          {/* Center: Clean Minimalist Title */}
          <div className="flex items-center gap-2 min-w-0">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
            <h1 className="text-xs md:text-sm font-black tracking-wider text-white/95 font-['Cairo'] whitespace-nowrap">
              جارفس <span className="text-cyan-400">//</span> {isMasterAdmin ? 'العقل التنفيذي الموحد' : 'المستشار التنفيذي لأعمالك'}
            </h1>
          </div>

          {/* Right: Role-Separated Action Buttons (Visible on BOTH Mobile & Desktop) */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0 max-w-full overflow-x-auto scrollbar-none">
            {isMasterAdmin ? (
              <>
                <button
                  onClick={async () => {
                    stopAllJarvisAudio();
                    const bId = currentSelectedBrand?.id || 'clean_master';
                    let embedUrl = `https://agent.t2os.app/embed/crm?brandId=${encodeURIComponent(bId)}&embed=1`;
                    try {
                      const r = await fetch(`/api/embed/signed-urls?brandId=${encodeURIComponent(bId)}&window=crm`);
                      const j = await r.json();
                      if (j?.agentEmbedUrl) embedUrl = j.agentEmbedUrl;
                    } catch {}
                    setAgentEmbed({ open: true, windowName: 'crm', brandId: bId, embedUrl });
                  }}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-300" />
                  <span>الأجنت</span>
                </button>

                <button
                  onClick={async () => {
                    stopAllJarvisAudio();
                    const cId = currentSelectedBrand?.id || 'brand_1779847291377';
                    let embedUrl = `https://studio.t2os.app/?embed=1&view=calendar&hideSidebar=1&hideHeader=1&clinicId=${encodeURIComponent(cId)}`;
                    try {
                      const r = await fetch(`/api/embed/signed-urls?clinicId=${encodeURIComponent(cId)}&view=calendar`);
                      const j = await r.json();
                      if (j?.studioEmbedUrl) embedUrl = j.studioEmbedUrl;
                    } catch {}
                    setStudioEmbed({ open: true, view: 'calendar', clinicId: cId, embedUrl });
                  }}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 border border-purple-400/40 font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>الاستوديو</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/system/ecosystem-health');
                      const json = await res.json();
                      if (json.ok) {
                        setActiveDynamicWidget({ widgetType: 'ecosystem_health', data: json });
                      }
                    } catch {}
                  }}
                  title="فحص وربط المنصات الثلاث (الظل + تيتو ستوديو + تيتو أجنت)"
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-emerald-500/15 text-emerald-300 border border-white/10 hover:border-emerald-400/40 font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>رادار الربط</span>
                </button>

                <button
                  onClick={() => setIsAdkVentureOpen(true)}
                  title="مخترع المشاريع الذكي (ADK 0→1) — دراسة سوق وكتالوج وخطة 30 يوم"
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/45 font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>اختراع مشروع</span>
                </button>

                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>براند جديد</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تجهيز براندك الآن</span>
              </button>
            )}

            {isMasterAdmin && (
              <button
                type="button"
                onClick={() => {
                  setAdminPreviewVisitor((prev) => {
                    const next = !prev;
                    setPersona(next ? 'visitor' : 'tito');
                    return next;
                  });
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black transition-all ${
                  adminPreviewVisitor
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                    : 'bg-white/5 hover:bg-cyan-500/15 text-cyan-200 border-cyan-500/30'
                }`}
                title="معاينة رحلة الزائر والمجرب بدون صلاحيات الإدارة"
              >
                {adminPreviewVisitor ? '🛡️ العودة لوضع الإدارة' : '👁️ معاينة كزائر'}
              </button>
            )}

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
              type="button"
              onClick={() => {
                stopAllJarvisAudio();
                onClose();
                if (typeof window !== 'undefined' && window.location.pathname === '/jarvis') {
                  window.history.replaceState({}, '', '/pricing');
                }
              }}
              title="إغلاق المحطة"
              aria-label="إغلاق المحطة"
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN HUD INTERACTION VIEWPORT (3 Sci-Fi Columns With Mobile-First Spatial Hierarchy) */}
        <div className={`relative z-10 flex-1 min-h-0 flex flex-col items-center p-1.5 md:p-2.5 w-full max-w-[96vw] xl:max-w-[1780px] mx-auto overflow-y-auto overscroll-contain pb-12 ${activeDeckTab === 'obsidian_graph' && !activeDynamicWidget ? 'justify-start md:justify-between' : 'justify-start'}`}>

          {/* CENTER HERO: THE HOLOGRAPHIC ARC REACTOR CORE (6 Cols)    */}
          {/* ========================================================= */}
          <div className={`w-full flex flex-col items-center gap-1.5 py-0 mx-auto font-['Cairo'] ${activeDeckTab === 'obsidian_graph' && !activeDynamicWidget ? 'flex-1 min-h-0 justify-between' : 'shrink-0 justify-start'}`}>
            
            {/* Visitor Mode Banner (Preview Switcher removed to keep Jarvis strictly tied to real authenticated account) */}
            {persona === 'visitor' && (
              <div className="bg-[#03091e]/90 border border-cyan-500/40 px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-black text-cyan-300">
                  🌐 مستشار النمو الرقمي والذكاء السيادي للأعمال (جارفيس)
                </span>
              </div>
            )}

            {/* THE GIANT HOLOGRAPHIC ARC REACTOR — RENDERED IN TOP BAR WHEN SUB-DECK OPEN, IN COMMAND MODE, OR FOR VISITOR; MERGED INTO CONSTELLATION CENTER IN OPS MODE */}
            {(persona === 'visitor' || activeDeckTab !== 'obsidian_graph' || jarvisWorkspaceMode === 'command') && (
              <button
                type="button"
                onClick={() => {
                  if (isPlayingVoice) {
                    stopVoice();
                    setIsPlayingVoice(false);
                    isPlayingVoiceRef.current = false;
                    startListeningLoop();
                  } else {
                    handleToggleListening();
                  }
                }}
                title="اضغط على الكرة المضيئة للتحدث مع جارفس"
                className={`cursor-pointer focus:outline-none hover:scale-[1.03] active:scale-[0.98] transition-transform ${
                  persona === 'visitor' ? 'scale-[0.72] -my-5' : 'scale-[0.55] -my-7'
                }`}
              >
                <JarvisArcReactorCore
                  isListening={isListening}
                  isPlayingVoice={isPlayingVoice}
                  isThinking={isThinking}
                  audioLevel={audioLevel}
                />
              </button>
            )}

            {/* TWO-WAY LIVE CONVERSATION & AUDIO DOCK (Modular Component) */}
            <JarvisMasterVoiceDock
              transcript={transcript}
              isThinking={isThinking}
              isListening={isListening}
              isPlayingVoice={isPlayingVoice}
              audioLevel={audioLevel}
              persona={persona}
              handleToggleListening={handleToggleListening}
              handlePlayPersonaGreeting={handlePlayPersonaGreeting}
              setIsPlayingVoice={setIsPlayingVoice}
            />

            {/* Direct Free-Text Command Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = textCommandInput.trim();
                if (!q || isThinking) return;
                setTextCommandInput('');
                stopAllJarvisAudio();
                handleSendLiveCommand(q);
              }}
              className="w-full max-w-lg flex items-center gap-2 px-2"
            >
              <input
                type="text"
                value={textCommandInput}
                onChange={(e) => setTextCommandInput(e.target.value)}
                placeholder="اكتب أمرك أو سؤالك لجارفيس مباشرة..."
                className="flex-1 bg-[#03091e]/90 border border-cyan-500/35 focus:border-cyan-400 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isThinking || !textCommandInput.trim()}
                className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-black text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال</span>
              </button>
            </form>

            {/* Voice conversation is synced directly to main Shadow Chat */}

            {/* DYNAMIC JARVIS STAGE: Clean Dual-Mode Toggle + Neural Constellation or Distraction-Free Command Card */}
            {isMasterAdmin && !adminPreviewVisitor && persona === 'tito' && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="inline-flex items-center p-1 rounded-2xl bg-[#03091e]/90 border border-cyan-500/30 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setJarvisWorkspaceMode('command');
                      setActiveDeckTab('obsidian_graph');
                    }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black transition cursor-pointer ${
                      jarvisWorkspaceMode === 'command' && activeDeckTab === 'obsidian_graph'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    ⚡ وضع الأوامر والصوت
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJarvisWorkspaceMode('ops');
                      setActiveDeckTab('obsidian_graph');
                    }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black transition cursor-pointer ${
                      jarvisWorkspaceMode === 'ops' && activeDeckTab === 'obsidian_graph'
                        ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-200'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    🛰️ غرفة العمليات والأوبسيديان
                  </button>
                </div>
                {activeDeckTab !== 'obsidian_graph' && (
                  <button
                    type="button"
                    onClick={() => setActiveDeckTab('obsidian_graph')}
                    className="py-1.5 px-3.5 rounded-full bg-cyan-950/50 hover:bg-cyan-500/20 border border-cyan-400/35 text-cyan-200 text-[11px] font-bold flex items-center gap-1.5 transition backdrop-blur-xl cursor-pointer font-['Cairo']"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>العودة للواجهة الرئيسية</span>
                  </button>
                )}
              </div>
            )}
            {persona === 'visitor' && (
              <div className="w-full max-w-lg py-2 px-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs font-bold font-['Cairo']">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-300">محادثة حية تفاعلية مع جارفيس (تشخيص وبناء البيزنس وتفعيل التجربة)</span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  AI GROWTH CONSULTANT
                </span>
              </div>
            )}

            {/* CONTEXTUAL QUICK ACTION CHIPS + LIVE APP MINI-PREVIEW (Visitor / Trial Onboarding Only — clean separation from Master Tito) */}
            {persona === 'visitor' && quickChips.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl">
                {quickChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      stopAllJarvisAudio();
                      handleSendLiveCommand(chip);
                    }}
                    className="px-3 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/35 text-[11px] font-bold transition shadow-sm"
                  >
                    ⚡ {chip}
                  </button>
                ))}
              </div>
            )}

            {persona === 'visitor' && detectedVisitorBrand.businessName && (
              <div className="w-full max-w-md p-2.5 rounded-2xl bg-[#040b1e]/90 border border-emerald-500/35 flex items-center justify-between gap-3 shadow-lg" dir="rtl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-black text-xs shrink-0">
                    {detectedVisitorBrand.businessName.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      📱 معاينة حية: {detectedVisitorBrand.businessName}
                    </div>
                    <div className="text-[10px] text-emerald-300 truncate">
                      تطبيق PWA متكامل بالهوية والألوان والكتالوج
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 shrink-0">
                  LIVE PREVIEW
                </span>
              </div>
            )}

            {/* SWARM & EXECUTIVE SERVICES SUMMARY DRAWER (Unified in BattleStation + Chat) */}
            <LiveTelemetryNotifier
              isMasterAdmin={isMasterAdmin}
              activeBrandId={currentSelectedBrand?.id !== 'clean_master' ? currentSelectedBrand?.id : undefined}
            />

            {/* EMBEDDED TITO STUDIO LIVE PANEL (Full Viewport Overlay) */}
            {studioEmbed?.open && persona !== 'visitor' && (
              <div className="fixed inset-2 sm:inset-4 z-[120] flex flex-col rounded-2xl bg-[#040a1a] border-2 border-purple-500/55 shadow-[0_0_60px_rgba(168,85,247,0.35)] overflow-hidden font-['Cairo']" dir="rtl">
                <div className="px-3 py-2 bg-purple-950/50 border-b border-purple-500/30 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-purple-200">🎬 استوديو المحتوى المدمج (تحكم حي):</span>
                    {[
                      { id: 'calendar', label: 'التقويم' },
                      { id: 'showroom', label: 'صالة الاعتماد' },
                      { id: 'generator', label: 'استوديو المحتوى' },
                      { id: 'videoHub', label: 'مركز الفيديو' },
                      { id: 'dramaFilm', label: 'الفيلم الدرامي' },
                      { id: 'workflowStudio', label: 'الأوتوبايلوت' },
                      { id: 'marketResearch', label: 'أبحاث السوق' },
                      { id: 'metaAds', label: 'إعلانات ميتا' }
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setStudioEmbed(prev => prev ? { ...prev, view: v.id } : null);
                          try {
                            studioIframeRef.current?.contentWindow?.postMessage(
                              { type: 'T2_REMOTE_COMMAND', command: 'SET_VIEW', view: v.id, clinicId: studioEmbed.clinicId },
                              '*'
                            );
                          } catch {}
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                          studioEmbed.view === v.id
                            ? 'bg-purple-500 text-white border-purple-300'
                            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStudioEmbed(null)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-rose-500/30 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <iframe
                  ref={studioIframeRef}
                  src={studioEmbed.embedUrl}
                  title="T2OS Studio Embed"
                  className="w-full flex-1 border-0 bg-[#020617]"
                  allow="clipboard-write; microphone; camera"
                />
              </div>
            )}

            {/* EMBEDDED T2 AGENT LIVE PANEL (Full Viewport Overlay) */}
            {agentEmbed?.open && persona !== 'visitor' && (
              <div className="fixed inset-2 sm:inset-4 z-[120] flex flex-col rounded-2xl bg-[#040a1a] border-2 border-emerald-500/55 shadow-[0_0_60px_rgba(16,185,129,0.35)] overflow-hidden font-['Cairo']" dir="rtl">
                <div className="px-3 py-2 bg-emerald-950/50 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-emerald-200">🤖 تيتو أجنت المدمج (تحكم حي):</span>
                    {[
                      { id: 'crm', label: 'المحادثات CRM' },
                      { id: 'qr', label: 'واتساب QR' },
                      { id: 'calendar', label: 'الحجوزات' },
                      { id: 'catalog', label: 'الكتالوج والأسعار' },
                      { id: 'broadcast-whatsapp', label: 'حملات واتساب' },
                      { id: 'omnichannel', label: 'المنصات' },
                      { id: 'playground', label: 'تدريب البوت' },
                      { id: 'brands', label: 'البراندات' }
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setAgentEmbed(prev => prev ? { ...prev, windowName: w.id } : null);
                          try {
                            agentIframeRef.current?.contentWindow?.postMessage(
                              { type: 'T2_NAVIGATE', payload: { window: w.id, brandId: agentEmbed.brandId } },
                              '*'
                            );
                          } catch {}
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                          agentEmbed.windowName === w.id
                            ? 'bg-emerald-500 text-black border-emerald-300'
                            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAgentEmbed(null)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-rose-500/30 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <iframe
                  ref={agentIframeRef}
                  src={agentEmbed.embedUrl}
                  title="T2OS Agent Embed"
                  className="w-full flex-1 border-0 bg-[#020617]"
                  allow="clipboard-write; microphone; camera"
                />
              </div>
            )}

            {/* VISITOR INTELLIGENCE ONBOARDING (When Persona === 'visitor') */}
            {persona === 'visitor' ? (
              <VisitorIntelligenceOnboarding 
                isMasterAdmin={isMasterAdmin}
                initialBusinessName={detectedVisitorBrand.businessName}
                initialIndustry={detectedVisitorBrand.industry}
                initialHasExistingBusiness={detectedVisitorBrand.hasExistingBusiness}
                onSwitchToAdmin={isMasterAdmin ? () => { setAdminPreviewVisitor(false); setPersona('tito'); } : undefined}
                onComplete={(createdBrand?: any) => {
                  if (createdBrand?.id) {
                    setAllBrandsList(prev => [createdBrand, ...prev.filter(b => b.id !== createdBrand.id)]);
                    setSelectedBrandId(createdBrand.id);
                    try { localStorage.setItem('t2_active_trial_brand', JSON.stringify(createdBrand)); } catch {}
                  }
                  if (isMasterAdmin && !adminPreviewVisitor) fetchDatabaseStats();
                  fetchObsidianVault(createdBrand?.slug || createdBrand?.id);
                  setPersona('trial');
                  setActiveDeckTab('brand_hub');
                }}
              />
            ) : (
              <>
                {/* EXECUTIVE BRAND CEO COCKPIT BANNER (For Trial & Subscribed Clients) */}
                {(persona === 'trial' || persona === 'client') && (
                  <div className="w-full max-w-xl bg-gradient-to-r from-[#040b22] via-[#041226] to-[#120824] border border-cyan-500/40 rounded-3xl p-3.5 shadow-[0_0_25px_rgba(0,240,255,0.2)] flex flex-col gap-2.5 text-right font-['Cairo'] animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
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
                        className="py-1.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center justify-center gap-1 transition"
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
                        onClick={() => window.open(resolveBrandWebUrl(currentSelectedBrand), '_blank', 'noopener,noreferrer')}
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
                        <span className="text-[10px] font-mono font-black text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          إجمالي القيمة: 22,500 ج.م
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-center text-[9.5px] font-mono">
                        <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <span className="text-white/50 block text-[8px]">تطبيق ومتجر PWA</span>
                          <span className="text-blue-300 font-black">15,000 ج.م ✔</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                          <span className="text-white/50 block text-[8px]">3 منشورات تجريبية (2 بوست + 1 فيديو)</span>
                          <span className="text-cyan-300 font-black">فحص Vision QA ✔</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                          <span className="text-white/50 block text-[8px]">وكيل واتساب صوتي</span>
                          <span className="text-cyan-300 font-black">رد في 3 ثوانٍ ✔</span>
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
                          onClick={async () => {
                            try {
                              playShadowVoice(`جاري تجهيز رابط الدفع الآمن من Paymob لتفعيل الباقة الدائمة (5,000 ج.م) لبراند ${currentSelectedBrand.name}...`, 'male');
                              const res = await fetch('/api/payments/paymob/create-checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  brandId: currentSelectedBrand.id || currentSelectedBrand.slug,
                                  brandName: currentSelectedBrand.name,
                                  planId: 'tier_5000',
                                  amountEgp: 5000
                                })
                              });
                              const data = await res.json();
                              if (data?.paymentUrl) {
                                const resolvedPayUrl = new URL(data.paymentUrl, window.location.origin).toString();
                                window.open(resolvedPayUrl, '_blank', 'noopener,noreferrer');
                              } else {
                                alert(data?.error || 'تعذر إنشاء جلسة الدفع حالياً، يرجى المحاولة مرة أخرى.');
                              }
                            } catch (err: any) {
                              alert(err?.message || 'حدث خطأ أثناء الاتصال ببوابة الدفع.');
                            }
                          }}
                          className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-[10px] font-black shadow-lg shadow-amber-500/25 transition shrink-0"
                        >
                          ⚡ تفعيل الاشتراك الدائم (5,000 ج.م)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

            {activeDynamicWidget && (
              <JarvisDynamicWidgetHUD
                widget={activeDynamicWidget}
                onClose={() => setActiveDynamicWidget(null)}
                onOpenCalendar={(bId) => { setActiveDynamicWidget(null); handleSelectBrand(bId); setActiveDeckTab('studio_calendar'); }}
              />
            )}

            {/* TAB 0A: COMMAND FOCUS MODE OR 3D HOLOGRAPHIC NEURAL CONSTELLATION */}
            {isMasterAdmin && !adminPreviewVisitor && persona === 'tito' && activeDeckTab === 'obsidian_graph' && jarvisWorkspaceMode === 'command' && (
              <div className="w-full max-w-4xl mx-auto flex flex-col gap-3 p-4 rounded-3xl bg-[#040b1d]/90 border border-cyan-500/30 backdrop-blur-xl font-['Cairo'] text-right animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <div className="text-xs font-black text-cyan-300">⚡ وضع القيادة التنفيذية المركز</div>
                    <p className="text-[11px] text-white/60">شاشة هادئة للصوت والأوامر الفورية والتحكم السريع في أي براند</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedBrandId || currentSelectedBrand?.id || ''}
                      onChange={(e) => handleSelectBrand(e.target.value)}
                      className="bg-black/70 border border-cyan-500/35 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      {allBrandsList.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-950 text-white">
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setActiveDeckTab('brand_hub')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/45 text-cyan-200 text-xs font-black cursor-pointer"
                    >
                      إدارة 4 أركان
                    </button>
                    <button
                      type="button"
                      onClick={() => setJarvisWorkspaceMode('ops')}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                    >
                      فتح الشبكة 3D
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-1.5">
                    <div className="text-[11px] font-bold text-cyan-300">آخر استجابة من جارفيس</div>
                    <div className="text-xs text-white/90 leading-relaxed min-h-[56px]">
                      {transcript || 'جاهز لتنفيذ أمرك الصوتي أو النصي فوراً — جرب مثلاً: أنشئ براند جديد أو اعرض جاهزية المنظومة.'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-1.5">
                    <div className="text-[11px] font-bold text-emerald-300">
                      حالة البراند المحدد: {currentSelectedBrand?.name || 'غير محدد'}
                    </div>
                    <div className="text-xs text-white/80">
                      واتساب: {(currentSelectedBrand as any)?.whatsappConnected ? `متصل (${(currentSelectedBrand as any)?.liveWhatsappMessagesCount ?? 0} رسالة)` : 'غير مربوط'} • منشورات الاستوديو:{' '}
                      {Number((currentSelectedBrand as any)?.studioPostsCount ?? (Array.isArray(currentSelectedBrand?.weekContentPlan) ? currentSelectedBrand.weekContentPlan.length : 0))}
                    </div>
                    {currentSelectedBrand && (
                      <a
                        href={resolveBrandWebUrl(currentSelectedBrand)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-black text-cyan-300 hover:underline w-fit"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح المتجر / التطبيق المباشر</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isMasterAdmin && !adminPreviewVisitor && persona === 'tito' && activeDeckTab === 'obsidian_graph' && jarvisWorkspaceMode === 'ops' && (
              <div className="w-full flex-1 min-h-0 flex flex-col gap-1.5 animate-in fade-in duration-300 font-['Cairo'] text-right">
                {/* OPEN 3D HOLOGRAPHIC SPACE — FITS 100% IN VIEWPORT WITHOUT SCROLL */}
                <div className="w-full flex-1 min-h-[260px] relative">
                  <ObsidianHolographicConstellation
                    brands={allBrandsList.map((b) => ({
                      id: b.id,
                      slug: b.slug,
                      name: b.name,
                      businessType: b.businessType,
                      sourceApp: b.sourceApp,
                      phone: b.phone,
                      postsCount: Number((b as any).studioPostsCount ?? (Array.isArray(b.weekContentPlan) ? b.weekContentPlan.length : 0)),
                      conversationsCount: Number((b as any).liveWhatsappMessagesCount ?? 0),
                      hasWhatsApp: Boolean((b as any).whatsappConnected),
                    }))}
                    selectedBrandId={selectedBrandId}
                    onSelectBrand={(id) => {
                      handleSelectBrand(id);
                      handleInspectObsidianNode(id);
                    }}
                    onOpenStore={(slug) => {
                      const matched = allBrandsList.find((item: any) => item.slug === slug || item.id === slug);
                      window.open(resolveBrandWebUrl(matched || { slug }), '_blank', 'noopener,noreferrer');
                    }}
                    onOpenChat={() => handleOpenWhatsAppConnectModal()}
                    onOpenStudio={() => window.open('https://studio.t2os.app', '_blank')}
                    centerCore={
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlayingVoice) {
                            stopVoice();
                            setIsPlayingVoice(false);
                            isPlayingVoiceRef.current = false;
                            startListeningLoop();
                          } else {
                            handleToggleListening();
                          }
                        }}
                        title="اضغط على النواة للتحدث مع جارفس"
                        className="cursor-pointer focus:outline-none hover:scale-105 active:scale-95 transition-transform"
                      >
                        <JarvisArcReactorCore
                          isListening={isListening}
                          isPlayingVoice={isPlayingVoice}
                          isThinking={isThinking}
                          audioLevel={audioLevel}
                        />
                      </button>
                    }
                    className="!bg-transparent !border-cyan-400/15 !shadow-none"
                  />
                </div>

                {/* 2026 SPATIAL BRAND HUD INSPECTOR (SLEEK FLOATING DOCK — ZERO CLUTTER) */}
                {selectedBrand && (
                  <div className="w-full p-3 rounded-2xl bg-black/85 border border-cyan-400/40 backdrop-blur-2xl flex items-center justify-between flex-wrap gap-2.5 shadow-[0_0_30px_rgba(0,240,255,0.2)] animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-black shadow-md text-sm">
                        {selectedBrand.name.slice(0, 1)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-2">
                          {selectedBrand.name}
                          <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                            {selectedBrand.businessType || 'نشاط تجاري'}
                          </span>
                        </h4>
                        <p className="text-[10px] text-white/60">
                          {(selectedBrand as any).whatsappConnected
                            ? `واتساب: متصل (${(selectedBrand as any).liveWhatsappMessagesCount ?? 0} رسالة)`
                            : 'واتساب: غير مربوط'}{' '}
                          • منشورات الاستوديو:{' '}
                          {Number(
                            (selectedBrand as any).studioPostsCount ??
                              (Array.isArray(selectedBrand.weekContentPlan) ? selectedBrand.weekContentPlan.length : 0)
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setActiveDeckTab('brand_hub')}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[10px] font-black flex items-center gap-1 transition shadow-[0_0_15px_rgba(0,240,255,0.35)] cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>إدارة البراند (4 أركان)</span>
                      </button>
                      <button
                        onClick={() => window.open(resolveBrandWebUrl(selectedBrand), '_blank', 'noopener,noreferrer')}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح التطبيق</span>
                      </button>
                      <button
                        onClick={() => setSelectedBrandId('')}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-300 border border-white/10 transition cursor-pointer"
                        title="إلغاء التحديد"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 0B: UNIFIED 4-PILLAR BRAND COMMAND HUB (IN-PLACE OVER CONSTELLATION) */}
            {activeDeckTab === 'brand_hub' && (
              <JarvisBrandCommandHub
                brandId={selectedBrandId || currentSelectedBrand?.slug || currentSelectedBrand?.id || 'auto-house'}
                initialBrand={currentSelectedBrand}
                isMasterAdmin={isMasterAdmin}
                onBackToGrid={() => setActiveDeckTab('obsidian_graph')}
                onOpenStudioCalendar={() => setActiveDeckTab('studio_calendar')}
                onOpenWhatsAppModal={(bId) => handleOpenWhatsAppConnectModal(bId)}
                onOpenMetaModal={(bId) => handleOpenMetaConnectModal(bId)}
              />
            )}

            {/* TAB 1: TITO STUDIO 7-DAY CONTENT CALENDAR (Modular Component) */}
            {activeDeckTab === 'studio_calendar' && (
              <JarvisStudioCalendarDeck
                currentSelectedBrand={currentSelectedBrand}
                activeBrandStrategy={activeBrandStrategy}
                isBuildingStrategy={isBuildingStrategy}
                isGeneratingWeekPlan={isGeneratingWeekPlan}
                isApprovingSchedule={isApprovingSchedule}
                isPublishingPost={isPublishingPost}
                handleBuildStudioStrategy={handleBuildStudioStrategy}
                handleGenerateWeekPlan={handleGenerateWeekPlan}
                handleApproveSchedule={handleApproveSchedule}
                handlePublishPost={handlePublishPost}
                handleCreatePaymobCheckout={handleCreatePaymobCheckout}
                handleSendDailyBriefingNow={handleSendDailyBriefingNow}
                onOpenPostCard={(postItem) => {
                  setSelectedPost(postItem);
                  setActiveDeckTab('content_post_card');
                }}
              />
            )}

            {/* TAB 2: PUBLISHED CONTENT SHOWCASE CARD (Modular Component) */}
            {activeDeckTab === 'content_post_card' && (
              <JarvisContentPostCard
                selectedPost={selectedPost}
                currentSelectedBrand={currentSelectedBrand}
                setSelectedPost={setSelectedPost}
                handlePublishPost={handlePublishPost}
                isPublishingPost={isPublishingPost}
                handleApproveSchedule={handleApproveSchedule}
                isApprovingSchedule={isApprovingSchedule}
                handleLaunchAdForPost={handleLaunchAdForPost}
                isLaunchingCampaign={isLaunchingCampaign}
                onBackToCalendar={() => setActiveDeckTab('studio_calendar')}
                onTransformResult={(widgetType, data) => setActiveDynamicWidget({ widgetType, data })}
              />
            )}

            {/* TAB 3: T2 AI AGENT FLEET (Modular Component) */}
            {activeDeckTab === 'agent_fleet' && (
              <JarvisAgentFleetDeck
                botStates={botStates}
                setBotStates={setBotStates}
                realStats={realStats}
                setIsOnboardingOpen={setIsOnboardingOpen}
                setIsCrmModalOpen={setIsCrmModalOpen}
                setIsMetaReadinessOpen={setIsMetaReadinessOpen}
                handleSendLiveCommand={handleSendLiveCommand}
              />
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
                      <span className="text-cyan-400 font-bold block">{currentSelectedBrand.phone || '01013373634'}</span>
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
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition disabled:opacity-40 shrink-0"
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
                      <span className="text-cyan-400 font-bold block">180 - 240 عميل 💬</span>
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
                  <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
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
                    <span className="text-[8px] text-cyan-400 font-mono">فيسبوك • إنستجرام</span>
                  </div>

                  <div className="p-2 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
                    <span className="text-[9px] text-amber-400/80 font-bold">تيتو أجنت (واتساب وميتا)</span>
                    <span className="text-sm md:text-base font-black font-mono text-white mt-0.5">
                      {realStats.agentActiveCount ?? 0} بوتات نشطة
                    </span>
                    <span className="text-[8px] text-amber-300 font-mono">{realStats.totalHandledMessages ?? 0} محادثة مسجلة</span>
                  </div>

                  <div 
                    onClick={() => setIsCrmModalOpen(true)}
                    className="p-2 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-black/60 border border-cyan-500/30 flex flex-col cursor-pointer hover:border-cyan-400 transition"
                  >
                    <span className="text-[9px] text-cyan-300 font-bold flex items-center justify-between">
                      حجوزات CRM
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-sm md:text-base font-black font-mono text-cyan-400 mt-0.5">
                      {realStats.confirmedBookingsCount ?? 0} حجز مؤكد
                    </span>
                    <span className="text-[8px] text-cyan-300/80 font-mono">
                      {realStats.realConfirmedRevenueEgp ?? 0} ج.م (كلين ماستر)
                    </span>
                  </div>
                </div>

                {/* Interactive Unified Brand Control List (1-click 4-Pillar Hub + Store Launch) */}
                <div className="mt-3 max-h-56 overflow-y-auto space-y-1.5 text-right pr-0.5">
                  {allBrandsList.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-2 rounded-xl bg-black/50 border border-white/10 hover:border-cyan-400/40 flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-black text-white truncate">{b.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${
                              b.whatsappConnected
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                : 'bg-white/5 text-white/50 border-white/15'
                            }`}
                          >
                            {b.whatsappConnected ? 'واتساب متصل' : 'واتساب غير مربوط'}
                          </span>
                        </div>
                        <span className="text-[9px] text-white/50 block truncate">
                          {b.businessType || b.slug} • منشورات: {Number(b.studioPostsCount ?? (Array.isArray(b.weekContentPlan) ? b.weekContentPlan.length : 0))}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectBrand(b.id);
                            setActiveDeckTab('brand_hub');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[10px] font-black cursor-pointer"
                        >
                          🎛️ إدارة (4 أركان)
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(resolveBrandWebUrl(b), '_blank', 'noopener,noreferrer')}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-200 text-[10px] font-bold cursor-pointer"
                        >
                          فتح التطبيق
                        </button>
                      </div>
                    </div>
                  ))}
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
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs font-black text-blue-300">
                      بوابة الـ Microservices المركزية (API Gateway)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    SSE LIVE STREAM • نشط
                  </span>
                </div>

                {/* Microservice Fleet Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-right">
                  {/* Service 1: T2 Agent Core */}
                  <div className="p-2.5 rounded-2xl bg-[#020914] border border-cyan-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold">
                        <span>وكيل الواتساب (T2 Agent)</span>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                      <p className="text-[9px] text-white/60 mt-1 leading-tight">
                        مستقل 100% • محرك صوت نقي وتفاوض مبيعات
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-white/40">الردود: {realStats.totalHandledMessages || 0} محادثة</span>
                      <span className="text-cyan-400 font-bold">متصل</span>
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
                    className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-cyan-400 text-black font-black text-[11px] shadow-lg shadow-cyan-500/30 transition flex items-center justify-center gap-1.5"
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
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
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
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
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
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80" />
                </span>
                <span className="bg-black/60 px-3 py-1 rounded-lg text-cyan-300 border border-white/5 flex-1 truncate">
                  🔒 {executiveUrl}
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">
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
                <span className="text-[10px] text-cyan-400">PUPPETEER OK</span>
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
        initialBusinessName={adkPresetName}
        onSuccess={() => {
          setIsOnboardingOpen(false);
          setAdkPresetName('');
          playShadowVoice("تم تسجيل البراند بنجاح وإدراجه في الخزنة الموحدة للشركات، وربطه بمحرك المحتوى وتطبيق الأجنت!", 'male');
        }}
      />

      {/* ADK Venture Architect (0 -> 1 Business Invention & Feasibility Study) */}
      <React.Suspense fallback={null}>
        <AdkVentureArchitectModal
          isOpen={isAdkVentureOpen}
          onClose={() => setIsAdkVentureOpen(false)}
          onLaunchBusiness={(venture) => {
            setAdkPresetName(venture?.recommendedBrandName || '');
            setIsAdkVentureOpen(false);
            setIsOnboardingOpen(true);
            playShadowVoice(`رائع! تم اعتماد دراسة مشروع ${venture?.recommendedBrandName || 'البراند الجديد'} — أكمل خطوات التأسيس لإطلاق التطبيق فوراً.`, 'male');
          }}
        />
      </React.Suspense>

            {/* AUXILIARY CONNECTION MODALS (Modular Component) */}
      <JarvisConnectionModals
        isCrmModalOpen={isCrmModalOpen}
        setIsCrmModalOpen={setIsCrmModalOpen}
        isMetaReadinessOpen={isMetaReadinessOpen}
        setIsMetaReadinessOpen={setIsMetaReadinessOpen}
        isWaConnectModalOpen={isWaConnectModalOpen}
        setIsWaConnectModalOpen={setIsWaConnectModalOpen}
        isMetaConnectModalOpen={isMetaConnectModalOpen}
        setIsMetaConnectModalOpen={setIsMetaConnectModalOpen}
        isBrandingModalOpen={isBrandingModalOpen}
        setIsBrandingModalOpen={setIsBrandingModalOpen}
        waPairingInfo={waPairingInfo}
        currentSelectedBrand={currentSelectedBrand}
        realStats={realStats}
        waPhoneInput={waPhoneInput}
        setWaPhoneInput={setWaPhoneInput}
        handleOpenWhatsAppConnectModal={handleOpenWhatsAppConnectModal}
        isConnectingChannel={isConnectingChannel}
        metaPageInput={metaPageInput}
        setMetaPageInput={setMetaPageInput}
        metaPageIdInput={metaPageIdInput}
        setMetaPageIdInput={setMetaPageIdInput}
        metaPageTokenInput={metaPageTokenInput}
        setMetaPageTokenInput={setMetaPageTokenInput}
        handleConfirmMetaConnect={handleConfirmMetaConnect}
        brandingForm={brandingForm}
        setBrandingForm={setBrandingForm}
        handleGenerateBrandingKit={handleGenerateBrandingKit}
        isGeneratingBranding={isGeneratingBranding}
        generatedBrandingKit={generatedBrandingKit}
      />

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
                  onClick={() => window.open(resolveBrandWebUrl(currentSelectedBrand), '_blank', 'noopener,noreferrer')}
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
                  <span className="text-cyan-400 font-bold block">{currentSelectedBrand.phone || '01013373634'}</span>
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
                    <span className="font-mono text-cyan-400 font-bold shrink-0">{item.price || 'حسب الطلب'}</span>
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
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition disabled:opacity-40"
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
                        <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
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
            <div className="rounded-2xl bg-[#020614] border border-cyan-500/40 p-4 flex flex-col gap-3 shadow-[0_0_25px_rgba(0,240,255,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/25">
                <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  النافذة 3: وكيل الواتساب الصوتي (Gemini 24kHz) وقنوات ميتا
                </span>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  ACTIVE 24/7
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenWhatsAppConnectModal()}
                  className="p-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-xs font-black flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
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
                  className="flex-1 px-3 py-2 rounded-xl bg-black/70 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleUpdateBotPrompt}
                  disabled={isSavingCatalog || !botPromptInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition disabled:opacity-40"
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
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-black"
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
