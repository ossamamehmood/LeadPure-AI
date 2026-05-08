import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { GlossyCard } from './ui/GlossyCard';
import { RuleToggle } from './RuleToggle';
import { ValidationRules } from '../types';

interface RulesSectionProps {
  rules: ValidationRules;
  onToggle: (key: keyof ValidationRules) => void;
}

export function RulesSection({ rules, onToggle }: RulesSectionProps) {
  return (
    <div className="max-w-5xl mx-auto w-full">
      <GlossyCard className="p-8 md:p-14 rounded-[48px] shadow-2xl relative overflow-hidden border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-blue/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />
        
        <div className="relative z-10 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 gradient-bg rounded-full" />
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Security Protocols</h2>
          </div>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.3em] ml-5 italic">Engine Configuration: 0% Bounce Verification Active</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <RuleToggle 
            domain="Deliverability"
            title="Real-Time MX Verification" 
            description="Forces DNS verification of Mail Exchange servers to ensure domain can receive mail. Prevents hard bounces."
            active={true}
            onToggle={() => {}} // Always active for this version
          />
          <RuleToggle 
            domain="Deliverability"
            title="Purge Catch-All Domains" 
            description="Domains that accept everything are high-risk. Disabling this saves your SMTP reputation from unknown bounces."
            active={rules.excludeCatchAll}
            onToggle={() => onToggle('excludeCatchAll')}
          />
          <RuleToggle 
            domain="Security"
            title="Spamtrap Decoy Filter" 
            description="Identify and eliminate static honeypots and recycled traps that burn domain records instantly."
            active={rules.excludeSpamTraps}
            onToggle={() => onToggle('excludeSpamTraps')}
          />
          <RuleToggle 
            domain="Reputation"
            title="Disposable Asset Block" 
            description="Automatically eliminate temporary, high-risk, and burnable mailboxes that destroy sender reputation."
            active={rules.excludeDisposable}
            onToggle={() => onToggle('excludeDisposable')}
          />
          <RuleToggle 
            domain="Intelligence"
            title="Role-Based Filter" 
            description="Detect generic roles (support@, info@) that often result in low engagement and high complaint rates."
            active={rules.excludeRoleBased}
            onToggle={() => onToggle('excludeRoleBased')}
          />
          <RuleToggle 
            domain="Integrity"
            title="Global Normalization" 
            description="Standardize identity attributes across the dataset for optimal CRM ingestion and personalization."
            active={rules.strictTitleCase}
            onToggle={() => onToggle('strictTitleCase')}
          />
          <RuleToggle 
            domain="Protocol"
            title="E.164 Identity Standard" 
            description="Force international telecommunication standards (+). Mandatory for high-volume SMS throughput."
            active={rules.forcePlusSign}
            onToggle={() => onToggle('forcePlusSign')}
          />
        </div>

        <div className="mt-16 p-8 bg-black/40 rounded-[32px] border border-white/5 relative z-10 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink/5 blur-2xl rounded-full -mr-16 -mt-16" />
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="bg-brand-pink/10 p-4 rounded-2xl shrink-0 h-fit border border-brand-pink/20">
              <ShieldCheck className="w-8 h-8 text-brand-pink" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-black text-white uppercase tracking-[0.2em] text-sm italic">Military-Grade Encryption Loop Active</p>
              <p className="text-slate-500 mt-3 leading-relaxed font-medium text-xs max-w-xl">
                All validation occurs in a stateless secure environment. Zero data persistence protocols ensure your lead lists never exit the temporary processing sandbox.
              </p>
            </div>
          </div>
        </div>
      </GlossyCard>
    </div>
  );
}
