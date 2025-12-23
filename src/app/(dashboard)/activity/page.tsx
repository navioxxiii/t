import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ActivityClient from '@/components/activity/ActivityClient';

export default async function ActivityPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Render the client component
  return <ActivityClient />;
}
