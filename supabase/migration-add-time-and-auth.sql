-- ============================================================================
-- Migration: Add Check-in/Check-out Times and Secure Host Authentication
-- ============================================================================

-- 1) Add check-in and check-out time columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS check_in_time TEXT NOT NULL DEFAULT '12:00',
  ADD COLUMN IF NOT EXISTS check_out_time TEXT NOT NULL DEFAULT '11:00';

-- 2) Update app_secrets with authorized host salted hashes
-- (Username: Bhuvanmanasa@love.com, Password: Marriage)
INSERT INTO public.app_secrets (key, value)
VALUES
  ('host_user_hash', '30e488bf3f80c162a99162e8ac6f4efc04460a11194fca340bb76f69df86d72a'),
  ('host_pass_hash', 'f1644e2254a84e87ecfee1603f244e01f2c0ac3ba2212abb0358c501b72cf4de')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3) Host login function with username & password hash
CREATE OR REPLACE FUNCTION public.host_login(p_username TEXT, p_password_hash TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stored_user TEXT;
  v_stored_pass TEXT;
  v_token       TEXT;
  v_token_hash  TEXT;
BEGIN
  SELECT value INTO v_stored_user FROM public.app_secrets WHERE key = 'host_user_hash';
  SELECT value INTO v_stored_pass FROM public.app_secrets WHERE key = 'host_pass_hash';

  IF v_stored_user IS NULL OR v_stored_pass IS NULL THEN
    RAISE EXCEPTION 'Setup required';
  END IF;

  IF encode(sha256(convert_to(lower(trim(p_username)), 'UTF8')), 'hex') <> v_stored_user
     OR p_password_hash <> v_stored_pass THEN
    PERFORM pg_sleep(0.7);
    RAISE EXCEPTION 'Incorrect credentials. Try again.';
  END IF;

  v_token := 'host_' || encode(gen_random_bytes(24), 'hex') || '_' || floor(extract(epoch from now()))::text;
  v_token_hash := encode(sha256(convert_to(v_token, 'UTF8')), 'hex');

  DELETE FROM public.host_sessions WHERE expires_at < now();
  INSERT INTO public.host_sessions (token_hash, expires_at)
  VALUES (v_token_hash, now() + INTERVAL '4 hours');

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.host_login(TEXT, TEXT) TO anon, authenticated;
