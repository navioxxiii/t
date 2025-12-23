/**
 * Admin Copy Trade Page
 * Manage traders and view analytics
 */

'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Activity, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreateTraderDialog } from '@/components/admin/copy-trade/CreateTraderDialog';

interface Trader {
  id: string;
  name: string;
  avatar_url: string;
  strategy: string;
  risk_level: string;
  aum_usdt: number;
  current_copiers: number;
  max_copiers: number;
  performance_fee_percent: number;
  lifetime_earnings_usdt: number;
  stats: {
    monthly_roi?: number;
  };
  historical_roi_min: number;
  historical_roi_max: number;
}

export default function AdminCopyTradePage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchTraders();
  }, []);

  const fetchTraders = async () => {
    try {
      const response = await fetch('/api/copy-trade/traders');
      const data = await response.json();

      if (response.ok) {
        setTraders(data.traders || []);
      }
    } catch (error) {
      console.error('Failed to fetch traders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trader: Trader) => {
    if (
      !confirm(
        `Are you sure you want to delete trader "${trader.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/copy-trade/traders/${trader.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Trader deleted successfully');
        fetchTraders();
      } else {
        toast.error(data.error || 'Failed to delete trader');
      }
    } catch (error) {
      console.error('Error deleting trader:', error);
      toast.error('An error occurred while deleting the trader');
    }
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    fetchTraders();
  };

  // Calculate totals
  const totalAum = traders.reduce((sum, t) => sum + Number(t.aum_usdt), 0);
  const totalCopiers = traders.reduce((sum, t) => sum + Number(t.current_copiers), 0);
  const totalEarnings = traders.reduce((sum, t) => sum + Number(t.lifetime_earnings_usdt), 0);
  const avgRoi = traders.length > 0
    ? traders.reduce((sum, t) => sum + (t.stats?.monthly_roi || (t.historical_roi_min + t.historical_roi_max) / 2), 0) / traders.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Copy Trade Management</h1>
        <p className="text-text-secondary">Manage traders and monitor platform performance</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-brand-primary/10 p-3">
                <DollarSign className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Total AUM</p>
                <p className="text-2xl font-bold">
                  ${(totalAum / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-action-green/10 p-3">
                <Users className="h-6 w-6 text-action-green" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Total Copiers</p>
                <p className="text-2xl font-bold">{totalCopiers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Avg Monthly ROI</p>
                <p className="text-2xl font-bold text-action-green">
                  +{avgRoi.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Total Fees Earned</p>
                <p className="text-2xl font-bold">
                  ${totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Traders</CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Trader
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bg-tertiary text-left">
                    <th className="pb-3 font-semibold">Trader</th>
                    <th className="pb-3 font-semibold">Strategy</th>
                    <th className="pb-3 font-semibold">Risk</th>
                    <th className="pb-3 font-semibold text-right">AUM</th>
                    <th className="pb-3 font-semibold text-right">Copiers</th>
                    <th className="pb-3 font-semibold text-right">ROI</th>
                    <th className="pb-3 font-semibold text-right">Fee %</th>
                    <th className="pb-3 font-semibold text-right">Lifetime Earnings</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {traders.map((trader) => {
                    const roi = trader.stats?.monthly_roi ||
                      (trader.historical_roi_min + trader.historical_roi_max) / 2;

                    return (
                      <tr
                        key={trader.id}
                        className="border-b border-bg-tertiary hover:bg-bg-tertiary/30 transition-colors"
                      >
                        <td className="py-4">
                          <Link
                            href={`/admin/copy-trade/${trader.id}/edit`}
                            className="font-semibold hover:text-brand-primary"
                          >
                            {trader.name}
                          </Link>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-text-secondary">
                            {trader.strategy}
                          </span>
                        </td>
                        <td className="py-4">
                          <Badge
                            variant="outline"
                            className={
                              trader.risk_level === 'low'
                                ? 'bg-action-green/10 text-action-green'
                                : trader.risk_level === 'medium'
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : 'bg-action-red/10 text-action-red'
                            }
                          >
                            {trader.risk_level.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 text-right">
                          ${(trader.aum_usdt / 1000000).toFixed(2)}M
                        </td>
                        <td className="py-4 text-right">
                          {trader.current_copiers} / {trader.max_copiers}
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-action-green font-semibold">
                            +{roi.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {trader.performance_fee_percent}%
                        </td>
                        <td className="py-4 text-right font-semibold">
                          ${trader.lifetime_earnings_usdt.toFixed(2)}
                        </td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(trader)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTraderDialog open={createDialogOpen} onOpenChange={handleDialogClose} />
    </div>
  );
}
