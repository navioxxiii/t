/**
 * Support Ticket Reply Email Template
 * Sent to users when an admin replies to their ticket
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  SecurityNote,
  CTAGroup,
} from './components/EmailPrimitives';
import { getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface SupportTicketReplyEmailProps {
  recipientName?: string;
  replyContent: string;
  ticketUrl: string;
  ticketNumber: string;
}

export function SupportTicketReplyEmail({
  recipientName,
  replyContent,
  ticketUrl,
  ticketNumber,
}: SupportTicketReplyEmailProps) {
  return (
    <BaseEmail preview={`New reply on ticket #${ticketNumber}`}>
      <Eyebrow>Support Ticket</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        New reply on ticket #{ticketNumber}
      </Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      <Text style={emailStyles.text}>
        A support agent has replied to your ticket.
      </Text>

      <Divider />

      <SectionLabel>From the agent</SectionLabel>
      <div style={emailStyles.quoteBox}>
        <Text style={emailStyles.quoteText}>
          {replyContent.split('\n').map((line, index, array) => (
            <span key={index}>
              {line}
              {index < array.length - 1 && <br />}
            </span>
          ))}
        </Text>
      </div>

      <Divider />

      <CTAGroup caption="Replies sent through the dashboard reach the agent fastest.">
        <EmailButton href={ticketUrl}>Open full thread</EmailButton>
      </CTAGroup>

      <SecurityNote title="Verify before you share anything sensitive">
        Tano support will never ask for your password, PIN, recovery phrase,
        or 2FA codes inside a ticket. If you see such a request, report the
        message immediately.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
