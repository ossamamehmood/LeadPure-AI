import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion, HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';

interface MagneticButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  strength?: number;
}

const SPRING_CONFIG = { stiffness: 360, damping: 26, mass: 0.65 };

export function MagneticButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  strength = 0.22,
  disabled,
  onMouseMove,
  onMouseLeave,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING_CONFIG);
  const springY = useSpring(y, SPRING_CONFIG);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !shouldReduceMotion && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
      x.set(Math.max(-5, Math.min(5, dx)));
      y.set(Math.max(-5, Math.min(5, dy)));
    }
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    x.set(0);
    y.set(0);
    onMouseLeave?.(e);
  };

  const variantStyles = {
    primary:
      'gradient-cta text-white border border-white/20 shadow-[0_10px_28px_-6px_rgba(90,92,255,0.48),0_4px_14px_-4px_rgba(245,2,253,0.22),inset_0_1px_0_rgba(255,255,255,0.34)] hover:brightness-110 hover:shadow-[0_14px_34px_-6px_rgba(2,254,220,0.28),0_6px_22px_-4px_rgba(245,2,253,0.32),inset_0_1px_0_rgba(255,255,255,0.42)]',
    secondary:
      'bg-slate-100/90 dark:bg-white/[0.05] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-app-text border border-slate-200 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-transparent',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30',
    success:
      'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
  };

  const sizeStyles = {
    sm: 'min-h-[38px] px-4 py-2 text-xs rounded-xl',
    md: 'min-h-[44px] px-5 py-2.5 text-xs rounded-2xl',
    lg: 'min-h-[54px] sm:min-h-[58px] px-6 py-3.5 text-sm rounded-2xl',
  };

  return (
    <motion.button
      ref={ref}
      style={shouldReduceMotion ? undefined : { x: springX, y: springY }}
      whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.975 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={cn(
        'group/btn relative overflow-hidden font-semibold tracking-tight transition-[filter,box-shadow,background-color,border-color] duration-250 flex items-center justify-center gap-2.5 cursor-pointer select-none disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {variant === 'primary' && !disabled && !shouldReduceMotion && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:translate-x-[320%] transition-transform duration-700 ease-out"
        />
      )}
      {children}
    </motion.button>
  );
}
