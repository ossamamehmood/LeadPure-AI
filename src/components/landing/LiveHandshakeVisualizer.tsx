import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Server, Shield, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EDITORIAL_EASE } from '../ui/MotionPrimitives';
import { GlossyCard } from '../ui/GlossyCard';

interface Scenario {
  id: 'safe' | 'risky' | 'invalid' | 'unknown';
  label: string;
  email: string;
  mxHost: string;
  verdict: 'SAFE' | 'RISKY' | 'INVALID' | 'UNKNOWN';
  smtpCode: string;
  replyText: string;
  steps: { name: string; status: string; ms: string }[];
  explanation: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'safe',
    label: 'Valid Inbox',
    email: 'founder@acmehealth.io',
    mxHost: 'aspmx.l.google.com:25',
    verdict: 'SAFE',
    smtpCode: '250 2.1.5 OK',
    replyText: 'Mailbox verified + non-catch-all probe rejected fake sibling.',
    steps: [
      { name: 'Syntax & Domain MX', status: 'aspmx.l.google.com', ms: '18ms' },
      { name: 'Port-25 Handshake', status: 'EHLO -> MAIL FROM -> RCPT TO', ms: '142ms' },
      { name: 'Catch-All Cross-Check', status: 'Fake alias rejected (550)', ms: '94ms' },
    ],
    explanation: 'Active recipient mailbox verified directly with mail server; safe to send.',
  },
  {
    id: 'risky',
    label: 'Accept-All',
    email: 'alex@studio-partner.co',
    mxHost: 'mx1.improvmx.com:25',
    verdict: 'RISKY',
    smtpCode: '250 Accept-All',
    replyText: 'Domain accepts every address including random probe aliases.',
    steps: [
      { name: 'Syntax & Domain MX', status: 'Forwarding / Catch-All MX', ms: '24ms' },
      { name: 'Port-25 Handshake', status: 'Target address accepted (250)', ms: '165ms' },
      { name: 'Catch-All Cross-Check', status: 'Random probe accepted (250)', ms: '112ms' },
    ],
    explanation: 'Server accepts any username at this domain. Flagged honestly as RISKY.',
  },
  {
    id: 'invalid',
    label: 'Dead Mailbox',
    email: 'old.user99@gmail.com',
    mxHost: 'gmail-smtp-in.l.google.com:25',
    verdict: 'INVALID',
    smtpCode: '550 5.1.1 No User',
    replyText: 'Recipient mailbox permanently rejected at SMTP gate.',
    steps: [
      { name: 'Syntax & Domain MX', status: 'gmail-smtp-in.l.google.com', ms: '14ms' },
      { name: 'Port-25 Handshake', status: 'RCPT TO permanently refused', ms: '128ms' },
      { name: '5.1.x Re-Confirm', status: 'Secondary check confirmed 550', ms: '119ms' },
    ],
    explanation: 'Confirmed non-existent address before any campaign send triggers a hard bounce.',
  },
  {
    id: 'unknown',
    label: 'Greylisted',
    email: 'team@private-mail.org',
    mxHost: 'mx01.icloud.com:25',
    verdict: 'UNKNOWN',
    smtpCode: '450 4.2.1 Defer',
    replyText: 'Temporary policy refusal or greylist persisted past retry.',
    steps: [
      { name: 'Syntax & Domain MX', status: 'mx01.icloud.com resolved', ms: '21ms' },
      { name: 'Greylist Retry Wait', status: '30s retry window executed', ms: '30.2s' },
      { name: 'Honest Safeguard', status: 'Never guesses SAFE on timeout', ms: 'final' },
    ],
    explanation: 'Engine 1.3.2 refuses to fabricate SAFE or INVALID when a server defers.',
  },
];

