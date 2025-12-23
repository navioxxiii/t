/**
 * Public Support Layout
 * Minimal layout for public support pages (guest ticket creation and viewing)
 */

'use client';

import { branding } from "@/config/branding";
import Link from "next/link";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Simple header */}
      {/* <header className="sticky top-0 z-50 bg-bg-secondary border-b border-bg-tertiary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <span className="text-bg-primary font-bold text-sm">CW</span>
            </div>
            <span className="font-bold text-text-primary">Crypto Wallet</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm bg-brand-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-brand-primary-light transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header> */}

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="bg-bg-secondary border-t border-bg-tertiary py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-text-tertiary">
            &copy; {new Date().getFullYear()} {branding.name.full}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
