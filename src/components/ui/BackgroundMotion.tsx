import React, { useEffect, useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

interface BackgroundMotionProps {
  variant?: 'hero' | 'ambient';
}

interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

/**
 * Grounded architectural motion canvas:
 * - Masked 64px coordinate matrix + subtle anodized grain
 * - Ultra-restrained single hairline optical trace driven smoothly by scroll progress
 * - Subtle pointer-following slate/indigo specular sheen (zero smoky neon fog)
 */
export function BackgroundMotion({ variant = 'hero' }: BackgroundMotionProps) {
  const shouldReduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pointerX = useMotionValue(-999);
  const pointerY = useMotionValue(-999);
  const smoothX = useSpring(pointerX, { stiffness: 75, damping: 28, mass: 0.55 });
  const smoothY = useSpring(pointerY, { stiffness: 75, damping: 28, mass: 0.55 });

  const cursorSpotlight = useMotionTemplate`radial-gradient(520px circle at ${smoothX}px ${smoothY}px, rgba(90, 92, 255, 0.065), transparent 72%)`;

  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 80, damping: 26, restDelta: 0.001 });
  const hairlineLength = useTransform(smoothScroll, [0, 1], [0.18, 0.98]);
  const horizonOffset = useTransform(smoothScroll, [0, 1], ['0%', '-10%']);

  useEffect(() => {
    if (shouldReduceMotion || variant !== 'hero') return;
    const handlePointerMove = (e: PointerEvent) => {
      pointerX.set(e.clientX);
      pointerY.set(e.clientY);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [shouldReduceMotion, variant, pointerX, pointerY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || shouldReduceMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count = variant === 'hero' ? 18 : 10;
    const particles: CanvasParticle[] = Array.from({ length: count }, (_, i) => ({
      x: ((i * 211) % Math.max(width, 320)),
      y: ((i * 277) % Math.max(height, 320)),
      vx: ((i % 5) - 2) * 0.06,
      vy: -0.08 - (i % 4) * 0.03,
      radius: 0.9 + (i % 2) * 0.45,
      alpha: 0.14 + (i % 3) * 0.06,
    }));

    const renderFrame = () => {
      rafId = requestAnimationFrame(renderFrame);
      if (document.hidden) return;

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = isLight ? '#4F46E5' : '#CBD5E1';

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -12) {
          p.y = height + 12;
          p.x = (p.x + width * 0.37) % width;
        }
        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    rafId = requestAnimationFrame(renderFrame);
    window.addEventListener('resize', resize, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [shouldReduceMotion, variant]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* Grounded top-lit horizon surface */}
      <div className="mesh-background" />

      {/* Precision masked 64px architectural coordinate grid */}
      <div className="absolute inset-0 architectural-grid opacity-80" />

      {/* Restrained optical vector hairline linked subtly to scroll */}
      {variant === 'hero' && (
        <motion.div
          className="fixed inset-x-0 -top-10 h-[92vh] w-full opacity-[0.26] dark:opacity-[0.22]"
          style={shouldReduceMotion ? undefined : { y: horizonOffset, willChange: 'transform' }}
        >
          <svg
            viewBox="0 0 1440 760"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="leadpureHairlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#02FEDC" stopOpacity="0" />
                <stop offset="28%" stopColor="#02FEDC" stopOpacity="0.65" />
                <stop offset="60%" stopColor="#5A5CFF" stopOpacity="0.8" />
                <stop offset="88%" stopColor="#F502FD" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#F502FD" stopOpacity="0" />
              </linearGradient>
            </defs>

            <motion.path
              d="M -60 610 C 310 520, 620 260, 1020 300 C 1220 320, 1360 190, 1520 150"
              stroke="url(#leadpureHairlineGrad)"
              strokeWidth={1.75}
              strokeLinecap="round"
              style={shouldReduceMotion ? { pathLength: 0.75 } : { pathLength: hairlineLength }}
            />
          </svg>
        </motion.div>
      )}

      {/* Minimal atmospheric micro-dust canvas */}
      {!shouldReduceMotion && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 w-full h-full opacity-50 pointer-events-none"
        />
      )}

      {/* Subtle anodized surface texture breaks flat digital bands */}
      <div className="absolute inset-0 matte-grain" />

      {/* Controlled pointer surface sheen */}
      {!shouldReduceMotion && variant === 'hero' && (
        <motion.div
          className="absolute inset-0 opacity-80"
          style={{ background: cursorSpotlight }}
        />
      )}
    </div>
  );
}
