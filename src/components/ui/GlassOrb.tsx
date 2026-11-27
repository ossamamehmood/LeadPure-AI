import React, { useRef, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * GlassOrb -- a pure-CSS/Canvas iridescent 3D sphere that reacts to pointer.
 * No external 3D library. Fully original. Meaningful: represents a verified,
 * clean email signal -- one perfect, luminous orb of data trust.
 */

interface GlassOrbProps {
  size?: number;
  className?: string;
}

export function GlassOrb({ size = 440, className = '' }: GlassOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.42;

      const px = pointerRef.current.x;
      const py = pointerRef.current.y;

      // Outer ambient glow halo
      const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.55);
      haloGrad.addColorStop(0, 'rgba(90,92,255,0.14)');
      haloGrad.addColorStop(0.4, 'rgba(2,254,220,0.09)');
      haloGrad.addColorStop(0.75, 'rgba(245,2,253,0.07)');
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, size, size);

      // --- Base sphere ---
      const sphereGrad = ctx.createRadialGradient(
        cx - r * 0.28 + (px - 0.5) * r * 0.22,
        cy - r * 0.28 + (py - 0.5) * r * 0.22,
        r * 0.05,
        cx,
        cy,
        r
      );
      sphereGrad.addColorStop(0, 'rgba(220,230,255,0.72)');
      sphereGrad.addColorStop(0.18, 'rgba(140,145,255,0.55)');
      sphereGrad.addColorStop(0.42, 'rgba(90,92,255,0.44)');
      sphereGrad.addColorStop(0.68, 'rgba(50,20,120,0.52)');
      sphereGrad.addColorStop(0.88, 'rgba(18,8,60,0.72)');
      sphereGrad.addColorStop(1, 'rgba(6,2,28,0.90)');

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // --- Iridescent colour shift layer (animated) ---
      const shift = Math.sin(t * 0.4) * 0.5 + 0.5;
      const iriGrad = ctx.createRadialGradient(
        cx + (px - 0.5) * r * 0.6,
        cy - r * 0.1 + (py - 0.5) * r * 0.4,
        0,
        cx,
        cy,
        r
      );
      const hue1 = 220 + shift * 40; // blue-purple
      const hue2 = 170 + shift * 50; // cyan-teal
      iriGrad.addColorStop(0, `hsla(${hue1},90%,72%,0.38)`);
      iriGrad.addColorStop(0.3, `hsla(${hue2},95%,65%,0.22)`);
      iriGrad.addColorStop(0.65, `hsla(${290 + shift * 30},85%,55%,0.18)`);
      iriGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = iriGrad;
      ctx.fill();

      // --- Specular highlight (top-left) ---
      const specX = cx - r * 0.3 + (px - 0.5) * r * 0.35;
      const specY = cy - r * 0.32 + (py - 0.5) * r * 0.25;
      const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, r * 0.52);
      specGrad.addColorStop(0, 'rgba(255,255,255,0.88)');
      specGrad.addColorStop(0.12, 'rgba(255,255,255,0.52)');
      specGrad.addColorStop(0.3, 'rgba(200,210,255,0.22)');
      specGrad.addColorStop(0.6, 'rgba(140,160,255,0.08)');
      specGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = specGrad;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // --- Secondary rim specular (bottom-right) ---
      const rimX = cx + r * 0.38 + (px - 0.5) * r * 0.15;
      const rimY = cy + r * 0.42 + (py - 0.5) * r * 0.15;
      const rimGrad = ctx.createRadialGradient(rimX, rimY, 0, rimX, rimY, r * 0.42);
      rimGrad.addColorStop(0, `rgba(2,254,220,${0.28 + shift * 0.18})`);
      rimGrad.addColorStop(0.3, `rgba(90,92,255,${0.14 + shift * 0.08})`);
      rimGrad.addColorStop(0.7, 'rgba(245,2,253,0.06)');
      rimGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // --- Glass edge border (thin specular ring) ---
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const edgeGrad = ctx.createLinearGradient(
        cx - r,
        cy - r,
        cx + r * 0.7,
        cy + r * 0.7
      );
      edgeGrad.addColorStop(0, 'rgba(255,255,255,0.65)');
      edgeGrad.addColorStop(0.35, 'rgba(140,150,255,0.35)');
      edgeGrad.addColorStop(0.65, 'rgba(2,254,220,0.2)');
      edgeGrad.addColorStop(1, 'rgba(245,2,253,0.15)');
      ctx.strokeStyle = edgeGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // --- Inner caustic ring (animated) ---
      const causticR = r * (0.55 + Math.sin(t * 0.6) * 0.04);
      const causticGrad = ctx.createRadialGradient(cx, cy, causticR * 0.75, cx, cy, causticR);
      causticGrad.addColorStop(0, 'rgba(0,0,0,0)');
      causticGrad.addColorStop(0.75, `rgba(2,254,220,${0.08 + shift * 0.07})`);
      causticGrad.addColorStop(0.88, `rgba(90,92,255,${0.12 + shift * 0.06})`);
      causticGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = causticGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, causticR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!shouldReduceMotion) t += 0.016;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size, shouldReduceMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const handleMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      pointerRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    parent.addEventListener('mousemove', handleMove);
    return () => parent.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
