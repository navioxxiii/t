-- Inbound Email Replies + Attachment Storage
-- Captures user replies to admin "reply_via_dashboard" emails, with
-- downloadable attachments persisted to a private Storage bucket.
--
-- Created: 2026-05-24

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: email_replies
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Nullable: a garbled or missing reply token still gets stored so the
  -- admin can see "unlinked" replies rather than us silently dropping mail.
  email_history_id UUID REFERENCES email_history(id) ON DELETE SET NULL,
  -- Nullable: replies from senders not in `profiles` (forwards, aliases)
  -- are kept and surfaced as "unmatched".
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  body_clean TEXT,
  -- Resend's inbound email id, used for idempotent dedup on webhook retries.
  resend_inbound_id TEXT UNIQUE,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_replies_history_id ON email_replies(email_history_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_user_id ON email_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_is_read ON email_replies(is_read);
CREATE INDEX IF NOT EXISTS idx_email_replies_received_at ON email_replies(received_at DESC);

ALTER TABLE email_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email replies"
  ON email_replies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update email replies"
  ON email_replies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can manage email replies"
  ON email_replies
  FOR ALL
  TO service_role
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════
-- STORAGE: email-reply-attachments (private bucket)
-- ═══════════════════════════════════════════════════════════════════════
-- The webhook uploads each inbound attachment to <reply_id>/<filename>.
-- The admin API issues short-lived signed URLs for download.
-- Bucket can also be created via the Supabase dashboard; this insert is
-- idempotent.

INSERT INTO storage.buckets (id, name, public)
VALUES ('email-reply-attachments', 'email-reply-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can read email reply attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'email-reply-attachments'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can manage email reply attachments"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'email-reply-attachments')
  WITH CHECK (bucket_id = 'email-reply-attachments');
