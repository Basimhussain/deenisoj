-- Ulama profiles: admin-managed list of scholars associated with the platform.
-- Public read; admin-only write.

CREATE TABLE IF NOT EXISTS ulama (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  summary text,
  education text,
  teachers text,
  bio text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ulama_sort_order_idx ON ulama(sort_order);

CREATE OR REPLACE FUNCTION ulama_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ulama_touch_updated_at ON ulama;
CREATE TRIGGER ulama_touch_updated_at
  BEFORE UPDATE ON ulama
  FOR EACH ROW EXECUTE FUNCTION ulama_touch_updated_at();

ALTER TABLE ulama ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ulama' AND policyname = 'Public read access'
  ) THEN
    CREATE POLICY "Public read access" ON ulama
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ulama' AND policyname = 'Admin insert'
  ) THEN
    CREATE POLICY "Admin insert" ON ulama
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ulama' AND policyname = 'Admin update'
  ) THEN
    CREATE POLICY "Admin update" ON ulama
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ulama' AND policyname = 'Admin delete'
  ) THEN
    CREATE POLICY "Admin delete" ON ulama
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;
