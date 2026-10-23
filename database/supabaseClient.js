import { createRequire } from 'module';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let createClient = null;
try {
  const mod = await import('@supabase/supabase-js');
  createClient = mod.createClient;
} catch (e1) {
  try {
    const mod = await import('../backend/node_modules/@supabase/supabase-js/dist/module/index.js');
    createClient = mod.createClient;
  } catch (e2) {
    try {
      const require = createRequire(import.meta.url);
      const reqMod = require('../backend/node_modules/@supabase/supabase-js');
      createClient = reqMod.createClient;
    } catch (e3) {
      console.warn('[DatabaseEngine] @supabase/supabase-js module not found in database or backend node_modules. Falling back to local storage.');
    }
  }
}

const rawUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawUrl 
  ? String(rawUrl).trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : null;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = () => {
  return Boolean(
    createClient &&
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
