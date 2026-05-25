/**
 * Resend Inbound Webhook
 *
 * Receives email replies routed via `reply+<email_history_id>@<EMAIL_REPLY_DOMAIN>`,
 * stores them in `email_replies`, and persists attachments to the
 * private `email-reply-attachments` Storage bucket.
 *
 * Mirrors the pattern in `src/app/api/webhooks/plisio/route.ts`: raw body,
 * signature verify, audit log to `webhook_logs`, idempotent processing,
 * 2xx for anything stored or acknowledged so Resend doesn't retry-storm.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifyResendWebhook,
  extractInboundEmail,
  isHydratedPayload,
  parseHistoryIdFromAddress,
  cleanReplyBody,
} from '@/lib/email/inbound';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STORAGE_BUCKET = 'email-reply-attachments';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'resend-inbound',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();

    if (!verifyResendWebhook(raw, request.headers)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Audit log first — even if processing fails we still have the payload.
    const { data: logRow } = await adminClient
      .from('webhook_logs')
      .insert({
        event_type: 'resend_inbound',
        payload: payload as Record<string, unknown>,
        processed: false,
      })
      .select('id')
      .single();

    let email = extractInboundEmail(payload);
    if (!email) {
      console.warn('[Resend Inbound] Unrecognized payload shape');
      return NextResponse.json({ status: 'acknowledged' });
    }

    // Hydrate the full message body + attachment metadata if the webhook
    // payload only carried an envelope.
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (!isHydratedPayload(email)) {
      const { data, error } = await resend.emails.receiving.get(email.resendInboundId);
      if (error || !data) {
        console.error('[Resend Inbound] Failed to hydrate:', error);
        return NextResponse.json({ error: 'Hydration failed' }, { status: 500 });
      }
      const hydrated = extractInboundEmail(data);
      if (hydrated) email = hydrated;
    }

    // Idempotency — Resend may retry on transient failures.
    const { data: existing } = await adminClient
      .from('email_replies')
      .select('id')
      .eq('resend_inbound_id', email.resendInboundId)
      .maybeSingle();

    if (existing) {
      if (logRow) {
        await adminClient
          .from('webhook_logs')
          .update({ processed: true })
          .eq('id', logRow.id);
      }
      return NextResponse.json({ status: 'already_processed', id: existing.id });
    }

    const emailHistoryId = parseHistoryIdFromAddress(email.allToAddresses);

    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('email', email.fromEmail)
      .maybeSingle();

    const bodyClean = cleanReplyBody(email.text);

    const { data: insertedReply, error: insertError } = await adminClient
      .from('email_replies')
      .insert({
        email_history_id: emailHistoryId,
        user_id: userProfile?.id ?? null,
        from_email: email.fromEmail,
        from_name: email.fromName,
        to_email: email.toEmail,
        subject: email.subject,
        body_text: email.text,
        body_html: email.html,
        body_clean: bodyClean,
        resend_inbound_id: email.resendInboundId,
        attachments: [],
        raw_payload: payload as Record<string, unknown>,
      })
      .select('id')
      .single();

    if (insertError || !insertedReply) {
      console.error('[Resend Inbound] Insert failed:', insertError);
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }

    // Pull each attachment's download URL from Resend, fetch the bytes,
    // and persist to Storage under `<reply_id>/<attachment_id>-<filename>`.
    // Failures on individual attachments are logged but don't fail the
    // whole webhook — the reply itself is already saved.
    const storedAttachments: Array<{
      filename: string;
      contentType: string;
      size: number;
      storagePath: string;
    }> = [];

    for (const att of email.attachments) {
      try {
        const { data: attData, error: attErr } = await resend.emails.receiving.attachments.get({
          emailId: email.resendInboundId,
          id: att.id,
        });

        if (attErr || !attData?.download_url) {
          console.error(`[Resend Inbound] Could not get attachment ${att.id}:`, attErr);
          continue;
        }

        const fileResp = await fetch(attData.download_url);
        if (!fileResp.ok) {
          console.error(
            `[Resend Inbound] Download failed for ${att.id}: ${fileResp.status}`
          );
          continue;
        }
        const fileBytes = new Uint8Array(await fileResp.arrayBuffer());

        const safeName = att.filename.replace(/[^\w.\-]/g, '_');
        const storagePath = `${insertedReply.id}/${att.id}-${safeName}`;

        const { error: uploadErr } = await adminClient.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, fileBytes, {
            contentType: att.contentType,
            upsert: false,
          });

        if (uploadErr) {
          console.error(`[Resend Inbound] Upload failed for ${att.id}:`, uploadErr);
          continue;
        }

        storedAttachments.push({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          storagePath,
        });
      } catch (err) {
        console.error(`[Resend Inbound] Attachment ${att.id} error:`, err);
      }
    }

    if (storedAttachments.length > 0) {
      await adminClient
        .from('email_replies')
        .update({ attachments: storedAttachments })
        .eq('id', insertedReply.id);
    }

    if (logRow) {
      await adminClient
        .from('webhook_logs')
        .update({ processed: true })
        .eq('id', logRow.id);
    }

    return NextResponse.json({
      status: 'success',
      replyId: insertedReply.id,
      attachmentsStored: storedAttachments.length,
      attachmentsAttempted: email.attachments.length,
    });
  } catch (error) {
    console.error('[Resend Inbound] Webhook error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
