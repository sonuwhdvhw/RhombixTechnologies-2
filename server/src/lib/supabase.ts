import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in server/.env');
}

// Use service_role if available (bypasses RLS), otherwise fallback to anon
const adminKey = supabaseServiceKey && !supabaseServiceKey.includes('your-service-role')
  ? supabaseServiceKey
  : supabaseAnonKey;

if (!supabaseServiceKey || supabaseServiceKey.includes('your-service-role')) {
  console.warn(
    '\x1b[33m[WARN] SUPABASE_SERVICE_ROLE_KEY not set — using anon key (RLS applies to server)\x1b[0m'
  );
}

// Admin client — used for all server-side DB operations
export const supabaseAdmin = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create a client with user's JWT for RLS-respecting operations
export const createUserClient = (accessToken: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
