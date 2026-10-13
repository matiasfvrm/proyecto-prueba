/**
 * Authorization and state-transition rules. Pure functions shared by the
 * client (to show/hide actions) and the server (to enforce them).
 */
import type { Contribution, ProblemSubmission, QuestionProposal, Task, UserProfile } from "./types";

export const MAX_ACTIVE_TASKS = 3;

export type RuleResult = { ok: true } | { ok: false; reason: string };
const ok: RuleResult = { ok: true };
const no = (reason: string): RuleResult => ({ ok: false, reason });

export function canClaimTask(task: Task, user: UserProfile | null, activeTaskCount: number): RuleResult {
  if (!user) return no("Sign in to claim tasks.");
  if (task.status === "blocked") return no(task.blockedReason ?? "This task is blocked by another task.");
  if (task.status !== "open" || task.assigneeId) return no("This task is not open for claiming.");
  if (activeTaskCount >= MAX_ACTIVE_TASKS)
    return no(`You can hold up to ${MAX_ACTIVE_TASKS} active tasks. Finish or release one first.`);
  return ok;
}

export function canReleaseTask(task: Task, user: UserProfile | null): RuleResult {
  if (!user) return no("Sign in first.");
  if (task.assigneeId !== user.id) return no("Only the assigned contributor can release this task.");
  if (task.status !== "in_progress") return no("Only tasks in progress can be released.");
  return ok;
}

export function canSubmitContribution(task: Task, user: UserProfile | null): RuleResult {
  if (!user) return no("Sign in to submit a contribution.");
  if (task.assigneeId !== user.id) return no("Claim this task before submitting a contribution.");
  if (task.status !== "in_progress") return no("This task is not accepting submissions right now.");
  return ok;
}

export function canReview(contribution: Contribution, user: UserProfile | null): RuleResult {
  if (!user) return no("Sign in to review.");
  if (user.role !== "reviewer" && user.role !== "moderator") return no("Only reviewers can review contributions.");
  if (contribution.authorId === user.id) return no("You cannot review your own contribution.");
  if (contribution.status !== "submitted") return no("This contribution is not awaiting review.");
  return ok;
}

export function canModerate(item: ProblemSubmission | QuestionProposal, user: UserProfile | null): RuleResult {
  if (!user) return no("Sign in to moderate.");
  if (user.role !== "moderator") return no("Only moderators can accept or reject submissions.");
  if (item.authorId === user.id) return no("You cannot moderate your own submission.");
  if (item.status !== "pending_review") return no("This submission has already been decided.");
  return ok;
}

/** Task state after a review decision. Accepting a deliverable never validates research claims. */
export function taskAfterReview(task: Task, decision: "accept" | "request_changes" | "reject"): Pick<Task, "status" | "assigneeId"> {
  switch (decision) {
    case "accept":
      return { status: "completed", assigneeId: task.assigneeId };
    case "request_changes":
      return { status: "in_progress", assigneeId: task.assigneeId };
    case "reject":
      return { status: "open", assigneeId: null };
  }
}

export function contributionAfterReview(decision: "accept" | "request_changes" | "reject"): Contribution["status"] {
  return decision === "accept" ? "accepted" : decision === "request_changes" ? "changes_requested" : "rejected";
}
