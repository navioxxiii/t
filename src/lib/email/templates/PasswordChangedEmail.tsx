/**
 * Password Changed Email Template
 * Sent when user changes their password
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
import {
  getSupportUrl,
  getSecurityUrl,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface PasswordChangedEmailProps {
  recipientName: string;
  timestamp?: string;
}

export function PasswordChangedEmail({
  recipientName,
  timestamp,
}: PasswordChangedEmailProps) {
  return (
    <BaseEmail preview="Your Tano password was just changed">
      <Eyebrow>Password Updated</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your password has been changed
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — we&apos;re confirming this for your records. If
        this was you, no further action is needed.
      </Text>

      {timestamp && (
        <>
          <Divider />
          <SectionLabel>Change details</SectionLabel>
          <DetailRow
            label="Changed at"
            value={new Date(timestamp).toLocaleString()}
          />
        </>
      )}

      <Divider />

      <CTAGroup caption="Enable two-factor authentication for an extra layer of protection.">
        <EmailButton href={getSecurityUrl()}>Security settings</EmailButton>
        <div style={{ marginTop: 12 }}>
          <EmailButton href={getSupportUrl()} variant="secondary">
            This wasn&apos;t me
          </EmailButton>
        </div>
      </CTAGroup>

      <SecurityNote title="Didn't change your password?">
        Contact support immediately. Tano will never ask for your password by
        email, phone, or chat — anyone who does is attempting fraud.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
