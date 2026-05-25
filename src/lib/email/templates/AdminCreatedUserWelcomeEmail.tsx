/**
 * Admin Created User Welcome Email Template
 * Sent to users created by admin with a temporary password
 */

import { Heading, Section, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  SecurityNote,
  CTAGroup,
} from './components/EmailPrimitives';
import {
  getEmailUrl,
  getAppName,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';
import { branding } from '@/config/branding';

interface AdminCreatedUserWelcomeEmailProps {
  recipientName: string;
  tempPassword: string;
  loginUrl?: string;
  changePasswordUrl?: string;
}

export function AdminCreatedUserWelcomeEmail({
  recipientName,
  tempPassword,
  loginUrl,
  changePasswordUrl,
}: AdminCreatedUserWelcomeEmailProps) {
  const appName = getAppName();
  const finalLoginUrl = loginUrl || getEmailUrl('/login');
  const finalChangePasswordUrl =
    changePasswordUrl || getEmailUrl('/settings/security');

  return (
    <BaseEmail preview={`Your ${appName} account is ready`}>
      <Eyebrow>Account Created</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Welcome to {appName}, {recipientName}
      </Heading>

      <Text style={emailStyles.text}>
        An administrator has created an account for you. Sign in with the
        temporary password below — you&apos;ll be prompted to set a new one
        right away.
      </Text>

      <Divider />

      <SectionLabel>Temporary password</SectionLabel>
      <Section style={tempPasswordBox}>
        <Text style={tempPasswordText}>{tempPassword}</Text>
      </Section>
      <Text style={emailStyles.textSecondary}>
        This password is single-use and expires after your first sign-in.
      </Text>

      <Divider />

      <SectionLabel>Next steps</SectionLabel>
      <Text style={emailStyles.text}>
        1. Sign in with your email and the password above.
        <br />
        2. Set a strong new password and a transaction PIN.
        <br />
        3. Enable two-factor authentication.
        <br />
        4. Start using your wallet.
      </Text>

      <Divider />

      <CTAGroup>
        <EmailButton href={finalLoginUrl}>Sign in</EmailButton>
        <div style={{ marginTop: 12 }}>
          <EmailButton href={finalChangePasswordUrl} variant="secondary">
            Change password
          </EmailButton>
        </div>
      </CTAGroup>

      <SecurityNote title="Keep this password private">
        {appName} will never ask for your password by email, phone, or chat.
        If anyone requests it, treat it as a phishing attempt.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

const tempPasswordBox = {
  backgroundColor: '#FAFAF7',
  borderRadius: '10px',
  borderLeft: `3px solid ${branding.email.colors.primary}`,
  padding: '16px 20px',
  margin: '0 0 12px',
};

const tempPasswordText = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  color: branding.email.colors.text,
  margin: 0,
  wordBreak: 'break-all' as const,
};
