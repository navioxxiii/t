'use client';

import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { KYCGate } from "@/components/kyc/KYCGate";
import { KYCStatusBanner } from "@/components/kyc/KYCStatusBanner";
import { BottomNav } from "@/components/navigation/BottomNav";
import { DashboardHeader } from "@/components/navigation/DashboardHeader";
import { AppLockWrapper } from "@/components/security/AppLockWrapper";
import { useAuthStore } from "@/stores/authStore";
import { useGlobalPresence } from "@/hooks/useGlobalPresence";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";
import { openSupportChat, useHideTawkBubble } from "@/components/chat/TawkTo";

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  // Track user's online presence for admin visibility
  useGlobalPresence(user?.id ?? null, user?.email ?? undefined, profile?.full_name ?? undefined);

  // Support chat opens from the header button; no floating bubble over the app
  useHideTawkBubble();

  return (
    <div className="min-h-screen flex flex-col relative h-screen-ios">
      <DashboardHeader onSupportClick={openSupportChat} />
      <AppLockWrapper>
        <KYCGate>
          <div className="bg-bg-primary">
            <div className="pt-nav px-4">
              <EmailVerificationBanner />
              <KYCStatusBanner />
            </div>
            <main className="pb-nav">{children}</main>
            {/* Inside KYCGate: never over the lock screen, KYC gate, auth or public pages */}
            <PWAInstallButton />
          </div>
        </KYCGate>
      </AppLockWrapper>
      <BottomNav />
    </div>
  );
}
