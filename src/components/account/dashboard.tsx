"use client";

import Link from "next/link";
import { ArrowRight, Bell, ClipboardList, Compass, GitPullRequest, ListTodo, ShieldCheck, Sparkles, UserCircle } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { ActivityList, ContributionItem, TaskRow } from "@/components/problems/shared";
import { Container, EmptyState, Panel, SectionTitle, Skeleton, PageHeader } from "@/components/ui/misc";
import { EvidenceBadge, Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { explain, recommendTasks } from "@/lib/domain/recommend";
import { categoryLabel } from "@/lib/domain/labels";
import { problemStats } from "@/lib/domain/discover";

export function Dashboard() {
  const { view, hydrated } = useStore();
  const user = view.currentUser;

  if (!hydrated)
    return (
      <Container className="py-12">
        <Skeleton className="h-10 w-64" />
        <div className="mt-8 grid gap-4 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      </Container>
    );
  if (!user)
    return (
      <Container className="py-16">
        <EmptyState icon={UserCircle} title="Sign in to see your dashboard" action={<LinkButton href="/signin?next=/dashboard">Sign in</LinkButton>}>
          Your dashboard shows followed problems, current tasks, contributions and reviews waiting for you.
        </EmptyState>
      </Container>
    );

  const followed = (view.follows[user.id] ?? []).map((id) => view.problems.find((p) => p.id === id)).filter((p) => !!p);
  const myTasks = view.tasks.filter((t) => t.assigneeId === user.id && t.status !== "completed");
  const myContribs = view.contributions.filter((c) => c.authorId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reviewRequests =
    user.role === "contributor" ? [] : view.contributions.filter((c) => c.status === "submitted" && c.authorId !== user.id);
  const pendingModeration =
    user.role === "moderator" ? [...view.problemSubmissions, ...view.questionProposals].filter((s) => s.status === "pending_review" && s.authorId !== user.id).length : 0;
  const recs = recommendTasks(view, user, 4);
  const followedIds = new Set(followed.map((p) => p.id));
  const related = [...new Set(followed.flatMap((p) => p.relatedProblemIds))]
    .filter((id) => !followedIds.has(id))
    .map((id) => view.problems.find((p) => p.id === id))
    .filter((p) => !!p)
    .slice(0, 3);
  const feed = view.activity.filter((a) => followedIds.has(a.problemId) || a.actorId === user.id);

  const next: Array<{ href: string; label: string; why: string }> = [];
  if (user.skills.length === 0) next.push({ href: `/profile/${user.handle}`, label: "Add skills to your profile", why: "Skills are used to suggest tasks you can do." });
  if (followed.length === 0) next.push({ href: "/problems", label: "Follow a problem", why: "Followed problems feed your activity and suggestions." });
  myTasks.filter((t) => t.status === "in_progress").forEach((t) => next.push({ href: `/tasks/${t.id}`, label: `Submit your work for “${t.title}”`, why: "This task is assigned to you and in progress." }));
  if (reviewRequests.length) next.push({ href: "/review", label: `Review ${reviewRequests.length} contribution${reviewRequests.length > 1 ? "s" : ""}`, why: "You are a reviewer and work is waiting." });
  if (pendingModeration) next.push({ href: "/review?tab=moderation", label: `Moderate ${pendingModeration} submission${pendingModeration > 1 ? "s" : ""}`, why: "You are a moderator." });
  if (myTasks.length === 0 && recs[0]) next.push({ href: `/tasks/${recs[0].task.id}`, label: `Consider “${recs[0].task.title}”`, why: explain(recs[0]) });

  return (
    <Container className="py-12">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={<>Signed in as @{user.handle} · {user.role}{user.isDemo && <> · <Badge tone="muted">Demo profile</Badge></>}</>}
        actions={<><LinkButton href={`/profile/${user.handle}`} variant="secondary">View profile</LinkButton><LinkButton href="/contribute">Find a task</LinkButton></>}
      />

      {next.length > 0 && (
        <section aria-labelledby="next-title" className="mt-8">
          <SectionTitle id="next-title">Suggested next actions</SectionTitle>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {next.slice(0, 6).map((n) => (
              <li key={n.href + n.label}>
                <Link href={n.href} className="group flex h-full items-start justify-between gap-3 rounded-lg border border-line bg-surface p-4 hover:border-line-strong">
                  <span>
                    <span className="block text-sm font-medium text-fg">{n.label}</span>
                    <span className="mt-1 block text-xs text-fg-subtle">{n.why}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-fg-subtle group-hover:text-accent" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="tasks-title">
            <SectionTitle id="tasks-title" count={myTasks.length}>Current tasks</SectionTitle>
            {myTasks.length === 0 ? (
              <EmptyState icon={ListTodo} title="No active tasks" action={<LinkButton href="/contribute" variant="secondary">Browse open tasks</LinkButton>}>Claim a task to start contributing.</EmptyState>
            ) : (
              <ul className="space-y-3">{myTasks.map((t) => <TaskRow key={t.id} task={t} showQuestion={view.problems.find((p) => p.id === t.problemId)?.title} />)}</ul>
            )}
          </section>

          <section aria-labelledby="reviews-title">
            <SectionTitle id="reviews-title" count={reviewRequests.length} action={reviewRequests.length > 0 ? <Link href="/review" className="text-sm text-accent hover:underline">Open queue</Link> : undefined}>Review requests</SectionTitle>
            {user.role === "contributor" ? (
              <p className="text-sm text-fg-subtle">Reviewing is open to contributors with reviewer status. In demo mode, switch to a demo reviewer to try it.</p>
            ) : reviewRequests.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-fg-subtle"><ShieldCheck className="size-4" aria-hidden /> Nothing waiting for review.</p>
            ) : (
              <ul className="space-y-3">{reviewRequests.slice(0, 3).map((c) => <ContributionItem key={c.id} c={c} />)}</ul>
            )}
          </section>

          <section aria-labelledby="contribs-title">
            <SectionTitle id="contribs-title" count={myContribs.length}>Recent contributions</SectionTitle>
            {myContribs.length === 0 ? (
              <EmptyState icon={GitPullRequest} title="No contributions yet">Contributions you submit appear here with their review status.</EmptyState>
            ) : (
              <ul className="space-y-3">{myContribs.slice(0, 5).map((c) => <ContributionItem key={c.id} c={c} />)}</ul>
            )}
          </section>

          <section aria-labelledby="feed-title">
            <SectionTitle id="feed-title">Activity on problems you follow</SectionTitle>
            <ActivityList events={feed} limit={8} />
          </section>
        </div>

        <aside className="space-y-6">
          <Panel className="p-4">
            <SectionTitle count={followed.length}><Bell className="size-4 text-fg-subtle" aria-hidden /> Followed problems</SectionTitle>
            {followed.length === 0 ? (
              <p className="text-sm text-fg-subtle">You are not following any problems. <Link href="/problems" className="text-accent hover:underline">Discover problems</Link></p>
            ) : (
              <ul className="space-y-3">
                {followed.map((p) => {
                  const s = problemStats(view, p);
                  return (
                    <li key={p.id}>
                      <Link href={`/problems/${p.slug}`} className="block text-sm font-medium text-fg hover:text-accent">{p.title}</Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-fg-subtle"><EvidenceBadge status={p.status} /> {s.openTasks} open tasks</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <Panel className="p-4">
            <SectionTitle><Sparkles className="size-4 text-accent" aria-hidden /> Suggested tasks</SectionTitle>
            {recs.length === 0 ? (
              <p className="text-sm text-fg-subtle">Add skills and interests to your profile to get suggestions.</p>
            ) : (
              <ul className="space-y-3">
                {recs.map((r) => (
                  <li key={r.task.id}>
                    <Link href={`/tasks/${r.task.id}`} className="text-sm font-medium text-fg hover:text-accent">{r.task.title}</Link>
                    <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">{explain(r)}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 border-t border-line pt-2 text-[11px] text-fg-subtle">Rule-based matching. No AI.</p>
          </Panel>
          {related.length > 0 && (
            <Panel className="p-4">
              <SectionTitle><Compass className="size-4 text-fg-subtle" aria-hidden /> Related problems</SectionTitle>
              <ul className="space-y-2.5">
                {related.map((p) => (
                  <li key={p.id}>
                    <Link href={`/problems/${p.slug}`} className="text-sm text-fg hover:text-accent">{p.title}</Link>
                    <p className="text-xs text-fg-subtle">{categoryLabel(p.category)} · related to problems you follow</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel className="p-4">
            <SectionTitle><ClipboardList className="size-4 text-fg-subtle" aria-hidden /> Your submissions</SectionTitle>
            {(() => {
              const subs = [...view.problemSubmissions.filter((s) => s.authorId === user.id).map((s) => ({ id: s.id, label: s.title, status: s.status })), ...view.questionProposals.filter((q) => q.authorId === user.id).map((q) => ({ id: q.id, label: q.question, status: q.status }))];
              if (!subs.length) return <p className="text-sm text-fg-subtle">No submitted problems or questions. <Link href="/submit" className="text-accent hover:underline">Submit a problem</Link></p>;
              return (
                <ul className="space-y-2">
                  {subs.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-2 text-[13px] text-fg-muted">
                      <span className="line-clamp-2">{s.label}</span>
                      <Badge tone={s.status === "accepted" ? "success" : s.status === "rejected" ? "muted" : "warn"}>{s.status === "pending_review" ? "Pending review" : s.status}</Badge>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </Panel>
        </aside>
      </div>
    </Container>
  );
}
