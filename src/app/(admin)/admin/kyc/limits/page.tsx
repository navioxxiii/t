/**
 * KYC Transaction Limits Admin Page
 * Manage transaction limits and feature permissions for different KYC tiers
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CreateKYCLimitDialog } from '@/components/admin/kyc-limits/CreateKYCLimitDialog';
import { EditKYCLimitDialog } from '@/components/admin/kyc-limits/EditKYCLimitDialog';

interface KYCLimit {
  id: string;
  tier: string;
  daily_limit_usd: number;
  monthly_limit_usd: number;
  single_transaction_limit_usd: number;
  can_deposit: boolean;
  can_withdraw: boolean;
  can_swap: boolean;
  can_send: boolean;
  can_earn: boolean;
  can_copy_trade: boolean;
  created_at: string;
  updated_at: string;
}

const tierLabels: Record<string, string> = {
  none: 'None (Unverified)',
  tier_1_basic: 'Tier 1 - Basic',
  tier_2_advanced: 'Tier 2 - Advanced',
  tier_3_enhanced: 'Tier 3 - Enhanced',
};

export default function KYCLimitsPage() {
  const [limits, setLimits] = useState<KYCLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<KYCLimit | null>(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/kyc-limits');
      const data = await response.json();

      if (response.ok) {
        setLimits(data.limits || []);
      } else {
        toast.error(data.error || 'Failed to fetch KYC limits');
      }
    } catch (error) {
      console.error('Error fetching KYC limits:', error);
      toast.error('An error occurred while fetching KYC limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const handleEdit = (limit: KYCLimit) => {
    setSelectedLimit(limit);
    setEditDialogOpen(true);
  };

  const handleDelete = async (limit: KYCLimit) => {
    if (
      !confirm(
        `Are you sure you want to delete limits for "${tierLabels[limit.tier] || limit.tier}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/kyc-limits/${limit.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('KYC limit deleted successfully');
        fetchLimits();
      } else {
        toast.error(data.error || 'Failed to delete KYC limit');
      }
    } catch (error) {
      console.error('Error deleting KYC limit:', error);
      toast.error('An error occurred while deleting the KYC limit');
    }
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedLimit(null);
    fetchLimits();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tier Limits</CardTitle>
              <CardDescription>
                Manage limits for none, tier_1_basic, tier_2_advanced, and tier_3_enhanced
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchLimits}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Daily Limit</TableHead>
                  <TableHead>Monthly Limit</TableHead>
                  <TableHead>Single TX Limit</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                      Loading KYC limits...
                    </TableCell>
                  </TableRow>
                ) : limits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                      No KYC limits configured. Create tiers to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  limits.map((limit) => (
                    <TableRow key={limit.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {tierLabels[limit.tier] || limit.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(limit.daily_limit_usd)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(limit.monthly_limit_usd)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(limit.single_transaction_limit_usd)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {limit.can_deposit && (
                            <Badge variant="secondary" className="text-xs">
                              Deposit
                            </Badge>
                          )}
                          {limit.can_withdraw && (
                            <Badge variant="secondary" className="text-xs">
                              Withdraw
                            </Badge>
                          )}
                          {limit.can_swap && (
                            <Badge variant="secondary" className="text-xs">
                              Swap
                            </Badge>
                          )}
                          {limit.can_send && (
                            <Badge variant="secondary" className="text-xs">
                              Send
                            </Badge>
                          )}
                          {limit.can_earn && (
                            <Badge variant="secondary" className="text-xs">
                              Earn
                            </Badge>
                          )}
                          {limit.can_copy_trade && (
                            <Badge variant="secondary" className="text-xs">
                              Copy
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(limit)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(limit)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateKYCLimitDialog open={createDialogOpen} onOpenChange={handleDialogClose} />

      {selectedLimit && (
        <EditKYCLimitDialog
          open={editDialogOpen}
          onOpenChange={handleDialogClose}
          limit={selectedLimit}
        />
      )}
    </>
  );
}
