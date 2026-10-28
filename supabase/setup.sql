-- ============================================================================
-- Host-only room booking management — bhuvanmanasa.in/accommodation
--
-- Run ONCE in the Supabase dashboard:  SQL Editor -> New query -> paste -> Run
-- (full checklist lives in .env.example)
--
-- BEFORE RUNNING: replace __REPLACE_ME__ in step 7 with the four-digit host
-- access code. Only its SHA-256 hash is stored in the database — the code
-- itself must never appear in this repository or in the website's JavaScript.
--
-- What it creates
--   rooms           room inventory — 8 rooms per property
--   bookings        guest bookings (names + dates) — PRIVATE: the website has
--                   no table access at all, data flows only via the functions
--   host_sessions   server-side host login sessions (token hashes only)
--   app_secrets     SHA-256 hash of the host access code
--   functions       public: get_availability (room numbers + booked flags only)
--                   host:   host_login, host_logout, host_session_valid,
--                           get_bookings, create_booking, update_booking,
--                           set_booking_status
--
-- Security model
--   * The access code is compared ONLY inside Postgres (SHA-256 match) and is
--     never stored or re-sent by the browser after logging in.
--   * host_login issues a random session token; every host function re-checks
--     that token inside the database (SECURITY DEFINER), so editing or
--     inspecting the website's JavaScript grants no access to guest data.
--   * Wrong codes are delayed by 1s inside Postgres to slow brute-force tries.
--   * All tables use Row Level Security with NO policies (deny by default) and
--     their privileges are revoked from the anon/authenticated API roles.
-- ============================================================================

-- 1) Remove the earlier status-only scaffold (safe if it never existed) ------
DROP FUNCTION IF EXISTS public.set_room_status(TEXT, TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.verify_pin(TEXT);
DROP TABLE IF EXISTS public.room_status;

-- 2) Room inventory ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  property_id TEXT NOT NULL,
  room        TEXT NOT NULL,
  PRIMARY KEY (property_id, room)
);

INSERT INTO public.rooms (property_id, room) VALUES
  ('krishna-inn', '1'), ('krishna-inn', '2'), ('krishna-inn', '3'), ('krishna-inn', '4'),
  ('krishna-inn', '5'), ('krishna-inn', '6'), ('krishna-inn', '7'), ('krishna-inn', '8'),
  ('svpc', '1'), ('svpc', '2'), ('svpc', '3'), ('svpc', '4'),
  ('svpc', '5'), ('svpc', '6'), ('svpc', '7'), ('svpc', '8')
ON CONFLICT (property_id, room) DO NOTHING;

-- 3) Bookings — PRIVATE (guest names, check-in / check-out dates) ------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  room        TEXT NOT NULL,
  guest_name  TEXT NOT NULL,
  check_in    DATE NOT NULL,
  check_out   DATE NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_room_fk
    FOREIGN KEY (property_id, room) REFERENCES public.rooms (property_id, room),
  CONSTRAINT bookings_dates_ordered
    CHECK (check_out > check_in)
);

-- 4) Secret storage for the hashed host access code --------------------------
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 5) Host sessions (only SHA-256 hashes of the tokens are stored) ------------
CREATE TABLE IF NOT EXISTS public.host_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 6) Lock everything down: RLS with no policies + revoked table privileges ----
ALTER TABLE public.rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_secrets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.rooms, public.bookings,
                public.app_secrets, public.host_sessions
FROM anon, authenticated;
-- The website reaches these tables exclusively through the functions in step
-- 8, which run with the table owner's rights after verifying the host session.

