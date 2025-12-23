/**
 * Swap Completion Email Template
 * Sent when a swap transaction is completed
 */

import { Heading, Text, Section } from '@react-email/components';
import { BaseEmail } from './layouts/BaseEmail';
import { EmailButton } from './components/EmailButton';
import { getDashboardUrl, getTeamName, getSupportMessage, getSignature } from '../utils/branding';
import { emailStyles } from '../utils/styles';

interface SwapCompletionEmailProps {
  recipientName: string;
  fromCoin: string;
  toCoin: string;
  fromAmount: string;
  toAmount: string;
  rate?: number;
  fee?: string;
}

export function SwapCompletionEmail({
  recipientName,
  fromCoin,
  toCoin,
  fromAmount,
  toAmount,
  rate,
  fee,
}: SwapCompletionEmailProps) {
  return (
    <BaseEmail preview={`Swap completed: ${fromAmount} ${fromCoin} → ${toAmount} ${toCoin}`}>
      <Heading style={emailStyles.heading}>Swap Completed ✅</Heading>

      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        Your swap transaction has been successfully completed!
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.infoTitle}>Swap Details:</Text>
        <Text style={emailStyles.infoText}>
          <strong>You Sent:</strong> {fromAmount} {fromCoin}
          <br />
          <strong>You Received:</strong> {toAmount} {toCoin}
          {rate && (
            <>
              <br />
              <strong>Exchange Rate:</strong> 1 {fromCoin} = {rate.toFixed(8)} {toCoin}
            </>
          )}
          {fee && (
            <>
              <br />
              <strong>Network Fee:</strong> {fee} {fromCoin}
            </>
          )}
        </Text>
      </Section>

      <div style={emailStyles.buttonContainer}>
        <EmailButton href={getDashboardUrl()}>View Transaction</EmailButton>
      </div>

      <Text style={emailStyles.text}>
        Your new balance is now available in your wallet. {getSupportMessage()}
      </Text>

      <Text style={emailStyles.signature}>
        {getSignature()},
        <br />
        {getTeamName()}
      </Text>
    </BaseEmail>
  );
}

