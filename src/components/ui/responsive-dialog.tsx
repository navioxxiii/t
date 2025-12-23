'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode;
  className?: string;
  onInteractOutside?: (e: Event) => void;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
}

export function ResponsiveDialogContent({
  children,
  className,
  onInteractOutside,
  onEscapeKeyDown,
}: ResponsiveDialogContentProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerContent
        className={className}
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      className={className}
      onInteractOutside={onInteractOutside}
      onEscapeKeyDown={onEscapeKeyDown}
    >
      {children}
    </DialogContent>
  );
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogHeader({
  children,
  className,
}: ResponsiveDialogHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>;
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogTitle({
  children,
  className,
}: ResponsiveDialogTitleProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogDescription({
  children,
  className,
}: ResponsiveDialogDescriptionProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>;
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogFooter({
  children,
  className,
}: ResponsiveDialogFooterProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}

interface ResponsiveDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function ResponsiveDialogTrigger({
  children,
  asChild,
}: ResponsiveDialogTriggerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
  }

  return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
}
