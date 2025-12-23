/**
 * Install Instructions Dialog
 * Shows browser-specific installation instructions when PWA prompt is not available
 */

'use client';

import { Chrome, Globe } from 'lucide-react';
import { branding } from '@/config/branding';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface InstallInstructionsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InstallInstructionsDialog({ open, onClose }: InstallInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Globe className="w-6 h-6 text-brand-primary" />
            Install {branding.name.full}
          </DialogTitle>
          <DialogDescription className="text-center">
            Install as a Progressive Web App
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-text-secondary text-center">
            To install this app on your device, follow these steps in your browser:
          </p>

          {/* Chrome/Edge Instructions */}
          <div className="bg-bg-tertiary/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-brand-primary font-semibold">
              <Chrome className="w-5 h-5" />
              <span>Chrome / Edge / Brave</span>
            </div>

            <div className="space-y-2 text-sm text-text-primary">
              <div className="flex gap-3">
                <span className="font-bold text-brand-primary shrink-0">1.</span>
                <span>Click the menu icon (⋮ or •••) in the top right corner</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-brand-primary shrink-0">2.</span>
                <span>Select <strong>&quot;Install {branding.name.short}&quot;</strong> or <strong>&quot;Install app&quot;</strong></span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-brand-primary shrink-0">3.</span>
                <span>Click <strong>&quot;Install&quot;</strong> in the popup</span>
              </div>
            </div>
          </div>

          {/* Firefox Instructions */}
          <div className="bg-bg-tertiary/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-brand-primary font-semibold">
              <Globe className="w-5 h-5" />
              <span>Firefox</span>
            </div>

            <div className="space-y-2 text-sm text-text-primary">
              <div className="flex gap-3">
                <span className="font-bold text-brand-primary shrink-0">1.</span>
                <span>Look for the install icon in the address bar</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-brand-primary shrink-0">2.</span>
                <span>Click it and select <strong>&quot;Install&quot;</strong></span>
              </div>
            </div>
          </div>

          <p className="text-xs text-text-tertiary text-center pt-2">
            Once installed, the app will be available in your applications menu and can work offline.
          </p>
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
