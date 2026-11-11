import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Play, Pause, RotateCcw, Volume2, Maximize2, Minimize2, 
  Sparkles, Coffee, ShoppingCart, BarChart3, Calendar, 
  Mail, Layout, ShieldCheck, ChevronRight, ChevronLeft,
  ExternalLink, Zap
} from 'lucide-react';

export type SpatialSceneId = 
  | 'wake_up' 
  | 'online_store' 
  | 'agency_towers' 
  | 'content_carousel' 
  | 'inbox_filter' 
  | 'page_builder' 
  | 'sign_off';

export interface SpatialSceneMeta {
  id: SpatialSceneId;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  color: string;
  script: string;
  actionText?: string;
  actionDeck?: 'app_cloner' | 'agency_overview' | 'studio_calendar' | 'obsidian_graph' | 'whatsapp_connect';
}

export const SPATIAL_SCENES: SpatialSceneMeta[] = [
  {
    id: 'wake_up',
    title: '1. استيقاظ وجدول اليوم',
    subtitle: 'Good morning Master Tito • قهوة الصباح وجدول الـ 14 مهمة',
    icon: Coffee,
    tag: 'MORNING BRIEF',
    color: '#f59e0b',
    script: 'صباح الخير يا ماستر تيتو. فنجان قهوتك جاهز، وجدول اليوم فيه 14 مهمة لـ 4 براندات، والمتاجر والإنبوكس كلهم تحت السيطرة تماماً. تحب نبدأ بإيه؟',
    actionText: 'عرض جدول اليوم',
    actionDeck: 'obsidian_graph'
  },
  {
    id: 'online_store',
    title: '2. المتجر الإلكتروني والطلبات',
    subtitle: 'Orders Flying In • 42 طلب شحن وحجز مباشر اليوم',
    icon: ShoppingCart,
    tag: 'E-COMMERCE',
    color: '#06b6d4',
    script: 'المتجر شغال 24 ساعة، استقبلنا 42 طلب شحن جديد وحجز فوري بإجمالي مبيعات تتجاوز 28 ألف جنيه عبر باي موب وإنستاباي.',
    actionText: 'فتح المتجر والطلبات',
    actionDeck: 'app_cloner'
  },
  {
    id: 'agency_towers',
    title: '3. أبراج مواقع العملاء',
    subtitle: 'Sites Climb Like Towers • نمو حقيقي لبراندات الوكالة',
    icon: BarChart3,
    tag: 'AGENCY GROWTH',
    color: '#10b981',
    script: 'براندات الوكالة الأربعة طالعة زي الأبراج في الترتيب: عطية للمحاماة، الملك للموبايلات، ورواسي وتيتو ستوديو كلهم في المنطقة الخضراء وبأعلى معدلات تحويل.',
    actionText: 'رادار نمو الوكالة',
    actionDeck: 'agency_overview'
  },
  {
    id: 'content_carousel',
    title: '4. خطة محتوى الأسبوع',
    subtitle: '7-Day Omni-Channel • خطة مدروسة مع تيتو ستوديو',
    icon: Calendar,
    tag: 'CONTENT ENGINE',
    color: '#8b5cf6',
    script: 'خطة الأسبوع اتصممت بالكامل وجاهزة للنشر: 3 ريلز سينمائي بنظام Turbo Flow، تصميمين للمنتجات، وبوست عرض نهاية الأسبوع مع زر حجز فوري.',
    actionText: 'تقويم تيتو ستوديو',
    actionDeck: 'studio_calendar'
  },
  {
    id: 'inbox_filter',
    title: '5. تصفية البريد والرسائل',
    subtitle: 'Junk Melts Away • 41 رسالة وتصفية الإزعاج آلياً',
    icon: Mail,
    tag: 'SMART INBOX',
    color: '#ec4899',
    script: 'وصلنا 41 رسالة وإشعار جديد، جارفز قام بفلترة كل السبام والإعلانات المزعجة وتلاشت في ثوانٍ، وفضل بس 7 استفسارات عملاء مؤكدين وطلبات حجز.',
    actionText: 'ربط واتساب والرسائل',
    actionDeck: 'whatsapp_connect'
  },
  {
    id: 'page_builder',
    title: '6. بناء صفحة هبوط لايف',
    subtitle: 'Building in 3D • صفحة متجر وبراند جاهزة في ثوانٍ',
    icon: Layout,
    tag: 'LIVE BUILDER',
    color: '#3b82f6',
    script: 'شغالين حالياً على بناء وتوليد الواجهة التفاعلية لايف ثلاثية الأبعاد، الهوية واللوجو والأزرار التفاعلية كلها اتركبت في دقيقة واحدة وجاهزة للانطلاق.',
    actionText: 'معاينة الصفحة PWA',
    actionDeck: 'app_cloner'
  },
  {
    id: 'sign_off',
    title: '7. نبرة السيادة والحراسة',
    subtitle: 'Constant Studio Voice • جارفز في وضع الجاهزية الدائمة',
    icon: ShieldCheck,
    tag: 'SOVEREIGN CORE',
    color: '#eab308',
    script: 'كل الأنظمة الحيوية لشركتك وشبكة عملائك شغالة بدقة أمان 100%. أنا هنا جنبك ومستعد لأي أمر صوتي أو تنفيذي يا ماستر تيتو.',
    actionText: 'لوحة القيادة الكاملة',
    actionDeck: 'agency_overview'
  }
];

