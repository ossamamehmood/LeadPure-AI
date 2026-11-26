import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';
import { StaggerGroup, StaggerItem } from './ui/MotionPrimitives';

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
    <div className="max-w-5xl mx-auto w-full space-y-10 sm:space-y-12 py-2 sm:py-6">
      {/* Benefit Overview Cards (Technical details: RFC 5321 Port 25 + catch-all probe + 100-email CI chunks) */}
      <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-7" staggerDelay={0.07}>
        <StaggerItem>
          <GlossyCard className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl h-full">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">
                Real-Time Check
              </p>
              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-[10px] rounded-full font-semibold tracking-wide border border-app-border whitespace-nowrap shrink-0">
                No Email Sent
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-app-text tracking-tight">
              Live Inbox Check
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-[13px] mt-2.5 leading-relaxed">
              Connects directly with the recipient mail server to confirm the inbox exists, without sending a message.
            </p>
          </GlossyCard>
        </StaggerItem>

        <StaggerItem>
          <GlossyCard className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl h-full">
            <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-4">
              Bounce Protection
            </p>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-app-text tracking-tight">
              Catch-All &amp; Risk Guard
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-[13px] mt-2.5 leading-relaxed">
              Spots accept-all domains, disposable inboxes, and role addresses, flagging uncertain leads clearly as RISKY instead of guessing.
            </p>
          </GlossyCard>
        </StaggerItem>

        <StaggerItem>
          <GlossyCard className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl h-full">
            <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-4">
              Built For Teams
            </p>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-app-text tracking-tight">
              Up to 5,000 Leads
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-[13px] mt-2.5 leading-relaxed">
              Upload large CSV or Excel spreadsheets with live progress tracking, resumable scans, and clean Excel exports.
            </p>
          </GlossyCard>
        </StaggerItem>
      </StaggerGroup>

      {/* Double-bezel Main Dropzone (Web Worker parses file off-thread; chunks of 100 dispatch to Actions workers) */}
      <div className="p-2 rounded-[34px] sm:rounded-[44px] bg-slate-100/80 dark:bg-white/[0.025] border border-app-border shadow-xl">
        <div
          {...getRootProps({ 'aria-label': 'Upload CSV or Excel lead list' })}
          className={cn(
            'relative transition-all duration-300 rounded-[26px] sm:rounded-[36px] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center min-h-[320px] sm:min-h-[410px] group/drop cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
            isDragActive
              ? 'border-brand-blue bg-brand-blue/[0.06] scale-[0.992]'
              : 'border-slate-300/80 dark:border-white/10 hover:border-brand-blue/50 bg-app-card shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          )}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] opacity-0 group-hover/drop:opacity-100 transition-opacity duration-300"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col items-center text-center p-6 sm:p-12 space-y-6">
            <div className={cn(
              'w-18 h-18 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all duration-300 shadow-lg relative',
              isDragActive
                ? 'border-brand-blue shadow-[0_0_32px_rgba(90,92,255,0.28)] scale-105'
                : 'group-hover/drop:-translate-y-1 group-hover/drop:border-brand-blue/40'
            )}>
              <Upload className={cn(
                'w-7 h-7 sm:w-9 sm:h-9 transition-all duration-300',
                isDragActive ? 'text-brand-blue scale-110' : 'text-slate-600 dark:text-slate-400 group-hover/drop:text-brand-blue'
              )} />
            </div>

            <div className="space-y-2.5">
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-app-text tracking-tight">
                Clean your <span className="gradient-text">lead list</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-medium">
                Upload a spreadsheet to remove undeliverable emails before sending (V14).
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
                Drag and drop a file here, or click anywhere inside to browse.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 border-t border-app-border pt-6 w-full max-w-md">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-blue" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Up to 5,000 Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Live Progress &amp; Resume</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <div className="px-3.5 py-1 bg-slate-100 dark:bg-white/[0.04] rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">.XLSX</div>
              <div className="px-3.5 py-1 bg-slate-100 dark:bg-white/[0.04] rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">.CSV</div>
              <div className="px-3.5 py-1 bg-slate-100 dark:bg-white/[0.04] rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">.XLS</div>
            </div>
          </div>

          <input {...getInputProps()} />
        </div>
      </div>
    </div>
  );
}
