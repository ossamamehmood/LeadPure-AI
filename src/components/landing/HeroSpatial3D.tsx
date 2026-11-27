import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';

interface HeroSpatial3DProps {
  className?: string;
  theme?: 'dark' | 'light';
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uLight;

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;

    // Gentle cursor parallax bend
    vec2 mouseOffset = (uMouse - 0.5) * 0.28;
    p += mouseOffset * (1.0 - length(p) * 0.35);

    float t = uTime * 0.28;

    // Harmonic flowing liquid silk waves
    float wave1 = sin(p.x * 2.1 + t + cos(p.y * 1.6 - t * 0.8) * 1.3);
    float wave2 = cos(p.x * 1.5 - t * 0.7 + sin(p.y * 2.3 + t * 0.9) * 1.1);
    float wave3 = sin((p.x + p.y) * 1.8 - t * 0.5);

    float bandA = smoothstep(0.95, 0.05, abs(p.y * 1.45 - wave1 * 0.32 + 0.05));
    float bandB = smoothstep(1.05, 0.08, abs(p.y * 1.30 + wave2 * 0.36 - 0.10));
    float bandC = smoothstep(1.10, 0.12, abs(p.x * 0.55 + p.y * 0.9 - wave3 * 0.38));

    vec3 cyan = vec3(0.008, 0.996, 0.863);   // #02FEDC
    vec3 blue = vec3(0.353, 0.361, 1.000);   // #5A5CFF
    vec3 pink = vec3(0.961, 0.008, 0.992);   // #F502FD

    vec3 silk = cyan * bandA * 0.65 + blue * bandB * 0.85 + pink * bandC * 0.55;

    // Soft elliptical radial horizon falloff so edges melt seamlessly into canvas
    float radial = smoothstep(1.18, 0.12, length(vec2(p.x * 0.78, p.y * 1.05)));
    float alpha = clamp((bandA * 0.36 + bandB * 0.42 + bandC * 0.28) * radial, 0.0, 0.78);

    // Calibrate luminosity cleanly between deep Dark void and crisp Light porcelain
    vec3 finalCol = mix(silk, mix(vec3(0.92, 0.95, 1.0), silk, 0.55), uLight);
    float finalAlpha = alpha * mix(0.68, 0.44, uLight);

    gl_FragColor = vec4(finalCol, finalAlpha);
  }
`;

/**
 * Cinema-grade GLSL WebGL Fluid Silk Aurora Horizon replacing heavy 3D primitives.
 * Renders pure flowing bioluminescent gradients in `#02FEDC -> #5A5CFF -> #F502FD`
 * tuned per theme with interactive pointer refraction and clean unmount disposal.
 */
export function HeroSpatial3D({ className = '', theme = 'dark' }: HeroSpatial3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lightTargetRef = useRef<number>(theme === 'light' ? 1 : 0);
  const [webglReady, setWebglReady] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    lightTargetRef.current = theme === 'light' ? 1 : 0;
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldReduceMotion) {
      setWebglReady(false);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId = 0;
    let resizeRafId = 0;
    let isVisible = true;

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

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 260);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uLight: { value: lightTargetRef.current },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const handlePointerMove = (e: PointerEvent) => {
      targetMouse.x = e.clientX / Math.max(window.innerWidth, 1);
      targetMouse.y = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.02 }
    );
    observer.observe(container);

    const handleResize = () => {
      if (!container || !renderer) return;
      const nextW = Math.max(container.clientWidth, 320);
      const nextH = Math.max(container.clientHeight, 260);
      renderer.setSize(nextW, nextH);
    };
    const scheduleResize = () => {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(handleResize);
    };
    window.addEventListener('resize', scheduleResize);
    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden || !renderer) return;

      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uMouse.value.lerp(targetMouse, 0.05);
      uniforms.uLight.value += (lightTargetRef.current - uniforms.uLight.value) * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', scheduleResize);

      geometry.dispose();
      material.dispose();
      if (renderer) {
        try {
          renderer.forceContextLoss();
        } catch {
          // ignore
        }
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [shouldReduceMotion]);

  return (
    <div ref={containerRef} aria-hidden="true" className={`relative select-none ${className}`}>
      {!webglReady && (
        <div
          className="w-full h-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse 75% 65% at 50% 45%, rgba(2,254,220,0.22), rgba(90,92,255,0.24) 48%, rgba(245,2,253,0.16) 78%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
}

export default HeroSpatial3D;
