import React from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

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
    <div className="max-w-4xl mx-auto w-full py-12 px-4 sm:px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold tracking-tight text-app-text mb-4">
          Verify your email lists
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Upload your CSV or Excel file to instantly identify invalid, disposable, and risky email addresses using our enterprise-grade validation engine.
        </p>
      </div>

      <div 
        {...getRootProps()} 
        className={cn(
          "relative transition-all duration-200 rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center min-h-[320px] cursor-pointer bg-app-card group",
          isDragActive 
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 scale-[0.99]" 
            : "border-border-color hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        )}
      >
        <div className="relative z-10 flex flex-col items-center text-center p-8 space-y-6">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200",
            isDragActive ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10"
          )}>
            <UploadCloud className="w-8 h-8" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-app-text mb-1">
              {isDragActive ? "Drop your file here" : "Click or drag file to upload"}
            </p>
            <p className="text-sm text-slate-500">
              Supports .CSV, .XLSX, and .XLS up to 50MB
            </p>
          </div>
        </div>
        <input {...getInputProps()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-app-card border border-border-color">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-4" />
          <h3 className="font-semibold text-app-text mb-2">High Accuracy</h3>
          <p className="text-sm text-slate-500">Deep DNS and SMTP validation ensures zero false positives.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-app-card border border-border-color">
          <FileSpreadsheet className="w-8 h-8 text-indigo-500 mb-4" />
          <h3 className="font-semibold text-app-text mb-2">Auto-Mapping</h3>
          <p className="text-sm text-slate-500">Automatically detects email columns and synchronizes original data.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-app-card border border-border-color">
          <FileText className="w-8 h-8 text-amber-500 mb-4" />
          <h3 className="font-semibold text-app-text mb-2">Detailed Reports</h3>
          <p className="text-sm text-slate-500">Comprehensive breakdown of bounces, catch-alls, and toxic emails.</p>
        </div>
      </div>
    </div>
  );
} 
