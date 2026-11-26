import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Zap, ArrowRight, Check, X, Sun, Moon, Plus, Minus, ExternalLink, ShieldCheck, Activity, FileSpreadsheet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MagneticButton } from './ui/MagneticButton';
import { BackgroundMotion } from './ui/BackgroundMotion';
import { EDITORIAL_EASE } from './ui/MotionPrimitives';
import { LiveHandshakeVisualizer } from './landing/LiveHandshakeVisualizer';
import { ArchitecturePipeline } from './landing/ArchitecturePipeline';
import { Footer } from './Footer';

interface LandingPageProps {
  onOpenDashboard: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (e: React.MouseEvent) => void;
}

interface MatrixCell {
  ok: boolean;
  note?: string;
}

const COMPARISON_ROWS: {
  feature: string;
  leadpure: MatrixCell;
  zerobounce: MatrixCell;
  emailable: MatrixCell;
  hunter: MatrixCell;
  reacher: MatrixCell;
}[] = [
  {
    feature: 'No monthly credit fees',
    leadpure: { ok: true, note: 'Zero fees' },
    zerobounce: { ok: false, note: '100/mo free' },
    emailable: { ok: false, note: '250 trial' },
    hunter: { ok: false, note: '50/mo free' },
    reacher: { ok: false, note: 'VPS / Paid' },
  },
  {
    feature: 'Zero server setup',
    leadpure: { ok: true },
    zerobounce: { ok: true },
    emailable: { ok: true },
    hunter: { ok: true },
    reacher: { ok: false, note: 'Needs server' },
  },
  {
    feature: 'Finds Accept-All domains',
    leadpure: { ok: true },
    zerobounce: { ok: true },
    emailable: { ok: true },
    hunter: { ok: true },
    reacher: { ok: true },
  },
  {
    feature: 'Excel & CSV list export',
    leadpure: { ok: true },
    zerobounce: { ok: true },
    emailable: { ok: true },
    hunter: { ok: true },
    reacher: { ok: false, note: 'API-first' },
  },
  {
    feature: 'Extra columns stay in browser',
    leadpure: { ok: true },
    zerobounce: { ok: false, note: 'Cloud upload' },
    emailable: { ok: false, note: 'Cloud upload' },
    hunter: { ok: false, note: 'Cloud upload' },
    reacher: { ok: false, note: 'API payload' },
  },
  {
    feature: 'Open source codebase',
    leadpure: { ok: true },
    zerobounce: { ok: false },
    emailable: { ok: false },
    hunter: { ok: false },
    reacher: { ok: true },
  },
];

function ComparisonCell({ cell, primary = false }: { cell: MatrixCell; primary?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center">
      {cell.ok ? (
        <span
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center border',
            primary
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
          )}
          aria-label="Yes"
        >
          <Check className="w-3.5 h-3.5" />
        </span>
      ) : (
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.07] text-slate-400 dark:text-slate-600"
          aria-label="No"
        >
          <X className="w-3.5 h-3.5" />
        </span>
      )}
      {cell.note && (
        <span
          className={cn(
            'text-[11px] leading-tight',
            primary ? 'font-semibold text-app-text' : 'font-normal text-slate-500 dark:text-slate-400'
          )}
        >
          {cell.note}
        </span>
      )}
    </div>
  );
}

const FAQS = [
  {
    q: 'Does LeadPure actually send an email to my contacts?',
    a: 'No. LeadPure checks whether the destination mailbox is ready to accept mail and ends the check immediately before any message is ever sent.',
  },
  {
    q: 'How can LeadPure check emails without charging per credit?',
    a: 'Traditional platforms rent shared mail clusters and bill you for every single row. LeadPure runs its own lightweight verification engine through your deployment workflow, removing per-lead SaaS markups.',
  },
  {
    q: 'Why does an email sometimes show as Unknown?',
    a: 'Some providers temporarily ask senders to wait when traffic is busy. LeadPure retries automatically, and if the server still refuses to give a clear answer, it marks the contact Unknown so you never lose a real lead or send blindly.',
  },
  {
    q: 'What makes LeadPure simpler than ZeroBounce, Emailable, Hunter, or Reacher?',
    a: 'You avoid recurring credit invoices from SaaS platforms and avoid renting a specialized mail server like Reacher self-hosting requires. Upload your spreadsheet, see honest verdicts with clear explanations, and export immediately.',
  },
  {
    q: 'Is my spreadsheet data kept private?',
    a: 'Yes. Extra spreadsheet columns such as names, notes, and phone numbers stay inside your browser while formatting. Only email addresses are checked, and finished scan records automatically delete after 7 days.',
  },
];

