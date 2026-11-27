import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldCheck, ShieldAlert, Zap, Activity, Globe, Info, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';
import { MagneticButton } from './ui/MagneticButton';
import { StaggerGroup, StaggerItem, EDITORIAL_EASE } from './ui/MotionPrimitives';
import { ProcessedContact } from '../types';

interface SingleValidationProps {
  initialEmail?: string;
  onConsumeInitialEmail?: () => void;
}

export function SingleValidation({ initialEmail, onConsumeInitialEmail }: SingleValidationProps = {}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<Partial<ProcessedContact> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail && initialEmail.trim()) {
      setEmail(initialEmail.trim());
      onConsumeInitialEmail?.();
    }
  }, [initialEmail, onConsumeInitialEmail]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getCanonicalVerdict = (res: Partial<ProcessedContact> | null): 'SAFE' | 'RISKY' | 'INVALID' | 'UNKNOWN' => {
    if (!res) return 'UNKNOWN';
    const rawStatus = String(res.status || '').toUpperCase();
    const raw = String(
      (res as any).verdict ||
      res.verificationStatus ||
      (rawStatus !== 'COMPLETED' && rawStatus !== 'PENDING' ? rawStatus : '')
    ).toUpperCase();
    if (raw === 'SAFE' || raw === 'VERIFIED') return 'SAFE';
    if (raw === 'RISKY') return 'RISKY';
    if (raw === 'INVALID' || raw === 'BLOCKED' || raw === 'REJECTED') return 'INVALID';
    return 'UNKNOWN';
  };

  const resolveCompletedResult = (payload: any): Partial<ProcessedContact> => {
    if (Array.isArray(payload?.results) && payload.results[0]) {
      return { ...payload, ...payload.results[0] };
    }
    return payload;
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = email.trim();
    if (!clean || !clean.includes('@')) return;

    setIsVerifying(true);
    setResult(null);
    setErrorMsg(null);
    setElapsedSeconds(0);

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      const postRes = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean })
      });

      const initialData = await postRes.json();

      if (initialData.status === 'error') {
        clearInterval(timer);
        setErrorMsg(initialData.ui_reason || 'Verification backend unreachable');
        setIsVerifying(false);
        return;
      }

      if (initialData.status === 'completed') {
        clearInterval(timer);
        setResult(resolveCompletedResult(initialData));
        setIsVerifying(false);
        return;
      }

      if (initialData.status === 'pending' && initialData.requestId) {
        const reqId = initialData.requestId;
        const startTime = Date.now();
        const maxWaitMs = 1200000; // 20 minutes

        while (Date.now() - startTime < maxWaitMs) {
          await new Promise((r) => setTimeout(r, 6000));

          try {
            const pollRes = await fetch(`/api/check?requestId=${encodeURIComponent(reqId)}`);
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.status === 'error') {
                clearInterval(timer);
                setErrorMsg(pollData.ui_reason || 'Verification probe error');
                setIsVerifying(false);
                return;
              }
              if (pollData.status === 'completed') {
                clearInterval(timer);
                setResult(resolveCompletedResult(pollData));
                setIsVerifying(false);
                return;
              }
            }
          } catch (pollErr) {
            console.warn('[POLL_ATTEMPT_ERR]', pollErr);
          }
        }
      }

      clearInterval(timer);
      setErrorMsg('STILL CHECKING / TIMED OUT - re-run to complete');
    } catch (err: any) {
      clearInterval(timer);
      console.error('[SINGLE_VERIFY_ERR]', err);
      setErrorMsg(`Verification request failed: ${err.message || 'Network error'}`);
    } finally {
      clearInterval(timer);
      setIsVerifying(false);
    }
  };

  const verdict = getCanonicalVerdict(result);

  const getStatusColor = (v: string) => {
    switch (v) {
      case 'SAFE': return 'text-emerald-600 dark:text-emerald-400';
      case 'RISKY': return 'text-amber-600 dark:text-amber-400';
      case 'INVALID': return 'text-rose-600 dark:text-rose-500';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusBg = (v: string) => {
    switch (v) {
      case 'SAFE': return 'bg-emerald-500/10 border-emerald-500/25';
      case 'RISKY': return 'bg-amber-400/15 dark:bg-amber-400/20 border-amber-500/30 dark:border-amber-400/30';
      case 'INVALID': return 'bg-rose-500/15 dark:bg-rose-500/20 border-rose-500/30';
      default: return 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10';
    }
  };

  return (
    <section className="mb-12 sm:mb-16">
      {/* Real-Time Inbox Checker (RFC 5321 Port 25 + Catch-All probe runs quietly via Actions runners) */}
      <div className="flex items-center gap-4 sm:gap-5 mb-7 sm:mb-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl gradient-surface flex items-center justify-center border border-brand-blue/25 shadow-sm shrink-0">
          <Zap className="w-6 h-6 text-brand-blue" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-app-text tracking-tight leading-tight">
            Instant Email Checker
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            V14 Real-Time Mailbox Check
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-5">
          <GlossyCard className="p-5 sm:p-7 rounded-3xl">
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label
                  htmlFor="single-email-input"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block"
                >
                  Email address to verify
                </label>
                {/* Double-bezel input housing */}
                <div className="p-1 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-app-border">
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                    <input
                      id="single-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@company.com"
                      aria-label="Email address to verify"
                      className="w-full bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/10 rounded-xl h-13 sm:h-14 pl-10 pr-9 text-sm font-medium text-app-text placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/15 transition-all"
                    />
                    {email.length > 0 && !isVerifying && (
                      <button
                        type="button"
                        onClick={() => { setEmail(''); setResult(null); setErrorMsg(null); }}
                        aria-label="Clear email address"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-app-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <MagneticButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isVerifying || !email.includes('@')}
                className="w-full group"
              >
                {isVerifying ? (
                  <div className="flex gap-1.5 items-center" aria-label="Checking mailbox">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-center pl-4">Check Email Now</span>
                    <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-105">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </>
                )}
              </MagneticButton>
            </form>

            {/* Technical note: executes RFC 5321 HELO -> MAIL FROM -> RCPT TO + catch-all probe without delivering a message */}
            <div className="mt-5 p-4 bg-slate-50/90 dark:bg-white/[0.025] rounded-2xl border border-app-border">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Checks the inbox directly with the recipient mail server to confirm it exists. Invisible to the recipient, with zero email sent.
                </p>
              </div>
            </div>
          </GlossyCard>
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {errorMsg && !isVerifying && !result ? (
              <motion.div
                key="single-error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
                className="h-full min-h-[280px] flex items-center justify-center border border-dashed border-amber-500/40 bg-amber-500/5 rounded-3xl p-6 sm:p-8"
              >
                <div className="text-center max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mx-auto mb-4 shadow-sm">
                    <ShieldAlert className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-semibold">{errorMsg}</p>
                </div>
              </motion.div>
            ) : !result && !isVerifying ? (
              <motion.div
                key="single-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full min-h-[280px] flex items-center justify-center border border-dashed border-app-border rounded-3xl p-6 bg-slate-50/40 dark:bg-white/[0.015]"
              >
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 mx-auto">
                    <Search className="w-6 h-6 text-brand-blue" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
                    Enter any email to check deliverability
                  </p>
                </div>
              </motion.div>
            ) : isVerifying ? (
              <motion.div
                key="single-pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EDITORIAL_EASE }}
                className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 sm:p-8 bg-app-card/85 rounded-3xl gradient-border text-center relative overflow-hidden"
              >
                <div className="relative mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-brand-blue/25 border-t-[#02FEDC] border-r-[#F502FD]"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-9 h-9 rounded-xl gradient-cta flex items-center justify-center text-white shadow-md">
                      <Zap className="w-4.5 h-4.5 fill-white animate-pulse" />
                    </div>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-display font-bold text-app-text mb-1.5">
                  Checking inbox deliverability...
                </h3>
                <p className="text-xs gradient-text font-mono font-bold mb-4 tabular-nums">
                  Elapsed: {formatTime(elapsedSeconds)}
                </p>

                {/* GPU animated live signal sweep */}
                <div className="w-full max-w-xs h-1.5 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden mb-5">
                  <motion.div
                    className="h-full w-1/2 rounded-full gradient-bg"
                    initial={{ x: '-100%' }}
                    animate={{ x: ['-100%', '220%'] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                {/* Technical: 1. Dispatch GH Actions runner -> 2. Port 25 RCPT probe -> 3. Catch-all probe */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-5 text-[11px] font-medium">
                  <span className="px-3 py-1 rounded-full gradient-surface text-app-text border border-brand-blue/30">
                    1. Checking Domain
                  </span>
                  <span className={cn(
                    'px-3 py-1 rounded-full border transition-colors',
                    elapsedSeconds >= 4
                      ? 'gradient-surface text-app-text border-brand-blue/30'
                      : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                  )}>
                    2. Contacting Mail Server
                  </span>
                  <span className={cn(
                    'px-3 py-1 rounded-full border transition-colors',
                    elapsedSeconds >= 10
                      ? 'gradient-surface text-app-text border-brand-blue/30'
                      : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                  )}>
                    3. Catch-All Check
                  </span>
                </div>
                <div className="max-w-md mx-auto px-4 py-3 gradient-surface rounded-2xl border border-brand-blue/20">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Waiting for live mail server response. Verdicts come directly from the engine, never guessed.
                  </p>
                </div>
              </motion.div>
            ) : result && (
              <StaggerGroup key="single-result" className="space-y-4 sm:space-y-5" staggerDelay={0.06}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <StaggerItem>
                    <GlossyCard className="p-5 sm:p-6 rounded-3xl overflow-hidden relative h-full">
                      <div className={cn(
                        'absolute top-0 right-0 w-28 h-28 blur-[70px] -mr-12 -mt-12 opacity-25 transition-all pointer-events-none',
                        verdict === 'SAFE' ? 'bg-emerald-500' :
                        verdict === 'RISKY' ? 'bg-amber-400' :
                        verdict === 'INVALID' ? 'bg-rose-500' : 'bg-slate-500'
                      )} />
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2 relative z-10">Verdict</p>
                      <div className={cn(
                        'text-2xl sm:text-3xl font-display font-bold tracking-tight relative z-10 leading-none pr-2',
                        getStatusColor(verdict)
                      )}>
                        {verdict}
                      </div>
                    </GlossyCard>
                  </StaggerItem>

                  <StaggerItem>
                    <GlossyCard className="p-5 sm:p-6 rounded-3xl h-full">
                      {/* Technical: smtpValid = Port 25 TCP/SMTP handshake connected */}
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">Mail Server</p>
                      <div className={cn(
                        'text-lg sm:text-xl font-display font-bold tracking-tight leading-snug',
                        result.smtpValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                      )}>
                        {result.smtpValid ? 'Connected Live' : 'Could Not Reach Server'}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">
                        {result.isCatchAll ? 'Accept-All Domain: Yes (Risky)' : 'Accept-All Domain: No'}
                      </p>
                    </GlossyCard>
                  </StaggerItem>
                </div>

                <StaggerItem>
                  <GlossyCard className="p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border-app-border gap-4">
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0',
                        getStatusBg(verdict)
                      )}>
                        {verdict === 'SAFE' ? (
                          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        ) : verdict === 'RISKY' ? (
                          <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        ) : verdict === 'UNKNOWN' ? (
                          <HelpCircle className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        ) : (
                          <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Why This Verdict</p>
                        <h4 className="text-sm font-semibold text-app-text break-words">{result.verificationReason || result.ui_reason || 'Verified'}</h4>
                      </div>
                    </div>
                  </GlossyCard>
                </StaggerItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <StaggerItem>
                    <GlossyCard className="p-5 sm:p-6 rounded-3xl h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-slate-500" />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Domain Setup</span>
                      </div>
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Mail Host</span>
                            <p className={cn('text-xs font-bold', result.mxRecordFound ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500')}>
                              {result.mxRecordFound ? 'ACTIVE' : 'MISSING'}
                            </p>
                          </div>
                          {result.mxRecordFound && <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all">{result.mxRecord}</p>}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Email Provider</span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{result.isFreeEmail ? 'Personal Mailbox' : 'Custom Domain'}</span>
                          </div>
                          <p className="text-xs font-bold text-app-text">{result.provider || 'Unknown'}</p>
                        </div>
                        <div className="flex justify-between items-center gap-2 pt-0.5">
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Sender Auth (SPF)</span>
                          <p className={cn('text-xs font-bold', result.spfExists ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400')}>
                            {result.spfExists ? 'Configured' : 'Not Listed'}
                          </p>
                        </div>
                      </div>
                    </GlossyCard>
                  </StaggerItem>

                  <StaggerItem>
                    <GlossyCard className="p-5 sm:p-6 rounded-3xl h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-slate-500" />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Inbox Signals</span>
                      </div>
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Bounce Risk</span>
                          <span className={cn(
                            'text-xs font-bold',
                            verdict === 'SAFE' ? 'text-emerald-600 dark:text-emerald-400' :
                            verdict === 'RISKY' ? 'text-amber-600 dark:text-amber-400' :
                            verdict === 'INVALID' ? 'text-rose-600 dark:text-rose-500' : 'text-slate-600 dark:text-slate-400'
                          )}>
                            {result.bounceRisk || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Accept-All</span>
                          <span className={cn('text-xs font-bold', result.isCatchAll ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400')}>
                            {result.isCatchAll ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Inbox Type</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {result.isDisposable ? 'Disposable' : result.isRoleBased ? 'Team / Role' : 'Standard'}
                          </span>
                        </div>
                      </div>
                    </GlossyCard>
                  </StaggerItem>
                </div>
              </StaggerGroup>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
