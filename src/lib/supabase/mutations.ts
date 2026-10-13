import "server-only";
import type { Mutation } from "@/lib/domain/schemas";
import { applyMutation } from "@/lib/store/state";
import { appCatalog } from "@/lib/data/catalog";
import { loadUserState } from "./state";
import { userClient, userIdFromToken } from "./server";

export type SupabaseMutationResult = { ok: true; message: string } | { ok: false; error: string; status?: number };

/** Maps database errors to messages safe to show users (no SQL details). */
function friendly(message: string): string {
  const known: Array<[RegExp, string]> = [
    [/not open for claiming/, "This task is not open for claiming."],
    [/active task limit/, "You can hold up to 3 active tasks. Finish or release one first."],
    [/claim this task/, "Claim this task before submitting a contribution."],
    [/own contribution/, "You cannot review your own contribution."],
    [/only reviewers/, "Only reviewers can review contributions."],
    [/acceptance criteria/, "To accept, confirm that every acceptance criterion is met."],
    [/only moderators/, "Only moderators can accept or reject submissions."],
    [/already decided/, "This submission has already been decided."],
    [/duplicate key.*handle/, "That handle is already taken."],
    [/duplicate key/, "That already exists."],
  ];
  return known.find(([re]) => re.test(message))?.[1] ?? "The request could not be completed.";
}

/**
 * Applies a validated mutation in Supabase mode. Rules are checked twice:
 * first with the same pure function the demo uses (clear messages), then by the
 * database (RLS policies and SECURITY DEFINER functions) as the source of truth.
 */
export async function applySupabaseMutation(token: string, m: Mutation): Promise<SupabaseMutationResult> {
  const db = userClient(token);
  const uid = await userIdFromToken(db, token);
  if (!uid) return { ok: false, error: "Your session has expired. Sign in again.", status: 401 };

  const { state } = await loadUserState(db, uid);
  // Authorization context is the authenticated user, never a client-supplied id.
  const check = applyMutation(appCatalog, { ...state, currentUserId: m.type === "createProfile" ? null : state.currentUserId }, m, {
    now: new Date().toISOString(),
    newId: (p) => `${p}-pending`,
  });
  if (!check.ok) return { ok: false, error: check.error, status: 409 };

  const run = async (): Promise<{ error: { message: string } | null }> => {
    switch (m.type) {
      case "createProfile":
        return db.from("profiles").insert({ id: uid, ...m.payload });
      case "updateProfile":
        return db.from("profiles").update(m.payload).eq("id", uid);
      case "followProblem":
        return db.from("follows").upsert({ user_id: uid, problem_id: m.payload.problemId });
      case "unfollowProblem":
        return db.from("follows").delete().eq("user_id", uid).eq("problem_id", m.payload.problemId);
      case "claimTask":
        return db.rpc("claim_task", { p_task_id: m.payload.taskId });
      case "releaseTask":
        return db.rpc("release_task", { p_task_id: m.payload.taskId });
      case "submitContribution": {
        const p = m.payload;
        return db.rpc("submit_contribution", { p_task_id: p.taskId, p_title: p.title, p_summary: p.summary, p_kind: p.kind, p_links: p.links, p_negative: p.negativeResult });
      }
      case "reviewContribution": {
        const p = m.payload;
        return db.rpc("review_contribution", { p_contribution_id: p.contributionId, p_decision: p.decision, p_comment: p.comment, p_criteria: p.criteriaMet });
      }
      case "proposeQuestion": {
        const res = await db.from("question_proposals").insert({ problem_id: m.payload.problemId, author_id: uid, question: m.payload.question, rationale: m.payload.rationale });
        if (res.error) return res;
        return db.from("activity").insert({ actor_id: uid, problem_id: m.payload.problemId, type: "question_proposed", target_id: m.payload.problemId, message: `Proposed question: ${m.payload.question}`.slice(0, 400) });
      }
      case "submitProblem": {
        const p = m.payload;
        return db.from("problem_submissions").insert({
          author_id: uid, title: p.title, description: p.description, why_it_matters: p.whyItMatters, category: p.category, evidence: p.evidence,
          existing_approaches: p.existingApproaches, limitations: p.limitations, sources: p.sources, research_questions: p.researchQuestions,
        });
      }
      case "moderate":
        return db.rpc("moderate_submission", { p_target: m.payload.target, p_id: m.payload.id, p_decision: m.payload.decision });
      case "report":
        return db.from("reports").insert({ reporter_id: uid, target_type: m.payload.targetType, target_id: m.payload.targetId, reason: m.payload.reason, details: m.payload.details });
    }
  };

  const { error } = await run();
  if (error) return { ok: false, error: friendly(error.message), status: 409 };
  return { ok: true, message: check.message };
}
