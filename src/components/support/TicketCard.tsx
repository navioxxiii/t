/**
 * Ticket Card Component
 * Displays ticket in list view (Binance style - clean & minimal)
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TicketStatusBadge } from './TicketStatusBadge';
import { PriorityBadge } from './admin/PriorityBadge';
import { CategoryIcon, getCategoryLabel, getCategoryColor } from './CategoryIcon';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, UserCircle, Trash2, AlertTriangle, Ban, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { toast } from 'sonner';

interface TicketCardProps {
  ticket: {
    id: string;
    ticket_number: string;
    subject: string;
    category: string;
    status: string;
    priority?: string;
    updated_at: string;
    unread_count?: number;
    is_guest?: boolean;
    deleted_at?: string | null;
    assigned_admin?: {
      full_name?: string;
      email?: string;
    } | null;
  };
  href: string;
  showPriority?: boolean;
  showAssignment?: boolean;
  onDelete?: () => void;
  isUserOnline?: boolean;
}

export function TicketCard({ ticket, href, showPriority, showAssignment, onDelete, isUserOnline }: TicketCardProps) {
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin' || isSuperAdmin;
  const isDeleted = !!ticket.deleted_at;
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCardClick = () => {
    router.push(href);
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Restore ticket ${ticket.ticket_number}?`)) return;

    setIsRestoring(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore ticket');
      }

      toast.success('Ticket restored');
      if (onDelete) onDelete(); // Reuse callback to refresh list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore ticket');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, hard: boolean = false) => {
    e.stopPropagation();

    const confirmMessage = hard
      ? `Are you sure you want to PERMANENTLY delete ticket ${ticket.ticket_number}? This action cannot be undone!`
      : `Are you sure you want to delete ticket ${ticket.ticket_number}?`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const url = hard
        ? `/api/admin/support/tickets/${ticket.id}?hard=true`
        : `/api/admin/support/tickets/${ticket.id}`;

      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete ticket');
      }

      toast.success(hard ? 'Ticket permanently deleted' : 'Ticket deleted');
      if (onDelete) onDelete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete ticket');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Card
        className={`bg-bg-secondary p-4 border-bg-tertiary hover:border-brand-primary/30 transition-colors cursor-pointer ${isDeleted ? 'opacity-60' : ''}`}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Icon & Content */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Category Icon */}
              <div
                className={`rounded-full p-1.5 bg-bg-tertiary flex-shrink-0 ${getCategoryColor(ticket.category)}`}
              >
                <CategoryIcon category={ticket.category} className="w-3.5 h-3.5" />
              </div>

              {/* Ticket Info */}
              <div className="flex-1 min-w-0">
                {/* Subject & Ticket Number inline */}
                <div className="flex items-center gap-2 mb-1">
                  {isUserOnline !== undefined && (
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isUserOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      }`}
                      title={isUserOnline ? 'User online' : 'User offline'}
                    />
                  )}
                  <span className="text-xs font-mono text-text-tertiary">
                    {ticket.ticket_number}
                  </span>
                  <h3 className="font-medium text-base text-text-primary truncate">
                    {ticket.subject}
                  </h3>
                </div>

                {/* Badges & Metadata - Single Line */}
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <TicketStatusBadge status={ticket.status} className="text-xs py-0.5 px-2" />
                  {showPriority && ticket.priority && (
                    <PriorityBadge priority={ticket.priority} className="text-xs py-0.5 px-2" />
                  )}
                  {ticket.is_guest && (
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-orange-500/10 text-orange-500 border-orange-500/20">
                      Guest
                    </Badge>
                  )}
                  <span className="text-xs">•</span>
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(ticket.updated_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {showAssignment && (
                    <>
                      <span className="text-xs">•</span>
                      <div className="flex items-center gap-1">
                        <UserCircle className="w-3 h-3" />
                        <span className="text-xs truncate max-w-[120px]">
                          {ticket.assigned_admin
                            ? ticket.assigned_admin.full_name || ticket.assigned_admin.email
                            : 'Unassigned'}
                        </span>
                      </div>
                    </>
                  )}
                  {isDeleted && (
                    <>
                      <span className="text-xs">•</span>
                      <Badge variant="outline" className="text-xs py-0.5 px-2 bg-red-500/10 text-red-500 border-red-500/20">
                        Deleted
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Unread Badge & Arrow */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {ticket.unread_count && ticket.unread_count > 0 && (
                <Badge className="bg-brand-primary text-bg-primary text-xs h-5 px-2">
                  {ticket.unread_count}
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-text-tertiary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Hover Revealed */}
      {isAdmin && showActions && !isDeleting && !isRestoring && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {!isDeleted && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 bg-bg-primary border-red-500/30 hover:bg-red-500/10 hover:border-red-500"
              onClick={(e) => handleDelete(e, false)}
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </Button>
          )}
          {isDeleted && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 bg-bg-primary border-green-500/30 hover:bg-green-500/10 hover:border-green-500"
              onClick={handleRestore}
              title="Restore ticket"
            >
              <RotateCcw className="w-3 h-3 text-green-500" />
            </Button>
          )}
          {isDeleted && isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 bg-bg-primary border-red-600/50 hover:bg-red-600/20 hover:border-red-600"
              onClick={(e) => handleDelete(e, true)}
              title="Permanently delete"
            >
              <Ban className="w-3 h-3 text-red-600" />
            </Button>
          )}
        </div>
      )}

      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/80 rounded-lg z-10">
          <div className="text-xs text-text-secondary">Deleting...</div>
        </div>
      )}

      {isRestoring && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/80 rounded-lg z-10">
          <div className="text-xs text-text-secondary">Restoring...</div>
        </div>
      )}
    </div>
  );
}
