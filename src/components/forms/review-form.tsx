"use client";

import { useState } from "react";
import { reviewInputSchema, fieldErrors } from "@/lib/domain/schemas";
import { useStore } from "@/components/providers/store-provider";
import { Field, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Decision = "accept" | "request_changes" | "reject";

export function ReviewForm({ contributionId, criteria }: { contributionId: string; criteria: string[] }) {
  const { dispatch } = useStore();
  const [met, setMet] = useState<string[]>([]);
  const [decision, setDecision] = useState<Decision>("request_changes");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const allMet = criteria.every((c) => met.includes(c));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === "accept" && !allMet) {
      return setErrors({ criteriaMet: "To accept, confirm that every acceptance criterion is met. Otherwise request changes." });
    }
    const parsed = reviewInputSchema.safeParse({ contributionId, decision, comment, criteriaMet: met });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const res = await dispatch({ type: "reviewContribution", payload: parsed.data });
    setBusy(false);
    if (!res.ok && res.fieldErrors) setErrors(res.fieldErrors);
  };

  const options: Array<[Decision, string]> = [["accept", "Accept deliverable"], ["request_changes", "Request changes"], ["reject", "Do not accept"]];

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-lg border border-line bg-bg p-4">
      <fieldset>
        <legend className="text-sm font-medium text-fg">Acceptance criteria</legend>
        <p className="mb-2 text-xs text-fg-subtle">Check each criterion the deliverable meets.</p>
        <ul className="space-y-1.5">
          {criteria.map((c, i) => (
            <li key={c}>
              <label className="flex items-start gap-2.5 text-sm text-fg-muted">
                <input id={`rv-${contributionId}-${i}`} type="checkbox" className="mt-0.5 size-4 accent-[#3cc8f5]" checked={met.includes(c)} onChange={() => setMet((m) => (m.includes(c) ? m.filter((x) => x !== c) : [...m, c]))} />
                {c}
              </label>
            </li>
          ))}
        </ul>
        {errors.criteriaMet && <p className="mt-2 text-xs text-rose-300" role="alert">{errors.criteriaMet}</p>}
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Decision</legend>
        <div className="flex flex-wrap gap-2">
          {options.map(([v, l]) => (
            <label key={v} className={cn("cursor-pointer rounded-md border px-3 py-1.5 text-[13px]", decision === v ? "border-accent/50 bg-accent-soft text-accent" : "border-line-strong text-fg-muted hover:text-fg")}>
              <input type="radio" name={`decision-${contributionId}`} value={v} checked={decision === v} onChange={() => setDecision(v)} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <Field id={`rv-comment-${contributionId}`} label="Comment for the contributor" required error={errors.comment}>
        <Textarea id={`rv-comment-${contributionId}`} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} aria-invalid={!!errors.comment} />
      </Field>
      <p className="text-xs text-fg-subtle">Accepting a deliverable completes the task. It does not validate the related research question or solution.</p>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Submit review"}</Button>
    </form>
  );
}
