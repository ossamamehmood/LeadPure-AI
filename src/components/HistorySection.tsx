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
          <h2 className="text-2xl font-display font-bold text-app-text tracking-tight flex items-center gap-3">
            <Clock className="w-6 h-6 text-brand-blue" />
            Scan History
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mt-1">
            {history.length} completed {history.length === 1 ? 'scan' : 'scans'} saved in your browser
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all border border-rose-500/25 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <GlossyCard className="py-20 text-center rounded-3xl">
            <Database className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.25em]">
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
                  className="group hover:border-brand-blue/40 transition-all cursor-pointer p-5 sm:p-8 rounded-3xl border-app-border bg-app-card"
                  onClick={() => loadItem(item)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl gradient-surface flex items-center justify-center border border-brand-blue/25 shrink-0">
                        <FileText className="w-6 h-6 text-brand-blue" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-app-text font-semibold text-sm sm:text-base tracking-tight truncate group-hover:text-brand-blue transition-colors font-mono">
                          {item.fileName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                          <span>&bull;</span>
                          <span>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <div className="text-left sm:text-right">
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                          <span className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400">{item.validRows}</span>
                          <span className="text-slate-400 dark:text-slate-600 font-semibold">/</span>
                          <span className="text-slate-600 dark:text-slate-400 font-semibold text-base">{item.totalRows}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">SAFE Emails</p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadItem(item); }}
                          className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-app-text hover:bg-brand-blue/15 transition-all border border-slate-200 dark:border-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-xs font-semibold">Export</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); loadItem(item); }}
                          className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-cta text-white text-xs font-semibold tracking-wide transition-all shadow-[0_8px_22px_-6px_rgba(90,92,255,0.48)] hover:brightness-110 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
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
