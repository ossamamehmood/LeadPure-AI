import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Table as TableIcon, Search } from 'lucide-react';
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
  
  const headers = data.length > 0 ? Object.keys(data[0]).filter(k => 
    !['originalIndex', 'verificationStatus', 'verificationReason', 'confidenceScore', 'bounceRisk', 'reputationImpact', 'mxRecordFound', 'isCatchAll', 'isDisposable', 'isRoleBased', 'isSpamtrapProbability', 'smtpValid', 'syntaxValid', 'domainAge', 'spfExists', 'dkimExists', '__originalData'].includes(k)
  ) : [];

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
                  <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
                    <TableIcon className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{title}</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Previewing {data.length} records from source</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-brand-cyan transition-colors" />
                    <input 
                      type="text"
                      placeholder="SEARCH PREVIEW..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl h-11 pl-12 pr-4 text-[10px] font-black text-white placeholder:text-slate-800 outline-none focus:border-brand-cyan/20 transition-all uppercase tracking-[0.2em] italic"
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
              <div className="flex-1 overflow-auto bg-[#030303]/40">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-20 bg-[#050505] shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                    <tr>
                      {headers.map(header => (
                        <th key={header} className="px-6 py-5 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] border-r border-white/5 last:border-none">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredData.slice(0, 500).map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        {headers.map(header => (
                          <td key={header} className="px-6 py-4 text-[11px] font-bold text-slate-400 font-mono tracking-tight border-r border-white/5 last:border-none group-hover:text-white transition-colors">
                            {String(row[header] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length === 0 && (
                  <div className="py-40 text-center">
                    <p className="text-slate-600 font-black uppercase tracking-[0.4em] italic text-xs">No matching records found in preview.</p>
                  </div>
                )}
                {data.length > 500 && searchTerm === '' && (
                  <div className="p-8 text-center border-t border-white/5 bg-white/[0.01]">
                    <p className="text-slate-700 font-black uppercase tracking-[0.2em] italic text-[10px]">Showing first 500 records for performance optimization.</p>
                  </div>
                )}
              </div>
            </GlossyCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
