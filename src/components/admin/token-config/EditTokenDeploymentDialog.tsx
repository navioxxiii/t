/**
 * Edit Token Deployment Dialog Component
 * Form dialog for editing existing token deployments
 * Note: Base token and network cannot be changed (immutable relationship)
 */

'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';

interface GatewayConfig {
  cid?: string;
  currency?: string;
  default_address?: string;
}

interface TokenDeployment {
  id: string;
  symbol: string;
  display_name: string;
  token_standard: string;
  contract_address: string | null;
  decimals: number;
  gateway: 'plisio' | 'nowpayments' | 'internal';
  gateway_config: GatewayConfig | null;
  price_provider: string | null;
  price_provider_id: string | null;
  is_active: boolean;
  base_token_id: string;
  network_id: string;
  base_tokens: {
    symbol: string;
    name: string;
  };
  networks: {
    display_name: string;
  };
}

interface EditTokenDeploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: TokenDeployment;
}

export function EditTokenDeploymentDialog({
  open,
  onOpenChange,
  deployment,
}: EditTokenDeploymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    base_token_id: '',
    network_id: '',
    symbol: '',
    display_name: '',
    token_standard: 'native',
    contract_address: '',
    decimals: '18',
    gateway: 'internal' as 'plisio' | 'nowpayments' | 'internal',
    gateway_cid: '', // For Plisio
    gateway_currency: '', // For NOWPayments
    default_address: '', // For Internal
    price_provider: '',
    price_provider_id: '',
    is_active: true,
  });

  useEffect(() => {
    if (deployment && open) {
      const config = deployment.gateway_config || {};
      setFormData({
        base_token_id: deployment.base_token_id,
        network_id: deployment.network_id,
        symbol: deployment.symbol || '',
        display_name: deployment.display_name || '',
        token_standard: deployment.token_standard || 'native',
        contract_address: deployment.contract_address || '',
        decimals: String(deployment.decimals || 18),
        gateway: deployment.gateway || 'internal',
        gateway_cid: config.cid || '',
        gateway_currency: config.currency || '',
        default_address: config.default_address || '',
        price_provider: deployment.price_provider || '',
        price_provider_id: deployment.price_provider_id || '',
        is_active: deployment.is_active ?? true,
      });
    }
  }, [deployment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.token_standard) {
      toast.error('Token standard is required');
      setLoading(false);
      return;
    }

    const decimals = parseInt(formData.decimals);
    if (isNaN(decimals) || decimals < 0 || decimals > 18) {
      toast.error('Decimals must be between 0 and 18');
      setLoading(false);
      return;
    }

    // Validate gateway configuration
    if (formData.gateway === 'plisio' && !formData.gateway_cid) {
      toast.error('Plisio CID is required when using Plisio gateway');
      setLoading(false);
      return;
    }

    if (formData.gateway === 'nowpayments' && !formData.gateway_currency) {
      toast.error('Currency code is required when using NOWPayments gateway');
      setLoading(false);
      return;
    }

    if (formData.gateway === 'internal' && !formData.default_address) {
      toast.error('Default address is required when using internal gateway');
      setLoading(false);
      return;
    }

    // Build gateway_config based on gateway type
    let gatewayConfig = null;
    if (formData.gateway === 'plisio') {
      gatewayConfig = { cid: formData.gateway_cid };
    } else if (formData.gateway === 'nowpayments') {
      gatewayConfig = { currency: formData.gateway_currency.toLowerCase() };
    } else if (formData.gateway === 'internal' && formData.default_address) {
      gatewayConfig = { default_address: formData.default_address };
    }

    try {
      const response = await fetch(`/api/admin/token-deployments/${deployment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: formData.symbol,
          display_name: formData.display_name,
          token_standard: formData.token_standard,
          decimals: decimals,
          contract_address: formData.contract_address || null,
          gateway: formData.gateway,
          gateway_config: gatewayConfig,
          price_provider: formData.price_provider || null,
          price_provider_id: formData.price_provider_id || null,
          is_active: formData.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to update token deployment');
        return;
      }

      toast.success('Token deployment updated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating token deployment:', error);
      toast.error('An error occurred while updating the token deployment');
    } finally {
      setLoading(false);
    }
  };

  const requiresContractAddress = ['erc20', 'trc20', 'bep20', 'spl'].includes(formData.token_standard);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Token Deployment</DialogTitle>
          <DialogDescription>
            Update configuration for {deployment.base_tokens.symbol} on {deployment.networks.display_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-bg-secondary rounded-lg">
              <div>
                <Label className="text-xs text-text-tertiary">Base Token (Immutable)</Label>
                <p className="text-sm font-medium">{deployment.base_tokens.symbol} - {deployment.base_tokens.name}</p>
              </div>
              <div>
                <Label className="text-xs text-text-tertiary">Network (Immutable)</Label>
                <p className="text-sm font-medium">{deployment.networks.display_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token_standard">
                Token Standard <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.token_standard}
                onValueChange={(value) => setFormData({ ...formData, token_standard: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="erc20">ERC-20</SelectItem>
                  <SelectItem value="trc20">TRC-20</SelectItem>
                  <SelectItem value="bep20">BEP-20</SelectItem>
                  <SelectItem value="spl">SPL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {requiresContractAddress && (
              <div className="space-y-2">
                <Label htmlFor="contract_address">Contract Address</Label>
                <Input
                  id="contract_address"
                  placeholder="0x..."
                  value={formData.contract_address}
                  onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimals">Decimals</Label>
                <Input
                  id="decimals"
                  type="number"
                  min="0"
                  max="18"
                  value={formData.decimals}
                  onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Payment Gateway Configuration</h4>

              <div className="space-y-2 mb-4">
                <Label htmlFor="gateway">
                  Payment Gateway <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gateway}
                  onValueChange={(value: 'plisio' | 'nowpayments' | 'internal') =>
                    setFormData({ ...formData, gateway: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    <SelectItem value="plisio">Plisio (BTC, ETH, LTC, DOGE, TRX)</SelectItem>
                    <SelectItem value="nowpayments">NOWPayments (SOL, XRP, ADA)</SelectItem>
                    <SelectItem value="internal">Internal (Shared Address)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-tertiary">
                  Select the payment gateway for processing deposits
                </p>
              </div>

              {formData.gateway === 'plisio' && (
                <div className="space-y-2">
                  <Label htmlFor="gateway_cid">
                    Plisio Currency ID (CID) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="gateway_cid"
                    placeholder="e.g., USDT_TRX, BTC, ETH"
                    value={formData.gateway_cid}
                    onChange={(e) => setFormData({ ...formData, gateway_cid: e.target.value })}
                  />
                  <p className="text-xs text-text-tertiary">
                    Plisio&apos;s currency identifier for this token/network combination
                  </p>
                </div>
              )}

              {formData.gateway === 'nowpayments' && (
                <div className="space-y-2">
                  <Label htmlFor="gateway_currency">
                    NOWPayments Currency Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="gateway_currency"
                    placeholder="e.g., sol, xrp, ada"
                    value={formData.gateway_currency}
                    onChange={(e) => setFormData({ ...formData, gateway_currency: e.target.value.toLowerCase() })}
                  />
                  <p className="text-xs text-text-tertiary">
                    NOWPayments currency code (lowercase)
                  </p>
                </div>
              )}

              {formData.gateway === 'internal' && (
                <div className="space-y-2">
                  <Label htmlFor="default_address">
                    Default Deposit Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="default_address"
                    placeholder="Shared address for deposits"
                    value={formData.default_address}
                    onChange={(e) => setFormData({ ...formData, default_address: e.target.value })}
                  />
                  <p className="text-xs text-text-tertiary">
                    Shared address used for all users (requires manual reconciliation)
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Price Provider</h4>
              <div className="space-y-2">
                <Label htmlFor="price_provider">Provider</Label>
                <Select
                  value={formData.price_provider || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, price_provider: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="binance_us">Binance US</SelectItem>
                    <SelectItem value="coingecko">CoinGecko</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.price_provider && (
                <div className="space-y-2 mt-2">
                  <Label htmlFor="price_provider_id">Provider ID</Label>
                  <Input
                    id="price_provider_id"
                    value={formData.price_provider_id}
                    onChange={(e) => setFormData({ ...formData, price_provider_id: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <Label htmlFor="is_active" className="flex flex-col gap-1">
                <span>Active Status</span>
                <span className="font-normal text-xs text-text-tertiary">
                  Visible to users
                </span>
              </Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

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
              {loading ? 'Updating...' : 'Update Deployment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
