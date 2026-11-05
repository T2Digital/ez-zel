/**
 * Tri-Tier Hybrid Memory Architecture for "الظل"
 * Tier 1: Ephemeral Session Cache (High-speed working context, sensory & system telemetry)
 * Tier 2: Semantic Vector Store (IndexedDB-backed Cosine Similarity, embeddings, threshold > 82%)
 * Tier 3: Knowledge Graph DB (Entity-Relationship Network: Nodes & Edges, Multi-hop traversal)
 */

import { generateEmbedding } from './ragService';

export interface EphemeralContext {
    activeGoal?: string;
    batteryLevel?: number;
    isCharging?: boolean;
    networkStatus: 'online' | 'offline' | 'cellular';
    userLocation?: string;
    recentTurns: Array<{ role: 'user' | 'model'; text: string; timestamp: number }>;
    workingScratchpad: Record<string, any>;
    lastActivity: number;
}

export interface VectorChunk {
    id: string;
    userId: string;
    text: string;
    category: 'fact' | 'workspace_doc' | 'financial' | 'preference' | 'conversation';
    embedding: number[];
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface GraphNode {
    id: string;
    label: string;
    category: 'person' | 'project' | 'organization' | 'budget' | 'concept' | 'metric' | 'goal' | 'secret';
    properties?: Record<string, any>;
    createdAt: number;
}

export interface GraphEdge {
    id: string;
    sourceId: string;
    targetId: string;
    relation: string; // e.g., 'شريك في', 'ميزانيته', 'يمتلك', 'يشرف على', 'يفضل', 'هدفه'
    weight: number;
    updatedAt: number;
}

export interface KnowledgeGraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

const DB_NAME = 'shadow_hybrid_memory_db';
const DB_VERSION = 1;
const VECTOR_STORE = 'vector_chunks';
const GRAPH_NODES_STORE = 'graph_nodes';
const GRAPH_EDGES_STORE = 'graph_edges';

class HybridMemoryService {
    private static instance: HybridMemoryService;

    // --- Tier 1: Ephemeral Session Cache ---
    private ephemeral: EphemeralContext = {
        networkStatus: navigator.onLine ? 'online' : 'offline',
        recentTurns: [],
        workingScratchpad: {},
        lastActivity: Date.now()
    };

    private dbPromise: Promise<IDBDatabase> | null = null;

    private constructor() {
        this.initSensors();
        this.seedInitialKnowledgeGraph();
    }

    public static getInstance(): HybridMemoryService {
        if (!HybridMemoryService.instance) {
            HybridMemoryService.instance = new HybridMemoryService();
        }
        return HybridMemoryService.instance;
    }

    private initSensors() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => { this.ephemeral.networkStatus = 'online'; });
            window.addEventListener('offline', () => { this.ephemeral.networkStatus = 'offline'; });

