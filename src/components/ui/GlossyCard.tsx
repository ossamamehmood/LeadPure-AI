import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

interface GlossyCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'pink' | 'blue' | 'purple' | 'gradient' | 'none';
  onClick?: () => void;
}

/**
 * Elevated surface with top specular glaze and cursor-tracking spotlight
 * driven via Framer MotionValues outside the React render cycle.
 */
export function GlossyCard({ children, className, glow = 'none', onClick }: GlossyCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);

  const spotlight = useMotionTemplate`radial-gradient(260px circle at ${mouseX}px ${mouseY}px, rgba(90, 92, 255, 0.11), transparent 75%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-999);
    mouseY.set(-999);
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'glossy-card relative overflow-hidden group',
        glow !== 'none' && 'ring-1 ring-inset ring-white/[0.04]',
        onClick &&
          'glossy-card-interactive cursor-pointer transition-all active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70',
        className
      )}
    >
      {!shouldReduceMotion && (
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: spotlight }}
          aria-hidden="true"
        />
      )}

      {/* Machined top bezel edge refraction */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 dark:via-white/15 to-transparent opacity-80"
        aria-hidden="true"
      />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
