"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { contributionInputSchema, fieldErrors } from "@/lib/domain/schemas";
import { CONTRIBUTION_KINDS, type ContributionKind } from "@/lib/domain/types";
import { useStore } from "@/components/providers/store-provider";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function ContributionForm({ taskId }: { taskId: string }) {
  const { dispatch } = useStore();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [kind, setKind] = useState<ContributionKind>("documentation");
  const [links, setLinks] = useState<string[]>([""]);
  const [negativeResult, setNegative] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contributionInputSchema.safeParse({ taskId, title, summary, kind, links: links.map((l) => l.trim()).filter(Boolean), negativeResult });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const res = await dispatch({ type: "submitContribution", payload: parsed.data });
    setBusy(false);
    if (!res.ok && res.fieldErrors) setErrors(res.fieldErrors);
  };

  const linkError = Object.entries(errors).find(([k]) => k.startsWith("links"))?.[1];

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="cf-title" label="Title" required error={errors.title}>
        <Input id="cf-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} aria-describedby="cf-title-error" />
      </Field>
      <Field id="cf-kind" label="Type of contribution" required>
        <Select id="cf-kind" value={kind} onChange={(e) => setKind(e.target.value as ContributionKind)}>
          {CONTRIBUTION_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </Select>
      </Field>
      <Field id="cf-summary" label="Summary" required error={errors.summary} hint="What did you do, what did you find, and how does it meet each acceptance criterion? Plain text only." count={{ value: summary.length, max: 2000 }}>
        <Textarea id="cf-summary" rows={6} value={summary} onChange={(e) => setSummary(e.target.value)} aria-invalid={!!errors.summary} aria-describedby="cf-summary-hint cf-summary-error" />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">Links to your work</legend>
        <p className="text-xs text-fg-subtle">Repository, document, dataset or notebook. Use http(s) links.</p>
        {links.map((l, i) => (
          <div key={i} className="flex gap-2">
            <label htmlFor={`cf-link-${i}`} className="sr-only">Link {i + 1}</label>
            <Input id={`cf-link-${i}`} type="url" inputMode="url" placeholder="https://" value={l} onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? e.target.value : x)))} />
            {links.length > 1 && (
              <Button variant="ghost" size="md" aria-label={`Remove link ${i + 1}`} onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))}><X className="size-4" aria-hidden /></Button>
            )}
          </div>
        ))}
        {links.length < 5 && (
          <Button variant="ghost" size="sm" onClick={() => setLinks((ls) => [...ls, ""])}><Plus className="size-3.5" aria-hidden /> Add link</Button>
        )}
        {linkError && <p className="text-xs text-rose-300" role="alert">{linkError}</p>}
      </fieldset>
      <label className="flex items-start gap-3 rounded-md border border-line bg-bg p-3 text-sm">
        <input type="checkbox" checked={negativeResult} onChange={(e) => setNegative(e.target.checked)} className="mt-0.5 size-4 accent-[#3cc8f5]" />
        <span>
          <span className="font-medium text-fg">This reports a negative or inconclusive result</span>
          <span className="block text-xs text-fg-subtle">Unsuccessful experiments are valuable. They are reviewed and documented the same way.</span>
        </span>
      </label>
      <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</Button>
    </form>
  );
}
