/**
 * Code Display Component
 * Premium 6-digit verification code — soft cells with gold underline accent.
 */

import { Section, Text } from '@react-email/components';
import { branding } from '@/config/branding';

interface CodeDisplayProps {
  code: string;
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  const digits = code.split('');

  return (
    <Section style={codeSection}>
      <Text style={codeLabel}>VERIFICATION CODE</Text>
      <div style={codeContainer}>
        {digits.map((digit, index) => (
          <span key={index} style={digitBox}>
            {digit}
          </span>
        ))}
      </div>
      <Text style={expiryText}>Expires in 10 minutes</Text>
    </Section>
  );
}

const codeSection = {
  padding: '24px 0 32px',
  textAlign: 'center' as const,
};

const codeLabel = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1.4px',
  color: branding.email.colors.textSecondary,
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const codeContainer = {
  margin: '0 auto',
  textAlign: 'center' as const,
  fontSize: 0, // collapse whitespace between inline-block cells
};

const digitBox = {
  display: 'inline-block',
  width: '44px',
  height: '56px',
  lineHeight: '56px',
  fontSize: '26px',
  fontWeight: '700',
  color: branding.email.colors.text,
  backgroundColor: '#FAFAF7',
  borderBottom: `2px solid ${branding.email.colors.primary}`,
  borderRadius: '6px',
  textAlign: 'center' as const,
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  margin: '0 4px',
};

const expiryText = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '13px',
  color: branding.email.colors.textMuted,
  margin: '20px 0 0',
  textAlign: 'center' as const,
};
