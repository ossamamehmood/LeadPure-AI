import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { CheckCircle2 } from 'lucide-react';

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
        "p-6 rounded-[32px] transition-all cursor-pointer flex items-center justify-between group select-none relative overflow-hidden border h-full duration-500",
        active 
          ? "bg-app-card border-app-border glow-gradient" 
          : "bg-transparent border-app-border hover:border-brand-blue/40 hover:bg-app-bg/40"
      )}
    >
      {active && (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/10 via-brand-blue/5 to-brand-pink/5 pointer-events-none opacity-40" />
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand-cyan via-brand-blue to-brand-pink shadow-[0_0_15px_rgba(90,92,255,0.5)]" />
        </>
      )}
      
      <div className="space-y-2 relative z-10 flex-1 px-4">
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-[8px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded-full border transition-all duration-500",
            active 
              ? "bg-brand-blue/20 text-brand-blue border-brand-blue/20" 
              : "bg-app-bg/10 text-slate-600 border-app-border"
          )}>
            {domain}
          </span>
          {active && (
            <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-[8px] font-black uppercase tracking-[0.3em] flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full gradient-bg animate-pulse shadow-[0_0_8px_rgba(90,92,255,0.6)]" />
              <span className="gradient-text">Safe-Node Active</span>
            </motion.div>
          )}
        </div>
        <h3 className={cn(
          "font-black text-xl uppercase italic tracking-tighter transition-all duration-500",
          active ? "gradient-text" : "text-slate-500 group-hover:text-slate-300"
        )}>{title}</h3>
        <p className={cn(
          "text-[10px] font-medium leading-relaxed pr-8 transition-colors duration-500",
          active ? "text-slate-400" : "text-slate-600"
        )}>{description}</p>
      </div>

      <div className="shrink-0 relative z-10 pr-2">
        <div className={cn(
          "w-12 h-6 rounded-full border transition-all duration-500 relative bg-app-bg",
          active ? "border-brand-blue/40" : "border-app-border"
        )}>
          <div className={cn(
            "absolute top-1 w-4 h-4 rounded-full transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)",
            active 
              ? "left-[26px] gradient-bg shadow-[0_0_15px_rgba(90,92,255,0.5)]" 
              : "left-1 bg-slate-700"
          )} />
        </div>
      </div>

      {active && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
      )}
    </div>
  );
}