/**
 * Deposit Confirmation Email Template
 * Sent when a deposit is received and confirmed
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
import { getDashboardUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface DepositConfirmationEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  txHash?: string;
  newBalance?: string;
}

export function DepositConfirmationEmail({
  recipientName,
  amount,
  coinSymbol,
  txHash,
  newBalance,
}: DepositConfirmationEmailProps) {
  return (
    <BaseEmail preview={`Deposit received: ${amount} ${coinSymbol}`}>
      <Eyebrow>Deposit</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your deposit has landed
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — the transaction was confirmed on-chain and your
        balance has been credited.
      </Text>

      <Divider />

      <SectionLabel>Transaction</SectionLabel>
      <DetailRow label="Amount" value={`${amount} ${coinSymbol}`} />
      {newBalance && (
        <DetailRow
          label="New balance"
          value={`${newBalance} ${coinSymbol}`}
        />
      )}
      {txHash && <DetailRow label="Transaction hash" value={txHash} mono />}

      <Divider />

      <CTAGroup caption="Funds are available immediately for trading, swaps, or withdrawals.">
        <EmailButton href={getDashboardUrl()}>View activity</EmailButton>
      </CTAGroup>

      <SecurityNote title="Didn't make this deposit?">
        If you don&apos;t recognise this transaction, contact our support team
        right away so we can investigate.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
