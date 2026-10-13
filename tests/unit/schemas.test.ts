import { describe, expect, it } from "vitest";
import { contributionInputSchema, mutationSchema, questionProposalSchema, safeUrl } from "@/lib/domain/schemas";

describe("input validation", () => {
  it("accepts only http(s) links", () => {
    expect(safeUrl.safeParse("https://example.org/a").success).toBe(true);
    expect(safeUrl.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safeUrl.safeParse("data:text/html,hi").success).toBe(false);
    expect(safeUrl.safeParse("not a url").success).toBe(false);
  });

  it("trims and strips control characters", () => {
    const r = contributionInputSchema.parse({ taskId: "t-1", title: "  A title\u0000  ", summary: "x".repeat(25), kind: "code", links: [], negativeResult: false });
    expect(r.title).toBe("A title");
  });

  it("requires research questions to be questions", () => {
    expect(questionProposalSchema.safeParse({ problemId: "p-water", question: "Calibration is hard for people", rationale: "r".repeat(40) }).success).toBe(false);
    expect(questionProposalSchema.safeParse({ problemId: "p-water", question: "Is calibration hard for people?", rationale: "r".repeat(40) }).success).toBe(true);
  });

  it("rejects unknown mutation types and malformed ids", () => {
    expect(mutationSchema.safeParse({ type: "deleteEverything", payload: {} }).success).toBe(false);
    expect(mutationSchema.safeParse({ type: "claimTask", payload: { taskId: "../../etc" } }).success).toBe(false);
  });
});
