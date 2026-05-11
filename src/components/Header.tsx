import React from 'react';
import { Download, RefreshCw, Sun, Moon, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  appState: string;
  isProcessing: boolean;
  onDownload: () => void;
  onReset: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (e: React.MouseEvent) => void;
}

export function Header({ appState, isProcessing, onDownload, onReset, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="h-24 border-b border-app-border flex items-center justify-between px-10 bg-app-bg/40 backdrop-blur-3xl shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-cyan via-brand-blue to-brand-pink flex items-center justify-center text-white shadow-[0_0_15px_rgba(90,92,255,0.3)] transition-transform group-hover:rotate-12">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <h1 className="text-2xl font-black text-app-text tracking-tighter flex items-center gap-2 uppercase italic select-none">
            Lead<span className="gradient-text">Pure</span><span className="text-zinc-600 font-medium not-italic ml-1">AI</span>
          </h1>
        </div>
        <div className="h-6 w-px bg-app-border hidden md:block" />
        <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full gradient-bg shadow-[0_0_8px_rgba(90,92,255,0.5)]" />
            v3.2.0 Performance-Engine
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {appState === 'results' && (
          <button 
            onClick={onDownload}
            className="px-8 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl shadow-brand-blue/30 active:scale-95 group"
          >
            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            Deploy Cleaned List
          </button>
        )}
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => onToggleTheme(e)}
            className="p-3.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-slate-500 hover:text-brand-blue transition-all border border-white/5 hover:border-white/10 active:scale-90 flex items-center justify-center overflow-hidden"
            title={theme === 'dark' ? "Switch to Light Node" : "Switch to Dark Node"}
          >
            <div className="relative w-5 h-5">
              <Sun className={cn(
                "w-5 h-5 absolute inset-0 transition-transform duration-500",
                theme === 'dark' ? "translate-y-8" : "translate-y-0"
              )} />
              <Moon className={cn(
                "w-5 h-5 absolute inset-0 transition-transform duration-500",
                theme === 'dark' ? "translate-y-0" : "-translate-y-8"
              )} />
            </div>
          </button>

          <button 
            onClick={onReset}
            className="p-3.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-slate-500 hover:text-white transition-all border border-white/5 hover:border-white/10 active:scale-90"
            title="Purge Session"
          >
            <RefreshCw className={cn("w-5 h-5", isProcessing && "animate-spin text-brand-blue shadow-[0_0_12px_rgba(90,92,255,0.3)]")} />
          </button>
        </div>
      </div>
    </header>
  );
} 
