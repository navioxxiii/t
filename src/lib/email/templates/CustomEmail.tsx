/**
 * Custom Email Template
 * For admin-sent custom emails to users
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import {
  getDashboardUrl,
  getSupportUrl,
  getTeamName,
  getSignature,
} from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface CustomEmailProps {
  recipientName?: string;
  subject: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  isHtml?: boolean;
}

export function CustomEmail({
  recipientName,
  subject,
  content,
  actionUrl,
  actionText,
  isHtml = false,
}: CustomEmailProps) {
  // If content is HTML, we need to render it as HTML
  // Otherwise, treat it as plain text with line breaks
  const renderContent = () => {
    if (isHtml) {
      // For HTML content, wrap in a div with HTML
      // Note: In production, you should sanitize HTML content before passing it
      return (
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            fontSize: '16px',
            lineHeight: '26px',
            color: emailStyles.text.color,
            marginBottom: '16px',
          }}
        />
      );
    }

    // For plain text, split by newlines and render as paragraphs
    const paragraphs = content.split('\n\n').filter((p) => p.trim());
    if (paragraphs.length === 0) {
      // If no paragraphs, just render the content with line breaks
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

  return (
    <BaseEmail preview={subject}>
      <Heading style={emailStyles.heading}>{subject}</Heading>

      {recipientName && (
        <Text style={emailStyles.text}>Hi {recipientName},</Text>
      )}

      <Section style={emailStyles.neutralBox}>
        {renderContent()}
      </Section>

      {actionUrl && actionText && (
        <div style={emailStyles.buttonContainer}>
          <EmailButton href={actionUrl}>{actionText}</EmailButton>
        </div>
      )}

      {!actionUrl && (
        <div style={emailStyles.buttonContainer}>
          <EmailButton href={getDashboardUrl()}>Go to Dashboard</EmailButton>
        </div>
      )}

      <Text style={emailStyles.text}>
        If you have any questions, please don&apos;t hesitate to contact our support team.
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
