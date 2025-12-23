/**
 * Deposit Confirmation Email Template
 * Sent when a deposit is received and confirmed
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getDashboardUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface DepositConfirmationEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  txHash?: string;
  newBalance?: string;
}

export function DepositConfirmationEmail({
  recipientName,
  amount,
  coinSymbol,
  txHash,
  newBalance,
}: DepositConfirmationEmailProps) {
  return (
    <BaseEmail preview={`Deposit received: ${amount} ${coinSymbol}`}>
      <Heading style={emailStyles.heading}>Deposit Received ✅</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Great news! Your deposit has been successfully received and confirmed.
      </Text>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successTitle}>Deposit Details:</Text>
        <Text style={emailStyles.successText}>
          <strong>Amount:</strong> {amount} {coinSymbol}
          {newBalance && (
            <>
              <br />
              <strong>New Balance:</strong> {newBalance} {coinSymbol}
            </>
          )}
          {txHash && (
            <>
              <br />
              <strong>Transaction Hash:</strong> {txHash}
            </>
          )}
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getDashboardUrl()}>View Transaction</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        Your funds are now available in your wallet. {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
