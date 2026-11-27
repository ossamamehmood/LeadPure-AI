import React, { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

interface CounterMetricProps {
  to: number;
  separator?: string;
  duration?: number;
  className?: string;
}

/**
 * Tabular-numeral animated metric counter for KPI readouts.
 */
export function CounterMetric({
  to,
  separator = '',
  duration = 0.9,
  className = '',
}: CounterMetricProps) {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState<string>(() => formatNumber(shouldReduceMotion ? to : 0, separator));

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(formatNumber(to, separator));
      return;
    }

    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplay(formatNumber(Math.round(latest), separator));
      },
      onComplete: () => {
        setDisplay(formatNumber(to, separator));
      },
    });

    return () => controls.stop();
  }, [to, separator, duration, shouldReduceMotion]);

  return <span className={`tabular-nums ${className}`}>{display}</span>;
}

function formatNumber(value: number, separator: string): string {
  const raw = String(value);
  return separator ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : raw;
}
