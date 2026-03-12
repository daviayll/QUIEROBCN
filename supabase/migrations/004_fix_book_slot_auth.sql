-- Fix: verify the p_client_id belongs to the calling user
CREATE OR REPLACE FUNCTION book_visit_slot(
  p_slot_id uuid,
  p_client_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_slot visit_slots;
BEGIN
  -- Verify the client belongs to the calling user
  IF NOT EXISTS (
    SELECT 1 FROM clients
    WHERE id = p_client_id
    AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Lock the row to prevent concurrent bookings
  SELECT * INTO v_slot
  FROM visit_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'slot_not_found');
  END IF;

  IF v_slot.booked_by_client_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'slot_already_booked');
  END IF;

  UPDATE visit_slots
  SET booked_by_client_id = p_client_id, booked_at = now()
  WHERE id = p_slot_id;

  RETURN jsonb_build_object(
    'success', true,
    'slot_id', p_slot_id,
    'building_id', v_slot.building_id,
    'datetime', v_slot.datetime
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
