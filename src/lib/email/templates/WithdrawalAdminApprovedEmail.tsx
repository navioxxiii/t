/**
 * Withdrawal Admin Approved Email Template
 * Sent when withdrawal is approved by admin (awaiting super admin)
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

interface WithdrawalAdminApprovedEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
}

export function WithdrawalAdminApprovedEmail({
  recipientName,
  amount,
  coinSymbol,
  address,
}: WithdrawalAdminApprovedEmailProps) {
  return (
    <BaseEmail
      preview={`Withdrawal in final review: ${amount} ${coinSymbol}`}
    >
      <Eyebrow>Withdrawal</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your withdrawal is in final review
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName}, the first approval is complete. A second authorised
        signer needs to sign off before funds leave the vault — this usually
        takes a few hours.
      </Text>

      <Divider />

      <SectionLabel>Request</SectionLabel>
      <DetailRow label="Amount" value={`${amount} ${coinSymbol}`} />
      <DetailRow label="Destination" value={address} mono />
      <DetailRow label="Status" value="Awaiting final approval" />

      <Divider />

      <CTAGroup caption="We'll email you again the moment funds are sent.">
        <EmailButton href={getActivityUrl()}>View status</EmailButton>
      </CTAGroup>

      <SecurityNote title="Two signatures for every withdrawal">
        Tano requires two independent approvals on every outbound transaction.
        It adds a few hours, but it&apos;s the single biggest reason no
        customer has ever lost funds to a compromised key on our side.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
