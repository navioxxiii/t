/**
 * KYC Approval Email Template
 * Sent when KYC verification is approved
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
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
        return 'Tier 1 - Basic';
      case 'tier_2_advanced':
        return 'Tier 2 - Advanced';
      case 'tier_3_enhanced':
        return 'Tier 3 - Enhanced';
      default:
        return tier;
    }
  };

  return (
    <BaseEmail preview="Your KYC verification has been approved">
      <Heading style={emailStyles.heading}>KYC Verification Approved! 🎉</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Great news! Your KYC (Know Your Customer) verification has been successfully approved. Your account now has enhanced features and higher transaction limits.
      </Text>

      <Section style={emailStyles.successBox}>
        <Text style={emailStyles.successTitle}>Verification Details:</Text>
        <Text style={emailStyles.successText}>
          <strong>Verification Tier:</strong> {getTierDisplay()}
          {verificationDate && (
            <>
              <br />
              <strong>Verified On:</strong> {new Date(verificationDate).toLocaleDateString()}
            </>
          )}
        </Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoTitle}>Your New Transaction Limits:</Text>
        <Text style={emailStyles.infoText}>
          <strong>Daily Limit:</strong> ${limits.daily_limit_usd.toLocaleString()} USD
          {limits.monthly_limit_usd && (
            <>
              <br />
              <strong>Monthly Limit:</strong> ${limits.monthly_limit_usd.toLocaleString()} USD
            </>
          )}
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getDashboardUrl()}>Go to Dashboard</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        You can now enjoy all the benefits of a verified account, including higher transaction limits and access to advanced features. Thank you for completing the verification process!
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
