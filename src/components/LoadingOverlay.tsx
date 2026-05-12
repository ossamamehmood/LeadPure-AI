import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface LoadingOverlayProps {
  progress: number;
  estimatedSeconds: number | null;
  onCancel?: () => void;
  customText?: string;
  customDescription?: string;
  logs?: string;
}

export function LoadingOverlay({ progress, estimatedSeconds, onCancel, customText, customDescription, logs }: LoadingOverlayProps) {
  const terminalRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-app-bg/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-app-border"></div>
        <div className="absolute inset-0 rounded-full border-t-2 border-brand-blue/30 animate-spin"></div>
        <div className="absolute inset-4 rounded-full border border-app-border border-b-2 border-b-[#F502FD] animate-[spin_3s_linear_infinite_reverse]"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <RefreshCw className="w-10 h-10 gradient-text animate-pulse mb-1" />
        </div>
      </div>
      
      <h2 className="text-3xl font-black text-app-text mb-2 uppercase italic tracking-tighter">{customText || "Optimization Engine Active"}</h2>
      <p className="text-slate-500 max-w-md text-xs font-medium uppercase tracking-widest leading-loose">
        {customDescription || "Running validation and scrubbing high-bounce emails."}
      </p>
      
      {onCancel && (
        <button 
          onClick={onCancel}
          className="mt-4 px-6 py-2 bg-brand-pink/10 hover:bg-brand-pink/20 text-brand-pink border border-brand-pink/30 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Cancel Processing
        </button>
      )}

      {logs !== undefined && (
        <div className="w-full max-w-2xl mt-8 bg-[#0B0C10] border border-app-border rounded-lg overflow-hidden text-left flex flex-col shadow-2xl">
          <div className="bg-[#1C1E26] px-4 py-2 border-b border-app-border flex items-center justify-between">
             <span className="text-[10px] font-bold tracking-widest text-brand-blue uppercase flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse"></span> Live Verification Logs
             </span>
          </div>
          <div 
            ref={terminalRef}
            className="p-4 h-48 overflow-y-auto font-mono text-[11px] text-green-400 whitespace-pre-wrap leading-relaxed scrollbar-hide"
            style={{ textShadow: '0 0 5px rgba(74, 222, 128, 0.2)' }}
          >
            {logs || 'Engine starting...'}
          </div>
        </div>
      )}
      
      <div className="w-full max-w-2xl mt-8 space-y-4">
        <div className="flex justify-between items-end mb-2">
          <div className="text-left">
            <p className="text-[10px] font-black gradient-text uppercase tracking-[0.3em]">Processing Queue</p>
            <p className="text-4xl font-black text-app-text font-mono tracking-tighter mt-1">{progress}%</p>
          </div>
          {estimatedSeconds !== null && (
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Estimated Completion</p>
              <p className="text-xl font-black text-app-text font-mono tracking-tighter mt-1">
                {estimatedSeconds < 60 
                  ? `${estimatedSeconds}s` 
                  : `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`}
              </p>
            </div>
          )}
        </div>
        
        <div className="h-2 w-full bg-app-bg/10 rounded-full overflow-hidden relative border border-app-border">
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
