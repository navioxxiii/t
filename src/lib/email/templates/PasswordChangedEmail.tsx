/**
 * Password Changed Email Template
 * Sent when user changes their password
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getSupportUrl, getSecurityUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface PasswordChangedEmailProps {
  recipientName: string;
  timestamp?: string;
}

export function PasswordChangedEmail({
  recipientName,
  timestamp,
}: PasswordChangedEmailProps) {
  return (
    <BaseEmail preview="Your password has been changed">
      <Heading style={emailStyles.heading}>Password Changed Successfully</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        This is a confirmation that your password has been successfully changed.
        {timestamp && ` The change was made on ${new Date(timestamp).toLocaleString()}.`}
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          <strong>Security Tips:</strong>
          <br />
          • Use a strong, unique password
          <br />
          • Never share your password with anyone
          <br />
          • Enable two-factor authentication for extra security
          <br />
          • If you didn&apos;t make this change, contact support immediately
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getSecurityUrl()}>Security Settings</EmailButton>
      </div>

      <Section style={emailStyles.warningBox}>
        <Text style={emailStyles.warningText}>
          <strong>Didn&apos;t make this change?</strong> If you didn&apos;t change your password, please contact our support team immediately to secure your account.
        </Text>
      </Section>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

