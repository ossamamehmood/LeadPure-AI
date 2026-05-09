import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface LoadingOverlayProps {
  progress: number;
  estimatedSeconds: number | null;
}

export function LoadingOverlay({ progress, estimatedSeconds }: LoadingOverlayProps) {
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
      
      <h2 className="text-4xl font-black text-app-text mb-3 uppercase italic tracking-tighter">Optimization Engine Active</h2>
      <p className="text-slate-500 max-w-md text-sm font-medium uppercase tracking-widest leading-loose">Running 10-point validation check: formatting names, verifying phone E.164 status, and scrubbing high-bounce emails.</p>
      
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
      </div>
    </motion.div>
  );
}
