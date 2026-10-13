import type { NodeType } from "@/lib/graph/build";

export const NODE_COLOR: Record<NodeType, string> = {
  problem: "#3cc8f5",
  cause: "#7d8794",
  question: "#8f9cf5",
  hypothesis: "#d9b25e",
  experiment: "#c98e58",
  task: "#c9ced6",
  contribution: "#5fb3a1",
  solution: "#5cc28f",
};

export const NODE_DESCRIPTION: Record<NodeType, string> = {
  problem: "A real-world challenge with a precise definition and validation criteria.",
  cause: "A factor believed to drive the problem, documented with sources where possible.",
  question: "A focused, answerable question that moves the problem forward.",
  hypothesis: "A testable claim. Stays unverified until evidence passes review.",
  experiment: "A designed test of a hypothesis, with its method published in advance.",
  task: "A concrete unit of work with a deliverable and acceptance criteria.",
  contribution: "Work submitted by a contributor, reviewed against the task's criteria.",
  solution: "A candidate approach to the problem. Only validated after its evidence is reviewed.",
};
