/**
 * Code Display Component
 * Displays 6-digit verification code prominently
 */

import { Section, Text } from '@react-email/components';

interface CodeDisplayProps {
  code: string;
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  // Split code into individual digits for better display
  const digits = code.split('');

  return (
    <Section style={codeSection}>
      <Text style={codeLabel}>Your Verification Code</Text>
      <div style={codeContainer}>
        {digits.map((digit, index) => (
          <span key={index} style={digitBox}>
            {digit}
          </span>
        ))}
      </div>
      <Text style={expiryText}>
        This code expires in 10 minutes
      </Text>
    </Section>
  );
}

const codeSection = {
  padding: '32px 0',
  textAlign: 'center' as const,
};

const codeLabel = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#6b7280',
  marginBottom: '16px',
};

const codeContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  margin: '0 auto',
  maxWidth: '400px',
};

const digitBox = {
  display: 'inline-block',
  width: '48px',
  height: '56px',
  lineHeight: '56px',
  fontSize: '28px',
  fontWeight: '700',
  color: '#1f2937',
  backgroundColor: '#f3f4f6',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  textAlign: 'center' as const,
  fontFamily: 'Monaco, Courier, monospace',
};

const expiryText = {
  fontSize: '13px',
  color: '#9ca3af',
  marginTop: '16px',
};
