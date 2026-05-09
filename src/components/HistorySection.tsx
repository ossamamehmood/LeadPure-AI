import React from 'react';
import { Clock, FileCheck, ChevronRight, Download } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-app-text uppercase italic tracking-tighter transition-colors duration-500">Audit Archive</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">IDENTITY INFRASTRUCTURE LOGS</p>
        </div>
        <button 
          onClick={clearHistory}
          className="text-[10px] uppercase font-black italic text-brand-pink hover:text-brand-pink/80 transition-colors tracking-widest bg-brand-pink/5 px-4 py-2 rounded-xl border border-brand-pink/10"
        >
          Purge Archive
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-app-card p-20 rounded-[40px] border border-app-border text-center border-dashed transition-colors duration-500">
          <Clock className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">No Data Detected</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((item) => (
            <GlossyCard 
              key={item.id} 
              onClick={() => loadItem(item)}
              className="p-4 md:p-6 rounded-[24px] hover:border-brand-blue/50 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="absolute top-0 left-0 w-1 h-full gradient-bg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="w-14 h-14 bg-app-bg rounded-2xl flex items-center justify-center text-slate-500 group-hover:gradient-text transition-colors border border-app-border">
                  <FileCheck className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-black text-app-text text-xl uppercase italic tracking-tighter transition-colors duration-500">{item.fileName}</p>
                  <div className="flex items-center gap-3 text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span className="text-white/10">•</span>
                    <span>{new Date(item.date).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6 md:gap-10 w-full md:w-auto">
                <div className="text-right">
                  <p className="text-xl font-black text-app-text font-mono tracking-tighter transition-colors duration-500">{item.validRows}</p>
                  <p className="text-[8px] uppercase font-black gradient-text tracking-widest">Optimized</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-600 font-mono tracking-tighter">{item.stats.removed}</p>
                  <p className="text-[8px] uppercase font-black text-rose-600 tracking-widest">Purged</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadItem(item);
                    }}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all border border-white/5"
                    title="Export File"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-white/10 group-hover:gradient-text transition-colors" />
                </div>
              </div>
            </GlossyCard>
          ))}
        </div>
      )}
    </div>
  );
}
