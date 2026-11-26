import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FileSpreadsheet, Cpu, Server, Activity, Download } from 'lucide-react';
import { GlossyCard } from '../ui/GlossyCard';
import { StaggerGroup, StaggerItem } from '../ui/MotionPrimitives';

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'In-Browser Parse',
    metric: 'Up to 5,000 Rows',
    detail: 'Web Worker parses CSV and Excel sheets locally on your device without freezing the browser tab.',
    icon: FileSpreadsheet,
  },
  {
    step: '02',
    title: '100-Email Chunks',
    metric: 'Max 3 Parallel Dispatch',
    detail: 'Large lists split cleanly into 100-email batches and initialize a persistent manifest.json job tracker.',
    icon: Cpu,
  },
  {
    step: '03',
    title: 'Port-25 Workers',
    metric: '4 Workers / Runner',
    detail: 'Ephemeral GitHub Actions runners perform real MX + EHLO + MAIL FROM + RCPT TO + Catch-All checks.',
    icon: Server,
  },
  {
    step: '04',
    title: 'Live Manifest Sync',
    metric: 'Resumable Anytime',
    detail: 'Backoff polling (5s to 15s) streams completed chunks live and saves request state in localStorage.',
    icon: Activity,
  },
  {
    step: '05',
    title: 'Exact XLSX Export',
    metric: 'LeadPure_Results.xlsx',
    detail: 'Summary KPIs and spreadsheet exports strictly reflect real arrived engine verdicts with zero guesses.',
    icon: Download,
  },
];

export function ArchitecturePipeline() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative">
      {/* Desktop animated horizontal signal backbone */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute top-11 left-12 right-12 h-[2px] bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden z-0"
      >
        {!shouldReduceMotion ? (
          <motion.div
            className="h-full w-1/3 gradient-bg rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: ['-100%', '350%'] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <div className="h-full w-full gradient-bg opacity-70" />
        )}
      </div>

      <StaggerGroup staggerDelay={0.07} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 relative z-10">
        {PIPELINE_STEPS.map((node) => {
          const Icon = node.icon;
          return (
            <StaggerItem key={node.step} className="h-full">
              <GlossyCard className="p-5 rounded-3xl h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl gradient-surface border border-brand-blue/25 flex items-center justify-center relative">
                      <Icon className="w-5 h-5 text-brand-blue" />
                    </div>
                    <span className="text-xs font-mono font-bold gradient-text">{node.step}</span>
                  </div>
                  <h3 className="text-base font-display font-bold text-app-text tracking-tight">{node.title}</h3>
                  <p className="text-[11px] font-mono font-semibold text-brand-blue mt-1">{node.metric}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">{node.detail}</p>
                </div>
              </GlossyCard>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  );
}
