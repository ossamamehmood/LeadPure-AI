import React from 'react';
import { cn } from '../../lib/utils';

interface GlossyCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'pink' | 'blue' | 'none';
  onClick?: () => void;
}

export function GlossyCard({ children, className, glow = 'none', onClick }: GlossyCardProps) {
  const glowClasses = {
    cyan: 'glow-cyan',
    pink: 'glow-pink',
    blue: 'glow-blue',
    none: ''
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "glossy-card relative overflow-hidden group",
        glow !== 'none' && glowClasses[glow],
        onClick && "cursor-pointer transition-transform active:scale-[0.98]",
        className
      )}
    >
      {/* Glossy Overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01] pointer-events-none" />
      {children}
    </div>
  );
}
