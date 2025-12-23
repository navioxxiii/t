/**
 * PIN Changed Email Template
 * Sent when user changes their transaction PIN
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getSupportUrl, getSecurityUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface PinChangedEmailProps {
  recipientName: string;
  timestamp?: string;
}

export function PinChangedEmail({
  recipientName,
  timestamp,
}: PinChangedEmailProps) {
  return (
    <BaseEmail preview="Your transaction PIN has been changed">
      <Heading style={emailStyles.heading}>PIN Changed Successfully</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        This is a confirmation that your transaction PIN has been successfully changed.
        {timestamp && ` The change was made on ${new Date(timestamp).toLocaleString()}.`}
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          <strong>Security Tips:</strong>
          <br />
          • Never share your PIN with anyone
          <br />
          • Don&apos;t use easily guessable PINs (like 1234)
          <br />
          • Your PIN is required for all transactions
          <br />
          • If you didn&apos;t make this change, contact support immediately
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getSecurityUrl()}>Security Settings</EmailButton>
      </div>

      <Section style={emailStyles.warningBox}>
        <Text style={emailStyles.warningText}>
          <strong>Didn&apos;t make this change?</strong> If you didn&apos;t change your PIN, please contact our support team immediately to secure your account.
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

