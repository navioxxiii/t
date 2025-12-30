/**
 * Create Token Deployment Dialog Component
 * Form dialog for creating new token deployments (hub table)
 * Connects base tokens to specific networks
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

interface CreateTokenDeploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BaseToken {
  id: string;
  symbol: string;
  name: string;
}

interface Network {
  id: string;
  code: string;
  name: string;
  display_name: string;
}

export function CreateTokenDeploymentDialog({ open, onOpenChange }: CreateTokenDeploymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [baseTokens, setBaseTokens] = useState<BaseToken[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
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
    if (open) {
      fetchBaseTokens();
      fetchNetworks();
    }
  }, [open]);

  const fetchBaseTokens = async () => {
    try {
      const response = await fetch('/api/admin/base-tokens?is_active=true');
      const data = await response.json();
      if (response.ok) {
        setBaseTokens(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching base tokens:', error);
      toast.error('Failed to load base tokens');
    }
  };

  const fetchNetworks = async () => {
    try {
      const response = await fetch('/api/admin/networks');
      const data = await response.json();
      if (response.ok) {
        setNetworks(data.networks || []);
      }
    } catch (error) {
      console.error('Error fetching networks:', error);
      toast.error('Failed to load networks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.base_token_id || !formData.network_id || !formData.token_standard) {
      toast.error('Base token, network, and token standard are required');
      setLoading(false);
      return;
    }

    // Validate decimals
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
      const payload = {
        base_token_id: formData.base_token_id,
        network_id: formData.network_id,
        token_standard: formData.token_standard,
        decimals: decimals,
        symbol: formData.symbol || undefined,
        display_name: formData.display_name || undefined,
        contract_address: formData.contract_address || null,
        gateway: formData.gateway,
        gateway_config: gatewayConfig,
        price_provider: formData.price_provider || null,
        price_provider_id: formData.price_provider_id || null,
        is_active: formData.is_active,
      };

      console.log('Creating token deployment with payload:', payload);

      const response = await fetch('/api/admin/token-deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create token deployment');
        return;
      }

      toast.success('Token deployment created successfully!');

      // Reset form
      setFormData({
        base_token_id: '',
        network_id: '',
        symbol: '',
        display_name: '',
        token_standard: 'native',
        contract_address: '',
        decimals: '18',
        gateway: 'internal',
        gateway_cid: '',
        gateway_currency: '',
        default_address: '',
        price_provider: '',
        price_provider_id: '',
        is_active: true,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating token deployment:', error);
      toast.error('An error occurred while creating the token deployment');
    } finally {
      setLoading(false);
    }
  };

  const requiresContractAddress = ['erc20', 'trc20', 'bep20', 'spl'].includes(formData.token_standard);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Token Deployment</DialogTitle>
          <DialogDescription>
            Map a base token to a specific blockchain network
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="base_token_id">
                Base Token <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.base_token_id}
                onValueChange={(value) => setFormData({ ...formData, base_token_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select base token" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-999">
                  {baseTokens.map((token) => (
                    <SelectItem key={token.id} value={token.id}>
                      {token.symbol} - {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-tertiary">
                The underlying token concept (e.g., USDT, BTC)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="network_id">
                Network <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.network_id}
                onValueChange={(value) => setFormData({ ...formData, network_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger> 
                <SelectContent position="popper" className="z-999">
                  {networks.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-tertiary">
                The blockchain network (e.g., Ethereum, Tron)
              </p>
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
                <SelectContent position="popper" className="z-999">
                  <SelectItem value="native">Native (Network's coin)</SelectItem>
                  <SelectItem value="erc20">ERC-20 (Ethereum)</SelectItem>
                  <SelectItem value="trc20">TRC-20 (Tron)</SelectItem>
                  <SelectItem value="bep20">BEP-20 (BSC)</SelectItem>
                  <SelectItem value="spl">SPL (Solana)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {requiresContractAddress && (
              <div className="space-y-2">
                <Label htmlFor="contract_address">
                  Contract Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contract_address"
                  placeholder="0x..."
                  value={formData.contract_address}
                  onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
                />
                <p className="text-xs text-text-tertiary">
                  Smart contract address for this token on the network
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol (optional)</Label>
                <Input
                  id="symbol"
                  placeholder="Auto-generated from base token"
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
              <Label htmlFor="display_name">Display Name (optional)</Label>
              <Input
                id="display_name"
                placeholder="Auto-generated (e.g., Tether (ETH))"
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
                  <SelectContent position="popper" className="z-999">
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
              <h4 className="text-sm font-medium mb-3">Price Provider (Optional)</h4>

              <div className="space-y-2">
                <Label htmlFor="price_provider">Price Provider</Label>
                <Select
                  value={formData.price_provider || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, price_provider: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (use base token price)" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-999">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="binance_us">Binance US</SelectItem>
                    <SelectItem value="coingecko">CoinGecko</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.price_provider && (
                <div className="space-y-2 mt-2">
                  <Label htmlFor="price_provider_id">Price Provider ID</Label>
                  <Input
                    id="price_provider_id"
                    placeholder="e.g., USDTUSDT for Binance, tether for CoinGecko"
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
                  Make this deployment visible to users
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
              {loading ? 'Creating...' : 'Create Deployment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
