/**
 * Networks Table Component
 * Displays and manages blockchain networks
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CreateNetworkDialog } from './CreateNetworkDialog';
import { EditNetworkDialog } from './EditNetworkDialog';

interface Network {
  id: string;
  code: string;
  name: string;
  display_name: string;
  network_type: string;
  chain_id: string | null;
  withdrawal_fee: number;
  withdrawal_fee_percent: number;
  min_withdrawal: number;
  max_withdrawal: number | null;
  withdrawal_enabled: boolean;
  deposit_enabled: boolean;
  logo_url: string | null;
  explorer_url: string | null;
  is_testnet: boolean;
  created_at: string;
  updated_at: string;
}

export function NetworksTable() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [networkTypeFilter, setNetworkTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

  const fetchNetworks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (networkTypeFilter !== 'all') params.append('network_type', networkTypeFilter);
      if (statusFilter === 'enabled') params.append('withdrawal_enabled', 'true');
      if (statusFilter === 'disabled') params.append('withdrawal_enabled', 'false');

      const response = await fetch(`/api/admin/networks?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setNetworks(data.networks || []);
      } else {
        toast.error(data.error || 'Failed to fetch networks');
      }
    } catch (error) {
      console.error('Error fetching networks:', error);
      toast.error('An error occurred while fetching networks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, [search, networkTypeFilter, statusFilter]);

  const handleEdit = (network: Network) => {
    setSelectedNetwork(network);
    setEditDialogOpen(true);
  };

  const handleDelete = async (network: Network) => {
    if (!confirm(`Are you sure you want to delete the network "${network.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/networks/${network.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Network deleted successfully');
        fetchNetworks();
      } else {
        toast.error(data.error || 'Failed to delete network');
      }
    } catch (error) {
      console.error('Error deleting network:', error);
      toast.error('An error occurred while deleting the network');
    }
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedNetwork(null);
    fetchNetworks();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blockchain Networks</CardTitle>
              <CardDescription>
                Manage supported blockchain networks and their fee configurations
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Search networks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={networkTypeFilter} onValueChange={setNetworkTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Network Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="evm">EVM</SelectItem>
                  <SelectItem value="utxo">UTXO</SelectItem>
                  <SelectItem value="svm">SVM</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchNetworks}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Chain ID</TableHead>
                    <TableHead>Withdrawal Fee</TableHead>
                    <TableHead>Min/Max</TableHead>
                    <TableHead>Deposit</TableHead>
                    <TableHead>Withdrawal</TableHead>
                    <TableHead>Testnet</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-text-secondary">
                        Loading networks...
                      </TableCell>
                    </TableRow>
                  ) : networks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-text-secondary">
                        No networks found. Create your first network to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    networks.map((network) => (
                      <TableRow key={network.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-text-primary">{network.display_name}</span>
                            <span className="text-sm text-text-tertiary">{network.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{network.network_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {network.chain_id || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{network.withdrawal_fee} fixed</span>
                            {network.withdrawal_fee_percent > 0 && (
                              <span className="text-xs text-text-tertiary">
                                +{network.withdrawal_fee_percent}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>Min: {network.min_withdrawal}</span>
                            <span className="text-text-tertiary">
                              Max: {network.max_withdrawal || 'None'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {network.deposit_enabled ? (
                            <Badge variant="default" className="bg-green-500">
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {network.withdrawal_enabled ? (
                            <Badge variant="default" className="bg-green-500">
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {network.is_testnet ? (
                            <Badge variant="outline" className="text-orange-500">
                              Testnet
                            </Badge>
                          ) : (
                            <Badge variant="outline">Mainnet</Badge>
                          )}
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
                              <DropdownMenuItem onClick={() => handleEdit(network)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(network)}
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
          </div>
        </CardContent>
      </Card>

      <CreateNetworkDialog
        open={createDialogOpen}
        onOpenChange={handleDialogClose}
      />

      {selectedNetwork && (
        <EditNetworkDialog
          open={editDialogOpen}
          onOpenChange={handleDialogClose}
          network={selectedNetwork}
        />
      )}
    </>
  );
}
