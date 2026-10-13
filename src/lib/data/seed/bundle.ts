import type {
  Experiment,
  Hypothesis,
  Problem,
  ResearchQuestion,
  Solution,
  Task,
} from "@/lib/domain/types";

export interface ProblemBundle {
  problem: Problem;
  questions: ResearchQuestion[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  solutions: Solution[];
  tasks: Task[];
}
