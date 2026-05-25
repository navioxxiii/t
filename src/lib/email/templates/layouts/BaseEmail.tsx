/**
 * Base Email Layout
 * Premium fintech wrapper — warm canvas, white card, gold hairline,
 * responsive at <=600px.
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

const responsiveCss = `
  @media only screen and (max-width: 600px) {
    .tw-card { width: 100% !important; border-radius: 0 !important; }
    .tw-content { padding-left: 24px !important; padding-right: 24px !important; }
    .tw-h1 { font-size: 22px !important; line-height: 30px !important; }
    .tw-cta a { display: block !important; width: 100% !important; box-sizing: border-box !important; }
  }
`;

export function BaseEmail({
  preview,
  children,
  showHeader = true,
  showFooter = true,
}: BaseEmailProps) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style>{responsiveCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container className="tw-card" style={container}>
          {showHeader && <EmailHeader />}
          <div className="tw-content" style={content}>
            {children}
          </div>
          {showFooter && <EmailFooter />}
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: '#F6F5F1', // Warm neutral canvas
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: '32px 16px',
};

const container = {
  backgroundColor: branding.email.colors.background,
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  width: '600px',
  borderRadius: '14px',
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(15, 17, 21, 0.04)',
};

const content = {
  padding: '0 40px 8px',
};
