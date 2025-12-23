/**
 * User Context Sidebar Component
 * Shows user information and related data for admin ticket view
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Calendar,
  Ban,
  CheckCircle2,
  ExternalLink,
  Wallet,
  TrendingUp,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface UserContextSidebarProps {
  ticket: {
    id: string;
    user_id?: string | null;
    user_email: string;
    user_name?: string | null;
    is_guest: boolean;
    category: string;
    related_transaction_id?: string | null;
    related_earn_position_id?: string | null;
    related_copy_position_id?: string | null;
    created_at: string;
    user?: {
      id: string;
      email: string;
      full_name?: string;
      role: string;
      is_banned: boolean;
    } | null;
  };
  relatedTransaction?: {
    id: string;
    type: string;
    amount: string;
    coin_symbol: string;
    status: string;
    created_at: string;
  } | null;
  relatedEarnPosition?: {
    id: string;
    amount_usdt: string;
    status: string;
    earn_packages?: {
      name: string;
      apy: string;
    };
  } | null;
  relatedCopyPosition?: {
    id: string;
    amount_usdt: string;
    status: string;
    trader_name: string;
  } | null;
  isUserOnline?: boolean;
}

export function UserContextSidebar({
  ticket,
  relatedTransaction,
  relatedEarnPosition,
  relatedCopyPosition,
  isUserOnline,
}: UserContextSidebarProps) {
  const isGuest = ticket.is_guest;
  const user = ticket.user;

  return (
    <div className="space-y-4">
      {/* User Info */}
      <Card className="bg-bg-secondary border-bg-tertiary">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            {isGuest ? 'Guest Info' : 'User Info'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Online Status */}
          {!isGuest && isUserOnline !== undefined && (
            <div className="flex items-center gap-2 pb-2 border-b border-bg-tertiary">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isUserOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span className={`text-sm font-medium ${isUserOnline ? 'text-green-500' : 'text-text-tertiary'}`}>
                {isUserOnline ? 'Online now' : 'Offline'}
              </span>
            </div>
          )}

          <div>
            <div className="text-xs text-text-tertiary mb-1">Email</div>
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-text-tertiary" />
              <span className="text-sm text-text-primary">{ticket.user_email}</span>
            </div>
          </div>

          {ticket.user_name && (
            <div>
              <div className="text-xs text-text-tertiary mb-1">Name</div>
              <span className="text-sm text-text-primary">{ticket.user_name}</span>
            </div>
          )}

          {isGuest ? (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              Guest User
            </Badge>
          ) : user ? (
            <>
              <div>
                <div className="text-xs text-text-tertiary mb-1">Role</div>
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              </div>

              <div>
                <div className="text-xs text-text-tertiary mb-1">Status</div>
                {user.is_banned ? (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    <Ban className="w-3 h-3 mr-1" />
                    Banned
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>

              <Link href={`/admin/users/${user.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  View User Profile
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </>
          ) : null}

          <div>
            <div className="text-xs text-text-tertiary mb-1">Ticket Created</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-text-tertiary" />
              <span className="text-sm text-text-primary">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Transaction */}
      {relatedTransaction && (
        <Card className="bg-bg-secondary border-bg-tertiary">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Related Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Type</span>
              <Badge variant="outline" className="capitalize">
                {relatedTransaction.type}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Amount</span>
              <span className="text-sm font-medium text-text-primary">
                {relatedTransaction.amount} {relatedTransaction.coin_symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Status</span>
              <Badge variant="outline" className="capitalize">
                {relatedTransaction.status}
              </Badge>
            </div>
            <Link href={`/admin/transactions/${relatedTransaction.id}`}>
              <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
                View Transaction
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Related Earn Position */}
      {relatedEarnPosition && (
        <Card className="bg-bg-secondary border-bg-tertiary">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Related Earn Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Package</span>
              <span className="text-sm font-medium text-text-primary">
                {relatedEarnPosition.earn_packages?.name || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Amount</span>
              <span className="text-sm font-medium text-text-primary">
                ${relatedEarnPosition.amount_usdt} USDT
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">APY</span>
              <span className="text-sm font-medium text-brand-primary">
                {relatedEarnPosition.earn_packages?.apy || 'N/A'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Status</span>
              <Badge variant="outline" className="capitalize">
                {relatedEarnPosition.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Copy Position */}
      {relatedCopyPosition && (
        <Card className="bg-bg-secondary border-bg-tertiary">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Related Copy Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Trader</span>
              <span className="text-sm font-medium text-text-primary">
                {relatedCopyPosition.trader_name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Amount</span>
              <span className="text-sm font-medium text-text-primary">
                ${relatedCopyPosition.amount_usdt} USDT
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">Status</span>
              <Badge variant="outline" className="capitalize">
                {relatedCopyPosition.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ban Appeal Category Info */}
      {ticket.category === 'ban_appeal' && user?.is_banned && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-500">
              <Ban className="w-4 h-4" />
              Ban Appeal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-text-secondary">
              This user is currently banned. Review their appeal carefully before making a decision.
            </p>
            {!isGuest && (
              <Link href={`/admin/users/${user.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-2 mt-3">
                  Review Ban Status
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
