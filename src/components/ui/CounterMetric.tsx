import React, { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

interface CounterMetricProps {
  to: number;
  separator?: string;
  duration?: number;
  className?: string;
}

/**
 * Tabular-numeral metric counter that glides cleanly from a close anchor
 * without flashing misleading zeros during initial load.
 */
export function CounterMetric({
  to,
  separator = '',
  duration = 0.48,
  className = '',
}: CounterMetricProps) {
  const shouldReduceMotion = useReducedMotion();
  const startFrom = to > 100 ? Math.round(to * 0.9) : to;
  const [display, setDisplay] = useState<string>(() =>
    formatNumber(shouldReduceMotion ? to : startFrom, separator)
  );

  useEffect(() => {
    if (shouldReduceMotion || startFrom === to) {
      setDisplay(formatNumber(to, separator));
      return;
    }

    const controls = animate(startFrom, to, {
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
  }, [to, startFrom, separator, duration, shouldReduceMotion]);

  return <span className={`tabular-nums ${className}`}>{display}</span>;
}

function formatNumber(value: number, separator: string): string {
  const raw = String(value);
  return separator ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : raw;
}
