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
    <div className="max-w-5xl mx-auto w-full px-2 sm:px-0">
      <GlossyCard className="p-6 md:p-14 rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-blue/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />
        
        <div className="relative z-10 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-1.5 h-10 bg-gradient-to-b from-brand-cyan via-brand-blue to-brand-pink rounded-full shadow-lg" />
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-app-text uppercase italic tracking-tighter leading-none transition-colors duration-500">Security Protocols</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] mt-3 italic flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
                Zero-Bounce Neutralization ACTIVE
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
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

        <div className="mt-12 md:mt-16 p-6 md:p-8 bg-app-card rounded-[24px] md:rounded-[32px] border border-app-border relative z-10 backdrop-blur-sm transition-colors duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink/5 blur-2xl rounded-full -mr-16 -mt-16" />
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="bg-brand-pink/10 p-4 rounded-2xl shrink-0 h-fit border border-brand-pink/20">
              <ShieldCheck className="w-8 h-8 text-brand-pink" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-black text-app-text uppercase tracking-[0.2em] text-sm italic transition-colors duration-500">Military-Grade Encryption Loop Active</p>
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
