/**
 * Email System Types
 * Provider-agnostic interfaces for email operations
 */

// ============================================
// EMAIL PROVIDER INTERFACE
// ============================================

export interface EmailProvider {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  sendBatchEmail(params: BatchEmailParams): Promise<BatchEmailResult>;
}

// ============================================
// SEND EMAIL TYPES
// ============================================

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAddress {
  name: string;
  email: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// BATCH EMAIL TYPES
// ============================================

export interface BatchEmailParams {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: string;
  batchSize?: number; // For rate limiting
}

export interface BatchEmailResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  errors?: Array<{
    email: string;
    error: string;
  }>;
}

// ============================================
// EMAIL TEMPLATE TYPES
// ============================================

export type EmailTemplateType =
  | 'verification_code'
  | 'welcome'
  | 'password_reset'
  | 'transaction_notification'
  | 'withdrawal_approval'
  | 'withdrawal_rejection'
  | 'custom_admin';

export interface EmailTemplateData {
  // Common fields
  recipientName?: string;

  // Verification code
  verificationCode?: string;

  // Transaction
  transactionType?: 'deposit' | 'withdrawal' | 'swap';
  amount?: string;
  coinSymbol?: string;
  txHash?: string;

  // Withdrawal
  withdrawalAmount?: string;
  withdrawalCoin?: string;
  withdrawalAddress?: string;
  rejectionReason?: string;

  // Custom admin email
  customContent?: string;
  customSubject?: string;
}

// ============================================
// EMAIL LOG TYPES
// ============================================

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientUserId?: string;
  subject: string;
  templateType: EmailTemplateType;
  templateData?: EmailTemplateData;
  status: EmailStatus;
  errorMessage?: string;
  sentBy?: string; // Admin user ID
  resendApiId?: string;
  sentAt?: Date;
  createdAt: Date;
}

export type EmailStatus = 'queued' | 'sent' | 'failed' | 'bounced';

// ============================================
// EMAIL BATCH TYPES
// ============================================

export interface EmailBatch {
  id: string;
  subject: string;
  content: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: BatchStatus;
  createdBy: string; // Admin user ID
  createdAt: Date;
  completedAt?: Date;
}

export type BatchStatus = 'queued' | 'processing' | 'completed' | 'failed';

// ============================================
// EMAIL CONFIGURATION
// ============================================

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'ses';
  apiKey: string;
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  domain?: string;
}

// ============================================
// HELPER FUNCTION TYPES
// ============================================

export interface SendVerificationEmailParams {
  email: string;
  code: string;
  recipientName: string;
}

export interface SendPasswordResetEmailParams {
  email: string;
  code: string;
  recipientName: string;
}

export interface SendTransactionNotificationParams {
  email: string;
  recipientName: string;
  transactionType: 'deposit' | 'withdrawal' | 'swap';
  amount: string;
  coinSymbol: string;
  txHash?: string;
}

