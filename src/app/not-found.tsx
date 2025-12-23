/**
 * 404 Not Found Page
 * Modern, animated page for handling missing routes
 */

import Link from 'next/link';
import { Home, Wallet, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { branding } from '@/config/branding';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-primary/3 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        {/* 404 Number - Large and eye-catching */}
        <div className="text-center animate-fade-in">
          <div className="relative inline-block">
            <h1 className="text-[150px] md:text-[200px] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-br from-brand-primary via-brand-primary-light to-brand-primary animate-gradient-shift">
              404
            </h1>
            <div className="absolute inset-0 blur-2xl opacity-50">
              <h1 className="text-[150px] md:text-[200px] font-bold leading-none text-brand-primary">
                404
              </h1>
            </div>
          </div>
        </div>

        {/* Search Icon with animation */}
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-bg-secondary border-2 border-bg-tertiary flex items-center justify-center">
              <Search className="w-10 h-10 text-text-secondary animate-bounce" />
            </div>
            <div className="absolute -inset-2 bg-brand-primary/20 rounded-full blur-xl animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Page Not Found
          </h2>
          <p className="text-lg text-text-secondary max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            asChild
            size="lg"
            className="gap-2 group"
          >
            <Link href="/dashboard">
              <Wallet className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Go to Dashboard
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="gap-2 group"
          >
            <Link href="/">
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Quick links */}
        <div className="pt-8 border-t border-bg-tertiary animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-text-tertiary text-center mb-4">
            Popular pages you might be looking for:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-brand-primary/50 text-sm text-text-secondary hover:text-text-primary transition-all hover:scale-105"
            >
              Wallet
            </Link>
            <Link
              href="/swap"
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-brand-primary/50 text-sm text-text-secondary hover:text-text-primary transition-all hover:scale-105"
            >
              Swap
            </Link>
            <Link
              href="/earn"
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-brand-primary/50 text-sm text-text-secondary hover:text-text-primary transition-all hover:scale-105"
            >
              Earn
            </Link>
            <Link
              href="/copy-trade"
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-brand-primary/50 text-sm text-text-secondary hover:text-text-primary transition-all hover:scale-105"
            >
              Copy Trade
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-brand-primary/50 text-sm text-text-secondary hover:text-text-primary transition-all hover:scale-105"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Support info */}
        <div className="text-center text-sm text-text-tertiary animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p>
            Need help?{' '}
            <a
              href={`mailto:${branding.company.email}`}
              className="text-brand-primary hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
