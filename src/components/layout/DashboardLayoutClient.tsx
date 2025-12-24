'use client';

import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { KYCGate } from "@/components/kyc/KYCGate";
import { KYCStatusBanner } from "@/components/kyc/KYCStatusBanner";
import { BottomNav } from "@/components/navigation/BottomNav";
import { DashboardHeader } from "@/components/navigation/DashboardHeader";
import { AppLockWrapper } from "@/components/security/AppLockWrapper";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useGlobalPresence } from "@/hooks/useGlobalPresence";

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const setChatOpen = useChatStore((state) => state.setChatOpen);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  // Track user's online presence for admin visibility
  useGlobalPresence(user?.id ?? null, user?.email ?? undefined, profile?.full_name ?? undefined);

  return (
    <div className="min-h-screen flex flex-col relative h-screen-ios">
      <DashboardHeader onSupportClick={() => setChatOpen(true)} />
      <AppLockWrapper>
        <KYCGate>
          <div className="bg-bg-primary">
            <div className="pt-nav px-4">
              <EmailVerificationBanner />
              <KYCStatusBanner />
            </div>
            <main className="pb-nav">{children}</main>
          </div>
        </KYCGate>
      </AppLockWrapper>
      <BottomNav />
      <ChatWidget />
    </div>
  );
}
