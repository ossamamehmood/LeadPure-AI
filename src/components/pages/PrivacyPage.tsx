import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import { AppRoutePath } from '../Footer';

interface PrivacyPageProps {
  onNavigate: (path: AppRoutePath) => void;
}

/**
 * Technical reference for future audits:
 * - Client-side CSV/XLSX parsing runs completely in local Web Worker (`src/workers/xlsxWorker.ts`).
 * - Extra spreadsheet fields (names, phones, titles, notes) stay in browser memory / `localStorage` only.
 * - Only normalized email strings are transmitted to stateless verification jobs (`cleanup-results.yml` purges finished artifacts after 7 days).
 */
export function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  const shouldReduceMotion = useReducedMotion();

  const sections = [
    {
      title: '1. Extra Columns Stay in Your Browser',
      body: 'When you drop an Excel or CSV file into LeadPure, customer names, phone numbers, company columns, notes, and custom fields never leave your browser during cleanup and formatting. Only the email addresses that need verification are sent to our checker.',
    },
    {
      title: '2. Zero Permanent Lead Database',
      body: 'We do not store, resell, share, or harvest your contact lists into any marketing database or third-party data broker. Temporary scan outputs required to deliver your downloadable file automatically expire and clear after 7 days.',
    },
    {
      title: '3. Local Browser Recovery',
      body: 'Scan progress, preference rules, theme choice, and recent summary archives are saved locally on your own device so you can resume interrupted checks smoothly without an account.',
    },
    {
      title: '4. No Emails Sent to Contacts',
      body: 'Verification checks confirm whether a receiving inbox exists quietly and politely without ever placing a message in your prospect inbox or notifying your leads.',
    },
  ];

  return (
    <div className="space-y-14 sm:space-y-20 pt-4 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
          className="liquid-glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200"
        >
          <Lock className="w-3.5 h-3.5 text-brand-blue" />
          <span>Privacy Policy</span>
        </motion.div>

        <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-app-text">
          Your contacts belong <span className="gradient-text">strictly to you.</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          We designed LeadPure from day one so private spreadsheet details stay on your device while checks stay fast, temporary, and clean.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((sec) => (
          <div key={sec.title} className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-2.5">
            <h2 className="text-lg sm:text-xl font-display font-bold text-app-text">{sec.title}</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>

      <div className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-display font-bold text-app-text">Ready to verify privately?</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Open the workspace or review our Terms of Service.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('/terms')}
            className="liquid-glass px-5 py-2.5 rounded-full text-xs font-semibold text-app-text cursor-pointer"
          >
            Terms of Service
          </button>
          <MagneticButton onClick={() => onNavigate('/dashboard')} variant="primary" size="sm" className="rounded-full px-5">
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
