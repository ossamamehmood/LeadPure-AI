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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 bg-gradient-to-t from-app-bg via-app-bg/95 to-transparent">
      <nav className="flex items-center justify-around h-14 bg-app-card/90 backdrop-blur-2xl border border-app-border rounded-2xl px-2 shadow-2xl">
        <button
          onClick={() => setTab('upload')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-11 rounded-xl transition-all gap-1 active:scale-90',
            isUploadActive ? 'text-brand-blue' : 'text-slate-500'
          )}
        >
          <Upload className="w-4 h-4" />
          <span className="text-[8px] font-black uppercase tracking-widest">Verify</span>
        </button>

        <button
          onClick={() => setTab('rules')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-11 rounded-xl transition-all gap-1 active:scale-90',
            currentTab === 'rules' ? 'text-brand-blue' : 'text-slate-500'
          )}
        >
          <Settings2 className="w-4 h-4" />
          <span className="text-[8px] font-black uppercase tracking-widest">Rules</span>
        </button>

        <button
          onClick={() => setTab('history')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-11 rounded-xl transition-all gap-1 active:scale-90',
            currentTab === 'history' ? 'text-brand-blue' : 'text-slate-500'
          )}
        >
          <Clock className="w-4 h-4" />
          <span className="text-[8px] font-black uppercase tracking-widest">History</span>
        </button>
      </nav>
    </div>
  );
}
