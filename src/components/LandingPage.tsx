import React, { Suspense, lazy, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  X,
  Plus,
  Minus,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MagneticButton } from './ui/MagneticButton';
import { SpatialTiltCard } from './ui/SpatialTiltCard';
import { EDITORIAL_EASE } from './ui/MotionPrimitives';
import { LiveHandshakeVisualizer } from './landing/LiveHandshakeVisualizer';
import { ArchitecturePipeline } from './landing/ArchitecturePipeline';
import { AppRoutePath } from './Footer';

const HeroSpatial3D = lazy(() => import('./landing/HeroSpatial3D'));

interface LandingPageProps {
  onOpenDashboard: () => void;
  onNavigate: (path: AppRoutePath) => void;
  theme: 'dark' | 'light';
}

interface MatrixCell {
  ok: boolean;
  note?: string;
}

/**
 * Technical note for future pricing & enterprise comparison updates:
 * LeadPure advantages are backed directly by engine/probe.mjs v1.3.2:
 * dual identity RCPT confirmation (IDENTITY_A -> IDENTITY_B), 5.1.x enhanced status gating,
 * forwarding-provider protection (ImprovMX / ForwardEmail / Cloudflare), 30s greylist retries,
 * random-local catch-all probing, and client-side Web Worker spreadsheet processing.
 */
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
    reacher: { ok: false, note: 'Paid / Hosted' },
  },
  {
    feature: 'Zero technical setup',
    leadpure: { ok: true },
    zerobounce: { ok: true },
    emailable: { ok: true },
    hunter: { ok: true },
    reacher: { ok: false, note: 'Needs hosting' },
  },
  {
    feature: 'Double-checks strict rejections',
    leadpure: { ok: true, note: 'Verified twice' },
    zerobounce: { ok: false },
    emailable: { ok: false },
    hunter: { ok: false },
    reacher: { ok: false },
  },
  {
    feature: 'Flags risky catch-all domains',
    leadpure: { ok: true },
    zerobounce: { ok: true },
    emailable: { ok: true },
    hunter: { ok: true },
    reacher: { ok: true },
  },
  {
    feature: 'Automatic name & phone cleanup',
    leadpure: { ok: true },
    zerobounce: { ok: false },
    emailable: { ok: false },
    hunter: { ok: false },
    reacher: { ok: false },
  },
  {
    feature: 'Names & notes stay in browser',
    leadpure: { ok: true },
    zerobounce: { ok: false, note: 'Uploaded to cloud' },
    emailable: { ok: false, note: 'Uploaded to cloud' },
    hunter: { ok: false, note: 'Uploaded to cloud' },
    reacher: { ok: false, note: 'External sync' },
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
    q: 'How much does LeadPure reduce campaign bounce rates?',
    a: 'Uncleaned contact lists routinely bounce 15% to 35% of the time. By catching dead inboxes, typos, throwaway accounts, and risky domains before sending, LeadPure helps keep your Safe list under the 1% healthy sending threshold.',
  },
  {
    q: 'Does LeadPure ever promise an unrealistic 0% bounce rate?',
    a: 'No honest tool can promise 0% forever because certain business domains accept every username or fill up later. LeadPure labels uncertain domains honestly as Risky or Unconfirmed so you never fly blind.',
  },
  {
    q: 'Does checking an address send an email to my contact?',
    a: 'Never. LeadPure quietly confirms mailbox readiness without placing any message inside your prospect inbox.',
  },
  {
    q: 'Why is LeadPure better than ZeroBounce, Emailable, Hunter, or Reacher?',
    a: 'You avoid recurring per-credit charges, get automatic cleanup for names and phone numbers in the same spreadsheet, double-checked protection against false rejections, and browser privacy for custom contact columns.',
  },
  {
    q: 'What happens to extra spreadsheet columns like names and phone numbers?',
    a: 'They remain safely inside your browser while formatting. Only email addresses are checked, and finished temporary history clears automatically after 7 days.',
  },
];

