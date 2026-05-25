/**
 * Account Banned Email Template
 * Sent when user account is suspended
 */

import { Heading, Section, Text } from '@react-email/components';
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
import { getSupportUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';
import { branding } from '@/config/branding';

interface AccountBannedEmailProps {
  recipientName: string;
  reason: string;
  supportUrl?: string;
  bannedAt?: string;
}

export function AccountBannedEmail({
  recipientName,
  reason,
  supportUrl,
  bannedAt,
}: AccountBannedEmailProps) {
  return (
    <BaseEmail preview="Your account has been suspended">
      <Eyebrow>Account</Eyebrow>
      <Heading
        style={{ ...emailStyles.heading, color: branding.email.colors.error }}
        className="tw-h1"
      >
        Your account has been suspended
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — access to your Tano account has been temporarily
        suspended under our Terms of Service. Your funds remain safe in the
        vault.
      </Text>

      <Divider />

      <SectionLabel>Reason</SectionLabel>
      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorText}>{reason}</Text>
      </Section>

      {bannedAt && (
        <>
          <SectionLabel>Effective</SectionLabel>
          <DetailRow
            label="Suspended on"
            value={new Date(bannedAt).toLocaleString()}
          />
          <div style={{ height: 12 }} />
        </>
      )}

      <SectionLabel>What this means</SectionLabel>
      <Text style={emailStyles.text}>
        • You can&apos;t sign in or make transactions while suspended.
        <br />
        • Your balances remain secure and untouched.
        <br />
        • You can appeal this decision through support.
      </Text>

      <Divider />

      <CTAGroup caption="Our compliance team will respond to appeals within 2 business days.">
        <EmailButton href={supportUrl || getSupportUrl()}>
          Contact support
        </EmailButton>
      </CTAGroup>

      <SecurityNote title="Why we take this step">
        Suspensions protect every Tano account holder when our compliance
        program identifies activity that may breach our terms or applicable
        law. Each case is reviewed by a member of our team.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
