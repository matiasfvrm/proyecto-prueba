import { z } from "zod";
import { CATEGORIES, CONTRIBUTION_KINDS, SKILLS, type CategoryId, type ContributionKind } from "./types";

const categoryIds = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];
const kindIds = CONTRIBUTION_KINDS.map((k) => k.id) as [ContributionKind, ...ContributionKind[]];

/** Trim, collapse control characters and enforce length. All user text passes through this. */
const text = (min: number, max: number, label: string) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
        .max(max, `${label} must be at most ${max} characters.`),
    );

const optionalText = (max: number, label: string) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(max, `${label} must be at most ${max} characters.`));

/** Only http(s) links are accepted; javascript:, data: etc. are rejected. */
export const safeUrl = z
  .string()
  .trim()
  .max(500, "Links must be at most 500 characters.")
  .refine((value) => {
    try {
      const u = new URL(value);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a full http(s) link, for example https://example.org/paper.");

const id = z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/, "Invalid identifier.");

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Handle must be at least 3 characters.")
  .max(24, "Handle must be at most 24 characters.")
  .regex(/^[a-z0-9_-]+$/, "Use lowercase letters, numbers, hyphens or underscores.");

export const skillSchema = z.enum(SKILLS);
export const categorySchema = z.enum(categoryIds);

export const profileInputSchema = z.object({
  name: text(2, 60, "Name"),
  handle: handleSchema,
  bio: optionalText(280, "Bio"),
  skills: z.array(skillSchema).max(10, "Choose up to 10 skills."),
  interests: z.array(categorySchema).max(9),
});

export const contributionInputSchema = z.object({
  taskId: id,
  title: text(5, 120, "Title"),
  summary: text(20, 2000, "Summary"),
  kind: z.enum(kindIds),
  links: z.array(safeUrl).max(5, "Add up to 5 links."),
  negativeResult: z.boolean(),
});

export const reviewInputSchema = z
  .object({
    contributionId: id,
    decision: z.enum(["accept", "request_changes", "reject"]),
    comment: text(10, 1500, "Review comment"),
    criteriaMet: z.array(z.string().max(300)).max(20),
  });

export const questionProposalSchema = z.object({
  problemId: id,
  question: text(15, 240, "Question").refine((q) => q.endsWith("?"), "Phrase the research question as a question ending with “?”."),
  rationale: text(30, 1500, "Rationale"),
});

export const problemSubmissionSchema = z.object({
  title: text(10, 120, "Title"),
  description: text(50, 3000, "Description"),
  whyItMatters: text(30, 1500, "Why it matters"),
  category: categorySchema,
  evidence: text(20, 3000, "Available evidence"),
  existingApproaches: optionalText(2000, "Existing approaches"),
  limitations: optionalText(2000, "Known limitations"),
  sources: z.array(safeUrl).min(1, "Add at least one source link so reviewers can check the evidence.").max(10, "Add up to 10 sources."),
  researchQuestions: z
    .array(text(10, 240, "Research question"))
    .min(1, "Suggest at least one research question.")
    .max(8, "Suggest up to 8 research questions."),
});

export const moderationInputSchema = z.object({
  target: z.enum(["problem_submission", "question_proposal"]),
  id,
  decision: z.enum(["accepted", "rejected"]),
});

export const reportInputSchema = z.object({
  targetType: z.enum(["contribution", "problem_submission", "question_proposal", "profile"]),
  targetId: id,
  reason: z.enum(["spam", "harassment", "misinformation", "plagiarism", "other"]),
  details: optionalText(1000, "Details"),
});

/** Every state-changing operation is one of these. Validated on client (UX) and server (trust). */
export const mutationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("createProfile"), payload: profileInputSchema }),
  z.object({ type: z.literal("updateProfile"), payload: profileInputSchema.pick({ bio: true, skills: true, interests: true }) }),
  z.object({ type: z.literal("followProblem"), payload: z.object({ problemId: id }) }),
  z.object({ type: z.literal("unfollowProblem"), payload: z.object({ problemId: id }) }),
  z.object({ type: z.literal("claimTask"), payload: z.object({ taskId: id }) }),
  z.object({ type: z.literal("releaseTask"), payload: z.object({ taskId: id }) }),
  z.object({ type: z.literal("submitContribution"), payload: contributionInputSchema }),
  z.object({ type: z.literal("reviewContribution"), payload: reviewInputSchema }),
  z.object({ type: z.literal("proposeQuestion"), payload: questionProposalSchema }),
  z.object({ type: z.literal("submitProblem"), payload: problemSubmissionSchema }),
  z.object({ type: z.literal("moderate"), payload: moderationInputSchema }),
  z.object({ type: z.literal("report"), payload: reportInputSchema }),
]);

export type Mutation = z.infer<typeof mutationSchema>;
export type MutationType = Mutation["type"];
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ContributionInput = z.infer<typeof contributionInputSchema>;
export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type QuestionProposalInput = z.infer<typeof questionProposalSchema>;
export type ProblemSubmissionInput = z.infer<typeof problemSubmissionSchema>;

/** Flatten zod issues into { fieldPath: message } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
