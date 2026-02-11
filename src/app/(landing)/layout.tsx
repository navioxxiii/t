'use client';

import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
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
    </div>
  );
}