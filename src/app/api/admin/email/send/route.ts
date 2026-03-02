/**
 * Admin Email Send API
 * POST - Send email to individual, filtered group, or all users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCustomEmail } from '@/lib/email/helpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import type { EmailReplyMode, EmailCategory } from '@/lib/email/types';

const VALID_CATEGORIES: EmailCategory[] = [
  'announcement',
  'product_update',
  'compliance_kyc',
  'security_alert',
  'transaction_notice',
  'custom',
];

const VALID_REPLY_MODES: EmailReplyMode[] = [
  'no_reply',
  'reply_via_tawk',
  'reply_via_dashboard',
];

const MAX_SUBJECT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_RECIPIENTS_DEFAULT = 500;
const DANGEROUS_SCHEMES = ['javascript:', 'data:', 'vbscript:'];

function validateCtaUrl(ctaUrl: string): { valid: boolean; error?: string } {
  // Allow relative paths
  if (ctaUrl.startsWith('/')) return { valid: true };

  // Block dangerous schemes
  const lower = ctaUrl.toLowerCase();
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return { valid: false, error: `CTA URL cannot use ${scheme} scheme` };
    }
  }

  // Must be https
  if (!ctaUrl.startsWith('https://')) {
    return { valid: false, error: 'CTA URL must start with https:// or be a relative path (/)' };
  }

  // Hostname must match app domain
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const ctaHostname = new URL(ctaUrl).hostname;
      const appHostname = new URL(appUrl).hostname;
      if (ctaHostname !== appHostname) {
        return { valid: false, error: `CTA URL hostname must match ${appHostname}` };
      }
    }
  } catch {
    return { valid: false, error: 'CTA URL is not a valid URL' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting
    const rateCheck = await checkRateLimit(user.id, 'ADMIN_EMAIL_SEND', RATE_LIMITS.ADMIN_EMAIL_SEND);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      recipientType,
      recipientEmails,
      filters,
      subject,
      content,
      category,
      replyMode,
      ctaLabel,
      ctaUrl,
      templateId,
      testMode,
      confirmationPhrase,
    } = body;

    // Validation
    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
    }
    if (!replyMode || !VALID_REPLY_MODES.includes(replyMode)) {
      return NextResponse.json({ error: 'Valid reply mode is required' }, { status: 400 });
    }

    // Content length limits
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json({ error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or less` }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` }, { status: 400 });
    }

    // CTA URL validation
    if (ctaUrl) {
      const ctaValidation = validateCtaUrl(ctaUrl);
      if (!ctaValidation.valid) {
        return NextResponse.json({ error: ctaValidation.error }, { status: 400 });
      }
    }

    const adminClient = createAdminClient();

    // Test mode: send only to the current admin's email
    if (testMode) {
      const adminEmail = profile.email || user.email;
      if (!adminEmail) {
        return NextResponse.json({ error: 'Could not resolve your email address' }, { status: 400 });
      }

      const result = await sendCustomEmail({
        email: adminEmail,
        subject: `[TEST] ${subject}`,
        content,
        recipientName: undefined,
        replyMode: replyMode as EmailReplyMode,
        replyUrl: ctaUrl || undefined,
        replyText: ctaLabel || undefined,
        category: category as EmailCategory,
      });

      return NextResponse.json({
        success: result.success,
        recipientCount: 1,
        sentCount: result.success ? 1 : 0,
        failedCount: result.success ? 0 : 1,
        testMode: true,
        error: result.error,
      });
    }

    if (!['individual', 'group', 'all'].includes(recipientType)) {
      return NextResponse.json({ error: 'Valid recipient type is required' }, { status: 400 });
    }

    // Super-admin gate for "All Users"
    if (recipientType === 'all') {
      if (profile.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only super admins can send to all users' }, { status: 403 });
      }
      if (confirmationPhrase !== 'SEND TO ALL USERS') {
        return NextResponse.json({ error: 'Confirmation phrase is required to send to all users' }, { status: 400 });
      }
    }

    // Resolve recipients
    let recipientList: { email: string; full_name: string | null }[] = [];
    let skippedEmails: string[] = [];

    if (recipientType === 'individual') {
      if (!recipientEmails?.length) {
        return NextResponse.json({ error: 'At least one email is required' }, { status: 400 });
      }
      // Only include emails found in profiles (platform users only)
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .in('email', recipientEmails);

      const profileEmails = new Set((profiles || []).map((p) => p.email));
      skippedEmails = (recipientEmails as string[]).filter((e: string) => !profileEmails.has(e));
      recipientList = (profiles || []).filter((p) => p.email).map((p) => ({
        email: p.email,
        full_name: p.full_name,
      }));

      if (recipientList.length === 0) {
        return NextResponse.json({
          error: 'No valid platform users found for the provided emails',
          skippedEmails,
        }, { status: 400 });
      }
    } else if (recipientType === 'group') {
      let query = adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('is_banned', false);

      if (filters?.role) query = query.eq('role', filters.role);
      if (filters?.kyc_status) query = query.eq('kyc_status', filters.kyc_status);
      if (filters?.is_banned !== undefined) query = query.eq('is_banned', filters.is_banned);

      const { data: profiles, error } = await query;
      if (error) {
        return NextResponse.json({ error: 'Failed to resolve recipients' }, { status: 500 });
      }
      recipientList = (profiles || []).filter((p) => p.email);
    } else {
      // all
      const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('is_banned', false);

      if (error) {
        return NextResponse.json({ error: 'Failed to resolve recipients' }, { status: 500 });
      }
      recipientList = (profiles || []).filter((p) => p.email);
    }

    if (recipientList.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
    }

    // Recipient cap (super admins bypass)
    if (recipientList.length > MAX_RECIPIENTS_DEFAULT && profile.role !== 'super_admin') {
      return NextResponse.json({
        error: `Recipient count (${recipientList.length}) exceeds maximum of ${MAX_RECIPIENTS_DEFAULT}. Contact a super admin for larger sends.`,
      }, { status: 400 });
    }

    // Insert history record
    const { data: historyRecord, error: historyError } = await adminClient
      .from('email_history')
      .insert({
        subject,
        content,
        category,
        reply_mode: replyMode,
        cta_label: ctaLabel || null,
        cta_url: ctaUrl || null,
        recipient_type: recipientType,
        recipient_filter: filters || null,
        recipient_emails: recipientList.map((r) => r.email),
        recipient_count: recipientList.length,
        status: 'sending',
        template_id: templateId || null,
        sent_by: user.id,
      })
      .select()
      .single();

    if (historyError) {
      console.error('Failed to create email history:', historyError);
      return NextResponse.json({ error: 'Failed to create email history record' }, { status: 500 });
    }

    // Send emails
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const recipient of recipientList) {
      try {
        const result = await sendCustomEmail({
          email: recipient.email,
          subject,
          content,
          recipientName: recipient.full_name || undefined,
          replyMode: replyMode as EmailReplyMode,
          replyUrl: ctaUrl || undefined,
          replyText: ctaLabel || undefined,
          category: category as EmailCategory,
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          errors.push(`${recipient.email}: ${result.error}`);
        }
      } catch (err) {
        failedCount++;
        errors.push(`${recipient.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Determine final status
    let status: string;
    if (failedCount === 0) {
      status = 'completed';
    } else if (sentCount === 0) {
      status = 'failed';
    } else {
      status = 'partial_failed';
    }

    // Update history record
    await adminClient
      .from('email_history')
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status,
        error_details: errors.length > 0 ? { errors: errors.slice(0, 50) } : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', historyRecord.id);

    return NextResponse.json({
      success: sentCount > 0,
      recipientCount: recipientList.length,
      sentCount,
      failedCount,
      historyId: historyRecord.id,
      ...(skippedEmails.length > 0 && { skippedEmails }),
    });
  } catch (error) {
    console.error('Admin email send API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
