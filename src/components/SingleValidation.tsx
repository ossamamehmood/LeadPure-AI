import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldCheck, ShieldAlert, Zap, Globe, Info, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { verifyEmail } from '../utils/processor';
import { ProcessedContact } from '../types';

export function SingleValidation() {
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<Partial<ProcessedContact> | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setIsVerifying(true);
    setResult(null);
    
    try {
      const res = await verifyEmail(email, {
        excludeDisposable: false,
        excludeRoleBased: false,
        excludeCatchAll: false,
        excludeSpamTraps: false
      });
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'verified': return 'text-emerald-500';
      case 'risky': return 'text-amber-500';
      case 'rejected':
      case 'blocked': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusBg = (status: string | undefined) => {
    switch (status) {
      case 'verified': return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20';
      case 'risky': return 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20';
      case 'rejected':
      case 'blocked': return 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20';
      default: return 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case 'risky': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'rejected':
      case 'blocked': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Info className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <section className="mb-20 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
          <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Single Verification</h2>
          <p className="text-sm text-slate-500 mt-1">
            Test our verification engine in real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-800 border border-border-color shadow-sm p-6 rounded-2xl">
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">Email Address</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-white dark:bg-slate-900 border border-border-color rounded-xl h-12 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isVerifying || !email.includes('@')}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border-color">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Real-time SMTP handshake and heuristic intelligence will be applied to the target mailbox without sending an actual email.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!result && !isVerifying ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[300px] flex items-center justify-center border border-dashed border-border-color rounded-2xl bg-slate-50 dark:bg-slate-800/20"
              >
                <div className="text-center text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Awaiting email input</p>
                </div>
              </motion.div>
            ) : isVerifying ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[300px] flex items-center justify-center border border-border-color rounded-2xl bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="text-center text-indigo-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-sm font-medium">Scanning Infrastructure...</p>
                </div>
              </motion.div>
            ) : result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 border border-border-color shadow-sm p-6 rounded-2xl relative overflow-hidden">
                    <p className="text-xs text-slate-500 font-medium mb-1 relative z-10">Verification Status</p>
                    <div className={`text-2xl font-bold capitalize relative z-10 ${getStatusColor(result.verificationStatus)}`}>
                      {result.verificationStatus}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-border-color shadow-sm p-6 rounded-2xl">
                    <p className="text-xs text-slate-500 font-medium mb-1">Confidence Score</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-2xl font-bold text-slate-900 dark:text-white">{result.confidenceScore}</span>
                       <span className="text-sm text-slate-500">/100</span>
                    </div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center gap-4 ${getStatusBg(result.verificationStatus)}`}>
                  <div className="shrink-0 bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm">
                    {getStatusIcon(result.verificationStatus)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Intelligence Assessment</p>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{result.verificationReason}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 border border-border-color shadow-sm p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Infrastructure</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">MX Host</span>
                        <span className={`font-medium ${result.mxRecordFound ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                          {result.mxRecordFound ? 'Found' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Provider</span>
                        <span className="font-medium text-slate-900 dark:text-white capitalize">{result.provider || 'Custom'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Type</span>
                        <span className="font-medium text-slate-900 dark:text-white">{result.isFreeEmail ? 'Consumer' : 'Business'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-border-color shadow-sm p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Analysis</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Bounce Risk</span>
                        <span className={`font-medium ${
                          result.bounceRisk === 'Safe' ? 'text-emerald-500' : 
                          result.bounceRisk === 'Medium' ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {result.bounceRisk}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Sub-Status</span>
                        <span className="font-medium text-slate-900 dark:text-white capitalize">{result.subStatus || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Security</span>
                        <div className="flex gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${result.spfExists ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>SPF</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${result.dkimExists ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>DKIM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1 px-4 py-3 bg-white dark:bg-slate-800 border border-border-color shadow-sm rounded-xl">
                    <span className="text-[10px] font-medium text-slate-500 uppercase">Disposable</span>
                    <span className={`text-sm font-semibold ${result.isDisposable ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      {result.isDisposable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-3 bg-white dark:bg-slate-800 border border-border-color shadow-sm rounded-xl">
                    <span className="text-[10px] font-medium text-slate-500 uppercase">Catch-All</span>
                    <span className={`text-sm font-semibold ${result.isCatchAll ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                      {result.isCatchAll ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-3 bg-white dark:bg-slate-800 border border-border-color shadow-sm rounded-xl">
                    <span className="text-[10px] font-medium text-slate-500 uppercase">Role-Based</span>
                    <span className={`text-sm font-semibold ${result.isRoleBased ? 'text-indigo-500' : 'text-slate-900 dark:text-white'}`}>
                      {result.isRoleBased ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-3 bg-white dark:bg-slate-800 border border-border-color shadow-sm rounded-xl">
                    <span className="text-[10px] font-medium text-slate-500 uppercase">SMTP Valid</span>
                    <span className={`text-sm font-semibold ${result.smtpValid ? 'text-emerald-500' : (result.mxRecordFound ? 'text-amber-500' : 'text-red-500')}`}>
                      {result.smtpValid ? 'Yes' : (result.mxRecordFound ? 'Unknown' : 'No')}
                    </span>
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
