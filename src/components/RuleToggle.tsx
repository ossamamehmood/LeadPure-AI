import React from 'react';
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
        "p-5 rounded-[24px] transition-all cursor-pointer flex items-center justify-between group select-none relative overflow-hidden border h-full",
        active 
          ? "bg-[#0A0A0A] border-white/10 shadow-[0_0_20px_-12px_rgba(2,254,220,0.3)]" 
          : "bg-[#050505] border-white/5 hover:border-white/10"
      )}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/10 via-brand-blue/5 to-brand-pink/5 pointer-events-none" />
      )}
      
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-cyan via-brand-blue to-brand-pink" />
      )}
      
      <div className="space-y-1.5 relative z-10 flex-1 pl-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[7px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-md border transition-colors",
            active 
              ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20" 
              : "bg-white/5 text-slate-500 border-white/5"
          )}>
            {domain}
          </span>
          {active && (
            <div className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-cyan animate-pulse flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-brand-cyan" />
              Secured
            </div>
          )}
        </div>
        <h3 className={cn(
          "font-black text-white text-base uppercase italic tracking-tighter transition-colors",
          active ? "gradient-text" : "group-hover:text-white/80"
        )}>{title}</h3>
        <p className="text-slate-500 text-[10px] font-medium leading-relaxed pr-4 line-clamp-2">{description}</p>
      </div>

      <div className="shrink-0 relative z-10">
        <div className={cn(
          "w-10 h-5 rounded-full border transition-all duration-300 relative",
          active ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10"
        )}>
          <div className={cn(
            "absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-300 ease-out",
            active 
              ? "left-[22px] gradient-bg shadow-[0_0_12px_#02FEDC]" 
              : "left-1 bg-slate-600"
          )} />
        </div>
      </div>

      {active && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 blur-3xl rounded-full -mr-12 -mt-12" />
      )}
    </div>
  );
}
