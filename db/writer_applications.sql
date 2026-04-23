-- Writer applications: users submit credentials + documents for admin review.
-- Approved applicants gain is_writer = true on their profile, which unlocks
-- article submission.

-- 1. Extend profiles with is_writer flag ----------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_writer boolean NOT NULL DEFAULT false;

-- 2. writer_applications --------------------------------------------------
CREATE TABLE IF NOT EXISTS writer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  credentials text NOT NULL,
  bio text,
  document_paths text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS writer_applications_user_id_idx
  ON writer_applications(user_id);
CREATE INDEX IF NOT EXISTS writer_applications_status_idx
  ON writer_applications(status);

ALTER TABLE writer_applications ENABLE ROW LEVEL SECURITY;

-- Users can see and insert their own applications. Admin paths use the
-- service role, which bypasses RLS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'writer_applications' AND policyname = 'Users read own applications'
  ) THEN
    CREATE POLICY "Users read own applications" ON writer_applications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'writer_applications' AND policyname = 'Users insert own applications'
  ) THEN
    CREATE POLICY "Users insert own applications" ON writer_applications
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Storage bucket for writer-submitted documents -----------------------
-- Run manually in Supabase (or use this SQL):
INSERT INTO storage.buckets (id, name, public)
VALUES ('writer-documents', 'writer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload into their own folder: {user_id}/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Writer docs: users upload own folder'
  ) THEN
    CREATE POLICY "Writer docs: users upload own folder" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'writer-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Writer docs: users read own folder'
  ) THEN
    CREATE POLICY "Writer docs: users read own folder" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'writer-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
