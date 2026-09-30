/**
 * Earn Tabs Component
 * Controlled tab navigation for Vaults and Portfolio views
 */

'use client';

import { Lock, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EarnTabValue = 'vaults' | 'portfolio';

interface EarnTabsProps {
  value: EarnTabValue;
  onValueChange: (value: EarnTabValue) => void;
  vaultsContent: React.ReactNode;
  portfolioContent: React.ReactNode;
  vaultsCount?: number;
  portfolioCount?: number;
}

export function EarnTabs({
  value,
  onValueChange,
  vaultsContent,
  portfolioContent,
  vaultsCount,
  portfolioCount,
}: EarnTabsProps) {
  const tabs = [
    {
      value: 'portfolio' as EarnTabValue,
      label: 'Portfolio',
      icon: Wallet,
      count: portfolioCount,
    },
    {
      value: 'vaults' as EarnTabValue,
      label: 'Vaults',
      icon: Lock,
      count: vaultsCount,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Underline Style */}
      <div className="border-b border-bg-tertiary" role="tablist">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = value === tab.value;

            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => onValueChange(tab.value)}
                className={cn(
                  'relative flex items-center gap-2 px-1 py-3 font-medium transition-colors',
                  isActive
                    ? 'text-brand-primary'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                      isActive
                        ? 'bg-brand-primary/15 text-brand-primary'
                        : 'bg-bg-tertiary text-text-secondary'
                    )}
                  >
                    {tab.count}
                  </span>
                )}

                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]" role="tabpanel">
        {value === 'vaults' && vaultsContent}
        {value === 'portfolio' && portfolioContent}
      </div>
    </div>
  );
}
