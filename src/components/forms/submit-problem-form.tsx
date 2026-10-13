"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Copy, Plus, Sparkles, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import { Panel, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { fieldErrors, problemSubmissionSchema } from "@/lib/domain/schemas";
import { CATEGORIES, type CategoryId } from "@/lib/domain/types";
import { findSimilar } from "@/lib/domain/similarity";
import type { ProposalReview } from "@/lib/ai/types";

function ListInput({ id, label, hint, values, onChange, placeholder, max, error, type = "text" }: {
  id: string; label: string; hint: string; values: string[]; onChange: (v: string[]) => void; placeholder: string; max: number; error?: string; type?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label} <span className="text-fg-subtle" aria-hidden>*</span></legend>
      <p className="text-xs text-fg-subtle">{hint}</p>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <label htmlFor={`${id}-${i}`} className="sr-only">{label} {i + 1}</label>
          <Input id={`${id}-${i}`} type={type} value={v} placeholder={placeholder} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} />
          {values.length > 1 && (
            <Button variant="ghost" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))}><X className="size-4" aria-hidden /></Button>
          )}
        </div>
      ))}
      {values.length < max && <Button variant="ghost" size="sm" onClick={() => onChange([...values, ""])}><Plus className="size-3.5" aria-hidden /> Add another</Button>}
      {error && <p className="text-xs text-rose-300" role="alert">{error}</p>}
    </fieldset>
  );
}

const FIELD_LABEL: Record<string, string> = {
  title: "Title", description: "Description", whyItMatters: "Why it matters", evidence: "Available evidence",
  existingApproaches: "Existing approaches", limitations: "Known limitations", sources: "Sources", researchQuestions: "Research questions",
};

