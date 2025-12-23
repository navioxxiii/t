/**
 * Account Unbanned Email Template
 * Sent when user account is unbanned
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getDashboardUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface AccountUnbannedEmailProps {
  recipientName: string;
}

export function AccountUnbannedEmail({ recipientName }: AccountUnbannedEmailProps) {
  return (
    <BaseEmail preview="Your account access has been restored">
      <Heading style={emailStyles.heading}>Account Access Restored ✅</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Great news! Your account suspension has been lifted and your account access has been fully restored.
      </Text>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successText}>
          <strong>Your account is now active:</strong>
          <br />
          • You can access all features
          <br />
          • All your funds are available
          <br />
          • You can make transactions again
          <br />
          • Thank you for your patience
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getDashboardUrl()}>Go to Dashboard</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        We appreciate your understanding during this time. {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
