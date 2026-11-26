import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';

interface HeroSpatial3DProps {
  className?: string;
  accentTone?: 'emerald' | 'amber' | 'rose' | 'slate';
}

const ACCENT_HEX: Record<NonNullable<HeroSpatial3DProps['accentTone']>, number> = {
  emerald: 0x02fedc,
  amber: 0xf59e0b,
  rose: 0xf502fd,
  slate: 0x5a5cff,
};

/**
 * Interactive WebGL 3D liquid-glass torus prism powered by Three.js Physical PBR
 * with synthetic studio environment reflection, pointer-tracked tilt, scroll
 * rotation, and zero external asset dependencies. Falls back gracefully if WebGL
 * is unavailable or reduced motion is enabled.
 */
export function HeroSpatial3D({ className = '', accentTone = 'emerald' }: HeroSpatial3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const accentColorRef = useRef<number>(ACCENT_HEX[accentTone]);
  const [webglReady, setWebglReady] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    accentColorRef.current = ACCENT_HEX[accentTone];
  }, [accentTone]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldReduceMotion) {
      setWebglReady(false);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId = 0;
    let isVisible = true;
    let pmremGenerator: THREE.PMREMGenerator | null = null;
    let envTexture: THREE.CanvasTexture | null = null;
    let envRenderTarget: THREE.WebGLRenderTarget | null = null;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const width = Math.max(container.clientWidth, 260);
    const height = Math.max(container.clientHeight, 260);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    // Synthesize a smooth studio reflection map in memory so physical glass refracts cleanly
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 128;
    envCanvas.height = 64;
    const ctx = envCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 128, 64);
      grad.addColorStop(0.0, '#09101f');
      grad.addColorStop(0.24, '#02fedc');
      grad.addColorStop(0.48, '#ffffff');
      grad.addColorStop(0.68, '#5a5cff');
      grad.addColorStop(0.88, '#f502fd');
      grad.addColorStop(1.0, '#07080f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 64);

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(16, 8, 28, 10);
      ctx.fillRect(76, 18, 22, 8);
    }

    envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture.colorSpace = THREE.SRGBColorSpace;
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    envRenderTarget = pmremGenerator.fromEquirectangular(envTexture);
    scene.environment = envRenderTarget.texture;

    // 3-point studio lighting tinted in brand cyan, electric blue, and pink
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const cyanLight = new THREE.PointLight(0x02fedc, 36, 18);
    cyanLight.position.set(-3.2, 2.4, 3.0);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xf502fd, 32, 18);
    pinkLight.position.set(3.2, -2.1, 2.6);
    scene.add(pinkLight);

    const blueLight = new THREE.PointLight(0x5a5cff, 40, 20);
    blueLight.position.set(0.2, 2.8, -2.4);
    scene.add(blueLight);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Sculptural Liquid Glass Torus Knot
    const knotGeo = new THREE.TorusKnotGeometry(1.06, 0.31, 144, 28, 2, 3);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0xedf6ff,
      metalness: 0.04,
      roughness: 0.06,
      transmission: 0.86,
      thickness: 1.4,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.85,
      iridescenceIOR: 1.34,
      reflectivity: 0.95,
      envMapIntensity: 1.45,
    });
    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    coreGroup.add(knotMesh);

    // Inner verification crystal octahedron
    const crystalGeo = new THREE.OctahedronGeometry(0.46, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x5a5cff,
      emissive: accentColorRef.current,
      emissiveIntensity: 0.35,
      metalness: 0.25,
      roughness: 0.12,
      clearcoat: 1.0,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    coreGroup.add(crystalMesh);

    // Wireframe lattice cage around the crystal
    const cageGeo = new THREE.IcosahedronGeometry(1.68, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x5a5cff,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // Orbital glass halo rings + satellite spheres
    const ringGeoA = new THREE.TorusGeometry(1.94, 0.016, 12, 120);
    const ringMatA = new THREE.MeshStandardMaterial({
      color: 0x02fedc,
      emissive: 0x02fedc,
      emissiveIntensity: 0.45,
      metalness: 0.8,
      roughness: 0.15,
    });
    const ringA = new THREE.Mesh(ringGeoA, ringMatA);
    ringA.rotation.x = Math.PI * 0.36;
    ringA.rotation.y = Math.PI * 0.14;
    coreGroup.add(ringA);

    const ringGeoB = new THREE.TorusGeometry(2.22, 0.012, 12, 120);
    const ringMatB = new THREE.MeshStandardMaterial({
      color: 0xf502fd,
      emissive: 0xf502fd,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.15,
    });
    const ringB = new THREE.Mesh(ringGeoB, ringMatB);
    ringB.rotation.x = -Math.PI * 0.28;
    ringB.rotation.y = -Math.PI * 0.22;
    coreGroup.add(ringB);

    const satGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const satMatCyan = new THREE.MeshBasicMaterial({ color: 0x02fedc });
    const satMatPink = new THREE.MeshBasicMaterial({ color: 0xf502fd });
    const satA = new THREE.Mesh(satGeo, satMatCyan);
    satA.position.set(1.94, 0, 0);
    ringA.add(satA);

    const satB = new THREE.Mesh(satGeo, satMatPink);
    satB.position.set(-2.22, 0, 0);
    ringB.add(satB);

    // Ambient volumetric particle shell
    const particleCount = 68;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 1.9 + ((i * 37) % 100) / 85;
      const theta = i * 2.39996;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x94a3ff,
      size: 0.045,
      transparent: true,
      opacity: 0.72,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particleField);

    let targetRotX = 0;
    let targetRotY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      targetRotY = nx * 0.42;
      targetRotX = -ny * 0.32;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleResize = () => {
      if (!container || !renderer) return;
      const nextW = Math.max(container.clientWidth, 240);
      const nextH = Math.max(container.clientHeight, 240);
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
    };
    window.addEventListener('resize', handleResize);

    const targetEmissive = new THREE.Color(accentColorRef.current);
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden || !renderer) return;

      const elapsed = clock.getElapsedTime();
      const scrollRatio = Math.min(window.scrollY / 900, 1.4);

      knotMesh.rotation.y = elapsed * 0.24 + scrollRatio * 1.1;
      knotMesh.rotation.x = Math.sin(elapsed * 0.35) * 0.22 + scrollRatio * 0.4;

      crystalMesh.rotation.y = -elapsed * 0.48;
      crystalMesh.rotation.z = elapsed * 0.3;

      targetEmissive.setHex(accentColorRef.current);
      crystalMat.emissive.lerp(targetEmissive, 0.06);

      cageMesh.rotation.y = elapsed * 0.08;
      cageMesh.rotation.x = -elapsed * 0.06;

      ringA.rotation.z = elapsed * 0.38;
      ringB.rotation.z = -elapsed * 0.29;
      particleField.rotation.y = -elapsed * 0.09;

      coreGroup.rotation.y += (targetRotY - coreGroup.rotation.y) * 0.05;
      coreGroup.rotation.x += (targetRotX - coreGroup.rotation.x) * 0.05;
      coreGroup.position.y = Math.sin(elapsed * 1.1) * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      knotGeo.dispose();
      knotMat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      ringGeoA.dispose();
      ringMatA.dispose();
      ringGeoB.dispose();
      ringMatB.dispose();
      satGeo.dispose();
      satMatCyan.dispose();
      satMatPink.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      envRenderTarget?.dispose();
      envTexture?.dispose();
      pmremGenerator?.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [shouldReduceMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`relative select-none ${className}`}
    >
      {!webglReady && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-44 h-44 rounded-full border border-brand-blue/35 liquid-glass flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl rotate-45 gradient-surface border border-[#02FEDC]/40 shadow-[0_0_40px_rgba(90,92,255,0.3)]" />
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroSpatial3D;
