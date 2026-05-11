import React from 'react';
import { LayoutGrid, ShieldCheck } from 'lucide-react';

interface MappingSectionProps {
  fileName: string;
  totalLeads: number;
  headers: string[];
  mappings: any;
  setMappings: (m: any) => void;
  onStartProcessing: () => void;
  onPreview: () => void;
  isProcessing: boolean;
}

export function MappingSection({ 
  fileName, 
  totalLeads, 
  headers, 
  mappings, 
  setMappings, 
  onStartProcessing, 
  onPreview,
  isProcessing 
}: MappingSectionProps) {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6">
      <div className="glass-panel p-6 md:p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-border-color gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-app-text tracking-tight">Data Mapping</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Source: {fileName}</p>
            </div>
          </div>
          <div className="text-center md:text-right flex flex-col items-center md:items-end gap-1.5">
            <button 
              onClick={onPreview}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs rounded-md font-medium border border-border-color transition-colors text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Preview Leads
            </button>
            <div className="text-3xl font-bold text-app-text">{totalLeads}</div>
            <p className="text-xs text-slate-500 font-medium">Total leads found</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {(Object.keys(mappings) as Array<string>).map((key) => (
            <div key={key} className="group">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                Select {key.replace('Key', '').replace(/([A-Z])/g, ' $1')} Field
              </label>
              <select 
                value={mappings[key]}
                onChange={(e) => setMappings({ ...mappings, [key]: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-border-color bg-white dark:bg-slate-900 text-app-text text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow appearance-none cursor-pointer"
              >
                <option value="">[ Not Mapped ]</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={onStartProcessing}
            disabled={!mappings.emailKey || isProcessing}
            className="w-full bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 text-white h-12 rounded-xl font-medium text-base flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            Start Verification Scan
            <ShieldCheck className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 
