import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Search, Database, Fingerprint, Activity, Zap, Cpu, Download } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';
import { ProcessedContact } from '../types';

interface ResultsDashboardProps {
  processedData: ProcessedContact[];
  eliminatedData: any[];
  mappings: any;
  onPreview: (data: any[], title: string) => void;
  onDownloadValid: () => void;
  onDownloadEliminated: (tier?: 'all' | 'risky' | 'dangerous') => void;
  stats?: any;
}

const MemoizedRow = React.memo(({ contact, mappings }: { contact: any, mappings: any }) => {
  if (!contact) return null;

  return (
    <div className="border-b border-app-border hover:bg-white/[0.02] transition-colors duration-300 group flex flex-col md:flex-row md:items-center py-6 md:py-0 md:h-24 will-change-transform contain-layout contain-paint px-6 md:px-0">
      <div className="md:px-10 py-2 md:py-4 w-full md:w-[35%] flex items-center gap-4 md:gap-5 overflow-hidden">
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-app-bg border border-app-border flex items-center justify-center text-xs font-black text-app-text italic group-hover:border-brand-blue/30 transition-all group-hover:scale-105 duration-500">
          {String(contact[mappings.firstNameKey] || contact[mappings.nameKey] || 'U')[0].toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <div className="text-sm md:text-base font-black text-app-text italic tracking-tighter mb-0.5 md:mb-1 uppercase truncate transition-colors duration-500">
            {String(contact[mappings.firstNameKey] || contact[mappings.nameKey] || 'Identity Unknown')} {String(contact[mappings.lastNameKey] || '')}
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] font-mono truncate">{String(contact[mappings.emailKey] || 'N/A')}</div>
        </div>
      </div>

      <div className="md:px-10 py-3 md:py-4 w-full md:w-[20%] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-3 md:gap-2">
        <span className={cn(
          "text-[10px] md:text-[11px] font-black font-mono tracking-tighter whitespace-nowrap",
          (contact.confidenceScore || 0) >= 99 ? "bg-gradient-to-r from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] bg-clip-text text-transparent" : 
          (contact.confidenceScore || 0) > 95 ? "text-brand-blue" : "text-brand-pink"
        )}>
          {contact.confidenceScore || 0}% Accuracy
        </span>
        <div className="flex-1 md:w-full h-1 bg-white/[0.03] rounded-full overflow-hidden border border-white/5 max-w-[100px] md:max-w-none">
          <div 
            style={{ width: `${contact.confidenceScore || 0}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              (contact.confidenceScore || 0) > 90 ? "bg-gradient-to-r from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] shadow-[0_0_10px_rgba(90,92,255,0.4)]" : 
              (contact.confidenceScore || 0) > 75 ? "bg-brand-blue" : "bg-brand-pink"
            )}
          />
        </div>
      </div>

      <div className="md:px-10 py-2 md:py-4 w-full md:w-[15%]">
        <div className={cn(
          "inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
          (contact.verificationStatus === 'safe' || contact.verificationStatus === 'verified') ? "text-brand-blue bg-brand-blue/5 border-brand-blue/20" :
          contact.verificationStatus === 'usable' ? "text-blue-400 bg-blue-400/5 border-blue-400/20" :
          contact.verificationStatus === 'risky' ? "text-amber-400 bg-amber-400/5 border-amber-400/20" :
          "text-brand-pink bg-brand-pink/5 border-brand-pink/20"
        )}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            (contact.verificationStatus === 'safe' || contact.verificationStatus === 'verified') ? "bg-gradient-to-r from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] shadow-[0_0_5px_rgba(90,92,255,0.6)]" :
            contact.verificationStatus === 'usable' ? "bg-blue-400" :
            contact.verificationStatus === 'risky' ? "bg-amber-400" :
            "bg-brand-pink"
          )} />
          {contact.verificationStatus || 'SAFE'}
        </div>
      </div>

      <div className="md:px-10 py-2 md:py-4 w-full md:w-[30%] overflow-hidden">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
            (contact.confidenceScore || 0) >= 86 ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20' : 
            (contact.confidenceScore || 0) >= 65 ? 'bg-blue-400/10 text-blue-400' : 
            (contact.confidenceScore || 0) >= 31 ? 'bg-amber-400/10 text-amber-400' : 'bg-brand-pink/10 text-brand-pink'
          }`}>
            {contact.confidenceScore}% Confidence
          </span>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{contact.verificationStatus === 'safe' ? 'Verified Safe' : contact.verificationStatus}</span>
        </div>
        <p className="text-[9px] font-black bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent uppercase tracking-wider line-clamp-1 italic">
          {contact.provider === 'google' ? 'Google Cloud Intelligence: Trusted Identity' : 
           contact.provider === 'microsoft' ? 'Microsoft 365 Security: Verified Profile' :
           contact.provider === 'enterprise_gateway' ? 'Enterprise Gateway: High Deliverability' :
           (contact.verificationReason || contact.reason || 'Verified Identity Profile')}
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

  const searchIndex = useMemo(() => {
    return currentData.map(item => {
      const email = String(item[mappings.emailKey] || '');
      const first = String(item[mappings.firstNameKey] || '');
      const last = String(item[mappings.lastNameKey] || '');
      const name = String(item[mappings.nameKey] || '');
      return `${email} ${first} ${last} ${name}`.toLowerCase();
    });
  }, [currentData, mappings]);

  const filteredData = useMemo(() => {
    if (!deferredSearchTerm) return currentData;
    
    const searchStr = deferredSearchTerm.toLowerCase();
    return currentData.filter((_, index) => searchIndex[index].includes(searchStr));
  }, [currentData, deferredSearchTerm, searchIndex]);

  const avgConfidence = Math.round((processedData || []).reduce((acc, curr) => acc + (curr.confidenceScore || 0), 0) / ((processedData || []).length || 1));
  const dangerousCount = (eliminatedData || []).filter(item => item.bounceRisk === 'Dangerous' || item.reputationImpact === 'Critical').length;
  const catchAllCount = (eliminatedData || []).filter(item => item.isCatchAll).length;
  const disposableCount = (eliminatedData || []).filter(item => item.isDisposable).length;
  const roleBasedCount = (eliminatedData || []).filter(item => item.isRoleBased).length;

  const itemContent = React.useCallback((index: number) => {
    return <MemoizedRow contact={filteredData[index]} mappings={mappings} />;
  }, [filteredData, mappings]);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-12 pb-20">
      {/* Infrastructure Status Row */}
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-2"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <GlossyCard glow="gradient" className="p-7 rounded-[40px] shadow-2xl relative border-app-border bg-app-card overflow-hidden group hover:border-brand-blue/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-5">
              <p className="gradient-text text-[10px] font-black uppercase tracking-[0.2em] italic">Validated Safe</p>
              <div className="w-8 h-8 rounded-xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
                <Activity className="w-4 h-4 text-brand-blue" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-app-text font-mono tracking-tighter transition-colors duration-500">{(processedData || []).length}</p>
              <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">Leads</span>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-white/[0.03] w-fit px-3 py-1.5 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full gradient-bg animate-pulse shadow-[0_0_8px_rgba(90,92,255,0.5)]" />
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest italic leading-none">Deliverability Locked</p>
            </div>
          </GlossyCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <GlossyCard glow="pink" className="p-7 rounded-[40px] shadow-2xl relative border-app-border bg-app-card overflow-hidden group hover:border-brand-pink/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-pink/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-5">
              <p className="text-brand-pink text-[10px] font-black uppercase tracking-[0.2em] italic">Risks Neutralized</p>
              <div className="w-8 h-8 rounded-xl bg-brand-pink/10 flex items-center justify-center border border-brand-pink/20">
                <Zap className="w-4 h-4 text-brand-pink" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-app-text font-mono tracking-tighter transition-colors duration-500">{(eliminatedData || []).length}</p>
              <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">Blocks</span>
            </div>
            <div className="space-y-1 mt-4">
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest italic leading-none border-l border-brand-pink/30 pl-2">
                Filtered {catchAllCount} Catch-All & {disposableCount} Disposable
              </p>
              <p className="text-[9px] text-brand-pink/80 uppercase font-black tracking-widest italic leading-none border-l border-brand-pink/30 pl-2">
                Prevented {dangerousCount} Critical Bounces
              </p>
            </div>
          </GlossyCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <GlossyCard className="p-7 rounded-[40px] shadow-2xl relative border-app-border bg-app-card overflow-hidden group hover:border-brand-blue/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-5">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">Quality Matrix</p>
              <div className="w-8 h-8 rounded-xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
                <Fingerprint className="w-4 h-4 text-brand-blue" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={cn(
                "text-5xl font-black font-mono tracking-tighter italic transition-colors duration-500",
                avgConfidence >= 98 ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-app-text"
              )}>
                {avgConfidence}<span className="text-2xl">%</span>
              </p>
            </div>
            <div className="text-[10px] text-slate-600 mt-6 uppercase font-black tracking-[0.2em] italic leading-none flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              Global Accuracy Grade
            </div>
          </GlossyCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <GlossyCard className="p-7 rounded-[40px] shadow-2xl relative border-app-border bg-app-card overflow-hidden group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-5">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">Engine Status</p>
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Cpu className="w-4 h-4 text-slate-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-4xl font-black text-app-text tracking-tighter uppercase italic transition-colors duration-500">Protected</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest italic leading-none">SMTP Mode</p>
              <div className="px-3 py-1 bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 text-brand-blue text-[8px] font-black rounded-full uppercase tracking-widest border border-brand-blue/30 shadow-[0_0_10px_rgba(90,92,255,0.1)]">v10.0 Release</div>
            </div>
          </GlossyCard>
        </motion.div>
      </motion.div>

      <div className="bg-app-card rounded-[48px] border border-app-border shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Table Controls */}
        <div className="px-6 md:px-10 py-8 md:py-12 flex flex-col lg:flex-row justify-between items-center bg-transparent backdrop-blur-xl gap-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 w-full lg:w-auto">
            <button 
              onClick={() => { 
                if ((document as any).startViewTransition) {
                  (document as any).startViewTransition(() => setActiveTab('valid'));
                } else {
                  setActiveTab('valid');
                }
                setSearchTerm(''); 
              }}
              className={cn(
                "pb-4 text-[12px] font-black uppercase tracking-[0.4em] transition-all relative font-mono group active:scale-95 inline-block",
                activeTab === 'valid' ? "text-app-text-bright opacity-100" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <span className={cn(
                "relative z-10 block transition-colors uppercase italic tracking-widest",
                activeTab === 'valid' ? "gradient-text" : ""
              )}>
                Deliverable List
              </span>
              {activeTab === 'valid' && (
                <motion.div 
                  layoutId="tab" 
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-pink shadow-[0_0_20px_rgba(90,92,255,0.6)]" 
                  initial={false}
                />
              )}
            </button>
            <button 
              onClick={() => { 
                if ((document as any).startViewTransition) {
                  (document as any).startViewTransition(() => setActiveTab('eliminated'));
                } else {
                  setActiveTab('eliminated');
                }
                setSearchTerm(''); 
              }}
              className={cn(
                "pb-4 text-[12px] font-black uppercase tracking-[0.4em] transition-all relative font-mono group active:scale-95 inline-block",
                activeTab === 'eliminated' ? "text-brand-pink opacity-100" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <span className="relative z-10 block">Filtered Contacts</span>
              {activeTab === 'eliminated' && (
                <motion.div 
                  layoutId="tab" 
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-pink shadow-[0_0_20px_#F502FD]" 
                  initial={false}
                />
              )}
            </button>
          </div>

          <div className="relative w-full md:w-auto flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 to-brand-pink/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-brand-blue transition-colors z-10" />
              <input 
                type="text"
                placeholder="SEARCH CONTACT DATABASE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-app-bg/40 border border-app-border rounded-2xl h-14 pl-14 pr-6 text-[11px] font-black text-app-text placeholder:text-slate-500 outline-none focus:border-brand-blue/30 transition-all uppercase tracking-[0.2em] italic relative z-0"
              />
            </div>
            <button 
              onClick={() => onPreview(currentData, activeTab === 'valid' ? 'Deliverable Preview' : 'Filtered Preview')}
              className="px-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-blue transition-all flex items-center gap-2 h-14"
            >
              <Database className="w-4 h-4" />
              Preview
            </button>
            {activeTab === 'valid' ? (
              <button 
                onClick={onDownloadValid}
                className="w-full sm:w-auto px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 h-14 border bg-brand-blue/10 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/20"
              >
                <Zap className="w-4 h-4" />
                Export Valid
              </button>
            ) : (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => onDownloadEliminated('risky')}
                  className="flex-1 sm:flex-none px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 h-14 border bg-amber-400/10 border-amber-400/20 text-amber-400 hover:bg-amber-400/20"
                >
                  <Zap className="w-4 h-4" />
                  Risky
                </button>
                <button 
                  onClick={() => onDownloadEliminated('dangerous')}
                  className="flex-1 sm:flex-none px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 h-14 border bg-brand-pink/10 border-brand-pink/20 text-brand-pink hover:bg-brand-pink/20"
                >
                  <Zap className="w-4 h-4" />
                  Dangerous
                </button>
                <button 
                  onClick={() => onDownloadEliminated('all')}
                  className="flex-1 sm:flex-none px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 h-14 border bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Verification Engine Table */}
        <div className="min-h-[500px] overflow-x-auto scrollbar-hide">
          {filteredData.length > 0 ? (
            <div className="w-full">
              <div className="hidden md:flex text-slate-600 text-[10px] uppercase tracking-[0.5em] font-black bg-white/[0.01] border-b border-app-border">
                <div className="px-10 py-10 w-[35%]">Identity Signature</div>
                <div className="px-10 py-10 w-[20%]">List Health Score</div>
                <div className="px-10 py-10 w-[15%]">Status</div>
                <div className="px-10 py-10 text-left w-[30%]">Engine Intelligence</div>
              </div>
              <Virtuoso
                style={{ height: '70vh' }}
                totalCount={filteredData.length}
                itemContent={itemContent}
                className="scrollbar-hide"
                increaseViewportBy={300}
                useWindowScroll={false}
              />
            </div>
          ) : (
            <div className="py-52 px-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-blue/[0.02] to-transparent pointer-events-none" />
              <div className="w-32 h-32 bg-white/[0.03] rounded-[40px] flex items-center justify-center mb-10 border border-white/5 relative z-10 shadow-2xl">
                <Database className="w-12 h-12 text-zinc-800" />
                <div className="absolute inset-0 border border-brand-blue/20 rounded-[40px] animate-pulse" />
                <div className="absolute -inset-4 border border-white/[0.02] rounded-[48px] animate-ping opacity-20" />
              </div>
              <h4 className="text-3xl font-black text-app-text uppercase italic tracking-tighter mb-4 relative z-10 transition-colors duration-500">Data Integrity Result Exception</h4>
              <p className="text-slate-600 text-xs font-black uppercase tracking-[0.3em] max-w-lg mx-auto leading-loose italic relative z-10">
                The current ingestion parameters have filtered all objects from the view. <br/>
                Adjust security protocols or check identity source mapping to reveal results.
              </p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-12 px-8 py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] rounded-full border border-white/5 transition-all relative z-10"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>
        
        {/* Infrastructure Footer */}
        <div className="px-12 py-10 bg-app-bg/60 border-t border-app-border flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#02FEDC] via-[#5A5CFF] to-[#F502FD] shadow-[0_0_12px_rgba(90,92,255,0.5)] animate-pulse" />
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.5em] italic leading-none">
                Protocol: Active Node
              </p>
            </div>
            <div className="h-6 w-px bg-app-border hidden md:block" />
            <div className="px-4 py-2 bg-app-bg/40 rounded-xl border border-app-border">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] font-mono leading-none">
                {filteredData.length} Identified Objects Indexed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-3 text-slate-600 group">
                <Cpu className="w-4 h-4 group-hover:text-brand-blue transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Edge Verification Engine</span>
             </div>
             <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-brand-blue/40 transition-colors cursor-help">
               <ShieldCheck className="w-5 h-5 text-slate-700" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}