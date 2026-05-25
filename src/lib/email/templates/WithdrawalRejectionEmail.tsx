/**
 * Withdrawal Rejection Email Template
 * Sent when a withdrawal request is rejected
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
  getDashboardUrl,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface WithdrawalRejectionEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
  rejectionReason: string;
}

export function WithdrawalRejectionEmail({
  recipientName,
  amount,
  coinSymbol,
  address,
  rejectionReason,
}: WithdrawalRejectionEmailProps) {
  return (
    <BaseEmail preview={`Withdrawal not processed: ${amount} ${coinSymbol}`}>
      <Eyebrow>Withdrawal</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        We couldn&apos;t process this withdrawal
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — your withdrawal request was reviewed and not
        approved. Your funds have been returned to your wallet balance and are
        available immediately.
      </Text>

      <Divider />

      <SectionLabel>Request</SectionLabel>
      <DetailRow label="Amount" value={`${amount} ${coinSymbol}`} />
      <DetailRow label="Destination" value={address} mono />

      <div style={{ height: 28 }} />

      <SectionLabel>Reason</SectionLabel>
      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorText}>{rejectionReason}</Text>
      </Section>

      <Divider />

      <CTAGroup caption="Our compliance team can clarify the decision if needed.">
        <EmailButton href={getSupportUrl()}>Contact support</EmailButton>
        <div style={{ marginTop: 12 }}>
          <EmailButton href={getDashboardUrl()} variant="secondary">
            Go to dashboard
          </EmailButton>
        </div>
      </CTAGroup>

      <SecurityNote title="Why we review every withdrawal">
        Each withdrawal is screened as part of our anti-money-laundering
        program. Reviews protect every Tano account holder and are required by
        the regulations we operate under.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
