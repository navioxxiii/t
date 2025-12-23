/**
 * Settings Layout
 * Navigation tabs for admin settings
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings, Server, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsTabs = [
  {
    name: 'System',
    href: '/admin/settings/system',
    icon: Server,
    description: 'Maintenance mode and registration controls',
  },
  {
    name: 'Wallet',
    href: '/admin/settings/wallet',
    icon: Wallet,
    description: 'Transaction limits, fees, and feature flags',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-bg-tertiary rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage application configuration and feature flags
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-bg-tertiary">
        <nav className="flex space-x-4 overflow-x-auto" aria-label="Settings tabs">
          {settingsTabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-bg-tertiary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
}
