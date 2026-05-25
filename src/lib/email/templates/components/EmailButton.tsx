/**
 * Email Button Component
 * Gold primary CTA; warm-neutral secondary with hairline border.
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
    <span className="tw-cta">
      <Button href={href} style={buttonStyle}>
        {children}
      </Button>
    </span>
  );
}

const baseButton = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '600',
  letterSpacing: '0.2px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  borderRadius: '8px',
  lineHeight: '20px',
};

const primaryButton = {
  ...baseButton,
  backgroundColor: branding.email.colors.primary,
  color: '#FFFFFF',
};

const secondaryButton = {
  ...baseButton,
  backgroundColor: branding.email.colors.secondary,
  color: branding.email.colors.secondaryText,
  border: `1px solid ${branding.email.colors.border}`,
};
