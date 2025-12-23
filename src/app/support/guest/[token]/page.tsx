/**
 * Guest Ticket View Page
 * Public access via token - no login required
 * Uses real-time subscriptions for instant message updates
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { CategoryIcon, getCategoryLabel } from '@/components/support/CategoryIcon';
import { Loader2, AlertCircle, Send, Home } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useGuestRealtimeMessages } from '@/hooks/useGuestRealtimeMessages';

export default function GuestTicketPage() {
  const params = useParams();
  const token = params.token as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [replyMessage, setReplyMessage] = useState('');

  // Use real-time hook instead of polling
  const { ticket, messages, loading: isLoading, error, refetch } = useGuestRealtimeMessages(token);
  const isError = !!error;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); // Watch entire array, not just length

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/support/guest/${token}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reply');
      }
      return response.json();
    },
    onSuccess: () => {
      setReplyMessage('');
      // Real-time subscription will handle the update, but refetch for safety
      refetch();
      toast.success('Reply sent successfully!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;
    replyMutation.mutate(replyMessage.trim());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error || 'Failed to load ticket'}
          </AlertDescription>
        </Alert>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>Ticket not found or invalid access link</AlertDescription>
        </Alert>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const canReply = ticket.status !== 'closed';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Guest Banner */}
      <Alert className="border-orange-500/30 bg-orange-500/10">
        <AlertCircle className="w-4 h-4 text-orange-500" />
        <AlertDescription className="text-orange-500">
          You are viewing a guest ticket. Save this link to access your ticket anytime.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <Card className="bg-bg-secondary border-bg-tertiary">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full p-3 bg-bg-tertiary">
              <CategoryIcon category={ticket.category} className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-sm text-text-tertiary">
                  {ticket.ticket_number}
                </span>
                <TicketStatusBadge status={ticket.status} />
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                  Guest Ticket
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                {ticket.subject}
              </h1>
              <div className="flex items-center gap-3 text-sm text-text-tertiary flex-wrap">
                <span>{getCategoryLabel(ticket.category)}</span>
                <span>•</span>
                <span>{ticket.user_email}</span>
                <span>•</span>
                <span>
                  Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="bg-bg-secondary border-bg-tertiary">
        <CardContent className="p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-text-tertiary">
              <p>No messages yet</p>
            </div>
          ) : (
            messages.map((msg: { id: string; sender_type: string; message: string; created_at: string }) => {
              const isGuest = msg.sender_type === 'guest';
              const isSystem = msg.sender_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="text-xs text-text-tertiary bg-bg-tertiary px-3 py-1 rounded-full">
                      {msg.message}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn('flex', isGuest ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg p-4',
                      isGuest
                        ? 'bg-brand-primary text-bg-primary'
                        : 'bg-bg-tertiary text-text-primary'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium">
                        {isGuest ? 'You' : 'Support Team'}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          {/* Scroll anchor for auto-scroll to latest messages */}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Reply Box */}
      {canReply ? (
        <Card className="bg-bg-secondary border-bg-tertiary sticky bottom-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-tertiary">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || replyMutation.isPending}
                  className="bg-brand-primary hover:bg-brand-primary-light text-bg-primary gap-2"
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            This ticket is closed. You cannot reply to closed tickets. Please create a new ticket if you need further assistance.
          </AlertDescription>
        </Alert>
      )}

      {/* Footer */}
      <div className="text-center pt-6">
        <p className="text-sm text-text-tertiary mb-3">
          Want faster support and access to all features?
        </p>
        <Link href="/register">
          <Button variant="outline">Create an Account</Button>
        </Link>
      </div>
    </div>
  );
}
