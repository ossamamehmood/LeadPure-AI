import React from 'react';

export function Footer() {
  return (
    <footer className="py-10 border-t border-app-border/30 flex flex-col md:flex-row items-center justify-between gap-6 px-2 text-[9px] font-black text-app-text/50 uppercase tracking-[0.2em] transition-colors duration-500">
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full gradient-bg shadow-[0_0_8px_rgba(90,92,255,0.5)]" />
          <span className="gradient-text">LeadPure V17</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-500 dark:text-slate-400">Own SMTP Engine 1.3</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        <div className="group relative">
          <a
            href="https://www.patreon.com/c/ossamamehmood"
            target="_blank"
            rel="noreferrer"
            className="text-brand-blue hover:text-app-text transition-colors flex items-center gap-2 group"
          >
            <span className="w-1 h-1 rounded-full bg-brand-blue" />
            Support On Patreon
          </a>
          <div className="hidden sm:block absolute bottom-full left-0 mb-4 w-64 bg-app-card border border-app-border p-4 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 backdrop-blur-3xl shadow-2xl z-[60]">
            <p className="text-[10px] text-app-text font-black uppercase italic mb-2 tracking-widest border-b border-app-border pb-2">Why Support?</p>
            <p className="text-[10px] text-app-text/70 font-medium normal-case leading-relaxed">
              LeadPure AI is free to use for accurate SMTP verification and list hygiene. Support helps cover runner infrastructure and ongoing maintenance.
            </p>
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-app-card border-r border-b border-app-border rotate-45" />
          </div>
        </div>
        <span className="text-app-text/15 hidden md:block">|</span>
        <a
          href="https://ossamamehmood.com"
          target="_blank"
          rel="noreferrer"
          className="gradient-text font-black hover:opacity-80 transition-opacity"
        >
          Built By Ossama Mahmood
        </a>
      </div>
    </footer>
  );
}
