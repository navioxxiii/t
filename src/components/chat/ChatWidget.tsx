/**
 * Chat Widget Component
 * Floating chat button that opens the chat interface
 * Appears on all dashboard pages (like Tawk.to)
 */

'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from './ChatInterface';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
  prefillSubject?: string;
  prefillMessage?: string;
}

export function ChatWidget({ prefillSubject, prefillMessage }: ChatWidgetProps = {}) {
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat-minimized');
      return stored === 'true';
    }
    return false;
  });
  const user = useAuthStore((state) => state.user);
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const setChatOpen = useChatStore((state) => state.setChatOpen);
  const unreadCount = useChatStore((state) => state.unreadCount);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);
  const messages = useChatStore((state) => state.messages);
  const messagesLoading = useChatStore((state) => state.messagesLoading);
  const hasMore = useChatStore((state) => state.hasMore);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-minimized', String(isMinimized));
    }
  }, [isMinimized]);

  useEffect(() => {
    if (isChatOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

  const handleOpen = () => {
    if (!user) {
      window.location.href = '/support/new';
      return;
    }
    setChatOpen(true);
    setIsMinimized(false);
    resetUnreadCount(); // Reset unread count when chat is opened
  };

  const handleClose = () => {
    setChatOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setChatOpen(false);
  };

  return (
    <>
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
          onClick={handleClose}
          aria-label="Close chat"
        />
      )}

      {isChatOpen && !isMinimized && (
        <div
          className={cn(
            'fixed z-[9999] shadow-2xl',
            'top-0 right-0 bottom-0 left-0 md:inset-auto',
            'pt-safe pb-safe pl-safe pr-safe md:p-0',
            'md:bottom-24 md:right-6 md:w-[400px] md:h-[600px] md:rounded-2xl md:border md:border-bg-tertiary'
          )}
        >
          <ChatInterface
            onClose={handleClose}
            onMinimize={handleMinimize}
            messages={messages}
            messagesLoading={messagesLoading}
            hasMore={hasMore}
            showFullConversationLink={true}
            prefillSubject={prefillSubject}
            prefillMessage={prefillMessage}
          />
        </div>
      )}

      {!isChatOpen && (
        <button
          onClick={handleOpen}
          className={cn(
            'fixed bottom-6 right-6 z-[9998]',
            'hidden md:flex',
            'w-14 h-14 md:w-16 md:h-16',
            'bg-brand-primary hover:bg-brand-primary-light',
            'text-white rounded-full shadow-lg',
            'items-center justify-center',
            'transition-all duration-200 ease-in-out',
            'hover:scale-110 active:scale-95',
            'focus:outline-none focus:ring-4 focus:ring-brand-primary/30'
          )}
          aria-label="Open support chat"
        >
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />

          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}

          {unreadCount > 0 && (
            <span className="absolute inset-0 rounded-full bg-brand-primary animate-ping opacity-75" />
          )}
        </button>
      )}
    </>
  );
}