-- 7) Store the hashed host access code ---------------------------------------
-- !! REPLACE __REPLACE_ME__ WITH THE FOUR-DIGIT HOST ACCESS CODE, then run. !!
INSERT INTO public.app_secrets (key, value)
VALUES ('host_pin_hash',
        encode(sha256(convert_to('__REPLACE_ME__', 'UTF8')), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- If you already ran this script with the placeholder still in place, set the
-- code (or rotate it later) with this statement instead:
--   UPDATE public.app_secrets
--      SET value = encode(sha256(convert_to('YOUR_CODE', 'UTF8')), 'hex')
--    WHERE key = 'host_pin_hash';

-- 8) Functions ---------------------------------------------------------------

-- Internal: verify a session token (raises when missing/expired).
-- Not callable from the website — only by the SECURITY DEFINER functions below.
CREATE OR REPLACE FUNCTION public._require_host(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  DELETE FROM public.host_sessions WHERE expires_at < now();

  v_hash := encode(sha256(convert_to(COALESCE(p_token, ''), 'UTF8')), 'hex');
  IF NOT EXISTS (SELECT 1 FROM public.host_sessions s WHERE s.token_hash = v_hash) THEN
    RAISE EXCEPTION 'Your host session has expired. Please log in again.';
  END IF;
END;
$$;

-- Internal: does any OTHER active booking overlap these dates for this room?
-- Half-open stay window [check_in, check_out): a room freed on the check-out
-- morning can be taken again that same day.
CREATE OR REPLACE FUNCTION public._room_is_free(
  p_property  TEXT,
  p_room      TEXT,
  p_check_in  DATE,
  p_check_out DATE,
  p_ignore_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.property_id = p_property
      AND b.room = p_room
      AND b.status = 'active'
      AND (p_ignore_id IS NULL OR b.id <> p_ignore_id)
      AND b.check_in < p_check_out
      AND p_check_in < b.check_out
  );
END;
$$;

-- Host login: checks the four-digit code SERVER SIDE and issues a session.
CREATE OR REPLACE FUNCTION public.host_login(p_pin TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pin   TEXT := COALESCE(p_pin, '');
  v_hash  TEXT;
  v_setup TEXT := encode(sha256(convert_to('__REPLACE_ME__', 'UTF8')), 'hex');
  v_token TEXT;
BEGIN
  IF v_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'Please enter the four-digit access code.';
  END IF;

  SELECT value INTO v_hash FROM public.app_secrets WHERE key = 'host_pin_hash';

  IF v_hash IS NULL OR v_hash = v_setup THEN
    RAISE EXCEPTION 'Host login is not set up yet — run supabase/setup.sql with your access code.';
  END IF;

  IF v_hash <> encode(sha256(convert_to(v_pin, 'UTF8')), 'hex') THEN
    PERFORM pg_sleep(1);  -- slow down brute-force guesses of the 4-digit code
    RAISE EXCEPTION 'That access code is incorrect. Please try again.';
  END IF;

  DELETE FROM public.host_sessions WHERE expires_at < now();

  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  INSERT INTO public.host_sessions (token_hash, expires_at)
  VALUES (encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), now() + interval '12 hours');

  RETURN v_token;
END;
$$;

-- Host logout: invalidates the session token.
CREATE OR REPLACE FUNCTION public.host_logout(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.host_sessions
  WHERE token_hash = encode(sha256(convert_to(COALESCE(p_token, ''), 'UTF8')), 'hex');
END;
$$;

-- Used after a page refresh to restore a still-valid host session.
CREATE OR REPLACE FUNCTION public.host_session_valid(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.host_sessions WHERE expires_at < now();

  RETURN EXISTS (
    SELECT 1 FROM public.host_sessions s
    WHERE s.token_hash = encode(sha256(convert_to(COALESCE(p_token, ''), 'UTF8')), 'hex')
  );
END;
$$;

-- Public availability: room number + booked flag only. No guest data.
CREATE OR REPLACE FUNCTION public.get_availability()
RETURNS TABLE (property_id TEXT, room TEXT, is_booked BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.property_id,
         r.room,
         EXISTS (SELECT 1 FROM public.bookings b
                 WHERE b.property_id = r.property_id
                   AND b.room = r.room
                   AND b.status = 'active') AS is_booked
  FROM public.rooms r
  ORDER BY r.property_id, length(r.room), r.room
$$;

-- All bookings — requires a valid host session.
CREATE OR REPLACE FUNCTION public.get_bookings(p_token TEXT)
RETURNS TABLE (
  id          UUID,
  property_id TEXT,
  room        TEXT,
  guest_name  TEXT,
  check_in    DATE,
  check_out   DATE,
  status      TEXT,
  updated_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_host(p_token);

  RETURN QUERY
  SELECT b.id, b.property_id, b.room, b.guest_name,
         b.check_in, b.check_out, b.status, b.updated_at
  FROM public.bookings b
  ORDER BY b.property_id, length(b.room), b.room, b.check_in, b.created_at;
END;
$$;

-- Create a booking: full server-side validation + overlap prevention.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_token    TEXT,
  p_property TEXT,
  p_room     TEXT,
  p_guest    TEXT,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest TEXT := NULLIF(BTRIM(COALESCE(p_guest, '')), '');
  v_id    UUID;
BEGIN
  PERFORM public._require_host(p_token);

  IF v_guest IS NULL THEN
    RAISE EXCEPTION 'Guest name is required.';
  END IF;
  IF length(v_guest) > 120 THEN
    RAISE EXCEPTION 'Guest name is too long (120 characters maximum).';
  END IF;
  IF p_check_in IS NULL OR p_check_out IS NULL THEN
    RAISE EXCEPTION 'Check-in and check-out dates are required.';
  END IF;
  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Check-out must be later than check-in.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.rooms r
                 WHERE r.property_id = COALESCE(p_property, '')
                   AND r.room = COALESCE(p_room, '')) THEN
    RAISE EXCEPTION 'That room does not belong to this property.';
  END IF;
  IF NOT public._room_is_free(p_property, p_room, p_check_in, p_check_out, NULL) THEN
    RAISE EXCEPTION 'Room % is already booked for those dates.', p_room;
  END IF;

  INSERT INTO public.bookings (property_id, room, guest_name, check_in, check_out)
  VALUES (p_property, p_room, v_guest, p_check_in, p_check_out)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Update a booking: guest name, room (same property) and dates.
CREATE OR REPLACE FUNCTION public.update_booking(
  p_token     TEXT,
  p_id        UUID,
  p_room      TEXT,
  p_guest     TEXT,
  p_check_in  DATE,
  p_check_out DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_guest   TEXT := NULLIF(BTRIM(COALESCE(p_guest, '')), '');
BEGIN
  PERFORM public._require_host(p_token);

  SELECT * INTO v_booking FROM public.bookings b WHERE b.id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  IF v_guest IS NULL THEN
    RAISE EXCEPTION 'Guest name is required.';
  END IF;
  IF length(v_guest) > 120 THEN
    RAISE EXCEPTION 'Guest name is too long (120 characters maximum).';
  END IF;
  IF p_check_in IS NULL OR p_check_out IS NULL THEN
    RAISE EXCEPTION 'Check-in and check-out dates are required.';
  END IF;
  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Check-out must be later than check-in.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.rooms r
                 WHERE r.property_id = v_booking.property_id
                   AND r.room = COALESCE(p_room, '')) THEN
    RAISE EXCEPTION 'That room does not belong to this property.';
  END IF;
  IF NOT public._room_is_free(v_booking.property_id, p_room, p_check_in, p_check_out, p_id) THEN
    RAISE EXCEPTION 'Room % is already booked for those dates.', p_room;
  END IF;

  UPDATE public.bookings
     SET room       = p_room,
         guest_name = v_guest,
         check_in   = p_check_in,
         check_out  = p_check_out,
         updated_at = now()
   WHERE id = p_id;
END;
$$;

-- Cancel (or restore) a booking. A cancelled booking no longer counts towards
-- the room's booked status, so the room shows as available again.
CREATE OR REPLACE FUNCTION public.set_booking_status(
  p_token  TEXT,
  p_id     UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
BEGIN
  PERFORM public._require_host(p_token);

  IF p_status IS NULL OR p_status NOT IN ('active', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid booking status.';
  END IF;

  SELECT * INTO v_booking FROM public.bookings b WHERE b.id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  -- Before (re)activating, make sure no other active booking overlaps.
  IF p_status = 'active'
     AND NOT public._room_is_free(v_booking.property_id, v_booking.room,
                                  v_booking.check_in, v_booking.check_out, p_id) THEN
    RAISE EXCEPTION 'Those dates now overlap another active booking for this room.';
  END IF;

  UPDATE public.bookings
     SET status = p_status, updated_at = now()
   WHERE id = p_id;
END;
$$;

-- Delete a booking permanently (host only). Unlike cancel, the row is removed
-- from the database entirely, so it disappears from the dashboard and (when no
-- other active booking overlaps) frees the room for re-booking.
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

-- Unblock a room (host only): cancel every ACTIVE booking for that room so it
-- shows as Available again and can be re-booked. The cancelled rows stay in the
-- table (host can Restore them) but no longer count toward availability.
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

-- 9) Function privileges -----------------------------------------------------
-- Helpers stay internal: only the SECURITY DEFINER functions (owner: postgres)
-- may run them, so guests can never probe session tokens or booking dates.
REVOKE ALL ON FUNCTION public._require_host(TEXT),
                       public._room_is_free(TEXT, TEXT, DATE, DATE, UUID)
FROM PUBLIC;

REVOKE ALL ON FUNCTION public.host_login(TEXT),
                       public.host_logout(TEXT),
                       public.host_session_valid(TEXT),
                       public.get_availability(),
                       public.get_bookings(TEXT),
                       public.create_booking(TEXT, TEXT, TEXT, TEXT, DATE, DATE),
                       public.update_booking(TEXT, UUID, TEXT, TEXT, DATE, DATE),
                       public.set_booking_status(TEXT, UUID, TEXT),
                       public.delete_booking(TEXT, UUID),
                       public.unblock_room(TEXT, TEXT, TEXT)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public._require_host(TEXT),
                          public._room_is_free(TEXT, TEXT, DATE, DATE, UUID)
TO postgres;

GRANT EXECUTE ON FUNCTION public.host_login(TEXT),
                          public.host_logout(TEXT),
                          public.host_session_valid(TEXT),
                          public.get_availability(),
                          public.get_bookings(TEXT),
                          public.create_booking(TEXT, TEXT, TEXT, TEXT, DATE, DATE),
                          public.update_booking(TEXT, UUID, TEXT, TEXT, DATE, DATE),
                          public.set_booking_status(TEXT, UUID, TEXT),
                          public.delete_booking(TEXT, UUID),
                          public.unblock_room(TEXT, TEXT, TEXT)
TO anon, authenticated;

-- 10) Seed the existing allocations (from accommodation.xlsx) ----------------
-- Run supabase/seed-bookings.sql next, then let the API reload its schema:
NOTIFY pgrst, 'reload schema';
