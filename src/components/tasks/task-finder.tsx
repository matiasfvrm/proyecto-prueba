"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ListTodo, Search, Sparkles } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { TaskRow } from "@/components/problems/shared";
import { Chip, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/ui/misc";
import { DIFFICULTIES, SKILLS, TASK_STATUSES, type Difficulty, type Skill, type TaskStatus } from "@/lib/domain/types";
import { DIFFICULTY_META, TASK_STATUS_META } from "@/lib/domain/labels";
import { explain, recommendTasks } from "@/lib/domain/recommend";

export function TaskFinder() {
  const params = useSearchParams();
  const { view } = useStore();
  const [q, setQ] = useState("");
  const [skills, setSkills] = useState<Skill[]>(() => (params.get("skills")?.split(",").filter((s) => (SKILLS as readonly string[]).includes(s)) as Skill[]) ?? []);
  const [difficulty, setDifficulty] = useState<Difficulty[]>(() => (params.get("difficulty")?.split(",").filter((d) => (DIFFICULTIES as readonly string[]).includes(d)) as Difficulty[]) ?? []);
  const [statuses, setStatuses] = useState<TaskStatus[]>(["open"]);

  const tasks = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return view.tasks.filter((t) => {
      if (statuses.length && !statuses.includes(t.status)) return false;
      if (difficulty.length && !difficulty.includes(t.difficulty)) return false;
      if (skills.length && !t.skills.some((s) => skills.includes(s))) return false;
      if (terms.length) {
        const hay = `${t.title} ${t.objective} ${t.description} ${t.skills.join(" ")}`.toLowerCase();
        if (!terms.every((x) => hay.includes(x))) return false;
      }
      return true;
    });
  }, [view.tasks, q, skills, difficulty, statuses]);

  const recs = view.currentUser ? recommendTasks(view, view.currentUser, 3) : [];
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const problemTitle = (id: string) => view.problems.find((p) => p.id === id)?.title;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-5" aria-label="Task filters">
        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">Status</legend>
          <div className="flex flex-wrap gap-1.5">
            {TASK_STATUSES.map((s) => <Chip key={s} selected={statuses.includes(s)} onToggle={() => setStatuses((x) => toggle(x, s))}>{TASK_STATUS_META[s].label}</Chip>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">Difficulty</legend>
          <div className="flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((d) => <Chip key={d} selected={difficulty.includes(d)} onToggle={() => setDifficulty((x) => toggle(x, d))}>{DIFFICULTY_META[d].label}</Chip>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">Skills</legend>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((s) => <Chip key={s} className="text-[12px]" selected={skills.includes(s)} onToggle={() => setSkills((x) => toggle(x, s))}>{s}</Chip>)}
          </div>
        </fieldset>
      </aside>
      <div className="min-w-0">
        {recs.length > 0 && (
          <Panel className="mb-6 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-fg"><Sparkles className="size-4 text-accent" aria-hidden /> Suggested for you</p>
            <p className="mt-0.5 text-xs text-fg-subtle">Rule-based matching on your profile skills, interests and followed problems. No AI involved.</p>
            <ul className="mt-3 space-y-2">
              {recs.map((r) => (
                <li key={r.task.id} className="text-sm">
                  <Link href={`/tasks/${r.task.id}`} className="font-medium text-fg hover:text-accent">{r.task.title}</Link>
                  <p className="text-xs text-fg-subtle">{explain(r)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <label htmlFor="task-search" className="sr-only">Search tasks</label>
          <Input id="task-search" type="search" className="pl-9" placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <p className="mt-4 text-sm text-fg-muted" aria-live="polite">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</p>
        {tasks.length === 0 ? (
          <EmptyState icon={ListTodo} title="No tasks match" className="mt-3" action={<Button variant="secondary" onClick={() => { setQ(""); setSkills([]); setDifficulty([]); setStatuses(["open"]); }}>Reset filters</Button>}>
            Try removing a skill or difficulty filter.
          </EmptyState>
        ) : (
          <ul className="mt-3 space-y-3">{tasks.map((t) => <TaskRow key={t.id} task={t} showQuestion={problemTitle(t.problemId)} />)}</ul>
        )}
      </div>
    </div>
  );
}
