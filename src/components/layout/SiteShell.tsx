import React from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowRight, Moon, Sun, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BackgroundMotion } from '../ui/BackgroundMotion';
import { MagneticButton } from '../ui/MagneticButton';
import { AppRoutePath, Footer } from '../Footer';

interface SiteShellProps {
  children: React.ReactNode;
  activeRoute: AppRoutePath;
  onNavigate: (path: AppRoutePath) => void;
  theme: 'dark' | 'light';
  onToggleTheme: (e: React.MouseEvent) => void;
}

/**
 * Shared synchronized outer chrome used by Homepage, Plans, Deliverability Guide,
 * Privacy Policy, and Terms of Service so every page shares identical floating
 * `.liquid-glass` optics, spatial background, scroll bar, and footer.
 */
export function SiteShell({
  children,
  activeRoute,
  onNavigate,
  theme,
  onToggleTheme,
}: SiteShellProps) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  const go = (e: React.MouseEvent, path: AppRoutePath) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="min-h-[100dvh] bg-app-bg text-app-text font-sans relative selection:bg-brand-blue/30 selection:text-white overflow-x-clip">
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="fixed top-0 inset-x-0 h-[2px] z-[60] gradient-bg origin-left"
          style={{ scaleX: progressScale }}
        />
      )}

      <BackgroundMotion variant="hero" />

      <div className="sticky top-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none">
        <header className="liquid-glass pointer-events-auto max-w-6xl mx-auto px-3 sm:px-5 h-15 sm:h-16 rounded-full flex items-center justify-between gap-2 sm:gap-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (activeRoute === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                onNavigate('/');
              }
            }}
            className="flex items-center gap-2 sm:gap-2.5 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-full pl-1"
          >
            <div className="w-8 h-8 rounded-full gradient-cta flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(90,92,255,0.5),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-base sm:text-lg font-display font-bold text-app-text tracking-tight">
              Lead<span className="gradient-text">Pure</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300" aria-label="Primary navigation">
            <a
              href="/#preview"
              onClick={(e) => {
                if (activeRoute !== '/') {
                  e.preventDefault();
                  onNavigate('/');
                  setTimeout(() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' }), 80);
                }
              }}
              className="hover:text-app-text transition-colors"
            >
              How it works
            </a>
            <a
              href="/#compare"
              onClick={(e) => {
                if (activeRoute !== '/') {
                  e.preventDefault();
                  onNavigate('/');
                  setTimeout(() => document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' }), 80);
                }
              }}
              className="hover:text-app-text transition-colors"
            >
              Compare
            </a>
            <a
              href="/deliverability"
              onClick={(e) => go(e, '/deliverability')}
              className={cn(
                'hover:text-app-text transition-colors',
                activeRoute === '/deliverability' && 'text-brand-blue font-semibold'
              )}
            >
              Deliverability
            </a>
            <a
              href="/pricing"
              onClick={(e) => go(e, '/pricing')}
              className={cn(
                'hover:text-app-text transition-colors',
                activeRoute === '/pricing' && 'text-brand-blue font-semibold'
              )}
            >
              Plans
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => onToggleTheme(e)}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 rounded-full bg-white/60 dark:bg-white/[0.06] hover:bg-white/90 dark:hover:bg-white/[0.12] text-slate-600 dark:text-slate-300 transition-all border border-white/80 dark:border-white/10 active:scale-95 flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className="relative w-4 h-4">
                <Sun
                  className={cn(
                    'w-4 h-4 absolute inset-0 transition-transform duration-300',
                    theme === 'dark' ? 'translate-y-7 opacity-0' : 'translate-y-0 opacity-100'
                  )}
                />
                <Moon
                  className={cn(
                    'w-4 h-4 absolute inset-0 transition-transform duration-300',
                    theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-7 opacity-0'
                  )}
                />
              </div>
            </button>

            <MagneticButton
              onClick={() => onNavigate('/dashboard')}
              variant="primary"
              size="sm"
              className="rounded-full px-3.5 sm:px-5 min-h-[36px]"
            >
              <span className="hidden sm:inline">Verify Free</span>
              <span className="sm:hidden">Verify</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16 space-y-20 sm:space-y-28 relative z-10">
        {children}
        <Footer variant="landing" onNavigate={onNavigate} />
      </main>
    </div>
  );
}
