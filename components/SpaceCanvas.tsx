import React, { useEffect, useRef } from 'react';

const SpaceCanvas: React.FC<{ interactive?: boolean }> = ({ interactive = true }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const stars: {x: number, y: number, z: number, o: number, size: number, color: string}[] = [];
        const numStars = 1500;
        
        const colors = ['#ffffff', '#e0f7fa', '#f3e5f5', '#fff9c4', '#e8eaf6'];
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: (Math.random() - 0.5) * width * 2,
                y: (Math.random() - 0.5) * height * 2,
                z: Math.random() * width,
                o: Math.random() * 0.8 + 0.2,
                size: Math.random() * 1.5 + 0.5,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        let animationFrameId: number;
        let mouseX = 0;
        let mouseY = 0;
        let targetSpeed = 1.2;
        let currentSpeed = 1.2;

        const handleMouseMove = (e: MouseEvent) => {
            if (!interactive) return;
            mouseX = (e.clientX - width / 2) * 0.03;
            mouseY = (e.clientY - height / 2) * 0.03;
        };

        const handleWheel = (e: WheelEvent) => {
            if (!interactive) return;
            // Accelerate zooming when scrolling
            if (e.deltaY < 0) {
                targetSpeed = Math.min(targetSpeed + 3, 20);
            } else {
                targetSpeed = Math.max(targetSpeed - 3, -10);
            }
            
            // Decelerate back to normal speed after a short time
            setTimeout(() => {
                targetSpeed = 1.2;
            }, 300);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('wheel', handleWheel, { passive: true });

        const render = () => {
            // Smooth speed transition
            currentSpeed += (targetSpeed - currentSpeed) * 0.1;

            ctx.fillStyle = '#020008';
            ctx.fillRect(0, 0, width, height);
            
            const cx = width / 2;
            const cy = height / 2;

            // Draw nebulae (simple radial gradients) - less opacity, larger spread
            const g1 = ctx.createRadialGradient(cx - mouseX * 2, cy - mouseY * 2, 0, cx - mouseX * 2, cy - mouseY * 2, width * 0.6);
            g1.addColorStop(0, 'rgba(128, 0, 255, 0.04)');
            g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, width, height);

            const g2 = ctx.createRadialGradient(cx + mouseX * 2, cy + mouseY * 2, 0, cx + mouseX * 2, cy + mouseY * 2, width * 0.5);
            g2.addColorStop(0, 'rgba(0, 255, 255, 0.02)');
            g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = g2;
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < numStars; i++) {
                const s = stars[i];
                s.z -= currentSpeed;
                
                // Reset star if it passes the screen or goes too far back
                if (s.z <= 0) {
                    s.z = width;
                    s.x = (Math.random() - 0.5) * width * 2;
                    s.y = (Math.random() - 0.5) * height * 2;
                } else if (s.z >= width) {
                    s.z = 0;
                    s.x = (Math.random() - 0.5) * width * 2;
                    s.y = (Math.random() - 0.5) * height * 2;
                }

                // Parallax offset based on mouse
                const px = cx + (s.x / s.z) * cx - mouseX * (1 - s.z/width);
                const py = cy + (s.y / s.z) * cy - mouseY * (1 - s.z/width);

                if (px >= 0 && px <= width && py >= 0 && py <= height) {
                    const depth = Math.max(0, 1 - s.z / width);
                    const size = s.size * depth * (currentSpeed > 2 ? 1.5 : 1); // stretch slightly when fast
                    
                    // calculate twinkle
                    const twinkle = Math.sin(Date.now() * 0.001 + s.x) * 0.5 + 0.5;
                    const opacity = Math.max(0, Math.min(1, s.o * depth * (0.8 + 0.2 * twinkle)));

                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, 2 * Math.PI);
                    ctx.fillStyle = s.color;
                    ctx.globalAlpha = opacity;
                    ctx.fill();
                }
            }
            
            ctx.globalAlpha = 1.0;
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('wheel', handleWheel);
            cancelAnimationFrame(animationFrameId);
        };
    }, [interactive]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ background: '#020008' }}
        />
    );
};

export default SpaceCanvas;
