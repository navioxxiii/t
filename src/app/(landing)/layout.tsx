'use client';

import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      {children}
      <Footer />
      <ChatWidget />
    </div>
  );
}