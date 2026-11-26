import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { GlossyCard } from './ui/GlossyCard';
import { RuleToggle } from './RuleToggle';
import { StaggerGroup, StaggerItem } from './ui/MotionPrimitives';
import { ValidationRules } from '../types';

interface RulesSectionProps {
  rules: ValidationRules;
  onToggle: (key: keyof ValidationRules) => void;
}

export function RulesSection({ rules, onToggle }: RulesSectionProps) {
  return (
    <div className="max-w-5xl mx-auto w-full px-1 sm:px-0">
      <GlossyCard className="p-5 sm:p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden border-app-border">
        <div className="relative z-10 mb-8 sm:mb-10">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-brand-blue rounded-full" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-app-text tracking-tight leading-none">
                Verification Rules
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LeadPure V17 Protection Rules Active
              </p>
            </div>
          </div>
        </div>

        {/* Technical note: DNS MX + RFC 5321 SMTP + catch-all rules enforced in src/utils/processor.ts & engine/probe.mjs */}
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 relative z-10" staggerDelay={0.05}>
          <StaggerItem>
            <RuleToggle
              domain="Mail Setup"
              title="Active Mail Server Check"
              description="Makes sure each domain is actively configured to receive email before checking individual inboxes."
              active={true}
              onToggle={() => {}}
            />
          </StaggerItem>
          <StaggerItem>
            <RuleToggle
              domain="Deliverability"
              title="Flag Accept-All Domains"
              description="Checks whether a domain accepts any random email name. Accept-all servers are flagged as RISKY to protect your bounce rate."
              active={rules.excludeCatchAll}
              onToggle={() => onToggle('excludeCatchAll')}
            />
          </StaggerItem>
          <StaggerItem>
            <RuleToggle
              domain="Quality"
              title="Filter Disposable Inboxes"
              description="Catches temporary and throwaway inbox providers so low-quality signups stay out of your outreach list."
              active={rules.excludeDisposable}
              onToggle={() => onToggle('excludeDisposable')}
            />
          </StaggerItem>
          <StaggerItem>
            <RuleToggle
              domain="Audience"
              title="Flag Team & Role Addresses"
              description="Flags generic team inboxes (like info@, support@, admin@) as RISKY so you can focus on real personal contacts."
              active={rules.excludeRoleBased}
              onToggle={() => onToggle('excludeRoleBased')}
            />
          </StaggerItem>
          <StaggerItem>
            <RuleToggle
              domain="Cleanup"
              title="Clean Names & Locations"
              description="Trims extra spaces and standardizes first name, last name, city, and country formatting in your exported sheet."
              active={rules.strictTitleCase}
              onToggle={() => onToggle('strictTitleCase')}
            />
          </StaggerItem>
          <StaggerItem>
            <RuleToggle
              domain="Phones"
              title="Standardize Phone Numbers"
              description="Formats valid phone numbers in international E.164 style when a phone column is matched."
              active={rules.forcePlusSign}
              onToggle={() => onToggle('forcePlusSign')}
            />
          </StaggerItem>
        </StaggerGroup>

        <div className="mt-8 sm:mt-10 p-5 sm:p-7 bg-slate-50/80 dark:bg-white/[0.025] rounded-2xl border border-app-border relative z-10">
          <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
            <div className="bg-brand-blue/10 p-3.5 rounded-2xl shrink-0 h-fit border border-brand-blue/20">
              <ShieldCheck className="w-7 h-7 text-brand-blue" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-display font-bold text-app-text text-sm">Built-In Privacy &amp; 7-Day Cleanup</p>
              <p className="text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed text-xs max-w-2xl">
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
