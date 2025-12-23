/**
 * Email Header Component
 * Displays logo and branding at the top of emails
 */

import { Img, Section } from '@react-email/components';
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
    <Section style={headerSection}>
      <Img
        src={logoUrl}
        alt={appName}
        width={branding.email.logo.width}
        height={branding.email.logo.height}
        style={logo}
      />
    </Section>
  );
}

const headerSection = {
  padding: '40px 0 20px',
  textAlign: 'center' as const,
  backgroundColor: branding.email.colors.background,
};

const logo = {
  margin: '0 auto',
  display: 'block',
};
