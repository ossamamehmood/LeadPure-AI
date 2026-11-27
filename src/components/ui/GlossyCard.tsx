import React from 'react';
import { LiquidSpotlightCard } from './LiquidSpotlightCard';
import { cn } from '../../lib/utils';

interface GlossyCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'pink' | 'blue' | 'purple' | 'gradient' | 'none';
  onClick?: () => void;
}

/**
 * Workspace surface inheriting unified optical `.liquid-glass` refraction
 * with cursor-reactive chromatic highlight.
 */
export function GlossyCard({ children, className, glow = 'none', onClick }: GlossyCardProps) {
  const spotlightColor = glow === 'pink'
    ? 'rgba(245, 2, 253, 0.14)'
    : glow === 'cyan'
      ? 'rgba(2, 254, 220, 0.14)'
      : 'rgba(90, 92, 255, 0.15)';

  return (
    <LiquidSpotlightCard
      onClick={onClick}
      spotlightColor={spotlightColor}
      className={cn(
        glow !== 'none' && 'ring-1 ring-inset ring-white/[0.06]',
        onClick &&
          'cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70',
        className
      )}
    >
      {children}
    </LiquidSpotlightCard>
  );
}
