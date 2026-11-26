import React from 'react';
import { Download, RefreshCw, Sun, Moon, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { MagneticButton } from './ui/MagneticButton';

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
    <header className="h-20 sm:h-24 border-b border-app-border flex items-center justify-between px-4 sm:px-8 lg:px-10 bg-app-bg/60 backdrop-blur-2xl shrink-0 sticky top-0 z-50 gap-3">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
        <div className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0">
          <div className="w-8 h-8 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(90,92,255,0.5),inset_0_1px_0_rgba(255,255,255,0.22)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-app-text tracking-tight flex items-center gap-1 select-none">
            Lead<span className="gradient-text">Pure</span><span className="text-slate-600 dark:text-slate-300 font-semibold ml-0.5 pr-1">AI</span>
          </h1>
        </div>
        <div className="h-5 w-px bg-app-border hidden md:block shrink-0" />
        <div className="hidden md:flex items-center text-[11px] font-semibold tracking-tight text-slate-600 dark:text-slate-400 min-w-0">
          <span className="flex items-center gap-2 px-3 py-1 bg-brand-blue/[0.08] rounded-full border border-brand-blue/20 text-slate-700 dark:text-slate-300 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0" />
            <span className="truncate">
              V17 Enterprise Release <span className="hidden xl:inline text-slate-500 dark:text-slate-400">(Own SMTP Engine 1.3.2)</span>
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {isResults && (
          <MagneticButton onClick={onDownload} variant="primary" size="sm" className="rounded-full px-4 sm:px-5">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Results</span>
            <span className="sm:hidden">Export</span>
          </MagneticButton>
        )}

        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={(e) => onToggleTheme(e)}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="min-w-[44px] min-h-[44px] p-2.5 sm:p-3 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] rounded-2xl text-slate-600 dark:text-slate-400 hover:text-brand-blue transition-all border border-slate-200 dark:border-white/10 active:scale-95 flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="relative w-4.5 h-4.5">
              <Sun className={cn(
                'w-4.5 h-4.5 absolute inset-0 transition-transform duration-300',
                theme === 'dark' ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
              )} />
              <Moon className={cn(
                'w-4.5 h-4.5 absolute inset-0 transition-transform duration-300',
                theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
              )} />
            </div>
          </button>

          <button
            onClick={onReset}
            aria-label="Start New Session"
            className="min-w-[44px] min-h-[44px] p-2.5 sm:p-3 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] rounded-2xl text-slate-600 dark:text-slate-400 hover:text-app-text transition-all border border-slate-200 dark:border-white/10 active:scale-95 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            title="Start New Session"
          >
            <RefreshCw className={cn('w-4.5 h-4.5', isProcessing && 'animate-spin text-brand-blue')} />
          </button>
        </div>
      </div>
    </header>
  );
}
