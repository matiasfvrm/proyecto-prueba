import { NextResponse } from "next/server";
import { fieldErrors, mutationSchema } from "@/lib/domain/schemas";
import { clientKey, LIMITS, rateLimit } from "@/lib/server/rate-limit";
import { APP_MODE } from "@/lib/config";
import { applySupabaseMutation } from "@/lib/supabase/mutations";

const MAX_BODY_BYTES = 32_000;

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Request is too large." }, { status: 413 });
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed JSON." }, { status: 400 });
  }

  const parsed = mutationSchema.safeParse(json);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return NextResponse.json(
      { ok: false, error: Object.values(errors)[0] ?? "Invalid input.", fieldErrors: errors },
      { status: 422 },
    );
  }

  const { limit, windowMs } = LIMITS[parsed.data.type] ?? LIMITS.default;
  const rl = rateLimit(`${clientKey(req)}:${parsed.data.type}`, limit, windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many requests. Try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } },
    );
  }

  if (APP_MODE === "demo") {
    // Demo mode: input is validated here, then stored in the visitor's own browser.
    // Nothing is written to a shared database.
    return NextResponse.json({ ok: true, mode: "demo", mutation: parsed.data });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
  const result = await applySupabaseMutation(token, parsed.data);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 400 });
}
