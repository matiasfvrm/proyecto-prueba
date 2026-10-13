import type { ActivityEvent, Catalog, Contribution, Review } from "@/lib/domain/types";
import { sources } from "./sources";
import { users } from "./users";
import { water } from "./water";
import { food } from "./food";
import { energy } from "./energy";
import { science } from "./science";
import { heat } from "./heat";
import { edtech } from "./edtech";
import { storage } from "./storage";

const bundles = [water, science, heat, edtech, food, energy, storage];

/** Demo contributions by fictional demo profiles. Links point to placeholders on purpose. */
const contributions: Contribution[] = [
  {
    id: "c-1", taskId: "t-water-3a", problemId: "p-water", questionId: "q-water-3", authorId: "u-mei",
    title: "Draft schema v0.1 for community water readings",
    summary: "Proposes required fields for site, device, calibration history and measurement, with three example records. Open questions listed in the rationale.",
    kind: "documentation", links: [], negativeResult: false, status: "accepted", createdAt: "2026-08-21T10:00:00Z",
  },
  {
    id: "c-2", taskId: "t-water-1a", problemId: "p-water", questionId: "q-water-1", authorId: "u-amara",
    title: "Bench-test protocol draft",
    summary: "Protocol with replicate counts, ambient-light control and CSV template. Tolerance values are marked as placeholders pending reviewer input.",
    kind: "documentation", links: [], negativeResult: false, status: "submitted", createdAt: "2026-10-06T15:00:00Z",
  },
  {
    id: "c-3", taskId: "t-sci-2a", problemId: "p-science", questionId: "q-sci-2", authorId: "u-mei",
    title: "Notebook re-execution harness (container-isolated)",
    summary: "Harness re-runs notebooks in isolated containers with a timeout and classifies failures (missing dependency, missing data, runtime error, timeout).",
    kind: "code", links: [], negativeResult: false, status: "submitted", createdAt: "2026-10-09T09:00:00Z",
  },
  {
    id: "c-4", taskId: "t-sci-2b", problemId: "p-science", questionId: "q-sci-2", authorId: "u-amara",
    title: "Pre-registration: definition of a successful re-run",
    summary: "Defines sampling frame, success criteria and analysis plan before any notebooks are executed.",
    kind: "documentation", links: [], negativeResult: false, status: "accepted", createdAt: "2026-07-30T12:00:00Z",
  },
  {
    id: "c-5", taskId: "t-sci-1a", problemId: "p-science", questionId: "q-sci-1", authorId: "u-sofia",
    title: "Interview guide and consent script",
    summary: "Ten non-leading questions and a consent script for 20-minute interviews.",
    kind: "documentation", links: [], negativeResult: false, status: "accepted", createdAt: "2026-06-18T12:00:00Z",
  },
  {
    id: "c-6", taskId: "t-sci-1a", problemId: "p-science", questionId: "q-sci-1", authorId: "u-sofia",
    title: "Pilot preference test: no clear preference observed",
    summary: "A small pilot did not show a clear preference between the two capture approaches. Reported as a negative result with notes on why the design may have been underpowered.",
    kind: "experiment_report", links: [], negativeResult: true, status: "accepted", createdAt: "2026-08-02T12:00:00Z",
  },
  {
    id: "c-7", taskId: "t-edtech-1a", problemId: "p-edtech", questionId: "q-edtech-1", authorId: "u-sofia",
    title: "Accessibility audit protocol v1",
    summary: "Protocol mapping automated, keyboard and screen-reader checks to WCAG 2.2 success criteria, with an evidence template.",
    kind: "documentation", links: [], negativeResult: false, status: "accepted", createdAt: "2026-09-14T12:00:00Z",
  },
];

const reviews: Review[] = [
  { id: "r-1", contributionId: "c-1", reviewerId: "u-amara", decision: "accept", comment: "Meets the acceptance criteria. Calibration-history field is a good addition.", criteriaMet: ["Schema validates the example records", "Includes device calibration history", "Rationale explains each required field"], createdAt: "2026-08-24T10:00:00Z" },
  { id: "r-2", contributionId: "c-4", reviewerId: "u-mei", decision: "accept", comment: "Clear and timestamped before analysis.", criteriaMet: ["Timestamped before analysis", "Defines success unambiguously"], createdAt: "2026-08-01T10:00:00Z" },
  { id: "r-3", contributionId: "c-5", reviewerId: "u-mei", decision: "accept", comment: "Questions are neutral.", criteriaMet: ["Questions are non-leading", "Includes consent script"], createdAt: "2026-06-20T10:00:00Z" },
  { id: "r-4", contributionId: "c-6", reviewerId: "u-amara", decision: "accept", comment: "Accepted as a documented negative result. The related hypothesis is marked inconclusive.", criteriaMet: [], createdAt: "2026-08-05T10:00:00Z" },
  { id: "r-5", contributionId: "c-7", reviewerId: "u-mei", decision: "accept", comment: "Every step maps to a criterion.", criteriaMet: ["Every step maps to a success criterion", "Template records evidence for each finding"], createdAt: "2026-09-16T10:00:00Z" },
];

function buildActivity(): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const b of bundles) {
    events.push({
      id: `a-${b.problem.id}-created`, at: b.problem.createdAt, actorId: "u-sofia", problemId: b.problem.id,
      type: "problem_created", targetId: b.problem.id, message: `Problem published after review: ${b.problem.title}`,
    });
  }
  for (const c of contributions) {
    events.push({
      id: `a-${c.id}-sub`, at: c.createdAt, actorId: c.authorId, problemId: c.problemId,
      type: "contribution_submitted", targetId: c.id, message: `Submitted “${c.title}”`,
    });
  }
  for (const r of reviews) {
    const c = contributions.find((x) => x.id === r.contributionId)!;
    events.push({
      id: `a-${r.id}`, at: r.createdAt, actorId: r.reviewerId, problemId: c.problemId,
      type: "contribution_reviewed", targetId: c.id, message: `Accepted deliverable “${c.title}”`,
    });
  }
  events.push(
    { id: "a-claim-1", at: "2026-09-25T09:00:00Z", actorId: "u-priya", problemId: "p-food", type: "task_claimed", targetId: "t-food-1a", message: "Claimed “Summarize published food-waste measurement methods”" },
    { id: "a-claim-2", at: "2026-09-02T09:00:00Z", actorId: "u-jonas", problemId: "p-energy", type: "task_claimed", targetId: "t-energy-1a", message: "Claimed “Literature review: in-situ heat-loss estimation methods”" },
    { id: "a-claim-3", at: "2026-09-30T09:00:00Z", actorId: "u-amara", problemId: "p-heat", type: "task_claimed", targetId: "t-heat-2a", message: "Claimed “Travel-time analysis to cooling centers”" },
    { id: "a-status-1", at: "2026-08-05T11:00:00Z", actorId: "u-amara", problemId: "p-science", type: "status_changed", targetId: "h-sci-2", message: "Hypothesis marked inconclusive after pilot results" },
  );
  return events.sort((a, b) => b.at.localeCompare(a.at));
}

export const seedCatalog: Catalog = {
  problems: bundles.map((b) => b.problem),
  questions: bundles.flatMap((b) => b.questions),
  hypotheses: bundles.flatMap((b) => b.hypotheses),
  experiments: bundles.flatMap((b) => b.experiments),
  solutions: bundles.flatMap((b) => b.solutions),
  tasks: bundles.flatMap((b) => b.tasks),
  sources,
  users,
  contributions,
  reviews,
  activity: buildActivity(),
};
