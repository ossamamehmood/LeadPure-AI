import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Check, AlertTriangle, X, HelpCircle, ArrowRight, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import { AppRoutePath } from '../Footer';

interface SampleContact {
  id: 'real' | 'catchall' | 'bounce' | 'busy';
  tab: string;
  label: string;
  email: string;
  outcome: 'Safe to Send' | 'Risky' | 'Will Bounce' | 'Unconfirmed';
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
  summary: string;
  checks: [string, string, string];
  bars: number[];
}

// Strictly uses RFC 2606 .example domains and non-personal role labels
const CONTACTS: SampleContact[] = [
  {
    id: 'real',
    tab: 'Active Inbox',
    label: 'Sales Desk',
    email: 'sales@company.example',
    outcome: 'Safe to Send',
    tone: 'emerald',
    summary: 'Real inbox confirmed directly without sending an email.',
    checks: ['Spelling valid', 'Domain ready', 'Inbox active'],
    bars: [0.35, 0.7, 0.55, 0.95, 0.75, 0.9, 0.65, 1],
  },
  {
    id: 'catchall',
    tab: 'Risky Domain',
    label: 'Partner Desk',
    email: 'partners@agency.example',
    outcome: 'Risky',
    tone: 'amber',
    summary: 'Domain accepts any username entered, so delivery is uncertain.',
    checks: ['Spelling valid', 'Domain ready', 'Accepts any name'],
    bars: [0.4, 0.85, 0.6, 0.6, 0.8, 0.55, 0.65, 0.55],
  },
  {
    id: 'bounce',
    tab: 'Closed Inbox',
    label: 'Former Contact',
    email: 'former.desk@domain.example',
    outcome: 'Will Bounce',
    tone: 'rose',
    summary: 'Removed before sending so your sender reputation stays safe.',
    checks: ['Spelling valid', 'Host reached', 'Inbox closed'],
    bars: [0.3, 0.65, 0.85, 0.25, 0.2, 0.15, 0.2, 0.15],
  },
  {
    id: 'busy',
    tab: 'Busy Host',
    label: 'General Desk',
    email: 'contact@gateway.example',
    outcome: 'Unconfirmed',
    tone: 'slate',
    summary: 'Receiving host asked to wait. Marked honest Unconfirmed instead of guessing.',
    checks: ['Spelling valid', 'Host busy now', 'Saved for review'],
    bars: [0.45, 0.55, 0.4, 0.5, 0.45, 0.5, 0.4, 0.45],
  },
];

interface LiveHandshakeVisualizerProps {
  onNavigate?: (path: AppRoutePath) => void;
}

export function LiveHandshakeVisualizer({ onNavigate }: LiveHandshakeVisualizerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || shouldReduceMotion) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % CONTACTS.length);
    }, 4600);
    return () => clearInterval(timer);
  }, [paused, shouldReduceMotion]);

  const current = CONTACTS[activeIdx];

  const toneMap = {
    emerald: {
      pill: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      bar: 'bg-emerald-400',
      icon: Check,
    },
    amber: {
      pill: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
      bar: 'bg-amber-400',
      icon: AlertTriangle,
    },
    rose: {
      pill: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30',
      bar: 'bg-rose-400',
      icon: X,
    },
    slate: {
      pill: 'bg-slate-500/12 text-slate-700 dark:text-slate-300 border-slate-500/30',
      bar: 'bg-slate-400',
      icon: HelpCircle,
    },
  }[current.tone];

  const OutcomeIcon = toneMap.icon;

  return (
    <div
      className="relative max-w-5xl mx-auto w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Subtle architectural rim halo behind Command Deck */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 sm:-inset-8 rounded-[48px] opacity-30 dark:opacity-35 blur-3xl"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 35%, rgba(90,92,255,0.22), rgba(2,254,220,0.12) 48%, transparent 76%)',
        }}
      />

      {/* Unified iOS Liquid-Glass Command Deck */}
      <div className="liquid-glass relative rounded-3xl sm:rounded-[34px] overflow-hidden">
        <div className="p-4 sm:p-7 space-y-5">
          {/* Top Bar & Interactive Scenario Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-app-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 mr-1" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/15" />
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Live Verification Preview
              </span>
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                0 Emails Sent
              </span>
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
                      ? 'text-white dark:text-slate-950'
                      : 'text-slate-700 dark:text-slate-200 hover:text-app-text bg-slate-200/75 dark:bg-white/[0.06] border border-slate-300/60 dark:border-white/[0.06]'
                  )}
                >
                  {idx === activeIdx && (
                    <motion.span
                      layoutId="hero-stage-tab"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-slate-900 dark:bg-white shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{item.tab}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Live Telemetry Flow */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 sm:gap-5 items-center py-1">
            {/* Input Card */}
            <div className="md:col-span-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`in-${current.id}`}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 8 }}
                  transition={{ duration: 0.25, ease: EDITORIAL_EASE }}
                  className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-white/[0.035] border border-white/80 dark:border-app-border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Contact Check</p>
                  <p className="text-sm font-display font-bold text-app-text mt-1">{current.label}</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5 truncate">{current.email}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Center Signal Track */}
            <div className="md:col-span-3 flex flex-col items-center justify-center relative py-1">
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

              <div className="relative my-3 flex items-center justify-center">
                {!shouldReduceMotion && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                    className="w-11 h-11 rounded-full border border-dashed border-brand-blue/45 flex items-center justify-center"
                  />
                )}
                <div className="absolute w-7.5 h-7.5 rounded-full gradient-cta flex items-center justify-center text-white shadow-lg">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-end justify-center gap-1 h-3.5" aria-hidden="true">
                {current.bars.map((heightRatio, idx) => (
                  <motion.span
                    key={`${current.id}-bar-${idx}`}
                    className={cn('w-1 rounded-full origin-bottom', toneMap.bar)}
                    style={{ height: '12px' }}
                    initial={shouldReduceMotion ? { scaleY: heightRatio } : { scaleY: 0.25 }}
                    animate={
                      shouldReduceMotion
                        ? { scaleY: heightRatio }
                        : { scaleY: [heightRatio * 0.55, heightRatio, heightRatio * 0.7] }
                    }
                    transition={{
                      duration: 1.1 + idx * 0.08,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Outcome Card */}
            <div className="md:col-span-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`out-${current.id}`}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, y: -4 }}
                  transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
                  className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-white/[0.035] border border-white/80 dark:border-app-border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
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

          {/* 3-Step Micro Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {current.checks.map((label, i) => (
              <div
                key={`${current.id}-${i}`}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/45 dark:bg-white/[0.025] border border-white/60 dark:border-white/[0.05] text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <span className="w-5 h-5 rounded-full gradient-surface border border-brand-blue/25 flex items-center justify-center text-[10px] font-mono font-bold text-brand-blue shrink-0">
                  {i + 1}
                </span>
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Docked Bottom Proof-of-Evidence Confidence Strip */}
        <div className="border-t border-app-border bg-white/35 dark:bg-white/[0.02] px-4 sm:px-7 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => onNavigate?.('/deliverability')}
            className="flex items-center gap-3.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-xl"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-display font-bold text-app-text group-hover:text-brand-blue transition-colors">
                &lt; 1% Target Bounces
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Up to 90%+ fewer hard bounces vs uncleaned lists
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue/12 border border-brand-blue/25 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-brand-blue" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-display font-bold text-app-text">
                Double-Checked Rejections
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Strict filters verified twice before blocking a lead
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-pink/10 border border-brand-pink/25 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-brand-pink" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-display font-bold text-app-text">
                5,000 Leads Per Sheet
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Clean names, phones &amp; emails locally in browser
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
