/**
 * Email Primitives
 * Reusable structural pieces — eyebrow label, section label, hairline divider,
 * security note, transaction-style detail row, CTA group with sub-text.
 */

import { Row, Column, Section, Text } from '@react-email/components';
import { branding } from '@/config/branding';

const sansStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const monoStack =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

// ── Eyebrow ─────────────────────────────────────────────────────────────────
// Small uppercase gold label sits above the H1. Identifies the email type
// at a glance (KYC VERIFICATION, SECURITY ALERT, WITHDRAWAL, etc.)

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={eyebrowStyle}>{children}</Text>;
}

const eyebrowStyle = {
  fontFamily: sansStack,
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
  color: branding.email.colors.primaryHover,
  margin: '0 0 12px',
};

// ── Section label ───────────────────────────────────────────────────────────
// Small uppercase ink label that introduces a content block.

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={sectionLabelStyle}>{children}</Text>;
}

const sectionLabelStyle = {
  fontFamily: sansStack,
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: branding.email.colors.textSecondary,
  margin: '0 0 12px',
};

// ── Divider ─────────────────────────────────────────────────────────────────
// Hairline horizontal rule for separating sections.

export function Divider() {
  return <div style={dividerStyle}>&nbsp;</div>;
}

const dividerStyle = {
  height: '1px',
  lineHeight: '1px',
  fontSize: 0,
  backgroundColor: branding.email.colors.border,
  margin: '28px 0',
};

// ── Security note ───────────────────────────────────────────────────────────
// Soft gold-tinted block used for trust/compliance context at the bottom of
// an email ("Why we ask", "Why this matters", etc.).

interface SecurityNoteProps {
  title?: string;
  children: React.ReactNode;
}

export function SecurityNote({
  title = 'Why we ask',
  children,
}: SecurityNoteProps) {
  return (
    <Section style={securityNoteStyle}>
      <Text style={securityNoteTitleStyle}>{title}</Text>
      <Text style={securityNoteTextStyle}>{children}</Text>
    </Section>
  );
}

const securityNoteStyle = {
  backgroundColor: branding.email.colors.warningBg,
  borderRadius: '10px',
  padding: '18px 20px',
  margin: '28px 0 8px',
};

const securityNoteTitleStyle = {
  fontFamily: sansStack,
  fontSize: '13px',
  fontWeight: '700',
  color: branding.email.colors.text,
  margin: '0 0 6px',
};

const securityNoteTextStyle = {
  fontFamily: sansStack,
  fontSize: '13px',
  lineHeight: '20px',
  color: branding.email.colors.text,
  margin: 0,
};

// ── Detail row ──────────────────────────────────────────────────────────────
// Transaction-receipt-style label/value pair. Label left, value right.
// `mono` flag uses a monospace stack for hashes/addresses.

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

export function DetailRow({ label, value, mono }: DetailRowProps) {
  return (
    <Row style={detailRowStyle}>
      <Column style={detailLabelCellStyle}>{label}</Column>
      <Column
        align="right"
        style={mono ? detailValueMonoCellStyle : detailValueCellStyle}
      >
        {value}
      </Column>
    </Row>
  );
}

const detailRowStyle = {
  borderBottom: `1px solid ${branding.email.colors.border}`,
};

const detailLabelBase = {
  fontFamily: sansStack,
  fontSize: '14px',
  lineHeight: '20px',
  padding: '12px 0',
  verticalAlign: 'top' as const,
};

const detailLabelCellStyle = {
  ...detailLabelBase,
  color: branding.email.colors.textSecondary,
  textAlign: 'left' as const,
  width: '40%',
};

const detailValueCellStyle = {
  ...detailLabelBase,
  color: branding.email.colors.text,
  fontWeight: '600',
  textAlign: 'right' as const,
  wordBreak: 'break-word' as const,
};

const detailValueMonoCellStyle = {
  ...detailLabelBase,
  fontFamily: monoStack,
  fontSize: '13px',
  color: branding.email.colors.text,
  textAlign: 'right' as const,
  wordBreak: 'break-all' as const,
};

// ── CTA group ───────────────────────────────────────────────────────────────
// Wraps a primary CTA with optional reassurance micro-text below.

interface CTAGroupProps {
  children: React.ReactNode;
  caption?: string;
}

export function CTAGroup({ children, caption }: CTAGroupProps) {
  return (
    <div style={ctaGroupStyle}>
      {children}
      {caption && <Text style={ctaCaptionStyle}>{caption}</Text>}
    </div>
  );
}

const ctaGroupStyle = {
  textAlign: 'center' as const,
  margin: '8px 0 0',
};

const ctaCaptionStyle = {
  fontFamily: sansStack,
  fontSize: '13px',
  lineHeight: '20px',
  color: branding.email.colors.textSecondary,
  margin: '14px 0 0',
  textAlign: 'center' as const,
};
