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

        {logs && logs.length > 0 && (
          <div className="mt-8 text-left bg-[#020202] border border-white/5 rounded-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] group">
            {/* Terminal Chrome */}
            <div className="h-8 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between px-5">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600 font-mono">LeadPure v10 Secure Kernel</span>
            </div>
            
            {/* Terminal Body */}
            <div className="relative p-6">
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10 opacity-20" />
              
              <div className="h-40 overflow-y-auto font-mono text-[10px] leading-relaxed flex flex-col justify-end space-y-2 scrollbar-hide relative z-0">
                {logs.map((log, idx) => {
                  const isSafe = log.includes('SAFE') || log.includes('SECURED');
                  const isDangerous = log.includes('DANGEROUS') || log.includes('REJECTED') || log.includes('FILTERED');
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx} 
                      className="flex items-start gap-3"
                    >
                      <span className="text-slate-800 shrink-0 select-none">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      <div 
                        className={cn(
                          "font-black uppercase tracking-wider transition-all duration-300",
                          isSafe ? "bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(2,254,220,0.3)]" :
                          isDangerous ? "bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(245,2,253,0.3)]" :
                          "text-slate-500"
                        )}
                      >
                        {log}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
} 
