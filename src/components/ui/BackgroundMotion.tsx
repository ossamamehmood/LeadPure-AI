import React, { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

interface BackgroundMotionProps {
  variant?: 'hero' | 'ambient';
}

const HORIZONTAL_PULSES = [
  { top: '18%', duration: 9.5, delay: 0, width: '160px', reverse: false },
  { top: '42%', duration: 13.0, delay: 2.8, width: '220px', reverse: true },
  { top: '74%', duration: 11.2, delay: 1.4, width: '180px', reverse: false },
];

const VERTICAL_PULSES = [
  { left: '22%', duration: 10.5, delay: 0.7, height: '140px', reverse: false },
  { left: '78%', duration: 12.4, delay: 3.2, height: '170px', reverse: true },
];

/**
 * Spatial Minimsam-grade atmospheric canvas powered strictly by GPU-composited
 * transforms, opacity, and Framer MotionValues (zero React re-renders on pointer move).
 */
export function BackgroundMotion({ variant = 'hero' }: BackgroundMotionProps) {
  const shouldReduceMotion = useReducedMotion();
  const pointerX = useMotionValue(-999);
  const pointerY = useMotionValue(-999);
  const smoothX = useSpring(pointerX, { stiffness: 70, damping: 24, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 70, damping: 24, mass: 0.6 });

  const cursorSpotlight = useMotionTemplate`radial-gradient(520px circle at ${smoothX}px ${smoothY}px, rgba(90, 92, 255, 0.11), rgba(2, 254, 220, 0.04) 40%, transparent 72%)`;

  useEffect(() => {
    if (shouldReduceMotion || variant !== 'hero') return;
    const handlePointerMove = (e: PointerEvent) => {
      pointerX.set(e.clientX);
      pointerY.set(e.clientY);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [shouldReduceMotion, variant, pointerX, pointerY]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* Base calibrated atmospheric horizon mesh */}
      <div className="mesh-background" />

      {/* Precision masked architectural grid */}
      <div className="absolute inset-0 architectural-grid opacity-75" />

      {/* Interactive pointer-reactive light aura */}
      {!shouldReduceMotion && variant === 'hero' && (
        <motion.div
          className="absolute inset-0 opacity-85 dark:opacity-100"
          style={{ background: cursorSpotlight }}
        />
      )}

      {/* Drifting ambient aurora depth spheres (GPU translate3d + scale) */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="absolute -top-32 -left-24 w-[420px] h-[420px] sm:w-[620px] sm:h-[620px] rounded-full blur-3xl opacity-[0.14] dark:opacity-[0.16]"
            style={{ background: 'radial-gradient(circle, #02FEDC 0%, transparent 70%)', willChange: 'transform' }}
            animate={{
              x: [0, 48, -20, 0],
              y: [0, 34, 18, 0],
              scale: [1, 1.07, 0.96, 1],
            }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute top-1/4 -right-32 w-[460px] h-[460px] sm:w-[680px] sm:h-[680px] rounded-full blur-3xl opacity-[0.12] dark:opacity-[0.18]"
            style={{ background: 'radial-gradient(circle, #5A5CFF 0%, transparent 72%)', willChange: 'transform' }}
            animate={{
              x: [0, -54, 22, 0],
              y: [0, -32, 28, 0],
              scale: [1, 0.95, 1.08, 1],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute -bottom-36 left-1/3 w-[380px] h-[380px] sm:w-[560px] sm:h-[560px] rounded-full blur-3xl opacity-[0.10] dark:opacity-[0.14]"
            style={{ background: 'radial-gradient(circle, #F502FD 0%, transparent 70%)', willChange: 'transform' }}
            animate={{
              x: [0, 40, -36, 0],
              y: [0, -28, 16, 0],
              scale: [1, 1.06, 0.94, 1],
            }}
            transition={{ duration: 31, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Concentric Minimalist Orbital Horizon Rings + Travelling Telemetry Filaments (Hero mode) */}
      {variant === 'hero' && (
        <>
          <div className="absolute left-1/2 top-[260px] -translate-x-1/2 -translate-y-1/2 w-[780px] h-[780px] sm:w-[1040px] sm:h-[1040px]">
            <motion.div
              className="absolute inset-0 rounded-full border border-slate-400/[0.12] dark:border-white/[0.06]"
              style={{
                maskImage: 'radial-gradient(circle, transparent 48%, black 70%, transparent 74%)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 48%, black 70%, transparent 74%)',
              }}
              animate={shouldReduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 64, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-[13%] rounded-full border border-dashed border-brand-blue/20 dark:border-[#02FEDC]/15"
              animate={shouldReduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-[26%] rounded-full border border-slate-400/[0.10] dark:border-white/[0.05]"
              animate={shouldReduceMotion ? undefined : { scale: [1, 1.03, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Orthogonal travelling optical signal pulses along grid tracks */}
          {!shouldReduceMotion &&
            HORIZONTAL_PULSES.map((p, idx) => (
              <motion.div
                key={`hpulse-${idx}`}
                className="absolute h-px rounded-full"
                style={{
                  top: p.top,
                  left: 0,
                  width: p.width,
                  background: p.reverse
                    ? 'linear-gradient(90deg, transparent 0%, #F502FD 45%, #5A5CFF 85%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, #02FEDC 45%, #5A5CFF 85%, transparent 100%)',
                  opacity: 0.45,
                  willChange: 'transform',
                }}
                initial={{ x: p.reverse ? '110vw' : '-240px' }}
                animate={{ x: p.reverse ? ['110vw', '-240px'] : ['-240px', '110vw'] }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}

          {!shouldReduceMotion &&
            VERTICAL_PULSES.map((p, idx) => (
              <motion.div
                key={`vpulse-${idx}`}
                className="absolute w-px rounded-full hidden md:block"
                style={{
                  left: p.left,
                  top: 0,
                  height: p.height,
                  background: p.reverse
                    ? 'linear-gradient(180deg, transparent 0%, #F502FD 45%, #5A5CFF 85%, transparent 100%)'
                    : 'linear-gradient(180deg, transparent 0%, #02FEDC 45%, #5A5CFF 85%, transparent 100%)',
                  opacity: 0.35,
                  willChange: 'transform',
                }}
                initial={{ y: p.reverse ? '110vh' : '-200px' }}
                animate={{ y: p.reverse ? ['110vh', '-200px'] : ['-200px', '110vh'] }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
        </>
      )}
    </div>
  );
}
