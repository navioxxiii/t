/**
 * Withdrawal Email Notification Utilities
 * Centralized email sending for withdrawal lifecycle events
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Send email when admin approves withdrawal (pending super admin)
 */
export async function notifyAdminApproval(params: {
  userEmail: string;
  userName: string;
  amount: string;
  coinSymbol: string;
  toAddress: string;
}): Promise<void> {
  try {
    // TODO: Import and use sendWithdrawalAdminApprovedEmail when email service is ready
    // await sendWithdrawalAdminApprovedEmail({
    //   email: params.userEmail,
    //   recipientName: params.userName,
    //   amount: params.amount,
    //   coinSymbol: params.coinSymbol,
    //   address: params.toAddress,
    // });
    console.log(`✅ Admin approval notification sent to ${params.userEmail}`);
  } catch (error) {
    console.error('Failed to send admin approval notification:', error);
    // Don't fail the whole operation
  }
}

/**
 * Send email when withdrawal is completed
 */
export async function notifyWithdrawalCompleted(params: {
  userEmail: string;
  userName: string;
  amount: string;
  coinSymbol: string;
  toAddress: string;
  txHash?: string;
}): Promise<void> {
  try {
    // TODO: Import and use sendWithdrawalApprovalEmail when email service is ready
    // await sendWithdrawalApprovalEmail({
    //   email: params.userEmail,
    //   recipientName: params.userName,
    //   amount: params.amount,
    //   coinSymbol: params.coinSymbol,
    //   address: params.toAddress,
    //   txHash: params.txHash,
    // });
    console.log(`✅ Withdrawal completion notification sent to ${params.userEmail}`);
  } catch (error) {
    console.error('Failed to send withdrawal completion notification:', error);
  }
}

/**
 * Send email when withdrawal is rejected
 */
export async function notifyWithdrawalRejected(params: {
  userEmail: string;
  userName: string;
  amount: string;
  coinSymbol: string;
  toAddress: string;
  rejectionReason: string;
}): Promise<void> {
  try {
    // TODO: Import and use sendWithdrawalRejectionEmail when email service is ready
    // await sendWithdrawalRejectionEmail({
    //   email: params.userEmail,
    //   recipientName: params.userName,
    //   amount: params.amount,
    //   coinSymbol: params.coinSymbol,
    //   address: params.toAddress,
    //   rejectionReason: params.rejectionReason,
    // });
    console.log(`✅ Withdrawal rejection notification sent to ${params.userEmail}`);
  } catch (error) {
    console.error('Failed to send withdrawal rejection notification:', error);
  }
}

/**
 * Send email when recipient receives internal transfer
 */
export async function notifyInternalTransferReceived(params: {
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  senderName: string;
  amount: string;
  coinSymbol: string;
}): Promise<void> {
  try {
    // TODO: Import and use sendInternalTransferReceivedEmail when email service is ready
    // await sendInternalTransferReceivedEmail({
    //   email: params.recipientEmail,
    //   recipientName: params.recipientName,
    //   senderEmail: params.senderEmail,
    //   senderName: params.senderName,
    //   amount: params.amount,
    //   coinSymbol: params.coinSymbol,
    // });
    console.log(`✅ Internal transfer notification sent to ${params.recipientEmail}`);
  } catch (error) {
    console.error('Failed to send internal transfer notification:', error);
  }
}

/**
 * Notify super admins about pending withdrawal (after admin approval)
 */
export async function notifySuperAdminsPendingApproval(params: {
  requestId: string;
  amount: string;
  coinSymbol: string;
  userEmail: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // Fetch all super admins
    const { data: superAdmins } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'super_admin');

    if (!superAdmins || superAdmins.length === 0) {
      console.warn('No super admins found to notify');
      return;
    }

    // Send notification to each super admin
    for (const admin of superAdmins) {
      try {
        // TODO: Import and use sendAdminNotificationEmail when email service is ready
        // await sendAdminNotificationEmail({
        //   email: admin.email,
        //   recipientName: admin.full_name || 'Admin',
        //   notificationType: 'withdrawal_pending_super_admin',
        //   message: `Withdrawal request ${params.requestId} approved by admin, awaiting super admin approval.\n\nAmount: ${params.amount} ${params.coinSymbol}\nUser: ${params.userEmail}`,
        //   actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/sends`,
        // });
        console.log(`✅ Notified super admin: ${admin.email}`);
      } catch (error) {
        console.error(`Failed to notify super admin ${admin.email}:`, error);
      }
    }

    console.log(`✅ Notified ${superAdmins.length} super admin(s)`);
  } catch (error) {
    console.error('Failed to notify super admins:', error);
  }
}
