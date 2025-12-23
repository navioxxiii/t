/**
 * Token Preference Item Component
 * Individual token row with icon, name, symbol, and toggle switch
 */

'use client';

import { Switch } from '@/components/ui/switch';
import { TokenPreference } from '@/hooks/useTokenPreferences';
import { getTokenIcon } from '@/config/token-icons';

interface TokenPreferenceItemProps {
  tokenPreference: TokenPreference;
  onToggle: (baseTokenId: number, currentVisibility: boolean) => void;
  isLoading: boolean;
}

export function TokenPreferenceItem({
  tokenPreference,
  onToggle,
  isLoading,
}: TokenPreferenceItemProps) {
  const { base_tokens, base_token_id, is_visible } = tokenPreference;

  // Use logo_url from database or fallback to icon helper
  const tokenIcon = base_tokens.logo_url || getTokenIcon(base_tokens.symbol);

  return (
    <div className="rounded-lg p-4 hover:bg-bg-tertiary transition-colors">
      <div className="flex items-center gap-3">
        {/* Token icon */}
        <img
          src={tokenIcon}
          alt={base_tokens.name}
          className="h-10 w-10 rounded-full object-cover"
          onError={(e) => {
            // Fallback to default icon if image fails to load
            e.currentTarget.src = getTokenIcon('default');
          }}
        />

        {/* Token info */}
        <div className="flex-1">
          <p className="font-semibold text-text-primary">{base_tokens.name}</p>
          <p className="text-sm text-text-secondary">{base_tokens.symbol}</p>
        </div>

        {/* Toggle switch */}
        <Switch
          checked={is_visible}
          onCheckedChange={() => onToggle(base_token_id, is_visible)}
          disabled={isLoading}
          aria-label={`Toggle ${base_tokens.name} visibility`}
        />
      </div>
    </div>
  );
}
