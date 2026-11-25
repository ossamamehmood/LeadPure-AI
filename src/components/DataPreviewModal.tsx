import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Table as TableIcon, Search } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { GlossyCard } from './ui/GlossyCard';
import { ContactData } from '../types';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ContactData[];
  title: string;
}

const MemoizedPreviewRow = React.memo(({ row, headers }: { row: any; headers: string[] }) => {
  if (!row) return null;

  return (
    <div className="flex border-b border-app-border hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors h-[46px]">
      {headers.map((header) => (
        <div
          key={header}
          className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono border-r border-app-border last:border-none overflow-hidden truncate flex items-center min-w-[140px]"
          style={{ width: `${Math.max(140, 100 / Math.max(1, headers.length))}px`, flex: 1 }}
        >
          {String(row[header] ?? '-')}
        </div>
      ))}
    </div>
  );
});

export function DataPreviewModal({ isOpen, onClose, data, title }: DataPreviewModalProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  const internalKeys = new Set([
    'originalIndex', 'verificationStatus', 'verificationReason', 'confidenceScore',
    'bounceRisk', 'reputationImpact', 'mxRecordFound', 'isCatchAll', 'isDisposable',
    'isRoleBased', 'isSpamtrapProbability', 'smtpValid', 'syntaxValid', 'domainAge',
    'spfExists', 'dkimExists', '__originalData', 'raw', 'sub_status', 'subStatus',
    'ui_label', 'ui_reason', 'verdict', 'reason', 'isDeliverable', 'isFreeEmail',
    'mxRecord', 'provider', 'isTimedOutMissing'
  ]);

  const headers = useMemo(() => {
    if (!data.length) return [];
    const baseKeys = Object.keys(data[0]).filter((k) => !internalKeys.has(k));
    return ['status', ...baseKeys.filter((k) => k !== 'status')].filter((k) => k in data[0]);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!deferredSearchTerm) return data;
    const searchStr = deferredSearchTerm.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(searchStr))
    );
  }, [data, deferredSearchTerm]);

  const itemContent = React.useCallback((index: number) => {
    return <MemoizedPreviewRow row={filteredData[index]} headers={headers} />;
  }, [filteredData, headers]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="w-full max-w-7xl h-full max-h-[90vh] relative z-10"
          >
            <GlossyCard className="w-full h-full flex flex-col rounded-3xl sm:rounded-[40px] overflow-hidden border-app-border shadow-2xl">
              <div className="p-4 sm:p-8 border-b border-app-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 shrink-0">
                    <TableIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-app-text uppercase italic tracking-tight">{title}</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{data.length} records</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search preview..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-app-bg/40 border border-app-border rounded-xl h-10 pl-10 pr-4 text-xs font-bold text-app-text placeholder:text-slate-500 outline-none focus:border-brand-blue/30"
                    />
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 border border-app-border text-app-text shrink-0"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto bg-app-bg/40 flex flex-col">
                <div className="sticky top-0 z-20 bg-app-card border-b border-app-border flex min-w-max">
                  {headers.map((header) => (
                    <div
                      key={header}
                      className="px-4 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-app-border last:border-none truncate min-w-[140px]"
                      style={{ flex: 1 }}
                    >
                      {header}
                    </div>
                  ))}
                </div>

                <div className="flex-1 min-h-[380px] min-w-max">
                  {filteredData.length > 0 ? (
                    <Virtuoso
                      style={{ height: '55vh' }}
                      totalCount={filteredData.length}
                      itemContent={itemContent}
                      increaseViewportBy={200}
                    />
                  ) : (
                    <div className="py-24 text-center">
                      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No matching records found.</p>
                    </div>
                  )}
                </div>
              </div>
            </GlossyCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
