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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-2 bg-gradient-to-t from-app-bg via-app-bg/90 to-transparent">
      <nav className="flex items-center justify-around h-16 bg-app-card/80 backdrop-blur-2xl border border-app-border rounded-3xl px-2 shadow-2xl">
        <button 
          onClick={() => {
            if ((document as any).startViewTransition) {
              (document as any).startViewTransition(() => setTab('upload'));
            } else {
              setTab('upload');
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all gap-1 active:scale-90",
            isUploadActive ? "text-brand-blue" : "text-slate-500"
          )}
        >
          <Upload className={cn("w-5 h-5", isUploadActive && "drop-shadow-[0_0_8px_rgba(90,92,255,0.4)]")} />
          <span className="text-[8px] font-black uppercase tracking-widest">Ingest</span>
          {isUploadActive && <div className="w-1 h-1 rounded-full gradient-bg shadow-[0_0_5px_rgba(90,92,255,0.6)]" />}
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
            "flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all gap-1 active:scale-90",
            currentTab === 'rules' ? "text-brand-blue" : "text-slate-500"
          )}
        >
          <Settings2 className={cn("w-5 h-5", currentTab === 'rules' && "drop-shadow-[0_0_8px_rgba(90,92,255,0.4)]")} />
          <span className="text-[8px] font-black uppercase tracking-widest">Protocols</span>
          {currentTab === 'rules' && <div className="w-1 h-1 rounded-full gradient-bg shadow-[0_0_5px_rgba(90,92,255,0.6)]" />}
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
            "flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all gap-1 active:scale-90",
            currentTab === 'history' ? "text-brand-blue" : "text-slate-500"
          )}
        >
          <Clock className={cn("w-5 h-5", currentTab === 'history' && "drop-shadow-[0_0_8px_rgba(90,92,255,0.4)]")} />
          <span className="text-[8px] font-black uppercase tracking-widest">Logs</span>
          {currentTab === 'history' && <div className="w-1 h-1 rounded-full gradient-bg shadow-[0_0_5px_rgba(90,92,255,0.6)]" />}
        </button>
      </nav>
    </div>
  );
} 
