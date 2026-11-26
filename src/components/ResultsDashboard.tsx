import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertTriangle, XCircle, HelpCircle, Search, Database, Fingerprint, Activity, Zap, Cpu, Download, Clock, X } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';
import { ProcessedContact } from '../types';

interface ResultsDashboardProps {
  processedData: ProcessedContact[];
  eliminatedData: any[];
  mappings: any;
  onPreview: (data: any[], title: string) => void;
  onDownloadValid: () => void;
  onDownloadAll: () => void;
  onDownloadEliminated: (tier?: 'all' | 'risky' | 'invalid' | 'unknown') => void;
  stats?: any;
  isProcessing?: boolean;
  progress?: number;
  emailsDone?: number;
  emailsTotal?: number;
  chunksDone?: number;
  chunksTotal?: number;
  estimatedSeconds?: number | null;
  activeRequestId?: string | null;
  onCancel?: () => void;
}

function getCanonicalVerdict(contact: any): 'SAFE' | 'RISKY' | 'INVALID' | 'UNKNOWN' {
  const s = String(contact?.status || contact?.verificationStatus || '').toUpperCase();
  if (s === 'SAFE' || s === 'VERIFIED') return 'SAFE';
  if (s === 'RISKY') return 'RISKY';
  if (s === 'INVALID' || s === 'BLOCKED' || s === 'REJECTED') return 'INVALID';
  return 'UNKNOWN';
}

const MemoizedRow = React.memo(({ contact, mappings }: { contact: any; mappings: any }) => {
  if (!contact) return null;
  const isTimedOutMissing = !!contact.isTimedOutMissing;
  const verdict = isTimedOutMissing ? 'UNKNOWN' : getCanonicalVerdict(contact);

  const badgeStyle = isTimedOutMissing
    ? 'text-amber-700 dark:text-amber-400 bg-amber-400/15 dark:bg-amber-400/10 border-amber-500/35 dark:border-amber-400/30'
    : verdict === 'SAFE'
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : verdict === 'RISKY'
        ? 'text-amber-700 dark:text-amber-400 bg-amber-400/15 dark:bg-amber-400/10 border-amber-500/35 dark:border-amber-400/30'
        : verdict === 'INVALID'
          ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
          : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10';

  const VerdictIcon = isTimedOutMissing
    ? Clock
    : verdict === 'SAFE'
      ? ShieldCheck
      : verdict === 'RISKY'
        ? AlertTriangle
        : verdict === 'INVALID'
          ? XCircle
          : HelpCircle;

  const emailDisplay = String(contact[mappings.emailKey] || contact.email || 'N/A');
  const nameDisplay = `${String(contact[mappings.firstNameKey] || contact[mappings.nameKey] || '')} ${String(contact[mappings.lastNameKey] || '')}`.trim();

  return (
    <div className="border-b border-app-border hover:bg-slate-50/80 dark:hover:bg-white/[0.025] transition-colors flex flex-col md:flex-row md:items-center py-4 md:py-0 md:min-h-[84px] px-4 sm:px-6 md:px-0 gap-3 md:gap-0">
      <div className="md:px-8 py-1 md:py-3 w-full md:w-[35%] flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 dark:bg-app-bg border border-slate-200 dark:border-app-border flex items-center justify-center text-xs font-black text-app-text uppercase">
          {(nameDisplay || emailDisplay)[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          {nameDisplay && (
            <div className="text-xs sm:text-sm font-black text-app-text tracking-tight uppercase truncate">
              {nameDisplay}
            </div>
          )}
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold font-mono truncate">{emailDisplay}</div>
        </div>
      </div>

      <div className="md:px-6 py-1 md:py-3 w-full md:w-[20%] min-w-0">
        <div className="text-[10px] font-bold text-app-text truncate">
          {isTimedOutMissing ? 'Pending Result' : (contact.provider || 'Unknown')}
        </div>
        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono truncate mt-0.5">
          {isTimedOutMissing ? 'No result file' : (contact.mxRecord || (contact.mxRecordFound ? 'MX Active' : 'No MX Record'))}
        </div>
      </div>

      <div className="md:px-6 py-1 md:py-3 w-full md:w-[15%] shrink-0">
        <div className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border',
          badgeStyle
        )}>
          <VerdictIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {isTimedOutMissing ? 'TIMED OUT' : verdict}
        </div>
      </div>

      <div className="md:px-8 py-1 md:py-3 w-full md:w-[30%] min-w-0">
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 break-words line-clamp-2">
          {isTimedOutMissing
            ? 'STILL CHECKING / TIMED OUT — re-run to complete'
            : (contact.verificationReason || contact.reason || verdict)}
        </p>
      </div>
    </div>
  );
});

