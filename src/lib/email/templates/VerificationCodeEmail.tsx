/**
 * Verification Code Email Template
 * Sent when user registers or requests code resend
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { CodeDisplay } from './components/CodeDisplay';
import { getAppName, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface VerificationCodeEmailProps {
  recipientName: string;
  verificationCode: string;
}

export function VerificationCodeEmail({
  recipientName,
  verificationCode,
}: VerificationCodeEmailProps) {
  const appName = getAppName();

  return (
    <BaseEmail preview={`Your verification code is ${verificationCode}`}>
      <Heading style={emailStyles.heading}>Verify Your Email</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Thank you for signing up! To complete your registration and access your
        {appName} account, please enter the verification code below:
      </Text>

      <CodeDisplay code={verificationCode} />

      <Section style={emailStyles.warningBox}>
        <Text style={emailStyles.warningTitle}>
          <strong>Security Tips:</strong>
        </Text>
        <Text style={emailStyles.warningText}>
          • This code is valid for 10 minutes
          <br />
          • Maximum 5 verification attempts
          <br />
          • Never share this code with anyone
          <br />• Our team will never ask for your verification code
        </Text>
      </Section>

      <Text style={emailStyles.text}>
        If you didn&apos;t create an account, you can safely ignore this email.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
