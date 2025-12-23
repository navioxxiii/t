/**
 * useAdminSupportTickets Hook
 * Fetches and subscribes to real-time updates for admin support tickets
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';

export function useAdminSupportTickets(
  statusFilter: string,
  priorityFilter: string,
  categoryFilter: string,
  showDeleted: boolean,
  debouncedSearch: string
) {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['admin-support-tickets', statusFilter, priorityFilter, categoryFilter, showDeleted, debouncedSearch], [statusFilter, priorityFilter, categoryFilter, showDeleted, debouncedSearch]);

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (showDeleted) params.append('show_deleted', 'true');
      if (debouncedSearch) params.append('search', debouncedSearch);

      const response = await fetch(`/api/admin/support/tickets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return response.json();
    },
  });

  useEffect(() => {
    const supabase = createClient();

    const handleChanges = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    const ticketsSubscription = supabase
      .channel('support_tickets-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        handleChanges
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel('ticket_messages-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_messages' },
        handleChanges
      )
      .subscribe();

    return () => {
      ticketsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [queryClient, queryKey]);

  return { data, isLoading, isError };
}
