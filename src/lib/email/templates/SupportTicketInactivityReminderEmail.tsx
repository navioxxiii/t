/**
 * Support Ticket Inactivity Reminder Email Template
 * Sent to users when their ticket is pending their response
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface SupportTicketInactivityReminderEmailProps {
  recipientName?: string;
  ticketUrl: string;
  ticketNumber: string;
}

export function SupportTicketInactivityReminderEmail({
  recipientName,
  ticketUrl,
  ticketNumber,
}: SupportTicketInactivityReminderEmailProps) {
  const preview = `Action required for your support ticket #${ticketNumber}`;

  return (
    <BaseEmail preview={preview}>
      <Heading style={emailStyles.heading}>Regarding Ticket #{ticketNumber}</Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      <Text style={emailStyles.text}>
        We are waiting for your response on support ticket #{ticketNumber}.
        Please provide an update so we can continue to assist you.
      </Text>

      <Text style={emailStyles.text}>
        If we don&apos;t hear back from you, this ticket will be automatically closed soon.
      </Text>

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
