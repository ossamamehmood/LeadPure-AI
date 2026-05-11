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
          <AnimatePresence>
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <GlossyCard glow="blue" className="group hover:border-brand-blue/30 transition-all cursor-pointer p-6 rounded-[32px]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-blue/10 transition-all border border-white/5">
                        <FileText className="w-6 h-6 text-brand-blue" />
                      </div>
                      <div className="mt-1">
                        <h4 className="text-white font-black text-sm uppercase tracking-widest line-clamp-1 group-hover:text-brand-blue transition-colors">
                          {item.fileName}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                          <span className="text-[10px] text-brand-blue font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse shadow-[0_0_5px_#5A5CFF]" />
                            {item.validRows} / {item.totalRows} SECURED
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadItem(item); }}
                        className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-blue/10 text-brand-blue hover:text-white hover:bg-brand-blue transition-all border border-brand-blue/20 hover:border-brand-blue group/btn"
                        title="Download Results"
                      >
                        <Download className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Download</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); loadItem(item); }}
                        className="flex items-center gap-2 px-6 py-3 rounded-full gradient-bg text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-blue/30 hover:shadow-[0_0_20px_rgba(90,92,255,0.6)] group/review"
                      >
                        Review
                        <ChevronRight className="w-4 h-4 group-hover/review:translate-x-1 transition-transform" />
                      </button>
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
