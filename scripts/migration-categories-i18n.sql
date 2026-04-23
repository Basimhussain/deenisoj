-- =====================================================================
-- Migration: Add Urdu names to categories and category_id FK on fatwas
-- =====================================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =====================================================================

-- 1. Wipe existing (stale) categories — user is creating fresh ones
DELETE FROM categories;

-- 2. Add Urdu name column to categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_ur TEXT;

-- 3. Make `description` and `sort_order` explicit nulls allowed if not already
-- (no-op if they already are)

-- 4. Add category_id FK on fatwas (nullable, set null on category delete)
ALTER TABLE fatwas
  ADD COLUMN IF NOT EXISTS category_id UUID
  REFERENCES categories(id) ON DELETE SET NULL;

-- 5. Null out the legacy free-text category on existing fatwas
-- so they appear as "uncategorized" until admin re-assigns via edit.
UPDATE fatwas SET category = NULL;

-- 6. Helpful index for filtering by category
CREATE INDEX IF NOT EXISTS fatwas_category_id_idx ON fatwas(category_id);

-- Done. The app code will start using category_id from now on.
