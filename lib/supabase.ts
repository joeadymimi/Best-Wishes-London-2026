import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(raw?: string) {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, "");

  // Common misconfig: using PostgREST endpoint as the base URL.
  // Supabase JS expects the project base URL, e.g. https://<ref>.supabase.co
  if (trimmed.endsWith("/rest/v1")) {
    return trimmed.replace(/\/rest\/v1$/, "");
  }

  try {
    const url = new URL(trimmed);
    // If someone pasted a deeper URL (e.g. /rest/v1/, /auth/v1/), drop the path.
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

export function getSupabaseBrowserClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

export function getSupabaseServerClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  // Prefer service-role key on the server so inserts/selects work even when RLS is enabled.
  // NOTE: never expose this key to the browser. Keep it only in server-side env vars.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const key = serviceRoleKey || anonKey;
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
