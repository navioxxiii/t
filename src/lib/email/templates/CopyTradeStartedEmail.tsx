/**
 * Copy Trade Started Email Template
 * Sent when user starts copying a trader
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

interface CopyTradeStartedEmailProps {
  recipientName: string;
  traderName: string;
  allocationAmount: number;
  dailyPnlRate: number;
}

export function CopyTradeStartedEmail({
  recipientName,
  traderName,
  allocationAmount,
  dailyPnlRate,
}: CopyTradeStartedEmailProps) {
  return (
    <BaseEmail preview={`Copy trading started: ${traderName}`}>
      <Eyebrow>Copy Trading</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        You started copying {traderName}
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — your allocation is now mirroring {traderName}
        &apos;s positions automatically. P&L updates appear on your dashboard
        in real time.
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

      <CTAGroup caption="You can stop copying at any time. Performance fees apply on profits when you do.">
        <EmailButton href={getCopyTradeUrl()}>View position</EmailButton>
      </CTAGroup>

      <SecurityNote title="A note on risk">
        Past performance doesn&apos;t guarantee future results. Only allocate
        what you&apos;re comfortable having at risk.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
