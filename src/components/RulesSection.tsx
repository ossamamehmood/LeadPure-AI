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
              <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.35em] mt-3 italic flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LeadPure V17 Standards Active
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10">
          {/* Technical note: DNS MX + RFC 5321 SMTP + catch-all rules enforced in src/utils/processor.ts & engine/probe.mjs */}
          <RuleToggle
            domain="Mail Setup"
            title="Active Mail Server Check"
            description="Makes sure each domain is actively configured to receive email before checking individual inboxes."
            active={true}
            onToggle={() => {}}
          />
          <RuleToggle
            domain="Deliverability"
            title="Flag Accept-All Domains"
            description="Checks whether a domain accepts any random email name. Accept-all servers are flagged as RISKY to protect your bounce rate."
            active={rules.excludeCatchAll}
            onToggle={() => onToggle('excludeCatchAll')}
          />
          <RuleToggle
            domain="Quality"
            title="Filter Disposable Inboxes"
            description="Catches temporary and throwaway inbox providers so low-quality signups stay out of your outreach list."
            active={rules.excludeDisposable}
            onToggle={() => onToggle('excludeDisposable')}
          />
          <RuleToggle
            domain="Audience"
            title="Flag Team & Role Addresses"
            description="Flags generic team inboxes (like info@, support@, admin@) as RISKY so you can focus on real personal contacts."
            active={rules.excludeRoleBased}
            onToggle={() => onToggle('excludeRoleBased')}
          />
          <RuleToggle
            domain="Cleanup"
            title="Clean Names & Locations"
            description="Trims extra spaces and standardizes first name, last name, city, and country formatting in your exported sheet."
            active={rules.strictTitleCase}
            onToggle={() => onToggle('strictTitleCase')}
          />
          <RuleToggle
            domain="Phones"
            title="Standardize Phone Numbers"
            description="Formats valid phone numbers in international E.164 style when a phone column is matched."
            active={rules.forcePlusSign}
            onToggle={() => onToggle('forcePlusSign')}
          />
        </div>

        <div className="mt-10 sm:mt-14 p-5 sm:p-8 bg-slate-50/80 dark:bg-app-card rounded-2xl sm:rounded-[32px] border border-app-border relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="bg-brand-blue/10 p-4 rounded-2xl shrink-0 h-fit border border-brand-blue/20">
              <ShieldCheck className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-black text-app-text uppercase tracking-[0.2em] text-sm italic">Built-In Privacy &amp; 7-Day Cleanup</p>
              <p className="text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed font-medium text-xs max-w-2xl">
                {/* Technical: Browser xlsxWorker parses locally; ephemeral GitHub Actions Port 25 runners + cleanup-results.yml */}
                Your spreadsheets stay in your browser and are never saved in a database. Live mailbox checks run in isolated workers and temporary results automatically delete after 7 days.
              </p>
            </div>
          </div>
        </div>
      </GlossyCard>
    </div>
  );
}
