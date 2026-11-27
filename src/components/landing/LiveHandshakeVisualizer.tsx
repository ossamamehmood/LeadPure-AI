import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, AlertTriangle, X, HelpCircle, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import SpotlightCard from '../reactbits/SpotlightCard';
import DecryptedText from '../reactbits/DecryptedText';
import { AppRoutePath } from '../Footer';

interface SampleContact {
  id: 'real' | 'catchall' | 'bounce' | 'busy';
  tab: string;
  label: string;
  email: string;
  outcome: 'Safe to Send' | 'Risky' | 'Will Bounce' | 'Unconfirmed';
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
  summary: string;
  checks: [
    { step: string; detail: string; status: 'pass' | 'warn' | 'fail' },
    { step: string; detail: string; status: 'pass' | 'warn' | 'fail' },
    { step: string; detail: string; status: 'pass' | 'warn' | 'fail' }
  ];
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
    summary: 'Real inbox confirmed directly without sending an email to the contact.',
    checks: [
      { step: 'Address formatting', detail: 'Valid structure', status: 'pass' },
      { step: 'Domain mail server', detail: 'Active and reachable', status: 'pass' },
      { step: 'Mailbox confirmation', detail: 'Inbox ready for mail', status: 'pass' },
    ],
  },
  {
    id: 'catchall',
    tab: 'Risky Domain',
    label: 'Partner Desk',
    email: 'partners@agency.example',
    outcome: 'Risky',
    tone: 'amber',
    summary: 'Domain accepts any username typed in, so it is held separately for review.',
    checks: [
      { step: 'Address formatting', detail: 'Valid structure', status: 'pass' },
      { step: 'Domain mail server', detail: 'Active gateway', status: 'pass' },
      { step: 'Catch-all detection', detail: 'Accepts all usernames', status: 'warn' },
    ],
  },
  {
    id: 'bounce',
    tab: 'Closed Inbox',
    label: 'Former Contact',
    email: 'former.desk@domain.example',
    outcome: 'Will Bounce',
    tone: 'rose',
    summary: 'Double-checked twice and removed before campaign launch to protect domain reputation.',
    checks: [
      { step: 'Address formatting', detail: 'Valid structure', status: 'pass' },
      { step: 'Backup second check', detail: 'Confirmed inactive', status: 'fail' },
      { step: 'Mailbox confirmation', detail: 'Inbox no longer exists', status: 'fail' },
    ],
  },
  {
    id: 'busy',
    tab: 'Busy Host',
    label: 'General Desk',
    email: 'contact@gateway.example',
    outcome: 'Unconfirmed',
    tone: 'slate',
    summary: 'Receiving server paused incoming checks temporarily. Saved cleanly instead of guessing.',
    checks: [
      { step: 'Address formatting', detail: 'Valid structure', status: 'pass' },
      { step: 'Domain mail server', detail: 'Temporarily throttled', status: 'warn' },
      { step: 'Honest safety hold', detail: 'Marked for review', status: 'warn' },
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
      <SpotlightCard
        theme={theme}
        spotlightColor={theme === 'dark' ? '#5A5CFF' : '#4F46E5'}
        intensity={theme === 'dark' ? 0.14 : 0.07}
        borderGlow={0.75}
        grain={0.024}
        spotlightSize={280}
        className="spotlight-glass !p-0 rounded-3xl border border-app-border"
      >
        {/* Top inspector header */}
        <div className="px-5 py-4 border-b border-app-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-app-text tracking-tight">Live Inspection Trace</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            0 Emails Sent
          </span>
        </div>

        {/* Scenario switcher */}
        <div className="px-5 pt-4 pb-3 border-b border-app-border/70 flex flex-wrap gap-1.5" role="tablist" aria-label="Sample email scenarios">
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
                  : 'text-slate-600 dark:text-slate-300 hover:text-app-text bg-slate-100/85 dark:bg-white/[0.05]'
              )}
            >
              {item.tab}
            </button>
          ))}
        </div>

        {/* Target address header + always-visible verdict badge */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-app-border">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {current.label}
              </p>
              <div className="text-sm sm:text-base font-mono font-semibold text-app-text mt-0.5 truncate">
                {hasInteracted ? (
                  <DecryptedText
                    key={current.id}
                    text={current.email}
                    animateOn="view"
                    speed={16}
                    maxIterations={3}
                    sequential
                    revealDirection="start"
                    characters="abcdefghijklmnopqrstuvwxyz0123456789.-_@"
                  />
                ) : (
                  <span>{current.email}</span>
                )}
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

          {/* Hairline sequential check ledger */}
          <div className="divide-y divide-app-border rounded-2xl border border-app-border bg-white/50 dark:bg-white/[0.02]">
            {current.checks.map((row, idx) => {
              const badgeColor =
                row.status === 'pass'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : row.status === 'warn'
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    : 'text-rose-600 dark:text-rose-400 bg-rose-500/10';
              return (
                <div key={`${current.id}-step-${idx}`} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-md border border-app-border bg-slate-100/80 dark:bg-white/[0.04] flex items-center justify-center text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 shrink-0 tabular-nums">
                      0{idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-app-text truncate">
                      {row.step}
                    </span>
                  </div>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0', badgeColor)}>
                    {row.detail}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Outcome explanation + link */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {current.summary}
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('/deliverability')}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-app-text hover:text-brand-blue transition-colors cursor-pointer"
              aria-label="Learn how bounce protection works"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
              <span>Why it works</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
