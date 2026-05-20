import React, { useEffect, useState } from 'react';
import { Activity, Server, Cpu, Database, Network, ShieldAlert, BarChart3, Wifi, Power } from 'lucide-react';

export const CommandCenterCard = ({ card }: { card: any }) => {
    const [metrics, setMetrics] = useState({
        cpu: 0, ram: 0, net: 0, 
        revenue: 0, content_jobs: 0
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics({
                cpu: 40 + Math.random() * 40,
                ram: 60 + Math.random() * 20,
                net: Math.random() * 1000,
                revenue: 12450 + Math.random() * 10,
                content_jobs: Math.floor(8 + Math.random() * 4)
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-4 rounded-[22px] p-5 w-full md:w-[480px] bg-[#050505] border border-[#222] shadow-[0_0_40px_rgba(0,150,255,0.05)] relative overflow-hidden font-mono group">
            {/* Grid bg */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6 relative z-10 border-b border-[#333] pb-3">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    <h3 className="font-black text-white text-sm tracking-widest uppercase">Omni Command Center</h3>
                </div>
                <div className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[9px] font-bold rounded border border-cyan-500/20">SYSTEM ONLINE</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div className="bg-[#111] p-3 rounded-xl border border-[#222]">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Core CPU</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-xl text-white font-bold">{metrics.cpu.toFixed(1)}%</span>
                        <div className="w-16 h-1 bg-[#222] rounded overflow-hidden">
                            <div className="h-full bg-cyan-500 transition-all duration-300" style={{width: `${metrics.cpu}%`}} />
                        </div>
                    </div>
                </div>

                <div className="bg-[#111] p-3 rounded-xl border border-[#222]">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Memory</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-xl text-white font-bold">{metrics.ram.toFixed(1)}%</span>
                        <div className="w-16 h-1 bg-[#222] rounded overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-300" style={{width: `${metrics.ram}%`}} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#222] flex flex-col items-center justify-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">Network traffic</span>
                    <span className="text-sm font-bold text-emerald-400">{(metrics.net).toFixed(0)} MB/s</span>
                </div>
                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#222] flex flex-col items-center justify-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">Live Revenue</span>
                    <span className="text-sm font-bold text-amber-400">${metrics.revenue.toFixed(2)}</span>
                </div>
                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#222] flex flex-col items-center justify-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">Content Jobs</span>
                    <span className="text-sm font-bold text-pink-400">{metrics.content_jobs} Active</span>
                </div>
            </div>

            <div className="relative z-10 w-full p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-[10px] text-red-400 font-bold uppercase">No Active Threats Detected</span>
            </div>
            
            <button className="relative z-10 w-full mt-4 p-3 bg-[#111] hover:bg-[#222] border border-[#333] hover:border-cyan-500/50 rounded-xl text-xs text-white font-bold flex items-center justify-center gap-2 transition-colors">
                <Power className="w-4 h-4 text-cyan-400" />
                Toggle God Mode (Swarm)
            </button>
        </div>
    );
};
