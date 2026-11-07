import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Cosmos3DBackgroundProps {
  className?: string;
  speed?: number;
}

export const Cosmos3DBackground: React.FC<Cosmos3DBackgroundProps> = ({ 
  className = "absolute inset-0 pointer-events-none z-0",
  speed = 0.002
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.0015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 45);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Procedural Starfield (2,500 Stars)
    const starsCount = 2500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 300;
      starPos[i + 1] = (Math.random() - 0.5) * 200;
      starPos[i + 2] = (Math.random() - 0.5) * 300;

      // Cyan / White / Amber tint
      const tint = Math.random();
      if (tint > 0.8) {
        starColors[i] = 0.0; starColors[i + 1] = 0.9; starColors[i + 2] = 1.0; // Cyan
      } else if (tint > 0.6) {
        starColors[i] = 1.0; starColors[i + 1] = 0.8; starColors[i + 2] = 0.4; // Amber
      } else {
        starColors[i] = 0.9; starColors[i + 1] = 0.95; starColors[i + 2] = 1.0; // Ice white
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 2. Earth Sphere (Procedural High-Tech Obsidian & Cyan Grid)
    const earthGeo = new THREE.SphereGeometry(12, 64, 64);
    
    // Procedural grid canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#030816';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      for (let x = 0; x <= 1024; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      }
      for (let y = 0; y <= 512; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
      }
      // Glowing continents contours
      ctx.fillStyle = '#06b6d4';
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 40; i++) {
        const cx = Math.random() * 1024;
        const cy = 100 + Math.random() * 312;
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + Math.random() * 50, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const earthTexture = new THREE.CanvasTexture(canvas);

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.4,
      metalness: 0.6,
      emissive: new THREE.Color(0x021526),
      emissiveIntensity: 0.8,
      wireframe: false
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -2, -10);
    scene.add(earthMesh);

    // 3. Atmospheric Outer Glow Layer
    const atmoGeo = new THREE.SphereGeometry(12.6, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    atmoMesh.position.copy(earthMesh.position);
    scene.add(atmoMesh);

    // 4. Orbital Telemetry Rings (Representing Shadow Avatars & Satellites)
    const ringGroup = new THREE.Group();
    ringGroup.position.copy(earthMesh.position);

    const createOrbitRing = (radius: number, tiltX: number, tiltZ: number, color: number) => {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(120);
      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Line(ringGeo, ringMat);
      ring.rotation.x = tiltX;
      ring.rotation.z = tiltZ;
      return ring;
    };

    const ring1 = createOrbitRing(16, Math.PI / 2.3, 0.2, 0x00f0ff);
    const ring2 = createOrbitRing(20, Math.PI / 2.8, -0.4, 0x8b5cf6);
    const ring3 = createOrbitRing(24, Math.PI / 2.1, 0.6, 0xf59e0b);
    ringGroup.add(ring1);
    ringGroup.add(ring2);
    ringGroup.add(ring3);
    scene.add(ringGroup);

    // 5. Lighting
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(30, 20, 20);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x0a192f, 1.2);
    scene.add(ambientLight);

    // Mouse Parallax Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 4;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop (Zero-Garbage Collection 60fps)
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate Earth & Orbits
      earthMesh.rotation.y += speed;
      atmoMesh.rotation.y += speed;
      ring1.rotation.z += speed * 1.5;
      ring2.rotation.z -= speed * 1.2;
      ring3.rotation.z += speed * 0.8;
      starField.rotation.y += speed * 0.2;

      // Gentle Camera Parallax
      camera.position.x += (mouseX - camera.position.x) * 0.03;
      camera.position.y += (-mouseY + 15 - camera.position.y) * 0.03;
      camera.lookAt(earthMesh.position.x, earthMesh.position.y, earthMesh.position.z);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
    };
  }, [speed]);

  return <div ref={mountRef} className={className} />;
};
