import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';

interface HeroSpatial3DProps {
  className?: string;
  theme?: 'dark' | 'light';
}

function createShieldShape(scale = 1): THREE.Shape {
  const s = scale;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.72 * s);
  shape.quadraticCurveTo(0.42 * s, 0.70 * s, 0.62 * s, 0.50 * s);
  shape.lineTo(0.62 * s, 0.04 * s);
  shape.bezierCurveTo(0.62 * s, -0.35 * s, 0.30 * s, -0.60 * s, 0, -0.76 * s);
  shape.bezierCurveTo(-0.30 * s, -0.60 * s, -0.62 * s, -0.35 * s, -0.62 * s, 0.04 * s);
  shape.lineTo(-0.62 * s, 0.50 * s);
  shape.quadraticCurveTo(-0.42 * s, 0.70 * s, 0, 0.72 * s);
  return shape;
}

function createCheckmarkShape(scale = 1): THREE.Shape {
  const s = scale;
  const shape = new THREE.Shape();
  shape.moveTo(-0.24 * s, 0.02 * s);
  shape.lineTo(-0.16 * s, 0.10 * s);
  shape.lineTo(-0.04 * s, -0.02 * s);
  shape.lineTo(0.20 * s, 0.22 * s);
  shape.lineTo(0.28 * s, 0.14 * s);
  shape.lineTo(-0.04 * s, -0.18 * s);
  shape.closePath();
  return shape;
}

