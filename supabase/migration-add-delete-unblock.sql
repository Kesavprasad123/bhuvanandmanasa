-- ============================================================================
-- Migration: add the host-only "Delete booking" and "Unblock room" functions.
--
-- Run ONCE in the Supabase dashboard:  SQL Editor -> New query -> paste -> Run
-- Use this if you already ran supabase/setup.sql before these two functions
-- existed. (Re-running the full setup.sql is also safe — it is idempotent.)
--
-- delete_booking(token, id)   permanently removes a booking row (host only)
-- unblock_room(token, prop, room)  cancels a room's active bookings so it
--                                  becomes Available again (host only)
--
-- Both re-verify the host session inside Postgres (SECURITY DEFINER), so the
-- website's JavaScript can never call them without a valid host login.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_booking(
  p_token TEXT,
  p_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_host(p_token);

  DELETE FROM public.bookings WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_room(
  p_token    TEXT,
  p_property TEXT,
  p_room     TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  PERFORM public._require_host(p_token);

  IF NOT EXISTS (SELECT 1 FROM public.rooms r
                 WHERE r.property_id = COALESCE(p_property, '')
                   AND r.room = COALESCE(p_room, '')) THEN
    RAISE EXCEPTION 'That room does not belong to this property.';
  END IF;

  UPDATE public.bookings
     SET status = 'cancelled', updated_at = now()
   WHERE property_id = p_property
     AND room = p_room
     AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Lock the helpers down and expose them to the API roles (mirrors setup.sql).
REVOKE ALL ON FUNCTION public.delete_booking(TEXT, UUID),
                      public.unblock_room(TEXT, TEXT, TEXT)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.delete_booking(TEXT, UUID),
                          public.unblock_room(TEXT, TEXT, TEXT)
TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
