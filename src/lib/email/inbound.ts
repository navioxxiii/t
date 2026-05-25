/**
 * Inbound Email Logic
 *
 * Helpers for the Resend Inbound webhook: signature verification (Svix),
 * reply-address token parsing, quoted-text stripping, and payload
 * normalization. Provider-specific (Resend) — mirrors how
 * `src/lib/plisio/webhooks.ts` isolates its provider's webhook logic.
 */

import EmailReplyParser from 'email-reply-parser';
import { Webhook } from 'svix';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface NormalizedInboundEmail {
  resendInboundId: string;
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  allToAddresses: string[];
  subject: string;
  text: string;
  html: string | null;
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
  }>;
}

interface InboundAttachmentPayload {
  id?: string;
  filename?: string;
  size?: number;
  content_type?: string;
}

interface InboundEmailPayloadShape {
  id?: string;
  to?: string | string[];
  from?: string;
  subject?: string;
  text?: string | null;
  html?: string | null;
  attachments?: InboundAttachmentPayload[];
}

interface InboundEnvelope {
  type?: string;
  data?: InboundEmailPayloadShape;
}

/**
 * Parse "Foo Bar <foo@bar.com>" or "foo@bar.com" into its parts.
 */
function parseEmailAddress(input: string): { email: string; name: string | null } {
  const match = input.match(/^\s*(?:"?([^"<]*?)"?\s*<)?([^<>\s]+@[^<>\s]+)>?\s*$/);
  if (!match) return { email: input.trim(), name: null };
  const name = match[1]?.trim() || null;
  return { email: match[2].trim(), name };
}

/**
 * Extract the `<token>` from a `reply+<token>@host` address and return it
 * if it's a valid UUID. Searches every recipient in case the user replied
 * to a Cc'd address. Returns null when no valid token is present — the
 * webhook still stores the reply, just unlinked.
 */
export function parseHistoryIdFromAddress(to: string | string[]): string | null {
  const addresses = Array.isArray(to) ? to : [to];
  for (const addr of addresses) {
    if (!addr) continue;
    const { email } = parseEmailAddress(addr);
    const localPart = email.split('@')[0];
    const plusIdx = localPart.indexOf('+');
    if (plusIdx < 0) continue;
    const token = localPart.slice(plusIdx + 1);
    if (UUID_RE.test(token)) return token.toLowerCase();
  }
  return null;
}

/**
 * Strip quoted history and signatures from a plain-text reply. Falls back
 * to the raw input on any parser error so a tricky email never causes a
 * webhook to drop data.
 */
export function cleanReplyBody(text: string | null | undefined): string {
  if (!text) return '';
  try {
    return new EmailReplyParser().parseReply(text).trim();
  } catch (err) {
    console.error('[Inbound] email-reply-parser failed, using raw text:', err);
    return text;
  }
}

/**
 * Verify a Resend webhook signature using Svix. Reads
 * RESEND_INBOUND_WEBHOOK_SECRET. Supports
 * SKIP_RESEND_SIGNATURE_VERIFICATION=true for local development, mirroring
 * the plisio/nowpayments dev-skip pattern.
 *
 * Must be called with the RAW request body — Svix signs exact bytes.
 */
export function verifyResendWebhook(
  rawBody: string,
  headers: Headers | Record<string, string>
): boolean {
  if (process.env.SKIP_RESEND_SIGNATURE_VERIFICATION === 'true') {
    console.warn('[Inbound] Skipping Resend webhook signature verification (dev only)');
    return true;
  }

  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Inbound] RESEND_INBOUND_WEBHOOK_SECRET not configured');
    return false;
  }

  const headerObj =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : headers;

  try {
    new Webhook(secret).verify(rawBody, headerObj);
    return true;
  } catch (err) {
    console.error('[Inbound] Webhook signature verification failed:', err);
    return false;
  }
}

/**
 * Pull the inbound email out of either a Resend webhook envelope
 * (`{ type, data: {...} }`) or a `resend.receiving.get()` response.
 * Returns null if the payload doesn't look like an inbound email yet —
 * the caller should hydrate via `resend.receiving.get(id)` in that case.
 */
export function extractInboundEmail(payload: unknown): NormalizedInboundEmail | null {
  if (!payload || typeof payload !== 'object') return null;

  const envelope = payload as InboundEnvelope & InboundEmailPayloadShape;
  const data: InboundEmailPayloadShape = envelope.data ?? envelope;

  if (!data || typeof data !== 'object' || !data.id) return null;

  const toRaw = data.to ?? [];
  const allToAddresses = Array.isArray(toRaw) ? toRaw : [toRaw];
  const toEmail = allToAddresses[0]
    ? parseEmailAddress(allToAddresses[0]).email
    : '';

  const fromRaw = typeof data.from === 'string' ? data.from : '';
  const { email: fromEmail, name: fromName } = parseEmailAddress(fromRaw);

  return {
    resendInboundId: data.id,
    fromEmail,
    fromName,
    toEmail,
    allToAddresses,
    subject: data.subject ?? '',
    text: data.text ?? '',
    html: data.html ?? null,
    attachments: (data.attachments ?? [])
      .filter((a) => a && a.id && a.filename)
      .map((a) => ({
        id: a.id as string,
        filename: a.filename as string,
        contentType: a.content_type ?? 'application/octet-stream',
        size: a.size ?? 0,
      })),
  };
}

/**
 * True when a normalized payload has enough content to skip hydrating via
 * `resend.receiving.get()`. If the webhook ships only an id + recipient
 * envelope, callers should hydrate before persisting.
 */
export function isHydratedPayload(email: NormalizedInboundEmail): boolean {
  return !!(email.text || email.html);
}
