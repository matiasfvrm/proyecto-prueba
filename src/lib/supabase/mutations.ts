import type { Mutation } from "@/lib/domain/schemas";
export async function applySupabaseMutation(_token: string, _m: Mutation): Promise<{ ok: boolean; error?: string; status?: number }> {
  return { ok: false, error: "Not implemented", status: 501 };
}
