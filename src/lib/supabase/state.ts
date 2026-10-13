import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emptyState, type UserState } from "@/lib/store/state";
import { appCatalog } from "@/lib/data/catalog";
import type { ActivityEvent, Contribution, ModerationReport, ProblemSubmission, QuestionProposal, Review, UserProfile } from "@/lib/domain/types";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are mapped field by field below */

const LIMITS = { profiles: 2000, contributions: 1000, reviews: 2000, activity: 200, submissions: 500 };

async function rows<T>(q: PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Loads the shared, user-generated overlay that RLS lets this user see.
 * v0.1 loads bounded lists; pagination is on the roadmap.
 */
export async function loadUserState(db: SupabaseClient, uid: string | null): Promise<{ state: UserState; hasProfile: boolean }> {
  const [profiles, tasks, follows, contributions, reviews, problemSubs, proposals, reports, activity] = await Promise.all([
    rows<any>(db.from("profiles").select("*").limit(LIMITS.profiles)),
    rows<any>(db.from("tasks").select("id,status,assignee_id")),
    uid ? rows<any>(db.from("follows").select("problem_id").eq("user_id", uid)) : Promise.resolve([]),
    rows<any>(db.from("contributions").select("*").order("created_at", { ascending: false }).limit(LIMITS.contributions)),
    rows<any>(db.from("reviews").select("*").limit(LIMITS.reviews)),
    rows<any>(db.from("problem_submissions").select("*").order("created_at", { ascending: false }).limit(LIMITS.submissions)),
    rows<any>(db.from("question_proposals").select("*").order("created_at", { ascending: false }).limit(LIMITS.submissions)),
    uid ? rows<any>(db.from("reports").select("*").order("created_at", { ascending: false }).limit(200)) : Promise.resolve([]),
    rows<any>(db.from("activity").select("*").order("at", { ascending: false }).limit(LIMITS.activity)),
  ]);

  const state = emptyState();
  state.follows = {};
  state.profiles = profiles.map(
    (p): UserProfile => ({ id: p.id, handle: p.handle, name: p.name, bio: p.bio, skills: p.skills, interests: p.interests, role: p.role, isDemo: false, joinedAt: p.created_at }),
  );
  const hasProfile = !!uid && state.profiles.some((p) => p.id === uid);
  state.currentUserId = hasProfile ? uid : null;
  if (uid) state.follows[uid] = follows.map((f) => f.problem_id);
  for (const t of tasks) state.taskOverrides[t.id] = { status: t.status, assigneeId: t.assignee_id };
  const taskById = new Map(appCatalog.tasks.map((t) => [t.id, t]));
  state.contributions = contributions.map(
    (c): Contribution => ({
      id: c.id, taskId: c.task_id, problemId: taskById.get(c.task_id)?.problemId ?? "", questionId: taskById.get(c.task_id)?.questionId ?? "", authorId: c.author_id, title: c.title, summary: c.summary,
      kind: c.kind, links: c.links, negativeResult: c.negative_result, status: c.status, createdAt: c.created_at,
    }),
  );
  state.reviews = reviews.map(
    (r): Review => ({ id: r.id, contributionId: r.contribution_id, reviewerId: r.reviewer_id, decision: r.decision, comment: r.comment, criteriaMet: r.criteria_met, createdAt: r.created_at }),
  );
  state.problemSubmissions = problemSubs.map(
    (s): ProblemSubmission => ({
      id: s.id, authorId: s.author_id, title: s.title, description: s.description, whyItMatters: s.why_it_matters, category: s.category, evidence: s.evidence,
      existingApproaches: s.existing_approaches, limitations: s.limitations, sources: s.sources, researchQuestions: s.research_questions, status: s.status, createdAt: s.created_at,
    }),
  );
  state.questionProposals = proposals.map(
    (q): QuestionProposal => ({ id: q.id, problemId: q.problem_id, authorId: q.author_id, question: q.question, rationale: q.rationale, status: q.status, createdAt: q.created_at }),
  );
  state.reports = reports.map(
    (r): ModerationReport => ({ id: r.id, reporterId: r.reporter_id, targetType: r.target_type, targetId: r.target_id, reason: r.reason, details: r.details, createdAt: r.created_at }),
  );
  state.activity = activity.map(
    (a): ActivityEvent => ({ id: a.id, at: a.at, actorId: a.actor_id, problemId: a.problem_id, type: a.type, targetId: a.target_id, message: a.message }),
  );
  return { state, hasProfile };
}
