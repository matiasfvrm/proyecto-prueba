import type { CategoryId, Difficulty, EvidenceStatus, Problem, Skill, Task } from "./types";
import type { View } from "@/lib/store/state";

export type SortKey = "relevance" | "updated" | "open_tasks";
export type ActivityFilter = "any" | "7d" | "30d";

export interface DiscoverFilters {
  q: string;
  categories: CategoryId[];
  difficulties: Difficulty[];
  skills: Skill[];
  statuses: EvidenceStatus[];
  activity: ActivityFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: DiscoverFilters = {
  q: "",
  categories: [],
  difficulties: [],
  skills: [],
  statuses: [],
  activity: "any",
  sort: "relevance",
};

export interface ProblemStats {
  openTasks: number;
  totalTasks: number;
  questions: number;
  contributions: number;
  lastActivity: string;
}

export function problemStats(view: Pick<View, "tasks" | "questions" | "contributions" | "activity">, problem: Problem): ProblemStats {
  const tasks = view.tasks.filter((t: Task) => t.problemId === problem.id);
  const last = view.activity.find((a) => a.problemId === problem.id)?.at;
  return {
    openTasks: tasks.filter((t) => t.status === "open").length,
    totalTasks: tasks.length,
    questions: view.questions.filter((q) => q.problemId === problem.id).length,
    contributions: view.contributions.filter((c) => c.problemId === problem.id).length,
    lastActivity: [last, problem.updatedAt].filter(Boolean).sort().at(-1)!,
  };
}

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);
}

/** Simple, transparent keyword relevance: title matches weigh more than body matches. */
export function relevance(view: Pick<View, "questions">, problem: Problem, q: string): number {
  const terms = tokenize(q);
  if (terms.length === 0) return 0;
  const title = problem.title.toLowerCase();
  const body = [problem.summary, problem.definition, problem.whyItMatters, ...problem.skills, ...view.questions.filter((x) => x.problemId === problem.id).map((x) => x.question)]
    .join(" ")
    .toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (title.includes(t)) score += 3;
    if (body.includes(t)) score += 1;
  }
  return score;
}

export function filterProblems(
  view: Pick<View, "problems" | "tasks" | "questions" | "contributions" | "activity">,
  f: DiscoverFilters,
  now: Date = new Date(),
): Array<{ problem: Problem; stats: ProblemStats; score: number }> {
  const terms = tokenize(f.q);
  const rows = view.problems
    .map((problem) => ({ problem, stats: problemStats(view, problem), score: relevance(view, problem, f.q) }))
    .filter(({ problem, stats, score }) => {
      if (terms.length && score < terms.length) return false; // every term must match somewhere
      if (f.categories.length && !f.categories.includes(problem.category)) return false;
      if (f.difficulties.length && !f.difficulties.includes(problem.difficulty)) return false;
      if (f.statuses.length && !f.statuses.includes(problem.status)) return false;
      if (f.skills.length) {
        const taskSkills = view.tasks.filter((t) => t.problemId === problem.id).flatMap((t) => t.skills);
        const all = new Set([...problem.skills, ...taskSkills]);
        if (!f.skills.some((s) => all.has(s))) return false;
      }
      if (f.activity !== "any") {
        const days = f.activity === "7d" ? 7 : 30;
        if (now.getTime() - new Date(stats.lastActivity).getTime() > days * 86_400_000) return false;
      }
      return true;
    });

  return rows.sort((a, b) => {
    if (f.sort === "open_tasks") return b.stats.openTasks - a.stats.openTasks || b.stats.lastActivity.localeCompare(a.stats.lastActivity);
    if (f.sort === "updated") return b.stats.lastActivity.localeCompare(a.stats.lastActivity);
    // relevance: keyword score, then open tasks, then recency
    return b.score - a.score || b.stats.openTasks - a.stats.openTasks || b.stats.lastActivity.localeCompare(a.stats.lastActivity);
  });
}

const LIST_KEYS = ["categories", "difficulties", "skills", "statuses"] as const;

export function filtersToSearchParams(f: DiscoverFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  for (const k of LIST_KEYS) if (f[k].length) p.set(k, f[k].join(","));
  if (f.activity !== "any") p.set("activity", f.activity);
  if (f.sort !== "relevance") p.set("sort", f.sort);
  return p;
}

export function filtersFromSearchParams(p: URLSearchParams): DiscoverFilters {
  const list = (k: string) => (p.get(k) ? p.get(k)!.split(",").filter(Boolean) : []);
  const activity = p.get("activity");
  const sort = p.get("sort");
  return {
    q: p.get("q") ?? "",
    categories: list("categories") as CategoryId[],
    difficulties: list("difficulties") as Difficulty[],
    skills: list("skills") as Skill[],
    statuses: list("statuses") as EvidenceStatus[],
    activity: activity === "7d" || activity === "30d" ? activity : "any",
    sort: sort === "updated" || sort === "open_tasks" ? sort : "relevance",
  };
}
