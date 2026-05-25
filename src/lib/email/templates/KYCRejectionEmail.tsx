/**
 * KYC Rejection Email Template
 * Sent when KYC verification needs additional information
 */

import { Heading, Section, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  SecurityNote,
  CTAGroup,
} from './components/EmailPrimitives';
import {
  getSupportUrl,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface KYCRejectionEmailProps {
  recipientName: string;
  rejectionReason: string;
  resubmitUrl: string;
}

export function KYCRejectionEmail({
  recipientName,
  rejectionReason,
  resubmitUrl,
}: KYCRejectionEmailProps) {
  return (
    <BaseEmail preview="A little more information is needed to verify your account">
      <Eyebrow>KYC Verification</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        We need a little more information
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — we reviewed your verification submission, but we
        couldn&apos;t complete the check with what we received. You can resubmit
        as soon as you&apos;ve resolved the item below.
      </Text>

      <Divider />

      <SectionLabel>Reason</SectionLabel>
      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorText}>{rejectionReason}</Text>
      </Section>

      <SectionLabel>Next steps</SectionLabel>
      <Text style={emailStyles.text}>
        1. Review the reason above.
        <br />
        2. Prepare the corrected document or information.
        <br />
        3. Resubmit your verification — it usually takes about three minutes.
      </Text>

      <Divider />

      <CTAGroup caption="Need help? Contact our compliance team below.">
        <EmailButton href={resubmitUrl}>Resubmit verification</EmailButton>
        <div style={{ marginTop: 12 }}>
          <EmailButton href={getSupportUrl()} variant="secondary">
            Contact support
          </EmailButton>
        </div>
      </CTAGroup>

      <SecurityNote title="Why we ask">
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
