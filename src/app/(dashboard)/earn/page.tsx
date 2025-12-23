'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EarnTabs } from '@/components/earn/EarnTabs';
import { VaultsGrid } from '@/components/earn/VaultsGrid';
import { PortfolioContent } from '@/components/earn/PortfolioContent';

interface Vault {
  id: string;
  title: string;
  subtitle: string;
  apy_percent: number;
  duration_months: number;
  min_amount: number;
  max_amount: number | null;
  total_capacity: number | null;
  risk_level: 'low' | 'medium' | 'high';
  availability: {
    isFull: boolean;
    fillPercentage: number;
    remainingCapacity: number | null;
  };
}

export default function EarnPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
    try {
      const response = await fetch('/api/earn/vaults');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vaults');
      }

      setVaults(data.vaults || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Find max APY for the quick stat
  const maxAPY = vaults.length > 0
    ? Math.max(...vaults.map(v => v.apy_percent))
    : 20;

  return (
    <div className="h-full p-4 pt-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 md:h-6 md:w-6 text-brand-primary" />
            <h1 className="text-xl md:text-2xl font-bold">Earn</h1>
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Lock your crypto and earn competitive yields with fixed-term vaults
          </p>
        </div>

        {/* Quick Stat */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Up to</p>
                <p className="text-base md:text-lg font-bold text-brand-primary">{maxAPY}% APY</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Interface */}
        <EarnTabs
          vaultsContent={
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-semibold">Available Vaults</h2>
                <p className="text-sm text-text-secondary">
                  {loading ? '...' : `${vaults.length} ${vaults.length === 1 ? 'vault' : 'vaults'}`}
                </p>
              </div>

              <VaultsGrid vaults={vaults} loading={loading} error={error} />

              {/* Disclaimer */}
              <Card className="border-bg-tertiary/50">
                <CardContent className="p-4 text-xs text-text-tertiary">
                  <p>
                    <strong>Important:</strong> Funds are locked for the specified duration and cannot be withdrawn early.
                    APY is fixed and guaranteed for the lock period. Past performance does not guarantee future results.
                  </p>
                </CardContent>
              </Card>
            </div>
          }
          portfolioContent={<PortfolioContent />}
        />
      </div>
    </div>
  );
}
