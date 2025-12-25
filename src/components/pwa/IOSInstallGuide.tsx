/**
 * iOS Install Guide Modal
 * Shows step-by-step instructions for iOS users
 */

"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Share, Plus, CheckCircle } from "lucide-react";
import { branding } from "@/config/branding";

interface IOSInstallGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismissPermanently?: () => void;
}

export function IOSInstallGuide({
  open,
  onOpenChange,
  onDismissPermanently,
}: IOSInstallGuideProps) {
  const handleDontShowAgain = () => {
    onDismissPermanently?.();
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-center">
            Install {branding.name.full}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-center">
            Add this app to your home screen for quick access
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 py-6 space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Share className="w-5 h-5 text-brand-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">
                1. Tap the Share button
              </h3>
              <p className="text-sm text-text-secondary">
                Look for the <Share className="inline w-4 h-4 mx-1" /> share
                icon at the bottom of Safari
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-brand-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">
                2. Select &quot;Add to Home Screen&quot;
              </h3>
              <p className="text-sm text-text-secondary">
                Scroll down and tap &quot;Add to Home Screen&quot; from the menu
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-brand-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">
                3. Tap &quot;Add&quot;
              </h3>
              <p className="text-sm text-text-secondary">
                Confirm by tapping &quot;Add&quot; in the top right corner
              </p>
            </div>
          </div>

          {/* Visual Hint */}
          <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-tertiary">
            <p className="text-xs text-text-tertiary text-center">
              The app will appear on your home screen like any other app. You
              can open it anytime with one tap!
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Got it!
            </Button>
            <Button
              onClick={handleDontShowAgain}
              variant="ghost"
              className="w-full text-text-tertiary hover:text-text-secondary"
            >
              Don&apos;t show this again
            </Button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
