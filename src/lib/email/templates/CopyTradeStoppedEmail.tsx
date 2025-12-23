/**
 * Copy Trade Stopped Email Template
 * Sent when user stops copying a trader
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getCopyTradeUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface CopyTradeStoppedEmailProps {
  recipientName: string;
  traderName: string;
  allocation: number;
  profit: number;
  traderFee: number;
  totalReceived: number;
}

export function CopyTradeStoppedEmail({
  recipientName,
  traderName,
  allocation,
  profit,
  traderFee,
  totalReceived,
}: CopyTradeStoppedEmailProps) {
  return (
    <BaseEmail preview={`Copy trading stopped: ${traderName}`}>
      <Heading style={emailStyles.heading}>Copy Trading Stopped</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Your copy trading position with <strong>{traderName}</strong> has been stopped. Your funds have been returned to your wallet along with your profits.
      </Text>

      <Section style={emailStyles.neutralBox}>
        <Text style={emailStyles.neutralTitle}>Position Summary:</Text>
        <Text style={emailStyles.neutralText}>
          <strong>Trader:</strong> {traderName}
          <br />
          <strong>Initial Allocation:</strong> {allocation.toFixed(2)} USDT
          <br />
          <strong>Total Profit:</strong> {profit.toFixed(2)} USDT
          <br />
          <strong>Performance Fee ({traderFee.toFixed(2)}%):</strong> {(profit * (traderFee / 100)).toFixed(2)} USDT
          <br />
          <strong>Total Received:</strong> {totalReceived.toFixed(2)} USDT
        </Text>
      </Section>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successText}>
          ✅ Your funds have been credited to your wallet. You can now use them for new investments or withdrawals.
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getCopyTradeUrl()}>View Portfolio</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        Thank you for using our copy trading feature! We hope you had a profitable experience. You can start copying other traders anytime.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
