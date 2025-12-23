/**
 * Earn Investment Started Email Template
 * Sent when user starts an earn investment
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getEarnUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface EarnInvestmentStartedEmailProps {
  recipientName: string;
  vaultTitle: string;
  investmentAmount: number;
  apyPercent: number;
  durationMonths: number;
  totalProfit: number;
  matureDate: string;
}

export function EarnInvestmentStartedEmail({
  recipientName,
  vaultTitle,
  investmentAmount,
  apyPercent,
  durationMonths,
  totalProfit,
  matureDate,
}: EarnInvestmentStartedEmailProps) {
  return (
    <BaseEmail preview={`Earn investment started: ${vaultTitle}`}>
      <Heading style={emailStyles.heading}>Earn Investment Started! 💰</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Your earn investment has been successfully started! Your funds are now locked in the <strong>{vaultTitle}</strong> vault and will start earning passive income.
      </Text>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successTitle}>Investment Details:</Text>
        <Text style={emailStyles.successText}>
          <strong>Vault:</strong> {vaultTitle}
          <br />
          <strong>Investment Amount:</strong> {investmentAmount.toFixed(2)} USDT
          <br />
          <strong>APY:</strong> {apyPercent}%
          <br />
          <strong>Duration:</strong> {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
          <br />
          <strong>Expected Profit:</strong> {totalProfit.toFixed(2)} USDT
          <br />
          <strong>Maturity Date:</strong> {new Date(matureDate).toLocaleDateString()}
        </Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          <strong>How it works:</strong>
          <br />
          • Your funds are locked until the maturity date
          <br />
          • You&apos;ll earn daily profits automatically
          <br />
          • You can claim your principal + profit after maturity
          <br />
          • Track your earnings in real-time
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getEarnUrl()}>View Position</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        Your investment is now active and earning! You can track your position and see your profits grow in real-time from your dashboard.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
