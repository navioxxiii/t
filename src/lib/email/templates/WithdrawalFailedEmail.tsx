/**
 * Withdrawal Failed Email Template
 * Sent when a withdrawal fails to process
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getSupportUrl, getActivityUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface WithdrawalFailedEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  errorMessage: string;
  supportUrl?: string;
}

export function WithdrawalFailedEmail({
  recipientName,
  amount,
  coinSymbol,
  errorMessage,
  supportUrl,
}: WithdrawalFailedEmailProps) {
  return (
    <BaseEmail preview={`Withdrawal failed: ${amount} ${coinSymbol}`}>
      <Heading style={{ ...emailStyles.heading, color: '#dc2626' }}>Withdrawal Processing Failed</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        We encountered an issue while processing your withdrawal request. Your funds have been returned to your wallet balance and are safe.
      </Text>

      <Section style={emailStyles.neutralBox}>
        <Text style={emailStyles.neutralTitle}>Withdrawal Details:</Text>
        <Text style={emailStyles.neutralText}>
          <strong>Amount:</strong> {amount} {coinSymbol}
          <br />
          <strong>Status:</strong> Failed
        </Text>
      </Section>

      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorTitle}>Error Details:</Text>
        <Text style={emailStyles.errorText}>{errorMessage}</Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          <strong>What this means:</strong>
          <br />
          • Your funds are safe and have been returned to your wallet
          <br />
          • You can try the withdrawal again
          <br />
          • If the issue persists, please contact support
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={supportUrl || getSupportUrl()}>Contact Support</EmailButton>
        <div style={{ marginTop: '12px' }}>
          <EmailButton href={getActivityUrl()} variant="secondary">
            View Transaction
          </EmailButton>
        </div>
      </div>

      <Text style={emailStyles.text}>
        We apologize for the inconvenience. Our team is working to resolve this issue. {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
