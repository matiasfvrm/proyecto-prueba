/**
 * User-generated state layered on top of the editorial catalog.
 *
 * `applyMutation` is a pure function used by the demo-mode store (client) and
 * covered by unit tests. It enforces the same rules as the server.
 */
import type {
  ActivityEvent,
  Catalog,
  Contribution,
  ModerationReport,
  Problem,
  ProblemSubmission,
  QuestionProposal,
  ResearchQuestion,
  Review,
  Source,
  Task,
  UserProfile,
} from "@/lib/domain/types";
import type { Mutation } from "@/lib/domain/schemas";
import {
  canClaimTask,
  canModerate,
  canReleaseTask,
  canReview,
  canSubmitContribution,
  contributionAfterReview,
  taskAfterReview,
} from "@/lib/domain/workflow";
import { slugify } from "@/lib/utils";

export const STATE_VERSION = 1;

export interface UserState {
  version: number;
  currentUserId: string | null;
  profiles: UserProfile[];
  profileOverrides: Record<string, Pick<UserProfile, "bio" | "skills" | "interests">>;
  follows: Record<string, string[]>;
  taskOverrides: Record<string, Pick<Task, "status" | "assigneeId">>;
  contributions: Contribution[];
  contributionOverrides: Record<string, Contribution["status"]>;
  reviews: Review[];
  problemSubmissions: ProblemSubmission[];
  questionProposals: QuestionProposal[];
  reports: ModerationReport[];
  activity: ActivityEvent[];
}

/** Demo follows for fictional profiles so dashboards are not empty when signing in as them. */
const DEMO_FOLLOWS: Record<string, string[]> = {
  "u-amara": ["p-water", "p-heat", "p-science"],
  "u-lucas": ["p-water", "p-storage"],
  "u-mei": ["p-science", "p-water"],
  "u-sofia": ["p-edtech", "p-science"],
  "u-jonas": ["p-energy", "p-heat"],
  "u-priya": ["p-food"],
};

export function emptyState(): UserState {
  return {
    version: STATE_VERSION,
    currentUserId: null,
    profiles: [],
    profileOverrides: {},
    follows: structuredClone(DEMO_FOLLOWS),
    taskOverrides: {},
    contributions: [],
    contributionOverrides: {},
    reviews: [],
    problemSubmissions: [],
    questionProposals: [],
    reports: [],
    activity: [],
  };
}

export interface View extends Catalog {
  follows: Record<string, string[]>;
  problemSubmissions: ProblemSubmission[];
  questionProposals: QuestionProposal[];
  reports: ModerationReport[];
  currentUser: UserProfile | null;
}

function problemFromSubmission(s: ProblemSubmission): { problem: Problem; questions: ResearchQuestion[]; sources: Source[] } {
  const pid = `p-${s.id}`;
  const sources: Source[] = s.sources.map((url, i) => ({
    id: `src-${s.id}-${i}`,
    title: safeHost(url),
    publisher: "Link provided by submitter (not yet reviewed)",
    url,
    type: "website",
  }));
  const problem: Problem = {
    id: pid,
    slug: `${slugify(s.title)}-${s.id.slice(-4)}`,
    title: s.title,
    category: s.category,
    summary: s.description.length > 220 ? `${s.description.slice(0, 217)}…` : s.description,
    whyItMatters: s.whyItMatters,
    definition: s.description,
    difficulty: "intermediate",
    status: "proposed",
    skills: [],
    causes: [],
    claims: [{ id: `cl-${s.id}`, statement: s.evidence, kind: "proposal", sourceIds: sources.map((x) => x.id) }],
    approaches: s.existingApproaches ? [{ title: "Approaches described by submitter", description: s.existingApproaches, limitations: [] }] : [],
    limitations: s.limitations ? s.limitations.split(/\n+/).map((l) => l.trim()).filter(Boolean) : [],
    validationCriteria: [],
    sourceIds: sources.map((x) => x.id),
    relatedProblemIds: [],
    createdAt: s.createdAt,
    updatedAt: s.createdAt,
    origin: "community",
  };
  const questions: ResearchQuestion[] = s.researchQuestions.map((q, i) => ({
    id: `q-${s.id}-${i}`,
    problemId: pid,
    question: q,
    whyItMatters: "Suggested by the problem submitter.",
    existingKnowledge: "Not yet documented.",
    uncertainties: [],
    suggestedApproaches: [],
    skills: [],
    status: "proposed",
    sourceIds: [],
  }));
  return { problem, questions, sources };
}

