/**
 * Copy Trade Spot Available Email Template
 * Sent when a spot becomes available on the waitlist
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
import { getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface CopyTradeSpotAvailableEmailProps {
  recipientName: string;
  traderName: string;
  strategy: string;
  roiMin: number;
  roiMax: number;
  performanceFee: number;
  riskLevel: string;
  claimUrl: string;
  expiryHours?: number;
}

export function CopyTradeSpotAvailableEmail({
  recipientName,
  traderName,
  strategy,
  roiMin,
  roiMax,
  performanceFee,
  riskLevel,
  claimUrl,
  expiryHours = 24,
}: CopyTradeSpotAvailableEmailProps) {
  return (
    <BaseEmail preview={`A spot opened up for ${traderName}`}>
      <Eyebrow>Copy Trading</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        A spot just opened for {traderName}
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — you&apos;re next on the waitlist for {traderName}.
        Claim within {expiryHours} hours or the spot moves to the next person
        in line.
      </Text>

      <Divider />

      <SectionLabel>{traderName}</SectionLabel>
      <DetailRow label="Strategy" value={strategy} />
      <DetailRow label="Monthly ROI" value={`${roiMin}% – ${roiMax}%`} />
      <DetailRow label="Performance fee" value={`${performanceFee}%`} />
      <DetailRow label="Risk level" value={riskLevel} />

      <Divider />

      <CTAGroup caption={`This invitation expires in ${expiryHours} hours.`}>
        <EmailButton href={claimUrl}>Claim your spot</EmailButton>
      </CTAGroup>

      <SecurityNote title="Before you claim">
        Performance fees are charged on profits when you stop copying. Past
        performance doesn&apos;t guarantee future results — only allocate what
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
