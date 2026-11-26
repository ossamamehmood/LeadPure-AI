import React from 'react';
import { motion } from 'motion/react';
import { Upload, Settings2, Clock, Database, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';
import { TACTILE_SPRING } from './ui/MotionPrimitives';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: any) => void;
}

export function Sidebar({ currentTab, setTab }: SidebarProps) {
  const isUploadActive = ['upload', 'mapping', 'processing', 'results'].includes(currentTab);

  const navItems = [
    { id: 'upload', label: 'Upload & Verify', icon: Upload, active: isUploadActive },
    { id: 'rules', label: 'Verification Rules', icon: Settings2, active: currentTab === 'rules' },
    { id: 'history', label: 'Scan History', icon: Clock, active: currentTab === 'history' },
  ];

  return (
    <aside className="w-72 border-r border-app-border flex flex-col bg-app-bg/60 backdrop-blur-2xl hidden lg:flex shrink-0 z-50">
      <div className="p-7 flex items-center gap-3.5 group cursor-pointer">
        <div className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-[0_8px_20px_-4px_rgba(90,92,255,0.48),inset_0_1px_0_rgba(255,255,255,0.22)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
          <Zap className="w-4.5 h-4.5 fill-white" />
        </div>
        <span className="text-app-text font-display font-bold text-2xl tracking-tight select-none">
          Lead<span className="gradient-text">Pure</span>
        </span>
      </div>

      {/* Runner note: uses ephemeral GitHub Actions Port 25 workers behind the scenes */}
      <div className="px-6 mb-6">
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-app-border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Verification Engine
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 tracking-tight">
            V17 &middot; LIVE &amp; READY
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-colors duration-200 font-semibold text-xs tracking-tight relative overflow-hidden group active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                item.active
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-app-text hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
              )}
            >
              {item.active && (
                <motion.div
                  layoutId="nav-active-pill"
                  transition={TACTILE_SPRING}
                  className="absolute inset-0 bg-brand-blue rounded-2xl shadow-[0_8px_22px_-6px_rgba(90,92,255,0.55),inset_0_1px_0_rgba(255,255,255,0.2)]"
                />
              )}
              <Icon className={cn('w-4 h-4 relative z-10 transition-transform duration-200 group-hover:scale-105', item.active ? 'text-white' : 'text-slate-500 dark:text-slate-400')} />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-app-border">
        <GlossyCard className="p-4 rounded-2xl border border-app-border">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2.5">
            Engine Release
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-display font-bold text-app-text block leading-tight">LeadPure V17</span>
              <span className="text-[10px] font-mono font-medium text-brand-blue">Probe 1.3.2 (Chunked)</span>
            </div>
          </div>
        </GlossyCard>
      </div>
    </aside>
  );
}
