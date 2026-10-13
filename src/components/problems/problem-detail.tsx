"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Flag,
  GitBranch,
  HelpCircle,
  ListTodo,
  Plus,
  SearchX,
} from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { ActivityList, ContributionItem, FollowButton, SourceList, TaskRow } from "./shared";
import { ClaimBadge, EvidenceBadge, SkillTag, Badge } from "@/components/ui/badge";
import { Container, EmptyState, Eyebrow, Panel, SectionTitle } from "@/components/ui/misc";
import { Button, LinkButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/form";
import { ProposeQuestionForm } from "@/components/forms/propose-question-form";
import { categoryLabel, CLAIM_KIND_META, DIFFICULTY_META, EVIDENCE_STATUS_META } from "@/lib/domain/labels";
import { TASK_STATUSES, type TaskStatus } from "@/lib/domain/types";
import { TASK_STATUS_META } from "@/lib/domain/labels";
import { problemStats } from "@/lib/domain/discover";
import { cn, formatDate } from "@/lib/utils";
import { TABS, type TabId } from "./tabs";


function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-pretty text-[15px] leading-relaxed text-fg-muted">{children}</p>;
}

export function ProblemDetail({ slug, initialTab }: { slug: string; initialTab: TabId }) {
  const { view, hydrated } = useStore();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "all">("all");
  const [proposing, setProposing] = useState(false);

  const problem = view.problems.find((p) => p.slug === slug);
  const data = useMemo(() => {
    if (!problem) return null;
    const questions = view.questions.filter((q) => q.problemId === problem.id);
    const qids = new Set(questions.map((q) => q.id));
    const hypotheses = view.hypotheses.filter((h) => qids.has(h.questionId));
    return {
      questions,
      hypotheses,
      experiments: view.experiments.filter((e) => hypotheses.some((h) => h.id === e.hypothesisId)),
      tasks: view.tasks.filter((t) => t.problemId === problem.id),
      contributions: view.contributions.filter((c) => c.problemId === problem.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      solutions: view.solutions.filter((s) => s.problemId === problem.id),
      sources: problem.sourceIds.map((id) => view.sources.find((s) => s.id === id)).filter((s) => !!s),
      related: problem.relatedProblemIds.map((id) => view.problems.find((p) => p.id === id)).filter((p) => !!p),
      activity: view.activity.filter((a) => a.problemId === problem.id),
      pendingProposals: view.questionProposals.filter((p) => p.problemId === problem.id && p.status === "pending_review"),
      stats: problemStats(view, problem),
    };
  }, [view, problem]);

  if (!problem || !data) {
    if (!hydrated) return <Container className="py-16"><div className="skeleton h-40 rounded-lg" /></Container>;
    return (
      <Container className="py-16">
        <EmptyState icon={SearchX} title="Problem not found" action={<LinkButton href="/problems">Browse problems</LinkButton>}>
          This problem does not exist, or it is a submission that has not been accepted yet.
        </EmptyState>
      </Container>
    );
  }

  const select = (id: TabId) => {
    setTab(id);
    const url = new URL(window.location.href);
    if (id === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", id);
    url.hash = "";
    window.history.replaceState(null, "", url);
  };

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = TABS.length;
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % n;
    if (e.key === "ArrowLeft") next = (i - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    if (next >= 0) {
      e.preventDefault();
      select(TABS[next].id);
      document.getElementById(`tab-${TABS[next].id}`)?.focus();
    }
  };

  const counts: Partial<Record<TabId, number>> = {
    questions: data.questions.length,
    tasks: data.tasks.length,
    contributions: data.contributions.length,
  };
  const questionText = (id: string) => data.questions.find((q) => q.id === id)?.question;
  const filteredTasks = taskFilter === "all" ? data.tasks : data.tasks.filter((t) => t.status === taskFilter);

  return (
    <>
      <div className="border-b border-line">
        <Container className="pb-0 pt-10">
          <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
            <Link href="/problems" className="hover:text-fg">Problems</Link>
            <span className="mx-1.5" aria-hidden>/</span>
            <span>{categoryLabel(problem.category)}</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <EvidenceBadge status={problem.status} />
            <Badge tone="muted">{DIFFICULTY_META[problem.difficulty].label}</Badge>
            {problem.id.startsWith("p-ps-") ? <Badge tone="warn">Community submission</Badge> : <Badge tone="muted">Demo content</Badge>}
          </div>
          <h1 className="mt-3 max-w-4xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{problem.title}</h1>
          <p className="mt-3 max-w-3xl text-pretty text-[16px] leading-relaxed text-fg-muted">{problem.summary}</p>

          <div role="tablist" aria-label="Problem sections" className="-mb-px mt-8 flex gap-1 overflow-x-auto">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => select(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 pt-1 text-sm transition-colors",
                  tab === t.id ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {t.label}
                {counts[t.id] !== undefined && <span className="rounded bg-surface-3 px-1.5 text-[11px] tabular-nums text-fg-muted">{counts[t.id]}</span>}
              </button>
            ))}
          </div>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_300px]">
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="min-w-0 focus-visible:outline-none">
          {tab === "overview" && (
            <div className="space-y-10">
              <section aria-labelledby="h-why">
                <SectionTitle id="h-why">Why it matters</SectionTitle>
                <Prose>{problem.whyItMatters}</Prose>
              </section>
              <section aria-labelledby="h-def">
                <SectionTitle id="h-def">Problem definition</SectionTitle>
                <div className="rounded-lg border-l-2 border-accent/60 bg-surface py-3 pl-4 pr-3">
                  <Prose>{problem.definition}</Prose>
                </div>
              </section>
              {problem.causes.length > 0 && (
                <section aria-labelledby="h-causes" id="causes">
                  <SectionTitle id="h-causes" count={problem.causes.length}>Contributing causes</SectionTitle>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {problem.causes.map((c) => (
                      <li key={c.id} className="rounded-lg border border-line bg-surface p-4">
                        <p className="text-sm font-medium text-fg">{c.title}</p>
                        <p className="mt-1 text-sm text-fg-muted">{c.description}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section aria-labelledby="h-approaches">
                <SectionTitle id="h-approaches" count={problem.approaches.length}>Existing approaches</SectionTitle>
                {problem.approaches.length === 0 ? (
                  <p className="text-sm text-fg-subtle">No approaches documented yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {problem.approaches.map((a) => (
                      <li key={a.title} className="rounded-lg border border-line bg-surface p-4">
                        <p className="text-sm font-medium text-fg">{a.title}</p>
                        <p className="mt-1 text-sm text-fg-muted">{a.description}</p>
                        {a.limitations.length > 0 && (
                          <p className="mt-2 text-xs text-fg-subtle">Limitations: {a.limitations.join("; ")}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section aria-labelledby="h-limits">
                <SectionTitle id="h-limits">Known limitations</SectionTitle>
                {problem.limitations.length === 0 ? (
                  <p className="text-sm text-fg-subtle">None documented yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {problem.limitations.map((l) => (
                      <li key={l} className="flex gap-2.5 text-sm text-fg-muted">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300/80" aria-hidden />
                        {l}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section aria-labelledby="h-related">
                <SectionTitle id="h-related">Related problems</SectionTitle>
                {data.related.length === 0 ? (
                  <p className="text-sm text-fg-subtle">No related problems linked yet.</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {data.related.map((r) => (
                      <li key={r.id}>
                        <Link href={`/problems/${r.slug}`} className="flex h-full items-start justify-between gap-3 rounded-lg border border-line bg-surface p-4 hover:border-line-strong">
                          <span>
                            <span className="block text-sm font-medium text-fg">{r.title}</span>
                            <span className="mt-1 block text-xs text-fg-subtle">{categoryLabel(r.category)}</span>
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section aria-labelledby="h-activity">
                <SectionTitle id="h-activity">Activity history</SectionTitle>
                <ActivityList events={data.activity} />
              </section>
            </div>
          )}

          {tab === "questions" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-sm text-fg-muted">Focused questions that, once answered with evidence, move this problem forward.</p>
                <Button variant="secondary" size="sm" onClick={() => setProposing((p) => !p)} aria-expanded={proposing}>
                  <Plus className="size-4" aria-hidden /> Propose a question
                </Button>
              </div>
              {proposing && (
                <Panel className="p-5">
                  <ProposeQuestionForm problemId={problem.id} onDone={() => setProposing(false)} />
                </Panel>
              )}
              {data.pendingProposals.length > 0 && (
                <p className="rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-200/90">
                  {data.pendingProposals.length} proposed {data.pendingProposals.length === 1 ? "question is" : "questions are"} waiting for moderator review.
                </p>
              )}
              {data.questions.length === 0 ? (
                <EmptyState icon={HelpCircle} title="No research questions yet">Propose the first question to start breaking this problem down.</EmptyState>
              ) : (
                <ul className="space-y-3">
                  {data.questions.map((q) => {
                    const tasks = data.tasks.filter((t) => t.questionId === q.id);
                    return (
                      <li key={q.id} className="group relative rounded-lg border border-line bg-surface p-5 hover:border-line-strong hover:bg-surface-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="max-w-2xl text-[15px] font-medium leading-snug text-fg">
                            <Link href={`/questions/${q.id}`} className="after:absolute after:inset-0 after:rounded-lg">{q.question}</Link>
                          </h3>
                          <EvidenceBadge status={q.status} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{q.whyItMatters}</p>
                        <p className="mt-3 text-xs text-fg-subtle">
                          {tasks.length} tasks · {tasks.filter((t) => t.status === "open").length} open · {data.hypotheses.filter((h) => h.questionId === q.id).length} hypotheses
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {tab === "tasks" && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter tasks by status">
                <Chip selected={taskFilter === "all"} onToggle={() => setTaskFilter("all")}>All ({data.tasks.length})</Chip>
                {TASK_STATUSES.map((s) => {
                  const n = data.tasks.filter((t) => t.status === s).length;
                  return (
                    <Chip key={s} selected={taskFilter === s} onToggle={() => setTaskFilter(s)}>
                      {TASK_STATUS_META[s].label} ({n})
                    </Chip>
                  );
                })}
              </div>
              {filteredTasks.length === 0 ? (
                <EmptyState icon={ListTodo} title="No tasks with this status">Choose another status, or look at the research questions to see what work is still undefined.</EmptyState>
              ) : (
                <ul className="space-y-3">
                  {filteredTasks.map((t) => (
                    <TaskRow key={t.id} task={t} showQuestion={questionText(t.questionId)} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "contributions" && (
            <div className="space-y-5">
              <p className="rounded-md border border-line bg-surface px-3 py-2 text-[13px] text-fg-muted">
                “Deliverable accepted” means the work met its task&apos;s acceptance criteria. It does not, by itself, validate any scientific claim.
              </p>
              {data.contributions.length === 0 ? (
                <EmptyState icon={GitBranch} title="No contributions yet" action={<Button variant="secondary" onClick={() => select("tasks")}>See open tasks</Button>}>
                  Claim a task to make the first contribution to this problem.
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {data.contributions.map((c) => (
                    <ContributionItem key={c.id} c={c} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "evidence" && (
            <div className="space-y-10">
              <section aria-labelledby="h-claims">
                <SectionTitle id="h-claims" count={problem.claims.length}>Current evidence and claims</SectionTitle>
                <p className="mb-4 text-sm text-fg-muted">Each statement is labeled by how much it can be trusted. Documented statements come from cited external sources and have not been independently verified here.</p>
                <ul className="space-y-3">
                  {problem.claims.map((cl) => (
                    <li key={cl.id} className="rounded-lg border border-line bg-surface p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="max-w-2xl text-sm leading-relaxed text-fg">{cl.statement}</p>
                        <ClaimBadge kind={cl.kind} />
                      </div>
                      <p className="mt-2 text-xs text-fg-subtle">
                        {cl.sourceIds.length > 0 ? (
                          <>
                            Sources:{" "}
                            {cl.sourceIds.map((sid, i) => {
                              const idx = data.sources.findIndex((s) => s.id === sid);
                              return (
                                <a key={sid} href={`#${sid}`} className="text-fg-muted hover:text-accent">
                                  [{idx + 1}]{i < cl.sourceIds.length - 1 ? " " : ""}
                                </a>
                              );
                            })}
                          </>
                        ) : (
                          CLAIM_KIND_META[cl.kind].description
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="h-criteria">
                <SectionTitle id="h-criteria">Validation criteria</SectionTitle>
                {problem.validationCriteria.length === 0 ? (
                  <p className="rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-200/90">
                    Validation criteria have not been defined yet. Nothing on this problem can be marked validated until they are.
                  </p>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-fg-muted">A solution or claim is marked <strong className="font-medium text-fg">Validated</strong> only when all of these are met and an independent reviewer confirms it.</p>
                    <ul className="space-y-2">
                      {problem.validationCriteria.map((v) => (
                        <li key={v} className="flex gap-2.5 text-sm text-fg-muted">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
                          {v}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              <section aria-labelledby="h-solutions" id="solutions">
                <SectionTitle id="h-solutions" count={data.solutions.length}>Proposed solutions</SectionTitle>
                {data.solutions.length === 0 ? (
                  <p className="text-sm text-fg-subtle">No solutions proposed yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.solutions.map((s) => (
                      <li key={s.id} className="rounded-lg border border-line bg-surface p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <p className="text-sm font-medium text-fg">{s.title}</p>
                          <EvidenceBadge status={s.status} />
                        </div>
                        <p className="mt-1.5 text-sm text-fg-muted">{s.summary}</p>
                        {s.questionIds.length > 0 && (
                          <p className="mt-2 text-xs text-fg-subtle">
                            Depends on:{" "}
                            {s.questionIds.map((qid, i) => (
                              <span key={qid}>
                                <Link href={`/questions/${qid}`} className="text-fg-muted hover:text-accent">{questionText(qid)}</Link>
                                {i < s.questionIds.length - 1 && " · "}
                              </span>
                            ))}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="h-hyp">
                <SectionTitle id="h-hyp" count={data.hypotheses.length}>Hypotheses and experiments</SectionTitle>
                {data.hypotheses.length === 0 ? (
                  <p className="text-sm text-fg-subtle">No hypotheses recorded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.hypotheses.map((h) => (
                      <li key={h.id} className="rounded-lg border border-line bg-surface p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <p className="max-w-2xl text-sm text-fg">{h.statement}</p>
                          <EvidenceBadge status={h.status} />
                        </div>
                        {data.experiments.filter((e) => e.hypothesisId === h.id).map((e) => (
                          <div key={e.id} className="mt-3 rounded-md border border-line bg-bg px-3 py-2">
                            <p className="flex items-center gap-2 text-[13px] font-medium text-fg-muted">
                              <FileSearch className="size-3.5" aria-hidden /> Experiment: {e.title}
                              <span className="ml-auto text-xs font-normal text-fg-subtle">{EVIDENCE_STATUS_META[e.status].label}</span>
                            </p>
                            <p className="mt-1 text-[13px] text-fg-subtle">{e.design}</p>
                          </div>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="h-sources">
                <SectionTitle id="h-sources" count={data.sources.length}>Sources and references</SectionTitle>
                <SourceList sources={data.sources} />
                <p className="mt-4 text-xs text-fg-subtle">Sources are provided as starting points. Demo text does not attribute specific figures or findings to them.</p>
              </section>
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start" aria-label="Problem summary">
          <Panel className="p-4">
            <FollowButton problemId={problem.id} />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-fg-subtle [&_dd]:mt-0.5 [&_dd]:text-lg [&_dd]:font-semibold [&_dd]:tabular-nums [&_dd]:text-fg">
              <div><dt>Open tasks</dt><dd>{data.stats.openTasks}</dd></div>
              <div><dt>Questions</dt><dd>{data.stats.questions}</dd></div>
              <div><dt>Contributions</dt><dd>{data.stats.contributions}</dd></div>
              <div><dt>Followers</dt><dd>{Object.values(view.follows).filter((f) => f.includes(problem.id)).length}</dd></div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-xs text-fg-subtle">Last activity {formatDate(data.stats.lastActivity)}</p>
          </Panel>
          <Panel className="p-4">
            <Eyebrow className="text-fg-subtle">Status</Eyebrow>
            <div className="mt-2"><EvidenceBadge status={problem.status} /></div>
            <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{EVIDENCE_STATUS_META[problem.status].description}</p>
          </Panel>
          {problem.skills.length > 0 && (
            <Panel className="p-4">
              <Eyebrow className="text-fg-subtle">Skills that help</Eyebrow>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {problem.skills.map((s) => (
                  <Link key={s} href={`/contribute?skills=${encodeURIComponent(s)}`}><SkillTag>{s}</SkillTag></Link>
                ))}
              </div>
            </Panel>
          )}
          <div className="flex flex-col gap-1 text-sm">
            <Link href={`/graph?focus=${problem.id}`} className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg">
              <GitBranch className="size-4" aria-hidden /> View in problem graph
            </Link>
            <Link href={`/contact?subject=${encodeURIComponent(`Issue with problem: ${problem.title}`)}`} className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg">
              <Flag className="size-4" aria-hidden /> Report an issue with this page
            </Link>
          </div>
        </aside>
      </Container>
    </>
  );
}
