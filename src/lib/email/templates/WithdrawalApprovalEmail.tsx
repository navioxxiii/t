/**
 * Withdrawal Approval Email Template
 * Sent when a withdrawal is approved and sent
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getActivityUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface WithdrawalApprovalEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
  txHash?: string;
}

export function WithdrawalApprovalEmail({
  recipientName,
  amount,
  coinSymbol,
  address,
  txHash,
}: WithdrawalApprovalEmailProps) {
  return (
    <BaseEmail preview={`Withdrawal approved: ${amount} ${coinSymbol}`}>
      <Heading style={emailStyles.heading}>Withdrawal Approved ✅</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Good news! Your withdrawal request has been approved and processed successfully.
      </Text>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successTitle}>Withdrawal Details:</Text>
        <Text style={emailStyles.successText}>
          <strong>Amount:</strong> {amount} {coinSymbol}
          <br />
          <strong>To Address:</strong> {address}
          {txHash && (
            <>
              <br />
              <strong>Transaction Hash:</strong> {txHash}
            </>
          )}
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getActivityUrl()}>View Transaction</EmailButton>
      </div>

      <Section style={emailStyles.warningBox}>
        <Text style={emailStyles.warningText}>
          <strong>Important:</strong> Please verify the transaction on the blockchain. If you notice any issues, contact our support team immediately.
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

