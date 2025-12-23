/**
 * Account Banned Email Template
 * Sent when user account is banned
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getSupportUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface AccountBannedEmailProps {
  recipientName: string;
  reason: string;
  supportUrl?: string;
  bannedAt?: string;
}

export function AccountBannedEmail({
  recipientName,
  reason,
  supportUrl,
  bannedAt,
}: AccountBannedEmailProps) {
  return (
    <BaseEmail preview="Your account has been suspended">
      <Heading style={{ ...emailStyles.heading, color: '#dc2626' }}>Account Suspended</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        We regret to inform you that your account has been temporarily suspended. This action was taken in accordance with our Terms of Service.
      </Text>

      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorTitle}>Reason for Suspension:</Text>
        <Text style={emailStyles.errorText}>{reason}</Text>
        {bannedAt && (
          <Text style={emailStyles.errorText}>
            <br />
            <strong>Suspended on:</strong> {new Date(bannedAt).toLocaleString()}
          </Text>
        )}
      </Section>

      <Section style={emailStyles.neutralBox}>
        <Text style={emailStyles.neutralText}>
          <strong>What this means:</strong>
          <br />
          • You cannot access your account or make transactions
          <br />
          • Your funds remain secure in your account
          <br />
          • You can contact support to discuss your account status
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={supportUrl || getSupportUrl()}>Contact Support</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        If you believe this is an error or would like to appeal this decision, {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
