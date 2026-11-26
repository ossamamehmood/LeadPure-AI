import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

export const EDITORIAL_EASE = [0.22, 1, 0.36, 1] as const;

export const TACTILE_SPRING = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 28,
  mass: 0.8,
};

interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerGroup({ children, className, staggerDelay = 0.06 }: StaggerGroupProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.42,
            ease: EDITORIAL_EASE,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedMetricProps {
  value: number;
  suffix?: string;
  className?: string;
}

/** Smooth spring number count-up via direct textContent mutation outside React's render loop. */
export function AnimatedMetric({ value, suffix = '', className }: AnimatedMetricProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const motionVal = useMotionValue(shouldReduceMotion ? value : 0);
  const spring = useSpring(motionVal, { stiffness: 120, damping: 22, mass: 0.7 });

  useEffect(() => {
    if (shouldReduceMotion) {
      if (ref.current) ref.current.textContent = `${value}${suffix}`;
      return;
    }
    motionVal.set(value);
  }, [value, suffix, shouldReduceMotion, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${Math.round(latest)}${suffix}`;
      }
    });
    return () => unsubscribe();
  }, [spring, suffix]);

  return (
    <span ref={ref} className={className}>
      {value}{suffix}
    </span>
  );
}