export function LiveHandshakeVisualizer() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || shouldReduceMotion) return;
    const id = setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % SCENARIOS.length);
    }, 4800);
    return () => clearInterval(id);
  }, [paused, shouldReduceMotion]);

  const current = SCENARIOS[selectedIdx];

  const verdictStyles = {
    SAFE: {
      badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    RISKY: {
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
    },
    INVALID: {
      badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500',
      icon: XCircle,
    },
    UNKNOWN: {
      badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
      dot: 'bg-slate-400',
      icon: HelpCircle,
    },
  }[current.verdict];

  const VerdictIcon = verdictStyles.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient tri-color atmospheric backlight behind console card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-[38px] opacity-30 dark:opacity-45 blur-2xl"
        style={{ background: 'linear-gradient(125deg, rgba(2,254,220,0.22) 0%, rgba(90,92,255,0.28) 50%, rgba(245,2,253,0.20) 100%)' }}
      />

      <GlossyCard glow="gradient" className="rounded-3xl sm:rounded-[30px] p-5 sm:p-6 gradient-border relative z-10">
        {/* Console Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-app-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center text-white shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-display font-bold text-app-text leading-tight">Live SMTP Telemetry</p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Engine 1.3.2 &middot; Zero Mail Sent</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Sample verification scenarios">
            {SCENARIOS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={idx === selectedIdx}
                onClick={() => { setSelectedIdx(idx); setPaused(true); }}
                className={cn(
                  'relative px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                  idx === selectedIdx
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-app-text bg-slate-100/80 dark:bg-white/[0.04]'
                )}
              >
                {idx === selectedIdx && (
                  <motion.span
                    layoutId="visualizer-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full gradient-cta"
                  />
                )}
                <span className="relative z-10">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Animated Signal Track Between Engine and Mail Exchange */}
        <div className="my-5 px-3 py-3.5 rounded-2xl bg-slate-50/90 dark:bg-[#080A10] border border-app-border">
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full gradient-bg shrink-0" />
              <span className="font-semibold text-app-text truncate">LeadPure Runner</span>
            </div>

            {/* GPU Animated Packet Beam */}
            <div className="flex-1 mx-2 relative h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              {!shouldReduceMotion ? (
                <motion.div
                  key={current.id}
                  className="absolute inset-y-0 left-0 w-1/2 rounded-full gradient-bg"
                  initial={{ x: '-100%' }}
                  animate={{ x: ['-100%', '220%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              ) : (
                <div className="h-full w-full gradient-bg" />
              )}
            </div>

            <div className="flex items-center gap-1.5 min-w-0 justify-end">
              <Server className="w-3.5 h-3.5 text-brand-blue shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[140px] sm:max-w-[180px]">{current.mxHost}</span>
            </div>
          </div>
        </div>

        {/* Animated Scenario Body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
            className="space-y-4"
          >
            {/* Target Email & Live Verdict Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-app-border">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Simulated Probe Target
                </p>
                <p className="text-sm font-mono font-semibold text-app-text truncate mt-0.5">{current.email}</p>
              </div>

              <div className={cn('px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0', verdictStyles.badge)}>
                <VerdictIcon className="w-3.5 h-3.5" />
                <span>{current.verdict}</span>
                <span className="font-mono font-medium opacity-80 text-[11px]">({current.smtpCode})</span>
              </div>
            </div>

            {/* 3-Stage Handshake Trace */}
            <div className="space-y-2">
              {current.steps.map((step, i) => (
                <motion.div
                  key={step.name}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.25, ease: EDITORIAL_EASE }}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-white/[0.02] border border-app-border text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-slate-400 w-4">0{i + 1}</span>
                    <span className="font-semibold text-app-text truncate">{step.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="hidden sm:inline text-[11px] font-mono text-slate-500 dark:text-slate-400">{step.status}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-[10px] font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {step.ms}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Server Evidence Footer */}
            <div className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <Shield className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold text-app-text">{current.replyText}</span> {current.explanation}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </GlossyCard>
    </div>
  );
}
