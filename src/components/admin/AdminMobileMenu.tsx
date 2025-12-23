/**
 * Admin Mobile Menu Component
 * Mobile drawer navigation for admin pages
 */

'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminMobileMenuProps {
  isSuperAdmin?: boolean;
}

export function AdminMobileMenu({ isSuperAdmin = false }: AdminMobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center border-b border-bg-tertiary px-6">
            <h1 className="text-xl font-bold text-text-primary">Crypto Wallet</h1>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <AdminSidebar isSuperAdmin={isSuperAdmin} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
