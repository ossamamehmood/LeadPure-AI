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
        onClick && "cursor-pointer transition-all active:scale-[0.98] active:brightness-95",
        className
      )}
    >
      {/* Glossy Overlay effect - Layered for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-black/[0.05] pointer-events-none" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
      
      {/* Dynamic Glow Corner (Subtle) */}
      <div className={cn(
        "absolute -top-20 -right-20 w-40 h-40 blur-[80px] opacity-20 pointer-events-none transition-all duration-1000 group-hover:opacity-40",
        glow === 'cyan' && "bg-brand-cyan",
        glow === 'pink' && "bg-brand-pink",
        glow === 'blue' && "bg-brand-blue",
        glow === 'purple' && "bg-brand-purple",
        glow === 'gradient' && "gradient-bg shadow-[0_0_20px_rgba(90,92,255,0.4)]"
      )} />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
} 
