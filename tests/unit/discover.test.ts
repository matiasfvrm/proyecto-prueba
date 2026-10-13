import { describe, expect, it } from "vitest";
import { seedCatalog } from "@/lib/data/seed";
import { DEFAULT_FILTERS, filterProblems, filtersFromSearchParams, filtersToSearchParams } from "@/lib/domain/discover";

const now = new Date("2026-10-13T00:00:00Z");

describe("discover filters", () => {
  it("returns every problem with default filters", () => {
    expect(filterProblems(seedCatalog, DEFAULT_FILTERS, now)).toHaveLength(seedCatalog.problems.length);
  });
  it("filters by category, skill and keyword", () => {
    expect(filterProblems(seedCatalog, { ...DEFAULT_FILTERS, categories: ["energy"] }, now).map((r) => r.problem.id).sort()).toEqual(["p-energy", "p-storage"]);
    const bySkill = filterProblems(seedCatalog, { ...DEFAULT_FILTERS, skills: ["Accessibility testing"] }, now);
    expect(bySkill.map((r) => r.problem.id)).toContain("p-edtech");
    const q = filterProblems(seedCatalog, { ...DEFAULT_FILTERS, q: "turbidity sensor" }, now);
    expect(q[0].problem.id).toBe("p-water");
    expect(filterProblems(seedCatalog, { ...DEFAULT_FILTERS, q: "zzzz-nothing" }, now)).toHaveLength(0);
  });
  it("sorts by open tasks", () => {
    const rows = filterProblems(seedCatalog, { ...DEFAULT_FILTERS, sort: "open_tasks" }, now);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].stats.openTasks).toBeGreaterThanOrEqual(rows[i].stats.openTasks);
  });
  it("filters by recent activity", () => {
    const rows = filterProblems(seedCatalog, { ...DEFAULT_FILTERS, activity: "7d" }, now);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(seedCatalog.problems.length);
  });
  it("round-trips through URL params", () => {
    const f = { ...DEFAULT_FILTERS, q: "heat", categories: ["climate" as const], sort: "updated" as const, activity: "30d" as const };
    expect(filtersFromSearchParams(filtersToSearchParams(f))).toEqual(f);
  });
});
