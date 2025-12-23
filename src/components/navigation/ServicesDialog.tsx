'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp, Users2, DollarSign, ArrowRight } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/utils/haptics';
import { EARN_ENABLED, COPY_TRADE_ENABLED } from '@/lib/feature-flags';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  disabled?: boolean;
  badge?: string;
}

interface ServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServicesDialog({ open, onOpenChange }: ServicesDialogProps) {
  const router = useRouter();

  const allServices: Service[] = [
    {
      id: 'earn',
      title: 'Earn',
      description: 'Lock funds in high-yield vaults and earn fixed APY',
      icon: TrendingUp,
      href: '/earn',
    },
    {
      id: 'copy-trade',
      title: 'Copy Trade',
      description: 'Auto-copy top traders and grow your portfolio',
      icon: Users2,
      href: '/copy-trade',
    },
    {
      id: 'buy',
      title: 'Buy Crypto',
      description: 'Buy crypto instantly with card or bank',
      icon: DollarSign,
      href: '#',
      disabled: true,
      badge: 'Soon',
    },
  ];

  // Filter services based on feature flags
  const services = allServices.filter(service => {
    if (service.id === 'earn') return EARN_ENABLED;
    if (service.id === 'copy-trade') return COPY_TRADE_ENABLED;
    return true;
  });

  const handleServiceClick = (service: Service) => {
    if (service.disabled) return;

    haptics.selection();
    onOpenChange(false);
    router.push(service.href);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
    <ResponsiveDialogContent className="max-w-4xl! w-full">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-2xl">Services</ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-base">
            Access premium investment and trading features
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid grid-cols-2 gap-4 p-6 md:p-8 overflow-y-auto">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service)}
                disabled={service.disabled}
                className={cn(
                  'relative group p-6 md:p-8 rounded-2xl border-2',
                  'bg-bg-secondary',
                  'transition-all duration-200',
                  'text-left','w-full',
                  !service.disabled && [
                    'cursor-pointer',
                    'border-bg-tertiary hover:border-brand-primary/50',
                    'hover:bg-bg-tertiary',
                    'hover:shadow-2xl hover:shadow-brand-primary/10',
                    'hover:-translate-y-1',
                  ],
                  service.disabled && 'opacity-60 cursor-not-allowed border-bg-tertiary'
                )}
              >
                {/* Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    'w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all',
                    'bg-brand-primary/10',
                    !service.disabled && 'group-hover:bg-brand-primary/20 group-hover:scale-110'
                  )}>
                    <Icon className="h-6 w-6 md:h-8 md:w-8 text-brand-primary" />
                  </div>

                  {/* Arrow indicator for active items */}
                  {!service.disabled && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-5 w-5 text-brand-primary" />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <h3 className="text-base md:text-xl font-bold text-text-primary">
                    {service.title}
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Badge */}
                {service.badge && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <span className="inline-flex items-center rounded-full bg-brand-primary px-3 py-1 text-xs font-bold text-white shadow-lg">
                      {service.badge}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