            if ('getBattery' in navigator) {
                (navigator as any).getBattery?.().then((battery: any) => {
                    this.ephemeral.batteryLevel = Math.round(battery.level * 100);
                    this.ephemeral.isCharging = battery.charging;
                    battery.addEventListener('levelchange', () => {
                        this.ephemeral.batteryLevel = Math.round(battery.level * 100);
                    });
                    battery.addEventListener('chargingchange', () => {
                        this.ephemeral.isCharging = battery.charging;
                    });
                }).catch(() => {});
            }
        }
    }

    private getDB(): Promise<IDBDatabase> {
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e: any) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(VECTOR_STORE)) {
                    const vs = db.createObjectStore(VECTOR_STORE, { keyPath: 'id' });
                    vs.createIndex('userId', 'userId', { unique: false });
                    vs.createIndex('category', 'category', { unique: false });
                }
                if (!db.objectStoreNames.contains(GRAPH_NODES_STORE)) {
                    db.createObjectStore(GRAPH_NODES_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(GRAPH_EDGES_STORE)) {
                    const es = db.createObjectStore(GRAPH_EDGES_STORE, { keyPath: 'id' });
                    es.createIndex('sourceId', 'sourceId', { unique: false });
                    es.createIndex('targetId', 'targetId', { unique: false });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        return this.dbPromise;
    }

    // ==========================================
    // TIER 1: EPHEMERAL SESSION CACHE METHODS
    // ==========================================
    public updateEphemeralContext(updates: Partial<EphemeralContext>) {
        this.ephemeral = {
            ...this.ephemeral,
            ...updates,
            lastActivity: Date.now()
        };
    }

    public recordTurn(role: 'user' | 'model', text: string) {
        this.ephemeral.recentTurns.push({ role, text, timestamp: Date.now() });
        if (this.ephemeral.recentTurns.length > 6) {
            this.ephemeral.recentTurns.shift();
        }
        this.ephemeral.lastActivity = Date.now();
    }

    public getEphemeralContext(): EphemeralContext {
        return { ...this.ephemeral };
    }

    // ==========================================
    // TIER 2: SEMANTIC VECTOR STORE (IndexedDB)
    // ==========================================
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public async storeVectorChunk(chunk: Omit<VectorChunk, 'id' | 'embedding' | 'timestamp'> & { embedding?: number[] }): Promise<string> {
        const db = await this.getDB();
        let embedding = chunk.embedding;
        if (!embedding || embedding.length === 0) {
            embedding = await generateEmbedding(chunk.text);
        }

        const id = `vec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const record: VectorChunk = {
            id,
            userId: chunk.userId,
            text: chunk.text,
            category: chunk.category,
            embedding: embedding || [],
            timestamp: Date.now(),
            metadata: chunk.metadata
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(VECTOR_STORE, 'readwrite');
            const store = tx.objectStore(VECTOR_STORE);
            const req = store.put(record);
            req.onsuccess = () => resolve(id);
            req.onerror = () => reject(req.error);
        });
    }

    public async querySemanticVectors(
        queryText: string,
        userId: string,
        options: { topK?: number; minSimilarity?: number } = {}
    ): Promise<Array<{ text: string; score: number; category: string }>> {
        const { topK = 4, minSimilarity = 0.75 } = options;
        const queryEmbedding = await generateEmbedding(queryText);
        if (queryEmbedding.length === 0) return [];

        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(VECTOR_STORE, 'readonly');
            const store = tx.objectStore(VECTOR_STORE);
            const req = store.getAll();

            req.onsuccess = () => {
                const chunks: VectorChunk[] = req.result || [];
                const userChunks = chunks.filter(c => c.userId === userId && c.embedding?.length > 0);

                const scored = userChunks.map(c => ({
                    text: c.text,
                    category: c.category,
                    score: this.cosineSimilarity(queryEmbedding, c.embedding)
                })).filter(c => c.score >= minSimilarity);

                scored.sort((a, b) => b.score - a.score);
                resolve(scored.slice(0, topK));
            };
            req.onerror = () => reject(req.error);
        });
    }

    // ==========================================
    // TIER 3: KNOWLEDGE GRAPH DB (Entity Network)
    // ==========================================
    public async addNode(node: Omit<GraphNode, 'createdAt'>): Promise<void> {
        const db = await this.getDB();
        const record: GraphNode = { ...node, createdAt: Date.now() };
        return new Promise((resolve, reject) => {
            const tx = db.transaction(GRAPH_NODES_STORE, 'readwrite');
            tx.objectStore(GRAPH_NODES_STORE).put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    public async addEdge(edge: Omit<GraphEdge, 'updatedAt'>): Promise<void> {
        const db = await this.getDB();
        const record: GraphEdge = { ...edge, updatedAt: Date.now() };
        return new Promise((resolve, reject) => {
            const tx = db.transaction(GRAPH_EDGES_STORE, 'readwrite');
            tx.objectStore(GRAPH_EDGES_STORE).put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    public async getKnowledgeGraph(): Promise<KnowledgeGraphData> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([GRAPH_NODES_STORE, GRAPH_EDGES_STORE], 'readonly');
            const nodesReq = tx.objectStore(GRAPH_NODES_STORE).getAll();
            const edgesReq = tx.objectStore(GRAPH_EDGES_STORE).getAll();

            tx.oncomplete = () => {
                resolve({
                    nodes: nodesReq.result || [],
                    edges: edgesReq.result || []
                });
            };
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * Traverses the graph to find connected entities up to 2 hops for a given entity or concept.
     */
    public async queryEntityGraph(entityName: string): Promise<string[]> {
        const { nodes, edges } = await this.getKnowledgeGraph();
        if (nodes.length === 0) return [];

        const target = nodes.find(n =>
            n.label.toLowerCase().includes(entityName.toLowerCase()) ||
            entityName.toLowerCase().includes(n.label.toLowerCase())
        );

        if (!target) return [];

        const results: string[] = [];
        const directEdges = edges.filter(e => e.sourceId === target.id || e.targetId === target.id);

        for (const edge of directEdges) {
            const isSource = edge.sourceId === target.id;
            const otherId = isSource ? edge.targetId : edge.sourceId;
            const otherNode = nodes.find(n => n.id === otherId);

            if (otherNode) {
                if (isSource) {
                    results.push(`[${target.label}] --(${edge.relation})--> [${otherNode.label}]`);
                } else {
                    results.push(`[${otherNode.label}] --(${edge.relation})--> [${target.label}]`);
                }
            }
        }

        return results;
    }

    /**
     * Auto-extracts semantic knowledge triples like:
     * "[أحمد] شريك في [مشروع س]" or "[مشروع س] ميزانيته [100 ألف]"
     */
    public async extractAndStoreTriples(factText: string) {
        if (!factText || factText.length < 5) return;

        // Common Arabic semantic relation patterns
        const patterns = [
            /(?:المهندس|الأستاذ|السيد|المؤسس)?\s*([أ-يA-Za-z0-9_]+)\s+(شريك في|مؤسس|مدير|يمتلك|يشرف على)\s+([أ-يA-Za-z0-9_\s]+)/,
            /(?:مشروع|شركة|منصة)\s*([أ-يA-Za-z0-9_]+)\s+(ميزانيته|قيمته|أرباحه|هدفه)\s+([أ-يA-Za-z0-9_\s]+)/,
            /([أ-يA-Za-z0-9_]+)\s+(يفضل|يستخدم|يحب|يركز على)\s+([أ-يA-Za-z0-9_\s]+)/
        ];

        for (const pattern of patterns) {
            const match = factText.match(pattern);
            if (match) {
                const [, subject, relation, object] = match;
                const subId = `node_${encodeURIComponent(subject.trim())}`;
                const objId = `node_${encodeURIComponent(object.trim())}`;

                await this.addNode({
                    id: subId,
                    label: subject.trim(),
                    category: 'person'
                });

                await this.addNode({
                    id: objId,
                    label: object.trim(),
                    category: 'project'
                });

                await this.addEdge({
                    id: `edge_${subId}_${objId}`,
                    sourceId: subId,
                    targetId: objId,
                    relation: relation.trim(),
                    weight: 1.0
                });
                break;
            }
        }
    }

    /**
     * Seed baseline knowledge graph entities for "الظل"
     */
    private async seedInitialKnowledgeGraph() {
        try {
            const { nodes } = await this.getKnowledgeGraph();
            if (nodes.length > 0) return; // Already seeded

            // Seed initial nodes
            await this.addNode({ id: 'node_master', label: 'الماستر (أحمد)', category: 'person' });
            await this.addNode({ id: 'node_shadow_ai', label: 'الظل السيادي (Zel AGI)', category: 'project' });
            await this.addNode({ id: 'node_swarm', label: 'سرب الوكلاء المستقلين', category: 'concept' });
            await this.addNode({ id: 'node_vault', label: 'الخزينة السيادية المشفرة', category: 'secret' });
            await this.addNode({ id: 'node_crypto', label: 'محفظة واستراتيجية التداول', category: 'budget' });

            // Seed edges
            await this.addEdge({ id: 'e1', sourceId: 'node_master', targetId: 'node_shadow_ai', relation: 'المالك والمشرف السيادي', weight: 1.0 });
            await this.addEdge({ id: 'e2', sourceId: 'node_shadow_ai', targetId: 'node_swarm', relation: 'يدير وينسق', weight: 1.0 });
            await this.addEdge({ id: 'e3', sourceId: 'node_shadow_ai', targetId: 'node_vault', relation: 'يحمي مشفراً بـ AES-256', weight: 1.0 });
            await this.addEdge({ id: 'e4', sourceId: 'node_master', targetId: 'node_crypto', relation: 'يحدد شروط المخاطرة', weight: 1.0 });
        } catch (e) {
            console.warn('[HybridMemory] Initial seed skipped or error:', e);
        }
    }

    // ==========================================
    // UNIFIED TRI-TIER CONTEXT GENERATOR
    // ==========================================
    /**
     * Synthesizes all 3 tiers into a rich context block injected into the AI's prompt.
     */
    public async generateTriTierPromptContext(queryText: string, userId: string): Promise<string> {
        // Tier 1: Ephemeral
        const ep = this.getEphemeralContext();
        const tier1Lines = [
            `[TIER 1 - الحاضر والبيئة الحالية]:`,
            `- شبكة الاتصال: ${ep.networkStatus === 'online' ? 'متصل بالإنترنت' : 'يعمل محلياً دون اتصال (Offline Edge)'}`,
            ep.batteryLevel !== undefined ? `- البطارية: ${ep.batteryLevel}% (${ep.isCharging ? 'جار الشحن' : 'على البطارية'})` : ''
        ].filter(Boolean).join('\n');

        // Tier 2: Vector search
        let tier2Lines = '';
        try {
            const vectorMatches = await this.querySemanticVectors(queryText, userId, { topK: 3, minSimilarity: 0.72 });
            if (vectorMatches.length > 0) {
                tier2Lines = `[TIER 2 - الذاكرة الدلالية المتجهة]:\n` + vectorMatches.map(m => `- [تشابه ${(m.score * 100).toFixed(0)}%]: ${m.text}`).join('\n');
            }
        } catch {}

        // Tier 3: Knowledge Graph traversal
        let tier3Lines = '';
        try {
            const graphRelations = await this.queryEntityGraph(queryText);
            if (graphRelations.length > 0) {
                tier3Lines = `[TIER 3 - شبكة العلاقات المعرفية (Knowledge Graph)]:\n` + graphRelations.map(r => `- ${r}`).join('\n');
            }
        } catch {}

        return [tier1Lines, tier2Lines, tier3Lines].filter(Boolean).join('\n\n');
    }
}

export const hybridMemory = HybridMemoryService.getInstance();
