-- ============================================================
-- QUIEROBCN — Initial Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- CLIENTS
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE UNIQUE,
  full_name text NOT NULL,
  phone text,
  email text NOT NULL,
  profile_type text NOT NULL CHECK (profile_type IN ('empleado','estudiante','autonomo','otro')),
  status text DEFAULT 'unverified' CHECK (status IN ('unverified','uploading','pending_review','active','inactive')),
  monthly_income numeric,
  preferences jsonb DEFAULT '{}'::jsonb,
  -- preferences keys: max_rent, min_rooms, preferred_neighborhoods[], flexible_on_neighborhood, move_in_date, has_pets
  activated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- DOCUMENTS
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients ON DELETE CASCADE NOT NULL,
  doc_type text NOT NULL,
  -- 'dni', 'nie', 'pasaporte', 'contrato', 'nomina_1', 'nomina_2', 'nomina_3',
  -- 'vida_laboral', 'matricula', 'ahorros', 'renta', 'recibo_autonomo_1',
  -- 'recibo_autonomo_2', 'recibo_autonomo_3', 'extracto_bancario',
  -- 'prueba_ingresos', 'referencia_arrendador'
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT true
);

-- BUILDINGS
CREATE TABLE buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  neighborhood text NOT NULL,
  address text,
  price numeric NOT NULL,
  rooms integer NOT NULL,
  bathrooms integer,
  size_sqm numeric,
  floor integer,
  has_elevator boolean DEFAULT false,
  furnished boolean DEFAULT false,
  photos text[] DEFAULT '{}',
  min_income numeric,
  allowed_profiles text[] DEFAULT '{empleado,estudiante,autonomo,otro}',
  min_solvency_ratio numeric DEFAULT 3,
  available_from date,
  description_es text,
  description_en text,
  real_estate_company text,
  company_contact text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  created_at timestamptz DEFAULT now()
);

-- VISIT SLOTS
CREATE TABLE visit_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES buildings ON DELETE CASCADE NOT NULL,
  datetime timestamptz NOT NULL,
  duration_minutes integer DEFAULT 15,
  booked_by_client_id uuid REFERENCES clients,
  booked_at timestamptz,
  UNIQUE(building_id, datetime)
);

-- MATCHES
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients ON DELETE CASCADE NOT NULL,
  building_id uuid REFERENCES buildings ON DELETE CASCADE NOT NULL,
  score numeric DEFAULT 0,
  notified_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','notified','visited','applied','rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, building_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- CLIENTS policies
CREATE POLICY "clients_select_own" ON clients
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "clients_delete_admin" ON clients
  FOR DELETE USING (is_admin());

-- DOCUMENTS policies
CREATE POLICY "documents_select_own" ON documents
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "documents_insert_own" ON documents
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_update_own" ON documents
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "documents_delete_own" ON documents
  FOR DELETE USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  );

-- BUILDINGS policies
CREATE POLICY "buildings_select_published" ON buildings
  FOR SELECT USING (status = 'published' OR is_admin());

CREATE POLICY "buildings_insert_admin" ON buildings
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "buildings_update_admin" ON buildings
  FOR UPDATE USING (is_admin());

CREATE POLICY "buildings_delete_admin" ON buildings
  FOR DELETE USING (is_admin());

-- VISIT SLOTS policies
CREATE POLICY "visit_slots_select_all" ON visit_slots
  FOR SELECT USING (true); -- public: needed for booking page

CREATE POLICY "visit_slots_insert_admin" ON visit_slots
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "visit_slots_update_booking" ON visit_slots
  FOR UPDATE USING (
    is_admin()
    OR (
      booked_by_client_id IS NULL -- slot still available
      AND auth.uid() IS NOT NULL   -- user is logged in
    )
  );

CREATE POLICY "visit_slots_delete_admin" ON visit_slots
  FOR DELETE USING (is_admin());

-- MATCHES policies
CREATE POLICY "matches_select_own" ON matches
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "matches_insert_admin" ON matches
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "matches_update_admin" ON matches
  FOR UPDATE USING (is_admin());

CREATE POLICY "matches_delete_admin" ON matches
  FOR DELETE USING (is_admin());

-- ============================================================
-- ATOMIC SLOT BOOKING FUNCTION
-- Prevents double-booking via SELECT FOR UPDATE lock
-- ============================================================

CREATE OR REPLACE FUNCTION book_visit_slot(
  p_slot_id uuid,
  p_client_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_slot visit_slots;
  v_result jsonb;
BEGIN
  -- Lock the row to prevent concurrent bookings
  SELECT * INTO v_slot
  FROM visit_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  -- Check slot exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'slot_not_found');
  END IF;

  -- Check slot is still available
  IF v_slot.booked_by_client_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'slot_already_booked');
  END IF;

  -- Book the slot
  UPDATE visit_slots
  SET
    booked_by_client_id = p_client_id,
    booked_at = now()
  WHERE id = p_slot_id;

  RETURN jsonb_build_object(
    'success', true,
    'slot_id', p_slot_id,
    'building_id', v_slot.building_id,
    'datetime', v_slot.datetime
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- MATCHING FUNCTION
-- Returns ranked client–building matches for a given building
-- ============================================================

CREATE OR REPLACE FUNCTION match_building(p_building_id uuid)
RETURNS TABLE (
  client_id uuid,
  building_id uuid,
  score numeric,
  full_name text,
  phone text,
  email text,
  building_name text,
  building_price numeric,
  building_slug text,
  building_neighborhood text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS client_id,
    b.id AS building_id,
    (
      CASE WHEN b.neighborhood = ANY(
        ARRAY(SELECT jsonb_array_elements_text(c.preferences->'preferred_neighborhoods'))
      ) THEN 2 ELSE 0 END
      +
      CASE WHEN NOT COALESCE((c.preferences->>'has_pets')::boolean, false) THEN 1 ELSE 0 END
    )::numeric AS score,
    c.full_name,
    c.phone,
    c.email,
    b.name AS building_name,
    b.price AS building_price,
    b.slug AS building_slug,
    b.neighborhood AS building_neighborhood
  FROM clients c
  CROSS JOIN buildings b
  WHERE
    b.id = p_building_id
    AND b.status = 'published'
    AND c.status = 'active'
    -- Hard filter: budget
    AND COALESCE((c.preferences->>'max_rent')::numeric, 0) >= b.price * 0.9
    -- Hard filter: profile allowed
    AND b.allowed_profiles @> ARRAY[c.profile_type]
    -- Hard filter: solvency
    AND COALESCE(c.monthly_income, 0) >= b.price * b.min_solvency_ratio
    -- Exclude: client already has a booking for this building
    AND NOT EXISTS (
      SELECT 1 FROM visit_slots vs
      WHERE vs.building_id = b.id
      AND vs.booked_by_client_id = c.id
    )
    -- Exclude: already matched (notified)
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.client_id = c.id
      AND m.building_id = b.id
      AND m.notified_at IS NOT NULL
    )
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STORAGE BUCKETS
-- Run separately in: Storage → New bucket
-- Or via Supabase CLI:
-- ============================================================

-- Create buckets (run in SQL editor):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('buildings', 'buildings', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage: documents bucket — private, only owner + admin
CREATE POLICY "documents_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND (
      is_admin()
      OR (auth.uid()::text = (storage.foldername(name))[1])
    )
  );

CREATE POLICY "documents_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "documents_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND (
      is_admin()
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- Storage: buildings bucket — public reads, admin writes
CREATE POLICY "buildings_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'buildings');

CREATE POLICY "buildings_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'buildings' AND is_admin());

CREATE POLICY "buildings_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'buildings' AND is_admin());
