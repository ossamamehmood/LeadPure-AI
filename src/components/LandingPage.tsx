import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Zap, ArrowRight, Check, Sun, Moon, Plus, Minus, ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MagneticButton } from './ui/MagneticButton';
import { EDITORIAL_EASE } from './ui/MotionPrimitives';
import { LiveHandshakeVisualizer } from './landing/LiveHandshakeVisualizer';
import { ArchitecturePipeline } from './landing/ArchitecturePipeline';
import { Footer } from './Footer';

interface LandingPageProps {
  onOpenDashboard: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (e: React.MouseEvent) => void;
}

const PILLARS = [
  {
    index: '01',
    title: 'Zero emails sent to your leads',
    description:
      'LeadPure quietly asks the receiving mail server whether an inbox is active and disconnects immediately. Nobody on your list receives a message.',
  },
  {
    index: '02',
    title: 'Honest labels, zero guessing',
    description:
      'Safe contacts get green-lit, catch-all domains are marked Risky, dead addresses are blocked, and busy mail servers stay Unknown instead of faking certainty.',
  },
  {
    index: '03',
    title: 'Built for full spreadsheets',
    description:
      'Drop CSV or Excel sheets up to 5,000 rows right from your browser, track progress live, resume interrupted scans, and export a clean workbook.',
  },
];

const COMPARISON_ROWS = [
  {
    feature: 'How you pay',
    leadpure: 'No credit packages or monthly seat fees',
    zerobounce: '100 free monthly, then paid credits or $99/mo plans',
    emailable: '250 starter credits, then paid packs ($38 per 5,000)',
    hunter: '50 credits/mo free, paid tiers $49 to $299/mo',
    reacher: 'Free self-hosted code (needs VPS) or paid hosted plan',
  },
  {
    feature: 'Setup required',
    leadpure: 'Ready in browser dashboard, zero server upkeep',
    zerobounce: 'Account signup + credit wallet',
    emailable: 'Account signup + credit wallet',
    hunter: 'Account signup + monthly quota',
    reacher: 'Needs your own mail-sending server or a paid subscription',
  },
  {
    feature: 'Accept-All (Catch-All) Domains',
    leadpure: 'Tested and cleanly separated as Risky',
    zerobounce: 'Flagged + separate paid AI scoring add-on',
    emailable: 'Flagged as Risky / Accept-All',
    hunter: 'Flagged as Accept-All (still uses check credits)',
    reacher: 'Detected in developer response',
  },
  {
    feature: 'Busy or Protected Mailboxes',
    leadpure: 'Automatic wait & second check before marking Unknown',
    zerobounce: 'Handled inside closed pipeline',
    emailable: 'Refunds unresolved checks later',
    hunter: 'Marks unconfirmed without clear trail',
    reacher: 'Single backend configuration needed',
  },
  {
    feature: 'Spreadsheet Workflow',
    leadpure: '5,000 rows parsed locally, deduplicated, one-click Excel export',
    zerobounce: 'Cloud upload after login',
    emailable: 'Cloud CSV upload with per-row deductions',
    hunter: 'Bulk upload capped by plan tier',
    reacher: 'Built primarily as an API for developers',
  },
];

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

