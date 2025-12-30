-- CampusFlow Initial Schema
-- Supabase Postgres Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Session Management Tables
-- ============================================

-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat state table (stores conversation state as JSONB)
CREATE TABLE chat_state (
  session_id UUID PRIMARY KEY REFERENCES chat_sessions(id) ON DELETE CASCADE,
  state_jsonb JSONB NOT NULL DEFAULT '{
    "phase": "initial",
    "originalMessage": null,
    "candidateIssues": [],
    "selectedIssueKey": null,
    "currentQuestionIndex": 0,
    "collectedSlots": {},
    "messages": []
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Taxonomy Tables
-- ============================================

-- Issue nodes (hierarchical taxonomy)
CREATE TABLE issue_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  parent_key TEXT REFERENCES issue_nodes(key) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Issue variants (leaf/diagnosis items)
CREATE TABLE issue_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  issue_node_key TEXT NOT NULL REFERENCES issue_nodes(key) ON DELETE CASCADE,
  title TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  requires_contact BOOLEAN NOT NULL DEFAULT true
);

-- ============================================
-- Contact & Template Tables
-- ============================================

-- Contacts for each issue
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_key TEXT NOT NULL REFERENCES issue_variants(key) ON DELETE CASCADE,
  department_name TEXT NOT NULL,
  emails TEXT[] NOT NULL DEFAULT '{}',
  phones TEXT[] NOT NULL DEFAULT '{}',
  hours_text TEXT,
  links TEXT[] NOT NULL DEFAULT '{}'
);

-- Question nodes for follow-up questions
CREATE TABLE question_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_key TEXT NOT NULL REFERENCES issue_variants(key) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'text')),
  options JSONB,
  slot_key TEXT,
  UNIQUE(issue_key, order_index)
);

-- Slot definitions
CREATE TABLE slot_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  input_hint TEXT,
  validation_regex TEXT
);

-- Email templates with 5W1H format
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_key TEXT UNIQUE NOT NULL REFERENCES issue_variants(key) ON DELETE CASCADE,
  subject_template TEXT NOT NULL,
  body_template_5w1h TEXT NOT NULL
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_issue_nodes_parent ON issue_nodes(parent_key);
CREATE INDEX idx_issue_variants_node ON issue_variants(issue_node_key);
CREATE INDEX idx_contacts_issue ON contacts(issue_key);
CREATE INDEX idx_question_nodes_issue ON question_nodes(issue_key);
CREATE INDEX idx_chat_sessions_updated ON chat_sessions(updated_at);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_state_updated_at
  BEFORE UPDATE ON chat_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
