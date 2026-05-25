/**
 * Swap Completion Email Template
 * Sent when a swap transaction is completed
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

interface SwapCompletionEmailProps {
  recipientName: string;
  fromCoin: string;
  toCoin: string;
  fromAmount: string;
  toAmount: string;
  rate?: number;
  fee?: string;
}

export function SwapCompletionEmail({
  recipientName,
  fromCoin,
  toCoin,
  fromAmount,
  toAmount,
  rate,
  fee,
}: SwapCompletionEmailProps) {
  return (
    <BaseEmail
      preview={`Swap settled: ${fromAmount} ${fromCoin} → ${toAmount} ${toCoin}`}
    >
      <Eyebrow>Swap</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your swap has settled
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — the swap has executed and the new balance is
        already in your wallet.
      </Text>

      <Divider />

      <SectionLabel>Swap details</SectionLabel>
      <DetailRow label="You sent" value={`${fromAmount} ${fromCoin}`} />
      <DetailRow label="You received" value={`${toAmount} ${toCoin}`} />
      {rate && (
        <DetailRow
          label="Exchange rate"
          value={`1 ${fromCoin} = ${rate.toFixed(8)} ${toCoin}`}
        />
      )}
      {fee && <DetailRow label="Network fee" value={`${fee} ${fromCoin}`} />}

      <Divider />

      <CTAGroup caption="Rates are locked at execution time and don't change post-trade.">
        <EmailButton href={getDashboardUrl()}>View activity</EmailButton>
      </CTAGroup>

      <SecurityNote title="Didn't make this swap?">
        Contact our support team immediately. We&apos;ll freeze your account
        and investigate before any further transactions can run.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
