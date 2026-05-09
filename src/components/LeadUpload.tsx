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
    },
    multiple: false
  });

  return (
    <div className="max-w-5xl mx-auto w-full space-y-16 py-8">
      {/* Top Value Propositions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlossyCard glow="gradient" className="p-8 rounded-[32px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Protocol</p>
            <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-[9px] rounded-full uppercase font-black tracking-widest border border-brand-blue/20">0% Bounces</span>
          </div>
          <h3 className="text-2xl font-black text-app-text tracking-widest uppercase italic transition-all duration-500 group-hover:translate-x-1">Gold Standard</h3>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed font-medium">Our proprietary validation logic ensures maximum deliverability by purging dead nodes.</p>
        </GlossyCard>
        
        <GlossyCard glow="blue" className="p-8 rounded-[32px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Logic Core</p>
          <h3 className="text-2xl font-black text-brand-blue tracking-widest uppercase italic group-hover:translate-x-1 transition-transform">Auto-Purge</h3>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed font-medium">Synthetically generated addresses and commercial bots are automatically stripped from your sequence.</p>
        </GlossyCard>
        
        <GlossyCard glow="purple" className="p-8 rounded-[32px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Audit Depth</p>
          <h3 className="text-2xl font-black gradient-text tracking-widest uppercase italic group-hover:translate-x-1 transition-transform">Deep Scan</h3>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed font-medium">Every identity undergoes a multi-layer verification check including SMTP and infrastructure audits.</p>
        </GlossyCard>
      </div>

      {/* Main Dropzone */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-brand-cyan/10 via-brand-blue/10 to-brand-purple/10 rounded-[48px] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
        
        <div 
          {...getRootProps()} 
          className={cn(
            "relative transition-all duration-700 rounded-[40px] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center min-h-[480px] group/drop cursor-pointer",
            isDragActive 
              ? "border-brand-blue bg-brand-blue/5 scale-[0.99]" 
              : "border-app-border hover:border-brand-blue/40 bg-app-bg/40 backdrop-blur-3xl shadow-2xl transition-colors duration-500"
          )}
        >
          {/* Internal Mesh Effect */}
          <div className="absolute inset-0 opacity-10 group-hover/drop:opacity-20 transition-opacity duration-700">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#5A5CFF_0%,transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,#9D00FF_0%,transparent_50%)]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center p-12 space-y-10">
            <div className={cn(
              "w-28 h-28 rounded-[36px] bg-app-card border border-app-border flex items-center justify-center transition-all duration-700 shadow-2xl relative group-hover/drop:-rotate-6",
              isDragActive ? "border-brand-blue shadow-[0_0_40px_rgba(90,92,255,0.3)]" : "group-hover/drop:border-brand-blue/40"
            )}>
              <Upload className={cn(
                "w-10 h-10 transition-all duration-700",
                isDragActive ? "text-brand-blue scale-125" : "text-slate-600 group-hover/drop:text-slate-100"
              )} />
              {/* Dynamic Particles effect could go here in future */}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-app-text tracking-widest uppercase italic transition-all duration-700">
                Identity <span className="gradient-text">Ingestion</span>
              </h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed font-medium uppercase tracking-widest">
                Deploy your database for deep verification. 
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-10 border-t border-white/5 pt-10">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-brand-blue" />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Enterprise Vault</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Live Validation Active</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="px-4 py-1.5 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black tracking-widest text-slate-500 uppercase">.XLSX</div>
              <div className="px-4 py-1.5 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black tracking-widest text-slate-500 uppercase">.CSV</div>
              <div className="px-4 py-1.5 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black tracking-widest text-slate-500 uppercase">.XLS</div>
            </div>
          </div>
          
          <input {...getInputProps()} />
        </div>
      </div>
    </div>
  );
}
