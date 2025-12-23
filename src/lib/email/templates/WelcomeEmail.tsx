/**
 * Welcome Email Template
 * Sent after email verification is complete
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  getDashboardUrl,
  getAppName,
  getTeamName,
  getSupportMessage,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface WelcomeEmailProps {
  recipientName: string;
}

export function WelcomeEmail({ recipientName }: WelcomeEmailProps) {
  const appName = getAppName();

  return (
    <BaseEmail preview={`Welcome to ${appName}! Your account is now fully active.`}>
      <Heading style={emailStyles.heading}>Welcome to {appName}! 🎉</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Your email has been verified and your account is now fully active. You&apos;re all set to start using {appName}!
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoTitle}>What you can do now:</Text>
        <Text style={emailStyles.infoText}>
          • Deposit cryptocurrencies
          <br />
          • Send and receive payments
          <br />
          • Swap between different coins
          <br />
          • Track your portfolio
          <br />
          • Earn passive income
          <br />
          • Copy trade with top traders
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getDashboardUrl()}>Go to Dashboard</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

