/**
 * Database Setup Script
 * Creates the tables needed for data collection and analytics
 * 
 * Run with: npx ts-node src/scripts/setupDatabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🗄️  Setting up database tables...\n');

  // Create tables using SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- 1. Chat Sessions - Track each conversation
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
        user_name TEXT,
        student_id TEXT,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        total_messages INT DEFAULT 0,
        
        -- Problem Classification (Granular)
        problem_category TEXT,
        problem_subcategory TEXT,
        problem_specific TEXT,
        problem_details JSONB DEFAULT '{}',
        
        -- Resolution tracking
        resolved BOOLEAN DEFAULT FALSE,
        resolution_type TEXT,
        
        -- Metadata
        language TEXT DEFAULT 'en',
        device_info JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Chat Messages - Every message in detail
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        
        -- Analytics
        sources_used JSONB DEFAULT '[]',
        confidence_score FLOAT,
        classified_intent TEXT,
        detected_entities JSONB DEFAULT '{}',
        
        -- Timing
        response_time_ms INT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. Email Templates Generated
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        
        -- Template details
        template_type TEXT,
        recipient_department TEXT,
        recipient_email TEXT,
        recipient_phone TEXT,
        subject TEXT,
        body TEXT,
        
        -- 5W1H Structure
        five_w_one_h JSONB DEFAULT '{}',
        user_variables JSONB DEFAULT '{}',
        
        -- Status
        was_sent BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 4. User Feedback
      CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
        
        helpful BOOLEAN,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        feedback_type TEXT,
        comments TEXT,
        
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 5. Contact Directory (for quick lookups)
      CREATE TABLE IF NOT EXISTS contact_directory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        department TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        location TEXT,
        office_hours TEXT,
        
        description TEXT,
        keywords TEXT[],
        
        priority INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_problem_category ON chat_sessions(problem_category);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_email_templates_session_id ON email_templates(session_id);
      CREATE INDEX IF NOT EXISTS idx_contact_directory_category ON contact_directory(category);
    `
  });

  if (error) {
    // The RPC might not exist, so let's try direct table creation
    console.log('Note: RPC not available, creating tables individually...\n');
    await createTablesDirectly();
  } else {
    console.log('✅ All tables created successfully!\n');
  }

  // Verify tables exist
  await verifyTables();
}

async function createTablesDirectly() {
  // Create chat_sessions
  console.log('Creating chat_sessions table...');
  const { error: e1 } = await supabase.from('chat_sessions').select('id').limit(1);
  if (e1 && e1.code === '42P01') {
    console.log('  → Table does not exist. Please run the SQL in Supabase Dashboard.');
  } else if (e1) {
    console.log('  → Error:', e1.message);
  } else {
    console.log('  ✓ chat_sessions exists');
  }

  // Create chat_messages
  console.log('Creating chat_messages table...');
  const { error: e2 } = await supabase.from('chat_messages').select('id').limit(1);
  if (e2 && e2.code === '42P01') {
    console.log('  → Table does not exist. Please run the SQL in Supabase Dashboard.');
  } else if (e2) {
    console.log('  → Error:', e2.message);
  } else {
    console.log('  ✓ chat_messages exists');
  }

  // Create email_templates
  console.log('Creating email_templates table...');
  const { error: e3 } = await supabase.from('email_templates').select('id').limit(1);
  if (e3 && e3.code === '42P01') {
    console.log('  → Table does not exist. Please run the SQL in Supabase Dashboard.');
  } else if (e3) {
    console.log('  → Error:', e3.message);
  } else {
    console.log('  ✓ email_templates exists');
  }

  // Create user_feedback
  console.log('Creating user_feedback table...');
  const { error: e4 } = await supabase.from('user_feedback').select('id').limit(1);
  if (e4 && e4.code === '42P01') {
    console.log('  → Table does not exist. Please run the SQL in Supabase Dashboard.');
  } else if (e4) {
    console.log('  → Error:', e4.message);
  } else {
    console.log('  ✓ user_feedback exists');
  }
}

async function verifyTables() {
  console.log('\n📋 Verifying table access...\n');
  
  const tables = ['chat_sessions', 'chat_messages', 'email_templates', 'user_feedback'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: accessible`);
    }
  }
}

// Run setup
setupDatabase()
  .then(() => {
    console.log('\n🎉 Database setup complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
