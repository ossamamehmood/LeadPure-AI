import React from 'react';
import { motion } from 'motion/react';
import { Upload, Settings2, Clock, Database, Zap, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';
import { TACTILE_SPRING } from './ui/MotionPrimitives';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: any) => void;
  onNavigateHome?: () => void;
}

export function Sidebar({ currentTab, setTab, onNavigateHome }: SidebarProps) {
  const isUploadActive = ['upload', 'mapping', 'processing', 'results'].includes(currentTab);

  const navItems = [
    { id: 'upload', label: 'Upload & Verify', icon: Upload, active: isUploadActive },
    { id: 'rules', label: 'Verification Rules', icon: Settings2, active: currentTab === 'rules' },
    { id: 'history', label: 'Scan History', icon: Clock, active: currentTab === 'history' },
  ];

  return (
    <aside className="w-72 border-r border-app-border flex flex-col bg-app-bg/60 backdrop-blur-2xl hidden lg:flex shrink-0 z-50">
      <button
        type="button"
        onClick={onNavigateHome}
        title="Back to LeadPure Homepage"
        className="p-7 flex items-center gap-3.5 group cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        <div className="w-9 h-9 rounded-xl gradient-cta flex items-center justify-center text-white shadow-[0_8px_20px_-4px_rgba(90,92,255,0.5),0_2px_12px_-2px_rgba(245,2,253,0.22),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
          <Zap className="w-4.5 h-4.5 fill-white" />
        </div>
        <span className="text-app-text font-display font-bold text-2xl tracking-tight select-none">
          Lead<span className="gradient-text">Pure</span>
        </span>
      </button>

      {/* Runner note: uses ephemeral GitHub Actions Port 25 workers behind the scenes */}
      <div className="px-6 mb-6">
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-app-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Verification Engine
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="text-xs font-bold font-mono text-app-text tracking-tight">
            V14 &middot; LIVE &amp; READY
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-2" aria-label="Main navigation">
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-colors duration-200 font-semibold text-xs tracking-tight text-slate-600 dark:text-slate-400 hover:text-app-text hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <Home className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Home Overview</span>
          </button>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-colors duration-200 font-semibold text-xs tracking-tight relative overflow-hidden group active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                item.active
                  ? 'text-white dark:text-app-text'
                  : 'text-slate-600 dark:text-slate-400 hover:text-app-text hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
              )}
            >
              {item.active && (
                <motion.div
                  layoutId="nav-active-pill"
                  transition={TACTILE_SPRING}
                  className="absolute inset-0 bg-slate-900 dark:bg-white/[0.08] border border-slate-900 dark:border-white/15 rounded-2xl shadow-sm"
                >
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full gradient-bg" />
                </motion.div>
              )}
              <Icon className={cn('w-4 h-4 relative z-10 transition-transform duration-200 group-hover:scale-105', item.active ? 'text-white dark:text-brand-cyan' : 'text-slate-500 dark:text-slate-400')} />
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
            <div className="w-8 h-8 rounded-xl gradient-surface border border-brand-blue/25 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-display font-bold text-app-text block leading-tight">LeadPure V14</span>
              <span className="text-[10px] font-mono font-medium gradient-text">Probe 1.3.2 (Chunked)</span>
            </div>
          </div>
        </GlossyCard>
      </div>
    </aside>
  );
}
