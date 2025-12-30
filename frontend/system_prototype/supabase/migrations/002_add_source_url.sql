-- Migration 002: Add source_url to issue_variants
-- This column stores the Wayfinder source URL for each issue variant

ALTER TABLE issue_variants
ADD COLUMN source_url TEXT;

COMMENT ON COLUMN issue_variants.source_url IS 'Wayfinder source URL for this issue variant';
