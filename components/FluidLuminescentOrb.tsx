import React, { useRef, useEffect } from 'react';

interface FluidLuminescentOrbProps {
  isListening: boolean;
  isPlayingVoice: boolean;
  isThinking?: boolean;
  audioLevel?: number; // 0.0 to 1.0
  size?: number;
  className?: string;
}

export const FluidLuminescentOrb: React.FC<FluidLuminescentOrbProps> = ({
  isListening,
  isPlayingVoice,
  isThinking = false,
  audioLevel = 0,
  size = 280,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    // 1. Fiber-optic neural light filaments radiating through the Blue-Black matrix
    const fiberStrands = Array.from({ length: 36 }, (_, idx) => ({
      baseAngle: (idx / 36) * Math.PI * 2,
      curveBias: (Math.random() - 0.5) * 0.45,
      lengthFactor: 0.68 + (idx % 3) * 0.14,
      pulseOffset: Math.random() * Math.PI * 2,
      pulseSpeed: 1.4 + Math.random() * 1.8,
      width: idx % 3 === 0 ? 1.8 : 1.0
    }));

    // 2. Bioluminescent quantum droplets orbiting inside the liquid water core
    const particles = Array.from({ length: 24 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 8 + Math.random() * 38,
      speed: (0.012 + Math.random() * 0.024) * (Math.random() > 0.5 ? 1 : -1),
      radius: 1.2 + Math.random() * 2.4,
      alpha: 0.4 + Math.random() * 0.6,
      hueOffset: Math.random() * 60
    }));

    // 3. Concentric acoustic fiber-optic ripples
    const ripples: { r: number; alpha: number }[] = [];
    let lastRippleTime = 0;

    const render = (now: number) => {
      t += 0.032;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Current responsive energy boost
      const responsiveBoost = isPlayingVoice
        ? Math.max(audioLevel, 0.5 + Math.sin(t * 3.4) * 0.26)
        : isListening
        ? 0.45 + Math.sin(t * 2.8) * 0.2
        : isThinking
        ? 0.55 + Math.sin(t * 5.0) * 0.22
        : 0.14 + Math.sin(t * 0.9) * 0.05;

      // Base radius of the liquid water droplet
      const baseRadius = (size * 0.21) + responsiveBoost * (size * 0.085);

      // ========================================================
      // 0. DEEP BLUE-BLACK ABYSS CONTRAST DISC (For Fiber-Optic Pop)
      // ========================================================
      ctx.save();
      const abyssRadius = size * 0.47;
      const abyssGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, abyssRadius);
      abyssGrad.addColorStop(0, '#01030b');
      abyssGrad.addColorStop(0.65, 'rgba(2, 6, 20, 0.92)');
      abyssGrad.addColorStop(0.88, 'rgba(3, 10, 32, 0.55)');
      abyssGrad.addColorStop(1, 'rgba(1, 3, 10, 0)');
      ctx.fillStyle = abyssGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, abyssRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ========================================================
      // 1. FIBER-OPTIC NEURAL FILAMENTS & PHOTON PULSES (الألياف الضوئية)
      // ========================================================
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      fiberStrands.forEach((strand, idx) => {
        const dynamicAngle = strand.baseAngle + Math.sin(t * 0.7 + idx) * 0.04;
        const innerR = baseRadius * 0.72;
        const outerR = baseRadius * (1.28 + strand.lengthFactor * (0.45 + responsiveBoost * 0.38));

        const x0 = cx + Math.cos(dynamicAngle) * innerR;
        const y0 = cy + Math.sin(dynamicAngle) * innerR;

        const ctrlAngle = dynamicAngle + strand.curveBias * Math.sin(t * 1.1 + strand.pulseOffset);
        const ctrlR = (innerR + outerR) * 0.54;
        const ctrlX = cx + Math.cos(ctrlAngle) * ctrlR;
        const ctrlY = cy + Math.sin(ctrlAngle) * ctrlR;

        const x1 = cx + Math.cos(dynamicAngle) * outerR;
        const y1 = cy + Math.sin(dynamicAngle) * outerR;

        const strandGrad = ctx.createLinearGradient(x0, y0, x1, y1);
        if (isPlayingVoice) {
          strandGrad.addColorStop(0, 'rgba(52, 211, 153, 0.95)');
          strandGrad.addColorStop(0.55, 'rgba(16, 185, 129, 0.65)');
          strandGrad.addColorStop(1, 'rgba(251, 191, 36, 0.15)');
        } else if (isListening) {
          strandGrad.addColorStop(0, 'rgba(0, 240, 255, 0.95)');
          strandGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.55)');
          strandGrad.addColorStop(1, 'rgba(14, 165, 233, 0.05)');
        } else if (isThinking) {
          strandGrad.addColorStop(0, 'rgba(217, 70, 239, 0.95)');
          strandGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.65)');
          strandGrad.addColorStop(1, 'rgba(124, 58, 237, 0.15)');
        } else {
          strandGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
          strandGrad.addColorStop(0.65, 'rgba(30, 64, 175, 0.25)');
          strandGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        }

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(ctrlX, ctrlY, x1, y1);
        ctx.strokeStyle = strandGrad;
        ctx.lineWidth = strand.width;
        ctx.stroke();

        // Traveling Photon Pulse along the Fiber-Optic Filament
        const pulseProgress = ((t * strand.pulseSpeed + strand.pulseOffset) % (Math.PI * 2)) / (Math.PI * 2);
        const invT = 1 - pulseProgress;
        const px = invT * invT * x0 + 2 * invT * pulseProgress * ctrlX + pulseProgress * pulseProgress * x1;
        const py = invT * invT * y0 + 2 * invT * pulseProgress * ctrlY + pulseProgress * pulseProgress * y1;

        ctx.beginPath();
        ctx.arc(px, py, isPlayingVoice ? 2.4 : 1.7, 0, Math.PI * 2);
        ctx.fillStyle = isPlayingVoice
          ? (idx % 2 === 0 ? '#00f0ff' : '#f0abfc')
          : '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.fill();
      });
      ctx.restore();

      // ========================================================
      // 2. ACOUSTIC WATER RIPPLES (When Listening or Speaking)
      // ========================================================
      if (isListening || isPlayingVoice) {
        if (now - lastRippleTime > (isListening ? 340 : 230)) {
          ripples.push({ r: baseRadius * 0.92, alpha: isListening ? 0.85 : 0.78 });
          lastRippleTime = now;
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += isListening ? 1.35 : 1.75;
        rp.alpha *= 0.965;

        if (rp.alpha < 0.02 || rp.r > size * 0.47) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = isListening
          ? `rgba(0, 240, 255, ${rp.alpha})`
          : `rgba(56, 189, 248, ${rp.alpha * 0.9})`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 7]);
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      }

      // ========================================================
      // 3. OUTER BIOLUMINESCENT FIBER-OPTIC HALO
      // ========================================================
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const haloRadius = baseRadius * (1.55 + responsiveBoost * 0.48);
      const haloGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.25, cx, cy, haloRadius);

      if (isPlayingVoice) {
        haloGrad.addColorStop(0, 'rgba(52, 211, 153, 0.55)');
        haloGrad.addColorStop(0.45, 'rgba(16, 185, 129, 0.32)');
        haloGrad.addColorStop(0.75, 'rgba(251, 191, 36, 0.16)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (isListening) {
        haloGrad.addColorStop(0, 'rgba(0, 240, 255, 0.52)');
        haloGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.28)');
        haloGrad.addColorStop(0.75, 'rgba(14, 165, 233, 0.12)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (isThinking) {
        haloGrad.addColorStop(0, 'rgba(217, 70, 239, 0.55)');
        haloGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.32)');
        haloGrad.addColorStop(0.75, 'rgba(124, 58, 237, 0.14)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        haloGrad.addColorStop(0, 'rgba(0, 240, 255, 0.26)');
        haloGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.14)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ========================================================
      // 4. ORGANIC 3D LIQUID WATER DROPLET (Fluid Harmonic Surface)
      // ========================================================
      const pointsCount = 56;
      const step = (Math.PI * 2) / pointsCount;
      const pts: { x: number; y: number }[] = [];

      for (let i = 0; i < pointsCount; i++) {
        const theta = i * step;

        // Multi-frequency harmonic liquid water perturbations
        const wave1 = Math.sin(theta * 3 + t * 2.3) * (3.2 + responsiveBoost * 6.2);
        const wave2 = Math.cos(theta * 5 - t * 3.2) * (1.8 + responsiveBoost * 4.2);
        const wave3 = Math.sin(theta * 2 + t * 1.6) * (2.4 + responsiveBoost * 3.2);
        const r = baseRadius + wave1 + wave2 + wave3;

        pts.push({
          x: cx + Math.cos(theta) * r,
          y: cy + Math.sin(theta) * r
        });
      }

      // Draw smooth liquid water droplet perimeter
      ctx.save();
      ctx.beginPath();
      ctx.moveTo((pts[0].x + pts[pointsCount - 1].x) / 2, (pts[0].y + pts[pointsCount - 1].y) / 2);
      for (let i = 0; i < pointsCount; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pointsCount];
        ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      }
      ctx.closePath();

      // Blue-Black & Bioluminescent Fiber-Optic Water Core Gradient
      const sphereGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.24,
        cy - baseRadius * 0.26,
        baseRadius * 0.06,
        cx,
        cy,
        baseRadius * 1.12
      );

      if (isPlayingVoice) {
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.2, '#34d399');
        sphereGrad.addColorStop(0.48, '#10b981');
        sphereGrad.addColorStop(0.76, '#047857');
        sphereGrad.addColorStop(0.92, '#022c22');
        sphereGrad.addColorStop(1, '#01030a');
      } else if (isListening) {
        sphereGrad.addColorStop(0, '#ecfeff');
        sphereGrad.addColorStop(0.2, '#00f0ff');
        sphereGrad.addColorStop(0.5, '#0284c7');
        sphereGrad.addColorStop(0.8, '#082f49');
        sphereGrad.addColorStop(1, '#01030a');
      } else if (isThinking) {
        sphereGrad.addColorStop(0, '#fffbeb');
        sphereGrad.addColorStop(0.22, '#f59e0b');
        sphereGrad.addColorStop(0.52, '#d946ef');
        sphereGrad.addColorStop(0.78, '#7c3aed');
        sphereGrad.addColorStop(0.92, '#2e1065');
        sphereGrad.addColorStop(1, '#01030a');
      } else {
        sphereGrad.addColorStop(0, '#cffafe');
        sphereGrad.addColorStop(0.22, '#00f0ff');
        sphereGrad.addColorStop(0.55, '#0369a1');
        sphereGrad.addColorStop(0.84, '#020b24');
        sphereGrad.addColorStop(1, '#01030a');
      }

      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Ultra-Crisp Fiber-Optic Rim Illumination
      ctx.strokeStyle = isPlayingVoice
        ? 'rgba(52, 211, 153, 0.98)'
        : isListening
        ? 'rgba(0, 240, 255, 0.98)'
        : isThinking
        ? 'rgba(217, 70, 239, 0.98)'
        : 'rgba(0, 240, 255, 0.72)';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = isPlayingVoice
        ? '#10b981'
        : isListening
        ? '#00f0ff'
        : isThinking
        ? '#d946ef'
        : '#00f0ff';
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.restore();

      // ========================================================
      // 5. INTERNAL FIBER-OPTIC CAUSTIC MESH & QUANTUM DROPLETS
      // ========================================================
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      particles.forEach((p, idx) => {
        p.angle += p.speed * (isPlayingVoice ? 2.1 : 1.0);
        const px = cx + Math.cos(p.angle) * (p.dist * (baseRadius / 58));
        const py = cy + Math.sin(p.angle) * (p.dist * (baseRadius / 58));

        // Connect neighboring internal quantum droplets with subtle fiber-optic threads
        const nextP = particles[(idx + 1) % particles.length];
        const nx = cx + Math.cos(nextP.angle) * (nextP.dist * (baseRadius / 58));
        const ny = cy + Math.sin(nextP.angle) * (nextP.dist * (baseRadius / 58));
        const distSq = (px - nx) * (px - nx) + (py - ny) * (py - ny);
        if (distSq < 1200) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(nx, ny);
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.22 * p.alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isPlayingVoice
          ? `rgba(255, 255, 255, ${p.alpha * 0.95})`
          : `rgba(165, 243, 252, ${p.alpha * 0.85})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fill();
      });
      ctx.restore();

      // ========================================================
      // 6. 3D WATER DROPLET SPECULAR REFRACTION HIGHLIGHT
      // ========================================================
      ctx.save();
      const specGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.34,
        cy - baseRadius * 0.38,
        1.5,
        cx - baseRadius * 0.28,
        cy - baseRadius * 0.32,
        baseRadius * 0.44
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      specGrad.addColorStop(0.38, 'rgba(186, 230, 253, 0.32)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.ellipse(
        cx - baseRadius * 0.31,
        cy - baseRadius * 0.36,
        baseRadius * 0.31,
        baseRadius * 0.15,
        -Math.PI / 5.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [isListening, isPlayingVoice, audioLevel, size]);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full block"
      />

      {/* Floating Fiber-Optic Core Status Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10">
        <span className="text-[11px] font-mono font-black text-white tracking-[0.22em] drop-shadow-[0_0_14px_rgba(0,240,255,1)]">
          JARVIS CORE
        </span>
        <span className={`text-[8.5px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full mt-1 border backdrop-blur-md transition-all ${
          isPlayingVoice
            ? 'bg-cyan-500/25 text-cyan-100 border-cyan-300/80 shadow-[0_0_16px_rgba(0,240,255,0.8)] animate-pulse'
            : isListening
            ? 'bg-sky-500/25 text-sky-200 border-sky-400/70 shadow-[0_0_14px_rgba(56,189,248,0.75)] animate-pulse'
            : 'bg-[#01030a]/85 text-cyan-300/80 border-cyan-500/35 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
        }`}>
          {isPlayingVoice ? '• FIBER VOICE ACTIVE •' : isListening ? '• LISTENING (24kHz) •' : 'SECOND BRAIN READY'}
        </span>
      </div>
    </div>
  );
};
