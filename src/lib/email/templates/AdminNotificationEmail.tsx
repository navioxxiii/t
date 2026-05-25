/**
 * Admin Notification Email Template
 * Sent to admins/super admins for operational notifications
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  DetailRow,
  CTAGroup,
} from './components/EmailPrimitives';
import { getAppName } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface AdminNotificationEmailProps {
  recipientName: string;
  notificationType: string;
  message: string;
  actionUrl?: string;
}

const TYPE_LABELS: Record<string, string> = {
  withdrawal_pending_super_admin: 'Withdrawal awaiting super-admin approval',
  kyc_submission_pending: 'KYC submission awaiting review',
  large_transaction: 'Large transaction flagged',
  suspicious_activity: 'Suspicious activity detected',
};

const TYPE_SHORT: Record<string, string> = {
  withdrawal_pending_super_admin: 'Withdrawal approval',
  kyc_submission_pending: 'KYC review',
  large_transaction: 'Large transaction',
  suspicious_activity: 'Suspicious activity',
};

export function AdminNotificationEmail({
  recipientName,
  notificationType,
  message,
  actionUrl,
}: AdminNotificationEmailProps) {
  const appName = getAppName();
  const title = TYPE_LABELS[notificationType] || 'Admin notification';
  const typeLabel = TYPE_SHORT[notificationType] || notificationType;

  return (
    <BaseEmail preview={title}>
      <Eyebrow>Admin Alert</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        {title}
      </Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>
      <Text style={emailStyles.text}>{message}</Text>

      <Divider />

      <SectionLabel>Notification</SectionLabel>
      <DetailRow label="Type" value={typeLabel} />
      <DetailRow label="Time" value={new Date().toLocaleString()} />

      {actionUrl && (
        <>
          <Divider />
          <CTAGroup caption="Action items expire after 24 hours.">
            <EmailButton href={actionUrl}>Review now</EmailButton>
          </CTAGroup>
        </>
      )}

      <Text style={emailStyles.signature}>
        {appName} · Operations
      </Text>
    </BaseEmail>
  );
}
