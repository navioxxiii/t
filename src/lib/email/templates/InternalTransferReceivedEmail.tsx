/**
 * Internal Transfer Received Email Template
 * Sent when user receives an internal transfer
 */

import { Heading, Text } from '@react-email/components';
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
import { getActivityUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface InternalTransferReceivedEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  senderEmail: string;
  senderName: string;
}

export function InternalTransferReceivedEmail({
  recipientName,
  amount,
  coinSymbol,
  senderEmail,
  senderName,
}: InternalTransferReceivedEmailProps) {
  return (
    <BaseEmail
      preview={`You received ${amount} ${coinSymbol} from ${senderName}`}
    >
      <Eyebrow>Transfer Received</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        You received {amount} {coinSymbol}
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — {senderName} sent you funds inside Tano. They
        landed in your wallet instantly.
      </Text>

      <Divider />

      <SectionLabel>Transfer</SectionLabel>
      <DetailRow label="Amount" value={`${amount} ${coinSymbol}`} />
      <DetailRow label="From" value={`${senderName} (${senderEmail})`} />
      <DetailRow label="Type" value="Internal transfer" />

      <Divider />

      <CTAGroup caption="Internal transfers are free and instant.">
        <EmailButton href={getActivityUrl()}>View activity</EmailButton>
      </CTAGroup>

      <SecurityNote title="Don't recognise the sender?">
        Internal transfers are reversible only by the sender. If you weren&apos;t
        expecting this, contact support before moving the funds.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