/** Baseline-masked reveal keeping gradient phrases continuous across all words. */
function KineticHeadlineLine({
  words,
  delayBase = 0,
  gradient = false,
  leftDesktop = false,
}: {
  words: string[];
  delayBase?: number;
  gradient?: boolean;
  leftDesktop?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (gradient) {
    return (
      <span className="inline-block overflow-hidden py-[0.04em] max-w-full">
        <motion.span
          className="inline-block gradient-text"
          initial={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.58, delay: delayBase, ease: EDITORIAL_EASE }}
        >
          {words.join(' ')}
        </motion.span>
      </span>
    );
  }

  return (
    <span className={cn('inline-flex flex-wrap gap-x-[0.24em]', leftDesktop ? 'justify-center lg:justify-start' : 'justify-center')}>
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden py-[0.04em]">
          <motion.span
            className="inline-block"
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

export function LandingPage({ onOpenDashboard, onNavigate, theme }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* 1. HIGH-IMPACT 3D SHOWCASE HERO + PROOF-OF-EVIDENCE BENTO STRIP */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex justify-center lg:justify-start">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
            className="liquid-glass inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-Time Email Protection &middot; Zero Emails Sent</span>
          </motion.div>
        </div>

        {/* 3-Column Monumental Centerpiece Grid inspired by top agency hero layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.22fr_1fr_0.78fr] gap-6 lg:gap-5 items-center">
          {/* Left Flank: Display Lockup + Core Action */}
          <div className="text-center lg:text-left space-y-5 z-20">
            <h1 className="text-[2.15rem] sm:text-5xl lg:text-[2.85rem] xl:text-[3.15rem] font-display font-bold tracking-[-0.04em] leading-[1.05] text-app-text">
              <KineticHeadlineLine words={['Verify', 'Every', 'Lead']} delayBase={0.04} leftDesktop />
              <br className="hidden lg:block" />{' '}
              <KineticHeadlineLine words={['before', 'you', 'hit', 'send.']} delayBase={0.2} gradient />
            </h1>

            <div className="flex items-start justify-center lg:justify-start gap-3 max-w-md mx-auto lg:mx-0">
              <div className="w-9 h-9 rounded-2xl gradient-surface border border-brand-blue/25 flex items-center justify-center shrink-0 mt-0.5 hidden sm:flex">
                <ShieldCheck className="w-4.5 h-4.5 text-brand-blue" />
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Spot dead addresses, typos, and risky domains before launching your campaign so your sender score stays spotless.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
              <MagneticButton onClick={onOpenDashboard} variant="primary" size="lg" className="group/hero px-7 w-full sm:w-auto rounded-full">
                <span>Verify Emails Free</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover/hero:translate-x-0.5" />
              </MagneticButton>
              <a
                href="#live-demo"
                className="liquid-glass min-h-[54px] sm:min-h-[58px] px-6 py-3 rounded-full text-sm font-semibold text-app-text flex items-center justify-center gap-2 w-full sm:w-auto transition-all lg:hidden"
              >
                <span>See Live Preview</span>
              </a>
            </div>
          </div>

          {/* Center Focal Point: Iridescent Chrome & Liquid-Glass Verification Shield */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.16, ease: EDITORIAL_EASE }}
            className="relative w-full h-[270px] sm:h-[330px] lg:h-[350px] flex items-center justify-center"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 rounded-full opacity-45 dark:opacity-55 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle at 46% 45%, rgba(2,254,220,0.36), rgba(90,92,255,0.30) 48%, rgba(245,2,253,0.22) 80%, transparent 100%)',
              }}
            />
            <Suspense
              fallback={
                <div className="w-40 h-44 rounded-3xl liquid-glass flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-brand-blue animate-pulse" />
                </div>
              }
            >
              <HeroSpatial3D theme={theme} className="w-full h-full z-10" />
            </Suspense>
          </motion.div>

          {/* Right Flank: Precision Benefit Note & Secondary Action */}
          <div className="hidden lg:flex flex-col items-start space-y-4 z-20 pl-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-glass text-xs font-semibold text-app-text">
              <Sparkles className="w-3.5 h-3.5 text-brand-blue dark:text-[#02FEDC]" />
              <span>Honest Protection</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Double-checks strict domains before flagging them invalid, separates risky catch-all inboxes, and formats your full spreadsheet locally.
            </p>

            <a
              href="#live-demo"
              className="liquid-glass min-h-[46px] px-5 py-2.5 rounded-full text-xs font-semibold text-app-text inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>See Live Proof</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Immediate Above-The-Fold 3-Card Proof-of-Evidence Bento Row */}
        <div className="group/bento grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 pt-2">
          {/* Card 1: Measurable Bounce Risk Reduction */}
          <SpatialTiltCard delay={0.05} className="p-5 sm:p-6 gap-4 ring-1 ring-inset ring-[#02FEDC]/25">
            <div className="depth-layer-sm flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Cleaned List Bounce Target
              </span>
              <button
                type="button"
                onClick={() => onNavigate('/deliverability')}
                className="text-[11px] font-semibold text-brand-blue hover:opacity-80 inline-flex items-center gap-1 cursor-pointer"
              >
                Benchmarks <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="depth-layer-md flex items-baseline justify-between gap-4">
              <div>
                <p className="text-4xl sm:text-[2.6rem] font-display font-bold tracking-tight gradient-text leading-none">
                  &lt; 1%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Up to 90%+ fewer hard bounces vs uncleaned lists
                </p>
              </div>
              <CheckCircle2 className="w-7 h-7 text-emerald-500/80 shrink-0" />
            </div>
          </SpatialTiltCard>

          {/* Card 2: Double-Checked Confidence */}
          <SpatialTiltCard delay={0.12} className="p-5 sm:p-6 gap-4">
            <div className="depth-layer-sm flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Double-Checked Verdicts
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-blue/12 text-brand-blue border border-brand-blue/25">
                Verified Twice
              </span>
            </div>
            <div className="depth-layer-md space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Safe', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
                  { label: 'Risky', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
                  { label: 'Remove', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
                  { label: 'Review', cls: 'bg-slate-500/15 text-slate-700 dark:text-slate-200 border-slate-400/30' },
                ].map((tag) => (
                  <span
                    key={tag.label}
                    className={cn('px-2.5 py-0.5 rounded-full border text-[11px] font-semibold', tag.cls)}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Confirms rejections twice so real contacts never get deleted by mistake.
              </p>
            </div>
          </SpatialTiltCard>

          {/* Card 3: Built For Spreadsheets & Zero Cost */}
          <SpatialTiltCard delay={0.18} className="p-5 sm:p-6 gap-4 ring-1 ring-inset ring-emerald-500/20">
            <div className="depth-layer-sm flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Full List Capacity
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                Zero Monthly Credits
              </span>
            </div>
            <div className="depth-layer-md flex items-baseline justify-between gap-4">
              <div>
                <p className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-app-text leading-none">
                  5,000 Leads
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Clean CSV or Excel files locally in minutes and export ready lists.
                </p>
              </div>
              <Layers className="w-7 h-7 text-brand-blue/75 shrink-0" />
            </div>
          </SpatialTiltCard>
        </div>
      </section>

      {/* 2. INTERACTIVE FROSTED LIQUID-GLASS VERIFICATION PREVIEW */}
      <section id="live-demo" className="scroll-mt-24 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Interactive Check
          </p>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
            See every answer clearly explained
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Click any scenario below to preview how LeadPure checks an inbox quietly without sending mail.
          </p>
        </div>
        <LiveHandshakeVisualizer />
      </section>

      {/* 3. CORE SYSTEM ADVANTAGES (WHY IT BEATS LEGACY CHECKERS) */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Built Better
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
              Smarter checks that protect good leads
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/deliverability')}
            className="liquid-glass px-5 py-2.5 rounded-full text-xs font-semibold text-app-text inline-flex items-center gap-1.5 shrink-0 cursor-pointer self-start md:self-auto"
          >
            <span>Read Full Deliverability Guide</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="group/bento grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <SpatialTiltCard delay={0}>
            <div className="depth-layer-sm p-4 rounded-2xl bg-white/55 dark:bg-white/[0.03] border border-white/75 dark:border-app-border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-app-text">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Backup Confirmation</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                Zero False Drops
              </span>
            </div>
            <div className="depth-layer-md space-y-2">
              <h3 className="text-xl font-display font-bold text-app-text tracking-tight">
                Double-checks every rejection
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Strict company filters sometimes block normal checks. LeadPure runs a second verification pass before marking any email inactive so genuine prospects stay in your list.
              </p>
            </div>
          </SpatialTiltCard>

          <SpatialTiltCard delay={0.08}>
            <div className="depth-layer-sm p-4 rounded-2xl bg-white/55 dark:bg-white/[0.03] border border-white/75 dark:border-app-border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-app-text">
                <SlidersHorizontal className="w-4 h-4 text-brand-blue" />
                <span>Sheet Auto-Formatter</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-blue/12 text-brand-blue border border-brand-blue/25">
                Names &amp; Phones
              </span>
            </div>
            <div className="depth-layer-md space-y-2">
              <h3 className="text-xl font-display font-bold text-app-text tracking-tight">
                Cleans contact details too
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Alongside inbox verification, LeadPure fixes name capitalization, standardizes city names, and formats international phone columns automatically before export.
              </p>
            </div>
          </SpatialTiltCard>

          <SpatialTiltCard delay={0.16}>
            <div className="depth-layer-sm p-4 rounded-2xl bg-white/55 dark:bg-white/[0.03] border border-white/75 dark:border-app-border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-app-text">
                <Sparkles className="w-4 h-4 text-brand-pink" />
                <span>Honest Risk Labels</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                Never Guesses
              </span>
            </div>
            <div className="depth-layer-md space-y-2">
              <h3 className="text-xl font-display font-bold text-app-text tracking-tight">
                Honest Risky &amp; Busy isolation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Domains that accept every username or pause busy connections are separated cleanly for review instead of being labeled Safe blindly.
              </p>
            </div>
          </SpatialTiltCard>
        </div>
      </section>

      {/* 4. INTERACTIVE LIST CLEANING MOTION DEMO */}
      <section id="preview" className="scroll-mt-24">
        <ArchitecturePipeline />
      </section>

      {/* 5. MINIMALIST TICK / CROSS COMPARISON MATRIX */}
      <section id="compare" className="space-y-10 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Side-By-Side
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
              How LeadPure compares to popular email verifiers
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Honest feature comparison alongside{' '}
              <a href="https://www.zerobounce.net/" target="_blank" rel="noreferrer" className="text-app-text underline decoration-slate-400/50 hover:text-brand-blue">
                ZeroBounce
              </a>
              ,{' '}
              <a href="https://emailable.com/" target="_blank" rel="noreferrer" className="text-app-text underline decoration-slate-400/50 hover:text-brand-blue">
                Emailable
              </a>
              ,{' '}
              <a href="https://hunter.io/email-verifier" target="_blank" rel="noreferrer" className="text-app-text underline decoration-slate-400/50 hover:text-brand-blue">
                Hunter
              </a>
              , and Reacher.
            </p>
          </div>
          <MagneticButton onClick={onOpenDashboard} variant="primary" size="md" className="shrink-0 rounded-full">
            <span>Start Verifying</span>
            <ArrowRight className="w-4 h-4" />
          </MagneticButton>
        </div>

        <div className="liquid-glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-left border-collapse">
              <thead>
                <tr className="border-b border-app-border bg-white/45 dark:bg-white/[0.025] text-xs font-display font-bold text-app-text">
                  <th className="py-5 px-6 w-[28%] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    Capability
                  </th>
                  <th className="py-5 px-4 w-[16%] text-center bg-white/40 dark:bg-white/[0.04] border-x border-app-border">
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
                    <td className="py-4 px-4 bg-white/30 dark:bg-white/[0.04] border-x border-app-border align-middle">
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

      {/* 6. MINIMALIST LIQUID-GLASS FAQ */}
      <section id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-10 scroll-mt-24">
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-28 lg:self-start">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Common Questions
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
            Everything clearly explained.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Honest answers on bounce reduction, privacy, and how LeadPure keeps your outreach domain safe.
          </p>
        </div>

        <div className="lg:col-span-7 space-y-3.5">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q} className="liquid-glass rounded-2xl sm:rounded-3xl px-5 sm:px-6 overflow-hidden">
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
                      <p className="pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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

      {/* 7. CALM MINIMALIST LIQUID-GLASS HORIZON CTA */}
      <section className="liquid-glass py-12 sm:py-20 text-center space-y-6 relative rounded-3xl sm:rounded-[36px] px-6 overflow-hidden">
        <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-app-text max-w-2xl mx-auto leading-[1.08] relative z-10">
          Clean your list. <span className="gradient-text">Protect your inbox.</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed relative z-10">
          Start verifying individual leads right now or clean your next outreach spreadsheet with zero credit charges.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 relative z-10">
          <MagneticButton onClick={onOpenDashboard} variant="primary" size="lg" className="px-9 w-full sm:w-auto rounded-full">
            <span>Start Verifying Free</span>
            <ArrowRight className="w-4 h-4" />
          </MagneticButton>
          <button
            type="button"
            onClick={() => onNavigate('/pricing')}
            className="liquid-glass min-h-[54px] sm:min-h-[58px] px-7 py-3 rounded-full text-sm font-semibold text-app-text flex items-center justify-center gap-2 w-full sm:w-auto transition-all cursor-pointer"
          >
            <span>Explore Plans &amp; Roadmap</span>
          </button>
        </div>
      </section>
    </div>
  );
}
