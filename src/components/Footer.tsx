import React from 'react';

export function Footer() {
  return (
    <footer className="py-10 border-t border-app-border flex flex-col md:flex-row items-center justify-between gap-6 px-2 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full gradient-bg shadow-[0_0_10px_rgba(90,92,255,0.55)]" />
          <span className="font-display font-bold gradient-text">LeadPure V14</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">Own SMTP Engine 1.3.2</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        <div className="group relative">
          <a
            href="https://www.patreon.com/c/ossamamehmood"
            target="_blank"
            rel="noreferrer"
            className="text-brand-blue hover:text-app-text transition-colors flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded px-1 font-semibold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
            Support On Patreon
          </a>
          <div className="hidden sm:block absolute bottom-full left-0 mb-4 w-64 bg-app-card border border-app-border p-4 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 backdrop-blur-3xl shadow-2xl z-[60]">
            <p className="text-xs text-app-text font-display font-bold mb-2 border-b border-app-border pb-2">Why Support?</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
              LeadPure is free to use for SMTP verification and list cleaning. Support helps cover runner infrastructure and ongoing maintenance.
            </p>
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-app-card border-r border-b border-app-border rotate-45" />
          </div>
        </div>
        <span className="text-app-text/15 hidden md:block">|</span>
        <a
          href="https://ossamamehmood.com"
          target="_blank"
          rel="noreferrer"
          className="gradient-text font-semibold hover:opacity-85 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded px-1"
        >
          Built By Ossama Mahmood
        </a>
      </div>
    </footer>
  );
}
