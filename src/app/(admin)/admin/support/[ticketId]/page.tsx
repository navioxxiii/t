/**
 * Admin Ticket Detail Page
 * Chat interface with controls for managing tickets
 * Split layout: Messages (70%) + User Context (30%)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useAdminRealtimeMessages, Message } from '@/hooks/useAdminRealtimeMessages';
import { useOnlineUsersMonitor } from '@/hooks/useOnlineUsersMonitor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { PriorityBadge } from '@/components/support/admin/PriorityBadge';
import { CategoryIcon, getCategoryLabel } from '@/components/support/CategoryIcon';
import { AdminMessageBubble } from '@/components/support/admin/AdminMessageBubble';
import { UserContextSidebar } from '@/components/support/admin/UserContextSidebar';
import { AssignmentSelect } from '@/components/support/admin/AssignmentSelect';
import { TemplateSelector, Template } from '@/components/support/admin/TemplateSelector';
import { ShortcutPopup } from '@/components/support/admin/ShortcutPopup';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Send,
  StickyNote,
  CheckCircle2,
  RefreshCw,
  X,
  RotateCcw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function AdminTicketDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const ticketId = params.ticketId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isUserOnline } = useOnlineUsersMonitor();

  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Shortcut popup state
  const [showShortcutPopup, setShowShortcutPopup] = useState(false);
  const [shortcutFilter, setShortcutFilter] = useState('');
  const [selectedShortcutIndex, setSelectedShortcutIndex] = useState(0);

  // Fetch ticket details
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-support-ticket', ticketId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch ticket');
      }
      return response.json();
    },
    refetchInterval: false,
  });

  // Prefetch templates for quick access
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['support-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/support/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });
  const templates: Template[] = templatesData?.templates || [];

  // Realtime messages
  const { messages: realtimeMessages, refetch: refetchMessages } = useAdminRealtimeMessages(ticketId);

  const ticket = data?.ticket;
  const messages = realtimeMessages.length > 0 ? realtimeMessages : (data?.messages || []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mutations
  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to send reply');
      return response.json();
    },
    onSuccess: () => {
      setReplyMessage('');
      // Refetch messages to ensure sent message appears (backup for realtime)
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', ticketId] });
      toast.success('Reply sent!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const noteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: () => {
      setInternalNote('');
      setShowNoteInput(false);
      // Refetch messages to ensure note appears (backup for realtime)
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', ticketId] });
      toast.success('Internal note added!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, string | null>) => {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update ticket');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', ticketId] });
      toast.success('Ticket updated!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Handlers
  const handleSendReply = () => !replyMessage.trim() || replyMutation.mutate(replyMessage.trim());
  const handleAddNote = () => !internalNote.trim() || noteMutation.mutate(internalNote.trim());
  const handlePriorityChange = (priority: string) => updateMutation.mutate({ priority });
  const handleCategoryChange = (category: string) => updateMutation.mutate({ category });
  const handleAssignmentChange = (adminId: string | null) => updateMutation.mutate({ assigned_to: adminId });

  // Get templates with shortcuts for popup
  const templatesWithShortcuts = templates.filter(t => t.shortcut);

  // Filter templates based on current shortcut input
  const filteredShortcutTemplates = templatesWithShortcuts.filter(t => {
    if (!shortcutFilter) return true;
    const shortcutWithoutSlash = t.shortcut!.replace('/', '').toLowerCase();
    return shortcutWithoutSlash.startsWith(shortcutFilter.toLowerCase()) ||
           t.title.toLowerCase().includes(shortcutFilter.toLowerCase());
  });

  // Handle shortcut detection in reply message
  const handleReplyChange = (value: string) => {
    setReplyMessage(value);

    // Check if there's a "/" pattern being typed
    // Find the word containing "/" that the cursor is at
    const lastSlashIndex = value.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      // Get text after the last "/"
      const afterSlash = value.slice(lastSlashIndex + 1);
      // Check if we're still typing the shortcut (no space after it yet)
      const isTypingShortcut = !afterSlash.includes(' ') && !afterSlash.includes('\n');

      if (isTypingShortcut) {
        setShowShortcutPopup(true);
        setShortcutFilter(afterSlash);
        setSelectedShortcutIndex(0);
        return;
      }
    }

    // Close popup if no "/" pattern
    setShowShortcutPopup(false);
    setShortcutFilter('');
  };

  // Handle shortcut template selection
  const handleShortcutSelect = (template: Template) => {
    // Find the "/" and replace from there to end of current word
    const lastSlashIndex = replyMessage.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const beforeSlash = replyMessage.slice(0, lastSlashIndex);
      setReplyMessage(beforeSlash + template.content);
    } else {
      setReplyMessage(template.content);
    }

    // Close popup
    setShowShortcutPopup(false);
    setShortcutFilter('');
    setSelectedShortcutIndex(0);

    // Track usage in background
    fetch(`/api/admin/support/templates/${template.id}`, { method: 'POST' }).catch(() => {});
  };

  // Handle keyboard navigation in shortcut popup
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showShortcutPopup && filteredShortcutTemplates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedShortcutIndex(prev =>
          prev < filteredShortcutTemplates.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedShortcutIndex(prev =>
          prev > 0 ? prev - 1 : filteredShortcutTemplates.length - 1
        );
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleShortcutSelect(filteredShortcutTemplates[selectedShortcutIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowShortcutPopup(false);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        handleShortcutSelect(filteredShortcutTemplates[selectedShortcutIndex]);
        return;
      }
    }

    // Normal Enter to send (when popup not showing)
    if (e.key === 'Enter' && !e.shiftKey && !showShortcutPopup) {
      e.preventDefault();
      handleSendReply();
    }
  };
  
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (isError) return <div className="p-6"><Alert variant="destructive">{error.message}</Alert></div>;

  const canReply = ticket.status !== 'closed';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-bg-primary">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-bg-primary border-b border-bg-tertiary p-4">
        <div className="flex items-center justify-between">
          <Link href="/admin/support" className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-tertiary">{ticket.ticket_number}</span>
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.deleted_at && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-500/10 text-red-500 border border-red-500/20">
                Deleted
              </span>
            )}
          </div>
        </div>
        <h1 className="text-xl font-bold text-text-primary mt-2">{ticket.subject}</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Messages */}
          <div className="lg:col-span-2 space-y-4">
            {messages.map((msg: Message) => <AdminMessageBubble key={msg.id} message={msg} />)}
            <div ref={messagesEndRef} />
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-4 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Ticket Controls</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {/* Controls here */}
                  <AssignmentSelect currentAssignment={ticket.assigned_to} onAssign={handleAssignmentChange} />
                  <Select value={ticket.priority} onValueChange={handlePriorityChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent></Select>
                  <Select value={ticket.category} onValueChange={handleCategoryChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                    <SelectItem value="kyc">KYC</SelectItem>
                    <SelectItem value="ban_appeal">Ban Appeal</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="copy-trading">Copy Trading</SelectItem>
                    <SelectItem value="earn-package">Earn Package</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent></Select>
                  <div className="flex gap-2 flex-wrap">
                    {ticket.status !== 'in_progress' && ticket.status !== 'closed' && (
                      <Button
                        onClick={() => updateMutation.mutate({ action: 'in_progress' })}
                        disabled={updateMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        Mark In Progress
                      </Button>
                    )}
                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <Button
                        onClick={() => updateMutation.mutate({ action: 'resolve' })}
                        disabled={updateMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Resolve
                      </Button>
                    )}
                    {ticket.status !== 'closed' && (
                      <Button
                        onClick={() => updateMutation.mutate({ action: 'close' })}
                        disabled={updateMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Close
                      </Button>
                    )}
                    {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                      <Button
                        onClick={() => updateMutation.mutate({ action: 'reopen' })}
                        disabled={updateMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reopen
                      </Button>
                    )}
                    {ticket.deleted_at && (
                      <Button
                        onClick={() => updateMutation.mutate({ action: 'restore' })}
                        disabled={updateMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-green-500/30 hover:bg-green-500/10 hover:border-green-500 text-green-500"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore Ticket
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              <UserContextSidebar ticket={ticket} isUserOnline={ticket.user_id ? isUserOnline(ticket.user_id) : false} />
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Footer */}
      {canReply && (
        <footer className="sticky bottom-0 z-10 bg-bg-secondary border-t border-bg-tertiary p-4">
          {showNoteInput ? (
             <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-500">Internal Note</span>
                <Button onClick={() => setShowNoteInput(false)} variant="ghost" size="sm"><X className="w-4 h-4" /></Button>
              </div>
              <Textarea value={internalNote} onChange={e => setInternalNote(e.target.value)} placeholder="Add internal note..." />
              <Button onClick={handleAddNote} disabled={noteMutation.isPending} size="sm" className="gap-2"><StickyNote className="w-4 h-4" /> Save Note</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                {showShortcutPopup && templatesWithShortcuts.length > 0 && (
                  <ShortcutPopup
                    templates={filteredShortcutTemplates}
                    filter={shortcutFilter}
                    selectedIndex={selectedShortcutIndex}
                    onSelect={handleShortcutSelect}
                    onClose={() => setShowShortcutPopup(false)}
                  />
                )}
                <Textarea
                  value={replyMessage}
                  onChange={e => handleReplyChange(e.target.value)}
                  placeholder="Type your reply... (type / for shortcuts)"
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="flex justify-between items-center">
                 <div className="flex gap-2">
                   <TemplateSelector
                     templates={templates}
                     isLoading={templatesLoading}
                     onSelect={(content) => setReplyMessage(prev => prev ? `${prev}\n\n${content}` : content)}
                     disabled={replyMutation.isPending}
                   />
                   <Button onClick={() => setShowNoteInput(true)} variant="outline" size="sm" className="gap-2"><StickyNote className="w-4 h-4" /> Add Note</Button>
                 </div>
                 <Button onClick={handleSendReply} disabled={replyMutation.isPending} className="gap-2"><Send className="w-4 h-4" /> Send</Button>
              </div>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
