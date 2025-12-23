/**
 * Earn Tabs Component
 * Unified interface for browsing vaults and viewing portfolio
 */

'use client';

import { useState } from 'react';
import { Lock, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarnTabsProps {
  vaultsContent: React.ReactNode;
  portfolioContent: React.ReactNode;
}

type TabValue = 'vaults' | 'portfolio';

export function EarnTabs({ vaultsContent, portfolioContent }: EarnTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('portfolio');

  const tabs = [
    {
      value: 'portfolio' as TabValue,
      label: 'Portfolio',
      icon: Wallet,
    },
    {
      value: 'vaults' as TabValue,
      label: 'Vaults',
      icon: Lock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Underline Style */}
      <div className="border-b border-bg-tertiary">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'relative flex items-center gap-2 px-1 py-3 font-medium transition-colors',
                  isActive
                    ? 'text-brand-primary'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>

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
      <div className="min-h-[400px]">
        {activeTab === 'vaults' && vaultsContent}
        {activeTab === 'portfolio' && portfolioContent}
      </div>
    </div>
  );
}
