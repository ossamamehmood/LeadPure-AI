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
    <header className="h-20 sm:h-24 border-b border-app-border flex items-center justify-between px-4 sm:px-8 lg:px-10 bg-app-bg/40 backdrop-blur-3xl shrink-0 sticky top-0 z-50 gap-3">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
        <div className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-cyan via-brand-blue to-brand-pink flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-app-text tracking-tighter flex items-center gap-1.5 uppercase italic select-none">
            Lead<span className="gradient-text">Pure</span><span className="text-slate-600 dark:text-slate-300 font-semibold not-italic ml-0.5 pr-1">AI</span>
          </h1>
        </div>
        <div className="h-6 w-px bg-app-border hidden md:block shrink-0" />
        <div className="hidden md:flex items-center text-[10px] font-black uppercase tracking-[0.14em] xl:tracking-[0.2em] text-slate-500 min-w-0">
          <span className="flex items-center gap-2 px-3 py-1 bg-brand-blue/5 rounded-full border border-brand-blue/15 text-slate-600 dark:text-slate-400 truncate">
            <span className="w-1.5 h-1.5 rounded-full gradient-bg shrink-0" />
            <span className="truncate">
              V17 Enterprise Release <span className="hidden xl:inline">(Own SMTP Engine 1.3)</span>
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {isResults && (
          <button
            onClick={onDownload}
            className="px-3.5 sm:px-6 min-h-[44px] py-2.5 sm:py-3 gradient-bg text-white rounded-full font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-xl shadow-brand-blue/30 hover:shadow-brand-blue/50 hover:brightness-105 active:scale-95 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Results</span>
            <span className="sm:hidden">Export</span>
          </button>
        )}

        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={(e) => onToggleTheme(e)}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="min-w-[44px] min-h-[44px] p-2.5 sm:p-3.5 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] rounded-2xl text-slate-600 dark:text-slate-400 hover:text-brand-blue transition-all border border-slate-200 dark:border-white/10 active:scale-90 flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
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
            aria-label="Start New Session"
            className="min-w-[44px] min-h-[44px] p-2.5 sm:p-3.5 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] rounded-2xl text-slate-600 dark:text-slate-400 hover:text-app-text transition-all border border-slate-200 dark:border-white/10 active:scale-90 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            title="Start New Session"
          >
            <RefreshCw className={cn('w-5 h-5', isProcessing && 'animate-spin text-brand-blue')} />
          </button>
        </div>
      </div>
    </header>
  );
}
