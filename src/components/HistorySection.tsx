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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlossyCard className="group hover:border-brand-blue/30 transition-all cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-brand-blue" />
                      </div>
                      <div>
                        <h4 className="text-white font-black text-sm uppercase tracking-wider line-clamp-1">
                          {item.fileName}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className="text-[10px] text-brand-blue font-black uppercase tracking-widest">
                            {item.validRows} / {item.totalRows} SECURED
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => downloadItem(item)}
                        className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Download Results"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => loadItem(item)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase tracking-widest group-hover:bg-brand-blue group-hover:text-white transition-all shadow-xl shadow-brand-blue/5"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
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
