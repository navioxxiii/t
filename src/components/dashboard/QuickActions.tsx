'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ArrowLeftRight,
  DollarSign,
  Users2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/utils/haptics';
import { EARN_ENABLED, COPY_TRADE_ENABLED } from '@/lib/feature-flags';

// Buy isn't live yet - flip to show it (with its "Soon" badge removed) at launch
const BUY_ENABLED = false;

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}

interface QuickActionsProps {
  onSend?: () => void;
  onReceive?: () => void;
  onSwap?: () => void;
}

export function QuickActions({
  onSend,
  onReceive,
  onSwap,
}: QuickActionsProps) {
  const router = useRouter();

  const allActions: QuickAction[] = [
    {
      id: 'send',
      label: 'Send',
      icon: <ArrowUpRight className="h-5 w-5" />,
      onClick: () => {
        haptics.selection();
        onSend?.();
      },
      disabled: !onSend,
    },
    {
      id: 'receive',
      label: 'Receive',
      icon: <ArrowDownLeft className="h-5 w-5" />,
      onClick: () => {
        haptics.selection();
        onReceive?.();
      },
      disabled: !onReceive,
    },
    {
      id: 'swap',
      label: 'Swap',
      icon: <ArrowLeftRight className="h-5 w-5" />,
      onClick: () => {
        haptics.selection();
        if (onSwap) {
          onSwap();
        } else {
          router.push('/swap');
        }
      },
    },
    {
      id: 'earn',
      label: 'Earn',
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => {
        haptics.selection();
        router.push('/earn');
      },
    },
    {
      id: 'copy-trade',
      label: 'Copy Trade',
      icon: <Users2 className="h-5 w-5" />,
      onClick: () => {
        haptics.selection();
        router.push('/copy-trade');
      },
    },
    {
      id: 'buy',
      label: 'Buy',
      icon: <DollarSign className="h-5 w-5" />,
      onClick: () => {},
      disabled: true,
      badge: 'Soon',
    },
  ];

  // Filter actions based on feature flags
  const actions = allActions.filter(action => {
    if (action.id === 'earn') return EARN_ENABLED;
    if (action.id === 'copy-trade') return COPY_TRADE_ENABLED;
    if (action.id === 'buy') return BUY_ENABLED;
    return true;
  });

  return (
    <div className="w-full px-4 pb-4 sm:px-6 lg:px-8">
      {/* Every action in view: fills the row on phones, centered from md up */}
      <div className="mx-auto flex max-w-4xl justify-between md:justify-center md:gap-10">
        {actions.map((action) => (
          <QuickActionButton key={action.id} {...action} />
        ))}
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  icon,
  onClick,
  disabled,
  badge,
}: QuickAction) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex min-w-0 flex-1 flex-col items-center gap-2 py-1 transition-transform md:flex-none',
        'active:scale-95',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary transition-colors',
          !disabled && 'group-hover:bg-brand-primary/25'
        )}
      >
        {icon}
      </span>

      <span className="whitespace-nowrap text-[11px] font-semibold leading-tight text-text-primary md:text-xs">
        {label}
      </span>

      {badge && (
        <span className="absolute -top-1 left-1/2 ml-2 rounded-full bg-brand-primary px-1.5 py-0.5 text-[9px] font-bold text-bg-primary">
          {badge}
        </span>
      )}
    </button>
  );
}
