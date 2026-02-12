/**
 * Empty Wallet Banner Component
 * Shows when user has no balances and guides them to initialize
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function EmptyWalletBanner() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInitialize = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/user/initialize-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize wallet');
      }

      toast.success(data.message || 'Wallet initialized successfully!');

      // Reload page to show tokens
      router.refresh();
    } catch (error) {
      console.error('Error initializing wallet:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to initialize wallet'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <CardTitle>Wallet Initialization Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">
          Your wallet needs to be initialized before you can view tokens or make
          transactions. This is a one-time setup that creates balance entries
          for all supported tokens.
        </p>
        <Button onClick={handleInitialize} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Initialize Wallet Now
        </Button>
      </CardContent>
    </Card>
  );
}
