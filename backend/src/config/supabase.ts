import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env';

// Only create Supabase clients if configured
let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  
  // Admin client for operations requiring elevated permissions
  supabaseAdmin = config.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    : supabase;
}

export { supabase, supabaseAdmin };
