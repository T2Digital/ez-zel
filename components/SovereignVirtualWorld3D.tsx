import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
    X, Compass, Eye, Sun, Moon, CloudRain, Sparkles, Navigation, 
    Volume2, VolumeX, Maximize2, Minimize2, ChevronDown, ChevronUp, 
    Layers, Cpu, Brain, Shield, Info, Radio, Zap, Globe
} from 'lucide-react';

// Reusable scratch objects at module scope for zero-garbage collection 60fps loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Target = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _colorA = new THREE.Color();

// Procedural Circuit / Grid Canvas Texture Generator (Zero external file dependencies)
function createProceduralCircuitTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep obsidian background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, 512, 512);

    // Cyber grid lines
    ctx.strokeStyle = '#0e2238';
    ctx.lineWidth = 1.5;
    const step = 32;
    for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
    }

    // Glowing cyan circuit traces and nodes
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;

    const traces = [
        [[64, 64], [128, 64], [160, 96], [256, 96]],
        [[384, 64], [352, 96], [256, 96], [256, 160]],
        [[64, 448], [128, 448], [192, 384], [256, 384]],
        [[448, 448], [384, 448], [320, 384], [256, 384]],
        [[256, 160], [256, 384]],
        [[96, 256], [416, 256]],
    ];

    traces.forEach(trace => {
        ctx.beginPath();
        trace.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
        });
        ctx.stroke();
    });

    // Glowing circuit junction nodes
    ctx.fillStyle = '#67e8f9';
    [[256, 256], [256, 96], [256, 384], [96, 256], [416, 256], [160, 96], [352, 96], [192, 384], [320, 384]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}

// Procedural Radial Soft Contact Shadow Texture Generator
function createRadialShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export type AtmosphereMode = 'sunset' | 'midnight' | 'dawn' | 'matrix';
export type CameraMode = 'avatar' | 'orbit' | 'tour';

