import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Download, Trash2, FileText, ChevronRight, Database } from 'lucide-react';
import { HistoryItem } from '../types';
import { GlossyCard } from './ui/GlossyCard';

interface HistorySectionProps {
  history: HistoryItem[];
  loadItem: (item: HistoryItem) => void;
  downloadItem: (item: HistoryItem) => void;
  clearHistory: () => void;
}

export function HistorySection({ history, loadItem, downloadItem, clearHistory }: HistorySectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-app-text tracking-tight flex items-center gap-3">
            <Clock className="w-6 h-6 text-brand-blue" />
            SCAN HISTORY
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest">
            {history.length} Completed Scans Stored Locally
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all border border-rose-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <GlossyCard className="py-20 text-center rounded-3xl">
            <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.25em]">
              No completed bulk scans yet
            </p>
          </GlossyCard>
        ) : (
          <AnimatePresence mode="popLayout">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <GlossyCard
                  glow="blue"
                  className="group hover:border-brand-blue/30 transition-all cursor-pointer p-5 sm:p-8 rounded-3xl border-white/5 bg-app-card"
                  onClick={() => loadItem(item)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shrink-0">
                        <FileText className="w-6 h-6 text-brand-blue" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-app-text font-black text-sm sm:text-base uppercase tracking-wider truncate group-hover:text-brand-blue transition-colors font-mono">
                          {item.fileName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-bold">
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                          <span>&bull;</span>
                          <span>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <div className="text-left sm:text-right">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{item.validRows}</span>
                          <span className="text-slate-600 font-black">/</span>
                          <span className="text-slate-500 font-bold text-base font-mono">{item.totalRows}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">SAFE Emails</p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadItem(item); }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white hover:bg-brand-blue/20 transition-all border border-white/10"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); loadItem(item); }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                        >
                          <span>View</span>
                          <ChevronRight className="w-4 h-4" />
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
