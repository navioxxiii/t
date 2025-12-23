/**
 * Resend Email Provider Implementation
 * Implements the EmailProvider interface using Resend API
 */

import { Resend } from 'resend';
import type {
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
  BatchEmailParams,
  BatchEmailResult,
} from '../types';

export class ResendProvider implements EmailProvider {
  private client: Resend;
  private defaultFrom: { name: string; email: string };
  private defaultReplyTo?: string;

  constructor(
    apiKey: string,
    fromAddress: string,
    fromName: string,
    replyTo?: string
  ) {
    this.client = new Resend(apiKey);
    this.defaultFrom = { name: fromName, email: fromAddress };
    this.defaultReplyTo = replyTo;
  }

  /**
   * Send a single email
   */
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: params.from
          ? `${params.from.name} <${params.from.email}>`
          : `${this.defaultFrom.name} <${this.defaultFrom.email}>`,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo || this.defaultReplyTo,
        attachments: params.attachments,
      });

      if (error) {
        console.error('[Resend] Email send error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('[Resend] Unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send batch emails with rate limiting
   * Resend free tier: 10 emails/second
   */
  async sendBatchEmail(params: BatchEmailParams): Promise<BatchEmailResult> {
    const batchSize = params.batchSize || 10;
    const results: BatchEmailResult = {
      success: true,
      totalSent: 0,
      totalFailed: 0,
      errors: [],
    };

    // Process in batches
    for (let i = 0; i < params.recipients.length; i += batchSize) {
      const batch = params.recipients.slice(i, i + batchSize);

      // Send emails in parallel within batch
      const promises = batch.map(async (email) => {
        const result = await this.sendEmail({
          to: email,
          subject: params.subject,
          html: params.html,
          text: params.text,
          from: params.from,
          replyTo: params.replyTo,
        });

        if (result.success) {
          results.totalSent++;
        } else {
          results.totalFailed++;
          results.errors?.push({
            email,
            error: result.error || 'Unknown error',
          });
        }
      });

      await Promise.all(promises);

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < params.recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Mark as failed if more than 50% failed
    if (results.totalFailed > results.totalSent) {
      results.success = false;
    }

    return results;
  }

  /**
   * Verify domain (optional, for better deliverability)
   */
  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.domains.create({ name: domain });

      if (error) {
        console.error('[Resend] Domain verification error:', error);
        return false;
      }

      console.log('[Resend] Domain verification initiated:', data);
      return true;
    } catch (error) {
      console.error('[Resend] Domain verification failed:', error);
      return false;
    }
  }
}
