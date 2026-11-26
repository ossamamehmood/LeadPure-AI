import React from 'react';
import { LayoutGrid, ShieldCheck, ArrowRight } from 'lucide-react';
import { GlossyCard } from './ui/GlossyCard';
import { MagneticButton } from './ui/MagneticButton';
import { StaggerGroup, StaggerItem } from './ui/MotionPrimitives';

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
    <StaggerGroup className="max-w-2xl mx-auto w-full space-y-6">
      <StaggerItem>
        <GlossyCard className="p-5 sm:p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-6 border-b border-app-border gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="bg-brand-blue/15 p-3 rounded-2xl border border-brand-blue/20 shrink-0">
                <LayoutGrid className="w-6 h-6 text-brand-blue" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-display font-bold text-app-text tracking-tight">Match Your Columns</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">File: {fileName}</p>
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
              <button
                onClick={onPreview}
                className="min-h-[36px] px-4 py-1.5 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] text-xs rounded-full font-semibold border border-slate-200 dark:border-app-border transition-all text-slate-700 dark:text-slate-300 hover:text-brand-blue cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Preview Data
              </button>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-bold text-app-text font-mono tracking-tight leading-none tabular-nums">{totalLeads}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">Total Rows</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {(Object.keys(mappings) as Array<string>).map((key) => (
              <div key={key} className="group">
                <label
                  htmlFor={`map-${key}`}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block capitalize"
                >
                  {key.replace('Key', '').replace(/([A-Z])/g, ' $1')} {key === 'emailKey' ? '(Required)' : ''}
                </label>
                <select
                  id={`map-${key}`}
                  value={mappings[key]}
                  onChange={(e) => setMappings({ ...mappings, [key]: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0D13] text-app-text text-xs font-semibold focus:border-brand-blue/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 transition-all cursor-pointer"
                >
                  <option value="">[ Not Mapped ]</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <MagneticButton
              onClick={onStartProcessing}
              disabled={!mappings.emailKey || isProcessing}
              variant="primary"
              size="lg"
              className="w-full group"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Start Cleaning List</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>
          </div>
        </GlossyCard>
      </StaggerItem>
    </StaggerGroup>
  );
}
