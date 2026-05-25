/**
 * Verification Code Email Template
 * Sent when user registers or requests code resend
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { CodeDisplay } from './components/CodeDisplay';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  SecurityNote,
} from './components/EmailPrimitives';
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
    <BaseEmail preview={`Your ${appName} verification code is ${verificationCode}`}>
      <Eyebrow>Email Verification</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Confirm your email to continue
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName}, enter the code below in {appName} to finish setting
        up your account.
      </Text>

      <CodeDisplay code={verificationCode} />

      <Divider />

      <SectionLabel>Good to know</SectionLabel>
      <Text style={emailStyles.text}>
        • Valid for 10 minutes
        <br />
        • Maximum of 5 attempts
        <br />
        • If you didn&apos;t request this, you can safely ignore the email
      </Text>

      <SecurityNote title="Keep this code private">
        {appName} will never ask for your verification code by phone, email, or
        chat. If anyone asks you to share it, it&apos;s a scam.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
