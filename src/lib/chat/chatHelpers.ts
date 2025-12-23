/**
 * Chat Helper Utilities
 * Helper functions for chat operations
 */


/**
 * Send a chat message
 * Returns newTicket info if a new ticket was created (e.g., when replying to a deleted ticket)
 */
export async function sendChatMessage(
  ticketId: string,
  message: string
): Promise<{
  success: boolean;
  error?: string;
  newTicket?: { id: string; ticket_number: string; subject: string }
}> {
  try {
    const response = await fetch(`/api/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim() }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    const data = await response.json();

    // If a new ticket was created (e.g., replying to deleted ticket)
    if (data.newTicket) {
      console.log('[chatHelpers] New ticket created:', data.newTicket);
      return { success: true, newTicket: data.newTicket };
    }

    return { success: true };
  } catch (error) {
    console.error('[chatHelpers] Send message error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(ticketId: string): Promise<void> {
  try {
    await fetch(`/api/support/tickets/${ticketId}/mark-read`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('[chatHelpers] Mark as read error:', error);
  }
}

/**
 * Scroll to bottom of chat
 */
export function scrollToBottom(
  containerRef: React.RefObject<HTMLElement | HTMLDivElement | null>,
  smooth = true
) {
  if (containerRef.current) {
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }
}

/**
 * Format message timestamp
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  // Show date and time
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
