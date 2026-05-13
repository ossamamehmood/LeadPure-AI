import React from 'react';
import { motion } from 'motion/react';
import { Upload, Settings2, Clock, Database, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: any) => void;
}

export function Sidebar({ currentTab, setTab }: SidebarProps) {
  const isUploadActive = ['upload', 'mapping', 'processing', 'results'].includes(currentTab);

  return (
    <aside className="w-72 border-r border-app-border flex flex-col bg-app-bg/40 backdrop-blur-3xl hidden lg:flex shrink-0 z-50">
      <div className="p-8 flex items-center gap-4 group cursor-pointer">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-cyan via-brand-blue to-brand-pink flex items-center justify-center text-white font-black text-xs shadow-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
          <Zap className="w-5 h-5 fill-white" />
        </div>
        <span className="text-app-text font-black text-2xl tracking-tighter uppercase italic select-none">Lead<span className="gradient-text">Pure</span></span>
      </div>

      <div className="px-6 mb-8">
        <div className="p-4 rounded-2xl bg-app-bg/10 border border-app-border">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security Nodes</span>
             <span className="w-2 h-2 rounded-full gradient-bg animate-pulse shadow-sm" />
          </div>
          <div className="text-[10px] font-bold text-slate-300">SYSTEM STABLE</div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-3 mt-4">
        <button 
          onClick={() => {
            if ((document as any).startViewTransition) {
              (document as any).startViewTransition(() => setTab('upload'));
            } else {
              setTab('upload');
            }
          }}
          className={cn(
            "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] relative overflow-hidden group active:scale-95",
            isUploadActive 
              ? "bg-brand-blue text-white shadow-2xl shadow-brand-blue/30" 
              : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
          )}
        >
          {isUploadActive && <motion.div layoutId="nav-bg" className="absolute inset-x-0 bottom-0 h-1 gradient-bg shadow-lg" />}
          <Upload className={cn("w-4 h-4 transition-transform group-hover:-translate-y-0.5", isUploadActive ? "text-white" : "text-slate-600")} />
          Ingestion Node
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
            "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] relative overflow-hidden group active:scale-95",
            currentTab === 'rules' 
              ? "bg-brand-blue text-white shadow-2xl shadow-brand-blue/30" 
              : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
          )}
        >
          {currentTab === 'rules' && <motion.div layoutId="nav-bg" className="absolute inset-x-0 bottom-0 h-1 gradient-bg shadow-lg" />}
          <Settings2 className={cn("w-4 h-4 transition-transform group-hover:rotate-45", currentTab === 'rules' ? "text-white" : "text-slate-600")} />
          Validation Engine
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
            "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] relative overflow-hidden group active:scale-95",
            currentTab === 'history' 
              ? "bg-brand-blue text-white shadow-2xl shadow-brand-blue/30" 
              : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
          )}
        >
          {currentTab === 'history' && <motion.div layoutId="nav-bg" className="absolute inset-x-0 bottom-0 h-1 gradient-bg shadow-lg" />}
          <Clock className={cn("w-4 h-4 transition-transform group-hover:scale-110", currentTab === 'history' ? "text-white" : "text-slate-600")} />
          Audit Archives
        </button>
      </nav>

      <div className="p-8 border-t border-white/[0.05]">
        <GlossyCard glow="gradient" className="p-5 rounded-3xl border border-white/5 bg-white/[0.01]">
          <p className="text-[9px] text-zinc-600 uppercase font-black mb-3 tracking-[0.3em]">Neural Network</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-brand-blue" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-app-text block">Cloud Core</span>
              <span className="text-[8px] uppercase font-bold text-brand-blue tracking-widest">Optimized</span>
            </div>
          </div>
          <div className="w-full bg-app-bg h-1.5 rounded-full mt-4 overflow-hidden border border-app-border">
            <div className="gradient-bg h-full w-[100%] shadow-lg animate-pulse"></div>
          </div>
        </GlossyCard>
      </div>
    </aside>
  );
}
