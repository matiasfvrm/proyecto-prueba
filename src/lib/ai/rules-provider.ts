import type { AssistantProvider, ProposalDraft, ProposalReview } from "./types";

const VAGUE = /\b(always|never|everyone|nobody|obviously|clearly|proven|solves?|guarantee[sd]?)\b/i;
const HAS_NUMBER = /\d/;

/** Deterministic completeness checks. Used when no AI provider is configured. */
export function reviewProposalWithRules(d: ProposalDraft): ProposalReview {
  const gaps: ProposalReview["gaps"] = [];
  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  if (words(d.title) < 4) gaps.push({ field: "title", issue: "The title is very short. Name the problem and the context, e.g. “Improving X for Y”." });
  if (d.title.trim().endsWith("?")) gaps.push({ field: "title", issue: "Phrase the title as a problem statement; keep questions for the research-questions list." });
  if (words(d.description) < 40) gaps.push({ field: "description", issue: "Describe who is affected, where, and what exactly is unsolved (aim for at least a short paragraph)." });
  if (!/\b(measure|metric|indicator|criteria|success|reduce|increase|accuracy|rate)\b/i.test(d.description))
    gaps.push({ field: "description", issue: "State how progress could be measured — what observable change would count as success?" });
  if (words(d.whyItMatters) < 20) gaps.push({ field: "whyItMatters", issue: "Explain the consequences of leaving the problem unsolved and who benefits from progress." });
  if (words(d.evidence) < 20) gaps.push({ field: "evidence", issue: "Summarize what is already known and link each statement to a source." });
  if (HAS_NUMBER.test(d.evidence) && d.sources.length === 0)
    gaps.push({ field: "evidence", issue: "The evidence contains figures but no sources are listed. Every figure needs a citation." });
  if (VAGUE.test(`${d.description} ${d.evidence}`))
    gaps.push({ field: "evidence", issue: "Some wording is absolute (e.g. “always”, “proven”, “solves”). Qualify claims or support them with sources." });
  if (!d.existingApproaches.trim()) gaps.push({ field: "existingApproaches", issue: "List approaches that have been tried, so contributors avoid repeating them." });
  if (!d.limitations.trim()) gaps.push({ field: "limitations", issue: "Note known limitations or open disagreements." });
  if (d.sources.length < 2) gaps.push({ field: "sources", issue: "Add at least two independent, primary or authoritative sources." });
  const notQuestions = d.researchQuestions.filter((q) => q.trim() && !q.trim().endsWith("?"));
  if (notQuestions.length) gaps.push({ field: "researchQuestions", issue: "Phrase each research question as an answerable question ending with “?”." });
  if (d.researchQuestions.filter((q) => q.trim()).length < 2)
    gaps.push({ field: "researchQuestions", issue: "Break the problem into at least two focused questions that one person or small team could investigate." });

  return {
    gaps,
    questionSuggestions: [],
    summary:
      gaps.length === 0
        ? "No obvious gaps found by the automated checklist. A human moderator will still review the submission."
        : `The checklist found ${gaps.length} item${gaps.length === 1 ? "" : "s"} worth addressing before review.`,
    generatedBy: "rules",
  };
}

export const rulesProvider: AssistantProvider = {
  id: "rules",
  reviewProposal: async (d) => reviewProposalWithRules(d),
};
