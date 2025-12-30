-- Migration: Fix question_nodes foreign key constraint
-- Purpose: Allow question_nodes to reference both issue_variants AND issue_nodes
--          Currently only references issue_variants, but we query with issue_node keys

-- ============================================
-- Drop the restrictive foreign key
-- ============================================

-- First, drop the existing foreign key constraint
ALTER TABLE question_nodes
  DROP CONSTRAINT IF EXISTS question_nodes_issue_key_fkey;

-- ============================================
-- Comments
-- ============================================

COMMENT ON COLUMN question_nodes.issue_key IS
  'Can reference either issue_variants.key OR issue_nodes.key - flexible to support questions at any taxonomy level';

-- Note: We don't add a new foreign key because it needs to reference multiple tables.
-- The application layer will ensure referential integrity.
-- This allows questions to be attached to categories, subcategories, or specific issue variants.
