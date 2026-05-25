/**
 * PIN Changed Email Template
 * Sent when user changes their transaction PIN
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

interface PinChangedEmailProps {
  recipientName: string;
  timestamp?: string;
}

export function PinChangedEmail({
  recipientName,
  timestamp,
}: PinChangedEmailProps) {
  return (
    <BaseEmail preview="Your transaction PIN was just changed">
      <Eyebrow>PIN Updated</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Your transaction PIN has been changed
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — we&apos;re confirming this for your records.
        You&apos;ll need the new PIN to authorise withdrawals and other
        sensitive actions.
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

      <CTAGroup caption="If you forgot the new PIN, reset it from your security settings.">
        <EmailButton href={getSecurityUrl()}>Security settings</EmailButton>
        <div style={{ marginTop: 12 }}>
          <EmailButton href={getSupportUrl()} variant="secondary">
            This wasn&apos;t me
          </EmailButton>
        </div>
      </CTAGroup>

      <SecurityNote title="Keep your PIN private">
        Never share your PIN — not with support, not with friends, not in
        chat. Avoid obvious sequences like 1234 or your birth year.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
