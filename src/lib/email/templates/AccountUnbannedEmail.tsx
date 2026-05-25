/**
 * Account Unbanned Email Template
 * Sent when user account suspension is lifted
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  SecurityNote,
  CTAGroup,
} from './components/EmailPrimitives';
import { getDashboardUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface AccountUnbannedEmailProps {
  recipientName: string;
}

export function AccountUnbannedEmail({ recipientName }: AccountUnbannedEmailProps) {
  return (
    <BaseEmail preview="Your account access has been restored">
      <Eyebrow>Account</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your account access has been restored
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — your suspension has been lifted. You can now sign
        in and use your account as usual.
      </Text>

      <Divider />

      <SectionLabel>What's available again</SectionLabel>
      <Text style={emailStyles.text}>
        • Full access to your dashboard and settings
        <br />
        • Deposits, withdrawals, and swaps
        <br />
        • Copy trading and earn positions
      </Text>

      <Divider />

      <CTAGroup caption="Thank you for your patience while we reviewed your account.">
        <EmailButton href={getDashboardUrl()}>Go to dashboard</EmailButton>
      </CTAGroup>

      <SecurityNote title="A good time to refresh your security">
        Consider enabling two-factor authentication and rotating your
        transaction PIN. Tano will never ask for these details by email,
        phone, or chat.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
