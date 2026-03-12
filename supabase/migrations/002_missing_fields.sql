-- Add missing columns and table referenced in application code

-- GDPR consent timestamp on clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS consent_given_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

-- Soft-delete support on documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- GDPR accountability log (Art. 5.2)
CREATE TABLE IF NOT EXISTS document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients ON DELETE CASCADE NOT NULL,
  accessed_by uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL CHECK (action IN ('view', 'download', 'export_zip')),
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_log_admin_only" ON document_access_log
  FOR ALL USING (is_admin());
