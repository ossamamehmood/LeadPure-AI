import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  appState: string;
  isProcessing: boolean;
  onDownload: () => void;
  onReset: () => void;
}

export function Header({ appState, isProcessing, onDownload, onReset }: HeaderProps) {
  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#000000] shrink-0">
      <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-2 uppercase italic">
        Lead<span className="gradient-text">Pure</span> AI
        {appState === 'results' && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded uppercase border border-white/10 font-bold ml-2 gradient-text inline-flex items-center">Cleaning Complete</span>}
      </h1>
      <div className="flex gap-4">
        {appState === 'results' && (
          <button 
            onClick={onDownload}
            className="px-6 py-2 bg-[#5A5CFF] hover:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-[#5A5CFF]/30 active:scale-95 italic"
          >
            <Download className="w-4 h-4" />
            Export Optimized List
          </button>
        )}
        <button 
          onClick={onReset}
          className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all border border-white/10 hover:border-white/20"
          title="Reset"
        >
          <RefreshCw className={cn("w-5 h-5", isProcessing && "animate-spin")} />
        </button>
      </div>
    </header>
  );
}
