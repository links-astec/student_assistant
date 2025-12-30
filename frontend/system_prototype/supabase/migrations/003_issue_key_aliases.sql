-- Migration: Issue Key Aliases
-- Purpose: Map legacy seed keys to Wayfinder-ingested canonical keys
-- This allows the system to resolve old issue keys to new Wayfinder data

-- ============================================
-- Create issue_key_aliases table
-- ============================================

CREATE TABLE issue_key_aliases (
  legacy_key TEXT PRIMARY KEY,
  canonical_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE issue_key_aliases IS 'Maps legacy seed issue keys to canonical Wayfinder-ingested keys';

-- ============================================
-- Seed alias mappings
-- ============================================

-- ID Card legacy keys -> Wayfinder keys
INSERT INTO issue_key_aliases (legacy_key, canonical_key) VALUES
  ('id_card_pickup', 'student_id_cards__get_your_student_id_card'),
  ('id_card_replacement_lost', 'student_id_cards__replace_your_student_id_card');

-- Future aliases can be added here as more Wayfinder content is ingested
-- and old seed data is deprecated
