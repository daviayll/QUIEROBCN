-- Fix: admin role must be read from app_metadata (server-only, not user-writable)
-- user_metadata is writable by the user via supabase.auth.updateUser()
-- app_metadata is only writable via the service role key

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$ LANGUAGE sql SECURITY DEFINER;
