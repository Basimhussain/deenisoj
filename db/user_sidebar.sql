-- Add display_name and phone to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Ensure users can read and update their own profile
-- (skip if these policies already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Saved fatwas table
CREATE TABLE IF NOT EXISTS saved_fatwas (
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fatwa_id uuid REFERENCES fatwas(id)     ON DELETE CASCADE NOT NULL,
  saved_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, fatwa_id)
);

ALTER TABLE saved_fatwas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved fatwas" ON saved_fatwas
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