/**
 * Showstopping 3D Iridescent Chrome & Liquid-Glass Verification Shield Sculpture.
 * Combines a flowing sculpted iridescent liquid-chrome halo knot with an iconic
 * 3D beveled Verification Shield & Checkmark core so the hero immediately looks
 * futuristic and unmistakably represents email deliverability protection.
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
    renderer.toneMappingExposure = 1.24;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialAspect = width / height;
    const camera = new THREE.PerspectiveCamera(34, initialAspect, 0.1, 100);
    const computeCameraZ = (aspect: number) => (aspect < 1 ? 6.4 / Math.max(aspect, 0.72) : 5.75);
    camera.position.set(0, 0.02, computeCameraZ(initialAspect));

    // Multi-chromatic studio reflection dome: cyan, sapphire, magenta, warm amber highlight, and crisp studio softboxes
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 256;
    envCanvas.height = 128;
    const ctx = envCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 256, 128);
      grad.addColorStop(0.0, '#040814');
      grad.addColorStop(0.18, '#02fedc');
      grad.addColorStop(0.38, '#ffffff');
      grad.addColorStop(0.56, '#5a5cff');
      grad.addColorStop(0.76, '#f502fd');
      grad.addColorStop(0.90, '#ff9a62');
      grad.addColorStop(1.0, '#070b18');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.fillRect(26, 10, 74, 14);
      ctx.fillRect(160, 24, 58, 12);
      ctx.fillStyle = 'rgba(2, 254, 220, 0.85)';
      ctx.fillRect(20, 94, 88, 12);
    }

    envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture.colorSpace = THREE.SRGBColorSpace;
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    envRenderTarget = pmremGenerator.fromEquirectangular(envTexture);
    scene.environment = envRenderTarget.texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(2.8, 4.2, 5.2);
    scene.add(keyLight);

    const cyanLight = new THREE.PointLight(0x02fedc, 36, 18);
    cyanLight.position.set(-3.4, 2.2, 3.0);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xf502fd, 32, 18);
    pinkLight.position.set(3.4, -2.1, 2.8);
    scene.add(pinkLight);

    const blueLight = new THREE.PointLight(0x5a5cff, 38, 20);
    blueLight.position.set(0.0, 2.4, -2.5);
    scene.add(blueLight);

    const disposables: Array<{ dispose: () => void }> = [];
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const isLight = themeRef.current === 'light';

    // 1. Flowing Chrome-Iridescent Liquid Ribbon Orbiting the Core (reference hero luxury gloss sheen)
    const sculptureGeo = new THREE.TorusKnotGeometry(1.18, 0.24, 200, 36, 2, 3);
    disposables.push(sculptureGeo);

    const sculptureMat = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0xe0eaff : 0x202744,
      metalness: isLight ? 0.42 : 0.72,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      iridescence: 1.0,
      iridescenceIOR: 1.38,
      iridescenceThicknessRange: [180, 560],
      reflectivity: 1.0,
      envMapIntensity: isLight ? 1.65 : 2.15,
    });
    disposables.push(sculptureMat);

    const sculptureMesh = new THREE.Mesh(sculptureGeo, sculptureMat);
    sculptureMesh.position.z = -0.32;
    stageGroup.add(sculptureMesh);

    // 2. Iconic Foreground Beveled Liquid-Glass Verification Shield Crest (keeps the centerpiece unmistakably about Inbox Protection)
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(0, 0, 0.52);
    stageGroup.add(shieldGroup);

    const shieldShape = createShieldShape(1.0);
    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.068,
      bevelSize: 0.055,
      bevelSegments: 10,
      curveSegments: 24,
    });
    shieldGeo.center();
    disposables.push(shieldGeo);

    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0xf8fbff : 0x10172d,
      metalness: 0.14,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      iridescence: 0.9,
      iridescenceIOR: 1.33,
      transparent: true,
      opacity: isLight ? 0.92 : 0.90,
      envMapIntensity: 1.9,
    });
    disposables.push(shieldMat);

    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldGroup.add(shieldMesh);

    // Luminous glowing emerald-cyan beveled checkmark centered inside the liquid-glass shield
    const checkShape = createCheckmarkShape(1.42);
    const checkGeo = new THREE.ExtrudeGeometry(checkShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.022,
      bevelSize: 0.018,
      bevelSegments: 6,
    });
    checkGeo.center();
    disposables.push(checkGeo);

    const checkMat = new THREE.MeshPhysicalMaterial({
      color: 0x02fedc,
      emissive: 0x02fedc,
      emissiveIntensity: 0.45,
      metalness: 0.15,
      roughness: 0.04,
      clearcoat: 1.0,
    });
    disposables.push(checkMat);

    const checkMesh = new THREE.Mesh(checkGeo, checkMat);
    checkMesh.position.set(0, 0.02, 0.14);
    shieldGroup.add(checkMesh);

    // 3. Sleek Precision Verification Orbit Halo & Verified Signal Satellites
    const haloGeo = new THREE.TorusGeometry(1.78, 0.014, 14, 128);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x02fedc,
      transparent: true,
      opacity: 0.55,
    });
    disposables.push(haloGeo, haloMat);

    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI * 0.36;
    haloMesh.rotation.y = Math.PI * 0.18;
    stageGroup.add(haloMesh);

    const satGeo = new THREE.SphereGeometry(0.068, 20, 20);
    const satMatCyan = new THREE.MeshPhysicalMaterial({ color: 0x02fedc, emissive: 0x02fedc, emissiveIntensity: 0.85, roughness: 0.05 });
    const satMatPink = new THREE.MeshPhysicalMaterial({ color: 0xf502fd, emissive: 0xf502fd, emissiveIntensity: 0.75, roughness: 0.05 });
    disposables.push(satGeo, satMatCyan, satMatPink);

    const satA = new THREE.Mesh(satGeo, satMatCyan);
    satA.position.set(1.78, 0, 0);
    haloMesh.add(satA);

    const satB = new THREE.Mesh(satGeo, satMatPink);
    satB.position.set(-1.78, 0, 0);
    haloMesh.add(satB);

    let pointerTiltX = 0;
    let pointerTiltY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      pointerTiltY = nx * 0.28;
      pointerTiltX = -ny * 0.20;
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

    const darkChrome = new THREE.Color(0x202744);
    const lightChrome = new THREE.Color(0xdce8ff);
    const darkShield = new THREE.Color(0x10172d);
    const lightShield = new THREE.Color(0xf8fbff);
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden || !renderer) return;

      const elapsed = clock.getElapsedTime();
      const scrollRatio = Math.min(window.scrollY / 900, 1.4);
      const light = themeRef.current === 'light';

      sculptureMat.color.lerp(light ? lightChrome : darkChrome, 0.08);
      sculptureMat.metalness = light ? 0.36 : 0.72;
      shieldMat.color.lerp(light ? lightShield : darkShield, 0.08);

      sculptureMesh.rotation.y = elapsed * 0.24 + scrollRatio * 0.9;
      sculptureMesh.rotation.x = Math.sin(elapsed * 0.32) * 0.18 + scrollRatio * 0.3;

      shieldGroup.rotation.y = Math.sin(elapsed * 0.85) * 0.14;
      shieldGroup.rotation.x = Math.cos(elapsed * 0.7) * 0.06;
      shieldGroup.position.y = Math.sin(elapsed * 1.15) * 0.05;

      haloMesh.rotation.z = elapsed * 0.34;

      stageGroup.rotation.y += (pointerTiltY - stageGroup.rotation.y) * 0.06;
      stageGroup.rotation.x += (pointerTiltX - stageGroup.rotation.x) * 0.06;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      for (const d of disposables) d.dispose();
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
          <div className="w-40 h-44 rounded-3xl liquid-glass flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-500 font-bold text-2xl">
              ✓
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroSpatial3D;
