import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  if (process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW === '1') throw new Error('readonly_preview_browser_client_disabled');
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
