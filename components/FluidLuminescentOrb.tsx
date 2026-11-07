import React, { useRef, useEffect } from 'react';

interface FluidLuminescentOrbProps {
  isListening: boolean;
  isPlayingVoice: boolean;
  audioLevel?: number; // 0.0 to 1.0
  size?: number;
  className?: string;
}

export const FluidLuminescentOrb: React.FC<FluidLuminescentOrbProps> = ({
  isListening,
  isPlayingVoice,
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

    // Fluid particles orbiting inside the water sphere
    const particles = Array.from({ length: 18 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 10 + Math.random() * 32,
      speed: (0.015 + Math.random() * 0.025) * (Math.random() > 0.5 ? 1 : -1),
      radius: 1.5 + Math.random() * 2.5,
      alpha: 0.3 + Math.random() * 0.6
    }));

    // Concentric acoustic ripples for listening mode
    const ripples: { r: number; alpha: number }[] = [];
    let lastRippleTime = 0;

    const render = (now: number) => {
      t += 0.035;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Current responsive energy boost
      const responsiveBoost = isPlayingVoice 
        ? Math.max(audioLevel, 0.45 + Math.sin(t * 3) * 0.25)
        : isListening
        ? 0.35 + Math.sin(t * 2) * 0.15
        : 0.12 + Math.sin(t * 0.8) * 0.05;

      // Base radius of fluid sphere
      const baseRadius = (size * 0.22) + responsiveBoost * (size * 0.09);

      // ========================================================
      // 1. ACOUSTIC WATER RIPPLES (When Listening or Speaking)
      // ========================================================
      if (isListening || isPlayingVoice) {
        if (now - lastRippleTime > (isListening ? 350 : 250)) {
          ripples.push({ r: baseRadius * 0.9, alpha: isListening ? 0.85 : 0.7 });
          lastRippleTime = now;
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += isListening ? 1.4 : 1.8;
        rp.alpha *= 0.965;

        if (rp.alpha < 0.02 || rp.r > size * 0.48) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = isListening 
          ? `rgba(0, 240, 255, ${rp.alpha})`
          : `rgba(245, 158, 11, ${rp.alpha * 0.85})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // ========================================================
      // 2. OUTER AMBIENT FLUID HALO
      // ========================================================
      ctx.save();
      const haloRadius = baseRadius * (1.6 + responsiveBoost * 0.5);
      const haloGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, haloRadius);
      
      if (isPlayingVoice) {
        // Shifting Chromatic Energy Nebula (Gold / Purple / Cyan)
        const hueShift = (t * 40) % 360;
        haloGrad.addColorStop(0, `hsla(${hueShift}, 90%, 60%, 0.45)`);
        haloGrad.addColorStop(0.5, `hsla(${(hueShift + 60) % 360}, 85%, 55%, 0.2)`);
        haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      } else if (isListening) {
        // Deep Luminous Azure & Electric Cyan
        haloGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
        haloGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.22)');
        haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        // Gentle Standby Cyan & Teal
        haloGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
        haloGrad.addColorStop(0.6, 'rgba(2, 6, 23, 0.1)');
        haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      }

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ========================================================
      // 3. ORGANIC LIQUID WATER SPHERE (Fluid Harmonic Deformation)
      // ========================================================
      const pointsCount = 48;
      const step = (Math.PI * 2) / pointsCount;
      const pts: { x: number; y: number }[] = [];

      for (let i = 0; i < pointsCount; i++) {
        const theta = i * step;

        // Multi-frequency harmonic fluid perturbations
        const wave1 = Math.sin(theta * 3 + t * 2.2) * (3.5 + responsiveBoost * 6);
        const wave2 = Math.cos(theta * 5 - t * 3.1) * (2.0 + responsiveBoost * 4);
        const wave3 = Math.sin(theta * 2 + t * 1.5) * (2.5 + responsiveBoost * 3);
        const r = baseRadius + wave1 + wave2 + wave3;

        pts.push({
          x: cx + Math.cos(theta) * r,
          y: cy + Math.sin(theta) * r
        });
      }

      // Draw smooth liquid perimeter using quadratic beziers
      ctx.save();
      ctx.beginPath();
      ctx.moveTo((pts[0].x + pts[pointsCount - 1].x) / 2, (pts[0].y + pts[pointsCount - 1].y) / 2);
      for (let i = 0; i < pointsCount; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pointsCount];
        ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      }
      ctx.closePath();

      // Fluid Sphere Core Fill
      const sphereGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.25, 
        cy - baseRadius * 0.28, 
        baseRadius * 0.08, 
        cx, 
        cy, 
        baseRadius * 1.15
      );

      if (isPlayingVoice) {
        // Dynamic Chromatic Liquid Colors (Voice Transmission)
        const rotHue = (t * 50) % 360;
        sphereGrad.addColorStop(0, '#ffffff'); // bright center
        sphereGrad.addColorStop(0.25, `hsl(${rotHue}, 95%, 65%)`);
        sphereGrad.addColorStop(0.65, `hsl(${(rotHue + 90) % 360}, 85%, 45%)`);
        sphereGrad.addColorStop(0.92, `hsl(${(rotHue + 180) % 360}, 90%, 25%)`);
        sphereGrad.addColorStop(1, 'rgba(3, 9, 30, 0.9)');
      } else if (isListening) {
        // Deep Luminous Ocean & Electric Aqua (Listening to Master)
        sphereGrad.addColorStop(0, '#e0faff');
        sphereGrad.addColorStop(0.2, '#00f0ff');
        sphereGrad.addColorStop(0.55, '#0284c7');
        sphereGrad.addColorStop(0.85, '#0369a1');
        sphereGrad.addColorStop(1, '#020617');
      } else {
        // Standby Liquid Azure Core
        sphereGrad.addColorStop(0, '#ccfbf1');
        sphereGrad.addColorStop(0.25, '#06b6d4');
        sphereGrad.addColorStop(0.65, '#0e7490');
        sphereGrad.addColorStop(0.9, '#083344');
        sphereGrad.addColorStop(1, '#020617');
      }

      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Shimmering Liquid Rim Glow
      ctx.strokeStyle = isPlayingVoice 
        ? 'rgba(255, 255, 255, 0.75)'
        : isListening
        ? 'rgba(0, 240, 255, 0.9)'
        : 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = isPlayingVoice ? '#f59e0b' : '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();

      // ========================================================
      // 4. FLOATING BIOLUMINESCENT BUBBLES / QUANTUM DROPLETS
      // ========================================================
      ctx.save();
      particles.forEach(p => {
        p.angle += p.speed * (isPlayingVoice ? 2.0 : 1.0);
        const px = cx + Math.cos(p.angle) * (p.dist * (baseRadius / 60));
        const py = cy + Math.sin(p.angle) * (p.dist * (baseRadius / 60));

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isPlayingVoice
          ? `rgba(255, 255, 255, ${p.alpha * 0.9})`
          : isListening
          ? `rgba(180, 245, 255, ${p.alpha})`
          : `rgba(125, 211, 252, ${p.alpha * 0.7})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      ctx.restore();

      // ========================================================
      // 5. TRANSLUCENT CAUSTIC SPECULAR HIGHLIGHT (3D Water Droplet)
      // ========================================================
      ctx.save();
      const specGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.4,
        2,
        cx - baseRadius * 0.3,
        cy - baseRadius * 0.35,
        baseRadius * 0.45
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      specGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.ellipse(
        cx - baseRadius * 0.32,
        cy - baseRadius * 0.38,
        baseRadius * 0.32,
        baseRadius * 0.16,
        -Math.PI / 6,
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

      {/* Floating Holographic Center Status Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10">
        <span className="text-[11px] font-mono font-black text-white tracking-widest drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]">
          JARVIS AI
        </span>
        <span className={`text-[8.5px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full mt-1 border backdrop-blur-md transition-all ${
          isPlayingVoice 
            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse'
            : isListening
            ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.6)] animate-pulse'
            : 'bg-black/40 text-cyan-400/70 border-cyan-500/20'
        }`}>
          {isPlayingVoice ? '• TRANSMITTING VOICE •' : isListening ? '• LISTENING (MIC) •' : 'SYSTEM STANDBY'}
        </span>
      </div>
    </div>
  );
};
