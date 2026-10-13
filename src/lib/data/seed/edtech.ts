import type { ProblemBundle } from "./bundle";

export const edtech: ProblemBundle = {
  problem: {
    id: "p-edtech",
    slug: "accessible-educational-technology",
    title: "Increasing accessibility of educational technology",
    category: "accessibility",
    summary:
      "Learning platforms often fail students who use screen readers, captions, keyboards or low-bandwidth connections. Which barriers are most common, and which fixes help most?",
    whyItMatters:
      "When digital learning tools are inaccessible, disabled learners and learners with limited connectivity are excluded. Shared, open audits and fixes can benefit many institutions at once.",
    definition:
      "Measure common accessibility barriers in open educational tools against published standards, and develop and test open fixes with disabled learners.",
    difficulty: "introductory",
    status: "under_investigation",
    skills: ["Accessibility testing", "TypeScript", "UX research", "Interface design"],
    causes: [
      { id: "c-edtech-1", title: "Accessibility treated as an afterthought", description: "Barriers are introduced early and expensive to fix later." },
      { id: "c-edtech-2", title: "Limited testing with disabled users", description: "Automated checks miss many real barriers." },
    ],
    claims: [
      { id: "cl-edtech-1", statement: "WCAG 2.2 defines testable success criteria for accessible web content.", kind: "documented", sourceIds: ["src-wcag22"] },
      { id: "cl-edtech-2", statement: "Universal Design for Learning provides guidelines for flexible learning design.", kind: "documented", sourceIds: ["src-udl"] },
      { id: "cl-edtech-3", statement: "Automated checkers catch only part of the barriers that disabled learners encounter.", kind: "proposal", sourceIds: [] },
    ],
    approaches: [
      { title: "Automated accessibility checkers", description: "Scan pages for detectable issues.", limitations: ["Cannot judge many criteria"] },
      { title: "Manual expert audits", description: "Specialists test against standards.", limitations: ["Costly", "May still miss lived-experience issues"] },
    ],
    limitations: ["Platforms change frequently, so audits age quickly."],
    validationCriteria: [
      "Barriers mapped to specific WCAG success criteria.",
      "Fixes tested with assistive technology users.",
      "Audit method published so others can repeat it.",
    ],
    sourceIds: ["src-wcag22", "src-wai-intro", "src-udl"],
    relatedProblemIds: ["p-science"],
    createdAt: "2026-01-25T09:00:00Z",
    updatedAt: "2026-10-11T08:00:00Z",
  },
  questions: [
    {
      id: "q-edtech-1", problemId: "p-edtech",
      question: "Which WCAG failures occur most often in open-source learning management systems?",
      whyItMatters: "Knowing the most frequent failures lets contributors fix what affects the most learners.",
      existingKnowledge: "Standards define success criteria; a shared, repeatable audit of open-source learning platforms is not available here yet.",
      uncertainties: ["Variation between versions and themes"],
      suggestedApproaches: ["Combine automated scans with manual keyboard and screen-reader testing", "Publish an audit protocol"],
      skills: ["Accessibility testing"], status: "under_investigation", sourceIds: ["src-wcag22"],
    },
    {
      id: "q-edtech-2", problemId: "p-edtech",
      question: "What lightweight page design keeps course materials usable on slow connections?",
      whyItMatters: "Heavy pages exclude learners with limited bandwidth or older devices.",
      existingKnowledge: "Web performance techniques are well known; their application to course content templates is uneven.",
      uncertainties: ["Which media formats learners actually use"],
      suggestedApproaches: ["Measure page weight of sample courses", "Prototype a text-first template"],
      skills: ["TypeScript", "Interface design"], status: "proposed", sourceIds: [],
    },
  ],
  hypotheses: [
    { id: "h-edtech-1", questionId: "q-edtech-1", statement: "Keyboard focus and form-labeling failures are among the most frequent barriers in course pages.", status: "under_investigation" },
  ],
  experiments: [
    { id: "e-edtech-1", hypothesisId: "h-edtech-1", title: "Repeatable audit of sample course pages", design: "Apply a published audit protocol to a fixed sample of pages in two open-source platforms.", status: "under_investigation" },
  ],
  solutions: [
    { id: "s-edtech-1", problemId: "p-edtech", title: "Open accessibility patch set", summary: "Upstream fixes for the most frequent barriers, tested with assistive-technology users.", status: "proposed", questionIds: ["q-edtech-1"] },
  ],
  tasks: [
    {
      id: "t-edtech-1a", problemId: "p-edtech", questionId: "q-edtech-1",
      title: "Write a repeatable accessibility audit protocol",
      objective: "Define steps so different auditors reach comparable results.",
      description: "Combine automated checks with manual keyboard and screen-reader steps, mapped to WCAG 2.2 criteria.",
      deliverable: "Audit protocol with a results template.",
      skills: ["Accessibility testing", "Technical writing"], difficulty: "intermediate", effort: "6–10 hours",
      acceptanceCriteria: ["Every step maps to a success criterion", "Template records evidence for each finding"],
      status: "completed", assigneeId: "u-sofia", sourceIds: ["src-wcag22"],
    },
    {
      id: "t-edtech-1b", problemId: "p-edtech", questionId: "q-edtech-1",
      title: "Keyboard-only walkthrough of a course page",
      objective: "Record every keyboard barrier on a sample page.",
      description: "Using only a keyboard, complete a set of learner tasks and record each place where focus is lost or a control is unreachable. Great first contribution.",
      deliverable: "Filled-in results template with screenshots.",
      skills: ["Accessibility testing"], difficulty: "introductory", effort: "2–3 hours",
      acceptanceCriteria: ["Uses the published protocol", "Includes steps to reproduce each barrier"],
      status: "open", assigneeId: null, sourceIds: ["src-wai-intro"],
    },
    {
      id: "t-edtech-1c", problemId: "p-edtech", questionId: "q-edtech-1",
      title: "Translate the audit protocol into Spanish",
      objective: "Let more auditors use the protocol.",
      description: "Translate the protocol and template, keeping WCAG terms consistent with official translations where they exist.",
      deliverable: "Translated protocol.",
      skills: ["Translation", "Accessibility testing"], difficulty: "introductory", effort: "3–5 hours",
      acceptanceCriteria: ["Terminology consistent", "Reviewed by a second speaker"],
      status: "open", assigneeId: null, sourceIds: [],
    },
    {
      id: "t-edtech-2a", problemId: "p-edtech", questionId: "q-edtech-2",
      title: "Prototype a text-first course page template",
      objective: "Show that course content can be light and accessible.",
      description: "Build a static HTML/CSS template with semantic structure, optional media and a page-weight budget.",
      deliverable: "Template repository with a page-weight report.",
      skills: ["TypeScript", "Interface design", "Accessibility testing"], difficulty: "intermediate", effort: "8–12 hours",
      acceptanceCriteria: ["Passes keyboard walkthrough", "Documents page-weight budget"],
      status: "open", assigneeId: null, sourceIds: [],
    },
  ],
};
