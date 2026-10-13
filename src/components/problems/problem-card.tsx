import Link from "next/link";
import { ArrowUpRight, CircleDot, HelpCircle, ListTodo } from "lucide-react";
import type { Problem } from "@/lib/domain/types";
import type { ProblemStats } from "@/lib/domain/discover";
import { categoryLabel, DIFFICULTY_META } from "@/lib/domain/labels";
import { EvidenceBadge, SkillTag } from "@/components/ui/badge";
import { formatDate, pluralize } from "@/lib/utils";

export function ProblemCard({ problem, stats, headingLevel = "h3" }: { problem: Problem; stats: ProblemStats; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-surface-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-fg-subtle">{categoryLabel(problem.category)}</p>
        <EvidenceBadge status={problem.status} />
      </div>
      <H className="mt-3 text-[16px] font-semibold leading-snug tracking-tight text-fg">
        <Link href={`/problems/${problem.slug}`} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none">
          {problem.title}
        </Link>
      </H>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">{problem.summary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {problem.skills.slice(0, 4).map((s) => (
          <SkillTag key={s}>{s}</SkillTag>
        ))}
        {problem.skills.length > 4 && <SkillTag>+{problem.skills.length - 4}</SkillTag>}
      </div>
      <div className="flex-1" />
      <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-xs text-fg-muted [&_dd]:mt-0.5 [&_dd]:text-sm [&_dd]:font-medium [&_dd]:tabular-nums [&_dd]:text-fg">
        <div>
          <dt className="flex items-center gap-1"><ListTodo className="size-3.5" aria-hidden /> Open tasks</dt>
          <dd>{stats.openTasks}<span className="font-normal text-fg-subtle">/{stats.totalTasks}</span></dd>
        </div>
        <div>
          <dt className="flex items-center gap-1"><HelpCircle className="size-3.5" aria-hidden /> Questions</dt>
          <dd>{stats.questions}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1"><CircleDot className="size-3.5" aria-hidden /> Level</dt>
          <dd className="truncate">{DIFFICULTY_META[problem.difficulty].label}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between text-xs text-fg-subtle">
        <span>Updated {formatDate(stats.lastActivity)} · {pluralize(stats.contributions, "contribution")}</span>
        <ArrowUpRight className="size-4 text-fg-subtle transition-colors group-hover:text-accent" aria-hidden />
      </div>
    </article>
  );
}
