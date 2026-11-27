import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface TraceAddressTextProps {
  text: string;
  animateOnChange?: boolean;
  className?: string;
}

const DOMAIN_GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789.-_';

/**
 * Lightweight monospace settle transition for live inspection samples.
 */
export function TraceAddressText({
  text,
  animateOnChange = true,
  className = '',
}: TraceAddressTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (!animateOnChange || shouldReduceMotion) {
      setShown(text);
      return;
    }

    let step = 0;
    const totalSteps = 8;
    const interval = window.setInterval(() => {
      step += 1;
      if (step >= totalSteps) {
        setShown(text);
        window.clearInterval(interval);
        return;
      }
      const revealCount = Math.floor((step / totalSteps) * text.length);
      const next = text
        .split('')
        .map((ch, i) => {
          if (i < revealCount || ch === '@' || ch === '.') return ch;
          return DOMAIN_GLYPHS[(i * 7 + step * 5) % DOMAIN_GLYPHS.length];
        })
        .join('');
      setShown(next);
    }, 22);

    return () => window.clearInterval(interval);
  }, [text, animateOnChange, shouldReduceMotion]);

  return <span className={className}>{shown}</span>;
}
