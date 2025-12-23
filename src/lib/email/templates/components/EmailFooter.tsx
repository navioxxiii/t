/**
 * Email Footer Component
 * Displays copyright, links, and unsubscribe information
 */

import { Section, Text, Link, Hr } from '@react-email/components';
import { branding } from '@/config/branding';

interface EmailFooterProps {
  appName?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

export function EmailFooter({
  appName = branding.name.full,
  supportEmail = branding.company.email,
  unsubscribeUrl,
}: EmailFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Hr style={divider} />
      <Section style={footerSection}>
        <Text style={footerText}>
          Need help? Contact us at{' '}
          <Link href={`mailto:${supportEmail}`} style={link}>
            {supportEmail}
          </Link>
        </Text>

        <Text style={footerText}>
          © {currentYear} {appName}. All rights reserved.
        </Text>

        {unsubscribeUrl && (
          <Text style={footerText}>
            <Link href={unsubscribeUrl} style={mutedLink}>
              Unsubscribe from these emails
            </Link>
          </Text>
        )}

        <Text style={addressText}>
          {appName} | {branding.description.short}
        </Text>
      </Section>
    </>
  );
}

const divider = {
  borderColor: branding.email.colors.border,
  margin: '40px 0',
};

const footerSection = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: branding.email.colors.textSecondary,
  margin: '8px 0',
};

const addressText = {
  fontSize: '12px',
  lineHeight: '20px',
  color: branding.email.colors.textMuted,
  margin: '16px 0 0',
};

const link = {
  color: branding.email.colors.primary,
  textDecoration: 'none',
};

const mutedLink = {
  color: branding.email.colors.textMuted,
  textDecoration: 'underline',
};
