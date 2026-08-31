import React, { useEffect, useRef } from 'react';

interface AgentNode {
  name: string;
  role: string;
  angle: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  color: string;
}

export const SpaceCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stars
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
    }));

    // Orbiting Agents
    const agents: AgentNode[] = [
      { name: 'Nexus', role: 'System Core', angle: 0, radiusX: 280, radiusY: 120, speed: 0.006, color: '#00f2fe' },
      { name: 'Accountant', role: 'Financial Intel', angle: 1.2, radiusX: 250, radiusY: 110, speed: 0.007, color: '#fbbf24' },
      { name: 'Architect', role: 'System Design', angle: 2.8, radiusX: 270, radiusY: 115, speed: 0.005, color: '#60a5fa' },
      { name: 'Healer', role: 'Security & Health', angle: 4.2, radiusX: 290, radiusY: 125, speed: 0.0065, color: '#34d399' },
      { name: 'Lawyer', role: 'Compliance Vault', angle: 5.5, radiusX: 260, radiusY: 105, speed: 0.008, color: '#c084fc' },
    ];

    let moonAngle = 0;

    const render = () => {
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Background Stars
      stars.forEach((star) => {
        star.alpha += Math.sin(Date.now() * star.speed) * 0.01;
        const clampedAlpha = Math.max(0.1, Math.min(1, star.alpha));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${clampedAlpha})`;
        ctx.fill();
      });

      const centerX = width / 2;
      const centerY = height * 0.42;

      // 2. Draw Orbit Rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      [230, 260, 290].forEach((rX) => {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rX, rX * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 3. Draw Central Planet (Earth / Digital Globe)
      const planetRadius = Math.min(width * 0.22, 130);
      const gradient = ctx.createRadialGradient(
        centerX - planetRadius * 0.3,
        centerY - planetRadius * 0.3,
        planetRadius * 0.1,
        centerX,
        centerY,
        planetRadius
      );
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(0.4, '#1e3a8a');
      gradient.addColorStop(0.8, '#0f172a');
      gradient.addColorStop(1, '#020617');

      // Atmosphere Glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();

      // Planet Body
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Earth Continents Abstract Overlay
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.beginPath();
      ctx.ellipse(centerX - 20, centerY - 10, 45, 25, 0.3, 0, Math.PI * 2);
      ctx.ellipse(centerX + 30, centerY + 20, 35, 20, -0.2, 0, Math.PI * 2);
      ctx.ellipse(centerX - 35, centerY + 30, 25, 35, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Cloud swirl
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 25, 70, 15, 0.1, 0, Math.PI * 2);
      ctx.ellipse(centerX - 10, centerY + 40, 60, 12, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Draw Orbiting Moon
      moonAngle += 0.004;
      const moonX = centerX + Math.cos(moonAngle) * (planetRadius * 1.8);
      const moonY = centerY + Math.sin(moonAngle) * (planetRadius * 0.7);

      ctx.beginPath();
      ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 5. Draw Orbiting Agent Nodes
      agents.forEach((agent) => {
        agent.angle += agent.speed;
        const x = centerX + Math.cos(agent.angle) * agent.radiusX;
        const y = centerY + Math.sin(agent.angle) * agent.radiusY;

        // Glowing Node
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = agent.color;
        ctx.shadowColor = agent.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Node Label
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11px Tajawal, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(agent.name, x, y - 10);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-75"
    />
  );
};
