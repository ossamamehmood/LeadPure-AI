import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

interface LiquidSpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  spotlightColor?: string;
}

/**
 * Translucent iOS-style frosted container matching `.liquid-glass` optics
 * across Light & Dark themes, paired with subtle cursor-reactive refraction.
 */
export function LiquidSpotlightCard({
  children,
  className,
  contentClassName,
  spotlightColor = 'rgba(90, 92, 255, 0.14)',
  ...rest
}: LiquidSpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);

  const surfaceGlow = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, rgba(2, 254, 220, 0.05) 45%, transparent 75%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handlePointerLeave = () => {
    mouseX.set(-999);
    mouseY.set(-999);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn('liquid-glass relative overflow-hidden group rounded-3xl flex flex-col', className)}
      {...rest}
    >
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[2]"
          style={{ background: surfaceGlow }}
        />
      )}
      <div className={cn('relative z-10 flex-1', contentClassName)}>{children}</div>
    </div>
  );
}
