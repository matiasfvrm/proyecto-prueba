/**
 * Explainable, rule-based task recommendations. No machine learning is used;
 * every suggestion carries the reasons it was made.
 */
import type { Task, UserProfile } from "./types";
import type { View } from "@/lib/store/state";
import { categoryLabel } from "./labels";

export interface Recommendation {
  task: Task;
  score: number;
  reasons: string[];
}

export function recommendTasks(view: Pick<View, "tasks" | "problems" | "follows">, user: UserProfile, limit = 5): Recommendation[] {
  const followed = new Set(view.follows[user.id] ?? []);
  const recs: Recommendation[] = [];
  for (const task of view.tasks) {
    if (task.status !== "open") continue;
    const problem = view.problems.find((p) => p.id === task.problemId);
    if (!problem) continue;
    const reasons: string[] = [];
    let score = 0;
    const matched = task.skills.filter((s) => user.skills.includes(s));
    if (matched.length) {
      score += matched.length * 3;
      reasons.push(`matches your skill${matched.length > 1 ? "s" : ""} ${matched.join(", ")}`);
    }
    if (user.interests.includes(problem.category)) {
      score += 2;
      reasons.push(`is in ${categoryLabel(problem.category)}, one of your interests`);
    }
    if (followed.has(problem.id)) {
      score += 2;
      reasons.push("belongs to a problem you follow");
    }
    if (task.difficulty === "introductory") {
      score += 0.5;
      if (reasons.length) reasons.push("is a good first task");
    }
    if (score >= 2) recs.push({ task, score, reasons });
  }
  return recs.sort((a, b) => b.score - a.score || a.task.title.localeCompare(b.task.title)).slice(0, limit);
}

export function explain(rec: Recommendation): string {
  if (rec.reasons.length === 0) return "Suggested as an introductory task.";
  return `Suggested because it ${rec.reasons.join(", and ")}.`;
}
