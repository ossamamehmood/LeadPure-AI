import React from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';

export type AppRoutePath = '/' | '/dashboard' | '/pricing' | '/deliverability' | '/privacy' | '/terms';

interface FooterProps {
  variant?: 'landing' | 'dashboard';
  onNavigate?: (path: AppRoutePath) => void;
}

export function Footer({ variant = 'dashboard', onNavigate }: FooterProps) {
  const handleRoute = (e: React.MouseEvent, target: AppRoutePath) => {
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate(target);
  };

  if (variant === 'dashboard') {
    return (
      <footer className="py-8 border-t border-app-border flex flex-col md:flex-row items-center justify-between gap-4 px-2 text-xs font-medium text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full gradient-bg shadow-[0_0_10px_rgba(90,92,255,0.55)]" />
            <span className="font-display font-bold gradient-text">LeadPure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>Engine 1.3.2 Active</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <a
            href="/privacy"
            onClick={(e) => handleRoute(e, '/privacy')}
            className="hover:text-app-text transition-colors cursor-pointer"
          >
            Privacy
          </a>
          <a
            href="/terms"
            onClick={(e) => handleRoute(e, '/terms')}
            className="hover:text-app-text transition-colors cursor-pointer"
          >
            Terms
          </a>
          <a
            href="https://www.patreon.com/c/ossamamehmood"
            target="_blank"
            rel="noreferrer"
            className="text-brand-blue hover:text-app-text transition-colors font-semibold"
          >
            Support On Patreon
          </a>
          <a
            href="https://ossamamehmood.com"
            target="_blank"
            rel="noreferrer"
            className="gradient-text font-semibold hover:opacity-85 transition-opacity"
          >
            Built By Ossama Mahmood
          </a>
        </div>
      </footer>
    );
  }

  const handleHashRoute = (e: React.MouseEvent, targetId: string) => {
    if (!onNavigate) return;
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      e.preventDefault();
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    onNavigate('/');
    setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' }), 90);
  };

  return (
    <footer className="pt-8 pb-6">
      <div className="liquid-glass rounded-3xl sm:rounded-[34px] p-7 sm:p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand Summary */}
          <div className="md:col-span-5 space-y-4">
            <a
              href="/"
              onClick={(e) => handleRoute(e, '/')}
              className="inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-full"
            >
              <div className="w-8 h-8 rounded-full gradient-cta flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(90,92,255,0.5)]">
                <Zap className="w-4 h-4 fill-white" aria-hidden="true" />
              </div>
              <span translate="no" className="text-lg font-display font-bold text-app-text tracking-tight">
                Lead<span className="gradient-text">Pure</span>
              </span>
            </a>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
              Verify every inbox before you hit send. Built to help sales and marketing teams protect their sender reputation and prevent avoidable bounces.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/55 dark:bg-white/[0.04] border border-white/75 dark:border-app-border text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span>Real-Time Verification Ready</span>
            </div>
          </div>

          {/* Product Navigation */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Product
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <li>
                <a
                  href="/dashboard"
                  onClick={(e) => handleRoute(e, '/dashboard')}
                  className="hover:text-brand-blue transition-colors inline-flex items-center gap-1"
                >
                  Open App <ArrowUpRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="/deliverability"
                  onClick={(e) => handleRoute(e, '/deliverability')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Deliverability Guide
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  onClick={(e) => handleRoute(e, '/pricing')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Plans &amp; Roadmap
                </a>
              </li>
              <li>
                <a
                  href="/#compare"
                  onClick={(e) => handleHashRoute(e, 'compare')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Compare Tools
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Explore
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <li>
                <a
                  href="/#live-demo"
                  onClick={(e) => handleHashRoute(e, 'live-demo')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Live Preview
                </a>
              </li>
              <li>
                <a
                  href="/#preview"
                  onClick={(e) => handleHashRoute(e, 'preview')}
                  className="hover:text-brand-blue transition-colors"
                >
                  List Cleaner
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  onClick={(e) => handleHashRoute(e, 'faq')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Common Questions
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Policies &amp; Support
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleRoute(e, '/privacy')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleRoute(e, '/terms')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="https://www.patreon.com/c/ossamamehmood"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-blue hover:opacity-80 transition-opacity font-semibold inline-flex items-center gap-1"
                >
                  Support Development <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-app-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>LeadPure &middot; Built for clean outreach and protected sender reputation.</p>
          <a
            href="https://ossamamehmood.com"
            target="_blank"
            rel="noreferrer"
            className="gradient-text font-semibold hover:opacity-85 transition-opacity"
          >
            Built By Ossama Mahmood
          </a>
        </div>
      </div>
    </footer>
  );
}
