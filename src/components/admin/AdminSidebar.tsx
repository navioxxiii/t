/**
 * Admin Sidebar Component
 * Navigation for admin pages with real-time notification badges
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Send,
  ArrowDownUp,
  Settings,
  ShieldCheck,
  TrendingUp,
  Database,
  MessageSquare,
  Coins,
} from 'lucide-react';
import { useAdminSupportNotifications } from '@/hooks/useAdminSupportNotifications';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Send Approvals',
    href: '/admin/sends',
    icon: Send,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
    icon: ArrowDownUp,
  },
  {
    title: 'Token Configuration',
    href: '/admin/token-config',
    icon: Coins,
    superAdminOnly: true,
  },
  {
    title: 'Earn Vaults',
    href: '/admin/earn-vaults',
    icon: TrendingUp,
  },
  {
    title: 'Copy Trade',
    href: '/admin/copy-trade',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    superAdminOnly: true,
    // Both admin and super_admin can access, but super_admin sees more settings
  },
  {
    title: 'KYC',
    href: '/admin/kyc',
    icon: ShieldCheck,
  },
  {
    title: 'Support',
    href: '/admin/support',
    icon: MessageSquare,
  },
  {
    title: 'Data Management',
    href: '/admin/data-management',
    icon: Database,
    superAdminOnly: true,
  }
];

interface AdminSidebarProps {
  isSuperAdmin?: boolean;
}

export function AdminSidebar({ isSuperAdmin = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const { unreadMessagesCount } = useAdminSupportNotifications();

  const filteredItems = navItems.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Admin Badge */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-brand-primary/10 p-3">
          <ShieldCheck className="h-5 w-5 text-brand-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">Admin Panel</span>
            <span className="text-xs text-text-tertiary">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          // For items with sub-routes (like KYC, Settings), use startsWith
          const hasSubRoutes = ['/admin/kyc', '/admin/settings'].includes(item.href);
          const isActive = hasSubRoutes
            ? pathname.startsWith(item.href)
            : pathname === item.href;
          // Show badge for support link if there are unread messages
          const showBadge = item.href === '/admin/support' && unreadMessagesCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-brand-primary text-bg-primary'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {showBadge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to Dashboard */}
      <div className="border-t border-bg-tertiary px-2 pt-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Back to User Dashboard
        </Link>
      </div>
    </div>
  );
}
