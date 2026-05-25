/**
 * Welcome Email Template
 * Sent after email verification is complete
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
import { branding } from '@/config/branding';
import {
  getDashboardUrl,
  getAppName,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface WelcomeEmailProps {
  recipientName: string;
}

const capabilities = [
  'Deposit and withdraw across major chains',
  'Send and receive payments instantly',
  'Swap between supported assets',
  'Track your portfolio in one place',
  'Earn passive income on idle balances',
  'Copy strategies from top traders',
];

export function WelcomeEmail({ recipientName }: WelcomeEmailProps) {
  const appName = getAppName();

  return (
    <BaseEmail preview={`Welcome to ${appName} — your vault is ready.`}>
      <Eyebrow>Welcome to {appName}</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your vault is ready, {recipientName}
      </Heading>

      <Text style={emailStyles.text}>
        Your account is verified and fully active. Here&apos;s what you can do
        right away.
      </Text>

      <Divider />

      <SectionLabel>What you can do now</SectionLabel>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        style={{ borderCollapse: 'collapse' }}
      >
        <tbody>
          {capabilities.map((item) => (
            <tr key={item}>
              <td
                width={20}
                valign="top"
                style={{
                  padding: '6px 12px 6px 0',
                  color: branding.email.colors.primary,
                  fontWeight: 700,
                  fontSize: 15,
                  lineHeight: '24px',
                }}
              >
                ✓
              </td>
              <td
                valign="top"
                style={{
                  padding: '6px 0',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontSize: 15,
                  lineHeight: '24px',
                  color: branding.email.colors.text,
                }}
              >
                {item}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Divider />

      <CTAGroup caption="Bookmark the dashboard for quick access.">
        <EmailButton href={getDashboardUrl()}>Open your dashboard</EmailButton>
      </CTAGroup>

      <SecurityNote title="Stay secure">
        Enable two-factor authentication, set a strong transaction PIN, and
        never share your recovery details. Tano will never ask for your PIN,
        password, or seed phrase — not by email, phone, or chat.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
