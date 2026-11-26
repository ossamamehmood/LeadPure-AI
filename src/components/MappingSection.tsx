import React from 'react';
import { LayoutGrid, ShieldCheck } from 'lucide-react';
import { GlossyCard } from './ui/GlossyCard';

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
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <GlossyCard className="p-5 sm:p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-6 border-b border-app-border gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="bg-brand-blue/20 p-3 rounded-2xl shrink-0">
              <LayoutGrid className="w-6 h-6 text-brand-blue" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black text-app-text italic tracking-tighter uppercase">Match Your Columns</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider truncate">File: {fileName}</p>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
            <button
              onClick={onPreview}
              className="min-h-[36px] px-4 py-1.5 bg-slate-100/80 dark:bg-app-bg/10 hover:bg-slate-200/80 dark:hover:bg-app-bg/20 text-[9px] rounded-full uppercase font-black tracking-widest border border-slate-200 dark:border-app-border transition-all text-slate-700 dark:text-slate-400 hover:text-brand-blue cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Preview Data
            </button>
            <div className="text-right">
              <div className="text-2xl sm:text-4xl font-black text-app-text font-mono tracking-tighter leading-none tabular-nums">{totalLeads}</div>
              <p className="text-[8px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest mt-1">Total Rows</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(Object.keys(mappings) as Array<string>).map((key) => (
            <div key={key} className="group">
              <label
                htmlFor={`map-${key}`}
                className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 block"
              >
                {key.replace('Key', '').replace(/([A-Z])/g, ' $1')} {key === 'emailKey' ? '(Required)' : ''}
              </label>
              <select
                id={`map-${key}`}
                value={mappings[key]}
                onChange={(e) => setMappings({ ...mappings, [key]: e.target.value })}
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-app-border bg-slate-50 dark:bg-app-bg/40 text-app-text text-xs font-bold focus:border-brand-blue/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 transition-all cursor-pointer"
              >
                <option value="">[ Not Mapped ]</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-10">
          <button
            onClick={onStartProcessing}
            disabled={!mappings.emailKey || isProcessing}
            className="w-full gradient-bg disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-white h-14 sm:h-16 rounded-2xl font-black text-base sm:text-lg uppercase italic tracking-wide flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-blue/30 hover:brightness-105 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
          >
            Start Cleaning List
            <ShieldCheck className="w-5 h-5" />
          </button>
        </div>
      </GlossyCard>
    </div>
  );
}
