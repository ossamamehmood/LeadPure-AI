import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import { AppRoutePath } from '../Footer';

interface DeliverabilityPageProps {
  onNavigate: (path: AppRoutePath) => void;
}

/**
 * Technical note for maintainers:
 * Backend checks combine RFC 5322 syntax + typo normalization, disposable/role filters,
 * live DNS MX resolution with RFC 7505 null-MX rejection, forwarding MX safeguards
 * (ImprovMX / ForwardEmail / Cloudflare), 30s greylist wait retries, and dual sender
 * identity confirmation (IDENTITY_A -> IDENTITY_B) inside engine/probe.mjs v1.3.2
 * before flagging 5.1.x unknown recipients. Frontend keeps these completely jargon-free.
 */
export function DeliverabilityPage({ onNavigate }: DeliverabilityPageProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-16 sm:space-y-24 pt-4">
      <div className="max-w-3xl mx-auto text-center space-y-5">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
          className="liquid-glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Honest Bounce Protection Benchmarks</span>
        </motion.div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-[-0.035em] leading-[1.06] text-app-text">
          How LeadPure protects your{' '}
          <span className="gradient-text">sender reputation.</span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Sending emails to dead or mistyped contacts ruins inbox placement for your entire team. Here is exactly what our checks catch and why honest labels matter.
        </p>
      </div>

      {/* Bounce Benchmark Visual Scale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Uncleaned Lists</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl sm:text-4xl font-display font-bold text-app-text">15% - 35%</p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Typical bounce risk in stale or scraped contact sheets loaded with typos, closed jobs, and throwaway signups. Sending directly damages domain trust.
          </p>
        </div>

        <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Provider Warning Line</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl sm:text-4xl font-display font-bold text-app-text">2.0% Limit</p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Major inbox providers start flagging and filtering campaigns once bounce rates approach 2%. Crossing 5% can send even real messages into spam folders.
          </p>
        </div>

        <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-3 ring-1 ring-inset ring-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Verified Safe Segment</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl sm:text-4xl font-display font-bold gradient-text">&lt; 1% Target</p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Removing dead boxes, typos, and risky catch-all domains puts your Safe list comfortably below 1%, cutting avoidable bounces by up to 90%+.
          </p>
        </div>
      </div>

      {/* Transparent Truth Section */}
      <div className="liquid-glass rounded-3xl sm:rounded-[34px] p-7 sm:p-10 space-y-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-brand-blue">Why Honesty Beats Fake Promises</p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-app-text">
            Why no real tool should promise a flat &quot;0% bounce rate&quot;
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Some companies set their inboxes to accept every username entered, or temporarily pause verification checks during heavy traffic. Tools that mark those contacts Safe anyway set you up for surprise bounces later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'Double-Checked Rejections',
              desc: 'If an address looks dead, LeadPure checks twice using a clean backup check before blocking it so strict company filters never cost you a real lead.',
            },
            {
              title: 'Separated Risky Contacts',
              desc: 'Domains that accept any name are clearly marked Risky instead of Safe so you can keep them out of primary outreach sequences.',
            },
            {
              title: 'Honest Review Holdouts',
              desc: 'Busy inboxes and mail forwarding hosts stay labeled Unconfirmed instead of being guessed, keeping your decision data trustworthy.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="p-5 rounded-2xl bg-white/30 dark:bg-white/[0.03] border border-white/55 dark:border-white/[0.08] space-y-2"
            >
              <h3 className="text-base font-display font-bold text-app-text">{card.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3.5">
          <MagneticButton onClick={() => onNavigate('/dashboard')} variant="primary" size="lg" className="rounded-full px-8">
            <ShieldCheck className="w-4 h-4" />
            <span>Clean Your List Free</span>
            <ArrowRight className="w-4 h-4" />
          </MagneticButton>
          <button
            type="button"
            onClick={() => onNavigate('/pricing')}
            className="liquid-glass min-h-[52px] px-7 py-3 rounded-full text-sm font-semibold text-app-text cursor-pointer"
          >
            See Plans &amp; Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
