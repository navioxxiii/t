/**
 * Create Support Ticket Page
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 */

'use client';

import { MessageCircle } from 'lucide-react';

export default function CreateTicketPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-2xl mx-auto">
      <div className="bg-brand-primary/10 rounded-full p-4 mb-6">
        <MessageCircle className="h-12 w-12 text-brand-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-4">Support Has Moved!</h1>
      <p className="text-text-secondary mb-6">
        We&apos;ve upgraded to a better support experience with instant chat and ticketing.
      </p>
      <button
        onClick={() => {
          if (typeof window !== 'undefined' && (window as any).Tawk_API) {
            (window as any).Tawk_API.maximize();
          }
        }}
        className="bg-brand-primary text-bg-primary px-6 py-3 rounded-lg font-semibold hover:bg-brand-primary/90 transition-colors"
      >
        Open Support Chat
      </button>
      <p className="text-xs text-text-tertiary mt-4">
        Or use the chat widget in the bottom-right corner
      </p>
    </div>
  );
}

/* ============================================================================
 * ORIGINAL IMPLEMENTATION (COMMENTED OUT - MIGRATED TO TAWK.TO)
 * ============================================================================
 *
 * This page previously provided a comprehensive ticket creation form for both
 * authenticated users and guests. It supported multiple categories, file uploads,
 * and email notifications for guest tickets.
 *
 * See git history to restore the full ~300 line implementation.
 *
 * ============================================================================ */
