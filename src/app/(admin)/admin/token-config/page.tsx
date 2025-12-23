/**
 * Token Configuration Page
 * Unified admin interface for managing base tokens, networks, and token deployments
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseTokensTable } from '@/components/admin/token-config/BaseTokensTable';
import { NetworksTable } from '@/components/admin/token-config/NetworksTable';
import { TokenDeploymentsTable } from '@/components/admin/token-config/TokenDeploymentsTable';

export default function TokenConfigPage() {
  const [activeTab, setActiveTab] = useState('base-tokens');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Token Configuration</h1>
        <p className="text-text-secondary mt-2">
          Manage base tokens, blockchain networks, and token deployments
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base-tokens">Base Tokens</TabsTrigger>
          <TabsTrigger value="networks">Networks</TabsTrigger>
          <TabsTrigger value="deployments">Token Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="base-tokens" className="mt-6">
          <BaseTokensTable />
        </TabsContent>

        <TabsContent value="networks" className="mt-6">
          <NetworksTable />
        </TabsContent>

        <TabsContent value="deployments" className="mt-6">
          <TokenDeploymentsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
