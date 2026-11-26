import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Zap, ArrowRight, ShieldCheck, Check, Sun, Moon, ChevronDown,
  Server, Layers, Database, FileSpreadsheet, ShieldAlert, ExternalLink, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MagneticButton } from './ui/MagneticButton';
import { GlossyCard } from './ui/GlossyCard';
import { StaggerGroup, StaggerItem, EDITORIAL_EASE } from './ui/MotionPrimitives';
import { LiveHandshakeVisualizer } from './landing/LiveHandshakeVisualizer';
import { ArchitecturePipeline } from './landing/ArchitecturePipeline';
import { Footer } from './Footer';

interface LandingPageProps {
  onOpenDashboard: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (e: React.MouseEvent) => void;
}

const FEATURES = [
  {
    tag: 'Own SMTP Engine 1.3.2',
    title: 'Direct Port-25 Verification',
    description:
      'Executes real DNS MX resolution, EHLO, MAIL FROM, and RCPT TO socket handshakes on ephemeral runners without delivering a single email.',
    icon: Zap,
  },
  {
    tag: 'No Guesswork',
    title: 'Honest 4-Verdict Taxonomy',
    description:
      'Returns explicit SAFE, RISKY, INVALID, and UNKNOWN verdicts with raw SMTP reply lines and a real Definitive Rate instead of inflated percentages.',
    icon: ShieldCheck,
  },
  {
    tag: 'Alias Safe',
    title: 'Forwarding Provider Intelligence',
    description:
      'Recognizes ImprovMX, ForwardEmail, and Cloudflare Email Routing patterns so forwarded startup domains are flagged accurately instead of falsely rejected.',
    icon: Layers,
  },
  {
    tag: 'Proofpoint & iCloud Safe',
    title: 'Dual-Identity 5.1.x Cross-Check',
    description:
      'When strict gateways issue sender-dependent 5.1.x policy blocks, Engine 1.3.2 confirms with a second envelope probe plus a 30-second greylist retry.',
    icon: Server,
  },
  {
    tag: 'Browser Web Worker',
    title: '5,000-Row Chunked Bulk',
    description:
      'Parses spreadsheets locally in a Web Worker, processes 100-email batches via 4 parallel workers per runner, and lets you resume interrupted scans.',
    icon: FileSpreadsheet,
  },
  {
    tag: '7-Day Hygiene',
    title: 'Zero Database Lock-In',
    description:
      'Unselected spreadsheet columns stay on your device. Verification payloads clear automatically from the results store every 7 days via scheduled workflow.',
    icon: Clock,
  },
];

const COMPARISON_ROWS = [
  {
    criterion: 'Billing & Credits',
    leadpure: 'Zero per-credit fees (runs on your own deployment)',
    zerobounce: '100/mo free, then paid credits or from $99/mo plans',
    emailable: '250 starter credits, then pay-as-you-go ($38/5k)',
    hunter: '50/mo free, paid tiers $49 to $299/mo (0.5 credit/check)',
    reacher: 'Free MIT code on self-hosted VPS, or paid SaaS',
  },
  {
    criterion: 'Port-25 Infrastructure',
    leadpure: 'Ephemeral GitHub Port-25 runners (no VPS maintenance)',
    zerobounce: 'Managed SaaS black-box mail cluster',
    emailable: 'Managed SaaS mail cluster',
    hunter: 'Managed SaaS mail cluster',
    reacher: 'Self-hosting requires Port-25-open VPS + IP upkeep',
  },
  {
    criterion: 'Catch-All Handling',
    leadpure: 'Explicit probe flags accept-all domains clearly as RISKY',
    zerobounce: 'Flags accept-all + offers paid 1 to 10 AI scoring add-on',
    emailable: 'Labels accept-all servers as Risky / Accept-All',
    hunter: 'Marks accept-all explicitly, still deducts check credits',
    reacher: 'Detects catch-all status in JSON API response',
  },
  {
    criterion: 'Policy & Greylist Safeguards',
    leadpure: 'Dual-identity 5.1.x check + 30s greylist retry + honest UNKNOWN',
    zerobounce: 'Proprietary internal heuristics; limited SMTP transcript',
    emailable: 'Fast bulk queues; refunds unresolved Unknowns',
    hunter: 'Domain search + verifier; Unknowns remain unbilled',
    reacher: 'Configurable Rust SMTP backend; manual retry tuning',
  },
  {
    criterion: 'Bulk List & Spreadsheet UX',
    leadpure: 'In-browser 5,000-row Web Worker + resume + LeadPure_Results.xlsx',
    zerobounce: 'Web dashboard upload after account login',
    emailable: 'Cloud CSV upload with per-row credit deduction',
    hunter: 'Web bulk list upload gated by monthly tier cap',
    reacher: 'API/CLI-first unless paired with custom frontend or SaaS',
  },
  {
    criterion: 'Auditability & Control',
    leadpure: 'Open codebase, visible workflow runs, raw SMTP reply proof',
    zerobounce: 'Closed-source SaaS pipeline',
    emailable: 'Closed-source SaaS pipeline',
    hunter: 'Closed-source SaaS pipeline',
    reacher: 'Open-source Rust engine (you maintain server deployment)',
  },
];

