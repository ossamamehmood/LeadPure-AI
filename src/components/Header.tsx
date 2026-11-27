import React from 'react';
import { Download, RefreshCw, Sun, Moon, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { MagneticButton } from './ui/MagneticButton';

interface HeaderProps {
  appState: string;
  isProcessing: boolean;
  onDownload: () => void;
  onReset: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (e: React.MouseEvent) => void;
  onNavigateHome?: () => void;
}

const VIEW_TITLES: Record<string, string> = {
  upload: 'Inbox Verification',
  mapping: 'Column Mapping',
  processing: 'Scanning Leads',
  results: 'Verification Results',
  rules: 'Protection Rules',
  history: 'Scan History',
};

export function Header({ appState, isProcessing, onDownload, onReset, theme, onToggleTheme, onNavigateHome }: HeaderProps) {
  const isResults = appState === 'results' || appState === 'processing';
  const viewTitle = VIEW_TITLES[appState] || 'Workspace';

  return (
    <header className="px-4 sm:px-8 pt-4 shrink-0 sticky top-0 z-40 pointer-events-none">
      <div className="liquid-glass pointer-events-auto h-16 sm:h-17 rounded-2xl px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <h1 className="text-sm sm:text-base font-display font-bold text-app-text tracking-tight truncate">
            {viewTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="hidden sm:flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/45 dark:bg-white/[0.05] hover:bg-white/75 dark:hover:bg-white/[0.10] border border-white/60 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              title="Back to Homepage"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          )}
          {isResults && (
            <MagneticButton onClick={onDownload} variant="primary" size="sm" className="rounded-full px-4 sm:px-5">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Results</span>
              <span className="sm:hidden">Export</span>
            </MagneticButton>
          )}

          <button
            onClick={(e) => onToggleTheme(e)}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="min-w-[40px] min-h-[40px] p-2.5 bg-white/45 dark:bg-white/[0.05] hover:bg-white/75 dark:hover:bg-white/[0.10] rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-blue transition-all border border-white/60 dark:border-white/10 active:scale-95 flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="relative w-4 h-4">
              <Sun className={cn(
                'w-4 h-4 absolute inset-0 transition-transform duration-300',
                theme === 'dark' ? 'translate-y-7 opacity-0' : 'translate-y-0 opacity-100'
              )} />
              <Moon className={cn(
                'w-4 h-4 absolute inset-0 transition-transform duration-300',
                theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-7 opacity-0'
              )} />
            </div>
          </button>

          <button
            onClick={onReset}
            aria-label="Start New Session"
            className="min-w-[40px] min-h-[40px] p-2.5 bg-white/45 dark:bg-white/[0.05] hover:bg-white/75 dark:hover:bg-white/[0.10] rounded-xl text-slate-600 dark:text-slate-300 hover:text-app-text transition-all border border-white/60 dark:border-white/10 active:scale-95 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            title="Start New Session"
          >
            <RefreshCw className={cn('w-4 h-4', isProcessing && 'animate-spin text-brand-blue')} />
          </button>
        </div>
      </div>
    </header>
  );
}
