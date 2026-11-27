import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface SparkBurstButtonProps {
  children: React.ReactNode;
  className?: string;
}

const SPARK_COLORS = ['#02FEDC', '#5A5CFF', '#F502FD'];
const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * Tactile micro-feedback wrapper that emits subtle chromatic pulses on click.
 */
export function SparkBurstButton({ children, className = '' }: SparkBurstButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const [burstId, setBurstId] = useState(0);

  return (
    <div
      onClick={() => {
        if (!shouldReduceMotion) setBurstId((id) => id + 1);
      }}
      className={`relative inline-flex ${className}`}
    >
      {children}
      {burstId > 0 && !shouldReduceMotion && (
        <span
          key={burstId}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-20"
        >
          {ANGLES.map((deg, idx) => {
            const rad = (deg * Math.PI) / 180;
            const tx = Math.cos(rad) * 26;
            const ty = Math.sin(rad) * 18;
            return (
              <motion.span
                key={deg}
                initial={{ opacity: 0.9, scale: 1, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 0.2, x: tx, y: ty }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: SPARK_COLORS[idx % SPARK_COLORS.length] }}
              />
            );
          })}
        </span>
      )}
    </div>
  );
}
