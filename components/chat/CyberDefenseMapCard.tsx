import React, { useEffect, useState } from 'react';
import { ShieldAlert, Crosshair, Radar, AlertTriangle } from 'lucide-react';

export const CyberDefenseMapCard = ({ card }: { card: any }) => {
    const [scans, setScans] = useState<any[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                setScans(prev => [
                    {
                        id: Math.random(),
                        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                        port: [80, 443, 22, 3306, 21][Math.floor(Math.random() * 5)],
                        status: Math.random() > 0.8 ? 'blocked' : 'scanning',
                        time: new Date().toLocaleTimeString()
                    },
                    ...prev
                ].slice(0, 5));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const isCritical = card.data?.threat_level === 'critical';

    return (
        <div className={`mt-4 rounded-[22px] p-5 w-full md:w-[450px] bg-black border ${isCritical ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'} relative overflow-hidden font-mono group`}>
            {/* Grid overlay */}
            <div className={`absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none opacity-50`} />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Radar className={`w-6 h-6 ${isCritical ? 'text-red-500 animate-spin-fast' : 'text-emerald-500 animate-spin-slow'}`} />
                        <div className={`absolute inset-0 rounded-full blur-md ${isCritical ? 'bg-red-500/30' : 'bg-emerald-500/30'}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-xs tracking-widest uppercase">Ghost Protocol Matrix</h3>
                        <p className={`text-[9px] mt-1 uppercase ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isCritical ? 'CRITICAL THREAT DETECTED' : 'SYSTEM SECURE - MONITORING SCAN'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 bg-[#0a0a0a] rounded-xl border border-[#222] p-3 mb-4 h-[180px] flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 flex items-center justify-center opacity-20">
                     <Crosshair className={`w-32 h-32 ${isCritical ? 'text-red-500' : 'text-emerald-500'}`} />
                 </div>
                 
                 <div className="absolute inset-0 flex flex-col justify-end p-2 pointer-events-none">
                     {scans.map((scan) => (
                         <div key={scan.id} className="flex justify-between text-[10px] items-center py-1 border-b border-[#222] last:border-0 bg-black/50 px-2 rounded mb-1 animate-fade-in">
                             <span className="text-gray-500">{scan.time}</span>
                             <span className="text-blue-400">IP: {scan.ip}</span>
                             <span className="text-yellow-500 truncate w-[60px]">PORT: {scan.port}</span>
                             {scan.status === 'blocked' 
                                ? <span className="text-red-500 font-bold bg-red-500/20 px-1 rounded truncate">BLOCKED</span>
                                : <span className="text-emerald-500 bg-emerald-500/20 px-1 rounded truncate">SCAN</span>
                             }
                         </div>
                     ))}
                 </div>
            </div>

            {isCritical && (
                <div className="relative z-10 w-full p-2 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center gap-3 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                        <div className="text-[10px] text-red-400 font-bold uppercase">Executing Counter-Measures</div>
                        <div className="text-[8px] text-red-300">Blocking inbound attacks on edge network.</div>
                    </div>
                </div>
            )}
        </div>
    );
};
