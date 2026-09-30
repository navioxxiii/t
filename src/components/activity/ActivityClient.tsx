'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBalances } from '@/hooks/useBalances';
import type { Transaction } from '@/hooks/useTransactions';
import { TransactionList } from '@/components/transactions/TransactionList';
import { cn } from '@/lib/utils';

type TypeFilter = 'all' | 'in' | 'out' | 'swap' | 'earn' | 'copy';

const TYPE_FILTERS: { value: TypeFilter; label: string; types?: Transaction['type'][]; empty: string }[] = [
  { value: 'all', label: 'All', empty: 'No transactions yet' },
  { value: 'in', label: 'Received', types: ['deposit', 'earn_claim', 'copy_trade_stop'], empty: 'Nothing received yet' },
  { value: 'out', label: 'Sent', types: ['withdrawal', 'earn_invest', 'copy_trade_start'], empty: 'Nothing sent yet' },
  { value: 'swap', label: 'Swaps', types: ['swap'], empty: 'No swaps yet' },
  { value: 'earn', label: 'Earn', types: ['earn_invest', 'earn_claim'], empty: 'No earn activity yet' },
  { value: 'copy', label: 'Copy trade', types: ['copy_trade_start', 'copy_trade_stop'], empty: 'No copy trading activity yet' },
];

export default function ActivityClient() {
  const [selectedTokenId, setSelectedTokenId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const { data: balances } = useBalances(true); // Include all tokens (including zero balance)

  const activeType = TYPE_FILTERS.find((f) => f.value === typeFilter)!;
  const filtered = typeFilter !== 'all' || selectedTokenId !== 'all';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="px-4 pt-6">
        {/* Filters: transaction type chips + coin */}
        <div className="mb-4 flex items-center gap-2">
          <div className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg bg-bg-tertiary p-1">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={typeFilter === filter.value}
                onClick={() => setTypeFilter(filter.value)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  typeFilter === filter.value
                    ? 'bg-bg-secondary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="ml-auto shrink-0">
            <Select value={selectedTokenId} onValueChange={setSelectedTokenId}>
              <SelectTrigger size="sm" className="h-8 w-[110px] text-xs bg-bg-secondary border-bg-tertiary">
                <SelectValue placeholder="All coins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All coins</SelectItem>
                {balances
                  ?.sort((a, b) => a.token.name.localeCompare(b.token.name))
                  .map((balance) => (
                    <SelectItem key={balance.token.id} value={balance.token.id.toString()} className="text-xs">
                      {balance.token.name} ({balance.token.code.toUpperCase()})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transaction List */}
        <TransactionList
          baseTokenId={selectedTokenId === 'all' ? undefined : parseInt(selectedTokenId)}
          types={activeType.types}
          limit={50}
          emptyLabel={selectedTokenId === 'all' ? activeType.empty : 'No matching transactions'}
          onClearFilters={
            filtered
              ? () => {
                  setTypeFilter('all');
                  setSelectedTokenId('all');
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
