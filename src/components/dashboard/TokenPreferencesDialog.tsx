/**
 * Token Preferences Dialog Component
 * Modal/drawer for managing token visibility preferences
 */

'use client';

import { useState, useMemo } from 'react';
import { Filter, Search, Loader2 } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useTokenPreferences, useToggleTokenVisibility } from '@/hooks/useTokenPreferences';
import { useBalances } from '@/hooks/useBalances';
import { useDisplayPreferences, useUpdateDisplayPreferences } from '@/hooks/useDisplayPreferences';
import { TokenPreferenceItem } from './TokenPreferenceItem';

interface TokenPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokenPreferencesDialog({
  open,
  onOpenChange,
}: TokenPreferencesDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: preferences, isLoading: isFetching } = useTokenPreferences();
  const { data: balances } = useBalances(true); // Include zero balances to filter properly
  const { data: displayPrefs } = useDisplayPreferences();
  const toggleMutation = useToggleTokenVisibility();
  const updateDisplayPrefs = useUpdateDisplayPreferences();

  // Get show_non_zero_only from database, default to false
  const showNonZeroOnly = displayPrefs?.show_non_zero_only ?? false;

  // Filter tokens based on search and non-zero balance
  const filteredTokens = useMemo(() => {
    let filtered = preferences || [];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pref) =>
          pref.base_tokens.name.toLowerCase().includes(query) ||
          pref.base_tokens.symbol.toLowerCase().includes(query)
      );
    }

    // Non-zero balance filter
    if (showNonZeroOnly && balances) {
      const balanceMap = new Map(
        balances.map((b) => [b.token.id, parseFloat(b.balance)])
      );
      filtered = filtered.filter((pref) => {
        const balance = balanceMap.get(pref.base_token_id);
        return balance && balance > 0;
      });
    }

    return filtered;
  }, [preferences, searchQuery, showNonZeroOnly, balances]);

  // Toggle handler for token visibility
  const handleToggle = async (baseTokenId: number, currentVisibility: boolean) => {
    try {
      await toggleMutation.mutateAsync({
        baseTokenId,
        isVisible: !currentVisibility,
      });
      toast.success('Token preference updated');
    } catch (error) {
      console.error('Failed to update token preference:', error);
      toast.error('Failed to update preference');
    }
  };

  // Toggle handler for non-zero balance filter
  const handleToggleNonZero = async (checked: boolean) => {
    try {
      await updateDisplayPrefs.mutateAsync({ show_non_zero_only: checked });
      toast.success('Display preference updated');
    } catch (error) {
      console.error('Failed to update display preference:', error);
      toast.error('Failed to update display preference');
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Token Preferences</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Manage which tokens appear in your wallet
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4 px-4">
          {/* Non-zero balance filter toggle */}
          <div className="rounded-lg p-4 border border-bg-tertiary bg-bg-secondary">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-text-secondary" />
              <Label htmlFor="non-zero-filter" className="flex-1 cursor-pointer">
                <p className="font-semibold text-text-primary">
                  Show non-zero balances only
                </p>
              </Label>
              <Switch
                id="non-zero-filter"
                checked={showNonZeroOnly}
                onCheckedChange={handleToggleNonZero}
                disabled={updateDisplayPrefs.isPending}
                aria-label="Filter non-zero balances"
              />
            </div>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search tokens"
            />
          </div>

          {/* Token list */}
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              <span className="ml-2 text-sm text-text-tertiary">
                Loading tokens...
              </span>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-text-secondary text-center">
                {searchQuery || showNonZeroOnly
                  ? 'No tokens found matching your filters'
                  : 'No tokens available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredTokens.map((tokenPref) => (
                <TokenPreferenceItem
                  key={tokenPref.base_token_id}
                  tokenPreference={tokenPref}
                  onToggle={handleToggle}
                  isLoading={toggleMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Loading indicator during mutation */}
          {toggleMutation.isPending && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
              <span className="ml-2 text-sm text-text-tertiary">Saving...</span>
            </div>
          )}
        </div>

        <div className="pb-6"></div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
