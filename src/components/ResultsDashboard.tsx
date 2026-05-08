import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Search, Database, Fingerprint, Activity, Zap, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlossyCard } from './ui/GlossyCard';
import { ProcessedContact } from '../types';

interface ResultsDashboardProps {
  processedData: ProcessedContact[];
  eliminatedData: any[];
  mappings: any;
  onPreview: (data: any[], title: string) => void;
}

export function ResultsDashboard({ processedData, eliminatedData, mappings, onPreview }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'valid' | 'eliminated'>('valid');
  const [searchTerm, setSearchTerm] = useState('');

  const currentData = activeTab === 'valid' ? processedData : eliminatedData;
  const filteredData = currentData.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    const email = String(item[mappings.emailKey] || '').toLowerCase();
    const first = String(item[mappings.firstNameKey] || '').toLowerCase();
    const last = String(item[mappings.lastNameKey] || '').toLowerCase();
    const name = String(item[mappings.nameKey] || '').toLowerCase();
    return email.includes(searchStr) || first.includes(searchStr) || last.includes(searchStr) || name.includes(searchStr);
  });

  const avgConfidence = Math.round((processedData || []).reduce((acc, curr) => acc + (curr.confidenceScore || 0), 0) / ((processedData || []).length || 1));
  const dangerousCount = (eliminatedData || []).filter(item => item.bounceRisk === 'Dangerous' || item.reputationImpact === 'Critical').length;
  const catchAllCount = (eliminatedData || []).filter(item => item.isCatchAll).length;
  const disposableCount = (eliminatedData || []).filter(item => item.isDisposable).length;
  const roleBasedCount = (eliminatedData || []).filter(item => item.isRoleBased).length;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-12 pb-20">
      {/* Infrastructure Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2">
        <GlossyCard glow="cyan" className="p-7 rounded-[32px] shadow-2xl relative border-white/5 bg-[#050505] overflow-hidden group hover:border-brand-cyan/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-5">
            <p className="gradient-text text-[10px] font-black uppercase tracking-[0.2em] italic">Validated Safe</p>
            <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
              <Activity className="w-4 h-4 text-brand-cyan" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black text-white font-mono tracking-tighter">{(processedData || []).length}</p>
            <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">Leads</span>
          </div>
          <div className="flex items-center gap-2 mt-4 bg-white/[0.03] w-fit px-3 py-1.5 rounded-full border border-white/5">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
             <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest italic leading-none">Deliverability Locked</p>
          </div>
        </GlossyCard>

        <GlossyCard glow="pink" className="p-7 rounded-[32px] shadow-2xl relative border-white/5 bg-[#050505] overflow-hidden group hover:border-brand-pink/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-pink/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-5">
            <p className="text-brand-pink text-[10px] font-black uppercase tracking-[0.2em] italic">Risks Neutralized</p>
            <div className="w-8 h-8 rounded-xl bg-brand-pink/10 flex items-center justify-center border border-brand-pink/20">
              <Zap className="w-4 h-4 text-brand-pink" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black text-white font-mono tracking-tighter">{(eliminatedData || []).length}</p>
            <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">Blocks</span>
          </div>
          <div className="space-y-1 mt-4">
            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest italic leading-none border-l border-brand-pink/30 pl-2">
              Filtered {catchAllCount} Catch-All & {disposableCount} Disposable Addresses
            </p>
            <p className="text-[9px] text-brand-pink/80 uppercase font-black tracking-widest italic leading-none border-l border-brand-pink/30 pl-2">
              Prevented {dangerousCount} Critical Bounces
            </p>
          </div>
        </GlossyCard>

        <GlossyCard className="p-7 rounded-[32px] shadow-2xl relative border-white/5 bg-[#050505] overflow-hidden group hover:border-brand-blue/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-5">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">Quality Matrix</p>
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
              <Fingerprint className="w-4 h-4 text-brand-blue" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black text-white font-mono tracking-tighter italic">{avgConfidence}<span className="text-2xl">%</span></p>
          </div>
          <div className="text-[10px] text-slate-600 mt-6 uppercase font-black tracking-[0.2em] italic leading-none flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            Global Accuracy Grade
          </div>
        </GlossyCard>

        <GlossyCard className="p-7 rounded-[32px] shadow-2xl relative border-white/5 bg-[#050505] overflow-hidden group hover:border-white/10 transition-all">
          <div className="flex justify-between items-start mb-5">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">Engine Status</p>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <Cpu className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-4xl font-black text-white tracking-tighter uppercase italic">Protected</p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest italic leading-none">SMTP Mode</p>
            <div className="px-1.5 py-0.5 bg-brand-cyan/20 text-brand-cyan text-[7px] font-bold rounded uppercase tracking-widest border border-brand-cyan/20">Active</div>
          </div>
        </GlossyCard>
      </div>

      <div className="bg-[#050505] rounded-[48px] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Table Controls */}
        <div className="px-10 py-12 flex flex-col md:flex-row justify-between items-center bg-white/[0.01] backdrop-blur-xl gap-8 border-b border-white/5">
          <div className="flex gap-12 w-full md:w-auto">
            <button 
              onClick={() => { setActiveTab('valid'); setSearchTerm(''); }}
              className={cn(
                "pb-4 text-[12px] font-black uppercase tracking-[0.4em] transition-all relative font-mono group",
                activeTab === 'valid' ? "text-brand-cyan" : "text-slate-700 hover:text-slate-500"
              )}
            >
              <span className="relative z-10">Deliverable List</span>
              {activeTab === 'valid' && (
                <motion.div 
                  layoutId="tab" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-cyan shadow-[0_0_20px_#02FEDC]" 
                  initial={false}
                />
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('eliminated'); setSearchTerm(''); }}
              className={cn(
                "pb-4 text-[12px] font-black uppercase tracking-[0.4em] transition-all relative font-mono group",
                activeTab === 'eliminated' ? "text-brand-pink" : "text-slate-700 hover:text-slate-500"
              )}
            >
              <span className="relative z-10">Filtered Contacts</span>
              {activeTab === 'eliminated' && (
                <motion.div 
                  layoutId="tab" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-pink shadow-[0_0_20px_#F502FD]" 
                  initial={false}
                />
              )}
            </button>
          </div>

          <div className="relative w-full md:w-96 group flex gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 to-brand-pink/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-brand-cyan transition-colors z-10" />
              <input 
                type="text"
                placeholder="SEARCH CONTACT DATABASE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl h-14 pl-14 pr-6 text-[11px] font-black text-white placeholder:text-slate-800 outline-none focus:border-brand-cyan/20 transition-all uppercase tracking-[0.2em] italic relative z-0"
              />
            </div>
            <button 
              onClick={() => onPreview(currentData, activeTab === 'valid' ? 'Deliverable Preview' : 'Filtered Preview')}
              className="px-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-cyan transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
        
        {/* Verification Engine Table */}
        <div className="overflow-x-auto min-h-[500px]">
          {filteredData.length > 0 ? (
            <table className="w-full text-left table-fixed border-collapse">
              <thead>
                <tr className="text-slate-600 text-[10px] uppercase tracking-[0.5em] font-black border-b border-white/5 bg-white/[0.01]">
                  <th className="px-12 py-10 w-[35%]">Identity Signature</th>
                  <th className="px-12 py-10 w-[20%]">List Health Score</th>
                  <th className="px-12 py-10 w-[15%]">Status</th>
                  <th className="px-12 py-10 text-left w-[30%]">Engine Intelligence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.slice(0, 100).map((contact, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-all duration-300 group">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xs font-black text-white italic group-hover:border-brand-cyan/20 transition-colors">
                          {String(contact[mappings.firstNameKey] || contact[mappings.nameKey] || 'U')[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-base font-black text-white italic tracking-tighter mb-1 uppercase truncate">
                            {String(contact[mappings.firstNameKey] || contact[mappings.nameKey] || 'Identity Unknown')} {String(contact[mappings.lastNameKey] || '')}
                          </div>
                          <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] font-mono truncate">{String(contact[mappings.emailKey] || 'N/A')}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className={cn(
                            "text-[11px] font-black font-mono tracking-tighter",
                            (contact.confidenceScore || 0) > 90 ? "text-brand-cyan" : 
                            (contact.confidenceScore || 0) > 75 ? "text-brand-blue" : "text-brand-pink"
                          )}>
                            {contact.confidenceScore || 0}% Accuracy
                          </span>
                        </div>
                        <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${contact.confidenceScore || 0}%` }}
                            transition={{ duration: 1, delay: idx * 0.05 }}
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              (contact.confidenceScore || 0) > 90 ? "bg-gradient-to-r from-brand-cyan to-brand-blue shadow-[0_0_10px_rgba(2,254,220,0.4)]" : 
                              (contact.confidenceScore || 0) > 75 ? "bg-brand-blue" : "bg-brand-pink"
                            )}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-8">
                      <div className={cn(
                        "inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                        contact.bounceRisk === 'Low' ? "text-brand-cyan bg-brand-cyan/5 border-brand-cyan/20" :
                        contact.bounceRisk === 'Medium' ? "text-brand-blue bg-brand-blue/5 border-brand-blue/20" :
                        contact.bounceRisk === 'High' ? "text-brand-pink bg-brand-pink/5 border-brand-pink/20" :
                        "text-brand-pink bg-brand-pink/10 border-brand-pink/30 animate-pulse"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          contact.bounceRisk === 'Low' ? "bg-brand-cyan shadow-[0_0_5px_#02FEDC]" :
                          contact.bounceRisk === 'Medium' ? "bg-brand-blue" :
                          "bg-brand-pink"
                        )} />
                        {contact.bounceRisk || 'SAFE'}
                      </div>
                    </td>
                    <td className="px-12 py-8 text-left">
                      <div className="max-w-[280px] mr-auto group-hover:translate-x-2 transition-transform">
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic leading-relaxed mb-1.5">
                          {contact.verificationReason || contact.reason || 'Verified Identification'}
                        </p>
                        <div className="flex items-center justify-start gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] font-mono whitespace-nowrap">
                            MX: {contact.mxRecordFound ? 'PASS' : 'SKIP'}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] font-mono whitespace-nowrap">
                            CLASS: {contact.reputationImpact || 'A'}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-52 px-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-cyan/[0.02] to-transparent pointer-events-none" />
              <div className="w-32 h-32 bg-white/[0.03] rounded-[40px] flex items-center justify-center mb-10 border border-white/5 relative z-10 shadow-2xl">
                <Database className="w-12 h-12 text-slate-800" />
                <div className="absolute inset-0 border border-brand-cyan/20 rounded-[40px] animate-pulse" />
                <div className="absolute -inset-4 border border-white/[0.02] rounded-[48px] animate-ping opacity-20" />
              </div>
              <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 relative z-10">Data Integrity Result Exception</h4>
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
        <div className="px-12 py-10 bg-black/60 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-cyan shadow-[0_0_12px_#02FEDC] animate-pulse" />
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.5em] italic leading-none">
                Protocol: Active Node
              </p>
            </div>
            <div className="h-6 w-px bg-white/5 hidden md:block" />
            <div className="px-4 py-2 bg-white/[0.03] rounded-xl border border-white/5">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] font-mono leading-none">
                {filteredData.length} Identified Objects Indexed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-3 text-slate-600 group">
                <Cpu className="w-4 h-4 group-hover:text-brand-cyan transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Edge Verification Engine</span>
             </div>
             <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-brand-cyan/40 transition-colors cursor-help">
               <ShieldCheck className="w-5 h-5 text-slate-700" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
