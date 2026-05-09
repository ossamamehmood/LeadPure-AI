import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Table as TableIcon, Search } from 'lucide-react';
import * as ReactWindow from 'react-window';

const FixedSizeList = (ReactWindow as any).FixedSizeList || (ReactWindow as any).default?.FixedSizeList;
import { GlossyCard } from './ui/GlossyCard';
import { ContactData } from '../types';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ContactData[];
  title: string;
}

export function DataPreviewModal({ isOpen, onClose, data, title }: DataPreviewModalProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  
  const headers = useMemo(() => data.length > 0 ? Object.keys(data[0]).filter(k => 
    !['originalIndex', 'verificationStatus', 'verificationReason', 'confidenceScore', 'bounceRisk', 'reputationImpact', 'mxRecordFound', 'isCatchAll', 'isDisposable', 'isRoleBased', 'isSpamtrapProbability', 'smtpValid', 'syntaxValid', 'domainAge', 'spfExists', 'dkimExists', '__originalData'].includes(k)
  ) : [], [data]);

  const filteredData = useMemo(() => {
    if (!deferredSearchTerm) return data;
    const searchStr = deferredSearchTerm.toLowerCase();
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchStr)
      )
    );
  }, [data, deferredSearchTerm]);

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const row = filteredData[index];
    if (!row) return null;

    return (
      <div style={style} className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
        {headers.map((header, hIdx) => (
          <div 
            key={header} 
            className="px-6 py-4 text-[11px] font-bold text-slate-400 font-mono tracking-tight border-r border-white/5 last:border-none group-hover:text-white transition-colors overflow-hidden truncate flex items-center"
            style={{ width: `${100 / headers.length}%`, flexShrink: 0 }}
          >
            {String(row[header] || '-')}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-7xl h-full max-h-[90vh] relative z-10"
          >
            <GlossyCard className="w-full h-full flex flex-col rounded-[40px] overflow-hidden border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.02]">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
                    <TableIcon className="w-6 h-6 text-brand-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-app-text uppercase italic tracking-tighter transition-colors duration-500">{title}</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Previewing {data.length} records from source</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                      type="text"
                      placeholder="SEARCH PREVIEW..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-app-bg/40 border border-app-border rounded-2xl h-11 pl-12 pr-4 text-[10px] font-black text-app-text placeholder:text-slate-500 outline-none focus:border-brand-blue/30 transition-all uppercase tracking-[0.2em] italic"
                    />
                  </div>
                  <button 
                    onClick={onClose}
                    className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-hidden bg-app-bg/40 transition-colors duration-500 flex flex-col">
                <div className="sticky top-0 z-20 bg-app-card shadow-[0_1px_0_var(--color-app-border)] transition-colors duration-500 flex w-full">
                  {headers.map(header => (
                    <div 
                      key={header} 
                      className="px-6 py-5 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] border-r border-white/5 last:border-none overflow-hidden truncate"
                      style={{ width: `${100 / headers.length}%`, flexShrink: 0 }}
                    >
                      {header}
                    </div>
                  ))}
                </div>
                
                <div className="flex-1 min-h-0">
                   {filteredData.length > 0 ? (
                      <FixedSizeList
                        height={500} // This will be handled by container size if we use AutoSizer, but fixed is safer for now or we height: 100%
                        itemCount={filteredData.length}
                        itemSize={50}
                        width="100%"
                      >
                        {Row}
                      </FixedSizeList>
                   ) : (
                      <div className="py-40 text-center">
                        <p className="text-slate-600 font-black uppercase tracking-[0.4em] italic text-xs">No matching records found in preview.</p>
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
