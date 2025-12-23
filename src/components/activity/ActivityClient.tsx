'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBalances } from '@/hooks/useBalances';
import { TransactionList } from '@/components/transactions/TransactionList';

export default function ActivityClient() {
  const [selectedTokenId, setSelectedTokenId] = useState<string>('all');
  const { data: balances } = useBalances(true); // Include all tokens (including zero balance)

  return (
    <div className="mx-auto max-w-4xl">
          <div className="px-4 pt-6">
            {/* Filters */}
            <div className="mb-6 flex items-center gap-3">
              <Filter className="h-5 w-5 text-text-secondary" />
              <Select value={selectedTokenId} onValueChange={setSelectedTokenId}>
                <SelectTrigger className="w-[180px] bg-bg-secondary border-bg-tertiary">
                  <SelectValue placeholder="Filter by coin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coins</SelectItem>
                  {balances
                    ?.sort((a, b) => a.token.name.localeCompare(b.token.name))
                    .map((balance) => (
                      <SelectItem key={balance.token.id} value={balance.token.id.toString()}>
                        {balance.token.name} ({balance.token.code.toUpperCase()})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction List */}
            <TransactionList
              baseTokenId={selectedTokenId === 'all' ? undefined : parseInt(selectedTokenId)}
              limit={50}
            />
          </div>
    </div>
  );
}
