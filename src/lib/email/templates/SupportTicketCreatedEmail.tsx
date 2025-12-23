/**
 * Support Ticket Created Email Template
 * Sent to users when they create a new support ticket
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface SupportTicketCreatedEmailProps {
  recipientName?: string;
  ticketNumber: string;
  subject: string;
  category: string;
  ticketUrl: string;
  isGuest?: boolean;
}

export function SupportTicketCreatedEmail({
  recipientName,
  ticketNumber,
  subject,
  category,
  ticketUrl,
  isGuest,
}: SupportTicketCreatedEmailProps) {
  const preview = `Support ticket #${ticketNumber} has been created`;

  return (
    <BaseEmail preview={preview}>
      <Heading style={emailStyles.heading}>Support Ticket Created</Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      <Text style={emailStyles.text}>
        Thank you for contacting our support team. Your ticket has been created
        and our team will review it shortly.
      </Text>

      <div style={emailStyles.neutralBox}>
        <Text style={emailStyles.neutralTitle}>Ticket Details</Text>
        <Text style={emailStyles.neutralText}>
          <strong>Ticket Number:</strong> #{ticketNumber}
        </Text>
        <Text style={emailStyles.neutralText}>
          <strong>Subject:</strong> {subject}
        </Text>
        <Text style={emailStyles.neutralText}>
          <strong>Category:</strong> {formatCategory(category)}
        </Text>
      </div>

      <Text style={emailStyles.text}>
        Our support team typically responds within 24 hours. You can view the
        status of your ticket and reply to messages by clicking the button below.
      </Text>

      {isGuest && (
        <Text style={{ ...emailStyles.text, color: '#f97316', fontWeight: 500 }}>
          Important: Save this email! You will need the link below to access
          your ticket.
        </Text>
      )}

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={ticketUrl}>View Support Ticket</EmailButton>
      </div>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

function formatCategory(category: string): string {
  const categories: Record<string, string> = {
    account: 'Account',
    transaction: 'Transaction',
    kyc: 'KYC / Verification',
    ban_appeal: 'Ban Appeal',
    technical: 'Technical Issue',
    'copy-trading': 'Copy Trading',
    'earn-package': 'Earn Package',
    other: 'Other',
  };
  return categories[category] || category;
}
