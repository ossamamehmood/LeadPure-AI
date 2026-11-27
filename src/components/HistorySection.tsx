import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Download, Trash2, FileText, ChevronRight, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { HistoryItem } from '../types';
import { GlossyCard } from './ui/GlossyCard';
import { cn } from '../lib/utils';

interface HistorySectionProps {
  history: HistoryItem[];
  loadItem: (item: HistoryItem) => void;
  downloadItem: (item: HistoryItem) => void;
  clearHistory: () => void;
  onRefreshRechecks?: () => void;
  isRefreshingRechecks?: boolean;
}

function getRowVerdict(row: any): 'SAFE' | 'RISKY' | 'INVALID' | 'UNKNOWN' {
  const s = String(row?.status || row?.verdict || row?.verificationStatus || '').toUpperCase();
  if (s === 'SAFE' || s === 'VERIFIED') return 'SAFE';
  if (s === 'RISKY') return 'RISKY';
  if (s === 'INVALID' || s === 'BLOCKED' || s === 'REJECTED') return 'INVALID';
  return 'UNKNOWN';
}

export function HistorySection({
  history,
  loadItem,
  downloadItem,
  clearHistory,
  onRefreshRechecks,
  isRefreshingRechecks = false
}: HistorySectionProps) {
  const hasSyncable = history.some((item) => Boolean(item.requestId));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-app-text tracking-tight flex items-center gap-3">
            <Clock className="w-6 h-6 text-brand-blue" />
            Scan History
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mt-1">
            {history.length} saved {history.length === 1 ? 'scan' : 'scans'} with automatic UNKNOWN re-check tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasSyncable && onRefreshRechecks && (
            <button
              type="button"
              onClick={onRefreshRechecks}
              disabled={isRefreshingRechecks}
              className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue/10 text-brand-blue text-xs font-semibold hover:bg-brand-blue/20 transition-all border border-brand-blue/25 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefreshingRechecks && 'animate-spin')} />
              <span>{isRefreshingRechecks ? 'Checking Updates...' : 'Refresh Re-checks'}</span>
            </button>
          )}
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
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <GlossyCard className="py-20 text-center rounded-3xl">
            <Database className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.25em]">
              No completed scans yet
            </p>
          </GlossyCard>
        ) : (
          <AnimatePresence mode="popLayout">
            {history.map((item, index) => {
              const allRows = [...(item.processedData || []), ...(item.eliminatedData || [])];
              const pendingRows = allRows.filter((r) => getRowVerdict(r) === 'UNKNOWN' && r?.recheckStatus !== 'exhausted');
              const resolvedRows = allRows.filter((r) => Boolean(r?.resolvedOnRecheck));
              const exhaustedRows = allRows.filter((r) => getRowVerdict(r) === 'UNKNOWN' && r?.recheckStatus === 'exhausted');
              const pendingCount = item.recheckPendingCount ?? pendingRows.length;
              const resolvedCount = item.recheckResolvedCount ?? resolvedRows.length;
              const arrivedCount = allRows.length || item.totalRows;
              const currentDefCount = allRows.length
                ? allRows.filter((r) => getRowVerdict(r) !== 'UNKNOWN').length
                : item.validRows;
              const currentRate = item.currentDefinitiveRate ?? (arrivedCount > 0 ? Math.round((currentDefCount / arrivedCount) * 100) : (item.stats?.avgConfidence ?? 0));
              const initialUnknown = pendingRows.length + resolvedRows.length + exhaustedRows.length;
              const initialRate = item.initialDefinitiveRate ?? (arrivedCount > 0 ? Math.round((Math.max(0, arrivedCount - initialUnknown) / arrivedCount) * 100) : currentRate);
              const showRateUpgrade = resolvedCount > 0 && currentRate !== initialRate;
              const highlightRows = [...resolvedRows, ...pendingRows, ...exhaustedRows].slice(0, 6);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <GlossyCard
                    glow="blue"
                    className="group hover:border-brand-blue/40 transition-all cursor-pointer p-5 sm:p-8 rounded-3xl"
                    onClick={() => loadItem(item)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl gradient-surface flex items-center justify-center border border-brand-blue/25 shrink-0">
                          <FileText className="w-6 h-6 text-brand-blue" />
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-app-text font-semibold text-sm sm:text-base tracking-tight truncate group-hover:text-brand-blue transition-colors font-mono">
                              {item.fileName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                              {item.type === 'single' ? 'Single Check' : 'Bulk Scan'}
                            </span>
                            {pendingCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                {pendingCount} re-check pending
                              </span>
                            )}
                            {resolvedCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                {resolvedCount} Resolved on re-check
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                            <span>&bull;</span>
                            <span>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>&bull;</span>
                            {showRateUpgrade ? (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {initialRate}% initial &rarr; {currentRate}% after re-checks
                              </span>
                            ) : (
                              <span className="tabular-nums">{currentRate}% definitive</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 shrink-0">
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

                    {highlightRows.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-app-border/70 grid gap-2">
                        {highlightRows.map((row: any, rIdx: number) => {
                          const v = getRowVerdict(row);
                          const addr = String(row?.[item.mappings?.emailKey] || row?.email || '');
                          const isResolved = Boolean(row?.resolvedOnRecheck);
                          const isExhausted = v === 'UNKNOWN' && row?.recheckStatus === 'exhausted';
                          return (
                            <div
                              key={`${addr}-${rIdx}`}
                              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-white/[0.025] border border-app-border/60 text-xs"
                            >
                              <span className="font-mono text-app-text truncate max-w-full sm:max-w-[45%]">{addr}</span>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                  v === 'SAFE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                                  v === 'RISKY' ? 'bg-amber-400/15 text-amber-700 dark:text-amber-300' :
                                  v === 'INVALID' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400' :
                                  'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                                )}>
                                  {v}
                                </span>
                                {isResolved ? (
                                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    Resolved on re-check
                                    {row.recheckResolvedAt ? ` (${new Date(row.recheckResolvedAt).toLocaleString()})` : ''}
                                  </span>
                                ) : isExhausted ? (
                                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                    Final UNKNOWN (2/2 re-checks completed)
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                    re-check pending
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </GlossyCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
