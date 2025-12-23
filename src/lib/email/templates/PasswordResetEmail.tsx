/**
 * Password Reset Email Template
 * Sent when user requests password reset
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { CodeDisplay } from './components/CodeDisplay';
import { getAppName, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface PasswordResetEmailProps {
  recipientName: string;
  resetCode: string;
}

export function PasswordResetEmail({
  recipientName,
  resetCode,
}: PasswordResetEmailProps) {
  const appName = getAppName();

  return (
    <BaseEmail preview={`Your password reset code is ${resetCode}`}>
      <Heading style={emailStyles.heading}>Reset Your Password</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        We received a request to reset your password for your {appName} account.
        To proceed with resetting your password, please enter the verification code below:
      </Text>

      <CodeDisplay code={resetCode} />

      <Section style={emailStyles.warningBox}>
        <Text style={emailStyles.warningTitle}>
          <strong>Security Notice:</strong>
        </Text>
        <Text style={emailStyles.warningText}>
          • This code is valid for 10 minutes
          <br />
          • Maximum 5 verification attempts
          <br />
          • Never share this code with anyone
          <br />
          • Our team will never ask for your reset code
          <br />• If you didn&apos;t request this, please secure your account immediately
        </Text>
      </Section>

      <Text style={emailStyles.text}>
        If you didn&apos;t request a password reset, you can safely ignore this email.
        Your password will remain unchanged.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
