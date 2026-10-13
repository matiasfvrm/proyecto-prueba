import { NextResponse } from "next/server";
import { getAssistant } from "@/lib/ai";
import { proposalDraftSchema } from "@/lib/ai/types";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit(`${clientKey(req)}:assist`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: `Too many requests. Try again in ${rl.retryAfterSeconds} seconds.` }, { status: 429 });
  }
  const parsed = proposalDraftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid draft." }, { status: 422 });
  const review = await getAssistant().reviewProposal(parsed.data);
  return NextResponse.json({ ok: true, review });
}
