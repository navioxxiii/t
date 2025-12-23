/**
 * iOS Installation Instructions Modal
 * Shows step-by-step guide for installing PWA on iOS/Safari
 */

'use client';

import { Share } from 'lucide-react';
import { branding } from '@/config/branding';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface IOSInstallModalProps {
  open: boolean;
  onClose: () => void;
}

export function IOSInstallModal({ open, onClose }: IOSInstallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Install {branding.name.full}
          </DialogTitle>
          <DialogDescription className="text-center">
            For iPhone & iPad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1 */}
          <div className="flex gap-4 items-start">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-bg-primary font-bold text-sm shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="text-text-primary">
                Tap the <strong>Share</strong> button{' '}
                <Share className="inline w-4 h-4 mx-1" /> at the bottom of your screen
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-bg-primary font-bold text-sm shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="text-text-primary">
                Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-bg-primary font-bold text-sm shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="text-text-primary">
                Tap <strong>&quot;Add&quot;</strong> to confirm installation
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-brand-primary hover:bg-brand-primary-dark text-bg-primary font-semibold px-6 py-3 rounded-lg transition-all"
        >
          Got it!
        </button>
      </DialogContent>
    </Dialog>
  );
}