interface Jarvis3DSpatialTheaterProps {
  currentScene?: SpatialSceneId;
  onSceneChange?: (sceneId: SpatialSceneId) => void;
  isPlayingVoice?: boolean;
  audioLevel?: number;
  onActionClick?: (actionDeck: string) => void;
  onSpeakScript?: (text: string) => void;
  className?: string;
}

export const Jarvis3DSpatialTheater: React.FC<Jarvis3DSpatialTheaterProps> = ({
  currentScene: externalScene,
  onSceneChange,
  isPlayingVoice = false,
  audioLevel = 0,
  onActionClick,
  onSpeakScript,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active scene state
  const [internalScene, setInternalScene] = useState<SpatialSceneId>('wake_up');
  const activeSceneId = externalScene || internalScene;
  const activeSceneMeta = SPATIAL_SCENES.find(s => s.id === activeSceneId) || SPATIAL_SCENES[0];

  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // References to Three.js elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Target camera positions for each scene
  const cameraTargetPos = useRef(new THREE.Vector3(0, 3, 16));
  const cameraTargetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Scene sub-groups for smooth toggling
  const sceneGroupsRef = useRef<{ [key in SpatialSceneId]?: THREE.Group }>({});
  const coreOrbRef = useRef<THREE.Mesh | null>(null);
  const visualizerBarsRef = useRef<THREE.Mesh[]>([]);
  const steamParticlesRef = useRef<THREE.Points | null>(null);
  const junkParticlesRef = useRef<THREE.Points | null>(null);
  const orderBoxesRef = useRef<THREE.Mesh[]>([]);

  // Function to switch scene
  const handleSelectScene = useCallback((sceneId: SpatialSceneId, shouldSpeak: boolean = true) => {
    setInternalScene(sceneId);
    onSceneChange?.(sceneId);

    const meta = SPATIAL_SCENES.find(s => s.id === sceneId);
    if (meta && shouldSpeak && !isMuted && onSpeakScript) {
      onSpeakScript(meta.script);
    }
  }, [onSceneChange, onSpeakScript, isMuted]);

  // Tour logic: cycle through 7 scenes
  useEffect(() => {
    if (!isTourPlaying) return;

    const currentIndex = SPATIAL_SCENES.findIndex(s => s.id === activeSceneId);
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % SPATIAL_SCENES.length;
      handleSelectScene(SPATIAL_SCENES[nextIndex].id, true);
      if (nextIndex === SPATIAL_SCENES.length - 1) {
        setIsTourPlaying(false);
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [isTourPlaying, activeSceneId, handleSelectScene]);

  // Initialize Three.js 3D Theater
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.025);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, 3, 16);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x0f2744, 1.8);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x00f0ff, 3.5, 40);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const goldRimLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    goldRimLight.position.set(10, 15, 10);
    scene.add(goldRimLight);

    const cyanRimLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    cyanRimLight.position.set(-10, -5, -10);
    scene.add(cyanRimLight);

    // ==========================================
    // 5. STARFIELD & COSMIC DUST
    // ==========================================
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const baseStarColor = new THREE.Color(0xa5f3fc);
    const goldStarColor = new THREE.Color(0xfde68a);

    for (let i = 0; i < starCount; i++) {
      const r = 30 + Math.random() * 70;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const c = Math.random() > 0.8 ? goldStarColor : baseStarColor;
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ==========================================
    // 6. GROUND HOLOGRAPHIC RADAR GRID
    // ==========================================
    const radarGroup = new THREE.Group();
    radarGroup.position.y = -2.8;

    // Concentric wireframe rings
    for (let r = 2; r <= 14; r += 2) {
      const ringGeo = new THREE.RingGeometry(r - 0.03, r, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: r === 6 ? 0x00f0ff : 0x0e3a5a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: r === 6 ? 0.65 : 0.35
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      radarGroup.add(ringMesh);
    }

    // Crosshair axes
    const axisMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.3 });
    const axisPoints1 = [new THREE.Vector3(-14, 0, 0), new THREE.Vector3(14, 0, 0)];
    const axisPoints2 = [new THREE.Vector3(0, 0, -14), new THREE.Vector3(0, 0, 14)];
    const axisGeo1 = new THREE.BufferGeometry().setFromPoints(axisPoints1);
    const axisGeo2 = new THREE.BufferGeometry().setFromPoints(axisPoints2);
    radarGroup.add(new THREE.Line(axisGeo1, axisMat));
    radarGroup.add(new THREE.Line(axisGeo2, axisMat));
    scene.add(radarGroup);

    // ==========================================
    // 7. THE SOVEREIGN CORE (THE LIVING ORB)
    // ==========================================
    const coreGroup = new THREE.Group();

    // Central Sphere
    const orbGeo = new THREE.SphereGeometry(1.6, 64, 64);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x051a36,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: false
    });
    const coreOrb = new THREE.Mesh(orbGeo, orbMat);
    coreOrbRef.current = coreOrb;
    coreGroup.add(coreOrb);

    // Inner Plasma Glow
    const innerPlasmaGeo = new THREE.SphereGeometry(1.1, 32, 32);
    const innerPlasmaMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75
    });
    coreGroup.add(new THREE.Mesh(innerPlasmaGeo, innerPlasmaMat));

    // Outer Planetary Rings (Saturn style)
    const ring1Geo = new THREE.TorusGeometry(2.7, 0.04, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    coreGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.3, 0.03, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 5;
    coreGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(4.0, 0.025, 16, 120);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.6 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 2.5;
    coreGroup.add(ring3);

    // ==========================================
    // 8. 3D CYLINDRICAL AUDIO VISUALIZER (Pulsing around base)
    // ==========================================
    const barCount = 48;
    const visualizerGroup = new THREE.Group();
    visualizerGroup.position.y = -2.2;
    const visualizerBars: THREE.Mesh[] = [];

    const barGeo = new THREE.BoxGeometry(0.12, 1, 0.12);
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const radius = 2.4;
      const barMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0xf59e0b,
        transparent: true,
        opacity: 0.85
      });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
      bar.lookAt(0, 0.5, 0);
      visualizerGroup.add(bar);
      visualizerBars.push(bar);
    }
    visualizerBarsRef.current = visualizerBars;
    coreGroup.add(visualizerGroup);
    scene.add(coreGroup);

    // ==========================================
    // 9. THE 7 PROCEDURAL 3D SCENE ACTS
    // ==========================================
    const scenesMap: { [key in SpatialSceneId]?: THREE.Group } = {};

    // ------------------------------------------
    // ACT 1: WAKE UP & COFFEE
    // ------------------------------------------
    const act1Group = new THREE.Group();
    act1Group.position.set(3.5, 0.2, 0);

    // Wireframe Coffee Cup
    const cupGeo = new THREE.CylinderGeometry(0.7, 0.5, 0.9, 24);
    const cupMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    act1Group.add(cup);

    // Saucer
    const saucerGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.08, 24);
    const saucerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
    const saucer = new THREE.Mesh(saucerGeo, saucerMat);
    saucer.position.y = -0.45;
    act1Group.add(saucer);

    // Cup Handle
    const handleGeo = new THREE.TorusGeometry(0.3, 0.06, 8, 24, Math.PI);
    const handle = new THREE.Mesh(handleGeo, cupMat);
    handle.position.set(0.7, 0.05, 0);
    handle.rotation.z = -Math.PI / 2;
    act1Group.add(handle);

    // Rising Steam Particles
    const steamCount = 20;
    const steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3] = (Math.random() - 0.5) * 0.4;
      steamPos[i * 3 + 1] = 0.5 + Math.random() * 1.5;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({
      size: 0.15,
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    });
    const steamPoints = new THREE.Points(steamGeo, steamMat);
    steamParticlesRef.current = steamPoints;
    act1Group.add(steamPoints);

    scene.add(act1Group);
    scenesMap['wake_up'] = act1Group;

    // ------------------------------------------
    // ACT 2: ONLINE STORE & FLYING ORDERS
    // ------------------------------------------
    const act2Group = new THREE.Group();
    const orderBoxes: THREE.Mesh[] = [];
    const boxGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x031826,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.9,
        wireframe: true
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(Math.cos(angle) * 4.5, Math.sin(i * 1.2) * 1.2, Math.sin(angle) * 4.5);
      act2Group.add(box);
      orderBoxes.push(box);
    }
    orderBoxesRef.current = orderBoxes;

    // Flying Trajectory Orbit Line
    const orbitCurve = new THREE.EllipseCurve(0, 0, 4.5, 4.5, 0, 2 * Math.PI, false, 0);
    const orbitPts = orbitCurve.getPoints(64).map(p => new THREE.Vector3(p.x, 0, p.y));
    const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitLineMat = new THREE.LineDashedMaterial({
      color: 0x00f0ff,
      dashSize: 0.4,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.5
    });
    const orbitLine = new THREE.Line(orbitLineGeo, orbitLineMat);
    orbitLine.computeLineDistances();
    act2Group.add(orbitLine);

    scene.add(act2Group);
    scenesMap['online_store'] = act2Group;

    // ------------------------------------------
    // ACT 3: AGENCY RISING TOWERS (Sites Climb like Towers)
    // ------------------------------------------
    const act3Group = new THREE.Group();
    act3Group.position.set(0, -2.8, 2.5);

    const towerData = [
      { name: 'عطية للمحاماة', height: 4.8, color: 0x10b981, x: -3.6 },
      { name: 'الملك للموبايلات', height: 6.2, color: 0x06b6d4, x: -1.2 },
      { name: 'رواسي للمقاولات', height: 5.4, color: 0xf59e0b, x: 1.2 },
      { name: 'تيتو ستوديو', height: 7.2, color: 0xa855f7, x: 3.6 }
    ];

    towerData.forEach(t => {
      const tGeo = new THREE.BoxGeometry(0.9, t.height, 0.9);
      const tMat = new THREE.MeshStandardMaterial({
        color: 0x031224,
        emissive: t.color,
        emissiveIntensity: 0.75,
        wireframe: false,
        transparent: true,
        opacity: 0.85
      });
      const towerMesh = new THREE.Mesh(tGeo, tMat);
      towerMesh.position.set(t.x, t.height / 2, 0);

      // Wireframe contour cage
      const wireGeo = new THREE.BoxGeometry(0.92, t.height + 0.02, 0.92);
      const wireMat = new THREE.MeshBasicMaterial({ color: t.color, wireframe: true });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      towerMesh.add(wireMesh);

      // Top beacon light
      const beaconGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = t.height / 2 + 0.15;
      towerMesh.add(beacon);

      act3Group.add(towerMesh);
    });

    scene.add(act3Group);
    scenesMap['agency_towers'] = act3Group;

    // ------------------------------------------
    // ACT 4: CONTENT CAROUSEL ARC (7 Days of Content)
    // ------------------------------------------
    const act4Group = new THREE.Group();
    const cardColors = [0x06b6d4, 0xa855f7, 0xf59e0b, 0x10b981, 0x3b82f6, 0xec4899, 0xeab308];
    for (let i = 0; i < 7; i++) {
      const angle = -Math.PI / 3 + (i / 6) * ((Math.PI * 2) / 3);
      const r = 4.8;
      const cardGeo = new THREE.PlaneGeometry(0.9, 1.4);
      const cardMat = new THREE.MeshBasicMaterial({
        color: cardColors[i],
        wireframe: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.position.set(Math.sin(angle) * r, 0.2 + Math.sin(i * 0.8) * 0.4, Math.cos(angle) * r);
      cardMesh.lookAt(0, 0.2, 0);
      act4Group.add(cardMesh);
    }
    scene.add(act4Group);
    scenesMap['content_carousel'] = act4Group;

    // ------------------------------------------
    // ACT 5: INBOX ENVELOPES & JUNK MELTING
    // ------------------------------------------
    const act5Group = new THREE.Group();
    const envGeo = new THREE.PlaneGeometry(0.8, 0.5);

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 2.8 + (i % 3) * 0.8;
      const isImportant = i % 3 === 0;
      const envMat = new THREE.MeshBasicMaterial({
        color: isImportant ? 0x10b981 : 0xec4899,
        wireframe: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isImportant ? 0.9 : 0.4
      });
      const envMesh = new THREE.Mesh(envGeo, envMat);
      envMesh.position.set(Math.cos(angle) * r, -0.5 + (i % 4) * 0.4, Math.sin(angle) * r);
      envMesh.lookAt(0, 0, 0);
      act5Group.add(envMesh);
    }

    // Junk Dissolve Sparkles
    const junkCount = 40;
    const junkGeo = new THREE.BufferGeometry();
    const junkPos = new Float32Array(junkCount * 3);
    for (let i = 0; i < junkCount; i++) {
      junkPos[i * 3] = (Math.random() - 0.5) * 5;
      junkPos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      junkPos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    junkGeo.setAttribute('position', new THREE.BufferAttribute(junkPos, 3));
    const junkMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xec4899,
      transparent: true,
      opacity: 0.6
    });
    const junkPoints = new THREE.Points(junkGeo, junkMat);
    junkParticlesRef.current = junkPoints;
    act5Group.add(junkPoints);

    scene.add(act5Group);
    scenesMap['inbox_filter'] = act5Group;

    // ------------------------------------------
    // ACT 6: LIVE PAGE BUILDER IN 3D
    // ------------------------------------------
    const act6Group = new THREE.Group();
    act6Group.position.set(3.2, 0.5, 0.5);

    // Browser Outer Wireframe Window
    const winGeo = new THREE.PlaneGeometry(3.6, 2.4);
    const winMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      side: THREE.DoubleSide
    });
    const winMesh = new THREE.Mesh(winGeo, winMat);
    act6Group.add(winMesh);

    // Header bar
    const barWireGeo = new THREE.PlaneGeometry(3.4, 0.3);
    const barWireMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true });
    const barWire = new THREE.Mesh(barWireGeo, barWireMat);
    barWire.position.set(0, 0.9, 0.05);
    act6Group.add(barWire);

    // Hero Block
    const heroWireGeo = new THREE.PlaneGeometry(3.4, 0.8);
    const heroWireMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });
    const heroWire = new THREE.Mesh(heroWireGeo, heroWireMat);
    heroWire.position.set(0, 0.25, 0.05);
    act6Group.add(heroWire);

    // 3 Product Grid Boxes
    for (let c = 0; c < 3; c++) {
      const colGeo = new THREE.PlaneGeometry(1.0, 0.6);
      const colMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(-1.1 + c * 1.1, -0.55, 0.05);
      act6Group.add(col);
    }
    act6Group.rotation.y = -Math.PI / 8;

    scene.add(act6Group);
    scenesMap['page_builder'] = act6Group;

    // ------------------------------------------
    // ACT 7: SOVEREIGN CORE SIGN OFF
    // ------------------------------------------
    const act7Group = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const ripGeo = new THREE.RingGeometry(3.0 + i * 1.8, 3.08 + i * 1.8, 64);
      const ripMat = new THREE.MeshBasicMaterial({
        color: 0xeab308,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5 - i * 0.12
      });
      const rip = new THREE.Mesh(ripGeo, ripMat);
      rip.rotation.x = Math.PI / 2;
      act7Group.add(rip);
    }
    scene.add(act7Group);
    scenesMap['sign_off'] = act7Group;

    sceneGroupsRef.current = scenesMap;

    // ==========================================
    // 10. ANIMATION TICK & RENDER LOOP
    // ==========================================
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 1. Core Orb Floating & Pulsing
      if (coreOrbRef.current) {
        const pulse = 1.0 + (isPlayingVoice ? Math.sin(elapsedTime * 8) * (0.08 + audioLevel * 0.15) : Math.sin(elapsedTime * 2) * 0.03);
        coreOrbRef.current.scale.set(pulse, pulse, pulse);
        coreOrbRef.current.rotation.y += 0.008;
      }

      // 2. Rings continuous rotation
      ring1.rotation.z += 0.012;
      ring2.rotation.x += 0.008;
      ring3.rotation.y += 0.006;

      // 3. Audio Visualizer Pulsing
      visualizerBarsRef.current.forEach((bar, idx) => {
        const freqWave = isPlayingVoice
          ? 0.5 + Math.sin(elapsedTime * 10 + idx * 0.35) * (0.5 + audioLevel * 1.5)
          : 0.2 + Math.sin(elapsedTime * 3 + idx * 0.2) * 0.15;
        bar.scale.y = Math.max(0.1, freqWave * 1.8);
      });

      // 4. Steam particles drift (Scene 1)
      if (steamParticlesRef.current) {
        const pos = steamParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < steamCount; i++) {
          pos[i * 3 + 1] += 0.01;
          if (pos[i * 3 + 1] > 2.0) pos[i * 3 + 1] = 0.5;
        }
        steamParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // 5. Order boxes flying orbit (Scene 2)
      orderBoxesRef.current.forEach((box, i) => {
        box.rotation.x += 0.02;
        box.rotation.y += 0.03;
        const curAngle = elapsedTime * 0.8 + (i / 8) * Math.PI * 2;
        box.position.x = Math.cos(curAngle) * 4.5;
        box.position.z = Math.sin(curAngle) * 4.5;
      });

      // 6. Camera Smooth Interpolation (Lerp to active scene target)
      camera.position.lerp(cameraTargetPos.current, 0.04);
      currentLookAt.current.lerp(cameraTargetLookAt.current, 0.04);
      camera.lookAt(currentLookAt.current);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update 3D Camera Targets & Scene Opacities based on activeSceneId
  useEffect(() => {
    // 1. Set Camera Target View for the current scene
    switch (activeSceneId) {
      case 'wake_up':
        cameraTargetPos.current.set(2.0, 2.2, 11);
        cameraTargetLookAt.current.set(1.5, 0.4, 0);
        break;
      case 'online_store':
        cameraTargetPos.current.set(0, 5.5, 15);
        cameraTargetLookAt.current.set(0, 0, 0);
        break;
      case 'agency_towers':
        cameraTargetPos.current.set(0, 1.2, 13);
        cameraTargetLookAt.current.set(0, 0.5, 2.5);
        break;
      case 'content_carousel':
        cameraTargetPos.current.set(0, 2.8, 12);
        cameraTargetLookAt.current.set(0, 0.2, 0);
        break;
      case 'inbox_filter':
        cameraTargetPos.current.set(-1.0, 2.5, 11);
        cameraTargetLookAt.current.set(0, 0, 0);
        break;
      case 'page_builder':
        cameraTargetPos.current.set(2.8, 1.8, 10.5);
        cameraTargetLookAt.current.set(2.0, 0.5, 0.5);
        break;
      case 'sign_off':
      default:
        cameraTargetPos.current.set(0, 3.0, 14);
        cameraTargetLookAt.current.set(0, 0, 0);
        break;
    }

    // 2. Adjust visibility / opacity of 3D Scene Groups
    const groups = sceneGroupsRef.current;
    if (groups) {
      Object.keys(groups).forEach(key => {
        const sceneKey = key as SpatialSceneId;
        const grp = groups[sceneKey];
        if (grp) {
          grp.visible = sceneKey === activeSceneId;
        }
      });
    }
  }, [activeSceneId]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[420px] md:h-[500px] rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#020617] shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col ${className}`}
    >
      {/* 1. 3D WebGL Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" 
      />

      {/* 2. Top Director HUD Bar */}
      <div className="relative z-10 w-full p-3 md:p-4 flex items-center justify-between pointer-events-none">
        
        {/* Left: Brand / System Badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#040b22]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-cyan-500/40 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div className="flex flex-col text-right font-['Cairo']">
            <span className="text-[11px] font-black tracking-wide text-cyan-200">
              JARVIS 3D SPATIAL THEATER
            </span>
            <span className="text-[9px] text-white/50">
              7 Live Scenes • Three.js Dynamic Engine
            </span>
          </div>
        </div>

        {/* Right: Controls (Tour Play/Pause, Mute, Fullscreen) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#040b22]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => setIsTourPlaying(!isTourPlaying)}
            className={`px-3 py-1 rounded-xl text-xs font-bold font-['Cairo'] flex items-center gap-1.5 transition-all ${
              isTourPlaying 
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="تشغيل الجولة السينمائية الكاملة للمشاهد السبعة"
          >
            {isTourPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isTourPlaying ? 'إيقاف الجولة' : 'جولة الـ 7 مشاهد'}</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-1.5 rounded-xl border transition-all ${
              isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-white/5 text-cyan-300 border-cyan-500/30'
            }`}
            title="كتم / تشغيل صوت السرد"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSelectScene('wake_up', true)}
            className="p-1.5 rounded-xl bg-white/5 text-white/70 hover:text-white border border-white/10"
            title="إعادة المشهد الأول"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Floating Holographic Scene Context Card (Bottom Center / Left) */}
      <div className="relative z-10 mt-auto p-3 md:p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-xl mx-auto md:mx-0 bg-[#03091e]/90 backdrop-blur-xl p-3.5 md:p-4 rounded-3xl border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-right font-['Cairo'] flex flex-col gap-2 transition-all">
          
          {/* Header Tag & Title */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{ 
                  backgroundColor: `${activeSceneMeta.color}25`,
                  color: activeSceneMeta.color,
                  border: `1px solid ${activeSceneMeta.color}60`
                }}
              >
                {activeSceneMeta.tag}
              </span>
              <span className="text-xs font-bold text-white/60">
                مشهد {SPATIAL_SCENES.findIndex(s => s.id === activeSceneId) + 1} من 7
              </span>
            </div>

            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                {activeSceneMeta.title}
              </h3>
              <div 
                className="p-1.5 rounded-xl"
                style={{ backgroundColor: `${activeSceneMeta.color}20`, color: activeSceneMeta.color }}
              >
                <activeSceneMeta.icon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Subtitle & Narration Script */}
          <p className="text-xs md:text-sm text-cyan-100/90 leading-relaxed font-medium">
            "{activeSceneMeta.script}"
          </p>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Three.js Spatial Hologram</span>
            </div>

            <div className="flex items-center gap-2">
              {activeSceneMeta.actionDeck && onActionClick && (
                <button
                  onClick={() => onActionClick(activeSceneMeta.actionDeck!)}
                  className="px-3 py-1 rounded-xl text-xs font-black bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{activeSceneMeta.actionText || 'فتح في المنظومة'}</span>
                </button>
              )}

              {onSpeakScript && (
                <button
                  onClick={() => onSpeakScript(activeSceneMeta.script)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center gap-1 transition-all"
                  title="نطق هذا المشهد بصوت جارفز"
                >
                  <Volume2 className="w-3 h-3 text-amber-300" />
                  <span>نطق</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom 7-Scene Interactive Switcher Bar */}
      <div className="relative z-10 w-full px-2 py-2 bg-[#020514]/95 border-t border-cyan-500/20 flex items-center justify-center gap-1 md:gap-2 overflow-x-auto select-none">
        {SPATIAL_SCENES.map((scene, idx) => {
          const isActive = scene.id === activeSceneId;
          const IconComp = scene.icon;

          return (
            <button
              key={scene.id}
              onClick={() => handleSelectScene(scene.id, true)}
              className={`px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 transition-all whitespace-nowrap text-right font-['Cairo'] text-xs font-bold ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105'
                  : 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: scene.color }}
              />
              <IconComp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{idx + 1}. {scene.tag}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default Jarvis3DSpatialTheater;