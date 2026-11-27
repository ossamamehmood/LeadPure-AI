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
  emailsDone?: number;
  emailsTotal?: number;
  chunksDone?: number;
  chunksTotal?: number;
}

export function LoadingOverlay({
  progress,
  estimatedSeconds,
  onCancel,
  customText,
  customDescription,
  logs,
  emailsDone,
  emailsTotal,
  chunksDone,
  chunksTotal
}: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-app-bg/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-5 sm:p-8 text-center overflow-y-auto"
    >
      <div className="relative w-32 h-32 sm:w-44 sm:h-44 mb-8">
        <div className="absolute inset-0 rounded-full border border-app-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#02FEDC] border-r-[#5A5CFF] animate-spin" />
        <div className="absolute inset-3.5 rounded-full border-2 border-transparent border-b-[#F502FD] border-l-[#5A5CFF] animate-[spin_2.6s_linear_infinite_reverse]" />
        <div className="absolute inset-7 rounded-full gradient-surface border border-brand-blue/25 flex flex-col items-center justify-center shadow-lg">
          <RefreshCw className="w-7 h-7 sm:w-9 sm:h-9 text-brand-blue animate-spin [animation-duration:4s] mb-1" />
          <span className="text-[10px] font-display font-bold gradient-text tracking-wide">LeadPure</span>
        </div>
      </div>

      <h2 className="text-2xl sm:text-4xl font-display font-bold text-app-text mb-2 tracking-tight">
        {customText || 'Cleaning Your Lead List'}
      </h2>
      <p className="text-slate-500 max-w-md text-xs sm:text-sm font-medium leading-relaxed">
        {/* Technical note: dispatches 100-email batches to Port 25 workers (max 3 concurrent runs) */}
        {customDescription || 'Checking mailboxes directly with recipient mail servers in parallel batches.'}
      </p>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-5 px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
        >
          Stop Scan
        </button>
      )}

      <div className="w-full max-w-xl mt-10 space-y-5">
        <div className="flex justify-between items-end gap-4">
          <div className="text-left">
            <p className="text-[10px] font-black gradient-text uppercase tracking-[0.25em]">
              {typeof chunksTotal === 'number' && chunksTotal > 0
                ? `Batch ${chunksDone ?? 0}/${chunksTotal} • ${emailsDone ?? 0}/${emailsTotal ?? 0} Emails Checked`
                : 'Scan Progress'}
            </p>
            <p className="text-4xl sm:text-5xl font-black text-app-text font-mono tracking-tighter mt-1">{progress}%</p>
          </div>
          {estimatedSeconds !== null && (
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Estimated Remaining</p>
              <p className="text-xl sm:text-2xl font-black text-app-text font-mono tracking-tighter mt-1">
                {estimatedSeconds < 60
                  ? `${estimatedSeconds}s`
                  : `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`}
              </p>
            </div>
          )}
        </div>

        <div className="h-3 w-full bg-app-bg/10 rounded-full overflow-hidden relative border border-app-border">
          <motion.div
            className="h-full w-full gradient-bg rounded-full relative"
            style={{ transformOrigin: 'left' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0, Math.min(1, progress / 100)) }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>

        {logs && logs.length > 0 && (
          <div className="mt-6 text-left bg-[#020202] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-8 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between px-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/30" />
                <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
              </div>
              <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-slate-500 font-mono">Live Engine Output</span>
            </div>

            <div className="p-4 sm:p-5 h-36 overflow-y-auto font-mono text-[10px] leading-relaxed flex flex-col justify-end space-y-1.5 scrollbar-hide">
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-400 break-words">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
