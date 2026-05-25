/**
 * Shared Email Styles
 * Premium fintech styling — serif headline, soft tinted blocks (no heavy borders),
 * gold-anchored accent system. All keys preserved for backwards compatibility
 * with existing templates.
 */

import { branding } from '@/config/branding';

const colors = branding.email.colors;

const sansStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const serifStack = 'Georgia, "Times New Roman", serif';

export const emailStyles = {
  heading: {
    fontFamily: serifStack,
    fontSize: '26px',
    lineHeight: '34px',
    fontWeight: '600',
    letterSpacing: '-0.2px',
    color: colors.text,
    margin: '0 0 16px',
    textAlign: 'left' as const,
  },
  text: {
    fontFamily: sansStack,
    fontSize: '16px',
    lineHeight: '26px',
    color: colors.text,
    margin: '0 0 16px',
  },
  textSecondary: {
    fontFamily: sansStack,
    fontSize: '15px',
    lineHeight: '24px',
    color: colors.textSecondary,
    margin: '0 0 16px',
  },
  signature: {
    fontFamily: sansStack,
    fontSize: '15px',
    lineHeight: '24px',
    color: colors.textSecondary,
    margin: '32px 0 0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },

  // Soft tinted blocks — no heavy borders, gentle radius, on-brand colors.
  // Title + text keys retained for template compatibility.

  // Info (blue wash)
  infoBox: {
    backgroundColor: colors.infoBg,
    borderRadius: '10px',
    padding: '18px 20px',
    margin: '24px 0',
  },
  infoTitle: {
    fontFamily: sansStack,
    fontSize: '14px',
    fontWeight: '700',
    color: colors.info,
    margin: '0 0 8px',
  },
  infoText: {
    fontFamily: sansStack,
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.text,
    margin: '0',
  },

  // Success (green wash)
  successBox: {
    backgroundColor: colors.successBg,
    borderRadius: '10px',
    padding: '18px 20px',
    margin: '24px 0',
  },
  successTitle: {
    fontFamily: sansStack,
    fontSize: '14px',
    fontWeight: '700',
    color: colors.success,
    margin: '0 0 8px',
  },
  successText: {
    fontFamily: sansStack,
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.text,
    margin: '0',
  },

  // Warning (gold wash — on-brand)
  warningBox: {
    backgroundColor: colors.warningBg,
    borderRadius: '10px',
    padding: '18px 20px',
    margin: '24px 0',
  },
  warningTitle: {
    fontFamily: sansStack,
    fontSize: '14px',
    fontWeight: '700',
    color: colors.warning,
    margin: '0 0 8px',
  },
  warningText: {
    fontFamily: sansStack,
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.text,
    margin: '0',
  },

  // Error (red wash)
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: '10px',
    padding: '18px 20px',
    margin: '24px 0',
  },
  errorTitle: {
    fontFamily: sansStack,
    fontSize: '14px',
    fontWeight: '700',
    color: colors.error,
    margin: '0 0 8px',
  },
  errorText: {
    fontFamily: sansStack,
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.text,
    margin: '0',
  },

  // Neutral (warm canvas tint)
  neutralBox: {
    backgroundColor: '#FAFAF7',
    borderRadius: '10px',
    padding: '18px 20px',
    margin: '24px 0',
  },
  neutralTitle: {
    fontFamily: sansStack,
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 8px',
  },
  neutralText: {
    fontFamily: sansStack,
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.textSecondary,
    margin: '0',
  },

  // Quote box for replies — refined with warm hairline
  quoteBox: {
    backgroundColor: '#FAFAF7',
    borderLeft: `3px solid ${colors.border}`,
    padding: '12px 16px',
    margin: '16px 0',
    borderRadius: '6px',
  },
  quoteText: {
    fontFamily: sansStack,
    fontSize: '15px',
    lineHeight: '24px',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
};
