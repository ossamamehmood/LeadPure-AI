import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Upload, Settings2, Clock, Zap, Home, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { TACTILE_SPRING } from './ui/MotionPrimitives';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: any) => void;
  onNavigateHome?: () => void;
}

const SIDEBAR_STORAGE_KEY = 'leadpure_sidebar_collapsed_v2';

export function Sidebar({ currentTab, setTab, onNavigateHome }: SidebarProps) {
  const shouldReduceMotion = useReducedMotion();
  // Default to compact collapsed icon rail so workspace forms & tables keep full horizontal room
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // ignore storage quota errors
    }
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  const isUploadActive = ['upload', 'mapping', 'processing', 'results'].includes(currentTab);

  const navItems = [
    ...(onNavigateHome
      ? [{ id: 'home', label: 'Home Overview', icon: Home, active: false }]
      : []),
    { id: 'upload', label: 'Upload & Verify', icon: Upload, active: isUploadActive },
    { id: 'rules', label: 'Verification Rules', icon: Settings2, active: currentTab === 'rules' },
    { id: 'history', label: 'Scan History', icon: Clock, active: currentTab === 'history' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 264 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 32 }}
      className="liquid-glass !rounded-none border-y-0 border-l-0 hidden lg:flex flex-col shrink-0 z-50 relative select-none"
    >
      {/* Top Brand Mark */}
      <div
        className={cn(
          'flex items-center shrink-0 transition-all',
          collapsed ? 'justify-center px-3 pt-6 pb-4' : 'px-6 pt-6 pb-5'
        )}
      >
        <button
          type="button"
          onClick={onNavigateHome}
          title="Back to LeadPure Homepage"
          className={cn(
            'flex items-center group cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-xl',
            collapsed ? 'justify-center' : 'gap-3 min-w-0'
          )}
        >
          <div className="w-9 h-9 rounded-xl gradient-cta flex items-center justify-center text-white shadow-[0_8px_20px_-4px_rgba(90,92,255,0.5),0_2px_12px_-2px_rgba(245,2,253,0.22),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 shrink-0">
            <Zap className="w-4.5 h-4.5 fill-white" />
          </div>
          {!collapsed && (
            <span className="text-app-text font-display font-bold text-2xl tracking-tight truncate">
              Lead<span className="gradient-text">Pure</span>
            </span>
          )}
        </button>
      </div>

      {/* Live Readiness Indicator (Expanded only; no version numbers) */}
      {!collapsed && (
        <div className="px-6 mb-5">
          <div className="p-3.5 rounded-2xl bg-white/35 dark:bg-white/[0.04] border border-white/55 dark:border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Verification Engine
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="text-xs font-bold text-app-text tracking-tight">
              Real-Time Ready
            </div>
          </div>
        </div>
      )}

      {collapsed && <div className="mx-4 mb-3 h-px bg-app-border" />}

      {/* Navigation Rail / Items */}
      <nav
        className={cn('flex-1 flex flex-col mt-1', collapsed ? 'items-center px-2.5 gap-2.5' : 'px-4 space-y-2')}
        aria-label="Main navigation"
      >
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isHomeDivider = collapsed && item.id === 'home';

          if (collapsed) {
            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  onClick={() => (item.id === 'home' ? onNavigateHome?.() : setTab(item.id))}
                  aria-label={item.label}
                  className={cn(
                    'relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-[color,background-color,border-color,transform,box-shadow] duration-200 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                    item.active
                      ? 'gradient-cta text-white shadow-[0_0_24px_-4px_rgba(90,92,255,0.68),0_0_14px_-4px_rgba(245,2,253,0.42)]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-app-text hover:bg-white/45 dark:hover:bg-white/[0.08] border border-transparent hover:border-white/60 dark:hover:border-white/10'
                  )}
                >
                  <Icon className="w-5 h-5 relative z-10 transition-transform duration-200 group-hover:scale-105" aria-hidden="true" />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-full ml-3 px-3 py-1.5 rounded-xl liquid-glass text-xs font-semibold text-app-text whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-[opacity,transform] duration-150 shadow-xl z-[70]"
                  >
                    {item.label}
                  </span>
                </button>
                {isHomeDivider && index < navItems.length - 1 && (
                  <div className="w-8 h-px bg-app-border my-0.5" />
                )}
              </React.Fragment>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.id === 'home' ? onNavigateHome?.() : setTab(item.id))}
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
              <Icon
                className={cn(
                  'w-4 h-4 relative z-10 transition-transform duration-200 group-hover:scale-105 shrink-0',
                  item.active ? 'text-white dark:text-brand-cyan' : 'text-slate-500 dark:text-slate-400'
                )}
              />
              <span className="relative z-10 truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Readiness Status & Expand/Collapse Chevron */}
      {collapsed ? (
        <div className="py-5 px-2 border-t border-app-border flex flex-col items-center gap-3">
          <div
            title="Real-Time Verification Active"
            className="w-10 h-10 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.45)]"
          >
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={false}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="w-9 h-9 rounded-full border border-white/55 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] hover:bg-white/75 dark:hover:bg-white/[0.10] text-slate-600 dark:text-slate-300 hover:text-app-text flex items-center justify-center transition-[color,background-color,border-color,transform] duration-200 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="p-5 border-t border-app-border space-y-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={true}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="w-full h-10 rounded-full border border-white/55 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] hover:bg-white/75 dark:hover:bg-white/[0.10] text-slate-700 dark:text-slate-200 hover:text-app-text flex items-center justify-center gap-2 text-xs font-semibold transition-[color,background-color,border-color,transform] duration-200 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Collapse sidebar</span>
          </button>
        </div>
      )}
    </motion.aside>
  );
}
