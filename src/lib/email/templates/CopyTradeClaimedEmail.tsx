/**
 * Copy Trade Claimed Email Template
 * Sent when user claims a spot from waitlist and starts copying
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
import { getCopyTradeUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface CopyTradeClaimedEmailProps {
  recipientName: string;
  traderName: string;
  allocationAmount: number;
  dailyPnlRate: number;
}

export function CopyTradeClaimedEmail({
  recipientName,
  traderName,
  allocationAmount,
  dailyPnlRate,
}: CopyTradeClaimedEmailProps) {
  return (
    <BaseEmail preview={`You're now copying ${traderName}`}>
      <Eyebrow>Copy Trading</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        You're now copying {traderName}
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — your spot has been confirmed and your allocation
        is now mirroring {traderName}&apos;s positions in real time.
      </Text>

      <Divider />

      <SectionLabel>Position</SectionLabel>
      <DetailRow label="Trader" value={traderName} />
      <DetailRow
        label="Allocation"
        value={`${allocationAmount.toFixed(2)} USDT`}
      />
      <DetailRow
        label="Estimated daily P&L"
        value={`${dailyPnlRate.toFixed(4)} USDT`}
      />

      <Divider />

      <CTAGroup caption="You can stop copying at any time from your dashboard.">
        <EmailButton href={getCopyTradeUrl()}>View position</EmailButton>
      </CTAGroup>

      <SecurityNote title="A note on copy trading">
        Past performance doesn&apos;t guarantee future results. Allocations
        rise and fall with the trader&apos;s positions. Only allocate what
        you&apos;re comfortable having at risk.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
