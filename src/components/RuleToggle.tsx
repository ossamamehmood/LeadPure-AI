import React from 'react';
import { cn } from '../lib/utils';
import { Shield, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
      onClick={onToggle}
      className={cn(
        "p-5 rounded-2xl transition-all cursor-pointer flex items-start sm:items-center justify-between group select-none relative overflow-hidden border h-full duration-200",
        active 
          ? "bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20" 
          : "bg-white dark:bg-slate-900 border-border-color hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/50"
      )}
    >
      <div className="space-y-1.5 relative z-10 flex-1 pr-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors duration-200",
            active 
              ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30" 
              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          )}>
            {domain}
          </span>
          {active && (
            <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </div>
          )}
        </div>
        <h3 className={cn(
          "font-semibold text-base transition-colors duration-200",
          active ? "text-indigo-900 dark:text-indigo-300" : "text-app-text group-hover:text-indigo-700 dark:group-hover:text-indigo-400"
        )}>{title}</h3>
        <p className={cn(
          "text-sm leading-relaxed transition-colors duration-200",
          active ? "text-indigo-700/70 dark:text-indigo-400/70" : "text-slate-500"
        )}>{description}</p>
      </div>

      <div className="shrink-0 relative z-10 pt-2 sm:pt-0">
        <div className={cn(
          "w-11 h-6 rounded-full border transition-colors duration-200 relative",
          active ? "bg-indigo-600 border-indigo-600" : "bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-700"
        )}>
          <div className={cn(
            "absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all duration-300 ease-in-out shadow-sm",
            active ? "left-[22px]" : "left-[2px]"
          )} />
        </div>
      </div>
    </div>
  );
} 
