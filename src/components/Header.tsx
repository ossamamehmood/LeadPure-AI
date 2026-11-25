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
  const isResults = appState === 'results' || appState === 'processing';

  return (
    <header className="h-20 sm:h-24 border-b border-app-border flex items-center justify-between px-4 sm:px-8 lg:px-10 bg-app-bg/40 backdrop-blur-3xl shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-cyan via-brand-blue to-brand-pink flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-app-text tracking-tighter flex items-center gap-1.5 uppercase italic select-none">
            Lead<span className="gradient-text">Pure</span><span className="text-zinc-600 font-medium not-italic ml-0.5">AI</span>
          </h1>
        </div>
        <div className="h-6 w-px bg-app-border hidden md:block shrink-0" />
        <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
          <span className="flex items-center gap-2 px-3 py-1 bg-brand-blue/5 rounded-full border border-brand-blue/15 text-slate-600 dark:text-slate-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full gradient-bg" />
            V17 Enterprise Release (Own SMTP Engine 1.3)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {isResults && (
          <button
            onClick={onDownload}
            className="px-3.5 sm:px-6 py-2.5 sm:py-3 gradient-bg text-white rounded-full font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-xl shadow-brand-blue/30 hover:shadow-brand-blue/50 active:scale-95 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Results</span>
            <span className="sm:hidden">Export</span>
          </button>
        )}

        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={(e) => onToggleTheme(e)}
            className="p-2.5 sm:p-3.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-slate-500 hover:text-brand-blue transition-all border border-white/5 hover:border-white/10 active:scale-90 flex items-center justify-center overflow-hidden"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="relative w-5 h-5">
              <Sun className={cn(
                'w-5 h-5 absolute inset-0 transition-transform duration-500',
                theme === 'dark' ? 'translate-y-8' : 'translate-y-0'
              )} />
              <Moon className={cn(
                'w-5 h-5 absolute inset-0 transition-transform duration-500',
                theme === 'dark' ? 'translate-y-0' : '-translate-y-8'
              )} />
            </div>
          </button>

          <button
            onClick={onReset}
            className="p-2.5 sm:p-3.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-slate-500 hover:text-white transition-all border border-white/5 hover:border-white/10 active:scale-90"
            title="Start New Session"
          >
            <RefreshCw className={cn('w-5 h-5', isProcessing && 'animate-spin text-brand-blue')} />
          </button>
        </div>
      </div>
    </header>
  );
}
