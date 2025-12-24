import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from '../../components/layout/DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Check if user is banned
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, banned_reason, banned_at')
    .eq('id', user.id)
    .single();

  if (profile?.is_banned) {
    const suspendedUrl = new URL('/account-suspended', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    if (profile.banned_at) {
      suspendedUrl.searchParams.set('banned_at', profile.banned_at);
    }
    redirect(suspendedUrl.toString());
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    redirect('/verify-email');
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
