import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

/**
 * Server-side client that acts *as the requesting user*: the user's JWT is forwarded,
 * so Row Level Security applies exactly as it would in the browser. The service-role
 * key is intentionally never used by the application.
 */
export function userClient(token?: string | null): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

export async function userIdFromToken(client: SupabaseClient, token: string): Promise<string | null> {
  const { data, error } = await client.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

export function bearer(req: Request): string | null {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
}
