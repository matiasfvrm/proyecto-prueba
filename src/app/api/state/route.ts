import { NextResponse } from "next/server";
import { APP_MODE } from "@/lib/config";
import { bearer, userClient, userIdFromToken } from "@/lib/supabase/server";
import { loadUserState } from "@/lib/supabase/state";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** Shared user-generated state (Supabase mode only). Demo mode keeps state in the browser. */
export async function GET(req: Request) {
  if (APP_MODE === "demo") return NextResponse.json({ ok: false, error: "Not available in demo mode." }, { status: 404 });
  const rl = rateLimit(`${clientKey(req)}:state`, 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  const token = bearer(req);
  const db = userClient(token);
  const uid = token ? await userIdFromToken(db, token) : null;
  try {
    const { state, hasProfile } = await loadUserState(db, uid);
    return NextResponse.json({ ok: true, state, authenticated: !!uid, hasProfile }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load data." }, { status: 500 });
  }
}
