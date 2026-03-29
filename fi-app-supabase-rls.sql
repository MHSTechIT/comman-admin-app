-- Fi App: Enable read access for anon on all dashboard tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/htrbpkycxraweigpqwjf/sql
-- If a table doesn't exist, comment out that section.

-- Helper: creates policy only if table exists (avoids errors for missing tables)
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'profiles', 'user_settings', 'food_logs', 'meal_items', 'daily_logs',
    'meal_logs', 'food_log', 'water_logs', 'drink_logs', 'sleep_logs',
    'reports', 'user_reports', 'health_reports'
  ];
  pol_name TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      pol_name := 'Allow anon read ' || tbl;
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, tbl);
      EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon USING (true)', pol_name, tbl);
      RAISE NOTICE 'Added policy for %', tbl;
    END IF;
  END LOOP;
END $$;

-- To verify: SELECT * FROM food_logs LIMIT 5; SELECT * FROM profiles LIMIT 5;
