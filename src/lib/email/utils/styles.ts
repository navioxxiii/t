/**
 * Shared Email Styles
 * Reusable style objects using branding colors
 */

import { branding } from '@/config/branding';

const colors = branding.email.colors;

export const emailStyles = {
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: colors.text,
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  text: {
    fontSize: '16px',
    lineHeight: '26px',
    color: colors.text,
    marginBottom: '16px',
  },
  textSecondary: {
    fontSize: '16px',
    lineHeight: '26px',
    color: colors.textSecondary,
    marginBottom: '16px',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '26px',
    color: colors.text,
    marginTop: '32px',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  // Info boxes
  infoBox: {
    backgroundColor: colors.infoBg,
    border: `1px solid ${colors.info}`,
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.info,
    marginBottom: '12px',
  },
  infoText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.info,
    margin: '4px 0',
  },
  // Success boxes
  successBox: {
    backgroundColor: colors.successBg,
    border: `1px solid ${colors.success}`,
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  successTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.success,
    marginBottom: '12px',
  },
  successText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.success,
    margin: '4px 0',
  },
  // Warning boxes
  warningBox: {
    backgroundColor: colors.warningBg,
    border: `1px solid ${colors.warning}`,
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  warningTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.warning,
    marginBottom: '12px',
  },
  warningText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#78350f', // Darker yellow for readability
    margin: '4px 0',
  },
  // Error boxes
  errorBox: {
    backgroundColor: colors.errorBg,
    border: `1px solid ${colors.error}`,
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  errorTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#991b1b', // Darker red for readability
    marginBottom: '12px',
  },
  errorText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#b91c1c', // Darker red for readability
    margin: '4px 0',
  },
  // Neutral boxes
  neutralBox: {
    backgroundColor: '#f3f4f6',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  neutralTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '12px',
  },
  neutralText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.textSecondary,
    margin: '4px 0',
  },
  // Quote box for replies
  quoteBox: {
    backgroundColor: '#f3f4f6', // Light gray background
    borderLeft: '4px solid #e5e7eb', // Subtle left border
    padding: '12px 16px',
    margin: '16px 0',
    borderRadius: '4px',
  },
  quoteText: {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#4b5563', // Darker gray for quote text
    fontStyle: 'italic',
  },
};

