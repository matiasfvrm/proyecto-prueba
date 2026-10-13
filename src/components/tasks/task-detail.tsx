"use client";

import Link from "next/link";
import { CheckCircle2, Info, Lock, SearchX, UserCheck } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { ContributionItem, SourceList, UserLink } from "@/components/problems/shared";
import { Badge, SkillTag, TaskBadge, DemoBadge } from "@/components/ui/badge";
import { Container, EmptyState, Eyebrow, Panel, SectionTitle } from "@/components/ui/misc";
import { Button, LinkButton } from "@/components/ui/button";
import { ContributionForm } from "@/components/forms/contribution-form";
import { ReviewForm } from "@/components/forms/review-form";
import { DIFFICULTY_META } from "@/lib/domain/labels";
import { canClaimTask, canReleaseTask, canReview, canSubmitContribution } from "@/lib/domain/workflow";

export function TaskDetail({ id }: { id: string }) {
  const { view, hydrated, dispatch } = useStore();
  const task = view.tasks.find((t) => t.id === id);
  const question = task && view.questions.find((q) => q.id === task.questionId);
  const problem = task && view.problems.find((p) => p.id === task.problemId);

  if (!task || !question || !problem) {
    return (
      <Container className="py-16">
        <EmptyState icon={SearchX} title="Task not found" action={<LinkButton href="/contribute">Browse tasks</LinkButton>}>This task does not exist.</EmptyState>
      </Container>
    );
  }

  const user = view.currentUser;
  const assignee = task.assigneeId ? view.users.find((u) => u.id === task.assigneeId) : null;
  const active = user ? view.tasks.filter((t) => t.assigneeId === user.id && (t.status === "in_progress" || t.status === "in_review")).length : 0;
  const claim = canClaimTask(task, user, active);
  const release = canReleaseTask(task, user);
  const submit = canSubmitContribution(task, user);
  const contributions = view.contributions.filter((c) => c.taskId === task.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sources = task.sourceIds.map((sid) => view.sources.find((s) => s.id === sid)).filter((s) => !!s);
  const isMine = !!user && task.assigneeId === user.id;

  return (
    <Container className="py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href={`/problems/${problem.slug}`} className="hover:text-fg">{problem.title}</Link>
        <span className="mx-1.5" aria-hidden>/</span>
        <Link href={`/problems/${problem.slug}?tab=tasks`} className="hover:text-fg">Tasks</Link>
      </nav>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Eyebrow>Task</Eyebrow>
        <TaskBadge status={task.status} />
        <Badge tone="muted">{DIFFICULTY_META[task.difficulty].label}</Badge>
      </div>
      <h1 className="mt-3 max-w-4xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{task.title}</h1>
      <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-fg-muted">{task.objective}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="t-desc">
            <SectionTitle id="t-desc">Description</SectionTitle>
            <p className="text-[15px] leading-relaxed text-fg-muted">{task.description}</p>
          </section>
          <section aria-labelledby="t-deliv">
            <SectionTitle id="t-deliv">Expected deliverable</SectionTitle>
            <p className="rounded-lg border-l-2 border-accent/60 bg-surface py-3 pl-4 pr-3 text-[15px] text-fg-muted">{task.deliverable}</p>
          </section>
          <section aria-labelledby="t-acc">
            <SectionTitle id="t-acc">Acceptance criteria</SectionTitle>
            <ul className="space-y-2">
              {task.acceptanceCriteria.map((c) => (
                <li key={c} className="flex gap-2.5 text-sm text-fg-muted"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />{c}</li>
              ))}
            </ul>
          </section>
          {isMine && submit.ok && (
            <section aria-labelledby="t-submit" className="rounded-lg border border-accent/30 bg-surface p-5">
              <SectionTitle id="t-submit">Submit your contribution</SectionTitle>
              <ContributionForm taskId={task.id} />
            </section>
          )}
          <section aria-labelledby="contributions" id="contributions">
            <SectionTitle id="contributions" count={contributions.length}>Contributions</SectionTitle>
            {contributions.length === 0 ? (
              <p className="text-sm text-fg-subtle">Nothing submitted yet.</p>
            ) : (
              <ul className="space-y-3">
                {contributions.map((c) => {
                  const rv = canReview(c, user);
                  return (
                    <li key={c.id} className="space-y-2">
                      <ContributionItem c={c} showTask={false} as="div" />
                      {rv.ok && <ReviewForm contributionId={c.id} criteria={task.acceptanceCriteria} />}
                      {c.status === "submitted" && user && c.authorId === user.id && (
                        <p className="text-xs text-fg-subtle">Waiting for an independent reviewer. You cannot review your own work.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section aria-labelledby="t-refs">
            <SectionTitle id="t-refs">Related references</SectionTitle>
            <SourceList sources={sources} />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start" aria-label="Task actions">
          <Panel className="p-4">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-fg-subtle">Status</dt><dd><TaskBadge status={task.status} /></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-fg-subtle">Assigned to</dt><dd className="text-right">{assignee ? <span className="inline-flex items-center gap-1.5"><UserLink userId={assignee.id} />{assignee.isDemo && <DemoBadge />}</span> : <span className="text-fg-muted">Unassigned</span>}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-fg-subtle">Difficulty</dt><dd className="text-fg-muted">{DIFFICULTY_META[task.difficulty].label}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-fg-subtle">Estimated effort</dt><dd className="text-fg-muted">{task.effort}</dd></div>
            </dl>
            <div className="mt-4 border-t border-line pt-4">
              {!hydrated ? (
                <div className="skeleton h-9 rounded-md" />
              ) : claim.ok ? (
                <Button className="w-full" onClick={() => dispatch({ type: "claimTask", payload: { taskId: task.id } })}>
                  <UserCheck className="size-4" aria-hidden /> Claim this task
                </Button>
              ) : release.ok ? (
                <div className="space-y-2">
                  <p className="text-[13px] text-fg-muted">You are working on this task. Submit your contribution in the form on this page.</p>
                  <Button variant="secondary" className="w-full" onClick={() => dispatch({ type: "releaseTask", payload: { taskId: task.id } })}>Release task</Button>
                </div>
              ) : !user && task.status === "open" ? (
                <LinkButton href={`/signin?next=/tasks/${task.id}`} className="w-full">Sign in to claim</LinkButton>
              ) : (
                <p className="flex gap-2 text-[13px] text-fg-muted">
                  {task.status === "blocked" ? <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0" aria-hidden />}
                  {isMine && task.status === "in_review" ? "Your contribution is waiting for review." : claim.ok ? "" : claim.reason}
                </p>
              )}
            </div>
          </Panel>
          <Panel className="p-4">
            <Eyebrow className="text-fg-subtle">Required skills</Eyebrow>
            <div className="mt-2.5 flex flex-wrap gap-1.5">{task.skills.map((s) => <SkillTag key={s}>{s}</SkillTag>)}</div>
          </Panel>
          <Panel className="p-4">
            <Eyebrow className="text-fg-subtle">Research question</Eyebrow>
            <Link href={`/questions/${question.id}`} className="mt-2 block text-sm leading-snug text-fg hover:text-accent">{question.question}</Link>
            <p className="mt-2 text-xs text-fg-subtle">Part of <Link href={`/problems/${problem.slug}`} className="text-fg-muted hover:text-accent">{problem.title}</Link></p>
          </Panel>
          <p className="px-1 text-xs leading-relaxed text-fg-subtle">Completing this task does not mark the research question or any solution as validated. Validation follows the problem&apos;s published criteria.</p>
        </aside>
      </div>
    </Container>
  );
}
