/**
 * Withdrawal Approval Email Template
 * Sent when a withdrawal is approved and sent
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
import {
  getActivityUrl,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface WithdrawalApprovalEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
  txHash?: string;
}

export function WithdrawalApprovalEmail({
  recipientName,
  amount,
  coinSymbol,
  address,
  txHash,
}: WithdrawalApprovalEmailProps) {
  return (
    <BaseEmail preview={`Withdrawal sent: ${amount} ${coinSymbol}`}>
      <Eyebrow>Withdrawal</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your withdrawal is on its way
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName}, we&apos;ve sent your withdrawal. Confirmation time
        depends on the network — most settle within a few minutes.
      </Text>

      <Divider />

      <SectionLabel>Transaction</SectionLabel>
      <DetailRow label="Amount" value={`${amount} ${coinSymbol}`} />
      <DetailRow label="Destination" value={address} mono />
      {txHash && <DetailRow label="Transaction hash" value={txHash} mono />}

      <Divider />

      <CTAGroup caption="Verify on a blockchain explorer using the hash above.">
        <EmailButton href={getActivityUrl()}>View transaction</EmailButton>
      </CTAGroup>

      <SecurityNote title="Didn't make this withdrawal?">
        Contact our support team immediately. Tano will never ask you to send
        crypto to recover an unauthorized transaction — anyone who does is
        attempting fraud.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
