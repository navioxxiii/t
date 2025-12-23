/**
 * Admin Created User Welcome Email Template
 * Sent to users created by admin with temporary password
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getEmailUrl, getAppName, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface AdminCreatedUserWelcomeEmailProps {
  recipientName: string;
  tempPassword: string;
  loginUrl?: string;
  changePasswordUrl?: string;
}

export function AdminCreatedUserWelcomeEmail({
  recipientName,
  tempPassword,
  loginUrl,
  changePasswordUrl,
}: AdminCreatedUserWelcomeEmailProps) {
  const appName = getAppName();
  const finalLoginUrl = loginUrl || getEmailUrl('/login');
  const finalChangePasswordUrl = changePasswordUrl || getEmailUrl('/settings/security');

  return (
    <BaseEmail preview={`Welcome! Your account has been created`}>
      <Heading style={emailStyles.heading}>Welcome to {appName}! 🎉</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Your account has been created by our admin team. Welcome to {appName}! Your account is ready to use.
      </Text>

      <Section style={emailStyles.warningBox}>
        <Text style={emailStyles.warningTitle}>Important: Temporary Password</Text>
        <Text style={emailStyles.warningText}>
          Your temporary password is: <strong>{tempPassword}</strong>
          <br />
          <br />
          <strong>Please change your password immediately after logging in for security.</strong>
        </Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          <strong>Next Steps:</strong>
          <br />
          1. Log in with your email and the temporary password above
          <br />
          2. Change your password immediately
          <br />
          3. Set up your security preferences
          <br />
          4. Start using your wallet
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={finalLoginUrl}>Log In Now</EmailButton>
        <div style={{ marginTop: '12px' }}>
          <EmailButton href={finalChangePasswordUrl} variant="secondary">
            Change Password
          </EmailButton>
        </div>
      </div>

      <Text style={emailStyles.text}>
        {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
