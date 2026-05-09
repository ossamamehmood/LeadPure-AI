import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldCheck, ShieldAlert, Zap, Activity, Globe, Info, CornerDownRight } from 'lucide-react';
import { GlossyCard } from './ui/GlossyCard';
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
      // Use default options for single verification
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
      case 'verified': return 'bg-gradient-to-r from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] bg-clip-text text-transparent shadow-[0_0_20px_rgba(90,92,255,0.4)]';
      case 'risky': return 'text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]';
      case 'rejected':
      case 'blocked': return 'text-brand-pink shadow-[0_0_20px_rgba(245,2,253,0.4)]';
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (status: string | undefined) => {
    switch (status) {
      case 'verified': return 'bg-brand-blue/10 border-brand-blue/20';
      case 'risky': return 'bg-amber-400/20 border-amber-400/30';
      case 'rejected':
      case 'blocked': return 'bg-brand-pink/20 border-brand-pink/30';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <section className="mb-20">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-16 h-16 rounded-[24px] bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 shadow-[0_0_20px_rgba(90,92,255,0.1)] group transition-all duration-700 hover:border-brand-blue/40">
          <Zap className="w-8 h-8 text-brand-blue transition-transform group-hover:scale-110 duration-500" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-app-text uppercase italic tracking-tighter leading-none transition-colors duration-500">Neural Identity Scan</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-3 italic flex items-center gap-3">
            <span className="w-2 h-2 rounded-full gradient-bg animate-pulse shadow-[0_0_8px_#5A5CFF]" />
            Direct Validation Protocol Active
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
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-brand-blue transition-colors" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER EMAIL ADDRESS..."
                    className="w-full bg-app-bg/40 border border-app-border rounded-2xl h-16 pl-14 pr-6 text-[13px] font-black text-app-text placeholder:text-slate-500 outline-none focus:border-brand-blue/30 transition-all uppercase tracking-[0.2em] italic"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isVerifying || !email.includes('@')}
                className="w-full h-16 bg-gradient-to-r from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] hover:brightness-110 text-black font-black uppercase italic tracking-widest text-xs rounded-2xl transition-all shadow-[0_10px_40px_rgba(90,92,255,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 active:scale-95"
              >
                {isVerifying ? (
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Inspect Identity
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-6 bg-app-bg/10 rounded-2xl border border-app-border">
              <div className="flex items-start gap-4">
                <Info className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic leading-relaxed">
                  Real-time SMTP handshake and heuristic intelligence will be applied to the target mailbox without sending an actual email.
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
                  <div className="w-16 h-16 rounded-3xl bg-app-bg/10 flex items-center justify-center border border-app-border mx-auto mb-6">
                    <Search className="w-8 h-8 text-slate-800" />
                  </div>
                  <p className="text-[10px] text-slate-700 font-extrabold uppercase tracking-[0.4em] italic">Awaiting Target Input</p>
                </div>
              </motion.div>
            ) : isVerifying ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[300px] flex items-center justify-center"
              >
                <div className="text-center relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-32 rounded-full border-t-2 border-brand-blue/50 shadow-[0_0_20px_rgba(90,92,255,0.2)]"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-brand-blue font-black uppercase tracking-[0.3em] animate-pulse">Scanning</p>
                  </div>
                </div>
              </motion.div>
            ) : result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <GlossyCard className="p-8 border-none overflow-hidden relative group">
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-30 transition-all ${
                      result.verificationStatus === 'verified' ? 'bg-brand-blue' : 
                      result.verificationStatus === 'risky' ? 'bg-amber-400' : 'bg-brand-pink'
                    }`} />
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic mb-2 relative z-10">Verification Status</p>
                    <div className={`text-4xl font-black uppercase italic tracking-tighter relative z-10 leading-none ${getStatusColor(result.verificationStatus)}`}>
                      {result.verificationStatus}
                    </div>
                  </GlossyCard>

                  <GlossyCard className="p-8 border-none">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic mb-2">Confidence Score</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-app-text font-mono tracking-tighter leading-none transition-colors duration-500">{result.confidenceScore}</span>
                       <span className="text-xs text-slate-700 font-black tracking-widest">/100</span>
                    </div>
                  </GlossyCard>
                </div>

                <GlossyCard glow="gradient" className="p-8 flex items-center justify-between border-app-border hover:border-brand-blue/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${getStatusBg(result.verificationStatus)}`}>
                      {result.verificationStatus === 'verified' ? <ShieldCheck className="w-7 h-7 text-brand-blue" /> : <ShieldAlert className="w-7 h-7 text-amber-400" />}
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
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Infrastucture</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">MX Host</span>
                        <div className="text-right">
                          <p className={`text-[10px] font-black ${result.mxRecordFound ? 'text-brand-blue shadow-[0_0_10px_rgba(90,92,255,0.4)]' : 'text-brand-pink'}`}>
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
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Legacy</span>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-brand-blue uppercase">{result.domainAge}</p>
                          <p className="text-[8px] text-slate-500 font-mono mt-0.5">{result.domainAgeDays} Days Registered</p>
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
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Sub-Status</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          result.verificationStatus === 'verified' ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue' : 
                          result.verificationStatus === 'risky' ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' : 
                          'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
                        }`}>
                          {result.subStatus || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Bounce Risk</span>
                        <span className={`text-[10px] font-black uppercase ${
                          result.bounceRisk === 'Safe' ? 'text-brand-blue' : 
                          result.bounceRisk === 'Medium' ? 'text-amber-400' : 'text-brand-pink'
                        }`}>
                          {result.bounceRisk}
                        </span>
                      </div>
                      <div className="flex justify-between items-center group/item hover:bg-app-bg/10 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Security</span>
                        <div className="flex gap-2">
                          <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${result.spfExists ? 'bg-brand-blue/20 text-brand-blue' : 'bg-app-bg/10 text-slate-700 border border-app-border'}`}>SPF</div>
                          <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${result.dkimExists ? 'bg-brand-blue/20 text-brand-blue' : 'bg-app-bg/10 text-slate-700 border border-app-border'}`}>DKIM</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 px-6 py-4 bg-app-bg/40 rounded-2xl border border-app-border">
                    <div className={`w-2 h-2 rounded-full ${result.isDisposable ? 'bg-brand-pink shadow-[0_0_10px_rgba(255,51,102,0.4)]' : 'bg-slate-800'}`} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Disposable</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 bg-app-bg/40 rounded-2xl border border-app-border">
                    <div className={`w-2 h-2 rounded-full ${result.isCatchAll ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-slate-800'}`} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Catch-All</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 bg-app-bg/40 rounded-2xl border border-app-border">
                    <div className={`w-2 h-2 rounded-full ${result.isRoleBased ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.4)]' : 'bg-slate-800'}`} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Role-Based</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 bg-app-bg/40 rounded-2xl border border-app-border">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] shadow-[0_0_10px_rgba(90,92,255,0.4)]" />
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