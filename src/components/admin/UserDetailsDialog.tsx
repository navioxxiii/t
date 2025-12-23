/**
 * User Details Dialog
 * View comprehensive user information
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserDetails, UserProfile } from '@/hooks/useAdminUsers';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Wallet,
  Activity,
  DollarSign,
} from 'lucide-react';

interface UserDetailsDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  const { data, isLoading } = useUserDetails(user?.id || null);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <User className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">
                  User ID
                </div>
                <div className="font-mono text-sm text-text-primary">{user.id.slice(0, 8)}...</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Mail className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">
                  Email
                </div>
                <div className="text-sm text-text-primary">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Shield className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">
                  Role
                </div>
                <div className="text-sm font-medium capitalize text-text-primary">
                  {user.role === 'super_admin' ? 'Super Admin' : user.role}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Activity className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">
                  Status
                </div>
                <div className="mt-1">
                  <StatusBadge status={user.is_banned ? 'banned' : 'active'} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <Calendar className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">
                  Registered
                </div>
                <div className="text-sm text-text-primary">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <DollarSign className="h-5 w-5 text-text-secondary" />
              <div>
                <div className="text-xs text-text-tertiary">
                  Total Balance
                </div>
                <div className="text-sm font-mono text-text-primary">
                  ${parseFloat(user.balance?.toString() || '0').toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Wallets Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5 text-text-secondary" />
              <h3 className="font-semibold text-text-primary">Wallets</h3>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : data?.wallets && data.wallets.length > 0 ? (
              <div className="space-y-2">
                {(data.wallets as unknown[]).map((wallet: unknown) => {
                  const w = wallet as {
                    id: string;
                    coin_symbol?: string;
                    coin_name?: string;
                    address?: string;
                    balance?: string | number;
                  };
                  return (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 border border-bg-tertiary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary">
                          {w.coin_symbol?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{w.coin_name}</div>
                          <div className="text-xs text-text-tertiary font-mono">
                            {w.address?.slice(0, 12)}...
                            {w.address?.slice(-8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-text-primary">
                          {parseFloat(w.balance?.toString() || '0').toFixed(8)}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {w.coin_symbol}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">
                No wallets found
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-text-secondary" />
              <h3 className="font-semibold text-text-primary">Recent Transactions</h3>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recent_transactions &&
              data.recent_transactions.length > 0 ? (
              <div className="space-y-2">
                {(data.recent_transactions as unknown[]).map((tx: unknown) => {
                  const t = tx as {
                    id: string;
                    type: string;
                    coin_symbol: string;
                    amount: string | number;
                    status:
                      | 'pending'
                      | 'confirmed'
                      | 'completed'
                      | 'failed'
                      | 'cancelled';
                  };
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 border border-bg-tertiary rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            t.type === 'deposit' ? 'default' : 'secondary'
                          }
                        >
                          {t.type}
                        </Badge>
                        <span className="font-medium text-text-primary">{t.coin_symbol}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-text-primary">
                          {parseFloat(t.amount.toString()).toFixed(8)}
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">
                No transactions found
              </div>
            )}
          </div>

          {/* Ban Info (if banned) */}
          {user.is_banned && (
            <div className="p-4 bg-action-red/10 border border-action-red/20 rounded-lg">
              <h3 className="font-semibold text-action-red mb-2">
                Ban Information
              </h3>
              <div className="space-y-1 text-sm text-action-red">
                <div>
                  <span className="font-medium">Banned on:</span>{' '}
                  {user.banned_at
                    ? new Date(user.banned_at).toLocaleString()
                    : 'Unknown'}
                </div>
                {user.banned_reason && (
                  <div>
                    <span className="font-medium">Reason:</span>{' '}
                    {user.banned_reason}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
