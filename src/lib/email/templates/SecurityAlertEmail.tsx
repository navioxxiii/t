/**
 * Security Alert Email Template
 * Sent for security-related events (PIN lockout, suspicious activity, etc.)
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  SecurityNote,
  DetailRow,
  CTAGroup,
} from './components/EmailPrimitives';
import {
  getSupportUrl,
  getSecurityUrl,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';
import { branding } from '@/config/branding';

interface SecurityAlertEmailProps {
  recipientName: string;
  alertType: 'pin_lockout' | 'suspicious_activity' | 'account_compromised';
  message: string;
  lockDuration?: number;
}

export function SecurityAlertEmail({
  recipientName,
  alertType,
  message,
  lockDuration,
}: SecurityAlertEmailProps) {
  const getAlertTitle = () => {
    switch (alertType) {
      case 'pin_lockout':
        return 'Your account is temporarily locked';
      case 'suspicious_activity':
        return 'We spotted unusual activity on your account';
      case 'account_compromised':
        return 'Action needed to secure your account';
      default:
        return 'Security alert';
    }
  };

  const formatLockDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  };

  return (
    <BaseEmail preview={getAlertTitle()}>
      <Eyebrow>Security Alert</Eyebrow>
      <Heading
        style={{ ...emailStyles.heading, color: branding.email.colors.error }}
        className="tw-h1"
      >
        {getAlertTitle()}
      </Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>
      <Text style={emailStyles.text}>{message}</Text>

      {alertType === 'pin_lockout' && lockDuration && (
        <>
          <Divider />
          <SectionLabel>Lock details</SectionLabel>
          <DetailRow label="Duration" value={formatLockDuration(lockDuration)} />
          <DetailRow label="Reason" value="Multiple failed PIN attempts" />
        </>
      )}

      <Divider />

      <SectionLabel>What to do</SectionLabel>
      <Text style={emailStyles.text}>
        • <strong>If this was you</strong> — wait for the lock to expire, then
        sign in as usual.
        <br />• <strong>If this wasn&apos;t you</strong> — contact support
        immediately and change your password and PIN.
        <br />• Review recent activity and enable two-factor authentication if
        you haven&apos;t already.
      </Text>

      <Divider />

      <CTAGroup>
        <EmailButton href={getSupportUrl()}>Contact support</EmailButton>
        <div style={{ marginTop: 12 }}>
          <EmailButton href={getSecurityUrl()} variant="secondary">
            Review security settings
          </EmailButton>
        </div>
      </CTAGroup>

      <SecurityNote title="Why you're seeing this">
        Tano monitors every account for unusual sign-in and transaction
        patterns. Alerts like this are sent the moment we see something worth
        your attention — even if it later turns out to be routine.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
