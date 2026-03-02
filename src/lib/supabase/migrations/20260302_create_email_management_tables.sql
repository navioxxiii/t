-- Email Management System Tables
-- Admin email templates and send history for branded member communications
--
-- Created: 2026-03-02

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: email_templates
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('announcement', 'product_update', 'compliance_kyc', 'security_alert', 'transaction_notice', 'custom')),
  reply_mode TEXT NOT NULL DEFAULT 'no_reply'
    CHECK (reply_mode IN ('no_reply', 'reply_via_tawk', 'reply_via_dashboard')),
  cta_label TEXT,
  cta_url_template TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Admins and super_admins can CRUD
CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
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

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: email_history
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('announcement', 'product_update', 'compliance_kyc', 'security_alert', 'transaction_notice', 'custom')),
  reply_mode TEXT NOT NULL
    CHECK (reply_mode IN ('no_reply', 'reply_via_tawk', 'reply_via_dashboard')),
  cta_label TEXT,
  cta_url TEXT,
  recipient_type TEXT NOT NULL
    CHECK (recipient_type IN ('individual', 'group', 'all', 'test')),
  recipient_filter JSONB,
  recipient_emails TEXT[],
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sending'
    CHECK (status IN ('sending', 'completed', 'partial_failed', 'failed')),
  error_details JSONB,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_category ON email_history(category);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_by ON email_history(sent_by);
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON email_history(created_at DESC);

ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Admins can view history
CREATE POLICY "Admins can view email history"
  ON email_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role can insert/update (for API route operations)
CREATE POLICY "Service role can manage email history"
  ON email_history
  FOR ALL
  TO service_role
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════
-- TRIGGER: auto-update updated_at on email_templates
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();
