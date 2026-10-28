-- ============================================================================
-- Seed: existing room allocations from accommodation.xlsx
-- worksheets "Krishna-In" and "SVPC".
--
-- Run AFTER supabase/setup.sql. Safe to re-run — it does nothing if the
-- bookings table already contains rows. After running, reload the page; the
-- public cards will show Booked: 8 / Available: 0 per property.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.bookings) THEN
    RAISE NOTICE 'bookings already contains rows — seed skipped.';
  ELSE
    INSERT INTO public.bookings (property_id, room, guest_name, check_in, check_out) VALUES
      ('krishna-inn', '1', 'Sridhar',                '2026-12-10', '2026-12-13'),
      ('krishna-inn', '2', 'Radha Krisha',            '2026-12-12', '2026-12-13'),
      ('krishna-inn', '3', 'K Subbarao',              '2026-12-12', '2026-12-13'),
      ('krishna-inn', '4', 'Shekar, Surya',           '2026-12-12', '2026-12-13'),
      ('krishna-inn', '5', 'Additional',              '2026-12-12', '2026-12-13'),
      ('krishna-inn', '6', 'Teja - Director',         '2026-12-11', '2026-12-13'),
      ('krishna-inn', '7', 'Teja - Dheeraj',          '2026-12-12', '2026-12-13'),
      ('krishna-inn', '8', 'Teja - Hari & Kranthi',   '2026-12-12', '2026-12-13'),
      ('svpc', '1', 'Aneel, Bala, Shiva',   '2026-12-12', '2026-12-13'),
      ('svpc', '2', 'Shristi',              '2026-12-12', '2026-12-13'),
      ('svpc', '3', 'Btech Boys',           '2026-12-12', '2026-12-13'),
      ('svpc', '4', 'Btech Girls',          '2026-12-12', '2026-12-13'),
      ('svpc', '5', 'Btech Girls',          '2026-12-12', '2026-12-13'),
      ('svpc', '6', 'Manisha, Teja, Shylu', '2026-12-12', '2026-12-13'),
      ('svpc', '7', 'Chanti Frnds',         '2026-12-12', '2026-12-13'),
      ('svpc', '8', 'Chanti Frnds',         '2026-12-12', '2026-12-13');
  END IF;
END $$;
