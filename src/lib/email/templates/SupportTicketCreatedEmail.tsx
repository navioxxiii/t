/**
 * Support Ticket Created Email Template
 * Sent to users when they create a new support ticket
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Eyebrow,
  SectionLabel,
  Divider,
  SecurityNote,
  DetailRow,
  CTAGroup,
} from './components/EmailPrimitives';
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
  return (
    <BaseEmail preview={`Support ticket #${ticketNumber} has been created`}>
      <Eyebrow>Support Ticket</Eyebrow>
      <Heading style={emailStyles.heading} className="tw-h1">
        We&apos;ve received your request
      </Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      <Text style={emailStyles.text}>
        Thanks for reaching out. A member of our support team will reply within
        24 hours — usually much sooner.
      </Text>

      <Divider />

      <SectionLabel>Ticket details</SectionLabel>
      <DetailRow label="Ticket number" value={`#${ticketNumber}`} />
      <DetailRow label="Subject" value={subject} />
      <DetailRow label="Category" value={formatCategory(category)} />

      <Divider />

      <CTAGroup
        caption={
          isGuest
            ? 'Save this email — the link below is how you reach your ticket.'
            : 'You can also find this ticket in the Support area of your dashboard.'
        }
      >
        <EmailButton href={ticketUrl}>View ticket</EmailButton>
      </CTAGroup>

      <SecurityNote title="A reminder while you wait">
        Our team will never ask for your password, PIN, or recovery phrase to
        resolve a ticket. If someone claiming to be Tano support does, please
        report it.
      </SecurityNote>

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
