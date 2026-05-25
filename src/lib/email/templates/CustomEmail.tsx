/**
 * Custom Email Template
 * For admin-sent custom emails to users
 */

import { Heading, Text } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  Divider,
  SecurityNote,
  CTAGroup,
} from './components/EmailPrimitives';
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
      return 'For assistance, open the in-app chat.';
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

  const ctaUrl = replyUrl || actionUrl;
  const ctaText = replyText || actionText;
  const showDefaultDashboardCta = !ctaUrl && replyMode === 'no_reply';
  const hasCta = Boolean(ctaUrl && ctaText) || showDefaultDashboardCta;

  return (
    <BaseEmail preview={subject}>
      <Heading style={emailStyles.heading} className="tw-h1">
        {subject}
      </Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      {renderContent()}

      {hasCta && (
        <>
          <Divider />
          <CTAGroup caption={getFooterText(replyMode)}>
            {ctaUrl && ctaText ? (
              <EmailButton href={ctaUrl}>{ctaText}</EmailButton>
            ) : (
              <EmailButton href={getDashboardUrl()}>
                Go to dashboard
              </EmailButton>
            )}
          </CTAGroup>
        </>
      )}

      {!hasCta && (
        <Text style={emailStyles.textSecondary}>
          {getFooterText(replyMode)}
        </Text>
      )}

      <SecurityNote title="Stay vigilant">
        {getAppName()} will never ask for your password, PIN, or verification
        codes by email. If a message claims otherwise, it&apos;s a phishing
        attempt.
      </SecurityNote>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
