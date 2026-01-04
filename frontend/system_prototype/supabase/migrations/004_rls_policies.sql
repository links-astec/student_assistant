-- Migration: RLS Policies for Anonymous Access
-- Purpose: Enable Row Level Security and allow anonymous access to all tables
-- This is needed for the chatbot to function without authentication

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_key_aliases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create policies for anonymous access
-- ============================================

-- Chat sessions: Allow all operations (users manage their own sessions)
CREATE POLICY "Allow anonymous insert on chat_sessions"
  ON chat_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on chat_sessions"
  ON chat_sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update on chat_sessions"
  ON chat_sessions FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous delete on chat_sessions"
  ON chat_sessions FOR DELETE
  TO anon
  USING (true);

-- Chat state: Allow all operations
CREATE POLICY "Allow anonymous insert on chat_state"
  ON chat_state FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on chat_state"
  ON chat_state FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update on chat_state"
  ON chat_state FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous delete on chat_state"
  ON chat_state FOR DELETE
  TO anon
  USING (true);

-- Issue nodes: Read-only
CREATE POLICY "Allow anonymous select on issue_nodes"
  ON issue_nodes FOR SELECT
  TO anon
  USING (true);

-- Issue variants: Read-only
CREATE POLICY "Allow anonymous select on issue_variants"
  ON issue_variants FOR SELECT
  TO anon
  USING (true);

-- Contacts: Read-only
CREATE POLICY "Allow anonymous select on contacts"
  ON contacts FOR SELECT
  TO anon
  USING (true);

-- Question nodes: Read-only
CREATE POLICY "Allow anonymous select on question_nodes"
  ON question_nodes FOR SELECT
  TO anon
  USING (true);

-- Slot definitions: Read-only
CREATE POLICY "Allow anonymous select on slot_definitions"
  ON slot_definitions FOR SELECT
  TO anon
  USING (true);

-- Email templates: Read-only
CREATE POLICY "Allow anonymous select on email_templates"
  ON email_templates FOR SELECT
  TO anon
  USING (true);

-- Issue key aliases: Read-only
CREATE POLICY "Allow anonymous select on issue_key_aliases"
  ON issue_key_aliases FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- Comments
-- ============================================

COMMENT ON POLICY "Allow anonymous insert on chat_sessions" ON chat_sessions IS 'Allows anonymous users to create chat sessions';
COMMENT ON POLICY "Allow anonymous select on chat_sessions" ON chat_sessions IS 'Allows anonymous users to read their chat sessions';
COMMENT ON POLICY "Allow anonymous update on chat_sessions" ON chat_sessions IS 'Allows anonymous users to update their chat sessions';

COMMENT ON POLICY "Allow anonymous insert on chat_state" ON chat_state IS 'Allows anonymous users to create chat state';
COMMENT ON POLICY "Allow anonymous select on chat_state" ON chat_state IS 'Allows anonymous users to read chat state';
COMMENT ON POLICY "Allow anonymous update on chat_state" ON chat_state IS 'Allows anonymous users to update chat state';

COMMENT ON POLICY "Allow anonymous select on issue_nodes" ON issue_nodes IS 'Allows anonymous users to view issue taxonomy';
COMMENT ON POLICY "Allow anonymous select on issue_variants" ON issue_variants IS 'Allows anonymous users to view issue variants';
COMMENT ON POLICY "Allow anonymous select on contacts" ON contacts IS 'Allows anonymous users to view contact information';
COMMENT ON POLICY "Allow anonymous select on question_nodes" ON question_nodes IS 'Allows anonymous users to view follow-up questions';
COMMENT ON POLICY "Allow anonymous select on slot_definitions" ON slot_definitions IS 'Allows anonymous users to view slot definitions';
COMMENT ON POLICY "Allow anonymous select on email_templates" ON email_templates IS 'Allows anonymous users to view email templates';
COMMENT ON POLICY "Allow anonymous select on issue_key_aliases" ON issue_key_aliases IS 'Allows anonymous users to resolve issue key aliases';
