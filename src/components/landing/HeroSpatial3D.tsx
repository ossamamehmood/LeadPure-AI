import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';

interface HeroSpatial3DProps {
  className?: string;
  theme?: 'dark' | 'light';
}

function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createShieldShape(scale = 1): THREE.Shape {
  const s = scale;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.56 * s);
  shape.quadraticCurveTo(0.32 * s, 0.54 * s, 0.46 * s, 0.40 * s);
  shape.lineTo(0.46 * s, 0.04 * s);
  shape.bezierCurveTo(0.46 * s, -0.26 * s, 0.22 * s, -0.46 * s, 0, -0.58 * s);
  shape.bezierCurveTo(-0.22 * s, -0.46 * s, -0.46 * s, -0.26 * s, -0.46 * s, 0.04 * s);
  shape.lineTo(-0.46 * s, 0.40 * s);
  shape.quadraticCurveTo(-0.32 * s, 0.54 * s, 0, 0.56 * s);
  return shape;
}

function createCheckmarkShape(scale = 1): THREE.Shape {
  const s = scale;
  const shape = new THREE.Shape();
  shape.moveTo(-0.22 * s, 0.02 * s);
  shape.lineTo(-0.15 * s, 0.09 * s);
  shape.lineTo(-0.04 * s, -0.02 * s);
  shape.lineTo(0.18 * s, 0.20 * s);
  shape.lineTo(0.25 * s, 0.13 * s);
  shape.lineTo(-0.04 * s, -0.16 * s);
  shape.closePath();
  return shape;
}