export function ResultsDashboard({
  processedData,
  eliminatedData,
  mappings,
  onPreview,
  onDownloadValid,
  onDownloadAll,
  onDownloadEliminated,
  isProcessing = false,
  progress = 100,
  emailsDone = 0,
  emailsTotal = 0,
  chunksDone = 0,
  chunksTotal = 0,
  estimatedSeconds = null,
  activeRequestId = null,
  onCancel
}: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'safe' | 'filtered'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  const arrivedEliminated = useMemo(
    () => (eliminatedData || []).filter((item: any) => !item.isTimedOutMissing),
    [eliminatedData]
  );

  const allRows = useMemo(
    () => [...(processedData || []), ...(eliminatedData || [])].sort((a, b) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0)),
    [processedData, eliminatedData]
  );

  const safeCount = (processedData || []).length;
  const riskyCount = arrivedEliminated.filter((i: any) => getCanonicalVerdict(i) === 'RISKY').length;
  const invalidCount = arrivedEliminated.filter((i: any) => getCanonicalVerdict(i) === 'INVALID').length;
  const unknownCount = arrivedEliminated.filter((i: any) => getCanonicalVerdict(i) === 'UNKNOWN').length;
  const catchAllCount = arrivedEliminated.filter((i: any) => i.isCatchAll).length;
  const arrivedTotal = safeCount + arrivedEliminated.length;
  const definitiveCount = safeCount + riskyCount + invalidCount;
  const definitiveRate = arrivedTotal > 0 ? Math.round((definitiveCount / arrivedTotal) * 100) : 0;

  const currentData = activeTab === 'all' ? allRows : activeTab === 'safe' ? (processedData || []) : (eliminatedData || []);

  const searchIndex = useMemo(() => {
    return currentData.map((item) => {
      const email = String(item[mappings.emailKey] || item.email || '');
      const first = String(item[mappings.firstNameKey] || '');
      const last = String(item[mappings.lastNameKey] || '');
      const name = String(item[mappings.nameKey] || '');
      const verdict = String(item.status || '');
      return `${email} ${first} ${last} ${name} ${verdict}`.toLowerCase();
    });
  }, [currentData, mappings]);

  const filteredData = useMemo(() => {
    if (!deferredSearchTerm) return currentData;
    const searchStr = deferredSearchTerm.toLowerCase();
    return currentData.filter((_, index) => searchIndex[index]?.includes(searchStr));
  }, [currentData, deferredSearchTerm, searchIndex]);

  const itemContent = React.useCallback((index: number) => {
    return <MemoizedRow contact={filteredData[index]} mappings={mappings} />;
  }, [filteredData, mappings]);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 sm:space-y-10 pb-20">
      {/* Live Chunk Progress Header while running */}
      {isProcessing && (
        <GlossyCard glow="blue" className="p-5 sm:p-8 rounded-3xl border border-brand-blue/30 bg-app-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              {/* Technical note: runs up to 3 concurrent GitHub Actions Port-25 batches of 100 emails */}
              <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.25em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-ping" />
                Live Verification Running
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-app-text tracking-tight mt-1 tabular-nums">
                {emailsDone} / {emailsTotal} Emails Checked &bull; Batch {chunksDone} / {chunksTotal}
              </h3>
              {activeRequestId && (
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1">Scan Ref: {activeRequestId}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {estimatedSeconds !== null && (
                <div className="text-left sm:text-right">
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 sm:justify-end">
                    <Clock className="w-3 h-3" /> ETA
                  </p>
                  <p className="text-base sm:text-lg font-black text-app-text font-mono tabular-nums">
                    {estimatedSeconds < 60 ? `${estimatedSeconds}s` : `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`}
                  </p>
                </div>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  Stop Scan
                </button>
              )}
            </div>
          </div>
          <div className="h-2.5 w-full bg-slate-200/70 dark:bg-app-bg/40 rounded-full overflow-hidden border border-app-border">
            <motion.div
              className="h-full gradient-bg rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </GlossyCard>
      )}

      {/* Summary Cards (Built strictly from arrived engine results) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <GlossyCard glow="gradient" className="p-5 sm:p-7 rounded-3xl shadow-xl border-app-border bg-app-card">
          <div className="flex justify-between items-start mb-4">
            <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] italic">SAFE</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl sm:text-5xl font-black text-app-text font-mono tracking-tighter tabular-nums">{safeCount}</p>
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Ready to Send</span>
          </div>
          {/* Technical note: confirmed RFC 250 OK non-catch-all mailboxes */}
          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold mt-3">Confirmed active &amp; deliverable inboxes</p>
        </GlossyCard>

        <GlossyCard glow="pink" className="p-5 sm:p-7 rounded-3xl shadow-xl border-app-border bg-app-card">
          <div className="flex justify-between items-start mb-4">
            <p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] italic">Risky &amp; Invalid</p>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/25">
              <Zap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl sm:text-5xl font-black text-app-text font-mono tracking-tighter tabular-nums">{riskyCount + invalidCount}</p>
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Flagged</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-bold tabular-nums">
            <span className="text-amber-600 dark:text-amber-400">{riskyCount} RISKY ({catchAllCount} Accept-All)</span>
            <span className="text-slate-400 dark:text-slate-600">&bull;</span>
            <span className="text-rose-600 dark:text-rose-500">{invalidCount} INVALID</span>
          </div>
        </GlossyCard>

        <GlossyCard className="p-5 sm:p-7 rounded-3xl shadow-xl border-app-border bg-app-card">
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">Definitive Rate</p>
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/25">
              <Fingerprint className="w-4 h-4 text-brand-blue" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl sm:text-5xl font-black font-mono tracking-tighter italic text-app-text tabular-nums">
              {definitiveRate}<span className="text-2xl">%</span>
            </p>
          </div>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold mt-3 tabular-nums">
            {definitiveCount}/{arrivedTotal} clear verdicts ({unknownCount} UNKNOWN)
          </p>
        </GlossyCard>

        <GlossyCard className="p-5 sm:p-7 rounded-3xl shadow-xl border-app-border bg-app-card">
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">Engine Release</p>
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/25">
              <Cpu className="w-4 h-4 text-brand-blue" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-app-text tracking-tighter uppercase italic">V17 Active</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider tabular-nums">{arrivedTotal} Checked</p>
            <div className="px-3 py-1 bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 text-brand-blue text-[9px] font-black rounded-full uppercase tracking-widest border border-brand-blue/30">
              V17 Engine
            </div>
          </div>
        </GlossyCard>
      </div>

      {/* Main Results Table Card */}
      <div className="bg-app-card rounded-3xl sm:rounded-[40px] border border-app-border shadow-2xl overflow-hidden">
        <div className="px-4 sm:px-8 py-6 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 border-b border-app-border">
          <div className="flex flex-wrap gap-4 sm:gap-8">
            <button
              onClick={() => { setActiveTab('all'); setSearchTerm(''); }}
              className={cn(
                'pb-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-t-md tabular-nums',
                activeTab === 'all' ? 'text-app-text' : 'text-slate-600 dark:text-slate-400 hover:text-app-text'
              )}
            >
              All ({allRows.length})
              {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-[3px] gradient-bg" />}
            </button>
            <button
              onClick={() => { setActiveTab('safe'); setSearchTerm(''); }}
              className={cn(
                'pb-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-md tabular-nums',
                activeTab === 'safe' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              )}
            >
              SAFE ({safeCount})
              {activeTab === 'safe' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 dark:bg-emerald-400" />}
            </button>
            <button
              onClick={() => { setActiveTab('filtered'); setSearchTerm(''); }}
              className={cn(
                'pb-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-t-md tabular-nums',
                activeTab === 'filtered' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
              )}
            >
              Risky / Invalid / Unknown ({(eliminatedData || []).length})
              {activeTab === 'filtered' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-rose-500 dark:bg-rose-400" />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:min-w-[230px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search email or verdict..."
                aria-label="Search email or verdict"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50/90 dark:bg-app-bg/40 border border-slate-200 dark:border-app-border rounded-xl h-11 pl-11 pr-10 text-xs font-bold text-app-text placeholder:text-slate-500 outline-none focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/15"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear filter search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-app-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onPreview(currentData, 'LeadPure V17 Results Preview')}
                className="px-4 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:text-brand-blue transition-all flex items-center gap-2 h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                <Database className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={onDownloadAll}
                className="px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 h-11 border bg-brand-blue/10 border-brand-blue/30 text-brand-blue hover:bg-brand-blue/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                <Download className="w-4 h-4" />
                Export Results
              </button>
              <button
                onClick={onDownloadValid}
                className="px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 h-11 border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Download className="w-4 h-4" />
                SAFE Only
              </button>
              {activeTab === 'filtered' && (
                <button
                  onClick={() => onDownloadEliminated('all')}
                  className="px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 h-11 border bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <Download className="w-4 h-4" />
                  Filtered
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-[420px]">
          {filteredData.length > 0 ? (
            <div className="w-full">
              <div className="hidden md:flex text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-[0.3em] font-black bg-slate-50/70 dark:bg-white/[0.02] border-b border-app-border">
                <div className="px-8 py-5 w-[35%]">Contact</div>
                <div className="px-6 py-5 w-[20%]">Email Provider</div>
                <div className="px-6 py-5 w-[15%]">Verdict</div>
                <div className="px-8 py-5 w-[30%]">Why This Verdict</div>
              </div>
              <Virtuoso
                style={{ height: '65vh' }}
                totalCount={filteredData.length}
                itemContent={itemContent}
                className="scrollbar-hide"
                increaseViewportBy={300}
              />
            </div>
          ) : (
            <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
              <Database className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-4" />
              <h4 className="text-lg sm:text-2xl font-black text-app-text uppercase italic tracking-tight mb-2">
                {isProcessing ? 'Checking your first batch now...' : 'No Matching Results'}
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs max-w-md mx-auto">
                {isProcessing
                  ? 'Verified contacts appear live in this table as each batch finishes.'
                  : 'Try adjusting your active filter tab or search query.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-6 min-h-[40px] px-6 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest rounded-full border border-slate-200 dark:border-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-8 py-5 bg-slate-50/70 dark:bg-app-bg/60 border-t border-app-border flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="tabular-nums">{filteredData.length} Rows Shown</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
            <span>LeadPure V17 • Engine 1.3.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
