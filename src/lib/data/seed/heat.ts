import type { ProblemBundle } from "./bundle";

export const heat: ProblemBundle = {
  problem: {
    id: "p-heat",
    slug: "urban-heat-resilience",
    title: "Improving heat resilience in cities",
    category: "climate",
    summary:
      "Extreme heat affects health, and some neighborhoods are hotter than others. How can cities find the most heat-exposed blocks and evaluate cooling measures locally?",
    whyItMatters:
      "Heat is a recognized health risk, and exposure is unequal within cities. Street-level data and transparent evaluation of cooling measures help residents and local governments prioritize interventions.",
    definition:
      "Build open methods to map street-level heat exposure and to evaluate cooling interventions (shade, surfaces, vegetation, cooling centers) with documented measurement protocols.",
    difficulty: "intermediate",
    status: "under_investigation",
    skills: ["GIS", "Data analysis", "Embedded systems", "Community outreach"],
    causes: [
      { id: "c-heat-1", title: "Urban heat island effect", description: "Built surfaces absorb and re-emit heat, raising local temperatures." },
      { id: "c-heat-2", title: "Sparse street-level data", description: "Official weather stations may not capture neighborhood variation." },
      { id: "c-heat-3", title: "Unequal access to cooling", description: "Not all residents can reach shade or cooling centers." },
    ],
    claims: [
      { id: "cl-heat-1", statement: "Extreme heat poses risks to human health.", kind: "documented", sourceIds: ["src-who-heat"] },
      { id: "cl-heat-2", statement: "Urban areas can experience higher temperatures than outlying areas (the heat island effect).", kind: "documented", sourceIds: ["src-epa-heat-islands"] },
      { id: "cl-heat-3", statement: "Volunteer-carried sensors could reveal block-level differences that fixed stations miss.", kind: "hypothesis", sourceIds: [] },
    ],
    approaches: [
      { title: "Satellite land-surface temperature", description: "Remote sensing of surface temperature.", limitations: ["Surface temperature differs from air temperature people feel"] },
      { title: "Community heat-mapping campaigns", description: "Coordinated mobile measurements.", limitations: ["Snapshot in time", "Sensor quality varies"] },
    ],
    limitations: ["Single-day campaigns may not represent typical conditions.", "Health outcomes require careful epidemiological methods."],
    validationCriteria: [
      "Sensor calibration documented against a reference.",
      "Methods allow repetition on different days.",
      "Any health claims reviewed by a qualified reviewer.",
    ],
    sourceIds: ["src-who-heat", "src-epa-heat-islands", "src-heat-gov", "src-ipcc-ar6-wg2"],
    relatedProblemIds: ["p-energy", "p-water", "p-food"],
    createdAt: "2026-03-28T09:00:00Z",
    updatedAt: "2026-10-05T12:00:00Z",
  },
  questions: [
    {
      id: "q-heat-1", problemId: "p-heat",
      question: "How should mobile temperature readings be corrected for time of day when building a heat map?",
      whyItMatters: "Readings taken at different times are not directly comparable.",
      existingKnowledge: "Time-detrending is used in mobile measurement campaigns; the best approach for small volunteer datasets is unclear.",
      uncertainties: ["Effect of route order", "Required reference station density"],
      suggestedApproaches: ["Compare detrending methods on open datasets", "Simulate with synthetic routes"],
      skills: ["Statistics", "GIS", "Python"], status: "under_investigation", sourceIds: [],
    },
    {
      id: "q-heat-2", problemId: "p-heat",
      question: "Which residents are least able to reach cooling centers, and why?",
      whyItMatters: "Cooling centers only help people who can reach and use them.",
      existingKnowledge: "Access depends on distance, opening hours, transport and awareness; local data is often missing.",
      uncertainties: ["Data on mobility limitations", "Awareness of services"],
      suggestedApproaches: ["Accessibility analysis using open transit data", "Community interviews"],
      skills: ["GIS", "Community outreach", "Field research"], status: "proposed", sourceIds: ["src-heat-gov"],
    },
  ],
  hypotheses: [
    { id: "h-heat-1", questionId: "q-heat-1", statement: "Linear detrending against a fixed reference station is adequate for routes under two hours.", status: "under_investigation" },
  ],
  experiments: [
    { id: "e-heat-1", hypothesisId: "h-heat-1", title: "Detrending comparison on open campaign data", design: "Apply three detrending methods to the same open dataset and compare residual time bias.", status: "under_investigation" },
  ],
  solutions: [
    { id: "s-heat-1", problemId: "p-heat", title: "Open neighborhood heat-mapping toolkit", summary: "Sensor build guide, route planner and processing pipeline with documented uncertainty.", status: "proposed", questionIds: ["q-heat-1"] },
  ],
  tasks: [
    {
      id: "t-heat-1a", problemId: "p-heat", questionId: "q-heat-1",
      title: "Implement three time-detrending methods",
      objective: "Make detrending approaches comparable in one library.",
      description: "Implement the methods in Python with tests and a notebook comparing them on synthetic data.",
      deliverable: "Python module, tests and comparison notebook.",
      skills: ["Python", "Statistics"], difficulty: "intermediate", effort: "8–14 hours",
      acceptanceCriteria: ["Unit tests for each method", "Synthetic data labeled", "Documents assumptions"],
      status: "open", assigneeId: null, sourceIds: [],
    },
    {
      id: "t-heat-1b", problemId: "p-heat", questionId: "q-heat-1",
      title: "Find open mobile heat-measurement datasets",
      objective: "Catalogue datasets the methods can be tested on.",
      description: "Search for openly licensed datasets from mobile temperature campaigns and record their license, format and metadata quality.",
      deliverable: "Dataset catalogue table.",
      skills: ["Data analysis", "Literature review"], difficulty: "introductory", effort: "3–6 hours",
      acceptanceCriteria: ["Records license for each dataset", "Only openly licensed data included"],
      status: "open", assigneeId: null, sourceIds: [],
    },
    {
      id: "t-heat-2a", problemId: "p-heat", questionId: "q-heat-2",
      title: "Travel-time analysis to cooling centers",
      objective: "Estimate walking and transit travel times to cooling centers.",
      description: "Use open street and transit data to compute travel times for a sample city, and document data gaps.",
      deliverable: "Reproducible notebook and map.",
      skills: ["GIS", "Python"], difficulty: "intermediate", effort: "10–16 hours",
      acceptanceCriteria: ["Uses only open data", "Documents data gaps and assumptions"],
      status: "in_progress", assigneeId: "u-amara", sourceIds: [],
    },
  ],
};
