import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function createServiceSupabaseClient() {
  if (process.env.BOREALIS_READONLY_PREVIEW === '1') throw new Error('readonly_preview_service_client_disabled');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server Supabase credentials are not configured.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
