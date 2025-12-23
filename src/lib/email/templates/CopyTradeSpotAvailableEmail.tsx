/**
 * Copy Trade Spot Available Email Template
 * Sent when a spot becomes available on the waitlist
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface CopyTradeSpotAvailableEmailProps {
  recipientName: string;
  traderName: string;
  strategy: string;
  roiMin: number;
  roiMax: number;
  performanceFee: number;
  riskLevel: string;
  claimUrl: string;
  expiryHours?: number;
}

export function CopyTradeSpotAvailableEmail({
  recipientName,
  traderName,
  strategy,
  roiMin,
  roiMax,
  performanceFee,
  riskLevel,
  claimUrl,
  expiryHours = 24,
}: CopyTradeSpotAvailableEmailProps) {
  return (
    <BaseEmail preview={`Your spot is ready - ${traderName} | Copy Trading`}>
      <Heading style={emailStyles.heading}>Good News! Your Spot is Ready 🎉</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        A spot has opened up for <strong>{traderName}</strong>! You&apos;re next in line to start copying this trader.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoTitle}>{traderName}</Text>
        <Text style={emailStyles.infoText}>
          <strong>Strategy:</strong> {strategy}
          <br />
          <strong>Monthly ROI:</strong> {roiMin}% - {roiMax}%
          <br />
          <strong>Performance Fee:</strong> {performanceFee}%
          <br />
          <strong>Risk Level:</strong> {riskLevel}
        </Text>
      </Section>

      <Section style={emailStyles.warningBox}>
        <Text style={emailStyles.warningText}>
          <strong>⏰ You have {expiryHours} hours to claim this spot.</strong>
          <br />
          If you don&apos;t claim within {expiryHours} hours, this spot will be offered to the next person in line.
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={claimUrl}>Claim Your Spot</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        Don&apos;t miss this opportunity! Click the button above to claim your spot and start copying {traderName}.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1f2937',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
  marginBottom: '16px',
};

const infoBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0c4a6e',
  marginBottom: '12px',
};

const infoText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#075985',
  margin: '4px 0',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const warningText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#78350f',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const signature = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
  marginTop: '32px',
};
