import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  color: string;
}

const STAR_COLORS = ['#ffffff', '#e0f7fa', '#cffafe', '#ede9fe', '#fef3c7'];

const SpaceCanvas: React.FC<{ interactive?: boolean; showEarth?: boolean }> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const setupSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setupSize();

    const starCount = 135;
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.4,
      baseAlpha: Math.random() * 0.55 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.0018 + 0.0006,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));

    let rafId = 0;
    let lastFrameTime = 0;
    const frameIntervalMs = 1000 / 24; // Smooth ambient 24 FPS cap for low CPU/GPU overhead
    let isPaused = document.hidden;

    const renderFrame = (now: number) => {
      if (isPaused) return;
      rafId = requestAnimationFrame(renderFrame);
      if (now - lastFrameTime < frameIntervalMs) return;
      lastFrameTime = now;

      // Deep space background with subtle lightweight ambient gradient (zero blur layers or external textures)
      const bg = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bg.addColorStop(0, '#071124');
      bg.addColorStop(0.55, '#030612');
      bg.addColorStop(1, '#020208');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const alpha = s.baseAlpha * (0.65 + 0.35 * Math.sin(now * s.speed + s.phase));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;
    };

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused) {
        lastFrameTime = 0;
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const prevW = width || 1;
        const prevH = height || 1;
        setupSize();
        for (let i = 0; i < stars.length; i++) {
          stars[i].x = (stars[i].x / prevW) * width;
          stars[i].y = (stars[i].y / prevH) * height;
        }
      }, 150);
    };

    if (!isPaused) {
      rafId = requestAnimationFrame(renderFrame);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) window.clearTimeout(resizeTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: '#020208' }}
    />
  );
};

export default React.memo(SpaceCanvas);
