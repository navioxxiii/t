/**
 * Support Ticket Inactivity Reminder Email Template
 * Sent to users when their ticket is pending their response
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  Divider,
  CTAGroup,
} from './components/EmailPrimitives';
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
  return (
    <BaseEmail
      preview={`Reminder: your reply is needed on ticket #${ticketNumber}`}
    >
      <Eyebrow>Support Ticket</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        We&apos;re waiting on your reply
      </Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      <Text style={emailStyles.text}>
        Ticket <strong>#{ticketNumber}</strong> is paused, waiting on a
        response from you. Without one, we&apos;ll close the ticket soon — you
        can always open a new one later if you need to.
      </Text>

      <Divider />

      <CTAGroup caption="A quick reply is enough to keep the conversation open.">
        <EmailButton href={ticketUrl}>Reply to ticket</EmailButton>
      </CTAGroup>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
