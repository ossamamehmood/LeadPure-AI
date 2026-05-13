import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Download, Trash2, FileText, ChevronRight, Database } from 'lucide-react';
import { HistoryItem } from '../types';
import { GlossyCard } from './ui/GlossyCard';
import { cn } from '../lib/utils';

interface HistorySectionProps {
  history: HistoryItem[];
  loadItem: (item: HistoryItem) => void;
  downloadItem: (item: HistoryItem) => void;
  clearHistory: () => void;
}

export function HistorySection({ history, loadItem, downloadItem, clearHistory }: HistorySectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Clock className="w-6 h-6 text-brand-blue" />
            AUDIT ARCHIVES
          </h2>
          <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest">
            {history.length} SECURE RECORDS PRESERVED
          </p>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge Archives
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <GlossyCard className="py-20 text-center">
            <Database className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">
              Archival vaults are currently empty
            </p>
          </GlossyCard>
        ) : (
          <AnimatePresence mode="popLayout">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <GlossyCard 
                  glow="blue" 
                  className="group hover:border-brand-blue/30 transition-all cursor-pointer p-6 md:p-10 rounded-[32px] md:rounded-[48px] border-white/5 bg-app-card relative overflow-hidden"
                  onClick={() => loadItem(item)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 blur-3xl pointer-events-none group-hover:bg-brand-blue/10 transition-colors" />
                  
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-10 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-blue/10 transition-all border border-white/5 shadow-inner">
                        <FileText className="w-7 h-7 text-brand-blue drop-shadow-[0_0_8px_rgba(90,92,255,0.4)]" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-white font-black text-base md:text-lg uppercase tracking-wider line-clamp-1 group-hover:text-brand-blue transition-colors font-mono">
                          {item.fileName}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <Clock className="w-3 h-3 text-brand-blue" />
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 lg:gap-16">
                      <div className="text-center md:text-right space-y-1">
                        <div className="flex items-baseline gap-2 justify-center md:justify-end">
                          <span className="text-3xl md:text-4xl font-black gradient-text font-mono tracking-tighter italic">
                            {item.validRows}
                          </span>
                          <span className="text-slate-600 font-black text-sm italic">/</span>
                          <span className="text-slate-500 font-bold text-lg md:text-xl font-mono tracking-tighter">
                            {item.totalRows}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.3em] italic">Secure Nodes Archived</p>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto px-1 md:pr-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadItem(item); }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/[0.03] text-slate-400 hover:text-white hover:bg-brand-blue/20 transition-all border border-white/5 hover:border-brand-blue/30 group/btn"
                          title="Download Results"
                        >
                          <Download className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Export</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); loadItem(item); }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-4 rounded-2xl gradient-bg text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-blue/20 hover:shadow-[0_0_25px_rgba(90,92,255,0.4)] group/review relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/review:opacity-100 transition-opacity" />
                          <span className="relative z-10">Review</span>
                          <ChevronRight className="w-4 h-4 group-hover/review:translate-x-1 transition-transform relative z-10" />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlossyCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
} 
