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
 * Staggered typographic word entrance using standard inline line flow so
 * browsers never collapse words into vertical columns on narrow screens.
 */
export function KineticText({
  text,
  className = '',
  staggerMs = 40,
  duration = 0.34,
}: KineticTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');

  return (
    <span className={`block ${className}`}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span className="inline-block overflow-hidden align-bottom py-[0.04em]">
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
          {index < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </span>
  );
}
