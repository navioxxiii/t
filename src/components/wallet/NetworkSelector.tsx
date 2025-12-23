/**
 * Network Selector Component
 *
 * Reusable dropdown for selecting blockchain network.
 * Used in both Send (withdrawal) and Receive (deposit) flows.
 */

'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { DepositAddress } from '@/types/balance';

export interface NetworkSelectorProps {
  depositAddresses: DepositAddress[];
  selectedNetwork: string | null; // network.code
  onSelectNetwork: (networkCode: string) => void;
  showFees?: boolean; // For send/withdrawal flow
  sortByFee?: boolean; // For send/withdrawal flow
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function NetworkSelector({
  depositAddresses,
  selectedNetwork,
  onSelectNetwork,
  showFees = false,
  sortByFee = false,
  label = 'Select Network',
  description,
  disabled = false,
}: NetworkSelectorProps) {
  // Sort by fee if requested (cheapest first)
  const sortedAddresses = useMemo(() => {
    if (!sortByFee) return depositAddresses;
    return [...depositAddresses].sort(
      (a, b) => a.network.withdrawal_fee - b.network.withdrawal_fee
    );
  }, [depositAddresses, sortByFee]);

  const cheapestNetwork = sortByFee ? sortedAddresses[0]?.network.code : null;

  // Auto-select first network if none selected and only one available
  useMemo(() => {
    if (!selectedNetwork && sortedAddresses.length === 1) {
      onSelectNetwork(sortedAddresses[0].network.code);
    }
  }, [selectedNetwork, sortedAddresses, onSelectNetwork]);

  if (sortedAddresses.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="p-4 bg-bg-secondary border border-border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            No networks available for this token
          </p>
        </div>
      </div>
    );
  }

  // Single network - show info card instead of dropdown
  if (sortedAddresses.length === 1) {
    const addr = sortedAddresses[0];
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="flex items-center justify-between p-3 bg-bg-secondary border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Image
              src={addr.network.logo_url}
              alt={addr.network.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <div>
              <div className="font-medium text-sm">{addr.network.display_name}</div>
              <div className="text-xs text-muted-foreground">
                {addr.deployment.token_standard}
              </div>
            </div>
          </div>
          {showFees && (
            <div className="text-sm text-muted-foreground">
              Fee: ${addr.network.withdrawal_fee}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Get selected network info for display
  const selectedNetworkInfo = sortedAddresses.find(
    (addr) => addr.network.code === selectedNetwork
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="network-selector">{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <Select
        value={selectedNetwork || ''}
        onValueChange={onSelectNetwork}
        disabled={disabled}
      >
        <SelectTrigger id="network-selector" className="w-full h-auto min-h-11">
          <SelectValue placeholder="Choose network..." />
        </SelectTrigger>
        <SelectContent className="z-9999">
          {sortedAddresses.map((addr) => {
            const isCheapest = showFees && addr.network.code === cheapestNetwork;
            const isDisabled =
              (showFees && !addr.network.withdrawal_enabled) ||
              (!showFees && !addr.network.deposit_enabled);

            return (
              <SelectItem
                key={addr.network.code}
                value={addr.network.code}
                disabled={isDisabled}
              >
                <div className="flex items-center gap-2">
                  <Image
                    src={addr.network.logo_url}
                    alt={addr.network.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span className="font-medium">{addr.network.display_name}</span>
                  {isCheapest && (
                    <Badge variant="default" className="text-xs ml-2">
                      Cheapest
                    </Badge>
                  )}
                  {showFees && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      ${addr.network.withdrawal_fee.toFixed(2)}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Selected network info - shown below selector */}
      {selectedNetworkInfo && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Image
              src={selectedNetworkInfo.network.logo_url}
              alt={selectedNetworkInfo.network.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">
                {selectedNetworkInfo.network.display_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedNetworkInfo.deployment.token_standard}
              </div>
            </div>
            {showFees && (
              <div className="text-sm font-medium">
                ${selectedNetworkInfo.network.withdrawal_fee.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper text for cheapest network */}
      {showFees && cheapestNetwork && (
        <p className="text-xs text-success flex items-center gap-1">
          <span>💡</span>
          <span>
            {sortedAddresses.find((a) => a.network.code === cheapestNetwork)?.network.display_name} has the lowest withdrawal fee
          </span>
        </p>
      )}
    </div>
  );
}
