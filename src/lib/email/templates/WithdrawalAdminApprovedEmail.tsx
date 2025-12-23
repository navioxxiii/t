/**
 * Withdrawal Admin Approved Email Template
 * Sent when withdrawal is approved by admin (awaiting super admin)
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getActivityUrl, getTeamName, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface WithdrawalAdminApprovedEmailProps {
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
}

export function WithdrawalAdminApprovedEmail({
  recipientName,
  amount,
  coinSymbol,
  address,
}: WithdrawalAdminApprovedEmailProps) {
  return (
    <BaseEmail preview={`Withdrawal approved by admin: ${amount} ${coinSymbol}`}>
      <Heading style={emailStyles.heading}>Withdrawal Approved by Admin</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Your withdrawal request has been approved by an admin and is now pending final approval from a super admin before being processed.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoTitle}>Withdrawal Details:</Text>
        <Text style={emailStyles.infoText}>
          <strong>Amount:</strong> {amount} {coinSymbol}
          <br />
          <strong>To Address:</strong> {address}
          <br />
          <strong>Status:</strong> Awaiting Super Admin Approval
        </Text>
      </Section>

      <Section style={emailStyles.warningBox}>
        <Text style={emailStyles.warningText}>
          <strong>What happens next:</strong>
          <br />
          • Your request is now in the final approval stage
          <br />
          • A super admin will review and process your withdrawal
          <br />
          • You&apos;ll receive another email once the withdrawal is sent
          <br />
          • This usually takes a few hours
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getActivityUrl()}>View Transaction</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        We&apos;ll notify you as soon as your withdrawal is processed. Thank you for your patience!
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}
