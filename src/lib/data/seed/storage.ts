import type { ProblemBundle } from "./bundle";

export const storage: ProblemBundle = {
  problem: {
    id: "p-storage",
    slug: "energy-storage-off-grid-clinics",
    title: "Reliable energy storage for off-grid health clinics",
    category: "energy",
    summary:
      "Clinics without reliable electricity struggle to keep vaccines cold and equipment running. How can battery systems be sized, monitored and maintained for long, predictable lifetimes?",
    whyItMatters:
      "Health services depend on electricity for refrigeration, lighting and medical devices. Storage systems that fail early or are poorly sized leave clinics without power when it matters.",
    definition:
      "Develop open sizing guidance and low-cost monitoring for solar-plus-storage systems in off-grid clinics, validated against field data on battery health and outages.",
    difficulty: "advanced",
    status: "proposed",
    skills: ["Electrical engineering", "Embedded systems", "Data analysis"],
    causes: [
      { id: "c-storage-1", title: "Undersized systems", description: "Load estimates may omit equipment added after installation." },
      { id: "c-storage-2", title: "No battery-health monitoring", description: "Degradation goes unnoticed until failure." },
    ],
    claims: [
      { id: "cl-storage-1", statement: "Progress on access to electricity is tracked internationally as part of Sustainable Development Goal 7.", kind: "documented", sourceIds: ["src-sdg7"] },
      { id: "cl-storage-2", statement: "Simple state-of-health estimates from voltage and temperature logs could warn of battery failure weeks ahead.", kind: "hypothesis", sourceIds: [] },
    ],
    approaches: [
      { title: "Solar home system kits", description: "Packaged panels, batteries and controllers.", limitations: ["Sized for households, not clinical loads"] },
    ],
    limitations: ["Field data is scarce and often proprietary.", "Safety-critical: designs need qualified review."],
    validationCriteria: [
      "Sizing guidance reviewed by a qualified electrical engineer.",
      "Monitoring predictions compared against recorded failures.",
      "Safety considerations documented.",
    ],
    sourceIds: ["src-sdg7"],
    relatedProblemIds: ["p-energy"],
    createdAt: "2026-07-01T09:00:00Z",
    updatedAt: "2026-09-20T10:00:00Z",
  },
  questions: [
    {
      id: "q-storage-1", problemId: "p-storage",
      question: "What load profile should be assumed when sizing storage for a small rural clinic?",
      whyItMatters: "Sizing depends on realistic loads, including vaccine refrigeration.",
      existingKnowledge: "Equipment specifications are available; measured clinic load profiles are rarely published openly.",
      uncertainties: ["Seasonal variation", "Equipment added over time"],
      suggestedApproaches: ["Collect equipment inventories", "Build a load-profile calculator with explicit assumptions"],
      skills: ["Electrical engineering", "Data analysis"], status: "proposed", sourceIds: [],
    },
    {
      id: "q-storage-2", problemId: "p-storage",
      question: "Can low-cost voltage and temperature logging predict battery degradation early enough to act?",
      whyItMatters: "Early warning allows planned replacement instead of sudden outages.",
      existingKnowledge: "Battery state-of-health estimation is an active research field; low-cost field implementations are less documented.",
      uncertainties: ["Battery chemistry differences", "Data logging reliability"],
      suggestedApproaches: ["Review estimation methods", "Test on open battery-cycling datasets"],
      skills: ["Data analysis", "Embedded systems", "Machine learning"], status: "proposed", sourceIds: [],
    },
  ],
  hypotheses: [
    { id: "h-storage-1", questionId: "q-storage-2", statement: "Voltage-sag patterns under a known load correlate with remaining capacity in lead-acid and lithium iron phosphate batteries.", status: "proposed" },
  ],
  experiments: [],
  solutions: [
    { id: "s-storage-1", problemId: "p-storage", title: "Open clinic load calculator", summary: "A calculator with explicit, editable assumptions and safety notes.", status: "proposed", questionIds: ["q-storage-1"] },
  ],
  tasks: [
    {
      id: "t-storage-1a", problemId: "p-storage", questionId: "q-storage-1",
      title: "Build an open load-profile calculator",
      objective: "Estimate daily energy needs from an equipment list.",
      description: "Create a small web calculator where every assumption (duty cycle, hours of use) is visible and editable. Label results as estimates.",
      deliverable: "Web calculator with tests.",
      skills: ["TypeScript", "Electrical engineering"], difficulty: "intermediate", effort: "8–12 hours",
      acceptanceCriteria: ["All assumptions editable", "Results labeled as estimates", "Unit tests for calculations"],
      status: "open", assigneeId: null, sourceIds: [],
    },
    {
      id: "t-storage-2a", problemId: "p-storage", questionId: "q-storage-2",
      title: "Survey open battery-cycling datasets",
      objective: "Find data suitable for testing degradation predictors.",
      description: "List open datasets, their licenses, chemistries and measured variables.",
      deliverable: "Dataset survey table.",
      skills: ["Data analysis", "Literature review"], difficulty: "introductory", effort: "3–5 hours",
      acceptanceCriteria: ["License recorded for each dataset"],
      status: "open", assigneeId: null, sourceIds: [],
    },
  ],
};
