import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Download, Trash2, FileText, ChevronRight, Database } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySectionProps {
  history: HistoryItem[];
  loadItem: (item: HistoryItem) => void;
  downloadItem: (item: HistoryItem) => void;
  clearHistory: () => void;
}

export function HistorySection({ history, loadItem, downloadItem, clearHistory }: HistorySectionProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between border-b border-border-color pb-4">
        <div>
          <h2 className="text-xl font-semibold text-app-text tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Processing History
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {history.length} records preserved
          </p>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <div className="glass-panel py-20 rounded-2xl text-center border-dashed border-2">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <Database className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium text-sm">
              No processing history found
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="glass-panel p-5 rounded-2xl group hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-app-text font-semibold text-sm line-clamp-1">
                          {item.fileName}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                            {item.validRows} / {item.totalRows} Valid
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => downloadItem(item)}
                        className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-border-color"
                        title="Download Results"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => loadItem(item)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
} 
