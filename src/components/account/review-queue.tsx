"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Flag, Inbox, ShieldCheck, UserCircle, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { ContributionItem, UserLink } from "@/components/problems/shared";
import { ReviewForm } from "@/components/forms/review-form";
import { Container, EmptyState, PageHeader, Panel, Skeleton } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { categoryLabel } from "@/lib/domain/labels";
import { canModerate } from "@/lib/domain/workflow";
import { cn, formatDate } from "@/lib/utils";

export function ReviewQueue() {
  const { view, hydrated, dispatch } = useStore();
  const params = useSearchParams();
  const [tab, setTab] = useState<"contributions" | "moderation">(params.get("tab") === "moderation" ? "moderation" : "contributions");
  const user = view.currentUser;

  if (!hydrated) return <Container className="py-12"><Skeleton className="h-64" /></Container>;
  if (!user)
    return (
      <Container className="py-16">
        <EmptyState icon={UserCircle} title="Sign in to review" action={<LinkButton href="/signin?next=/review">Sign in</LinkButton>}>Reviewing requires a reviewer or moderator profile.</EmptyState>
      </Container>
    );

  const pending = view.contributions.filter((c) => c.status === "submitted").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const problemSubs = view.problemSubmissions.filter((s) => s.status === "pending_review");
  const questionSubs = view.questionProposals.filter((s) => s.status === "pending_review");
  const isReviewer = user.role !== "contributor";
  const isModerator = user.role === "moderator";

  return (
    <Container className="py-12">
      <PageHeader
        eyebrow="Review"
        title="Review queue"
        description="Contributions are reviewed against their task's acceptance criteria. New problems and questions are moderated before they are published. Nobody reviews their own work."
      />
      <div role="tablist" aria-label="Queue" className="mt-6 flex gap-1 border-b border-line">
        {([["contributions", `Contributions (${pending.length})`], ["moderation", `Moderation (${problemSubs.length + questionSubs.length})`]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("-mb-px border-b-2 px-3 pb-3 pt-1 text-sm", tab === id ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg")}>{label}</button>
        ))}
      </div>

      {tab === "contributions" && (
        <div className="mt-6 space-y-4" role="tabpanel">
          {!isReviewer && <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg-muted">You can read the queue, but only reviewers can submit reviews. In demo mode, sign in as a demo reviewer (Amara or Mei) to try it.</p>}
          {pending.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="Nothing awaiting review">When contributors submit work, it appears here.</EmptyState>
          ) : (
            <ul className="space-y-6">
              {pending.map((c) => {
                const task = view.tasks.find((t) => t.id === c.taskId);
                const own = c.authorId === user.id;
                return (
                  <li key={c.id} className="space-y-2">
                    <ContributionItem c={c} as="div" />
                    {isReviewer && !own && task && <ReviewForm contributionId={c.id} criteria={task.acceptanceCriteria} />}
                    {own && <p className="text-xs text-fg-subtle">This is your contribution. Another reviewer must review it.</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "moderation" && (
        <div className="mt-6 space-y-8" role="tabpanel">
          {!isModerator && <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg-muted">Only moderators can accept or reject submissions. In demo mode, sign in as Sofía (demo moderator) to try it.</p>}
          <section aria-labelledby="mod-problems">
            <h2 id="mod-problems" className="mb-3 text-[15px] font-semibold">Problem submissions</h2>
            {problemSubs.length === 0 ? <EmptyState icon={Inbox} title="No pending problem submissions" action={<LinkButton href="/submit" variant="secondary">Submit a problem</LinkButton>} /> : (
              <ul className="space-y-3">
                {problemSubs.map((s) => {
                  const rule = canModerate(s, user);
                  return (
                    <Panel as="li" key={s.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-[15px] font-medium">{s.title}</h3>
                        <Badge tone="warn">Pending review</Badge>
                      </div>
                      <p className="mt-1 text-xs text-fg-subtle">{categoryLabel(s.category)} · by <UserLink userId={s.authorId} /> · {formatDate(s.createdAt)}</p>
                      <p className="mt-3 whitespace-pre-line text-sm text-fg-muted">{s.description}</p>
                      <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-fg-muted hover:text-fg">Evidence, sources and questions</summary>
                        <div className="mt-2 space-y-2 text-fg-muted">
                          <p><span className="text-fg">Why it matters:</span> {s.whyItMatters}</p>
                          <p><span className="text-fg">Evidence (unverified):</span> {s.evidence}</p>
                          {s.existingApproaches && <p><span className="text-fg">Existing approaches:</span> {s.existingApproaches}</p>}
                          {s.limitations && <p><span className="text-fg">Limitations:</span> {s.limitations}</p>}
                          <ul className="list-disc pl-5">{s.sources.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer nofollow ugc" className="break-all text-accent hover:underline">{u}</a></li>)}</ul>
                          <ul className="list-disc pl-5">{s.researchQuestions.map((q) => <li key={q}>{q}</li>)}</ul>
                        </div>
                      </details>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button size="sm" disabled={!rule.ok} onClick={() => dispatch({ type: "moderate", payload: { target: "problem_submission", id: s.id, decision: "accepted" } })}><Check className="size-3.5" aria-hidden /> Accept as “Proposed”</Button>
                        <Button size="sm" variant="secondary" disabled={!rule.ok} onClick={() => dispatch({ type: "moderate", payload: { target: "problem_submission", id: s.id, decision: "rejected" } })}><X className="size-3.5" aria-hidden /> Reject</Button>
                        {!rule.ok && <span className="text-xs text-fg-subtle">{rule.reason}</span>}
                      </div>
                    </Panel>
                  );
                })}
              </ul>
            )}
          </section>
          <section aria-labelledby="mod-questions">
            <h2 id="mod-questions" className="mb-3 text-[15px] font-semibold">Proposed research questions</h2>
            {questionSubs.length === 0 ? <EmptyState icon={Inbox} title="No pending question proposals" /> : (
              <ul className="space-y-3">
                {questionSubs.map((q) => {
                  const p = view.problems.find((x) => x.id === q.problemId);
                  const rule = canModerate(q, user);
                  return (
                    <Panel as="li" key={q.id} className="p-4">
                      <h3 className="text-[15px] font-medium">{q.question}</h3>
                      <p className="mt-1 text-xs text-fg-subtle">For <Link href={`/problems/${p?.slug}`} className="text-fg-muted hover:text-accent">{p?.title}</Link> · by <UserLink userId={q.authorId} /> · {formatDate(q.createdAt)}</p>
                      <p className="mt-2 text-sm text-fg-muted">{q.rationale}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button size="sm" disabled={!rule.ok} onClick={() => dispatch({ type: "moderate", payload: { target: "question_proposal", id: q.id, decision: "accepted" } })}><Check className="size-3.5" aria-hidden /> Accept</Button>
                        <Button size="sm" variant="secondary" disabled={!rule.ok} onClick={() => dispatch({ type: "moderate", payload: { target: "question_proposal", id: q.id, decision: "rejected" } })}><X className="size-3.5" aria-hidden /> Reject</Button>
                        {!rule.ok && <span className="text-xs text-fg-subtle">{rule.reason}</span>}
                      </div>
                    </Panel>
                  );
                })}
              </ul>
            )}
          </section>
          {isModerator && (
            <section aria-labelledby="mod-reports">
              <h2 id="mod-reports" className="mb-3 flex items-center gap-2 text-[15px] font-semibold"><Flag className="size-4 text-fg-subtle" aria-hidden /> Abuse reports</h2>
              {view.reports.length === 0 ? <p className="text-sm text-fg-subtle">No reports.</p> : (
                <ul className="space-y-2">
                  {view.reports.map((r) => (
                    <li key={r.id} className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg-muted">
                      <Badge tone="danger">{r.reason}</Badge> on {r.targetType.replace("_", " ")} <code className="text-xs">{r.targetId}</code> · {formatDate(r.createdAt)}
                      {r.details && <p className="mt-1 text-[13px]">{r.details}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </Container>
  );
}