export function SubmitProblemForm({ assistantMode }: { assistantMode: "ai" | "rules" }) {
  const { view, dispatch, hydrated } = useStore();
  const [f, setF] = useState({ title: "", description: "", whyItMatters: "", category: "" as CategoryId | "", evidence: "", existingApproaches: "", limitations: "" });
  const [sources, setSources] = useState<string[]>([""]);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [review, setReview] = useState<ProposalReview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string>();

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const similar = useMemo(
    () => (f.title.length + f.description.length > 25 ? findSimilar({ title: f.title, description: f.description }, view.problems) : []),
    [f.title, f.description, view.problems],
  );

  if (hydrated && !view.currentUser)
    return (
      <EmptyState icon={ClipboardCheck} title="Sign in to submit a problem" className="mt-8" action={<LinkButton href="/signin?next=/submit">Sign in</LinkButton>}>
        Submissions are attributed to a profile so moderators can follow up.
      </EmptyState>
    );

  if (doneId)
    return (
      <Panel className="mt-8 p-8 text-center">
        <CheckCircle2 className="mx-auto size-8 text-emerald-400" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold">Submitted for review</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">Your proposal is in the moderation queue with status <strong className="text-fg">Pending review</strong>. It will not appear in Discover, and nothing in it is treated as established, until a moderator accepts it.</p>
        <div className="mt-6 flex justify-center gap-2">
          <LinkButton href="/dashboard" variant="secondary">Go to dashboard</LinkButton>
          <LinkButton href="/review" variant="ghost">View review queue</LinkButton>
        </div>
      </Panel>
    );

  const payload = () => ({
    ...f,
    sources: sources.map((s) => s.trim()).filter(Boolean),
    researchQuestions: questions.map((s) => s.trim()).filter(Boolean),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = problemSubmissionSchema.safeParse(payload());
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      const first = Object.keys(errs)[0]?.split(".")[0];
      document.getElementById(first === "sources" ? "src-0" : first === "researchQuestions" ? "rq-0" : `sp-${first}`)?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    const res = await dispatch({ type: "submitProblem", payload: parsed.data });
    setBusy(false);
    if (res.ok) setDoneId(res.createdId ?? "ok");
    else if (res.fieldErrors) setErrors(res.fieldErrors);
  };

  const runAssistant = async () => {
    setReviewing(true);
    setReviewError(undefined);
    try {
      const { category: _c, ...rest } = payload();
      void _c;
      const res = await fetch("/api/assist/proposal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(rest) });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? "Request failed");
      setReview(body.review);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Could not check the draft.");
    } finally {
      setReviewing(false);
    }
  };

  const err = (k: string) => errors[k] ?? Object.entries(errors).find(([key]) => key.startsWith(`${k}.`))?.[1];

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
      <form onSubmit={submit} noValidate className="space-y-6" aria-describedby="submit-note">
        <Field id="sp-title" label="Problem title" required error={err("title")} count={{ value: f.title.length, max: 120 }} hint="A clear statement of the problem, not a solution.">
          <Input id="sp-title" value={f.title} onChange={set("title")} aria-invalid={!!err("title")} />
        </Field>
        <Field id="sp-category" label="Category" required error={err("category") && "Choose a category."}>
          <Select id="sp-category" value={f.category} onChange={set("category")} aria-invalid={!!err("category")}>
            <option value="">Select a category…</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </Field>
        <Field id="sp-description" label="Description" required error={err("description")} count={{ value: f.description.length, max: 3000 }} hint="Who is affected, where, and what exactly remains unsolved. How would progress be measured?">
          <Textarea id="sp-description" rows={6} value={f.description} onChange={set("description")} aria-invalid={!!err("description")} />
        </Field>
        <Field id="sp-whyItMatters" label="Why it matters" required error={err("whyItMatters")} count={{ value: f.whyItMatters.length, max: 1500 }}>
          <Textarea id="sp-whyItMatters" rows={3} value={f.whyItMatters} onChange={set("whyItMatters")} aria-invalid={!!err("whyItMatters")} />
        </Field>
        <Field id="sp-evidence" label="Available evidence" required error={err("evidence")} count={{ value: f.evidence.length, max: 3000 }} hint="What is already known? Reference your sources below. Mark anything uncertain as such.">
          <Textarea id="sp-evidence" rows={4} value={f.evidence} onChange={set("evidence")} aria-invalid={!!err("evidence")} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="sp-existingApproaches" label="Existing approaches" error={err("existingApproaches")}>
            <Textarea id="sp-existingApproaches" rows={4} value={f.existingApproaches} onChange={set("existingApproaches")} />
          </Field>
          <Field id="sp-limitations" label="Known limitations" error={err("limitations")} hint="One per line.">
            <Textarea id="sp-limitations" rows={4} value={f.limitations} onChange={set("limitations")} aria-describedby="sp-limitations-hint" />
          </Field>
        </div>
        <ListInput id="src" type="url" label="Relevant sources" hint="Links to papers, reports, datasets or official pages (http/https)." values={sources} onChange={setSources} placeholder="https://" max={10} error={err("sources")} />
        <ListInput id="rq" label="Potential research questions" hint="Focused questions that would move the problem forward." values={questions} onChange={setQuestions} placeholder="How might…?" max={8} error={err("researchQuestions")} />
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</Button>
          <p id="submit-note" className="text-xs text-fg-subtle">Submissions enter a moderation queue. They are never published as established facts automatically.</p>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Submission checks">
        <Panel className="p-4" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-medium"><Copy className="size-4 text-fg-subtle" aria-hidden /> Possible duplicates</p>
          {similar.length === 0 ? (
            <p className="mt-2 text-[13px] text-fg-subtle">Start typing a title and description. Similar existing problems will appear here.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {similar.map((s) => (
                <li key={s.id} className="text-[13px]">
                  <Link href={`/problems/${view.problems.find((p) => p.id === s.id)?.slug}`} className="font-medium text-fg hover:text-accent" target="_blank">{s.title}</Link>
                  <p className="text-xs text-fg-subtle">{Math.round(s.score * 100)}% term overlap · shared: {s.sharedTerms.join(", ")}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-line pt-2 text-[11px] text-fg-subtle">Keyword similarity, computed in your browser. Not AI.</p>
        </Panel>
        <Panel className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-accent" aria-hidden /> Check my draft</p>
            <Badge tone={assistantMode === "ai" ? "accent" : "muted"}>{assistantMode === "ai" ? "AI-assisted" : "Rule-based"}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-fg-muted">
            {assistantMode === "ai"
              ? "Sends the draft text (not your profile) to the configured AI provider to find missing information."
              : "Runs a checklist for missing information. No AI provider is configured on this instance."}
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={runAssistant} disabled={reviewing}>{reviewing ? "Checking…" : "Check for gaps"}</Button>
          {reviewError && <p className="mt-2 text-xs text-rose-300" role="alert">{reviewError}</p>}
          {review && (
            <div className="mt-4 space-y-3 border-t border-line pt-3" aria-live="polite">
              {review.generatedBy === "ai" && (
                <p className="rounded border border-accent/20 bg-accent-soft px-2 py-1.5 text-[11.5px] text-accent">AI-generated suggestions — unverified. Use your judgment.</p>
              )}
              <p className="text-[13px] text-fg-muted">{review.summary}</p>
              {review.gaps.length > 0 && (
                <ul className="space-y-2">
                  {review.gaps.map((g, i) => (
                    <li key={i} className="flex gap-2 text-[13px]">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-300/80" aria-hidden />
                      <span><span className="font-medium text-fg">{FIELD_LABEL[g.field] ?? g.field}:</span> <span className="text-fg-muted">{g.issue}</span></span>
                    </li>
                  ))}
                </ul>
              )}
              {review.questionSuggestions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-fg-subtle">Suggested questions</p>
                  <ul className="mt-1 space-y-1">
                    {review.questionSuggestions.map((q) => (
                      <li key={q} className="flex items-start justify-between gap-2 text-[13px] text-fg-muted">
                        {q}
                        <Button variant="ghost" size="sm" className="h-6 shrink-0 px-1.5" aria-label={`Add question: ${q}`} onClick={() => setQuestions((qs) => [...qs.filter(Boolean), q].slice(0, 8))}><Plus className="size-3.5" aria-hidden /></Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Panel>
      </aside>
    </div>
  );
}
