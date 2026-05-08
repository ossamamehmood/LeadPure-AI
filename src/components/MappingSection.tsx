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
      <GlossyCard className="p-4 md:p-8 rounded-[32px] shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-white/5 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#5A5CFF]/20 p-3 rounded-2xl">
              <LayoutGrid className="w-6 h-6 text-[#5A5CFF]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Data Mapping</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Source: {fileName}</p>
            </div>
          </div>
          <div className="text-center md:text-right flex flex-col items-center md:items-end gap-2">
            <button 
              onClick={onPreview}
              className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-[8px] rounded-full uppercase font-black tracking-widest border border-white/10 transition-all text-slate-500 hover:text-brand-cyan"
            >
              Preview Leads
            </button>
            <div className="text-4xl font-black text-white font-mono tracking-tighter leading-none">{totalLeads}</div>
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Leads for Inspection</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {(Object.keys(mappings) as Array<string>).map((key) => (
            <div key={key} className="group">
              <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 block group-focus-within:gradient-text transition-colors">
                Select {key.replace('Key', '').replace(/([A-Z])/g, ' $1')} Field
              </label>
              <select 
                value={mappings[key]}
                onChange={(e) => setMappings({ ...mappings, [key]: e.target.value })}
                className="w-full h-12 px-5 rounded-2xl border border-white/5 bg-[#000]/40 backdrop-blur-md text-slate-300 text-xs font-bold focus:border-[#02FEDC] focus:ring-1 focus:ring-[#02FEDC] focus:bg-[#000]/60 outline-none transition-all appearance-none uppercase tracking-widest cursor-pointer hover:border-white/20"
              >
                <option value="">[ NOT MAPPED ]</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <button
            onClick={onStartProcessing}
            disabled={!mappings.emailKey || isProcessing}
            className="w-full gradient-bg disabled:opacity-20 disabled:grayscale text-white h-16 rounded-[24px] font-black text-xl uppercase italic tracking-tighter flex items-center justify-center gap-4 transition-all shadow-[0_0_30px_rgba(2,254,220,0.2)] active:scale-[0.98]"
          >
            Start Verification Scan
            <ShieldCheck className="w-5 h-5" />
          </button>
        </div>
      </GlossyCard>
    </div>
  );
}
