/**
 * Non-AI duplicate detection: TF weighted token overlap (cosine similarity)
 * between a draft problem and existing problems. Deterministic and explainable.
 */
const STOP = new Set(
  "a an and are as at be by can could for from has have how in into is it its of on or that the their this to was we what when where which who why will with without more less than not our your they them these those do does".split(" "),
);

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
    .map((t) => t.replace(/(ing|ed|es|s)$/, ""));
}

function vector(ts: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of ts) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

export function cosine(a: string, b: string): number {
  const va = vector(tokens(a));
  const vb = vector(tokens(b));
  let dot = 0;
  for (const [k, v] of va) dot += v * (vb.get(k) ?? 0);
  const norm = (v: Map<string, number>) => Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0));
  const d = norm(va) * norm(vb);
  return d === 0 ? 0 : dot / d;
}

export interface SimilarMatch {
  id: string;
  title: string;
  score: number;
  sharedTerms: string[];
}

export function findSimilar(
  draft: { title: string; description: string },
  candidates: Array<{ id: string; title: string; summary: string; definition?: string }>,
  threshold = 0.18,
): SimilarMatch[] {
  const draftText = `${draft.title} ${draft.title} ${draft.description}`;
  const draftTokens = new Set(tokens(draftText));
  return candidates
    .map((c) => {
      const text = `${c.title} ${c.title} ${c.summary} ${c.definition ?? ""}`;
      const shared = [...new Set(tokens(text))].filter((t) => draftTokens.has(t));
      return { id: c.id, title: c.title, score: cosine(draftText, text), sharedTerms: shared.slice(0, 6) };
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
