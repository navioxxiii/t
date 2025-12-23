/**
 * Email Helper Functions
 * High-level business logic for sending emails
 */

import { SupportTicketReplyEmail } from './templates/SupportTicketReplyEmail';
import { SupportTicketCreatedEmail } from './templates/SupportTicketCreatedEmail';
import { SupportTicketInactivityReminderEmail } from './templates/SupportTicketInactivityReminderEmail';
import { render } from '@react-email/render';
import { getEmailProvider } from './service';
import { getAppName } from './utils/branding';
import { VerificationCodeEmail } from './templates/VerificationCodeEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { DepositConfirmationEmail } from './templates/DepositConfirmationEmail';
import { SwapCompletionEmail } from './templates/SwapCompletionEmail';
import { WithdrawalApprovalEmail } from './templates/WithdrawalApprovalEmail';
import { WithdrawalRejectionEmail } from './templates/WithdrawalRejectionEmail';
import { WithdrawalAdminApprovedEmail } from './templates/WithdrawalAdminApprovedEmail';
import { WithdrawalFailedEmail } from './templates/WithdrawalFailedEmail';
import { InternalTransferReceivedEmail } from './templates/InternalTransferReceivedEmail';
import { PasswordChangedEmail } from './templates/PasswordChangedEmail';
import { PasswordResetEmail } from './templates/PasswordResetEmail';
import { PinChangedEmail } from './templates/PinChangedEmail';
import { SecurityAlertEmail } from './templates/SecurityAlertEmail';
import { KYCApprovalEmail } from './templates/KYCApprovalEmail';
import { KYCRejectionEmail } from './templates/KYCRejectionEmail';
import { AccountBannedEmail } from './templates/AccountBannedEmail';
import { AccountUnbannedEmail } from './templates/AccountUnbannedEmail';
import { AdminCreatedUserWelcomeEmail } from './templates/AdminCreatedUserWelcomeEmail';
import { CopyTradeSpotAvailableEmail } from './templates/CopyTradeSpotAvailableEmail';
import { CopyTradeStartedEmail } from './templates/CopyTradeStartedEmail';
import { CopyTradeStoppedEmail } from './templates/CopyTradeStoppedEmail';
import { CopyTradeClaimedEmail } from './templates/CopyTradeClaimedEmail';
import { EarnInvestmentStartedEmail } from './templates/EarnInvestmentStartedEmail';
import { EarnClaimCompletedEmail } from './templates/EarnClaimCompletedEmail';
import { AdminNotificationEmail } from './templates/AdminNotificationEmail';
import { CustomEmail } from './templates/CustomEmail';
import type {
  SendVerificationEmailParams,
  SendPasswordResetEmailParams,
  SendTransactionNotificationParams,
  SendWithdrawalNotificationParams,
  SendCustomEmailParams,
  SendWelcomeEmailParams,
  SendDepositConfirmationEmailParams,
  SendSwapCompletionEmailParams,
  SendWithdrawalApprovalEmailParams,
  SendWithdrawalRejectionEmailParams,
  SendWithdrawalAdminApprovedEmailParams,
  SendWithdrawalFailedEmailParams,
  SendInternalTransferReceivedEmailParams,
  SendPasswordChangedEmailParams,
  SendPinChangedEmailParams,
  SendSecurityAlertEmailParams,
  SendKYCApprovalEmailParams,
  SendKYCRejectionEmailParams,
  SendAccountBannedEmailParams,
  SendAccountUnbannedEmailParams,
  SendAdminCreatedUserWelcomeEmailParams,
  SendCopyTradeSpotAvailableEmailParams,
  SendCopyTradeStartedEmailParams,
  SendCopyTradeStoppedEmailParams,
  SendCopyTradeClaimedEmailParams,
  SendEarnInvestmentStartedEmailParams,
  SendEarnClaimCompletedEmailParams,
  SendAdminNotificationEmailParams,
  SendSupportTicketReplyEmailParams,
  SendSupportTicketCreatedEmailParams,
  SendSupportTicketInactivityReminderEmailParams,
} from './types';

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  params: SendVerificationEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      VerificationCodeEmail({
        recipientName: params.recipientName,
        verificationCode: params.code,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: 'Verify Your Email - Crypto Wallet',
      html,
      text: `Hi ${params.recipientName},\n\nYour verification code is: ${params.code}\n\nThis code expires in 10 minutes.\n\nIf you didn't create an account, you can safely ignore this email.`,
    });

    if (result.success) {
      console.log(`[Email] Verification code sent to ${params.email}`);
    } else {
      console.error(`[Email] Failed to send verification code: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Unexpected error sending verification code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send password reset code email
 */
export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      PasswordResetEmail({
        recipientName: params.recipientName,
        resetCode: params.code,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: 'Reset Your Password - Crypto Wallet',
      html,
      text: `Hi ${params.recipientName},\n\nWe received a request to reset your password. Your verification code is: ${params.code}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.`,
    });

    if (result.success) {
      console.log(`[Email] Password reset code sent to ${params.email}`);
    } else {
      console.error(`[Email] Failed to send password reset code: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Unexpected error sending password reset code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send transaction notification email
 */
export async function sendTransactionNotification(
  params: SendTransactionNotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const typeLabel =
      params.transactionType === 'deposit'
        ? 'Deposit'
        : params.transactionType === 'withdrawal'
        ? 'Withdrawal'
        : 'Swap';

    const subject = `${typeLabel} ${params.transactionType === 'deposit' ? 'Received' : 'Completed'} - ${params.amount} ${params.coinSymbol}`;

    // Simple text email for now - can create HTML template later
    const text = `Hi ${params.recipientName},\n\nYour ${params.transactionType} of ${params.amount} ${params.coinSymbol} has been ${params.transactionType === 'deposit' ? 'received' : 'completed'}.\n\n${params.txHash ? `Transaction Hash: ${params.txHash}\n\n` : ''}Best regards,\nThe Crypto Wallet Team`;

    const result = await provider.sendEmail({
      to: params.email,
      subject,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
      text,
    });

    if (result.success) {
      console.log(`[Email] Transaction notification sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending transaction notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send withdrawal notification (approval or rejection)
 */
export async function sendWithdrawalNotification(
  params: SendWithdrawalNotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const subject = params.approved
      ? `Withdrawal Approved - ${params.amount} ${params.coinSymbol}`
      : `Withdrawal Rejected - ${params.amount} ${params.coinSymbol}`;

    const text = params.approved
      ? `Hi ${params.recipientName},\n\nGood news! Your withdrawal request for ${params.amount} ${params.coinSymbol} to ${params.address} has been approved and processed.\n\nBest regards,\nThe Crypto Wallet Team`
      : `Hi ${params.recipientName},\n\nYour withdrawal request for ${params.amount} ${params.coinSymbol} has been rejected.\n\nReason: ${params.rejectionReason || 'Not specified'}\n\nIf you have questions, please contact our support team.\n\nBest regards,\nThe Crypto Wallet Team`;

    const result = await provider.sendEmail({
      to: params.email,
      subject,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
      text,
    });

    if (result.success) {
      console.log(`[Email] Withdrawal notification sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending withdrawal notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send custom email (for admin use)
 */
export async function sendCustomEmail(
  params: SendCustomEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();
    const appName = getAppName();

    // Determine if content is HTML
    const isHtml = params.content.includes('<') && params.content.includes('>');

    // For single recipient, use React template
    if (typeof params.email === 'string') {
      const html = await render(
        CustomEmail({
          recipientName: params.recipientName,
          subject: params.subject,
          content: params.content,
          actionUrl: params.actionUrl,
          actionText: params.actionText,
          isHtml,
        })
      );

      const result = await provider.sendEmail({
        to: params.email,
        subject: params.subject,
        html,
        text: isHtml
          ? params.content.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n')
          : params.content,
      });

      if (result.success) {
        console.log(`[Email] Custom email sent to ${params.email}`);
      }

      return result;
    }

    // For multiple recipients (batch), render once and send to all
    const html = await render(
      CustomEmail({
        recipientName: params.recipientName,
        subject: params.subject,
        content: params.content,
        actionUrl: params.actionUrl,
        actionText: params.actionText,
        isHtml,
      })
    );

    const emailArray = Array.isArray(params.email) ? params.email : [params.email];
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Send to each recipient
    for (const email of emailArray) {
      try {
        const result = await provider.sendEmail({
          to: email,
          subject: params.subject,
          html,
          text: isHtml
            ? params.content.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n')
            : params.content,
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${email}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        errorCount++;
        errors.push(
          `${email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (successCount > 0) {
      console.log(
        `[Email] Custom email sent to ${successCount} recipient(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      );
    }

    return {
      success: errorCount === 0,
      error:
        errorCount > 0
          ? `${errorCount} failed: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`
          : undefined,
    };
  } catch (error) {
    console.error('[Email] Error sending custom email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email (after email verification)
 */
export async function sendWelcomeEmail(
  params: SendWelcomeEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();
    const appName = getAppName();

    const html = await render(
      WelcomeEmail({
        recipientName: params.recipientName,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Welcome to ${appName}!`,
      html,
      text: `Hi ${params.recipientName},\n\nWelcome to ${appName}! Your email has been verified and your account is now fully active.\n\nYou can now:\n• Deposit cryptocurrencies\n• Send and receive payments\n• Swap between different coins\n• Track your portfolio\n• Earn passive income\n• Copy trade with top traders\n\nIf you have any questions, our support team is here to help.\n\nBest regards,\nThe ${appName} Team`,
    });

    if (result.success) {
      console.log(`[Email] Welcome email sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send deposit confirmation email
 */
export async function sendDepositConfirmationEmail(
  params: SendDepositConfirmationEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      DepositConfirmationEmail({
        recipientName: params.recipientName,
        amount: params.amount,
        coinSymbol: params.coinSymbol,
        txHash: params.txHash,
        newBalance: params.newBalance,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Deposit Received: ${params.amount} ${params.coinSymbol}`,
      html,
      text: `Hi ${params.recipientName},\n\nGreat news! Your deposit of ${params.amount} ${params.coinSymbol} has been successfully received and confirmed.\n\n${params.newBalance ? `New Balance: ${params.newBalance} ${params.coinSymbol}\n` : ''}${params.txHash ? `Transaction Hash: ${params.txHash}\n` : ''}\nYour funds are now available in your wallet.`,
    });

    if (result.success) {
      console.log(`[Email] Deposit confirmation sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending deposit confirmation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send swap completion email
 */
export async function sendSwapCompletionEmail(
  params: SendSwapCompletionEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      SwapCompletionEmail({
        recipientName: params.recipientName,
        fromCoin: params.fromCoin,
        toCoin: params.toCoin,
        fromAmount: params.fromAmount,
        toAmount: params.toAmount,
        rate: params.rate,
        fee: params.fee,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Swap Completed: ${params.fromAmount} ${params.fromCoin} → ${params.toAmount} ${params.toCoin}`,
      html,
      text: `Hi ${params.recipientName},\n\nYour swap transaction has been successfully completed!\n\nYou Sent: ${params.fromAmount} ${params.fromCoin}\nYou Received: ${params.toAmount} ${params.toCoin}\n${params.rate ? `Exchange Rate: 1 ${params.fromCoin} = ${params.rate.toFixed(8)} ${params.toCoin}\n` : ''}${params.fee ? `Network Fee: ${params.fee} ${params.fromCoin}\n` : ''}\nYour new balance is now available in your wallet.`,
    });

    if (result.success) {
      console.log(`[Email] Swap completion sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending swap completion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send withdrawal approval email
 */
export async function sendWithdrawalApprovalEmail(
  params: SendWithdrawalApprovalEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      WithdrawalApprovalEmail({
        recipientName: params.recipientName,
        amount: params.amount,
        coinSymbol: params.coinSymbol,
        address: params.address,
        txHash: params.txHash,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Withdrawal Approved: ${params.amount} ${params.coinSymbol}`,
      html,
      text: `Hi ${params.recipientName},\n\nGood news! Your withdrawal request has been approved and processed successfully.\n\nAmount: ${params.amount} ${params.coinSymbol}\nTo Address: ${params.address}\n${params.txHash ? `Transaction Hash: ${params.txHash}\n` : ''}\nPlease verify the transaction on the blockchain.`,
    });

    if (result.success) {
      console.log(`[Email] Withdrawal approval sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending withdrawal approval:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send withdrawal rejection email
 */
export async function sendWithdrawalRejectionEmail(
  params: SendWithdrawalRejectionEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      WithdrawalRejectionEmail({
        recipientName: params.recipientName,
        amount: params.amount,
        coinSymbol: params.coinSymbol,
        address: params.address,
        rejectionReason: params.rejectionReason,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Withdrawal Rejected: ${params.amount} ${params.coinSymbol}`,
      html,
      text: `Hi ${params.recipientName},\n\nWe regret to inform you that your withdrawal request has been rejected. Your funds have been returned to your wallet balance.\n\nAmount: ${params.amount} ${params.coinSymbol}\nTo Address: ${params.address}\n\nRejection Reason: ${params.rejectionReason}\n\nIf you have questions about this decision, please contact our support team.`,
    });

    if (result.success) {
      console.log(`[Email] Withdrawal rejection sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending withdrawal rejection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send withdrawal admin approved email (pending super admin)
 */
export async function sendWithdrawalAdminApprovedEmail(
  params: SendWithdrawalAdminApprovedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      WithdrawalAdminApprovedEmail({
        recipientName: params.recipientName,
        amount: params.amount,
        coinSymbol: params.coinSymbol,
        address: params.address,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Withdrawal Approved by Admin: ${params.amount} ${params.coinSymbol}`,
      html,
      text: `Hi ${params.recipientName},\n\nYour withdrawal request has been approved by an admin and is now pending final approval from a super admin before being processed.\n\nAmount: ${params.amount} ${params.coinSymbol}\nTo Address: ${params.address}\nStatus: Awaiting Super Admin Approval\n\nWe'll notify you as soon as your withdrawal is processed.`,
    });

    if (result.success) {
      console.log(`[Email] Withdrawal admin approval sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending withdrawal admin approval:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send withdrawal failed email
 */
export async function sendWithdrawalFailedEmail(
  params: SendWithdrawalFailedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      WithdrawalFailedEmail({
        recipientName: params.recipientName,
        amount: params.amount,
        coinSymbol: params.coinSymbol,
        errorMessage: params.errorMessage,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Withdrawal Failed: ${params.amount} ${params.coinSymbol}`,
      html,
      text: `Hi ${params.recipientName},\n\nWe encountered an issue while processing your withdrawal request. Your funds have been returned to your wallet balance and are safe.\n\nAmount: ${params.amount} ${params.coinSymbol}\nStatus: Failed\n\nError: ${params.errorMessage}\n\nYour funds are safe and have been returned to your wallet. You can try the withdrawal again.`,
    });

    if (result.success) {
      console.log(`[Email] Withdrawal failed notification sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending withdrawal failed notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send internal transfer received email
 */
export async function sendInternalTransferReceivedEmail(
  params: SendInternalTransferReceivedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      InternalTransferReceivedEmail({
        recipientName: params.recipientName,
        amount: params.amount,
        coinSymbol: params.coinSymbol,
        senderEmail: params.senderEmail,
        senderName: params.senderName,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `You Received ${params.amount} ${params.coinSymbol} from ${params.senderName}`,
      html,
      text: `Hi ${params.recipientName},\n\nYou've received a transfer from ${params.senderName} (${params.senderEmail}).\n\nAmount: ${params.amount} ${params.coinSymbol}\nFrom: ${params.senderName} (${params.senderEmail})\nType: Internal Transfer\n\nYour funds have been credited to your wallet and are now available for use.`,
    });

    if (result.success) {
      console.log(`[Email] Internal transfer received sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending internal transfer received:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send password changed email
 */
export async function sendPasswordChangedEmail(
  params: SendPasswordChangedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      PasswordChangedEmail({
        recipientName: params.recipientName,
        timestamp: params.timestamp,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: 'Password Changed Successfully',
      html,
      text: `Hi ${params.recipientName},\n\nThis is a confirmation that your password has been successfully changed.${params.timestamp ? ` The change was made on ${new Date(params.timestamp).toLocaleString()}.` : ''}\n\nIf you didn't make this change, please contact our support team immediately to secure your account.`,
    });

    if (result.success) {
      console.log(`[Email] Password changed notification sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending password changed notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send PIN changed email
 */
export async function sendPinChangedEmail(
  params: SendPinChangedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      PinChangedEmail({
        recipientName: params.recipientName,
        timestamp: params.timestamp,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: 'Transaction PIN Changed Successfully',
      html,
      text: `Hi ${params.recipientName},\n\nThis is a confirmation that your transaction PIN has been successfully changed.${params.timestamp ? ` The change was made on ${new Date(params.timestamp).toLocaleString()}.` : ''}\n\nIf you didn't make this change, please contact our support team immediately to secure your account.`,
    });

    if (result.success) {
      console.log(`[Email] PIN changed notification sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending PIN changed notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send security alert email
 */
export async function sendSecurityAlertEmail(
  params: SendSecurityAlertEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const getAlertTitle = () => {
      switch (params.alertType) {
        case 'pin_lockout':
          return 'Account Temporarily Locked';
        case 'suspicious_activity':
          return 'Security Alert: Suspicious Activity Detected';
        case 'account_compromised':
          return 'Security Alert: Account Security';
        default:
          return 'Security Alert';
      }
    };

    const html = await render(
      SecurityAlertEmail({
        recipientName: params.recipientName,
        alertType: params.alertType,
        message: params.message,
        lockDuration: params.lockDuration,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: getAlertTitle(),
      html,
      text: `Hi ${params.recipientName},\n\n${params.message}\n\n${params.alertType === 'pin_lockout' && params.lockDuration ? `Lock Duration: ${params.lockDuration} seconds\n\n` : ''}If you have any concerns about your account security, please contact our support team immediately.`,
    });

    if (result.success) {
      console.log(`[Email] Security alert sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending security alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send KYC approval email
 */
export async function sendKYCApprovalEmail(
  params: SendKYCApprovalEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const getTierDisplay = () => {
      switch (params.tier) {
        case 'tier_1_basic':
          return 'Tier 1 - Basic';
        case 'tier_2_advanced':
          return 'Tier 2 - Advanced';
        case 'tier_3_enhanced':
          return 'Tier 3 - Enhanced';
        default:
          return params.tier;
      }
    };

    const html = await render(
      KYCApprovalEmail({
        recipientName: params.recipientName,
        tier: params.tier,
        limits: params.limits,
        verificationDate: params.verificationDate,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: 'KYC Verification Approved!',
      html,
      text: `Hi ${params.recipientName},\n\nGreat news! Your KYC verification has been successfully approved.\n\nVerification Tier: ${getTierDisplay()}\n${params.verificationDate ? `Verified On: ${new Date(params.verificationDate).toLocaleDateString()}\n` : ''}\nYour New Transaction Limits:\nDaily Limit: $${params.limits.daily_limit_usd.toLocaleString()} USD${params.limits.monthly_limit_usd ? `\nMonthly Limit: $${params.limits.monthly_limit_usd.toLocaleString()} USD` : ''}\n\nYou can now enjoy all the benefits of a verified account!`,
    });

    if (result.success) {
      console.log(`[Email] KYC approval sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending KYC approval:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send KYC rejection email
 */
export async function sendKYCRejectionEmail(
  params: SendKYCRejectionEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      KYCRejectionEmail({
        recipientName: params.recipientName,
        rejectionReason: params.rejectionReason,
        resubmitUrl: params.resubmitUrl,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: 'KYC Verification Update',
      html,
      text: `Hi ${params.recipientName},\n\nWe've reviewed your KYC verification submission, but we need some additional information or clarification to complete the process.\n\nReason: ${params.rejectionReason}\n\nYou can resubmit your KYC verification at any time. Our support team is here to help if you have any questions.`,
    });

    if (result.success) {
      console.log(`[Email] KYC rejection sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending KYC rejection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send account banned email
 */
export async function sendAccountBannedEmail(
  params: SendAccountBannedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      AccountBannedEmail({
        recipientName: params.recipientName,
        reason: params.reason,
        bannedAt: params.bannedAt,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: 'Account Suspended',
      html,
      text: `Hi ${params.recipientName},\n\nWe regret to inform you that your account has been temporarily suspended. This action was taken in accordance with our Terms of Service.\n\nReason for Suspension: ${params.reason}${params.bannedAt ? `\nSuspended on: ${new Date(params.bannedAt).toLocaleString()}` : ''}\n\nIf you believe this is an error or would like to appeal this decision, please contact our support team.`,
    });

    if (result.success) {
      console.log(`[Email] Account banned notification sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending account banned notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send account unbanned email
 */
export async function sendAccountUnbannedEmail(
  params: SendAccountUnbannedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      AccountUnbannedEmail({
        recipientName: params.recipientName,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: 'Account Access Restored',
      html,
      text: `Hi ${params.recipientName},\n\nGreat news! Your account suspension has been lifted and your account access has been fully restored.\n\nYour account is now active:\n• You can access all features\n• All your funds are available\n• You can make transactions again\n\nThank you for your patience!`,
    });

    if (result.success) {
      console.log(`[Email] Account unbanned notification sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending account unbanned notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send admin created user welcome email
 */
export async function sendAdminCreatedUserWelcomeEmail(
  params: SendAdminCreatedUserWelcomeEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();
    const appName = getAppName();

    const html = await render(
      AdminCreatedUserWelcomeEmail({
        recipientName: params.recipientName,
        tempPassword: params.tempPassword,
        loginUrl: params.loginUrl,
        changePasswordUrl: params.changePasswordUrl,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Welcome to ${appName}! Your account has been created`,
      html,
      text: `Hi ${params.recipientName},\n\nYour account has been created by our admin team. Welcome to ${appName}!\n\nImportant: Temporary Password\nYour temporary password is: ${params.tempPassword}\n\nPlease change your password immediately after logging in for security.\n\nNext Steps:\n1. Log in with your email and the temporary password above\n2. Change your password immediately\n3. Set up your security preferences\n4. Start using your wallet`,
    });

    if (result.success) {
      console.log(`[Email] Admin created user welcome sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending admin created user welcome:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send copy trade spot available email
 */
export async function sendCopyTradeSpotAvailableEmail(
  params: SendCopyTradeSpotAvailableEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      CopyTradeSpotAvailableEmail({
        recipientName: params.recipientName,
        traderName: params.traderName,
        strategy: params.strategy,
        roiMin: params.roiMin,
        roiMax: params.roiMax,
        performanceFee: params.performanceFee,
        riskLevel: params.riskLevel,
        claimUrl: params.claimUrl,
        expiryHours: params.expiryHours,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Your Spot is Ready - ${params.traderName} | Copy Trading`,
      html,
      text: `Hi ${params.recipientName},\n\nA spot has opened up for ${params.traderName}! You're next in line to start copying this trader.\n\n${params.traderName}\nStrategy: ${params.strategy}\nMonthly ROI: ${params.roiMin}% - ${params.roiMax}%\nPerformance Fee: ${params.performanceFee}%\nRisk Level: ${params.riskLevel}\n\n⏰ You have ${params.expiryHours || 24} hours to claim this spot.\n\nDon't miss this opportunity!`,
    });

    if (result.success) {
      console.log(`[Email] Copy trade spot available sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending copy trade spot available:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send copy trade started email
 */
export async function sendCopyTradeStartedEmail(
  params: SendCopyTradeStartedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      CopyTradeStartedEmail({
        recipientName: params.recipientName,
        traderName: params.traderName,
        allocationAmount: params.allocationAmount,
        dailyPnlRate: params.dailyPnlRate,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Copy Trading Started: ${params.traderName}`,
      html,
      text: `Hi ${params.recipientName},\n\nGreat news! You've successfully started copying ${params.traderName}.\n\nPosition Details:\nTrader: ${params.traderName}\nAllocation: ${params.allocationAmount.toFixed(2)} USDT\nEstimated Daily P&L: ${params.dailyPnlRate.toFixed(4)} USDT\n\nYour funds will automatically follow the trader's positions and you'll earn profits based on their performance.`,
    });

    if (result.success) {
      console.log(`[Email] Copy trade started sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending copy trade started:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send copy trade stopped email
 */
export async function sendCopyTradeStoppedEmail(
  params: SendCopyTradeStoppedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      CopyTradeStoppedEmail({
        recipientName: params.recipientName,
        traderName: params.traderName,
        allocation: params.allocation,
        profit: params.profit,
        traderFee: params.traderFee,
        totalReceived: params.totalReceived,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Copy Trading Stopped: ${params.traderName}`,
      html,
      text: `Hi ${params.recipientName},\n\nYour copy trading position with ${params.traderName} has been stopped.\n\nPosition Summary:\nTrader: ${params.traderName}\nInitial Allocation: ${params.allocation.toFixed(2)} USDT\nTotal Profit: ${params.profit.toFixed(2)} USDT\nPerformance Fee (${params.traderFee.toFixed(2)}%): ${(params.profit * (params.traderFee / 100)).toFixed(2)} USDT\nTotal Received: ${params.totalReceived.toFixed(2)} USDT\n\nYour funds have been credited to your wallet.`,
    });

    if (result.success) {
      console.log(`[Email] Copy trade stopped sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending copy trade stopped:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send copy trade claimed email
 */
export async function sendCopyTradeClaimedEmail(
  params: SendCopyTradeClaimedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      CopyTradeClaimedEmail({
        recipientName: params.recipientName,
        traderName: params.traderName,
        allocationAmount: params.allocationAmount,
        dailyPnlRate: params.dailyPnlRate,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Spot Claimed: ${params.traderName} | Copy Trading`,
      html,
      text: `Hi ${params.recipientName},\n\nCongratulations! You've successfully claimed your spot and started copying ${params.traderName}.\n\nPosition Details:\nTrader: ${params.traderName}\nAllocation: ${params.allocationAmount.toFixed(2)} USDT\nEstimated Daily P&L: ${params.dailyPnlRate.toFixed(4)} USDT\n\nYour funds will automatically follow the trader's positions and you'll earn profits based on their performance.`,
    });

    if (result.success) {
      console.log(`[Email] Copy trade claimed sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending copy trade claimed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send earn investment started email
 */
export async function sendEarnInvestmentStartedEmail(
  params: SendEarnInvestmentStartedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      EarnInvestmentStartedEmail({
        recipientName: params.recipientName,
        vaultTitle: params.vaultTitle,
        investmentAmount: params.investmentAmount,
        apyPercent: params.apyPercent,
        durationMonths: params.durationMonths,
        totalProfit: params.totalProfit,
        matureDate: params.matureDate,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Earn Investment Started: ${params.vaultTitle}`,
      html,
      text: `Hi ${params.recipientName},\n\nYour earn investment has been successfully started!\n\nInvestment Details:\nVault: ${params.vaultTitle}\nInvestment Amount: ${params.investmentAmount.toFixed(2)} USDT\nAPY: ${params.apyPercent}%\nDuration: ${params.durationMonths} ${params.durationMonths === 1 ? 'month' : 'months'}\nExpected Profit: ${params.totalProfit.toFixed(2)} USDT\nMaturity Date: ${new Date(params.matureDate).toLocaleDateString()}\n\nYour investment is now active and earning!`,
    });

    if (result.success) {
      console.log(`[Email] Earn investment started sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending earn investment started:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send earn claim completed email
 */
export async function sendEarnClaimCompletedEmail(
  params: SendEarnClaimCompletedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      EarnClaimCompletedEmail({
        recipientName: params.recipientName,
        vaultTitle: params.vaultTitle,
        principal: params.principal,
        profit: params.profit,
        totalPayout: params.totalPayout,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Earn Claim Completed: ${params.totalPayout.toFixed(2)} USDT`,
      html,
      text: `Hi ${params.recipientName},\n\nCongratulations! Your earn investment in ${params.vaultTitle} has matured and your funds have been successfully claimed.\n\nPayout Summary:\nVault: ${params.vaultTitle}\nPrincipal: ${params.principal.toFixed(2)} USDT\nProfit Earned: ${params.profit.toFixed(2)} USDT\nTotal Payout: ${params.totalPayout.toFixed(2)} USDT\n\nYour funds have been credited to your wallet.`,
    });

    if (result.success) {
      console.log(`[Email] Earn claim completed sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending earn claim completed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send admin notification email
 */
export async function sendAdminNotificationEmail(
  params: SendAdminNotificationEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const getNotificationTitle = () => {
      switch (params.notificationType) {
        case 'withdrawal_pending_super_admin':
          return 'Withdrawal Pending Super Admin Approval';
        case 'kyc_submission_pending':
          return 'New KYC Submission Pending Review';
        case 'large_transaction':
          return 'Large Transaction Alert';
        case 'suspicious_activity':
          return 'Suspicious Activity Detected';
        default:
          return 'Admin Notification';
      }
    };

    const html = await render(
      AdminNotificationEmail({
        recipientName: params.recipientName,
        notificationType: params.notificationType,
        message: params.message,
        actionUrl: params.actionUrl,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: getNotificationTitle(),
      html,
      text: `Hi ${params.recipientName},\n\n${params.message}\n\nNotification Type: ${params.notificationType}\nTime: ${new Date().toLocaleString()}\n\nPlease review this notification and take appropriate action if needed.`,
    });

    if (result.success) {
      console.log(`[Email] Admin notification sent to ${params.email}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending admin notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email when a support ticket is created
 */
export async function sendSupportTicketCreatedEmail(
  params: SendSupportTicketCreatedEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      SupportTicketCreatedEmail({
        recipientName: params.recipientName,
        ticketNumber: params.ticketNumber,
        subject: params.subject,
        category: params.category,
        ticketUrl: params.ticketUrl,
        isGuest: params.isGuest,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Support Ticket #${params.ticketNumber} Created`,
      html,
      text: `Your support ticket #${params.ticketNumber} has been created. Subject: ${params.subject}. Our team will review it shortly. View it here: ${params.ticketUrl}`,
    });

    if (result.success) {
      console.log(`[Email] Ticket creation confirmation sent for #${params.ticketNumber} to ${params.email}`);
    } else {
      console.error(`[Email] Failed to send ticket creation email for #${params.ticketNumber}: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending support ticket created email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email when an admin replies to a support ticket
 */
export async function sendSupportTicketReplyEmail(
  params: SendSupportTicketReplyEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      SupportTicketReplyEmail({
        recipientName: params.recipientName,
        replyContent: params.replyContent,
        ticketUrl: params.ticketUrl,
        ticketNumber: params.ticketNumber,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `New Reply to Support Ticket #${params.ticketNumber}`,
      html,
      text: `A new reply has been added to your support ticket #${params.ticketNumber}. View it here: ${params.ticketUrl}`,
    });

    if (result.success) {
      console.log(`✅ Email notification sent for ticket #${params.ticketNumber} to ${params.email}`);
    } else {
      console.error(`❌ Failed to send reply email for ticket #${params.ticketNumber}: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending support ticket reply email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email to remind user about inactive support ticket
 */
export async function sendSupportTicketInactivityReminderEmail(
  params: SendSupportTicketInactivityReminderEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEmailProvider();

    const html = await render(
      SupportTicketInactivityReminderEmail({
        recipientName: params.recipientName,
        ticketUrl: params.ticketUrl,
        ticketNumber: params.ticketNumber,
      })
    );

    const result = await provider.sendEmail({
      to: params.email,
      subject: `Action Required for Support Ticket #${params.ticketNumber}`,
      html,
      text: `We are waiting for your response on support ticket #${params.ticketNumber}. Please provide an update so we can continue to assist you. If we don't hear back from you, this ticket will be automatically closed soon. View it here: ${params.ticketUrl}`,
    });

    if (result.success) {
      console.log(`✅ Inactivity reminder sent for ticket #${params.ticketNumber} to ${params.email}`);
    } else {
      console.error(`❌ Failed to send inactivity reminder for ticket #${params.ticketNumber}: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('[Email] Error sending support ticket inactivity reminder email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

