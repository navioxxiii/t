'use client';

import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AppearanceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Theme = 'light' | 'dark' | 'system';

export function AppearanceSettingsDialog({
  open,
  onOpenChange,
}: AppearanceSettingsDialogProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(() => {
    // Initialize from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      return stored || 'system';
    }
    return 'system';
  });

  const handleThemeChange = (theme: Theme) => {
    setSelectedTheme(theme);
    localStorage.setItem('theme', theme);

    // Apply theme
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    toast.success(`Theme changed to ${theme}`);
  };

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode; description: string }> = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className="h-5 w-5" />,
      description: 'Light mode theme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <Moon className="h-5 w-5" />,
      description: 'Dark mode theme',
    },
    {
      value: 'system',
      label: 'System',
      icon: <Monitor className="h-5 w-5" />,
      description: 'Follow system preference',
    },
  ];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Appearance</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Customize how the app looks on your device
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4 px-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value)}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                    selectedTheme === theme.value
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-bg-tertiary hover:border-brand-primary/50 hover:bg-bg-tertiary'
                  }`}
                >
                  <div
                    className={`${
                      selectedTheme === theme.value
                        ? 'text-brand-primary'
                        : 'text-text-secondary'
                    }`}
                  >
                    {theme.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className={`font-semibold ${
                        selectedTheme === theme.value
                          ? 'text-brand-primary'
                          : 'text-text-primary'
                      }`}
                    >
                      {theme.label}
                    </p>
                    <p className="text-sm text-text-tertiary">
                      {theme.description}
                    </p>
                  </div>
                  {selectedTheme === theme.value && (
                    <div className="h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="pb-6"></div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
