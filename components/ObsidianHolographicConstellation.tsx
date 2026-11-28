import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Sparkles, ExternalLink, Calendar, MessageSquare, ShieldCheck, Zap, Orbit, RefreshCw, Maximize2, Minimize2, X } from 'lucide-react';

export interface ConstellationBrandNode {
  id: string;
  slug?: string;
  name: string;
  businessType?: string;
  sourceApp?: string;
  phone?: string;
  primaryColor?: string;
  accentColor?: string;
  postsCount?: number;
  conversationsCount?: number;
  hasMeta?: boolean;
  hasWhatsApp?: boolean;
  isTrial?: boolean;
}

interface ObsidianHolographicConstellationProps {
  brands: ConstellationBrandNode[];
  selectedBrandId: string;
  onSelectBrand: (brandId: string) => void;
  onOpenStudio?: (brandId: string) => void;
  onOpenStore?: (slug: string) => void;
  onOpenChat?: (brandId: string) => void;
  centerCore?: React.ReactNode;
  className?: string;
  compact?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const ObsidianHolographicConstellation: React.FC<ObsidianHolographicConstellationProps> = ({
  brands,
  selectedBrandId,
  onSelectBrand,
  onOpenStudio,
  onOpenStore,
  onOpenChat,
  centerCore,
  className = '',
  compact = false,
  isFullscreen: controlledFullscreen,
  onToggleFullscreen
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreen = controlledFullscreen !== undefined ? controlledFullscreen : internalFullscreen;
  const toggleFullscreen = onToggleFullscreen || (() => setInternalFullscreen((prev) => !prev));

  const [hoveredNode, setHoveredNode] = useState<{
    brand: ConstellationBrandNode;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'studio' | 'agent' | 'factory' | 'medical' | 'automotive' | 'services'>('all');
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulseMode, setPulseMode] = useState<'ALL' | 'TX' | 'RX' | 'SYNC'>('ALL');
  const [liveTelemetrySummary, setLiveTelemetrySummary] = useState<string>('النبض الحي متصل بين النواة والركائز الثلاث (الاستوديو • الأجنت • المصنع) والبراندات النشطة');
  const burstMultiplierRef = useRef<number>(1);
  const realPulseMapRef = useRef<Record<string, { hasRx: boolean; hasSync: boolean; hasTx: boolean; lastEventAt: number }>>({});

  // Poll /api/telemetry/live every 12s for real live pulse status (scoped to selectedBrandId when active)
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const url = selectedBrandId
          ? `/api/telemetry/live?brandId=${encodeURIComponent(selectedBrandId)}`
          : '/api/telemetry/live';
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const events = Array.isArray(data?.latestEvents)
          ? data.latestEvents
          : Array.isArray(data?.recentEvents)
            ? data.recentEvents
            : [];
        const nextMap: Record<string, { hasRx: boolean; hasSync: boolean; hasTx: boolean; lastEventAt: number }> = {
          ...realPulseMapRef.current,
        };
        for (const ev of events) {
          const bId = String(ev?.brandId || '').trim();
          if (!bId) continue;
          const prev = nextMap[bId] || { hasRx: false, hasSync: false, hasTx: false, lastEventAt: 0 };
          const evType = String(ev?.eventType || ev?.source || '').toUpperCase();
          nextMap[bId] = {
            hasRx: prev.hasRx || /WHATSAPP|MESSAGE|BOOKING|ORDER|RX/.test(evType),
            hasSync: prev.hasSync || /STUDIO|META|SYNC|POST|CONTENT/.test(evType),
            hasTx: prev.hasTx || /TX|COMMAND|PUSH|STORE/.test(evType),
            lastEventAt: Math.max(prev.lastEventAt, ev?.timestamp ? new Date(ev.timestamp).getTime() : Date.now()),
          };
        }
        realPulseMapRef.current = nextMap;
        if (events.length > 0) {
          const latest = events[0];
          setLiveTelemetrySummary(
            `[${latest.brandId || 'T2OS'}] ${latest.source || 'T2OS'} ➔ ${latest.eventType || 'SYNC'}: ${latest.summary || 'نبضة حية'}`
          );
        } else if (selectedBrandId) {
          setLiveTelemetrySummary('لا توجد أحداث حية مسجلة لهذا البراند بعد (0 رسائل واتساب • 0 طلبات)');
        } else if (typeof data?.totalEvents === 'number') {
          setLiveTelemetrySummary(
            `النبض الحي متصل • ${data?.totalEvents || 0} حدث (${data?.whatsappMessages || 0} واتساب • ${data?.orders || 0} طلب • ${data?.bookings || 0} حجز)`
          );
        }
      } catch {}
    };
    poll();
    const timer = setInterval(poll, 12000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [selectedBrandId]);

