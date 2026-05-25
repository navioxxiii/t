/**
 * Copy Trade Stopped Email Template
 * Sent when user stops copying a trader
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

interface CopyTradeStoppedEmailProps {
  recipientName: string;
  traderName: string;
  allocation: number;
  profit: number;
  traderFee: number;
  totalReceived: number;
}

export function CopyTradeStoppedEmail({
  recipientName,
  traderName,
  allocation,
  profit,
  traderFee,
  totalReceived,
}: CopyTradeStoppedEmailProps) {
  const feeCharged = profit * (traderFee / 100);

  return (
    <BaseEmail preview={`Copy trading stopped: ${traderName}`}>
      <Eyebrow>Copy Trading</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        You stopped copying {traderName}
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — your position has been closed and your funds are
        back in your wallet, including any profits and minus the performance
        fee.
      </Text>

      <Divider />

      <SectionLabel>Position summary</SectionLabel>
      <DetailRow label="Trader" value={traderName} />
      <DetailRow
        label="Initial allocation"
        value={`${allocation.toFixed(2)} USDT`}
      />
      <DetailRow label="Total profit" value={`${profit.toFixed(2)} USDT`} />
      <DetailRow
        label={`Performance fee (${traderFee.toFixed(2)}%)`}
        value={`${feeCharged.toFixed(2)} USDT`}
      />
      <DetailRow
        label="Total received"
        value={`${totalReceived.toFixed(2)} USDT`}
      />

      <Divider />

      <CTAGroup caption="Funds are available immediately for trading or withdrawal.">
        <EmailButton href={getCopyTradeUrl()}>View portfolio</EmailButton>
      </CTAGroup>

      <SecurityNote title="Need a record for tax purposes?">
        A full transaction history is available in your activity page. Export
        it as CSV any time from the dashboard.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
