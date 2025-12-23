/**
 * Withdrawal Rejection Email Template
 * Sent when a withdrawal request is rejected
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getSupportUrl, getDashboardUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface WithdrawalRejectionEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
  rejectionReason: string;
}

export function WithdrawalRejectionEmail({
  recipientName,
  amount,
  coinSymbol,
  address,
  rejectionReason,
}: WithdrawalRejectionEmailProps) {
  return (
    <BaseEmail preview={`Withdrawal rejected: ${amount} ${coinSymbol}`}>
      <Heading style={emailStyles.heading}>Withdrawal Request Rejected</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        We regret to inform you that your withdrawal request has been rejected. Your funds have been returned to your wallet balance.
      </Text>

      <Section style={emailStyles.neutralBox}>
        <Text style={emailStyles.neutralTitle}>Withdrawal Details:</Text>
        <Text style={emailStyles.neutralText}>
          <strong>Amount:</strong> {amount} {coinSymbol}
          <br />
          <strong>To Address:</strong> {address}
        </Text>
      </Section>

      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorTitle}>Rejection Reason:</Text>
        <Text style={emailStyles.errorText}>{rejectionReason}</Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getSupportUrl()}>Contact Support</EmailButton>
        <div style={{ marginTop: '12px' }}>
          <EmailButton href={getDashboardUrl()} variant="secondary">
            Go to Dashboard
          </EmailButton>
        </div>
      </div>

      <Text style={emailStyles.text}>
        If you have questions about this decision or need assistance, {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

