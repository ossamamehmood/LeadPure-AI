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
  color: string;
}

const PARTICLE_COLORS = ['#02FEDC', '#5A5CFF', '#F502FD', '#94A3B8'];

/**
 * Unified atmospheric canvas active across all public & workspace routes:
 * - Calibrated mesh glow and 64px architectural dot-matrix grid
 * - Scroll-linked dual gradient ribbons (#02FEDC -> #5A5CFF -> #F502FD) refracting behind `.liquid-glass` panels
 * - Bi-directional drifting typographic backdrop across page headers
 * - Lightweight GPU particle canvas + pointer-tracking chromatic highlight
 */
export function BackgroundMotion({ variant = 'hero' }: BackgroundMotionProps) {
  const shouldReduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pointerX = useMotionValue(-999);
  const pointerY = useMotionValue(-999);
  const smoothX = useSpring(pointerX, { stiffness: 65, damping: 24, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 65, damping: 24, mass: 0.6 });

  const cursorSpotlight = useMotionTemplate`radial-gradient(640px circle at ${smoothX}px ${smoothY}px, rgba(90, 92, 255, 0.14), rgba(2, 254, 220, 0.06) 38%, transparent 72%)`;

  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 72, damping: 24, restDelta: 0.001 });
  const primaryPathLength = useTransform(smoothScroll, [0, 1], [0.2, 0.98]);
  const secondaryPathLength = useTransform(smoothScroll, [0, 1], [0.1, 0.9]);
  const ribbonY = useTransform(smoothScroll, [0, 1], ['2%', '-22%']);
  const ribbonRotate = useTransform(smoothScroll, [0, 1], [0, 14]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const handlePointerMove = (e: PointerEvent) => {
      pointerX.set(e.clientX);
      pointerY.set(e.clientY);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [shouldReduceMotion, pointerX, pointerY]);

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

    const count = variant === 'hero' ? 40 : 22;
    const particles: CanvasParticle[] = Array.from({ length: count }, (_, i) => ({
      x: ((i * 197) % Math.max(width, 320)),
      y: ((i * 251) % Math.max(height, 320)),
      vx: ((i % 7) - 3) * 0.09,
      vy: -0.14 - (i % 5) * 0.05,
      radius: 1 + (i % 3) * 0.55,
      alpha: 0.25 + (i % 4) * 0.12,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    }));

    const renderFrame = () => {
      rafId = requestAnimationFrame(renderFrame);
      if (document.hidden) return;

      ctx.clearRect(0, 0, width, height);
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
        ctx.fillStyle = p.color;
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
      {/* Base calibrated atmospheric horizon mesh */}
      <div className="mesh-background" />

      {/* Precision masked 64px architectural dot matrix */}
      <div className="absolute inset-0 architectural-grid opacity-85" />

      {/* Vibrant scroll-linked dual gradient ribbons refracting behind all glass panels */}
      <motion.div
        className={
          variant === 'hero'
            ? 'fixed -inset-x-[12vw] -top-[18vh] h-[140vh] w-[124vw] opacity-[0.55] dark:opacity-[0.75]'
            : 'fixed -inset-x-[12vw] -top-[18vh] h-[140vh] w-[124vw] opacity-[0.38] dark:opacity-[0.46]'
        }
        style={
          shouldReduceMotion
            ? undefined
            : {
                y: ribbonY,
                rotate: ribbonRotate,
                willChange: 'transform',
              }
        }
      >
        <svg
          viewBox="0 0 1440 1024"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="leadpureScrollRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#02FEDC" />
              <stop offset="48%" stopColor="#5A5CFF" />
              <stop offset="100%" stopColor="#F502FD" />
            </linearGradient>
            <linearGradient id="leadpureScrollRibbonAlt" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F502FD" stopOpacity="0.82" />
              <stop offset="52%" stopColor="#5A5CFF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#02FEDC" stopOpacity="0.78" />
            </linearGradient>
          </defs>

          <motion.path
            d="M -340 940 C 180 760, 420 260, 840 360 C 1220 450, 1460 120, 1820 210"
            stroke="url(#leadpureScrollRibbon)"
            strokeWidth={145}
            strokeLinecap="round"
            style={shouldReduceMotion ? { pathLength: 0.72 } : { pathLength: primaryPathLength }}
          />

          <motion.path
            d="M 1800 940 C 1280 820, 1020 440, 620 560 C 260 670, 20 280, -320 140"
            stroke="url(#leadpureScrollRibbonAlt)"
            strokeWidth={100}
            strokeLinecap="round"
            style={shouldReduceMotion ? { pathLength: 0.56 } : { pathLength: secondaryPathLength }}
          />
        </svg>
      </motion.div>

      {/* Bi-directional scrolling header background typography active on every page */}
      <div
        className="absolute top-16 sm:top-20 inset-x-0 overflow-hidden select-none"
        style={{
          maskImage: 'linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)',
        }}
      >
        <div
          className={
            variant === 'hero'
              ? 'space-y-1 sm:space-y-2 text-[4.5rem] sm:text-[7.5rem] lg:text-[9.5rem] font-display font-black uppercase tracking-[-0.04em] leading-[0.88] whitespace-nowrap text-slate-900/[0.045] dark:text-white/[0.045]'
              : 'space-y-1 text-[3.8rem] sm:text-[6rem] lg:text-[7.5rem] font-display font-black uppercase tracking-[-0.04em] leading-[0.88] whitespace-nowrap text-slate-900/[0.03] dark:text-white/[0.028]'
          }
        >
          <motion.div
            className="flex w-max"
            animate={shouldReduceMotion ? undefined : { x: ['0%', '-50%'] }}
            transition={shouldReduceMotion ? undefined : { duration: 42, repeat: Infinity, ease: 'linear' }}
          >
            <span>LEADPURE HYGIENE &middot; REAL INBOX VERIFIER &middot;&nbsp;</span>
            <span>LEADPURE HYGIENE &middot; REAL INBOX VERIFIER &middot;&nbsp;</span>
          </motion.div>
          <motion.div
            className="flex w-max"
            animate={shouldReduceMotion ? undefined : { x: ['-50%', '0%'] }}
            transition={shouldReduceMotion ? undefined : { duration: 48, repeat: Infinity, ease: 'linear' }}
          >
            <span>ZERO BOUNCE PROTECTION &middot; CATCH-ALL SHIELD &middot;&nbsp;</span>
            <span>ZERO BOUNCE PROTECTION &middot; CATCH-ALL SHIELD &middot;&nbsp;</span>
          </motion.div>
        </div>
      </div>

      {/* Drifting chromatic particles */}
      {!shouldReduceMotion && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 w-full h-full opacity-55 dark:opacity-75 pointer-events-none"
        />
      )}

      {/* Pointer-reactive chromatic light sheen */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 opacity-90"
          style={{ background: cursorSpotlight }}
        />
      )}

      {/* Peripheral chromatic ambient anchors powering edge refraction */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="absolute -top-36 -left-24 w-[440px] h-[440px] sm:w-[640px] sm:h-[640px] rounded-full blur-3xl opacity-[0.18] dark:opacity-[0.11]"
            style={{ background: 'radial-gradient(circle, #02FEDC 0%, transparent 70%)', willChange: 'transform' }}
            animate={{
              x: [0, 48, -22, 0],
              y: [0, 30, 18, 0],
              scale: [1, 1.07, 0.96, 1],
            }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute -bottom-36 -right-24 w-[420px] h-[420px] sm:w-[620px] sm:h-[620px] rounded-full blur-3xl opacity-[0.16] dark:opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, #F502FD 0%, transparent 70%)', willChange: 'transform' }}
            animate={{
              x: [0, -48, 22, 0],
              y: [0, -30, 22, 0],
              scale: [1, 0.96, 1.06, 1],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}
    </div>
  );
}
