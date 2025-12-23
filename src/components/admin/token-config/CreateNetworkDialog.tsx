/**
 * Create Network Dialog Component
 * Form dialog for creating new blockchain networks
 * Features internal tabs for organizing complex configuration
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface CreateNetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateNetworkDialog({ open, onOpenChange }: CreateNetworkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    display_name: '',
    network_type: 'evm',
    chain_id: '',
    withdrawal_fee: '0',
    withdrawal_fee_percent: '0',
    min_withdrawal: '0',
    max_withdrawal: '',
    withdrawal_enabled: true,
    deposit_enabled: true,
    logo_url: '',
    explorer_url: '',
    is_testnet: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.code || !formData.name || !formData.network_type) {
      toast.error('Code, name, and network type are required');
      setLoading(false);
      return;
    }

    // Validate numeric fields
    const withdrawalFee = parseFloat(formData.withdrawal_fee);
    const withdrawalFeePercent = parseFloat(formData.withdrawal_fee_percent);
    const minWithdrawal = parseFloat(formData.min_withdrawal);
    const maxWithdrawal = formData.max_withdrawal ? parseFloat(formData.max_withdrawal) : null;

    if (isNaN(withdrawalFee) || withdrawalFee < 0) {
      toast.error('Withdrawal fee must be a positive number');
      setLoading(false);
      return;
    }

    if (isNaN(withdrawalFeePercent) || withdrawalFeePercent < 0) {
      toast.error('Withdrawal fee percent must be a positive number');
      setLoading(false);
      return;
    }

    if (isNaN(minWithdrawal) || minWithdrawal < 0) {
      toast.error('Minimum withdrawal must be a positive number');
      setLoading(false);
      return;
    }

    if (maxWithdrawal !== null && (isNaN(maxWithdrawal) || maxWithdrawal < minWithdrawal)) {
      toast.error('Maximum withdrawal must be greater than minimum withdrawal');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/networks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toLowerCase(),
          withdrawal_fee: withdrawalFee,
          withdrawal_fee_percent: withdrawalFeePercent,
          min_withdrawal: minWithdrawal,
          max_withdrawal: maxWithdrawal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create network');
        return;
      }

      toast.success('Network created successfully!');

      // Reset form
      setFormData({
        code: '',
        name: '',
        display_name: '',
        network_type: 'evm',
        chain_id: '',
        withdrawal_fee: '0',
        withdrawal_fee_percent: '0',
        min_withdrawal: '0',
        max_withdrawal: '',
        withdrawal_enabled: true,
        deposit_enabled: true,
        logo_url: '',
        explorer_url: '',
        is_testnet: false,
      });
      setActiveTab('basic');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating network:', error);
      toast.error('An error occurred while creating the network');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Blockchain Network</DialogTitle>
          <DialogDescription>
            Add a new blockchain network with fee configuration and withdrawal limits
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="fees">Fee Config</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Network Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="eth, btc, trx"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toLowerCase() })
                  }
                  required
                />
                <p className="text-xs text-text-tertiary">
                  Unique identifier (lowercase, immutable after creation)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Network Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ethereum"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="Ethereum (ERC-20)"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
                <p className="text-xs text-text-tertiary">
                  Optional - defaults to network name if not provided
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="network_type">
                  Network Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.network_type}
                  onValueChange={(value) => setFormData({ ...formData, network_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    <SelectItem value="evm">EVM (Ethereum Virtual Machine)</SelectItem>
                    <SelectItem value="utxo">UTXO (Bitcoin-like)</SelectItem>
                    <SelectItem value="svm">SVM (Solana Virtual Machine)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chain_id">Chain ID</Label>
                <Input
                  id="chain_id"
                  placeholder="1 for Ethereum Mainnet"
                  value={formData.chain_id}
                  onChange={(e) => setFormData({ ...formData, chain_id: e.target.value })}
                />
                <p className="text-xs text-text-tertiary">
                  Optional - required for EVM networks
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="explorer_url">Block Explorer URL</Label>
                <Input
                  id="explorer_url"
                  placeholder="https://etherscan.io"
                  value={formData.explorer_url}
                  onChange={(e) => setFormData({ ...formData, explorer_url: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_testnet" className="flex flex-col gap-1">
                  <span>Testnet Network</span>
                  <span className="font-normal text-xs text-text-tertiary">
                    Mark this as a test network
                  </span>
                </Label>
                <Switch
                  id="is_testnet"
                  checked={formData.is_testnet}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_testnet: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="fees" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawal_fee">Fixed Withdrawal Fee</Label>
                <Input
                  id="withdrawal_fee"
                  type="number"
                  step="0.00000001"
                  min="0"
                  placeholder="0.001"
                  value={formData.withdrawal_fee}
                  onChange={(e) => setFormData({ ...formData, withdrawal_fee: e.target.value })}
                />
                <p className="text-xs text-text-tertiary">
                  Fixed fee charged per withdrawal (in network's native token)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawal_fee_percent">Percentage Withdrawal Fee</Label>
                <Input
                  id="withdrawal_fee_percent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.5"
                  value={formData.withdrawal_fee_percent}
                  onChange={(e) =>
                    setFormData({ ...formData, withdrawal_fee_percent: e.target.value })
                  }
                />
                <p className="text-xs text-text-tertiary">
                  Percentage fee charged on withdrawal amount (0-100%)
                </p>
              </div>

              <div className="rounded-lg border bg-bg-secondary p-4">
                <h4 className="text-sm font-medium mb-2">Fee Calculation Example</h4>
                <p className="text-sm text-text-secondary">
                  Total Fee = Fixed Fee + (Amount × Percentage / 100)
                </p>
                <p className="text-xs text-text-tertiary mt-2">
                  For a 100 USDT withdrawal with 0.5 fixed fee and 1% percentage fee:<br />
                  Total Fee = 0.5 + (100 × 0.01) = 1.5 USDT
                </p>
              </div>
            </TabsContent>

            <TabsContent value="limits" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="min_withdrawal">Minimum Withdrawal</Label>
                <Input
                  id="min_withdrawal"
                  type="number"
                  step="0.00000001"
                  min="0"
                  placeholder="10"
                  value={formData.min_withdrawal}
                  onChange={(e) => setFormData({ ...formData, min_withdrawal: e.target.value })}
                />
                <p className="text-xs text-text-tertiary">
                  Minimum amount users can withdraw
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_withdrawal">Maximum Withdrawal</Label>
                <Input
                  id="max_withdrawal"
                  type="number"
                  step="0.00000001"
                  min="0"
                  placeholder="Leave empty for no limit"
                  value={formData.max_withdrawal}
                  onChange={(e) => setFormData({ ...formData, max_withdrawal: e.target.value })}
                />
                <p className="text-xs text-text-tertiary">
                  Maximum amount per withdrawal (leave empty for no limit)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="deposit_enabled" className="flex flex-col gap-1">
                  <span>Enable Deposits</span>
                  <span className="font-normal text-xs text-text-tertiary">
                    Allow users to deposit to this network
                  </span>
                </Label>
                <Switch
                  id="deposit_enabled"
                  checked={formData.deposit_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, deposit_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="withdrawal_enabled" className="flex flex-col gap-1">
                  <span>Enable Withdrawals</span>
                  <span className="font-normal text-xs text-text-tertiary">
                    Allow users to withdraw from this network
                  </span>
                </Label>
                <Switch
                  id="withdrawal_enabled"
                  checked={formData.withdrawal_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, withdrawal_enabled: checked })
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Network'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
