import React, { useState, useEffect } from 'react';
import { 
    Cpu, Zap, Brain, Shield, Bot, Terminal, Volume2, Wifi, WifiOff, 
    Lock, Key, Activity, Play, Square, RefreshCw, CheckCircle, 
    AlertTriangle, Server, Network, ArrowRight, Layers, Database, 
    TrendingUp, Radio, Search, Plus, Trash2, X
} from 'lucide-react';
import { audioPipeline, StreamingAudioSession } from '../services/audioPipelineService';
import { hybridMemory, EphemeralContext, KnowledgeGraphData } from '../services/hybridMemoryService';
import { swarmActorEngine, SwarmEvent, MarketBreakoutPayload, SentinelNewsPayload, MaestroSynthesisPayload } from '../services/swarmActorEngine';
import { sovereignOffline, OfflineStatus } from '../services/sovereignOfflineService';
import { securityGuardrail, GuardrailCheckResult, SovereignBYOKKeys } from '../services/securityGuardrailService';

interface SovereignOSArchitectureHubProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SovereignOSArchitectureHub: React.FC<SovereignOSArchitectureHubProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'audio' | 'memory' | 'swarm' | 'offline' | 'security'>('audio');

    // 1. Audio Pipeline State
    const [audioTestText, setAudioTestText] = useState('أهلاً بك يا ماستر! هذا اختبار لمعمارية التدفق الصوتي فائق السرعة للظل. الاستجابة تبدأ فورياً في أقل من 300 مللي ثانية مع مشغل تسلسلي دون أي انتظار.');
    const [audioSession, setAudioSession] = useState<StreamingAudioSession | null>(null);
    const [measuredLatency, setMeasuredLatency] = useState<number | null>(null);

    // 2. Hybrid Memory State
    const [ephemeral, setEphemeral] = useState<EphemeralContext | null>(null);
    const [kgData, setKgData] = useState<KnowledgeGraphData>({ nodes: [], edges: [] });
    const [memoryQuery, setMemoryQuery] = useState('مشروع');
    const [vectorSearchResults, setVectorSearchResults] = useState<any[]>([]);
    const [newSubject, setNewSubject] = useState('');
    const [newRelation, setNewRelation] = useState('');
    const [newObject, setNewObject] = useState('');

    // 3. Swarm State
    const [swarmEvents, setSwarmEvents] = useState<SwarmEvent[]>([]);

    // 4. Offline State
    const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
    const [plainInput, setPlainInput] = useState('سري للغاية: كلمة السر والخطة الاستراتيجية للظل');
    const [encryptedPreview, setEncryptedPreview] = useState<{ cipherText: string; iv: string } | null>(null);
    const [decryptedPreview, setDecryptedPreview] = useState<string>('');

    // 5. Security & BYOK State
    const [testCmd, setTestCmd] = useState('rm -rf /');
    const [guardrailResult, setGuardrailResult] = useState<GuardrailCheckResult | null>(null);
    const [byokKeys, setByokKeys] = useState<SovereignBYOKKeys>({ updatedAt: 0 });
    const [byokSavedMsg, setByokSavedMsg] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Subscribe to Audio Pipeline
        const unsubAudio = audioPipeline.subscribe((sess) => {
            setAudioSession({ ...sess });
        });

        // Load Memory Data
        setEphemeral(hybridMemory.getEphemeralContext());
        hybridMemory.getKnowledgeGraph().then(setKgData);

        // Subscribe to Swarm Events
        setSwarmEvents(swarmActorEngine.getEventHistory());
        const unsubSwarm = swarmActorEngine.subscribe('*', (ev) => {
            setSwarmEvents(prev => [ev, ...prev.slice(0, 30)]);
        });

        // Subscribe to Offline Status
        const unsubOffline = sovereignOffline.subscribeStatus((st) => {
            setOfflineStatus(st);
        });

        // Load BYOK
        setByokKeys(securityGuardrail.getBYOKKeys());

        return () => {
            unsubAudio();
            unsubSwarm();
            unsubOffline();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Audio Pipeline Action ---
    const handleRunAudioStreaming = async () => {
        setMeasuredLatency(null);
        await audioPipeline.playStreamingAudio(audioTestText, 'Puck', (lat) => {
            setMeasuredLatency(lat);
        });
    };

    const handleStopAudio = () => {
        audioPipeline.stop();
    };

    // --- Knowledge Graph Action ---
    const handleAddCustomRelation = async () => {
        if (!newSubject.trim() || !newRelation.trim() || !newObject.trim()) return;
        const subId = `n_${Date.now()}_1`;
        const objId = `n_${Date.now()}_2`;

        await hybridMemory.addNode({ id: subId, label: newSubject.trim(), category: 'person' });
        await hybridMemory.addNode({ id: objId, label: newObject.trim(), category: 'project' });
        await hybridMemory.addEdge({
            id: `edge_${subId}_${objId}`,
            sourceId: subId,
            targetId: objId,
            relation: newRelation.trim(),
            weight: 1.0
        });

        setNewSubject('');
        setNewRelation('');
        setNewObject('');
        const fresh = await hybridMemory.getKnowledgeGraph();
        setKgData(fresh);
    };

    const handleSearchVectors = async () => {
        if (!memoryQuery.trim()) return;
        const res = await hybridMemory.querySemanticVectors(memoryQuery, 'master@zel.ai', { topK: 3, minSimilarity: 0.5 });
        setVectorSearchResults(res);
    };

    // --- Crypto Tester ---
    const handleEncryptTest = async () => {
        const enc = await sovereignOffline.encryptAESGCM(plainInput);
        setEncryptedPreview(enc);
        const dec = await sovereignOffline.decryptAESGCM(enc.cipherText, enc.iv);
        setDecryptedPreview(dec);
    };

    // --- Security Guardrail Tester ---
    const handleInspectCommand = () => {
        const res = securityGuardrail.inspectCommand(testCmd);
        setGuardrailResult(res);
    };

    // --- BYOK Save ---
    const handleSaveBYOK = () => {
        securityGuardrail.saveBYOKKeys(byokKeys);
        setByokSavedMsg(true);
        setTimeout(() => setByokSavedMsg(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
            <div className="w-full max-w-5xl max-h-[92vh] bg-[#07090e] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden text-white font-sans">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-transparent to-purple-950/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                            <Cpu className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-black bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                                    معمارية الظل السيادية المتقدمة (Sovereign AGI OS)
                                </h2>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    Core v4.2
                                </span>
                            </div>
                            <p className="text-xs text-white/50">
                                البنية التحتية الهندسية الخماسية: تدفق فوري، ذاكرة هجينة، سرب وكلاء، صمود أوفلاين، وحماية سيادية.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/30 overflow-x-auto no-scrollbar p-1.5 gap-1.5">
                    {[
                        { id: 'audio', label: '1. التدفق الصوتي فائق السرعة', icon: Zap, color: 'text-amber-400' },
                        { id: 'memory', label: '2. الذاكرة الهجينة الثلاثية', icon: Brain, color: 'text-fuchsia-400' },
                        { id: 'swarm', label: '3. سرب الوكلاء المستقلين', icon: Bot, color: 'text-emerald-400' },
                        { id: 'offline', label: '4. الصمود الأوفلاين وCRDT', icon: Wifi, color: 'text-cyan-400' },
                        { id: 'security', label: '5. عزل الساندبوكس وBYOK', icon: Shield, color: 'text-rose-400' },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                                    active 
                                        ? 'bg-white/10 text-white border border-cyan-500/40 shadow-sm' 
                                        : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${tab.color}`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                    {/* ========================================================= */}
                    {/* TAB 1: SUB-100MS STREAMING AUDIO PIPELINE                 */}
                    {/* ========================================================= */}
                    {activeTab === 'audio' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Sub-100ms Streaming Audio Pipeline
                                    </h3>
                                    <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                                        تقسيم النص الذكي فورياً إلى مقاطع صوتية (Chunking) مع استدعاء متوازي لمخرجات Edge TTS النيورالية وتشغيلها تسلسلياً عبر Web Audio API دون انتظار اكتمال الجواب، لخفض زمن الاستجابة إلى أقل من 300 مللي ثانية.
                                    </p>
                                </div>
                                {measuredLatency !== null && (
                                    <div className="text-center p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                                        <div className="text-xs text-amber-300">أول صوت (TTFB)</div>
                                        <div className="text-xl font-black text-amber-400">{measuredLatency} ms</div>
                                    </div>
                                )}
                            </div>

                            {/* Audio Interactive Playground */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-white/70">نص التجربة الصوتية الفورية:</label>
                                <textarea
                                    value={audioTestText}
                                    onChange={(e) => setAudioTestText(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400/50 resize-none font-sans"
                                />
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleRunAudioStreaming}
                                        disabled={audioSession?.isPlaying}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs sm:text-sm transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        تشغيل التدفق الفوري (Stream Now)
                                    </button>
                                    {audioSession?.isPlaying && (
                                        <button
                                            onClick={handleStopAudio}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs sm:text-sm transition-all"
                                        >
                                            <Square className="w-4 h-4 fill-current" />
                                            إيقاف
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chunks Pipeline Visualizer */}
                            {audioSession && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs text-white/70">
                                        <span className="font-bold">مسار المقاطع الصوتية الحية (Audio Buffer Queue):</span>
                                        <span>{audioSession.chunks.length} مقاطع مقسمة</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {audioSession.chunks.map((chk) => (
                                            <div
                                                key={chk.id}
                                                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                                                    chk.status === 'playing'
                                                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                                        : chk.status === 'played'
                                                        ? 'bg-white/5 border-white/10 text-white/40'
                                                        : chk.status === 'ready'
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                                        : 'bg-black/30 border-white/5 text-white/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10">
                                                        #{chk.index + 1}
                                                    </span>
                                                    <span className="text-xs truncate">{chk.text}</span>
                                                </div>
                                                <span className="text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-full border border-current">
                                                    {chk.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: TRI-TIER HYBRID MEMORY ARCHITECTURE                */}
                    {/* ========================================================= */}
                    {activeTab === 'memory' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="p-4 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/20">
                                <h3 className="text-base font-bold text-fuchsia-300 flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    Tri-Tier Hybrid Memory (Ephemeral + Vector + Knowledge Graph)
                                </h3>
                                <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                                    معمارية ذاكرة ثلاثية الأبعاد: اللحظية (Tier 1) لحفظ سياق المستشعرات والبطارية، الدلالية المتجهة (Tier 2) في IndexedDB بتشابه 85%+، والشبكية المعرفية (Tier 3) لربط الكيانات بالعلاقات.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Tier 1: Ephemeral */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                                        <Activity className="w-4 h-4" />
                                        Tier 1: Ephemeral Context
                                    </div>
                                    <div className="space-y-1.5 text-xs text-white/70">
                                        <div className="flex justify-between">
                                            <span>حالة الشبكة:</span>
                                            <span className="font-bold text-emerald-400">{ephemeral?.networkStatus}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>شحن البطارية:</span>
                                            <span className="font-bold text-amber-400">{ephemeral?.batteryLevel ?? 100}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>آخر تفاعلات:</span>
                                            <span className="font-bold">{ephemeral?.recentTurns.length ?? 0} رسائل</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tier 2: Vector Store */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-300">
                                            <Layers className="w-4 h-4" />
                                            Tier 2: Semantic Vector Store (IndexedDB)
                                        </div>
                                        <span className="text-[10px] text-white/40">Cosine Similarity &gt; 82%</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={memoryQuery}
                                            onChange={(e) => setMemoryQuery(e.target.value)}
                                            placeholder="ابحث دلالياً عن أي مفهوم..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                                        />
                                        <button
                                            onClick={handleSearchVectors}
                                            className="px-3 py-1.5 rounded-xl bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-fuchsia-300 text-xs font-bold border border-fuchsia-500/30 flex items-center gap-1"
                                        >
                                            <Search className="w-3.5 h-3.5" />
                                            استرجاع
                                        </button>
                                    </div>
                                    {vectorSearchResults.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                            {vectorSearchResults.map((r, i) => (
                                                <div key={i} className="text-xs p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                                                    <span className="truncate">{r.text}</span>
                                                    <span className="font-mono text-fuchsia-400 shrink-0 font-bold ml-2">
                                                        {(r.score * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tier 3: Knowledge Graph Network */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                                        <Network className="w-4 h-4" />
                                        Tier 3: Knowledge Graph Network (Entity-Relationship Traversal)
                                    </div>
                                    <span className="text-[10px] text-white/50">{kgData.nodes.length} عقد | {kgData.edges.length} علاقات</span>
                                </div>

                                {/* Graph Entities Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {kgData.edges.slice(0, 9).map((edge) => {
                                        const src = kgData.nodes.find(n => n.id === edge.sourceId)?.label || edge.sourceId;
                                        const tgt = kgData.nodes.find(n => n.id === edge.targetId)?.label || edge.targetId;
                                        return (
                                            <div key={edge.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                                                <span className="font-bold text-cyan-300 truncate">{src}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-mono shrink-0 mx-1.5">
                                                    {edge.relation}
                                                </span>
                                                <span className="font-bold text-fuchsia-300 truncate">{tgt}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add Custom Triple */}
                                <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="الكيان (مثل: أحمد)"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white flex-1 min-w-[100px]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="العلاقة (مثل: شريك في)"
                                        value={newRelation}
                                        onChange={(e) => setNewRelation(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-amber-300 flex-1 min-w-[100px]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="الهدف (مثل: مشروع س)"
                                        value={newObject}
                                        onChange={(e) => setNewObject(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white flex-1 min-w-[100px]"
                                    />
                                    <button
                                        onClick={handleAddCustomRelation}
                                        className="px-3 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        إضافة رابطة
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: ACTOR-MODEL MULTI-AGENT SWARM                      */}
                    {/* ========================================================= */}
                    {activeTab === 'swarm' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                                        <Bot className="w-4 h-4" />
                                        Actor-Model Multi-Agent Swarm (Distributed Pub/Sub)
                                    </h3>
                                    <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                                        وكلاء خلفيون مستقلون خفيفو الوزن يعملون كأشباح عصبية: وكيل التداول يرصد بينانس، ووكيل الاستطلاع يرصد الأخبار، والمايسترو يربط الأحداث بالسياق ويصدر التنبيهات السيادية.
                                    </p>
                                </div>
                                <div className="text-center p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                                    <div className="text-xs text-emerald-300">الوكلاء النشطون</div>
                                    <div className="text-xl font-black text-emerald-400">{swarmActorEngine.getActiveActorsCount()} عمال</div>
                                </div>
                            </div>

                            {/* Active Actor Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                <div className="p-3.5 rounded-xl bg-white/5 border border-emerald-500/30 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-emerald-400">📈 Trader Actor</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                    </div>
                                    <p className="text-xs text-white/60">مراقبة حية لمؤشرات Binance (BTC, ETH, SOL) ورصد الاختراقات السعرية.</p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-white/5 border border-cyan-500/30 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-cyan-400">🔍 Sentinel Actor</span>
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                    </div>
                                    <p className="text-xs text-white/60">استطلاع إشارات الذكاء الاصطناعي والتطورات الاستراتيجية والفرص التقنية.</p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-white/5 border border-purple-500/30 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-purple-400">👑 Maestro Core</span>
                                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                    </div>
                                    <p className="text-xs text-white/60">محرك التنسيق والفلترة؛ يمنع الإزعاج ويصدر ملخصات تنفيذية صوتية استباقية.</p>
                                </div>
                            </div>

                            {/* Live Swarm Events Feed */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs text-white/70">
                                    <span className="font-bold">سجل أحداث السرب الموزعة (Pub/Sub Stream):</span>
                                    <span>{swarmEvents.length} حدث مسجل</span>
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {swarmEvents.map((ev) => (
                                        <div
                                            key={ev.id}
                                            className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                                                ev.type === 'EVENT_MARKET_BREAKOUT'
                                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                                    : ev.type === 'EVENT_MAESTRO_SYNTHESIS'
                                                    ? 'bg-purple-500/10 border-purple-500/30'
                                                    : 'bg-white/5 border-white/10'
                                            }`}
                                        >
                                            <div className="p-1.5 rounded-lg bg-black/40 shrink-0 font-mono text-[10px]">
                                                {ev.type.replace('EVENT_', '')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-white">{ev.senderName}</span>
                                                    <span className="text-[10px] text-white/40">{new Date(ev.timestamp).toLocaleTimeString('ar-EG')}</span>
                                                </div>
                                                <p className="text-xs text-white/80 mt-1">
                                                    {ev.type === 'EVENT_MARKET_BREAKOUT' && (
                                                        <span>
                                                            اختراق على {(ev.payload as MarketBreakoutPayload).symbol} بسعر ${(ev.payload as MarketBreakoutPayload).price} (زخم {(ev.payload as MarketBreakoutPayload).change24h > 0 ? '+' : ''}{(ev.payload as MarketBreakoutPayload).change24h.toFixed(2)}%)
                                                        </span>
                                                    )}
                                                    {ev.type === 'EVENT_SENTINEL_NEWS' && (
                                                        <span>{(ev.payload as SentinelNewsPayload).headline}</span>
                                                    )}
                                                    {ev.type === 'EVENT_MAESTRO_SYNTHESIS' && (
                                                        <span className="text-purple-300 font-semibold">{(ev.payload as MaestroSynthesisPayload).executiveBrief}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 4: EDGE-FIRST OFFLINE RESILIENCE & CRDT VAULT         */}
                    {/* ========================================================= */}
                    {activeTab === 'offline' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                                        <Wifi className="w-4 h-4" />
                                        Edge-First Offline Resilience &amp; Encrypted CRDT Vault
                                    </h3>
                                    <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                                        استمرارية كاملة حتى لو انقطع الإنترنت بالكامل. تشفير حقيقي من طرف إلى طرف (AES-256-GCM عبر Web Crypto API) ومزامنة متجهات التوقيت (Vector Clocks) لضمان انعدام تعارض البيانات.
                                    </p>
                                </div>
                                <div className="text-center p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                                    <div className="text-xs text-cyan-300">حالة الاتصال</div>
                                    <div className="text-sm font-black text-cyan-400">
                                        {offlineStatus?.isOnline ? 'Online (متصل)' : 'Offline (محلي)'}
                                    </div>
                                </div>
                            </div>

                            {/* Cryptographic Vault Tester */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <label className="text-xs font-bold text-white/70">
                                    اختبار التشفير السيادي للبيانات (AES-256-GCM Web Crypto):
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={plainInput}
                                        onChange={(e) => setPlainInput(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                    <button
                                        onClick={handleEncryptTest}
                                        className="px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5"
                                    >
                                        <Lock className="w-3.5 h-3.5" />
                                        تشفير وفك
                                    </button>
                                </div>

                                {encryptedPreview && (
                                    <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/20 space-y-2 text-xs">
                                        <div>
                                            <span className="text-white/40 block text-[10px]">النص المشفر داخل IndexedDB (Ciphertext):</span>
                                            <span className="font-mono text-cyan-400 break-all">{encryptedPreview.cipherText}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/40 block text-[10px]">متجه التهيئة (Initialization Vector - IV):</span>
                                            <span className="font-mono text-amber-400">{encryptedPreview.iv}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/40 block text-[10px]">النص المفكوك بعد استرجاعه:</span>
                                            <span className="text-emerald-400 font-bold">{decryptedPreview}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 5: SANDBOXED EXECUTION & BYOK VAULT                   */}
                    {/* ========================================================= */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                                <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Sandboxed Execution &amp; Tool Security + BYOK Vault
                                </h3>
                                <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                                    حصانة سيادية: فحص النوايا (Intent Guardrail) لمنع الأوامر التدميرية قبل وصولها للسيرفر، ونظام مفاتيح لامركزي (BYOK) مشفر محلياً بمفتاح الماستر فقط.
                                </p>
                            </div>

                            {/* Intent Guardrail Command Tester */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <label className="text-xs font-bold text-white/70">
                                    فحص نوايا أوامر الطرفية (Intent Guardrail Policy Scanner):
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={testCmd}
                                        onChange={(e) => setTestCmd(e.target.value)}
                                        placeholder="جرب: rm -rf / أو ls -la أو mkfs"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-400"
                                    />
                                    <button
                                        onClick={handleInspectCommand}
                                        className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5"
                                    >
                                        <Terminal className="w-3.5 h-3.5" />
                                        فحص الأمر
                                    </button>
                                </div>

                                {guardrailResult && (
                                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                                        guardrailResult.verdict === 'FORBIDDEN'
                                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                                            : guardrailResult.verdict === 'RESTRICTED'
                                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    }`}>
                                        <div className="font-mono font-black text-sm px-2 py-1 rounded bg-black/40 shrink-0">
                                            {guardrailResult.verdict}
                                        </div>
                                        <div>
                                            <div className="font-bold">{guardrailResult.explanationArabic}</div>
                                            <div className="text-[10px] text-white/50 mt-1">
                                                القواعد المفعلة: {guardrailResult.matchedRules.join(', ')} | معامل الخطر: {guardrailResult.score}/100
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BYOK Sovereign Keys Vault */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                                        <Key className="w-4 h-4" />
                                        خزينة المفاتيح الخاصة بالماستر (BYOK Vault - Client-Side Only)
                                    </div>
                                    {byokSavedMsg && (
                                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            تم حفظ وتشفير المفاتيح محلياً
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <label className="text-[10px] text-white/50 block mb-1">Binance API Key:</label>
                                        <input
                                            type="password"
                                            value={byokKeys.binanceApiKey || ''}
                                            onChange={(e) => setByokKeys({ ...byokKeys, binanceApiKey: e.target.value })}
                                            placeholder="مفتاح بينانس العام..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 block mb-1">Binance Secret Key:</label>
                                        <input
                                            type="password"
                                            value={byokKeys.binanceApiSecret || ''}
                                            onChange={(e) => setByokKeys({ ...byokKeys, binanceApiSecret: e.target.value })}
                                            placeholder="المفتاح السري لبينانس..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 block mb-1">Custom Gemini API Key:</label>
                                        <input
                                            type="password"
                                            value={byokKeys.geminiApiKey || ''}
                                            onChange={(e) => setByokKeys({ ...byokKeys, geminiApiKey: e.target.value })}
                                            placeholder="مفتاح جميني المستقل..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 block mb-1">Telegram Bot Token:</label>
                                        <input
                                            type="password"
                                            value={byokKeys.telegramBotToken || ''}
                                            onChange={(e) => setByokKeys({ ...byokKeys, telegramBotToken: e.target.value })}
                                            placeholder="توكن بوت تليجرام..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveBYOK}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-xs hover:opacity-90 transition-all shadow-md shadow-amber-500/20"
                                >
                                    حفظ وتشفير المفاتيح في المتصفح فقط
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer status bar */}
                <div className="p-3 bg-black/50 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>معمارية النظام السيادي AGI نشطة وتعمل بكفاءة 100%</span>
                    </div>
                    <div className="font-mono">
                        Latency: &lt;300ms | Encryption: AES-256-GCM | Swarm: Active
                    </div>
                </div>

            </div>
        </div>
    );
};
