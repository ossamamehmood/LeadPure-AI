import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ShieldCheck } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto w-full space-y-10 sm:space-y-14 py-4 sm:py-8">
      {/* Benefit Overview Cards (Engine details: RFC 5321 Port 25 + catch-all probe + 100-email CI chunks) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
        <GlossyCard glow="gradient" className="p-6 sm:p-8 rounded-2xl sm:rounded-[32px] group">
          <div className="flex justify-between items-center gap-2 mb-4 sm:mb-6">
            <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap">Real-Time Check</p>
            <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-[9px] rounded-full uppercase font-black tracking-widest border border-brand-blue/20 whitespace-nowrap shrink-0">No Email Sent</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-app-text tracking-wide uppercase italic">Live Inbox Check</h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-2.5 leading-relaxed font-medium">
            Checks straight with the recipient&apos;s mail server in seconds to confirm the inbox exists—without ever sending a message.
          </p>
        </GlossyCard>

        <GlossyCard glow="blue" className="p-6 sm:p-8 rounded-2xl sm:rounded-[32px] group">
          <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 sm:mb-6">Bounce Protection</p>
          <h3 className="text-xl sm:text-2xl font-black text-brand-blue tracking-wide uppercase italic">Catch-All &amp; Risk Guard</h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-2.5 leading-relaxed font-medium">
            Spots accept-all domains, disposable inboxes, and role addresses—flagging uncertain leads clearly as RISKY instead of guessing.
          </p>
        </GlossyCard>

        <GlossyCard glow="purple" className="p-6 sm:p-8 rounded-2xl sm:rounded-[32px] group">
          <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 sm:mb-6">Built For Teams</p>
          <h3 className="text-xl sm:text-2xl font-black gradient-text tracking-wide uppercase italic">Up to 5,000 Leads</h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-2.5 leading-relaxed font-medium">
            Drop in large CSV or Excel sheets with live progress tracking, resumable scans, and clean ready-to-send Excel exports.
          </p>
        </GlossyCard>
      </div>

      {/* Main Dropzone (Web Worker parses file off-thread; chunks of 100 dispatch to Actions workers) */}
      <div className="relative group">
        <div
          {...getRootProps({ 'aria-label': 'Upload CSV or Excel lead list' })}
          className={cn(
            'relative transition-all duration-300 rounded-3xl sm:rounded-[40px] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center min-h-[340px] sm:min-h-[440px] group/drop cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
            isDragActive
              ? 'border-brand-blue bg-brand-blue/5 scale-[0.99]'
              : 'border-app-border hover:border-brand-blue/50 bg-app-card/60 backdrop-blur-3xl shadow-2xl'
          )}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent opacity-0 group-hover/drop:opacity-100 transition-opacity"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col items-center text-center p-6 sm:p-12 space-y-6 sm:space-y-8">
            <div className={cn(
              'w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[36px] bg-app-card border border-app-border flex items-center justify-center transition-all duration-300 shadow-2xl relative',
              isDragActive ? 'border-brand-blue shadow-[0_0_40px_rgba(90,92,255,0.3)] scale-105' : 'group-hover/drop:border-brand-blue/40'
            )}>
              <Upload className={cn(
                'w-8 h-8 sm:w-10 sm:h-10 transition-all duration-300',
                isDragActive ? 'text-brand-blue scale-110' : 'text-slate-600 dark:text-slate-400 group-hover/drop:text-app-text'
              )} />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-app-text tracking-tight uppercase italic">
                Clean Your <span className="gradient-text">Lead List</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-semibold uppercase tracking-widest">
                Upload A List &amp; Protect Sender Reputation (V17)
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
                Drag and drop a spreadsheet here, or click to browse files.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 border-t border-app-border pt-6 sm:pt-8 w-full max-w-md">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-blue" />
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-[0.2em]">Up to 5,000 Leads</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-[0.2em]">Live Progress &amp; Resume</span>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 text-[9px] font-black tracking-widest text-slate-700 dark:text-slate-300 uppercase">.XLSX</div>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 text-[9px] font-black tracking-widest text-slate-700 dark:text-slate-300 uppercase">.CSV</div>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 text-[9px] font-black tracking-widest text-slate-700 dark:text-slate-300 uppercase">.XLS</div>
            </div>
          </div>

          <input {...getInputProps()} />
        </div>
      </div>
    </div>
  );
}
