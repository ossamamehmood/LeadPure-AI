import React, { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { cn } from '../../lib/utils';
import { EDITORIAL_EASE } from './MotionPrimitives';

interface SpatialTiltCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Interactive card combining razor-sharp iOS-style `.liquid-glass` optics
 * with damped pointer tilt (`rotateX` / `rotateY`) without forcing
 * subpixel text rasterization into Z-planes.
 */
export function SpatialTiltCard({ children, className, delay = 0 }: SpatialTiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 220, damping: 26, mass: 0.6 });
  const rotateY = useSpring(rawRotateY, { stiffness: 220, damping: 26, mass: 0.6 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
    const py = (e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
    rawRotateY.set(px * 4.5);
    rawRotateX.set(-py * 4.5);
  };

  const handleMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  return (
    <div style={{ perspective: '1200px' }} className="h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.48, delay, ease: EDITORIAL_EASE }}
        style={shouldReduceMotion ? undefined : { rotateX, rotateY }}
        className={cn(
          'liquid-glass rounded-3xl p-6 sm:p-7 h-full flex flex-col justify-between gap-6 transition-opacity duration-300 group-hover/bento:opacity-75 hover:!opacity-100',
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}
