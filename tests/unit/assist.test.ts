import { describe, expect, it } from "vitest";
import { seedCatalog } from "@/lib/data/seed";
import { findSimilar } from "@/lib/domain/similarity";
import { explain, recommendTasks } from "@/lib/domain/recommend";
import { reviewProposalWithRules } from "@/lib/ai/rules-provider";
import { rateLimit } from "@/lib/server/rate-limit";
import { emptyState } from "@/lib/store/state";

describe("duplicate detection", () => {
  it("flags a near-duplicate of an existing problem", () => {
    const m = findSimilar({ title: "Low-cost water quality sensors", description: "Cheap sensors to monitor drinking water quality in communities" }, seedCatalog.problems);
    expect(m[0]?.id).toBe("p-water");
  });
  it("ignores unrelated drafts", () => {
    expect(findSimilar({ title: "Bee colony collapse", description: "Pollinator decline in orchards" }, seedCatalog.problems)).toHaveLength(0);
  });
});

describe("recommendations", () => {
  it("are explainable and only include open tasks", () => {
    const user = seedCatalog.users.find((u) => u.id === "u-amara")!;
    const recs = recommendTasks({ ...seedCatalog, follows: emptyState().follows }, user);
    expect(recs.length).toBeGreaterThan(0);
    recs.forEach((r) => {
      expect(r.task.status).toBe("open");
      expect(explain(r)).toMatch(/^Suggested because it /);
    });
  });
});

describe("rule-based proposal review", () => {
  it("finds gaps in a thin draft and labels its origin", () => {
    const r = reviewProposalWithRules({ title: "Water", description: "It is bad.", whyItMatters: "", evidence: "Always 90% fail.", existingApproaches: "", limitations: "", sources: [], researchQuestions: ["fix it"] });
    expect(r.generatedBy).toBe("rules");
    const fields = r.gaps.map((g) => g.field);
    expect(fields).toEqual(expect.arrayContaining(["title", "description", "evidence", "sources", "researchQuestions"]));
  });
});

describe("rate limiter", () => {
  it("blocks after the limit and resets after the window", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 2, 1000, 0).allowed).toBe(true);
    expect(rateLimit(key, 2, 1000, 10).allowed).toBe(true);
    expect(rateLimit(key, 2, 1000, 20).allowed).toBe(false);
    expect(rateLimit(key, 2, 1000, 1001).allowed).toBe(true);
  });
});
