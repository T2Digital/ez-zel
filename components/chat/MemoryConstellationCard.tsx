import React, { useRef, useEffect } from 'react';
import { BrainCircuit, GitCommit } from 'lucide-react';

export const MemoryConstellationCard = ({ card }: { card: any }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = 400;
        let height = canvas.height = 250;

        const nodes = Array.from({ length: 40 }).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            color: Math.random() > 0.8 ? '#a855f7' : (Math.random() > 0.5 ? '#3b82f6' : '#22d3ee')
        }));

        let animationId: number;
        
        const centerNode = { x: width/2, y: height/2, size: 6, color: '#facc15' };

        const draw = () => {
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);

            nodes.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                if (node.x < 0 || node.x > width) node.vx *= -1;
                if (node.y < 0 || node.y > height) node.vy *= -1;

                ctx.beginPath();
                ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();

                // Draw connection to center
                const distCenter = Math.hypot(node.x - centerNode.x, node.y - centerNode.y);
                if (distCenter < 120) {
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(centerNode.x, centerNode.y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distCenter / 120})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }

                // Draw connections between nodes
                nodes.forEach(otherNode => {
                    const dist = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
                    if (dist < 50) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(otherNode.x, otherNode.y);
                        ctx.strokeStyle = `rgba(168, 85, 247, ${1 - dist / 50})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            // Draw center node
            ctx.beginPath();
            ctx.arc(centerNode.x, centerNode.y, centerNode.size, 0, Math.PI * 2);
            ctx.fillStyle = centerNode.color;
            ctx.shadowColor = centerNode.color;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#fff';
            ctx.font = '10px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText(card.data?.focus_node || 'المستخدم', centerNode.x, centerNode.y + 15);

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(animationId);
    }, [card]);

    return (
        <div className="mt-4 rounded-[22px] p-4 w-full md:w-[420px] bg-[#050505] border border-[#222] shadow-[0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white text-xs tracking-wider uppercase">Knowledge Graph</h3>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-gray-500 uppercase">
                    <GitCommit className="w-3 h-3" /> Live Synapse Mapping
                </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-[#222] bg-black">
                <canvas ref={canvasRef} className="w-full h-[250px] block" />
            </div>
            
            <p className="text-[10px] text-gray-500 text-center mt-3 uppercase tracking-widest">
                الذاكرة الكونية للظل تتعلم وتترابط برمجياً
            </p>
        </div>
    );
};
