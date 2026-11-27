import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Layers, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import { AppRoutePath } from '../Footer';

interface PlansPageProps {
  onNavigate: (path: AppRoutePath) => void;
}

/**
 * Future upgrade readiness: Keep tier entitlement hooks decoupled so Stripe checkout,
 * API key issuance, and priority runner queues can attach directly to `/pricing`
 * in a later release without touching the verification UI.
 */
export function PlansPage({ onNavigate }: PlansPageProps) {
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
          <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
          <span>Simple Access &amp; Upcoming Team Tiers</span>
        </motion.div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-[-0.035em] leading-[1.06] text-app-text">
          Verify contacts free today.{' '}
          <span className="gradient-text">Scale as you grow.</span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Start verifying individual contacts or spreadsheets right away with zero monthly credit fees. Dedicated team tools and automated integrations are arriving in upcoming releases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {/* Active Free Workspace */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EDITORIAL_EASE }}
          className="liquid-glass rounded-3xl sm:rounded-[34px] p-7 sm:p-9 flex flex-col justify-between gap-8 ring-1 ring-inset ring-brand-blue/25"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                Available Now
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">No card required</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-app-text">Open Access</h2>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-display font-bold text-app-text">$0</span>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">/ month</span>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Everything solo senders, founders, and small outreach teams need to remove bounced addresses and protect domain health.
              </p>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-app-text">
              {[
                'Single email instant verification',
                'CSV & Excel batch cleaning up to 5,000 leads per sheet',
                'Automatic risky domain & throwaway email filtering',
                'Smart name capitalization & international phone formatting',
                'Resume interrupted runs automatically',
                'Clean Excel export grouped by Safe and Filtered results',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <MagneticButton onClick={() => onNavigate('/dashboard')} variant="primary" size="lg" className="w-full rounded-full">
            <span>Start Verifying Free</span>
            <ArrowRight className="w-4 h-4" />
          </MagneticButton>
        </motion.div>

        {/* Future Pro & Commercial Teams Roadmap */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EDITORIAL_EASE }}
          className="liquid-glass rounded-3xl sm:rounded-[34px] p-7 sm:p-9 flex flex-col justify-between gap-8"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue/12 text-brand-blue border border-brand-blue/25">
                Upcoming Pro Release
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Roadmap</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-app-text">Growth &amp; Teams</h2>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-bold gradient-text">Pro Upgrades</span>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Designed for high-volume outbound agencies and growing sales teams ready for dedicated throughput, team seats, and automated workflows.
              </p>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {[
                { icon: Layers, text: 'High-priority parallel queues for larger contact databases' },
                { icon: Users, text: 'Shared team workspaces, unified clean history, and exports' },
                { icon: ShieldCheck, text: 'Direct CRM connections and automated signup protection links' },
                { icon: Sparkles, text: 'Scheduled list re-cleaning before lists go stale' },
              ].map((entry) => {
                const Icon = entry.icon;
                return (
                  <li key={entry.text} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-blue/12 border border-brand-blue/25 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3 h-3" />
                    </span>
                    <span>{entry.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://www.patreon.com/c/ossamamehmood"
              target="_blank"
              rel="noreferrer"
              className="liquid-glass flex-1 min-h-[52px] px-6 py-3 rounded-full text-sm font-semibold text-app-text flex items-center justify-center gap-2 transition-all"
            >
              <span>Back Upcoming Releases</span>
            </a>
            <button
              type="button"
              onClick={() => onNavigate('/deliverability')}
              className="flex-1 min-h-[52px] px-6 py-3 rounded-full border border-app-border hover:border-brand-blue/40 text-sm font-semibold text-app-text flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Read Bounce Guide</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
