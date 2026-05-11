import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Search, Database, Fingerprint, Activity, Zap, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { cn } from '../lib/utils';
import { ProcessedContact } from '../types';

interface ResultsDashboardProps {
  processedData: ProcessedContact[];
  eliminatedData: any[];
  mappings: any;
  onPreview: (data: any[], title: string) => void;
  onDownloadValid: () => void;
  onDownloadEliminated: () => void;
  stats?: any;
}

const MemoizedRow = React.memo(({ contact, mappings }: { contact: any, mappings: any }) => {
  if (!contact) return null;

  const score = contact.confidenceScore || 0;
  const isSafe = contact.bounceRisk === 'Safe' || contact.bounceRisk === 'Low';
  const isMedium = contact.bounceRisk === 'Medium';

  return (
    <div className="border-b border-border-color hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 group flex items-center h-20 will-change-transform">
      <div className="px-6 py-3 w-[35%] flex items-center gap-4 overflow-hidden">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
          {String(contact[mappings.firstNameKey] || contact[mappings.nameKey] || 'U')[0].toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-semibold text-app-text mb-0.5 truncate">
            {String(contact[mappings.firstNameKey] || contact[mappings.nameKey] || 'Unknown')} {String(contact[mappings.lastNameKey] || '')}
          </div>
          <div className="text-xs text-slate-500 truncate">{String(contact[mappings.emailKey] || 'N/A')}</div>
        </div>
      </div>
      <div className="px-6 py-3 w-[20%] flex flex-col justify-center gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-500">Quality Score</span>
          <span className={cn(
            "font-semibold",
            score >= 90 ? "text-emerald-600 dark:text-emerald-500" : 
            score >= 75 ? "text-amber-600 dark:text-amber-500" : "text-red-600 dark:text-red-500"
          )}>
            {score}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            style={{ width: `${score}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-500",
              score >= 90 ? "bg-emerald-500" : 
              score >= 75 ? "bg-amber-500" : "bg-red-500"
            )}
          />
        </div>
      </div>
      <div className="px-6 py-3 w-[15%]">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
          isSafe ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
          isMedium ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
          "text-red-700 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
        )}>
          {isSafe && <CheckCircle2 className="w-3.5 h-3.5" />}
          {isMedium && <AlertTriangle className="w-3.5 h-3.5" />}
          {!isSafe && !isMedium && <ShieldAlert className="w-3.5 h-3.5" />}
          {contact.bounceRisk || 'Safe'}
        </div>
      </div>
      <div className="px-6 py-3 w-[30%] overflow-hidden">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {contact.subStatus && (
            <span className="text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {contact.subStatus.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">
          {contact.verificationReason || contact.reason || 'Verified Identity Profile'}
        </p>
      </div>
    </div>
  );
});

export function ResultsDashboard({ 
  processedData, 
  eliminatedData, 
  mappings, 
  onPreview,
  onDownloadValid,
  onDownloadEliminated,
  stats
}: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'valid' | 'eliminated'>('valid');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  const currentData = activeTab === 'valid' ? processedData : eliminatedData;

  const filteredData = useMemo(() => {
    if (!deferredSearchTerm) return currentData;
    
    const searchStr = deferredSearchTerm.toLowerCase();
    return currentData.filter(item => {
      const email = String(item[mappings.emailKey] || '').toLowerCase();
      const first = String(item[mappings.firstNameKey] || '').toLowerCase();
      const last = String(item[mappings.lastNameKey] || '').toLowerCase();
      const name = String(item[mappings.nameKey] || '').toLowerCase();
      return email.includes(searchStr) || first.includes(searchStr) || last.includes(searchStr) || name.includes(searchStr);
    });
  }, [activeTab, processedData, eliminatedData, searchTerm, mappings]);

  const avgConfidence = Math.round((processedData || []).reduce((acc, curr) => acc + (curr.confidenceScore || 0), 0) / ((processedData || []).length || 1));
  const dangerousCount = (eliminatedData || []).filter(item => item.bounceRisk === 'Dangerous' || item.reputationImpact === 'Critical').length;
  const catchAllCount = (eliminatedData || []).filter(item => item.isCatchAll).length;
  const disposableCount = (eliminatedData || []).filter(item => item.isDisposable).length;

  const itemContent = React.useCallback((index: number) => {
    return <MemoizedRow contact={filteredData[index]} mappings={mappings} />;
  }, [filteredData, mappings]);

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 pb-20 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-semibold text-app-text tracking-tight">Verification Results</h2>
          <p className="text-sm text-slate-500 mt-1">Review and export your verified list.</p>
        </div>
      </div>

      {/* Infrastructure Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Deliverable Leads</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-app-text">{(processedData || []).length}</p>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">Ready to export</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Risks Blocked</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-app-text">{(eliminatedData || []).length}</p>
          </div>
          <div className="text-xs text-slate-500 mt-2 space-y-0.5">
            <p>{dangerousCount} bounces prevented</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Average Quality</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-app-text">{avgConfidence}%</p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${avgConfidence}%` }} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Engine Details</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Cpu className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <p className="text-lg font-semibold text-app-text mb-2">SMTP + DNS</p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Validation Mode</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">Deep Scan</span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Table Controls */}
        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b border-border-color bg-slate-50/50 dark:bg-slate-800/20 gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => { setActiveTab('valid'); setSearchTerm(''); }}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === 'valid' ? "bg-white dark:bg-slate-700 text-app-text shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              Deliverable ({processedData.length})
            </button>
            <button 
              onClick={() => { setActiveTab('eliminated'); setSearchTerm(''); }}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === 'eliminated' ? "bg-white dark:bg-slate-700 text-app-text shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              Filtered ({eliminatedData.length})
            </button>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-border-color rounded-lg h-10 pl-9 pr-4 text-sm text-app-text focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
            <button 
              onClick={activeTab === 'valid' ? onDownloadValid : onDownloadEliminated}
              className="px-4 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              Export {activeTab === 'valid' ? 'Deliverable' : 'Filtered'}
            </button>
          </div>
        </div>
        
        {/* Verification Engine Table */}
        <div className="min-h-[400px]">
          {filteredData.length > 0 ? (
            <div className="min-w-[800px]">
              <div className="flex text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-b border-border-color">
                <div className="px-6 py-3 w-[35%]">Contact Details</div>
                <div className="px-6 py-3 w-[20%]">List Health Score</div>
                <div className="px-6 py-3 w-[15%]">Status</div>
                <div className="px-6 py-3 text-left w-[30%]">Reason</div>
              </div>
              <Virtuoso
                style={{ height: '500px' }}
                totalCount={filteredData.length}
                itemContent={itemContent}
                increaseViewportBy={200}
              />
            </div>
          ) : (
            <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-medium text-app-text mb-2">No records found</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                Try adjusting your search criteria or switch tabs to view other records.
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}