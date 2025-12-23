/**
 * Base Email Layout
 * Responsive email template wrapper with consistent styling
 */

import {
  Html,
  Head,
  Body,
  Container,
  Preview,
} from '@react-email/components';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';
import { branding } from '@/config/branding';

interface BaseEmailProps {
  preview: string;
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function BaseEmail({
  preview,
  children,
  showHeader = true,
  showFooter = true,
}: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {showHeader && <EmailHeader />}
          <div style={content}>{children}</div>
          {showFooter && <EmailFooter />}
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: '#f9fafb', // Light gray background for email clients
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  backgroundColor: branding.email.colors.background,
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  width: '100%',
};

const content = {
  padding: '0 40px 40px',
};
