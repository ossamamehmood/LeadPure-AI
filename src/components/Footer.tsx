import React from 'react';

export function Footer() {
  return (
    <footer className="py-12 border-t border-app-border/30 flex flex-col md:flex-row items-center justify-between gap-8 px-2 text-[8px] font-black text-app-text/40 uppercase tracking-[0.2em] transition-colors duration-500">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full gradient-bg shadow-[0_0_8px_rgba(90,92,255,0.5)] animate-pulse"></div>
          <span className="gradient-text">System Integrity: Optimal</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-pink shadow-[0_0_8px_#F502FD]"></div>
          <span className="text-brand-pink">Deliverability Guard: Active</span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="group relative">
          <a 
            href="https://www.patreon.com/c/ossamamehmood" 
            target="_blank" 
            rel="noreferrer" 
            className="text-brand-blue hover:text-app-text transition-colors flex items-center gap-2 group"
          >
            <span className="w-1 h-1 rounded-full bg-brand-blue group-hover:animate-ping" />
            Support On Patreon
          </a>
          {/* Hover Preview Box */}
          <div className="absolute bottom-full left-0 mb-4 w-64 bg-app-card border border-app-border p-4 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 backdrop-blur-3xl shadow-2xl z-[60]">
            <p className="text-[10px] text-app-text font-black uppercase italic mb-2 tracking-widest border-b border-app-border pb-2 transition-colors duration-500">Why Support?</p>
            <p className="text-[9px] text-app-text/60 font-medium normal-case leading-relaxed italic transition-colors duration-500">
              LeadPure AI is built with passion and offered <span className="text-brand-blue">completely free</span> to help marketers optimize their outreach. Your support keeps the neural engine running and fuels future innovation.
            </p>
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-app-card border-r border-b border-app-border rotate-45" />
          </div>
        </div>
        <span className="text-app-text/10 hidden md:block">|</span>
        <a 
          href="mailto:hello@ossamamehmood.com" 
          className="hover:text-app-text transition-colors"
        >
          hello@ossamamehmood.com
        </a>
        <span className="text-app-text/10 hidden md:block">|</span>
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