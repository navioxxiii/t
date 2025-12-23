/**
 * Admin Support Dashboard
 * Lists and manages all support tickets
 * Admin/Super Admin only
 */

'use client';

import { useState, useEffect } from 'react';
import { useAdminSupportTickets } from '@/hooks/useAdminSupportTickets';
import { useAuthStore } from '@/stores/authStore';
import { useOnlineUsersMonitor } from '@/hooks/useOnlineUsersMonitor';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TicketCard } from '@/components/support/TicketCard';
import { AssignmentSelect } from '@/components/support/admin/AssignmentSelect';
import { Loader2, AlertCircle, Search, BarChart3, ChevronLeft, ChevronRight, Trash2, CheckCircle2, X, UserPlus, FileText } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminSupportPage() {
  const profile = useAuthStore((state) => state.profile);
  const queryClient = useQueryClient();
  const isSuperAdmin = profile?.role === 'super_admin';
  const { isUserOnline } = useOnlineUsersMonitor();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [bulkAssignTo, setBulkAssignTo] = useState<string | null>(null);

  // Debounce search query (500ms delay, minimum 3 characters)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3 || searchQuery.length === 0) {
        setDebouncedSearch(searchQuery);
        setCurrentPage(1); // Reset to page 1 on search
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTicketDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['admin-support-stats'] });
  };

  // Bulk operations mutation
  const bulkMutation = useMutation({
    mutationFn: async (params: { action: string; value?: string | null }) => {
      const response = await fetch('/api/admin/support/tickets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds: Array.from(selectedTickets),
          action: params.action,
          value: params.value,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bulk operation failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.processed} ticket(s) updated`);
      setSelectedTickets(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Selection handlers
  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const selectAllVisible = (ticketsToSelect: { id: string }[]) => {
    const newSet = new Set(selectedTickets);
    ticketsToSelect.forEach((ticket) => newSet.add(ticket.id));
    setSelectedTickets(newSet);
  };

  const deselectAll = () => {
    setSelectedTickets(new Set());
  };

  const handleBulkAction = (action: string, value?: string | null) => {
    if (selectedTickets.size === 0) return;
    bulkMutation.mutate({ action, value });
  };

  // Fetch tickets
  const { data: ticketsData, isLoading: ticketsLoading, isError: ticketsError } = useAdminSupportTickets(
    statusFilter,
    priorityFilter,
    categoryFilter,
    showDeleted,
    debouncedSearch
  );

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-support-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/support/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const tickets = ticketsData?.tickets || [];
  const stats = statsData?.stats;

  // Pagination (server already filtered the results)
  const totalTickets = tickets.length;
  const totalPages = Math.ceil(totalTickets / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = tickets.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const priorityTabs = [
    { value: 'all', label: 'All' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
  ];

  const categoryTabs = [
    { value: 'all', label: 'All' },
    { value: 'account', label: 'Account' },
    { value: 'transaction', label: 'Transaction' },
    { value: 'kyc', label: 'KYC' },
    { value: 'ban_appeal', label: 'Ban Appeal' },
    { value: 'technical', label: 'Technical' },
    { value: 'copy-trading', label: 'Copy Trading' },
    { value: 'earn-package', label: 'Earn Package' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Support Center</h1>
          <p className="text-text-secondary mt-1">
            Manage and respond to user support tickets
          </p>
        </div>
        <Link href="/admin/support/templates">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </Button>
        </Link>
      </div>

      {/* Stats Cards - Compact */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-bg-secondary border-bg-tertiary hover:border-brand-primary/30 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-text-tertiary font-medium">Total</p>
                  <p className="text-xl font-bold text-text-primary mt-0.5">{stats.total}</p>
                </div>
                <BarChart3 className="w-6 h-6 text-brand-primary opacity-40" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-bg-tertiary hover:border-blue-500/30 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-text-tertiary font-medium">Open</p>
                  <p className="text-xl font-bold text-blue-500 mt-0.5">{stats.byStatus.open}</p>
                </div>
                <div className="text-[10px] text-text-tertiary">
                  +{stats.byStatus.pending} pending
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-bg-tertiary hover:border-orange-500/30 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-text-tertiary font-medium">Unassigned</p>
                  <p className="text-xl font-bold text-orange-500 mt-0.5">{stats.byAssignment.unassigned}</p>
                </div>
                <div className="text-[10px] text-text-tertiary">
                  {stats.byAssignment.assigned} assigned
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary border-bg-tertiary hover:border-red-500/30 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-text-tertiary font-medium">Unread</p>
                  <p className="text-xl font-bold text-red-500 mt-0.5">{stats.unreadMessages}</p>
                </div>
                <div className="text-[10px] text-text-tertiary">
                  {stats.recentActivity.last24Hours} today
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters - Compact Combined Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            type="text"
            placeholder="Search (min 3 chars)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-bg-secondary border-bg-tertiary h-9"
          />
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="absolute left-0 -bottom-5 text-[10px] text-yellow-500">
              Type at least 3 characters to search
            </p>
          )}
          {ticketsLoading && debouncedSearch && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-brand-primary" />
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-text-tertiary whitespace-nowrap">Status:</Label>
            <Select value={statusFilter} onValueChange={(v) => handleFilterChange(setStatusFilter, v)}>
              <SelectTrigger className="w-[120px] h-9 bg-bg-secondary border-bg-tertiary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusTabs.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-text-tertiary whitespace-nowrap">Priority:</Label>
            <Select value={priorityFilter} onValueChange={(v) => handleFilterChange(setPriorityFilter, v)}>
              <SelectTrigger className="w-[110px] h-9 bg-bg-secondary border-bg-tertiary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityTabs.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-text-tertiary whitespace-nowrap">Category:</Label>
            <Select value={categoryFilter} onValueChange={(v) => handleFilterChange(setCategoryFilter, v)}>
              <SelectTrigger className="w-[130px] h-9 bg-bg-secondary border-bg-tertiary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryTabs.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show Deleted Toggle (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 px-3 h-9 bg-bg-secondary border border-bg-tertiary rounded-lg">
              <Switch
                id="show-deleted"
                checked={showDeleted}
                onCheckedChange={(checked) => {
                  setShowDeleted(checked);
                  setCurrentPage(1);
                }}
                className="scale-75"
              />
              <Label htmlFor="show-deleted" className="text-xs text-text-secondary cursor-pointer flex items-center gap-1">
                <Trash2 className="w-3 h-3" />
                Deleted
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedTickets.size > 0 && (
        <div className="sticky top-0 z-20 bg-brand-primary/10 border border-brand-primary/30 rounded-lg p-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-primary">
                {selectedTickets.size} ticket(s) selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                className="h-7 text-xs"
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('resolve')}
                disabled={bulkMutation.isPending}
                className="h-8 gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('close')}
                disabled={bulkMutation.isPending}
                className="h-8 gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </Button>
              <div className="flex items-center gap-1">
                <AssignmentSelect
                  currentAssignment={bulkAssignTo}
                  onAssign={(adminId) => {
                    setBulkAssignTo(adminId);
                    handleBulkAction('assign', adminId);
                  }}
                  compact
                />
              </div>
              <Select onValueChange={(v) => handleBulkAction('change_priority', v)}>
                <SelectTrigger className="w-[110px] h-8 bg-bg-secondary border-bg-tertiary">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {isSuperAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkMutation.isPending}
                  className="h-8 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              )}
              {bulkMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination Info & Controls */}
      {!ticketsLoading && !ticketsError && totalTickets > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={paginatedTickets.length > 0 && paginatedTickets.every((t: { id: string }) => selectedTickets.has(t.id))}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectAllVisible(paginatedTickets);
                } else {
                  deselectAll();
                }
              }}
            />
            <span className="text-text-tertiary">
              Showing <span className="font-medium text-text-primary">{startIndex + 1}-{Math.min(endIndex, totalTickets)}</span> of <span className="font-medium text-text-primary">{totalTickets}</span> tickets
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[100px] h-8 bg-bg-secondary border-bg-tertiary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {ticketsLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      )}

      {/* Error State */}
      {ticketsError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>Failed to load tickets</AlertDescription>
        </Alert>
      )}

      {/* Tickets List */}
      {!ticketsLoading && !ticketsError && (
        <>
          {paginatedTickets.length > 0 ? (
            <div className="space-y-3">
              {paginatedTickets.map((ticket: { id: string; ticket_number: string; subject: string; category: string; status: string; priority: string; updated_at: string; unread_count?: number; is_guest?: boolean; deleted_at?: string | null; user_id?: string | null; assigned_admin?: { full_name?: string; email?: string } | null }) => (
                <div key={ticket.id} className="flex items-start gap-3">
                  <div className="pt-4">
                    <Checkbox
                      checked={selectedTickets.has(ticket.id)}
                      onCheckedChange={() => toggleTicketSelection(ticket.id)}
                    />
                  </div>
                  <div className="flex-1">
                    <TicketCard
                      ticket={ticket}
                      href={`/admin/support/${ticket.id}`}
                      showPriority
                      showAssignment
                      onDelete={handleTicketDeleted}
                      isUserOnline={ticket.user_id ? isUserOnline(ticket.user_id) : false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary">No tickets found</p>
            </div>
          )}
        </>
      )}

      {/* Pagination Buttons */}
      {!ticketsLoading && !ticketsError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={cn(
              "px-3 py-2 rounded-lg border transition-colors",
              currentPage === 1
                ? "bg-bg-tertiary border-bg-tertiary text-text-tertiary cursor-not-allowed"
                : "bg-bg-secondary border-bg-tertiary hover:border-brand-primary text-text-primary"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-colors text-sm font-medium",
                    currentPage === pageNum
                      ? "bg-brand-primary text-bg-primary"
                      : "bg-bg-secondary text-text-primary hover:bg-bg-tertiary"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              "px-3 py-2 rounded-lg border transition-colors",
              currentPage === totalPages
                ? "bg-bg-tertiary border-bg-tertiary text-text-tertiary cursor-not-allowed"
                : "bg-bg-secondary border-bg-tertiary hover:border-brand-primary text-text-primary"
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
