"use client";

import Link from "next/link";
import { useState } from "react";
import { HelpCircle, ListTodo, Plus, SearchX } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { ContributionItem, SourceList, TaskRow } from "@/components/problems/shared";
import { EvidenceBadge, SkillTag } from "@/components/ui/badge";
import { Container, EmptyState, Eyebrow, Panel, SectionTitle } from "@/components/ui/misc";
import { Button, LinkButton } from "@/components/ui/button";
import { ProposeQuestionForm } from "@/components/forms/propose-question-form";
import { EVIDENCE_STATUS_META, categoryLabel } from "@/lib/domain/labels";

export function QuestionDetail({ id }: { id: string }) {
  const { view, hydrated } = useStore();
  const [proposing, setProposing] = useState(false);
  const q = view.questions.find((x) => x.id === id);
  const problem = q && view.problems.find((p) => p.id === q.problemId);

  if (!q || !problem) {
    if (!hydrated) return <Container className="py-16"><div className="skeleton h-40 rounded-lg" /></Container>;
    return (
      <Container className="py-16">
        <EmptyState icon={SearchX} title="Research question not found" action={<LinkButton href="/problems">Browse problems</LinkButton>}>
          It may have been removed, or it is a proposal still waiting for review.
        </EmptyState>
      </Container>
    );
  }

  const tasks = view.tasks.filter((t) => t.questionId === q.id);
  const hypotheses = view.hypotheses.filter((h) => h.questionId === q.id);
  const contributions = view.contributions.filter((c) => c.questionId === q.id);
  const sources = q.sourceIds.map((sid) => view.sources.find((s) => s.id === sid)).filter((s) => !!s);
  const siblings = view.questions.filter((x) => x.problemId === problem.id && x.id !== q.id);

  return (
    <Container className="py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/problems" className="hover:text-fg">Problems</Link>
        <span className="mx-1.5" aria-hidden>/</span>
        <Link href={`/problems/${problem.slug}`} className="hover:text-fg">{problem.title}</Link>
        <span className="mx-1.5" aria-hidden>/</span>
        <Link href={`/problems/${problem.slug}?tab=questions`} className="hover:text-fg">Research questions</Link>
      </nav>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Eyebrow>Research question</Eyebrow>
        <EvidenceBadge status={q.status} />
      </div>
      <h1 className="mt-3 max-w-4xl text-balance text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{q.question}</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="q-why">
            <SectionTitle id="q-why">Why it matters</SectionTitle>
            <p className="text-[15px] leading-relaxed text-fg-muted">{q.whyItMatters}</p>
          </section>
          <section aria-labelledby="q-known">
            <SectionTitle id="q-known">Existing knowledge</SectionTitle>
            <p className="text-[15px] leading-relaxed text-fg-muted">{q.existingKnowledge}</p>
          </section>
          <div className="grid gap-6 sm:grid-cols-2">
            <section aria-labelledby="q-unc">
              <SectionTitle id="q-unc">Uncertainties</SectionTitle>
              {q.uncertainties.length ? (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg-muted marker:text-fg-subtle">{q.uncertainties.map((u) => <li key={u}>{u}</li>)}</ul>
              ) : <p className="text-sm text-fg-subtle">Not documented yet.</p>}
            </section>
            <section aria-labelledby="q-app">
              <SectionTitle id="q-app">Suggested approaches</SectionTitle>
              {q.suggestedApproaches.length ? (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg-muted marker:text-fg-subtle">{q.suggestedApproaches.map((u) => <li key={u}>{u}</li>)}</ul>
              ) : <p className="text-sm text-fg-subtle">Not documented yet.</p>}
            </section>
          </div>

          <section aria-labelledby="hypotheses" id="hypotheses">
            <SectionTitle id="hypotheses" count={hypotheses.length}>Hypotheses and experiments</SectionTitle>
            {hypotheses.length === 0 ? (
              <p className="text-sm text-fg-subtle">No hypotheses recorded for this question yet.</p>
            ) : (
              <ul className="space-y-3">
                {hypotheses.map((h) => (
                  <li key={h.id} className="rounded-lg border border-line bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="max-w-2xl text-sm text-fg">{h.statement}</p>
                      <EvidenceBadge status={h.status} />
                    </div>
                    {view.experiments.filter((e) => e.hypothesisId === h.id).map((e) => (
                      <div key={e.id} className="mt-3 rounded-md border border-line bg-bg px-3 py-2 text-[13px]">
                        <p className="font-medium text-fg-muted">Experiment: {e.title} <span className="font-normal text-fg-subtle">· {EVIDENCE_STATUS_META[e.status].label}</span></p>
                        <p className="mt-1 text-fg-subtle">{e.design}</p>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="q-tasks">
            <SectionTitle id="q-tasks" count={tasks.length}>Related tasks</SectionTitle>
            {tasks.length === 0 ? (
              <EmptyState icon={ListTodo} title="No tasks defined yet">Tasks are created by maintainers once a question is scoped. Suggest one through the contact page.</EmptyState>
            ) : (
              <ul className="space-y-3">{tasks.map((t) => <TaskRow key={t.id} task={t} />)}</ul>
            )}
          </section>

          <section aria-labelledby="q-evidence">
            <SectionTitle id="q-evidence" count={contributions.length}>Submitted evidence</SectionTitle>
            {contributions.length === 0 ? (
              <p className="text-sm text-fg-subtle">No evidence submitted for this question yet.</p>
            ) : (
              <ul className="space-y-3">{contributions.map((c) => <ContributionItem key={c.id} c={c} />)}</ul>
            )}
          </section>

          <section aria-labelledby="q-sources">
            <SectionTitle id="q-sources">Sources</SectionTitle>
            <SourceList sources={sources} />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Panel className="p-4">
            <Eyebrow className="text-fg-subtle">Parent problem</Eyebrow>
            <Link href={`/problems/${problem.slug}`} className="mt-2 block text-sm font-medium text-fg hover:text-accent">{problem.title}</Link>
            <p className="mt-1 text-xs text-fg-subtle">{categoryLabel(problem.category)}</p>
          </Panel>
          <Panel className="p-4">
            <Eyebrow className="text-fg-subtle">Current status</Eyebrow>
            <div className="mt-2"><EvidenceBadge status={q.status} /></div>
            <p className="mt-2 text-[13px] text-fg-muted">{EVIDENCE_STATUS_META[q.status].description}</p>
          </Panel>
          {q.skills.length > 0 && (
            <Panel className="p-4">
              <Eyebrow className="text-fg-subtle">Required skills</Eyebrow>
              <div className="mt-2.5 flex flex-wrap gap-1.5">{q.skills.map((s) => <SkillTag key={s}>{s}</SkillTag>)}</div>
            </Panel>
          )}
          {siblings.length > 0 && (
            <Panel className="p-4">
              <Eyebrow className="text-fg-subtle">Other questions</Eyebrow>
              <ul className="mt-2 space-y-2">
                {siblings.map((s) => (
                  <li key={s.id}><Link href={`/questions/${s.id}`} className="flex gap-2 text-[13px] leading-snug text-fg-muted hover:text-fg"><HelpCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />{s.question}</Link></li>
                ))}
              </ul>
            </Panel>
          )}
          <Button variant="secondary" className="w-full" onClick={() => setProposing((p) => !p)} aria-expanded={proposing}>
            <Plus className="size-4" aria-hidden /> Propose a related question
          </Button>
          {proposing && <Panel className="p-4"><ProposeQuestionForm problemId={problem.id} onDone={() => setProposing(false)} /></Panel>}
        </aside>
      </div>
    </Container>
  );
}
