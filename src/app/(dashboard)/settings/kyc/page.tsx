import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import KYCSettingsClient from '@/components/kyc/KYCSettingsClient';

export const dynamic = 'force-dynamic';

export default async function KYCSettingsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (!user) {
    redirect('/login');
  }

  return <KYCSettingsClient />;
}
