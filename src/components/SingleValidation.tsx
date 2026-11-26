import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldCheck, ShieldAlert, Zap, Activity, Globe, Info, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';
import { ProcessedContact } from '../types';

export function SingleValidation() {
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<Partial<ProcessedContact> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setElapsedSeconds(s => s + 1);
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
          await new Promise(r => setTimeout(r, 6000));

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
      setErrorMsg('STILL CHECKING / TIMED OUT — re-run to complete');
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
      case 'SAFE': return 'text-emerald-600 dark:text-emerald-400 drop-shadow-sm';
      case 'RISKY': return 'text-amber-600 dark:text-amber-400 drop-shadow-sm';
      case 'INVALID': return 'text-rose-600 dark:text-rose-500 drop-shadow-sm';
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
    <section className="mb-12 sm:mb-20">
      {/* Real-Time Inbox Checker (RFC 5321 Port 25 + Catch-All check handled silently behind the scenes) */}
      <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[24px] bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 shadow-lg shrink-0">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-brand-blue" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-app-text uppercase italic tracking-tighter leading-tight">
            Instant Email Checker
          </h2>
          <p className="text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest mt-2 italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shrink-0" />
            V17 Real-Time Mailbox Check
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-5">
          <GlossyCard className="p-5 sm:p-8 rounded-3xl">
            <form onSubmit={handleVerify} className="space-y-5 sm:space-y-6">
              <div>
                <label
                  htmlFor="single-email-input"
                  className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest italic mb-2.5 block"
                >
                  Email Address to Verify
                </label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                  <input
                    id="single-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@company.com"
                    aria-label="Email Address to Verify"
                    className="w-full bg-slate-50/90 dark:bg-app-bg/40 border border-slate-200 dark:border-app-border rounded-2xl h-14 sm:h-16 pl-11 pr-11 text-sm font-bold text-app-text placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/15 transition-all shadow-sm"
                  />
                  {email.length > 0 && !isVerifying && (
                    <button
                      type="button"
                      onClick={() => { setEmail(''); setResult(null); setErrorMsg(null); }}
                      aria-label="Clear email address"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-app-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !email.includes('@')}
                className="w-full h-14 sm:h-16 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-pink hover:brightness-105 text-white font-black uppercase italic tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-brand-blue/20 hover:shadow-brand-blue/40 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
              >
                {isVerifying ? (
                  <div className="flex gap-1.5 items-center" aria-label="Verifying mailbox">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Check Email Now
                  </>
                )}
              </button>
            </form>

            {/* Technical note: executes RFC 5321 HELO -> MAIL FROM -> RCPT TO + catch-all probe without delivering a message */}
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-brand-blue/5 dark:bg-app-bg/10 rounded-2xl border border-brand-blue/15 dark:border-app-border">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                  Checks the inbox directly with the recipient&apos;s mail server to confirm it exists—completely invisible to the recipient, with zero email sent.
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[280px] flex items-center justify-center border-2 border-dashed border-amber-500/40 bg-amber-500/5 rounded-3xl sm:rounded-[40px] p-6 sm:p-8"
              >
                <div className="text-center max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mx-auto mb-5 shadow-sm">
                    <ShieldAlert className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                  </div>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 font-black uppercase tracking-wider">{errorMsg}</p>
                </div>
              </motion.div>
            ) : !result && !isVerifying ? (
              <motion.div
                key="single-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[280px] flex items-center justify-center border-2 border-dashed border-app-border rounded-3xl sm:rounded-[40px] p-6"
              >
                <div className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 mx-auto mb-5 shadow-sm">
                    <Search className="w-7 h-7 text-brand-blue" />
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-[0.3em] italic">Enter any email to check deliverability</p>
                </div>
              </motion.div>
            ) : isVerifying ? (
              <motion.div
                key="single-pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 sm:p-8 bg-app-card/50 rounded-3xl sm:rounded-[40px] border border-app-border text-center"
              >
                <div className="relative mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-brand-blue/20 border-t-brand-blue shadow-lg shadow-brand-blue/10"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Zap className="w-6 h-6 text-brand-blue animate-pulse" />
                  </div>
                </div>

                <h3 className="text-xs sm:text-base font-black text-app-text uppercase tracking-wider italic mb-2">
                  Checking inbox deliverability...
                </h3>
                <p className="text-[11px] text-brand-blue font-mono font-bold tracking-widest uppercase mb-4 tabular-nums">
                  Elapsed: {formatTime(elapsedSeconds)}
                </p>
                {/* Technical: 1. Dispatch GH Actions runner -> 2. Port 25 RCPT probe -> 3. Catch-all probe */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-5 text-[9px] font-black uppercase tracking-widest">
                  <span className="px-2.5 py-1 rounded-full bg-brand-blue/15 text-brand-blue border border-brand-blue/25">1. Checking Domain</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">2. Contacting Mail Server</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">3. Catch-All Check</span>
                </div>
                <div className="max-w-md mx-auto p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/15">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                    Waiting for live mail server response. Verdicts come straight from the engine—never guessed.
                  </p>
                </div>
              </motion.div>
            ) : result && (
              <motion.div
                key="single-result"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5 sm:space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <GlossyCard className="p-5 sm:p-6 rounded-3xl overflow-hidden relative group">
                    <div className={cn(
                      'absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-30 transition-all',
                      verdict === 'SAFE' ? 'bg-emerald-500' :
                      verdict === 'RISKY' ? 'bg-amber-400' :
                      verdict === 'INVALID' ? 'bg-rose-500' : 'bg-slate-500'
                    )} />
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest italic mb-2 relative z-10">Verdict</p>
                    <div className={cn(
                      'text-2xl sm:text-3xl font-black uppercase italic tracking-tight relative z-10 leading-none pr-3',
                      getStatusColor(verdict)
                    )}>
                      {verdict}
                    </div>
                  </GlossyCard>

                  <GlossyCard className="p-5 sm:p-6 rounded-3xl">
                    {/* Technical: smtpValid = Port 25 TCP/SMTP handshake connected */}
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest italic mb-2">Mail Server</p>
                    <div className={cn(
                      'text-lg sm:text-xl font-black uppercase tracking-tight leading-snug',
                      result.smtpValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                    )}>
                      {result.smtpValid ? 'Connected Live' : 'Could Not Reach Server'}
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1.5">
                      {result.isCatchAll ? 'Accept-All Domain: Yes (Risky)' : 'Accept-All Domain: No'}
                    </p>
                  </GlossyCard>
                </div>

                <GlossyCard glow="gradient" className="p-5 sm:p-7 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border-app-border gap-4">
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                    <div className={cn(
                      'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border shrink-0',
                      getStatusBg(verdict)
                    )}>
                      {verdict === 'SAFE' ? (
                        <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400" />
                      ) : verdict === 'RISKY' ? (
                        <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-400" />
                      ) : verdict === 'UNKNOWN' ? (
                        <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 dark:text-rose-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest italic mb-1">Why This Verdict</p>
                      <h4 className="text-xs sm:text-sm font-bold text-app-text break-words">{result.verificationReason || result.ui_reason || 'Verified'}</h4>
                    </div>
                  </div>
                </GlossyCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-5 sm:p-6 bg-app-card/60 rounded-3xl border border-app-border">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="text-[9px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Domain Setup</span>
                    </div>
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Mail Host</span>
                          <p className={cn('text-[10px] font-black', result.mxRecordFound ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500')}>
                            {result.mxRecordFound ? 'ACTIVE' : 'MISSING'}
                          </p>
                        </div>
                        {result.mxRecordFound && <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono break-all">{result.mxRecord}</p>}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Email Provider</span>
                          <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">{result.isFreeEmail ? 'Personal Mailbox' : 'Custom Domain'}</span>
                        </div>
                        <p className="text-xs font-black text-app-text">{result.provider || 'Unknown'}</p>
                      </div>
                      <div className="flex justify-between items-center gap-2 pt-0.5">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Sender Auth (SPF)</span>
                        <p className={cn('text-[10px] font-black uppercase', result.spfExists ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400')}>
                          {result.spfExists ? 'Configured' : 'Not Listed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 bg-app-card/60 rounded-3xl border border-app-border">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Activity className="w-4 h-4 text-slate-500" />
                      <span className="text-[9px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Inbox Signals</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Bounce Risk</span>
                        <span className={cn(
                          'text-[10px] font-black uppercase',
                          verdict === 'SAFE' ? 'text-emerald-600 dark:text-emerald-400' :
                          verdict === 'RISKY' ? 'text-amber-600 dark:text-amber-400' :
                          verdict === 'INVALID' ? 'text-rose-600 dark:text-rose-500' : 'text-slate-600 dark:text-slate-400'
                        )}>
                          {result.bounceRisk || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Accept-All</span>
                        <span className={cn('text-[10px] font-black uppercase', result.isCatchAll ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400')}>
                          {result.isCatchAll ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Inbox Type</span>
                        <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                          {result.isDisposable ? 'Disposable' : result.isRoleBased ? 'Team / Role' : 'Standard'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