const FAQS = [
  {
    q: 'Does LeadPure send any email to my contacts during verification?',
    a: 'No. Every probe stops right after the recipient mail server answers RCPT TO over Port 25 and resets the connection. Zero emails are ever delivered to anyone on your list.',
  },
  {
    q: 'How is LeadPure different from paying for ZeroBounce, Emailable, or Hunter?',
    a: 'Credit-based SaaS platforms charge per verified lead or cap monthly free allowances. LeadPure pairs an intuitive React + Excel Workspace with an open Node.js SMTP probe executing on GitHub Actions Port-25 runners, giving you full transparency without per-email SaaS credit invoices.',
  },
  {
    q: 'Why does LeadPure sometimes show UNKNOWN instead of forcing SAFE or INVALID?',
    a: 'Mail gateways such as iCloud or Proofpoint occasionally defer connections with temporary greylisting (4xx) or policy blocks. Rather than guessing, Engine 1.3.2 retries after 30 seconds and returns honest UNKNOWN when uncertain so you never burn sender reputation or discard good leads silently.',
  },
  {
    q: 'How does LeadPure compare to self-hosting Reacher?',
    a: 'Reacher requires renting and maintaining a VPS with outbound Port 25 unblocked or buying their hosted API. LeadPure handles chunked orchestration in GitHub Actions plus in-browser Excel/CSV mapping, deduplication, phone normalization, and scan resumption out of the box.',
  },
  {
    q: 'What happens to my uploaded spreadsheet and scan results?',
    a: 'Your Excel or CSV file is parsed inside your browser using a Web Worker. Extra columns never leave your browser, only the normalized email list goes to ephemeral runners, and stored scan results are cleaned automatically after 7 days.',
  },
];

