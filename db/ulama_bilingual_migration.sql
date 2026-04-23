-- Migration: Convert ulama text fields to JSONB for bilingual (EN/UR) support.
-- Run this ONCE against your Supabase project via the SQL editor.
-- Existing rows are preserved: the old text value becomes the 'en' key;
-- the 'ur' key is left empty so it can be filled via the admin UI.

ALTER TABLE ulama
  ALTER COLUMN name      TYPE jsonb USING jsonb_build_object('en', name, 'ur', name),
  ALTER COLUMN summary   TYPE jsonb USING CASE WHEN summary   IS NOT NULL THEN jsonb_build_object('en', summary,   'ur', '') END,
  ALTER COLUMN education TYPE jsonb USING CASE WHEN education IS NOT NULL THEN jsonb_build_object('en', education, 'ur', '') END,
  ALTER COLUMN teachers  TYPE jsonb USING CASE WHEN teachers  IS NOT NULL THEN jsonb_build_object('en', teachers,  'ur', '') END,
  ALTER COLUMN bio       TYPE jsonb USING CASE WHEN bio       IS NOT NULL THEN jsonb_build_object('en', bio,       'ur', '') END;
