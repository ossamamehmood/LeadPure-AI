import React from 'react';
import { cn } from '../../lib/utils';

interface GlossyCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'pink' | 'blue' | 'purple' | 'gradient' | 'none';
  onClick?: () => void;
}

export function GlossyCard({ children, className, glow = 'none', onClick }: GlossyCardProps) {
  const glowClasses = {
    cyan: 'glow-cyan',
    pink: 'glow-pink',
    blue: 'glow-blue',
    purple: 'glow-purple',
    gradient: 'glow-gradient',
    none: ''
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "glossy-card relative overflow-hidden group",
        glow !== 'none' && glowClasses[glow],
        onClick && "glossy-card-interactive cursor-pointer transition-all active:scale-[0.98] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 dark:via-white/15 to-transparent opacity-80"
        aria-hidden="true"
      />
      {/* Glossy Overlay effect - Layered for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-black/[0.05] dark:block hidden pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.6] via-white/[0.15] to-transparent dark:hidden block pointer-events-none" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none" />
      
      {/* Dynamic Glow Corner (Subtle) */}
      <div className={cn(
        "absolute -top-20 -right-20 w-40 h-40 blur-[80px] opacity-20 pointer-events-none transition-all duration-1000 group-hover:opacity-40",
        glow === 'cyan' && "bg-brand-cyan",
        glow === 'pink' && "bg-brand-pink",
        glow === 'blue' && "bg-brand-blue",
        glow === 'purple' && "bg-brand-purple",
        glow === 'gradient' && "gradient-bg shadow-lg"
      )} />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
} 
