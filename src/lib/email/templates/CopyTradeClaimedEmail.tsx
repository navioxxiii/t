/**
 * Copy Trade Claimed Email Template
 * Sent when user claims a spot from waitlist and starts copying
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getCopyTradeUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface CopyTradeClaimedEmailProps {
  recipientName: string;
  traderName: string;
  allocationAmount: number;
  dailyPnlRate: number;
}

export function CopyTradeClaimedEmail({
  recipientName,
  traderName,
  allocationAmount,
  dailyPnlRate,
}: CopyTradeClaimedEmailProps) {
  return (
    <BaseEmail preview={`Spot claimed: ${traderName} | Copy Trading`}>
      <Heading style={emailStyles.heading}>Spot Claimed Successfully! 🎉</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Congratulations! You&apos;ve successfully claimed your spot and started copying <strong>{traderName}</strong>. Your funds are now allocated and you&apos;ll start earning based on the trader&apos;s performance.
      </Text>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successTitle}>Position Details:</Text>
        <Text style={emailStyles.successText}>
          <strong>Trader:</strong> {traderName}
          <br />
          <strong>Allocation:</strong> {allocationAmount.toFixed(2)} USDT
          <br />
          <strong>Estimated Daily P&L:</strong> {dailyPnlRate.toFixed(4)} USDT
        </Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          <strong>What happens next:</strong>
          <br />
          • Your funds will automatically follow the trader&apos;s positions
          <br />
          • You&apos;ll earn profits based on the trader&apos;s performance
          <br />
          • Track your position in real-time from your dashboard
          <br />
          • You can stop copying at any time
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getCopyTradeUrl()}>View Position</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        Thank you for your patience on the waitlist! We hope you enjoy your copy trading experience with {traderName}.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
