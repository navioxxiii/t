/**
 * Password Reset Email Template
 * Sent when user requests a password reset
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
    <BaseEmail preview={`Your ${appName} password reset code is ${resetCode}`}>
      <Eyebrow>Password Reset</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        Reset your {appName} password
      </Heading>

      <Text style={emailStyles.text}>
        Hi {recipientName} — enter the code below to set a new password. If
        you didn&apos;t request this, you can safely ignore the email and your
        password will stay the same.
      </Text>

      <CodeDisplay code={resetCode} />

      <Divider />

      <SectionLabel>Good to know</SectionLabel>
      <Text style={emailStyles.text}>
        • Valid for 10 minutes
        <br />
        • Maximum of 5 attempts
        <br />
        • Single-use — invalidates as soon as you set a new password
      </Text>

      <SecurityNote title="Keep this code private">
        {appName} will never ask for your reset code by phone, email, or chat.
        If anyone asks you to share it, it&apos;s a scam — please report it.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
