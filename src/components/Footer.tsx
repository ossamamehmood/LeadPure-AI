import React from 'react';

export function Footer() {
  return (
    <footer className="h-10 border-t border-white/5 flex items-center justify-between px-8 bg-[#000] text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_#02FEDC] animate-pulse"></div>
          <span className="text-brand-cyan">System Integrity: Optimal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-pink shadow-[0_0_8px_#F502FD]"></div>
          <span className="text-brand-pink">Deliverability Guard: Active</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white/10">|</span>
        <a href="https://ossamamehmood.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Infrastructure Architect: Ossama Mehmood</a>
        <span className="text-white/10">|</span>
        <span className="gradient-text font-black">High-Throughput Node</span>
      </div>
    </footer>
  );
}
