import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Server-side only — uses the service role key to bypass RLS. Lazily created so
// `next build` doesn't require real credentials just to collect page data.
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase env vars are not configured');
  }
  client = createClient(supabaseUrl, supabaseServiceKey);
  return client;
}
