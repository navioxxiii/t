/**
 * Email Header Component
 * Gold hairline strip + centered logo + small uppercase wordmark.
 */

import { Img, Section, Text } from '@react-email/components';
import { branding } from '@/config/branding';

interface EmailHeaderProps {
  logoUrl?: string;
  appName?: string;
}

export function EmailHeader({
  logoUrl = branding.email.logo.url,
  appName = branding.name.full,
}: EmailHeaderProps) {
  return (
    <>
      <div style={goldHairline} />
      <Section style={headerSection}>
        <Img
          src={logoUrl}
          alt={appName}
          width={40}
          height={40}
          style={logo}
        />
        <Text style={wordmark}>{appName.toUpperCase()}</Text>
      </Section>
    </>
  );
}

const goldHairline = {
  height: '3px',
  lineHeight: '3px',
  fontSize: 0,
  backgroundColor: branding.email.colors.primary,
};

const headerSection = {
  padding: '40px 0 28px',
  textAlign: 'center' as const,
  backgroundColor: branding.email.colors.background,
};

const logo = {
  margin: '0 auto 12px',
  display: 'block',
  borderRadius: '8px',
};

const wordmark = {
  margin: 0,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1.4px',
  color: branding.email.colors.text,
  textAlign: 'center' as const,
};
