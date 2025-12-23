/**
 * Vaults Grid Component
 * Displays available investment vaults in a responsive grid
 */

'use client';

import Link from 'next/link';
import { TrendingUp, Clock, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

interface VaultsGridProps {
  vaults: Vault[];
  loading: boolean;
  error: string | null;
}

const getRiskBadgeStyles = (risk: string) => {
  switch (risk) {
    case 'low':
      return 'bg-action-green/10 text-action-green';
    case 'medium':
      return 'bg-brand-primary/10 text-brand-primary';
    case 'high':
      return 'bg-action-red/10 text-action-red';
    default:
      return 'bg-bg-tertiary text-text-secondary';
  }
};

export function VaultsGrid({ vaults, loading, error }: VaultsGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-tertiary text-center">Loading vaults...</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-72 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-32 bg-bg-tertiary animate-pulse rounded" />
                    <div className="h-3 w-48 bg-bg-tertiary/60 animate-pulse rounded" />
                  </div>
                  <div className="h-5 w-16 bg-bg-tertiary animate-pulse rounded-full" />
                </div>

                <div className="h-10 w-28 bg-brand-primary/10 animate-pulse rounded-full" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-bg-tertiary/60 animate-pulse rounded-md" />
                  <div className="h-16 bg-bg-tertiary/60 animate-pulse rounded-md" />
                </div>

                <div className="h-10 w-full bg-bg-tertiary animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-action-red/30">
        <CardContent className="p-6 text-center">
          <p className="text-action-red">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (vaults.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-text-tertiary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">No Vaults Available</h3>
            <p className="text-text-secondary">
              Check back later for new investment opportunities
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {vaults.map((vault) => (
        <Link key={vault.id} href={`/earn/${vault.id}`}>
          <Card className="h-full transition-all hover:border-brand-primary/50 md:hover:scale-[1.02] md:hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-sm md:text-base">{vault.title}</CardTitle>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full uppercase font-semibold',
                        getRiskBadgeStyles(vault.risk_level)
                      )}
                    >
                      {vault.risk_level}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">{vault.subtitle}</CardDescription>
                </div>
              </div>

              {/* APY Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 rounded-full border border-brand-primary/30 w-fit">
                <TrendingUp className="h-3.5 w-3.5 text-brand-primary" />
                <span className="text-lg md:text-xl font-bold text-brand-primary">
                  {vault.apy_percent}%
                </span>
                <span className="text-xs text-text-secondary">APY</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-md">
                  <Clock className="h-4 w-4 text-text-tertiary shrink-0" />
                  <div>
                    <p className="text-text-tertiary text-xs">Duration</p>
                    <p className="font-semibold text-xs md:text-sm">
                      {vault.duration_months} {vault.duration_months === 1 ? 'mo' : 'mos'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-md">
                  <Lock className="h-4 w-4 text-text-tertiary shrink-0" />
                  <div>
                    <p className="text-text-tertiary text-xs">Min Amount</p>
                    <p className="font-semibold text-xs md:text-sm">${vault.min_amount}</p>
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              {/* {vault.total_capacity && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-text-tertiary">
                    <span>Capacity</span>
                    <span>{vault.availability.fillPercentage.toFixed(0)}% filled</span>
                  </div>
                  <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all rounded-full',
                        vault.availability.isFull
                          ? 'bg-action-red'
                          : 'bg-brand-primary'
                      )}
                      style={{ width: `${Math.min(vault.availability.fillPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )} */}

              {/* CTA */}
              <Button
                className="w-full group"
                disabled={vault.availability.isFull}
                variant={vault.availability.isFull ? 'outline' : 'default'}
                asChild
              >
                <div>
                  {vault.availability.isFull ? (
                    'Capacity Full'
                  ) : (
                    <>
                      Invest Now
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </Button>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
