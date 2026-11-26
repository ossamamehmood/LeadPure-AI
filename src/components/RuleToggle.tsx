import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { TACTILE_SPRING } from './ui/MotionPrimitives';

interface RuleToggleProps {
  domain: string;
  title: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}

export function RuleToggle({ domain, title, description, active, onToggle }: RuleToggleProps) {
  return (
    <div
      role="switch"
      aria-checked={active}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'p-5 sm:p-6 rounded-2xl transition-colors duration-200 cursor-pointer flex items-center justify-between gap-4 group select-none relative overflow-hidden border h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue active:scale-[0.99]',
        active
          ? 'bg-brand-blue/[0.06] dark:bg-brand-blue/[0.08] border-brand-blue/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'bg-slate-50/50 dark:bg-white/[0.02] border-app-border hover:border-brand-blue/35'
      )}
    >
      {active && (
        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-brand-blue" aria-hidden="true" />
      )}

      <div className="space-y-1.5 relative z-10 flex-1 pl-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors',
              active
                ? 'bg-brand-blue/15 text-brand-blue border-brand-blue/25'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-app-border'
            )}
          >
            {domain}
          </span>
          {active && (
            <span className="text-[10px] font-semibold text-brand-blue flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
              Active
            </span>
          )}
        </div>
        <h3 className="font-display font-bold text-base sm:text-lg text-app-text tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pr-2">
          {description}
        </p>
      </div>

      <div className="shrink-0 relative z-10">
        <div
          className={cn(
            'w-12 h-6 rounded-full border transition-colors duration-200 relative p-0.5 flex items-center',
            active
              ? 'bg-brand-blue/20 border-brand-blue/50 justify-end'
              : 'bg-slate-200 dark:bg-white/[0.06] border-slate-300 dark:border-white/10 justify-start'
          )}
        >
          <motion.div
            layout
            transition={TACTILE_SPRING}
            className={cn(
              'w-4 h-4 rounded-full shadow-sm',
              active ? 'bg-brand-blue' : 'bg-slate-400 dark:bg-slate-500'
            )}
          />
        </div>
      </div>
    </div>
  );
}
