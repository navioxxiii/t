/**
 * Email Button Component
 * Call-to-action button for emails
 */

import { Button } from '@react-email/components';
import { branding } from '@/config/branding';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function EmailButton({
  href,
  children,
  variant = 'primary',
}: EmailButtonProps) {
  const buttonStyle = variant === 'primary' ? primaryButton : secondaryButton;

  return (
    <Button href={href} style={buttonStyle}>
      {children}
    </Button>
  );
}

const baseButton = {
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
};

const primaryButton = {
  ...baseButton,
  backgroundColor: branding.email.colors.primary,
  color: '#ffffff',
};

const secondaryButton = {
  ...baseButton,
  backgroundColor: branding.email.colors.secondary,
  color: branding.email.colors.secondaryText,
  border: `1px solid ${branding.email.colors.border}`,
};
