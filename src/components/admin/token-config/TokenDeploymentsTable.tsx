/**
 * Token Deployments Table Component
 * Displays and manages token deployments across networks
 * This is the "hub" table connecting base tokens to specific networks
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
import { Plus, MoreHorizontal, Pencil, Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CreateTokenDeploymentDialog } from './CreateTokenDeploymentDialog';
import { EditTokenDeploymentDialog } from './EditTokenDeploymentDialog';

interface TokenDeployment {
  id: string;
  symbol: string;
  display_name: string;
  token_standard: string;
  contract_address: string | null;
  decimals: number;
  is_plisio: boolean;
  plisio_cid: string | null;
  default_address: string | null;
  price_provider: string | null;
  price_provider_id: string | null;
  is_active: boolean;
  base_token_id: string;
  network_id: string;
  created_at: string;
  updated_at: string;
  base_tokens: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  };
  networks: {
    id: string;
    code: string;
    name: string;
    display_name: string;
  };
}

export function TokenDeploymentsTable() {
  const [deployments, setDeployments] = useState<TokenDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tokenStandardFilter, setTokenStandardFilter] = useState<string>('all');
  const [plisioFilter, setPlisioFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<TokenDeployment | null>(null);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (tokenStandardFilter !== 'all') params.append('token_standard', tokenStandardFilter);
      if (plisioFilter === 'enabled') params.append('is_plisio', 'true');
      if (plisioFilter === 'disabled') params.append('is_plisio', 'false');
      if (statusFilter === 'active') params.append('is_active', 'true');
      if (statusFilter === 'inactive') params.append('is_active', 'false');

      const response = await fetch(`/api/admin/token-deployments?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setDeployments(data.deployments || []);
      } else {
        toast.error(data.error || 'Failed to fetch token deployments');
      }
    } catch (error) {
      console.error('Error fetching token deployments:', error);
      toast.error('An error occurred while fetching token deployments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [search, tokenStandardFilter, plisioFilter, statusFilter]);

  const handleEdit = (deployment: TokenDeployment) => {
    setSelectedDeployment(deployment);
    setEditDialogOpen(true);
  };

  const handleDelete = async (deployment: TokenDeployment) => {
    if (
      !confirm(
        `Are you sure you want to delete the deployment "${deployment.display_name}"? This action cannot be undone and may affect users with deposit addresses.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/token-deployments/${deployment.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Token deployment deleted successfully');
        fetchDeployments();
      } else {
        toast.error(data.error || 'Failed to delete token deployment');
      }
    } catch (error) {
      console.error('Error deleting token deployment:', error);
      toast.error('An error occurred while deleting the token deployment');
    }
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedDeployment(null);
    fetchDeployments();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Token Deployments</CardTitle>
              <CardDescription>
                Map base tokens to specific blockchain networks (e.g., USDT on Ethereum, USDT on Tron)
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deployment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Search deployments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={tokenStandardFilter} onValueChange={setTokenStandardFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Token Standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Standards</SelectItem>
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="erc20">ERC-20</SelectItem>
                  <SelectItem value="trc20">TRC-20</SelectItem>
                  <SelectItem value="bep20">BEP-20</SelectItem>
                  <SelectItem value="spl">SPL</SelectItem>
                </SelectContent>
              </Select>
              <Select value={plisioFilter} onValueChange={setPlisioFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Plisio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="enabled">Plisio Enabled</SelectItem>
                  <SelectItem value="disabled">Plisio Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchDeployments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Base Token</TableHead>
                    <TableHead>Network</TableHead>
                    {/* <TableHead>Standard</TableHead> */}
                    {/* <TableHead>Contract</TableHead> */}
                    <TableHead>Plisio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-text-secondary">
                        Loading token deployments...
                      </TableCell>
                    </TableRow>
                  ) : deployments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-text-secondary">
                        No token deployments found. Create your first deployment to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deployments.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-text-primary">{deployment.symbol}</span>
                            <span className="text-sm text-text-tertiary">{deployment.display_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{deployment.base_tokens.symbol}</span>
                            <span className="text-xs text-text-tertiary">{deployment.base_tokens.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{deployment.networks.display_name}</span>
                            <span className="text-xs text-text-tertiary">{deployment.networks.code.toUpperCase()}</span>
                          </div>
                        </TableCell>
                        {/* <TableCell>
                          <Badge variant="outline">{deployment.token_standard.toUpperCase()}</Badge>
                        </TableCell> */}
                        {/* <TableCell className="max-w-[150px]">
                          {deployment.contract_address ? (
                            <span className="text-xs font-mono truncate block" title={deployment.contract_address}>
                              {deployment.contract_address.slice(0, 6)}...{deployment.contract_address.slice(-4)}
                            </span>
                          ) : (
                            <span className="text-text-tertiary text-sm">N/A</span>
                          )}
                        </TableCell> */}
                        <TableCell>
                          {deployment.is_plisio ? (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Enabled</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-text-tertiary">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">Disabled</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {deployment.is_active ? (
                            <Badge variant="default" className="bg-green-500">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
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
                              <DropdownMenuItem onClick={() => handleEdit(deployment)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(deployment)}
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

      <CreateTokenDeploymentDialog
        open={createDialogOpen}
        onOpenChange={handleDialogClose}
      />

      {selectedDeployment && (
        <EditTokenDeploymentDialog
          open={editDialogOpen}
          onOpenChange={handleDialogClose}
          deployment={selectedDeployment}
        />
      )}
    </>
  );
}
