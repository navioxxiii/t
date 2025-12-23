/**
 * Admin Notification Email Template
 * Sent to admins/super admins for important notifications
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getAppName } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface AdminNotificationEmailProps {
  recipientName: string;
  notificationType: string;
  message: string;
  actionUrl?: string;
}

export function AdminNotificationEmail({
  recipientName,
  notificationType,
  message,
  actionUrl,
}: AdminNotificationEmailProps) {
  const appName = getAppName();

  const getNotificationTitle = () => {
    switch (notificationType) {
      case 'withdrawal_pending_super_admin':
        return 'Withdrawal Pending Super Admin Approval';
      case 'kyc_submission_pending':
        return 'New KYC Submission Pending Review';
      case 'large_transaction':
        return 'Large Transaction Alert';
      case 'suspicious_activity':
        return 'Suspicious Activity Detected';
      default:
        return 'Admin Notification';
    }
  };

  return (
    <BaseEmail preview={getNotificationTitle()}>
      <Heading style={emailStyles.heading}>{getNotificationTitle()}</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>{message}</Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoText}>
          <strong>Notification Type:</strong> {notificationType}
          <br />
          <strong>Time:</strong> {new Date().toLocaleString()}
        </Text>
      </Section>

      {actionUrl && (
        <div style={emailStyles.buttonContainer}>
          <EmailButton href={actionUrl}>Take Action</EmailButton>
        </div>
      )}

      <Text style={emailStyles.text}>
        Please review this notification and take appropriate action if needed.
      </Text>

      <Text style={emailStyles.signature}>
        {appName} System
      </Text>
    </BaseEmail>
  );
}
