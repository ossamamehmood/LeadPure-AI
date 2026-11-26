import React from 'react';
import { motion } from 'motion/react';
import { Upload, Settings2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileNavProps {
  currentTab: string;
  setTab: (tab: any) => void;
}

export function MobileNav({ currentTab, setTab }: MobileNavProps) {
  const isUploadActive = ['upload', 'mapping', 'processing', 'results'].includes(currentTab);
  const items = [
    { id: 'upload', label: 'Verify', icon: Upload, active: isUploadActive },
    { id: 'rules', label: 'Rules', icon: Settings2, active: currentTab === 'rules' },
    { id: 'history', label: 'History', icon: Clock, active: currentTab === 'history' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 bg-gradient-to-t from-app-bg via-app-bg/95 to-transparent">
      <nav className="flex items-center justify-around h-16 bg-app-card/95 backdrop-blur-2xl border border-app-border rounded-2xl px-2 shadow-2xl" aria-label="Mobile navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 min-h-[44px] h-12 rounded-xl transition-colors gap-1 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                item.active ? 'text-brand-blue' : 'text-slate-600 dark:text-slate-400 hover:text-app-text'
              )}
            >
              {item.active && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-brand-blue/10 border border-brand-blue/20"
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="text-[11px] font-semibold relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
