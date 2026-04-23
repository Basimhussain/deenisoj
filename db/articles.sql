-- Articles authored by verified writers. Flow:
--   draft → submitted → (admin) approved → published, or rejected.
-- Admin can publish an approved article. Rejected articles remain visible
-- to the author with review_notes.

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,

  slug text UNIQUE,

  title_en text NOT NULL,
  title_ur text,
  excerpt_en text,
  excerpt_ur text,
  body_en text NOT NULL,
  body_ur text,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'published')),
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  submitted_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS articles_author_id_idx ON articles(author_id);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles(slug);

-- updated_at auto-touch
CREATE OR REPLACE FUNCTION articles_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_touch_updated_at ON articles;
CREATE TRIGGER articles_touch_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_touch_updated_at();

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Published articles are readable by everyone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'articles' AND policyname = 'Public read published'
  ) THEN
    CREATE POLICY "Public read published" ON articles
      FOR SELECT USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'articles' AND policyname = 'Authors read own articles'
  ) THEN
    CREATE POLICY "Authors read own articles" ON articles
      FOR SELECT USING (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'articles' AND policyname = 'Writers insert own articles'
  ) THEN
    CREATE POLICY "Writers insert own articles" ON articles
      FOR INSERT WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND is_writer = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'articles' AND policyname = 'Authors update own drafts'
  ) THEN
    CREATE POLICY "Authors update own drafts" ON articles
      FOR UPDATE USING (
        auth.uid() = author_id
        AND status IN ('draft', 'rejected')
      ) WITH CHECK (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'articles' AND policyname = 'Authors delete own drafts'
  ) THEN
    CREATE POLICY "Authors delete own drafts" ON articles
      FOR DELETE USING (
        auth.uid() = author_id AND status IN ('draft', 'rejected')
      );
  END IF;
END $$;
