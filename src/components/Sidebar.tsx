import React from 'react';
import { Upload, Settings2, Clock, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: any) => void;
}

export function Sidebar({ currentTab, setTab }: SidebarProps) {
  const isUploadActive = ['upload', 'mapping', 'processing', 'results'].includes(currentTab);

  return (
    <aside className="w-64 border-r border-white/5 flex flex-col bg-[#050505] hidden lg:flex shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] flex items-center justify-center text-white font-black text-xs shadow-[0_0_15px_rgba(2,254,220,0.4)]">LP</div>
        <span className="text-white font-black text-xl tracking-tighter uppercase italic">Lead<span className="gradient-text">Pure</span> AI</span>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <button 
          onClick={() => setTab('upload')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-widest",
            isUploadActive ? "bg-[#5A5CFF] text-white shadow-lg shadow-[#5A5CFF]/20" : "text-slate-500 hover:bg-white/5"
          )}
        >
          <Upload className="w-4 h-4" />
          Ingestion
        </button>
        <button 
          onClick={() => setTab('rules')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-widest",
            currentTab === 'rules' ? "bg-[#5A5CFF] text-white shadow-lg shadow-[#5A5CFF]/20" : "text-slate-500 hover:bg-white/5"
          )}
        >
          <Settings2 className="w-4 h-4" />
          Protocols
        </button>
        <button 
          onClick={() => setTab('history')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-widest",
            currentTab === 'history' ? "bg-[#5A5CFF] text-white shadow-lg shadow-[#5A5CFF]/20" : "text-slate-500 hover:bg-white/5"
          )}
        >
          <Clock className="w-4 h-4" />
          Audit Logs
        </button>
      </nav>
      <div className="p-6 border-t border-white/5">
        <GlossyCard glow="cyan" className="p-4 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-[0.2em]">Engine Status</p>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-3 h-3 gradient-text" />
            <span className="text-[10px] uppercase font-bold gradient-text">Cloud Synced</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
            <div className="gradient-bg h-full w-[100%] shadow-[0_0_15px_rgba(2,254,220,0.4)]"></div>
          </div>
        </GlossyCard>
      </div>
    </aside>
  );
}
