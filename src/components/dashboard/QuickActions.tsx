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

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
  opacity: string;
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
      icon: <ArrowUpRight className="h-7 w-7" />,
      onClick: () => {
        haptics.selection();
        onSend?.();
      },
      disabled: !onSend,
      opacity: '10',
    },
    {
      id: 'receive',
      label: 'Receive',
      icon: <ArrowDownLeft className="h-7 w-7" />,
      onClick: () => {
        haptics.selection();
        onReceive?.();
      },
      disabled: !onReceive,
      opacity: '15',
    },
    {
      id: 'swap',
      label: 'Swap',
      icon: <ArrowLeftRight className="h-7 w-7" />,
      onClick: () => {
        haptics.selection();
        if (onSwap) {
          onSwap();
        } else {
          router.push('/swap');
        }
      },
      opacity: '20',
    },
    {
      id: 'earn',
      label: 'Earn',
      icon: <TrendingUp className="h-7 w-7" />,
      onClick: () => {
        haptics.selection();
        router.push('/earn');
      },
      opacity: '10',
    },
    {
      id: 'copy-trade',
      label: 'Copy Trade',
      icon: <Users2 className="h-7 w-7" />,
      onClick: () => {
        haptics.selection();
        router.push('/copy-trade');
      },
      opacity: '15',
    },
    {
      id: 'buy',
      label: 'Buy',
      icon: <DollarSign className="h-7 w-7" />,
      onClick: () => {},
      disabled: true,
      badge: 'Soon',
      opacity: '20',
    },
  ];

  // Filter actions based on feature flags
  const actions = allActions.filter(action => {
    if (action.id === 'earn') return EARN_ENABLED;
    if (action.id === 'copy-trade') return COPY_TRADE_ENABLED;
    return true;
  });

  return (
    <div className="w-full px-4 pb-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Mobile & Tablet: Horizontal scroll */}
        <div className="lg:hidden">
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory">
            {actions.map((action) => (
              <QuickActionButton
                key={action.id}
                {...action}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden lg:grid lg:grid-cols-6 lg:gap-4">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              {...action}
            />
          ))}
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function QuickActionButton({
  label,
  icon,
  onClick,
  disabled,
  badge,
  opacity,
}: QuickAction) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex min-w-[90px] flex-shrink-0 snap-start flex-col items-center gap-2.5 rounded-2xl p-4 transition-all',
        'bg-bg-secondary hover:bg-bg-tertiary active:scale-95',
        'lg:min-w-0',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      {/* Icon container with brand color + opacity (Bybit/Binance style) */}
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full transition-transform',
          `bg-brand-primary/${opacity}`,
          !disabled && 'hover:scale-110'
        )}
      >
        <div className="text-brand-primary">
          {icon}
        </div>
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-text-primary text-center leading-tight max-w-[80px]">
        {label}
      </span>

      {/* Badge */}
      {badge && (
        <span className="absolute right-2 top-2 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
          {badge}
        </span>
      )}
    </button>
  );
}
