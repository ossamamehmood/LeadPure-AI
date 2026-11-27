import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, AlertTriangle, X, HelpCircle, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import { LiquidSpotlightCard } from '../ui/LiquidSpotlightCard';
import { TraceAddressText } from '../ui/TraceAddressText';
import { AppRoutePath } from '../Footer';

interface SampleContact {
  id: 'real' | 'catchall' | 'bounce' | 'busy';
  tab: string;
  label: string;
  email: string;
  outcome: 'Safe to Send' | 'Risky' | 'Will Bounce' | 'Unconfirmed';
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
  summary: string;
  signals: [
    { label: string; ok: boolean | 'warn' },
    { label: string; ok: boolean | 'warn' },
    { label: string; ok: boolean | 'warn' }
  ];
}

// Uses RFC 2606 .example sample domains only
const CONTACTS: SampleContact[] = [
  {
    id: 'real',
    tab: 'Active Inbox',
    label: 'Sales Desk',
    email: 'sales@company.example',
    outcome: 'Safe to Send',
    tone: 'emerald',
    summary: 'Real inbox confirmed directly without sending any email.',
    signals: [
      { label: 'Format', ok: true },
      { label: 'Domain', ok: true },
      { label: 'Inbox', ok: true },
    ],
  },
  {
    id: 'catchall',
    tab: 'Risky Domain',
    label: 'Partner Desk',
    email: 'partners@agency.example',
    outcome: 'Risky',
    tone: 'amber',
    summary: 'Domain accepts any username typed in, held for review.',
    signals: [
      { label: 'Format', ok: true },
      { label: 'Domain', ok: true },
      { label: 'Catch-all', ok: 'warn' },
    ],
  },
  {
    id: 'bounce',
    tab: 'Closed Inbox',
    label: 'Former Contact',
    email: 'former.desk@domain.example',
    outcome: 'Will Bounce',
    tone: 'rose',
    summary: 'Removed before sending so your domain reputation stays intact.',
    signals: [
      { label: 'Format', ok: true },
      { label: 'Domain', ok: true },
      { label: 'Closed', ok: false },
    ],
  },
  {
    id: 'busy',
    tab: 'Busy Host',
    label: 'General Desk',
    email: 'contact@gateway.example',
    outcome: 'Unconfirmed',
    tone: 'slate',
    summary: 'Server asked to pause temporarily. Held safely instead of guessing.',
    signals: [
      { label: 'Format', ok: true },
      { label: 'Domain', ok: true },
      { label: 'Busy', ok: 'warn' },
    ],
  },
];

interface LiveHandshakeVisualizerProps {
  onNavigate?: (path: AppRoutePath) => void;
  theme?: 'dark' | 'light';
}

export function LiveHandshakeVisualizer({ onNavigate, theme = 'dark' }: LiveHandshakeVisualizerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || shouldReduceMotion) return;
    const timer = setInterval(() => {
      setHasInteracted(true);
      setActiveIdx((prev) => (prev + 1) % CONTACTS.length);
    }, 5200);
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
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <LiquidSpotlightCard
        spotlightColor={theme === 'dark' ? 'rgba(90, 92, 255, 0.16)' : 'rgba(90, 92, 255, 0.10)'}
        className="rounded-3xl p-5 sm:p-6 space-y-5"
      >
        {/* Minimalist Header */}
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-app-text">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live Check Preview
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Zero emails sent
          </span>
        </div>

        {/* Minimal Scenario Switcher */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Sample email scenarios">
          {CONTACTS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIdx}
              onClick={() => { setActiveIdx(idx); setPaused(true); setHasInteracted(true); }}
              className={cn(
                'px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                idx === activeIdx
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-app-text bg-white/35 dark:bg-white/[0.04]'
              )}
            >
              {item.tab}
            </button>
          ))}
        </div>

        {/* Transparent Glass Result Row */}
        <div className="rounded-2xl border border-white/55 dark:border-white/[0.08] bg-white/30 dark:bg-white/[0.03] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {current.label}
              </p>
              <div className="text-sm sm:text-base font-mono font-semibold text-app-text mt-0.5 truncate">
                <TraceAddressText
                  key={current.id}
                  text={current.email}
                  animateOnChange={hasInteracted}
                />
              </div>
            </div>

            <motion.span
              key={`verdict-${current.id}`}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.4, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
              className={cn(
                'px-3 py-1 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center',
                toneMap.pill
              )}
            >
              <OutcomeIcon className="w-3.5 h-3.5" />
              <span>{current.outcome}</span>
            </motion.span>
          </div>

          {/* Ultra-minimalist inline check trail */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
            {current.signals.map((sig) => (
              <div key={sig.label} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    sig.ok === true
                      ? 'bg-emerald-500'
                      : sig.ok === 'warn'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                  )}
                />
                <span className="truncate">{sig.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Single-Line Explanation + Action */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {current.summary}
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.('/deliverability')}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-app-text hover:text-brand-blue transition-colors cursor-pointer"
          >
            <span>Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </LiquidSpotlightCard>
    </div>
  );
}
