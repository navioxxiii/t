/**
 * Support Center Page
 * Lists all user's support tickets
 * Protected route - requires login
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TicketCard } from '@/components/support/TicketCard';
import { Plus, Loader2, AlertCircle, Ticket } from 'lucide-react';

export default function SupportCenterPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  // Fetch user's tickets
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const response = await fetch('/api/support/tickets');
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return response.json();
    },
  });

  const tickets = data?.tickets || [];

  // Filter tickets
  const filteredTickets = tickets.filter((ticket: { status: string }) => {
    if (filter === 'all') return true;
    if (filter === 'open') return ['open', 'pending', 'in_progress'].includes(ticket.status);
    if (filter === 'resolved') return ['resolved', 'closed'].includes(ticket.status);
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pt-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Support Center</h1>
          <p className="text-text-secondary mt-1">
            View and manage your support tickets
          </p>
        </div>
        <Link href="/support/new">
          <Button className="bg-brand-primary hover:bg-brand-primary-light text-bg-primary gap-2">
            <Plus className="w-4 h-4" />
            Create Ticket
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-bg-tertiary">
        {(['all', 'open', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors relative ${
              filter === tab
                ? 'text-brand-primary'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            {tab}
            {filter === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load tickets'}
          </AlertDescription>
        </Alert>
      )}

      {/* Tickets List */}
      {!isLoading && !isError && (
        <>
          {filteredTickets.length > 0 ? (
            <div className="space-y-3">
              {filteredTickets.map((ticket: { id: string; ticket_number: string; subject: string; category: string; status: string; updated_at: string; unread_count?: number; is_guest?: boolean }) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  href={`/support/${ticket.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bg-tertiary mb-4">
                <Ticket className="w-8 h-8 text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No Tickets Found
              </h3>
              <p className="text-text-secondary mb-6">
                {filter === 'all'
                  ? "You haven't created any support tickets yet."
                  : `You don't have any ${filter} tickets.`}
              </p>
              <Link href="/support/new">
                <Button className="bg-brand-primary hover:bg-brand-primary-light text-bg-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Ticket
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
