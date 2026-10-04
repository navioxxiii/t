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
import { useQueryClient } from '@tanstack/react-query';

export function EmptyWalletBanner() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

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
        throw new Error(data.error || 'Could not set up your wallet');
      }

      toast.success('Your wallet is set up');

      // Balances are loaded in the browser, so refetch them (router.refresh() wouldn't)
      await queryClient.invalidateQueries({ queryKey: ['balances'] });
    } catch (error) {
      console.error('Error initializing wallet:', error);
      toast.error(
        error instanceof Error ? error.message : 'Could not set up your wallet'
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
          <CardTitle>Set up your wallet</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">
          One quick step to add all supported coins to your wallet.
        </p>
        <Button onClick={handleInitialize} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Set up wallet
        </Button>
      </CardContent>
    </Card>
  );
}
