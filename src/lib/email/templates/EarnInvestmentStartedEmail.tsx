/**
 * Earn Investment Started Email Template
 * Sent when user starts an earn investment
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
import { getEarnUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface EarnInvestmentStartedEmailProps {
  recipientName: string;
  vaultTitle: string;
  investmentAmount: number;
  apyPercent: number;
  durationMonths: number;
  totalProfit: number;
  matureDate: string;
}

export function EarnInvestmentStartedEmail({
  recipientName,
  vaultTitle,
  investmentAmount,
  apyPercent,
  durationMonths,
  totalProfit,
  matureDate,
}: EarnInvestmentStartedEmailProps) {
  const matureLabel = new Date(matureDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <BaseEmail preview={`Earn started: ${vaultTitle}`}>
      <Eyebrow>Earn</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your {vaultTitle} position is live
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — your funds are locked in the vault and accruing
        yield daily. You&apos;ll be able to claim your principal plus earned
        profit on the maturity date below.
      </Text>

      <Divider />

      <SectionLabel>Investment</SectionLabel>
      <DetailRow label="Vault" value={vaultTitle} />
      <DetailRow
        label="Investment"
        value={`${investmentAmount.toFixed(2)} USDT`}
      />
      <DetailRow label="APY" value={`${apyPercent}%`} />
      <DetailRow
        label="Duration"
        value={`${durationMonths} ${durationMonths === 1 ? 'month' : 'months'}`}
      />
      <DetailRow
        label="Expected profit"
        value={`${totalProfit.toFixed(2)} USDT`}
      />
      <DetailRow label="Matures on" value={matureLabel} />

      <Divider />

      <CTAGroup caption="Track daily accrual in real time from your dashboard.">
        <EmailButton href={getEarnUrl()}>View position</EmailButton>
      </CTAGroup>

      <SecurityNote title="About early exits">
        Funds are locked until maturity. Early withdrawals, where supported,
        forfeit accrued yield. Always review the vault terms before adding
        more capital.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
