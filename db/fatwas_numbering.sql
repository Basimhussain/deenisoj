-- Add sequential fatwa_number column
ALTER TABLE fatwas ADD COLUMN IF NOT EXISTS fatwa_number integer;

-- Backfill existing rows ordered by their publication/creation date
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY COALESCE(published_at, created_at) ASC) AS num
  FROM fatwas
)
UPDATE fatwas
SET fatwa_number = numbered.num
FROM numbered
WHERE fatwas.id = numbered.id;

-- Add a unique constraint so numbers never collide
ALTER TABLE fatwas ADD CONSTRAINT fatwas_fatwa_number_unique UNIQUE (fatwa_number);
