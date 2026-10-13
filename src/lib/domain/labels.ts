import {
  CATEGORIES,
  CONTRIBUTION_KINDS,
  type CategoryId,
  type ClaimKind,
  type ContributionKind,
  type ContributionStatus,
  type Difficulty,
  type EvidenceStatus,
  type TaskStatus,
} from "./types";

export type Tone = "neutral" | "accent" | "info" | "warn" | "success" | "muted" | "danger";

export const EVIDENCE_STATUS_META: Record<
  EvidenceStatus,
  { label: string; tone: Tone; description: string }
> = {
  proposed: {
    label: "Proposed",
    tone: "neutral",
    description: "Suggested by a contributor. Not yet investigated or supported by evidence.",
  },
  under_investigation: {
    label: "Under investigation",
    tone: "info",
    description: "Contributors are actively researching or running experiments.",
  },
  evidence_submitted: {
    label: "Evidence submitted",
    tone: "accent",
    description: "Evidence has been submitted but has not yet been reviewed.",
  },
  under_review: {
    label: "Under review",
    tone: "warn",
    description: "Independent reviewers are checking evidence against the validation criteria.",
  },
  validated: {
    label: "Validated",
    tone: "success",
    description:
      "Evidence met every published validation criterion and passed independent review. Validation can be revisited if new evidence appears.",
  },
  inconclusive: {
    label: "Inconclusive",
    tone: "muted",
    description:
      "Evidence did not support or refute the claim. Documented so others can build on it instead of repeating it.",
  },
};

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "accent" },
  in_progress: { label: "In progress", tone: "info" },
  in_review: { label: "In review", tone: "warn" },
  completed: { label: "Completed", tone: "success" },
  blocked: { label: "Blocked", tone: "danger" },
};

export const CONTRIBUTION_STATUS_META: Record<
  ContributionStatus,
  { label: string; tone: Tone; description: string }
> = {
  submitted: {
    label: "Awaiting review",
    tone: "warn",
    description: "Submitted and waiting for a reviewer.",
  },
  changes_requested: {
    label: "Changes requested",
    tone: "info",
    description: "A reviewer asked for changes before the deliverable can be accepted.",
  },
  accepted: {
    label: "Deliverable accepted",
    tone: "success",
    description:
      "The deliverable meets the task's acceptance criteria. This is not scientific validation of any claim.",
  },
  rejected: {
    label: "Not accepted",
    tone: "muted",
    description: "The deliverable did not meet the task's acceptance criteria.",
  },
};

export const CLAIM_KIND_META: Record<ClaimKind, { label: string; tone: Tone; description: string }> = {
  documented: {
    label: "Documented in sources",
    tone: "info",
    description: "Stated in the cited external sources. UNsolved has not independently verified it.",
  },
  hypothesis: {
    label: "Hypothesis",
    tone: "neutral",
    description: "A testable idea that has not yet been supported by evidence.",
  },
  proposal: {
    label: "Unverified proposal",
    tone: "muted",
    description: "A suggestion from a contributor. Treat as unverified.",
  },
  supported: {
    label: "Supported by validated evidence",
    tone: "success",
    description: "Supported by evidence that passed this problem's validation criteria.",
  },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; description: string }> = {
  introductory: { label: "Introductory", description: "Good first contribution. No specialist background needed." },
  intermediate: { label: "Intermediate", description: "Some domain or technical experience helps." },
  advanced: { label: "Advanced", description: "Requires specialist knowledge or equipment." },
};

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function contributionKindLabel(id: ContributionKind): string {
  return CONTRIBUTION_KINDS.find((k) => k.id === id)?.label ?? id;
}
