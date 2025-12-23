/**
 * Internal Transfer Received Email Template
 * Sent when user receives an internal transfer
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getActivityUrl, getAppName, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface InternalTransferReceivedEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  senderEmail: string;
  senderName: string;
}

export function InternalTransferReceivedEmail({
  recipientName,
  amount,
  coinSymbol,
  senderEmail,
  senderName,
}: InternalTransferReceivedEmailProps) {
  const appName = getAppName();

  return (
    <BaseEmail preview={`You received ${amount} ${coinSymbol} from ${senderName}`}>
      <Heading style={emailStyles.heading}>You Received Funds! 💰</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        You&apos;ve received a transfer from <strong>{senderName}</strong> ({senderEmail}).
      </Text>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successTitle}>Transfer Details:</Text>
        <Text style={emailStyles.successText}>
          <strong>Amount:</strong> {amount} {coinSymbol}
          <br />
          <strong>From:</strong> {senderName} ({senderEmail})
          <br />
          <strong>Type:</strong> Internal Transfer
        </Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          ✅ Your funds have been credited to your wallet and are now available for use.
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getActivityUrl()}>View Transaction</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        You can now use these funds for trading, investing, or withdrawals. Thank you for using {appName}!
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
