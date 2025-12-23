/**
 * Admin Dashboard Page
 * Overview of system statistics and quick actions
 */

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Send, ArrowDownLeft, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OnlineUsersWidget } from '@/components/admin/OnlineUsersWidget';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Get statistics
  const [usersCount, pendingSendsCount, depositsCount, sendsCount, openTicketsCount, unreadMessagesCount] = await Promise.all([
    // Total users
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    // Pending sends
    supabase
      .from('withdrawal_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    // Total deposits
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'deposit')
      .eq('status', 'completed'),
    // Total sends
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'withdrawal')
      .eq('status', 'completed'),
    // Open support tickets (excluding deleted)
    supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'pending', 'in_progress'])
      .is('deleted_at', null),
    // Unread support messages
    supabase
      .from('support_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .eq('from_admin', false),
  ]);

  const stats = [
    {
      title: 'Total Users',
      value: usersCount.count || 0,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Pending Sends',
      value: pendingSendsCount.count || 0,
      icon: Clock,
      description: 'Awaiting approval',
      href: '/admin/sends',
      urgent: (pendingSendsCount.count || 0) > 0,
    },
    {
      title: 'Total Deposits',
      value: depositsCount.count || 0,
      icon: ArrowDownLeft,
      description: 'Completed deposits',
    },
    {
      title: 'Total Sends',
      value: sendsCount.count || 0,
      icon: Send,
      description: 'Completed sends',
    },
    {
      title: 'Open Tickets',
      value: openTicketsCount.count || 0,
      icon: MessageSquare,
      description: 'Support tickets',
      href: '/admin/support',
      urgent: (openTicketsCount.count || 0) > 0,
    },
    {
      title: 'Unread Messages',
      value: unreadMessagesCount.count || 0,
      icon: AlertCircle,
      description: 'From users',
      href: '/admin/support',
      urgent: (unreadMessagesCount.count || 0) > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">
          Welcome to the admin panel. Here&apos;s an overview of your system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={stat.urgent ? 'border-brand-primary bg-bg-secondary' : 'bg-bg-secondary border-bg-tertiary'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-primary">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.urgent ? 'text-brand-primary' : 'text-text-secondary'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
                <p className="text-xs text-text-tertiary">{stat.description}</p>
                {stat.href && stat.urgent && stat.value > 0 && (
                  <Link href={stat.href}>
                    <Button size="sm" variant="outline" className="mt-4 w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-bg-primary">
                      Review Now
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-bg-secondary border-bg-tertiary">
        <CardHeader>
          <CardTitle className="text-text-primary">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/sends">
            <Button className="bg-brand-primary text-bg-primary hover:bg-brand-primary-light">
              <Send className="mr-2 h-4 w-4" />
              Approve Sends
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline" className="border-bg-tertiary text-text-primary hover:bg-bg-tertiary">
              <Users className="mr-2 h-4 w-4" />
              View Users
            </Button>
          </Link>
          <Link href="/admin/transactions">
            <Button variant="outline" className="border-bg-tertiary text-text-primary hover:bg-bg-tertiary">
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              View Transactions
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Online Users */}
      <OnlineUsersWidget />
    </div>
  );
}