export interface SendWithdrawalNotificationParams {
  email: string;
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface SendCustomEmailParams {
  email: string | string[];
  subject: string;
  content: string;
  recipientName?: string;
  actionUrl?: string;
  actionText?: string;
}

export interface SendBatchEmailParams {
  userIds: string[];
  subject: string;
  content: string;
  senderId: string; // Admin who initiated
}

// ============================================
// NEW EMAIL TEMPLATE PARAMETER TYPES
// ============================================

export interface SendWelcomeEmailParams {
  email: string;
  recipientName: string;
}

export interface SendDepositConfirmationEmailParams {
  email: string;
  recipientName: string;
  amount: string;
  coinSymbol: string;
  txHash?: string;
  newBalance?: string;
}

export interface SendSwapCompletionEmailParams {
  email: string;
  recipientName: string;
  fromCoin: string;
  toCoin: string;
  fromAmount: string;
  toAmount: string;
  rate?: number;
  fee?: string;
}

export interface SendWithdrawalApprovalEmailParams {
  email: string;
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
  txHash?: string;
}

export interface SendWithdrawalRejectionEmailParams {
  email: string;
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
  rejectionReason: string;
}

export interface SendWithdrawalAdminApprovedEmailParams {
  email: string;
  recipientName: string;
  amount: string;
  coinSymbol: string;
  address: string;
}

export interface SendWithdrawalFailedEmailParams {
  email: string;
  recipientName: string;
  amount: string;
  coinSymbol: string;
  errorMessage: string;
}

export interface SendInternalTransferReceivedEmailParams {
  email: string;
  recipientName: string;
  amount: string;
  coinSymbol: string;
  senderEmail: string;
  senderName: string;
}

export interface SendPasswordChangedEmailParams {
  email: string;
  recipientName: string;
  timestamp?: string;
}

export interface SendPinChangedEmailParams {
  email: string;
  recipientName: string;
  timestamp?: string;
}

export interface SendSecurityAlertEmailParams {
  email: string;
  recipientName: string;
  alertType: 'pin_lockout' | 'suspicious_activity' | 'account_compromised';
  message: string;
  lockDuration?: number;
}

export interface SendKYCApprovalEmailParams {
  email: string;
  recipientName: string;
  tier: string;
  limits: {
    daily_limit_usd: number;
    monthly_limit_usd?: number;
  };
  verificationDate?: string;
}

export interface SendKYCRejectionEmailParams {
  email: string;
  recipientName: string;
  rejectionReason: string;
  resubmitUrl: string;
}

export interface SendAccountBannedEmailParams {
  email: string;
  recipientName: string;
  reason: string;
  bannedAt?: string;
}

export interface SendAccountUnbannedEmailParams {
  email: string;
  recipientName: string;
}

export interface SendAdminCreatedUserWelcomeEmailParams {
  email: string;
  recipientName: string;
  tempPassword: string;
  loginUrl?: string;
  changePasswordUrl?: string;
}

export interface SendCopyTradeSpotAvailableEmailParams {
  email: string;
  recipientName: string;
  traderName: string;
  strategy: string;
  roiMin: number;
  roiMax: number;
  performanceFee: number;
  riskLevel: string;
  claimUrl: string;
  expiryHours?: number;
}

export interface SendCopyTradeStartedEmailParams {
  email: string;
  recipientName: string;
  traderName: string;
  allocationAmount: number;
  dailyPnlRate: number;
}

export interface SendCopyTradeStoppedEmailParams {
  email: string;
  recipientName: string;
  traderName: string;
  allocation: number;
  profit: number;
  traderFee: number;
  totalReceived: number;
}

export interface SendCopyTradeClaimedEmailParams {
  email: string;
  recipientName: string;
  traderName: string;
  allocationAmount: number;
  dailyPnlRate: number;
}

export interface SendEarnInvestmentStartedEmailParams {
  email: string;
  recipientName: string;
  vaultTitle: string;
  investmentAmount: number;
  apyPercent: number;
  durationMonths: number;
  totalProfit: number;
  matureDate: string;
}

export interface SendEarnClaimCompletedEmailParams {
  email: string;
  recipientName: string;
  vaultTitle: string;
  principal: number;
  profit: number;
  totalPayout: number;
}

export interface SendAdminNotificationEmailParams {
  email: string;
  recipientName: string;
  notificationType: string;
  message: string;
  actionUrl?: string;
}

export interface SendSupportTicketReplyEmailParams {
  email: string;
  recipientName?: string;
  replyContent: string;
  ticketUrl: string;
  ticketNumber: string;
}

export interface SendSupportTicketCreatedEmailParams {
  email: string;
  recipientName?: string;
  ticketNumber: string;
  subject: string;
  category: string;
  ticketUrl: string;
  isGuest?: boolean;
}

export interface SendSupportTicketInactivityReminderEmailParams {
  email: string;
  recipientName?: string;
  ticketUrl: string;
  ticketNumber: string;
}
