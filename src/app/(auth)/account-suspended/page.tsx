/**
 * Account Suspended Page
 * Shown to banned users with support contact options
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldOff, MessageCircle, FileText, AlertCircle } from 'lucide-react';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { branding } from '@/config/branding';
import { useChatStore } from '@/stores/chatStore';

function AccountSuspendedContent() {
  const searchParams = useSearchParams();
  const setChatOpen = useChatStore((state) => state.setChatOpen);

  // Get bannedDate directly from searchParams to avoid setState in effect
  const bannedDate = searchParams.get('banned_at');

  const handleContactSupport = () => {
    setChatOpen(true);
  };

  const formattedDate = bannedDate
    ? new Date(bannedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <Card className="w-full max-w-md bg-bg-secondary border-bg-tertiary">
          <CardHeader className="space-y-4 text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center">
              <div className="rounded-full bg-action-red/10 p-6">
                <ShieldOff className="h-12 w-12 text-action-red" />
              </div>
            </div>

            {/* Title */}
            <div>
              <CardTitle className="text-2xl font-bold text-text-primary">
                Account Suspended
              </CardTitle>
              <CardDescription className="text-text-secondary mt-2">
                Your account is temporarily suspended. Contact our support team
                to resolve this issue and restore access.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Suspension Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Suspended on {formattedDate}</p>
                  <p className="text-sm text-text-secondary">
                    Your funds are secure. Please reach out to our support team
                    to discuss your account status.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Contact Options */}
            <div className="space-y-3">
              <Button
                onClick={handleContactSupport}
                className="w-full"
                size="lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact Support
              </Button>

              <Link href="/support" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <FileText className="mr-2 h-5 w-5" />
                  View My Support Tickets
                </Button>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t border-bg-tertiary">
              <div className="text-center space-y-2">
                <p className="text-sm text-text-secondary">
                  Our support team typically responds within 24 hours
                </p>
                <p className="text-xs text-text-tertiary">
                  For urgent matters, please use the Contact Support button
                  above
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Widget with prefill */}
      <ChatWidget
        prefillSubject="Account Suspension Appeal"
        prefillMessage="I would like to discuss my account suspension and understand the next steps to restore access to my account."
      />
    </>
  );
}

export default function AccountSuspendedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-primary">
          <div className="text-center">
            <Image
              src="/icons/brand/icon-192.png"
              alt={branding.name.short}
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <AccountSuspendedContent />
    </Suspense>
  );
}