export function LandingPage({ onOpenDashboard, theme, onToggleTheme }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-[100dvh] bg-app-bg text-app-text font-sans relative selection:bg-brand-blue/30 selection:text-white overflow-x-clip">
      {/* Subtle Futuristic Atmospheric Depth */}
      <div className="mesh-background" />
      <div aria-hidden="true" className="fixed inset-0 architectural-grid pointer-events-none z-0 opacity-75" />

      {/* Minimal Floating Header */}
      <header className="sticky top-0 z-50 border-b border-app-border/70 bg-app-bg/75 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 sm:gap-3 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-xl"
          >
            <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(90,92,255,0.5),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-lg sm:text-xl font-display font-bold text-app-text tracking-tight">
              Lead<span className="gradient-text">Pure</span><span className="text-slate-600 dark:text-slate-300 font-semibold ml-1">AI</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600 dark:text-slate-400" aria-label="Primary navigation">
            <a href="#preview" className="hover:text-app-text transition-colors">How it works</a>
            <a href="#compare" className="hover:text-app-text transition-colors">Compare</a>
            <a href="#faq" className="hover:text-app-text transition-colors">Questions</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={(e) => onToggleTheme(e)}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="min-w-[40px] min-h-[40px] p-2 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] rounded-xl text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-white/10 active:scale-95 flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
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

            <MagneticButton onClick={onOpenDashboard} variant="primary" size="sm" className="rounded-full px-3.5 sm:px-5">
              <span className="hidden sm:inline">Open Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-16 space-y-28 sm:space-y-40 relative z-10">
        {/* 1. ARCHITECTURAL MINIMALIST HERO + INTERACTIVE MOTION STAGE */}
        <section className="space-y-14 sm:space-y-16">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full gradient-surface border border-brand-blue/25 text-xs font-medium text-app-text"
            >
              <span className="w-2 h-2 rounded-full gradient-bg animate-pulse" />
              <span>LeadPure V14 &middot; Clean email lists without paying per credit</span>
            </motion.div>

            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: EDITORIAL_EASE }}
              className="text-4xl sm:text-6xl lg:text-[4.25rem] font-display font-bold tracking-[-0.035em] leading-[1.04] text-app-text"
            >
              Know every email is real <span className="gradient-text">before you hit send.</span>
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: EDITORIAL_EASE }}
              className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal"
            >
              Check single addresses in seconds or clean spreadsheets up to 5,000 contacts so your campaigns reach real inboxes instead of bouncing.
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease: EDITORIAL_EASE }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
            >
              <MagneticButton onClick={onOpenDashboard} variant="primary" size="lg" className="group/hero px-8 w-full sm:w-auto">
                <span>Try It Now in Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover/hero:translate-x-0.5" />
              </MagneticButton>
              <a
                href="#compare"
                className="min-h-[54px] sm:min-h-[58px] px-7 py-3.5 rounded-2xl border border-slate-300 dark:border-white/15 bg-white/95 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-brand-blue/50 shadow-sm text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2 w-full sm:w-auto transition-all"
              >
                <span>Compare Verifiers</span>
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: EDITORIAL_EASE }}
          >
            <LiveHandshakeVisualizer />
          </motion.div>
        </section>

        {/* 2. HAIRLINE 3-PILLAR ARCHITECTURAL PRINCIPLES */}
        <section className="border-y border-app-border py-14 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.index}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: EDITORIAL_EASE }}
                className="space-y-3"
              >
                <span className="text-xs font-mono font-bold gradient-text">{pillar.index}</span>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-app-text tracking-tight">{pillar.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. INTERACTIVE LIST CLEANING MOTION DEMO */}
        <section id="preview" className="scroll-mt-24">
          <ArchitecturePipeline />
        </section>

        {/* 4. PLAIN-ENGLISH COMPARISON TABLE */}
        <section id="compare" className="space-y-10 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] gradient-text">Side-By-Side</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
                How LeadPure compares to popular email verifiers
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                A clear look at cost, ease of use, and honesty alongside{' '}
                <a href="https://www.zerobounce.net/" target="_blank" rel="noreferrer" className="text-app-text underline decoration-brand-blue/50 hover:text-brand-blue">ZeroBounce</a>,{' '}
                <a href="https://emailable.com/" target="_blank" rel="noreferrer" className="text-app-text underline decoration-brand-blue/50 hover:text-brand-blue">Emailable</a>,{' '}
                <a href="https://hunter.io/email-verifier" target="_blank" rel="noreferrer" className="text-app-text underline decoration-brand-blue/50 hover:text-brand-blue">Hunter</a>, and Reacher.
              </p>
            </div>
            <MagneticButton onClick={onOpenDashboard} variant="primary" size="md" className="shrink-0">
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </div>

          <div className="rounded-3xl gradient-border bg-app-card/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-app-border bg-slate-50/90 dark:bg-white/[0.03] text-xs font-display font-bold text-app-text">
                    <th className="py-5 px-5 w-[16%] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">What Matters</th>
                    <th className="py-5 px-5 w-[22%] gradient-surface border-x border-brand-blue/20">
                      <span className="gradient-text text-sm font-bold">LeadPure V14</span>
                    </th>
                    <th className="py-5 px-4 w-[15.5%]">
                      <a href="https://www.zerobounce.net/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand-blue">
                        ZeroBounce <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </th>
                    <th className="py-5 px-4 w-[15.5%]">
                      <a href="https://emailable.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand-blue">
                        Emailable <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </th>
                    <th className="py-5 px-4 w-[15.5%]">
                      <a href="https://hunter.io/email-verifier" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand-blue">
                        Hunter <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </th>
                    <th className="py-5 px-4 w-[15.5%]">Reacher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border text-xs">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-semibold text-app-text align-top">{row.feature}</td>
                      <td className="py-4 px-5 gradient-surface border-x border-brand-blue/20 font-semibold text-app-text align-top">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{row.leadpure}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 align-top">{row.zerobounce}</td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 align-top">{row.emailable}</td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 align-top">{row.hunter}</td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 align-top">{row.reacher}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. MINIMALIST EDITORIAL FAQ (HAIRLINE DIVIDERS ONLY) */}
        <section id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-10 scroll-mt-24">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] gradient-text">Common Questions</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
              Everything clearly explained.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              No hidden tricks or confusing marketing scorecards. Here is exactly what happens when you clean a list on LeadPure.
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

        {/* 6. SCULPTURAL MINIMALIST FINAL CTA */}
        <section className="py-10 sm:py-16 text-center space-y-6 relative">
          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-app-text max-w-2xl mx-auto leading-[1.08]">
            Clean your list. <span className="gradient-text">Protect your inbox.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            Open the dashboard to verify an email right now or upload your next campaign spreadsheet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <MagneticButton onClick={onOpenDashboard} variant="primary" size="lg" className="px-9 w-full sm:w-auto">
              <span>Open /dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <a
              href="https://github.com/ossamamehmood/LeadPure-AI"
              target="_blank"
              rel="noreferrer"
              className="min-h-[54px] sm:min-h-[58px] px-7 py-3 rounded-2xl border border-slate-300 dark:border-white/15 bg-white/95 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-brand-blue/50 shadow-sm text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2 w-full sm:w-auto transition-all"
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
