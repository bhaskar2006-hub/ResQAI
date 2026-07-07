import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  supabaseKey &&
  supabaseKey !== 'your-supabase-anon-key';

let supabaseInstance = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('Supabase Service: Client initialized successfully.');
  } catch (error) {
    console.error('Supabase Service: Failed to initialize client:', error);
  }
} else {
  console.log('Supabase Service: Credentials not configured or using placeholders. Running local database fallback auth.');
}

export const supabase = supabaseInstance;
