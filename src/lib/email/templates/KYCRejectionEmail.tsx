/**
 * KYC Rejection Email Template
 * Sent when KYC verification is rejected
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getSupportUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
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
    <BaseEmail preview="KYC verification requires additional information">
      <Heading style={emailStyles.heading}>KYC Verification Update</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        We&apos;ve reviewed your KYC verification submission, but we need some additional information or clarification to complete the process.
      </Text>

      <Section style={emailStyles.errorBox}>
        <Text style={emailStyles.errorTitle}>Reason:</Text>
        <Text style={emailStyles.errorText}>{rejectionReason}</Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          <strong>What to do next:</strong>
          <br />
          • Review the reason above
          <br />
          • Prepare the required documents or information
          <br />
          • Resubmit your KYC verification
          <br />
          • Contact support if you need assistance
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={resubmitUrl}>Resubmit KYC</EmailButton>
        <div style={{ marginTop: '12px' }}>
          <EmailButton href={getSupportUrl()} variant="secondary">
            Contact Support
          </EmailButton>
        </div>
      </div>

      <Text style={emailStyles.text}>
        Don&apos;t worry - you can resubmit your verification at any time. {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

