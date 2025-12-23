/**
 * Earn Claim Completed Email Template
 * Sent when user claims their earn investment
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getEarnUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface EarnClaimCompletedEmailProps {
  recipientName: string;
  vaultTitle: string;
  principal: number;
  profit: number;
  totalPayout: number;
}

export function EarnClaimCompletedEmail({
  recipientName,
  vaultTitle,
  principal,
  profit,
  totalPayout,
}: EarnClaimCompletedEmailProps) {
  return (
    <BaseEmail preview={`Earn claim completed: ${totalPayout.toFixed(2)} USDT`}>
      <Heading style={emailStyles.heading}>Earn Investment Claimed! 🎉</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Congratulations! Your earn investment in <strong>{vaultTitle}</strong> has matured and your funds have been successfully claimed.
      </Text>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successTitle}>Payout Summary:</Text>
        <Text style={emailStyles.successText}>
          <strong>Vault:</strong> {vaultTitle}
          <br />
          <strong>Principal:</strong> {principal.toFixed(2)} USDT
          <br />
          <strong>Profit Earned:</strong> {profit.toFixed(2)} USDT
          <br />
          <strong>Total Payout:</strong> {totalPayout.toFixed(2)} USDT
        </Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          ✅ Your funds have been credited to your wallet. You can now use them for new investments, withdrawals, or other transactions.
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getEarnUrl()}>View Portfolio</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        Thank you for using our earn feature! We hope you enjoyed earning passive income. You can start a new investment anytime.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
