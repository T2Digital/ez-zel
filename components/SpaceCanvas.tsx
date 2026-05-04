import React, { useEffect, useRef } from 'react';

const SpaceCanvas: React.FC<{ interactive?: boolean; showEarth?: boolean }> = ({ interactive = true, showEarth = true }) => {
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

        // Load Earth & Moon Images safely
        const earthImg = new Image();
        earthImg.crossOrigin = 'anonymous'; // Help with CORS
        earthImg.src = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
        
        const moonImg = new Image();
        moonImg.crossOrigin = 'anonymous';
        moonImg.src = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg';

        let animationFrameId: number;
        let targetSpeed = 1.8;
        let currentSpeed = 1.8;

        // Camera Pan/Zoom variables
        let bgPanX = 0;
        let bgPanY = 0;
        let bgZoom = 1;
        
        let targetPanX = 0;
        let targetPanY = 0;
        let targetZoom = 1;

        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        
        // Active pointers for pinch to zoom
        const activePointers = new Map<number, {x: number, y: number}>();
        let initialPinchDist: number | null = null;
        let initialPinchZoom = 1;

        const handlePointerDown = (e: PointerEvent) => {
            if (!interactive) return;
            // Ignore if clicking on buttons or interactive UI elements unless it's the canvas/body
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('.pointer-events-auto') && !target.closest('.canvas-bypass')) {
                // Return if clicking some specific UI, actually the workspace elements capture pointers,
                // but let's allow panning if the target is the dashboard container.
                // We'll just just not prevent default and let it happen, but avoid disrupting clicks.
            }
            
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            
            if (activePointers.size === 1) {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
            } else if (activePointers.size === 2) {
                isDragging = false;
                const pts = Array.from(activePointers.values());
                initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                initialPinchZoom = targetZoom;
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!interactive) return;
            
            if (activePointers.has(e.pointerId)) {
                activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }

            if (activePointers.size === 1 && isDragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                targetPanX += dx;
                targetPanY += dy;
                lastX = e.clientX;
                lastY = e.clientY;
            } else if (activePointers.size === 2 && initialPinchDist !== null) {
                const pts = Array.from(activePointers.values());
                const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                const scale = dist / initialPinchDist;
                targetZoom = Math.min(Math.max(initialPinchZoom * scale, 0.5), 10);
            }
            
            // Speed up stars a bit when moving mouse globally
            if (activePointers.size === 0) {
                 // hover effect handled elsewhere or not at all, to keep focus on pan
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (!interactive) return;
            activePointers.delete(e.pointerId);
            if (activePointers.size < 2) {
                initialPinchDist = null;
            }
            if (activePointers.size === 1) {
                const p = Array.from(activePointers.values())[0];
                lastX = p.x;
                lastY = p.y;
                isDragging = true;
            } else if (activePointers.size === 0) {
                isDragging = false;
            }
        };

        const handleDoubleClick = (e: MouseEvent) => {
            if (!interactive) return;
            targetZoom *= 1.5;
            if (targetZoom > 5) targetZoom = 1; // Reset if too far
        };

        const handleWheel = (e: WheelEvent) => {
            if (!interactive) return;
            if (e.ctrlKey) {
                // Trackpad pinch or ctrl+wheel
                e.preventDefault();
                targetZoom -= e.deltaY * 0.01;
                targetZoom = Math.max(0.5, Math.min(targetZoom, 10));
            } else {
                targetSpeed = e.deltaY < 0 ? Math.min(targetSpeed + 3, 20) : Math.max(targetSpeed - 3, -10);
                setTimeout(() => { targetSpeed = 1.8; }, 300);
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        window.addEventListener('dblclick', handleDoubleClick);
        window.addEventListener('wheel', handleWheel, { passive: false });

        const drawImageSafe = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
            if (img.complete && img.naturalWidth !== 0 && !img.src.endsWith('undefined')) {
                try {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x + w/2, y + h/2, w/2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, x, y, w, h);
                    ctx.restore();
                } catch(e) {
                    // silently ignore broken image
                }
            } else {
                // Draw a fallback circle
                ctx.beginPath();
                ctx.arc(x + w/2, y + h/2, w/2, 0, 2*Math.PI);
                ctx.fillStyle = img === earthImg ? 'rgba(0, 50, 150, 1)' : 'rgba(150, 150, 150, 1)';
                ctx.fill();
            }
        };

        const drawRotatingImageSafe = (img: HTMLImageElement, x: number, y: number, size: number, time: number, speed: number) => {
            if (img.complete && img.naturalWidth !== 0 && !img.src.endsWith('undefined')) {
                try {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                    ctx.clip();
                    
                    const wid = size * 2; // Keep 2:1 aspect ratio of equirectangular map
                    const offset = (time * speed) % wid;
                    
                    ctx.drawImage(img, x - offset, y, wid, size);
                    ctx.drawImage(img, x - offset + wid, y, wid, size);
                    ctx.restore();
                } catch(e) { }
            } else {
                drawImageSafe(img, x, y, size, size);
            }
        };

        const render = () => {
            currentSpeed += (targetSpeed - currentSpeed) * 0.1;
            
            // Smoothly approach target pan & zoom
            bgPanX += (targetPanX - bgPanX) * 0.1;
            bgPanY += (targetPanY - bgPanY) * 0.1;
            bgZoom += (targetZoom - bgZoom) * 0.1;

            ctx.fillStyle = '#020008';
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            
            const cx = width / 2;
            const cy = height / 2;
            
            // Apply zoom and pan, pivoting from center
            ctx.translate(cx, cy);
            ctx.scale(bgZoom, bgZoom);
            ctx.translate(-cx + bgPanX, -cy + bgPanY);

            for (let i = 0; i < numStars; i++) {
                const s = stars[i];
                s.z -= currentSpeed;
                
                if (s.z <= 0) {
                    s.z = width;
                    s.x = (Math.random() - 0.5) * width * 2;
                    s.y = (Math.random() - 0.5) * height * 2;
                } else if (s.z >= width) {
                    s.z = 0;
                    s.x = (Math.random() - 0.5) * width * 2;
                    s.y = (Math.random() - 0.5) * height * 2;
                }

                // Parallax is driven mostly by star's Z, we already handled pan using canvas translate
                const px = cx + (s.x / s.z) * cx;
                const py = cy + (s.y / s.z) * cy;

                // Frustum culling simple
                if (px >= -cx && px <= width+cx && py >= -cy && py <= height+cy) {
                    const depth = Math.max(0, 1 - s.z / width);
                    const size = s.size * depth * (currentSpeed > 2 ? 1.5 : 1); 
                    
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

            if (showEarth) {
                // Draw earth & moon in background
                const earthSize = 220;
                const earthX = cx - earthSize / 2;
                const earthY = cy - earthSize / 2;
                
                // Moon - orbiting slowly
                const time = Date.now() * 0.0005;
                const orbitRadX = 180;
                const orbitRadY = 60;
                const moonSize = 40;
                const moonX = earthX + earthSize/2 + Math.cos(time) * orbitRadX - moonSize/2;
                const moonY = earthY + earthSize/2 + Math.sin(time) * orbitRadY - moonSize/2;
                
                // Draw moon behind earth first
                if (Math.sin(time) <= 0) {
                     drawRotatingImageSafe(moonImg, moonX, moonY, moonSize, time, 50);
                     // Moon shadow
                     const gMoon = ctx.createRadialGradient(moonX + moonSize*0.3, moonY + moonSize*0.3, 0, moonX + moonSize/2, moonY + moonSize/2, moonSize);
                     gMoon.addColorStop(0, 'rgba(255,255,255,0.2)');
                     gMoon.addColorStop(0.4, 'rgba(0,0,0,0)');
                     gMoon.addColorStop(0.8, 'rgba(0,0,0,0.8)');
                     gMoon.addColorStop(1, 'rgba(0,0,0,1)');
                     ctx.beginPath();
                     ctx.arc(moonX + moonSize/2, moonY + moonSize/2, moonSize/2, 0, 2*Math.PI);
                     ctx.fillStyle = gMoon;
                     ctx.fill();
                }

                ctx.shadowColor = 'rgba(100, 200, 255, 0.2)';
                ctx.shadowBlur = 50;
                ctx.beginPath();
                ctx.arc(earthX + earthSize/2, earthY + earthSize/2, earthSize/2, 0, 2*Math.PI);
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Earth (rotate slowly)
                drawRotatingImageSafe(earthImg, earthX, earthY, earthSize, time, 20);
                
                // Earth dark side overlay (shadow based on sun position)
                const gEarth = ctx.createRadialGradient(earthX + earthSize*0.3, earthY + earthSize*0.3, 0, earthX + earthSize/2, earthY + earthSize/2, earthSize);
                gEarth.addColorStop(0, 'rgba(255,255,255,0.1)'); // inner light
                gEarth.addColorStop(0.4, 'rgba(0,0,0,0)');
                gEarth.addColorStop(0.8, 'rgba(0,0,0,0.7)');
                gEarth.addColorStop(1, 'rgba(0,0,0,1)');
                ctx.beginPath();
                ctx.arc(earthX + earthSize/2, earthY + earthSize/2, earthSize/2, 0, 2*Math.PI);
                ctx.fillStyle = gEarth;
                ctx.fill();

                // Draw moon in front of earth
                if (Math.sin(time) > 0) {
                     drawRotatingImageSafe(moonImg, moonX, moonY, moonSize, time, 50);
                     
                     // Moon shadow
                     const gMoon = ctx.createRadialGradient(moonX + moonSize*0.3, moonY + moonSize*0.3, 0, moonX + moonSize/2, moonY + moonSize/2, moonSize);
                     gMoon.addColorStop(0, 'rgba(255,255,255,0.2)');
                     gMoon.addColorStop(0.4, 'rgba(0,0,0,0)');
                     gMoon.addColorStop(0.8, 'rgba(0,0,0,0.8)');
                     gMoon.addColorStop(1, 'rgba(0,0,0,1)');
                     ctx.beginPath();
                     ctx.arc(moonX + moonSize/2, moonY + moonSize/2, moonSize/2, 0, 2*Math.PI);
                     ctx.fillStyle = gMoon;
                     ctx.fill();
                }
            }

            ctx.restore();
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
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
            window.removeEventListener('dblclick', handleDoubleClick);
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

