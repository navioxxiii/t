/**
 * Support Ticket Reply Email Template
 * Sent to users when an admin replies to their ticket
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
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
  const preview = `New reply for ticket #${ticketNumber}`;

  return (
    <BaseEmail preview={preview}>
      <Heading style={emailStyles.heading}>New Reply to Ticket #{ticketNumber}</Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      <Text style={emailStyles.text}>
        A support agent has replied to your ticket. Here is the message:
      </Text>

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

      <Text style={emailStyles.text}>
        You can view the full conversation and reply by clicking the button below.
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
