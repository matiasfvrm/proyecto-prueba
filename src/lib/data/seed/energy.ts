import type { ProblemBundle } from "./bundle";

export const energy: ProblemBundle = {
  problem: {
    id: "p-energy",
    slug: "small-building-energy-efficiency",
    title: "Improving energy efficiency in small buildings",
    category: "energy",
    summary:
      "Small homes, schools and shops rarely receive professional energy audits. Which low-cost measurements reliably identify the retrofits worth doing first?",
    whyItMatters:
      "Buildings are a major part of energy demand. Owners of small buildings often lack affordable, trustworthy guidance on where to start, so cost-effective improvements are delayed.",
    definition:
      "Develop and validate a low-cost assessment method that ranks retrofit options for small buildings, using measurements that owners or volunteers can collect, with documented accuracy against professional audits.",
    difficulty: "intermediate",
    status: "proposed",
    skills: ["Building science", "Data analysis", "Embedded systems", "Python"],
    causes: [
      { id: "c-energy-1", title: "Audit cost", description: "Professional audits may cost more than owners of small buildings are willing to pay up front." },
      { id: "c-energy-2", title: "Lack of baseline data", description: "Few small buildings have interval energy data or temperature logs." },
    ],
    claims: [
      { id: "cl-energy-1", statement: "Buildings account for a substantial share of global energy use.", kind: "documented", sourceIds: ["src-iea-buildings"] },
      { id: "cl-energy-2", statement: "Energy benchmarking tools let owners compare their building's energy use with similar buildings.", kind: "documented", sourceIds: ["src-energystar-pm"] },
      { id: "cl-energy-3", statement: "Two weeks of indoor/outdoor temperature logs plus utility bills may be enough to rank envelope improvements against HVAC upgrades.", kind: "hypothesis", sourceIds: [] },
    ],
    approaches: [
      { title: "Benchmarking against similar buildings", description: "Compare normalized energy use against peers.", limitations: ["Does not identify specific measures"] },
      { title: "Walk-through checklists", description: "Volunteer-led visual inspections.", limitations: ["Quality depends on the inspector"] },
    ],
    limitations: ["Climate and occupancy differ widely.", "Owner-collected data may be incomplete."],
    validationCriteria: [
      "Rankings compared with professional audits on the same buildings.",
      "Method documented so a new volunteer can repeat it.",
      "Disagreements with professional audits reported, not only agreements.",
    ],
    sourceIds: ["src-iea-buildings", "src-energystar-pm"],
    relatedProblemIds: ["p-heat", "p-storage"],
    createdAt: "2026-05-11T09:00:00Z",
    updatedAt: "2026-09-12T16:00:00Z",
  },
  questions: [
    {
      id: "q-energy-1", problemId: "p-energy",
      question: "What is the minimum dataset needed to estimate a small building's heat-loss coefficient?",
      whyItMatters: "A simple heat-loss estimate could separate envelope problems from equipment problems.",
      existingKnowledge: "Methods for estimating heat-loss coefficients from measured data exist in building science literature; their reliability with sparse owner-collected data is less clear.",
      uncertainties: ["Effect of occupant behavior", "Required logging duration"],
      suggestedApproaches: ["Literature review of in-situ measurement methods", "Test on public building datasets"],
      skills: ["Building science", "Statistics", "Literature review"], status: "proposed", sourceIds: [],
    },
    {
      id: "q-energy-2", problemId: "p-energy",
      question: "Can a low-cost temperature logger kit be assembled and deployed by volunteers?",
      whyItMatters: "Measurement must be cheap and simple to scale.",
      existingKnowledge: "Low-cost temperature sensors are widely available; their placement and calibration in buildings require care.",
      uncertainties: ["Sensor placement errors", "Battery life"],
      suggestedApproaches: ["Build a reference kit", "Write deployment instructions and test them"],
      skills: ["Embedded systems", "Technical writing"], status: "proposed", sourceIds: [],
    },
  ],
  hypotheses: [
    { id: "h-energy-1", questionId: "q-energy-1", statement: "Two weeks of heating-season temperature logs combined with monthly bills are sufficient to rank envelope versus equipment measures.", status: "proposed" },
  ],
  experiments: [],
  solutions: [
    { id: "s-energy-1", problemId: "p-energy", title: "Volunteer energy check kit", summary: "Open logger kit plus analysis notebook that produces a ranked list of measures with stated uncertainty.", status: "proposed", questionIds: ["q-energy-1", "q-energy-2"] },
  ],
  tasks: [
    {
      id: "t-energy-1a", problemId: "p-energy", questionId: "q-energy-1",
      title: "Literature review: in-situ heat-loss estimation methods",
      objective: "Identify methods that work with limited measured data.",
      description: "Search for peer-reviewed methods for estimating heat-loss coefficients from in-situ measurements and summarize data requirements. Every statement must cite a source you have read.",
      deliverable: "Structured review with a table of methods, data requirements and limitations.",
      skills: ["Literature review", "Building science"], difficulty: "intermediate", effort: "8–12 hours",
      acceptanceCriteria: ["At least five primary sources, each read in full", "No uncited claims", "Highlights disagreements between sources"],
      status: "in_progress", assigneeId: "u-jonas", sourceIds: [],
    },
    {
      id: "t-energy-2a", problemId: "p-energy", questionId: "q-energy-2",
      title: "Bill of materials for a temperature logger kit",
      objective: "Specify an affordable, open logger kit.",
      description: "Propose components, firmware approach and enclosure. Note sourcing alternatives in different regions.",
      deliverable: "Bill of materials and wiring diagram.",
      skills: ["Embedded systems", "Electrical engineering"], difficulty: "intermediate", effort: "6–10 hours",
      acceptanceCriteria: ["All parts openly documented", "Alternatives listed for at least one region"],
      status: "open", assigneeId: null, sourceIds: [],
    },
    {
      id: "t-energy-2b", problemId: "p-energy", questionId: "q-energy-2",
      title: "Write volunteer deployment instructions",
      objective: "Explain where and how to place loggers for useful data.",
      description: "Write plain-language instructions with diagrams, including what to avoid (sun exposure, heat sources).",
      deliverable: "Illustrated guide.",
      skills: ["Technical writing", "Building science"], difficulty: "introductory", effort: "3–5 hours",
      acceptanceCriteria: ["Readable by non-specialists", "Includes placement mistakes to avoid"],
      status: "open", assigneeId: null, sourceIds: [],
    },
  ],
};