interface SovereignVirtualWorld3DProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SovereignVirtualWorld3D: React.FC<SovereignVirtualWorld3DProps> = ({ isOpen, onClose }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    // High-level UI state
    const [cameraMode, setCameraMode] = useState<CameraMode>('avatar');
    const [atmosphere, setAtmosphere] = useState<AtmosphereMode>('midnight');
    const [isMuted, setIsMuted] = useState(false);
    const [isWireframe, setIsWireframe] = useState(false);
    const [isHudCollapsed, setIsHudCollapsed] = useState(false);
    const [activeHotspot, setActiveHotspot] = useState<{
        id: string;
        title: string;
        category: string;
        description: string;
        stats: { label: string; value: string }[];
    } | null>(null);

    // Audio Context Ref (Procedural Web Audio API soundscapes)
    const audioCtxRef = useRef<AudioContext | null>(null);
    const ambientGainRef = useRef<GainNode | null>(null);

    // State refs for animation loop
    const stateRef = useRef({
        cameraMode: 'avatar' as CameraMode,
        atmosphere: 'midnight' as AtmosphereMode,
        isWireframe: false,
        isMuted: false,
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        isSprinting: false,
        avatarPos: new THREE.Vector3(0, 1.2, 28),
        avatarVelocity: new THREE.Vector3(0, 0, 0),
        avatarYaw: 0,
        tourProgress: 0,
        hotspotCooldown: 0
    });

    // Sync state refs
    useEffect(() => {
        stateRef.current.cameraMode = cameraMode;
    }, [cameraMode]);

    useEffect(() => {
        stateRef.current.atmosphere = atmosphere;
    }, [atmosphere]);

    useEffect(() => {
        stateRef.current.isWireframe = isWireframe;
    }, [isWireframe]);

    useEffect(() => {
        stateRef.current.isMuted = isMuted;
        if (ambientGainRef.current && audioCtxRef.current) {
            ambientGainRef.current.gain.setTargetAtTime(isMuted ? 0 : 0.12, audioCtxRef.current.currentTime, 0.1);
        }
    }, [isMuted]);

    // Sound FX trigger
    const playProceduralSound = useCallback((type: 'teleport' | 'click' | 'hotspot' | 'boost') => {
        if (stateRef.current.isMuted) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioCtx();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;

            if (type === 'teleport') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.36);
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (type === 'hotspot') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.46);
            } else if (type === 'boost') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.26);
            }
        } catch {
            // Audio context may require user click
        }
    }, []);

    // Main Three.js Lifecycle
    useEffect(() => {
        if (!isOpen || !mountRef.current) return;

        const container = mountRef.current;
        let animationFrameId: number;

        // 1. Scene & Color Space
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#030712');

        // 2. Camera Setup (FOV 60, optimal human depth perspective)
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 8, 38);

        // 3. Renderer with ACESFilmicToneMapping & PBR specs
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // 4. Studio Environment Reflection via RoomEnvironment
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        pmremGenerator.dispose();

        // 5. Atmosphere Lighting Rig (Key, Fill, Horizon Fog)
        const keyLight = new THREE.DirectionalLight('#67e8f9', 2.8);
        keyLight.position.set(30, 50, 30);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 160;
        const d = 45;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
        scene.add(keyLight);

        const hemiLight = new THREE.HemisphereLight('#082f49', '#020617', 1.2);
        scene.add(hemiLight);

        const horizonFog = new THREE.FogExp2('#040814', 0.012);
        scene.fog = horizonFog;

        // 6. OrbitControls with smooth exponential damping
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent subterranean clipping
        controls.minDistance = 2;
        controls.maxDistance = 140;
        controls.target.set(0, 4, 0);

        // Procedural Textures
        const circuitTex = createProceduralCircuitTexture();
        circuitTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const contactShadowTex = createRadialShadowTexture();

        // Material Palette (High-fidelity PBR)
        const darkGroundMat = new THREE.MeshStandardMaterial({
            map: circuitTex,
            roughness: 0.85,
            metalness: 0.25
        });

        const obsidianMat = new THREE.MeshStandardMaterial({
            color: '#080d1a',
            roughness: 0.15,
            metalness: 0.95
        });

        const goldAccentMat = new THREE.MeshStandardMaterial({
            color: '#f59e0b',
            roughness: 0.2,
            metalness: 0.9,
            emissive: '#78350f',
            emissiveIntensity: 0.2
        });

        const cyanEmissiveMat = new THREE.MeshStandardMaterial({
            color: '#06b6d4',
            emissive: '#06b6d4',
            emissiveIntensity: 2.2,
            roughness: 0.1,
            metalness: 0.8
        });

        const purpleEmissiveMat = new THREE.MeshStandardMaterial({
            color: '#a855f7',
            emissive: '#a855f7',
            emissiveIntensity: 2.0,
            roughness: 0.15,
            metalness: 0.8
        });

        const crystalGlassMat = new THREE.MeshPhysicalMaterial({
            color: '#67e8f9',
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.92,
            ior: 1.65,
            thickness: 2.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });

        // 7. TERRAIN: Expansive Ground Floor with naturally bounded perimeter
        const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
        const groundMesh = new THREE.Mesh(groundGeo, darkGroundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        // Circular Horizon Perimeter Cyber-Wall Barrier
        const wallRadius = 78;
        const wallGeo = new THREE.CylinderGeometry(wallRadius, wallRadius, 6, 64, 1, true);
        const wallMat = new THREE.MeshStandardMaterial({
            color: '#030b17',
            roughness: 0.9,
            metalness: 0.3,
            side: THREE.BackSide
        });
        const boundaryWall = new THREE.Mesh(wallGeo, wallMat);
        boundaryWall.position.y = 3;
        scene.add(boundaryWall);

        // Neon Top Railing for Boundary
        const wallRingGeo = new THREE.TorusGeometry(wallRadius, 0.25, 8, 64);
        const wallRingMesh = new THREE.Mesh(wallRingGeo, cyanEmissiveMat);
        wallRingMesh.rotation.x = Math.PI / 2;
        wallRingMesh.position.y = 6;
        scene.add(wallRingMesh);

        // 8. MODEL 1: THE SOVEREIGN CITADEL CORE (Composite 11-Part Procedural Monument)
        const citadelGroup = new THREE.Group();
        citadelGroup.position.set(0, 0, 0);

        // Part 1: Stepped Hexagonal Podium Base
        const baseShape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const r = 12;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) baseShape.moveTo(x, y);
            else baseShape.lineTo(x, y);
        }
        baseShape.closePath();
        const baseExtrude = new THREE.ExtrudeGeometry(baseShape, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3 });
        const baseMesh = new THREE.Mesh(baseExtrude, obsidianMat);
        baseMesh.rotation.x = Math.PI / 2;
        baseMesh.position.y = 1.2;
        baseMesh.receiveShadow = true;
        baseMesh.castShadow = true;
        citadelGroup.add(baseMesh);

        // Part 2: Second Tier Podium
        const tier2Shape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const r = 8.5;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) tier2Shape.moveTo(x, y);
            else tier2Shape.lineTo(x, y);
        }
        tier2Shape.closePath();
        const tier2Extrude = new THREE.ExtrudeGeometry(tier2Shape, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2 });
        const tier2Mesh = new THREE.Mesh(tier2Extrude, obsidianMat);
        tier2Mesh.rotation.x = Math.PI / 2;
        tier2Mesh.position.y = 2.2;
        tier2Mesh.receiveShadow = true;
        tier2Mesh.castShadow = true;
        citadelGroup.add(tier2Mesh);

        // Part 3: Main Obsidian Pyramid Obelisk Shaft
        const obeliskGeo = new THREE.CylinderGeometry(1.6, 5.0, 18, 4, 1);
        const obeliskMesh = new THREE.Mesh(obeliskGeo, obsidianMat);
        obeliskMesh.position.y = 11.2;
        obeliskMesh.rotation.y = Math.PI / 4;
        obeliskMesh.castShadow = true;
        obeliskMesh.receiveShadow = true;
        citadelGroup.add(obeliskMesh);

        // Part 4: Floating Quantum Apex Capstone (MeshPhysicalMaterial with clearcoat & transmission)
        const apexGeo = new THREE.OctahedronGeometry(2.2, 0);
        const apexMesh = new THREE.Mesh(apexGeo, crystalGlassMat);
        apexMesh.position.y = 22.5;
        apexMesh.castShadow = true;
        citadelGroup.add(apexMesh);

        // Part 5 & 6: Concentric Gyroscopic Orbital Rings
        const ring1Geo = new THREE.TorusGeometry(4.8, 0.16, 16, 48);
        const ring1Mesh = new THREE.Mesh(ring1Geo, cyanEmissiveMat);
        ring1Mesh.position.y = 22.5;
        citadelGroup.add(ring1Mesh);

        const ring2Geo = new THREE.TorusGeometry(3.6, 0.14, 16, 48);
        const ring2Mesh = new THREE.Mesh(ring2Geo, purpleEmissiveMat);
        ring2Mesh.position.y = 22.5;
        ring2Mesh.rotation.x = Math.PI / 3;
        citadelGroup.add(ring2Mesh);

        // Parts 7, 8, 9, 10: 4 Corner Sensor Pylons with Glowing Beacon Beams
        const pylonPositions = [
            [-9, 0, -9],
            [9, 0, -9],
            [-9, 0, 9],
            [9, 0, 9]
        ];
        pylonPositions.forEach(([px, py, pz]) => {
            const pylonGroup = new THREE.Group();
            pylonGroup.position.set(px, py, pz);

            const pColGeo = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
            const pColMesh = new THREE.Mesh(pColGeo, obsidianMat);
            pColMesh.position.y = 2.5;
            pColMesh.castShadow = true;
            pylonGroup.add(pColMesh);

            const pBeaconGeo = new THREE.SphereGeometry(0.45, 16, 16);
            const pBeaconMesh = new THREE.Mesh(pBeaconGeo, cyanEmissiveMat);
            pBeaconMesh.position.y = 5.2;
            pylonGroup.add(pBeaconMesh);

            citadelGroup.add(pylonGroup);
        });

        // Part 11: Radial Contact Shadow Plane
        const shadowPlaneGeo = new THREE.PlaneGeometry(28, 28);
        const shadowPlaneMat = new THREE.MeshBasicMaterial({
            map: contactShadowTex,
            transparent: true,
            opacity: 0.65,
            depthWrite: false
        });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = 0.03;
        citadelGroup.add(shadowPlane);

        scene.add(citadelGroup);

        // 9. MODEL 2: CYBER OASIS & BIOMORPHIC PALMS (Composite 11-Part Biome)
        const oasisGroup = new THREE.Group();
        oasisGroup.position.set(-26, 0, -18);

        // Part 1: Circular Reflection Pool Basin
        const poolBasinGeo = new THREE.CylinderGeometry(11, 12, 0.6, 32);
        const poolBasinMesh = new THREE.Mesh(poolBasinGeo, obsidianMat);
        poolBasinMesh.position.y = 0.3;
        poolBasinMesh.receiveShadow = true;
        oasisGroup.add(poolBasinMesh);

        // Part 2: Water Reflection Disk with procedural wave color
        const waterGeo = new THREE.CircleGeometry(10.5, 32);
        const waterMat = new THREE.MeshPhysicalMaterial({
            color: '#0891b2',
            roughness: 0.05,
            metalness: 0.15,
            transmission: 0.65,
            reflectivity: 0.9,
            clearcoat: 1.0
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.y = 0.58;
        oasisGroup.add(waterMesh);

        // Helper to construct a 7-Part Biomorphic Cyber Palm Tree
        const createCyberPalm = (x: number, z: number, scale: number = 1.0) => {
            const palm = new THREE.Group();
            palm.position.set(x, 0, z);
            palm.scale.set(scale, scale, scale);

            // Trunk segment 1
            const t1Geo = new THREE.CylinderGeometry(0.35, 0.55, 3.2, 8);
            const t1Mesh = new THREE.Mesh(t1Geo, obsidianMat);
            t1Mesh.position.set(0, 1.6, 0);
            t1Mesh.rotation.z = 0.08;
            t1Mesh.castShadow = true;
            palm.add(t1Mesh);

            // Trunk segment 2
            const t2Geo = new THREE.CylinderGeometry(0.28, 0.35, 3.0, 8);
            const t2Mesh = new THREE.Mesh(t2Geo, obsidianMat);
            t2Mesh.position.set(0.25, 4.4, 0);
            t2Mesh.rotation.z = 0.16;
            t2Mesh.castShadow = true;
            palm.add(t2Mesh);

            // Golden collar ring
            const collarGeo = new THREE.TorusGeometry(0.4, 0.08, 8, 16);
            const collarMesh = new THREE.Mesh(collarGeo, goldAccentMat);
            collarMesh.position.set(0.55, 5.8, 0);
            palm.add(collarMesh);

            // 6 Cantilever Crystal Fronds
            for (let f = 0; f < 6; f++) {
                const fAngle = (f * Math.PI) / 3;
                const frondShape = new THREE.Shape();
                frondShape.moveTo(0, 0);
                frondShape.lineTo(0.3, 1.5);
                frondShape.lineTo(0, 3.6);
                frondShape.lineTo(-0.3, 1.5);
                frondShape.closePath();

                const frondExtrude = new THREE.ExtrudeGeometry(frondShape, { depth: 0.06, bevelEnabled: false });
                const frondMesh = new THREE.Mesh(frondExtrude, f % 2 === 0 ? cyanEmissiveMat : purpleEmissiveMat);
                frondMesh.position.set(0.55, 5.8, 0);
                frondMesh.rotation.y = fAngle;
                frondMesh.rotation.x = 1.0;
                frondMesh.castShadow = true;
                palm.add(frondMesh);
            }

            // Glowing Data Fruit Coconuts
            const fruitGeo = new THREE.SphereGeometry(0.22, 12, 12);
            [-0.2, 0.2].forEach(offset => {
                const fruit = new THREE.Mesh(fruitGeo, cyanEmissiveMat);
                fruit.position.set(0.55 + offset, 5.6, offset);
                palm.add(fruit);
            });

            return palm;
        };

        oasisGroup.add(createCyberPalm(9, 6, 1.1));
        oasisGroup.add(createCyberPalm(-8, 8, 0.95));
        oasisGroup.add(createCyberPalm(8, -8, 1.05));
        oasisGroup.add(createCyberPalm(-9, -6, 0.9));

        scene.add(oasisGroup);

        // 10. MODEL 3: TRI-TIER KNOWLEDGE MONOLITHS (3 Distinct Themed Data Obelisks)
        const monolithsGroup = new THREE.Group();
        monolithsGroup.position.set(28, 0, -16);

        const monolithData = [
            { id: 'ephemeral', title: 'Tier 1: الذاكرة اللحظية', color: '#f59e0b', emissive: '#d97706', pos: [-5, 0, 0], h: 8.5 },
            { id: 'vector', title: 'Tier 2: مخزن المتجهات', color: '#06b6d4', emissive: '#0891b2', pos: [0, 0, -4], h: 11.0 },
            { id: 'graph', title: 'Tier 3: شبكة المعرفة والكيانات', color: '#10b981', emissive: '#059669', pos: [5, 0, 0], h: 9.5 }
        ];

        monolithData.forEach(mono => {
            const mGroup = new THREE.Group();
            mGroup.position.set(mono.pos[0], mono.pos[1], mono.pos[2]);

            // Part 1: Stepped Base
            const bGeo = new THREE.BoxGeometry(3.0, 0.6, 3.0);
            const bMesh = new THREE.Mesh(bGeo, obsidianMat);
            bMesh.position.y = 0.3;
            bMesh.castShadow = true;
            mGroup.add(bMesh);

            // Part 2: Main Monolith Slab
            const slabGeo = new THREE.BoxGeometry(2.0, mono.h, 0.9);
            const slabMat = new THREE.MeshStandardMaterial({
                color: '#09101d',
                roughness: 0.2,
                metalness: 0.9
            });
            const slabMesh = new THREE.Mesh(slabGeo, slabMat);
            slabMesh.position.y = mono.h / 2 + 0.6;
            slabMesh.castShadow = true;
            mGroup.add(slabMesh);

            // Part 3: Glowing Core Inscription Strip
            const stripGeo = new THREE.BoxGeometry(0.3, mono.h - 1.2, 0.95);
            const stripMat = new THREE.MeshStandardMaterial({
                color: mono.color,
                emissive: mono.emissive,
                emissiveIntensity: 2.5
            });
            const stripMesh = new THREE.Mesh(stripGeo, stripMat);
            stripMesh.position.y = mono.h / 2 + 0.6;
            mGroup.add(stripMesh);

            // Part 4: Floating Crown Crystal Node
            const nodeGeo = new THREE.DodecahedronGeometry(0.65, 0);
            const nodeMesh = new THREE.Mesh(nodeGeo, stripMat);
            nodeMesh.position.y = mono.h + 1.6;
            mGroup.add(nodeMesh);

            monolithsGroup.add(mGroup);
        });

        scene.add(monolithsGroup);

        // 11. MODEL 4: AUTONOMOUS FLYING DRONE SWARM (3 Cruisers navigating along 3D splines)
        const cruisers: {
            group: THREE.Group;
            tOffset: number;
            speed: number;
            pathRadiusX: number;
            pathRadiusZ: number;
            altitude: number;
            beaconLight: THREE.PointLight;
        }[] = [];

        for (let c = 0; c < 3; c++) {
            const cruiserGroup = new THREE.Group();

            // Part 1: Sleek Fuselage
            const fuseGeo = new THREE.ConeGeometry(0.7, 3.2, 6);
            fuseGeo.rotateX(Math.PI / 2);
            const fuseMesh = new THREE.Mesh(fuseGeo, obsidianMat);
            fuseMesh.castShadow = true;
            cruiserGroup.add(fuseMesh);

            // Part 2: Cockpit Glass Canopy
            const canopyGeo = new THREE.SphereGeometry(0.4, 8, 8);
            canopyGeo.scale(1, 0.6, 1.8);
            const canopyMesh = new THREE.Mesh(canopyGeo, crystalGlassMat);
            canopyMesh.position.set(0, 0.3, -0.2);
            cruiserGroup.add(canopyMesh);

            // Part 3 & 4: Swept Wings
            const wingGeo = new THREE.BoxGeometry(4.2, 0.08, 0.9);
            const wingMesh = new THREE.Mesh(wingGeo, obsidianMat);
            wingMesh.position.set(0, 0, 0.4);
            wingMesh.castShadow = true;
            cruiserGroup.add(wingMesh);

            // Part 5 & 6: Twin Ion Engine Thrusters with Emissive Exhaust
            [-0.75, 0.75].forEach(tx => {
                const thrusterGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.9, 8);
                thrusterGeo.rotateX(Math.PI / 2);
                const thrusterMesh = new THREE.Mesh(thrusterGeo, cyanEmissiveMat);
                thrusterMesh.position.set(tx, 0, 1.4);
                cruiserGroup.add(thrusterMesh);
            });

            // Part 7: Dynamic Ventral Beacon Light
            const beaconLight = new THREE.PointLight(c === 0 ? '#06b6d4' : c === 1 ? '#a855f7' : '#f59e0b', 3.0, 18);
            beaconLight.position.set(0, -0.4, 0);
            cruiserGroup.add(beaconLight);

            scene.add(cruiserGroup);

            cruisers.push({
                group: cruiserGroup,
                tOffset: (c * Math.PI * 2) / 3,
                speed: 0.35 + c * 0.08,
                pathRadiusX: 32 + c * 10,
                pathRadiusZ: 28 + c * 8,
                altitude: 14 + c * 3.5,
                beaconLight
            });
        }

        // 12. INSTANCED MESH: 50+ Scattered Crystal Geodes & Boulders (Zero draw-call overhead)
        const geodeCount = 55;
        const geodeGeo = new THREE.DodecahedronGeometry(0.9, 0);
        const geodeMat = new THREE.MeshStandardMaterial({
            color: '#0e1f38',
            roughness: 0.35,
            metalness: 0.85
        });
        const geodeInstanced = new THREE.InstancedMesh(geodeGeo, geodeMat, geodeCount);
        geodeInstanced.castShadow = true;
        geodeInstanced.receiveShadow = true;

        const dummy = new THREE.Object3D();
        const colors = [new THREE.Color('#06b6d4'), new THREE.Color('#3b82f6'), new THREE.Color('#8b5cf6'), new THREE.Color('#10b981')];

        for (let i = 0; i < geodeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 14 + Math.random() * 56;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const scaleY = 0.8 + Math.random() * 2.6;
            const scaleXZ = 0.7 + Math.random() * 1.2;

            dummy.position.set(x, scaleY * 0.45, z);
            dummy.scale.set(scaleXZ, scaleY, scaleXZ);
            dummy.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
            dummy.updateMatrix();

            geodeInstanced.setMatrixAt(i, dummy.matrix);
            geodeInstanced.setColorAt(i, colors[i % colors.length]);
        }
        geodeInstanced.computeBoundingSphere();
        scene.add(geodeInstanced);

        // 13. CELESTIAL STARFIELD & NEBULA PARTICLES
        const starCount = 1800;
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        for (let s = 0; s < starCount; s++) {
            const radius = 90 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1) * 0.55; // Upper celestial dome

            starPositions[s * 3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[s * 3 + 1] = Math.max(8, radius * Math.cos(phi));
            starPositions[s * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            const isCyan = Math.random() > 0.4;
            starColors[s * 3] = isCyan ? 0.4 : 0.9;
            starColors[s * 3 + 1] = isCyan ? 0.85 : 0.4;
            starColors[s * 3 + 2] = 1.0;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        const starMat = new THREE.PointsMaterial({
            size: 1.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.85
        });
        const starField = new THREE.Points(starGeo, starMat);
        scene.add(starField);

        // 14. PLAYER AVATAR DRONE (5-Part Hover Pod)
        const playerDroneGroup = new THREE.Group();
        playerDroneGroup.position.copy(stateRef.current.avatarPos);

        const podBodyGeo = new THREE.SphereGeometry(0.75, 16, 16);
        podBodyGeo.scale(1, 0.55, 1.4);
        const podBodyMesh = new THREE.Mesh(podBodyGeo, obsidianMat);
        podBodyMesh.castShadow = true;
        playerDroneGroup.add(podBodyMesh);

        // Optic Visor
        const visorGeo = new THREE.BoxGeometry(0.9, 0.2, 0.4);
        const visorMesh = new THREE.Mesh(visorGeo, cyanEmissiveMat);
        visorMesh.position.set(0, 0.12, -0.65);
        playerDroneGroup.add(visorMesh);

        // Floating Magnetic Propulsion Ring
        const pRingGeo = new THREE.TorusGeometry(1.1, 0.08, 12, 32);
        const pRingMesh = new THREE.Mesh(pRingGeo, cyanEmissiveMat);
        pRingMesh.rotation.x = Math.PI / 2;
        pRingMesh.position.y = -0.15;
        playerDroneGroup.add(pRingMesh);

        // Thruster Ground Spot Light
        const droneSpot = new THREE.PointLight('#22d3ee', 2.2, 8);
        droneSpot.position.set(0, -0.5, 0);
        playerDroneGroup.add(droneSpot);

        scene.add(playerDroneGroup);

        // 15. INTERACTIVE HOTSPOT ANCHORS FOR RAYCASTING
        const hotspots = [
            {
                mesh: apexMesh,
                data: {
                    id: 'citadel',
                    title: 'برج المعمارية السيادية (Sovereign Citadel)',
                    category: 'نواة المعمارية الخماسية AGI',
                    description: 'المركز العصبي للذكاء السيادي: تدفق صوتي دون 300 مللي ثانية، وسرب وكلاء مستقل متزامن، وذاكرة هجينة ثلاثية الطبقات.',
                    stats: [
                        { label: 'الاستجابة', value: '< 280ms' },
                        { label: 'الأمان', value: 'Sandboxed 100%' },
                        { label: 'حالة النواة', value: 'مستقرة (Active)' }
                    ]
                }
            },
            {
                mesh: waterMesh,
                data: {
                    id: 'oasis',
                    title: 'واحة البيانات والتعافي (The Cyber Oasis)',
                    category: 'التزامن المحلي المقاوم للانقطاع',
                    description: 'بيئة محلية بالكامل مشفرة بـ AES-256 GCM و CRDT Vector Clocks، تضمن استمرار العمل بكفاءة حتى عند انقطاع الإنترنت التام.',
                    stats: [
                        { label: 'التشفير', value: 'AES-256 GCM' },
                        { label: 'الوضع المحلي', value: 'Edge-First' },
                        { label: 'المزامنة', value: 'Conflict-Free' }
                    ]
                }
            },
            {
                mesh: monolithsGroup,
                data: {
                    id: 'monoliths',
                    title: 'أبراج الذاكرة ثلاثية الطبقات (Tri-Tier Vault)',
                    category: 'الهندسة المعرفية الهجينة',
                    description: 'توزيع فائق الذكاء: الذاكرة اللحظية (Tier 1)، واسترجاع المتجهات الدلالية بنسبة تشابه 85%+ (Tier 2)، وشبكة الكيانات والعلاقات المعقدة (Tier 3).',
                    stats: [
                        { label: 'دقة الاسترجاع', value: '88.4%' },
                        { label: 'العلاقات المعرفية', value: 'Knowledge Graph' },
                        { label: 'توفير التوكنز', value: 'عالي جداً' }
                    ]
                }
            }
        ];

        // Raycasting for interactive mouse/touch clicks
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

        const handlePointerDown = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);
            const clickableTargets = hotspots.map(h => h.mesh);
            const intersects = raycaster.intersectObjects(clickableTargets, true);

            if (intersects.length > 0) {
                const hitObj = intersects[0].object;
                const match = hotspots.find(h => {
                    if (h.mesh === hitObj) return true;
                    let found = false;
                    h.mesh.traverse(child => {
                        if (child === hitObj) found = true;
                    });
                    return found;
                });

                if (match) {
                    setActiveHotspot(match.data);
                    playProceduralSound('hotspot');
                }
            }
        };

        renderer.domElement.addEventListener('pointerdown', handlePointerDown);

        // Keyboard Controls for Avatar
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') stateRef.current.moveForward = true;
            if (key === 's' || key === 'arrowdown') stateRef.current.moveBackward = true;
            if (key === 'a' || key === 'arrowleft') stateRef.current.moveLeft = true;
            if (key === 'd' || key === 'arrowright') stateRef.current.moveRight = true;
            if (key === 'shift') stateRef.current.isSprinting = true;
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') stateRef.current.moveForward = false;
            if (key === 's' || key === 'arrowdown') stateRef.current.moveBackward = false;
            if (key === 'a' || key === 'arrowleft') stateRef.current.moveLeft = false;
            if (key === 'd' || key === 'arrowright') stateRef.current.moveRight = false;
            if (key === 'shift') stateRef.current.isSprinting = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Cinematic Tour Waypoints
        const tourWaypoints = [
            { pos: new THREE.Vector3(0, 24, 32), look: new THREE.Vector3(0, 20, 0) },      // Apex Spire
            { pos: new THREE.Vector3(-22, 9, -6), look: new THREE.Vector3(-26, 2, -18) },   // Cyber Oasis
            { pos: new THREE.Vector3(26, 12, -4), look: new THREE.Vector3(28, 6, -16) },    // Monoliths
            { pos: new THREE.Vector3(0, 38, 48), look: new THREE.Vector3(0, 6, 0) },        // High City Overview
        ];

        // 16. ANIMATION & RENDER LOOP (Lossless 60fps with exponential damping)
        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const delta = Math.min(clock.getDelta(), 0.1);
            const time = clock.getElapsedTime();

            // Atmosphere Mode Updates
            const currentAtmo = stateRef.current.atmosphere;
            if (currentAtmo === 'sunset') {
                keyLight.color.set('#f59e0b');
                hemiLight.color.set('#4338ca');
                scene.background = _colorA.set('#1e1b4b');
                horizonFog.color.set('#1e1b4b');
            } else if (currentAtmo === 'midnight') {
                keyLight.color.set('#06b6d4');
                hemiLight.color.set('#082f49');
                scene.background = _colorA.set('#030712');
                horizonFog.color.set('#040814');
            } else if (currentAtmo === 'dawn') {
                keyLight.color.set('#fbbf24');
                hemiLight.color.set('#047857');
                scene.background = _colorA.set('#064e3b');
                horizonFog.color.set('#022c22');
            } else if (currentAtmo === 'matrix') {
                keyLight.color.set('#10b981');
                hemiLight.color.set('#064e3b');
                scene.background = _colorA.set('#021c10');
                horizonFog.color.set('#021c10');
            }

            // Wireframe toggle across materials
            const wf = stateRef.current.isWireframe;
            darkGroundMat.wireframe = wf;
            obsidianMat.wireframe = wf;

            // Citadel Dynamic Rotations
            apexMesh.rotation.y = time * 0.4;
            apexMesh.rotation.x = Math.sin(time * 0.5) * 0.15;
            apexMesh.position.y = 22.5 + Math.sin(time * 1.5) * 0.45;
            ring1Mesh.rotation.z = time * 0.6;
            ring2Mesh.rotation.y = -time * 0.8;

            // Oasis Frond & Lotus Gentle Waves
            waterMesh.rotation.z = time * 0.05;

            // Cruisers Spline Path Navigations
            cruisers.forEach(c => {
                const angle = time * c.speed + c.tOffset;
                const px = Math.cos(angle) * c.pathRadiusX;
                const pz = Math.sin(angle) * c.pathRadiusZ;
                const py = c.altitude + Math.sin(time * 1.2 + c.tOffset) * 1.2;

                c.group.position.set(px, py, pz);
                // Heading rotation tangent to circle
                c.group.rotation.y = -angle + Math.PI / 2;
                c.group.rotation.z = Math.sin(time * 2) * 0.08; // subtle bank roll
            });

            // Starfield Slow Rotation
            starField.rotation.y = time * 0.015;

            // Camera & Avatar Mode Logic
            const camMode = stateRef.current.cameraMode;

            if (camMode === 'avatar') {
                controls.enabled = false;

                // Avatar movement kinematics
                const moveSpeed = (stateRef.current.isSprinting ? 18 : 10) * delta;
                let moveX = 0;
                let moveZ = 0;

                if (stateRef.current.moveForward) moveZ -= 1;
                if (stateRef.current.moveBackward) moveZ += 1;
                if (stateRef.current.moveLeft) moveX -= 1;
                if (stateRef.current.moveRight) moveX += 1;

                if (moveX !== 0 || moveZ !== 0) {
                    const moveLength = Math.hypot(moveX, moveZ);
                    const normX = (moveX / moveLength) * moveSpeed;
                    const normZ = (moveZ / moveLength) * moveSpeed;

                    stateRef.current.avatarPos.x += normX;
                    stateRef.current.avatarPos.z += normZ;

                    // Clamping inside boundary wall
                    const currentDist = Math.hypot(stateRef.current.avatarPos.x, stateRef.current.avatarPos.z);
                    if (currentDist > wallRadius - 2) {
                        const ratio = (wallRadius - 2) / currentDist;
                        stateRef.current.avatarPos.x *= ratio;
                        stateRef.current.avatarPos.z *= ratio;
                    }

                    // Avatar facing orientation
                    stateRef.current.avatarYaw = THREE.MathUtils.damp(
                        stateRef.current.avatarYaw,
                        Math.atan2(normX, normZ),
                        10,
                        delta
                    );
                }

                // Hover bobbing
                const hoverY = 1.2 + Math.sin(time * 3) * 0.15;
                stateRef.current.avatarPos.y = hoverY;

                playerDroneGroup.position.copy(stateRef.current.avatarPos);
                playerDroneGroup.rotation.y = stateRef.current.avatarYaw;
                playerDroneGroup.visible = true;

                // Silky Damped Chase Camera
                const chaseCamTarget = _vec3A.set(
                    stateRef.current.avatarPos.x + Math.sin(stateRef.current.avatarYaw) * 1.5 - Math.sin(stateRef.current.avatarYaw) * 8.5,
                    stateRef.current.avatarPos.y + 4.2,
                    stateRef.current.avatarPos.z + Math.cos(stateRef.current.avatarYaw) * 1.5 + Math.cos(stateRef.current.avatarYaw) * 8.5
                );

                camera.position.x = THREE.MathUtils.damp(camera.position.x, chaseCamTarget.x, 6, delta);
                camera.position.y = THREE.MathUtils.damp(camera.position.y, chaseCamTarget.y, 6, delta);
                camera.position.z = THREE.MathUtils.damp(camera.position.z, chaseCamTarget.z, 6, delta);

                const lookTarget = _vec3B.set(
                    stateRef.current.avatarPos.x,
                    stateRef.current.avatarPos.y + 1.2,
                    stateRef.current.avatarPos.z
                );
                camera.lookAt(lookTarget);

            } else if (camMode === 'orbit') {
                controls.enabled = true;
                controls.update();
                playerDroneGroup.visible = true;

            } else if (camMode === 'tour') {
                controls.enabled = false;
                playerDroneGroup.visible = false;

                // Smooth waypoint tour cruise
                stateRef.current.tourProgress = (stateRef.current.tourProgress + delta * 0.08) % tourWaypoints.length;
                const idx = Math.floor(stateRef.current.tourProgress);
                const nextIdx = (idx + 1) % tourWaypoints.length;
                const alpha = stateRef.current.tourProgress - idx;

                const currWp = tourWaypoints[idx];
                const nextWp = tourWaypoints[nextIdx];

                camera.position.lerpVectors(currWp.pos, nextWp.pos, alpha);
                _vec3Target.lerpVectors(currWp.look, nextWp.look, alpha);
                camera.lookAt(_vec3Target);
            }

            renderer.render(scene, camera);
        };

        animate();

        // Resize Listener
        const handleResize = () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            controls.dispose();
            renderer.dispose();
            scene.clear();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Teleport Helper
    const teleportTo = (x: number, z: number, label: string) => {
        stateRef.current.avatarPos.set(x, 1.2, z);
        playProceduralSound('teleport');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white font-sans overflow-hidden select-none">
            {/* Full-bleed 3D WebGL Canvas Container */}
            <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Top Bar (Minimalist, zero viewport occlusion) */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                <div className="pointer-events-auto flex items-center gap-3 bg-black/80 border border-cyan-500/30 rounded-full px-4 py-2 shadow-2xl backdrop-blur-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <div>
                        <h2 className="text-xs md:text-sm font-black tracking-wider text-cyan-200">عالم الظل الافتراضي السيادي</h2>
                        <p className="text-[10px] text-white/50 font-mono">The Sovereign 3D Metaverse • Three.js PBR Engine</p>
                    </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    <button 
                        onClick={() => {
                            setIsMuted(!isMuted);
                            playProceduralSound('click');
                        }}
                        className={`p-2.5 rounded-full border transition-all ${
                            isMuted ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        }`}
                        title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                    >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <button 
                        onClick={() => {
                            playProceduralSound('click');
                            onClose();
                        }}
                        className="p-2.5 rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 transition-all"
                        title="إغلاق العالم الافتراضي والعودة"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Instructions Floating Banner (Auto-dismissable hint for WASD) */}
            {cameraMode === 'avatar' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-10 hidden sm:flex items-center gap-2 bg-black/70 border border-white/10 rounded-full px-4 py-1.5 text-[11px] text-white/70 font-mono">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تحكم بالدرون: W/A/S/D أو الأسهم • اضغط Shift للتسارع • انقر على المعالم لفحصها</span>
                </div>
            )}

            {/* Hotspot In-World Holographic Dossier Modal (When clicking Citadel/Oasis/Monoliths) */}
            {activeHotspot && (
                <div className="absolute top-20 right-4 z-30 w-80 md:w-96 bg-[#0a0f1d] border border-cyan-500/50 rounded-2xl p-5 shadow-[0_0_35px_rgba(6,182,212,0.25)] text-right animate-in fade-in slide-in-from-right-4" dir="rtl">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                                {activeHotspot.category}
                            </span>
                            <h3 className="text-base font-black text-white mt-1.5">{activeHotspot.title}</h3>
                        </div>
                        <button 
                            onClick={() => {
                                setActiveHotspot(null);
                                playProceduralSound('click');
                            }}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed mb-4">{activeHotspot.description}</p>

                    <div className="grid grid-cols-3 gap-2 p-3 bg-black/60 rounded-xl border border-white/5 mb-3">
                        {activeHotspot.stats.map((s, idx) => (
                            <div key={idx} className="text-center">
                                <span className="block text-[10px] text-white/40">{s.label}</span>
                                <span className="text-xs font-mono font-bold text-cyan-300">{s.value}</span>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => {
                            setActiveHotspot(null);
                            playProceduralSound('click');
                        }}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/20"
                    >
                        متابعة الاستكشاف
                    </button>
                </div>
            )}

            {/* Viewport-First Collapsible Bottom Control Dock (<= 15% Viewport Footprint) */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 pointer-events-none">
                <div className="pointer-events-auto bg-[#080d19] border border-cyan-500/30 rounded-2xl shadow-2xl p-2.5 transition-all">
                    {/* Minimal Toggle Strip */}
                    <div className="flex items-center justify-between px-2 pb-1.5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-[11px] font-bold text-cyan-300">منظومة الملاحة السيادية</span>
                        </div>
                        <button 
                            onClick={() => {
                                setIsHudCollapsed(!isHudCollapsed);
                                playProceduralSound('click');
                            }}
                            className="text-[10px] text-white/50 hover:text-white flex items-center gap-1 font-mono transition-colors"
                        >
                            {isHudCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{isHudCollapsed ? 'إظهار لوحة التحكم' : 'إخفاء (Cinema Mode)'}</span>
                        </button>
                    </div>

                    {!isHudCollapsed && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5" dir="rtl">
                            {/* Mode Pill Group */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-white/40">نمط الرؤية:</span>
                                <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => { setCameraMode('avatar'); playProceduralSound('click'); }}
                                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${cameraMode === 'avatar' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
                                    >
                                        درون
                                    </button>
                                    <button 
                                        onClick={() => { setCameraMode('orbit'); playProceduralSound('click'); }}
                                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${cameraMode === 'orbit' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
                                    >
                                        مدار 360°
                                    </button>
                                    <button 
                                        onClick={() => { setCameraMode('tour'); playProceduralSound('click'); }}
                                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${cameraMode === 'tour' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
                                    >
                                        جولة سينمائية
                                    </button>
                                </div>
                            </div>

                            {/* Atmosphere Pill Group */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-white/40">المناخ والطقس:</span>
                                <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => { setAtmosphere('midnight'); playProceduralSound('click'); }}
                                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${atmosphere === 'midnight' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'}`}
                                    >
                                        نيون ليل
                                    </button>
                                    <button 
                                        onClick={() => { setAtmosphere('sunset'); playProceduralSound('click'); }}
                                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${atmosphere === 'sunset' ? 'bg-amber-600 text-white' : 'text-white/60 hover:text-white'}`}
                                    >
                                        غروب
                                    </button>
                                    <button 
                                        onClick={() => { setAtmosphere('matrix'); playProceduralSound('click'); }}
                                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${atmosphere === 'matrix' ? 'bg-emerald-600 text-white' : 'text-white/60 hover:text-white'}`}
                                    >
                                        ماتريكس
                                    </button>
                                </div>
                            </div>

                            {/* Teleport Quick Jump */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-white/40">انتقال فوري (Teleport):</span>
                                <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => teleportTo(0, 18, 'القلعة')}
                                        className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all"
                                    >
                                        القلعة
                                    </button>
                                    <button 
                                        onClick={() => teleportTo(-26, -6, 'الواحة')}
                                        className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all"
                                    >
                                        الواحة
                                    </button>
                                    <button 
                                        onClick={() => teleportTo(28, -6, 'المونوليث')}
                                        className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all"
                                    >
                                        المونوليث
                                    </button>
                                </div>
                            </div>

                            {/* Shaders & Wireframe FX */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-white/40">الهندسة والأشعة:</span>
                                <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => {
                                            setIsWireframe(!isWireframe);
                                            playProceduralSound('click');
                                        }}
                                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                                            isWireframe ? 'bg-cyan-500 text-black font-black' : 'text-white/60 hover:text-white'
                                        }`}
                                    >
                                        <Layers className="w-3 h-3" />
                                        <span>{isWireframe ? 'مجسم شبكي' : 'تجسيم PBR'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Touch Virtual D-Pad (Visible on small screens in avatar mode) */}
            {cameraMode === 'avatar' && (
                <div className="sm:hidden absolute bottom-24 right-6 z-20 flex flex-col items-center gap-1 pointer-events-auto">
                    <button 
                        onPointerDown={() => { stateRef.current.moveForward = true; }}
                        onPointerUp={() => { stateRef.current.moveForward = false; }}
                        className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold active:bg-cyan-500 active:text-black transition-all"
                    >
                        ▲
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onPointerDown={() => { stateRef.current.moveLeft = true; }}
                            onPointerUp={() => { stateRef.current.moveLeft = false; }}
                            className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold active:bg-cyan-500 active:text-black transition-all"
                        >
                            ◀
                        </button>
                        <button 
                            onPointerDown={() => { stateRef.current.moveBackward = true; }}
                            onPointerUp={() => { stateRef.current.moveBackward = false; }}
                            className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold active:bg-cyan-500 active:text-black transition-all"
                        >
                            ▼
                        </button>
                        <button 
                            onPointerDown={() => { stateRef.current.moveRight = true; }}
                            onPointerUp={() => { stateRef.current.moveRight = false; }}
                            className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold active:bg-cyan-500 active:text-black transition-all"
                        >
                            ▶
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SovereignVirtualWorld3D;
