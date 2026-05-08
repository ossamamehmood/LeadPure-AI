import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ShieldCheck, PhoneCall } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';

interface LeadUploadProps {
  onDrop: (files: File[]) => void;
}

export function LeadUpload({ onDrop }: LeadUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    }
  });

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlossyCard glow="cyan" className="p-6 rounded-[24px] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Safety Goal</p>
            <span className="px-2 py-1 bg-white/5 text-[8px] rounded-full uppercase font-black tracking-widest border border-white/10 whitespace-nowrap gradient-text">0% Bounces</span>
          </div>
          <h3 className="text-4xl font-black text-white mt-2 tracking-tighter">Gold <span className="text-xl font-medium text-slate-600">Standard</span></h3>
        </GlossyCard>
        
        <GlossyCard glow="pink" className="p-6 rounded-[24px] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Smart Filtering</p>
          <h3 className="text-3xl font-black text-white mt-2 tracking-tighter uppercase italic">Auto-Purge</h3>
        </GlossyCard>

        <GlossyCard glow="blue" className="p-6 rounded-[24px] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Verification Check</p>
          <h3 className="text-4xl font-black gradient-text mt-2 tracking-tighter uppercase italic">Deep Scan</h3>
        </GlossyCard>
      </div>

      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-[40px] p-12 md:p-24 transition-all duration-500 cursor-pointer text-center group relative overflow-hidden",
          isDragActive 
            ? "border-[#02FEDC] bg-[#02FEDC]/5 scale-[0.98] shadow-[0_0_50px_rgba(2,254,220,0.1)]" 
            : "border-white/5 hover:border-[#F502FD]/50 bg-[#050505]/40 hover:shadow-[0_0_40px_rgba(245,2,253,0.05)]"
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-8 relative z-10">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-[#000] border border-white/5 rounded-[32px] flex items-center justify-center mx-auto group-hover:border-white/20 group-hover:-rotate-3 transition-all duration-700 shadow-2xl">
            <Upload className={cn("w-8 h-8 md:w-10 md:h-10 transition-all duration-500", isDragActive ? "text-[#02FEDC] scale-125" : "text-slate-700 group-hover:text-[#02FEDC]")} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Import & Clean Contacts</h2>
            <p className="text-slate-500 mt-3 max-w-sm mx-auto text-sm leading-relaxed font-medium">
              Eliminate risky emails that damage your reputation. Upload your list to achieve a 0% bounce rate.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-white/5 border border-white/5 text-slate-500 px-6 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase">BounceZero AI Active</span>
            <span className="bg-white/5 border border-white/5 text-slate-500 px-6 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase italic underline underline-offset-4 decoration-[#02FEDC]">Auto-Filter Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-black text-slate-500 max-w-lg mx-auto text-center border-t border-white/5 pt-10 tracking-[0.2em] uppercase italic">
        <div className="flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
          <ShieldCheck className="w-4 h-4 gradient-text" />
          <span>Privacy Secured</span>
        </div>
        <div className="flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
          <PhoneCall className="w-4 h-4 text-[#F502FD]" />
          <span>Global Format</span>
        </div>
      </div>
    </div>
  );
}
