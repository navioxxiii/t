import { createBrowserClient } from '@supabase/ssr';

// Singleton instance for browser-side client
// This ensures all realtime subscriptions use the same websocket connection
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Server-side: always create new instance (no singleton needed)
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Browser-side: use singleton to share websocket connection
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
