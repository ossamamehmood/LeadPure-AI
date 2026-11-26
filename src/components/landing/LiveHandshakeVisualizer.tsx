import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Check, AlertTriangle, X, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';

interface SampleContact {
  id: 'real' | 'catchall' | 'bounce' | 'busy';
  tab: string;
  label: string;
  email: string;
  outcome: 'Safe to Send' | 'Risky' | 'Will Bounce' | 'Unconfirmed';
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
  summary: string;
  checks: [string, string, string];
}

// Strictly uses RFC 2606 .example domains and non-personal role labels
const CONTACTS: SampleContact[] = [
  {
    id: 'real',
    tab: 'Active Inbox',
    label: 'Sales Team',
    email: 'sales@company.example',
    outcome: 'Safe to Send',
    tone: 'emerald',
    summary: 'Real inbox confirmed directly without sending an email.',
    checks: ['Format verified', 'Domain accepts mail', 'Inbox active'],
  },
  {
    id: 'catchall',
    tab: 'Catch-All',
    label: 'Partner Desk',
    email: 'partners@agency.example',
    outcome: 'Risky',
    tone: 'amber',
    summary: 'Domain accepts any username entered, so delivery is uncertain.',
    checks: ['Format verified', 'Domain accepts mail', 'Accepts any name'],
  },
  {
    id: 'bounce',
    tab: 'Dead Email',
    label: 'Closed Mailbox',
    email: 'former.desk@domain.example',
    outcome: 'Will Bounce',
    tone: 'rose',
    summary: 'Removed before sending so your sender score stays protected.',
    checks: ['Format verified', 'Mail server reached', 'Inbox does not exist'],
  },
  {
    id: 'busy',
    tab: 'Busy Server',
    label: 'General Desk',
    email: 'contact@gateway.example',
    outcome: 'Unconfirmed',
    tone: 'slate',
    summary: 'Mail server asked us to wait. Marked honest Unknown instead of guessing.',
    checks: ['Format verified', 'Mail server busy', 'Kept aside for review'],
  },
];

export function LiveHandshakeVisualizer() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || shouldReduceMotion) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % CONTACTS.length);
    }, 4400);
    return () => clearInterval(timer);
  }, [paused, shouldReduceMotion]);

  const current = CONTACTS[activeIdx];

  const toneMap = {
    emerald: {
      pill: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      icon: Check,
    },
    amber: {
      pill: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
      icon: AlertTriangle,
    },
    rose: {
      pill: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30',
      icon: X,
    },
    slate: {
      pill: 'bg-slate-500/12 text-slate-700 dark:text-slate-300 border-slate-500/30',
      icon: HelpCircle,
    },
  }[current.tone];

  const OutcomeIcon = toneMap.icon;

  return (
    <div
      className="relative max-w-4xl mx-auto w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Weightless Halo Glow Behind Architectural Stage */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 sm:-inset-10 rounded-[48px] opacity-35 dark:opacity-50 blur-3xl transition-colors duration-700"
        style={{
          background:
            'radial-gradient(60% 70% at 20% 50%, rgba(2,254,220,0.22), transparent 70%), radial-gradient(60% 70% at 80% 50%, rgba(245,2,253,0.20), transparent 70%)',
        }}
      />

      {/* Minimalist Architectural Stage */}
      <div className="relative rounded-3xl sm:rounded-[34px] gradient-border p-4 sm:p-8 backdrop-blur-2xl shadow-[0_30px_90px_-30px_rgba(0,0,0,0.45)]">
        {/* Top Interactive Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-app-border">
          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
            <span>Interactive example (demo data only)</span>
          </div>

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Example contacts">
            {CONTACTS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIdx}
                onClick={() => { setActiveIdx(idx); setPaused(true); }}
                className={cn(
                  'relative px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                  idx === activeIdx
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-app-text bg-slate-100/80 dark:bg-white/[0.04]'
                )}
              >
                {idx === activeIdx && (
                  <motion.span
                    layoutId="hero-stage-tab"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full gradient-cta"
                  />
                )}
                <span className="relative z-10">{item.tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Kinetic Laser Gate Flow */}
        <div className="py-7 sm:py-9 grid grid-cols-1 md:grid-cols-11 gap-5 items-center relative">
          {/* Left: Incoming Contact */}
          <div className="md:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`in-${current.id}`}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
                transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-app-border"
              >
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Sample Input</p>
                <p className="text-sm font-display font-bold text-app-text mt-1">{current.label}</p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5 truncate">{current.email}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Center: Animated Laser Verification Gate */}
          <div className="md:col-span-3 flex flex-col items-center justify-center relative py-3">
            {/* Signal Line */}
            <div className="w-full h-[2px] bg-slate-200 dark:bg-white/10 rounded-full relative overflow-hidden">
              {!shouldReduceMotion ? (
                <motion.div
                  key={`beam-${current.id}`}
                  className="absolute inset-y-0 left-0 w-1/2 gradient-bg rounded-full"
                  initial={{ x: '-100%' }}
                  animate={{ x: ['-100%', '220%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              ) : (
                <div className="h-full w-full gradient-bg" />
              )}
            </div>

            {/* Suspended Glowing Scanner Node */}
            <div className="relative my-3 flex items-center justify-center">
              {!shouldReduceMotion && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-full border border-dashed border-brand-blue/45 flex items-center justify-center"
                />
              )}
              <div className="absolute w-8 h-8 rounded-full gradient-cta flex items-center justify-center text-white shadow-lg">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Live Verification Gate</span>
          </div>

          {/* Right: Clean Answer */}
          <div className="md:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`out-${current.id}`}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97, y: -6 }}
                transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-app-border relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Result</span>
                  <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-bold inline-flex items-center gap-1', toneMap.pill)}>
                    <OutcomeIcon className="w-3 h-3" />
                    {current.outcome}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{current.summary}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Minimal 3-Check Human Progress Strip */}
        <div className="pt-5 border-t border-app-border grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {current.checks.map((label, i) => (
            <div
              key={`${current.id}-${i}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-white/[0.025] text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              <span className="w-5 h-5 rounded-full gradient-surface border border-brand-blue/25 flex items-center justify-center text-[10px] font-mono font-bold text-brand-blue shrink-0">
                {i + 1}
              </span>
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
