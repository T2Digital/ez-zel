import React, { useState, useEffect, useRef } from 'react';
import { Users, Briefcase, Calculator, PenTool, Scale, Cpu, Play } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const AgentAvatar = ({ position, color, isActive, index, role }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    
    useFrame((state) => {
        if (!meshRef.current || !materialRef.current) return;
        const time = state.clock.getElapsedTime();
        // Hover effect if active
        if (isActive) {
            meshRef.current.position.y = position[1] + Math.sin(time * 3) * 0.2;
            materialRef.current.emissiveIntensity = 1 + Math.sin(time * 8) * 0.5;
        } else {
            meshRef.current.position.y = position[1];
            materialRef.current.emissiveIntensity = 0.2;
        }
    });

    // Create different geometry types based on role index
    let geometry;
    if (index % 3 === 0) geometry = <icosahedronGeometry args={[0.5, 1]} />;
    else if (index % 3 === 1) geometry = <octahedronGeometry args={[0.5]} />;
    else geometry = <torusKnotGeometry args={[0.3, 0.1, 64, 8]} />;

    return (
        <group position={position}>
            <Float speed={isActive ? 4 : 1} rotationIntensity={isActive ? 1 : 0.2} floatIntensity={isActive ? 2 : 0.5}>
                <mesh ref={meshRef} castShadow>
                    {geometry}
                    <meshStandardMaterial 
                        ref={materialRef}
                        color={color} 
                        emissive={color}
                        emissiveIntensity={isActive ? 1.5 : 0.2}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
            </Float>
            {/* Hologram Base */}
            <mesh position={[0, -1.2, 0]}>
                <cylinderGeometry args={[0.6, 0.7, 0.1, 32]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, -1.1, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
                <meshStandardMaterial color={isActive ? color : '#333'} emissive={isActive ? color : '#000'} emissiveIntensity={2} />
            </mesh>
        </group>
    );
};

const BoardroomScene = ({ members, activeSpeaker }: any) => {
    // Arrange avatars in a circle around a central "table"
    const radius = 2.5;
    const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4'];

    return (
        <>
            <ambientLight intensity={0.2} />
            <spotLight position={[0, 10, 0]} intensity={2} color="#4f46e5" angle={0.5} penumbra={1} castShadow />
            <pointLight position={[0, 2, 0]} intensity={1} color="#06b6d4" />
            
            <Environment preset="city" />

            {/* Central Holographic Table */}
            <mesh position={[0, -0.5, 0]} receiveShadow>
                <cylinderGeometry args={[2, 2.5, 0.2, 64]} />
                <meshStandardMaterial color="#080808" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Core Idea Hologram above table */}
            <Float speed={2} rotationIntensity={2} floatIntensity={1}>
                <mesh position={[0, 1, 0]}>
                    <sphereGeometry args={[0.3, 32, 32]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} wireframe />
                </mesh>
            </Float>
            <Sparkles count={50} scale={2} size={2} speed={0.4} opacity={0.5} color="#3b82f6" />

            {members.map((member: string, i: number) => {
                const angle = (i / members.length) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const color = colors[i % colors.length];
                
                return (
                    <AgentAvatar 
                        key={i} 
                        index={i}
                        role={member}
                        position={[x, 0.5, z]} 
                        color={color} 
                        isActive={activeSpeaker === member} 
                    />
                );
            })}
            
            <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={10} blur={2} far={4} />
            <OrbitControls 
                enablePan={false} 
                enableZoom={window.innerWidth > 768} 
                minPolarAngle={Math.PI/4} 
                maxPolarAngle={Math.PI/2 - 0.1} 
                autoRotate 
                autoRotateSpeed={0.5} 
            />
        </>
    );
};

export const BoardroomMeetingCard = ({ card }: { card: any }) => {
    const [progress, setProgress] = useState(0);
    const [activeSpeaker, setActiveSpeaker] = useState('المهندس التقني');
    
    const members = card.data?.members || ['المهندس', 'المحاسب', 'المسوق'];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return p + 5;
            });
            setActiveSpeaker(members[Math.floor(Math.random() * members.length)]);
        }, 1200);
        return () => clearInterval(interval);
    }, [members]);

    const getIcon = (role: string) => {
        if (role.includes('سوق') || role.includes('market')) return <Briefcase className="w-5 h-5 text-purple-400" />;
        if (role.includes('حاسب') || role.includes('finance')) return <Calculator className="w-5 h-5 text-emerald-400" />;
        if (role.includes('قانون') || role.includes('legal')) return <Scale className="w-5 h-5 text-amber-400" />;
        return <Cpu className="w-5 h-5 text-cyan-400" />;
    };

    return (
        <div className="mt-4 p-5 w-full md:w-[600px] overflow-hidden group font-sans">
            <div className="relative rounded-[22px] bg-gradient-to-br from-[#0a1128] to-black border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.15)] flex flex-col">
                
                <div className="flex justify-between items-start p-6 border-b border-white/10 z-10 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-full border border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.6)]">
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-md tracking-widest leading-none">طاولة العقول المستنسخة</h3>
                            <p className="text-xs text-blue-300/70 mt-2 uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE 3D ROOM
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3D Canvas Area */}
                <div className="w-full h-[300px] bg-black/50 relative">
                    <Canvas shadows camera={{ position: [0, 4, 6], fov: 45 }}>
                        <BoardroomScene members={members} activeSpeaker={activeSpeaker} />
                    </Canvas>
                    
                    {/* Overlay Label for Active Speaker */}
                    <div className="absolute top-4 left-4 bg-black/60 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-white font-bold">{activeSpeaker} يتحدث الآن...</span>
                    </div>
                </div>

                <div className="p-5 bg-black/80 z-10 relative border-t border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {members.map((member: string, i: number) => (
                            <div key={i} className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeSpeaker === member && progress < 100 ? 'bg-blue-500/10 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-black/40 border-gray-800'}`}>
                                {getIcon(member)}
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider text-center line-clamp-1">{member}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#050505] border border-[#222] p-3 rounded-lg mb-2">
                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 flex justify-between">
                            <span>تقدم الاجتماع واستخراج الخطة</span>
                            <span className="text-blue-400">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    {progress === 100 && (
                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center animate-fade-in flex flex-col items-center">
                            <div className="text-emerald-400 font-bold text-sm mb-1">تمت صياغة خطة العمل بنجاح ✔️</div>
                            <p className="text-[10px] text-white/50 mb-2">لقد قام الفريق بدراسة الفكرة، حلل المنافسين، وحسب الميزانية والمخاطر. التقرير الشامل متاح الآن بالمحادثة.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
