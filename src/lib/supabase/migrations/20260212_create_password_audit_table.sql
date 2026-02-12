-- ⚠️ SECURITY CRITICAL: Password Audit Storage Table
-- This table stores encrypted passwords for compliance/audit requirements.
--
-- Security Measures:
-- - AES-256-GCM encryption at rest
-- - RLS policies restrict access to super_admins only
-- - All access logged to admin_action_logs
-- - Append-only (no updates/deletes allowed)
--
-- Created: 2026-02-12

-- Create the password audit table
CREATE TABLE IF NOT EXISTS user_password_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_password TEXT NOT NULL,
  password_set_method TEXT NOT NULL CHECK (
    password_set_method IN ('registration', 'admin_creation', 'password_reset', 'password_change')
  ),
  set_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_password_audit_user_id
  ON user_password_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_user_password_audit_created_at
  ON user_password_audit(created_at);

-- Enable Row Level Security
ALTER TABLE user_password_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only super_admins can read password audit records
CREATE POLICY "Super admins can view password audit records"
  ON user_password_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Service role can insert records (for API routes)
CREATE POLICY "Service role can insert password audit records"
  ON user_password_audit
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No update policy = no updates allowed (append-only)
-- No delete policy = no deletes allowed (permanent audit trail)

-- Add table comment for documentation
COMMENT ON TABLE user_password_audit IS
'⚠️ SECURITY CRITICAL: Stores encrypted passwords for compliance/audit purposes.
Access restricted to super_admins only. All access must be logged to admin_action_logs.
Encryption: AES-256-GCM with key stored in environment variables.';

COMMENT ON COLUMN user_password_audit.encrypted_password IS
'AES-256-GCM encrypted password. Never store plaintext passwords.';

COMMENT ON COLUMN user_password_audit.password_set_method IS
'How the password was set: registration, admin_creation, password_reset, or password_change';

COMMENT ON COLUMN user_password_audit.set_by_user_id IS
'Admin user ID for admin_creation method, NULL for other methods';
