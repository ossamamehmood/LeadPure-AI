import React from 'react';
import { Download, RefreshCw, Sun, Moon, CheckCircle } from 'lucide-react';
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
    <header className="h-16 border-b border-app-border flex items-center justify-between px-8 bg-app-bg shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-app-text tracking-tight flex items-center select-none">
            LeadPure
          </h1>
        </div>
        <div className="h-4 w-px bg-app-border hidden md:block" />
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            System Operational
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {appState === 'results' && (
          <button 
            onClick={onDownload}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export Results
          </button>
        )}
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => onToggleTheme(e)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors active:scale-95 flex items-center justify-center"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="relative w-5 h-5 overflow-hidden">
              <Sun className={cn(
                "w-5 h-5 absolute inset-0 transition-transform duration-300",
                theme === 'dark' ? "translate-y-8" : "translate-y-0"
              )} />
              <Moon className={cn(
                "w-5 h-5 absolute inset-0 transition-transform duration-300",
                theme === 'dark' ? "translate-y-0" : "-translate-y-8"
              )} />
            </div>
          </button>

          <button 
            onClick={onReset}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors active:scale-95"
            title="Reset Session"
          >
            <RefreshCw className={cn("w-5 h-5", isProcessing && "animate-spin text-indigo-500")} />
          </button>
        </div>
      </div>
    </header>
  );
}