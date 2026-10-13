import type { ProblemBundle } from "./bundle";

export const food: ProblemBundle = {
  problem: {
    id: "p-food",
    slug: "urban-food-waste-supply-chains",
    title: "Reducing food waste in urban supply chains",
    category: "food",
    summary:
      "Edible food is discarded at retail and distribution stages while nearby organizations struggle to source it. Where exactly is it lost, and which interventions measurably reduce it?",
    whyItMatters:
      "Food that is produced but not eaten wastes the land, water, energy and labor used to grow and move it. Better measurement and coordination in cities could redirect surplus to people and reduce environmental impact.",
    definition:
      "Identify the stages of urban food distribution where edible surplus is lost, and test interventions (forecasting, redistribution logistics, date-labeling practices) with measurable, reported outcomes.",
    difficulty: "intermediate",
    status: "under_investigation",
    skills: ["Supply chain", "Data analysis", "Policy analysis", "Python"],
    causes: [
      { id: "c-food-1", title: "Inaccurate demand forecasts", description: "Over-ordering to avoid empty shelves can create surplus." },
      { id: "c-food-2", title: "Short redistribution windows", description: "Perishable surplus must be moved quickly, which strains volunteer logistics." },
      { id: "c-food-3", title: "Inconsistent measurement", description: "Different definitions of loss and waste make results hard to compare." },
    ],
    claims: [
      { id: "cl-food-1", statement: "International reports distinguish food loss (earlier in the supply chain) from food waste (retail, food service and households).", kind: "documented", sourceIds: ["src-fao-sofa", "src-unep-fwi"] },
      { id: "cl-food-2", statement: "Food waste occurs across households, food service and retail.", kind: "documented", sourceIds: ["src-unep-fwi"] },
      { id: "cl-food-3", statement: "Matching surplus pickups to recipient capacity in near-real time could reduce discarded perishables.", kind: "hypothesis", sourceIds: [] },
    ],
    approaches: [
      { title: "Food recovery networks", description: "Volunteer or nonprofit pickup of surplus from retailers.", limitations: ["Depend on volunteer availability", "Limited cold-chain capacity"] },
      { title: "Dynamic markdowns", description: "Discounting products approaching their date.", limitations: ["Effect varies by store and product category"] },
    ],
    limitations: ["Retail data is often proprietary.", "Interventions may shift waste to other stages instead of reducing it."],
    validationCriteria: [
      "Uses a stated, published definition of food loss and waste.",
      "Reports baseline and post-intervention measurements with the same method.",
      "Accounts for displacement to other supply-chain stages.",
    ],
    sourceIds: ["src-unep-fwi", "src-fao-sofa", "src-refed"],
    relatedProblemIds: ["p-heat"],
    createdAt: "2026-04-02T09:00:00Z",
    updatedAt: "2026-09-29T11:00:00Z",
  },
  questions: [
    {
      id: "q-food-1", problemId: "p-food",
      question: "Which measurement method gives comparable food-waste figures across small retailers?",
      whyItMatters: "Without a shared method, no intervention can be compared or validated.",
      existingKnowledge: "International reports describe measurement approaches at national level. Practical methods for small independent retailers are less documented.",
      uncertainties: ["Accuracy of self-reported weights", "Seasonal variation"],
      suggestedApproaches: ["Review published measurement guidance", "Pilot a simple weighing log with volunteer stores"],
      skills: ["Data analysis", "Field research"], status: "under_investigation", sourceIds: ["src-unep-fwi"],
    },
    {
      id: "q-food-2", problemId: "p-food",
      question: "Can open routing tools shorten the time between surplus notice and pickup for food recovery groups?",
      whyItMatters: "Perishables lose value quickly; faster pickups could increase how much surplus is usable.",
      existingKnowledge: "Vehicle routing is a well-studied optimization problem. Its use by small volunteer networks is less studied.",
      uncertainties: ["Volunteer acceptance of suggested routes", "Data availability on recipient capacity"],
      suggestedApproaches: ["Prototype with open routing libraries", "Simulate with anonymized historical pickup logs"],
      skills: ["Python", "Supply chain", "GIS"], status: "proposed", sourceIds: [],
    },
    {
      id: "q-food-3", problemId: "p-food",
      question: "How do date-label practices influence discard decisions at retail?",
      whyItMatters: "Confusion between quality and safety dates may cause edible food to be discarded.",
      existingKnowledge: "Several reports discuss date labeling as a factor in waste. Local retail practices vary.",
      uncertainties: ["Regional regulatory differences"],
      suggestedApproaches: ["Policy review across jurisdictions", "Interviews with store managers"],
      skills: ["Policy analysis", "Literature review"], status: "proposed", sourceIds: ["src-refed"],
    },
  ],
  hypotheses: [
    { id: "h-food-1", questionId: "q-food-2", statement: "Route suggestions that account for recipient opening hours reduce average pickup delay for perishable surplus.", status: "proposed" },
  ],
  experiments: [
    { id: "e-food-1", hypothesisId: "h-food-1", title: "Routing simulation on anonymized pickup logs", design: "Replay historical pickup requests through a routing prototype and compare simulated delays against recorded ones.", status: "proposed" },
  ],
  solutions: [
    { id: "s-food-1", problemId: "p-food", title: "Open surplus-matching service", summary: "A lightweight service that matches surplus notices to nearby recipients with capacity.", status: "proposed", questionIds: ["q-food-2"] },
  ],
  tasks: [
    {
      id: "t-food-1a", problemId: "p-food", questionId: "q-food-1",
      title: "Summarize published food-waste measurement methods",
      objective: "Compare measurement approaches described in public reports.",
      description: "Read the linked reports and summarize how each defines and measures waste, noting what would be practical for small retailers. Quote and cite; do not extrapolate figures.",
      deliverable: "A literature summary with a comparison table and citations.",
      skills: ["Literature review", "Technical writing"], difficulty: "introductory", effort: "5–8 hours",
      acceptanceCriteria: ["Every claim cites a source", "Includes a comparison table", "Lists open questions"],
      status: "in_progress", assigneeId: "u-priya", sourceIds: ["src-unep-fwi", "src-fao-sofa"],
    },
    {
      id: "t-food-1b", problemId: "p-food", questionId: "q-food-1",
      title: "Design a weighing log template for small stores",
      objective: "Create a simple form that store staff can fill in within a few minutes per day.",
      description: "Create a paper and spreadsheet version of a daily log. Include categories aligned with the measurement summary.",
      deliverable: "Spreadsheet template and printable form.",
      skills: ["Interface design", "Data analysis"], difficulty: "introductory", effort: "3–5 hours",
      acceptanceCriteria: ["Completable in under five minutes", "Categories documented"],
      status: "open", assigneeId: null, sourceIds: [],
    },
    {
      id: "t-food-2a", problemId: "p-food", questionId: "q-food-2",
      title: "Prototype a pickup routing script with open libraries",
      objective: "Generate route suggestions from a list of pickups and recipient time windows.",
      description: "Use an open-source routing or optimization library. Provide a reproducible example with synthetic data.",
      deliverable: "Repository with script, synthetic data and instructions.",
      skills: ["Python", "GIS"], difficulty: "advanced", effort: "12–20 hours",
      acceptanceCriteria: ["Respects time windows", "Reproducible from a clean environment", "Synthetic data labeled"],
      status: "open", assigneeId: null, sourceIds: [],
    },
    {
      id: "t-food-3a", problemId: "p-food", questionId: "q-food-3",
      title: "Collect date-labeling rules for three jurisdictions",
      objective: "Document what date labels mean legally in different places.",
      description: "Find official sources for date-labeling rules in three jurisdictions and summarize them side by side.",
      deliverable: "Comparison document with links to official sources.",
      skills: ["Policy analysis", "Literature review"], difficulty: "introductory", effort: "4–6 hours",
      acceptanceCriteria: ["Links only to official or primary sources", "States the retrieval date for each source"],
      status: "open", assigneeId: null, sourceIds: [],
    },
  ],
};
