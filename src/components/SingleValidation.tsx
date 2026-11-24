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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = email.trim();
    if (!clean || !clean.includes('@')) return;
    
    setIsVerifying(true);
    setResult(null);
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
        setResult({
          email: clean,
          verificationStatus: 'unknown',
          verificationReason: initialData.ui_reason || 'Verification backend unreachable',
          subStatus: 'backend_error',
          confidenceScore: 40,
          bounceRisk: 'Unknown',
          reputationImpact: 'Unknown',
          mxRecordFound: false,
          isCatchAll: false,
          isDisposable: false,
          isRoleBased: false,
          isFreeEmail: false,
          provider: 'Unknown',
          smtpValid: false,
          syntaxValid: true,
          spfExists: false
        });
        setIsVerifying(false);
        return;
      }

      if (initialData.status === 'completed') {
        clearInterval(timer);
        setResult(initialData);
        setIsVerifying(false);
        return;
      }

      if (initialData.status === 'pending' && initialData.requestId) {
        const reqId = initialData.requestId;
        const startTime = Date.now();
        const maxWaitMs = 240000; // 4 minutes

        while (Date.now() - startTime < maxWaitMs) {
          await new Promise(r => setTimeout(r, 6000));
          
          try {
            const pollRes = await fetch(`/api/check?requestId=${encodeURIComponent(reqId)}`);
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.status === 'completed') {
                clearInterval(timer);
                setResult(pollData);
                setIsVerifying(false);
                return;
              }
            }
          } catch (pollErr) {
            console.warn('[POLL_ATTEMPT_ERR]', pollErr);
          }
        }
      }

      // Timeout or unknown fail-closed
      clearInterval(timer);
      setResult({
        email: clean,
        verificationStatus: 'unknown',
        verificationReason: 'Verification backend did not answer within timeout window',
        subStatus: 'timeout',
        confidenceScore: 40,
        bounceRisk: 'Unknown',
        reputationImpact: 'Unknown',
        mxRecordFound: false,
        isCatchAll: false,
        isDisposable: false,
        isRoleBased: false,
        isFreeEmail: false,
        provider: 'Unknown',
        smtpValid: false,
        syntaxValid: true,
        spfExists: false
      });
    } catch (err: any) {
      clearInterval(timer);
      console.error('[SINGLE_VERIFY_ERR]', err);
      setResult({
        email: clean,
        verificationStatus: 'unknown',
        verificationReason: `Verification probe failed: ${err.message || 'Network error'}`,
        subStatus: 'unreachable',
        confidenceScore: 40,
        bounceRisk: 'Unknown',
        reputationImpact: 'Unknown',
        mxRecordFound: false,
        isCatchAll: false,
        isDisposable: false,
        isRoleBased: false,
        isFreeEmail: false,
        provider: 'Unknown',
        smtpValid: false,
        syntaxValid: true,
        spfExists: false
      });
    } finally {
      clearInterval(timer);
      setIsVerifying(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'safe': return 'text-emerald-400 drop-shadow-sm';
      case 'risky': return 'text-amber-400 drop-shadow-sm';
      case 'rejected':
      case 'blocked':
      case 'invalid': return 'text-rose-500 drop-shadow-sm';
      case 'unknown':
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'safe': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'risky': return 'bg-amber-400/20 border-amber-400/30';
      case 'rejected':
      case 'blocked':
      case 'invalid': return 'bg-rose-500/20 border-rose-500/30';
      case 'unknown':
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <section className="mb-20">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-16 h-16 rounded-[24px] bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 shadow-lg group transition-all duration-700 hover:border-brand-blue/40">
          <Zap className="w-8 h-8 text-brand-blue transition-transform group-hover:scale-110 duration-500" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-app-text uppercase italic tracking-tighter leading-none transition-colors duration-500">Live Port 25 SMTP Prober</h2>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-3 italic flex items-center gap-2 md:gap-3">
            <span className="w-2 h-2 rounded-full gradient-bg animate-pulse shadow-sm" />
            Active Mailbox Handshake Protocol
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <GlossyCard className="p-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-3 block">Target Identity</label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER EMAIL ADDRESS..."
                    className="w-full bg-slate-50/80 dark:bg-app-bg/40 border border-slate-200 dark:border-app-border rounded-2xl h-16 pl-14 pr-6 text-[13px] font-black text-app-text placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/10 transition-all uppercase tracking-[0.2em] italic shadow-sm"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isVerifying || !email.includes('@')}
                className="w-full h-16 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-pink hover:brightness-105 text-white font-black uppercase italic tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-brand-blue/20 hover:shadow-brand-blue/40 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 active:scale-95 drop-shadow-sm cursor-pointer"
              >
                {isVerifying ? (
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Verify Mailbox (Port 25)
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-6 bg-brand-blue/5 dark:bg-app-bg/10 rounded-2xl border border-brand-blue/15 dark:border-app-border">
              <div className="flex items-start gap-4">
                <Info className="w-4 h-4 text-brand-blue mt-0.5 flex-shrink-0" />
                <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest italic leading-relaxed">
                  Real RFC 5321 SMTP handshake (EHLO → MAIL FROM → RCPT TO) executes on an open Port 25 runner to confirm target mailbox existence.
                </p>
              </div>
            </div>
          </GlossyCard>
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!result && !isVerifying ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-app-border rounded-[40px]"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-3xl bg-brand-blue/5 flex items-center justify-center border border-brand-blue/15 mx-auto mb-6 shadow-sm">
                    <Search className="w-8 h-8 text-brand-blue" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-[0.4em] italic">Awaiting Target Input</p>
                </div>
              </motion.div>
            ) : isVerifying ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[340px] flex flex-col items-center justify-center p-8 bg-app-bg/20 rounded-[40px] border border-app-border text-center"
              >
                <div className="relative mb-6">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-2 border-brand-blue/20 border-t-brand-blue shadow-lg shadow-brand-blue/10"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Zap className="w-7 h-7 text-brand-blue animate-pulse" />
                  </div>
                </div>

                <h3 className="text-sm md:text-base font-black text-app-text uppercase tracking-widest italic mb-2">
                  Checking — a real SMTP probe is running; this takes 1–3 minutes
                </h3>
                <p className="text-[11px] text-brand-blue font-mono font-bold tracking-widest uppercase mb-4">
                  Elapsed Time: {formatTime(elapsedSeconds)}
                </p>
                <div className="max-w-md mx-auto p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/15">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest italic leading-relaxed">
                    Executing live SMTP socket probe &amp; catch-all heuristic analysis via dedicated port 25 runner. No email is sent.
                  </p>
                </div>
              </motion.div>
            ) : result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <GlossyCard className="p-6 md:p-8 border-none overflow-hidden relative group">
                    <div className={cn(
                      "absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-30 transition-all",
                      (result.verificationStatus === 'verified' || result.verificationStatus === 'safe') ? 'bg-emerald-500' : 
                      result.verificationStatus === 'risky' ? 'bg-amber-400' : 'bg-rose-500'
                    )} />
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic mb-2 relative z-10">Verification Status</p>
                    <div className={cn(
                      "text-4xl font-black uppercase italic tracking-tighter relative z-10 leading-none",
                      getStatusColor(result.verificationStatus)
                    )}>
                      {result.verificationStatus}
                    </div>
                  </GlossyCard>

                  <GlossyCard className="p-6 md:p-8 border-none">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic mb-2">Confidence Score</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-app-text font-mono tracking-tighter leading-none transition-colors duration-500">{result.confidenceScore ?? '—'}</span>
                       <span className="text-xs text-slate-700 font-black tracking-widest">/100</span>
                    </div>
                  </GlossyCard>
                </div>

                <GlossyCard glow="gradient" className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between border-app-border hover:border-brand-blue/30 transition-all gap-6">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center border",
                      getStatusBg(result.verificationStatus)
                    )}>
                      {(result.verificationStatus === 'verified' || result.verificationStatus === 'safe') ? (
                        <ShieldCheck className="w-7 h-7 text-emerald-400" />
                      ) : result.verificationStatus === 'risky' ? (
                        <ShieldAlert className="w-7 h-7 text-amber-400" />
                      ) : result.verificationStatus === 'unknown' ? (
                        <HelpCircle className="w-7 h-7 text-slate-400" />
                      ) : (
                        <ShieldAlert className="w-7 h-7 text-rose-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic mb-1">Intelligence Assessment</p>
                      <h4 className="text-sm font-black text-app-text uppercase tracking-wider transition-colors duration-500">{result.verificationReason}</h4>
                    </div>
                  </div>
                </GlossyCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-app-bg/10 rounded-3xl border border-app-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Globe className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Infrastructure</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">MX Host</span>
                        <div className="text-right">
                          <p className={cn("text-[10px] font-black", result.mxRecordFound ? 'text-brand-blue shadow-sm' : 'text-brand-pink')}>
                            {result.mxRecordFound ? 'DETECTED' : 'MISSING'}
                          </p>
                          {result.mxRecordFound && <p className="text-[8px] text-slate-500 font-mono mt-0.5">{result.mxRecord}</p>}
                        </div>
                      </div>
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Provider</span>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-app-text uppercase">{result.provider || 'Independent'}</p>
                          <p className="text-[8px] text-slate-500 font-mono mt-0.5">{result.isFreeEmail ? 'Consumer Mailbox' : 'Commercial Node'}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Mail Security</span>
                        <div className="text-right">
                          <p className={cn("text-[10px] font-black uppercase", result.spfExists ? "text-emerald-500" : "text-amber-500")}>
                            {result.spfExists ? 'SPF Authenticated' : 'No SPF Record'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-app-bg/10 rounded-3xl border border-app-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="w-4 h-4 text-slate-500" />
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Validation Analysis</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">SMTP Connectivity</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                          result.smtpValid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        )}>
                          {result.smtpValid ? 'Port 25 Connected' : 'Blocked / Unreachable'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Bounce Risk</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase",
                          result.bounceRisk === 'Safe' ? 'text-emerald-400' : 
                          result.bounceRisk === 'Medium' ? 'text-amber-400' : 
                          result.bounceRisk === 'High' || result.bounceRisk === 'Dangerous' ? 'text-rose-500' : 'text-slate-400'
                        )}>
                          {result.bounceRisk}
                        </span>
                      </div>
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Domain Type</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase",
                          result.isCatchAll ? 'text-amber-400' : 'text-slate-400'
                        )}>
                          {result.isCatchAll ? 'Catch-All (Risky)' : 'Standard Domain'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="flex items-center gap-3 px-6 py-4 bg-app-bg/40 rounded-2xl border border-app-border">
                    <div className={cn("w-2.5 h-2.5 rounded-full", result.isDisposable ? 'bg-rose-500 shadow-lg' : 'bg-slate-800')} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Disposable</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 bg-app-bg/40 rounded-2xl border border-app-border">
                    <div className={cn("w-2.5 h-2.5 rounded-full", result.isCatchAll ? 'bg-amber-400 shadow-lg' : 'bg-slate-800')} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Catch-All</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 bg-app-bg/40 rounded-2xl border border-app-border">
                    <div className={cn("w-2.5 h-2.5 rounded-full", result.isRoleBased ? 'bg-blue-400 shadow-lg' : 'bg-slate-800')} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Role-Based</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 bg-app-bg/40 rounded-2xl border border-app-border">
                    <div className={cn("w-2.5 h-2.5 rounded-full", result.mxRecordFound ? 'bg-emerald-400 shadow-lg' : 'bg-rose-500 shadow-lg')} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MX Active</span>
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
