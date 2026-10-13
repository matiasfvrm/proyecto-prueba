"use client";

import { useState } from "react";
import Link from "next/link";
import { questionProposalSchema, fieldErrors } from "@/lib/domain/schemas";
import { useStore } from "@/components/providers/store-provider";
import { Field, Textarea, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function ProposeQuestionForm({ problemId, onDone }: { problemId: string; onDone?: () => void }) {
  const { view, dispatch } = useStore();
  const [question, setQuestion] = useState("");
  const [rationale, setRationale] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!view.currentUser)
    return (
      <p className="text-sm text-fg-muted">
        <Link href="/signin" className="text-accent hover:underline">Sign in</Link> to propose a research question.
      </p>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = questionProposalSchema.safeParse({ problemId, question, rationale });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const res = await dispatch({ type: "proposeQuestion", payload: parsed.data });
    setBusy(false);
    if (res.ok) {
      setQuestion("");
      setRationale("");
      onDone?.();
    } else if (res.fieldErrors) setErrors(res.fieldErrors);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="pq-question" label="Research question" required error={errors.question} hint="A focused, answerable question ending with “?”." count={{ value: question.length, max: 240 }}>
        <Input id="pq-question" value={question} onChange={(e) => setQuestion(e.target.value)} aria-invalid={!!errors.question} aria-describedby="pq-question-hint pq-question-error" />
      </Field>
      <Field id="pq-rationale" label="Why it matters" required error={errors.rationale} hint="How would answering it move the problem forward? Cite sources where you can." count={{ value: rationale.length, max: 1500 }}>
        <Textarea id="pq-rationale" value={rationale} onChange={(e) => setRationale(e.target.value)} aria-invalid={!!errors.rationale} aria-describedby="pq-rationale-hint pq-rationale-error" />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</Button>
        <p className="text-xs text-fg-subtle">Proposals appear publicly only after a moderator accepts them.</p>
      </div>
    </form>
  );
}
