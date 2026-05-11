import React from 'react';
import { Upload, Settings2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileNavProps {
  currentTab: string;
  setTab: (tab: any) => void;
}

export function MobileNav({ currentTab, setTab }: MobileNavProps) {
  const isUploadActive = ['upload', 'mapping', 'processing', 'results'].includes(currentTab);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 bg-gradient-to-t from-slate-50 via-slate-50/90 dark:from-slate-900 dark:via-slate-900/90 to-transparent">
      <nav className="flex items-center justify-around h-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-border-color rounded-2xl px-2 shadow-lg">
        <button 
          onClick={() => {
            if ((document as any).startViewTransition) {
              (document as any).startViewTransition(() => setTab('upload'));
            } else {
              setTab('upload');
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all gap-1 active:scale-95",
            isUploadActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Upload className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Ingest</span>
          {isUploadActive && <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />}
        </button>

        <button 
          onClick={() => {
            if ((document as any).startViewTransition) {
              (document as any).startViewTransition(() => setTab('rules'));
            } else {
              setTab('rules');
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all gap-1 active:scale-95",
            currentTab === 'rules' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Settings2 className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Rules</span>
          {currentTab === 'rules' && <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />}
        </button>

        <button 
          onClick={() => {
            if ((document as any).startViewTransition) {
              (document as any).startViewTransition(() => setTab('history'));
            } else {
              setTab('history');
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all gap-1 active:scale-95",
            currentTab === 'history' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">History</span>
          {currentTab === 'history' && <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />}
        </button>
      </nav>
    </div>
  );
} 
