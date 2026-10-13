import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Code2,
  FlaskConical,
  LineChart,
  Microscope,
  PenLine,
  Palette,
  Search,
  Split,
  Users,
  ShieldCheck,
} from "lucide-react";
import { appCatalog } from "@/lib/data/catalog";
import { problemStats } from "@/lib/domain/discover";
import { EVIDENCE_STATUS_META } from "@/lib/domain/labels";
import { EVIDENCE_STATUSES, type Skill } from "@/lib/domain/types";
import { ProblemCard } from "@/components/problems/problem-card";
import { HeroGraph, type HeroItem } from "@/components/landing/hero-graph";
import { MiniGraph } from "@/components/landing/mini-graph";
import { LinkButton } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/misc";
import { DemoBadge, EvidenceBadge } from "@/components/ui/badge";
import { NODE_COLOR, NODE_DESCRIPTION } from "@/components/graph/node-style";
import { NODE_TYPES } from "@/lib/graph/build";

const HERO: Array<[string, string]> = [
  ["p-water", "Clean water"],
  ["p-storage", "Energy storage"],
  ["p-food", "Food security"],
  ["p-heat", "Climate resilience"],
  ["p-edtech", "Accessible education"],
];

function heroItems(): HeroItem[] {
  const c = appCatalog;
  const ids = new Set(HERO.map(([id]) => id));
  return HERO.map(([id, short]) => {
    const p = c.problems.find((x) => x.id === id)!;
    return {
      id,
      slug: p.slug,
      short,
      title: p.title,
      status: p.status,
      openTasks: c.tasks.filter((t) => t.problemId === id && t.status === "open").length,
      questions: c.questions.filter((q) => q.problemId === id).map((q) => ({ id: q.id, question: q.question })),
      solution: c.solutions.find((s) => s.problemId === id)?.title,
      related: [...p.relatedProblemIds.filter((r) => ids.has(r)), ...(id === "p-storage" ? ["p-water"] : []), ...(id === "p-edtech" ? ["p-food"] : [])],
    };
  });
}

const STEPS = [
  { n: "01", icon: Search, title: "Discover a problem", body: "Browse structured problems with explicit definitions, current evidence, known limitations and the criteria that would count as progress." },
  { n: "02", icon: Split, title: "Break it into research questions", body: "Each problem is decomposed into focused questions, hypotheses and experiments that a person or small team can actually tackle." },
  { n: "03", icon: Users, title: "Contribute your skills", body: "Claim a task that matches what you know: code, analysis, writing, design, fieldwork or review. Each task states its deliverable and acceptance criteria." },
  { n: "04", icon: ShieldCheck, title: "Validate and document progress", body: "Independent reviewers check work against published criteria. Results, including negative ones, are documented so nobody repeats them blindly." },
];

const MODES: Array<{ icon: typeof Code2; title: string; body: string; skills: Skill[] }> = [
  { icon: Code2, title: "Coding", body: "Build analysis tools, data converters, harnesses and calculators.", skills: ["Python", "TypeScript"] },
  { icon: BookOpenText, title: "Research", body: "Read primary sources and write structured reviews with traceable citations.", skills: ["Literature review", "Policy analysis"] },
  { icon: PenLine, title: "Writing", body: "Turn protocols and findings into documentation others can follow.", skills: ["Technical writing", "Translation"] },
  { icon: LineChart, title: "Data analysis", body: "Clean datasets, quantify uncertainty and test hypotheses.", skills: ["Data analysis", "Statistics", "GIS"] },
  { icon: Palette, title: "Design", body: "Design instructions, interfaces and studies that real people can use.", skills: ["Interface design", "UX research", "Accessibility testing"] },
  { icon: Microscope, title: "Experimentation", body: "Build prototypes and run bench or field tests with published methods.", skills: ["Laboratory methods", "Embedded systems", "Field research"] },
];

