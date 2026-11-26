import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';

interface HeroSpatial3DProps {
  className?: string;
  theme?: 'dark' | 'light';
}

/**
 * Sleek, translucent 3D liquid-glass orbital ribbon and faceted prism
 * powered by Three.js Physical PBR. Uses thin, airy geometry and
 * iridescent highlights so it frames frosted UI elements cleanly without
 * heavy visual clutter.
 */
export function HeroSpatial3D({ className = '', theme = 'dark' }: HeroSpatial3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<'dark' | 'light'>(theme);
  const [webglReady, setWebglReady] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

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

    const width = Math.max(container.clientWidth, 280);
    const height = Math.max(container.clientHeight, 260);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialAspect = width / height;
    const camera = new THREE.PerspectiveCamera(36, initialAspect, 0.1, 100);
    const computeCameraZ = (aspect: number) => (aspect < 1 ? 6.9 / Math.max(aspect, 0.72) : 6.8);
    camera.position.set(0, 0, computeCameraZ(initialAspect));

    // In-memory iridescent studio reflection map
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 128;
    envCanvas.height = 64;
    const ctx = envCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 128, 64);
      grad.addColorStop(0.0, '#070b18');
      grad.addColorStop(0.25, '#02fedc');
      grad.addColorStop(0.50, '#ffffff');
      grad.addColorStop(0.72, '#5a5cff');
      grad.addColorStop(0.92, '#f502fd');
      grad.addColorStop(1.0, '#0a0f24');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 64);

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(14, 6, 32, 10);
      ctx.fillRect(78, 16, 24, 8);
    }

    envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture.colorSpace = THREE.SRGBColorSpace;
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    envRenderTarget = pmremGenerator.fromEquirectangular(envTexture);
    scene.environment = envRenderTarget.texture;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const cyanLight = new THREE.PointLight(0x02fedc, 34, 18);
    cyanLight.position.set(-3.4, 2.2, 3.2);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xf502fd, 30, 18);
    pinkLight.position.set(3.4, -2.0, 2.8);
    scene.add(pinkLight);

    const blueLight = new THREE.PointLight(0x5a5cff, 38, 20);
    blueLight.position.set(0.2, 2.6, -2.2);
    scene.add(blueLight);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Sleek airy liquid-glass mobius ribbon (slender tube radius for refined luxury silhouettes)
    const ribbonGeo = new THREE.TorusKnotGeometry(1.36, 0.088, 192, 32, 2, 3);
    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: themeRef.current === 'light' ? 0xdbeafe : 0x6f86ff,
      metalness: 0.08,
      roughness: 0.05,
      transmission: 0.88,
      transparent: true,
      opacity: 0.78,
      thickness: 0.75,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 1.0,
      iridescenceIOR: 1.35,
      envMapIntensity: 1.65,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    coreGroup.add(ribbonMesh);

    // Translucent faceted inner crystal
    const prismGeo = new THREE.OctahedronGeometry(0.46, 0);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0x5a5cff,
      emissive: 0x02fedc,
      emissiveIntensity: 0.25,
      metalness: 0.15,
      roughness: 0.08,
      transparent: true,
      opacity: 0.72,
      clearcoat: 1.0,
      iridescence: 0.9,
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    coreGroup.add(prismMesh);

    // Ultra-fine geodesic wireframe enclosure
    const cageGeo = new THREE.IcosahedronGeometry(1.75, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x5a5cff,
      wireframe: true,
      transparent: true,
      opacity: themeRef.current === 'light' ? 0.16 : 0.12,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // Dual precision orbital halos
    const haloGeoA = new THREE.TorusGeometry(2.05, 0.011, 12, 128);
    const haloMatA = new THREE.MeshBasicMaterial({
      color: 0x02fedc,
      transparent: true,
      opacity: 0.55,
    });
    const haloA = new THREE.Mesh(haloGeoA, haloMatA);
    haloA.rotation.x = Math.PI * 0.34;
    haloA.rotation.y = Math.PI * 0.15;
    coreGroup.add(haloA);

    const haloGeoB = new THREE.TorusGeometry(2.28, 0.009, 12, 128);
    const haloMatB = new THREE.MeshBasicMaterial({
      color: 0xf502fd,
      transparent: true,
      opacity: 0.45,
    });
    const haloB = new THREE.Mesh(haloGeoB, haloMatB);
    haloB.rotation.x = -Math.PI * 0.26;
    haloB.rotation.y = -Math.PI * 0.2;
    coreGroup.add(haloB);

    const nodeGeo = new THREE.SphereGeometry(0.048, 16, 16);
    const nodeMatCyan = new THREE.MeshBasicMaterial({ color: 0x02fedc });
    const nodeMatPink = new THREE.MeshBasicMaterial({ color: 0xf502fd });
    const nodeA = new THREE.Mesh(nodeGeo, nodeMatCyan);
    nodeA.position.set(2.05, 0, 0);
    haloA.add(nodeA);

    const nodeB = new THREE.Mesh(nodeGeo, nodeMatPink);
    nodeB.position.set(-2.28, 0, 0);
    haloB.add(nodeB);

    let targetRotX = 0;
    let targetRotY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      targetRotY = nx * 0.38;
      targetRotX = -ny * 0.28;
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
      const nextAspect = nextW / nextH;
      camera.aspect = nextAspect;
      camera.position.z = computeCameraZ(nextAspect);
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    const darkTint = new THREE.Color(0x6f86ff);
    const lightTint = new THREE.Color(0xb8d4ff);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden || !renderer) return;

      const elapsed = clock.getElapsedTime();
      const scrollRatio = Math.min(window.scrollY / 900, 1.4);

      ribbonMat.color.lerp(themeRef.current === 'light' ? lightTint : darkTint, 0.08);
      cageMat.opacity = themeRef.current === 'light' ? 0.17 : 0.11;

      ribbonMesh.rotation.y = elapsed * 0.22 + scrollRatio * 1.1;
      ribbonMesh.rotation.x = Math.sin(elapsed * 0.3) * 0.2 + scrollRatio * 0.35;

      prismMesh.rotation.y = -elapsed * 0.45;
      prismMesh.rotation.z = elapsed * 0.26;
      cageMesh.rotation.y = elapsed * 0.07;

      haloA.rotation.z = elapsed * 0.32;
      haloB.rotation.z = -elapsed * 0.24;

      coreGroup.rotation.y += (targetRotY - coreGroup.rotation.y) * 0.05;
      coreGroup.rotation.x += (targetRotX - coreGroup.rotation.x) * 0.05;
      coreGroup.position.y = Math.sin(elapsed * 0.95) * 0.06;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      ribbonGeo.dispose();
      ribbonMat.dispose();
      prismGeo.dispose();
      prismMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      haloGeoA.dispose();
      haloMatA.dispose();
      haloGeoB.dispose();
      haloMatB.dispose();
      nodeGeo.dispose();
      nodeMatCyan.dispose();
      nodeMatPink.dispose();

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
    <div ref={containerRef} aria-hidden="true" className={`relative select-none ${className}`}>
      {!webglReady && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-40 h-40 rounded-full liquid-glass flex items-center justify-center">
            <div className="w-18 h-18 rounded-2xl rotate-45 gradient-surface border border-[#5A5CFF]/30" />
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroSpatial3D;
