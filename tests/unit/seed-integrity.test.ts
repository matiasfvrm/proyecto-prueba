import { describe, expect, it } from "vitest";
import { seedCatalog as c } from "@/lib/data/seed";
import { buildGraph } from "@/lib/graph/build";

describe("seed data integrity", () => {
  const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id));
  const problems = ids(c.problems), questions = ids(c.questions), tasks = ids(c.tasks), sources = ids(c.sources), users = ids(c.users);

  it("has unique ids and slugs", () => {
    const all = [...c.problems, ...c.questions, ...c.tasks, ...c.hypotheses, ...c.experiments, ...c.solutions, ...c.contributions, ...c.sources, ...c.users].map((x) => x.id);
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(c.problems.map((p) => p.slug)).size).toBe(c.problems.length);
  });

  it("references only existing records", () => {
    for (const p of c.problems) {
      p.sourceIds.forEach((s) => expect(sources.has(s)).toBe(true));
      p.relatedProblemIds.forEach((r) => expect(problems.has(r)).toBe(true));
      p.claims.flatMap((cl) => cl.sourceIds).forEach((s) => expect(p.sourceIds).toContain(s));
    }
    for (const q of c.questions) expect(problems.has(q.problemId)).toBe(true);
    for (const t of c.tasks) {
      expect(questions.has(t.questionId)).toBe(true);
      expect(c.questions.find((q) => q.id === t.questionId)!.problemId).toBe(t.problemId);
      if (t.assigneeId) expect(users.has(t.assigneeId)).toBe(true);
      expect(t.acceptanceCriteria.length).toBeGreaterThan(0);
    }
    for (const k of c.contributions) {
      expect(tasks.has(k.taskId)).toBe(true);
      expect(users.has(k.authorId)).toBe(true);
    }
  });

  it("makes no validated claims in demo data", () => {
    const statuses = [...c.problems, ...c.questions, ...c.hypotheses, ...c.experiments, ...c.solutions].map((x) => x.status);
    expect(statuses).not.toContain("validated");
    expect(c.problems.flatMap((p) => p.claims).some((cl) => cl.kind === "supported")).toBe(false);
  });

  it("labels every demo profile and uses https sources", () => {
    expect(c.users.every((u) => u.isDemo && u.bio.startsWith("Demo profile"))).toBe(true);
    expect(c.sources.every((s) => s.url.startsWith("https://"))).toBe(true);
  });

  it("documented claims always cite a source", () => {
    for (const cl of c.problems.flatMap((p) => p.claims)) if (cl.kind === "documented") expect(cl.sourceIds.length).toBeGreaterThan(0);
  });

  it("builds a consistent graph", () => {
    const g = buildGraph(c);
    const nodeIds = new Set(g.nodes.map((n) => n.id));
    expect(nodeIds.size).toBe(g.nodes.length);
    g.edges.forEach((e) => {
      expect(nodeIds.has(e.source)).toBe(true);
      expect(nodeIds.has(e.target)).toBe(true);
    });
    expect(g.nodes.filter((n) => n.type === "task")).toHaveLength(c.tasks.length);
    g.nodes.forEach((n) => expect(n.href.startsWith("/")).toBe(true));
  });
});
