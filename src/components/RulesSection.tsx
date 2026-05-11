import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { RuleToggle } from './RuleToggle';
import { ValidationRules } from '../types';

interface RulesSectionProps {
  rules: ValidationRules;
  onToggle: (key: keyof ValidationRules) => void;
}

export function RulesSection({ rules, onToggle }: RulesSectionProps) {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6">
      <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
            <div>
              <h2 className="text-2xl font-semibold text-app-text tracking-tight">Security Protocols</h2>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Zero-Bounce Neutralization Active
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
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

        <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border-color relative z-10 transition-colors duration-200">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl shrink-0 h-fit border border-indigo-100 dark:border-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-app-text text-sm">Enterprise Data Privacy Loop Active</p>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xl">
                All validation occurs in a stateless secure environment. Zero data persistence protocols ensure your lead lists never exit the temporary processing sandbox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
