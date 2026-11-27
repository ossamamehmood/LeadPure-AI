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
 * Staggered typographic word entrance using natural inline wrapping
 * without vertical clipping masks so letter descenders stay crisp at all sizes.
 */
export function KineticText({
  text,
  className = '',
  staggerMs = 35,
  duration = 0.28,
}: KineticTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');

  return (
    <span className={`block ${className}`}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <motion.span
            className="inline-block"
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration,
              delay: index * (staggerMs / 1000),
              ease: EDITORIAL_EASE,
            }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </span>
  );
}
