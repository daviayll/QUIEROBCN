-- ============================================================
-- QUIEROBCN — GDPR Compliance Migration
-- Run AFTER 001_initial.sql
-- ============================================================

-- ============================================================
-- 1. GDPR FIELDS ON CLIENTS
-- ============================================================

ALTER TABLE clients
  -- Art. 6/7 — lawful basis: explicit consent at registration
  ADD COLUMN consent_given_at timestamptz,

  -- Art. 17 — right to erasure: tracks deletion request lifecycle
  ADD COLUMN deletion_requested_at timestamptz;

-- Existing rows: mark consent as unknown (pre-GDPR data)
-- In practice this table will be empty when this migration runs
COMMENT ON COLUMN clients.consent_given_at IS
  'GDPR Art. 7 — timestamp when the user explicitly consented to data processing at registration. NULL = consent not yet obtained (should not happen for new registrations).';

COMMENT ON COLUMN clients.deletion_requested_at IS
  'GDPR Art. 17 — timestamp when the user requested erasure. Data is anonymized immediately; storage files deleted async by the app. Row is kept for audit trail.';

-- ============================================================
-- 2. SOFT DELETE ON DOCUMENTS
-- ============================================================

ALTER TABLE documents
  ADD COLUMN deleted_at timestamptz;

COMMENT ON COLUMN documents.deleted_at IS
  'GDPR soft delete. NULL = active. When set, the file has been deleted from Supabase Storage and the row is retained only for audit purposes with file_path nulled out.';

-- Update documents RLS: exclude soft-deleted docs from regular queries
-- Clients and admin should not see deleted documents in normal operations
DROP POLICY IF EXISTS "documents_select_own" ON documents;
CREATE POLICY "documents_select_own" ON documents
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
      OR is_admin()
    )
  );

-- ============================================================
-- 3. GDPR DELETION FUNCTION
-- Art. 17 — Right to Erasure
--
-- What this function does:
--   1. Anonymizes all PII in clients row (name → [ELIMINADO], phone/email nulled)
--   2. Sets deletion_requested_at = now()
--   3. Soft-deletes all documents (deleted_at + nulls file_path)
--   4. Removes from active matches
--   5. Unbookles any future visit slots
--
-- What the APPLICATION must do after calling this:
--   1. Delete all files from Supabase Storage bucket 'documents/{user_id}/*'
--   2. Call supabase.auth.admin.deleteUser(user_id) to remove auth record
--
-- SECURITY: SECURITY DEFINER runs as superuser. Caller must be admin OR the user themselves.
-- ============================================================

CREATE OR REPLACE FUNCTION request_gdpr_deletion(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_caller_id uuid;
  v_is_caller_admin boolean;
  v_doc_paths text[];
BEGIN
  -- Verify caller is the user themselves OR an admin
  v_caller_id := auth.uid();
  v_is_caller_admin := is_admin();

  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  IF v_caller_id <> p_user_id AND NOT v_is_caller_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Get client id
  SELECT id INTO v_client_id FROM clients WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'client_not_found');
  END IF;

  -- Check not already deleted
  IF EXISTS (
    SELECT 1 FROM clients WHERE id = v_client_id AND deletion_requested_at IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_requested');
  END IF;

  -- 1. Collect storage paths before nulling (returned so app can delete files)
  SELECT ARRAY_AGG(file_path)
  INTO v_doc_paths
  FROM documents
  WHERE client_id = v_client_id AND deleted_at IS NULL;

  -- 2. Anonymize PII in clients row (keep row for audit + visit/match history)
  UPDATE clients SET
    full_name          = '[ELIMINADO]',
    phone              = NULL,
    email              = '[eliminado-' || v_client_id || '@deleted.invalid]',
    monthly_income     = NULL,
    preferences        = '{}'::jsonb,
    status             = 'inactive',
    deletion_requested_at = now()
  WHERE id = v_client_id;

  -- 3. Soft-delete all documents (null out file_path so path is not accessible)
  UPDATE documents SET
    deleted_at = now(),
    file_path  = '[DELETED]',
    file_name  = '[DELETED]'
  WHERE client_id = v_client_id AND deleted_at IS NULL;

  -- 4. Remove pending/notified matches (no longer relevant)
  DELETE FROM matches
  WHERE client_id = v_client_id
    AND status IN ('pending', 'notified');

  -- 5. Unbook any future visit slots
  UPDATE visit_slots SET
    booked_by_client_id = NULL,
    booked_at           = NULL
  WHERE booked_by_client_id = v_client_id
    AND datetime > now();

  RETURN jsonb_build_object(
    'success',    true,
    'client_id',  v_client_id,
    'file_paths', COALESCE(v_doc_paths, ARRAY[]::text[])
    -- App must: delete each file from storage + call auth.admin.deleteUser(p_user_id)
  );
END;
$$;

-- ============================================================
-- 4. DOCUMENT ACCESS LOG (optional audit trail)
-- Tracks when admin accessed a client's documents (for DPA/audit)
-- ============================================================

CREATE TABLE document_access_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients ON DELETE CASCADE NOT NULL,
  accessed_by uuid REFERENCES auth.users NOT NULL,
  action      text NOT NULL CHECK (action IN ('view','download','export_zip')),
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Only admin can insert/read audit log
CREATE POLICY "access_log_admin_only" ON document_access_log
  FOR ALL USING (is_admin());

COMMENT ON TABLE document_access_log IS
  'GDPR Art. 5(2) accountability — records every time admin accesses client documents.';
