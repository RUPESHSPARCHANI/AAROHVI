import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawUrl 
  ? String(rawUrl).trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : null;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseKey && 
    !supabaseUrl.includes('your_') && 
    !supabaseKey.includes('your_')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export default supabase;
