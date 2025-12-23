/**
 * Email Service Factory
 * Main entry point for sending emails throughout the application
 * Supports easy provider swapping via configuration
 */

import type { EmailProvider, EmailConfig } from './types';
import { ResendProvider } from './providers/resend';

class EmailService {
  private static instance: EmailService;
  private provider: EmailProvider | null = null;
  private config: EmailConfig | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize email service with configuration
   */
  initialize(config?: EmailConfig): void {
    // Use environment variables if config not provided
    const finalConfig: EmailConfig = config || {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY || '',
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'verify@resend.dev',
      fromName: process.env.EMAIL_FROM_NAME || 'Crypto Wallet',
      replyTo: process.env.EMAIL_REPLY_TO,
      domain: process.env.RESEND_DOMAIN,
    };

    this.config = finalConfig;

    // Create provider based on configuration
    switch (finalConfig.provider) {
      case 'resend':
        this.provider = new ResendProvider(
          finalConfig.apiKey,
          finalConfig.fromAddress,
          finalConfig.fromName,
          finalConfig.replyTo
        );
        break;

      case 'sendgrid':
        // Future: Implement SendGrid provider
        throw new Error('SendGrid provider not implemented yet');

      case 'ses':
        // Future: Implement AWS SES provider
        throw new Error('AWS SES provider not implemented yet');

      default:
        throw new Error(`Unknown email provider: ${finalConfig.provider}`);
    }

    console.log(`[Email Service] Initialized with provider: ${finalConfig.provider}`);
  }

  /**
   * Get the email provider
   * Auto-initializes if not already initialized
   */
  getProvider(): EmailProvider {
    if (!this.provider) {
      this.initialize();
    }

    if (!this.provider) {
      throw new Error('Email provider not initialized');
    }

    return this.provider;
  }

  /**
   * Get current configuration
   */
  getConfig(): EmailConfig {
    if (!this.config) {
      this.initialize();
    }

    if (!this.config) {
      throw new Error('Email service not initialized');
    }

    return this.config;
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured(): boolean {
    try {
      const config = this.getConfig();
      return !!(config.apiKey && config.fromAddress);
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

// Helper to get provider
export function getEmailProvider(): EmailProvider {
  return emailService.getProvider();
}

// Helper to check if configured
export function isEmailConfigured(): boolean {
  return emailService.isConfigured();
}
