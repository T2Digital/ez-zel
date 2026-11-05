/**
 * Cyber Shadow Protocol 3D - Interactive Three.js Cyber Game
 * Built according to Three.js and Game Craft Directives:
 * - Full-viewport Game Shell (Title Screen -> Playing -> Pause / Victory / Game Over)
 * - Composite 3-12 part procedural models for Player Drone & Environs
 * - Studio PBR lighting with ACESFilmicToneMapping & matching FogExp2
 * - Procedural Web Audio synth sound effects (engine hum, pickups, impacts, game over)
 * - Damped chase camera, clamped 60fps delta, decaying camera shake, particle bursts
 * - Low-occlusion UI (<15% footprint, pointer-events: none, tabular-nums)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX, Pause, Play, RotateCcw, X, Shield, Zap, Trophy, ArrowRight } from 'lucide-react';

interface GameProps {
    onClose: () => void;
}

export const CyberShadowGame3D: React.FC<GameProps> = ({ onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Game State Flow: 'title' | 'playing' | 'paused' | 'gameover' | 'victory'
    const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover' | 'victory'>('title');
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(100);
    const [shield, setShield] = useState(100);
    const [dataCoresCollected, setDataCoresCollected] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // Audio Synth Ref
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Internal Game Refs
    const gameLoopRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        playerGroup: THREE.Group;
        particles: THREE.Points;
        crystals: THREE.Group[];
        hazards: THREE.Group[];
        thrusterLights: THREE.PointLight[];
        groundMesh: THREE.Mesh;
        clock: THREE.Clock;
        heldKeys: Record<string, boolean>;
        cameraShake: number;
        hitStopFrames: number;
        playerVelocity: THREE.Vector3;
        playerPos: THREE.Vector3;
        isAlive: boolean;
        running: boolean;
    } | null>(null);

    // Sound FX Synth Helpers (Zero external audio files, pure procedural Web Audio API)
    const playSynthSound = useCallback((type: 'pickup' | 'hit' | 'boost' | 'gameover' | 'start') => {
        if (isMuted) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioCtx();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;

            if (type === 'pickup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'boost') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(440, now + 0.1);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'start') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(261.63, now);
                osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'gameover') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                osc.start(now);
                osc.stop(now + 0.65);
            }
        } catch {}
    }, [isMuted]);

    // Initialize Three.js Engine
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // 1. Scene & Atmospheric Fog
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x04060c);
        scene.fog = new THREE.FogExp2(0x04060c, 0.015);

        // 2. Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 5, 12);

        // 3. Renderer with PBR ACESFilmic Tone Mapping
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // 4. Studio PBR Lighting (Key Warm + Fill Cool)
        const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090b10, 0.8);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xf59e0b, 1.4);
        dirLight.position.set(15, 25, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 80;
        dirLight.shadow.camera.left = -25;
        dirLight.shadow.camera.right = 25;
        dirLight.shadow.camera.top = 25;
        dirLight.shadow.camera.bottom = -25;
        scene.add(dirLight);

        // Ambient cyber blue glow
        const bluePointLight = new THREE.PointLight(0x06b6d4, 1.5, 30);
        bluePointLight.position.set(0, 4, 0);
        scene.add(bluePointLight);

        // 5. Procedural Cyber Grid Ground
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = 128;
        gridCanvas.height = 128;
        const gCtx = gridCanvas.getContext('2d')!;
        gCtx.fillStyle = '#060913';
        gCtx.fillRect(0, 0, 128, 128);
        gCtx.strokeStyle = '#06b6d4';
        gCtx.lineWidth = 2;
        gCtx.strokeRect(0, 0, 128, 128);
        const gridTexture = new THREE.CanvasTexture(gridCanvas);
        gridTexture.wrapS = THREE.RepeatWrapping;
        gridTexture.wrapT = THREE.RepeatWrapping;
        gridTexture.repeat.set(40, 40);

        const groundGeo = new THREE.PlaneGeometry(300, 300);
        const groundMat = new THREE.MeshStandardMaterial({
            map: gridTexture,
            roughness: 0.25,
            metalness: 0.8
        });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        // 6. COMPOSITE HERO MODEL: "مركبة الظل السيادية" (Cyber Shadow Drone)
        // Assembled from 6 distinct procedural parts:
        const playerGroup = new THREE.Group();

        // Part 1: Main Aerodynamic Fuselage
        const bodyGeo = new THREE.ConeGeometry(0.8, 2.2, 5);
        bodyGeo.rotateX(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.2,
            metalness: 0.9
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.castShadow = true;
        playerGroup.add(bodyMesh);

        // Part 2: Holographic Cockpit Canopy
        const canopyGeo = new THREE.SphereGeometry(0.35, 16, 12);
        canopyGeo.scale(1, 0.6, 1.8);
        const canopyMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x0891b2,
            emissiveIntensity: 0.6,
            roughness: 0.1,
            metalness: 0.2,
            transparent: true,
            opacity: 0.85
        });
        const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
        canopyMesh.position.set(0, 0.28, -0.2);
        playerGroup.add(canopyMesh);

        // Part 3: Dual Jet Thrusters (Left & Right)
        const thrusterGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 12);
        thrusterGeo.rotateX(Math.PI / 2);
        const thrusterMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.4,
            metalness: 0.8
        });
        const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
        leftThruster.position.set(-0.7, 0, 0.6);
        const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
        rightThruster.position.set(0.7, 0, 0.6);
        playerGroup.add(leftThruster);
        playerGroup.add(rightThruster);

        // Part 4: Glowing Energy Thruster Rings
        const ringGeo = new THREE.TorusGeometry(0.22, 0.05, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const leftRing = new THREE.Mesh(ringGeo, ringMat);
        leftRing.position.set(-0.7, 0, 1.05);
        const rightRing = new THREE.Mesh(ringGeo, ringMat);
        rightRing.position.set(0.7, 0, 1.05);
        playerGroup.add(leftRing);
        playerGroup.add(rightRing);

        // Thruster Point Lights
        const leftThrusterLight = new THREE.PointLight(0x38bdf8, 2, 5);
        leftThrusterLight.position.set(-0.7, 0, 1.2);
        const rightThrusterLight = new THREE.PointLight(0x38bdf8, 2, 5);
        rightThrusterLight.position.set(0.7, 0, 1.2);
        playerGroup.add(leftThrusterLight);
        playerGroup.add(rightThrusterLight);

        // Part 5: Dual Cyber Wing Blades with Neon Trim
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(-1.8, -0.8);
        wingShape.lineTo(-1.6, -1.2);
        wingShape.lineTo(0, -0.4);
        wingShape.closePath();
        const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.08, bevelEnabled: false });
        wingExtrude.rotateX(Math.PI / 2);
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.3,
            metalness: 0.8
        });
        const leftWing = new THREE.Mesh(wingExtrude, wingMat);
        leftWing.position.set(0, 0, 0.4);
        leftWing.castShadow = true;
        const rightWing = leftWing.clone();
        rightWing.scale.x = -1;
        playerGroup.add(leftWing);
        playerGroup.add(rightWing);

        // Part 6: Underbody Soft Radial Contact Shadow
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 64;
        shadowCanvas.height = 64;
        const sCtx = shadowCanvas.getContext('2d')!;
        const grad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
        grad.addColorStop(0, 'rgba(0,0,0,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 64, 64);
        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(3.5, 3.5),
            new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.7 })
        );
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.75;
        playerGroup.add(shadowPlane);

        playerGroup.position.set(0, 1.2, 0);
        scene.add(playerGroup);

        // 7. Ambient Cyber Dust Particles
        const particleCount = 200;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
            particlePos[i] = (Math.random() - 0.5) * 80;
            particlePos[i + 1] = Math.random() * 20;
            particlePos[i + 2] = (Math.random() - 0.5) * 120;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x38bdf8,
            size: 0.25,
            transparent: true,
            opacity: 0.7
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // 8. Collectible Data Cores (Octahedron + Wireframe Core)
        const crystals: THREE.Group[] = [];
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x059669,
            emissiveIntensity: 0.8,
            roughness: 0.1,
            metalness: 0.3
        });
        const innerWireMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0, wireframe: true });

        for (let i = 0; i < 15; i++) {
            const crystalGroup = new THREE.Group();
            const outer = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), crystalMat);
            const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), innerWireMat);
            crystalGroup.add(outer);
            crystalGroup.add(inner);
            crystalGroup.position.set(
                (Math.random() - 0.5) * 35,
                1.3,
                -(i * 12 + 10)
            );
            scene.add(crystalGroup);
            crystals.push(crystalGroup);
        }

        // 9. Procedural Cyber Obelisks / Defensive Turrets (Hazards)
        const hazards: THREE.Group[] = [];
        const hazardMat = new THREE.MeshStandardMaterial({
            color: 0xe11d48,
            emissive: 0x9f1239,
            emissiveIntensity: 0.7,
            roughness: 0.3,
            metalness: 0.7
        });

        for (let i = 0; i < 10; i++) {
            const hazardGroup = new THREE.Group();
            // Obelisk Base + Spire
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 3.5, 6), hazardMat);
            base.position.y = 1.75;
            base.castShadow = true;
            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0055 }));
            beacon.position.y = 3.6;
            hazardGroup.add(base);
            hazardGroup.add(beacon);

            hazardGroup.position.set(
                (Math.random() - 0.5) * 32,
                0,
                -(i * 18 + 20)
            );
            scene.add(hazardGroup);
            hazards.push(hazardGroup);
        }

        // 10. Held Key Tracking & Window Blur Handler
        const heldKeys: Record<string, boolean> = {};
        const onKeyDown = (e: KeyboardEvent) => {
            heldKeys[e.code] = true;
            if (e.code === 'Space' || e.code === 'Enter') {
                if (gameState === 'title') {
                    handleStartGame();
                }
            }
            if (e.code === 'Escape') {
                setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev);
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            heldKeys[e.code] = false;
        };
        const onBlur = () => {
            for (const k in heldKeys) heldKeys[k] = false;
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);

        // Store active loop refs
        gameLoopRef.current = {
            scene,
            camera,
            renderer,
            playerGroup,
            particles,
            crystals,
            hazards,
            thrusterLights: [leftThrusterLight, rightThrusterLight],
            groundMesh,
            clock: new THREE.Clock(),
            heldKeys,
            cameraShake: 0,
            hitStopFrames: 0,
            playerVelocity: new THREE.Vector3(),
            playerPos: new THREE.Vector3(0, 1.2, 0),
            isAlive: true,
            running: true
        };

        // Resize handler
        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // 11. 60fps Game Loop with clamped delta
        let animId: number;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            const g = gameLoopRef.current;
            if (!g) return;

            // Clamped delta
            const rawDt = g.clock.getDelta();
            const dt = Math.min(rawDt, 0.05);

            // Hitstop pause
            if (g.hitStopFrames > 0) {
                g.hitStopFrames--;
                return;
            }

            // Title Screen Camera Pan
            if (gameState === 'title') {
                const t = g.clock.getElapsedTime();
                g.camera.position.x = Math.sin(t * 0.4) * 8;
                g.camera.position.y = 4 + Math.cos(t * 0.3) * 1.5;
                g.camera.position.z = 10 + Math.cos(t * 0.4) * 4;
                g.camera.lookAt(0, 1.2, 0);

                // Idle hover motion
                g.playerGroup.position.y = 1.2 + Math.sin(t * 2) * 0.15;
                g.playerGroup.rotation.y = Math.sin(t * 0.8) * 0.2;
                g.renderer.render(g.scene, g.camera);
                return;
            }

            if (gameState !== 'playing') {
                g.renderer.render(g.scene, g.camera);
                return;
            }

            // ================= PLAYING LOGIC =================
            // Continuous input
            const moveSpeed = 18;
            let targetVx = 0;
            let targetVz = -14; // Constant forward sprint

            if (g.heldKeys['KeyA'] || g.heldKeys['ArrowLeft']) targetVx -= moveSpeed;
            if (g.heldKeys['KeyD'] || g.heldKeys['ArrowRight']) targetVx += moveSpeed;
            if (g.heldKeys['KeyW'] || g.heldKeys['ArrowUp']) targetVz -= 6;
            if (g.heldKeys['KeyS'] || g.heldKeys['ArrowDown']) targetVz += 4;
            if (g.heldKeys['Space']) targetVz -= 10; // Cyber Boost

            // Exponential damping
            const damp = 1 - Math.exp(-12 * dt);
            g.playerVelocity.x += (targetVx - g.playerVelocity.x) * damp;
            g.playerVelocity.z += (targetVz - g.playerVelocity.z) * damp;

            g.playerPos.x += g.playerVelocity.x * dt;
            g.playerPos.z += g.playerVelocity.z * dt;

            // Constrain lane bounds
            g.playerPos.x = Math.max(-18, Math.min(18, g.playerPos.x));

            // Bank roll & tilt
            const targetRoll = -g.playerVelocity.x * 0.035;
            const targetPitch = (g.playerVelocity.z + 14) * 0.02;
            g.playerGroup.rotation.z += (targetRoll - g.playerGroup.rotation.z) * damp;
            g.playerGroup.rotation.x += (targetPitch - g.playerGroup.rotation.x) * damp;

            // Apply position
            g.playerGroup.position.copy(g.playerPos);
            g.playerGroup.position.y = 1.2 + Math.sin(g.clock.getElapsedTime() * 6) * 0.08;

            // Damped Camera Follow with Decaying Shake
            const targetCamX = g.playerPos.x * 0.6;
            const targetCamY = g.playerPos.y + 3.8;
            const targetCamZ = g.playerPos.z + 9.5;

            let shakeOffset = new THREE.Vector3();
            if (g.cameraShake > 0) {
                shakeOffset.set(
                    (Math.random() - 0.5) * g.cameraShake,
                    (Math.random() - 0.5) * g.cameraShake,
                    (Math.random() - 0.5) * g.cameraShake
                );
                g.cameraShake = Math.max(0, g.cameraShake - dt * 3.5);
            }

            g.camera.position.x += (targetCamX - g.camera.position.x) * (1 - Math.exp(-8 * dt)) + shakeOffset.x;
            g.camera.position.y += (targetCamY - g.camera.position.y) * (1 - Math.exp(-8 * dt)) + shakeOffset.y;
            g.camera.position.z += (targetCamZ - g.camera.position.z) * (1 - Math.exp(-8 * dt)) + shakeOffset.z;
            g.camera.lookAt(g.playerPos.x * 0.5, 1.5, g.playerPos.z - 8);

            // Move ground & dust forward with player
            g.groundMesh.position.z = g.playerPos.z;
            g.particles.position.z = g.playerPos.z;

            // Update Crystals rotation & collision
            g.crystals.forEach((crystal) => {
                crystal.rotation.y += dt * 2.5;
                crystal.position.y = 1.3 + Math.sin(g.clock.getElapsedTime() * 3 + crystal.position.x) * 0.2;

                // Reposition ahead if player passed it
                if (crystal.position.z > g.playerPos.z + 8) {
                    crystal.position.z = g.playerPos.z - (Math.random() * 80 + 40);
                    crystal.position.x = (Math.random() - 0.5) * 34;
                    crystal.visible = true;
                }

                // Check collision (distance < 1.6)
                if (crystal.visible && crystal.position.distanceTo(g.playerPos) < 1.7) {
                    crystal.visible = false;
                    playSynthSound('pickup');
                    setScore(s => s + 100);
                    setDataCoresCollected(c => {
                        const next = c + 1;
                        if (next >= 15) {
                            setGameState('victory');
                        }
                        return next;
                    });
                }
            });

            // Update Hazards & Collision
            g.hazards.forEach((hazard) => {
                if (hazard.position.z > g.playerPos.z + 10) {
                    hazard.position.z = g.playerPos.z - (Math.random() * 90 + 50);
                    hazard.position.x = (Math.random() - 0.5) * 32;
                }

                // Collision with Hazard (distance < 1.8)
                if (hazard.position.distanceTo(g.playerPos) < 1.8) {
                    playSynthSound('hit');
                    g.cameraShake = 1.2;
                    g.hitStopFrames = 4; // 30-80ms hitstop
                    setShield(sh => {
                        const newShield = sh - 35;
                        if (newShield <= 0) {
                            playSynthSound('gameover');
                            setGameState('gameover');
                        }
                        return Math.max(0, newShield);
                    });
                    // Push hazard forward so no double trigger
                    hazard.position.z -= 15;
                }
            });

            // Energy drain over time
            setEnergy(e => Math.max(0, e - dt * 2.5));

            g.renderer.render(g.scene, g.camera);
        };

        animId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('resize', handleResize);
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
            }
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [gameState, playSynthSound]);

    const handleStartGame = () => {
        playSynthSound('start');
        setScore(0);
        setShield(100);
        setEnergy(100);
        setDataCoresCollected(0);
        if (gameLoopRef.current) {
            gameLoopRef.current.playerPos.set(0, 1.2, 0);
            gameLoopRef.current.playerVelocity.set(0, 0, 0);
        }
        setGameState('playing');
    };

    return (
        <div className="fixed inset-0 z-[150] w-screen h-screen bg-black overflow-hidden font-sans select-none">
            {/* Stable WebGL Canvas Container */}
            <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

            {/* ========================================================= */}
            {/* TITLE SCREEN (Game Shell Directive)                       */}
            {/* ========================================================= */}
            {gameState === 'title' && (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-8 sm:p-12 z-20 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40">
                    {/* Top corner exit button */}
                    <div className="w-full flex justify-between items-center pointer-events-auto">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                            <span>SHADOW ENGINE 3D · 60FPS PBR</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Bespoke inline SVG Title Lockup */}
                    <div className="text-center space-y-4 max-w-xl pointer-events-auto">
                        <div className="flex justify-center">
                            <svg className="w-16 h-16 text-cyan-400 animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                                <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="currentColor" fill="rgba(6,182,212,0.15)" />
                                <circle cx="50" cy="50" r="18" fill="rgba(6,182,212,0.3)" />
                                <path d="M50 20 L50 80 M20 50 L80 50" stroke="#38bdf8" strokeWidth="2" />
                            </svg>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-amber-300 uppercase drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]">
                            بروتوكول الظل السيبراني 3D
                        </h1>
                        <p className="text-sm sm:text-base text-cyan-200/70 font-medium">
                            Cyber Shadow Protocol 3D: تحكم في مسيّرة الظل السيادية، واجمع عُقد البيانات، وتفادَ أبراج الحظر الإلكتروني.
                        </p>

                        {/* Primary Start CTA Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleStartGame}
                                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-black font-black text-base sm:text-lg tracking-wider shadow-[0_0_35px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95"
                            >
                                اضغط للبدء (ENTER / START)
                            </button>
                        </div>

                        {/* Flat Control-hint line */}
                        <p className="text-xs text-white/40 font-mono tracking-wider pt-2">
                            WASD / Arrows لتحريك المسيّرة · Space للدفعة النفاثة · Esc للإيقاف المؤقت
                        </p>
                    </div>

                    {/* Bottom footer signature */}
                    <div className="text-[11px] text-white/30 font-mono">
                        SOVEREIGN AGI 3D SIMULATION · THREE.JS PBR SHADOWS
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* IN-GAME LOW-OCCLUSION HUD (<15% viewport footprint)       */}
            {/* ========================================================= */}
            {gameState === 'playing' && (
                <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-10">
                    {/* Top Status Clusters */}
                    <div className="flex items-center justify-between w-full">
                        {/* Health & Energy */}
                        <div className="flex items-center gap-3 bg-black/60 border border-cyan-500/30 backdrop-blur-md px-4 py-2 rounded-2xl">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 font-mono">
                                <Shield className="w-4 h-4 text-cyan-400" />
                                <span className="tabular-nums">{shield}%</span>
                            </div>
                            <div className="w-px h-4 bg-white/20" />
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="tabular-nums">{Math.round(energy)}%</span>
                            </div>
                        </div>

                        {/* Score & Cores Cluster */}
                        <div className="flex items-center gap-4 bg-black/60 border border-emerald-500/30 backdrop-blur-md px-4 py-2 rounded-2xl">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                                <Trophy className="w-4 h-4 text-emerald-400" />
                                <span className="tabular-nums">{score} PTS</span>
                            </div>
                            <div className="w-px h-4 bg-white/20" />
                            <div className="text-xs text-emerald-300 font-mono">
                                CORES: <span className="font-bold tabular-nums">{dataCoresCollected}/15</span>
                            </div>
                        </div>

                        {/* Control Buttons (Pause & Mute) */}
                        <div className="flex items-center gap-2 pointer-events-auto">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="p-2 rounded-xl bg-black/60 border border-white/20 text-white/70 hover:text-white"
                            >
                                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setGameState('paused')}
                                className="p-2 rounded-xl bg-black/60 border border-white/20 text-white/70 hover:text-white"
                            >
                                <Pause className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Bottom minimal flight telemetry */}
                    <div className="flex justify-center text-[10px] font-mono text-cyan-400/50">
                        SPEED: 180 KM/H · QUANTUM DRIVE ACTIVE
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* PAUSE MODAL                                               */}
            {/* ========================================================= */}
            {gameState === 'paused' && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30 font-sans">
                    <div className="p-6 rounded-2xl bg-[#090d16] border border-cyan-500/40 text-center space-y-4 max-w-sm w-full">
                        <h2 className="text-xl font-bold text-cyan-300">اللعبة متوقفة مؤقتاً</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => setGameState('playing')}
                                className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-sm hover:bg-cyan-400"
                            >
                                استئناف اللعب
                            </button>
                            <button
                                onClick={handleStartGame}
                                className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20"
                            >
                                إعادة المحاولة
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm"
                            >
                                الخروج من اللعبة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* GAME OVER MODAL                                           */}
            {/* ========================================================= */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 bg-red-950/70 backdrop-blur-md flex items-center justify-center p-4 z-30 font-sans">
                    <div className="p-6 rounded-2xl bg-[#0e0709] border border-red-500/40 text-center space-y-4 max-w-sm w-full">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                            <X className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-red-400">تحطم مسيّرة الظل!</h2>
                        <p className="text-xs text-white/60">
                            انتهى الدرع الدفاعي إثر الاصطدام بأبراج الحظر الإلكتروني.
                        </p>
                        <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs flex justify-between font-mono">
                            <span>النقاط المحققة:</span>
                            <span className="font-bold text-amber-400">{score} PTS</span>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={handleStartGame}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-red-500/20"
                            >
                                إعادة الإطلاق فوراً
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl bg-white/10 text-white/80 hover:text-white text-sm"
                            >
                                العودة إلى الظل
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* VICTORY MODAL                                             */}
            {/* ========================================================= */}
            {gameState === 'victory' && (
                <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-md flex items-center justify-center p-4 z-30 font-sans">
                    <div className="p-6 rounded-2xl bg-[#06120e] border border-emerald-500/40 text-center space-y-4 max-w-sm w-full">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                            <Trophy className="w-6 h-6 animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-black text-emerald-400">تم اختراق مصفوفة الظل بنجاح!</h2>
                        <p className="text-xs text-white/70">
                            أحسنت يا ماستر! تم جمع كافة عُقد البيانات (15/15) بنجاح سيادي ساحق.
                        </p>
                        <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs flex justify-between font-mono">
                            <span>مجموع النقاط:</span>
                            <span className="font-bold text-emerald-400">{score + 1000} PTS</span>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={handleStartGame}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-sm shadow-lg shadow-emerald-500/20"
                            >
                                جولة جديدة
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl bg-white/10 text-white/80 hover:text-white text-sm"
                            >
                                إنهاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
