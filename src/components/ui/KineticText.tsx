import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EDITORIAL_EASE } from './MotionPrimitives';

interface KineticTextProps {
  text: string;
  className?: string;
  staggerMs?: number;
  duration?: number;
}

/**
 * Staggered typographic word entrance tuned for crisp editorial headlines.
 */
export function KineticText({
  text,
  className = '',
  staggerMs = 40,
  duration = 0.36,
}: KineticTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');

  return (
    <span className={`inline-flex flex-wrap gap-x-[0.24em] ${className}`}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden py-[0.04em]">
          <motion.span
            className="inline-block"
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: '85%' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration,
              delay: index * (staggerMs / 1000),
              ease: EDITORIAL_EASE,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
