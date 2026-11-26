import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
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
  bars: number[];
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
    bars: [0.35, 0.7, 0.55, 0.95, 0.75, 0.9, 0.65, 1],
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
    bars: [0.4, 0.85, 0.6, 0.6, 0.8, 0.55, 0.65, 0.55],
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
    bars: [0.3, 0.65, 0.85, 0.25, 0.2, 0.15, 0.2, 0.15],
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
    bars: [0.45, 0.55, 0.4, 0.5, 0.45, 0.5, 0.4, 0.45],
  },
];

export function LiveHandshakeVisualizer() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [6, 0]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [0.975, 1]);

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
      ref={stageRef}
      className="relative max-w-4xl mx-auto w-full"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Subtle neutral spatial depth glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 sm:-inset-12 rounded-[52px] opacity-20 dark:opacity-25 blur-3xl transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 45%, rgba(90,92,255,0.18), transparent 72%)',
        }}
      />

      {/* Spatial 3D Ceramic/Obsidian Hardware Console */}
      <motion.div
        style={shouldReduceMotion ? undefined : { rotateX, scale: stageScale }}
        className="relative rounded-3xl sm:rounded-[34px] border border-slate-200/90 dark:border-white/[0.09] bg-white/95 dark:bg-[#0D1017]/92 p-4 sm:p-8 backdrop-blur-3xl shadow-[0_32px_90px_-30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]"
      >
        {/* Top Recessed Glass Window Chrome & Scenario Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/15" />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
              <span>Interactive example (demo data only)</span>
            </div>
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
                    : 'text-slate-600 dark:text-slate-400 hover:text-app-text bg-slate-100/80 dark:bg-white/[0.04]'
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

        {/* 3-Column Kinetic Instrument Flow */}
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
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-app-border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Sample Input</p>
                <p className="text-sm font-display font-bold text-app-text mt-1">{current.label}</p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5 truncate">{current.email}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Center: Scanner Reticle + Equalizer Waveform + Travelling Filament */}
          <div className="md:col-span-3 flex flex-col items-center justify-center relative py-2">
            {/* Optical Beam Track */}
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

            {/* Orbital Reticle + Center Node */}
            <div className="relative my-3.5 flex items-center justify-center">
              {!shouldReduceMotion && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-full border border-dashed border-brand-blue/45 flex items-center justify-center"
                />
              )}
              <div className="absolute w-8 h-8 rounded-full gradient-cta flex items-center justify-center text-white shadow-lg">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Acoustic/Telemetry Equalizer Bars (GPU scaleY) */}
            <div className="flex items-end justify-center gap-1 h-4 mt-0.5" aria-hidden="true">
              {current.bars.map((heightRatio, idx) => (
                <motion.span
                  key={`${current.id}-bar-${idx}`}
                  className={cn('w-1 rounded-full origin-bottom', toneMap.bar)}
                  style={{ height: '14px' }}
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

          {/* Right: Clean Answer */}
          <div className="md:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`out-${current.id}`}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97, y: -6 }}
                transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-app-border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
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

        {/* Minimal 3-Check Progress Strip */}
        <div className="pt-5 border-t border-app-border grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {current.checks.map((label, i) => (
            <div
              key={`${current.id}-${i}`}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.025] text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              <span className="w-5 h-5 rounded-full gradient-surface border border-brand-blue/25 flex items-center justify-center text-[10px] font-mono font-bold text-brand-blue shrink-0">
                {i + 1}
              </span>
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
