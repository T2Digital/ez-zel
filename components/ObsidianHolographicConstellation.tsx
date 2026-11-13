import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Sparkles, ExternalLink, Calendar, MessageSquare, ShieldCheck, Zap, Orbit, RefreshCw } from 'lucide-react';

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
  className?: string;
}

export const ObsidianHolographicConstellation: React.FC<ObsidianHolographicConstellationProps> = ({
  brands,
  selectedBrandId,
  onSelectBrand,
  onOpenStudio,
  onOpenStore,
  onOpenChat,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredNode, setHoveredNode] = useState<{
    brand: ConstellationBrandNode;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'studio' | 'agent' | 'medical' | 'automotive' | 'services'>('all');
  const [autoRotate, setAutoRotate] = useState(true);

  // 3D Camera / Orbit State
  const rotationRef = useRef({ x: 0.28, y: 0.45 });
  const targetRotationRef = useRef({ x: 0.28, y: 0.45 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);

  // Filtered nodes
  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const bType = (b.businessType || '').toLowerCase();
      if (activeFilter === 'studio') return String(b.sourceApp || '').includes('Tito Studio') || b.id.startsWith('clinic_') || b.id.startsWith('studio_');
      if (activeFilter === 'agent') return !b.id.startsWith('clinic_') && !b.id.startsWith('studio_');
      if (activeFilter === 'medical') return bType.includes('أسنان') || bType.includes('طب') || bType.includes('عياد');
      if (activeFilter === 'automotive') return bType.includes('سيار') || bType.includes('إيجار') || bType.includes('قطع');
      if (activeFilter === 'services') return bType.includes('نظاف') || bType.includes('شحن') || bType.includes('عقار');
      return true;
    });
  }, [brands, activeFilter]);

  // Pre-calculate 3D sphere positions for each brand node in concentric cyber-orbital rings
  const node3DPositions = useMemo(() => {
    const list = filteredBrands;
    const total = list.length;
    return list.map((brand, idx) => {
      // Golden Spiral distribution on sphere surface or concentric rings
      const phi = Math.acos(1 - 2 * (idx + 0.5) / Math.max(total, 1));
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;

      // Distribute in two spacious energy shells (radius 250 to 365)
      const isInner = idx % 2 === 0;
      const radius = isInner ? 250 : 365;

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

  // Interactive Drag & Mouse Controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setAutoRotate(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      targetRotationRef.current.y += dx * 0.007;
      targetRotationRef.current.x += dy * 0.007;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(0.65, Math.min(1.65, zoomRef.current - e.deltaY * 0.001));
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // 3D Holographic Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Energy packet photons traveling along filaments
    const photons = Array.from({ length: 48 }, (_, i) => ({
      nodeIdx: i % Math.max(node3DPositions.length, 1),
      progress: Math.random(),
      speed: 0.008 + Math.random() * 0.014,
      size: 1.8 + Math.random() * 1.6,
      color: i % 2 === 0 ? '#00f0ff' : '#10b981'
    }));

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

      // Smooth inertia rotation
      if (autoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.0025;
      }
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.1;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.1;

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      const fov = 620 * zoomRef.current;

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

      // 1. Draw Central Sovereign Core Rings (The Stark Second Brain Reactor)
      ctx.save();
      const coreRings = [
        { r: 42, color: 'rgba(0, 240, 255, 0.45)', dash: [6, 8], speed: 1.2 },
        { r: 75, color: 'rgba(168, 85, 247, 0.35)', dash: [12, 10], speed: -0.8 },
        { r: 110, color: 'rgba(56, 189, 248, 0.25)', dash: [4, 6], speed: 0.5 }
      ];

      coreRings.forEach(ring => {
        const ringStep = 32;
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
        ctx.lineWidth = 1.2;
        ctx.setLineDash(ring.dash);
        ctx.stroke();
      });

      // Core Hub Glow
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

      // Core Label
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.textAlign = 'center';
      ctx.fillText('SOVEREIGN SECOND BRAIN', centerProj.px, centerProj.py + 4);
      ctx.restore();

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

      // 3. Draw Fiber-Optic Energy Filaments to Central Core & Neighboring Nodes
      ctx.save();
      projectedNodes.forEach(node => {
        const center = project3D(0, 0, 0);

        ctx.beginPath();
        ctx.moveTo(center.px, center.py);
        ctx.lineTo(node.px, node.py);

        const filamentGrad = ctx.createLinearGradient(center.px, center.py, node.px, node.py);
        if (node.isSelected) {
          filamentGrad.addColorStop(0, 'rgba(0, 240, 255, 0.85)');
          filamentGrad.addColorStop(1, '#00f0ff');
          ctx.lineWidth = 2.4;
          ctx.setLineDash([]);
        } else {
          filamentGrad.addColorStop(0, 'rgba(0, 240, 255, 0.18)');
          filamentGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.22)');
          filamentGrad.addColorStop(1, 'rgba(56, 189, 248, 0.4)');
          ctx.lineWidth = Math.max(0.6, 1.2 * node.scale);
          ctx.setLineDash([4, 6]);
        }
        ctx.strokeStyle = filamentGrad;
        ctx.stroke();
      });
      ctx.restore();

      // 4. Draw Traveling Photons along lines
      ctx.save();
      photons.forEach(pt => {
        pt.progress = (pt.progress + pt.speed) % 1;
        const target = projectedNodes[pt.nodeIdx % projectedNodes.length];
        if (!target) return;

        const center = project3D(0, 0, 0);
        const curX = center.px + (target.px - center.px) * pt.progress;
        const curY = center.py + (target.py - center.py) * pt.progress;

        ctx.beginPath();
        ctx.arc(curX, curY, pt.size * (0.8 + pt.progress * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      });
      ctx.restore();

      // 5. Draw 3D Brand Nodes (Crystal Spheres with Rim Light)
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

        // Brand Name Label
        ctx.font = node.isSelected ? 'bold 11px Cairo, sans-serif' : '9.5px Cairo, sans-serif';
        ctx.fillStyle = node.isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.fillText(node.brand.name.slice(0, 18), node.px, node.py + radius + 14);

        // Subtitle badge
        ctx.font = '8px Cairo, sans-serif';
        ctx.fillStyle = node.isSelected ? '#00f0ff' : '#94a3b8';
        ctx.fillText(node.brand.businessType || 'نشاط رسمي', node.px, node.py + radius + 25);

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Mouse Move Hit-Testing for Floating HUD
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);
      const fov = 620 * zoomRef.current;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      for (const item of node3DPositions) {
        const x1 = item.x * cosY - item.z * sinY;
        const z1 = item.z * cosY + item.x * sinY;
        const y2 = item.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + item.y * sinX;
        const scale = fov / (520 + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;
        const r = 24 * scale;

        const dist = Math.hypot(mx - px, my - py);
        if (dist <= r) {
          onSelectBrand(item.brand.id || item.brand.slug || '');
          setHoveredNode({
            brand: item.brand,
            screenX: e.clientX,
            screenY: e.clientY
          });
          return;
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [node3DPositions, selectedBrandId, zoomRef, autoRotate, onSelectBrand]);

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[480px] rounded-3xl bg-[#01030d]/35 backdrop-blur-md border border-cyan-500/20 overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.08)] flex flex-col ${className}`}>
      {/* Futuristic Spatial Corner Reticles */}
      <span className="pointer-events-none absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-lg z-10" />
      <span className="pointer-events-none absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-lg z-10" />
      <span className="pointer-events-none absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/50 rounded-bl-lg z-10" />
      <span className="pointer-events-none absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/50 rounded-br-lg z-10" />

      {/* Top Filter and Controls Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-cyan-500/15 bg-black/20 backdrop-blur-md">
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
            تيتو ستوديو
          </button>
          <button
            onClick={() => setActiveFilter('agent')}
            className={`px-2 py-0.5 rounded-lg transition ${activeFilter === 'agent' ? 'bg-emerald-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            تيتو أجنت
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

        {/* Auto-Rotation Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded-xl border text-[10px] font-bold transition flex items-center gap-1 ${
            autoRotate
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              : 'bg-white/5 border-white/10 text-white/50'
          }`}
          title={autoRotate ? 'إيقاف الدوران التلقائي' : 'تشغيل الدوران التلقائي'}
        >
          <RefreshCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span className="hidden md:inline">{autoRotate ? 'دوران حي' : 'مثبت'}</span>
        </button>
      </div>

      {/* 3D WebGL / Canvas Space */}
      <canvas
        ref={canvasRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing"
      />

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
              <span className="font-bold text-cyan-300">{hoveredNode.brand.postsCount || 7} منشور</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-white/60">محادثات الواتساب:</span>
              <span className="font-bold text-emerald-400">{hoveredNode.brand.conversationsCount || 0} عميل</span>
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
      <div className="absolute bottom-2 left-4 pointer-events-none z-10 flex items-center gap-2 text-[9px] font-mono text-cyan-400/60 font-bold">
        <span>🖱️ اسحب للتدوير ثلاثي الأبعاد • اضغط لاختيار وتفعيل البراند</span>
      </div>
    </div>
  );
};

export default ObsidianHolographicConstellation;
