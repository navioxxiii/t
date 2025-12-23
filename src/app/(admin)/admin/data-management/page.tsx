/**
 * Admin Data Management Page
 * Manually create users, transactions, earn positions, and copy trading records
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Receipt, TrendingUp, Copy, DollarSign, Undo2, Settings, Unlock, FileText } from 'lucide-react';
import { CreateUserForm } from '@/components/admin/data-management/CreateUserForm';
import { CreateTransactionForm } from '@/components/admin/data-management/CreateTransactionForm';
import { CreateEarnPositionForm } from '@/components/admin/data-management/CreateEarnPositionForm';
import { CreateCopyPositionForm } from '@/components/admin/data-management/CreateCopyPositionForm';
import { AdjustBalanceForm } from '@/components/admin/data-management/AdjustBalanceForm';
import { ReverseTransactionForm } from '@/components/admin/data-management/ReverseTransactionForm';
import { ManagePositionForm } from '@/components/admin/data-management/ManagePositionForm';
import { UnlockBalanceForm } from '@/components/admin/data-management/UnlockBalanceForm';
import { AuditLogViewer } from '@/components/admin/data-management/AuditLogViewer';
import { cn } from '@/lib/utils';

type TabValue = 'user' | 'transaction' | 'earn' | 'copy' | 'adjust-balance' | 'reverse-transaction' | 'manage-position' | 'unlock-balance' | 'audit-log';

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('user');

  const tabs = [
    {
      value: 'user' as TabValue,
      label: 'Create User',
      icon: UserPlus,
    },
    {
      value: 'transaction' as TabValue,
      label: 'Create Transaction',
      icon: Receipt,
    },
    {
      value: 'earn' as TabValue,
      label: 'Create Earn Position',
      icon: TrendingUp,
    },
    {
      value: 'copy' as TabValue,
      label: 'Create Copy Position',
      icon: Copy,
    },
    {
      value: 'adjust-balance' as TabValue,
      label: 'Adjust Balance',
      icon: DollarSign,
    },
    {
      value: 'reverse-transaction' as TabValue,
      label: 'Reverse Transaction',
      icon: Undo2,
    },
    {
      value: 'manage-position' as TabValue,
      label: 'Manage Position',
      icon: Settings,
    },
    {
      value: 'unlock-balance' as TabValue,
      label: 'Unlock Balance',
      icon: Unlock,
    },
    {
      value: 'audit-log' as TabValue,
      label: 'Audit Log',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Data Management</h1>
        <p className="text-text-secondary mt-2">
          Manually create and manage system records with custom dates
        </p>
      </div>

      {/* Underline-style Tab Navigation */}
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
      <div className="mt-6">
        {activeTab === 'user' && (
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                Create a new user account with custom registration date. Wallets will be created automatically with 0 balance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateUserForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'transaction' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Transaction</CardTitle>
              <CardDescription>
                Manually create a transaction with custom date. This will automatically update wallet and profile balances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTransactionForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'earn' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Earn Position</CardTitle>
              <CardDescription>
                Create an earn position for a user. This will deduct USDT wallet balance, update vault capacity, and create related transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateEarnPositionForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'copy' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Copy Trading Position</CardTitle>
              <CardDescription>
                Create a copy trading position. This will deduct USDT wallet balance, update trader stats, and create related transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateCopyPositionForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'adjust-balance' && (
          <Card>
            <CardHeader>
              <CardTitle>Adjust User Balance</CardTitle>
              <CardDescription>
                Manually adjust user balances to fix discrepancies or compensate users. All adjustments are logged in the audit trail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdjustBalanceForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'reverse-transaction' && (
          <Card>
            <CardHeader>
              <CardTitle>Reverse Transaction</CardTitle>
              <CardDescription>
                Undo erroneous transactions by creating compensating entries. The original transaction will be marked as reversed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReverseTransactionForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'manage-position' && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Position</CardTitle>
              <CardDescription>
                Force close or mature stuck positions that failed to process properly. Use this to fix positions that are stuck in active status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManagePositionForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'unlock-balance' && (
          <Card>
            <CardHeader>
              <CardTitle>Unlock Balance</CardTitle>
              <CardDescription>
                Release locked funds back to available balance. Use this for positions that failed to close properly and left funds stuck in locked status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnlockBalanceForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit-log' && (
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                View complete history of all admin actions including balance adjustments, transaction reversals, and position management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogViewer />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
