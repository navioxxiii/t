/**
 * Vault Details Dialog
 * View comprehensive vault information and statistics
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminEarnVault } from '@/hooks/useAdminEarnVaults';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  DollarSign,
  Users,
  Target,
  Shield,
  Calendar,
  Percent,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Vault {
  id: string;
  title: string;
  subtitle?: string;
  apy_percent: number;
  duration_months: number;
  min_amount: number;
  max_amount?: number;
  total_capacity?: number;
  current_filled: number;
  risk_level: string;
  status: string;
  created_at: string;
}

interface VaultDetailsDialogProps {
  vault: Vault | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultDetailsDialog({
  vault,
  open,
  onOpenChange,
}: VaultDetailsDialogProps) {
  const { data, isLoading } = useAdminEarnVault(vault?.id || '');

  if (!vault) return null;

  const stats = data?.stats;
  const vaultData = data?.vault || vault;

  const capacityUsedPercent = stats?.total_capacity_used_percent || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vault.title}</DialogTitle>
          <DialogDescription>
            {vault.subtitle || 'Vault details and statistics'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vault Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Percent className="h-5 w-5 text-brand-primary" />
              <div>
                <div className="text-xs text-text-tertiary">APY</div>
                <div className="text-lg font-bold text-brand-primary">
                  {vaultData.apy_percent}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Clock className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">Duration</div>
                <div className="text-sm font-semibold text-text-primary">
                  {vaultData.duration_months} {vaultData.duration_months === 1 ? 'Month' : 'Months'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Shield className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">Risk Level</div>
                <div className="text-sm font-semibold text-text-primary capitalize">
                  {vaultData.risk_level}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              {vaultData.status === 'active' ? (
                <Eye className="h-5 w-5 text-action-green" />
              ) : (
                <EyeOff className="h-5 w-5 text-action-red" />
              )}
              <div>
                <div className="text-xs text-text-tertiary">Status</div>
                <div className="text-sm font-semibold text-text-primary capitalize">
                  {vaultData.status.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <DollarSign className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">Min Investment</div>
                <div className="text-sm font-mono text-text-primary">
                  ${vaultData.min_amount?.toLocaleString() || '0'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <DollarSign className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">Max Investment</div>
                <div className="text-sm font-mono text-text-primary">
                  {vaultData.max_amount ? `$${vaultData.max_amount.toLocaleString()}` : 'Unlimited'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Calendar className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">Created</div>
                <div className="text-sm text-text-primary">
                  {new Date(vaultData.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Target className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">Vault ID</div>
                <div className="text-xs font-mono text-text-primary">
                  {vaultData.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Statistics</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 rounded-lg border border-brand-primary/20">
                  <div className="flex items-center gap-2 text-text-tertiary text-sm mb-1">
                    <Users className="h-4 w-4" />
                    Total Positions
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {stats.total_positions || 0}
                  </div>
                  <div className="text-xs text-text-tertiary mt-1">
                    {stats.active_positions || 0} active
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-action-green/10 to-action-green/5 rounded-lg border border-action-green/20">
                  <div className="flex items-center gap-2 text-text-tertiary text-sm mb-1">
                    <DollarSign className="h-4 w-4" />
                    Total Locked
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    ${stats.total_locked_usdt?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-text-tertiary mt-1">
                    Avg: ${stats.average_position_size?.toFixed(2) || '0'}
                  </div>
                </div>
              </div>

              {vaultData.total_capacity && (
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-secondary">Capacity Used</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {capacityUsedPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary transition-all"
                      style={{ width: `${Math.min(capacityUsedPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-text-tertiary">
                    <span>${vaultData.current_filled?.toLocaleString() || '0'}</span>
                    <span>${vaultData.total_capacity.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-bg-tertiary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-1">Active</div>
                  <div className="text-lg font-bold text-action-green">
                    {stats.active_positions || 0}
                  </div>
                </div>
                <div className="p-3 bg-bg-tertiary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-1">Matured</div>
                  <div className="text-lg font-bold text-text-primary">
                    {stats.matured_positions || 0}
                  </div>
                </div>
                <div className="p-3 bg-bg-tertiary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-1">Withdrawn</div>
                  <div className="text-lg font-bold text-text-tertiary">
                    {stats.withdrawn_positions || 0}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
