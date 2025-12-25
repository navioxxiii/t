/**
 * Admin Layout
 * Layout wrapper for admin pages with sidebar
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileMenu } from '@/components/admin/AdminMobileMenu';
import UserMenu from '@/components/navigation/UserMenu';
import { branding } from '@/config/branding';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Redirect if not admin or super_admin
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const isSuperAdmin = profile.role === 'super_admin';

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-bg-tertiary bg-bg-secondary lg:block">
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center border-b border-bg-tertiary px-6">
            <h1 className="text-xl font-bold text-text-primary">{branding.name.full}</h1>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <AdminSidebar isSuperAdmin={isSuperAdmin} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-bg-tertiary bg-bg-secondary px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <AdminMobileMenu isSuperAdmin={isSuperAdmin} />
            <h2 className="text-lg font-semibold text-text-primary">
              Admin Panel
            </h2>
          </div>

          {/* User Menu */}
          <UserMenu />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-bg-primary">{children}</main>
      </div>
    </div>
  );
}
