import { z } from "zod";

/** Draft fields an assistant may inspect. Never includes user identity. */
export const proposalDraftSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(4000),
  whyItMatters: z.string().max(2000),
  evidence: z.string().max(4000),
  existingApproaches: z.string().max(3000),
  limitations: z.string().max(3000),
  sources: z.array(z.string().max(500)).max(10),
  researchQuestions: z.array(z.string().max(300)).max(8),
});
export type ProposalDraft = z.infer<typeof proposalDraftSchema>;

export const proposalReviewSchema = z.object({
  gaps: z
    .array(z.object({ field: z.string(), issue: z.string() }))
    .describe("Missing or weak information, one entry per issue, referencing the draft field."),
  questionSuggestions: z.array(z.string()).describe("Up to 3 additional research questions, each ending with '?'."),
  summary: z.string().describe("One or two sentences on overall readiness for review."),
});
export type ProposalReviewBody = z.infer<typeof proposalReviewSchema>;

export interface ProposalReview extends ProposalReviewBody {
  /** Who produced the review. UI must label AI output as unverified. */
  generatedBy: "rules" | "ai";
  model?: string;
}

/**
 * Replaceable assistant backend. Implementations must:
 *  - never fabricate citations (the review flags gaps; it does not supply sources),
 *  - never execute generated code,
 *  - receive only the draft content, not user identity.
 */
export interface AssistantProvider {
  readonly id: string;
  reviewProposal(draft: ProposalDraft): Promise<ProposalReview>;
}