const MICRO_VERDICTS = ['SAFE', 'RISKY', 'INVALID', 'UNKNOWN'] as const;

/** Self-contained cycling verdict badge strip so parent LandingPage never re-renders. */
function VerdictMicroInstrument() {
  const shouldReduceMotion = useReducedMotion();
  const [verdictTick, setVerdictTick] = useState(0);

  React.useEffect(() => {
    if (shouldReduceMotion) return;
    const id = setInterval(() => setVerdictTick((v) => (v + 1) % MICRO_VERDICTS.length), 1900);
    return () => clearInterval(id);
  }, [shouldReduceMotion]);

  return (
    <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.025] border border-app-border space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Activity className="w-4 h-4 text-brand-blue shrink-0" />
        <span>Verdict Output</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {MICRO_VERDICTS.map((v, i) => (
          <span
            key={v}
            className={cn(
              'px-2 py-0.5 rounded-md text-[10px] font-bold transition-all duration-300',
              i === verdictTick
                ? v === 'SAFE'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                  : v === 'RISKY'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    : v === 'INVALID'
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                      : 'bg-slate-500/20 text-slate-700 dark:text-slate-200'
                : 'text-slate-400 dark:text-slate-500 opacity-50'
            )}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Baseline-masked word reveal matching editorial architectural typography. */
function KineticHeadlineLine({ words, delayBase = 0, gradient = false }: { words: string[]; delayBase?: number; gradient?: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <span className="inline-flex flex-wrap justify-center gap-x-[0.26em]">
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden py-[0.04em]">
          <motion.span
            className={cn('inline-block', gradient && 'gradient-text')}
            initial={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.55,
              delay: delayBase + idx * 0.045,
              ease: EDITORIAL_EASE,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function LandingPage({ onOpenDashboard, theme, onToggleTheme }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-[100dvh] bg-app-bg text-app-text font-sans relative selection:bg-brand-blue/30 selection:text-white overflow-x-clip">
      {/* Futuristic Spatial Background Motion */}
      <BackgroundMotion variant="hero" />

      {/* Detached Floating Glass Capsule Header */}
      <div className="sticky top-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none">
        <header className="pointer-events-auto max-w-5xl mx-auto px-3 sm:px-5 h-15 sm:h-16 rounded-full border border-app-border bg-app-bg/75 backdrop-blur-2xl shadow-[0_14px_40px_-14px_rgba(0,0,0,0.38)] flex items-center justify-between gap-2 sm:gap-4">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 sm:gap-2.5 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-full pl-1"
          >
            <div className="w-8 h-8 rounded-full gradient-cta flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(90,92,255,0.5),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-base sm:text-lg font-display font-bold text-app-text tracking-tight">
              Lead<span className="gradient-text">Pure</span><span className="text-slate-600 dark:text-slate-300 font-semibold ml-1">AI</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600 dark:text-slate-300" aria-label="Primary navigation">
            <a href="#preview" className="hover:text-app-text transition-colors">How it works</a>
            <a href="#compare" className="hover:text-app-text transition-colors">Compare</a>
            <a href="#faq" className="hover:text-app-text transition-colors">Questions</a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => onToggleTheme(e)}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 rounded-full bg-slate-100/80 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.12] text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-white/10 active:scale-95 flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className="relative w-4 h-4">
                <Sun className={cn(
                  'w-4 h-4 absolute inset-0 transition-transform duration-300',
                  theme === 'dark' ? 'translate-y-7 opacity-0' : 'translate-y-0 opacity-100'
                )} />
                <Moon className={cn(
                  'w-4 h-4 absolute inset-0 transition-transform duration-300',
                  theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-7 opacity-0'
                )} />
              </div>
            </button>

            <MagneticButton onClick={onOpenDashboard} variant="primary" size="sm" className="rounded-full px-3.5 sm:px-5 min-h-[36px]">
              <span className="hidden sm:inline">Open Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 space-y-28 sm:space-y-40 relative z-10">
        {/* 1. ARCHITECTURAL MINIMALIST HERO + SPATIAL HARDWARE STAGE */}
        <section className="space-y-14 sm:space-y-18">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-7">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.04] border border-app-border text-xs font-medium text-slate-700 dark:text-slate-300 backdrop-blur-md"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LeadPure V14 &middot; Zero credit charges</span>
            </motion.div>

            <h1 className="text-4xl sm:text-6xl lg:text-[4.5rem] font-display font-bold tracking-[-0.04em] leading-[1.03] text-app-text">
              <KineticHeadlineLine words={['Know', 'every', 'email', 'is', 'real']} delayBase={0.04} />{' '}
              <KineticHeadlineLine words={['before', 'you', 'hit', 'send.']} delayBase={0.22} gradient />
            </h1>

            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.34, ease: EDITORIAL_EASE }}
              className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal"
            >
              Verify individual contacts in seconds or clean spreadsheets up to 5,000 rows so campaigns reach real inboxes instead of bouncing.
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.42, ease: EDITORIAL_EASE }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
            >
              <MagneticButton onClick={onOpenDashboard} variant="primary" size="lg" className="group/hero px-8 w-full sm:w-auto rounded-full">
                <span>Try It Now in Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover/hero:translate-x-0.5" />
              </MagneticButton>
              <a
                href="#compare"
                className="min-h-[54px] sm:min-h-[58px] px-7 py-3.5 rounded-full border border-slate-300 dark:border-white/15 bg-white/95 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-brand-blue/50 shadow-sm text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2 w-full sm:w-auto transition-all"
              >
                <span>Compare Verifiers</span>
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.48, ease: EDITORIAL_EASE }}
          >
            <LiveHandshakeVisualizer />
          </motion.div>
        </section>

        {/* 2. MICRO-INSTRUMENT ARCHITECTURAL BENTO PILLARS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 01: Shielded Check Micro-Instrument */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
            className="rounded-3xl border border-app-border bg-app-card/85 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-sm"
          >
            <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.025] border border-app-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs font-medium text-app-text">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Invisible Check</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                0 Emails Sent
              </span>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500">01</span>
              <h2 className="text-xl font-display font-bold text-app-text tracking-tight">No messages ever delivered</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                LeadPure confirms mailbox availability quietly with the receiving mail host and disconnects before any email is sent.
              </p>
            </div>
          </motion.div>

          {/* Card 02: Animated Honest Verdict Cycler */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.08, ease: EDITORIAL_EASE }}
            className="rounded-3xl border border-app-border bg-app-card/85 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-sm"
          >
            <VerdictMicroInstrument />
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500">02</span>
              <h2 className="text-xl font-display font-bold text-app-text tracking-tight">Honest labels, zero guesswork</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Catch-all domains stay marked Risky, dead boxes are blocked, and busy mail servers read Unknown instead of fake certainty.
              </p>
            </div>
          </motion.div>

          {/* Card 03: Scale Capacity Micro-Instrument */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.16, ease: EDITORIAL_EASE }}
            className="rounded-3xl border border-app-border bg-app-card/85 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-sm"
          >
            <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.025] border border-app-border space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-app-text">
                  <FileSpreadsheet className="w-4 h-4 text-brand-blue" />
                  Batch Capacity
                </span>
                <span className="font-mono font-bold text-app-text tabular-nums">5,000 Rows</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full w-full gradient-bg origin-left rounded-full"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 0.88 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, ease: EDITORIAL_EASE }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500">03</span>
              <h2 className="text-xl font-display font-bold text-app-text tracking-tight">Built for full spreadsheets</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload CSV or Excel sheets right in your browser, monitor live progress, resume any interrupted scan, and export cleanly.
              </p>
            </div>
          </motion.div>
        </section>

        {/* 3. INTERACTIVE LIST CLEANING MOTION DEMO */}
        <section id="preview" className="scroll-mt-24">
          <ArchitecturePipeline />
        </section>

        {/* 4. MINIMALIST TICK / CROSS COMPARISON MATRIX */}
        <section id="compare" className="space-y-10 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Side-By-Side</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
                How LeadPure compares to popular email verifiers
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Quick comparison alongside{' '}
                <a href="https://www.zerobounce.net/" target="_blank" rel="noreferrer" className="text-app-text underline decoration-slate-400/50 hover:text-brand-blue">ZeroBounce</a>,{' '}
                <a href="https://emailable.com/" target="_blank" rel="noreferrer" className="text-app-text underline decoration-slate-400/50 hover:text-brand-blue">Emailable</a>,{' '}
                <a href="https://hunter.io/email-verifier" target="_blank" rel="noreferrer" className="text-app-text underline decoration-slate-400/50 hover:text-brand-blue">Hunter</a>, and Reacher.
              </p>
            </div>
            <MagneticButton onClick={onOpenDashboard} variant="primary" size="md" className="shrink-0 rounded-full">
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </div>

          <div className="rounded-3xl border border-app-border bg-app-card/90 backdrop-blur-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-app-border bg-slate-50/80 dark:bg-white/[0.025] text-xs font-display font-bold text-app-text">
                    <th className="py-5 px-6 w-[28%] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Capability</th>
                    <th className="py-5 px-4 w-[16%] text-center bg-slate-900/[0.03] dark:bg-white/[0.04] border-x border-app-border">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold text-app-text">LeadPure</span>
                      </div>
                    </th>
                    <th className="py-5 px-4 w-[14%] text-center">
                      <a href="https://www.zerobounce.net/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 hover:text-brand-blue">
                        ZeroBounce <ExternalLink className="w-3 h-3 opacity-45" />
                      </a>
                    </th>
                    <th className="py-5 px-4 w-[14%] text-center">
                      <a href="https://emailable.com/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 hover:text-brand-blue">
                        Emailable <ExternalLink className="w-3 h-3 opacity-45" />
                      </a>
                    </th>
                    <th className="py-5 px-4 w-[14%] text-center">
                      <a href="https://hunter.io/email-verifier" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 hover:text-brand-blue">
                        Hunter <ExternalLink className="w-3 h-3 opacity-45" />
                      </a>
                    </th>
                    <th className="py-5 px-4 w-[14%] text-center">Reacher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border text-xs">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                      <td className="py-4 px-6 font-medium text-app-text align-middle">{row.feature}</td>
                      <td className="py-4 px-4 bg-slate-900/[0.03] dark:bg-white/[0.04] border-x border-app-border align-middle">
                        <ComparisonCell cell={row.leadpure} primary />
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <ComparisonCell cell={row.zerobounce} />
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <ComparisonCell cell={row.emailable} />
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <ComparisonCell cell={row.hunter} />
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <ComparisonCell cell={row.reacher} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. MINIMALIST EDITORIAL FAQ */}
        <section id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-10 scroll-mt-24">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Common Questions</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
              Everything clearly explained.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              No hidden tricks or confusing scorecards. Here is exactly what happens when you clean a list on LeadPure.
            </p>
          </div>

          <div className="lg:col-span-7 divide-y divide-app-border border-y border-app-border">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg"
                  >
                    <span className="text-sm sm:text-base font-display font-bold text-app-text">{item.q}</span>
                    <span className="w-7 h-7 rounded-full border border-app-border flex items-center justify-center text-slate-500 shrink-0">
                      {isOpen ? <Minus className="w-3.5 h-3.5 text-brand-blue" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="faq-answer"
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                      >
                        <p className="pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. CALM MINIMALIST HORIZON CTA */}
        <section className="py-12 sm:py-20 text-center space-y-6 relative rounded-3xl sm:rounded-[36px] border border-app-border bg-app-card/75 backdrop-blur-xl px-6 overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-app-text max-w-2xl mx-auto leading-[1.08] relative z-10">
            Clean your list. <span className="gradient-text">Protect your inbox.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed relative z-10">
            Open the dashboard to verify an email right now or upload your next campaign spreadsheet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 relative z-10">
            <MagneticButton onClick={onOpenDashboard} variant="primary" size="lg" className="px-9 w-full sm:w-auto rounded-full">
              <span>Open /dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <a
              href="https://github.com/ossamamehmood/LeadPure-AI"
              target="_blank"
              rel="noreferrer"
              className="min-h-[54px] sm:min-h-[58px] px-7 py-3 rounded-full border border-slate-300 dark:border-white/15 bg-white/95 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-brand-blue/50 shadow-sm text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2 w-full sm:w-auto transition-all"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
