import React from 'react';
import { motion } from 'motion/react';
import { Upload, Settings2, Clock, Database, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: any) => void;
}

export function Sidebar({ currentTab, setTab }: SidebarProps) {
  const isUploadActive = ['upload', 'mapping', 'processing', 'results'].includes(currentTab);

  return (
    <aside className="w-72 border-r border-border-color flex flex-col bg-slate-50 dark:bg-slate-900 hidden lg:flex shrink-0 z-50">
      <div className="p-8 flex items-center gap-3 cursor-pointer">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
          <Zap className="w-4 h-4 fill-white" />
        </div>
        <span className="text-slate-900 dark:text-white font-bold text-xl tracking-tight select-none">
          LeadPure
        </span>
      </div>

      <div className="px-6 mb-8">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-border-color shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
             <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">System Status</span>
             <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          </div>
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">All systems operational</div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-2">
        <button 
          onClick={() => {
            if ((document as any).startViewTransition) {
              (document as any).startViewTransition(() => setTab('upload'));
            } else {
              setTab('upload');
            }
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm relative group",
            isUploadActive 
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          {isUploadActive && <motion.div layoutId="nav-bg" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />}
          <Upload className={cn("w-4 h-4 transition-transform group-hover:-translate-y-0.5", isUploadActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
          Ingestion
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
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm relative group",
            currentTab === 'rules' 
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          {currentTab === 'rules' && <motion.div layoutId="nav-bg" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />}
          <Settings2 className={cn("w-4 h-4 transition-transform group-hover:rotate-45", currentTab === 'rules' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
          Validation Rules
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
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm relative group",
            currentTab === 'history' 
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          {currentTab === 'history' && <motion.div layoutId="nav-bg" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />}
          <Clock className={cn("w-4 h-4 transition-transform", currentTab === 'history' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
          History & Audit
        </button>
      </nav>

      <div className="p-6 border-t border-border-color mt-auto">
        <div className="p-4 rounded-xl border border-border-color bg-white dark:bg-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-semibold mb-3 tracking-wider">Infrastructure</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white block">Enterprise API</span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Connected</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[100%] rounded-full"></div>
          </div>
        </div>
      </div>
    </aside>
  );
} 