function questionFromProposal(p: QuestionProposal): ResearchQuestion {
  return {
    id: `q-${p.id}`,
    problemId: p.problemId,
    question: p.question,
    whyItMatters: p.rationale,
    existingKnowledge: "Not yet documented.",
    uncertainties: [],
    suggestedApproaches: [],
    skills: [],
    status: "proposed",
    sourceIds: [],
  };
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Combine the editorial catalog with user state into the view the UI renders. */
export function buildView(seed: Catalog, state: UserState): View {
  const users = [...seed.users, ...state.profiles].map((u) =>
    state.profileOverrides[u.id] ? { ...u, ...state.profileOverrides[u.id] } : u,
  );
  const tasks = seed.tasks.map((t) => (state.taskOverrides[t.id] ? { ...t, ...state.taskOverrides[t.id] } : t));
  const contributions = [...seed.contributions, ...state.contributions].map((c) =>
    state.contributionOverrides[c.id] ? { ...c, status: state.contributionOverrides[c.id] } : c,
  );

  const accepted = state.problemSubmissions.filter((s) => s.status === "accepted").map(problemFromSubmission);
  const acceptedQuestions = state.questionProposals.filter((p) => p.status === "accepted").map(questionFromProposal);

  return {
    ...seed,
    users,
    tasks,
    contributions,
    reviews: [...seed.reviews, ...state.reviews],
    problems: [...seed.problems, ...accepted.map((a) => a.problem)],
    questions: [...seed.questions, ...accepted.flatMap((a) => a.questions), ...acceptedQuestions],
    sources: [...seed.sources, ...accepted.flatMap((a) => a.sources)],
    activity: [...state.activity, ...seed.activity].sort((a, b) => b.at.localeCompare(a.at)),
    follows: state.follows,
    problemSubmissions: state.problemSubmissions,
    questionProposals: state.questionProposals,
    reports: state.reports,
    currentUser: users.find((u) => u.id === state.currentUserId) ?? null,
  };
}

export interface MutationContext {
  now: string;
  newId: (prefix: string) => string;
}

export type MutationResult = { ok: true; state: UserState; message: string; createdId?: string } | { ok: false; error: string };

const fail = (error: string): MutationResult => ({ ok: false, error });

/** Apply a validated mutation. Returns a new state object; never mutates the input. */
export function applyMutation(seed: Catalog, state: UserState, m: Mutation, ctx: MutationContext): MutationResult {
  const view = buildView(seed, state);
  const user = view.currentUser;
  const s: UserState = structuredClone(state);

  const log = (problemId: string, type: ActivityEvent["type"], targetId: string, message: string) => {
    s.activity.unshift({ id: ctx.newId("a"), at: ctx.now, actorId: user!.id, problemId, type, targetId, message });
  };

  if (m.type === "createProfile") {
    if (view.users.some((u) => u.handle === m.payload.handle)) return fail("That handle is already taken.");
    const id = ctx.newId("u");
    s.profiles.push({ ...m.payload, id, role: "contributor", isDemo: false, joinedAt: ctx.now });
    s.currentUserId = id;
    return { ok: true, state: s, message: "Profile created. You are signed in.", createdId: id };
  }

  if (!user) return fail("Sign in to continue.");

  switch (m.type) {
    case "updateProfile": {
      s.profileOverrides[user.id] = { ...m.payload };
      return { ok: true, state: s, message: "Profile updated." };
    }
    case "followProblem":
    case "unfollowProblem": {
      if (!view.problems.some((p) => p.id === m.payload.problemId)) return fail("Problem not found.");
      const current = new Set(s.follows[user.id] ?? []);
      if (m.type === "followProblem") current.add(m.payload.problemId);
      else current.delete(m.payload.problemId);
      s.follows[user.id] = [...current];
      return { ok: true, state: s, message: m.type === "followProblem" ? "Following this problem." : "Unfollowed." };
    }
    case "claimTask": {
      const task = view.tasks.find((t) => t.id === m.payload.taskId);
      if (!task) return fail("Task not found.");
      const active = view.tasks.filter((t) => t.assigneeId === user.id && (t.status === "in_progress" || t.status === "in_review")).length;
      const rule = canClaimTask(task, user, active);
      if (!rule.ok) return fail(rule.reason);
      s.taskOverrides[task.id] = { status: "in_progress", assigneeId: user.id };
      log(task.problemId, "task_claimed", task.id, `Claimed “${task.title}”`);
      return { ok: true, state: s, message: "Task claimed. It is now assigned to you." };
    }
    case "releaseTask": {
      const task = view.tasks.find((t) => t.id === m.payload.taskId);
      if (!task) return fail("Task not found.");
      const rule = canReleaseTask(task, user);
      if (!rule.ok) return fail(rule.reason);
      s.taskOverrides[task.id] = { status: "open", assigneeId: null };
      log(task.problemId, "task_released", task.id, `Released “${task.title}”`);
      return { ok: true, state: s, message: "Task released. Others can now claim it." };
    }
    case "submitContribution": {
      const task = view.tasks.find((t) => t.id === m.payload.taskId);
      if (!task) return fail("Task not found.");
      const rule = canSubmitContribution(task, user);
      if (!rule.ok) return fail(rule.reason);
      const id = ctx.newId("c");
      s.contributions.push({
        id,
        taskId: task.id,
        problemId: task.problemId,
        questionId: task.questionId,
        authorId: user.id,
        title: m.payload.title,
        summary: m.payload.summary,
        kind: m.payload.kind,
        links: m.payload.links,
        negativeResult: m.payload.negativeResult,
        status: "submitted",
        createdAt: ctx.now,
      });
      s.taskOverrides[task.id] = { status: "in_review", assigneeId: user.id };
      log(task.problemId, "contribution_submitted", id, `Submitted “${m.payload.title}”`);
      return { ok: true, state: s, message: "Contribution submitted for review.", createdId: id };
    }
    case "reviewContribution": {
      const c = view.contributions.find((x) => x.id === m.payload.contributionId);
      if (!c) return fail("Contribution not found.");
      const rule = canReview(c, user);
      if (!rule.ok) return fail(rule.reason);
      const task = view.tasks.find((t) => t.id === c.taskId);
      if (m.payload.decision === "accept" && task && !task.acceptanceCriteria.every((x) => m.payload.criteriaMet.includes(x)))
        return fail("To accept, confirm that every acceptance criterion is met.");
      s.reviews.push({ id: ctx.newId("r"), ...m.payload, reviewerId: user.id, createdAt: ctx.now });
      s.contributionOverrides[c.id] = contributionAfterReview(m.payload.decision);
      if (task) s.taskOverrides[task.id] = taskAfterReview(task, m.payload.decision);
      const verb = { accept: "Accepted deliverable", request_changes: "Requested changes on", reject: "Did not accept" }[m.payload.decision];
      log(c.problemId, "contribution_reviewed", c.id, `${verb} “${c.title}”`);
      return { ok: true, state: s, message: "Review recorded." };
    }
    case "proposeQuestion": {
      if (!view.problems.some((p) => p.id === m.payload.problemId)) return fail("Problem not found.");
      const id = ctx.newId("qp");
      s.questionProposals.push({ id, ...m.payload, authorId: user.id, status: "pending_review", createdAt: ctx.now });
      log(m.payload.problemId, "question_proposed", id, `Proposed question: ${m.payload.question}`);
      return { ok: true, state: s, message: "Question submitted. A moderator will review it before it appears.", createdId: id };
    }
    case "submitProblem": {
      const id = ctx.newId("ps");
      s.problemSubmissions.push({ id, ...m.payload, authorId: user.id, status: "pending_review", createdAt: ctx.now });
      return { ok: true, state: s, message: "Problem submitted to the review queue.", createdId: id };
    }
    case "moderate": {
      const list = m.payload.target === "problem_submission" ? s.problemSubmissions : s.questionProposals;
      const item = list.find((x) => x.id === m.payload.id);
      if (!item) return fail("Submission not found.");
      const rule = canModerate(item, user);
      if (!rule.ok) return fail(rule.reason);
      item.status = m.payload.decision;
      return { ok: true, state: s, message: m.payload.decision === "accepted" ? "Accepted. It is now published with status “Proposed”." : "Submission rejected." };
    }
    case "report": {
      s.reports.push({ id: ctx.newId("rep"), ...m.payload, reporterId: user.id, createdAt: ctx.now });
      return { ok: true, state: s, message: "Report sent to moderators. Thank you." };
    }
  }
}