/**
 * Meaningful 3D glossy Email Verification centerpiece rendered in real-time Three.js:
 * a beveled liquid-glass mail envelope slab with luminous chevron seal, a foreground
 * 3D Verified Shield & Checkmark crest, floating verified capsule cards, and a crisp
 * studio reflection rig reacting smoothly to pointer tilt.
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
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialAspect = width / height;
    const camera = new THREE.PerspectiveCamera(34, initialAspect, 0.1, 100);
    const computeCameraZ = (aspect: number) => (aspect < 1 ? 6.2 / Math.max(aspect, 0.72) : 5.8);
    camera.position.set(0, 0.08, computeCameraZ(initialAspect));

    // Studio softbox & brand reflection environment for razor-crisp liquid-glass bevel speculars
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 256;
    envCanvas.height = 128;
    const ctx = envCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 256, 128);
      grad.addColorStop(0.0, '#091022');
      grad.addColorStop(0.24, '#02fedc');
      grad.addColorStop(0.50, '#ffffff');
      grad.addColorStop(0.74, '#5a5cff');
      grad.addColorStop(0.95, '#f502fd');
      grad.addColorStop(1.0, '#070b18');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      // Crisp overhead softbox highlight strips for real glass gloss lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.fillRect(28, 10, 82, 16);
      ctx.fillRect(156, 22, 64, 12);
      ctx.fillStyle = 'rgba(2, 254, 220, 0.7)';
      ctx.fillRect(18, 92, 92, 10);
    }

    envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture.colorSpace = THREE.SRGBColorSpace;
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    envRenderTarget = pmremGenerator.fromEquirectangular(envTexture);
    scene.environment = envRenderTarget.texture;

    // 3-point + softbox studio lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(2.5, 4.0, 5.0);
    scene.add(keyLight);

    const cyanRim = new THREE.PointLight(0x02fedc, 28, 16);
    cyanRim.position.set(-3.2, 2.0, 2.5);
    scene.add(cyanRim);

    const pinkRim = new THREE.PointLight(0xf502fd, 24, 16);
    pinkRim.position.set(3.2, -2.0, 2.5);
    scene.add(pinkRim);

    const blueFill = new THREE.PointLight(0x5a5cff, 26, 18);
    blueFill.position.set(0, -1.8, -2.5);
    scene.add(blueFill);

    const stageGroup = new THREE.Group();
    stageGroup.rotation.y = -0.22;
    stageGroup.rotation.x = 0.08;
    scene.add(stageGroup);

    // 1. Beveled 3D Glossy Glass Mail Envelope Tile
    const disposables: Array<{ dispose: () => void }> = [];

    const envShape = createRoundedRectShape(2.52, 1.72, 0.24);
    const envelopeGeo = new THREE.ExtrudeGeometry(envShape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.075,
      bevelSize: 0.065,
      bevelSegments: 10,
      curveSegments: 24,
    });
    envelopeGeo.center();
    disposables.push(envelopeGeo);

    const isLight = themeRef.current === 'light';
    const envelopeMat = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0xe5eeff : 0x181f38,
      metalness: isLight ? 0.05 : 0.14,
      roughness: 0.07,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 0.85,
      iridescenceIOR: 1.36,
      reflectivity: 0.96,
      envMapIntensity: isLight ? 1.45 : 1.85,
      transparent: true,
      opacity: 0.94,
    });
    disposables.push(envelopeMat);

    const envelopeMesh = new THREE.Mesh(envelopeGeo, envelopeMat);
    stageGroup.add(envelopeMesh);

    // Sleek glossy glass bezel border around envelope front
    const trimShape = createRoundedRectShape(2.54, 1.74, 0.24);
    const hole = createRoundedRectShape(2.38, 1.58, 0.18);
    trimShape.holes.push(hole);
    const trimGeo = new THREE.ExtrudeGeometry(trimShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.015,
      bevelSegments: 4,
      curveSegments: 24,
    });
    trimGeo.center();
    disposables.push(trimGeo);

    const trimMat = new THREE.MeshPhysicalMaterial({
      color: 0x8ea8ff,
      metalness: 0.35,
      roughness: 0.08,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.48,
      envMapIntensity: 1.8,
    });
    disposables.push(trimMat);

    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.z = 0.16;
    stageGroup.add(trimMesh);

    // 2. Sculpted Glowing Envelope Chevron Flap ("V" Fold + Seal Jewel)
    const barGeo = new THREE.CapsuleGeometry(0.038, 1.24, 10, 20);
    disposables.push(barGeo);

    const flapMatLeft = new THREE.MeshPhysicalMaterial({
      color: 0x02fedc,
      emissive: 0x02fedc,
      emissiveIntensity: 0.24,
      metalness: 0.2,
      roughness: 0.06,
      clearcoat: 1.0,
    });
    const flapMatRight = new THREE.MeshPhysicalMaterial({
      color: 0x5a5cff,
      emissive: 0x5a5cff,
      emissiveIntensity: 0.28,
      metalness: 0.2,
      roughness: 0.06,
      clearcoat: 1.0,
    });
    disposables.push(flapMatLeft, flapMatRight);

    const leftArm = new THREE.Mesh(barGeo, flapMatLeft);
    leftArm.position.set(-0.52, 0.26, 0.18);
    leftArm.rotation.z = Math.PI * 0.31;
    stageGroup.add(leftArm);

    const rightArm = new THREE.Mesh(barGeo, flapMatRight);
    rightArm.position.set(0.52, 0.26, 0.18);
    rightArm.rotation.z = -Math.PI * 0.31;
    stageGroup.add(rightArm);

    // Center glossy envelope seal jewel
    const sealGeo = new THREE.SphereGeometry(0.105, 24, 24);
    const sealMat = new THREE.MeshPhysicalMaterial({
      color: 0x7c80ff,
      emissive: 0x5a5cff,
      emissiveIntensity: 0.35,
      metalness: 0.1,
      roughness: 0.05,
      clearcoat: 1.0,
      iridescence: 0.9,
    });
    disposables.push(sealGeo, sealMat);
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.scale.set(1, 1, 0.6);
    sealMesh.position.set(0, -0.07, 0.19);
    stageGroup.add(sealMesh);

    // Subtle frosted address lines on lower left inside envelope face
    const lineGeoLong = new THREE.CapsuleGeometry(0.028, 0.72, 8, 16);
    const lineGeoShort = new THREE.CapsuleGeometry(0.028, 0.44, 8, 16);
    const lineMat = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0x64748b : 0xcbd5e1,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1.0,
    });
    disposables.push(lineGeoLong, lineGeoShort, lineMat);

    const line1 = new THREE.Mesh(lineGeoLong, lineMat);
    line1.rotation.z = Math.PI / 2;
    line1.position.set(-0.46, -0.44, 0.17);
    stageGroup.add(line1);

    const line2 = new THREE.Mesh(lineGeoShort, lineMat);
    line2.rotation.z = Math.PI / 2;
    line2.position.set(-0.60, -0.58, 0.17);
    stageGroup.add(line2);

    // 3. Foreground 3D Glossy Verified Shield Crest + Checkmark (True Z-Depth Parallax)
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(1.06, 0.62, 0.44);
    shieldGroup.rotation.z = -0.06;
    stageGroup.add(shieldGroup);

    const shieldShape = createShieldShape(0.86);
    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.055,
      bevelSize: 0.048,
      bevelSegments: 8,
      curveSegments: 20,
    });
    shieldGeo.center();
    disposables.push(shieldGeo);

    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x059669,
      emissive: 0x02fedc,
      emissiveIntensity: 0.22,
      metalness: 0.12,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 0.75,
      envMapIntensity: 1.8,
    });
    disposables.push(shieldMat);
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldGroup.add(shieldMesh);

    const checkShape = createCheckmarkShape(1.1);
    const checkGeo = new THREE.ExtrudeGeometry(checkShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.015,
      bevelSegments: 4,
    });
    checkGeo.center();
    disposables.push(checkGeo);

    const checkMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xd1fae5,
      emissiveIntensity: 0.35,
      metalness: 0.05,
      roughness: 0.04,
      clearcoat: 1.0,
    });
    disposables.push(checkMat);
    const checkMesh = new THREE.Mesh(checkGeo, checkMat);
    checkMesh.position.set(0, 0.02, 0.115);
    shieldGroup.add(checkMesh);

    // 4. Secondary Floating Glossy Status Card Pill (bottom-left foreground z-depth)
    const miniCardShape = createRoundedRectShape(0.95, 0.42, 0.14);
    const miniCardGeo = new THREE.ExtrudeGeometry(miniCardShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 6,
      curveSegments: 16,
    });
    miniCardGeo.center();
    disposables.push(miniCardGeo);

    const miniCardMat = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0xffffff : 0x202848,
      metalness: 0.08,
      roughness: 0.06,
      clearcoat: 1.0,
      iridescence: 0.8,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 1.7,
    });
    disposables.push(miniCardMat);

    const miniCardMesh = new THREE.Mesh(miniCardGeo, miniCardMat);
    miniCardMesh.position.set(-1.05, -0.78, 0.36);
    stageGroup.add(miniCardMesh);

    const dotGeo = new THREE.SphereGeometry(0.068, 20, 20);
    const dotMat = new THREE.MeshPhysicalMaterial({
      color: 0x02fedc,
      emissive: 0x02fedc,
      emissiveIntensity: 0.65,
      roughness: 0.05,
      clearcoat: 1.0,
    });
    disposables.push(dotGeo, dotMat);
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    dotMesh.position.set(-0.26, 0, 0.08);
    miniCardMesh.add(dotMesh);

    const miniBarGeo = new THREE.CapsuleGeometry(0.026, 0.36, 8, 12);
    const miniBarMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x334155 : 0xe2e8f0,
      transparent: true,
      opacity: 0.85,
    });
    disposables.push(miniBarGeo, miniBarMat);
    const miniBarMesh = new THREE.Mesh(miniBarGeo, miniBarMat);
    miniBarMesh.rotation.z = Math.PI / 2;
    miniBarMesh.position.set(0.11, 0, 0.08);
    miniCardMesh.add(miniBarMesh);

    // 5. Sleek Subtle Glossy Orbital Signal Ring (clean elliptical frame)
    const haloGeo = new THREE.TorusGeometry(1.92, 0.011, 12, 120);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x5a5cff,
      transparent: true,
      opacity: 0.32,
    });
    disposables.push(haloGeo, haloMat);
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI * 0.40;
    haloMesh.rotation.y = -Math.PI * 0.14;
    stageGroup.add(haloMesh);

    let pointerTiltX = 0;
    let pointerTiltY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      pointerTiltY = nx * 0.22;
      pointerTiltX = -ny * 0.16;
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

    const darkEnvelopeColor = new THREE.Color(0x161d36);
    const lightEnvelopeColor = new THREE.Color(0xe5eeff);
    const darkMiniColor = new THREE.Color(0x1e2644);
    const lightMiniColor = new THREE.Color(0xffffff);
    const darkLineColor = new THREE.Color(0xcbd5e1);
    const lightLineColor = new THREE.Color(0x475569);
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden || !renderer) return;

      const elapsed = clock.getElapsedTime();
      const light = themeRef.current === 'light';

      envelopeMat.color.lerp(light ? lightEnvelopeColor : darkEnvelopeColor, 0.08);
      envelopeMat.metalness = light ? 0.05 : 0.14;
      miniCardMat.color.lerp(light ? lightMiniColor : darkMiniColor, 0.08);
      lineMat.color.lerp(light ? lightLineColor : darkLineColor, 0.08);
      miniBarMat.color.lerp(light ? lightLineColor : darkLineColor, 0.08);

      // Gentle architectural front-facing float & sway (never spins backward)
      const idleRotY = -0.22 + Math.sin(elapsed * 0.72) * 0.14;
      const idleRotX = 0.08 + Math.cos(elapsed * 0.6) * 0.05;
      stageGroup.rotation.y += (idleRotY + pointerTiltY - stageGroup.rotation.y) * 0.06;
      stageGroup.rotation.x += (idleRotX + pointerTiltX - stageGroup.rotation.x) * 0.06;
      stageGroup.position.y = Math.sin(elapsed * 1.1) * 0.07;

      // Shield & status card float independently for multi-plane Z depth
      shieldGroup.position.y = 0.62 + Math.sin(elapsed * 1.35 + 0.8) * 0.06;
      shieldGroup.rotation.z = -0.06 + Math.sin(elapsed * 0.9) * 0.03;

      miniCardMesh.position.y = -0.78 + Math.cos(elapsed * 1.25) * 0.05;
      haloMesh.rotation.z = elapsed * 0.25;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      for (const item of disposables) item.dispose();
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
          <div className="relative w-56 h-40 rounded-3xl liquid-glass flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-500 font-bold text-lg">
              ✓
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroSpatial3D;
