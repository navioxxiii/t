/**
 * KYC Approval Email Template
 * Sent when KYC verification is approved
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

interface KYCApprovalEmailProps {
  recipientName: string;
  tier: string;
  limits: {
    daily_limit_usd: number;
    monthly_limit_usd?: number;
  };
  verificationDate?: string;
}

export function KYCApprovalEmail({
  recipientName,
  tier,
  limits,
  verificationDate,
}: KYCApprovalEmailProps) {
  const getTierDisplay = () => {
    switch (tier) {
      case 'tier_1_basic':
        return 'Tier 1 — Basic';
      case 'tier_2_advanced':
        return 'Tier 2 — Advanced';
      case 'tier_3_enhanced':
        return 'Tier 3 — Enhanced';
      default:
        return tier;
    }
  };

  return (
    <BaseEmail preview="Your identity has been verified">
      <Eyebrow>KYC Verification</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your identity has been verified
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName}, your KYC review is complete. Your account is now at{' '}
        <strong>{getTierDisplay()}</strong> with the expanded limits below.
      </Text>

      <Divider />

      <SectionLabel>Verification</SectionLabel>
      <DetailRow label="Tier" value={getTierDisplay()} />
      {verificationDate && (
        <DetailRow
          label="Verified on"
          value={new Date(verificationDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        />
      )}

      <div style={{ height: 28 }} />

      <SectionLabel>Transaction limits</SectionLabel>
      <DetailRow
        label="Daily"
        value={`$${limits.daily_limit_usd.toLocaleString()} USD`}
      />
      {limits.monthly_limit_usd && (
        <DetailRow
          label="Monthly"
          value={`$${limits.monthly_limit_usd.toLocaleString()} USD`}
        />
      )}

      <Divider />

      <CTAGroup caption="Sign in with your existing credentials">
        <EmailButton href={getDashboardUrl()}>Go to dashboard</EmailButton>
      </CTAGroup>

      <SecurityNote title="Why we verify">
        Tano Wallet is registered as an asset service provider and is
        required by law to verify the identity of every account holder. Your
        documents are encrypted in transit and at rest, reviewed only by our
        compliance team, and never shared with third parties.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
