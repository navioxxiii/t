/**
 * Earn Claim Completed Email Template
 * Sent when user claims their earn investment
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

interface EarnClaimCompletedEmailProps {
  recipientName: string;
  vaultTitle: string;
  principal: number;
  profit: number;
  totalPayout: number;
}

export function EarnClaimCompletedEmail({
  recipientName,
  vaultTitle,
  principal,
  profit,
  totalPayout,
}: EarnClaimCompletedEmailProps) {
  return (
    <BaseEmail preview={`Earn payout: ${totalPayout.toFixed(2)} USDT credited`}>
      <Eyebrow>Earn</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your {vaultTitle} position has matured
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — your principal and earned profit have been
        credited to your wallet and are available immediately.
      </Text>

      <Divider />

      <SectionLabel>Payout</SectionLabel>
      <DetailRow label="Vault" value={vaultTitle} />
      <DetailRow label="Principal" value={`${principal.toFixed(2)} USDT`} />
      <DetailRow label="Profit earned" value={`${profit.toFixed(2)} USDT`} />
      <DetailRow
        label="Total credited"
        value={`${totalPayout.toFixed(2)} USDT`}
      />

      <Divider />

      <CTAGroup caption="Reinvest, withdraw, or hold — your funds are unlocked.">
        <EmailButton href={getEarnUrl()}>View portfolio</EmailButton>
      </CTAGroup>

      <SecurityNote title="Looking for a tax record?">
        Your full earn history is available on the activity page and can be
        exported as CSV any time from the dashboard.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
