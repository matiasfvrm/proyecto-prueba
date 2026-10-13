/**
 * Core domain model for UNsolved.
 *
 * The model follows the Problem-to-Solution path:
 * Problem → Evidence → Research Questions → Tasks → Contributions → Validation → Outcomes.
 *
 * Two distinct status axes exist on purpose:
 *  - `EvidenceStatus` describes the epistemic state of a problem, question,
 *    hypothesis or solution (what we know).
 *  - `TaskStatus` / `ContributionStatus` describe work progress (what was done).
 * Completing a task never changes an `EvidenceStatus` automatically.
 */

export const CATEGORIES = [
  { id: "climate", label: "Climate and Environment" },
  { id: "energy", label: "Energy" },
  { id: "water", label: "Water and Sanitation" },
  { id: "food", label: "Food Security" },
  { id: "health", label: "Healthcare Research" },
  { id: "education", label: "Education" },
  { id: "science", label: "Scientific Discovery" },
  { id: "infrastructure", label: "Technology and Infrastructure" },
  { id: "accessibility", label: "Accessibility" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const EVIDENCE_STATUSES = [
  "proposed",
  "under_investigation",
  "evidence_submitted",
  "under_review",
  "validated",
  "inconclusive",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const TASK_STATUSES = ["open", "in_progress", "in_review", "completed", "blocked"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const CONTRIBUTION_STATUSES = [
  "submitted",
  "changes_requested",
  "accepted",
  "rejected",
] as const;
export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];

export const CONTRIBUTION_KINDS = [
  { id: "code", label: "Code" },
  { id: "dataset", label: "Dataset" },
  { id: "analysis", label: "Data analysis" },
  { id: "documentation", label: "Documentation" },
  { id: "design", label: "Design" },
  { id: "experiment_report", label: "Experiment report" },
  { id: "literature_review", label: "Literature review" },
] as const;
export type ContributionKind = (typeof CONTRIBUTION_KINDS)[number]["id"];

export const DIFFICULTIES = ["introductory", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SUBMISSION_STATUSES = ["pending_review", "accepted", "rejected"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SKILLS = [
  "Python",
  "TypeScript",
  "Embedded systems",
  "Data analysis",
  "Statistics",
  "GIS",
  "Machine learning",
  "UX research",
  "Interface design",
  "Technical writing",
  "Literature review",
  "Field research",
  "Laboratory methods",
  "Chemistry",
  "Electrical engineering",
  "Building science",
  "Supply chain",
  "Policy analysis",
  "Accessibility testing",
  "Translation",
  "Community outreach",
] as const;
export type Skill = (typeof SKILLS)[number];

/**
 * How much trust a statement deserves.
 * - documented: stated in a cited external source (not verified by UNsolved itself)
 * - hypothesis: a testable idea, not yet supported
 * - proposal: an unverified suggestion
 * - supported: supported by evidence that passed the platform's validation criteria
 */
export const CLAIM_KINDS = ["documented", "hypothesis", "proposal", "supported"] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

export interface Source {
  id: string;
  title: string;
  publisher: string;
  year?: number;
  url: string;
  type: "guideline" | "report" | "paper" | "dataset" | "standard" | "website";
}

export interface Claim {
  id: string;
  statement: string;
  kind: ClaimKind;
  sourceIds: string[];
}

export interface Approach {
  title: string;
  description: string;
  limitations: string[];
}

export interface Cause {
  id: string;
  title: string;
  description: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  category: CategoryId;
  summary: string;
  whyItMatters: string;
  definition: string;
  difficulty: Difficulty;
  status: EvidenceStatus;
  skills: Skill[];
  causes: Cause[];
  claims: Claim[];
  approaches: Approach[];
  limitations: string[];
  validationCriteria: string[];
  sourceIds: string[];
  relatedProblemIds: string[];
  createdAt: string;
  updatedAt: string;
  /** Set when the problem came from an accepted community submission. */
  origin?: "community";
}

export interface ResearchQuestion {
  id: string;
  problemId: string;
  question: string;
  whyItMatters: string;
  existingKnowledge: string;
  uncertainties: string[];
  suggestedApproaches: string[];
  skills: Skill[];
  status: EvidenceStatus;
  sourceIds: string[];
}

export interface Hypothesis {
  id: string;
  questionId: string;
  statement: string;
  status: EvidenceStatus;
}

export interface Experiment {
  id: string;
  hypothesisId: string;
  title: string;
  design: string;
  status: EvidenceStatus;
}

export interface Solution {
  id: string;
  problemId: string;
  title: string;
  summary: string;
  status: EvidenceStatus;
  questionIds: string[];
}

export interface Task {
  id: string;
  problemId: string;
  questionId: string;
  title: string;
  objective: string;
  description: string;
  deliverable: string;
  skills: Skill[];
  difficulty: Difficulty;
  effort: string;
  acceptanceCriteria: string[];
  status: TaskStatus;
  assigneeId: string | null;
  sourceIds: string[];
  blockedReason?: string;
}

export interface Contribution {
  id: string;
  taskId: string;
  problemId: string;
  questionId: string;
  authorId: string;
  title: string;
  summary: string;
  kind: ContributionKind;
  links: string[];
  /** Unsuccessful or null results are valuable and explicitly supported. */
  negativeResult: boolean;
  status: ContributionStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  contributionId: string;
  reviewerId: string;
  decision: "accept" | "request_changes" | "reject";
  comment: string;
  criteriaMet: string[];
  createdAt: string;
}

export type UserRole = "contributor" | "reviewer" | "moderator";

export interface UserProfile {
  id: string;
  handle: string;
  name: string;
  bio: string;
  skills: Skill[];
  interests: CategoryId[];
  role: UserRole;
  /** Demo profiles are fictional and must be labeled as such in the UI. */
  isDemo: boolean;
  joinedAt: string;
}

export interface ProblemSubmission {
  id: string;
  authorId: string;
  title: string;
  description: string;
  whyItMatters: string;
  category: CategoryId;
  evidence: string;
  existingApproaches: string;
  limitations: string;
  sources: string[];
  researchQuestions: string[];
  status: SubmissionStatus;
  createdAt: string;
}

export interface QuestionProposal {
  id: string;
  problemId: string;
  authorId: string;
  question: string;
  rationale: string;
  status: SubmissionStatus;
  createdAt: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  targetType: "contribution" | "problem_submission" | "question_proposal" | "profile";
  targetId: string;
  reason: "spam" | "harassment" | "misinformation" | "plagiarism" | "other";
  details: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  at: string;
  actorId: string;
  problemId: string;
  type:
    | "problem_created"
    | "question_added"
    | "task_created"
    | "task_claimed"
    | "task_released"
    | "contribution_submitted"
    | "contribution_reviewed"
    | "question_proposed"
    | "status_changed";
  targetId: string;
  message: string;
}

export interface Catalog {
  problems: Problem[];
  questions: ResearchQuestion[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  solutions: Solution[];
  tasks: Task[];
  sources: Source[];
  users: UserProfile[];
  contributions: Contribution[];
  reviews: Review[];
  activity: ActivityEvent[];
}
