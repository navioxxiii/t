/**
 * Custom Email Template
 * For admin-sent custom emails to users
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  getAppName,
  getDashboardUrl,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';
import type { EmailReplyMode } from '../types';

interface CustomEmailProps {
  recipientName?: string;
  subject: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  replyUrl?: string;
  replyText?: string;
  replyMode?: EmailReplyMode;
  category?: string;
}

function getFooterText(replyMode: EmailReplyMode): string {
  switch (replyMode) {
    case 'reply_via_tawk':
      return 'For assistance, open in-app chat.';
    case 'reply_via_dashboard':
      return 'Complete this action in your dashboard.';
    case 'no_reply':
    default:
      return 'This mailbox is not monitored. For help, use the in-app chat.';
  }
}

export function CustomEmail({
  recipientName,
  subject,
  content,
  actionUrl,
  actionText,
  replyUrl,
  replyText,
  replyMode = 'no_reply',
}: CustomEmailProps) {
  // Always render as plain text with line breaks (no raw HTML injection)
  const renderContent = () => {
    const paragraphs = content.split('\n\n').filter((p) => p.trim());
    if (paragraphs.length === 0) {
      return (
        <Text style={emailStyles.text}>
          {content.split('\n').map((line, index, array) => (
            <span key={index}>
              {line}
              {index < array.length - 1 && <br />}
            </span>
          ))}
        </Text>
      );
    }

    return (
      <>
        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={emailStyles.text}>
            {paragraph.split('\n').map((line, lineIndex, array) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < array.length - 1 && <br />}
              </span>
            ))}
          </Text>
        ))}
      </>
    );
  };

  // Determine CTA button - replyUrl/replyText take priority, then actionUrl/actionText
  const ctaUrl = replyUrl || actionUrl;
  const ctaText = replyText || actionText;

  // For no_reply mode without explicit CTA, show "Go to Dashboard"
  const showDefaultDashboardCta = !ctaUrl && replyMode === 'no_reply';

  return (
    <BaseEmail preview={subject}>
      <Heading style={emailStyles.heading}>{subject}</Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      <Section style={emailStyles.neutralBox}>
        {renderContent()}
      </Section>

      {ctaUrl && ctaText && (
        <div style={emailStyles.buttonContainer}>
          <EmailButton href={ctaUrl}>{ctaText}</EmailButton>
        </div>
      )}

      {showDefaultDashboardCta && (
        <div style={emailStyles.buttonContainer}>
          <EmailButton href={getDashboardUrl()}>Go to Dashboard</EmailButton>
        </div>
      )}

      <Text style={emailStyles.text}>
        {getFooterText(replyMode)}
      </Text>

      <Text style={{ fontSize: '12px', lineHeight: '18px', color: '#999999', marginTop: '16px' }}>
        {getAppName()} will never ask for your password, PIN, or verification codes via email.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
