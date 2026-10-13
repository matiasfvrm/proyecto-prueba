import { describe, expect, it } from "vitest";
import { seedCatalog } from "@/lib/data/seed";
import { applyMutation, buildView, emptyState, type UserState } from "@/lib/store/state";
import type { Mutation } from "@/lib/domain/schemas";

let n = 0;
const ctx = () => ({ now: "2026-10-13T12:00:00.000Z", newId: (p: string) => `${p}-t${++n}` });

function run(state: UserState, m: Mutation): UserState {
  const r = applyMutation(seedCatalog, state, m, ctx());
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
function attempt(state: UserState, m: Mutation) {
  return applyMutation(seedCatalog, state, m, ctx());
}
const as = (s: UserState, id: string | null): UserState => ({ ...s, currentUserId: id });

const contribution = {
  taskId: "t-water-1b",
  title: "Notebook for paired readings",
  summary: "Computes bias and agreement with uncertainty on the labeled synthetic dataset.",
  kind: "code" as const,
  links: ["https://example.org/notebook"],
  negativeResult: false,
};

describe("task and review workflow", () => {
  it("requires sign-in for protected actions", () => {
    const r = attempt(emptyState(), { type: "claimTask", payload: { taskId: "t-water-1b" } });
    expect(r.ok).toBe(false);
  });

  it("runs claim → submit → accept, without validating the research question", () => {
    let s = as(emptyState(), "u-lucas");
    s = run(s, { type: "claimTask", payload: { taskId: "t-water-1b" } });
    let view = buildView(seedCatalog, s);
    expect(view.tasks.find((t) => t.id === "t-water-1b")).toMatchObject({ status: "in_progress", assigneeId: "u-lucas" });

    s = run(s, { type: "submitContribution", payload: contribution });
    view = buildView(seedCatalog, s);
    const c = view.contributions.find((x) => x.taskId === "t-water-1b")!;
    expect(c.status).toBe("submitted");
    expect(view.tasks.find((t) => t.id === "t-water-1b")!.status).toBe("in_review");

    s = as(s, "u-amara");
    s = run(s, {
      type: "reviewContribution",
      payload: { contributionId: c.id, decision: "accept", comment: "Meets every criterion.", criteriaMet: [] },
    });
    view = buildView(seedCatalog, s);
    expect(view.contributions.find((x) => x.id === c.id)!.status).toBe("accepted");
    expect(view.tasks.find((t) => t.id === "t-water-1b")!.status).toBe("completed");
    // Completing a task never changes evidence status.
    const before = seedCatalog.questions.find((q) => q.id === "q-water-1")!.status;
    expect(view.questions.find((q) => q.id === "q-water-1")!.status).toBe(before);
    expect(view.questions.some((q) => q.status === "validated")).toBe(false);
  });

  it("prevents self-review and contributor reviews", () => {
    let s = as(emptyState(), "u-amara");
    s = run(s, { type: "claimTask", payload: { taskId: "t-water-1b" } });
    s = run(s, { type: "submitContribution", payload: contribution });
    const id = buildView(seedCatalog, s).contributions.find((x) => x.taskId === "t-water-1b")!.id;
    const review = { type: "reviewContribution" as const, payload: { contributionId: id, decision: "accept" as const, comment: "Looks good to me.", criteriaMet: [] } };
    expect(attempt(s, review)).toMatchObject({ ok: false, error: expect.stringMatching(/own/) });
    expect(attempt(as(s, "u-lucas"), review)).toMatchObject({ ok: false, error: expect.stringMatching(/reviewers/) });
    expect(attempt(as(s, "u-mei"), review).ok).toBe(true);
  });

  it("reopens the task when a contribution is rejected", () => {
    let s = as(emptyState(), "u-lucas");
    s = run(s, { type: "claimTask", payload: { taskId: "t-water-1b" } });
    s = run(s, { type: "submitContribution", payload: contribution });
    const id = buildView(seedCatalog, s).contributions.find((x) => x.taskId === "t-water-1b")!.id;
    s = run(as(s, "u-mei"), { type: "reviewContribution", payload: { contributionId: id, decision: "reject", comment: "Does not meet the criteria.", criteriaMet: [] } });
    expect(buildView(seedCatalog, s).tasks.find((t) => t.id === "t-water-1b")).toMatchObject({ status: "open", assigneeId: null });
  });

  it("blocks claiming blocked or assigned tasks and caps active tasks", () => {
    const s = as(emptyState(), "u-lucas");
    expect(attempt(s, { type: "claimTask", payload: { taskId: "t-water-2b" } }).ok).toBe(false); // blocked
    expect(attempt(s, { type: "claimTask", payload: { taskId: "t-food-1a" } }).ok).toBe(false); // assigned
    let t = s;
    for (const id of ["t-water-1b", "t-water-2a", "t-water-3b"]) t = run(t, { type: "claimTask", payload: { taskId: id } });
    expect(attempt(t, { type: "claimTask", payload: { taskId: "t-food-1b" } })).toMatchObject({ ok: false, error: expect.stringMatching(/up to 3/) });
  });

  it("only the assignee can submit or release", () => {
    let s = as(emptyState(), "u-lucas");
    s = run(s, { type: "claimTask", payload: { taskId: "t-water-1b" } });
    expect(attempt(as(s, "u-jonas"), { type: "submitContribution", payload: contribution }).ok).toBe(false);
    expect(attempt(as(s, "u-jonas"), { type: "releaseTask", payload: { taskId: "t-water-1b" } }).ok).toBe(false);
    s = run(s, { type: "releaseTask", payload: { taskId: "t-water-1b" } });
    expect(buildView(seedCatalog, s).tasks.find((t) => t.id === "t-water-1b")!.status).toBe("open");
  });

  it("publishes accepted problem submissions as Proposed, only via a moderator", () => {
    let s = as(emptyState(), "u-lucas");
    s = run(s, {
      type: "submitProblem",
      payload: {
        title: "Affordable repair of community water pumps",
        description: "Hand pumps in rural areas often stop working because spare parts and repair skills are not available nearby, which leaves communities without water.",
        whyItMatters: "Broken pumps force people to use unsafe water sources.",
        category: "water",
        evidence: "Evidence summary pending; see linked sources for context.",
        existingApproaches: "",
        limitations: "Data is sparse.\nRepair networks vary.",
        sources: ["https://washdata.org/"],
        researchQuestions: ["Which pump parts fail most often?"],
      },
    });
    const sub = s.problemSubmissions[0];
    expect(buildView(seedCatalog, s).problems.some((p) => p.title === sub.title)).toBe(false);
    const decide = { type: "moderate" as const, payload: { target: "problem_submission" as const, id: sub.id, decision: "accepted" as const } };
    expect(attempt(s, decide).ok).toBe(false); // author cannot moderate own submission
    expect(attempt(as(s, "u-amara"), decide).ok).toBe(false); // reviewer is not moderator
    s = run(as(s, "u-sofia"), decide);
    const view = buildView(seedCatalog, s);
    const p = view.problems.find((x) => x.title === sub.title)!;
    expect(p.status).toBe("proposed");
    expect(p.claims.every((c) => c.kind === "proposal")).toBe(true);
    expect(p.limitations).toEqual(["Data is sparse.", "Repair networks vary."]);
    expect(view.questions.filter((q) => q.problemId === p.id)).toHaveLength(1);
  });

  it("does not mutate input state", () => {
    const s = as(emptyState(), "u-lucas");
    const snapshot = JSON.stringify(s);
    run(s, { type: "followProblem", payload: { problemId: "p-food" } });
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it("rejects duplicate handles", () => {
    const r = attempt(emptyState(), { type: "createProfile", payload: { name: "Someone", handle: "amara", bio: "", skills: [], interests: [] } });
    expect(r).toMatchObject({ ok: false });
  });
});
