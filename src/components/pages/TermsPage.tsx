import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, FileCheck2 } from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import { AppRoutePath } from '../Footer';

interface TermsPageProps {
  onNavigate: (path: AppRoutePath) => void;
}

export function TermsPage({ onNavigate }: TermsPageProps) {
  const shouldReduceMotion = useReducedMotion();

  const clauses = [
    {
      title: '1. Permitted Verification Use',
      body: 'You agree to verify only business or customer contact lists you hold legitimate permission to maintain, and to avoid abusive, deceptive, or unlawful outreach behavior.',
    },
    {
      title: '2. Honest Verification Verdicts & Realistic Expectations',
      body: 'LeadPure labels addresses clearly as Safe, Risky, Invalid, or Unconfirmed based on live checks. Because certain domains accept all usernames or temporarily pause checks when busy, no verifier can guarantee a zero-percent bounce outcome on every campaign.',
    },
    {
      title: '3. Service Availability & Future Paid Plans',
      body: 'Core verification tools remain open for immediate testing today. As higher-volume paid plans, priority queues, and team workspaces roll out in future updates, clear pricing and service limits will be presented upfront before any billing applies.',
    },
    {
      title: '4. Data Responsibility',
      body: 'You remain responsible for safeguarding exported spreadsheets downloaded to your device and complying with applicable regional messaging and privacy regulations when sending campaigns.',
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
          <FileCheck2 className="w-3.5 h-3.5 text-brand-blue" />
          <span>Terms of Service</span>
        </motion.div>

        <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-app-text">
          Clear, fair <span className="gradient-text">terms of use.</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Plain-language guidelines covering permitted list checking, honest delivery verdicts, and future upgrades.
        </p>
      </div>

      <div className="space-y-4">
        {clauses.map((clause) => (
          <div key={clause.title} className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-2.5">
            <h2 className="text-lg sm:text-xl font-display font-bold text-app-text">{clause.title}</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{clause.body}</p>
          </div>
        ))}
      </div>

      <div className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-display font-bold text-app-text">Questions or ready to clean a list?</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Read our Privacy Policy or jump directly into verification.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('/privacy')}
            className="liquid-glass px-5 py-2.5 rounded-full text-xs font-semibold text-app-text cursor-pointer"
          >
            Privacy Policy
          </button>
          <MagneticButton onClick={() => onNavigate('/dashboard')} variant="primary" size="sm" className="rounded-full px-5">
            <span>Verify Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
