import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoadingOverlayProps {
  progress: number;
  estimatedSeconds: number | null;
  onCancel?: () => void;
  customText?: string;
  customDescription?: string;
  logs?: string[];
}

export function LoadingOverlay({ progress, estimatedSeconds, onCancel, customText, customDescription, logs }: LoadingOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-app-bg/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="relative w-48 h-48 mb-12">
        <div className="absolute inset-0 rounded-full border-2 border-app-border"></div>
        <div className="absolute inset-0 rounded-full border-t-2 border-brand-blue/30 animate-spin"></div>
        <div className="absolute inset-4 rounded-full border border-app-border border-b-2 border-b-[#F502FD] animate-[spin_3s_linear_infinite_reverse]"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <RefreshCw className="w-16 h-16 gradient-text animate-pulse mb-2" />
          <span className="text-[10px] font-black text-app-text italic tracking-widest uppercase">Optimizing</span>
        </div>
      </div>
      
      <h2 className="text-4xl font-black text-app-text mb-3 uppercase italic tracking-tighter">{customText || "Optimization Engine Active"}</h2>
      <p className="text-slate-500 max-w-md text-sm font-medium uppercase tracking-widest leading-loose">
        {customDescription || "Running 10-point validation check: formatting names, verifying phone E.164 status, and scrubbing high-bounce emails."}
      </p>
      
      {onCancel && (
        <button 
          onClick={onCancel}
          className="mt-6 px-6 py-2 bg-brand-pink/10 hover:bg-brand-pink/20 text-brand-pink border border-brand-pink/30 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Cancel Processing
        </button>
      )}
      
      <div className="w-full max-w-xl mt-16 space-y-6">
        <div className="flex justify-between items-end mb-4">
          <div className="text-left">
            <p className="text-[10px] font-black gradient-text uppercase tracking-[0.3em]">Processing Queue</p>
            <p className="text-5xl font-black text-app-text font-mono tracking-tighter mt-1">{progress}%</p>
          </div>
          {estimatedSeconds !== null && (
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Estimated Completion</p>
              <p className="text-2xl font-black text-app-text font-mono tracking-tighter mt-1">
                {estimatedSeconds < 60 
                  ? `${estimatedSeconds}s` 
                  : `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`}
              </p>
            </div>
          )}
        </div>
        
        <div className="h-3 w-full bg-app-bg/10 rounded-full overflow-hidden relative border border-app-border">
          <motion.div 
            className="h-full gradient-bg rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {logs && (
          <div className="max-w-2xl w-full mx-auto mt-20 relative group">
            {/* Terminal Container with Glassmorphism */}
            <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-700 group-hover:border-white/20">
              
              {/* Premium Terminal Header */}
              <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-[0_0_15px_rgba(255,95,87,0.4)]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEB12E] shadow-[0_0_15px_rgba(254,177,46,0.4)]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-[0_0_15px_rgba(40,200,64,0.4)]" />
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-pink bg-clip-text text-transparent font-mono animate-gradient-x">
                      LeadPure v12.0 // Deterministic_Active_Probe
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(2,254,220,0.5)]" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Kernel_Live</span>
                </div>
              </div>
              
              {/* Terminal Body */}
              <div className="relative p-8 min-h-[260px] max-h-[340px] overflow-hidden">
                {/* CRT Scanline & Grid Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[length:100%_2px,30px_30px,30px_30px] z-10 opacity-40" />
                
                {/* Interior Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(90,92,255,0.03)_0%,transparent_70%)] pointer-events-none" />

                <div className="h-full overflow-y-auto font-mono text-[10px] sm:text-[11px] leading-relaxed flex flex-col space-y-3.5 scrollbar-hide relative z-20">
                  {logs && logs.slice(-12).map((log, idx) => {
                    const isSafe = log.includes('SAFE') || log.includes('SECURED');
                    const isDangerous = log.includes('DANGEROUS') || log.includes('REJECTED') || log.includes('FILTERED');
                    const isSystem = log.includes('[PROTOCOL]') || log.includes('[ENGINE]');
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        key={idx} 
                        className="flex items-start gap-5 group/log"
                      >
                        <span className="text-zinc-600 shrink-0 select-none font-black opacity-40 group-hover/log:opacity-100 transition-opacity whitespace-nowrap">
                          {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <div className="flex-1">
                          <span 
                            className={cn(
                              "font-black tracking-wider uppercase drop-shadow-md",
                              isSafe ? "text-[#02FEDC] shadow-[#02FEDC]/20" :
                              isDangerous ? "text-[#F502FD] shadow-[#F502FD]/20" :
                              isSystem ? "text-brand-blue" :
                              "text-slate-400"
                            )}
                          >
                            {log}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-brand-cyan animate-pulse font-black">_</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
} 
