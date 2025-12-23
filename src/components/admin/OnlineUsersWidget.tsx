'use client';

import { useState } from 'react';
import { useOnlineUsersMonitor, OnlineUser } from '@/hooks/useOnlineUsersMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function OnlineUsersWidget() {
  const { onlineUsersList, onlineCount } = useOnlineUsersMonitor();
  const router = useRouter();
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);

  const handleMessageUser = async (user: OnlineUser) => {
    setMessagingUserId(user.user_id);

    try {
      const response = await fetch('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          user_email: user.email,
          user_name: user.name,
          subject: 'Message from Support',
          category: 'other',
          initiated_by_admin: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/support/${data.ticket.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to message user');
    } finally {
      setMessagingUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Online Users
          {onlineCount > 0 && (
            <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              {onlineCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {onlineCount === 0 ? (
          <p className="text-sm text-muted-foreground">No users online</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {onlineUsersList.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email || 'No email'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMessageUser(user)}
                  disabled={messagingUserId === user.user_id}
                  title="Send message"
                >
                  {messagingUserId === user.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