export default function HomePage() {
  const c = appCatalog;
  const preview = ["p-water", "p-science", "p-heat", "p-edtech"].map((id) => c.problems.find((p) => p.id === id)!);
  const openTasks = c.tasks.filter((t) => t.status === "open");
  const introOpen = openTasks.filter((t) => t.difficulty === "introductory").length;
  const inconclusive = c.hypotheses.find((h) => h.status === "inconclusive");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" aria-hidden />
        <Container className="relative grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="fade-up">
            <Eyebrow>Open problem-to-solution platform</Eyebrow>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-[3.4rem]">
              Humanity&apos;s hardest problems need more minds working on them.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-fg-muted">
              Discover what remains unsolved. Break complex challenges into actionable questions. Collaborate with people around the world and turn shared knowledge into measurable progress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/problems" size="lg">
                Explore Open Problems <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
              <LinkButton href="#how-it-works" variant="secondary" size="lg">
                How It Works
              </LinkButton>
            </div>
            <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-fg-subtle">
              <span>Problem</span><span aria-hidden>→</span><span>Evidence</span><span aria-hidden>→</span><span>Questions</span><span aria-hidden>→</span><span>Tasks</span><span aria-hidden>→</span><span>Contributions</span><span aria-hidden>→</span><span>Validation</span><span aria-hidden>→</span><span>Outcomes</span>
            </p>
          </div>
          <div className="fade-up [animation-delay:120ms]">
            <HeroGraph items={heroItems()} />
          </div>
        </Container>
      </section>

      {/* Live problem exploration preview */}
      <section aria-labelledby="preview-title" className="py-20">
        <Container>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>Explore</Eyebrow>
              <h2 id="preview-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Open problems, structured for action</h2>
              <p className="mt-2 max-w-2xl text-fg-muted">Every problem shows where the evidence stands, what is still unknown, and which tasks are open right now.</p>
            </div>
            <div className="flex items-center gap-3">
              <DemoBadge />
              <span className="text-xs text-fg-subtle">Illustrative demonstration data</span>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {preview.map((p) => (
              <ProblemCard key={p.id} problem={p} stats={problemStats(c, p)} />
            ))}
          </div>
          <div className="mt-6">
            <Link href="/problems" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
              View all {c.problems.length} problems <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-title" className="border-y border-line bg-surface/40 py-20">
        <Container>
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-title" className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">A structured path from an open problem to documented progress</h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.n} className="relative bg-bg p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-fg-subtle">{s.n}</span>
                  <s.icon className="size-5 text-accent" aria-hidden />
                </div>
                <h3 className="mt-8 text-[15px] font-semibold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
                {i < STEPS.length - 1 && (
                  <span className="absolute right-0 top-1/2 hidden h-px w-3 translate-x-1/2 bg-accent/60 lg:block" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Problem graph explainer */}
      <section aria-labelledby="graph-title" className="py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
            <div>
              <Eyebrow>The problem graph</Eyebrow>
              <h2 id="graph-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Knowledge that stays connected</h2>
              <p className="mt-3 text-fg-muted">
                Every record on UNsolved is a node with explicit relationships. You can trace any contribution back to the question it answers and the problem it serves, and see where problems share causes or questions.
              </p>
              <ul className="mt-6 space-y-3">
                {NODE_TYPES.map((t) => (
                  <li key={t.id} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: NODE_COLOR[t.id] }} aria-hidden />
                    <p className="text-sm leading-relaxed">
                      <span className="font-medium text-fg">{t.label}.</span> <span className="text-fg-muted">{NODE_DESCRIPTION[t.id]}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <LinkButton href="/graph" variant="secondary" className="mt-6">
                Open the full graph <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
            </div>
            <MiniGraph />
          </div>
        </Container>
      </section>

      {/* Open collaboration */}
      <section aria-labelledby="collab-title" className="border-y border-line bg-surface/40 py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <Eyebrow>Open collaboration</Eyebrow>
              <h2 id="collab-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">You don&apos;t need to be an expert to be useful</h2>
              <p className="mt-3 text-fg-muted">
                Progress on hard problems is mostly careful, well-scoped work: a literature summary, a test protocol, a data converter, a keyboard walkthrough. Tasks state their difficulty and exactly what a good deliverable looks like.
              </p>
              <p className="mt-6 text-sm text-fg-muted">
                <span className="text-2xl font-semibold tabular-nums text-fg">{introOpen}</span> introductory tasks are open in the demo dataset.
              </p>
              <LinkButton href="/contribute?difficulty=introductory" className="mt-4">
                Find a first task <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {MODES.map((m) => {
                const n = openTasks.filter((t) => t.skills.some((s) => m.skills.includes(s))).length;
                return (
                  <li key={m.title} className="flex flex-col bg-bg p-5">
                    <m.icon className="size-5 text-fg-muted" aria-hidden />
                    <h3 className="mt-4 text-[15px] font-semibold">{m.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted">{m.body}</p>
                    <Link href={`/contribute?skills=${encodeURIComponent(m.skills.join(","))}`} className="mt-4 inline-flex items-center gap-1 text-[13px] text-accent hover:underline">
                      {n} open {n === 1 ? "task" : "tasks"} <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </Container>
      </section>

      {/* Evidence and transparency */}
      <section aria-labelledby="evidence-title" className="py-20">
        <Container>
          <Eyebrow>Evidence and transparency</Eyebrow>
          <h2 id="evidence-title" className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">Claims carry their status. Nothing is “solved” by assertion.</h2>
          <p className="mt-3 max-w-2xl text-fg-muted">
            Problems, questions, hypotheses and solutions each show an explicit evidence status. Completing a task is not the same as validating a claim — validation requires evidence that meets published criteria and independent review.
          </p>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVIDENCE_STATUSES.map((s, i) => (
              <li key={s} className="rounded-lg border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <EvidenceBadge status={s} />
                  <span className="font-mono text-xs text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{EVIDENCE_STATUS_META[s].description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center">
            <FlaskConical className="size-5 shrink-0 text-amber-300" aria-hidden />
            <p className="flex-1 text-sm leading-relaxed text-fg-muted">
              <span className="font-medium text-fg">Negative results count.</span> An experiment that fails to support its hypothesis still tells the next person what not to repeat. Contributors can flag a submission as a negative result, and it is reviewed and documented like any other.
              {inconclusive && (
                <>
                  {" "}
                  <Link href={`/questions/${inconclusive.questionId}#hypotheses`} className="text-accent hover:underline">
                    See an inconclusive hypothesis
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section aria-labelledby="cta-title" className="border-t border-line">
        <Container className="py-24 text-center">
          <h2 id="cta-title" className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            The next breakthrough could start with your contribution.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-fg-muted">Find a problem worth solving. Discover where you can help. Build something that matters.</p>
          <LinkButton href="/problems" size="lg" className="mt-8">
            Explore Problems <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
        </Container>
      </section>
    </>
  );
}
