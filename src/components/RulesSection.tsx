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
    <div className="max-w-5xl mx-auto w-full px-1 sm:px-0">
      <GlossyCard className="p-5 sm:p-8 md:p-14 rounded-3xl sm:rounded-[48px] shadow-2xl relative overflow-hidden border-app-border">
        <div className="relative z-10 mb-10 sm:mb-14">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-1.5 h-10 bg-gradient-to-b from-brand-cyan via-brand-blue to-brand-pink rounded-full shadow-lg" />
            <div>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-app-text uppercase italic tracking-tighter leading-none">Verification Rules</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.35em] mt-3 italic flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LeadPure V17 Standards Active
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10">
          <RuleToggle
            domain="Infrastructure"
            title="DNS & MX Lookup"
            description="Verifies that each recipient domain publishes active Mail Exchange (MX) records capable of receiving mail."
            active={true}
            onToggle={() => {}}
          />
          <RuleToggle
            domain="Deliverability"
            title="Flag Catch-All Domains"
            description="Probes a nonexistent mailbox on every custom domain. Servers that accept any address are flagged RISKY."
            active={rules.excludeCatchAll}
            onToggle={() => onToggle('excludeCatchAll')}
          />
          <RuleToggle
            domain="Reputation"
            title="Disposable Domain Check"
            description="Identifies temporary and throwaway inbox domains and flags them so they do not pollute campaign lists."
            active={rules.excludeDisposable}
            onToggle={() => onToggle('excludeDisposable')}
          />
          <RuleToggle
            domain="Audience"
            title="Role-Based Detection"
            description="Flags shared or generic role inboxes (such as info@, support@, admin@) as RISKY."
            active={rules.excludeRoleBased}
            onToggle={() => onToggle('excludeRoleBased')}
          />
          <RuleToggle
            domain="Formatting"
            title="Contact Normalization"
            description="Trims whitespace and standardizes contact name, city, and country fields during export."
            active={rules.strictTitleCase}
            onToggle={() => onToggle('strictTitleCase')}
          />
          <RuleToggle
            domain="Phone"
            title="E.164 Phone Formatting"
            description="Formats valid phone numbers using international E.164 notation when a phone column is mapped."
            active={rules.forcePlusSign}
            onToggle={() => onToggle('forcePlusSign')}
          />
        </div>

        <div className="mt-10 sm:mt-14 p-5 sm:p-8 bg-app-card rounded-2xl sm:rounded-[32px] border border-app-border relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="bg-brand-blue/10 p-4 rounded-2xl shrink-0 h-fit border border-brand-blue/20">
              <ShieldCheck className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-black text-app-text uppercase tracking-[0.2em] text-sm italic">Automated Result Retention</p>
              <p className="text-slate-500 mt-2.5 leading-relaxed font-medium text-xs max-w-2xl">
                Spreadsheet parsing runs in a browser Web Worker. SMTP mailbox checks execute on isolated Port 25 workflow runners and probe outputs are automatically pruned after 7 days.
              </p>
            </div>
          </div>
        </div>
      </GlossyCard>
    </div>
  );
}
