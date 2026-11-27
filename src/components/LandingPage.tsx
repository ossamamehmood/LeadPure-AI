import React, { useState } from 'react';
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
  SlidersHorizontal,
  Layers,
  MailCheck,
  Users,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MagneticButton } from './ui/MagneticButton';
import { EDITORIAL_EASE } from './ui/MotionPrimitives';
import { KineticText } from './ui/KineticText';
import { CounterMetric } from './ui/CounterMetric';
import { LiquidSpotlightCard } from './ui/LiquidSpotlightCard';
import { SparkBurstButton } from './ui/SparkBurstButton';
import { LiveHandshakeVisualizer } from './landing/LiveHandshakeVisualizer';
import { ArchitecturePipeline } from './landing/ArchitecturePipeline';
import { AppRoutePath } from './Footer';
import { GlassOrb } from './ui/GlassOrb';

interface LandingPageProps {
  onOpenDashboard: (email?: string) => void;
  onNavigate: (path: AppRoutePath) => void;
  theme: 'dark' | 'light';
}

interface MatrixCell {
  ok: boolean;
  note?: string;
}

/**
 * Technical maintenance reference (non-public):
 * Matrix reflects engine verification checks including dual sender-identity retry,
 * forwarding-domain safeguards, 30s greylist wait handling, catch-all detection,
 * and local Web Worker spreadsheet parsing & normalization.
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
    leadpure: { ok: true },
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
              : 'bg-white/40 dark:bg-white/[0.05] border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200'
          )}
          aria-label="Yes"
        >
          <Check className="w-3.5 h-3.5" />
        </span>
      ) : (
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-200/45 dark:bg-white/[0.03] border border-slate-300/50 dark:border-white/[0.08] text-slate-400 dark:text-slate-500"
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

export function LandingPage({ onOpenDashboard, onNavigate, theme }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroEmail, setHeroEmail] = useState('');
  const [passStep, setPassStep] = useState<'first' | 'confirmed'>('confirmed');
  const shouldReduceMotion = useReducedMotion();

  const handleQuickLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenDashboard(heroEmail.trim() || undefined);
  };

  return (
    <div className="space-y-24 sm:space-y-28">
      {/* 1. MONUMENTAL HERO -- Glass Orb + Large Type + Proof Strip */}
      <section className="relative pt-6 sm:pt-10 pb-4 overflow-hidden">
        {/* Full-width centered content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-8">

          {/* Category pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: EDITORIAL_EASE }}
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full liquid-glass border border-white/50 dark:border-white/[0.12]"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              Real-Time Email Verification
            </p>
          </motion.div>

          {/* Giant 2-line headline */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.65, ease: EDITORIAL_EASE }}
            className="text-[2.4rem] sm:text-6xl lg:text-7xl xl:text-[5.2rem] font-display font-bold tracking-[-0.04em] leading-[1.04] text-app-text max-w-5xl"
          >
            <span className="block whitespace-nowrap">
              <KineticText text="Know every email is real" className="text-app-text" />
            </span>
            <span className="block gradient-text whitespace-nowrap mt-1">
              before you hit send.
            </span>
          </motion.h1>

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.55, ease: EDITORIAL_EASE }}
            className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-[52ch]"
          >
            Verify single leads instantly or clean spreadsheets of up to 5,000 contacts
            inside your browser. Zero subscriptions. Zero uploads.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.5, ease: EDITORIAL_EASE }}
            className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg"
          >
            <form onSubmit={handleQuickLaunch} className="flex-1 w-full">
              <div className="liquid-glass rounded-2xl p-1.5 flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <MailCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={heroEmail}
                    onChange={(e) => setHeroEmail(e.target.value)}
                    placeholder="alex@company.example"
                    aria-label="Enter an email address to verify"
                    className="w-full h-12 pl-10 pr-3 rounded-xl bg-white/55 dark:bg-white/[0.04] border border-white/70 dark:border-white/10 text-sm font-medium text-app-text placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/15 transition-all"
                  />
                </div>
                <SparkBurstButton className="shrink-0">
                  <MagneticButton type="submit" variant="primary" size="lg" className="px-5 !min-h-[44px] rounded-xl text-sm">
                    <span>Verify</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </MagneticButton>
                </SparkBurstButton>
              </div>
            </form>
            <SparkBurstButton>
              <MagneticButton
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => onOpenDashboard()}
                className="shrink-0 px-5 !min-h-[52px] rounded-2xl text-sm font-semibold liquid-glass border border-white/50 dark:border-white/[0.12]"
              >
                Open Bulk Cleaner
                <ArrowUpRight className="w-3.5 h-3.5" />
              </MagneticButton>
            </SparkBurstButton>
          </motion.div>

          {/* Try presets */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 -mt-4">
            <span>Try:</span>
            {['sales@company.example', 'partners@agency.example'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setHeroEmail(preset)}
                className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-white/45 dark:bg-white/[0.06] border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-brand-blue transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* 3D Glass Orb -- centrepiece hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.42, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center select-none"
            style={{ willChange: 'transform' }}
          >
            {/* Coloured bleed light behind the orb */}
            <div
              className="absolute inset-0 rounded-full blur-[80px] opacity-50 dark:opacity-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(90,92,255,0.55) 0%, rgba(2,254,220,0.28) 45%, rgba(245,2,253,0.18) 70%, transparent 100%)',
              }}
            />
            <GlassOrb size={360} className="relative z-10 drop-shadow-[0_40px_80px_rgba(90,92,255,0.45)]" />

            {/* Floating proof badge -- top-right */}
            <motion.div
              initial={{ opacity: 0, x: 16, y: -16 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.72, duration: 0.5, ease: EDITORIAL_EASE }}
              className="absolute top-8 -right-4 sm:-right-10 liquid-glass rounded-2xl px-4 py-3 flex flex-col gap-0.5 shadow-xl"
            >
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Bounce rate</span>
              <span className="text-2xl font-display font-bold text-app-text tabular-nums">
                &lt;<CounterMetric to={1} duration={0.9} />%
              </span>
            </motion.div>

            {/* Floating proof badge -- bottom-left */}
            <motion.div
              initial={{ opacity: 0, x: -16, y: 16 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5, ease: EDITORIAL_EASE }}
              className="absolute bottom-8 -left-4 sm:-left-10 liquid-glass rounded-2xl px-4 py-3 flex flex-col gap-0.5 shadow-xl"
            >
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Contacts / sheet</span>
              <span className="text-2xl font-display font-bold text-app-text tabular-nums">
                <CounterMetric to={5000} separator="," duration={1.1} />
              </span>
            </motion.div>

            {/* Floating badge -- bottom-right */}
            <motion.div
              initial={{ opacity: 0, x: 12, y: 16 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.88, duration: 0.5, ease: EDITORIAL_EASE }}
              className="absolute bottom-4 -right-2 sm:-right-8 liquid-glass rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-xl"
            >
              <span className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Double-checked</span>
                <span className="text-sm font-bold text-app-text"><CounterMetric to={2} duration={0.7} />x retry</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Proof strip -- 3 large stats across full width */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: EDITORIAL_EASE }}
            className="w-full max-w-3xl grid grid-cols-3 gap-6 pt-8 border-t border-app-border"
          >
            {[
              { icon: TrendingDown, label: 'Bounce rate target', value: '<1%', color: 'text-emerald-500' },
              { icon: Users, label: 'Contacts per upload', value: '5,000', color: 'text-brand-blue' },
              { icon: RefreshCw, label: 'Rejection recheck', value: '2x', color: 'gradient-text' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                <Icon className={cn('w-5 h-5 mb-1 opacity-70', color !== 'gradient-text' ? color : 'text-brand-blue')} />
                <p className={cn('text-3xl sm:text-4xl font-display font-bold tabular-nums', color === 'gradient-text' ? 'gradient-text' : color)}>
                  {value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 1b. LIVE VERIFICATION INSPECTOR (below hero) */}
      <section id="live-demo" className="scroll-mt-24">
        <div className="text-center mb-8 space-y-2">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Live Demo
          </p>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
            Watch it verify in real time.
          </h2>
        </div>
        <div className="max-w-2xl mx-auto">
          <LiveHandshakeVisualizer onNavigate={onNavigate} theme={theme} />
        </div>
      </section>

      {/* 2. ASYMMETRIC FEATURE BENTO (UNIFIED LIQUID GLASS) */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Built Better
            </p>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
              Fewer false drops. Cleaner spreadsheets.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/deliverability')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-text hover:text-brand-blue transition-colors cursor-pointer self-start sm:self-end"
          >
            <span>See how bounce protection works</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* Featured Interactive 2-Pass Confirmation Card (7 cols) */}
          <div className="lg:col-span-7">
            <LiquidSpotlightCard
              spotlightColor={theme === 'dark' ? 'rgba(90, 92, 255, 0.16)' : 'rgba(90, 92, 255, 0.09)'}
              className="p-6 sm:p-8 rounded-3xl h-full flex flex-col justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-app-text">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Backup Confirmation
                  </span>
                  <div className="inline-flex p-1 rounded-full bg-white/40 dark:bg-white/[0.05] border border-white/60 dark:border-white/10 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setPassStep('first')}
                      className={cn(
                        'px-2.5 py-1 rounded-full transition-colors cursor-pointer',
                        passStep === 'first'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-600 dark:text-slate-300'
                      )}
                    >
                      Pass 1 Block
                    </button>
                    <button
                      type="button"
                      onClick={() => setPassStep('confirmed')}
                      className={cn(
                        'px-2.5 py-1 rounded-full transition-colors cursor-pointer',
                        passStep === 'confirmed'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-600 dark:text-slate-300'
                      )}
                    >
                      Pass 2 Recheck
                    </button>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-bold text-app-text tracking-tight">
                  Double-checks every rejection before dropping a lead
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-[58ch]">
                  Strict corporate firewalls sometimes turn away an initial check. Before removing an address, LeadPure verifies again from a secondary route so real buyers stay in your list.
                </p>
              </div>

              {/* Translucent Interactive Pass Readout */}
              <div className="rounded-2xl border border-white/55 dark:border-white/[0.08] bg-white/30 dark:bg-white/[0.025] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono font-semibold text-app-text truncate">
                    alex.desk@enterprise.example
                  </span>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0',
                      passStep === 'first'
                        ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    )}
                  >
                    {passStep === 'first' ? 'Blocked by Filter' : 'Recovered: Safe'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {passStep === 'first'
                    ? 'Single-pass tools stop at the first strict reply and throw away valid buyers.'
                    : 'LeadPure automatically confirms on a clean second check, saving active pipeline leads.'}
                </p>
              </div>
            </LiquidSpotlightCard>
          </div>

          {/* Right Stacked Panels (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
            <LiquidSpotlightCard
              spotlightColor={theme === 'dark' ? 'rgba(2, 254, 220, 0.14)' : 'rgba(90, 92, 255, 0.08)'}
              className="p-6 rounded-3xl space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-app-text">
                  <SlidersHorizontal className="w-4 h-4 text-brand-blue" />
                  Sheet Auto-Formatter
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Names &amp; Phones
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-display font-bold text-app-text tracking-tight">
                  Cleans messy contact columns automatically
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fixes name capitalization, cities, and international phone formatting right in your browser before exporting.
                </p>
              </div>
              <div className="rounded-xl border border-white/55 dark:border-white/[0.08] bg-white/30 dark:bg-white/[0.025] px-3.5 py-2.5 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between gap-2 text-slate-400">
                  <span className="text-[10px] uppercase tracking-wider">Raw</span>
                  <span className="line-through truncate">tariq hussain &middot; 3128471928</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Clean</span>
                  <span className="truncate">Tariq Hussain &middot; +1 (312) 847-1928</span>
                </div>
              </div>
            </LiquidSpotlightCard>

            <LiquidSpotlightCard
              spotlightColor={theme === 'dark' ? 'rgba(245, 2, 253, 0.14)' : 'rgba(90, 92, 255, 0.08)'}
              className="p-6 rounded-3xl space-y-4 flex-1 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-app-text">
                  <Layers className="w-4 h-4 text-brand-pink" />
                  Honest Risk Buckets
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Never Guesses
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-display font-bold text-app-text tracking-tight">
                  Separates Safe, Risky &amp; Busy domains clearly
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Accept-all and busy domains stay isolated for review instead of sneaking into Safe exports.
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-200/70 dark:bg-white/10">
                  <div className="h-full bg-emerald-500" style={{ width: '64.2%' }} />
                  <div className="h-full bg-amber-400" style={{ width: '21.4%' }} />
                  <div className="h-full bg-rose-500" style={{ width: '14.4%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>64.2% Safe</span>
                  <span>21.4% Risky</span>
                  <span>14.4% Removed</span>
                </div>
              </div>
            </LiquidSpotlightCard>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE LIST CLEANING MOTION DEMO */}
      <section id="preview" className="scroll-mt-24">
        <ArchitecturePipeline theme={theme} />
      </section>

      {/* 4. MINIMALIST TICK / CROSS COMPARISON MATRIX */}
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
          <SparkBurstButton className="shrink-0">
            <MagneticButton onClick={() => onOpenDashboard()} variant="primary" size="md" className="shrink-0 rounded-full">
              <span>Start Verifying</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </SparkBurstButton>
        </div>

        <LiquidSpotlightCard
          spotlightColor={theme === 'dark' ? 'rgba(90, 92, 255, 0.14)' : 'rgba(90, 92, 255, 0.08)'}
          className="rounded-3xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.07] dark:border-white/[0.08] bg-white/30 dark:bg-white/[0.025] text-xs font-display font-bold text-app-text">
                  <th className="py-5 px-6 w-[28%] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    Capability
                  </th>
                  <th className="py-5 px-4 w-[16%] text-center bg-white/25 dark:bg-white/[0.03] border-x border-black/[0.06] dark:border-white/[0.07]">
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
              <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.07] text-xs">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-white/20 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-medium text-app-text align-middle">{row.feature}</td>
                    <td className="py-4 px-4 bg-white/20 dark:bg-white/[0.025] border-x border-black/[0.06] dark:border-white/[0.07] align-middle">
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
        </LiquidSpotlightCard>
      </section>

      {/* 5. MINIMALIST LIQUID-GLASS FAQ */}
      <section id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-10 scroll-mt-24">
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-28 lg:self-start">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Common Questions
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
            Everything clearly explained.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-[46ch]">
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

      {/* 6. UNIFIED LIQUID-GLASS HORIZON CTA */}
      <section className="liquid-glass py-12 sm:py-20 text-center space-y-6 relative rounded-3xl sm:rounded-[36px] px-6 overflow-hidden">
        <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-app-text max-w-2xl mx-auto leading-[1.08] relative z-10">
          Clean your list. <span className="gradient-text">Protect your inbox.</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed relative z-10">
          Verify individual contacts right now or clean your next outreach spreadsheet with zero credit fees.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 relative z-10">
          <SparkBurstButton className="w-full sm:w-auto">
            <MagneticButton onClick={() => onOpenDashboard()} variant="primary" size="lg" className="px-9 w-full sm:w-auto rounded-full">
              <span>Start Verifying Free</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </SparkBurstButton>
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
