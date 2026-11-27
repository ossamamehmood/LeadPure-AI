import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Check, AlertTriangle, X, CircleDashed, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import { LiquidSpotlightCard } from '../ui/LiquidSpotlightCard';

interface SampleRow {
  email: string;
  note: string;
  bucket: 'safe' | 'risky' | 'remove';
  tag: string;
}

// Uses RFC 2606 .example sample domains only
const SAMPLE_LIST: SampleRow[] = [
  { email: 'hello@company.example', note: 'Active business inbox', bucket: 'safe', tag: 'Safe to Send' },
  { email: 'sales@company.exmaple', note: 'Typo domain flagged', bucket: 'remove', tag: 'Bad Address' },
  { email: 'signup@disposable.example', note: 'Temporary burner inbox', bucket: 'remove', tag: 'Burner Email' },
  { email: 'team@agency.example', note: 'Accepts all usernames', bucket: 'risky', tag: 'Risky' },
  { email: 'support@workspace.example', note: 'Confirmed active mailbox', bucket: 'safe', tag: 'Safe to Send' },
];

interface ArchitecturePipelineProps {
  theme?: 'dark' | 'light';
}

export function ArchitecturePipeline({ theme = 'dark' }: ArchitecturePipelineProps) {
  const [cleaned, setCleaned] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });
  const cardRotateX = useTransform(scrollYProgress, [0, 1], [6, 0]);
  const cardY = useTransform(scrollYProgress, [0, 1], [20, 0]);

  const sortedRows = cleaned
    ? [
        ...SAMPLE_LIST.filter((r) => r.bucket === 'safe'),
        ...SAMPLE_LIST.filter((r) => r.bucket === 'risky'),
        ...SAMPLE_LIST.filter((r) => r.bucket === 'remove'),
      ]
    : SAMPLE_LIST;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
      {/* Left Narrative */}
      <div className="lg:col-span-5 space-y-6">
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Interactive Preview
        </p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight leading-[1.12] text-balance">
          Stop paying to email dead addresses.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-[60ch]">
          Upload any spreadsheet and LeadPure separates ready-to-send contacts from typos, disposable signups, and dead mailboxes automatically.
        </p>

        {/* Monochrome Toggle Switch */}
        <div className="inline-flex p-1.5 rounded-full liquid-glass">
          <button
            type="button"
            onClick={() => setCleaned(false)}
            className={cn(
              'relative px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer',
              !cleaned ? 'text-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-400 hover:text-app-text'
            )}
          >
            {!cleaned && (
              <motion.span
                layoutId="cleaner-mode-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full bg-slate-900 dark:bg-white shadow-sm"
              />
            )}
            <span className="relative z-10">Before Cleaning</span>
          </button>

          <button
            type="button"
            onClick={() => setCleaned(true)}
            className={cn(
              'relative px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
              cleaned ? 'text-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-400 hover:text-app-text'
            )}
          >
            {cleaned && (
              <motion.span
                layoutId="cleaner-mode-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full bg-slate-900 dark:bg-white shadow-sm"
              />
            )}
            <CheckCircle2 className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Cleaned by LeadPure</span>
          </button>
        </div>

        {/* Simple 4-Step Flow Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 pt-2">
          {[
            'Upload spreadsheet',
            'Check every inbox',
            'Separate risky leads',
            'Download clean list',
          ].map((title, idx) => (
            <div key={title} className="flex items-center gap-2.5 p-3 rounded-2xl liquid-glass">
              <span className="w-5 h-5 rounded-full bg-brand-blue/12 dark:bg-white/10 text-[11px] font-semibold text-brand-blue dark:text-white flex items-center justify-center shrink-0 tabular-nums">
                {idx + 1}
              </span>
              <span className="text-xs font-semibold text-app-text">{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Kinetic List Stage inside Unified Glossy Container */}
      <div ref={stageRef} className="lg:col-span-7" style={{ perspective: '1100px' }}>
        <motion.div style={shouldReduceMotion ? undefined : { rotateX: cardRotateX, y: cardY }}>
          <LiquidSpotlightCard
            spotlightColor={theme === 'dark' ? 'rgba(2, 254, 220, 0.14)' : 'rgba(90, 92, 255, 0.10)'}
            className="p-5 sm:p-7 rounded-3xl space-y-3"
          >
            <div className="flex items-center justify-between text-xs pb-3 border-b border-black/[0.07] dark:border-white/[0.08]">
              <span className="font-display font-bold text-app-text">
                {cleaned ? 'Sorted Contact List' : 'Unchecked Spreadsheet'}
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {cleaned ? '2 Safe · 1 Risky · 2 Removed' : '5 Unverified Rows'}
              </span>
            </div>

            <div className="space-y-2.5">
              {sortedRows.map((row) => {
                const badgeStyle = !cleaned
                  ? 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border-transparent'
                  : row.bucket === 'safe'
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : row.bucket === 'risky'
                      ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30';

                const Icon = !cleaned
                  ? CircleDashed
                  : row.bucket === 'safe'
                    ? Check
                    : row.bucket === 'risky'
                      ? AlertTriangle
                      : X;

                return (
                  <motion.div
                    key={row.email}
                    layout={!shouldReduceMotion}
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/55 dark:border-white/[0.08] transition-opacity duration-300',
                      cleaned && row.bucket === 'remove'
                        ? 'opacity-50 bg-white/20 dark:bg-white/[0.015]'
                        : 'bg-white/35 dark:bg-white/[0.03]'
                    )}
                  >
                    <div className="min-w-0">
                      <p className={cn(
                        'text-xs sm:text-sm font-mono font-semibold text-app-text truncate',
                        cleaned && row.bucket === 'remove' && 'line-through decoration-rose-400/70'
                      )}>
                        {row.email}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {cleaned ? row.note : 'Status unknown until checked'}
                      </p>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.span
                        key={cleaned ? row.tag : 'unchecked'}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                        className={cn(
                          'px-2.5 py-1 rounded-full border text-[11px] font-semibold inline-flex items-center gap-1 shrink-0',
                          badgeStyle
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{cleaned ? row.tag : 'Unchecked'}</span>
                      </motion.span>
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </LiquidSpotlightCard>
        </motion.div>
      </div>
    </div>
  );
}
