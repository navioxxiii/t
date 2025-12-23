/**
 * Security Alert Email Template
 * Sent for security-related events (PIN lockout, suspicious activity, etc.)
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getSupportUrl, getSecurityUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

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
        return 'Account Temporarily Locked';
      case 'suspicious_activity':
        return 'Security Alert: Suspicious Activity Detected';
      case 'account_compromised':
        return 'Security Alert: Account Security';
      default:
        return 'Security Alert';
    }
  };

  return (
    <BaseEmail preview={getAlertTitle()}>
      <Heading style={{ ...emailStyles.heading, color: '#dc2626' }}>{getAlertTitle()}</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>{message}</Text>

      {alertType === 'pin_lockout' && lockDuration && (
        <Section style={emailStyles.warningBox}>
          <Text style={emailStyles.warningText}>
            <strong>Lock Duration:</strong> {lockDuration} seconds
            <br />
            <br />
            Your account will be automatically unlocked after this period. This is a security measure to protect your account from unauthorized access attempts.
          </Text>
        </Section>
      )}

      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorText}>
          <strong>What to do:</strong>
          <br />
          • If this was you, wait for the lock period to expire
          <br />
          • If this wasn&apos;t you, contact support immediately
          <br />
          • Review your account activity and security settings
          <br />
          • Consider changing your password and PIN
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getSupportUrl()}>Contact Support</EmailButton>
        <div style={{ marginTop: '12px' }}>
          <EmailButton href={getSecurityUrl()} variant="secondary">
            Security Settings
          </EmailButton>
        </div>
      </div>

      <Text style={emailStyles.text}>
        If you have any concerns about your account security, {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

