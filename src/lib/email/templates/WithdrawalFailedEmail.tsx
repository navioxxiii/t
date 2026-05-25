/**
 * Withdrawal Failed Email Template
 * Sent when a withdrawal fails to process
 */

import { Heading, Section, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  SecurityNote,
  DetailRow,
  CTAGroup,
} from './components/EmailPrimitives';
import {
  getSupportUrl,
  getActivityUrl,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';
import { branding } from '@/config/branding';

interface WithdrawalFailedEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  errorMessage: string;
  supportUrl?: string;
}

export function WithdrawalFailedEmail({
  recipientName,
  amount,
  coinSymbol,
  errorMessage,
  supportUrl,
}: WithdrawalFailedEmailProps) {
  return (
    <BaseEmail preview={`Withdrawal couldn't be completed: ${amount} ${coinSymbol}`}>
      <Eyebrow>Withdrawal</Eyebrow>
      <Heading
        style={{ ...emailStyles.heading, color: branding.email.colors.error }}
        className="tw-h1"
      >
        Withdrawal couldn&apos;t be completed
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — we hit an issue while processing this transaction.
        Your funds never left the vault and are back in your wallet balance
        right now.
      </Text>

      <Divider />

      <SectionLabel>Request</SectionLabel>
      <DetailRow label="Amount" value={`${amount} ${coinSymbol}`} />
      <DetailRow label="Status" value="Failed — funds returned" />

      <div style={{ height: 28 }} />

      <SectionLabel>What went wrong</SectionLabel>
      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorText}>{errorMessage}</Text>
      </Section>

      <SectionLabel>Next steps</SectionLabel>
      <Text style={emailStyles.text}>
        • Your balance is fully restored and available to use.
        <br />
        • You can retry the withdrawal from your activity page.
        <br />
        • If the same error happens again, our support team can investigate.
      </Text>

      <Divider />

      <CTAGroup>
        <EmailButton href={supportUrl || getSupportUrl()}>
          Contact support
        </EmailButton>
        <div style={{ marginTop: 12 }}>
          <EmailButton href={getActivityUrl()} variant="secondary">
            View activity
          </EmailButton>
        </div>
      </CTAGroup>

      <SecurityNote title="Your funds are safe">
        Tano holds customer balances in segregated vaults. A failed transaction
        is reversed at the protocol level — funds are returned before this
        email is sent, never held in limbo.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
