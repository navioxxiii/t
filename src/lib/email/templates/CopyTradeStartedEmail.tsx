/**
 * Copy Trade Started Email Template
 * Sent when user starts copying a trader
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getCopyTradeUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface CopyTradeStartedEmailProps {
  recipientName: string;
  traderName: string;
  allocationAmount: number;
  dailyPnlRate: number;
}

export function CopyTradeStartedEmail({
  recipientName,
  traderName,
  allocationAmount,
  dailyPnlRate,
}: CopyTradeStartedEmailProps) {
  return (
    <BaseEmail preview={`Copy trading started: ${traderName}`}>
      <Heading style={emailStyles.heading}>Copy Trading Started! 🚀</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Great news! You&apos;ve successfully started copying <strong>{traderName}</strong>. Your funds are now allocated and you&apos;ll start earning based on the trader&apos;s performance.
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
          <strong>How it works:</strong>
          <br />
          • Your funds will automatically follow the trader&apos;s positions
          <br />
          • You&apos;ll earn profits based on the trader&apos;s performance
          <br />
          • You can stop copying at any time
          <br />
          • Performance fees apply when you stop
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getCopyTradeUrl()}>View Position</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        Track your position performance in real-time from your dashboard. Good luck with your copy trading journey!
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
