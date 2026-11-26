import React, { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

interface BackgroundMotionProps {
  variant?: 'hero' | 'ambient';
}

const HORIZONTAL_PULSES = [
  { top: '16%', duration: 9.0, delay: 0, width: '170px', reverse: false },
  { top: '44%', duration: 12.5, delay: 2.2, width: '230px', reverse: true },
  { top: '76%', duration: 10.8, delay: 1.1, width: '190px', reverse: false },
];

const VERTICAL_PULSES = [
  { left: '19%', duration: 10.2, delay: 0.6, height: '150px', reverse: false },
  { left: '81%', duration: 12.0, delay: 3.1, height: '180px', reverse: true },
];

const FLOATING_MOTES = [
  { left: '12%', top: '78%', size: 2, duration: 15, delay: 0, drift: -18 },
  { left: '24%', top: '64%', size: 2.5, duration: 19, delay: 2, drift: 22 },
  { left: '38%', top: '82%', size: 2, duration: 17, delay: 4, drift: -14 },
  { left: '54%', top: '72%', size: 2.5, duration: 21, delay: 1, drift: 16 },
  { left: '68%', top: '86%', size: 2, duration: 16, delay: 3, drift: -20 },
  { left: '79%', top: '68%', size: 2.5, duration: 18, delay: 5, drift: 12 },
  { left: '89%', top: '76%', size: 2, duration: 20, delay: 2.5, drift: -16 },
  { left: '46%', top: '54%', size: 2, duration: 22, delay: 6, drift: 14 },
];

/**
 * Spatial background motion engine powered strictly by GPU-composited transforms,
 * opacity, and Framer MotionValues (zero React re-renders on pointer move).
 */
export function BackgroundMotion({ variant = 'hero' }: BackgroundMotionProps) {
  const shouldReduceMotion = useReducedMotion();
  const pointerX = useMotionValue(-999);
  const pointerY = useMotionValue(-999);
  const smoothX = useSpring(pointerX, { stiffness: 65, damping: 24, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 65, damping: 24, mass: 0.6 });

  const cursorSpotlight = useMotionTemplate`radial-gradient(560px circle at ${smoothX}px ${smoothY}px, rgba(90, 92, 255, 0.12), rgba(2, 254, 220, 0.045) 38%, transparent 72%)`;

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

      {/* Ultra-fine matte film surface preventing banding */}
      <div className="absolute inset-0 matte-grain" />

      {/* Precision masked architectural grid + intersection dots */}
      <div className="absolute inset-0 architectural-grid opacity-80" />

      {/* Interactive pointer-reactive light aura */}
      {!shouldReduceMotion && variant === 'hero' && (
        <motion.div
          className="absolute inset-0 opacity-90 dark:opacity-100"
          style={{ background: cursorSpotlight }}
        />
      )}

      {/* Drifting ambient aurora depth spheres (GPU translate3d + scale) */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="absolute -top-36 -left-24 w-[440px] h-[440px] sm:w-[640px] sm:h-[640px] rounded-full blur-3xl opacity-[0.07] dark:opacity-[0.09]"
            style={{ background: 'radial-gradient(circle, #02FEDC 0%, transparent 70%)', willChange: 'transform' }}
            animate={{
              x: [0, 52, -22, 0],
              y: [0, 34, 18, 0],
              scale: [1, 1.07, 0.96, 1],
            }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute top-1/4 -right-32 w-[480px] h-[480px] sm:w-[700px] sm:h-[700px] rounded-full blur-3xl opacity-[0.06] dark:opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, #5A5CFF 0%, transparent 72%)', willChange: 'transform' }}
            animate={{
              x: [0, -56, 22, 0],
              y: [0, -34, 28, 0],
              scale: [1, 0.95, 1.08, 1],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute -bottom-36 left-1/3 w-[380px] h-[380px] sm:w-[580px] sm:h-[580px] rounded-full blur-3xl opacity-[0.05] dark:opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #F502FD 0%, transparent 70%)', willChange: 'transform' }}
            animate={{
              x: [0, 42, -36, 0],
              y: [0, -28, 16, 0],
              scale: [1, 1.06, 0.94, 1],
            }}
            transition={{ duration: 31, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Futuristic Planetary Horizon Corona + Orbital Reticles + Signal Filaments */}
      {variant === 'hero' && (
        <>
          {/* Curved subtle architectural horizon arc */}
          <motion.div
            className="absolute left-1/2 top-[340px] sm:top-[380px] -translate-x-1/2 w-[1100px] sm:w-[1550px] h-[750px] rounded-[100%] border-t border-slate-400/20 dark:border-white/10"
            style={{
              background:
                'radial-gradient(50% 30% at 50% 0%, rgba(90,92,255,0.08), transparent 68%)',
              willChange: 'transform, opacity',
            }}
            animate={shouldReduceMotion ? undefined : { scale: [1, 1.015, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Concentric Orbital Rings */}
          <div className="absolute left-1/2 top-[265px] -translate-x-1/2 -translate-y-1/2 w-[780px] h-[780px] sm:w-[1060px] sm:h-[1060px]">
            <motion.div
              className="absolute inset-0 rounded-full border border-slate-400/[0.14] dark:border-white/[0.065]"
              style={{
                maskImage: 'radial-gradient(circle, transparent 48%, black 70%, transparent 74%)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 48%, black 70%, transparent 74%)',
              }}
              animate={shouldReduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 64, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-[14%] rounded-full border border-dashed border-brand-blue/20 dark:border-[#02FEDC]/16"
              animate={shouldReduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-[27%] rounded-full border border-slate-400/[0.11] dark:border-white/[0.05]"
              animate={shouldReduceMotion ? undefined : { scale: [1, 1.03, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Floating spatial luminance motes */}
          {!shouldReduceMotion &&
            FLOATING_MOTES.map((mote, i) => (
              <motion.span
                key={`mote-${i}`}
                className="absolute rounded-full bg-brand-blue/50 dark:bg-[#02FEDC]/60"
                style={{
                  left: mote.left,
                  top: mote.top,
                  width: `${mote.size}px`,
                  height: `${mote.size}px`,
                  willChange: 'transform, opacity',
                }}
                animate={{
                  y: [0, -110, -220],
                  x: [0, mote.drift, mote.drift * 1.4],
                  opacity: [0, 0.55, 0],
                }}
                transition={{
                  duration: mote.duration,
                  delay: mote.delay,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}

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
                  opacity: 0.48,
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
                  opacity: 0.38,
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