  const triggerOpticalBurst = () => {
    burstMultiplierRef.current = 3.2;
    setLiveTelemetrySummary('⚡ تم إطلاق موجة فحص وتشخيص ضوئي (TX + RX + SYNC) عبر البراندات المتصلة');
    setTimeout(() => {
      burstMultiplierRef.current = 1;
    }, 3500);
  };

  // 3D Camera / Orbit State (360° multi-axis + momentum + pinch zoom + auto-resume orbit after manual drag)
  const rotationRef = useRef({ x: 0.28, y: 0.45 });
  const targetRotationRef = useRef({ x: 0.28, y: 0.45 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef<number | null>(null);
  const zoomRef = useRef(1.0);
  const userPausedRotateRef = useRef(false);
  const resumeRotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoRotateResume = () => {
    if (resumeRotateTimerRef.current) clearTimeout(resumeRotateTimerRef.current);
    resumeRotateTimerRef.current = setTimeout(() => {
      if (!userPausedRotateRef.current && !isDraggingRef.current) {
        setAutoRotate(true);
      }
    }, 1500);
  };

  // Filtered nodes
  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const bType = (b.businessType || '').toLowerCase();
      if (activeFilter === 'studio') return String(b.sourceApp || '').includes('Tito Studio') || b.id.startsWith('clinic_') || b.id.startsWith('studio_') || Boolean(b.hasMeta || (b.postsCount || 0) > 0);
      if (activeFilter === 'agent') return Boolean(b.hasWhatsApp || (b.conversationsCount || 0) > 0 || (!b.id.startsWith('clinic_') && !b.id.startsWith('studio_')));
      if (activeFilter === 'factory') return Boolean(b.slug || (!b.id.startsWith('clinic_') && !b.id.startsWith('studio_')));
      if (activeFilter === 'medical') return bType.includes('أسنان') || bType.includes('طب') || bType.includes('عياد');
      if (activeFilter === 'automotive') return bType.includes('سيار') || bType.includes('إيجار') || bType.includes('قطع');
      if (activeFilter === 'services') return bType.includes('نظاف') || bType.includes('شحن') || bType.includes('عقار');
      return true;
    });
  }, [brands, activeFilter]);

  // Pre-calculate 3D sphere positions for each brand node in concentric outer orbital shells well clear of Core & Pillars
  const node3DPositions = useMemo(() => {
    const list = filteredBrands;
    const total = list.length;
    return list.map((brand, idx) => {
      const phi = Math.acos(1 - 2 * (idx + 0.5) / Math.max(total, 1));
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;

      // Wide separation outside inner pillars (r = 192): brand shells at 290 and 400
      const isInner = idx % 2 === 0;
      const radius = isInner ? 290 : 400;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = (radius * 0.78) * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      return {
        brand,
        x,
        y,
        z,
        baseRadius: radius,
        phi,
        theta,
        color: brand.primaryColor || (isInner ? '#00f0ff' : '#a855f7'),
        glowColor: brand.accentColor || (isInner ? 'rgba(0, 240, 255, 0.45)' : 'rgba(168, 85, 247, 0.45)')
      };
    });
  }, [filteredBrands]);

  // Helper for 3D hit-testing both desktop click & mobile tap
  const pickBrandAtClientPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    const cosX = Math.cos(rotationRef.current.x);
    const sinX = Math.sin(rotationRef.current.x);
    const cosY = Math.cos(rotationRef.current.y);
    const sinY = Math.sin(rotationRef.current.y);
    const responsiveFovBase = canvas.width < 520
      ? Math.min(265, Math.max(205, canvas.width * 0.54))
      : Math.min(580, Math.max(320, Math.min(canvas.width, canvas.height) * 0.98));
    const fov = responsiveFovBase * zoomRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    let closestId = '';
    let closestDist = Infinity;
    for (const item of node3DPositions) {
      const x1 = item.x * cosY - item.z * sinY;
      const z1 = item.z * cosY + item.x * sinY;
      const y2 = item.y * cosX - z1 * sinX;
      const z2 = z1 * cosX + item.y * sinX;
      const scale = fov / (520 + z2);
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;
      const r = Math.max(26, 28 * scale);
      const dist = Math.hypot(mx - px, my - py);
      if (dist <= r && dist < closestDist) {
        closestDist = dist;
        closestId = item.brand.id || item.brand.slug || '';
      }
    }
    if (closestId) {
      onSelectBrand(closestId);
    }
  };

  // Interactive Mouse, Wheel & Full Mobile 360° Touch Rotation + Pinch Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (resumeRotateTimerRef.current) clearTimeout(resumeRotateTimerRef.current);
      isDraggingRef.current = true;
      didDragRef.current = false;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: 0, y: 0 };
      setAutoRotate(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const totalMoved = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
      if (totalMoved > 6) didDragRef.current = true;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      const vy = dx * 0.008;
      const vx = dy * 0.008;
      targetRotationRef.current.y += vy;
      targetRotationRef.current.x += vx;
      velocityRef.current = { x: vx, y: vy };
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      scheduleAutoRotateResume();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(0.6, Math.min(1.85, zoomRef.current - e.deltaY * 0.001));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (resumeRotateTimerRef.current) clearTimeout(resumeRotateTimerRef.current);
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        isDraggingRef.current = true;
        didDragRef.current = false;
        pinchDistRef.current = null;
        dragStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
        velocityRef.current = { x: 0, y: 0 };
        setAutoRotate(false);
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        didDragRef.current = true;
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchDistRef.current = d;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const touch = e.touches[0];
        const totalMoved = Math.hypot(touch.clientX - dragStartPosRef.current.x, touch.clientY - dragStartPosRef.current.y);
        if (totalMoved > 7) didDragRef.current = true;
        const dx = touch.clientX - lastMousePosRef.current.x;
        const dy = touch.clientY - lastMousePosRef.current.y;
        const vy = dx * 0.009;
        const vx = dy * 0.009;
        targetRotationRef.current.y += vy;
        targetRotationRef.current.x += vx;
        velocityRef.current = { x: vx, y: vy };
        lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
        e.preventDefault();
      } else if (e.touches.length === 2 && pinchDistRef.current !== null) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (pinchDistRef.current > 0) {
          zoomRef.current = Math.max(0.6, Math.min(1.85, zoomRef.current * (d / pinchDistRef.current)));
        }
        pinchDistRef.current = d;
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        const wasTap = !didDragRef.current;
        isDraggingRef.current = false;
        pinchDistRef.current = null;
        if (wasTap && e.changedTouches[0]) {
          pickBrandAtClientPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
        scheduleAutoRotateResume();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (resumeRotateTimerRef.current) clearTimeout(resumeRotateTimerRef.current);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [node3DPositions, onSelectBrand]);

  // 3D Holographic Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Core Sovereign Architecture Pillars in Inner Ring spaced cleanly away from JARVIS CORE
    const coreSystemPlanets = [
      { id: 'pillar_studio', label: 'الاستوديو', sub: 'المحتوى والإعلانات', angleOffset: 0, r: 192, color: '#a855f7', glow: 'rgba(168,85,247,0.65)', signalType: 'SYNC' as const },
      { id: 'pillar_agent', label: 'الأجنت', sub: 'الواتساب والمبيعات', angleOffset: (Math.PI * 2) / 3, r: 192, color: '#10b981', glow: 'rgba(16,185,129,0.65)', signalType: 'RX' as const },
      { id: 'pillar_factory', label: 'المصنع', sub: 'المتاجر والـ ERP', angleOffset: (Math.PI * 4) / 3, r: 192, color: '#00f0ff', glow: 'rgba(0,240,255,0.65)', signalType: 'TX' as const },
    ];

    const getBrandPillarIndices = (
      brand: ConstellationBrandNode,
      livePulse?: { hasRx?: boolean; hasSync?: boolean; hasTx?: boolean }
    ): number[] => {
      const indices: number[] = [];
      if (
        (brand.postsCount || 0) > 0 ||
        brand.hasMeta ||
        String(brand.sourceApp || '').includes('Studio') ||
        brand.id.startsWith('clinic_') ||
        brand.id.startsWith('studio_') ||
        livePulse?.hasSync
      ) {
        indices.push(0); // الاستوديو
      }
      if (brand.hasWhatsApp || (brand.conversationsCount || 0) > 0 || livePulse?.hasRx) {
        indices.push(1); // الأجنت
      }
      if (brand.slug || (!brand.id.startsWith('clinic_') && !brand.id.startsWith('studio_')) || livePulse?.hasTx) {
        indices.push(2); // المصنع
      }
      return indices.length > 0 ? indices : [2];
    };

    // Energy packet photons traveling along optical fiber conduits (TX -> المصنع, RX -> الأجنت, SYNC -> الاستوديو)
    const photons = Array.from({ length: 66 }, (_, i) => {
      const kind: 'TX' | 'RX' | 'SYNC' = i % 3 === 0 ? 'TX' : i % 3 === 1 ? 'RX' : 'SYNC';
      const color = kind === 'TX' ? '#00f0ff' : kind === 'RX' ? '#10b981' : '#a855f7';
      return {
        nodeIdx: i % Math.max(node3DPositions.length, 1),
        planetIdx: kind === 'SYNC' ? 0 : kind === 'RX' ? 1 : 2,
        kind,
        direction: kind === 'RX' ? -1 : 1, // RX travels from brand/agent INTO core; TX & SYNC propagate outward
        progress: Math.random(),
        speed: 0.007 + Math.random() * 0.012,
        size: 2.1 + Math.random() * 1.6,
        color
      };
    });

    const render = () => {
      t += 0.02;

      const rect = canvas.getBoundingClientRect();
      const rw = Math.round(rect.width);
      const rh = Math.round(rect.height);
      if (rw > 0 && rh > 0 && (canvas.width !== rw || canvas.height !== rh)) {
        canvas.width = rw;
        canvas.height = rh;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Smooth dynamic 360° multi-axis orbit + momentum decay
      if (autoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.0032;
        targetRotationRef.current.x = 0.22 + Math.sin(t * 0.24) * 0.28;
      } else if (!isDraggingRef.current) {
        targetRotationRef.current.y += velocityRef.current.y;
        targetRotationRef.current.x += velocityRef.current.x;
        velocityRef.current.x *= 0.93;
        velocityRef.current.y *= 0.93;
      }
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.1;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.1;

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      const responsiveFovBase = canvas.width < 520
        ? Math.min(265, Math.max(205, canvas.width * 0.54))
        : Math.min(580, Math.max(320, Math.min(canvas.width, canvas.height) * 0.98));
      const fov = responsiveFovBase * zoomRef.current;

      // 3D Point Projection Helper
      const project3D = (x: number, y: number, z: number) => {
        // Rotate around Y
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate around X
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const distance = 520;
        const scale = fov / (distance + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { px, py, scale, z: z2 };
      };

      // 1. Draw Central Sovereign Core Rings + Inner Architecture Orbit Ring (r = 192)
      ctx.save();
      const coreRings = [
        { r: 44, color: 'rgba(0, 240, 255, 0.45)', dash: [6, 8], speed: 1.2 },
        { r: 82, color: 'rgba(168, 85, 247, 0.35)', dash: [12, 10], speed: -0.8 },
        { r: 122, color: 'rgba(56, 189, 248, 0.25)', dash: [4, 6], speed: 0.5 },
        { r: 192, color: 'rgba(34, 211, 238, 0.26)', dash: [], speed: 0.2 }
      ];

      coreRings.forEach(ring => {
        const ringStep = 40;
        ctx.beginPath();
        for (let i = 0; i <= ringStep; i++) {
          const angle = (i / ringStep) * Math.PI * 2 + t * ring.speed * 0.2;
          const rx = Math.cos(angle) * ring.r;
          const rz = Math.sin(angle) * ring.r;
          const p = project3D(rx, 0, rz);
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.dash.length === 0 ? 1.5 : 1.2;
        ctx.setLineDash(ring.dash);
        ctx.stroke();
      });

      // Core Hub Glow & Label (only render canvas default core when no React centerCore is embedded)
      if (!centerCore) {
        const centerProj = project3D(0, 0, 0);
        const coreGrad = ctx.createRadialGradient(centerProj.px, centerProj.py, 4, centerProj.px, centerProj.py, 52 * centerProj.scale);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, '#00f0ff');
        coreGrad.addColorStop(0.65, 'rgba(37, 99, 235, 0.4)');
        coreGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerProj.px, centerProj.py, 52 * centerProj.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText('JARVIS CORE', centerProj.px, centerProj.py + 4);
      }
      ctx.restore();

      // 1B. Project & Draw Inner Sovereign Ecosystem Pillars (الاستوديو • الأجنت • المصنع)
      const projectedCorePlanets = coreSystemPlanets.map((pl) => {
        const angle = pl.angleOffset + t * 0.16;
        const px3d = Math.cos(angle) * pl.r;
        const pz3d = Math.sin(angle) * pl.r;
        const py3d = Math.sin(angle * 2) * 16;
        const p = project3D(px3d, py3d, pz3d);
        return { ...pl, px: p.px, py: p.py, scale: p.scale, z: p.z, x3d: px3d, y3d: py3d, z3d: pz3d };
      });

      const centerOrigin = project3D(0, 0, 0);
      projectedCorePlanets.forEach((pl, pIdx) => {
        ctx.save();
        // Dual-layer glowing energy conduit from JARVIS CORE to each sovereign pillar
        const conduitMidX = (centerOrigin.px + pl.px) / 2;
        const conduitMidY = (centerOrigin.py + pl.py) / 2 - 14 * pl.scale;
        ctx.setLineDash([]);

        // Soft outer energy sheath
        ctx.beginPath();
        ctx.moveTo(centerOrigin.px, centerOrigin.py);
        ctx.quadraticCurveTo(conduitMidX, conduitMidY, pl.px, pl.py);
        ctx.strokeStyle = pl.color;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = Math.max(4, 6.5 * pl.scale);
        ctx.stroke();

        // Sharp inner core beam
        ctx.beginPath();
        ctx.moveTo(centerOrigin.px, centerOrigin.py);
        ctx.quadraticCurveTo(conduitMidX, conduitMidY, pl.px, pl.py);
        ctx.strokeStyle = pl.color;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = Math.max(1.4, 2.2 * pl.scale);
        ctx.stroke();

        // Two bidirectional energy pulses flowing between Core & Pillar
        [0, 1].forEach((dirIdx) => {
          const rawProg = (t * (0.42 + dirIdx * 0.12) + pIdx * 0.33 + dirIdx * 0.5) % 1;
          const pt = dirIdx === 0 ? rawProg : 1 - rawProg;
          const inv = 1 - pt;
          const bx = inv * inv * centerOrigin.px + 2 * inv * pt * conduitMidX + pt * pt * pl.px;
          const by = inv * inv * centerOrigin.py + 2 * inv * pt * conduitMidY + pt * pt * pl.py;
          ctx.beginPath();
          ctx.arc(bx, by, 2.8 * pl.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.95;
          ctx.shadowColor = pl.color;
          ctx.shadowBlur = 10;
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Pillar Sphere (slightly larger & clearly distinct around Core)
        const pr = 21 * pl.scale;
        const pGrad = ctx.createRadialGradient(pl.px - pr * 0.3, pl.py - pr * 0.3, pr * 0.1, pl.px, pl.py, pr * 2.1);
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.35, pl.color);
        pGrad.addColorStop(1, 'rgba(2,6,23,0.12)');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(pl.px, pl.py, pr, 0, Math.PI * 2);
        ctx.fill();

        // Orbital ring around pillar
        ctx.beginPath();
        ctx.ellipse(pl.px, pl.py, pr * 1.75, pr * 0.68, 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = pl.color;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Clean Pillar Label + Role Subtitle
        ctx.font = 'bold 12px Cairo, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(pl.label, pl.px, pl.py - pr - 8);
        if (pl.scale > 0.45) {
          ctx.font = 'bold 9px Cairo, sans-serif';
          ctx.fillStyle = pl.color;
          ctx.fillText(pl.sub, pl.px, pl.py + pr + 13);
        }
        ctx.restore();
      });

      // 2. Project Nodes and Sort by Z-depth
      const projectedNodes = node3DPositions.map((item, idx) => {
        const p = project3D(item.x, item.y, item.z);
        const isSelected = item.brand.id === selectedBrandId || item.brand.slug === selectedBrandId;
        return {
          ...item,
          idx,
          px: p.px,
          py: p.py,
          scale: p.scale,
          z: p.z,
          isSelected
        };
      });

      // Sort back-to-front for proper depth occlusion
      projectedNodes.sort((a, b) => b.z - a.z);

      // 3. Draw Realistic Architectural Curved Energy Conduits (Pillar ⇄ Brand Active Channels + Direct Core Beam for Selected Brand)
      ctx.save();
      projectedNodes.forEach((node) => {
        const livePulse = realPulseMapRef.current[node.brand.id] || realPulseMapRef.current[node.brand.slug || ''];
        const activePillarIndices = getBrandPillarIndices(node.brand, livePulse);
        const drawTargetIndices = node.isSelected ? activePillarIndices : activePillarIndices.slice(0, 2);
        const depthAlpha = Math.max(0.12, Math.min(0.42, (node.scale - 0.35) * 0.55));

        if (node.isSelected) {
          // Direct Luminous Executive Command Beam from JARVIS CORE straight to selected brand
          const coreMidX = (centerOrigin.px + node.px) / 2;
          const coreMidY = (centerOrigin.py + node.py) / 2 - 28 * node.scale;
          ctx.beginPath();
          ctx.moveTo(centerOrigin.px, centerOrigin.py);
          ctx.quadraticCurveTo(coreMidX, coreMidY, node.px, node.py);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
          ctx.lineWidth = 2.6;
          ctx.globalAlpha = 0.92;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.setLineDash([]);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        drawTargetIndices.forEach((pillarIdx, arcOffset) => {
          const hubPlanet = projectedCorePlanets[pillarIdx] || centerOrigin;
          const curveLift = (22 + arcOffset * 10) * node.scale;
          const midX = (hubPlanet.px + node.px) / 2;
          const midY = (hubPlanet.py + node.py) / 2 - curveLift;

          ctx.beginPath();
          ctx.moveTo(hubPlanet.px, hubPlanet.py);
          ctx.quadraticCurveTo(midX, midY, node.px, node.py);

          const hubColor: string = typeof (hubPlanet as any).color === 'string' ? (hubPlanet as any).color : '#00f0ff';
          const filamentGrad = ctx.createLinearGradient(hubPlanet.px, hubPlanet.py, node.px, node.py);
          filamentGrad.addColorStop(0, hubColor);
          filamentGrad.addColorStop(1, node.isSelected ? '#ffffff' : node.color);

          ctx.strokeStyle = filamentGrad;
          ctx.setLineDash([]);
          ctx.globalAlpha = node.isSelected ? 0.85 : depthAlpha;
          ctx.lineWidth = node.isSelected ? 2.1 : Math.max(0.75, 1.25 * node.scale);
          ctx.stroke();
        });
      });
      ctx.restore();

      // 4. Draw Color-Coded Optical Fiber Photons ONLY along active brand channels (SYNC->الاستوديو, RX->الأجنت, TX->المصنع)
      ctx.save();
      photons.forEach(pt => {
        if (pulseMode !== 'ALL' && pt.kind !== pulseMode) return;
        const target = projectedNodes[pt.nodeIdx % Math.max(projectedNodes.length, 1)];
        if (!target) return;

        const livePulse = realPulseMapRef.current[target.brand.id] || realPulseMapRef.current[target.brand.slug || ''];
        const hasRealSignal =
          burstMultiplierRef.current > 1.2 ||
          target.isSelected ||
          (pt.kind === 'RX' && Boolean(target.brand.hasWhatsApp || (target.brand.conversationsCount || 0) > 0 || livePulse?.hasRx)) ||
          (pt.kind === 'SYNC' && Boolean((target.brand.postsCount || 0) > 0 || target.brand.hasMeta || livePulse?.hasSync)) ||
          (pt.kind === 'TX' && Boolean(livePulse?.hasTx || target.brand.hasWhatsApp || (target.brand.postsCount || 0) > 0));
        if (!hasRealSignal) return;

        pt.progress = (pt.progress + pt.speed * burstMultiplierRef.current) % 1;

        const hubPlanet = projectedCorePlanets[pt.planetIdx] || centerOrigin;
        const effectiveT = pt.direction === -1 ? 1 - pt.progress : pt.progress;
        const midX = (hubPlanet.px + target.px) / 2;
        const midY = (hubPlanet.py + target.py) / 2 - 22 * target.scale;

        // Quadratic Bezier interpolation along the optical fiber curve
        const invT = 1 - effectiveT;
        const curX = invT * invT * hubPlanet.px + 2 * invT * effectiveT * midX + effectiveT * effectiveT * target.px;
        const curY = invT * invT * hubPlanet.py + 2 * invT * effectiveT * midY + effectiveT * effectiveT * target.py;

        ctx.beginPath();
        ctx.arc(curX, curY, pt.size * (0.85 + effectiveT * 0.45) * (burstMultiplierRef.current > 1 ? 1.25 : 1), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 11;
        ctx.fill();
      });
      ctx.restore();

      // 5. Draw 3D Brand Nodes (Crystal Spheres with Rim Light & Zero Label Overlap)
      const drawnLabelBoxes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
      projectedNodes.forEach(node => {
        const radius = (node.isSelected ? 16 : 10) * node.scale;

        ctx.save();

        // Node Glow Halo
        const glowGrad = ctx.createRadialGradient(node.px, node.py, radius * 0.3, node.px, node.py, radius * 2.4);
        glowGrad.addColorStop(0, node.isSelected ? 'rgba(0, 240, 255, 0.65)' : 'rgba(56, 189, 248, 0.35)');
        glowGrad.addColorStop(0.5, node.isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(168, 85, 247, 0.15)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Node Core Sphere
        const sphereGrad = ctx.createRadialGradient(
          node.px - radius * 0.3,
          node.py - radius * 0.3,
          radius * 0.1,
          node.px,
          node.py,
          radius
        );
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.3, node.isSelected ? '#00f0ff' : '#38bdf8');
        sphereGrad.addColorStop(0.75, node.isSelected ? '#0284c7' : '#1e3a8a');
        sphereGrad.addColorStop(1, '#020617');

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Rim Light
        ctx.strokeStyle = node.isSelected ? '#00f0ff' : 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = node.isSelected ? 2.5 : 1.2;
        ctx.shadowColor = node.isSelected ? '#00f0ff' : '#38bdf8';
        ctx.shadowBlur = node.isSelected ? 16 : 6;
        ctx.stroke();

        // Pulsing Targeting Reticle for Selected Node
        if (node.isSelected) {
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius * 1.8 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
        }

        // Brand Name Label with Screen-Space Collision Avoidance (compact spacing on narrow mobile screens)
        const isCompactCanvas = canvas.width < 520;
        const halfW = isCompactCanvas ? 64 : 48;
        const lx1 = node.px - halfW;
        const lx2 = node.px + halfW;
        const ly1 = node.py + radius + 2;
        const ly2 = node.py + radius + (isCompactCanvas ? 34 : 28);
        const overlapsExisting = !node.isSelected && drawnLabelBoxes.some(
          (b) => lx1 < b.x2 && lx2 > b.x1 && ly1 < b.y2 && ly2 > b.y1
        );

        if (!overlapsExisting && (node.isSelected || node.scale > (isCompactCanvas ? 0.72 : 0.55))) {
          drawnLabelBoxes.push({ x1: lx1, y1: ly1, x2: lx2, y2: ly2 });
          ctx.font = node.isSelected ? 'bold 11px Cairo, sans-serif' : (isCompactCanvas ? '9px Cairo, sans-serif' : '9.5px Cairo, sans-serif');
          ctx.fillStyle = node.isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.88)';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 5;
          const rawName = String(node.brand.name || '').trim();
          const safeName = /^\d{6,}$/.test(rawName)
            ? (node.brand.slug || node.brand.businessType || 'براند نشط')
            : rawName;
          const clampedX = Math.max(halfW + 6, Math.min(canvas.width - (halfW + 6), node.px));
          ctx.fillText(safeName.slice(0, isCompactCanvas ? 13 : 18), clampedX, node.py + radius + 14);

          if (!isCompactCanvas || node.isSelected) {
            ctx.font = '8px Cairo, sans-serif';
            ctx.fillStyle = node.isSelected ? '#00f0ff' : '#94a3b8';
            ctx.fillText(node.brand.businessType || 'نشاط رسمي', clampedX, node.py + radius + 25);
          }
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Mouse Click Hit-Testing (skips clicks immediately following a 3D drag)
    const handleCanvasClick = (e: MouseEvent) => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      pickBrandAtClientPoint(e.clientX, e.clientY);
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [node3DPositions, selectedBrandId, zoomRef, autoRotate, pulseMode, onSelectBrand]);

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-[140] w-screen h-[100dvh] rounded-none border-0 bg-[#020614]/75 backdrop-blur-[2px]'
          : `relative w-full h-full ${compact ? 'min-h-0' : 'min-h-[380px] sm:min-h-[460px]'} rounded-3xl bg-[#020614]/45 backdrop-blur-[1.5px] border border-cyan-500/25`
      } overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.08)] flex flex-col ${className}`}
    >
      {/* Futuristic Spatial Corner Reticles */}
      <span className="pointer-events-none absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-lg z-10" />
      <span className="pointer-events-none absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-lg z-10" />
      <span className="pointer-events-none absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/50 rounded-bl-lg z-10" />
      <span className="pointer-events-none absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/50 rounded-br-lg z-10" />

      {/* Top Filter and Controls Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-cyan-500/15 bg-black/25 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-black text-cyan-300 flex items-center gap-1 font-['Cairo']">
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
            الشبكة العصبية الهولوغرامية ثلاثية الأبعاد (2026 3D Constellation)
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            {filteredBrands.length} NODES
          </span>
        </div>

        {/* Sector Filters */}
        <div className="hidden sm:flex items-center gap-1 bg-[#03091e] p-1 rounded-xl border border-white/10 text-[9px] font-bold font-['Cairo']">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-0.5 rounded-lg transition ${activeFilter === 'all' ? 'bg-cyan-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            الكل
          </button>
          <button
            onClick={() => setActiveFilter('studio')}
            className={`px-2 py-0.5 rounded-lg transition ${activeFilter === 'studio' ? 'bg-fuchsia-500 text-white font-black' : 'text-white/60 hover:text-white'}`}
          >
            الاستوديو
          </button>
          <button
            onClick={() => setActiveFilter('agent')}
            className={`px-2 py-0.5 rounded-lg transition ${activeFilter === 'agent' ? 'bg-emerald-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            الأجنت
          </button>
          <button
            onClick={() => setActiveFilter('factory')}
            className={`px-2 py-0.5 rounded-lg transition ${activeFilter === 'factory' ? 'bg-cyan-400 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            المصنع
          </button>
          <button
            onClick={() => setActiveFilter('medical')}
            className={`px-2 py-0.5 rounded-lg transition ${activeFilter === 'medical' ? 'bg-blue-500 text-white font-black' : 'text-white/60 hover:text-white'}`}
          >
            عيادات
          </button>
          <button
            onClick={() => setActiveFilter('automotive')}
            className={`px-2 py-0.5 rounded-lg transition ${activeFilter === 'automotive' ? 'bg-amber-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            سيارات
          </button>
          <button
            onClick={() => setActiveFilter('services')}
            className={`px-2 py-0.5 rounded-lg transition ${activeFilter === 'services' ? 'bg-teal-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            خدمات
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Auto-Rotation Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !autoRotate;
              userPausedRotateRef.current = !next;
              setAutoRotate(next);
            }}
            className={`p-1.5 rounded-xl border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              autoRotate
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
            title={autoRotate ? 'إيقاف الدوران التلقائي' : 'تشغيل الدوران التلقائي'}
          >
            <RefreshCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="hidden md:inline">{autoRotate ? 'دوران 360°' : 'مثبت'}</span>
          </button>

          {/* Fullscreen 360° Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 px-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 text-[10px] font-black transition flex items-center gap-1 cursor-pointer"
            title={isFullscreen ? 'تصغير الشبكة' : 'ملء الشاشة 360° للنواة والشبكة'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
          </button>

          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="إغلاق وضع ملء الشاشة"
              className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3D WebGL / Canvas Space + Exact Centered Core Wrapper */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ touchAction: 'none' }}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* Integrated Jarvis Luminescent Core inside Exact Canvas Center */}
        {centerCore && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
            <div className={`pointer-events-auto drop-shadow-[0_0_35px_rgba(0,240,255,0.45)] transition-transform ${
              isFullscreen ? 'scale-[0.85] sm:scale-100' : 'scale-[0.65] sm:scale-[0.75]'
            }`}>
              {centerCore}
            </div>
          </div>
        )}
      </div>

      {/* Floating Stark Holographic HUD Details Popover */}
      {hoveredNode && (
        <div
          className="absolute z-20 bottom-3 right-3 max-w-sm p-3.5 rounded-2xl bg-[#02071a]/95 border border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.35)] backdrop-blur-xl font-['Cairo'] text-right animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {hoveredNode.brand.name}
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
              {hoveredNode.brand.businessType || 'نشاط تجاري'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2.5 text-[10px]">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-white/60">منشورات الاستوديو:</span>
              <span className="font-bold text-cyan-300">{hoveredNode.brand.postsCount ?? 0} منشور</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-white/60">محادثات الواتساب:</span>
              <span className={`font-bold ${hoveredNode.brand.hasWhatsApp ? 'text-emerald-400' : 'text-amber-300'}`}>
                {hoveredNode.brand.hasWhatsApp ? `${hoveredNode.brand.conversationsCount ?? 0} رسالة` : 'غير مربوط'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => onSelectBrand(hoveredNode.brand.id || hoveredNode.brand.slug || '')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-[10px] shadow-md transition flex items-center justify-center gap-1"
            >
              <Zap className="w-3 h-3" />
              تفعيل هذا البراند
            </button>
            {onOpenStore && (
              <button
                onClick={() => onOpenStore(hoveredNode.brand.slug || hoveredNode.brand.id)}
                className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition flex items-center gap-1"
                title="فتح تطبيق المتجر PWA"
              >
                <ExternalLink className="w-3 h-3" />
                المتجر
              </button>
            )}
            <button
              onClick={() => setHoveredNode(null)}
              className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[10px]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="absolute bottom-2 left-4 pointer-events-none z-10 flex items-center gap-2 text-[9px] font-mono text-cyan-400/75 font-bold">
        <span>🖱️/👆 اسحب 360° للتدوير • قرص للتكبير • اضغط لتحديد البراند</span>
      </div>
    </div>
  );
};

export default ObsidianHolographicConstellation;
