"use client";

import Link from "next/link";
import { ArrowUpRight, Bell, BellOff, ExternalLink, FileWarning, History } from "lucide-react";
import type { ActivityEvent, Contribution, Source, Task } from "@/lib/domain/types";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { ContributionBadge, DemoBadge, SkillTag, TaskBadge, Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { contributionKindLabel, DIFFICULTY_META } from "@/lib/domain/labels";
import { formatDate } from "@/lib/utils";
import { ReportButton } from "@/components/forms/report-button";

export function UserLink({ userId, showAvatar = false }: { userId: string; showAvatar?: boolean }) {
  const { view } = useStore();
  const u = view.users.find((x) => x.id === userId);
  if (!u) return <span className="text-fg-subtle">Unknown contributor</span>;
  return (
    <Link href={`/profile/${u.handle}`} className="inline-flex items-center gap-1.5 text-fg hover:text-accent">
      {showAvatar && <Avatar name={u.name} size={20} />}
      {u.name}
      {u.isDemo && <span className="sr-only"> (demo profile)</span>}
    </Link>
  );
}

export function FollowButton({ problemId }: { problemId: string }) {
  const { view, dispatch, hydrated } = useStore();
  const user = view.currentUser;
  const following = !!user && (view.follows[user.id] ?? []).includes(problemId);
  if (!hydrated) return <Button variant="secondary" disabled className="w-full">Follow</Button>;
  if (!user)
    return (
      <Link href="/signin" className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-surface-2 text-sm text-fg hover:bg-surface-3">
        <Bell className="size-4" aria-hidden /> Sign in to follow
      </Link>
    );
  return (
    <Button
      variant={following ? "secondary" : "primary"}
      className="w-full"
      aria-pressed={following}
      onClick={() => dispatch({ type: following ? "unfollowProblem" : "followProblem", payload: { problemId } })}
    >
      {following ? <BellOff className="size-4" aria-hidden /> : <Bell className="size-4" aria-hidden />}
      {following ? "Following" : "Follow problem"}
    </Button>
  );
}

export function TaskRow({ task, showQuestion }: { task: Task; showQuestion?: string }) {
  return (
    <li className="group relative rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[15px] font-medium leading-snug text-fg">
          <Link href={`/tasks/${task.id}`} className="after:absolute after:inset-0 after:rounded-lg">
            {task.title}
          </Link>
        </h3>
        <TaskBadge status={task.status} />
      </div>
      {showQuestion && <p className="mt-1 line-clamp-1 text-xs text-fg-subtle">{showQuestion}</p>}
      <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{task.objective}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-fg-subtle">
        <Badge tone="muted">{DIFFICULTY_META[task.difficulty].label}</Badge>
        <span className="mr-1">{task.effort}</span>
        {task.skills.map((s) => (
          <SkillTag key={s}>{s}</SkillTag>
        ))}
      </div>
    </li>
  );
}

export function ContributionItem({ c, showTask = true, as: As = "li" }: { c: Contribution; showTask?: boolean; as?: "li" | "div" }) {
  const { view } = useStore();
  const task = view.tasks.find((t) => t.id === c.taskId);
  const author = view.users.find((u) => u.id === c.authorId);
  const reviews = view.reviews.filter((r) => r.contributionId === c.id);
  return (
    <As className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-medium text-fg">{c.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-fg-subtle">
            <UserLink userId={c.authorId} />
            {author?.isDemo && <DemoBadge />}
            <span>· {contributionKindLabel(c.kind)} · {formatDate(c.createdAt)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {c.negativeResult && (
            <Badge tone="muted" title="Reports a negative or null result">
              <FileWarning className="size-3" aria-hidden /> Negative result
            </Badge>
          )}
          <ContributionBadge status={c.status} />
        </div>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-fg-muted">{c.summary}</p>
      {c.links.length > 0 && (
        <ul className="mt-2 space-y-1">
          {c.links.map((l) => (
            <li key={l}>
              <a href={l} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-1 break-all text-[13px] text-accent hover:underline">
                {l} <ExternalLink className="size-3 shrink-0" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
      {showTask && task && (
        <p className="mt-3 text-xs text-fg-subtle">
          For task{" "}
          <Link href={`/tasks/${task.id}`} className="text-fg-muted hover:text-accent">
            {task.title}
          </Link>
        </p>
      )}
      <div className="mt-2"><ReportButton targetType="contribution" targetId={c.id} /></div>
      {reviews.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          {reviews.map((r) => (
            <div key={r.id} className="text-[13px] text-fg-muted">
              <span className="text-fg-subtle">Review by </span>
              <UserLink userId={r.reviewerId} />
              <span className="text-fg-subtle"> · {formatDate(r.createdAt)}: </span>
              {r.comment}
            </div>
          ))}
        </div>
      )}
    </As>
  );
}

export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return <p className="text-sm text-fg-subtle">No sources linked yet.</p>;
  return (
    <ol className="space-y-2.5">
      {sources.map((s, i) => (
        <li key={s.id} id={s.id} className="flex gap-3 text-sm">
          <span className="w-5 shrink-0 pt-0.5 font-mono text-xs text-fg-subtle">[{i + 1}]</span>
          <div>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-1 text-fg hover:text-accent">
              {s.title}
              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-fg-subtle group-hover:text-accent" aria-hidden />
            </a>
            <p className="text-xs text-fg-subtle">
              {s.publisher}
              {s.year && `, ${s.year}`} · {s.type}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ActivityList({ events, limit = 10 }: { events: ActivityEvent[]; limit?: number }) {
  if (events.length === 0)
    return (
      <p className="flex items-center gap-2 text-sm text-fg-subtle">
        <History className="size-4" aria-hidden /> No activity yet.
      </p>
    );
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {events.slice(0, limit).map((e) => (
        <li key={e.id} className="relative text-sm">
          <span className="absolute -left-[23.5px] top-1.5 size-2 rounded-full border border-line-strong bg-surface-3" aria-hidden />
          <p className="text-fg-muted">
            <UserLink userId={e.actorId} /> <span className="text-fg-muted">— {e.message}</span>
          </p>
          <time dateTime={e.at} className="text-xs text-fg-subtle">
            {formatDate(e.at)}
          </time>
        </li>
      ))}
    </ol>
  );
}