export function LandingPage({ onOpenDashboard, theme, onToggleTheme }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-[100dvh] bg-app-bg text-app-text font-sans relative selection:bg-brand-blue/30 selection:text-white overflow-x-clip">
      <div className="mesh-background" />

      {/* Top Glass Header */}
      <header className="sticky top-0 z-50 border-b border-app-border bg-app-bg/75 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-3 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-xl"
          >
            <div className="w-9 h-9 rounded-xl gradient-cta flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(90,92,255,0.5),0_2px_10px_-2px_rgba(245,2,253,0.22),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
              <Zap className="w-4.5 h-4.5 fill-white" />
            </div>
            <span className="text-xl sm:text-2xl font-display font-bold text-app-text tracking-tight">
              Lead<span className="gradient-text">Pure</span><span className="text-slate-600 dark:text-slate-300 font-semibold ml-1">AI</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300" aria-label="Landing navigation">
            <a href="#features" className="hover:text-app-text transition-colors">Capabilities</a>
            <a href="#compare" className="hover:text-app-text transition-colors">Compare Tools</a>
            <a href="#architecture" className="hover:text-app-text transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-app-text transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={(e) => onToggleTheme(e)}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="min-w-[42px] min-h-[42px] p-2.5 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] rounded-xl text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-white/10 active:scale-95 flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
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

            <MagneticButton onClick={onOpenDashboard} variant="primary" size="sm" className="rounded-full px-5">
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-16 space-y-24 sm:space-y-32 relative z-10">
        {/* 1. HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 sm:space-y-7">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
            >
              <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full gradient-surface border border-brand-blue/25 text-xs font-semibold text-app-text">
                <span className="w-2 h-2 rounded-full gradient-bg animate-pulse" />
                LeadPure V14 &middot; Own SMTP Engine 1.3.2
              </span>
            </motion.div>

            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: EDITORIAL_EASE }}
              className="text-4xl sm:text-5xl xl:text-6xl font-display font-bold tracking-tight leading-[1.06] text-app-text"
            >
              Clean every lead list without <span className="gradient-text">paying per credit.</span>
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: EDITORIAL_EASE }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl"
            >
              Verify single addresses or clean CSV and Excel lists up to 5,000 rows using real Port-25 SMTP handshakes, catch-all detection, and zero SaaS lock-in.
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease: EDITORIAL_EASE }}
              className="flex flex-col sm:flex-row gap-3.5 pt-1"
            >
              <MagneticButton onClick={onOpenDashboard} variant="primary" size="lg" className="group/hero px-7">
                <span>Launch Verification Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover/hero:translate-x-0.5" />
              </MagneticButton>
              <a
                href="#compare"
                className="min-h-[54px] sm:min-h-[58px] px-6 py-3.5 rounded-2xl border border-app-border bg-app-card hover:border-brand-blue/40 text-sm font-semibold text-app-text flex items-center justify-center gap-2 transition-colors"
              >
                <span>Compare Alternatives</span>
              </a>
            </motion.div>

            {/* Concrete Code-Backed Proof Bar */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-app-border"
            >
              {[
                { label: 'Spreadsheet Scale', value: '5,000 Rows' },
                { label: 'Credit Tax', value: '$0 / Check' },
                { label: 'Chunk Workers', value: '100 / Batch' },
                { label: 'Retention Cap', value: '7 Days Auto' },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.025] border border-app-border">
                  <p className="text-sm sm:text-base font-display font-bold text-app-text tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Interactive Motion Graphic */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: EDITORIAL_EASE }}
            className="lg:col-span-6"
          >
            <LiveHandshakeVisualizer />
          </motion.div>
        </section>

        {/* 2. WHY LEADPURE FEATURES GRID */}
        <section id="features" className="space-y-10 scroll-mt-24">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest gradient-text">Built For Deliverability</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
              Why outbound teams switch to <span className="gradient-text">LeadPure AI</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard list cleaners charge every month while hiding uncertainty behind arbitrary percentage scores. LeadPure gives you the raw server signal cleanly.
            </p>
          </div>

          <StaggerGroup staggerDelay={0.06} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.title} className="h-full">
                  <GlossyCard className="p-6 sm:p-7 rounded-3xl h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-5">
                        <div className="w-11 h-11 rounded-2xl gradient-surface border border-brand-blue/25 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-brand-blue" />
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">{item.tag}</span>
                      </div>
                      <h3 className="text-xl font-display font-bold text-app-text tracking-tight">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </GlossyCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </section>

        {/* 3. COMPETITOR COMPARISON TABLE */}
        <section id="compare" className="space-y-10 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest gradient-text">Honest Market Comparison</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
                How LeadPure V14 stacks up against top verifiers
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Compared fairly on billing structure, Port-25 infrastructure, catch-all transparency, and spreadsheet workflow against{' '}
                <a href="https://www.zerobounce.net/" target="_blank" rel="noreferrer" className="text-app-text underline decoration-brand-blue/50 hover:text-brand-blue">ZeroBounce</a>,{' '}
                <a href="https://emailable.com/" target="_blank" rel="noreferrer" className="text-app-text underline decoration-brand-blue/50 hover:text-brand-blue">Emailable</a>,{' '}
                <a href="https://hunter.io/email-verifier" target="_blank" rel="noreferrer" className="text-app-text underline decoration-brand-blue/50 hover:text-brand-blue">Hunter</a>, and Reacher.
              </p>
            </div>
            <MagneticButton onClick={onOpenDashboard} variant="primary" size="md" className="shrink-0">
              <span>Test Free In Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </div>

          <GlossyCard glow="gradient" className="rounded-3xl sm:rounded-[32px] gradient-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-app-border bg-slate-50/90 dark:bg-white/[0.03] text-xs font-display font-bold text-app-text">
                    <th className="py-5 px-5 w-[16%] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Capability</th>
                    <th className="py-5 px-5 w-[22%] gradient-surface border-x border-brand-blue/20">
                      <span className="gradient-text text-sm font-bold">LeadPure AI V14</span>
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
                    <tr key={row.criterion} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-semibold text-app-text align-top">{row.criterion}</td>
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
          </GlossyCard>
        </section>

        {/* 4. INTERACTIVE ARCHITECTURE SECTION */}
        <section id="architecture" className="space-y-10 scroll-mt-24">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest gradient-text">Zero-Serverless-Timeout Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
              From spreadsheet upload to clean `.xlsx` in five resilient stages
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Serverless functions normally drop Port-25 connections in 10 seconds. LeadPure pairs edge orchestration with GitHub Actions compute so even 5,000-row lists finish deterministically.
            </p>
          </div>

          <ArchitecturePipeline />
        </section>

        {/* 5. FAQ SECTION */}
        <section id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-10 scroll-mt-24">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest gradient-text">Straight Answers</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Everything you should know about Port-25 safety, verdict guarantees, and running lists cleanly on LeadPure AI V14.
            </p>
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-app-border flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every result shows its real SMTP status code and mail host rather than hiding delays behind opaque numeric scores.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <GlossyCard key={item.q} className="rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full px-5 sm:px-6 py-4.5 flex items-center justify-between gap-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    <span className="text-sm sm:text-base font-display font-bold text-app-text">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0',
                        isOpen && 'rotate-180 text-brand-blue'
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="faq-body"
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                      >
                        <p className="px-5 sm:px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-app-border pt-3.5">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlossyCard>
              );
            })}
          </div>
        </section>

        {/* 6. BOTTOM CTA CARD */}
        <section>
          <GlossyCard glow="gradient" className="p-8 sm:p-12 md:p-14 rounded-3xl sm:rounded-[38px] gradient-border text-center relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="w-12 h-12 rounded-2xl gradient-cta mx-auto flex items-center justify-center text-white shadow-lg">
                <Database className="w-6 h-6" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
                Ready to inspect your next <span className="gradient-text">outbound list?</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Jump straight into the V14 workspace to verify a single address live or clean a full CSV / Excel file up to 5,000 contacts.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <MagneticButton onClick={onOpenDashboard} variant="primary" size="lg" className="px-8 w-full sm:w-auto">
                  <span>Open /dashboard Now</span>
                  <ArrowRight className="w-4 h-4" />
                </MagneticButton>
                <a
                  href="https://github.com/ossamamehmood/LeadPure-AI"
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[54px] px-6 py-3 rounded-2xl border border-app-border bg-app-card hover:border-brand-blue/40 text-sm font-semibold text-app-text flex items-center justify-center gap-2 w-full sm:w-auto transition-colors"
                >
                  <span>Inspect Engine on GitHub</span>
                  <ExternalLink className="w-4 h-4 opacity-60" />
                </a>
              </div>
            </div>
          </GlossyCard>
        </section>

        <Footer />
      </main>
    </div>
  );
}
