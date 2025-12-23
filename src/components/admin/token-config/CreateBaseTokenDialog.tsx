/**
 * Create Base Token Dialog
 * Form for creating new base token definitions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface CreateBaseTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBaseTokenDialog({ open, onOpenChange }: CreateBaseTokenDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    symbol: '',
    name: '',
    token_type: 'native',
    decimals: '18',
    is_stablecoin: false,
    binance_id: '',
    coingecko_id: '',
    primary_provider: '',
    logo_url: '',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.code || !formData.symbol || !formData.name) {
      toast.error('Code, symbol, and name are required');
      setLoading(false);
      return;
    }

    if (isNaN(Number(formData.decimals)) || Number(formData.decimals) < 0) {
      toast.error('Decimals must be a positive number');
      setLoading(false);
      return;
    }

    // Validate at least one price source for non-stablecoins
    if (!formData.is_stablecoin && !formData.binance_id && !formData.coingecko_id) {
      toast.error('Provide at least one price source (Binance or CoinGecko)');
      setLoading(false);
      return;
    }

    // Auto-set primary_provider if only one source provided
    let primaryProvider = formData.primary_provider;
    if (!primaryProvider) {
      if (formData.binance_id && !formData.coingecko_id) {
        primaryProvider = 'binance_us';
      } else if (formData.coingecko_id && !formData.binance_id) {
        primaryProvider = 'coingecko';
      }
    }

    try {
      const response = await fetch('/api/admin/base-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toLowerCase(),
          symbol: formData.symbol.toUpperCase(),
          name: formData.name,
          token_type: formData.token_type,
          decimals: Number(formData.decimals),
          is_stablecoin: formData.is_stablecoin,
          binance_id: formData.binance_id || null,
          coingecko_id: formData.coingecko_id || null,
          primary_provider: primaryProvider || null,
          logo_url: formData.logo_url || null,
          is_active: formData.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create base token');
        return;
      }

      toast.success('Base token created successfully!');
      onOpenChange(false);
      router.refresh();

      // Reset form
      setFormData({
        code: '',
        symbol: '',
        name: '',
        token_type: 'native',
        decimals: '18',
        is_stablecoin: false,
        binance_id: '',
        coingecko_id: '',
        primary_provider: '',
        logo_url: '',
        is_active: true,
      });
    } catch (error) {
      toast.error('An error occurred while creating the token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Base Token</DialogTitle>
          <DialogDescription>
            Add a new token definition to the system. This will be available for deployment on various networks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="btc, eth, usdt"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                required
              />
              <p className="text-xs text-text-tertiary">Internal identifier (lowercase)</p>
            </div>

            {/* Symbol */}
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                placeholder="BTC, ETH, USDT"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                required
              />
              <p className="text-xs text-text-tertiary">Display symbol (uppercase)</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Bitcoin, Ethereum, Tether"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Token Type */}
            <div className="space-y-2">
              <Label htmlFor="token_type">Token Type *</Label>
              <Select
                value={formData.token_type}
                onValueChange={(value) => setFormData({ ...formData, token_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token type" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-999">
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="stablecoin">Stablecoin</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Decimals */}
            <div className="space-y-2">
              <Label htmlFor="decimals">Decimals *</Label>
              <Input
                id="decimals"
                type="number"
                min="0"
                max="18"
                value={formData.decimals}
                onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                required
              />
              <p className="text-xs text-text-tertiary">Usually 18 for ERC-20, 8 for Bitcoin-like</p>
            </div>

            {/* Is Stablecoin */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_stablecoin">Stablecoin</Label>
                <p className="text-xs text-text-tertiary">Is this a stablecoin?</p>
              </div>
              <Switch
                id="is_stablecoin"
                checked={formData.is_stablecoin}
                onCheckedChange={(checked) => setFormData({ ...formData, is_stablecoin: checked })}
              />
            </div>

            {/* Binance ID */}
            <div className="space-y-2">
              <Label htmlFor="binance_id">Binance ID (Optional)</Label>
              <Input
                id="binance_id"
                placeholder="BTCUSDT"
                value={formData.binance_id}
                onChange={(e) => setFormData({ ...formData, binance_id: e.target.value })}
              />
              <p className="text-xs text-text-tertiary">
                Trading pair symbol on Binance (e.g., BTCUSDT, ETHUSDT)
              </p>
            </div>

            {/* CoinGecko ID */}
            <div className="space-y-2">
              <Label htmlFor="coingecko_id">CoinGecko ID (Optional)</Label>
              <Input
                id="coingecko_id"
                placeholder="bitcoin"
                value={formData.coingecko_id}
                onChange={(e) => setFormData({ ...formData, coingecko_id: e.target.value })}
              />
              <p className="text-xs text-text-tertiary">
                CoinGecko API ID (e.g., bitcoin, ethereum, tether)
              </p>
            </div>

            {/* Primary Provider - Only show if both IDs provided */}
            {formData.binance_id && formData.coingecko_id && (
              <div className="space-y-2">
                <Label htmlFor="primary_provider">Primary Provider *</Label>
                <Select
                  value={formData.primary_provider || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, primary_provider: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary provider" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-999">
                    <SelectItem value="binance_us">Binance</SelectItem>
                    <SelectItem value="coingecko">CoinGecko</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-tertiary">
                  Which provider to use as the primary price source
                </p>
              </div>
            )}

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                type="url"
                placeholder="https://..."
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs text-text-tertiary">Enable this token immediately?</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Token'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
