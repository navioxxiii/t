/**
 * Email Footer Component
 * Tight, compliance-flavored footer on a warm-tinted strip.
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
        <Text style={brandLine}>
          {appName}{' '}
          <span style={dotSep}>·</span>{' '}
          <span style={mutedInline}>{branding.description.short}</span>
        </Text>

        <Text style={contactLine}>
          <Link href={`mailto:${supportEmail}`} style={link}>
            {supportEmail}
          </Link>
        </Text>

        {unsubscribeUrl && (
          <Text style={contactLine}>
            <Link href={unsubscribeUrl} style={mutedLink}>
              Unsubscribe
            </Link>
          </Text>
        )}

        <Text style={legalLine}>
          © {currentYear} {appName}. All rights reserved.
        </Text>
      </Section>
    </>
  );
}

const divider = {
  borderTop: `1px solid ${branding.email.colors.border}`,
  borderBottom: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  margin: '32px 0 0',
};

const footerSection = {
  backgroundColor: '#FAFAF7',
  padding: '24px 40px 28px',
  textAlign: 'center' as const,
};

const brandLine = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '13px',
  lineHeight: '20px',
  fontWeight: '600',
  color: branding.email.colors.text,
  margin: '0 0 6px',
};

const contactLine = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '13px',
  lineHeight: '20px',
  color: branding.email.colors.textSecondary,
  margin: '0 0 6px',
};

const legalLine = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '12px',
  lineHeight: '18px',
  color: branding.email.colors.textMuted,
  margin: '12px 0 0',
};

const mutedInline = {
  color: branding.email.colors.textSecondary,
  fontWeight: 400,
};

const dotSep = {
  color: branding.email.colors.textMuted,
};

const link = {
  color: branding.email.colors.primaryHover,
  textDecoration: 'none',
};

const mutedLink = {
  color: branding.email.colors.textMuted,
  textDecoration: 'underline',
};
